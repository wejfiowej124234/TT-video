//! `startup::run`：CLI / SSOT / indexer（**`indexer_cli`** 早退）/ finality 闸（**`finality_floor`**）/ DB / `ApiMetaState` / `router::app` / outbox / serve（48 拆分自 `startup/mod.rs`）。

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;

use tokio::sync::RwLock;

use crate::chain;
use crate::chain_off;
use crate::middleware;
use crate::router;
use crate::state;
use crate::state::ApiMetaState;

use super::finality_floor;
use super::hydrate;
use super::indexer_cli;
use super::load_or_init_indexer_state;
use super::outbox;
use super::run_indexer_audit;
use super::run_ssot_env;

/// Async entrypoint: CLI, SSOT, indexer state, DB, chain_off hydration, router, outbox worker, serve.
pub async fn run() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let args: Vec<String> = std::env::args().collect();

    let run_ssot_env::StartupSsotEnv {
        strict_ssot,
        ssot_version,
        ssot_sha256_expected,
        ssot_sha256_computed,
        ssot_sha256_match,
        chargeback_policy,
    } = run_ssot_env::enforce_startup_ssot_and_chargeback(&args);

    const DEFAULT_FINALITY_N: u64 = 12;
    let finality_n: u64 = std::env::var("FINALITY_N")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(DEFAULT_FINALITY_N);

    let indexer_state_path = std::env::var("INDEXER_STATE_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("data/indexer_state.json"));
    let indexer_state_path_display = indexer_state_path.to_string_lossy().to_string();

    let mut indexer_state = load_or_init_indexer_state(&indexer_state_path, finality_n);

    if indexer_cli::try_handle_indexer_cli_commands(
        &args,
        &indexer_state_path,
        &indexer_state_path_display,
        finality_n,
        &mut indexer_state,
    )? {
        return Ok(());
    };    let strict_indexer_replay = std::env::var("STRICT_INDEXER_REPLAY").as_deref() == Ok("1");
    let replay_required = indexer_state.last_seen_finality_n != finality_n;

    run_indexer_audit::indexer_startup_audit_jsonl_and_replay_gate(
        &indexer_state_path_display,
        finality_n,
        &indexer_state,
        replay_required,
        strict_indexer_replay,
    );

    let evidence_timestamp_policy =
        std::env::var("EVIDENCE_TIMESTAMP_POLICY").unwrap_or_else(|_| "backend_signed".to_string());

    let receipt_hmac_key = std::env::var("EVIDENCE_RECEIPT_HMAC_KEY")
        .ok()
        .map(|s| s.into_bytes());

    let reconcile_export_ed25519_key =
        std::env::var("RECONCILE_EXPORT_ED25519_SEED_HEX").ok().and_then(|raw| {
            let v = hex::decode(raw.trim()).ok()?;
            if v.len() != 32 {
                eprintln!(
                    "WARN: RECONCILE_EXPORT_ED25519_SEED_HEX must be 64 hex chars (32 bytes), ignoring"
                );
                return None;
            };            let mut a = [0u8; 32];
            a.copy_from_slice(&v);
            Some(Arc::new(ed25519_dalek::SigningKey::from_bytes(&a)))
        });
    let time_state_path = std::env::var("EVIDENCE_TIME_STATE_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("data/evidence_time_state.json"));
    let time_state_path_display = time_state_path.to_string_lossy().to_string();
    let evidence_time_state: Arc<RwLock<state::EvidenceTimeState>> = Arc::new(RwLock::new(
        state::load_or_init_evidence_time_state(&time_state_path),
    ));

    let pause_mode = std::env::var("PAUSE_MODE").as_deref() == Ok("1");
    let pause_api_allowlist = std::env::var("PAUSE_API_ALLOWLIST")
        .unwrap_or_else(|_| "GET /health;GET /meta".to_string());

    let indexer_lag_blocks: u64 = std::env::var("INDEXER_LAG_BLOCKS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(0);
    let indexer_lag_max_blocks: u64 = std::env::var("INDEXER_LAG_MAX_BLOCKS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(100);
    let reorg_detected = std::env::var("REORG_DETECTED").as_deref() == Ok("1");
    let degraded_mode = reorg_detected || indexer_lag_blocks > indexer_lag_max_blocks;
    let authority_source = if degraded_mode {
        "pending_finality"
    } else {
        "db_projection"
    };
    let dual_write_policy = crate::state::dual_write_failure_policy();
    let strict_db_write_any = crate::state::any_traveltrust_strict_db_write();
    let (meta_build_sha, meta_build_deployed) = crate::routes::meta_build_for_startup_log();
    println!(
        "startup_snapshot: SSOT_VERSION={} SSOT_SHA256_EXPECTED={} SSOT_SHA256_COMPUTED={} SSOT_SHA256_MATCH={} CHARGEBACK_POLICY={} FINALITY_N={} INDEXER_STATE_PATH={} INDEXER_CHECKPOINT={}:{} INDEXER_LAST_SEEN_FINALITY_N={} INDEXER_REPLAY_REQUIRED={} AUTHORITY_SOURCE={} PAUSE_MODE={} REQUEST_TIMEOUT_SECS={} REQUEST_BODY_LIMIT_BYTES={} IDEMPOTENCY_CACHE_MAX={} EVIDENCE_TIMESTAMP_POLICY={} EVIDENCE_TIME_STATE_PATH={} DUAL_WRITE_FAILURE_POLICY={} STRICT_DB_WRITE_ANY={} META_BUILD_GIT_SHA={} META_BUILD_DEPLOYED_AT={}",
        ssot_version,
        ssot_sha256_expected.clone().unwrap_or_else(|| "unset".to_string()),
        ssot_sha256_computed.clone().unwrap_or_else(|| "unavailable".to_string()),
        ssot_sha256_match,
        chargeback_policy,
        finality_n,
        indexer_state_path_display,
        indexer_state.checkpoint.block_number,
        indexer_state.checkpoint.log_index,
        indexer_state.last_seen_finality_n,
        replay_required,
        authority_source,
        pause_mode,
        middleware::request_timeout_secs(),
        middleware::REQUEST_BODY_LIMIT_BYTES,
        middleware::idempotency_cache_max(),
        evidence_timestamp_policy,
        time_state_path_display,
        dual_write_policy,
        strict_db_write_any,
        meta_build_sha,
        meta_build_deployed,
    );

    let cors_origins_raw = std::env::var("CORS_ORIGINS").ok();
    if strict_ssot {
        let empty = cors_origins_raw
            .as_deref()
            .map(|s| s.trim().is_empty())
            .unwrap_or(true);
        if empty {
            eprintln!("STRICT_SSOT/CHECK_SSOT=1: 生产基线要求必须设置 CORS_ORIGINS，拒绝启动");
            std::process::exit(1);
        }
    };    let idem_cache: Arc<RwLock<middleware::IdempotencyCache>> =
        Arc::new(RwLock::new(middleware::IdempotencyCache::default()));

    let db_pool: Option<sqlx::PgPool> = match std::env::var("DATABASE_URL") {
        Ok(url) if !url.trim().is_empty() => {
            let pool = sqlx::postgres::PgPoolOptions::new()
                .max_connections(10)
                .connect(&url)
                .await
                .map_err(
                    |e: sqlx::Error| -> Box<dyn std::error::Error + Send + Sync> { Box::new(e) },
                )?;
            let migrations_path = PathBuf::from(std::env!("CARGO_MANIFEST_DIR")).join("migrations");
            let migrator = sqlx::migrate::Migrator::new(migrations_path)
                .await
                .map_err(
                    |e: sqlx::migrate::MigrateError| -> Box<dyn std::error::Error + Send + Sync> {
                        Box::new(e)
                    },
                )?;
            migrator.run(&pool).await.map_err(
                |e: sqlx::migrate::MigrateError| -> Box<dyn std::error::Error + Send + Sync> {
                    Box::new(e)
                },
            )?;
            println!("database: connected and migrations applied");
            Some(pool)
        }
        _ => None,
    };

    let chain_off_store = Arc::new(RwLock::new(chain_off::ChainOffStore::default()));
    if let Some(ref pool) = db_pool {
        let mut store = chain_off_store.write().await;
        // 55 O8：关键表（users/sessions）hydrate 失败即启动失败，与 55 §8.6、Runbook §2.5 一致
        hydrate::hydrate_from_db(pool, &mut store)
            .await
            .map_err(|e| {
                let io_err = std::io::Error::other(format!(
                    "hydrate_from_db failed (55 O8 关键表 users/sessions 加载失败即启动失败): {}",
                    e
                ));
                Box::new(io_err) as Box<dyn std::error::Error + Send + Sync>
            })?;
    };    let seed_env = std::env::var("SEED_TEST_ACCOUNTS").unwrap_or_else(|_| "unset".to_string());
    if seed_env.as_str() != "1" {
        eprintln!(
            "SEED_TEST_ACCOUNTS={} (need 1 for test accounts tourist@test.com / guide@test.com)",
            seed_env
        );
    };    if seed_env.as_str() == "1" {
        let co_state = chain_off::ChainOffState {
            store: chain_off_store.clone(),
            config: chain_off::ChainOffConfig::from_env(),
            db_pool: db_pool.clone(),
        };
        chain_off::seed_test_accounts_if_empty(&co_state).await;
        chain_off::ensure_seed_tourist_market_entitlements(&co_state).await;
        if let Some(ref pool) = db_pool {
            let mut store = chain_off_store.write().await;
            crate::db::seed_market_public_showcase_if_sparse(pool, &mut store).await;
            crate::db::seed_community_public_showcase_if_sparse(pool, &mut store).await;
        }
    };
    if let Err(e) = crate::schedule_engine::init_from_env() {
        eprintln!(
            "schedule_engine init_from_env: {} (档期将仅内存，重启清空)",
            e
        );
    };    let chain_config_opt = chain::ChainConfig::from_env();
    let indexer_min_finality_n: Option<u64> = std::env::var("INDEXER_MIN_FINALITY_N")
        .ok()
        .and_then(|s| s.parse().ok());
    let strict_indexer_finality = std::env::var("STRICT_INDEXER_FINALITY").as_deref() == Ok("1");
    if let Err(msg) = finality_floor::enforce_indexer_finality_floor(
        finality_n,
        &chain_config_opt,
        indexer_min_finality_n,
        strict_indexer_finality,
    ) {
        eprintln!("{}", msg);
        std::process::exit(1);
    };    let jurisdiction_country_ledger_registry =
        crate::jurisdiction_country_ledger_template::JurisdictionCountryLedgerRegistry::arc_from_env();

    let meta_state = ApiMetaState {
        strict_ssot,
        ssot_version,
        ssot_sha256_expected,
        ssot_sha256_computed,
        ssot_sha256_match,
        chargeback_policy,
        finality_n,
        indexer_state_path: indexer_state_path_display.clone(),
        indexer_checkpoint: indexer_state.checkpoint.clone(),
        indexer_last_seen_finality_n: indexer_state.last_seen_finality_n,
        indexer_replay_required: replay_required,
        pause_mode,
        pause_api_allowlist: pause_api_allowlist.clone(),
        degraded_mode,
        authority_source: authority_source.to_string(),
        indexer_lag_blocks,
        indexer_lag_max_blocks,
        reorg_detected,
        evidence_timestamp_policy,
        evidence_time_state,
        evidence_time_state_path: time_state_path_display,
        evidence_receipt_hmac_key: receipt_hmac_key.map(Arc::new),
        reconcile_export_ed25519_key,
        order_deadline_clock: Arc::new(crate::order_deadline_clock::SystemOrderDeadlineClock),
        chain_off: Some(chain_off::ChainOffState {
            store: chain_off_store,
            config: chain_off::ChainOffConfig::from_env(),
            db_pool: db_pool.clone(),
        }),
        jurisdiction_country_ledger_registry,
        chain_config: chain_config_opt.clone(),
        resolution_outbox: chain_config_opt
            .as_ref()
            .map(|_| chain::outbox::new_resolution_outbox()),
        indexer_state: chain_config_opt.as_ref().map(|cfg| {
            let runtime_path =
                PathBuf::from(&indexer_state_path_display).with_extension("json.runtime");
            chain::indexer::mount_runtime_indexer_state(&runtime_path, cfg.chain_id)
        }),
        indexer_tick_fail_skip_bucket_obs_last: Arc::new(RwLock::new(None)),
        guide_upload_rate: Arc::new(RwLock::new(HashMap::new())),
        community_media_upload_rate: Arc::new(RwLock::new(HashMap::new())),
    };

    let app = router::app(meta_state, idem_cache, db_pool);

    let outbox_dir = std::env::var("OUTBOX_DIR").unwrap_or_else(|_| "data/outbox".to_string());
    let outbox_worker_enabled = std::env::var("OUTBOX_WORKER").as_deref() == Ok("1");
    let outbox_lease_secs: i64 = std::env::var("OUTBOX_LEASE_SECS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(60);
    let outbox_poll_ms: u64 = std::env::var("OUTBOX_POLL_MS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(500);
    let outbox_max_attempts: u32 = std::env::var("OUTBOX_MAX_ATTEMPTS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(10);
    if outbox_worker_enabled {
        println!(
            "outbox_worker: enabled dir={} lease_secs={} poll_ms={} max_attempts={}",
            outbox_dir, outbox_lease_secs, outbox_poll_ms, outbox_max_attempts
        );
        tokio::spawn(async move {
            if let Err(e) = outbox::outbox_worker_loop(
                outbox_dir,
                outbox_lease_secs,
                outbox_poll_ms,
                outbox_max_attempts,
            )
            .await
            {
                eprintln!("outbox_worker: fatal error: {}", e);
            }
        });
    };    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);
    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], port));
    println!("TravelTrust API listening on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
