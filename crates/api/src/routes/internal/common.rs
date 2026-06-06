//! Shared helpers for `internal` routes (B-181 split).
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use chrono::Utc;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::collections::BTreeMap;

use crate::chain;
use crate::db;
use crate::state::ApiMetaState;

pub(crate) fn normalize_hex_addr(a: &str) -> String {
    let s = a.trim_start_matches("0x");
    format!("0x{}", s.to_lowercase())
}

/// Identical `Json` body when internal community / scheduler paths have no `db_pool`.
pub(crate) fn json_internal_db_unavailable_error() -> Json<Value> {
    Json(json!({"status": "error", "error": "db_unavailable", "message": "db_unavailable"}))
}

/// FeeRouter / RegionVault 投影表按链行数摘要；任一查失败返回 `None`（不阻断主对账）。
pub(crate) async fn economic_projection_row_counts_for_chain(
    pool: &PgPool,
    chain_id: i64,
) -> Option<Value> {
    match (
        db::fee_router_routed_stats(pool, Some(chain_id)).await,
        db::region_vault_forwarded_stats(pool, Some(chain_id)).await,
    ) {
        (Ok(fr), Ok(rv)) => Some(json!({
            "fee_router_routed_events": {
                "rows_total": fr.total,
                "max_block_number": fr.max_block_number,
                "min_block_number": fr.min_block_number,
                "latest_inserted_at": fr.latest_inserted_at.map(|t| t.to_rfc3339()),
            },
            "region_vault_forwarded_events": {
                "rows_total": rv.total,
                "max_block_number": rv.max_block_number,
                "min_block_number": rv.min_block_number,
                "latest_inserted_at": rv.latest_inserted_at.map(|t| t.to_rfc3339()),
            },
        })),
        _ => None,
    }
}

/// **TT-B171**：**`multi_table_chain_observability`** 顶层壳（**B-176** 在同一壳内增列，**不**新顶层键）。
pub(crate) fn multi_table_chain_observability_v1(
    config_chain_id: u64,
    reconcile_chain_id: u64,
    matrix_rows: Vec<Value>,
) -> Value {
    json!({
        "anchor": "171-MULTI-TABLE-CHAIN-OBSERVABILITY-V1",
        "schema_version": 1,
        "observed_at": Utc::now().to_rfc3339(),
        "runtime": {
            "config_chain_id": config_chain_id,
            "reconcile_chain_id": reconcile_chain_id,
        },
        "multi_table_chain_matrix": {
            "rows": matrix_rows,
        },
    })
}

/// **TT-B169**：**reorg / hash** 哨兵只读汇总（**`eth_getBlockByNumber(last_indexed_block)`** 与内存 **`last_block_hash`** 对读；**复用** **`chain::indexer::reorg_detected`**；**不**改 **B-114-5** rewind 语义；**不**参与 compound gate）。
pub(crate) async fn reorg_sentinel_observability_v1(state: &ApiMetaState, rpc_url: &str) -> Value {
    let (last_block, last_log_index, checkpoint_source) =
        state.indexer_checkpoint_for_observability().await;
    let last_block_hash = if let Some(ref h) = state.indexer_state {
        h.read().await.last_block_hash.clone()
    } else {
        String::new()
    };

    let hash_compare_at_indexed_height = if state.indexer_state.is_none() {
        json!({
            "attempted": false,
            "skipped_reason": "indexer_state_unavailable",
            "rpc_ok": Value::Null,
            "canonical_last_block_hash": Value::Null,
            "hash_mismatch_at_last_indexed_block": Value::Null,
            "rpc_error": Value::Null,
        })
    } else if last_block_hash.trim().is_empty() {
        json!({
            "attempted": false,
            "skipped_reason": "empty_stored_last_block_hash",
            "rpc_ok": Value::Null,
            "canonical_last_block_hash": Value::Null,
            "hash_mismatch_at_last_indexed_block": Value::Null,
            "rpc_error": Value::Null,
        })
    } else {
        match chain::indexer::get_block_hash_at(rpc_url.trim(), last_block).await {
            Ok(canonical) => {
                let mismatch = chain::indexer::reorg_detected(&last_block_hash, &canonical);
                json!({
                    "attempted": true,
                    "skipped_reason": Value::Null,
                    "rpc_ok": true,
                    "canonical_last_block_hash": canonical,
                    "hash_mismatch_at_last_indexed_block": mismatch,
                    "rpc_error": Value::Null,
                })
            }
            Err(e) => json!({
                "attempted": true,
                "skipped_reason": Value::Null,
                "rpc_ok": false,
                "canonical_last_block_hash": Value::Null,
                "hash_mismatch_at_last_indexed_block": Value::Null,
                "rpc_error": e,
            }),
        }
    };

    json!({
        "anchor": "169-REORG-SENTINEL-OBS-V1",
        "schema_version": 1,
        "observed_at": Utc::now().to_rfc3339(),
        "state_reorg_detected": state.reorg_detected,
        "memory": {
            "last_block": last_block,
            "last_log_index": last_log_index,
            "last_block_hash": last_block_hash,
            "checkpoint_source": checkpoint_source,
        },
        "hash_compare_at_indexed_height": hash_compare_at_indexed_height,
    })
}

