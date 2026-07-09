use crate::chain;
use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::state::{ApiMetaState, EvidenceTimeState, ProjectorCheckpoint};
use chrono::Utc;
use sqlx::postgres::PgPoolOptions;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;

/// **`127.0.0.1:1`** + 短 acquire：**connection refused** 快速失败（**不**长挂 TCP），供 **`indexer-status`** 快照 / **`live_reconcile`** SQL 路径单测复用。
pub(crate) fn dead_gate_test_pool() -> sqlx::PgPool {
    PgPoolOptions::new()
        .max_connections(1)
        .acquire_timeout(Duration::from_millis(500))
        .connect_lazy("postgres://nouser:nopass@127.0.0.1:1/traveltrust_test_gate")
        .expect("lazy dead pool for gate tests")
}

/// 链与 indexer 内存态已就绪，但 **无** `chain_off.db_pool`（与本地无 DATABASE_URL 一致）。
pub(crate) fn build_state_chain_ready_no_db_pool() -> ApiMetaState {
    let mut s = build_state();
    s.chain_config = Some(chain::ChainConfig {
        rpc_url: "http://127.0.0.1:8545".to_string(),
        chain_id: 137,
        ..Default::default()
    });
    s.indexer_state = Some(chain::indexer::new_indexer_state());
    s
}

/// `chain_config` 已设但 **无** `indexer_state` / **无** `chain_off.db_pool`（replay / reorg-rewind 第二道门禁）。
pub(crate) fn build_state_chain_only_no_indexer_no_db_pool() -> ApiMetaState {
    let mut s = build_state();
    s.chain_config = Some(chain::ChainConfig {
        rpc_url: "http://127.0.0.1:8545".to_string(),
        chain_id: 137,
        escrow_factory_address: Some("0x0000000000000000000000000000000000000001".to_string()),
        ..Default::default()
    });
    s.indexer_state = None;
    s
}

/// **`PgPool` 已挂载**（lazy）但 **无** `chain_config`。`indexer-status` 会先跑 **`snapshot_last_stored_orders_projection_reconcile`**：死端口快照快速失败；**`live_reconcile`** 仍命中 **`chain_not_configured`**（**不**跑对账 SQL）。
pub(crate) fn build_state_db_pool_but_no_chain_config() -> ApiMetaState {
    let mut s = build_state();
    s.chain_off = Some(ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(dead_gate_test_pool()),
    });
    s
}

/// 链配置 + indexer 句柄 + **死** `PgPool`（与 **DB 宕机/DSN 错** 同类：**能**进到对账 SQL，**会**失败）。
pub(crate) fn build_state_chain_ready_with_dead_db_pool() -> ApiMetaState {
    let mut s = build_state_chain_ready_no_db_pool();
    s.chain_off = Some(ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(dead_gate_test_pool()),
    });
    s
}

pub(crate) fn build_state() -> ApiMetaState {
    ApiMetaState {
        strict_ssot: false,
        ssot_version: "test".to_string(),
        ssot_sha256_expected: None,
        ssot_sha256_computed: None,
        ssot_sha256_match: true,
        chargeback_policy: "warn".to_string(),
        finality_n: 12,
        indexer_state_path: "test".to_string(),
        indexer_checkpoint: ProjectorCheckpoint {
            block_number: 100,
            log_index: 3,
        },
        indexer_last_seen_finality_n: 12,
        indexer_replay_required: false,
        pause_mode: false,
        pause_api_allowlist: "".to_string(),
        degraded_mode: false,
        authority_source: "db_projection".to_string(),
        indexer_lag_blocks: 0,
        indexer_lag_max_blocks: 0,
        reorg_detected: false,
        evidence_timestamp_policy: "backend_signed".to_string(),
        evidence_time_state: Arc::new(RwLock::new(EvidenceTimeState {
            last_seen_utc_rfc3339: Utc::now().to_rfc3339(),
        })),
        evidence_time_state_path: "test".to_string(),
        evidence_receipt_hmac_key: None,
        reconcile_export_ed25519_key: None,
        order_deadline_clock: Arc::new(crate::order_deadline_clock::SystemOrderDeadlineClock),
        chain_off: None,
        jurisdiction_country_ledger_registry: Arc::new(
            crate::jurisdiction_country_ledger_template::JurisdictionCountryLedgerRegistry::empty(),
        ),
        chain_config: None,
        resolution_outbox: None,
        indexer_state: None,
        indexer_tick_fail_skip_bucket_obs_last: Arc::new(RwLock::new(None)),
        guide_upload_rate: Arc::new(RwLock::new(HashMap::new())),
        community_media_upload_rate: Arc::new(RwLock::new(HashMap::new())),
    }
}
