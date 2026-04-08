//! /api/v1/governance（49 G 治理与激励；04 §3.4、49 G.4、50-G1；**protocol-reference** 见 84 文档镜像；**`GET …/governance/params`** 占位聚合见 **B-124**）
//! 有 DB 时从 governance_pool / governance_reward_records / fee_router_routed_events / region_vault_forwarded_events 读取；无 DB 时返回占位。
//! **fee-pool-aggregates**（B-084）：对两投影表按 token / pool_id 做 **uint256 Σ**（只读对账）。
//! 发放逻辑（谁在何时获得多少）待产品定稿后补，见 50 §六附、04 §3.4。
//! Target 语义：FeeRouter/链上治理未部署时，本路由**不得**被理解为链上池真值；占位响应带 `X-Implementation-Status: placeholder`（82 §六 T6、83 SSOT）。

use axum::extract::Query;
use axum::http::header::{HeaderName, HeaderValue};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::json;
use std::collections::BTreeMap;

use crate::chain::balance_read;
use crate::chain::fee_router_verify;
use crate::db;
use crate::state::{
    governance_country_pool_balance_chain_ssot_enabled, governance_pool_balance_chain_ssot_enabled,
    governance_treasury_erc20_pool_balance_chain_ssot_enabled,
    governance_treasury_pool_balance_chain_ssot_enabled, ApiMetaState,
};
use axum::extract::State;

use super::governance_doc_reference;

fn add_placeholder_header(res: &mut axum::response::Response<axum::body::Body>) {
    res.headers_mut().insert(
        HeaderName::from_static("x-implementation-status"),
        HeaderValue::from_static("placeholder"),
    );
}

/// 由两条只读 `eth_call` 的结果组装 **`fee_router_*_read`** 与 **`chain_alignment_derived`**（可单测、与 RPC 解耦）。
fn fee_router_alignment_reads_from_eth_results(
    paused_res: &Result<bool, String>,
    bps_res: &Result<u128, String>,
) -> (serde_json::Value, serde_json::Value, serde_json::Value) {
    let fee_router_chain_read = match paused_res {
        Ok(paused) => json!({
            "distribute_paused": paused,
            "read_status": "ok",
            "method": "distributePaused()"
        }),
        Err(_) => json!(null),
    };
    let fee_router_routing_config_read = match bps_res {
        Ok(bps) => json!({
            "bps_country": bps.to_string(),
            "read_status": "ok",
            "method": "BPS_COUNTRY()"
        }),
        Err(_) => json!(null),
    };
    let chain_alignment_derived = match (paused_res, bps_res) {
        (Ok(_), Ok(_)) => json!("fee_router_readable"),
        (Ok(_), Err(_)) | (Err(_), Ok(_)) => json!("fee_router_partial"),
        (Err(_), Err(_)) => json!("fee_router_unavailable"),
    };
    (
        fee_router_chain_read,
        fee_router_routing_config_read,
        chain_alignment_derived,
    )
}

/// **`eth_getBalance(FeeRouter)`** 结果 → **`fee_router_balance_read`**（失败整块 **`null`**，不参与业务）。
fn fee_router_balance_read_from_eth_result(balance_res: &Result<String, String>) -> serde_json::Value {
    match balance_res {
        Ok(hex) => json!({
            "native_balance_wei_hex": hex,
            "read_status": "ok",
            "method": "eth_getBalance(FeeRouter)",
            "note": "hint only, not pool SSOT; typical platform fees are ERC20, not native"
        }),
        Err(_) => json!(null),
    }
}

/// **`governance_votes_token_address`（`GOVERNANCE_VOTES_TOKEN_ADDRESS`）· `balanceOf(FeeRouter)`** → **`fee_router_erc20_balance_read`**（未配置或失败均为 **`null`**）。
fn fee_router_erc20_balance_read_from_optional(
    token_address: Option<&str>,
    balance_result: Option<Result<String, String>>,
) -> serde_json::Value {
    match (token_address, balance_result) {
        (None, _) | (_, None) => json!(null),
        (Some(token), Some(Ok(hex))) => json!({
            "token_address": token,
            "balance_u256_hex": hex,
            "read_status": "ok",
            "method": "balanceOf(FeeRouter)",
            "note": "hint only; token from chain_config.governance_votes_token_address; not pool SSOT"
        }),
        (Some(_), Some(Err(_))) => json!(null),
    }
}

/// 仅据 **`fee_router_balance_read`** / **`fee_router_erc20_balance_read`** 是否含 **`read_status":"ok"`**（**无**数值运算、**无**业务副作用）；**两者皆不可读**时整块 **`null`**。
fn balance_consistency_hint_from_balance_reads(
    native: &serde_json::Value,
    erc20: &serde_json::Value,
) -> serde_json::Value {
    let native_ok = native
        .as_object()
        .and_then(|o| o.get("read_status"))
        .and_then(|v| v.as_str())
        == Some("ok");
    let erc20_ok = erc20
        .as_object()
        .and_then(|o| o.get("read_status"))
        .and_then(|v| v.as_str())
        == Some("ok");
    match (native_ok, erc20_ok) {
        (true, true) => json!({
            "pattern": "both_balance_hints_ok",
            "note": "presence/read_status only; no numeric cross-check; not SSOT"
        }),
        (true, false) => json!({
            "pattern": "native_balance_hint_only",
            "note": "presence/read_status only; ERC20 hint missing or not ok; not SSOT"
        }),
        (false, true) => json!({
            "pattern": "erc20_balance_hint_only",
            "note": "presence/read_status only; native hint missing or not ok; not SSOT"
        }),
        (false, false) => json!(null),
    }
}

