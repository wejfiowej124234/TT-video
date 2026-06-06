use std::sync::{Arc, OnceLock};

use axum::Router;
use chrono::Utc;
use sqlx::PgPool;
use tokio::sync::{Mutex, RwLock};
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, UserRow};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;

static F031_F032_F033_APP_PG_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

pub(super) fn triple_lock() -> &'static Mutex<()> {
    F031_F032_F033_APP_PG_LOCK.get_or_init(|| Mutex::new(()))
}

pub(super) async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

pub(super) async fn response_json(res: axum::response::Response) -> serde_json::Value {
    use http_body_util::BodyExt;
    use serde_json::json;
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

pub(super) async fn trust_growth_autopilot_gen_for_env(pool: &PgPool, tg_env: &str) -> i64 {
    sqlx::query_scalar(
        "SELECT COALESCE(autopilot_generation, 0) FROM trust_growth_runtime_state WHERE environment = $1",
    )
    .bind(tg_env)
    .fetch_optional(pool)
    .await
    .expect("select trust_growth_runtime_state.autopilot_generation")
    .unwrap_or(0)
}

pub(super) async fn cleanup_community_user_listing(pool: &PgPool, uid: Uuid, listing_id: Uuid) {
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(uid)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM community_posts WHERE user_id = $1")
        .bind(uid)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM market_listings WHERE id = $1")
        .bind(listing_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(uid)
        .execute(pool)
        .await;
}

pub(super) async fn insert_market_listing(
    pool: &PgPool,
    id: Uuid,
    variant: &str,
    owner_user_id: Uuid,
    status: &str,
    now: chrono::DateTime<Utc>,
) {
    sqlx::query(
        r#"INSERT INTO market_listings (id, variant, owner_user_id, payload, status, created_at, updated_at)
           VALUES ($1, $2, $3, '{}'::jsonb, $4, $5, $5)"#,
    )
    .bind(id)
    .bind(variant)
    .bind(owner_user_id)
    .bind(status)
    .bind(now)
    .execute(pool)
    .await
    .expect("insert market_listings");
}

pub(super) async fn cleanup_admin_session_user(pool: &PgPool, user_id: Uuid) {
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
}

pub(super) async fn cleanup_itinerary_orders(pool: &PgPool, tourist_id: Uuid) {
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(tourist_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM itinerary_custom_drafts WHERE owner_user_id = $1")
        .bind(tourist_id)
        .execute(pool)
        .await;
    let _ = sqlx::query(
        "DELETE FROM itineraries WHERE order_id IN (SELECT id FROM orders WHERE tourist_id = $1)",
    )
    .bind(tourist_id)
    .execute(pool)
    .await;
    let _ = sqlx::query("DELETE FROM orders WHERE tourist_id = $1")
        .bind(tourist_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(tourist_id)
        .execute(pool)
        .await;
}

pub(super) fn app_with_pool(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

/// 与 **`insert_user`** 同源身份写入 **`ChainOffStore.users`**（**`require_admin_actor`** 读内存态）。
pub(super) fn app_with_pool_seeded_users(pool: PgPool, users: Vec<UserRow>) -> Router {
    let mut store = ChainOffStore::default();
    for u in users {
        store.users.insert(u.id, u);
    };    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}
