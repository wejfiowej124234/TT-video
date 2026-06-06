//! Indexer state, JSONL validation/ingest, finality replay, append_jsonl_value, outbox worker, and run().
//! Uses crate::state::ProjectorCheckpoint and crate::ssot (write_bytes_atomic, append_jsonl).

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use chrono::Utc;
use serde_json::json;
use tokio::sync::RwLock;

use crate::chain;
use crate::chain_off;
use crate::middleware;
use crate::router;
use crate::ssot;
use crate::state;
use crate::state::ApiMetaState;

mod hydrate;
mod ingest;
mod outbox;
#[cfg(test)]
pub(crate) use hydrate::hydrate_from_db;
pub use ingest::*;

/// Append a JSON value as a single line to a JSONL file.
pub fn append_jsonl_value(path: &Path, value: serde_json::Value) -> Result<(), String> {
    let line = serde_json::to_string(&value).map_err(|e| e.to_string())?;
    ssot::append_jsonl(path, &line)
}

/// Async entrypoint: CLI, SSOT, indexer state, DB, chain_off hydration, router, outbox worker, serve.
pub async fn run() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let args: Vec<String> = std::env::args().collect();

    let strict_ssot = std::env::var("STRICT_SSOT").as_deref() == Ok("1")
        || std::env::var("CHECK_SSOT").as_deref() == Ok("1");

    let ssot_version = std::env::var("SSOT_VERSION").unwrap_or_else(|_| "unset".to_string());
    if strict_ssot && ssot_version == "unset" {
        eprintln!("STRICT_SSOT/CHECK_SSOT=1: SSOT_VERSION 未设置，拒绝启动");
        std::process::exit(1);
    }

    let ssot_sha256_expected = std::env::var("SSOT_SHA256").ok();
    let ssot_doc_path = PathBuf::from("docs/spec/08-3-参数与门禁表.md");
    let (ssot_sha256_computed, ssot_sha256_match) =
        match ssot::compute_file_sha256_hex(&ssot_doc_path) {
            Ok(h) => {
                let matched = ssot_sha256_expected
                    .as_deref()
                    .is_some_and(|exp| exp.eq_ignore_ascii_case(&h));
                (Some(h), matched)
            }
            Err(e) => {
                eprintln!(
                    "WARN: 计算 SSOT 文件 sha256 失败: file={} err={}",
                    ssot_doc_path.to_string_lossy(),
                    e
                );
                (None, false)
            }
        };

    if strict_ssot {
        let Some(expected) = ssot_sha256_expected.as_deref() else {
            eprintln!(
                "STRICT_SSOT/CHECK_SSOT=1: 必须设置 SSOT_SHA256，并与 docs/spec/08-3-参数与门禁表.md sha256 一致"
            );
            std::process::exit(1);
        };
        let Some(computed) = ssot_sha256_computed.as_deref() else {
            eprintln!(
                "STRICT_SSOT/CHECK_SSOT=1: 无法计算 docs/spec/08-3-参数与门禁表.md sha256；请确保运行时包含该文件（或调整部署方式以提供可校验的 SSOT 副本）"
            );
            std::process::exit(1);
        };
        if !expected.eq_ignore_ascii_case(computed) {
            eprintln!(
                "STRICT_SSOT/CHECK_SSOT=1: SSOT_SHA256 不匹配 computed={} expected={}，拒绝启动",
                computed, expected
            );
            std::process::exit(1);
        }
    }

    if args.iter().any(|a| a == "--ssot-runtime-check") {
        let code = ssot::run_ssot_runtime_check(strict_ssot, &ssot_version);
        std::process::exit(code);
    }

    let chargeback_policy =
        std::env::var("CHARGEBACK_POLICY").unwrap_or_else(|_| "unset".to_string());
    if strict_ssot && chargeback_policy == "unset" {
        eprintln!(
            "STRICT_SSOT/CHECK_SSOT=1: CHARGEBACK_POLICY 未设置，拒绝启动（08-3 chargebackPolicy 为关键 param_key，运行时必须显式配置）"
        );
        std::process::exit(1);
    }

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

    if args.iter().any(|a| a == "--indexer-replay-finality-change") {
        let plan = apply_finality_change_replay_plan(&mut indexer_state, finality_n);
        persist_indexer_state(&indexer_state_path, &indexer_state)?;
        let _ = append_jsonl_value(
            Path::new("data/indexer_audit.jsonl"),
            json!({
                "ts": Utc::now().to_rfc3339(),
                "action": "replay_plan_applied",
                "finality_n_used": finality_n,
                "indexer_state_path": indexer_state_path_display.clone(),
                "checkpoint": {
                    "block_number": indexer_state.checkpoint.block_number,
                    "log_index": indexer_state.checkpoint.log_index,
                },
                "plan": plan,
            }),
        );
        println!(
            "indexer_replay_plan: {}",
            serde_json::to_string(&plan).unwrap_or_else(|_| "{}".to_string())
        );
        return Ok(());
    }

    if let Some(pos) = args.iter().position(|a| a == "--indexer-validate-jsonl") {
        let Some(input) = args.get(pos + 1) else {
            return Err("--indexer-validate-jsonl requires a file path".into());
        };
        let input_path = PathBuf::from(input);
        let report = validate_events_jsonl(&input_path)?;
        println!(
            "indexer_validate: total_lines={} parsed_events={} unique_in_file={} dup_in_file={} input={}",
            report.total_lines,
            report.parsed_events,
            report.unique_in_file,
            report.duplicates_in_file,
            input_path.to_string_lossy(),
        );
        return Ok(());
    }
    if let Some(pos) = args.iter().position(|a| a == "--indexer-ingest-jsonl") {
        let Some(input) = args.get(pos + 1) else {
            return Err("--indexer-ingest-jsonl requires a file path".into());
        };
        let input_path = PathBuf::from(input);
        let seen_keys_path = std::env::var("INDEXER_SEEN_KEYS_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("data/indexer_seen_keys.json"));
        let events_log_path = std::env::var("INDEXER_EVENTS_LOG_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("data/indexer_events.jsonl"));
        let audit_log_path = std::env::var("INDEXER_AUDIT_LOG_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("data/indexer_audit.jsonl"));

        let ingest = ingest_events_from_jsonl(
            &input_path,
            &seen_keys_path,
            &events_log_path,
            &audit_log_path,
            &mut indexer_state,
            finality_n,
        )?;
        persist_indexer_state(&indexer_state_path, &indexer_state)?;
        println!(
            "indexer_ingest: applied={} duplicates={} input={} checkpoint={}:{}",
            ingest.applied,
            ingest.duplicates,
            input_path.to_string_lossy(),
            indexer_state.checkpoint.block_number,
            indexer_state.checkpoint.log_index
        );
        return Ok(());
    }

    let strict_indexer_replay = std::env::var("STRICT_INDEXER_REPLAY").as_deref() == Ok("1");
    let replay_required = indexer_state.last_seen_finality_n != finality_n;

    let _ = append_jsonl_value(
        Path::new("data/indexer_audit.jsonl"),
        json!({
            "ts": Utc::now().to_rfc3339(),
            "action": "startup",
            "finality_n_used": finality_n,
            "indexer_state_path": indexer_state_path_display.clone(),
            "checkpoint": {
                "block_number": indexer_state.checkpoint.block_number,
                "log_index": indexer_state.checkpoint.log_index,
            },
            "last_seen_finality_n": indexer_state.last_seen_finality_n,
            "replay_required": replay_required,
            "strict_indexer_replay": strict_indexer_replay,
            "rule": "每次事件消费必须可回放：checkpoint=(block,logIndex) + finalityNUsed 需可审计",
        }),
    );
    if replay_required {
        let msg = format!(
            "finalityN 变更检测到：state.last_seen_finality_n={} current.FINALITY_N={}。必须先执行回放/重放前置动作：traveltrust-api --indexer-replay-finality-change（写死：checkpoint 必含 logIndex；finalityN 改一次必须回放一次）",
            indexer_state.last_seen_finality_n, finality_n
        );
        if strict_indexer_replay {
            eprintln!("STRICT_INDEXER_REPLAY=1: {}", msg);
            std::process::exit(1);
        }
        eprintln!("WARN: {}", msg);
    }

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
            }
            let mut a = [0u8; 32];
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
        middleware::REQUEST_TIMEOUT_SECS,
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
    }

    let idem_cache: Arc<RwLock<middleware::IdempotencyCache>> =
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
                let io_err = std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!(
                "hydrate_from_db failed (55 O8 关键表 users/sessions 加载失败即启动失败): {}",
                e
            ),
                );
                Box::new(io_err) as Box<dyn std::error::Error + Send + Sync>
            })?;
    }

    let seed_env = std::env::var("SEED_TEST_ACCOUNTS").unwrap_or_else(|_| "unset".to_string());
    if seed_env.as_str() != "1" {
        eprintln!(
            "SEED_TEST_ACCOUNTS={} (need 1 for test accounts tourist@test.com / guide@test.com)",
            seed_env
        );
    }
    if seed_env.as_str() == "1" {
        let co_state = chain_off::ChainOffState {
            store: chain_off_store.clone(),
            config: chain_off::ChainOffConfig::from_env(),
            db_pool: db_pool.clone(),
        };
        chain_off::seed_test_accounts_if_empty(&co_state).await;
        if let Some(ref pool) = db_pool {
            let mut store = chain_off_store.write().await;
            crate::db::seed_market_public_showcase_if_sparse(pool, &mut store).await;
            crate::db::seed_community_public_showcase_if_sparse(pool, &mut store).await;
        }
    }

    if let Err(e) = crate::schedule_engine::init_from_env() {
        eprintln!(
            "schedule_engine init_from_env: {} (档期将仅内存，重启清空)",
            e
        );
    }

    let chain_config_opt = chain::ChainConfig::from_env();
    let indexer_min_finality_n: Option<u64> = std::env::var("INDEXER_MIN_FINALITY_N")
        .ok()
        .and_then(|s| s.parse().ok());
    let strict_indexer_finality = std::env::var("STRICT_INDEXER_FINALITY").as_deref() == Ok("1");
    if let Err(msg) = enforce_indexer_finality_floor(
        finality_n,
        &chain_config_opt,
        indexer_min_finality_n,
        strict_indexer_finality,
    ) {
        eprintln!("{}", msg);
        std::process::exit(1);
    }

    let jurisdiction_country_ledger_registry =
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
        indexer_state: chain_config_opt.as_ref().map(|_| {
            let runtime_path =
                PathBuf::from(&indexer_state_path_display).with_extension("json.runtime");
            chain::indexer::load_indexer_state(&runtime_path)
                .map(|s| Arc::new(RwLock::new(s)))
                .unwrap_or_else(chain::indexer::new_indexer_state)
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
    }

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);
    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], port));
    println!("TravelTrust API listening on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

/// **110 §3.3**：`CHAIN_RPC_URL` + 非空 **`ESCROW_FACTORY_ADDRESS`** 时索引器将跑 `indexer-tick`；可选拒绝 **`FINALITY_N`** 低于运维下限，避免误配抢跑。
pub(crate) fn enforce_indexer_finality_floor(
    finality_n: u64,
    chain: &Option<chain::ChainConfig>,
    indexer_min_finality_n: Option<u64>,
    strict_indexer_finality: bool,
) -> Result<(), String> {
    const DEFAULT_MIN_WHEN_STRICT: u64 = 12;
    let indexer_ready = chain.as_ref().map_or(false, |c| {
        c.is_configured()
            && c.escrow_factory_address
                .as_deref()
                .map(|s| !s.trim().is_empty())
                .unwrap_or(false)
    });
    if !indexer_ready {
        return Ok(());
    }
    let threshold = indexer_min_finality_n
        .map(|m| m.max(1))
        .or_else(|| strict_indexer_finality.then_some(DEFAULT_MIN_WHEN_STRICT.max(1)));
    if let Some(t) = threshold {
        if finality_n < t {
            return Err(format!(
                "FINALITY_N={finality_n} < required {t} (INDEXER_MIN_FINALITY_N or STRICT_INDEXER_FINALITY=1; CHAIN_RPC_URL+ESCROW_FACTORY_ADDRESS configured; 110 §3.3)"
            ));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests;
