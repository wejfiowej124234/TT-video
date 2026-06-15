//! **F-029 / F-030 · API·IT（PostgreSQL + `Router::oneshot` / handler 直连）** + **93 §4.5.1 / §4.5（ISS-007 窄口径）** + **93 §1 · A-ENV-001**
//!
//! - **F-029**：**`GET /api/v1/internal/indexer-status`**（**`internal::router()`**；与 **110** 探针体字段同源子集）+ **`matrix_93_d_idx_001_f029_internal_indexer_status_ok_and_sqlx_migrations_applied_pg`**（**`_sqlx_migrations`** **COUNT** **>0** **PG 锚**）+ **`matrix_93_d_idx_001b_f029_get_internal_indexer_status_ok_shape_app_stack_ok_pg`**（**`router::app`**；**v1.4.255**）+ **`POST /api/v1/internal/indexer-reconcile`**（**`indexer_reconcile`**；**`persist:false`**；**`chain_config` + `indexer_state` + `db_pool`**；**110 §3.1.4** 干路径旁证）+ **`matrix_93_d_idx_001e_f029_post_internal_indexer_reconcile_persist_false_app_stack_ok_pg`**（**`router::app`** **全栈**；**v1.4.258**）+ **`matrix_93_d_idx_001f_f029_post_internal_indexer_reconcile_persist_true_app_stack_ok_pg`**（**`persist:true`**·**`reconciliation_reports` 写路径**·**`router::app`**；**v1.4.266**）+ **`matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg`**（**`GET /health`** **`200`** **`ok`** + **`GET /meta`** **`200`** **`build`/`api_version`/`database`**；**`router::app`**；**v1.4.285**）。
//! - **F-030**：**`GET /api/v1/admin/schema/migrations`** + **`Authorization: Bearer bearer_{admin_id}`** + **`chain_off.db_pool`** → **`status=ok`** 与 **`items.*`** PG 读回 + **`matrix_93_d_adm_003_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_pg`**（**`_sqlx_migrations`** **`COUNT(*)>0`** **与** **Admin migrations** **HTTP 200** **同事务锚**）+ **`matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg`**（**`router::app`**；**v1.4.255**）+ **`matrix_93_d_adm_003c_f030_get_admin_migrations_returns_non_empty_migration_histories_app_stack_ok_pg`**（**v1.4.257**；**`migration_histories` 非空** **且** **`len`≤`_sqlx_migrations`**；**v1.4.259**：测内 **`INSERT`/`DELETE`** **`migration_id` LIKE `matrix_93_it_mh_seed_%`** **自包含**，**不**依赖 DB 预填 **`migration_histories`**）+ **`matrix_93_d_adm_004d_f030_get_admin_cross_check_ok_app_stack_ok_pg`**（**`GET …/admin/cross-check`**·**`router::app`**；**v1.4.258**）。
//!
//! **93**：**`matrix_93_d_idx_001_*`** / **`matrix_93_d_idx_001b_f029_*`** / **`matrix_93_d_idx_001e_f029_*`** / **`matrix_93_d_idx_001f_f029_*`** / **`matrix_93_a_env_001b_f029_*`** ↔ **D-IDX-001**/**D-IDX-002**/**D-IDX-003**/**A-ENV-001**/**F-029**；**`matrix_93_d_adm_003_*`** / **`matrix_93_d_adm_003b_f030_*`** / **`matrix_93_d_adm_003c_f030_*`** / **`matrix_93_d_adm_004d_f030_*`** ↔ **D-ADM-003**/**F-030**（**`spec/93-全站功能验证矩阵-域别回归清单.md`**）。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（须**已迁移**库）。

use std::sync::{Arc, OnceLock};
use tokio::sync::{Mutex, RwLock};

use axum::body::Body;
use axum::extract::State;
use axum::http::{header, HeaderValue, Method, Request, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use axum::Router;
use chrono::Utc;
use http_body_util::BodyExt;
use serde_json::json;
use sqlx::PgPool;
use tokio::io::AsyncWriteExt;
use tokio::net::TcpListener;
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain;
use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, UserRow};
use crate::db::{insert_event_log, insert_session, insert_user};
use crate::jsonrpc_mock_server::read_http_request_headers_and_body;
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::routes::internal::{indexer_reconcile, IndexerReconcileBody};
use crate::routes::{admin, internal};
use crate::state::test_support::api_meta_state;
use crate::state::ApiMetaState;

