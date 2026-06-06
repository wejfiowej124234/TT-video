use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};

use super::env::indexer_strict_supplemental_log_fetch_enabled;
use crate::chain;
use crate::chain_off;
use crate::state::ApiMetaState;

pub(crate) async fn fetch_merged_indexer_tick_logs(
    state: &ApiMetaState,
    config: &chain::ChainConfig,
    factory: &str,
    from_block: u64,
    to_block: u64,
) -> Result<(Vec<chain::indexer::EscrowLogEntry>, Vec<Value>), axum::response::Response> {
    let mut logs =
        match chain::indexer::fetch_escrow_logs(&config.rpc_url, factory, from_block, to_block)
            .await
        {
            Ok(l) => l,
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "fetch_escrow_logs_failed",
                        e,
                    )),
                )
                    .into_response());
            }
        };    let strict_supplemental_logs = indexer_strict_supplemental_log_fetch_enabled();
    let mut logs_fetch_skipped: Vec<Value> = Vec::new();
    // P5-3：从已有关联的 escrow 实例拉取 Released/Refunded/ResolutionExecuted，合并后按 (block, log_index) 排序
    if let Some(ref co) = state.chain_off {
        let addrs = {
            let g = co.store.read().await;
            chain_off::list_escrow_addresses_for_indexer(&g)
        };
        if !addrs.is_empty() {
            match chain::indexer::fetch_logs_from_addresses(
                &config.rpc_url,
                &addrs,
                from_block,
                to_block,
            )
            .await
            {
                Ok(escrow_logs) => logs.extend(escrow_logs),
                Err(e) => {
                    if strict_supplemental_logs {
                        return Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("escrow_instances: {}", e),
                            )),
                        )
                            .into_response());
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "escrow_instances",
                        "addresses": addrs.len(),
                        "error": e
                    }));
                }
            }
        }
        logs.sort_by_key(|t| (t.0, t.1));
    }
    // FeeRouter：PlatformFeeRouted（83/84、14 §1.1）；与 Escrow 日志合并后按 (block, log_index) 排序
    if let Some(ref fr) = config.fee_router_address {
        let fr = fr.trim();
        if !fr.is_empty() {
            match chain::indexer::fetch_logs_from_addresses(
                &config.rpc_url,
                &[fr.to_string()],
                from_block,
                to_block,
            )
            .await
            {
                Ok(fr_logs) => {
                    logs.extend(fr_logs);
                    logs.sort_by_key(|t| (t.0, t.1));
                }
                Err(e) => {
                    if strict_supplemental_logs {
                        return Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("fee_router: {}", e),
                            )),
                        )
                            .into_response());
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "fee_router",
                        "address": fr,
                        "error": e
                    }));
                }
            }
        }
    }
    // RegionVault：RegionVaultForwarded（14 §1.1.1）
    if let Some(ref rv) = config.region_vault_address {
        let rv = rv.trim();
        if !rv.is_empty() {
            match chain::indexer::fetch_logs_from_addresses(
                &config.rpc_url,
                &[rv.to_string()],
                from_block,
                to_block,
            )
            .await
            {
                Ok(rv_logs) => {
                    logs.extend(rv_logs);
                    logs.sort_by_key(|t| (t.0, t.1));
                }
                Err(e) => {
                    if strict_supplemental_logs {
                        return Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("region_vault: {}", e),
                            )),
                        )
                            .into_response());
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "region_vault",
                        "address": rv,
                        "error": e
                    }));
                }
            }
        }
    }
    // P5-1-B：**CountryPoolLedgerV0** `CountryLedgerCredited`（与 **fee_router** / **region_vault** 拉取 **并列追加**；**禁止**从两表派生本投影）
    if let Some(ref cl) = config.country_pool_ledger_address {
        let cl = cl.trim();
        if !cl.is_empty() {
            match chain::indexer::fetch_logs_from_addresses(
                &config.rpc_url,
                &[cl.to_string()],
                from_block,
                to_block,
            )
            .await
            {
                Ok(cl_logs) => {
                    logs.extend(cl_logs);
                    logs.sort_by_key(|t| (t.0, t.1));
                }
                Err(e) => {
                    if strict_supplemental_logs {
                        return Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("country_pool_ledger: {}", e),
                            )),
                        )
                            .into_response());
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "country_pool_ledger",
                        "address": cl,
                        "error": e
                    }));
                }
            }
        }
    }
    // OnboardingFeeReceiver：`OnboardingFeePaid`（96-18、14 §1.1.0c）
    if let Some(ref obr) = config.onboarding_fee_receiver_address {
        let obr = obr.trim();
        if !obr.is_empty() {
            match chain::indexer::fetch_logs_from_addresses(
                &config.rpc_url,
                &[obr.to_string()],
                from_block,
                to_block,
            )
            .await
            {
                Ok(ob_logs) => {
                    logs.extend(ob_logs);
                    logs.sort_by_key(|t| (t.0, t.1));
                }
                Err(e) => {
                    if strict_supplemental_logs {
                        return Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("onboarding_fee_receiver: {}", e),
                            )),
                        )
                            .into_response());
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "onboarding_fee_receiver",
                        "address": obr,
                        "error": e
                    }));
                }
            }
        }
    }
    // Governor：**ProposalCreated / VoteCast / …** → **`event_log`** + **`governance_proposals_projection`**（B-089 Completion）
    if let Some(ref gov_a) = config.governor_address {
        let gov_a = gov_a.trim();
        if !gov_a.is_empty() {
            match chain::indexer::fetch_logs_from_addresses(
                &config.rpc_url,
                &[gov_a.to_string()],
                from_block,
                to_block,
            )
            .await
            {
                Ok(gv_logs) => {
                    logs.extend(gv_logs);
                    logs.sort_by_key(|t| (t.0, t.1));
                }
                Err(e) => {
                    if strict_supplemental_logs {
                        return Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "fetch_supplemental_logs_failed",
                                format!("governor: {}", e),
                            )),
                        )
                            .into_response());
                    }
                    logs_fetch_skipped.push(json!({
                        "scope": "governor",
                        "address": gov_a,
                        "error": e
                    }));
                }
            }
        }
    }
    Ok((logs, logs_fetch_skipped))
}
