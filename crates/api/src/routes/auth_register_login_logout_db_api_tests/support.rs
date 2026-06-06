use axum::Router;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::sync::{Arc, OnceLock};
use tokio::sync::{Mutex as TokioMutex, RwLock};

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::routes::{auth, me};
use crate::state::test_support::api_meta_state;

static AUTH_APP_STACK_DB_IT_LOCK: OnceLock<TokioMutex<()>> = OnceLock::new();

pub(crate) fn auth_app_stack_it_lock() -> &'static TokioMutex<()> {
    AUTH_APP_STACK_DB_IT_LOCK.get_or_init(|| TokioMutex::new(()))
}

pub(crate) fn app_stack_router(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

pub(crate) fn app_stack_router_with_store(pool: PgPool, store: ChainOffStore) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

pub(crate) async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

/// Clear sliding-window rate-limit rows so PG ITs are not polluted by prior runs.
pub(crate) async fn clear_auth_email_send_windows_for_it(pool: &PgPool) {
    let _ = crate::db::clear_auth_email_send_window_events_for_it(pool).await;
}

pub(crate) fn db_router(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    Router::new()
        .merge(auth::router())
        .merge(me::router())
        .with_state(api_meta_state(Some(chain_off)))
}

pub(crate) async fn response_json(res: axum::response::Response) -> Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

pub(crate) fn auth_bearer_value(token: impl AsRef<str>) -> axum::http::HeaderValue {
    format!("Bearer {}", token.as_ref())
        .parse()
        .expect("bearer header value")
}

/// **`TRAVELTRUST_AUTH_OMIT_TOKEN_BODY=1`** 时 **`POST /auth/refresh`** 体可能无 **`token`**，须从 **`Set-Cookie`** 取新会话（与 **`routes::auth::auth_refresh`** 同源）。
pub(crate) fn refreshed_session_token_from_refresh_parts(
    body: &Value,
    set_cookie_lines: &[String],
) -> String {
    if let Some(t) = body
        .get("token")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        return t.to_string();
    }
    for line in set_cookie_lines {
        let first = line.split(';').next().unwrap_or("").trim();
        if let Some(v) = first.strip_prefix(concat!("traveltrust_session_token", "=")) {
            return v.to_string();
        };        if let Some(v) = first.strip_prefix("__Host-traveltrust_session=") {
            return v.to_string();
        }
    }
    panic!("refreshed session token missing in JSON body and Set-Cookie headers");
}

pub(crate) async fn cleanup_user_by_email(pool: &PgPool, email: &str) {
    let _ = sqlx::query(
        r#"DELETE FROM sessions USING users u
           WHERE sessions.user_id = u.id AND lower(u.email) = lower($1)"#,
    )
    .bind(email)
    .execute(pool)
    .await;
    let _ = sqlx::query("DELETE FROM users WHERE lower(email) = lower($1)")
        .bind(email)
        .execute(pool)
        .await;
}

pub(crate) struct RestoreP3SeedArbitratorEmail {
    pub(crate) previous: Option<String>,
}

impl Drop for RestoreP3SeedArbitratorEmail {
    fn drop(&mut self) {
        match &self.previous {
            Some(v) => std::env::set_var("P3_SEED_ARBITRATOR_EMAIL", v),
            None => std::env::remove_var("P3_SEED_ARBITRATOR_EMAIL"),
        }
    }
}