/// **B110-SSOT-03**：与主响应并列的链上快照（**仅**嵌在 **`chain_alignment_hint.ssot_parallel_chain_snapshot`**；**不**写入根级 **`pool_balance`** / **`country_pool`** / **`treasury_pool*`** 等）。
/// 三项读数 **独立**；**`governance_treasury_native_balance_read`**、**`region_vault_erc20_balance_read`** 均为 **并行观测腿**，分别与根级 **`treasury_pool*`**（**`GOVERNANCE_TREASURY_POOL_BALANCE_CHAIN_SSOT`**）、**`country_pool*`**（**`GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT`**，**B110-SSOT-06**）**不得混名混读**。
/// 缺配置或 RPC 失败 → 对应项 **`null`**；内嵌 **`is_chain_ssot:false`**（与根级 hint 一致）。
pub(crate) async fn pool_ssot_parallel_chain_snapshot(state: &ApiMetaState) -> serde_json::Value {
    let null_triple = || {
        json!({
            "is_chain_ssot": false,
            "note": "B110-SSOT-03 parallel reads (04/14 B110-SSOT-01 anchors); not main field SSOT; governance_treasury_native_balance_read observation-only, not root treasury_pool* (GOVERNANCE_TREASURY_POOL_BALANCE_CHAIN_SSOT); region_vault leg observation-only, not root country_pool (GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT)",
            "fee_router_erc20_balance_read": serde_json::Value::Null,
            "governance_treasury_native_balance_read": serde_json::Value::Null,
            "region_vault_erc20_balance_read": serde_json::Value::Null,
        })
    };

    if !crate::state::ssot_parallel_chain_snapshot_observation_enabled() {
        return json!({
            "is_chain_ssot": false,
            "observation_enabled": false,
            "note": "B110-SSOT-05 observation disabled (SSOT_PARALLEL_CHAIN_SNAPSHOT_OBSERVATION=0|false|off|no); parallel RPC skipped; legs null; not main field SSOT; governance_treasury_native_balance_read observation-only, not root treasury_pool* (GOVERNANCE_TREASURY_POOL_BALANCE_CHAIN_SSOT); region_vault leg observation-only, not root country_pool (GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT)",
            "fee_router_erc20_balance_read": serde_json::Value::Null,
            "governance_treasury_native_balance_read": serde_json::Value::Null,
            "region_vault_erc20_balance_read": serde_json::Value::Null,
        });
    }

    let Some(cc) = state.chain_config.as_ref() else {
        return null_triple();
    };
    if !cc.is_configured() {
        return null_triple();
    }
    let rpc = cc.rpc_url.trim();
    if rpc.is_empty() {
        return null_triple();
    }

    let ssot_token = std::env::var("GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let fee_router = cc
        .fee_router_address
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let region_vault = cc
        .region_vault_address
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let treasury = std::env::var("GOVERNANCE_TREASURY_ADDRESS")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let rpc_owned = rpc.to_string();

    let fr_fut = async {
        match (&ssot_token, &fee_router) {
            (Some(tok), Some(fr)) => {
                match balance_read::ssot_read_fee_router_erc20_balance_hex(&rpc_owned, fr, tok).await {
                    Ok(hex) => json!({
                        "balance_u256_hex": hex,
                        "read_status": "ok",
                        "method": "balanceOf(FeeRouter)",
                        "token_address": tok,
                        "note": "parallel snapshot; GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS; not pool SSOT"
                    }),
                    Err(_) => json!(null),
                }
            }
            _ => json!(null),
        }
    };
    let tr_fut = async {
        match &treasury {
            Some(ta) => {
                match balance_read::ssot_read_governance_treasury_native_balance_wei_hex(&rpc_owned, ta).await
                {
                    Ok(hex) => json!({
                        "native_balance_wei_hex": hex,
                        "read_status": "ok",
                        "method": "eth_getBalance(GovernanceTreasury)",
                        "note": "B110-SSOT-03 parallel observation leg (GOVERNANCE_TREASURY_ADDRESS); not root treasury_pool* SSOT (GOVERNANCE_TREASURY_POOL_BALANCE_CHAIN_SSOT on GET …/governance/pool body)"
                    }),
                    Err(_) => json!(null),
                }
            }
            _ => json!(null),
        }
    };
    let rv_fut = async {
        match (&ssot_token, &region_vault) {
            (Some(tok), Some(v)) => {
                match balance_read::ssot_read_region_vault_erc20_balance_hex(&rpc_owned, v, tok).await {
                    Ok(hex) => json!({
                        "balance_u256_hex": hex,
                        "read_status": "ok",
                        "method": "balanceOf(RegionVault)",
                        "token_address": tok,
                        "note": "B110-SSOT-03 parallel observation leg (GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS); not root country_pool SSOT (GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT on GET …/governance/pool body)"
                    }),
                    Err(_) => json!(null),
                }
            }
            _ => json!(null),
        }
    };

    let (fr_v, tr_v, rv_v) = tokio::join!(fr_fut, tr_fut, rv_fut);
    json!({
        "is_chain_ssot": false,
        "note": "B110-SSOT-03 parallel reads (04/14 B110-SSOT-01 anchors); not main field SSOT; governance_treasury_native_balance_read observation-only, not root treasury_pool* (GOVERNANCE_TREASURY_POOL_BALANCE_CHAIN_SSOT); region_vault leg observation-only, not root country_pool (GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT)",
        "fee_router_erc20_balance_read": fr_v,
        "governance_treasury_native_balance_read": tr_v,
        "region_vault_erc20_balance_read": rv_v,
    })
}

/// 链上对齐提示：**`is_chain_ssot` 仍为 false**；**`chain_id` / `fee_router_address`** 来自 **`chain_config`**；**`distributePaused()`**、**`BPS_COUNTRY()`**、**`eth_getBalance(FeeRouter)`** 各一次；**`balanceOf(FeeRouter)`** 仅在配置了 **`governance_votes_token_address`** 时 **一次** `eth_call`（失败子块 **`null`**）；**`chain_alignment_derived`** 仍仅由 **`distributePaused` + `BPS_COUNTRY`** 派生，**非** SSOT；**`ssot_parallel_chain_snapshot`** 见 **B110-SSOT-03**（其中 **`governance_treasury_native_balance_read`** 为 **观测腿**，**非** 根级 **`treasury_pool*`** 主读；**`region_vault_erc20_balance_read`** 为 **观测腿**，**非** 根级 **`country_pool`** 主读；根级主读仅随 **`GET …/governance/pool`** 成功体 **`treasury_pool*`** / **`country_pool_*`** 出现）。
async fn pool_chain_alignment_hint(state: &ApiMetaState) -> serde_json::Value {
    let (chain_id, fee_router_address) = match state.chain_config.as_ref() {
        Some(cc) => {
            let fee = cc
                .fee_router_address
                .as_ref()
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .map(|s| json!(s))
                .unwrap_or(json!(null));
            (json!(cc.chain_id), fee)
        }
        None => (json!(null), json!(null)),
    };

    let (
        fee_router_chain_read,
        fee_router_routing_config_read,
        chain_alignment_derived,
        fee_router_balance_read,
        fee_router_erc20_balance_read,
    ) = match state.chain_config.as_ref() {
        None => (
            json!(null),
            json!(null),
            json!(null),
            json!(null),
            json!(null),
        ),
        Some(cc) if !cc.is_configured() => (
            json!(null),
            json!(null),
            json!("unknown"),
            json!(null),
            json!(null),
        ),
        Some(cc) => {
            let router_s = cc
                .fee_router_address
                .as_ref()
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string());
            match router_s.as_deref() {
                None => (
                    json!(null),
                    json!(null),
                    json!("unknown"),
                    json!(null),
                    json!(null),
                ),
                Some(r) => {
                    let rpc = cc.rpc_url.trim();
                    let gov_token = cc
                        .governance_votes_token_address
                        .as_ref()
                        .map(|s| s.trim())
                        .filter(|s| !s.is_empty())
                        .map(|s| s.to_string());
                    let (paused_res, bps_res, balance_res, erc20_res_opt) =
                        if let Some(ref t) = gov_token {
                            let (p, b, n, e) = tokio::join!(
                                fee_router_verify::eth_call_fee_router_distribute_paused(rpc, r),
                                fee_router_verify::eth_call_fee_router_bps_country(rpc, r),
                                fee_router_verify::eth_get_fee_router_native_balance_wei_hex(rpc, r),
                                fee_router_verify::eth_call_erc20_balance_of_holder_hex(rpc, t, r),
                            );
                            (p, b, n, Some(e))
                        } else {
                            let (p, b, n) = tokio::join!(
                                fee_router_verify::eth_call_fee_router_distribute_paused(rpc, r),
                                fee_router_verify::eth_call_fee_router_bps_country(rpc, r),
                                fee_router_verify::eth_get_fee_router_native_balance_wei_hex(rpc, r),
                            );
                            (p, b, n, None)
                        };
                    let (fee_router_chain_read, fee_router_routing_config_read, chain_alignment_derived) =
                        fee_router_alignment_reads_from_eth_results(&paused_res, &bps_res);
                    let fee_router_balance_read =
                        fee_router_balance_read_from_eth_result(&balance_res);
                    let fee_router_erc20_balance_read =
                        fee_router_erc20_balance_read_from_optional(gov_token.as_deref(), erc20_res_opt);
                    (
                        fee_router_chain_read,
                        fee_router_routing_config_read,
                        chain_alignment_derived,
                        fee_router_balance_read,
                        fee_router_erc20_balance_read,
                    )
                }
            }
        }
    };

    let balance_consistency_hint = balance_consistency_hint_from_balance_reads(
        &fee_router_balance_read,
        &fee_router_erc20_balance_read,
    );

    let ssot_parallel_chain_snapshot = pool_ssot_parallel_chain_snapshot(state).await;

    json!({
        "is_chain_ssot": false,
        "data_source": "projection",
        "chain_alignment_status": "not_aligned",
        "chain_id": chain_id,
        "fee_router_address": fee_router_address,
        "chain_config_source": if state.chain_config.is_some() {
            "api_meta_state_chain_config"
        } else {
            "unmounted"
        },
        "fee_router_chain_read": fee_router_chain_read,
        "fee_router_routing_config_read": fee_router_routing_config_read,
        "fee_router_balance_read": fee_router_balance_read,
        "fee_router_erc20_balance_read": fee_router_erc20_balance_read,
        "balance_consistency_hint": balance_consistency_hint,
        "ssot_parallel_chain_snapshot": ssot_parallel_chain_snapshot,
        "chain_alignment_derived": chain_alignment_derived
    })
}

