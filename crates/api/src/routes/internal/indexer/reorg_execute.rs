use axum::http::StatusCode;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::path::Path;

use crate::chain;
use crate::chain_off;
use crate::db;
use crate::state::ApiMetaState;

use super::env::{
    indexer_reorg_clear_terminal_orphan_escrow_enabled,
    indexer_reorg_skip_chain_off_order_reload,
    indexer_reorg_sync_orders_from_projection_after_rewind_enabled,
};

pub(super) struct ReorgRewindExecuteOutcome {
    pub(super) deleted_event_log: u64,
    pub(super) deleted_fee_router: u64,
    pub(super) deleted_region_vault: u64,
    pub(super) deleted_investor_share: u64,
    pub(super) deleted_investor_stake: u64,
    pub(super) deleted_investor_lock: u64,
    pub(super) deleted_governance_proposals_projection: u64,
    pub(super) deleted_orders_projection: u64,
    pub(super) last_block: u64,
    pub(super) last_log_index: u32,
    pub(super) last_block_hash: String,
    pub(super) replay_stats: Value,
    /// **`null`** 当跳过或未挂载 **chain_off**；否则 **`db_orders_loaded`** / **`memory_only_orders_preserved`**
    pub(super) chain_off_orders_reload: Value,
    /// **`null`** 当未设 **`INDEXER_REORG_SYNC_ORDERS_FROM_PROJECTION_AFTER_REWIND=1`**；否则 **`SyncOrdersFromProjectionSummary`**
    pub(super) orders_table_projection_sync: Value,
}

