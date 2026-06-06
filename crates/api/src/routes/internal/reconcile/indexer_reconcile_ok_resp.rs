//! HTTP 200 JSON body assembly for indexer-reconcile OK path.
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::db;
use crate::state::ApiMetaState;

use super::body::IndexerReconcileBody;
use super::indexer_reconcile_ok_types::IndexerReconcileOkAfterSsot;

pub(crate) async fn run(
    state: &ApiMetaState,
    pool: &PgPool,
    body: &Option<Json<IndexerReconcileBody>>,
    stats: db::OrdersProjectionReconcileStats,
    chain_id: u64,
    chain_id_i64: i64,
    mid: IndexerReconcileOkAfterSsot,
) -> Result<Value, axum::response::Response> {
    let mut resp_body = json!({
        "status": "ok",
        "task": "indexer_reconcile_orders_projection",
        "chain_id": chain_id,
        "checkpoint": {
            "block_number": state.indexer_checkpoint.block_number,
            "log_index": state.indexer_checkpoint.log_index
        },
        "reorg_detected": state.reorg_detected,
        "issues_total": stats.issues_total,
        "projection_reconcile_clean": stats.projection_reconcile_clean,
        "reconcile_compound_pass": mid.reconcile_compound_pass,
        "orders_projection_reconcile_gate": mid.orders_projection_gate_for_http,
        "indexer_reconcile_compound_gate": mid.compound_gate,
        "orders_deadline_ssot_ops_check": mid.orders_deadline_ops_check,
        "governor_view_params_ssot_ops_check": mid.governor_view_params_ops_check,
        "timelock_delay_ssot_ops_check": mid.timelock_delay_ops_check,
        "governor_proposal_threshold_ssot_ops_check": mid.governor_proposal_threshold_ops_check,
        "timelock_governor_admin_ssot_ops_check": mid.timelock_governor_admin_ops_check,
        "governor_proposal_count_ssot_ops_check": mid.governor_proposal_count_ops_check,
        "ssot_parallel_chain_snapshot": mid.ssot_parallel_chain_snapshot,
        "ssot_parallel_chain_snapshot_gate": mid.ssot_parallel_chain_snapshot_gate,
        "stats": stats,
        "report_id": mid.report_id.map(|id| id.to_string()),
        "chain_context": mid.obs.chain_context,
    });
    if let Some(s) = mid.obs.rpc_samples {
        resp_body["rpc_escrow_samples"] = json!(s);
    };    if let Some(s) = mid.obs.rpc_skip {
        resp_body["rpc_escrow_samples_skipped"] = json!(s);
    };    if let Some(m) = mid.obs.rpc_sample_meta {
        resp_body["rpc_escrow_sample_meta"] = m;
    };    if let Some(c) = mid.obs.economic_projection_row_counts {
        resp_body["economic_projection_row_counts"] = c;
    };    if let Some(co) = mid.obs.chain_observation {
        resp_body["chain_observation"] = co;
    };    if let Some(ev) = mid.obs.event_log_escrow_coverage {
        resp_body["event_log_escrow_coverage"] = ev;
    };    if let Some(fr) = mid.obs.fee_router_log_verify {
        resp_body["fee_router_log_verify"] = fr;
    };    if let Some(rv) = mid.obs.region_vault_log_verify {
        resp_body["region_vault_log_verify"] = rv;
    };    if let Some(m) = mid.obs.multi_table_chain_observability {
        resp_body["multi_table_chain_observability"] = m;
    };    if let Some(r) = mid.obs.reorg_sentinel_observability {
        resp_body["reorg_sentinel_observability"] = r;
    };    if let Some(f) = mid.obs.indexer_finality_triple_observability {
        resp_body["indexer_finality_triple_observability"] = f;
    };    if let Some(b) = mid.obs.indexer_tick_fail_skip_bucket_observability {
        resp_body["indexer_tick_fail_skip_bucket_observability"] = b;
    };    if let Some(g) = mid.obs.governor_proposal_tail_drift_observability {
        resp_body["governor_proposal_tail_drift_observability"] = g;
    };    if let Some(g) = mid
        .obs
        .governor_proposal_state_chain_vs_projection_observability
    {
        resp_body["governor_proposal_state_chain_vs_projection_observability"] = g;
    };    if let Some(t) = mid.obs.timelock_delay_meta_mirror_observability {
        resp_body["timelock_delay_meta_mirror_observability"] = t;
    };    if let Some(g) = mid.obs.governance_pool_meta_chain_alignment_observability {
        resp_body["governance_pool_meta_chain_alignment_observability"] = g;
    }
    resp_body["orders_chain_health_observability"] = mid.obs.orders_chain_health_observability;
    resp_body["indexer_reconcile_duration_batch_stats_observability"] =
        mid.obs.indexer_reconcile_duration_batch_stats_observability;
    if let Some(t) = mid.orders_chain_health_trend_snapshot_for_resp {
        resp_body["orders_chain_health_trend_snapshot"] = t;
    };    if body
        .as_ref()
        .is_some_and(|j| j.0.orders_chain_id_backfill_dry_run)
    {
        let list_scope_business = state
            .chain_off
            .as_ref()
            .and_then(|co| co.config.business_chain_id);
        match db::orders_chain_id_backfill_dry_run_summary(pool, chain_id_i64, list_scope_business)
            .await
        {
            Ok(s) => {
                resp_body["orders_chain_id_backfill_dry_run"] =
                    serde_json::to_value(&s).unwrap_or_else(|_| json!({}));
            }
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "orders_chain_id_backfill_dry_run_failed",
                        e.to_string(),
                    )),
                )
                    .into_response());
            }
        }
    };    if body.as_ref().is_some_and(|j| j.0.backfill_orders_chain_id) {
        match db::backfill_orders_chain_id_from_projection(pool, chain_id_i64).await {
            Ok(n) => {
                resp_body["orders_chain_id_backfill"] = json!({
                    "chain_id": chain_id,
                    "updated_rows": n
                });
            }
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "backfill_orders_chain_id_failed",
                        e.to_string(),
                    )),
                )
                    .into_response());
            }
        }
    };    if body
        .as_ref()
        .is_some_and(|j| j.0.orders_chain_scope_rollback_dry_run)
    {
        match db::orders_chain_scope_rollback_dry_run(pool, chain_id_i64).await {
            Ok(d) => {
                let mut v = serde_json::to_value(d).unwrap_or_else(|_| json!({}));
                if let Some(obj) = v.as_object_mut() {
                    obj.insert(
                        "anchor".to_string(),
                        json!("110-ORDERS-CHAIN-SCOPE-DRY-RUN"),
                    );
                    obj.insert(
                        "target_note".to_string(),
                        json!("chain-scoped DELETE/rewrite of all business orders remains Target; requires dual-gated persist API + 01/03 review after chain_id normalization"),
                    );
                }
                resp_body["orders_chain_scope_rollback_dry_run"] = v;
            }
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "orders_chain_scope_rollback_dry_run_failed",
                        e.to_string(),
                    )),
                )
                    .into_response());
            }
        }
    };    if body
        .as_ref()
        .is_some_and(|j| j.0.orders_chain_scope_rollback_execute)
    {
        let allowed = matches!(
            std::env::var("TRAVELTRUST_ALLOW_ORDERS_CHAIN_SCOPE_ROLLBACK").as_deref(),
            Ok(v) if v.trim() == "1"
        );
        if !allowed {
            return Err((
                StatusCode::FORBIDDEN,
                Json(crate::api_json::err_key_detail(
                    "orders_chain_scope_rollback_execute_forbidden",
                    "set TRAVELTRUST_ALLOW_ORDERS_CHAIN_SCOPE_ROLLBACK=1 on the API process to enable destructive chain-scoped order rollback",
                )),
            )
                .into_response());
        };        let expected = db::orders_chain_scope_rollback_expected_confirm(chain_id_i64);
        let got = body
            .as_ref()
            .and_then(|j| j.0.orders_chain_scope_rollback_confirm.as_deref())
            .unwrap_or("");
        if got != expected.as_str() {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "orders_chain_scope_rollback_execute_confirm_mismatch",
                    format!(
                        "orders_chain_scope_rollback_confirm must equal {:?} for this request chain_id",
                        expected
                    ),
                )),
            )
                .into_response());
        };        match db::orders_chain_scope_rollback_execute(pool, chain_id_i64).await {
            Ok(summary) => {
                let mut v = serde_json::to_value(summary).unwrap_or_else(|_| json!({}));
                if let Some(obj) = v.as_object_mut() {
                    obj.insert(
                        "anchor".to_string(),
                        json!("110-ORDERS-CHAIN-SCOPE-EXECUTE"),
                    );
                    obj.insert(
                        "note".to_string(),
                        json!("deleted orders where chain_id matches request only; orders with NULL or other chain_id untouched; itineraries/order_messages CASCADE; requires 01/03 review for production use"),
                    );
                }
                resp_body["orders_chain_scope_rollback_execute"] = v;
            }
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "orders_chain_scope_rollback_execute_failed",
                        e.to_string(),
                    )),
                )
                    .into_response());
            }
        }
    };    if body
        .as_ref()
        .is_some_and(|j| j.0.event_log_chain_scope_rollback_dry_run)
    {
        match db::event_log_chain_scope_rollback_dry_run(pool, chain_id_i64).await {
            Ok(d) => {
                let mut v = serde_json::to_value(d).unwrap_or_else(|_| json!({}));
                if let Some(obj) = v.as_object_mut() {
                    obj.insert(
                        "anchor".to_string(),
                        json!("110-EVENT-LOG-CHAIN-SCOPE-DRY-RUN"),
                    );
                    obj.insert(
                        "target_note".to_string(),
                        json!("does not reset in-process indexer memory by itself; after wipe use sync_indexer_memory_from_db_checkpoint + TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1 (110-INDEXER-MEMORY-SYNC-FROM-DB) or restart API / tick·replay; pair with orders_chain_scope rollback if full chain data reset"),
                    );
                }
                resp_body["event_log_chain_scope_rollback_dry_run"] = v;
            }
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "event_log_chain_scope_rollback_dry_run_failed",
                        e.to_string(),
                    )),
                )
                    .into_response());
            }
        }
    };    if body
        .as_ref()
        .is_some_and(|j| j.0.event_log_chain_scope_rollback_execute)
    {
        let allowed = matches!(
            std::env::var("TRAVELTRUST_ALLOW_EVENT_LOG_CHAIN_SCOPE_ROLLBACK").as_deref(),
            Ok(v) if v.trim() == "1"
        );
        if !allowed {
            return Err((
                StatusCode::FORBIDDEN,
                Json(crate::api_json::err_key_detail(
                    "event_log_chain_scope_rollback_execute_forbidden",
                    "set TRAVELTRUST_ALLOW_EVENT_LOG_CHAIN_SCOPE_ROLLBACK=1 on the API process to enable destructive chain-scoped event_log/checkpoint/fee_router/region_vault projection rollback",
                )),
            )
                .into_response());
        };        let expected = db::event_log_chain_scope_rollback_expected_confirm(chain_id_i64);
        let got = body
            .as_ref()
            .and_then(|j| j.0.event_log_chain_scope_rollback_confirm.as_deref())
            .unwrap_or("");
        if got != expected.as_str() {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "event_log_chain_scope_rollback_execute_confirm_mismatch",
                    format!(
                        "event_log_chain_scope_rollback_confirm must equal {:?} for this request chain_id",
                        expected
                    ),
                )),
            )
                .into_response());
        };        match db::event_log_chain_scope_rollback_execute(pool, chain_id_i64).await {
            Ok(summary) => {
                let mut v = serde_json::to_value(summary).unwrap_or_else(|_| json!({}));
                if let Some(obj) = v.as_object_mut() {
                    obj.insert(
                        "anchor".to_string(),
                        json!("110-EVENT-LOG-CHAIN-SCOPE-EXECUTE"),
                    );
                    obj.insert(
                        "note".to_string(),
                        json!("deleted event_log, checkpoints_sharded, fee_router_routed_events, region_vault_forwarded_events for chain_id; pair with sync_indexer_memory_from_db_checkpoint + TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1 to align in-memory indexer without restart (110-INDEXER-MEMORY-SYNC-FROM-DB)"),
                    );
                }
                resp_body["event_log_chain_scope_rollback_execute"] = v;
            }
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "event_log_chain_scope_rollback_execute_failed",
                        e.to_string(),
                    )),
                )
                    .into_response());
            }
        }
    }

    Ok(resp_body)
}
