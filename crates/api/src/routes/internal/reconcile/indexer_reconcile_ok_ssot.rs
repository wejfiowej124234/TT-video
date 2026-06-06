//! SSOT bundles, compound gate, summary, and optional persist for indexer-reconcile OK path.
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use crate::db;
use crate::routes::internal::reconcile_gates;
use crate::state::ApiMetaState;

use super::body::IndexerReconcileBody;
use super::indexer_reconcile_ok_types::{IndexerReconcileOkAfterSsot, IndexerReconcileOkObs};

pub(crate) async fn run(
    state: &ApiMetaState,
    pool: &PgPool,
    body: &Option<Json<IndexerReconcileBody>>,
    stats: &db::OrdersProjectionReconcileStats,
    chain_id: u64,
    chain_id_i64: i64,
    persist: bool,
    obs: IndexerReconcileOkObs,
) -> Result<IndexerReconcileOkAfterSsot, axum::response::Response> {
    let rpc_samples_slice: Option<&[serde_json::Value]> = obs.rpc_samples.as_deref();

    let (_orders_deadline_hint, orders_deadline_ops_check) =
        crate::chain_off::orders_deadline_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let od_exit_ok = orders_deadline_ops_check
        .get("exit_code_hint")
        .and_then(|v| v.as_u64())
        == Some(0);
    let orders_deadline_ssot_reconcile_branch = json!({
        "participates": true,
        "pass": od_exit_ok,
        "state": if od_exit_ok { "ops_check_exit_0" } else { "ops_check_exit_nonzero" },
        "anchor_child": "B110-SEQ3-ORDERS-DEADLINE-SSOT-RECONCILE",
        "exit_code_hint": orders_deadline_ops_check.get("exit_code_hint").cloned().unwrap_or(json!(1)),
        "overall": orders_deadline_ops_check.get("overall").cloned().unwrap_or(json!("fail")),
        "rule": "TT-B110-SEQ3-ORDERS-DEADLINE-INDEXER-RECONCILE-CHECK-001: same evaluation as GET …/admin/observability/overview.orders_deadline_ssot_ops_check; AND into reconcile_compound_pass without changing public orders HTTP shapes."
    });

    let (_gv_hint, governor_view_params_ops_check) =
        crate::chain_off::governor_view_params_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let gv_exit_ok = governor_view_params_ops_check
        .get("exit_code_hint")
        .and_then(|v| v.as_u64())
        == Some(0);
    let governor_view_params_ssot_reconcile_branch = json!({
        "participates": true,
        "pass": gv_exit_ok,
        "state": if gv_exit_ok { "ops_check_exit_0" } else { "ops_check_exit_nonzero" },
        "anchor_child": "B110-SEQ5-GOVERNOR-VIEW-PARAMS-SSOT-RECONCILE",
        "exit_code_hint": governor_view_params_ops_check.get("exit_code_hint").cloned().unwrap_or(json!(1)),
        "overall": governor_view_params_ops_check.get("overall").cloned().unwrap_or(json!("fail")),
        "rule": "TT-B110-SEQ5-GOVERNANCE-GOVERNOR-VIEW-PARAMS-CHAIN-SSOT-001: same evaluation as GET …/admin/observability/overview.governor_view_params_ssot_ops_check; AND into reconcile_compound_pass; does not change GET /api/v1/orders*."
    });

    let (_gtt_hint, governor_token_timelock_ops_check) =
        crate::chain_off::governor_token_timelock_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let gtt_exit_ok = governor_token_timelock_ops_check
        .get("exit_code_hint")
        .and_then(|v| v.as_u64())
        == Some(0);
    let governor_token_timelock_ssot_reconcile_branch = json!({
        "participates": true,
        "pass": gtt_exit_ok,
        "state": if gtt_exit_ok { "ops_check_exit_0" } else { "ops_check_exit_nonzero" },
        "anchor_child": "B110-SEQ11-GOVERNOR-TOKEN-TIMELOCK-SSOT-RECONCILE",
        "exit_code_hint": governor_token_timelock_ops_check.get("exit_code_hint").cloned().unwrap_or(json!(1)),
        "overall": governor_token_timelock_ops_check.get("overall").cloned().unwrap_or(json!("fail")),
        "rule": "TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001: same evaluation as GET …/admin/observability/overview.governor_token_timelock_ssot_ops_check; AND into reconcile_compound_pass; does not change GET /api/v1/orders*."
    });

    let (_tl_hint, timelock_delay_ops_check) =
        crate::chain_off::timelock_delay_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let tl_exit_ok = timelock_delay_ops_check
        .get("exit_code_hint")
        .and_then(|v| v.as_u64())
        == Some(0);
    let timelock_delay_ssot_reconcile_branch = json!({
        "participates": true,
        "pass": tl_exit_ok,
        "state": if tl_exit_ok { "ops_check_exit_0" } else { "ops_check_exit_nonzero" },
        "anchor_child": "B110-SEQ6-TIMELOCK-DELAY-SSOT-RECONCILE",
        "exit_code_hint": timelock_delay_ops_check.get("exit_code_hint").cloned().unwrap_or(json!(1)),
        "overall": timelock_delay_ops_check.get("overall").cloned().unwrap_or(json!("fail")),
        "rule": "TT-B110-SEQ6-GOVERNANCE-TIMELOCK-DELAY-CHAIN-SSOT-001: same evaluation as GET …/admin/observability/overview.timelock_delay_ssot_ops_check; AND into reconcile_compound_pass; does not change GET /api/v1/orders*."
    });

    let (_pt_hint, governor_proposal_threshold_ops_check) =
        crate::chain_off::proposal_threshold_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let pt_exit_ok = governor_proposal_threshold_ops_check
        .get("exit_code_hint")
        .and_then(|v| v.as_u64())
        == Some(0);
    let governor_proposal_threshold_ssot_reconcile_branch = json!({
        "participates": true,
        "pass": pt_exit_ok,
        "state": if pt_exit_ok { "ops_check_exit_0" } else { "ops_check_exit_nonzero" },
        "anchor_child": "B110-SEQ8-GOVERNOR-PROPOSAL-THRESHOLD-SSOT-RECONCILE",
        "exit_code_hint": governor_proposal_threshold_ops_check.get("exit_code_hint").cloned().unwrap_or(json!(1)),
        "overall": governor_proposal_threshold_ops_check.get("overall").cloned().unwrap_or(json!("fail")),
        "rule": "TT-B110-SEQ8-GOVERNANCE-GOVERNOR-PROPOSAL-THRESHOLD-CHAIN-SSOT-001: same evaluation as GET …/admin/observability/overview.governor_proposal_threshold_ssot_ops_check; AND into reconcile_compound_pass; does not change GET /api/v1/orders*."
    });

    let (_tga_hint, timelock_governor_admin_ops_check) =
        crate::chain_off::timelock_governor_admin_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let tga_exit_ok = timelock_governor_admin_ops_check
        .get("exit_code_hint")
        .and_then(|v| v.as_u64())
        == Some(0);
    let timelock_governor_admin_ssot_reconcile_branch = json!({
        "participates": true,
        "pass": tga_exit_ok,
        "state": if tga_exit_ok { "ops_check_exit_0" } else { "ops_check_exit_nonzero" },
        "anchor_child": "B110-SEQ9-TIMELOCK-GOVERNOR-ADMIN-SSOT-RECONCILE",
        "exit_code_hint": timelock_governor_admin_ops_check.get("exit_code_hint").cloned().unwrap_or(json!(1)),
        "overall": timelock_governor_admin_ops_check.get("overall").cloned().unwrap_or(json!("fail")),
        "rule": "TT-B110-SEQ9-GOVERNANCE-TIMELOCK-GOVERNOR-ADMIN-CHAIN-SSOT-001: same evaluation as GET …/admin/observability/overview.timelock_governor_admin_ssot_ops_check; AND into reconcile_compound_pass; does not change GET /api/v1/orders*."
    });

    let (_gpc_hint, governor_proposal_count_ops_check) =
        crate::chain_off::proposal_count_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let gpc_exit_ok = governor_proposal_count_ops_check
        .get("exit_code_hint")
        .and_then(|v| v.as_u64())
        == Some(0);
    let governor_proposal_count_ssot_reconcile_branch = json!({
        "participates": true,
        "pass": gpc_exit_ok,
        "state": if gpc_exit_ok { "ops_check_exit_0" } else { "ops_check_exit_nonzero" },
        "anchor_child": "B110-SEQ10-GOVERNOR-PROPOSAL-COUNT-SSOT-RECONCILE",
        "exit_code_hint": governor_proposal_count_ops_check.get("exit_code_hint").cloned().unwrap_or(json!(1)),
        "overall": governor_proposal_count_ops_check.get("overall").cloned().unwrap_or(json!("fail")),
        "rule": "TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001: same evaluation as GET …/admin/observability/overview.governor_proposal_count_ssot_ops_check; AND into reconcile_compound_pass; does not change GET /api/v1/orders*."
    });

    let (reconcile_compound_pass, compound_gate) = reconcile_gates::indexer_reconcile_compound_gate(
        &obs.reconcile_gate_value,
        obs.want_rpc.is_some(),
        obs.rpc_skip,
        rpc_samples_slice,
        body.as_ref()
            .is_some_and(|j| j.0.include_event_log_escrow_coverage),
        obs.event_log_escrow_coverage.as_ref(),
        obs.fee_router_log_verify.as_ref(),
        obs.region_vault_log_verify.as_ref(),
        obs.chain_observation.as_ref(),
        Some(orders_deadline_ssot_reconcile_branch),
        Some(governor_view_params_ssot_reconcile_branch),
        Some(governor_token_timelock_ssot_reconcile_branch),
        Some(timelock_delay_ssot_reconcile_branch),
        Some(governor_proposal_threshold_ssot_reconcile_branch),
        Some(timelock_governor_admin_ssot_reconcile_branch),
        Some(governor_proposal_count_ssot_reconcile_branch),
    );

    let ssot_parallel_chain_snapshot =
        crate::routes::governance::pool_ssot_parallel_chain_snapshot(state).await;
    let ssot_parallel_chain_snapshot_gate =
        reconcile_gates::ssot_parallel_chain_snapshot_gate(&ssot_parallel_chain_snapshot);

    let mut summary = json!({
        "task": "indexer_reconcile_orders_projection",
        "stats": &stats,
        "orders_projection_reconcile_gate": obs.reconcile_gate_value.clone(),
        "indexer_reconcile_compound_gate": compound_gate.clone(),
        "reconcile_compound_pass": reconcile_compound_pass,
        "orders_deadline_ssot_ops_check": orders_deadline_ops_check.clone(),
        "governor_view_params_ssot_ops_check": governor_view_params_ops_check.clone(),
        "governor_token_timelock_ssot_ops_check": governor_token_timelock_ops_check.clone(),
        "timelock_delay_ssot_ops_check": timelock_delay_ops_check.clone(),
        "governor_proposal_threshold_ssot_ops_check": governor_proposal_threshold_ops_check.clone(),
        "timelock_governor_admin_ssot_ops_check": timelock_governor_admin_ops_check.clone(),
        "governor_proposal_count_ssot_ops_check": governor_proposal_count_ops_check.clone(),
        "ssot_parallel_chain_snapshot": ssot_parallel_chain_snapshot.clone(),
        "ssot_parallel_chain_snapshot_gate": ssot_parallel_chain_snapshot_gate.clone(),
        "checkpoint": {
            "block_number": state.indexer_checkpoint.block_number,
            "log_index": state.indexer_checkpoint.log_index
        },
        "reorg_detected": state.reorg_detected,
        "finality_n": state.finality_n,
        "chain_id": chain_id,
        "chain_context": obs.chain_context.clone(),
    });
    if let Some(ref s) = obs.rpc_samples {
        summary["rpc_escrow_samples"] = json!(s);
    };    if let Some(s) = obs.rpc_skip {
        summary["rpc_escrow_samples_skipped"] = json!(s);
    };    if let Some(ref m) = obs.rpc_sample_meta {
        summary["rpc_escrow_sample_meta"] = m.clone();
    };    if let Some(ref c) = obs.economic_projection_row_counts {
        summary["economic_projection_row_counts"] = c.clone();
    };    if let Some(ref co) = obs.chain_observation {
        summary["chain_observation"] = co.clone();
    };    if let Some(ref ev) = obs.event_log_escrow_coverage {
        summary["event_log_escrow_coverage"] = ev.clone();
    };    if let Some(ref fr) = obs.fee_router_log_verify {
        summary["fee_router_log_verify"] = fr.clone();
    };    if let Some(ref rv) = obs.region_vault_log_verify {
        summary["region_vault_log_verify"] = rv.clone();
    };    if let Some(ref m) = obs.multi_table_chain_observability {
        summary["multi_table_chain_observability"] = m.clone();
    };    if let Some(ref r) = obs.reorg_sentinel_observability {
        summary["reorg_sentinel_observability"] = r.clone();
    };    if let Some(ref f) = obs.indexer_finality_triple_observability {
        summary["indexer_finality_triple_observability"] = f.clone();
    };    if let Some(ref b) = obs.indexer_tick_fail_skip_bucket_observability {
        summary["indexer_tick_fail_skip_bucket_observability"] = b.clone();
    };    if let Some(ref g) = obs.governor_proposal_tail_drift_observability {
        summary["governor_proposal_tail_drift_observability"] = g.clone();
    };    if let Some(ref g) = obs.governor_proposal_state_chain_vs_projection_observability {
        summary["governor_proposal_state_chain_vs_projection_observability"] = g.clone();
    };    if let Some(ref t) = obs.timelock_delay_meta_mirror_observability {
        summary["timelock_delay_meta_mirror_observability"] = t.clone();
    };    if let Some(ref g) = obs.governance_pool_meta_chain_alignment_observability {
        summary["governance_pool_meta_chain_alignment_observability"] = g.clone();
    }
    summary["orders_chain_health_observability"] = obs.orders_chain_health_observability.clone();
    summary["indexer_reconcile_duration_batch_stats_observability"] = obs
        .indexer_reconcile_duration_batch_stats_observability
        .clone();

    let orders_projection_gate_for_http =
        reconcile_gates::indexer_reconcile_orders_projection_gate_from_persist_summary(&summary);

    let mut orders_chain_health_trend_snapshot_for_resp: Option<Value> = None;

    let report_id = if persist {
        let prev_trend_snapshot = match db::get_latest_reconciliation_report_by_type(
            pool,
            db::REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS,
        )
        .await
        {
            Ok(Some(r)) => r
                .summary
                .0
                .get("orders_chain_health_trend_snapshot")
                .cloned(),
            _ => None,
        };
        let new_report_id = Uuid::new_v4();
        let trend = db::merge_orders_chain_health_trend_snapshot(
            prev_trend_snapshot.as_ref(),
            &obs.orders_chain_health_observability,
            new_report_id,
            Utc::now(),
        );
        summary["orders_chain_health_trend_snapshot"] = trend.clone();
        orders_chain_health_trend_snapshot_for_resp = Some(trend);
        match db::insert_reconciliation_report_with_id(
            pool,
            new_report_id,
            db::REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS,
            Some(chain_id_i64),
            &summary,
        )
        .await
        {
            Ok(id) => Some(id),
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "persist_reconciliation_report_failed",
                        e.to_string(),
                    )),
                )
                    .into_response());
            }
        }
    } else {
        None
    }

    Ok(IndexerReconcileOkAfterSsot {
        obs,
        orders_deadline_ops_check,
        governor_view_params_ops_check,
        governor_token_timelock_ops_check,
        timelock_delay_ops_check,
        governor_proposal_threshold_ops_check,
        timelock_governor_admin_ops_check,
        governor_proposal_count_ops_check,
        reconcile_compound_pass,
        compound_gate,
        ssot_parallel_chain_snapshot,
        ssot_parallel_chain_snapshot_gate,
        orders_projection_gate_for_http,
        report_id,
        orders_chain_health_trend_snapshot_for_resp,
    })
}
