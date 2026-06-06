use axum::Router;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::sync::{Arc, OnceLock};
use tokio::sync::{Mutex as TokioMutex, RwLock};

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::routes::{auth, guides, me, orders};
use crate::state::test_support::api_meta_state;

static ORDERS_APP_STACK_DB_IT_LOCK: OnceLock<TokioMutex<()>> = OnceLock::new();

pub(super) fn orders_app_stack_it_lock() -> &'static TokioMutex<()> {
    ORDERS_APP_STACK_DB_IT_LOCK.get_or_init(|| TokioMutex::new(()))
}

pub(super) fn app_stack_router(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

pub(super) async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

pub(super) fn db_router(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    Router::new()
        .merge(auth::router())
        .merge(me::router())
        .merge(guides::router())
        .merge(orders::router())
        .with_state(api_meta_state(Some(chain_off)))
}

pub(super) async fn response_json(res: axum::response::Response) -> Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

pub(super) fn auth_bearer_value(token: impl AsRef<str>) -> axum::http::HeaderValue {
    format!("Bearer {}", token.as_ref())
        .parse()
        .expect("bearer header value")
}

/// Percent-encode a UTF-8 string for a single `application/x-www-form-urlencoded` query value.
pub(super) fn utf8_pct_encode_query_component(s: &str) -> String {
    let mut out = String::new();
    for b in s.as_bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(*b as char)
            }
            _ => out.push_str(&format!("%{:02X}", b)),
        }
    }
    out
}