static INTERNAL_ADMIN_DB_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn db_it_lock() -> &'static Mutex<()> {
    INTERNAL_ADMIN_DB_IT_LOCK.get_or_init(|| Mutex::new(()))
}

async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

fn admin_user_row() -> UserRow {
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
        email_verified_at: None,
        created_at: now,
        updated_at: now,
    }
}

fn meta_admin_with_db_pool(pool: PgPool, admin: UserRow, session_token: &str) -> ApiMetaState {
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

fn meta_indexer_reconcile_with_pool(pool: PgPool) -> ApiMetaState {
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
        guide_staking_address: None,
        staking_provider_address: None,
        investor_lock_contract_addresses: vec![],
        governor_address: None,
        governance_timelock_address: None,
        governance_votes_token_address: None,
        treasury_address: None,
        registry_address: None,
        executor_max_amount_per_tx: None,
        executor_max_amount_per_day: None,
        executor_retry_count: 3,
    });
    s.indexer_state = Some(chain::indexer::new_indexer_state());
    s
}

fn app_stack_router(pool: PgPool) -> Router {
    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(co)), idem, Some(pool))
}

async fn cleanup_admin_it_user(pool: &PgPool, user_id: Uuid) {
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
const MATRIX_93_IT_MH_SEED_PREFIX: &str = "matrix_93_it_mh_seed_";

async fn cleanup_migration_history_it_seeds(pool: &PgPool) {
    let pat = format!("{MATRIX_93_IT_MH_SEED_PREFIX}%");
    let _ = sqlx::query("DELETE FROM migration_histories WHERE migration_id LIKE $1")
        .bind(pat)
        .execute(pool)
        .await;
}

/// Inserts one **`migration_histories`** row so **`GET …/admin/schema/migrations`** returns non-empty **`items.migration_histories`** on a DB that only has **`_sqlx_migrations`** applied.
async fn insert_migration_history_it_seed(pool: &PgPool) {
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

#[tokio::test]
async fn matrix_93_d_idx_001_f029_get_internal_indexer_status_ok_shape_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_idx_001_f029_get_internal_indexer_status_ok_shape_pg (DATABASE_URL unset)"
        );
        return;
    };

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    let app = internal::router().with_state(api_meta_state(Some(co)));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/internal/indexer-status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert!(v.get("indexer").is_some());
    assert!(v.get("state").is_some());
    assert!(v.get("reorg_recovery").is_some());
}

/// **93 · D-IDX-001** → **§8.2 · F-029**：**`GET /api/v1/internal/indexer-status`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_idx_001b_f029_get_internal_indexer_status_ok_shape_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_idx_001b_f029_get_internal_indexer_status_ok_shape_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let app = app_stack_router(pool.clone());

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/internal/indexer-status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert!(v.get("indexer").is_some());
    assert!(v.get("state").is_some());
    assert!(v.get("reorg_recovery").is_some());
}

/// **93 · D-IDX-001** → **§8.2 · F-029**：**`GET /api/v1/internal/indexer-status`** **200** **且** **`_sqlx_migrations`** **`COUNT(*)>0`**（**已迁移 PG** 与 **internal 探针** 同事务锚定）。
#[tokio::test]
async fn matrix_93_d_idx_001_f029_internal_indexer_status_ok_and_sqlx_migrations_applied_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_idx_001_f029_internal_indexer_status_ok_and_sqlx_migrations_applied_pg (DATABASE_URL unset)"
        );
        return;
    };

    let mig_count: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM _sqlx_migrations")
        .fetch_one(&pool)
        .await
        .expect("count _sqlx_migrations");
    assert!(
        mig_count > 0,
        "D-IDX-001 PG anchor: expected at least one applied sqlx migration"
    );

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    let app = internal::router().with_state(api_meta_state(Some(co)));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/internal/indexer-status")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert!(v.get("indexer").is_some());
}

/// **F-029**：**`POST /api/v1/internal/indexer-reconcile`** **`persist:false`** **200**（**`indexer_reconcile`** + **真 `DATABASE_URL`**；**`reconcile_orders_projection_vs_orders`**）。
#[tokio::test]
async fn matrix_93_d_idx_001_f029_post_internal_indexer_reconcile_persist_false_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_idx_001_f029_post_internal_indexer_reconcile_persist_false_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let meta = meta_indexer_reconcile_with_pool(pool);
    let mut body = IndexerReconcileBody::default();
    body.persist = false;
    let resp = indexer_reconcile(State(meta), Some(Json(body)))
        .await
        .into_response();

    assert_eq!(resp.status(), StatusCode::OK, "{:?}", resp.status());
    let v = response_json(resp).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(
        v["task"].as_str(),
        Some("indexer_reconcile_orders_projection")
    );
    assert!(v.get("stats").is_some());
    assert!(v.get("chain_context").is_some());
}

