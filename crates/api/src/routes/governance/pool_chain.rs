//! Pool **`chain_alignment_hint`**、FeeRouter 读数组装、**B110** merge、**ssot_parallel_chain_snapshot**（**TT-MOD-B3-05 · `pool_chain`**）。

use serde_json::json;

use crate::chain::balance_read;
use crate::chain::fee_router_verify;
use crate::state::ApiMetaState;

/// 由两条只读 `eth_call` 的结果组装 **`fee_router_*_read`** 与 **`chain_alignment_derived`**（可单测、与 RPC 解耦）。
pub(crate) fn fee_router_alignment_reads_from_eth_results(
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
pub(crate) fn fee_router_balance_read_from_eth_result(
    balance_res: &Result<String, String>,
) -> serde_json::Value {
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
pub(crate) fn fee_router_erc20_balance_read_from_optional(
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
pub(crate) fn balance_consistency_hint_from_balance_reads(
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
pub(crate) async fn pool_chain_alignment_hint(state: &ApiMetaState) -> serde_json::Value {
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
pub(super) fn merge_country_pool_chain_ssot_fields(body: &mut serde_json::Value, country_balance_hex: &str) {
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
pub(super) fn merge_treasury_pool_chain_ssot_fields(body: &mut serde_json::Value, treasury_native_wei_hex: &str) {
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
pub(super) fn merge_treasury_erc20_pool_chain_ssot_fields(body: &mut serde_json::Value, balance_u256_hex: &str) {
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