/// **`GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT`** 开且 **`ssot_read_region_vault_erc20_balance_hex`** 成功时写入 **04** 根级三键；失败/关闸路径**不调用**（**不**写 **`0`**、**不**用 Σ）。
fn merge_country_pool_chain_ssot_fields(body: &mut serde_json::Value, country_balance_hex: &str) {
    if let Some(m) = body.as_object_mut() {
        m.insert(
            "country_pool".to_string(),
            json!(country_balance_hex),
        );
        m.insert(
            "country_pool_data_source".to_string(),
            json!("chain_read"),
        );
        m.insert(
            "country_pool_is_chain_ssot".to_string(),
            json!(true),
        );
    }
}

/// **`GOVERNANCE_TREASURY_POOL_BALANCE_CHAIN_SSOT`** 开且 **`ssot_read_governance_treasury_native_balance_wei_hex`** 成功时写入 **04** 根级三键；失败/关闸路径**不调用**（**不**写 **`0`**、**不**用 Σ）。
fn merge_treasury_pool_chain_ssot_fields(body: &mut serde_json::Value, treasury_native_wei_hex: &str) {
    if let Some(m) = body.as_object_mut() {
        m.insert("treasury_pool".to_string(), json!(treasury_native_wei_hex));
        m.insert(
            "treasury_pool_data_source".to_string(),
            json!("chain_read"),
        );
        m.insert(
            "treasury_pool_is_chain_ssot".to_string(),
            json!(true),
        );
    }
}

/// **`GOVERNANCE_TREASURY_ERC20_POOL_BALANCE_CHAIN_SSOT`** 开且 **`ssot_read_governance_treasury_erc20_balance_hex`** 成功时写入 **04** 根级三键；失败/关闸路径**不调用**（**不**写 **`0`**、**不**用 Σ）。
fn merge_treasury_erc20_pool_chain_ssot_fields(body: &mut serde_json::Value, balance_u256_hex: &str) {
    if let Some(m) = body.as_object_mut() {
        m.insert("treasury_erc20_pool".to_string(), json!(balance_u256_hex));
        m.insert(
            "treasury_erc20_pool_data_source".to_string(),
            json!("chain_read"),
        );
        m.insert(
            "treasury_erc20_pool_is_chain_ssot".to_string(),
            json!(true),
        );
    }
}

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
            let treasury = match std::env::var("GOVERNANCE_TREASURY_ADDRESS")
                .ok()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
            {
                Some(t) => t,
                None => return None,
            };
            balance_read::ssot_read_governance_treasury_native_balance_wei_hex(
                rpc,
                treasury.as_str(),
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
            let treasury = match std::env::var("GOVERNANCE_TREASURY_ADDRESS")
                .ok()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
            {
                Some(t) => t,
                None => return None,
            };
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
                treasury.as_str(),
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

/// GET /api/v1/governance/rewards — 激励/发放记录（50-G1：有 DB 从表读，否则占位）
pub async fn get_governance_rewards(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        match db::list_governance_rewards(pool, 100).await {
            Ok(rows) => {
                let items: Vec<_> = rows
                    .into_iter()
                    .map(|r| {
                        json!({
                            "id": r.id.to_string(),
                            "user_id": r.user_id.map(|u| u.to_string()),
                            "amount": r.amount,
                            "currency": r.currency,
                            "status": r.status,
                            "created_at": r.created_at.to_rfc3339()
                        })
                    })
                    .collect();
                return Json(json!({
                    "status": "ok",
                    "items": items,
                    "data_source": "database",
                    "rule_version": "governance_rewards_v1"
                }))
                .into_response();
            }
            Err(_) => {}
        }
    }
    let mut res = Json(json!({
        "status": "ok",
        "items": [],
        "data_source": "placeholder",
        "note": "49 G 占位：非链上 Claim 真值；激励发放记录待产品定稿后实现"
    }))
    .into_response();
    add_placeholder_header(&mut res);
    res
}

#[derive(Debug, Deserialize)]
pub struct FeeRoutesQuery {
    /// 1..=100，缺省 50
    limit: Option<u32>,
    /// 上一页最后一条的 `{block_number}:{log_index}`
    cursor: Option<String>,
    /// 可选；不传则所有 `chain_id`
    chain_id: Option<i64>,
}

/// GET /api/v1/governance/fee-routes — FeeRouter `PlatformFeeRouted` 索引只读列表（110、14 §1.1）
pub async fn get_governance_fee_routes(
    State(state): State<ApiMetaState>,
    Query(q): Query<FeeRoutesQuery>,
) -> impl IntoResponse {
    let limit = match db::parse_fee_routes_limit(q.limit) {
        Ok(n) => n,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    e,
                    format!(
                        "limit must be 1..={} or omit for default 50",
                        db::FEE_ROUTES_MAX_LIMIT
                    ),
                )),
            )
                .into_response();
        }
    };
    let (after_block, after_log) = match q.cursor.as_deref() {
        None | Some("") => (None, None),
        Some(s) => match db::parse_fee_routes_cursor(s) {
            Ok((b, l)) => (Some(b), Some(l)),
            Err(e) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        e,
                        "cursor must be block_number:log_index from page.next_cursor",
                    )),
                )
                    .into_response();
            }
        },
    };

    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        match db::list_fee_router_routed_events(pool, q.chain_id, after_block, after_log, limit)
            .await
        {
            Ok((rows, has_more)) => {
                let items: Vec<_> = rows
                    .iter()
                    .map(|r| {
                        json!({
                            "id": r.id.to_string(),
                            "chain_id": r.chain_id,
                            "block_number": r.block_number,
                            "log_index": r.log_index,
                            "block_hash": r.block_hash,
                            "tx_hash": r.tx_hash,
                            "router_address": r.router_address,
                            "token_address": r.token_address,
                            "amount_u256_hex": r.amount_u256_hex,
                            "to_country_u256_hex": r.to_country_u256_hex,
                            "to_stakers_u256_hex": r.to_stakers_u256_hex,
                            "to_reserve_u256_hex": r.to_reserve_u256_hex,
                            "to_ops_u256_hex": r.to_ops_u256_hex,
                            "inserted_at": r.inserted_at.to_rfc3339()
                        })
                    })
                    .collect();
                let next_cursor = rows
                    .last()
                    .map(|r| db::encode_fee_routes_cursor(r.block_number, r.log_index));
                return Json(json!({
                    "status": "ok",
                    "items": items,
                    "page": {
                        "has_more": has_more,
                        "next_cursor": next_cursor
                    }
                }))
                .into_response();
            }
            Err(_) => {}
        }
    }
    let mut res = Json(json!({
        "status": "ok",
        "items": [],
        "page": { "has_more": false, "next_cursor": Option::<String>::None },
        "note": "49 G 占位：无 PostgreSQL 或未配置 chain_off DB 时无索引投影；见 internal/indexer-tick + FEE_ROUTER_ADDRESS"
    }))
    .into_response();
    add_placeholder_header(&mut res);
    res
}

/// GET /api/v1/governance/vault-forwards — RegionVault `RegionVaultForwarded` 索引只读列表（110、14 §1.1.1）
pub async fn get_governance_vault_forwards(
    State(state): State<ApiMetaState>,
    Query(q): Query<FeeRoutesQuery>,
) -> impl IntoResponse {
    let limit = match db::parse_fee_routes_limit(q.limit) {
        Ok(n) => n,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    e,
                    format!(
                        "limit must be 1..={} or omit for default 50",
                        db::FEE_ROUTES_MAX_LIMIT
                    ),
                )),
            )
                .into_response();
        }
    };
    let (after_block, after_log) = match q.cursor.as_deref() {
        None | Some("") => (None, None),
        Some(s) => match db::parse_fee_routes_cursor(s) {
            Ok((b, l)) => (Some(b), Some(l)),
            Err(e) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        e,
                        "cursor must be block_number:log_index from page.next_cursor",
                    )),
                )
                    .into_response();
            }
        },
    };

    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(pool) = pool {
        match db::list_region_vault_forwarded_events(
            pool,
            q.chain_id,
            after_block,
            after_log,
            limit,
        )
        .await
        {
            Ok((rows, has_more)) => {
                let items: Vec<_> = rows
                    .iter()
                    .map(|r| {
                        json!({
                            "id": r.id.to_string(),
                            "chain_id": r.chain_id,
                            "block_number": r.block_number,
                            "log_index": r.log_index,
                            "block_hash": r.block_hash,
                            "tx_hash": r.tx_hash,
                            "vault_address": r.vault_address,
                            "token_address": r.token_address,
                            "to_address": r.to_address,
                            "amount_u256_hex": r.amount_u256_hex,
                            "inserted_at": r.inserted_at.to_rfc3339()
                        })
                    })
                    .collect();
                let next_cursor = rows
                    .last()
                    .map(|r| db::encode_fee_routes_cursor(r.block_number, r.log_index));
                return Json(json!({
                    "status": "ok",
                    "items": items,
                    "page": {
                        "has_more": has_more,
                        "next_cursor": next_cursor
                    }
                }))
                .into_response();
            }
            Err(_) => {}
        }
    }
    let mut res = Json(json!({
        "status": "ok",
        "items": [],
        "page": { "has_more": false, "next_cursor": Option::<String>::None },
        "note": "49 G 占位：无 PostgreSQL 或未配置 chain_off DB 时无索引投影；见 internal/indexer-tick + REGION_VAULT_ADDRESS"
    }))
    .into_response();
    add_placeholder_header(&mut res);
    res
}

