//! **F-032** · **`routes::trust_growth`** · **`Router::oneshot`** HTTP 契约（**非** **`trust_growth_autopilot`** 纯算法测）。
//!
//! **PG 子集**：未设置 **`DATABASE_URL`** 时 **`return`**（与 **`auth_register_login_logout_db_api_tests`** 同源 **`pool_or_skip`**）。

use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::json;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower::ServiceExt;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::routes::trust_growth;
use crate::state::test_support::api_meta_state;

async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

fn chain_off_without_pool() -> ChainOffState {
    ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    }
}

fn tg_router(chain_off: Option<ChainOffState>) -> axum::Router {
    trust_growth::router().with_state(api_meta_state(chain_off))
}

async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

#[tokio::test]
async fn post_trust_growth_ingest_chain_off_none_returns_503() {
    let app = tg_router(None);
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/trust-growth/ingest")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "event": "trust_growth_moment_view",
                        "payload": { "moment": "home_banner", "variant_id": "a" }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    let v = response_json(res).await;
    assert_eq!(v["error"], "chain_off_unavailable");
}

#[tokio::test]
async fn post_trust_growth_ingest_no_db_pool_returns_503() {
    let app = tg_router(Some(chain_off_without_pool()));
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/trust-growth/ingest")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "event": "trust_growth_moment_view",
                        "payload": { "moment": "home_banner", "variant_id": "a" }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    let v = response_json(res).await;
    assert_eq!(v["error"], "database_unavailable");
}

#[tokio::test]
async fn get_trust_growth_config_chain_off_none_returns_503() {
    let app = tg_router(None);
    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/trust-growth/config")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    let v = response_json(res).await;
    assert_eq!(v["error"], "chain_off_unavailable");
}

#[tokio::test]
async fn get_trust_growth_config_no_db_pool_returns_503() {
    let app = tg_router(Some(chain_off_without_pool()));
    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/trust-growth/config")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    let v = response_json(res).await;
    assert_eq!(v["error"], "database_unavailable");
}

#[tokio::test]
async fn post_trust_growth_ingest_missing_moment_returns_400_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: post_trust_growth_ingest_missing_moment_returns_400_pg (DATABASE_URL unset)"
        );
        return;
    };
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    let app = tg_router(Some(chain_off));
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/trust-growth/ingest")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "event": "trust_growth_moment_view",
                        "payload": { "variant_id": "only_variant" }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    let v = response_json(res).await;
    assert_eq!(v["error"], "missing_moment_or_variant_id");
}

#[tokio::test]
async fn post_trust_growth_ingest_unknown_event_returns_400_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: post_trust_growth_ingest_unknown_event_returns_400_pg (DATABASE_URL unset)"
        );
        return;
    };
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    let app = tg_router(Some(chain_off));
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/trust-growth/ingest")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "event": "not_a_trust_growth_event",
                        "payload": { "moment": "home_banner", "variant_id": "x" }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    let v = response_json(res).await;
    assert_eq!(v["error"], "unknown_event");
}
