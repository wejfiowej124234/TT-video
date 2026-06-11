//! Reconciliation / drift snapshot JSON blocks for **`GET …/observability/overview`**.

use serde_json::{json, Value};

use crate::db;
use crate::state::ApiMetaState;

pub(crate) struct ObservabilityReconcileSnapshots {
    pub governance_proposals_projection_null_fields_observability: Value,
    pub orders_chain_health_observability: Value,
    pub indexer_head_vs_db_latest_block_drift_observability: Value,
    pub indexer_reconcile_duration_batch_stats_observability: Value,
    pub rpc_escrow_sample_meta: Value,
    pub correction_executor_rows_observability: Value,
    pub orders_chain_health_trend_snapshot: Value,
    pub orders_amount_chain_vs_escrow_drift_observability: Value,
    pub escrow_status_chain_vs_orders_drift_observability: Value,
    pub fee_router_fee_routes_vs_routed_events_drift_observability: Value,
    pub vault_forwards_vs_forwarded_events_drift_observability: Value,
    pub stake_lock_projection_block_lag_observability: Value,
    pub region_share_projection_closure_observability: Value,
}

pub(crate) async fn load_reconcile_snapshots(
    state: &ApiMetaState,
    expected_chain_id_for_orders_consistency: Option<i64>,
) -> ObservabilityReconcileSnapshots {
    let governance_proposals_projection_null_fields_observability = match state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
    {
        Some(pool) => {
            match db::admin_last_governance_proposals_projection_null_fields_observability(pool)
                .await
            {
                Ok(Some(v)) => v,
                Ok(None) => json!({
                    "anchor": db::GOVERNANCE_PROPOSALS_PROJECTION_NULL_FIELDS_OBS_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "no_stored_snapshot",
                    "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                }),
                Err(e) => json!({
                    "anchor": db::GOVERNANCE_PROPOSALS_PROJECTION_NULL_FIELDS_OBS_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "query_failed",
                    "error": e.to_string(),
                }),
            }
        }
        None => json!({
            "anchor": db::GOVERNANCE_PROPOSALS_PROJECTION_NULL_FIELDS_OBS_ANCHOR,
            "schema_version": 1,
            "observation_note": "database_pool_unavailable",
        }),
    };
    let orders_chain_health_observability = match (
        state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()),
        expected_chain_id_for_orders_consistency,
    ) {
        (Some(pool), Some(ecid)) => match db::orders_chain_health_observability(pool, ecid).await {
            Ok(v) => v,
            Err(e) => json!({
                "anchor": "153-ORDERS-CHAIN-HEALTH-OBS-V1",
                "observation_note": "query_failed",
                "error": e.to_string(),
            }),
        },
        (Some(_), None) => json!({
            "anchor": "153-ORDERS-CHAIN-HEALTH-OBS-V1",
            "observation_note": "expected_chain_id_unavailable",
        }),
        (None, _) => json!({
            "anchor": "153-ORDERS-CHAIN-HEALTH-OBS-V1",
            "observation_note": "database_pool_unavailable",
        }),
    };
    let indexer_head_vs_db_latest_block_drift_observability =
        crate::routes::internal::indexer_head_vs_db_latest_block_drift_observability_v1(
            state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()),
            state.chain_config.as_ref().map(|c| c.rpc_url.as_str()),
            expected_chain_id_for_orders_consistency,
        )
        .await;
    let indexer_reconcile_duration_batch_stats_observability = match state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
    {
        Some(pool) => {
            match db::admin_last_indexer_reconcile_duration_batch_stats_observability(pool).await {
                Ok(Some(v)) => v,
                Ok(None) => json!({
                    "anchor": "154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-V1",
                    "observation_note": "no_stored_snapshot",
                    "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                }),
                Err(e) => json!({
                    "anchor": "154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-V1",
                    "observation_note": "query_failed",
                    "error": e.to_string(),
                }),
            }
        }
        None => json!({
            "anchor": "154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-V1",
            "observation_note": "database_pool_unavailable",
        }),
    };
    let rpc_escrow_sample_meta = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(pool) => match db::admin_last_rpc_escrow_sample_meta(pool).await {
            Ok(Some(v)) => v,
            Ok(None) => json!({
                "anchor": db::RPC_ESCROW_SAMPLE_META_ANCHOR,
                "observation_note": "no_stored_snapshot",
                "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with rpc_escrow_samples>0 and persist:true to populate.",
            }),
            Err(e) => json!({
                "anchor": db::RPC_ESCROW_SAMPLE_META_ANCHOR,
                "observation_note": "query_failed",
                "error": e.to_string(),
            }),
        },
        None => json!({
            "anchor": db::RPC_ESCROW_SAMPLE_META_ANCHOR,
            "observation_note": "database_pool_unavailable",
        }),
    };
    let correction_executor_rows_observability = match state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
    {
        Some(pool) => match db::admin_last_correction_executor_rows_observability(pool).await {
            Ok(Some(v)) => v,
            Ok(None) => json!({
                "anchor": db::CORRECTION_EXECUTOR_ROWS_OBS_ANCHOR,
                "schema_version": 1,
                "observation_note": "no_stored_snapshot",
                "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
            }),
            Err(e) => json!({
                "anchor": db::CORRECTION_EXECUTOR_ROWS_OBS_ANCHOR,
                "schema_version": 1,
                "observation_note": "query_failed",
                "error": e.to_string(),
            }),
        },
        None => json!({
            "anchor": db::CORRECTION_EXECUTOR_ROWS_OBS_ANCHOR,
            "schema_version": 1,
            "observation_note": "database_pool_unavailable",
        }),
    };
    let orders_chain_health_trend_snapshot = match state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
    {
        Some(pool) => match db::admin_last_orders_chain_health_trend_snapshot(pool).await {
            Ok(Some(v)) => v,
            Ok(None) => json!({
                "anchor": "155-ORDERS-CHAIN-HEALTH-TREND-SNAPSHOT-V1",
                "observation_note": "no_stored_snapshot",
                "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to advance by_batch/by_day.",
            }),
            Err(e) => json!({
                "anchor": "155-ORDERS-CHAIN-HEALTH-TREND-SNAPSHOT-V1",
                "observation_note": "query_failed",
                "error": e.to_string(),
            }),
        },
        None => json!({
            "anchor": "155-ORDERS-CHAIN-HEALTH-TREND-SNAPSHOT-V1",
            "observation_note": "database_pool_unavailable",
        }),
    };
    let orders_amount_chain_vs_escrow_drift_observability = match state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
    {
        Some(pool) => {
            match db::admin_last_orders_amount_chain_vs_escrow_drift_observability(pool).await {
                Ok(Some(v)) => v,
                Ok(None) => json!({
                    "anchor": db::ORDERS_AMOUNT_CHAIN_VS_ESCROW_DRIFT_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "no_stored_snapshot",
                    "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                }),
                Err(e) => json!({
                    "anchor": db::ORDERS_AMOUNT_CHAIN_VS_ESCROW_DRIFT_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "query_failed",
                    "error": e.to_string(),
                }),
            }
        }
        None => json!({
            "anchor": db::ORDERS_AMOUNT_CHAIN_VS_ESCROW_DRIFT_ANCHOR,
            "schema_version": 1,
            "observation_note": "database_pool_unavailable",
        }),
    };
    let escrow_status_chain_vs_orders_drift_observability = match state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
    {
        Some(pool) => {
            match db::admin_last_escrow_status_chain_vs_orders_drift_observability(pool).await {
                Ok(Some(v)) => v,
                Ok(None) => json!({
                    "anchor": db::ESCROW_STATUS_CHAIN_VS_ORDERS_DRIFT_OBS_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "no_stored_snapshot",
                    "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                }),
                Err(e) => json!({
                    "anchor": db::ESCROW_STATUS_CHAIN_VS_ORDERS_DRIFT_OBS_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "query_failed",
                    "error": e.to_string(),
                }),
            }
        }
        None => json!({
            "anchor": db::ESCROW_STATUS_CHAIN_VS_ORDERS_DRIFT_OBS_ANCHOR,
            "schema_version": 1,
            "observation_note": "database_pool_unavailable",
        }),
    };
    let fee_router_fee_routes_vs_routed_events_drift_observability = match state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
    {
        Some(pool) => {
            match db::admin_last_fee_router_fee_routes_vs_routed_events_drift_observability(pool)
                .await
            {
                Ok(Some(v)) => v,
                Ok(None) => json!({
                    "anchor": db::FEE_ROUTER_FEE_ROUTES_VS_ROUTED_EVENTS_DRIFT_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "no_stored_snapshot",
                    "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                }),
                Err(e) => json!({
                    "anchor": db::FEE_ROUTER_FEE_ROUTES_VS_ROUTED_EVENTS_DRIFT_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "query_failed",
                    "error": e.to_string(),
                }),
            }
        }
        None => json!({
            "anchor": db::FEE_ROUTER_FEE_ROUTES_VS_ROUTED_EVENTS_DRIFT_ANCHOR,
            "schema_version": 1,
            "observation_note": "database_pool_unavailable",
        }),
    };
    let vault_forwards_vs_forwarded_events_drift_observability = match state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
    {
        Some(pool) => {
            match db::admin_last_vault_forwards_vs_forwarded_events_drift_observability(pool).await
            {
                Ok(Some(v)) => v,
                Ok(None) => json!({
                    "anchor": db::VAULT_FORWARDS_VS_FORWARDED_EVENTS_DRIFT_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "no_stored_snapshot",
                    "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                }),
                Err(e) => json!({
                    "anchor": db::VAULT_FORWARDS_VS_FORWARDED_EVENTS_DRIFT_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "query_failed",
                    "error": e.to_string(),
                }),
            }
        }
        None => json!({
            "anchor": db::VAULT_FORWARDS_VS_FORWARDED_EVENTS_DRIFT_ANCHOR,
            "schema_version": 1,
            "observation_note": "database_pool_unavailable",
        }),
    };
    let stake_lock_projection_block_lag_observability = match state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
    {
        Some(pool) => {
            match db::admin_last_stake_lock_projection_block_lag_observability(pool).await {
                Ok(Some(v)) => v,
                Ok(None) => json!({
                    "anchor": db::STAKE_LOCK_PROJECTION_BLOCK_LAG_OBS_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "no_stored_snapshot",
                    "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
                }),
                Err(e) => json!({
                    "anchor": db::STAKE_LOCK_PROJECTION_BLOCK_LAG_OBS_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "query_failed",
                    "error": e.to_string(),
                }),
            }
        }
        None => json!({
            "anchor": db::STAKE_LOCK_PROJECTION_BLOCK_LAG_OBS_ANCHOR,
            "schema_version": 1,
            "observation_note": "database_pool_unavailable",
        }),
    };

    let region_share_projection_closure_observability = match state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
    {
        Some(pool) => {
            match db::admin_last_region_share_projection_closure_observability(pool).await {
                Ok(Some(v)) => v,
                Ok(None) => json!({
                    "anchor": db::REGION_SHARE_PROJECTION_CLOSURE_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "no_stored_snapshot",
                    "getter_note": "From latest region_share_projection_closure_v1 report; run POST …/internal/region-share-reconcile with persist:true.",
                }),
                Err(e) => json!({
                    "anchor": db::REGION_SHARE_PROJECTION_CLOSURE_ANCHOR,
                    "schema_version": 1,
                    "observation_note": "query_failed",
                    "error": e.to_string(),
                }),
            }
        }
        None => json!({
            "anchor": db::REGION_SHARE_PROJECTION_CLOSURE_ANCHOR,
            "schema_version": 1,
            "observation_note": "database_pool_unavailable",
        }),
    };

    ObservabilityReconcileSnapshots {
        governance_proposals_projection_null_fields_observability,
        orders_chain_health_observability,
        indexer_head_vs_db_latest_block_drift_observability,
        indexer_reconcile_duration_batch_stats_observability,
        rpc_escrow_sample_meta,
        correction_executor_rows_observability,
        orders_chain_health_trend_snapshot,
        orders_amount_chain_vs_escrow_drift_observability,
        escrow_status_chain_vs_orders_drift_observability,
        fee_router_fee_routes_vs_routed_events_drift_observability,
        vault_forwards_vs_forwarded_events_drift_observability,
        stake_lock_projection_block_lag_observability,
        region_share_projection_closure_observability,
    }
}