#[derive(Debug, Deserialize)]
pub struct FeePoolAggregatesQuery {
    /// 可选；不传则聚合全部 `chain_id` 的投影行
    chain_id: Option<i64>,
}

/// B-084：**`cross_check`** 与 **`GET /protocol-reference`** 体同源片段（**TT-B084-FEE-POOL-CROSS-CHECK-PROTOCOL-REFERENCE-001**）。
fn fee_pool_cross_check_json() -> serde_json::Value {
    let pref = governance_doc_reference::protocol_reference_json();
    let checksums = &pref["checksums"];
    let n_countries = pref["phase1_countries"]
        .as_array()
        .map(std::vec::Vec::len);
    json!({
        "protocol_reference_doc_version": pref["doc_version"],
        "phase1_open_fee_points_sum": checksums["phase1_open_fee_points_sum"],
        "phase1_countries_count": n_countries,
        "fee_router_layer1_country_bucket_percent": checksums["country_bucket_percent"],
        "note": "Cross-check GET /api/v1/governance/protocol-reference (84 open_fee_points checksums); aggregates are Σ projection rows only (B-084)"
    })
}

fn build_fee_pool_aggregate_body(
    chain_id_filter: Option<i64>,
    fr: Vec<db::FeeRouterAggregateSourceRow>,
    rv: Vec<db::RegionVaultAggregateSourceRow>,
) -> Result<serde_json::Value, &'static str> {
    use crate::u256_hex::{add_assign_be, fmt_word_hex, parse_u256_word_hex, zero_word};

    #[derive(Default)]
    struct FrAcc {
        allocatable_platform_fee_total: [u8; 32],
        country_bucket: [u8; 32],
        global_stakers: [u8; 32],
        global_reserve: [u8; 32],
        global_ops: [u8; 32],
        rows: u64,
    }

    let mut fr_map: BTreeMap<String, FrAcc> = BTreeMap::new();
    for row in fr {
        let tok = row.token_address.trim().to_ascii_lowercase();
        let ent = fr_map.entry(tok).or_default();
        let w0 = parse_u256_word_hex(&row.amount_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let w1 = parse_u256_word_hex(&row.to_country_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let w2 = parse_u256_word_hex(&row.to_stakers_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let w3 = parse_u256_word_hex(&row.to_reserve_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let w4 = parse_u256_word_hex(&row.to_ops_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        add_assign_be(&mut ent.allocatable_platform_fee_total, &w0)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        add_assign_be(&mut ent.country_bucket, &w1)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        add_assign_be(&mut ent.global_stakers, &w2)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        add_assign_be(&mut ent.global_reserve, &w3)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        add_assign_be(&mut ent.global_ops, &w4)
            .map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        ent.rows += 1;
    }

    let fr_items: Vec<_> = fr_map
        .into_iter()
        .map(|(token_address, a)| {
            json!({
                "token_address": token_address,
                "event_row_count": a.rows,
                "pools": {
                    "allocatable_platform_fee_total_u256_hex": fmt_word_hex(&a.allocatable_platform_fee_total),
                    "country_bucket_u256_hex": fmt_word_hex(&a.country_bucket),
                    "global_stakers_u256_hex": fmt_word_hex(&a.global_stakers),
                    "global_reserve_u256_hex": fmt_word_hex(&a.global_reserve),
                    "global_ops_u256_hex": fmt_word_hex(&a.global_ops)
                },
                "pool_id_legend": "84: country_bucket = PlatformFeeRouted data word[1]; global_stakers/reserve/ops = words[2..5] (ttg_stakers / reserve / operations)"
            })
        })
        .collect();

    #[derive(Default)]
    struct VTok {
        total: [u8; 32],
        by_to: BTreeMap<String, [u8; 32]>,
        rows: u64,
    }
    let mut v_map: BTreeMap<String, VTok> = BTreeMap::new();
    for row in rv {
        let tok = row.token_address.trim().to_ascii_lowercase();
        let to_a = row.to_address.trim().to_ascii_lowercase();
        let amt = parse_u256_word_hex(&row.amount_u256_hex)
            .ok_or("fee_pool_aggregates_malformed_u256_hex")?;
        let ent = v_map.entry(tok).or_default();
        add_assign_be(&mut ent.total, &amt).map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        let slot = ent.by_to.entry(to_a).or_insert_with(zero_word);
        add_assign_be(slot, &amt).map_err(|_| "fee_pool_aggregates_u256_overflow")?;
        ent.rows += 1;
    }

    let rv_items: Vec<_> = v_map
        .into_iter()
        .map(|(token_address, a)| {
            let by_recipient: Vec<_> = a
                .by_to
                .into_iter()
                .map(|(to_address, w)| {
                    json!({
                        "to_address": to_address,
                        "amount_u256_hex": fmt_word_hex(&w),
                    })
                })
                .collect();
            json!({
                "token_address": token_address,
                "event_row_count": a.rows,
                "total_forwarded_u256_hex": fmt_word_hex(&a.total),
                "by_recipient": by_recipient
            })
        })
        .collect();

    Ok(json!({
        "status": "ok",
        "data_source": "projection",
        "ssot": "fee_router_routed_events+region_vault_forwarded_events",
        "chain_id_filter": chain_id_filter,
        "fee_router": {
            "by_token": fr_items,
            "note": "Per-token Σ over indexed PlatformFeeRouted projection rows; uint256 big-endian 0x-hex"
        },
        "region_vault": {
            "by_token": rv_items,
            "note": "Per-token Σ RegionVaultForwarded amount; by_recipient sub-aggregates for downstream pool routing checks"
        },
        "cross_check": fee_pool_cross_check_json(),
        "rule_version": "fee_pool_aggregates_projection_v1",
        "anchor": "B-084-FEE-POOL-AGGREGATES-PROJECTION"
    }))
}

/// GET /api/v1/governance/fee-pool-aggregates — 按 **token** / **pool_id** 的投影累计入量（B-084）
pub async fn get_governance_fee_pool_aggregates(
    State(state): State<ApiMetaState>,
    Query(q): Query<FeePoolAggregatesQuery>,
) -> impl IntoResponse {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let Some(pool) = pool else {
        let mut res = Json(json!({
            "status": "ok",
            "data_source": "placeholder",
            "ssot": "fee_router_routed_events+region_vault_forwarded_events",
            "chain_id_filter": q.chain_id,
            "fee_router": { "by_token": [] },
            "region_vault": { "by_token": [] },
            "cross_check": fee_pool_cross_check_json(),
            "rule_version": "fee_pool_aggregates_projection_v1",
            "anchor": "B-084-FEE-POOL-AGGREGATES-PROJECTION",
            "note": "49 G 占位：无 PostgreSQL 或未配置 chain_off DB 时无聚合源；见 internal/indexer-tick + FEE_ROUTER_ADDRESS / REGION_VAULT_ADDRESS"
        }))
        .into_response();
        add_placeholder_header(&mut res);
        return res;
    };

    let (fr, rv) = match tokio::try_join!(
        db::fetch_fee_router_for_aggregate(pool, q.chain_id),
        db::fetch_region_vault_for_aggregate(pool, q.chain_id),
    ) {
        Ok(x) => x,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key_detail(
                    "fee_pool_aggregates_query_failed",
                    e.to_string(),
                )),
            )
                .into_response();
        }
    };

    match build_fee_pool_aggregate_body(q.chain_id, fr, rv) {
        Ok(v) => Json(v).into_response(),
        Err(key) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key_detail(
                key,
                "u256 parse failed, add overflow, or malformed projection hex; fix DB projection rows",
            )),
        )
            .into_response(),
    }
}

