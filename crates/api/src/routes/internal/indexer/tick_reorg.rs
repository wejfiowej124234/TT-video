use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};

use super::env::indexer_reorg_auto_rewind_on_tick_enabled;
use super::reorg_execute::perform_indexer_reorg_rewind_execute;
use crate::chain;
use crate::state::ApiMetaState;

/// Resolves `from_block` after optional auto-rewind on reorg; returns JSON detail when `Some`.
pub(crate) async fn indexer_tick_resolve_from_block_with_reorg(
    state: &ApiMetaState,
    config: &chain::ChainConfig,
    indexer_handle: &chain::indexer::IndexerStateHandle,
) -> Result<(u64, Option<Value>), axum::response::Response> {
    let mut reorg_auto_rewind: Option<Value> = None;
    let from_block = loop {
        let (from_block, last_indexed_block, last_indexed_block_hash) = {
            let g = indexer_handle.read().await;
            (
                chain::indexer::indexer_tick_scan_from_block_lower_bound(&g),
                g.last_block,
                g.last_block_hash.clone(),
            )
        };
        if last_indexed_block > 0 && !last_indexed_block_hash.trim().is_empty() {
            match chain::indexer::get_block_hash_at(&config.rpc_url, last_indexed_block).await {
                Ok(chain_hash) => {
                    if chain::indexer::reorg_detected(&last_indexed_block_hash, &chain_hash) {
                        if indexer_reorg_auto_rewind_on_tick_enabled() {
                            if let Some(pool) =
                                state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref())
                            {
                                if reorg_auto_rewind.is_some() {
                                    return Err((
                                        StatusCode::SERVICE_UNAVAILABLE,
                                        Json(json!({
                                            "error": "reorg_still_suspected_after_auto_rewind",
                                            "message": "reorg_still_suspected_after_auto_rewind",
                                            "hint": "INDEXER_REORG_AUTO_REWIND_ON_TICK=1 already ran one rewind this tick but hash still mismatches; investigate RPC and indexer state",
                                            "block_number": last_indexed_block,
                                            "stored_last_block_hash": last_indexed_block_hash,
                                            "chain_block_hash": chain_hash,
                                        })),
                                    )
                                        .into_response());
                                };                                match perform_indexer_reorg_rewind_execute(
                                    state,
                                    config,
                                    indexer_handle,
                                    pool,
                                    last_indexed_block,
                                )
                                .await
                                {
                                    Ok(out) => {
                                        reorg_auto_rewind = Some(json!({
                                            "rewind_from_block": last_indexed_block,
                                            "deleted": {
                                                "event_log_rows": out.deleted_event_log,
                                                "fee_router_routed_events_rows": out.deleted_fee_router,
                                                "region_vault_forwarded_events_rows": out.deleted_region_vault,
                                                "onboarding_fee_paid_events_rows": out.deleted_onboarding_fee_paid,
                                                "investor_share_transfer_events_rows": out.deleted_investor_share,
                                                "investor_stake_state_events_rows": out.deleted_investor_stake,
                                                "investor_lock_state_events_rows": out.deleted_investor_lock,
                                                "governance_proposals_projection_rows": out.deleted_governance_proposals_projection,
                                                "orders_projection_rows": out.deleted_orders_projection,
                                            },
                                            "indexer_after": {
                                                "last_block": out.last_block,
                                                "last_log_index": out.last_log_index,
                                                "last_block_hash": out.last_block_hash,
                                            },
                                            "replay_stats": out.replay_stats,
                                            "chain_off_orders_reload": out.chain_off_orders_reload,
                                            "orders_table_projection_sync": out.orders_table_projection_sync,
                                        }));
                                        continue;
                                    }
                                    Err((sc, j)) => return Err((sc, Json(j)).into_response()),
                                }
                            } else {
                                return Err((
                                    StatusCode::SERVICE_UNAVAILABLE,
                                    Json(json!({
                                        "error": "reorg_suspected",
                                        "message": "reorg_suspected",
                                        "hint": "Last indexed block hash differs from canonical chain; INDEXER_REORG_AUTO_REWIND_ON_TICK=1 requires DATABASE_URL (chain_off.db_pool). Otherwise pause ticks and follow Runbook §2.55 / 110",
                                        "block_number": last_indexed_block,
                                        "stored_last_block_hash": last_indexed_block_hash,
                                        "chain_block_hash": chain_hash,
                                    })),
                                )
                                    .into_response());
                            }
                        } else {
                            return Err((
                                StatusCode::SERVICE_UNAVAILABLE,
                                Json(json!({
                                    "error": "reorg_suspected",
                                    "message": "reorg_suspected",
                                    "hint": "Last indexed block hash differs from canonical chain; pause indexer ticks, verify head, then follow Runbook §2.55 / 110 (replay or manual correction). Optional: INDEXER_REORG_AUTO_REWIND_ON_TICK=1 with DB for one automatic rewind per tick",
                                    "block_number": last_indexed_block,
                                    "stored_last_block_hash": last_indexed_block_hash,
                                    "chain_block_hash": chain_hash,
                                })),
                            )
                                .into_response());
                        }
                    }
                }
                Err(e) => {
                    return Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key_detail(
                            "get_block_hash_at_failed",
                            e,
                        )),
                    )
                        .into_response());
                }
            }
        }
        break from_block;
    }
    Ok((from_block, reorg_auto_rewind))
}