/// **93 · D-IDX-001** → **§8.2 · F-029**：**`POST /api/v1/internal/indexer-reconcile`** **`persist:false`** **`200`**（**`router::app`**；与 **`indexer_reconcile` handler 直连** **互补**）。
#[tokio::test]
async fn matrix_93_d_idx_001e_f029_post_internal_indexer_reconcile_persist_false_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_idx_001e_f029_post_internal_indexer_reconcile_persist_false_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let meta = meta_indexer_reconcile_with_pool(pool.clone());
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(meta, idem, Some(pool.clone()));

    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/internal/indexer-reconcile")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"persist":false}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK, "{:?}", res.status());
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(
        v["task"].as_str(),
        Some("indexer_reconcile_orders_projection")
    );
    assert!(v.get("stats").is_some());
    assert!(v.get("chain_context").is_some());
}

/// **93 · D-IDX-003** → **§8.2 · F-029**：**`POST /api/v1/internal/indexer-reconcile`** **`persist:true`** **`200`**（**`router::app`**；**`reconciliation_reports`** **写回** + **体** **`report_id`/`orders_chain_health_trend_snapshot`**）。
#[tokio::test]
async fn matrix_93_d_idx_001f_f029_post_internal_indexer_reconcile_persist_true_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_idx_001f_f029_post_internal_indexer_reconcile_persist_true_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let meta = meta_indexer_reconcile_with_pool(pool.clone());
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(meta, idem, Some(pool.clone()));

    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/internal/indexer-reconcile")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(r#"{"persist":true}"#))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK, "{:?}", res.status());
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(
        v["task"].as_str(),
        Some("indexer_reconcile_orders_projection")
    );
    assert!(v.get("stats").is_some());
    assert!(v.get("chain_context").is_some());
    assert!(
        v.get("report_id")
            .and_then(|x| x.as_str())
            .is_some_and(|s| !s.is_empty()),
        "persist:true should return non-empty report_id: {v:?}"
    );
    assert!(
        v.get("orders_chain_health_trend_snapshot").is_some(),
        "persist:true should include orders_chain_health_trend_snapshot: {v:?}"
    );
}

/// P1-3: reorg-rewind(force) 在独立 chain_id 上应完成删尾+回放，并回写 indexer checkpoint/runtime。
#[tokio::test]
async fn indexer_reorg_rewind_force_executes_delete_and_replay_on_isolated_chain_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: indexer_reorg_rewind_force_executes_delete_and_replay_on_isolated_chain_pg (DATABASE_URL unset)"
        );
        return;
    };

    let chain_id: u64 = 990_001;
    let chain_id_i64 = chain_id as i64;
    let rewind_from_block: u64 = 12;

    let mut meta = meta_indexer_reconcile_with_pool(pool.clone());
    meta.chain_config = Some(chain::ChainConfig {
        rpc_url: String::new(),
        chain_id,
        escrow_factory_address: None,
        fee_router_address: None,
        region_vault_address: None,
        onboarding_fee_receiver_address: None,
        country_pool_ledger_address: None,
        investor_share_token_addresses: vec![],
        staking_address: None,
        guide_staking_address: None,
        staking_provider_address: None,
        investor_lock_contract_addresses: vec![],
        governor_address: None,
        governance_timelock_address: None,
        governance_votes_token_address: None,
        treasury_address: None,
        registry_address: None,
        executor_max_amount_per_tx: None,
        executor_max_amount_per_day: None,
        executor_retry_count: 3,
    });
    if let Some(ref idx) = meta.indexer_state {
        let mut g = idx.write().await;
        g.last_block = rewind_from_block;
        g.last_log_index = 2;
        g.last_block_hash = "0xreorg-test-hash".to_string();
    }

    let block_hash = vec![7u8; 32];
    let tx_hash = vec![9u8; 32];
    insert_event_log(
        &pool,
        chain_id_i64,
        rewind_from_block as i64,
        0,
        &block_hash,
        &tx_hash,
        "NoopEvent",
        &json!({"k":"v"}),
        12,
    )
    .await
    .expect("insert event_log for reorg rewind IT");

    let app = internal::router().with_state(meta);
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/indexer-reorg-rewind")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "rewind_from_block": rewind_from_block,
                        "force": true
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK, "{:?}", res.status());
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(v["task"], "indexer_reorg_rewind");
    assert_eq!(v["chain_id"], json!(chain_id));
    assert_eq!(v["rewind_from_block"], json!(rewind_from_block));
    assert_eq!(v["force"], json!(true));
    assert!(
        v.pointer("/deleted/event_log_rows")
            .and_then(|x| x.as_u64())
            .is_some_and(|n| n >= 1),
        "expected at least one deleted event_log row: {v:?}"
    );
    assert_eq!(v.pointer("/indexer_after/last_block"), Some(&json!(0)));
    assert!(
        v.get("replay_stats").is_some(),
        "replay_stats must exist: {v:?}"
    );
}

