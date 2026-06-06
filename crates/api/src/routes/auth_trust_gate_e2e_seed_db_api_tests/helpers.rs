//! 共享路由夹具、环境恢复、`oneshot` 辅助与夹具常量（**`matrix_93_b_tg_*`** PG·IT）。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::sync::{Arc, OnceLock};
use tokio::sync::{Mutex as TokioMutex, RwLock};
use tower::ServiceExt;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;

static TRUST_GATE_SEED_IT_LOCK: OnceLock<TokioMutex<()>> = OnceLock::new();

pub(super) fn trust_gate_seed_it_lock() -> &'static TokioMutex<()> {
    TRUST_GATE_SEED_IT_LOCK.get_or_init(|| TokioMutex::new(()))
}

pub(super) struct RestoreEnvVar {
    key: &'static str,
    previous: Option<String>,
}

impl RestoreEnvVar {
    pub(super) fn unset(key: &'static str) -> Self {
        let previous = std::env::var(key).ok();
        std::env::remove_var(key);
        Self { key, previous }
    }

    pub(super) fn set(key: &'static str, value: &str) -> Self {
        let previous = std::env::var(key).ok();
        std::env::set_var(key, value);
        Self { key, previous }
    }
}

impl Drop for RestoreEnvVar {
    fn drop(&mut self) {
        match &self.previous {
            Some(v) => std::env::set_var(self.key, v),
            None => std::env::remove_var(self.key),
        }
    }
}

pub(super) fn router_chain_off_only() -> axum::Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, None)
}

pub(super) fn router_with_pg(pool: PgPool) -> axum::Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

pub(super) async fn response_json(res: axum::response::Response) -> Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| serde_json::json!({}))
}

pub(super) async fn login_bearer_token(app: axum::Router, email: &str, password: &str) -> String {
    let login = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "email": email, "password": password }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        login.status(),
        StatusCode::OK,
        "{:?}",
        response_json(login).await
    );
    let v = response_json(login).await;
    v.get("token")
        .and_then(|t| t.as_str())
        .expect("login token")
        .to_string()
}

/// 与 **`trust_gate_e2e_seed`** 内 **`orders.evidence_trust_order`** 常量同源。
pub(super) const EVIDENCE_TRUST_ORDER_ID: &str = "f0e0c201-0001-4001-8001-00000000000f";
/// **`o_evidence_rate`**：游客 **`tourist_clean`**，用于 **POST …/evidence** 成功路径（与 E2E **`trust-gate-dispute-evidence`** 同源订单）。
pub(super) const ORDER_EVIDENCE_RATE_ID: &str = "f0e0c201-0001-4001-8001-000000000012";
pub(super) const TG_CLEAN_EMAIL: &str = "tg_tourist_clean@trustgate-e2e.local";
pub(super) const TG_PASSWORD: &str = "Test123!";

pub(super) async fn seed_trust_gate_ok(app: &axum::Router) {
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/seed-trust-gate-e2e")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
}
