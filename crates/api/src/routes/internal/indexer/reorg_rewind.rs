use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::chain;
use crate::state::ApiMetaState;

use super::reorg_execute::perform_indexer_reorg_rewind_execute;

#[derive(Debug, Deserialize)]
pub struct IndexerReorgRewindBody {
    /// **含端点**：删除 **`event_log` / fee_router** 中 `block_number >= rewind_from_block`；**`orders_projection`** 按链清空后 **`replay_orders_projection_from_event_log`**。
    pub rewind_from_block: u64,
    /// 为 true 时**不**要求「当前链上 `eth_getBlockByNumber(indexer.last_block)` 与内存 `last_block_hash` 不一致」，亦不校验 `rewind_from_block == last_block`。
    #[serde(default)]
    pub force: bool,
}
/// POST /api/v1/internal/indexer-reorg-rewind：**reorg / 坏尾** 机读回滚 + **`orders_projection`** 重建（110 §3.1.3 **Partial**，向 **Target** 靠拢）。
/// 须 **chain_config + indexer_state + chain_off.db_pool**；**`force:false`** 时须 **`reorg_detected(last_block)`** 且 **`rewind_from_block == indexer.last_block`**（与 **`reorg_suspected`** 响应 **`block_number`** 对齐）。
/// 成功后默认 **`reload_orders_from_db_into_store`**（**`INDEXER_REORG_RELOAD_CHAIN_OFF_ORDERS_AFTER_REWIND=0`** 跳过）使 **chain_off** 内 **`orders`/`guide_slot`** 与 **`orders`** 表对齐。
/// 可选 **`INDEXER_REORG_SYNC_ORDERS_FROM_PROJECTION_AFTER_REWIND=1`**：replay 后 **`sync_orders_from_projection_for_chain`** 将 **`orders`**（已填 **`escrow_address`**）与 **`orders_projection`** 对齐（响应 **`orders_table_projection_sync`**）。
/// 另可选 **`INDEXER_REORG_SYNC_CLEAR_ORPHAN_ESCROW_TERMINAL=1`**：无投影时对 **completed/disputed/refunded/partially_refunded/slashed/cancelled** 亦清孤立 **`escrow_address`**（**`cleared_orphan_escrow_terminal_no_projection`**）。
///
/// **局限**：默认**不**改写 **`orders`**；开启 env 亦为 **Partial**（候选左集 + **`escrowed`+无投影** 降级 + pre_funded/可选终态清列）；全量链级 **`orders`** 回滚仍为 **Target** / 人工。
pub async fn indexer_reorg_rewind(
    State(state): State<ApiMetaState>,
    Json(body): Json<IndexerReorgRewindBody>,
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
    let Some(indexer_handle) = state.indexer_state.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "chain_not_configured",
                "message": "chain_not_configured",
                "hint": "indexer state not initialized"
            })),
        )
            .into_response();
    };
    let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "database_required_for_reorg_rewind",
                "message": "database_required_for_reorg_rewind",
                "hint": "chain_off with DATABASE_URL required"
            })),
        )
            .into_response();
    };

    if body.rewind_from_block < 1 {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("rewind_from_block must be >= 1")),
        )
            .into_response();
    }

    let chain_id = config.chain_id;

    let (last_block, last_hash) = {
        let g = indexer_handle.read().await;
        (g.last_block, g.last_block_hash.clone())
    };

    if last_block == 0 {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(
                "nothing_to_rewind: indexer last_block is 0",
            )),
        )
            .into_response();
    }

    if body.rewind_from_block > last_block {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "rewind_from_block_after_indexer_tip",
                format!(
                    "rewind_from_block={} indexer.last_block={}",
                    body.rewind_from_block, last_block
                ),
            )),
        )
            .into_response();
    }

    if !body.force {
        if body.rewind_from_block != last_block {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "rewind_from_block_must_equal_last_block_when_not_force",
                    format!(
                        "expected rewind_from_block={}, got {}",
                        last_block, body.rewind_from_block
                    ),
                )),
            )
                .into_response();
        }
        match chain::indexer::get_block_hash_at(&config.rpc_url, last_block).await {
            Ok(chain_hash) => {
                if !chain::indexer::reorg_detected(&last_hash, &chain_hash) {
                    return (
                        StatusCode::CONFLICT,
                        Json(crate::api_json::err_key_detail(
                            "reorg_not_detected",
                            "chain hash matches stored last_block_hash; use force:true only if you intend an administrative rewind",
                        )),
                    )
                        .into_response();
                }
            }
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "get_block_hash_at_failed",
                        e,
                    )),
                )
                    .into_response();
            }
        }
    }

    let outcome = match perform_indexer_reorg_rewind_execute(
        &state,
        config,
        indexer_handle,
        pool,
        body.rewind_from_block,
    )
    .await
    {
        Ok(o) => o,
        Err((sc, j)) => return (sc, Json(j)).into_response(),
    };

    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "task": "indexer_reorg_rewind",
            "chain_id": chain_id,
            "rewind_from_block": body.rewind_from_block,
            "force": body.force,
            "deleted": {
                "event_log_rows": outcome.deleted_event_log,
                "fee_router_routed_events_rows": outcome.deleted_fee_router,
                "region_vault_forwarded_events_rows": outcome.deleted_region_vault,
                "investor_share_transfer_events_rows": outcome.deleted_investor_share,
                "investor_stake_state_events_rows": outcome.deleted_investor_stake,
                "investor_lock_state_events_rows": outcome.deleted_investor_lock,
                "governance_proposals_projection_rows": outcome.deleted_governance_proposals_projection,
                "orders_projection_rows": outcome.deleted_orders_projection,
            },
            "indexer_after": {
                "last_block": outcome.last_block,
                "last_log_index": outcome.last_log_index,
                "last_block_hash": outcome.last_block_hash,
            },
            "replay_stats": outcome.replay_stats,
            "chain_off_orders_reload": outcome.chain_off_orders_reload,
            "orders_table_projection_sync": outcome.orders_table_projection_sync,
            "limitations": [
                "orders business table: default rewind does not rewrite orders; optional INDEXER_REORG_SYNC_ORDERS_FROM_PROJECTION_AFTER_REWIND=1 aligns orders to replayed orders_projection (candidate union: non-empty escrow_address ∪ order_ids present in projection for this chain; summary: chain_id, clear_terminal_orphan_escrow_enabled, candidates_total, skipped_no_order_row, cleared_orphan_escrow_pre_funded, cleared_orphan_escrow_terminal_no_projection when INDEXER_REORG_SYNC_CLEAR_ORPHAN_ESCROW_TERMINAL=1, skipped_no_projection_non_escrowed_with_escrow, etc.); demotes escrowed→accepted+clear escrow when projection row absent; clears escrow_address for draft/created/accepted+no projection; completed/disputed/refund-like+escrow+no projection: default skip (manual) unless INDEXER_REORG_SYNC_CLEAR_ORPHAN_ESCROW_TERMINAL=1; full chain-level rollback remains Target (see 110 §3.1.4)",
                "orders.chain_id exists (nullable BIGINT; migration 20260416000045; new rows stamped from CHAIN_ID / CHAIN_RPC_URL default 137 via ChainOffConfig.business_chain_id; upsert COALESCE keeps first non-null): automated DELETE/rewrite of every business row scoped to one chain remains Target until optional-chain rows are backfilled/gated + dry-run internal API + 01/03 review; sync_orders_from_projection_for_chain still uses candidate union only",
                "chain_off in-memory orders map is reloaded from DB after replay when chain_off is mounted and INDEXER_REORG_RELOAD_CHAIN_OFF_ORDERS_AFTER_REWIND is not 0; memory-only orders absent from DB are preserved; guide_slot is rebuilt from merged map",
                "orders_projection for the chain was fully cleared then rebuilt from remaining event_log only"
            ],
        })),
    )
        .into_response()
}