/// DB 删尾 + 内存 checkpoint 回退 + checkpoint 表 + `.runtime` 落盘 + **`orders_projection`** replay（与 **`indexer_reorg_rewind`** 同源）。
pub(super) async fn perform_indexer_reorg_rewind_execute(
    state: &ApiMetaState,
    config: &chain::ChainConfig,
    indexer_handle: &chain::indexer::IndexerStateHandle,
    pool: &PgPool,
    rewind_from_block: u64,
) -> Result<ReorgRewindExecuteOutcome, (StatusCode, Value)> {
    let chain_id = config.chain_id;
    let chain_id_i64 = (chain_id.min(i64::MAX as u64)) as i64;
    let rewind_i64 = rewind_from_block.min(i64::MAX as u64) as i64;

    let ev_deleted = match db::delete_event_log_from_block(pool, chain_id_i64, rewind_i64).await {
        Ok(n) => n,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                crate::api_json::err_key_detail("delete_event_log_failed", e.to_string()),
            ));
        }
    };
    let fr_deleted = match db::delete_fee_router_routed_events_from_block(
        pool,
        chain_id_i64,
        rewind_i64,
    )
    .await
    {
        Ok(n) => n,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                crate::api_json::err_key_detail(
                    "delete_fee_router_routed_events_failed",
                    e.to_string(),
                ),
            ));
        }
    };
    let rv_deleted =
        match db::delete_region_vault_forwarded_events_from_block(pool, chain_id_i64, rewind_i64)
            .await
        {
            Ok(n) => n,
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    crate::api_json::err_key_detail(
                        "delete_region_vault_forwarded_events_failed",
                        e.to_string(),
                    ),
                ));
            }
        };
    let inv_deleted =
        match db::delete_investor_share_transfer_events_from_block(pool, chain_id_i64, rewind_i64)
            .await
        {
            Ok(n) => n,
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    crate::api_json::err_key_detail(
                        "delete_investor_share_transfer_events_failed",
                        e.to_string(),
                    ),
                ));
            }
        };
    let stake_deleted =
        match db::delete_investor_stake_state_events_from_block(pool, chain_id_i64, rewind_i64).await
        {
            Ok(n) => n,
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    crate::api_json::err_key_detail(
                        "delete_investor_stake_state_events_failed",
                        e.to_string(),
                    ),
                ));
            }
        };
    let lock_deleted =
        match db::delete_investor_lock_state_events_from_block(pool, chain_id_i64, rewind_i64).await
        {
            Ok(n) => n,
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    crate::api_json::err_key_detail(
                        "delete_investor_lock_state_events_failed",
                        e.to_string(),
                    ),
                ));
            }
        };
    let gov_deleted =
        match db::delete_governance_proposals_projection_for_chain(pool, chain_id_i64).await {
            Ok(n) => n,
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    crate::api_json::err_key_detail(
                        "delete_governance_proposals_projection_failed",
                        e.to_string(),
                    ),
                ));
            }
        };
    let proj_deleted = match db::delete_orders_projection_for_chain(pool, chain_id_i64).await {
        Ok(n) => n,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                crate::api_json::err_key_detail("delete_orders_projection_failed", e.to_string()),
            ));
        }
    };

    let (nb, nli, nh) =
        chain::indexer::rewind_indexer_memory_state_after_reorg(indexer_handle, rewind_from_block)
            .await;

    if let Err(e) = db::upsert_indexer_checkpoint(
        pool,
        db::INDEXER_CHECKPOINT_CONSUMER_ID,
        chain_id_i64,
        nb as i64,
        nli as i32,
    )
    .await
    {
        return Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            crate::api_json::err_key_detail("upsert_indexer_checkpoint_failed", e.to_string()),
        ));
    }

    let runtime_path_str = format!("{}.runtime", state.indexer_state_path);
    let runtime_path = Path::new(&runtime_path_str);
    {
        let guard = indexer_handle.read().await;
        if let Err(e) = chain::indexer::persist_indexer_state(runtime_path, &guard) {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                crate::api_json::err_key_detail("persist_indexer_state_failed", e.to_string()),
            ));
        }
    }

    let rpc_for_replay = config.rpc_url.trim();
    let rpc_replay_opt = (!rpc_for_replay.is_empty()).then_some(rpc_for_replay);
    let replay = match chain_off::replay_orders_projection_from_event_log(
        pool,
        chain_id_i64,
        rpc_replay_opt,
    )
    .await
    {
        Ok(s) => s,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                crate::api_json::err_key_detail("replay_orders_projection_failed", e.to_string()),
            ));
        }
    };
    let replay_stats_orders = serde_json::to_value(&replay).unwrap_or_else(|_| json!({}));

    let gov_replay = match chain_off::replay_governance_proposals_from_event_log(pool, chain_id_i64)
        .await
    {
        Ok(s) => s,
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                crate::api_json::err_key_detail(
                    "replay_governance_proposals_failed",
                    e.to_string(),
                ),
            ));
        }
    };
    let replay_stats = json!({
        "orders_projection": replay_stats_orders,
        "governance_proposals": serde_json::to_value(&gov_replay).unwrap_or_else(|_| json!({})),
    });

    let mut orders_table_projection_sync = Value::Null;
    if indexer_reorg_sync_orders_from_projection_after_rewind_enabled() {
        match db::sync_orders_from_projection_for_chain(
            pool,
            chain_id_i64,
            indexer_reorg_clear_terminal_orphan_escrow_enabled(),
        )
        .await
        {
            Ok(s) => {
                orders_table_projection_sync =
                    serde_json::to_value(&s).unwrap_or_else(|_| json!({}));
            }
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    crate::api_json::err_key_detail(
                        "sync_orders_from_projection_after_rewind_failed",
                        e.to_string(),
                    ),
                ));
            }
        }
    }

    let mut chain_off_orders_reload = Value::Null;
    if !indexer_reorg_skip_chain_off_order_reload() {
        if let Some(co) = state.chain_off.as_ref() {
            let mut g = co.store.write().await;
            match chain_off::reload_orders_from_db_into_store(pool, &mut g).await {
                Ok(s) => {
                    chain_off_orders_reload =
                        serde_json::to_value(&s).unwrap_or_else(|_| json!({}));
                }
                Err(e) => {
                    return Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        crate::api_json::err_key_detail(
                            "reload_chain_off_orders_from_db_failed",
                            e.to_string(),
                        ),
                    ));
                }
            }
        }
    }

    Ok(ReorgRewindExecuteOutcome {
        deleted_event_log: ev_deleted,
        deleted_fee_router: fr_deleted,
        deleted_region_vault: rv_deleted,
        deleted_investor_share: inv_deleted,
        deleted_investor_stake: stake_deleted,
        deleted_investor_lock: lock_deleted,
        deleted_governance_proposals_projection: gov_deleted,
        deleted_orders_projection: proj_deleted,
        last_block: nb,
        last_log_index: nli,
        last_block_hash: nh,
        replay_stats,
        chain_off_orders_reload,
        orders_table_projection_sync,
    })
}