/// P2: 非 force 路径下，若链上 hash 与索引状态一致，应返回 reorg_not_detected，防误回滚。
#[tokio::test]
async fn indexer_reorg_rewind_non_force_rejects_when_hash_matches_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: indexer_reorg_rewind_non_force_rejects_when_hash_matches_pg (DATABASE_URL unset)"
        );
        return;
    };

    const LAST_BLOCK: u64 = 13;
    const HASH: &str = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .expect("bind mock rpc");
    let port = listener.local_addr().expect("local addr").port();
    tokio::spawn(async move {
        loop {
            let Ok((mut socket, _)) = listener.accept().await else {
                break;
            };
            tokio::spawn(async move {
                let Ok(_req) = read_http_request_headers_and_body(&mut socket).await else {
                    return;
                };
                let body = format!(
                    r#"{{"jsonrpc":"2.0","id":1,"result":{{"hash":"{}"}}}}"#,
                    HASH
                );
                let resp = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(),
                    body
                );
                let _ = socket.write_all(resp.as_bytes()).await;
            });
        }
    });
    tokio::task::yield_now().await;

    let mut meta = meta_indexer_reconcile_with_pool(pool.clone());
    meta.chain_config = Some(chain::ChainConfig {
        rpc_url: format!("http://127.0.0.1:{port}"),
        chain_id: 137,
        escrow_factory_address: None,
        fee_router_address: None,
        region_vault_address: None,
        onboarding_fee_receiver_address: None,
        country_pool_ledger_address: None,
        investor_share_token_addresses: vec![],
        staking_address: None,
        guide_staking_address: None,
        staking_provider_address: None,
        investor_lock_contract_addresses: vec![],
        governor_address: None,
        governance_timelock_address: None,
        governance_votes_token_address: None,
        treasury_address: None,
        registry_address: None,
        executor_max_amount_per_tx: None,
        executor_max_amount_per_day: None,
        executor_retry_count: 3,
    });
    if let Some(ref idx) = meta.indexer_state {
        let mut g = idx.write().await;
        g.last_block = LAST_BLOCK;
        g.last_log_index = 0;
        g.last_block_hash = HASH.to_string();
    }

    let app = internal::router().with_state(meta);
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/indexer-reorg-rewind")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "rewind_from_block": LAST_BLOCK,
                        "force": false
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::CONFLICT);
    let v = response_json(res).await;
    assert_eq!(v.get("error"), Some(&json!("reorg_not_detected")));
}

/// P2: app-stack 全栈下，非 force 且 hash 一致时同样应返回 reorg_not_detected。
#[tokio::test]
async fn indexer_reorg_rewind_non_force_rejects_when_hash_matches_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: indexer_reorg_rewind_non_force_rejects_when_hash_matches_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    const LAST_BLOCK: u64 = 15;
    const HASH: &str = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .expect("bind mock rpc");
    let port = listener.local_addr().expect("local addr").port();
    tokio::spawn(async move {
        loop {
            let Ok((mut socket, _)) = listener.accept().await else {
                break;
            };
            tokio::spawn(async move {
                let Ok(_req) = read_http_request_headers_and_body(&mut socket).await else {
                    return;
                };
                let body = format!(
                    r#"{{"jsonrpc":"2.0","id":1,"result":{{"hash":"{}"}}}}"#,
                    HASH
                );
                let resp = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(),
                    body
                );
                let _ = socket.write_all(resp.as_bytes()).await;
            });
        }
    });
    tokio::task::yield_now().await;

    let mut meta = meta_indexer_reconcile_with_pool(pool.clone());
    meta.chain_config = Some(chain::ChainConfig {
        rpc_url: format!("http://127.0.0.1:{port}"),
        chain_id: 137,
        escrow_factory_address: None,
        fee_router_address: None,
        region_vault_address: None,
        onboarding_fee_receiver_address: None,
        country_pool_ledger_address: None,
        investor_share_token_addresses: vec![],
        staking_address: None,
        guide_staking_address: None,
        staking_provider_address: None,
        investor_lock_contract_addresses: vec![],
        governor_address: None,
        governance_timelock_address: None,
        governance_votes_token_address: None,
        treasury_address: None,
        registry_address: None,
        executor_max_amount_per_tx: None,
        executor_max_amount_per_day: None,
        executor_retry_count: 3,
    });
    if let Some(ref idx) = meta.indexer_state {
        let mut g = idx.write().await;
        g.last_block = LAST_BLOCK;
        g.last_log_index = 0;
        g.last_block_hash = HASH.to_string();
    }
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(meta, idem, Some(pool.clone()));

    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/indexer-reorg-rewind")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "rewind_from_block": LAST_BLOCK,
                        "force": false
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::CONFLICT);
    let v = response_json(res).await;
    assert_eq!(v.get("error"), Some(&json!("reorg_not_detected")));
}