/// **TT-B170**：**tip / finalized 上界 / last_indexed** 同源并列只读（**`eth_blockNumber`** + **`indexer_finalized_upper_bound`** + **`indexer_checkpoint_for_observability`**；**不**参与 **`chain_observation`** compound；**不**改 **B-127** tick 上界算法）。
pub(crate) async fn indexer_finality_triple_observability_v1(
    state: &ApiMetaState,
    rpc_url: &str,
) -> Value {
    let (last_block, last_log_index, checkpoint_source) =
        state.indexer_checkpoint_for_observability().await;
    let finality_n = state.finality_n;

    let (rpc_ok, tip, rpc_error, finalized_upper) =
        match chain::indexer::get_latest_block(rpc_url.trim()).await {
            Ok(t) => (
                true,
                Some(t),
                Value::Null,
                Some(chain::indexer::indexer_finalized_upper_bound(t, finality_n)),
            ),
            Err(e) => (false, None, json!(e), None),
        };

    let read_only_gap_blocks_chain_tip_minus_last_indexed =
        tip.map(|t| t.saturating_sub(last_block));

    json!({
        "anchor": "170-INDEXER-FINALITY-TRIPLE-OBS-V1",
        "schema_version": 1,
        "observed_at": Utc::now().to_rfc3339(),
        "finality_n_used": finality_n,
        "triple": {
            "eth_chain_tip_block_number": tip,
            "indexer_finalized_upper_bound": finalized_upper,
            "last_indexed_block_number": last_block,
            "last_indexed_log_index": last_log_index,
            "checkpoint_source": checkpoint_source,
        },
        "rpc": {
            "rpc_ok": rpc_ok,
            "rpc_error": rpc_error,
        },
        "read_only_gap_blocks_chain_tip_minus_last_indexed": read_only_gap_blocks_chain_tip_minus_last_indexed,
    })
}

