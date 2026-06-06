//! Shared JSON builders for admin observability (04 §3.5 · Alerting v3).

use serde_json::{json, Value};
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

use crate::state::ApiMetaState;

/// **04 §3.5 · Alerting v3**：与 **`GET …/observability/overview`** 内 **`observability_alerting_v1.rules_config`** 同源装配（**ENV** 基线 + 进程 **`ApiMetaState`** 快照；**DB** **`observability_threshold_alert_config`** 未迁时 **`database_overlay`** 为 **`null`** 或 **`observation_note`** 占位）。
pub(crate) fn admin_observability_alert_rules_config(state: &ApiMetaState) -> Value {
    let chain_id = std::env::var("CHAIN_ID").unwrap_or_else(|_| "137".to_string());
    let lag_max_env = std::env::var("INDEXER_LAG_MAX_BLOCKS").unwrap_or_default();
    let mut h = DefaultHasher::new();
    chain_id.hash(&mut h);
    state.indexer_lag_max_blocks.hash(&mut h);
    state.indexer_lag_blocks.hash(&mut h);
    lag_max_env.hash(&mut h);
    let fingerprint = format!("{:016x}", h.finish());

    let pool_present = state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
        .is_some();
    let database_overlay = if pool_present {
        json!({
            "observation_note": "observability_threshold_alert_config_row_optional",
            "config_version": Value::Null,
            "updated_at": Value::Null,
        })
    } else {
        Value::Null
    }

    json!({
        "schema_version": 1,
        "anchor": "OBSERVABILITY-THRESHOLD-ALERT-RULES-CONFIG-V1",
        "config_source": "env",
        "config_fingerprint": fingerprint,
        "effective_thresholds": {
            "INDEXER_LAG_MAX_BLOCKS_effective": state.indexer_lag_max_blocks,
            "INDEXER_LAG_BLOCKS_snapshot": state.indexer_lag_blocks,
            "degraded_mode": state.degraded_mode,
            "reorg_detected": state.reorg_detected,
            "indexer_replay_required": state.indexer_replay_required
        },
        "rules_catalog": [
            {
                "rule_id": "indexer_lag_vs_max_blocks",
                "severity": "P1",
                "description": "Indexer lag vs max blocks (process snapshot; see INDEXER_LAG_* env and GET /meta metrics helpers)."
            }
        ],
        "threshold_env_keys": ["CHAIN_ID", "INDEXER_LAG_MAX_BLOCKS", "INDEXER_LAG_BLOCKS"],
        "threshold_db_json_keys": [],
        "database_overlay": database_overlay
    })
}

pub(crate) fn admin_observability_alerting_v1_bundle(state: &ApiMetaState) -> Value {
    let rules_config = admin_observability_alert_rules_config(state);
    let alert_summary = json!({
        "active": 0,
        "sev1": 0,
        "sev2": 0,
    });
    json!({
        "anchor": "OBSERVABILITY-THRESHOLD-ALERTS-V3",
        "schema_version": 3,
        "rules_config": rules_config,
        "alert_summary": alert_summary,
        "last_fired": [],
        "dedup_policy": {
            "mode": "best_effort_memory",
            "anchor": "OBSERVABILITY-THRESHOLD-ALERTS-V3"
        },
        "persist": {
            "storage": "memory_only",
            "note": "DB-backed alert state optional; see 04 §3.5 and migration 20260427000056 when enabled."
        },
        "recent_events": []
    })
}
