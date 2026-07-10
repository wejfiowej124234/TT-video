//! 中间件：幂等、traceId、RequestBodyLimit、Timeout、CORS、鉴权占位、安全头、指标（48 §4.2；50-O-B4 拆为 mod + timeout_cors + **auth_pause_metrics/** + **rate_limit** + **trace**）

#![allow(dead_code, unused_imports)]

mod auth_pause_metrics;
mod onboarding_quote_rate_limit;
mod onboarding_write_rate_limit;
mod rate_limit;
mod timeout_cors;
mod trace;

pub use auth_pause_metrics::{
    auth_placeholder_layer, authority_source_layer, internal_api_secret_gate_layer,
    metrics_request_count_layer, pause_gate_layer, request_total, security_headers_layer,
};
pub use rate_limit::{
    critical_write_rate_limit_layer, meta_rate_limits_snapshot, rate_limit_layer,
};
pub use onboarding_quote_rate_limit::onboarding_quote_rate_limit_response_if_exceeded;
#[allow(unused_imports)] // `routes/onboarding` 并入 `api_router` 前保留
pub use onboarding_write_rate_limit::onboarding_user_write_rate_limit_response_if_exceeded;
#[cfg(test)]
pub use rate_limit::{format_guide_upload_meta_top_keys_contract_761, GUIDE_UPLOAD_META_TOP_KEYS};
pub use timeout_cors::build_cors;
pub use trace::{message_id_layer, request_id_layer};

