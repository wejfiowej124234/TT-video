//! Observability / sampling phase for indexer-reconcile OK path.
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::chain;
use crate::chain_off;
use crate::db;
use crate::routes::governance::governance_pool_meta_chain_alignment_observability_b177;
use crate::routes::internal::common;
use crate::routes::internal::reconcile_gates;
use crate::state::ApiMetaState;

use super::body::IndexerReconcileBody;
use super::collectors::{
    collect_fee_router_log_verify, collect_region_vault_log_verify,
    collect_rpc_escrow_reconcile_samples,
};
use super::indexer_reconcile_ok_types::IndexerReconcileOkObs;

pub(crate) async fn run(
    stats: &db::OrdersProjectionReconcileStats,
    reconcile_core_duration_ms: u64,
    state: &ApiMetaState,
    pool: &PgPool,
    config: &chain::ChainConfig,
    body: &Option<Json<IndexerReconcileBody>>,
    chain_id: u64,
    chain_id_i64: i64,
) -> Result<IndexerReconcileOkObs, axum::response::Response> {
    let indexer_reconcile_duration_batch_stats_observability =
        super::indexer_reconcile_b154::indexer_reconcile_duration_batch_stats_observability_value(
            stats,
            reconcile_core_duration_ms,
        );
    let chain_context = match chain::indexer::get_eth_chain_id(config.rpc_url.trim()).await {
        Ok(rpc_chain_id) => json!({
            "anchor": "175-RPC-CHAIN-ID-VS-CONFIG-PROBE",
            "config_chain_id": config.chain_id,
            "reconcile_chain_id": chain_id,
            "reconcile_chain_id_vs_config_chain_id_aligned": chain_id == config.chain_id,
            "rpc_chain_id": rpc_chain_id,
            "rpc_chain_id_ok": true,
            "config_vs_rpc_chain_id_aligned": rpc_chain_id == config.chain_id,
        }),
        Err(e) => json!({
            "anchor": "175-RPC-CHAIN-ID-VS-CONFIG-PROBE",
            "config_chain_id": config.chain_id,
            "reconcile_chain_id": chain_id,
            "reconcile_chain_id_vs_config_chain_id_aligned": chain_id == config.chain_id,
            "rpc_chain_id": Value::Null,
            "rpc_chain_id_ok": false,
            "config_vs_rpc_chain_id_aligned": Value::Null,
            "rpc_error": e,
        }),
    };
    let reconcile_gate_value = reconcile_gates::orders_projection_reconcile_gate(stats);
    let want_rpc = body
        .as_ref()
        .and_then(|j| j.0.rpc_escrow_samples)
        .filter(|n| *n > 0);
    let mut rpc_samples: Option<Vec<serde_json::Value>> = None;
    let mut rpc_skip: Option<&'static str> = None;
    let mut rpc_sample_meta: Option<Value> = None;
    if let Some(n_req) = want_rpc {
        let orders_escrow_total = match db::count_orders_with_escrow_address(pool).await {
            Ok(t) => t,
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "rpc_escrow_sample_meta_failed",
                        e.to_string(),
                    )),
                )
                    .into_response());
            }
        };        let lim_applied = (n_req as i64).clamp(1, 10);
        let factory_ok = config
            .escrow_factory_address
            .as_ref()
            .map(|s| !s.trim().is_empty())
            .unwrap_or(false);
        if config.is_configured() && factory_ok {
            match collect_rpc_escrow_reconcile_samples(config, pool, n_req).await {
                Ok(v) => {
                    rpc_sample_meta = Some(json!({
                        "anchor": "110-RPC-ESCROW-SAMPLE-META",
                        "orders_with_escrow_address_total": orders_escrow_total,
                        "sample_limit_requested": n_req,
                        "sample_limit_applied": lim_applied,
                        "samples_returned": v.len() as i64,
                    }));
                    rpc_samples = Some(v);
                }
                Err(e) => {
                    return Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key_detail(
                            "rpc_escrow_samples_failed",
                            e.to_string(),
                        )),
                    )
                        .into_response());
                }
            }
        } else {
            rpc_skip = Some("escrow_factory_or_rpc_not_configured");
            rpc_sample_meta = Some(json!({
                "anchor": "110-RPC-ESCROW-SAMPLE-META",
                "orders_with_escrow_address_total": orders_escrow_total,
                "sample_limit_requested": n_req,
                "sample_limit_applied": lim_applied,
                "samples_returned": 0_i64,
            }));
        }
    };    let economic_projection_row_counts =
        common::economic_projection_row_counts_for_chain(pool, chain_id_i64).await;

    let orders_chain_health_observability =
        match db::orders_chain_health_observability(pool, chain_id_i64).await {
            Ok(v) => v,
            Err(e) => json!({
                "anchor": "153-ORDERS-CHAIN-HEALTH-OBS-V1",
                "observation_note": "query_failed",
                "error": e.to_string(),
            }),
        };

    let chain_observation: Option<Value> = if body.as_ref().is_some_and(|j| j.0.include_chain_tip) {
        Some(
            match chain::indexer::get_latest_block(config.rpc_url.trim()).await {
                Ok(tip) => json!({
                    "ok": true,
                    "anchor": "110-RECONCILE-CHAIN-TIP",
                    "eth_chain_tip_block_number": tip,
                    "finality_n_used": state.finality_n,
                    "indexer_finalized_upper_bound": chain::indexer::indexer_finalized_upper_bound(tip, state.finality_n),
                }),
                Err(e) => json!({
                    "ok": false,
                    "anchor": "110-RECONCILE-CHAIN-TIP",
                    "error": e,
                }),
            },
        )
    } else {
        None
    };
    let event_log_escrow_coverage: Option<Value> = if body
        .as_ref()
        .is_some_and(|j| j.0.include_event_log_escrow_coverage)
    {
        match db::event_log_escrow_coverage_stats(pool, chain_id_i64).await {
            Ok(st) => Some(json!({
                "anchor": "110-EVENT-LOG-ESCROW-COVERAGE",
                "chain_id": st.chain_id,
                "escrow_class_event_rows": st.escrow_class_event_rows,
                "escrow_created_rows": st.escrow_created_rows,
                "distinct_escrow_address_from_escrow_created": st.distinct_escrow_address_from_escrow_created,
                "orders_projection_rows": st.orders_projection_rows,
                "orders_projection_distinct_escrow_non_null": st.orders_projection_distinct_escrow_non_null,
            })),
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "event_log_escrow_coverage_stats_failed",
                        e.to_string(),
                    )),
                )
                    .into_response());
            }
        }
    } else {
        None
    };
    let multi_table_chain_observability: Option<Value> = if body
        .as_ref()
        .is_some_and(|j| j.0.include_multi_table_chain_observability)
    {
        match db::multi_table_chain_id_footprint_matrix_rows(pool).await {
            Ok(rows) => Some(common::multi_table_chain_observability_v1(
                config.chain_id,
                chain_id,
                rows,
            )),
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "multi_table_chain_observability_failed",
                        e.to_string(),
                    )),
                )
                    .into_response());
            }
        }
    } else {
        None
    };
    let reorg_sentinel_observability: Option<Value> = if body
        .as_ref()
        .is_some_and(|j| j.0.include_reorg_sentinel_observability)
    {
        Some(common::reorg_sentinel_observability_v1(state, config.rpc_url.trim()).await)
    } else {
        None
    };
    let indexer_finality_triple_observability: Option<Value> = if body
        .as_ref()
        .is_some_and(|j| j.0.include_indexer_finality_triple_observability)
    {
        Some(common::indexer_finality_triple_observability_v1(state, config.rpc_url.trim()).await)
    } else {
        None
    };
    let indexer_tick_fail_skip_bucket_observability: Option<Value> =
        if body
            .as_ref()
            .is_some_and(|j| j.0.include_indexer_tick_fail_skip_bucket_observability)
        {
            let g = state.indexer_tick_fail_skip_bucket_obs_last.read().await;
            Some(g.clone().unwrap_or_else(
                common::indexer_tick_fail_skip_bucket_observability_no_snapshot_yet,
            ))
        } else {
            None
        };
    let governor_proposal_tail_drift_observability: Option<Value> = if body
        .as_ref()
        .is_some_and(|j| j.0.include_governor_proposal_tail_drift_observability)
    {
        Some(
            chain_off::governor_proposal_tail_drift_observability_b172(
                state.chain_off.as_ref(),
                state.chain_config.as_ref(),
            )
            .await,
        )
    } else {
        None
    };
    let governor_proposal_state_chain_vs_projection_observability: Option<Value> =
        if body.as_ref().is_some_and(|j| {
            j.0.include_governor_proposal_state_chain_vs_projection_observability
        }) {
            Some(
                chain_off::governor_proposal_state_chain_vs_projection_observability_b149(
                    state.chain_off.as_ref(),
                    state.chain_config.as_ref(),
                )
                .await,
            )
        } else {
            None
        };
    let timelock_delay_meta_mirror_observability: Option<Value> = if body
        .as_ref()
        .is_some_and(|j| j.0.include_timelock_delay_meta_mirror_observability)
    {
        Some(
            chain_off::timelock_delay_meta_mirror_observability_b173(
                state.chain_off.as_ref(),
                state.chain_config.as_ref(),
            )
            .await,
        )
    } else {
        None
    };
    let governance_pool_meta_chain_alignment_observability: Option<Value> =
        if body.as_ref().is_some_and(|j| {
            j.0.include_governance_pool_meta_chain_alignment_observability
        }) {
            Some(governance_pool_meta_chain_alignment_observability_b177(state).await)
        } else {
            None
        };
    let fee_router_log_verify: Option<Value> = if let Some(n) = body
        .as_ref()
        .and_then(|j| j.0.verify_fee_router_events_rpc)
        .filter(|x| *x > 0)
    {
        match collect_fee_router_log_verify(config, pool, chain_id_i64, n).await {
            Ok(v) => Some(v),
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "fee_router_log_verify_failed",
                        e.to_string(),
                    )),
                )
                    .into_response());
            }
        }
    } else {
        None
    };
    let region_vault_log_verify: Option<Value> = if let Some(n) = body
        .as_ref()
        .and_then(|j| j.0.verify_region_vault_events_rpc)
        .filter(|x| *x > 0)
    {
        match collect_region_vault_log_verify(config, pool, chain_id_i64, n).await {
            Ok(v) => Some(v),
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "region_vault_log_verify_failed",
                        e.to_string(),
                    )),
                )
                    .into_response());
            }
        }
    } else {
        None
    }

    Ok(IndexerReconcileOkObs {
        indexer_reconcile_duration_batch_stats_observability,
        chain_context,
        reconcile_gate_value,
        want_rpc,
        rpc_samples,
        rpc_skip,
        rpc_sample_meta,
        economic_projection_row_counts,
        orders_chain_health_observability,
        chain_observation,
        event_log_escrow_coverage,
        multi_table_chain_observability,
        reorg_sentinel_observability,
        indexer_finality_triple_observability,
        indexer_tick_fail_skip_bucket_observability,
        governor_proposal_tail_drift_observability,
        governor_proposal_state_chain_vs_projection_observability,
        timelock_delay_meta_mirror_observability,
        governance_pool_meta_chain_alignment_observability,
        fee_router_log_verify,
        region_vault_log_verify,
    })
}