#[tokio::test]
async fn matrix_93_d_adm_003_f030_get_admin_schema_migrations_lists_pg_rows() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_adm_003_f030_get_admin_schema_migrations_lists_pg_rows (DATABASE_URL unset)"
        );
        return;
    };

    let admin = admin_user_row();
    let admin_id = admin.id;
    let now = Utc::now();
    let email = admin.email.clone();

    cleanup_admin_it_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user admin it");
    let session_token = format!("admin_it_sess_{}", Uuid::new_v4());
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin it");

    let auth = format!("Bearer {}", session_token);
    let app =
        admin::router().with_state(meta_admin_with_db_pool(pool.clone(), admin, &session_token));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/admin/schema/migrations?limit=5")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let items = &v["items"];
    assert!(items["schema_versions"].is_array());
    assert!(items["migration_histories"].is_array());
    assert!(items["migration_rollbacks"].is_array());
    assert!(items["backfill_jobs"].is_array());
    assert!(items["dual_write_checks"].is_array());

    cleanup_admin_it_user(&pool, admin_id).await;
}

/// **93 · D-ADM-003** → **§8.2 · F-030**：**`_sqlx_migrations`** **`COUNT(*)>0`** **且** **`GET /api/v1/admin/schema/migrations`** **200** **`status=ok`**（**Admin Bearer**；**PG 已迁移** 与 **抽检端点** 锚定）。
#[tokio::test]
async fn matrix_93_d_adm_003_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_adm_003_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_pg (DATABASE_URL unset)"
        );
        return;
    };

    let mig_count: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM _sqlx_migrations")
        .fetch_one(&pool)
        .await
        .expect("count _sqlx_migrations");
    assert!(
        mig_count > 0,
        "D-ADM-003 PG anchor: expected at least one applied sqlx migration"
    );

    let admin = admin_user_row();
    let admin_id = admin.id;
    let now = Utc::now();
    let email = admin.email.clone();

    cleanup_admin_it_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user admin it");
    let session_token = format!("admin_it_sess_{}", Uuid::new_v4());
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin it");

    let auth = format!("Bearer {}", session_token);
    let app =
        admin::router().with_state(meta_admin_with_db_pool(pool.clone(), admin, &session_token));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/admin/schema/migrations?limit=5")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let items = &v["items"];
    assert!(items["schema_versions"].is_array());
    assert!(items["migration_histories"].is_array());

    cleanup_admin_it_user(&pool, admin_id).await;
}

/// **93 · D-ADM-003** → **§8.2 · F-030**：**`GET …/admin/schema/migrations`**（**`router::app`**；**Admin Bearer**）。
#[tokio::test]
async fn matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_adm_003b_f030_get_admin_schema_migrations_ok_when_sqlx_migrations_applied_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let mig_count: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM _sqlx_migrations")
        .fetch_one(&pool)
        .await
        .expect("count _sqlx_migrations");
    assert!(
        mig_count > 0,
        "D-ADM-003 PG anchor: expected at least one applied sqlx migration"
    );

    let admin = admin_user_row();
    let admin_id = admin.id;
    let now = Utc::now();
    let email = admin.email.clone();

    cleanup_admin_it_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user admin it");
    let session_token = format!("admin_it_sess_app_{}", Uuid::new_v4());
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin it");

    let auth = format!("Bearer {}", session_token);
    let meta = meta_admin_with_db_pool(pool.clone(), admin, &session_token);
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(meta, idem, Some(pool.clone()));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/admin/schema/migrations?limit=5")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let items = &v["items"];
    assert!(items["schema_versions"].is_array());
    assert!(items["migration_histories"].is_array());

    cleanup_admin_it_user(&pool, admin_id).await;
}

