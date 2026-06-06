//! Indexer headline + on-chain SSOT bundles for **`GET …/observability/overview`**.

use serde_json::{json, Value};

use crate::db;
use crate::state::ApiMetaState;

pub(crate) struct ObservabilityHeadPacks {
    pub chain_id: String,
    pub expected_chain_id_for_orders_consistency: Option<i64>,
    pub indexer_ov: Value,
    pub orders_deadline_ssot: Value,
    pub orders_deadline_ssot_ops_check: Value,
    pub governor_view_params_ssot: Value,
    pub governor_view_params_ssot_ops_check: Value,
    pub governor_token_timelock_ssot: Value,
    pub governor_token_timelock_ssot_ops_check: Value,
    pub timelock_delay_ssot: Value,
    pub timelock_delay_ssot_ops_check: Value,
    pub governor_proposal_threshold_ssot: Value,
    pub governor_proposal_threshold_ssot_ops_check: Value,
    pub timelock_governor_admin_ssot: Value,
    pub timelock_governor_admin_ssot_ops_check: Value,
    pub governor_proposal_count_ssot: Value,
    pub governor_proposal_count_ssot_ops_check: Value,
    pub governor_proposal_state_chain_vs_projection_observability: Value,
}

pub(crate) async fn load_observability_head(state: &ApiMetaState) -> ObservabilityHeadPacks {
    let chain_id = std::env::var("CHAIN_ID").unwrap_or_else(|_| "137".to_string());
    let expected_chain_id_for_orders_consistency = state
        .chain_config
        .as_ref()
        .map(|c| (c.chain_id.min(i64::MAX as u64)) as i64)
        .or_else(|| chain_id.trim().parse::<i64>().ok());

    let mut indexer_ov = json!({
        "finality_n": state.finality_n,
        "checkpoint": {
            "block_number": state.indexer_checkpoint.block_number,
            "log_index": state.indexer_checkpoint.log_index,
        },
        "last_seen_finality_n": state.indexer_last_seen_finality_n,
        "lag_blocks": state.indexer_lag_blocks,
        "lag_max_blocks": state.indexer_lag_max_blocks,
        "replay_required": state.indexer_replay_required,
        "reorg_detected": state.reorg_detected
    });
    if let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        if let Ok(Some(v)) = db::admin_last_stored_orders_projection_reconcile(pool).await {
            indexer_ov["last_stored_reconciliation"] = v;
        }
    };    let (orders_deadline_ssot, orders_deadline_ssot_ops_check) =
        crate::chain_off::orders_deadline_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let (governor_view_params_ssot, governor_view_params_ssot_ops_check) =
        crate::chain_off::governor_view_params_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let (governor_token_timelock_ssot, governor_token_timelock_ssot_ops_check) =
        crate::chain_off::governor_token_timelock_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let (timelock_delay_ssot, timelock_delay_ssot_ops_check) =
        crate::chain_off::timelock_delay_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let (governor_proposal_threshold_ssot, governor_proposal_threshold_ssot_ops_check) =
        crate::chain_off::proposal_threshold_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let (timelock_governor_admin_ssot, timelock_governor_admin_ssot_ops_check) =
        crate::chain_off::timelock_governor_admin_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let (governor_proposal_count_ssot, governor_proposal_count_ssot_ops_check) =
        crate::chain_off::proposal_count_ssot_admin_overview_bundle(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;
    let governor_proposal_state_chain_vs_projection_observability =
        crate::chain_off::governor_proposal_state_chain_vs_projection_observability_b149(
            state.chain_off.as_ref(),
            state.chain_config.as_ref(),
        )
        .await;

    ObservabilityHeadPacks {
        chain_id,
        expected_chain_id_for_orders_consistency,
        indexer_ov,
        orders_deadline_ssot,
        orders_deadline_ssot_ops_check,
        governor_view_params_ssot,
        governor_view_params_ssot_ops_check,
        governor_token_timelock_ssot,
        governor_token_timelock_ssot_ops_check,
        timelock_delay_ssot,
        timelock_delay_ssot_ops_check,
        governor_proposal_threshold_ssot,
        governor_proposal_threshold_ssot_ops_check,
        timelock_governor_admin_ssot,
        timelock_governor_admin_ssot_ops_check,
        governor_proposal_count_ssot,
        governor_proposal_count_ssot_ops_check,
        governor_proposal_state_chain_vs_projection_observability,
    }
}