/// **TT-B174**：由 **`indexer_tick`** 成功结束时写入进程态；**reconcile** 只读克隆。
pub(crate) fn indexer_tick_fail_skip_bucket_observability_v1(
    tick_completed_at_rfc3339: String,
    logs_fetch_skipped: &[Value],
    events_applied: u32,
    events_new: u32,
) -> Value {
    let mut by_scope: BTreeMap<String, u32> = BTreeMap::new();
    for entry in logs_fetch_skipped {
        let scope = entry
            .get("scope")
            .and_then(|s| s.as_str())
            .unwrap_or("unknown")
            .to_string();
        *by_scope.entry(scope).or_insert(0) += 1;
    }
    let mut skipped_buckets: Vec<Value> = by_scope
        .into_iter()
        .map(|(reason_scope, count)| {
            json!({
                "kind": "supplemental_log_fetch_skipped",
                "reason_scope": reason_scope,
                "count": count,
            })
        })
        .collect();

    let dedup = events_applied.saturating_sub(events_new);
    if dedup > 0 {
        skipped_buckets.push(json!({
            "kind": "checkpoint_dedup_skipped",
            "reason": "chain_block_log_already_indexed",
            "count": dedup,
        }));
    }

    json!({
        "anchor": "174-INDEXER-TICK-FAIL-SKIP-BUCKET-OBS-V1",
        "schema_version": 1,
        "tick_completed_at": tick_completed_at_rfc3339,
        "skipped_events": {
            "raw_entries_total": logs_fetch_skipped.len(),
            "buckets": skipped_buckets,
        },
        "failed_events": {
            "buckets": Value::Array(vec![]),
            "note": "Hard tick failures return HTTP 5xx before snapshot; no per-tick failed accumulator (B-174 read-only).",
        },
    })
}

/// **B-174**：尚无成功 tick 快照时 **reconcile** 占位（**不**伪造计数）。
pub(crate) fn indexer_tick_fail_skip_bucket_observability_no_snapshot_yet() -> Value {
    json!({
        "anchor": "174-INDEXER-TICK-FAIL-SKIP-BUCKET-OBS-V1",
        "schema_version": 1,
        "tick_completed_at": Value::Null,
        "skipped_events": {
            "raw_entries_total": 0,
            "buckets": Value::Array(vec![]),
        },
        "failed_events": {
            "buckets": Value::Array(vec![]),
            "note": "Hard tick failures return HTTP 5xx before snapshot; no per-tick failed accumulator (B-174 read-only).",
        },
        "observation_note": "no_completed_tick_snapshot_yet",
    })
}

/// **`INTERNAL_API_SECRET`** 由 **`internal_api_secret_gate_layer`** 统一校验；handler 内保留钩子以兼容 **96-18** 子路由测试。
pub fn internal_operator_secret_required_response() -> Option<Response> {
    None
}

/// **`ONBOARDING_INTERNAL_WEBHOOK_REQUIRE_HTTPS_FORWARDED`** / **`ONBOARDING_INTERNAL_WEBHOOK_ALLOWLIST_CIDRS`** 可选边缘闸。
pub fn onboarding_internal_webhook_request_gate_response(headers: &HeaderMap) -> Option<Response> {
    use serde_json::json;
    use std::env;

    if env::var("ONBOARDING_INTERNAL_WEBHOOK_REQUIRE_HTTPS_FORWARDED").as_deref() == Ok("1") {
        let proto = headers
            .get("x-forwarded-proto")
            .and_then(|v| v.to_str().ok())
            .unwrap_or("");
        if proto.trim().eq_ignore_ascii_case("https") == false {
            return Some(
                (
                    StatusCode::FORBIDDEN,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_webhook_https_required",
                        "message": "onboarding_webhook_https_required",
                    })),
                )
                    .into_response(),
            );
        }
    }

    let allowlist = env::var("ONBOARDING_INTERNAL_WEBHOOK_ALLOWLIST_CIDRS")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    if let Some(list) = allowlist {
        let client = headers
            .get("x-forwarded-for")
            .and_then(|v| v.to_str().ok())
            .and_then(|s| s.split(',').next())
            .map(str::trim)
            .unwrap_or("");
        let allowed = list.split(',').map(str::trim).any(|entry| {
            if let Some(base) = entry.strip_suffix("/32") {
                client == base
            } else {
                client == entry
            }
        });
        if !allowed {
            return Some(
                (
                    StatusCode::FORBIDDEN,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_webhook_ip_not_allowed",
                        "message": "onboarding_webhook_ip_not_allowed",
                    })),
                )
                    .into_response(),
            );
        }
    }

    None
}