/// GET /api/v1/governance/protocol-reference — 84 文档镜像（非链上真值）
pub async fn get_protocol_reference() -> impl IntoResponse {
    let mut res = Json(governance_doc_reference::protocol_reference_json()).into_response();
    res.headers_mut().insert(
        HeaderName::from_static("x-implementation-status"),
        HeaderValue::from_static("doc-reference"),
    );
    res
}

/// GET /api/v1/governance/protocol-reference/pending — 待生效参数包（默认与文档镜像一致；可选 env 深度合并）
pub async fn get_protocol_reference_pending() -> impl IntoResponse {
    let mut res =
        Json(governance_doc_reference::protocol_reference_pending_json()).into_response();
    res.headers_mut().insert(
        HeaderName::from_static("x-implementation-status"),
        HeaderValue::from_static("doc-reference-pending"),
    );
    res
}

/// GET /api/v1/governance/params — 治理参数聚合占位（`/governance/params` 页主数据仍为 protocol-reference + pending）
pub async fn get_governance_params() -> impl IntoResponse {
    let mut res = Json(json!({
        "status": "ok",
        "params": {},
        "items": [],
        "data_source": "placeholder",
        "note": "49 G 占位：五项费用等对拍见 GET …/protocol-reference 与 …/pending；本端点为契约占位"
    }))
    .into_response();
    add_placeholder_header(&mut res);
    res
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/governance/pool", get(get_governance_pool))
        .route("/api/v1/governance/rewards", get(get_governance_rewards))
        .merge(crate::routes::governance_proposals::router())
        .merge(crate::routes::governance_investor_share::router())
        .merge(crate::routes::investor_distribution::governance_router())
        .merge(crate::routes::governance_delegate::router())
        .merge(crate::routes::governance_voting_power::router())
        .route(
            "/api/v1/governance/fee-routes",
            get(get_governance_fee_routes),
        )
        .route(
            "/api/v1/governance/vault-forwards",
            get(get_governance_vault_forwards),
        )
        .route(
            "/api/v1/governance/fee-pool-aggregates",
            get(get_governance_fee_pool_aggregates),
        )
        .route(
            "/api/v1/governance/protocol-reference",
            get(get_protocol_reference),
        )
        .route(
            "/api/v1/governance/protocol-reference/pending",
            get(get_protocol_reference_pending),
        )
        .route("/api/v1/governance/params", get(get_governance_params))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::chain::ChainConfig;
    use crate::db;
    use crate::routes::governance_proposals::get_governance_proposals_list;
    use crate::state::test_support::api_meta_state;
    use axum::extract::Query;

    /// **B110-SSOT-07 / TT-SSOT-SWITCH-APPLY-001**：`fee-pool-aggregates`（含 **`build_fee_pool_aggregate_body`** Σ 体）**不得**带 **`GET …/governance/pool`** 根级 **`country_pool*`** 链上主读键，以免与 **RegionVault `balanceOf`** SSOT 混淆。
    fn assert_fee_pool_aggregates_has_no_root_country_pool_ssot_keys(v: &serde_json::Value) {
        assert!(
            v.get("country_pool").is_none(),
            "fee-pool-aggregates response must not include root country_pool"
        );
        assert!(
            v.get("country_pool_data_source").is_none(),
            "fee-pool-aggregates must not include country_pool_data_source"
        );
        assert!(
            v.get("country_pool_is_chain_ssot").is_none(),
            "fee-pool-aggregates must not include country_pool_is_chain_ssot"
        );
    }

    /// **B110-SSOT-07 / TT-SSOT-SWITCH-APPLY-002**：`fee-pool-aggregates`（含 **`build_fee_pool_aggregate_body`** Σ 体）**不得**带 **`GET …/governance/pool`** 根级 **`treasury_pool*`** 链上主读键，以免与 **`eth_getBalance(GovernanceTreasury)`** SSOT 混淆。
    fn assert_fee_pool_aggregates_has_no_root_treasury_pool_ssot_keys(v: &serde_json::Value) {
        assert!(
            v.get("treasury_pool").is_none(),
            "fee-pool-aggregates response must not include root treasury_pool"
        );
        assert!(
            v.get("treasury_pool_data_source").is_none(),
            "fee-pool-aggregates must not include treasury_pool_data_source"
        );
        assert!(
            v.get("treasury_pool_is_chain_ssot").is_none(),
            "fee-pool-aggregates must not include treasury_pool_is_chain_ssot"
        );
    }

    /// **B110-SSOT-07 / TT-SSOT-AGGREGATE-EXCLUDE-ERC20-POOL-006**：`fee-pool-aggregates`（含 **`build_fee_pool_aggregate_body`** Σ 体）**不得**带 **`GET …/governance/pool`** 根级 **`treasury_erc20_pool*`** 链上主读键；**Σ** 仅投影 **`fee_router` / `region_vault`**，与 **`ERC20.balanceOf(GovernanceTreasury)`** SSOT 无关。
    fn assert_fee_pool_aggregates_has_no_root_treasury_erc20_pool_ssot_keys(v: &serde_json::Value) {
        assert!(
            v.get("treasury_erc20_pool").is_none(),
            "fee-pool-aggregates response must not include root treasury_erc20_pool"
        );
        assert!(
            v.get("treasury_erc20_pool_data_source").is_none(),
            "fee-pool-aggregates must not include treasury_erc20_pool_data_source"
        );
        assert!(
            v.get("treasury_erc20_pool_is_chain_ssot").is_none(),
            "fee-pool-aggregates must not include treasury_erc20_pool_is_chain_ssot"
        );
    }
    use axum::extract::State;
    use axum::http::StatusCode;
    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
    use http_body_util::BodyExt;
    use serde_json::json;
    use sqlx::postgres::PgPoolOptions;
    use std::sync::Arc;
    use std::time::Duration;
    use tokio::sync::RwLock;

    /// **`GET …/governance/pool`** **`chain_alignment_hint`**：三键在 **非链上 SSOT** 路径下与 **04** 叙事一致（**`database` / `database_empty` / `placeholder`**）。
    fn assert_governance_pool_chain_alignment_hint_projection_not_aligned(h: &serde_json::Value) {
        assert_eq!(h.get("is_chain_ssot"), Some(&json!(false)));
        assert_eq!(
            h.get("data_source").and_then(|x| x.as_str()),
            Some("projection")
        );
        assert_eq!(
            h.get("chain_alignment_status").and_then(|x| x.as_str()),
            Some("not_aligned")
        );
    }

    async fn governance_pool_response_json(state: ApiMetaState) -> serde_json::Value {
        let res = get_governance_pool(State(state)).await.into_response();
        assert_eq!(res.status(), StatusCode::OK);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        serde_json::from_slice(&body).expect("pool json")
    }

    #[tokio::test]
    async fn governance_pool_placeholder_branch_chain_alignment_hint_consistency() {
        let v = governance_pool_response_json(api_meta_state(None)).await;
        assert_eq!(
            v.get("data_source").and_then(|x| x.as_str()),
            Some("placeholder")
        );
        assert_governance_pool_chain_alignment_hint_projection_not_aligned(&v["chain_alignment_hint"]);
    }

    /// 需 **`DATABASE_URL`** 指向已迁移库（含 **`governance_pool`** 表）。**CI 无 DB 时提前返回**（仍验 **placeholder** 枝于上测）。
    #[tokio::test]
    async fn governance_pool_database_branches_chain_alignment_hint_consistency_when_database_url_set(
    ) {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!(
                    "governance_pool database/database_empty branches: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        let pool = match PgPoolOptions::new()
            .max_connections(2)
            .acquire_timeout(Duration::from_secs(5))
            .connect(&url)
            .await
        {
            Ok(p) => p,
            Err(e) => {
                eprintln!("governance_pool DB branches: skip (connect failed): {e}");
                return;
            }
        };

        let state_with_pool = || {
            let co = ChainOffState {
                store: Arc::new(RwLock::new(ChainOffStore::default())),
                config: ChainOffConfig::default(),
                db_pool: Some(pool.clone()),
            };
            api_meta_state(Some(co))
        };

        sqlx::query("DELETE FROM governance_pool")
            .execute(&pool)
            .await
            .expect("delete governance_pool for empty-branch test");

        let v_empty = governance_pool_response_json(state_with_pool()).await;
        assert_eq!(
            v_empty.get("data_source").and_then(|x| x.as_str()),
            Some("database_empty")
        );
        assert_governance_pool_chain_alignment_hint_projection_not_aligned(
            &v_empty["chain_alignment_hint"],
        );

        sqlx::query(
            "INSERT INTO governance_pool (balance, currency, updated_at) VALUES ($1, $2, NOW())",
        )
        .bind("42")
        .bind("TT")
        .execute(&pool)
        .await
        .expect("insert governance_pool for database-branch test");

        let v_db = governance_pool_response_json(state_with_pool()).await;
        assert_eq!(
            v_db.get("data_source").and_then(|x| x.as_str()),
            Some("database")
        );
        assert_governance_pool_chain_alignment_hint_projection_not_aligned(
            &v_db["chain_alignment_hint"],
        );
    }

    async fn governance_rewards_response_parts(
        state: ApiMetaState,
    ) -> (axum::http::StatusCode, axum::http::HeaderMap, serde_json::Value) {
        let res = get_governance_rewards(State(state)).await.into_response();
        let status = res.status();
        let headers = res.headers().clone();
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("rewards json");
        (status, headers, v)
    }

    #[tokio::test]
    async fn governance_rewards_response_placeholder_branch() {
        let (status, headers, v) = governance_rewards_response_parts(api_meta_state(None)).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(
            headers
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("placeholder")
        );
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert_eq!(
            v.get("items").and_then(|x| x.as_array()).map(|a| a.len()),
            Some(0)
        );
        assert_eq!(
            v.get("data_source").and_then(|x| x.as_str()),
            Some("placeholder")
        );
    }

    /// 需 **`DATABASE_URL`**；**CI 无 DB 时提前返回**。
    #[tokio::test]
    async fn governance_rewards_response_database_branch_when_database_url_set() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!("governance_rewards database branch: skip (DATABASE_URL unset)");
                return;
            }
        };
        let pool = match PgPoolOptions::new()
            .max_connections(2)
            .acquire_timeout(Duration::from_secs(5))
            .connect(&url)
            .await
        {
            Ok(p) => p,
            Err(e) => {
                eprintln!("governance_rewards database branch: skip (connect failed): {e}");
                return;
            }
        };
        let co = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(pool),
        };
        let (status, headers, v) =
            governance_rewards_response_parts(api_meta_state(Some(co))).await;
        assert_eq!(status, StatusCode::OK);
        assert!(
            headers.get("x-implementation-status").is_none(),
            "database branch must not set placeholder header"
        );
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert_eq!(
            v.get("data_source").and_then(|x| x.as_str()),
            Some("database")
        );
        assert_eq!(
            v.get("rule_version").and_then(|x| x.as_str()),
            Some("governance_rewards_v1")
        );
        assert!(v.get("items").and_then(|x| x.as_array()).is_some());
    }

    async fn governance_params_response_parts(
    ) -> (axum::http::StatusCode, axum::http::HeaderMap, serde_json::Value) {
        let res = get_governance_params().await.into_response();
        let status = res.status();
        let headers = res.headers().clone();
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("governance params json");
        (status, headers, v)
    }

    #[tokio::test]
    async fn governance_params_response_placeholder_branch() {
        let (status, headers, v) = governance_params_response_parts().await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(
            headers
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("placeholder")
        );
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert_eq!(
            v.get("data_source").and_then(|x| x.as_str()),
            Some("placeholder")
        );
        assert!(
            v.get("params").is_some_and(|p| p.is_object()),
            "params must be a JSON object"
        );
        assert!(
            v.get("items").and_then(|x| x.as_array()).is_some(),
            "items must be an array"
        );
    }

    async fn governance_proposals_response_parts(
        state: ApiMetaState,
    ) -> (axum::http::StatusCode, axum::http::HeaderMap, serde_json::Value) {
        let res = get_governance_proposals_list(State(state)).await.into_response();
        let status = res.status();
        let headers = res.headers().clone();
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("governance proposals json");
        (status, headers, v)
    }

    /// 非 Governor 索引路径：**JSON** **`data_source`** 为 **`chain_off_mvp`**（**`X-Implementation-Status: chain_off_mvp`**），与 **`governance.rs`** 根级 **`placeholder`** 头不同源。
    #[tokio::test]
    async fn governance_proposals_response_placeholder_branch() {
        let (status, headers, v) =
            governance_proposals_response_parts(api_meta_state(None)).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(
            headers
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("chain_off_mvp")
        );
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert_eq!(
            v.get("data_source").and_then(|x| x.as_str()),
            Some("chain_off_mvp")
        );
        assert!(v.get("items").and_then(|x| x.as_array()).is_some());
    }

    /// 需 **`DATABASE_URL`** 且已迁移含 **`governance_proposals_projection`**；**CI 无库/无表时提前返回**。
    #[tokio::test]
    async fn governance_proposals_response_projection_branch_when_database_url_set() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!(
                    "governance_proposals projection branch: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        let pool = match PgPoolOptions::new()
            .max_connections(2)
            .acquire_timeout(Duration::from_secs(5))
            .connect(&url)
            .await
        {
            Ok(p) => p,
            Err(e) => {
                eprintln!("governance_proposals projection branch: skip (connect failed): {e}");
                return;
            }
        };
        if sqlx::query("SELECT 1 FROM governance_proposals_projection LIMIT 1")
            .fetch_optional(&pool)
            .await
            .is_err()
        {
            eprintln!(
                "governance_proposals projection branch: skip (governance_proposals_projection missing)"
            );
            return;
        }

        let co = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(pool),
        };
        let mut state = api_meta_state(Some(co));
        state.chain_config = Some(ChainConfig {
            governor_address: Some("0x0000000000000000000000000000000000000001".to_string()),
            chain_id: 999_001,
            ..Default::default()
        });

        let (status, headers, v) = governance_proposals_response_parts(state).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(
            headers
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("chain_governor_indexed")
        );
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert_eq!(
            v.get("data_source").and_then(|x| x.as_str()),
            Some("governance_proposals_projection")
        );
        assert!(v.get("items").and_then(|x| x.as_array()).is_some());
        if let Some(ga) = v.get("governor_address").and_then(|x| x.as_str()) {
            assert!(
                !ga.trim().is_empty(),
                "governor_address must be non-empty when present"
            );
        }
    }

    #[test]
    fn balance_consistency_hint_presence_only_patterns() {
        let native_ok = json!({"read_status": "ok", "method": "eth_getBalance(FeeRouter)"});
        let erc20_ok = json!({"read_status": "ok", "method": "balanceOf(FeeRouter)"});
        assert_eq!(
            balance_consistency_hint_from_balance_reads(&native_ok, &erc20_ok)["pattern"],
            json!("both_balance_hints_ok")
        );
        assert_eq!(
            balance_consistency_hint_from_balance_reads(&native_ok, &json!(null))["pattern"],
            json!("native_balance_hint_only")
        );
        assert_eq!(
            balance_consistency_hint_from_balance_reads(&json!(null), &erc20_ok)["pattern"],
            json!("erc20_balance_hint_only")
        );
        assert!(balance_consistency_hint_from_balance_reads(&json!(null), &json!(null)).is_null());
        assert!(balance_consistency_hint_from_balance_reads(
            &json!({"read_status": "ok"}),
            &json!({"read_status": "failed"})
        )["pattern"]
            .as_str()
            .is_some_and(|s| s == "native_balance_hint_only"));
    }

    #[test]
    fn fee_router_erc20_balance_read_optional_null_or_ok() {
        assert!(fee_router_erc20_balance_read_from_optional(None, None).is_null());
        assert!(
            fee_router_erc20_balance_read_from_optional(Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"), None)
                .is_null()
        );
        assert!(
            fee_router_erc20_balance_read_from_optional(
                Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
                Some(Err("rpc".into())),
            )
            .is_null()
        );
        let v = fee_router_erc20_balance_read_from_optional(
            Some("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"),
            Some(Ok(
                "0x0000000000000000000000000000000000000000000000000000000000000001".into(),
            )),
        );
        assert_eq!(v["read_status"], json!("ok"));
        assert_eq!(
            v["balance_u256_hex"].as_str(),
            Some("0x0000000000000000000000000000000000000000000000000000000000000001")
        );
    }

    #[test]
    fn fee_router_balance_read_from_eth_result_ok_and_null_on_err() {
        let v = fee_router_balance_read_from_eth_result(&Ok(
            "0x0000000000000000000000000000000000000000000000000000000000000000".into(),
        ));
        assert_eq!(v["read_status"], json!("ok"));
        assert_eq!(
            v["native_balance_wei_hex"].as_str(),
            Some("0x0000000000000000000000000000000000000000000000000000000000000000")
        );
        assert!(fee_router_balance_read_from_eth_result(&Err("rpc".into())).is_null());
    }

    #[test]
    fn fee_router_alignment_reads_covers_readable_partial_unavailable() {
        let (_, _, d) = fee_router_alignment_reads_from_eth_results(&Ok(false), &Ok(100u128));
        assert_eq!(d, json!("fee_router_readable"));

        let (_, _, d) =
            fee_router_alignment_reads_from_eth_results(&Ok(true), &Err("bps fail".into()));
        assert_eq!(d, json!("fee_router_partial"));

        let (_, _, d) =
            fee_router_alignment_reads_from_eth_results(&Err("paused fail".into()), &Ok(1u128));
        assert_eq!(d, json!("fee_router_partial"));

        let (cr, rr, d) =
            fee_router_alignment_reads_from_eth_results(&Err("a".into()), &Err("b".into()));
        assert_eq!(d, json!("fee_router_unavailable"));
        assert_eq!(cr, json!(null));
        assert_eq!(rr, json!(null));
    }

    #[tokio::test]
    async fn pool_chain_alignment_hint_unmounted_null_derived() {
        let st = api_meta_state(None);
        let hint = pool_chain_alignment_hint(&st).await;
        assert!(hint["chain_alignment_derived"].is_null());
        assert!(hint["fee_router_balance_read"].is_null());
        assert!(hint["fee_router_erc20_balance_read"].is_null());
        assert!(hint["balance_consistency_hint"].is_null());
        assert_eq!(hint["ssot_parallel_chain_snapshot"]["is_chain_ssot"], json!(false));
        assert!(hint["ssot_parallel_chain_snapshot"]["fee_router_erc20_balance_read"].is_null());
        assert_eq!(
            hint["chain_config_source"].as_str(),
            Some("unmounted")
        );
        assert_eq!(hint["is_chain_ssot"], json!(false));
        assert_eq!(
            hint["chain_alignment_status"].as_str(),
            Some("not_aligned")
        );
    }

    #[tokio::test]
    async fn pool_chain_alignment_hint_not_configured_unknown() {
        let mut st = api_meta_state(None);
        st.chain_config = Some(ChainConfig {
            rpc_url: String::new(),
            chain_id: 99,
            ..Default::default()
        });
        let hint = pool_chain_alignment_hint(&st).await;
        assert_eq!(hint["chain_alignment_derived"], json!("unknown"));
        assert!(hint["fee_router_balance_read"].is_null());
        assert!(hint["fee_router_erc20_balance_read"].is_null());
        assert!(hint["balance_consistency_hint"].is_null());
        assert_eq!(hint["ssot_parallel_chain_snapshot"]["is_chain_ssot"], json!(false));
    }

    #[tokio::test]
    async fn pool_chain_alignment_hint_configured_but_no_fee_router_unknown() {
        let mut st = api_meta_state(None);
        st.chain_config = Some(ChainConfig {
            rpc_url: "http://127.0.0.1:65534".to_string(),
            chain_id: 1,
            fee_router_address: None,
            ..Default::default()
        });
        let hint = pool_chain_alignment_hint(&st).await;
        assert_eq!(hint["chain_alignment_derived"], json!("unknown"));
        assert!(hint["fee_router_chain_read"].is_null());
        assert!(hint["fee_router_balance_read"].is_null());
        assert!(hint["fee_router_erc20_balance_read"].is_null());
        assert!(hint["balance_consistency_hint"].is_null());
        assert_eq!(hint["ssot_parallel_chain_snapshot"]["is_chain_ssot"], json!(false));
    }

    #[tokio::test]
    async fn protocol_reference_response_has_doc_reference_header_and_body() {
        let res = get_protocol_reference().await.into_response();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("doc-reference")
        );
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert_eq!(
            v.get("doc_version").and_then(|x| x.as_str()),
            Some(governance_doc_reference::DOC_VERSION)
        );
    }

    #[tokio::test]
    async fn protocol_reference_pending_response_has_pending_header_and_source() {
        let res = get_protocol_reference_pending().await.into_response();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("doc-reference-pending")
        );
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert!(
            v.get("pending_package_source")
                .and_then(|x| x.as_str())
                .is_some_and(|s| !s.is_empty()),
            "pending_package_source must be a non-empty string"
        );
    }

    #[tokio::test]
    async fn governance_fee_routes_no_chain_off_sets_placeholder_header() {
        let res = get_governance_fee_routes(
            State(api_meta_state(None)),
            Query(FeeRoutesQuery {
                limit: None,
                cursor: None,
                chain_id: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("placeholder")
        );
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert_eq!(v["items"].as_array().map(|a| a.len()), Some(0));
    }

    #[tokio::test]
    async fn governance_vault_forwards_no_chain_off_sets_placeholder_header() {
        let res = get_governance_vault_forwards(
            State(api_meta_state(None)),
            Query(FeeRoutesQuery {
                limit: None,
                cursor: None,
                chain_id: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("placeholder")
        );
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert_eq!(v["items"].as_array().map(|a| a.len()), Some(0));
    }

    #[tokio::test]
    async fn governance_fee_routes_limit_zero_returns_400() {
        let res = get_governance_fee_routes(
            State(api_meta_state(None)),
            Query(FeeRoutesQuery {
                limit: Some(0),
                cursor: None,
                chain_id: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("invalid_limit")
        );
    }

    #[tokio::test]
    async fn governance_fee_routes_bad_cursor_returns_400() {
        let res = get_governance_fee_routes(
            State(api_meta_state(None)),
            Query(FeeRoutesQuery {
                limit: None,
                cursor: Some("not-a-cursor".to_string()),
                chain_id: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("invalid_cursor")
        );
    }

    #[tokio::test]
    async fn governance_vault_forwards_limit_zero_returns_400() {
        let res = get_governance_vault_forwards(
            State(api_meta_state(None)),
            Query(FeeRoutesQuery {
                limit: Some(0),
                cursor: None,
                chain_id: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("invalid_limit")
        );
    }

    #[tokio::test]
    async fn governance_fee_pool_aggregates_no_chain_off_sets_placeholder_header() {
        let res = get_governance_fee_pool_aggregates(
            State(api_meta_state(None)),
            Query(FeePoolAggregatesQuery { chain_id: None }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("placeholder")
        );
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
        assert_eq!(
            v.get("data_source").and_then(|x| x.as_str()),
            Some("placeholder")
        );
        assert_eq!(v["fee_router"]["by_token"].as_array().map(|a| a.len()), Some(0));
        assert_eq!(
            v["region_vault"]["by_token"].as_array().map(|a| a.len()),
            Some(0)
        );
        assert_eq!(
            v.get("anchor").and_then(|x| x.as_str()),
            Some("B-084-FEE-POOL-AGGREGATES-PROJECTION")
        );
        assert_eq!(
            v["ssot"].as_str(),
            Some("fee_router_routed_events+region_vault_forwarded_events")
        );
        assert_eq!(v["cross_check"], fee_pool_cross_check_json());
        assert_fee_pool_aggregates_has_no_root_country_pool_ssot_keys(&v);
        assert_fee_pool_aggregates_has_no_root_treasury_pool_ssot_keys(&v);
        assert_fee_pool_aggregates_has_no_root_treasury_erc20_pool_ssot_keys(&v);
    }

    /// **TT-B084-FEE-POOL-AGGREGATES-PROJECTION-SSOT-001**：生产 **`build_fee_pool_aggregate_body`** 的 **Σ** 标注 **`ssot`/`data_source`** 与 **`db::fetch_*_for_aggregate`** 投影表同源；**`cross_check`** 与 **`fee_pool_cross_check_json`** / **`protocol_reference_json`** 片段一致。
    #[test]
    fn b084_fee_pool_aggregate_body_projection_ssot_and_cross_check_protocol_reference() {
        use crate::routes::governance_doc_reference;

        let fr = vec![db::FeeRouterAggregateSourceRow {
            token_address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string(),
            amount_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000001".to_string(),
            to_country_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_stakers_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_reserve_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_ops_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
        }];
        let rv = vec![db::RegionVaultAggregateSourceRow {
            token_address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".to_string(),
            to_address: "0xcccccccccccccccccccccccccccccccccccccccc".to_string(),
            amount_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000002".to_string(),
        }];
        let v = build_fee_pool_aggregate_body(Some(137), fr, rv).expect("ok");
        assert_eq!(
            v["ssot"].as_str(),
            Some("fee_router_routed_events+region_vault_forwarded_events")
        );
        assert_eq!(v["data_source"].as_str(), Some("projection"));
        assert!(
            v["fee_router"]["note"]
                .as_str()
                .unwrap_or("")
                .contains("PlatformFeeRouted"),
            "fee_router.note should name indexed projection"
        );
        assert!(
            v["region_vault"]["note"]
                .as_str()
                .unwrap_or("")
                .contains("RegionVaultForwarded"),
            "region_vault.note should name projection"
        );
        let cc = fee_pool_cross_check_json();
        assert_eq!(v["cross_check"], cc);
        let pref = governance_doc_reference::protocol_reference_json();
        assert_eq!(cc["protocol_reference_doc_version"], pref["doc_version"]);
        assert_eq!(
            cc["phase1_open_fee_points_sum"],
            pref["checksums"]["phase1_open_fee_points_sum"]
        );
        assert_eq!(
            cc["fee_router_layer1_country_bucket_percent"],
            pref["checksums"]["country_bucket_percent"]
        );
        assert_eq!(
            cc["phase1_countries_count"],
            json!(pref["phase1_countries"].as_array().map(|a| a.len()))
        );
        assert_eq!(v["fee_router"]["by_token"].as_array().unwrap().len(), 1);
        assert_eq!(v["region_vault"]["by_token"].as_array().unwrap().len(), 1);
    }

    /// **TT-B084-GET-FEE-POOL-AGGREGATES-PATH-001**：**`GET /api/v1/governance/fee-pool-aggregates`**（**`router()`**）与 **`get_governance_fee_pool_aggregates`** 同源 **`cross_check`** / **`ssot`**。
    #[tokio::test]
    async fn b084_get_fee_pool_aggregates_http_route_placeholder_cross_check() {
        use axum::body::Body;
        use axum::http::{Request, StatusCode};
        use tower::util::ServiceExt;

        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/governance/fee-pool-aggregates")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["cross_check"], fee_pool_cross_check_json());
        assert_eq!(
            v["ssot"].as_str(),
            Some("fee_router_routed_events+region_vault_forwarded_events")
        );
    }

    #[test]
    fn fee_pool_aggregate_body_sums_two_fr_rows_same_token() {
        let fr = vec![
            db::FeeRouterAggregateSourceRow {
                token_address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string(),
                amount_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000001"
                        .to_string(),
                to_country_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                        .to_string(),
                to_stakers_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
                        .to_string(),
                to_reserve_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000004"
                        .to_string(),
                to_ops_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000005"
                        .to_string(),
            },
            db::FeeRouterAggregateSourceRow {
                token_address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA".to_string(),
                amount_u256_hex:
                    "0x000000000000000000000000000000000000000000000000000000000000000a"
                        .to_string(),
                to_country_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000001"
                        .to_string(),
                to_stakers_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000000"
                        .to_string(),
                to_reserve_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000000"
                        .to_string(),
                to_ops_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000000"
                        .to_string(),
            },
        ];
        let v = build_fee_pool_aggregate_body(Some(1), fr, vec![]).expect("ok");
        assert_fee_pool_aggregates_has_no_root_country_pool_ssot_keys(&v);
        assert_fee_pool_aggregates_has_no_root_treasury_pool_ssot_keys(&v);
        assert_fee_pool_aggregates_has_no_root_treasury_erc20_pool_ssot_keys(&v);
        let arr = v["fee_router"]["by_token"].as_array().unwrap();
        assert_eq!(arr.len(), 1);
        let pools = &arr[0]["pools"];
        assert_eq!(
            pools["allocatable_platform_fee_total_u256_hex"].as_str().unwrap(),
            "0x000000000000000000000000000000000000000000000000000000000000000b"
        );
        assert_eq!(
            pools["country_bucket_u256_hex"].as_str().unwrap(),
            "0x0000000000000000000000000000000000000000000000000000000000000003"
        );
        assert_eq!(arr[0]["event_row_count"].as_u64(), Some(2));
    }

    /// **TT-SSOT-AGGREGATE-EXCLUDE-ERC20-POOL-006**：即使 **`/governance/pool`** 根级可带 **`treasury_erc20_pool*`**，**Σ** 体也**不得**含该三键；聚合结果与「从未在 Σ JSON 根级引入该字段」一致（仅 **`fee_router` / `region_vault`** 树参与累计）。
    #[test]
    fn fee_pool_aggregate_body_excludes_treasury_erc20_pool_ssot_root_keys() {
        let fr = vec![db::FeeRouterAggregateSourceRow {
            token_address: "0xcccccccccccccccccccccccccccccccccccccccc".to_string(),
            amount_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000001".to_string(),
            to_country_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_stakers_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_reserve_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_ops_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
        }];
        let rv = vec![db::RegionVaultAggregateSourceRow {
            token_address: "0xdddddddddddddddddddddddddddddddddddddddd".to_string(),
            to_address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee".to_string(),
            amount_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000002".to_string(),
        }];
        let v = build_fee_pool_aggregate_body(Some(42), fr.clone(), rv.clone()).expect("ok");
        assert_fee_pool_aggregates_has_no_root_treasury_erc20_pool_ssot_keys(&v);

        let mut polluted = v.clone();
        if let Some(m) = polluted.as_object_mut() {
            m.insert(
                "treasury_erc20_pool".to_string(),
                json!("0x0000000000000000000000000000000000000000000000000de0b6b3a7640000"),
            );
            m.insert("treasury_erc20_pool_data_source".to_string(), json!("chain_read"));
            m.insert("treasury_erc20_pool_is_chain_ssot".to_string(), json!(true));
        }
        let baseline = build_fee_pool_aggregate_body(Some(42), fr, rv).expect("ok");
        assert_fee_pool_aggregates_has_no_root_treasury_erc20_pool_ssot_keys(&baseline);
        assert_eq!(v, baseline, "Σ body must not depend on treasury_erc20_pool*");
        assert_ne!(
            polluted, baseline,
            "sanity: polluted JSON differs only by injected pool SSOT keys"
        );
        assert!(
            polluted.get("treasury_erc20_pool").is_some(),
            "sanity: clone was polluted with treasury_erc20_pool"
        );
    }

    #[tokio::test]
    async fn governance_vault_forwards_bad_cursor_returns_400() {
        let res = get_governance_vault_forwards(
            State(api_meta_state(None)),
            Query(FeeRoutesQuery {
                limit: None,
                cursor: Some("abc".to_string()),
                chain_id: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
        assert_eq!(
            v.get("error").and_then(|x| x.as_str()),
            Some("invalid_cursor")
        );
    }
}
