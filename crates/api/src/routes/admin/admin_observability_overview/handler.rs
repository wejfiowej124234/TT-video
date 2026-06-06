//! `GET …/admin/observability/overview` handler.

use axum::extract::State;
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::middleware;
use crate::state::ApiMetaState;

use crate::routes::admin::admin_observability_helpers::admin_observability_alerting_v1_bundle;
use crate::routes::admin::{
    admin_attach_meta_build, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort,
};

use super::indexer_ssot_head::load_observability_head;
use super::reconcile_snapshots::load_reconcile_snapshots;

pub async fn get_admin_observability_overview(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, actor_role) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let observability_alerting_v1 = admin_observability_alerting_v1_bundle(&state);
    let alert_summary = observability_alerting_v1
        .get("alert_summary")
        .cloned()
        .unwrap_or_else(|| json!({ "active": 0, "sev1": 0, "sev2": 0 }));

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.observability.overview.read",
        Some("observability"),
        None,
        json!({"ok": true}),
    )
    .await;

    let head = load_observability_head(&state).await;
    let overview_build = crate::routes::meta_build_value();
    let snaps =
        load_reconcile_snapshots(&state, head.expected_chain_id_for_orders_consistency).await;

    let mut body = json!({
        "status": "ok",
        "overview": {
            "chain_id": head.chain_id,
            "build": overview_build,
            "indexer": head.indexer_ov,
            "rate_limits": middleware::meta_rate_limits_snapshot(),
            "alerts": alert_summary,
            "observability_alerting_v1": observability_alerting_v1,
            "audit": {
                "mode": "best_effort_read_path"
            },
            "orders_deadline_ssot": head.orders_deadline_ssot,
            "orders_deadline_ssot_ops_check": head.orders_deadline_ssot_ops_check,
            "governor_view_params_ssot": head.governor_view_params_ssot,
            "governor_view_params_ssot_ops_check": head.governor_view_params_ssot_ops_check,
            "governor_token_timelock_ssot": head.governor_token_timelock_ssot,
            "governor_token_timelock_ssot_ops_check": head.governor_token_timelock_ssot_ops_check,
            "timelock_delay_ssot": head.timelock_delay_ssot,
            "timelock_delay_ssot_ops_check": head.timelock_delay_ssot_ops_check,
            "governor_proposal_threshold_ssot": head.governor_proposal_threshold_ssot,
            "governor_proposal_threshold_ssot_ops_check": head.governor_proposal_threshold_ssot_ops_check,
            "timelock_governor_admin_ssot": head.timelock_governor_admin_ssot,
            "timelock_governor_admin_ssot_ops_check": head.timelock_governor_admin_ssot_ops_check,
            "governor_proposal_count_ssot": head.governor_proposal_count_ssot,
            "governor_proposal_count_ssot_ops_check": head.governor_proposal_count_ssot_ops_check,
            "governor_proposal_state_chain_vs_projection_observability": head.governor_proposal_state_chain_vs_projection_observability,
            "governance_proposals_projection_null_fields_observability": snaps.governance_proposals_projection_null_fields_observability,
            "orders_chain_health_observability": snaps.orders_chain_health_observability,
            "indexer_head_vs_db_latest_block_drift_observability": snaps.indexer_head_vs_db_latest_block_drift_observability,
            "indexer_reconcile_duration_batch_stats_observability": snaps.indexer_reconcile_duration_batch_stats_observability,
            "rpc_escrow_sample_meta": snaps.rpc_escrow_sample_meta,
            "correction_executor_rows_observability": snaps.correction_executor_rows_observability,
            "orders_chain_health_trend_snapshot": snaps.orders_chain_health_trend_snapshot,
            "orders_amount_chain_vs_escrow_drift_observability": snaps.orders_amount_chain_vs_escrow_drift_observability,
            "escrow_status_chain_vs_orders_drift_observability": snaps.escrow_status_chain_vs_orders_drift_observability,
            "fee_router_fee_routes_vs_routed_events_drift_observability": snaps.fee_router_fee_routes_vs_routed_events_drift_observability,
            "vault_forwards_vs_forwarded_events_drift_observability": snaps.vault_forwards_vs_forwarded_events_drift_observability,
            "stake_lock_projection_block_lag_observability": snaps.stake_lock_projection_block_lag_observability
        },
        "actor": {
            "id": actor_id,
            "role": actor_role
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