use axum::{
    body::Body,
    http::{header::HeaderName, header::HeaderValue, Method, Request, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use bytes::Bytes;
use http_body_util::BodyExt;
use serde_json::json;
use std::collections::HashMap;
use std::env;
use std::sync::{Arc, OnceLock};
use tokio::sync::RwLock;

use rate_limit::is_admin_critical_write_path;

/// 默认内存幂等缓存条数上限；生产可用环境变量覆盖，见 `idempotency_cache_max()`。
pub const IDEMPOTENCY_CACHE_MAX_DEFAULT: usize = 1000;

/// 进程内幂等内存缓存上限（`IDEMPOTENCY_CACHE_MAX`，1～1_000_000；非法或未设则用默认）。
pub fn idempotency_cache_max() -> usize {
    static MAX: OnceLock<usize> = OnceLock::new();
    *MAX.get_or_init(|| {
        env::var("IDEMPOTENCY_CACHE_MAX")
            .ok()
            .and_then(|s| s.parse().ok())
            .filter(|&n| n > 0 && n <= 1_000_000)
            .unwrap_or(IDEMPOTENCY_CACHE_MAX_DEFAULT)
    })
}
pub const REQUEST_TIMEOUT_SECS: u64 = 30;

/// Axum TimeoutLayer + GET /meta.defaults 同源；`REQUEST_TIMEOUT_SECS` env 覆盖（5..=600，默认 30）。
pub fn request_timeout_secs() -> u64 {
    static SECS: OnceLock<u64> = OnceLock::new();
    *SECS.get_or_init(|| {
        env::var("REQUEST_TIMEOUT_SECS")
            .ok()
            .and_then(|s| s.parse().ok())
            .filter(|&n| (5..=600).contains(&n))
            .unwrap_or(REQUEST_TIMEOUT_SECS)
    })
}
pub const REQUEST_BODY_LIMIT_BYTES: usize = 1024 * 1024;
pub const GUIDE_UPLOAD_RATE_LIMIT: usize = 10;
pub const GUIDE_UPLOAD_RATE_WINDOW_SECS: u64 = 60;
/** 社区视频 multipart 会话 / presign / complete 限流（与 `media_asset_sessions` 同源）。 */
pub const COMMUNITY_MEDIA_UPLOAD_RATE_LIMIT: usize = 60;
pub const COMMUNITY_MEDIA_UPLOAD_RATE_WINDOW_SECS: u64 = 60;

#[derive(Default)]
pub struct IdempotencyCache {
    store: HashMap<String, (axum::http::StatusCode, Vec<u8>)>,
}

impl IdempotencyCache {
    pub fn get(&self, k: &str) -> Option<(axum::http::StatusCode, Vec<u8>)> {
        self.store.get(k).cloned()
    }
    pub fn insert(&mut self, k: String, v: (axum::http::StatusCode, Vec<u8>)) {
        if self.store.len() >= idempotency_cache_max() {
            if let Some(first) = self.store.keys().next().cloned() {
                self.store.remove(&first);
            }
        }
        self.store.insert(k, v);
    }
}

/// 55-S8：幂等（01 §10 #14）；有 pool 时读写 idempotency_keys 表，实现跨实例/重启幂等。
pub async fn idempotency_key_layer(
    cache: Arc<RwLock<IdempotencyCache>>,
    pool: Option<sqlx::PgPool>,
    req: Request<Body>,
    next: axum::middleware::Next,
) -> Response {
    let key = req
        .headers()
        .get("Idempotency-Key")
        .or_else(|| req.headers().get("X-Idempotency-Key"))
        .and_then(|v| v.to_str().ok())
        .map(String::from);
    let method = req.method().clone();
    let path = req.uri().path().to_string();
    let is_write = matches!(
        method,
        Method::POST | Method::PUT | Method::PATCH | Method::DELETE
    );

    let strict = env::var("STRICT_SSOT").as_deref() == Ok("1")
        || env::var("CHECK_SSOT").as_deref() == Ok("1");
    let require_idem = strict || env::var("REQUIRE_IDEMPOTENCY_KEY").as_deref() == Ok("1");
    let admin_critical_write = is_admin_critical_write_path(&method, &path);
    let require_idem_for_request = require_idem || admin_critical_write;
    if is_write && require_idem_for_request && key.is_none() {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "missing_idempotency_key",
                "error": "missing_idempotency_key",
                "message": "missing_idempotency_key",
                "required_header": "Idempotency-Key",
                "also_accepted": "X-Idempotency-Key",
                "rule": "写请求必须提供幂等键；Admin 高危写接口为强制项。否则网络重试/并发会造成重复入队/重复链上尝试，产生资损风险",
            })),
        )
            .into_response();
    }

    if is_write {
        if let Some(ref k) = key {
            let cache_key = format!("{}:{}:{}", method, path, k);
            // 1) 内存命中
            {
                let guard = cache.read().await;
                if let Some((status, body)) = guard.get(&cache_key) {
                    let req_id = req
                        .headers()
                        .get("x-request-id")
                        .and_then(|v| v.to_str().ok())
                        .map(String::from)
                        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
                    let mut res = (status, Body::from(Bytes::from(body.clone()))).into_response();
                    if let (Ok(n1), Ok(v1)) = (
                        HeaderName::try_from("x-request-id"),
                        HeaderValue::try_from(req_id.as_str()),
                    ) {
                        res.headers_mut().insert(n1, v1);
                    }
                    if let (Ok(n2), Ok(v2)) = (
                        HeaderName::try_from("X-Idempotency-Key"),
                        HeaderValue::try_from(k.as_str()),
                    ) {
                        res.headers_mut().insert(n2, v2);
                    }
                    return res;
                }
            }
            // 2) 55-S8：DB 命中（跨实例/重启）
            if let Some(ref p) = pool {
                let key_hash = crate::db::key_hash(method.as_str(), &path, k);
                match crate::db::get_cached_response(p, &key_hash).await {
                    Ok(Some((status, body))) => {
                        let req_id = req
                            .headers()
                            .get("x-request-id")
                            .and_then(|v| v.to_str().ok())
                            .map(String::from)
                            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
                        let mut res = (status, Body::from(Bytes::from(body))).into_response();
                        if let (Ok(n1), Ok(v1)) = (
                            HeaderName::try_from("x-request-id"),
                            HeaderValue::try_from(req_id.as_str()),
                        ) {
                            res.headers_mut().insert(n1, v1);
                        }
                        if let (Ok(n2), Ok(v2)) = (
                            HeaderName::try_from("X-Idempotency-Key"),
                            HeaderValue::try_from(k.as_str()),
                        ) {
                            res.headers_mut().insert(n2, v2);
                        }
                        return res;
                    }
                    Err(e) => {
                        eprintln!(
                            "[audit] idempotency_cache_db_read_failed key_hash_hex={} method={} path={} error={}",
                            hex::encode(key_hash),
                            method,
                            path,
                            e
                        );
                    }
                    Ok(None) => {}
                }
            }
        }
    }

    let res = next.run(req).await;

    if is_write {
        if let Some(ref k) = key {
            let cache_key = format!("{}:{}:{}", method, path, k);
            let (parts, body) = res.into_parts();
            match BodyExt::collect(body).await {
                Ok(collected) => {
                    let bytes = collected.to_bytes();
                    let status = parts.status;
                    let body_bytes = bytes.to_vec();
                    cache
                        .write()
                        .await
                        .insert(cache_key.clone(), (status, body_bytes.clone()));
                    // 55-S8：写回 DB
                    if let Some(ref p) = pool {
                        let key_hash = crate::db::key_hash(method.as_str(), &path, k);
                        if let Err(e) = crate::db::save_cached_response(
                            p,
                            &key_hash,
                            &cache_key,
                            status,
                            &body_bytes,
                        )
                        .await
                        {
                            eprintln!(
                                "[audit] idempotency_cache_db_write_failed key_hash_hex={} cache_key={} http_status={} error={}",
                                hex::encode(key_hash),
                                cache_key,
                                status.as_u16(),
                                e
                            );
                            return (
                                StatusCode::SERVICE_UNAVAILABLE,
                                Json(json!({
                                    "error": "idempotency_db_persist_failed",
                                    "message": "idempotency_db_persist_failed",
                                })),
                            )
                                .into_response();
                        }
                    }
                    let mut out = Response::from_parts(parts, Body::from(Bytes::from(body_bytes)));
                    if let (Ok(n), Ok(v)) = (
                        HeaderName::try_from("X-Idempotency-Key"),
                        HeaderValue::try_from(k.as_str()),
                    ) {
                        out.headers_mut().insert(n, v);
                    }
                    return out;
                }
                Err(_) => {
                    return Response::from_parts(parts, Body::empty());
                }
            }
        }
    } else if let Some(ref k) = key {
        let mut res = res;
        if let (Ok(n), Ok(v)) = (
            HeaderName::try_from("X-Idempotency-Key"),
            HeaderValue::try_from(k.as_str()),
        ) {
            res.headers_mut().insert(n, v);
        }
        return res;
    }

    res
}
