use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;

use super::tick_types::TickInsertedCtx;
use crate::chain;
use crate::chain_off;
use crate::db;

/// Escrow / order 投影与 `orders_projection` 双写（排除已在 chain 模块处理的辅助事件名）。
pub(crate) async fn apply(ctx: &TickInsertedCtx<'_>) -> Result<(), axum::response::Response> {
    if let Some(ref co) = ctx.state.chain_off {
        if let Some(event_name) = chain_off::event_name_from_topic0(ctx.kind) {
            if !matches!(
                event_name,
                "PlatformFeeRouted"
                    | "RegionVaultForwarded"
                    | "OnboardingFeePaid"
                    | "CountryLedgerCredited"
                    | "RegionShareSnapshotLine"
            ) {
                let want_escrow = event_name == "EscrowCreated";
                if let Some((order_id, escrow_addr)) =
                    chain_off::parse_order_id_and_escrow_from_topics(ctx.topics, want_escrow)
                {
                    let mut g = co.store.write().await;
                    let updated = chain_off::project_chain_event_onto_order(
                        &mut g,
                        order_id,
                        ctx.config.chain_id,
                        ctx.block_number,
                        ctx.log_index,
                        event_name,
                        escrow_addr,
                    );
                    if updated {
                        if let Some(order) = g.orders.get(&order_id).cloned() {
                            drop(g);
                            if let Err(e) = chain_off::try_persist_order_to_db(co, &order).await {
                                return Err((
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    Json(crate::api_json::err_key_detail(
                                        "order_db_persist_failed",
                                        e.to_string(),
                                    )),
                                )
                                    .into_response());
                            };                            if let Some(pool) = co.db_pool.as_ref() {
                                if let Some(raw32) =
                                    chain_off::parse_order_id_bytes32_from_topics(ctx.topics)
                                {
                                    let chain_id_i64 =
                                        (ctx.config.chain_id.min(i64::MAX as u64)) as i64;
                                    let esc = order
                                        .escrow_address
                                        .as_deref()
                                        .and_then(db::decode_evm_address_bytes);
                                    let fallback_status =
                                        chain_off::order_state_to_str(order.state);
                                    let projection_status = if event_name == "ResolutionExecuted" {
                                        chain::resolution_tx::orders_projection_status_for_resolution_executed_event(
                                                Some(ctx.config.rpc_url.as_str()),
                                                ctx.tx_hash,
                                                fallback_status,
                                            )
                                            .await
                                    } else {
                                        fallback_status
                                    };                                    if chain::indexer::allow_orders_projection_funds_terminal_write(
                                        event_name,
                                        ctx.block_number,
                                        ctx.latest,
                                        ctx.state.finality_n,
                                    ) {
                                        if let Err(e) = db::upsert_orders_projection_chain_snapshot(
                                            pool,
                                            &raw32,
                                            chain_id_i64,
                                            ctx.block_number as i64,
                                            ctx.log_index as i32,
                                            event_name,
                                            (!order.tourist_id.is_nil())
                                                .then_some(order.tourist_id),
                                            (!order.guide_id.is_nil()).then_some(order.guide_id),
                                            projection_status,
                                            esc.as_deref(),
                                        )
                                        .await
                                        {
                                            return Err((
                                                StatusCode::INTERNAL_SERVER_ERROR,
                                                Json(crate::api_json::err_key_detail(
                                                    "upsert_orders_projection_chain_snapshot_failed",
                                                    e.to_string(),
                                                )),
                                            )
                                                .into_response());
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    Ok(())
}
