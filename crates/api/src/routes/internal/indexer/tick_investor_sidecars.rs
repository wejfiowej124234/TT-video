use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};

use crate::chain;
use crate::db;
use crate::routes::internal::common;
use crate::state::ApiMetaState;

/// Investor share ERC20 / staking / lock 侧车日志摄取（与 escrow 主批并列）。
pub(crate) async fn indexer_tick_apply_investor_sidecars(
    state: &ApiMetaState,
    config: &chain::ChainConfig,
    from_block: u64,
    to_block: u64,
    strict_supplemental_logs: bool,
    logs_fetch_skipped: &mut Vec<Value>,
) -> Result<(u32, u32, u32), axum::response::Response> {
    let mut investor_share_transfer_events_new = 0u32;
    let mut investor_stake_state_events_new = 0u32;
    let mut investor_lock_state_events_new = 0u32;
    let share_tokens: Vec<String> = config
        .investor_share_token_addresses
        .iter()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
    if !share_tokens.is_empty() {
        if let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) {
            match chain::indexer::fetch_erc20_transfer_logs_for_tokens(
                &config.rpc_url,
                &share_tokens,
                from_block,
                to_block,
            )
            .await
            {
                Ok(fetched) => {
                    let chain_id_i64 = (config.chain_id.min(i64::MAX as u64)) as i64;
                    for ev in fetched {
                        let token_n = common::normalize_hex_addr(&ev.token_address);
                        let from_n = common::normalize_hex_addr(&ev.from_address);
                        let to_n = common::normalize_hex_addr(&ev.to_address);
                        match db::insert_investor_share_transfer_event(
                            pool,
                            chain_id_i64,
                            ev.block_number as i64,
                            ev.log_index as i32,
                            &ev.block_hash,
                            &ev.tx_hash,
                            &token_n,
                            &from_n,
                            &to_n,
                            &ev.value_u256_hex,
                        )
                        .await
                        {
                            Ok(n) if n > 0 => investor_share_transfer_events_new += 1,
                            Ok(_) => {}
                            Err(e) => {
                                return Err((
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    Json(crate::api_json::err_key_detail(
                                        "insert_investor_share_transfer_event_failed",
                                        e.to_string(),
                                    )),
                                )
                                    .into_response());
                            }
                        }
                    }
                }
                Err(e) => {
                    if strict_supplemental_logs {
                        return Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("investor_share_tokens: {}", e),
                            )),
                        )
                            .into_response());
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "investor_share_tokens",
                        "addresses": share_tokens.len(),
                        "error": e
                    }));
                }
            }
        }
    };    let staking_trimmed = config
        .staking_address
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    if let Some(staking_raw) = staking_trimmed.as_ref() {
        if let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) {
            let staking_n = common::normalize_hex_addr(staking_raw);
            match chain::indexer::fetch_staking_state_logs(
                &config.rpc_url,
                &staking_n,
                from_block,
                to_block,
            )
            .await
            {
                Ok(fetched) => {
                    let chain_id_i64 = (config.chain_id.min(i64::MAX as u64)) as i64;
                    for ev in fetched {
                        let user_n = common::normalize_hex_addr(&ev.user_address);
                        let sc_n = common::normalize_hex_addr(&ev.staking_contract_address);
                        match db::insert_investor_stake_state_event(
                            pool,
                            chain_id_i64,
                            ev.block_number as i64,
                            ev.log_index as i32,
                            &ev.block_hash,
                            &ev.tx_hash,
                            &sc_n,
                            &user_n,
                            &ev.event_kind,
                            &ev.amount_u256_hex,
                        )
                        .await
                        {
                            Ok(n) if n > 0 => investor_stake_state_events_new += 1,
                            Ok(_) => {}
                            Err(e) => {
                                return Err((
                                    StatusCode::INTERNAL_SERVER_ERROR,
                                    Json(crate::api_json::err_key_detail(
                                        "insert_investor_stake_state_event_failed",
                                        e.to_string(),
                                    )),
                                )
                                    .into_response());
                            }
                        }
                    }
                }
                Err(e) => {
                    if strict_supplemental_logs {
                        return Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("staking_contract: {}", e),
                            )),
                        )
                            .into_response());
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "staking_contract",
                        "error": e
                    }));
                }
            }
        }
    };    let lock_addrs: Vec<String> = config
        .investor_lock_contract_addresses
        .iter()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();
    if !lock_addrs.is_empty() {
        if let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) {
            let chain_id_i64 = (config.chain_id.min(i64::MAX as u64)) as i64;
            for lock_raw in &lock_addrs {
                let lock_n = common::normalize_hex_addr(lock_raw);
                match chain::indexer::fetch_investor_lock_state_logs(
                    &config.rpc_url,
                    &lock_n,
                    from_block,
                    to_block,
                )
                .await
                {
                    Ok(fetched) => {
                        for ev in fetched {
                            let user_n = common::normalize_hex_addr(&ev.user_address);
                            let lc_n = common::normalize_hex_addr(&ev.lock_contract_address);
                            match db::insert_investor_lock_state_event(
                                pool,
                                chain_id_i64,
                                ev.block_number as i64,
                                ev.log_index as i32,
                                &ev.block_hash,
                                &ev.tx_hash,
                                &lc_n,
                                &user_n,
                                &ev.event_kind,
                                &ev.amount_u256_hex,
                            )
                            .await
                            {
                                Ok(n) if n > 0 => investor_lock_state_events_new += 1,
                                Ok(_) => {}
                                Err(e) => {
                                    return Err((
                                        StatusCode::INTERNAL_SERVER_ERROR,
                                        Json(crate::api_json::err_key_detail(
                                            "insert_investor_lock_state_event_failed",
                                            e.to_string(),
                                        )),
                                    )
                                        .into_response());
                                }
                            }
                        }
                    }
                    Err(e) => {
                        if strict_supplemental_logs {
                            return Err((
                                StatusCode::INTERNAL_SERVER_ERROR,
                                Json(crate::api_json::err_key_detail(
                                    "fetch_supplemental_logs_failed",
                                    format!("investor_lock_contract: {}", e),
                                )),
                            )
                                .into_response());
                        }
                        logs_fetch_skipped.push(json!({
                            "scope": "investor_lock_contract",
                            "address": lock_n,
                            "error": e
                        }));
                    }
                }
            }
        }
    }
    Ok((
        investor_share_transfer_events_new,
        investor_stake_state_events_new,
        investor_lock_state_events_new,
    ))
}
