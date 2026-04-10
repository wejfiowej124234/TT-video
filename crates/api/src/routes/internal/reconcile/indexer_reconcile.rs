use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use serde_json::{json, Value};
use std::path::Path;
use std::time::Instant;
use uuid::Uuid;

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


/// POST /api/v1/internal/indexer-reconcile：只读对账 **`orders`（已填 escrow）↔ `orders_projection`**（110/200、04 §7.6）。
/// 须 **chain_off.db_pool**；可选 body 含 **`orders_chain_scope_*`** / **`event_log_chain_scope_*`** / **`correction_executor_chain_scope_*`**（**dry-run** 只读计数；**execute** 须 **独立 ENV** + **confirm**，见 **110 §3.1.4**）。
///
/// **TT-B110-SEQ3-ORDERS-DEADLINE-INDEXER-RECONCILE-CHECK-001**：成功 **`200`** 组装 **`orders_deadline_ssot_ops_check`** 与 **`indexer_reconcile_compound_gate.breakdown.orders_deadline_ssot_reconcile`**（**`B110-SEQ3-ORDERS-DEADLINE-SSOT-RECONCILE`**），与 **admin observability** 同源判定；**不**改公开 **`GET /api/v1/orders*`**。
///
/// **TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001**：成功 **`200`** 另含 **`governor_proposal_count_ssot_ops_check`** 与 **`indexer_reconcile_compound_gate.breakdown.governor_proposal_count_ssot_reconcile`**（**`B110-SEQ10-GOVERNOR-PROPOSAL-COUNT-SSOT-RECONCILE`**）；**不**改公开 **`GET /api/v1/orders*`**。
///
/// **TT-B175-RPC-CHAIN-ID-VS-CONFIG-PROBE-RECONCILE-001**：成功 **`200`** 与 **`persist` `summary`** 均含 **`chain_context`**（**`eth_chainId`** vs **配置 `chain_id`**；RPC 失败时 **`rpc_chain_id_ok:false`** + **`rpc_error`**，**不**影响 **`200`** / compound gate）。
///
/// **TT-B171-MULTI-CHAIN-DB-CHAIN-ID-FOOTPRINT-MATRIX-OBS-001**：**`include_multi_table_chain_observability:true`** 时含 **`multi_table_chain_observability`**（**`multi_table_chain_matrix.rows`**；与 **B-176** 共用壳；**不**参与 compound gate）。
///
/// **TT-B169-INDEXER-REORG-SENTINEL-OBS-001**：**`include_reorg_sentinel_observability:true`** 时含 **`reorg_sentinel_observability`**（**B-114-5** 同源 **`reorg_detected`** 对读；**不**参与 compound gate）。
///
/// **TT-B170-INDEXER-FINALITY-WINDOW-TRIPLE-OBS-001**：**`include_indexer_finality_triple_observability:true`** 时含 **`indexer_finality_triple_observability`**（**不**参与 compound gate）。
///
/// **TT-B174-INDEXER-TICK-FAIL-SKIP-BUCKET-OBS-001**：**`include_indexer_tick_fail_skip_bucket_observability:true`** 时含 **`indexer_tick_fail_skip_bucket_observability`**（**不**参与 compound gate）。
///
/// **TT-B172-GOVERNOR-PROPOSAL-COUNT-CHAIN-VS-PROJECTION-DRIFT-001**：**`include_governor_proposal_tail_drift_observability:true`** 时含 **`governor_proposal_tail_drift_observability`**（**不**参与 compound gate；**非** **B-149**）。
///
/// **TT-B149-B110-SEQ14-GOVERNOR-PROPOSAL-STATE-CHAIN-SSOT-001**：**`include_governor_proposal_state_chain_vs_projection_observability:true`** 时含 **`governor_proposal_state_chain_vs_projection_observability`**（**不**参与 compound gate；**非** **B-172**）。
///
/// **TT-B173-TIMELOCK-DELAY-CHAIN-VS-META-BUNDLE-ALIGN-001**：**`include_timelock_delay_meta_mirror_observability:true`** 时含 **`timelock_delay_meta_mirror_observability`**（**`GET /meta` `governance.timelock_delay_observability`** 同源构建之 **只读镜像**；**不**参与 compound gate；**不**替代 **SEQ6** **`timelock_delay_ssot_ops_check`**）。
///
/// **TT-B177-META-GOVERNANCE-CHAIN-ALIGNMENT-04-110-ALIGN-001**：**`include_governance_pool_meta_chain_alignment_observability:true`** 时含 **`governance_pool_meta_chain_alignment_observability`**（**`chain_config`** vs **`pool_chain_alignment_hint`**；**不**参与 compound gate）。
///
/// **orders 链健康汇总（B-153）**：成功 **`200`** 与 **`persist` `summary`** 均含 **`orders_chain_health_observability`**（聚合 **B-151+B-152**：**`orders_total`**、**`orders_null_chain_id_total`**、**`orders_chain_id_mismatch_total`**、**`null_ratio`/`mismatch_ratio`**、**`null_by_status`/`mismatch_by_status`**；锚 **`153-ORDERS-CHAIN-HEALTH-OBS-V1`**；**不**参与 compound gate）。
///
/// **B-154**：成功 **`200`** 与 **`persist` `summary`** 均含 **`indexer_reconcile_duration_batch_stats_observability`**（**`reconcile_core_duration_ms`** + **`batch_row_counts`**；锚 **`154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-V1`**；**不**参与 compound gate）。
///
/// **B-155**：**`persist:true`** 时 **`summary`** 与 **`200`** 另含 **`orders_chain_health_trend_snapshot`**（锚 **`155-ORDERS-CHAIN-HEALTH-TREND-SNAPSHOT-V1`**；**`by_batch`/`by_day`** 滚动；与 **`orders_chain_health_observability`** 标量同源；**不**参与 compound gate）。**`persist:false`** 时 **省略** 该键。
pub async fn indexer_reconcile(
    State(state): State<ApiMetaState>,
    body: Option<Json<IndexerReconcileBody>>,
) -> impl IntoResponse {
    let Some(config) = state.chain_config.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "chain_not_configured",
                "message": "chain_not_configured",
                "hint": "CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required"
            })),
        )
            .into_response();
    };
    if state.indexer_state.is_none() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "chain_not_configured",
                "message": "chain_not_configured",
                "hint": "indexer state not initialized"
            })),
        )
            .into_response();
    }
    let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "database_required_for_reconcile",
                "message": "database_required_for_reconcile",
                "hint": "chain_off with DATABASE_URL required for orders vs orders_projection reconcile"
            })),
        )
            .into_response();
    };
    let persist = body.as_ref().is_some_and(|j| j.0.persist);
    let chain_id = body
        .as_ref()
        .and_then(|j| j.0.chain_id)
        .unwrap_or(config.chain_id);
    let chain_id_i64 = (chain_id.min(i64::MAX as u64)) as i64;
    let reconcile_core_started = Instant::now();
    let reconcile_result = db::reconcile_orders_projection_vs_orders(pool, chain_id_i64).await;
    let reconcile_core_duration_ms = reconcile_core_started.elapsed().as_millis().min(u128::from(u64::MAX))
        as u64;
    match reconcile_result {
        Ok(stats) => {
            let indexer_reconcile_duration_batch_stats_observability =
                indexer_reconcile_duration_batch_stats_observability_value(
                    &stats,
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
            let reconcile_gate_value = reconcile_gates::orders_projection_reconcile_gate(&stats);
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
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "rpc_escrow_sample_meta_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                };
                let lim_applied = (n_req as i64).clamp(1, 10);
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
                            return (
                                StatusCode::INTERNAL_SERVER_ERROR,
                                Json(crate::api_json::err_key_detail(
                                    "rpc_escrow_samples_failed",
                                    e.to_string(),
                                )),
                            )
                                .into_response();
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
            }

            let economic_projection_row_counts =
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

            let chain_observation: Option<Value> = if body
                .as_ref()
                .is_some_and(|j| j.0.include_chain_tip)
            {
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
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "event_log_escrow_coverage_stats_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
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
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "multi_table_chain_observability_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            } else {
                None
            };

            let reorg_sentinel_observability: Option<Value> = if body
                .as_ref()
                .is_some_and(|j| j.0.include_reorg_sentinel_observability)
            {
                Some(
                    common::reorg_sentinel_observability_v1(&state, config.rpc_url.trim()).await,
                )
            } else {
                None
            };

            let indexer_finality_triple_observability: Option<Value> = if body
                .as_ref()
                .is_some_and(|j| j.0.include_indexer_finality_triple_observability)
            {
                Some(
                    common::indexer_finality_triple_observability_v1(&state, config.rpc_url.trim())
                        .await,
                )
            } else {
                None
            };

            let indexer_tick_fail_skip_bucket_observability: Option<Value> = if body
                .as_ref()
                .is_some_and(|j| j.0.include_indexer_tick_fail_skip_bucket_observability)
            {
                let g = state.indexer_tick_fail_skip_bucket_obs_last.read().await;
                Some(
                    g.clone().unwrap_or_else(
                        common::indexer_tick_fail_skip_bucket_observability_no_snapshot_yet,
                    ),
                )
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

            let governor_proposal_state_chain_vs_projection_observability: Option<Value> = if body
                .as_ref()
                .is_some_and(|j| j.0.include_governor_proposal_state_chain_vs_projection_observability)
            {
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

            let governance_pool_meta_chain_alignment_observability: Option<Value> = if body
                .as_ref()
                .is_some_and(|j| j.0.include_governance_pool_meta_chain_alignment_observability)
            {
                Some(governance_pool_meta_chain_alignment_observability_b177(&state).await)
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
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fee_router_log_verify_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
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
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "region_vault_log_verify_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            } else {
                None
            };

            let rpc_samples_slice: Option<&[serde_json::Value]> = rpc_samples.as_deref();

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
                &reconcile_gate_value,
                want_rpc.is_some(),
                rpc_skip,
                rpc_samples_slice,
                body
                    .as_ref()
                    .is_some_and(|j| j.0.include_event_log_escrow_coverage),
                event_log_escrow_coverage.as_ref(),
                fee_router_log_verify.as_ref(),
                region_vault_log_verify.as_ref(),
                chain_observation.as_ref(),
                Some(orders_deadline_ssot_reconcile_branch),
                Some(governor_view_params_ssot_reconcile_branch),
                Some(governor_token_timelock_ssot_reconcile_branch),
                Some(timelock_delay_ssot_reconcile_branch),
                Some(governor_proposal_threshold_ssot_reconcile_branch),
                Some(timelock_governor_admin_ssot_reconcile_branch),
                Some(governor_proposal_count_ssot_reconcile_branch),
            );

            let ssot_parallel_chain_snapshot =
                crate::routes::governance::pool_ssot_parallel_chain_snapshot(&state).await;
            let ssot_parallel_chain_snapshot_gate =
                reconcile_gates::ssot_parallel_chain_snapshot_gate(&ssot_parallel_chain_snapshot);

            let mut summary = json!({
                "task": "indexer_reconcile_orders_projection",
                "stats": &stats,
                "orders_projection_reconcile_gate": reconcile_gate_value.clone(),
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
                "chain_context": chain_context.clone(),
            });
            if let Some(ref s) = rpc_samples {
                summary["rpc_escrow_samples"] = json!(s);
            }
            if let Some(s) = rpc_skip {
                summary["rpc_escrow_samples_skipped"] = json!(s);
            }
            if let Some(ref m) = rpc_sample_meta {
                summary["rpc_escrow_sample_meta"] = m.clone();
            }
            if let Some(ref c) = economic_projection_row_counts {
                summary["economic_projection_row_counts"] = c.clone();
            }
            if let Some(ref co) = chain_observation {
                summary["chain_observation"] = co.clone();
            }
            if let Some(ref ev) = event_log_escrow_coverage {
                summary["event_log_escrow_coverage"] = ev.clone();
            }
            if let Some(ref fr) = fee_router_log_verify {
                summary["fee_router_log_verify"] = fr.clone();
            }
            if let Some(ref rv) = region_vault_log_verify {
                summary["region_vault_log_verify"] = rv.clone();
            }
            if let Some(ref m) = multi_table_chain_observability {
                summary["multi_table_chain_observability"] = m.clone();
            }
            if let Some(ref r) = reorg_sentinel_observability {
                summary["reorg_sentinel_observability"] = r.clone();
            }
            if let Some(ref f) = indexer_finality_triple_observability {
                summary["indexer_finality_triple_observability"] = f.clone();
            }
            if let Some(ref b) = indexer_tick_fail_skip_bucket_observability {
                summary["indexer_tick_fail_skip_bucket_observability"] = b.clone();
            }
            if let Some(ref g) = governor_proposal_tail_drift_observability {
                summary["governor_proposal_tail_drift_observability"] = g.clone();
            }
            if let Some(ref g) = governor_proposal_state_chain_vs_projection_observability {
                summary["governor_proposal_state_chain_vs_projection_observability"] = g.clone();
            }
            if let Some(ref t) = timelock_delay_meta_mirror_observability {
                summary["timelock_delay_meta_mirror_observability"] = t.clone();
            }
            if let Some(ref g) = governance_pool_meta_chain_alignment_observability {
                summary["governance_pool_meta_chain_alignment_observability"] = g.clone();
            }
            summary["orders_chain_health_observability"] =
                orders_chain_health_observability.clone();
            summary["indexer_reconcile_duration_batch_stats_observability"] =
                indexer_reconcile_duration_batch_stats_observability.clone();

            let orders_projection_gate_for_http =
                reconcile_gates::indexer_reconcile_orders_projection_gate_from_persist_summary(&summary);

            let mut orders_chain_health_trend_snapshot_for_resp: Option<Value> = None;

            let report_id = if persist {
                let prev_trend_snapshot =
                    match db::get_latest_reconciliation_report_by_type(
                        pool,
                        db::REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS,
                    )
                    .await
                    {
                        Ok(Some(r)) => {
                            r.summary.0.get("orders_chain_health_trend_snapshot").cloned()
                        }
                        _ => None,
                    };
                let new_report_id = Uuid::new_v4();
                let trend = db::merge_orders_chain_health_trend_snapshot(
                    prev_trend_snapshot.as_ref(),
                    &orders_chain_health_observability,
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
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "persist_reconciliation_report_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            } else {
                None
            };

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
                "reconcile_compound_pass": reconcile_compound_pass,
                "orders_projection_reconcile_gate": orders_projection_gate_for_http,
                "indexer_reconcile_compound_gate": compound_gate,
                "orders_deadline_ssot_ops_check": orders_deadline_ops_check,
                "governor_view_params_ssot_ops_check": governor_view_params_ops_check,
                "timelock_delay_ssot_ops_check": timelock_delay_ops_check,
                "governor_proposal_threshold_ssot_ops_check": governor_proposal_threshold_ops_check,
                "timelock_governor_admin_ssot_ops_check": timelock_governor_admin_ops_check,
                "governor_proposal_count_ssot_ops_check": governor_proposal_count_ops_check,
                "ssot_parallel_chain_snapshot": ssot_parallel_chain_snapshot,
                "ssot_parallel_chain_snapshot_gate": ssot_parallel_chain_snapshot_gate,
                "stats": stats,
                "report_id": report_id.map(|id| id.to_string()),
                "chain_context": chain_context,
            });
            if let Some(s) = rpc_samples {
                resp_body["rpc_escrow_samples"] = json!(s);
            }
            if let Some(s) = rpc_skip {
                resp_body["rpc_escrow_samples_skipped"] = json!(s);
            }
            if let Some(m) = rpc_sample_meta {
                resp_body["rpc_escrow_sample_meta"] = m;
            }
            if let Some(c) = economic_projection_row_counts {
                resp_body["economic_projection_row_counts"] = c;
            }
            if let Some(co) = chain_observation {
                resp_body["chain_observation"] = co;
            }
            if let Some(ev) = event_log_escrow_coverage {
                resp_body["event_log_escrow_coverage"] = ev;
            }
            if let Some(fr) = fee_router_log_verify {
                resp_body["fee_router_log_verify"] = fr;
            }
            if let Some(rv) = region_vault_log_verify {
                resp_body["region_vault_log_verify"] = rv;
            }
            if let Some(m) = multi_table_chain_observability {
                resp_body["multi_table_chain_observability"] = m;
            }
            if let Some(r) = reorg_sentinel_observability {
                resp_body["reorg_sentinel_observability"] = r;
            }
            if let Some(f) = indexer_finality_triple_observability {
                resp_body["indexer_finality_triple_observability"] = f;
            }
            if let Some(b) = indexer_tick_fail_skip_bucket_observability {
                resp_body["indexer_tick_fail_skip_bucket_observability"] = b;
            }
            if let Some(g) = governor_proposal_tail_drift_observability {
                resp_body["governor_proposal_tail_drift_observability"] = g;
            }
            if let Some(g) = governor_proposal_state_chain_vs_projection_observability {
                resp_body["governor_proposal_state_chain_vs_projection_observability"] = g;
            }
            if let Some(t) = timelock_delay_meta_mirror_observability {
                resp_body["timelock_delay_meta_mirror_observability"] = t;
            }
            if let Some(g) = governance_pool_meta_chain_alignment_observability {
                resp_body["governance_pool_meta_chain_alignment_observability"] = g;
            }
            resp_body["orders_chain_health_observability"] = orders_chain_health_observability;
            resp_body["indexer_reconcile_duration_batch_stats_observability"] =
                indexer_reconcile_duration_batch_stats_observability;
            if let Some(t) = orders_chain_health_trend_snapshot_for_resp {
                resp_body["orders_chain_health_trend_snapshot"] = t;
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.orders_chain_id_backfill_dry_run)
            {
                let list_scope_business = state
                    .chain_off
                    .as_ref()
                    .and_then(|co| co.config.business_chain_id);
                match db::orders_chain_id_backfill_dry_run_summary(
                    pool,
                    chain_id_i64,
                    list_scope_business,
                )
                .await
                {
                    Ok(s) => {
                        resp_body["orders_chain_id_backfill_dry_run"] =
                            serde_json::to_value(&s).unwrap_or_else(|_| json!({}));
                    }
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "orders_chain_id_backfill_dry_run_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body.as_ref().is_some_and(|j| j.0.backfill_orders_chain_id) {
                match db::backfill_orders_chain_id_from_projection(pool, chain_id_i64).await {
                    Ok(n) => {
                        resp_body["orders_chain_id_backfill"] = json!({
                            "chain_id": chain_id,
                            "updated_rows": n
                        });
                    }
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "backfill_orders_chain_id_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.orders_chain_scope_rollback_dry_run)
            {
                match db::orders_chain_scope_rollback_dry_run(pool, chain_id_i64).await {
                    Ok(d) => {
                        let mut v = serde_json::to_value(&d).unwrap_or_else(|_| json!({}));
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
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "orders_chain_scope_rollback_dry_run_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.orders_chain_scope_rollback_execute)
            {
                let allowed = matches!(
                    std::env::var("TRAVELTRUST_ALLOW_ORDERS_CHAIN_SCOPE_ROLLBACK").as_deref(),
                    Ok(v) if v.trim() == "1"
                );
                if !allowed {
                    return (
                        StatusCode::FORBIDDEN,
                        Json(crate::api_json::err_key_detail(
                            "orders_chain_scope_rollback_execute_forbidden",
                            "set TRAVELTRUST_ALLOW_ORDERS_CHAIN_SCOPE_ROLLBACK=1 on the API process to enable destructive chain-scoped order rollback",
                        )),
                    )
                        .into_response();
                }
                let expected = db::orders_chain_scope_rollback_expected_confirm(chain_id_i64);
                let got = body
                    .as_ref()
                    .and_then(|j| j.0.orders_chain_scope_rollback_confirm.as_deref())
                    .unwrap_or("");
                if got != expected.as_str() {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "orders_chain_scope_rollback_execute_confirm_mismatch",
                            format!(
                                "orders_chain_scope_rollback_confirm must equal {:?} for this request chain_id",
                                expected
                            ),
                        )),
                    )
                        .into_response();
                }
                match db::orders_chain_scope_rollback_execute(pool, chain_id_i64).await {
                    Ok(summary) => {
                        let mut v = serde_json::to_value(&summary).unwrap_or_else(|_| json!({}));
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
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "orders_chain_scope_rollback_execute_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.event_log_chain_scope_rollback_dry_run)
            {
                match db::event_log_chain_scope_rollback_dry_run(pool, chain_id_i64).await {
                    Ok(d) => {
                        let mut v = serde_json::to_value(&d).unwrap_or_else(|_| json!({}));
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
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "event_log_chain_scope_rollback_dry_run_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.event_log_chain_scope_rollback_execute)
            {
                let allowed = matches!(
                    std::env::var("TRAVELTRUST_ALLOW_EVENT_LOG_CHAIN_SCOPE_ROLLBACK").as_deref(),
                    Ok(v) if v.trim() == "1"
                );
                if !allowed {
                    return (
                        StatusCode::FORBIDDEN,
                        Json(crate::api_json::err_key_detail(
                            "event_log_chain_scope_rollback_execute_forbidden",
                            "set TRAVELTRUST_ALLOW_EVENT_LOG_CHAIN_SCOPE_ROLLBACK=1 on the API process to enable destructive chain-scoped event_log/checkpoint/fee_router/region_vault projection rollback",
                        )),
                    )
                        .into_response();
                }
                let expected = db::event_log_chain_scope_rollback_expected_confirm(chain_id_i64);
                let got = body
                    .as_ref()
                    .and_then(|j| j.0.event_log_chain_scope_rollback_confirm.as_deref())
                    .unwrap_or("");
                if got != expected.as_str() {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "event_log_chain_scope_rollback_execute_confirm_mismatch",
                            format!(
                                "event_log_chain_scope_rollback_confirm must equal {:?} for this request chain_id",
                                expected
                            ),
                        )),
                    )
                        .into_response();
                }
                match db::event_log_chain_scope_rollback_execute(pool, chain_id_i64).await {
                    Ok(summary) => {
                        let mut v = serde_json::to_value(&summary).unwrap_or_else(|_| json!({}));
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
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "event_log_chain_scope_rollback_execute_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.correction_executor_chain_scope_rollback_dry_run)
            {
                match db::correction_executor_chain_scope_rollback_dry_run(pool, chain_id_i64).await
                {
                    Ok(d) => {
                        let mut v = serde_json::to_value(&d).unwrap_or_else(|_| json!({}));
                        if let Some(obj) = v.as_object_mut() {
                            obj.insert(
                                "anchor".to_string(),
                                json!("110-CORRECTION-EXECUTOR-CHAIN-SCOPE-DRY-RUN"),
                            );
                        }
                        resp_body["correction_executor_chain_scope_rollback_dry_run"] = v;
                    }
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "correction_executor_chain_scope_rollback_dry_run_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.correction_executor_chain_scope_rollback_execute)
            {
                let allowed = matches!(
                    std::env::var("TRAVELTRUST_ALLOW_CORRECTION_EXECUTOR_CHAIN_SCOPE_ROLLBACK")
                        .as_deref(),
                    Ok(v) if v.trim() == "1"
                );
                if !allowed {
                    return (
                        StatusCode::FORBIDDEN,
                        Json(crate::api_json::err_key_detail(
                            "correction_executor_chain_scope_rollback_execute_forbidden",
                            "set TRAVELTRUST_ALLOW_CORRECTION_EXECUTOR_CHAIN_SCOPE_ROLLBACK=1 on the API process to enable destructive chain-scoped correction_log/executor_executions rollback",
                        )),
                    )
                        .into_response();
                }
                let expected =
                    db::correction_executor_chain_scope_rollback_expected_confirm(chain_id_i64);
                let got = body
                    .as_ref()
                    .and_then(|j| {
                        j.0.correction_executor_chain_scope_rollback_confirm
                            .as_deref()
                    })
                    .unwrap_or("");
                if got != expected.as_str() {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "correction_executor_chain_scope_rollback_execute_confirm_mismatch",
                            format!(
                                "correction_executor_chain_scope_rollback_confirm must equal {:?} for this request chain_id",
                                expected
                            ),
                        )),
                    )
                        .into_response();
                }
                match db::correction_executor_chain_scope_rollback_execute(pool, chain_id_i64).await
                {
                    Ok(summary) => {
                        let mut v = serde_json::to_value(&summary).unwrap_or_else(|_| json!({}));
                        if let Some(obj) = v.as_object_mut() {
                            obj.insert(
                                "anchor".to_string(),
                                json!("110-CORRECTION-EXECUTOR-CHAIN-SCOPE-EXECUTE"),
                            );
                        }
                        resp_body["correction_executor_chain_scope_rollback_execute"] = v;
                    }
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "correction_executor_chain_scope_rollback_execute_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            if body
                .as_ref()
                .is_some_and(|j| j.0.sync_indexer_memory_from_db_checkpoint)
            {
                let allowed = matches!(
                    std::env::var("TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB").as_deref(),
                    Ok(v) if v.trim() == "1"
                );
                if !allowed {
                    return (
                        StatusCode::FORBIDDEN,
                        Json(crate::api_json::err_key_detail(
                            "indexer_memory_sync_from_db_forbidden",
                            "set TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1 on the API process to align in-memory indexer checkpoint with checkpoints_sharded",
                        )),
                    )
                        .into_response();
                }
                let Some(ref indexer_handle) = state.indexer_state else {
                    return (
                        StatusCode::SERVICE_UNAVAILABLE,
                        Json(crate::api_json::err_key_detail(
                            "indexer_state_unavailable",
                            "indexer state handle not mounted",
                        )),
                    )
                        .into_response();
                };
                match db::fetch_indexer_checkpoint_for_chain(
                    pool,
                    db::INDEXER_CHECKPOINT_CONSUMER_ID,
                    chain_id_i64,
                )
                .await
                {
                    Ok(db_row) => {
                        let before = {
                            let g = indexer_handle.read().await;
                            json!({
                                "last_block": g.last_block,
                                "last_log_index": g.last_log_index,
                                "events_cached": g.events.len(),
                            })
                        };
                        let (src, bn, li) = match db_row {
                            Some((b, l)) => {
                                if b < 0 {
                                    return (
                                        StatusCode::INTERNAL_SERVER_ERROR,
                                        Json(crate::api_json::err_key_detail(
                                            "indexer_memory_sync_from_db_failed",
                                            "checkpoints_sharded.block_number must be non-negative",
                                        )),
                                    )
                                        .into_response();
                                }
                                ("db_checkpoint_row", b as u64, l.max(0) as u32)
                            }
                            None => ("no_db_row_reset", 0u64, 0u32),
                        };
                        {
                            let mut g = indexer_handle.write().await;
                            g.events.retain(|e| {
                                e.block_number < bn || (e.block_number == bn && e.log_index <= li)
                            });
                            g.last_block = bn;
                            g.last_log_index = li;
                            g.last_block_hash = g
                                .events
                                .iter()
                                .find(|e| e.block_number == bn && e.log_index == li)
                                .map(|e| e.block_hash.clone())
                                .unwrap_or_default();
                        }
                        let after = {
                            let g = indexer_handle.read().await;
                            json!({
                                "last_block": g.last_block,
                                "last_log_index": g.last_log_index,
                                "events_cached": g.events.len(),
                            })
                        };
                        let runtime_path_str = format!("{}.runtime", state.indexer_state_path);
                        let runtime_path = Path::new(&runtime_path_str);
                        {
                            let guard = indexer_handle.read().await;
                            if let Err(e) =
                                chain::indexer::persist_indexer_state(runtime_path, &guard)
                            {
                                return (
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    Json(crate::api_json::err_key_detail(
                                        "indexer_memory_sync_from_db_persist_failed",
                                        format!("{}", e),
                                    )),
                                )
                                    .into_response();
                            }
                        }
                        resp_body["indexer_memory_sync_from_db"] = json!({
                            "anchor": "110-INDEXER-MEMORY-SYNC-FROM-DB",
                            "chain_id": chain_id,
                            "source": src,
                            "before": before,
                            "after": after,
                            "note": "GET /meta.indexer.memory reflects live handle; GET /meta.indexer.checkpoint may still show startup snapshot until process restart",
                        });
                    }
                    Err(e) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "indexer_memory_sync_from_db_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response();
                    }
                }
            }
            (StatusCode::OK, Json(resp_body)).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key_detail(
                "reconcile_orders_projection_failed",
                e.to_string(),
            )),
        )
            .into_response(),
    }
}

/// **B-154**：**`db::reconcile_orders_projection_vs_orders`** 耗时 + **`OrdersProjectionReconcileStats`** 行计数（**无** **`samples`**）。
fn indexer_reconcile_duration_batch_stats_observability_value(
    stats: &db::OrdersProjectionReconcileStats,
    reconcile_core_duration_ms: u64,
) -> Value {
    json!({
        "anchor": "154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-V1",
        "schema_version": 1,
        "reconcile_core_duration_ms": reconcile_core_duration_ms,
        "chain_id": stats.chain_id,
        "batch_row_counts": {
            "orders_with_escrow": stats.orders_with_escrow,
            "projection_rows_chain": stats.projection_rows_chain,
            "malformed_projection_order_id_bytes": stats.malformed_projection_order_id_bytes,
            "matched": stats.matched,
            "missing_projection": stats.missing_projection,
            "status_mismatch": stats.status_mismatch,
            "escrow_mismatch": stats.escrow_mismatch,
            "orphan_projections": stats.orphan_projections,
            "issues_total": stats.issues_total,
            "projection_reconcile_clean": stats.projection_reconcile_clean,
        },
        "getter_note": "reconcile_core_duration_ms is wall time for db::reconcile_orders_projection_vs_orders only; batch_row_counts mirror response stats without samples.",
    })
}

#[cfg(test)]
mod b154_indexer_reconcile_duration_batch_stats_tests {
    use super::indexer_reconcile_duration_batch_stats_observability_value;
    use crate::db::OrdersProjectionReconcileStats;
    use serde_json::json;

    #[test]
    fn b154_duration_batch_stats_anchor_and_batch_keys() {
        let stats = OrdersProjectionReconcileStats {
            chain_id: 137,
            orders_with_escrow: 5,
            projection_rows_chain: 4,
            matched: 3,
            ..Default::default()
        };
        let v = indexer_reconcile_duration_batch_stats_observability_value(&stats, 42);
        assert_eq!(
            v["anchor"],
            json!("154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-V1")
        );
        assert_eq!(v["reconcile_core_duration_ms"], json!(42));
        assert!(v.get("batch_row_counts").is_some());
        assert_eq!(v["chain_id"], json!(137));
    }
}
