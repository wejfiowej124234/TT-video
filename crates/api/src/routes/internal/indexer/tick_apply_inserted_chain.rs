use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use super::tick_types::TickInsertedCtx;
use crate::chain;
use crate::chain_off;
use crate::db;
use crate::routes::internal::common;

/// P5-3/P5-5：新插入事件的 chain_off / fee / vault / onboarding / ledger / region_share 侧投影与 DB 双写。
/// 返回 `(p5_country_ledger_lines_new_delta, region_share_snapshot_lines_new_delta)`。
pub(crate) async fn apply(
    ctx: &TickInsertedCtx<'_>,
) -> Result<(u32, u32), axum::response::Response> {
    let mut p5_country_ledger_lines_new = 0u32;
    let mut region_share_snapshot_lines_new = 0u32;
    if let Some(pool) = ctx
        .state
        .chain_off
        .as_ref()
        .and_then(|co| co.db_pool.as_ref())
    {
        if let (Some(bh), Some(th)) = (
            db::decode_eth_hash_bytes(ctx.block_hash),
            db::decode_eth_hash_bytes(ctx.tx_hash),
        ) {
            let ev_name = chain_off::event_name_from_topic0(ctx.kind);
            let event_type = db::event_type_label(ctx.kind, ev_name);
            let payload = json!({
                "topics": ctx.topics,
                "topic0": &ctx.kind,
                "data": ctx.data_for_fee_parse,
            });
            let fn_i = (ctx.state.finality_n.min(i32::MAX as u64)) as i32;
            let chain_id_i64 = (ctx.config.chain_id.min(i64::MAX as u64)) as i64;
            if let Err(e) = db::insert_event_log(
                pool,
                chain_id_i64,
                ctx.block_number as i64,
                ctx.log_index as i32,
                &bh,
                &th,
                &event_type,
                &payload,
                fn_i,
            )
            .await
            {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "insert_event_log_failed",
                        e.to_string(),
                    )),
                )
                    .into_response());
            };            if let Some(n) = ev_name {
                if matches!(
                    n,
                    "ProposalCreated"
                        | "VoteCast"
                        | "ProposalQueued"
                        | "ProposalExecuted"
                        | "ProposalCanceled"
                ) {
                    let data_hex = ctx.data_for_fee_parse.as_str().unwrap_or("0x").to_string();
                    if let Err(e) = db::apply_governance_projection_from_parsed_event(
                        pool,
                        chain_id_i64,
                        n,
                        ctx.topics,
                        &data_hex,
                    )
                    .await
                    {
                        return Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "apply_governance_projection_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response());
                    }
                }
            }
        }
    };    if chain_off::event_name_from_topic0(ctx.kind) == Some("PlatformFeeRouted") {
        if let (Some(co), Some(router_cfg)) = (
            ctx.state.chain_off.as_ref(),
            ctx.config.fee_router_address.as_ref(),
        ) {
            if let Some(pool) = co.db_pool.as_ref() {
                if let Some((token, words)) =
                    chain_off::parse_platform_fee_routed(ctx.topics, ctx.data_for_fee_parse)
                {
                    let chain_id_i64 = (ctx.config.chain_id.min(i64::MAX as u64)) as i64;
                    let router = common::normalize_hex_addr(router_cfg);
                    if let Err(e) = db::insert_fee_router_routed_event(
                        pool,
                        chain_id_i64,
                        ctx.block_number as i64,
                        ctx.log_index as i32,
                        ctx.block_hash,
                        ctx.tx_hash,
                        &router,
                        &token,
                        &words[0],
                        &words[1],
                        &words[2],
                        &words[3],
                        &words[4],
                    )
                    .await
                    {
                        return Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "insert_fee_router_routed_event_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response());
                    }
                }
            }
        }
    };    if chain_off::event_name_from_topic0(ctx.kind) == Some("RegionVaultForwarded") {
        if let (Some(co), Some(vault_cfg)) = (
            ctx.state.chain_off.as_ref(),
            ctx.config.region_vault_address.as_ref(),
        ) {
            if let Some(pool) = co.db_pool.as_ref() {
                if let Some((token, to, amount_hex)) =
                    chain_off::parse_region_vault_forwarded(ctx.topics, ctx.data_for_fee_parse)
                {
                    let chain_id_i64 = (ctx.config.chain_id.min(i64::MAX as u64)) as i64;
                    let vault = common::normalize_hex_addr(vault_cfg);
                    if let Err(e) = db::insert_region_vault_forwarded_event(
                        pool,
                        chain_id_i64,
                        ctx.block_number as i64,
                        ctx.log_index as i32,
                        ctx.block_hash,
                        ctx.tx_hash,
                        &vault,
                        &token,
                        &to,
                        &amount_hex,
                    )
                    .await
                    {
                        return Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "insert_region_vault_forwarded_event_failed",
                                e.to_string(),
                            )),
                        )
                            .into_response());
                    }
                }
            }
        }
    };    if chain_off::event_name_from_topic0(ctx.kind) == Some("OnboardingFeePaid") {
        if let (Some(co), Some(recv_cfg)) = (
            ctx.state.chain_off.as_ref(),
            ctx.config.onboarding_fee_receiver_address.as_ref(),
        ) {
            let recv_n = common::normalize_hex_addr(recv_cfg);
            let log_n = common::normalize_hex_addr(ctx.log_address);
            if log_n == recv_n {
                if let Some(pool) = co.db_pool.as_ref() {
                    if let Some((idem_hex, payer, role_target, token, amount_hex, fee_ver_hex)) =
                        chain_off::parse_onboarding_fee_paid(ctx.topics, ctx.data_for_fee_parse)
                    {
                        let chain_id_i64 = (ctx.config.chain_id.min(i64::MAX as u64)) as i64;
                        match db::insert_onboarding_fee_paid_event(
                            pool,
                            chain_id_i64,
                            ctx.block_number as i64,
                            ctx.log_index as i32,
                            ctx.block_hash,
                            ctx.tx_hash,
                            &recv_n,
                            &idem_hex,
                            &payer,
                            role_target,
                            &token,
                            &amount_hex,
                            &fee_ver_hex,
                        )
                        .await
                        {
                            Ok(true) => {}
                            Ok(false) => {}
                            Err(e) => {
                                return Err((
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    Json(crate::api_json::err_key_detail(
                                        "insert_onboarding_fee_paid_event_failed",
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
    };    if chain_off::event_name_from_topic0(ctx.kind) == Some("CountryLedgerCredited") {
        if let (Some(co), Some(ledger_cfg)) = (
            ctx.state.chain_off.as_ref(),
            ctx.config.country_pool_ledger_address.as_ref(),
        ) {
            let ledger_n = common::normalize_hex_addr(ledger_cfg);
            let log_n = common::normalize_hex_addr(ctx.log_address);
            if log_n == ledger_n {
                if let Some(pool) = co.db_pool.as_ref() {
                    if let Some((jurisdiction_id, token, amount_hex, ref_hex)) =
                        chain::country_ledger::parse_country_ledger_credited(
                            ctx.topics,
                            ctx.data_for_fee_parse,
                        )
                    {
                        let chain_id_i64 = (ctx.config.chain_id.min(i64::MAX as u64)) as i64;
                        match db::insert_p5_country_ledger_line(
                            pool,
                            chain_id_i64,
                            ctx.block_number as i64,
                            ctx.log_index as i32,
                            ctx.block_hash,
                            ctx.tx_hash,
                            &ledger_n,
                            &jurisdiction_id,
                            &token,
                            1,
                            &amount_hex,
                            &ref_hex,
                            "onchain_credit",
                        )
                        .await
                        {
                            Ok(true) => p5_country_ledger_lines_new += 1,
                            Ok(false) => {}
                            Err(e) => {
                                return Err((
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    Json(crate::api_json::err_key_detail(
                                        "insert_p5_country_ledger_line_failed",
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
    // B-115-4：`RegionShareSnapshotLine` 与 RegionVault 同址 `eth_getLogs` 可合并；物化 `region_share_snapshot_lines`
    if let Some((epoch, region_id, recipient, snap_block, share_hex)) =
        chain::indexer::parse_region_share_snapshot_line(ctx.topics, ctx.data_for_fee_parse)
    {
        if let Some(pool) = ctx
            .state
            .chain_off
            .as_ref()
            .and_then(|co| co.db_pool.as_ref())
        {
            let chain_id_i64 = (ctx.config.chain_id.min(i64::MAX as u64)) as i64;
            match db::insert_region_share_snapshot_line(
                pool,
                chain_id_i64,
                &region_id,
                epoch,
                &recipient,
                snap_block,
                &share_hex,
            )
            .await
            {
                Ok(Some(_)) => region_share_snapshot_lines_new += 1,
                Ok(None) => {}
                Err(e) => {
                    return Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key_detail(
                            "insert_region_share_snapshot_line_failed",
                            e.to_string(),
                        )),
                    )
                        .into_response());
                }
            }
        }
    }
    Ok((p5_country_ledger_lines_new, region_share_snapshot_lines_new))
}
