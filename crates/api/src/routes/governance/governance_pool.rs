//! `GET /api/v1/governance/pool`（**TT-MOD-B3-05 · `governance_pool`**）。

use axum::extract::State;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::chain::balance_read;
use crate::db;
use crate::state::{
    governance_country_pool_balance_chain_ssot_enabled, governance_pool_balance_chain_ssot_enabled,
    governance_treasury_erc20_pool_balance_chain_ssot_enabled,
    governance_treasury_pool_balance_chain_ssot_enabled, ApiMetaState,
};

use super::common::add_placeholder_header;
use super::pool_chain::{
    merge_country_pool_chain_ssot_fields, merge_treasury_erc20_pool_chain_ssot_fields,
    merge_treasury_pool_chain_ssot_fields, pool_chain_alignment_hint,
};

/// GET /api/v1/governance/pool — 治理币池（50-G1：有 DB 从表读，否则占位）
pub async fn get_governance_pool(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let hint = pool_chain_alignment_hint(&state).await;

    let (country_pool_chain_hex, treasury_pool_chain_hex, treasury_erc20_pool_chain_hex) = tokio::join!(
        async {
            if !governance_country_pool_balance_chain_ssot_enabled() {
                return None;
            }
            let cc = match state.chain_config.as_ref() {
                Some(c) if c.is_configured() => c,
                _ => return None,
            };
            let rpc = cc.rpc_url.trim();
            if rpc.is_empty() {
                return None;
            }
            let region_vault = match cc
                .region_vault_address
                .as_ref()
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
            {
                Some(v) => v,
                None => return None,
            };
            let ssot_token = match std::env::var("GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS")
                .ok()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
            {
                Some(t) => t,
                None => return None,
            };
            balance_read::ssot_read_region_vault_erc20_balance_hex(
                rpc,
                region_vault,
                ssot_token.as_str(),
            )
            .await
            .ok()
        },
        async {
            if !governance_treasury_pool_balance_chain_ssot_enabled() {
                return None;
            }
            let cc = match state.chain_config.as_ref() {
                Some(c) if c.is_configured() => c,
                _ => return None,
            };
            let rpc = cc.rpc_url.trim();
            if rpc.is_empty() {
                return None;
            }
            let treasury = cc
                .treasury_address
                .as_ref()
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())?;
            balance_read::ssot_read_governance_treasury_native_balance_wei_hex(
                rpc,
                treasury,
            )
            .await
            .ok()
        },
        async {
            if !governance_treasury_erc20_pool_balance_chain_ssot_enabled() {
                return None;
            }
            let cc = match state.chain_config.as_ref() {
                Some(c) if c.is_configured() => c,
                _ => return None,
            };
            let rpc = cc.rpc_url.trim();
            if rpc.is_empty() {
                return None;
            }
            let treasury = cc
                .treasury_address
                .as_ref()
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())?;
            let token = match std::env::var("GOVERNANCE_TREASURY_SSOT_TOKEN_ADDRESS")
                .ok()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
            {
                Some(t) => t,
                None => return None,
            };
            balance_read::ssot_read_governance_treasury_erc20_balance_hex(
                rpc,
                treasury,
                token.as_str(),
            )
            .await
            .ok()
        },
    );

    if governance_pool_balance_chain_ssot_enabled() {
        if let Some(cc) = state.chain_config.as_ref() {
            if cc.is_configured() {
                let rpc = cc.rpc_url.trim();
                if !rpc.is_empty() {
                    let fee_router = cc
                        .fee_router_address
                        .as_ref()
                        .map(|s| s.trim())
                        .filter(|s| !s.is_empty());
                    let ssot_token = std::env::var("GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS")
                        .ok()
                        .map(|s| s.trim().to_string())
                        .filter(|s| !s.is_empty());
                    if let (Some(fr), Some(tok)) = (fee_router, ssot_token.as_deref()) {
                        if let Ok(hex) =
                            balance_read::ssot_read_fee_router_erc20_balance_hex(rpc, fr, tok).await
                        {
                            let mut body = json!({
                                "status": "ok",
                                "pool_balance": hex,
                                "currency": tok,
                                "updated_at": null,
                                "data_source": "chain_read",
                                "is_chain_ssot": true,
                                "rule_version": "governance_pool_v1",
                                "chain_alignment_hint": hint
                            });
                            if let Some(ref ch) = country_pool_chain_hex {
                                merge_country_pool_chain_ssot_fields(&mut body, ch);
                            }
                            if let Some(ref th) = treasury_pool_chain_hex {
                                merge_treasury_pool_chain_ssot_fields(&mut body, th);
                            }
                            if let Some(ref eh) = treasury_erc20_pool_chain_hex {
                                merge_treasury_erc20_pool_chain_ssot_fields(&mut body, eh);
                            }
                            return Json(body).into_response();
                        }
                    }
                }
            }
        }
    }
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        match db::get_governance_pool(pool).await {
            Ok(Some(row)) => {
                let mut body = json!({
                    "status": "ok",
                    "pool_balance": row.balance,
                    "currency": row.currency,
                    "updated_at": row.updated_at.to_rfc3339(),
                    "data_source": "database",
                    "rule_version": "governance_pool_v1",
                    "chain_alignment_hint": hint
                });
                if let Some(ref ch) = country_pool_chain_hex {
                    merge_country_pool_chain_ssot_fields(&mut body, ch);
                }
                if let Some(ref th) = treasury_pool_chain_hex {
                    merge_treasury_pool_chain_ssot_fields(&mut body, th);
                }
                if let Some(ref eh) = treasury_erc20_pool_chain_hex {
                    merge_treasury_erc20_pool_chain_ssot_fields(&mut body, eh);
                }
                return Json(body).into_response();
            }
            Ok(None) => {
                let mut body = json!({
                    "status": "ok",
                    "pool_balance": null,
                    "currency": null,
                    "updated_at": null,
                    "data_source": "database_empty",
                    "rule_version": "governance_pool_v1",
                    "note": "governance_pool 表当前无行；非链上 FeeRouter 真值，与 04 §3.4 / 83·84 叙事一致",
                    "chain_alignment_hint": hint
                });
                if let Some(ref ch) = country_pool_chain_hex {
                    merge_country_pool_chain_ssot_fields(&mut body, ch);
                }
                if let Some(ref th) = treasury_pool_chain_hex {
                    merge_treasury_pool_chain_ssot_fields(&mut body, th);
                }
                if let Some(ref eh) = treasury_erc20_pool_chain_hex {
                    merge_treasury_erc20_pool_chain_ssot_fields(&mut body, eh);
                }
                return Json(body).into_response();
            }
            Err(_) => {}
        }
    }
    let mut body = json!({
        "status": "ok",
        "pool_balance": null,
        "currency": null,
        "data_source": "placeholder",
        "note": "49 G 占位：非链上 FeeRouter 真值；治理币池待产品定稿后实现",
        "chain_alignment_hint": hint
    });
    if let Some(ref ch) = country_pool_chain_hex {
        merge_country_pool_chain_ssot_fields(&mut body, ch);
    }
    if let Some(ref th) = treasury_pool_chain_hex {
        merge_treasury_pool_chain_ssot_fields(&mut body, th);
    }
    if let Some(ref eh) = treasury_erc20_pool_chain_hex {
        merge_treasury_erc20_pool_chain_ssot_fields(&mut body, eh);
    }
    let mut res = Json(body).into_response();
    add_placeholder_header(&mut res);
    res
}