/// **93 · D-ADM-003** → **§8.2 · F-030**：**`router::app`** **`GET …/admin/schema/migrations`** **`migration_histories`** **非空** **且** **条数 ≤ `_sqlx_migrations`**（**v1.4.259**：测内 **`migration_histories`** 种子行，**不**依赖环境预填）。
#[tokio::test]
async fn matrix_93_d_adm_003c_f030_get_admin_migrations_returns_non_empty_migration_histories_app_stack_ok_pg(
) {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_adm_003c_f030_get_admin_migrations_returns_non_empty_migration_histories_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let mig_count: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM _sqlx_migrations")
        .fetch_one(&pool)
        .await
        .expect("count _sqlx_migrations");
    assert!(
        mig_count > 0,
        "D-ADM-003 PG anchor: expected at least one applied sqlx migration"
    );

    insert_migration_history_it_seed(&pool).await;

    let admin = admin_user_row();
    let admin_id = admin.id;
    let now = Utc::now();
    let email = admin.email.clone();

    cleanup_admin_it_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user admin it");
    let session_token = format!("admin_it_sess_hist_{}", Uuid::new_v4());
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin it");

    let auth = format!("Bearer {}", session_token);
    let meta = meta_admin_with_db_pool(pool.clone(), admin, &session_token);
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(meta, idem, Some(pool.clone()));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/admin/schema/migrations?limit=500")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK);
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let hist = v["items"]["migration_histories"]
        .as_array()
        .expect("migration_histories array");
    assert!(!hist.is_empty(), "expected non-empty migration_histories");
    assert!(
        hist.len() as i64 <= mig_count,
        "migration_histories len {} should not exceed _sqlx_migrations count {}",
        hist.len(),
        mig_count
    );

    cleanup_admin_it_user(&pool, admin_id).await;
    cleanup_migration_history_it_seeds(&pool).await;
}

/// **93 · D-ADM-003** → **§8.2 · F-030**：**`GET /api/v1/admin/cross-check`** **`200`**（**`router::app`**；**Admin Bearer** + **`sessions`**；**只读对拍体**）。
#[tokio::test]
async fn matrix_93_d_adm_004d_f030_get_admin_cross_check_ok_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_adm_004d_f030_get_admin_cross_check_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let admin = admin_user_row();
    let admin_id = admin.id;
    let now = Utc::now();
    let email = admin.email.clone();

    cleanup_admin_it_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user admin cross-check");
    let session_token = format!("admin_it_sess_cross_{}", Uuid::new_v4());
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin cross-check");

    let auth = format!("Bearer {}", session_token);
    let meta = meta_admin_with_db_pool(pool.clone(), admin, &session_token);
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(meta, idem, Some(pool.clone()));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/admin/cross-check")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert!(v.get("fee_pool_projection").is_some());
    assert!(v.get("governance_pool_chain").is_some());
    assert!(v.get("protocol_reference").is_some());
    assert!(v.get("drift_summary").is_some());

    cleanup_admin_it_user(&pool, admin_id).await;
}

/// **93 · A-ENV-001** → **§8.2 · F-029**：**`GET /health`** **`200`** **`ok`**；**`GET /meta`** **`200`** 且含 **`build`/`api_version`/`database`**（**`router::app`** + **`DATABASE_URL`**）。
#[tokio::test]
async fn matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(api_meta_state(Some(co)), idem, Some(pool.clone()));

    let health = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("health oneshot");
    assert_eq!(health.status(), StatusCode::OK);
    let hb = health.into_body().collect().await.unwrap().to_bytes();
    assert_eq!(std::str::from_utf8(&hb).unwrap().trim(), "ok");

    let meta = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/meta")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("meta oneshot");
    assert_eq!(
        meta.status(),
        StatusCode::OK,
        "{:?}",
        response_json(meta).await
    );
    let mj = response_json(meta).await;
    assert!(mj.get("build").is_some(), "meta.build: {mj:?}");
    assert!(mj.get("api_version").is_some(), "meta.api_version: {mj:?}");
    assert!(mj.get("database").is_some(), "meta.database: {mj:?}");
}
