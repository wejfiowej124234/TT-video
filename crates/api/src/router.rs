//! Router 聚合：各 route 与 layer 顺序与 main 一致（48 §4.3、§11.6）

use axum::Router;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::timeout::TimeoutLayer;

use crate::middleware::{
    self, auth_placeholder_layer, authority_source_layer, build_cors,
    critical_write_rate_limit_layer, idempotency_key_layer, internal_api_secret_gate_layer,
    message_id_layer, metrics_request_count_layer, pause_gate_layer, rate_limit_layer,
    request_id_layer, security_headers_layer, IdempotencyCache,
};
use crate::state::ApiMetaState;

/// 构建完整 App Router：仅在此处做一次 .with_state(meta_state)，layer 顺序与 48 §4.3 一致。
/// 55-S8：db_pool 传入幂等层时读写 idempotency_keys 表，实现跨实例/重启幂等。
pub fn app(
    meta_state: ApiMetaState,
    idem_cache: Arc<RwLock<IdempotencyCache>>,
    db_pool: Option<sqlx::PgPool>,
) -> Router {
    let idem_cache_clone = Arc::clone(&idem_cache);
    let cors = build_cors();

    crate::routes::api_router()
        .with_state(meta_state)
        .layer(axum::middleware::from_fn(internal_api_secret_gate_layer))
        .layer(TimeoutLayer::new(Duration::from_secs(
            middleware::request_timeout_secs(),
        )))
        .layer(RequestBodyLimitLayer::new(
            middleware::REQUEST_BODY_LIMIT_BYTES,
        ))
        .layer(cors)
        .layer(axum::middleware::from_fn(authority_source_layer))
        .layer(axum::middleware::from_fn(pause_gate_layer))
        .layer(axum::middleware::from_fn(rate_limit_layer))
        .layer(axum::middleware::from_fn(critical_write_rate_limit_layer))
        .layer(axum::middleware::from_fn(request_id_layer))
        .layer(axum::middleware::from_fn(message_id_layer))
        .layer(axum::middleware::from_fn(move |req, next| {
            idempotency_key_layer(idem_cache_clone.clone(), db_pool.clone(), req, next)
        }))
        .layer(axum::middleware::from_fn(auth_placeholder_layer))
        .layer(axum::middleware::from_fn(security_headers_layer))
        .layer(axum::middleware::from_fn(metrics_request_count_layer))
}
