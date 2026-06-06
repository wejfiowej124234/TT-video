use std::sync::{Arc, OnceLock};
use tokio::sync::{Mutex, RwLock};

use axum::Router;
use chrono::Utc;
use http_body_util::BodyExt;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::chain;
use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, UserRow};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;
use crate::state::ApiMetaState;

static INTERNAL_ADMIN_DB_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

pub(super) fn db_it_lock() -> &'static Mutex<()> {
    INTERNAL_ADMIN_DB_IT_LOCK.get_or_init(|| Mutex::new(()))
}

pub(super) async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

pub(super) async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

pub(super) fn admin_user_row() -> UserRow {
    let now = Utc::now();
    UserRow {
        id: Uuid::new_v4(),
        email: format!("admin-it-{}@test.local", Uuid::new_v4()),
        password_hash: None,
        role: "admin".to_string(),
        kyc_status: "none".to_string(),
        nickname: None,
        avatar_url: None,
        default_wallet_address: None,
        bio: None,
        email_verified_at: None,
        created_at: now,
        updated_at: now,
    }
}

pub(super) fn meta_admin_with_db_pool(
    pool: PgPool,
    admin: UserRow,
    session_token: &str,
) -> ApiMetaState {
    let aid = admin.id;
    let mut store = ChainOffStore::default();
    store.users.insert(aid, admin);
    store.sessions.insert(session_token.to_string(), aid);

    let co = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    api_meta_state(Some(co))
}

pub(super) fn meta_indexer_reconcile_with_pool(pool: PgPool) -> ApiMetaState {
    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    let mut s = api_meta_state(Some(co));
    s.chain_config = Some(chain::ChainConfig {
        rpc_url: "http://127.0.0.1:8545".to_string(),
        chain_id: 137,
        escrow_factory_address: None,
        fee_router_address: None,
        region_vault_address: None,
        onboarding_fee_receiver_address: None,
        country_pool_ledger_address: None,
        investor_share_token_addresses: vec![],
        staking_address: None,
        investor_lock_contract_addresses: vec![],
        governor_address: None,
        governance_timelock_address: None,
        governance_votes_token_address: None,
        registry_address: None,
        executor_max_amount_per_tx: None,
        executor_max_amount_per_day: None,
        executor_retry_count: 3,
    });
    s.indexer_state = Some(chain::indexer::new_indexer_state());
    s
}

pub(super) fn app_stack_router(pool: PgPool) -> Router {
    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(co)), idem, Some(pool))
}

pub(super) async fn cleanup_admin_it_user(pool: &PgPool, user_id: Uuid) {
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
}

/// Prefix for **`migration_histories`** rows inserted only by **`matrix_93_d_adm_003c_f030_*`** IT.
pub(super) const MATRIX_93_IT_MH_SEED_PREFIX: &str = "matrix_93_it_mh_seed_";

pub(super) async fn cleanup_migration_history_it_seeds(pool: &PgPool) {
    let pat = format!("{MATRIX_93_IT_MH_SEED_PREFIX}%");
    let _ = sqlx::query("DELETE FROM migration_histories WHERE migration_id LIKE $1")
        .bind(pat)
        .execute(pool)
        .await;
}

/// Inserts one **`migration_histories`** row so **`GET …/admin/schema/migrations`** returns non-empty **`items.migration_histories`** on a DB that only has **`_sqlx_migrations`** applied.
pub(super) async fn insert_migration_history_it_seed(pool: &PgPool) {
    cleanup_migration_history_it_seeds(pool).await;
    let mid = format!("{MATRIX_93_IT_MH_SEED_PREFIX}{}", Uuid::new_v4());
    sqlx::query(
        r#"INSERT INTO migration_histories (migration_id, from_version, to_version, result)
           VALUES ($1, '0.0.0', 'it.seed', 'ok')"#,
    )
    .bind(&mid)
    .execute(pool)
    .await
    .expect("insert migration_histories IT seed");
}
