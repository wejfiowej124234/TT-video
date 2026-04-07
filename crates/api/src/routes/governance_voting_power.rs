//! B-092：只读 **`GET /api/v1/governance/voting-power`**（当前委托图下的可投票权重；与计票 **冻结权重** 同源公式）。
//! **TT-COMP-B092**：可选 **`snapshot_block`** + **`Staking.stakeOf`** **`eth_call`** 与 **`delegation_units_v1`** **并列对账**；**`POST …/vote` 计票** 仍 **仅** **`delegation_units_v1`**（本卡 **不改** **`governance_proposals`**）。
//! **TT-COMP-B092-COUNTRY-POOL-SNAPSHOT-001**：同 **`snapshot_block`** 下对 **`INVESTOR_SHARE_TOKEN_ADDRESSES`**（与 **B-085** **`indexer-tick`** 同源）各 ERC20 **`balanceOf(default_wallet)`** **`eth_call`**，响应 **`country_pool_share_snapshot`**。

use axum::extract::{Query, State};
use axum::http::header::{HeaderName, HeaderValue};
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use axum::Router;
use digest::Digest;
use serde::Deserialize;
use serde_json::json;
use sha3::Keccak256;
use uuid::Uuid;

use crate::routes::governance_delegation_store::{
    delegate_store, direct_delegator_count, is_delegating_away, voter_weight_units_now,
};
use crate::state::{extract_user_with_session_check, ApiMetaState};

const IMPL_HEADER: &str = "x-implementation-status";
const IMPL_VALUE: &str = "chain_off_mvp";

fn mvp_headered(mut res: axum::response::Response) -> axum::response::Response {
    res.headers_mut().insert(
        HeaderName::from_static(IMPL_HEADER),
        HeaderValue::from_static(IMPL_VALUE),
    );
    res
}

const WEIGHT_SSOT: &str = "delegation_units_v1";
const ANCHOR: &str = "B-092-GOV-VOTE-WEIGHT-DELEGATION-MVP";
const COMP_ANCHOR: &str = "TT-COMP-B092-VOTE-WEIGHT-STAKE-SNAPSHOT-001";
const COMP_ANCHOR_COUNTRY: &str = "TT-COMP-B092-COUNTRY-POOL-SNAPSHOT-001";

/// 与 **`Staking.sol`** **`MIN_STAKE`**（**1000e6**）一致，用于 **`meets_contract_min_stake`** 观测。
const STAKING_MIN_STAKE_UNITS: u128 = 1000 * 1_000_000;

#[derive(Debug, Deserialize, Default)]
#[serde(default)]
pub(crate) struct GovernanceVotingPowerQuery {
    /// 指定时：对 **`Staking.stakeOf(default_wallet)`** 做 **`eth_call`**（块高 **本参数**）。
    pub(crate) snapshot_block: Option<u64>,
}

fn encode_address_arg_call(selector: [u8; 4], wallet_hex: &str) -> String {
    let addr = wallet_hex
        .trim()
        .trim_start_matches("0x")
        .trim_start_matches("0X");
    let mut padded = [0u8; 32];
    if addr.len() == 40 {
        if let Ok(a) = hex::decode(addr) {
            padded[12..32].copy_from_slice(&a);
        }
    }
    let mut data = Vec::with_capacity(36);
    data.extend_from_slice(&selector);
    data.extend_from_slice(&padded);
    format!("0x{}", hex::encode(data))
}

fn selector_stake_of_address() -> [u8; 4] {
    let h = Keccak256::digest(b"stakeOf(address)");
    [h[0], h[1], h[2], h[3]]
}

fn encode_stake_of_calldata(wallet_hex: &str) -> String {
    encode_address_arg_call(selector_stake_of_address(), wallet_hex)
}

fn selector_balance_of_address() -> [u8; 4] {
    let h = Keccak256::digest(b"balanceOf(address)");
    [h[0], h[1], h[2], h[3]]
}

fn encode_balance_of_calldata(wallet_hex: &str) -> String {
    encode_address_arg_call(selector_balance_of_address(), wallet_hex)
}

fn normalize_contract_address(s: &str) -> Option<String> {
    let t = s.trim();
    if t.is_empty() {
        return None;
    }
    Some(if t.starts_with("0x") || t.starts_with("0X") {
        t.to_string()
    } else {
        format!("0x{}", t)
    })
}

fn parse_u256_result_word(hex_str: &str) -> Result<[u8; 32], String> {
    let raw = hex::decode(hex_str.trim_start_matches("0x").trim_start_matches("0X"))
        .map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Err("eth_call result too short".to_string());
    }
    let start = raw.len() - 32;
    let mut out = [0u8; 32];
    out.copy_from_slice(&raw[start..]);
    Ok(out)
}

fn u256_word_meets_min_stake(word: &[u8; 32]) -> bool {
    if word[..16].iter().any(|&b| b != 0) {
        return true;
    }
    let lo = u128::from_be_bytes(word[16..32].try_into().expect("len 16"));
    lo >= STAKING_MIN_STAKE_UNITS
}

async fn resolve_user_default_wallet(state: &ApiMetaState, uid: Uuid) -> Option<String> {
    let co = state.chain_off.as_ref()?;
    if let Some(ref pool) = co.db_pool {
        return crate::db::get_user_default_wallet_by_id(pool, uid)
            .await
            .ok()
            .flatten()
            .filter(|s| !s.trim().is_empty());
    }
    let st = co.store.read().await;
    st.users
        .get(&uid)
        .and_then(|u| u.default_wallet_address.clone())
        .filter(|s| !s.trim().is_empty())
}

async fn eth_call_at_block(
    rpc_url: &str,
    to_addr: &str,
    data: &str,
    block: u64,
) -> Result<String, String> {
    let to = normalize_contract_address(to_addr).ok_or("invalid contract address")?;
    let block_tag = format!("0x{:x}", block);
    let body = json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": to, "data": data}, block_tag],
        "id": 1
    });
    let client = reqwest::Client::new();
    let res: serde_json::Value = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    res.get("result")
        .and_then(|r| r.as_str())
        .map(std::string::ToString::to_string)
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or("eth_call failed")
                .to_string()
        })
}

async fn read_staking_stake_u256_hex_at_block(
    rpc_url: &str,
    staking_addr: &str,
    wallet: &str,
    block: u64,
) -> Result<String, String> {
    let w = normalize_contract_address(wallet).ok_or("invalid wallet address")?;
    let data = encode_stake_of_calldata(&w);
    let hex_result = eth_call_at_block(rpc_url, staking_addr, &data, block).await?;
    let word = parse_u256_result_word(&hex_result)?;
    Ok(format!("0x{}", hex::encode(word)))
}

async fn read_erc20_balance_u256_hex_at_block(
    rpc_url: &str,
    token_addr: &str,
    wallet: &str,
    block: u64,
) -> Result<String, String> {
    let w = normalize_contract_address(wallet).ok_or("invalid wallet address")?;
    let data = encode_balance_of_calldata(&w);
    let hex_result = eth_call_at_block(rpc_url, token_addr, &data, block).await?;
    let word = parse_u256_result_word(&hex_result)?;
    Ok(format!("0x{}", hex::encode(word)))
}

async fn stake_snapshot_value(
    state: &ApiMetaState,
    viewer: Option<Uuid>,
    q: &GovernanceVotingPowerQuery,
    delegation_mvp_units: Option<u64>,
) -> serde_json::Value {
    let block = match q.snapshot_block {
        Some(b) => b,
        None => {
            return json!({
                "block": serde_json::Value::Null,
                "stake_u256_hex": serde_json::Value::Null,
                "read_status": "skipped_no_snapshot_block_param",
                "error": serde_json::Value::Null,
                "meets_contract_min_stake": serde_json::Value::Null,
                "reconcile": {
                    "delegation_units_mvp": delegation_mvp_units,
                    "note": format!("Pass snapshot_block query to eth_call Staking.stakeOf at block ({COMP_ANCHOR}). POST …/vote tally unchanged (delegation_units_v1 only).")
                },
                "anchor": COMP_ANCHOR
            });
        }
    };

    let Some(uid) = viewer else {
        return json!({
            "block": block,
            "stake_u256_hex": serde_json::Value::Null,
            "read_status": "skipped_unauthenticated",
            "error": serde_json::Value::Null,
            "meets_contract_min_stake": serde_json::Value::Null,
            "reconcile": {
                "delegation_units_mvp": serde_json::Value::Null,
                "note": "Sign in and set default_wallet_address to reconcile stake at snapshot."
            },
            "anchor": COMP_ANCHOR
        });
    };

    let Some(ref cfg) = state.chain_config else {
        return json!({
            "block": block,
            "stake_u256_hex": serde_json::Value::Null,
            "read_status": "skipped_no_chain_config",
            "error": serde_json::Value::Null,
            "meets_contract_min_stake": serde_json::Value::Null,
            "reconcile": {
                "delegation_units_mvp": delegation_mvp_units,
                "note": "CHAIN_RPC_URL / ChainConfig not mounted."
            },
            "anchor": COMP_ANCHOR
        });
    };
    if !cfg.is_configured() {
        return json!({
            "block": block,
            "stake_u256_hex": serde_json::Value::Null,
            "read_status": "skipped_chain_rpc_unconfigured",
            "error": serde_json::Value::Null,
            "meets_contract_min_stake": serde_json::Value::Null,
            "reconcile": {
                "delegation_units_mvp": delegation_mvp_units,
                "note": "chain_config.rpc_url empty."
            },
            "anchor": COMP_ANCHOR
        });
    }

    let staking = match cfg.staking_address.as_ref().map(|s| s.trim()).filter(|s| !s.is_empty()) {
        Some(s) => s.to_string(),
        None => {
            return json!({
                "block": block,
                "stake_u256_hex": serde_json::Value::Null,
                "read_status": "skipped_no_staking_address",
                "error": serde_json::Value::Null,
                "meets_contract_min_stake": serde_json::Value::Null,
                "reconcile": {
                    "delegation_units_mvp": delegation_mvp_units,
                    "note": "Set STAKING_ADDRESS / chain_config.staking_address."
                },
                "anchor": COMP_ANCHOR
            });
        }
    };

    let wallet = match resolve_user_default_wallet(state, uid).await {
        Some(w) => w,
        None => {
            return json!({
                "block": block,
                "stake_u256_hex": serde_json::Value::Null,
                "read_status": "skipped_no_wallet",
                "error": serde_json::Value::Null,
                "meets_contract_min_stake": serde_json::Value::Null,
                "reconcile": {
                    "delegation_units_mvp": delegation_mvp_units,
                    "note": "users.default_wallet_address / profile wallet required for stakeOf(address)."
                },
                "anchor": COMP_ANCHOR
            });
        }
    };

    match read_staking_stake_u256_hex_at_block(&cfg.rpc_url, &staking, &wallet, block).await {
        Ok(hex_s) => {
            let word = match parse_u256_result_word(&hex_s) {
                Ok(w) => w,
                Err(e) => {
                    return json!({
                        "block": block,
                        "stake_u256_hex": serde_json::Value::Null,
                        "read_status": "eth_call_error",
                        "error": e,
                        "meets_contract_min_stake": serde_json::Value::Null,
                        "reconcile": {
                            "delegation_units_mvp": delegation_mvp_units,
                            "note": "parse eth_call result failed"
                        },
                        "anchor": COMP_ANCHOR
                    });
                }
            };
            let meets = u256_word_meets_min_stake(&word);
            json!({
                "block": block,
                "stake_u256_hex": hex_s,
                "read_status": "ok",
                "error": serde_json::Value::Null,
                "meets_contract_min_stake": meets,
                "reconcile": {
                    "delegation_units_mvp": delegation_mvp_units,
                    "note": format!("delegation_units_mvp is GET /voting-power + POST /vote SSOT; stake_u256_hex is Staking.stakeOf at block {block} ({COMP_ANCHOR}). Unified single-weight formula remains Target.")
                },
                "anchor": COMP_ANCHOR
            })
        }
        Err(e) => json!({
            "block": block,
            "stake_u256_hex": serde_json::Value::Null,
            "read_status": "eth_call_error",
            "error": e,
            "meets_contract_min_stake": serde_json::Value::Null,
            "reconcile": {
                "delegation_units_mvp": delegation_mvp_units,
                "note": "eth_call Staking.stakeOf failed"
            },
            "anchor": COMP_ANCHOR
        }),
    }
}

async fn country_pool_share_snapshot_value(
    state: &ApiMetaState,
    viewer: Option<Uuid>,
    q: &GovernanceVotingPowerQuery,
    delegation_mvp_units: Option<u64>,
) -> serde_json::Value {
    let block = match q.snapshot_block {
        Some(b) => b,
        None => {
            return json!({
                "block": serde_json::Value::Null,
                "read_status": "skipped_no_snapshot_block_param",
                "tokens": [],
                "error": serde_json::Value::Null,
                "reconcile": {
                    "delegation_units_mvp": delegation_mvp_units,
                    "note": format!("Pass snapshot_block to eth_call ERC20 balanceOf for INVESTOR_SHARE_TOKEN_ADDRESSES ({COMP_ANCHOR_COUNTRY}). POST …/vote tally unchanged (delegation_units_v1 only)."),
                },
                "anchor": COMP_ANCHOR_COUNTRY,
            });
        }
    };

    let Some(uid) = viewer else {
        return json!({
            "block": block,
            "read_status": "skipped_unauthenticated",
            "tokens": [],
            "error": serde_json::Value::Null,
            "reconcile": {
                "delegation_units_mvp": serde_json::Value::Null,
                "note": "Sign in and set default_wallet_address to reconcile Country Pool share balances at snapshot.",
            },
            "anchor": COMP_ANCHOR_COUNTRY,
        });
    };

    let Some(ref cfg) = state.chain_config else {
        return json!({
            "block": block,
            "read_status": "skipped_no_chain_config",
            "tokens": [],
            "error": serde_json::Value::Null,
            "reconcile": {
                "delegation_units_mvp": delegation_mvp_units,
                "note": "CHAIN_RPC_URL / ChainConfig not mounted.",
            },
            "anchor": COMP_ANCHOR_COUNTRY,
        });
    };
    if !cfg.is_configured() {
        return json!({
            "block": block,
            "read_status": "skipped_chain_rpc_unconfigured",
            "tokens": [],
            "error": serde_json::Value::Null,
            "reconcile": {
                "delegation_units_mvp": delegation_mvp_units,
                "note": "chain_config.rpc_url empty.",
            },
            "anchor": COMP_ANCHOR_COUNTRY,
        });
    }

    let tokens_cfg: Vec<String> = cfg
        .investor_share_token_addresses
        .iter()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    if tokens_cfg.is_empty() {
        return json!({
            "block": block,
            "read_status": "skipped_no_investor_share_tokens_configured",
            "tokens": [],
            "error": serde_json::Value::Null,
            "reconcile": {
                "delegation_units_mvp": delegation_mvp_units,
                "note": "Set INVESTOR_SHARE_TOKEN_ADDRESSES (comma-separated ERC20) same as indexer-tick / B-085.",
            },
            "anchor": COMP_ANCHOR_COUNTRY,
        });
    }

    let wallet = match resolve_user_default_wallet(state, uid).await {
        Some(w) => w,
        None => {
            return json!({
                "block": block,
                "read_status": "skipped_no_wallet",
                "tokens": [],
                "error": serde_json::Value::Null,
                "reconcile": {
                    "delegation_units_mvp": delegation_mvp_units,
                    "note": "users.default_wallet_address / profile wallet required for balanceOf(address).",
                },
                "anchor": COMP_ANCHOR_COUNTRY,
            });
        }
    };

    let mut token_rows: Vec<serde_json::Value> = Vec::new();
    let mut n_ok: u32 = 0;
    let mut n_eth_err: u32 = 0;
    let mut n_invalid: u32 = 0;

    for raw_tok in tokens_cfg {
        let Some(to_norm) = normalize_contract_address(&raw_tok) else {
            n_invalid += 1;
            token_rows.push(json!({
                "token_address": raw_tok,
                "balance_u256_hex": serde_json::Value::Null,
                "read_status": "skipped_invalid_token_address",
                "error": "token_address could not be normalized to 0x + 40 hex",
            }));
            continue;
        };
        let ta = to_norm.to_ascii_lowercase();
        match read_erc20_balance_u256_hex_at_block(&cfg.rpc_url, &ta, &wallet, block).await {
            Ok(hex_s) => {
                n_ok += 1;
                token_rows.push(json!({
                    "token_address": ta,
                    "balance_u256_hex": hex_s,
                    "read_status": "ok",
                    "error": serde_json::Value::Null,
                }));
            }
            Err(e) => {
                n_eth_err += 1;
                token_rows.push(json!({
                    "token_address": ta,
                    "balance_u256_hex": serde_json::Value::Null,
                    "read_status": "eth_call_error",
                    "error": e,
                }));
            }
        }
    }

    let total = token_rows.len() as u32;
    let overall = if n_ok == total && total > 0 {
        "ok"
    } else if n_ok > 0 && (n_eth_err > 0 || n_invalid > 0) {
        "partial"
    } else if n_eth_err > 0 && n_ok == 0 {
        "eth_call_error_all"
    } else if n_invalid > 0 && n_ok == 0 && n_eth_err == 0 {
        "skipped_invalid_token_addresses_all"
    } else {
        "partial"
    };

    let note = format!(
        "Per-token balanceOf(wallet) at block {block} for chain_config.investor_share_token_addresses (B-085 / Country Pool ERC20s). delegation_units_mvp not used for tally ({COMP_ANCHOR_COUNTRY})."
    );

    json!({
        "block": block,
        "read_status": overall,
        "tokens": token_rows,
        "error": serde_json::Value::Null,
        "reconcile": {
            "delegation_units_mvp": delegation_mvp_units,
            "note": note,
        },
        "anchor": COMP_ANCHOR_COUNTRY,
    })
}

/// GET /api/v1/governance/voting-power
pub async fn get_governance_voting_power(
    State(state): State<ApiMetaState>,
    Query(q): Query<GovernanceVotingPowerQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let viewer = extract_user_with_session_check(&state, &headers).await;
    let arc = delegate_store();
    let m = arc.read().await;

    let body = if let Some(uid) = viewer {
        if is_delegating_away(&m, uid) {
            let del = m.get(&uid).map(|d| d.to_string());
            let snap = stake_snapshot_value(&state, Some(uid), &q, None).await;
            let country = country_pool_share_snapshot_value(&state, Some(uid), &q, None).await;
            json!({
                "status": "ok",
                "authenticated": true,
                "vote_kind": "signal_off_chain",
                "triggers_on_chain_execution": false,
                "weight_ssot": WEIGHT_SSOT,
                "anchor": ANCHOR,
                "can_cast_vote": false,
                "reason": "delegation_active_cannot_vote",
                "delegate_to": del,
                "delegator_count": serde_json::Value::Null,
                "total_weight_units": serde_json::Value::Null,
                "note": "Revoke delegation at DELETE /api/v1/governance/delegate to cast votes yourself (B-092)",
                "stake_snapshot": snap,
                "country_pool_share_snapshot": country,
            })
        } else {
            let dc = direct_delegator_count(&m, uid);
            let tw = voter_weight_units_now(&m, uid);
            let snap = stake_snapshot_value(&state, Some(uid), &q, Some(tw)).await;
            let country = country_pool_share_snapshot_value(&state, Some(uid), &q, Some(tw)).await;
            json!({
                "status": "ok",
                "authenticated": true,
                "vote_kind": "signal_off_chain",
                "triggers_on_chain_execution": false,
                "weight_ssot": WEIGHT_SSOT,
                "anchor": ANCHOR,
                "can_cast_vote": true,
                "delegate_to": serde_json::Value::Null,
                "delegator_count": dc,
                "total_weight_units": tw,
                "stake_snapshot": snap,
                "country_pool_share_snapshot": country,
            })
        }
    } else {
        let snap = stake_snapshot_value(&state, None, &q, None).await;
        let country = country_pool_share_snapshot_value(&state, None, &q, None).await;
        json!({
            "status": "ok",
            "authenticated": false,
            "vote_kind": "signal_off_chain",
            "triggers_on_chain_execution": false,
            "weight_ssot": WEIGHT_SSOT,
            "anchor": ANCHOR,
            "can_cast_vote": serde_json::Value::Null,
            "delegate_to": serde_json::Value::Null,
            "delegator_count": serde_json::Value::Null,
            "total_weight_units": serde_json::Value::Null,
            "note": "Sign in to compute voting-power units (B-092)",
            "stake_snapshot": snap,
            "country_pool_share_snapshot": country,
        })
    };

    mvp_headered(Json(body).into_response())
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/governance/voting-power",
        get(get_governance_voting_power),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use chrono::Utc;
    use http_body_util::BodyExt;
    use std::collections::HashMap;
    use std::sync::Arc;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::sync::RwLock;
    use tower::util::ServiceExt;

    use crate::chain::ChainConfig;
    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, UserRow};
    use crate::state::test_support::api_meta_state;

    #[test]
    fn b092_selector_stake_of_address() {
        assert_eq!(hex::encode(selector_stake_of_address()), "42623360");
    }

    #[test]
    fn b092_selector_balance_of_address() {
        assert_eq!(hex::encode(selector_balance_of_address()), "70a08231");
    }

    async fn spawn_mock_rpc_sequence(results: Vec<&'static str>) -> String {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind");
        let addr = listener.local_addr().expect("addr");
        let (ready_tx, ready_rx) = tokio::sync::oneshot::channel::<()>();
        tokio::spawn(async move {
            let _ = ready_tx.send(());
            for result in results {
                let Ok((mut socket, _)) = listener.accept().await else {
                    break;
                };
                let mut buf = [0u8; 16384];
                let Ok(n) = socket.read(&mut buf).await else {
                    continue;
                };
                if n == 0 {
                    continue;
                }
                let payload = format!(r#"{{"jsonrpc":"2.0","id":1,"result":"{}"}}"#, result);
                let http = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    payload.len(),
                    payload
                );
                let _ = socket.write_all(http.as_bytes()).await;
            }
        });
        let _ = ready_rx.await;
        format!("http://{}", addr)
    }

    async fn spawn_mock_stake_rpc(result_hex_word: &'static str) -> String {
        let result = result_hex_word.to_string();
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
            .await
            .expect("bind");
        let addr = listener.local_addr().expect("addr");
        let (ready_tx, ready_rx) = tokio::sync::oneshot::channel::<()>();
        tokio::spawn(async move {
            let _ = ready_tx.send(());
            let Ok((mut socket, _)) = listener.accept().await else {
                return;
            };
            let mut buf = [0u8; 16384];
            let Ok(n) = socket.read(&mut buf).await else {
                return;
            };
            if n == 0 {
                return;
            }
            let payload = format!(
                r#"{{"jsonrpc":"2.0","id":1,"result":"{}"}}"#,
                result
            );
            let http = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                payload.len(),
                payload
            );
            let _ = socket.write_all(http.as_bytes()).await;
        });
        let _ = ready_rx.await;
        format!("http://{}", addr)
    }

    /// **1000e6** = **1e12** wei of 6-dec staking token，与 **`Staking.MIN_STAKE`** 对齐。
    fn word_hex_min_stake_exact() -> &'static str {
        "0x000000000000000000000000000000000000000000000000000000e8d4a51000"
    }

    #[tokio::test]
    async fn comp_b092_stake_snapshot_matches_mock_eth_call() {
        let rpc = spawn_mock_stake_rpc(word_hex_min_stake_exact()).await;
        let word = parse_u256_result_word(word_hex_min_stake_exact()).expect("parse");
        assert!(u256_word_meets_min_stake(&word));

        let uid = Uuid::parse_str("11111111-1111-4111-8111-111111111111").unwrap();
        let wallet = "0x2222222222222222222222222222222222222222";
        let user = UserRow {
            id: uid,
            email: "t@t".into(),
            password_hash: None,
            role: "tourist".into(),
            kyc_status: "none".into(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: Some(wallet.into()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        let mut users = HashMap::new();
        users.insert(uid, user);
        let store = ChainOffStore {
            users,
            ..Default::default()
        };
        let co = ChainOffState {
            store: Arc::new(RwLock::new(store)),
            config: ChainOffConfig::default(),
            db_pool: None,
        };
        let mut st = api_meta_state(Some(co));
        st.chain_config = Some(ChainConfig {
            rpc_url: rpc,
            chain_id: 31337,
            staking_address: Some("0x3333333333333333333333333333333333333333".into()),
            ..Default::default()
        });

        let q = GovernanceVotingPowerQuery {
            snapshot_block: Some(42),
        };
        let v = stake_snapshot_value(&st, Some(uid), &q, Some(7)).await;
        assert_eq!(v["read_status"], "ok");
        assert_eq!(v["block"], json!(42));
        assert_eq!(
            v["stake_u256_hex"].as_str().unwrap(),
            word_hex_min_stake_exact()
        );
        assert_eq!(v["meets_contract_min_stake"], json!(true));
        assert_eq!(v["reconcile"]["delegation_units_mvp"], json!(7));
    }

    #[tokio::test]
    async fn comp_b092_http_voting_power_includes_stake_snapshot_ok() {
        let rpc = spawn_mock_stake_rpc(word_hex_min_stake_exact()).await;
        let uid = Uuid::parse_str("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee").unwrap();
        let wallet = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        let user = UserRow {
            id: uid,
            email: "v@v".into(),
            password_hash: None,
            role: "tourist".into(),
            kyc_status: "none".into(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: Some(wallet.into()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        let mut users = HashMap::new();
        users.insert(uid, user);
        let co = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore {
                users,
                ..Default::default()
            })),
            config: ChainOffConfig::default(),
            db_pool: None,
        };
        let mut st = api_meta_state(Some(co));
        st.chain_config = Some(ChainConfig {
            rpc_url: rpc,
            chain_id: 31337,
            staking_address: Some("0xcccccccccccccccccccccccccccccccccccccccc".into()),
            ..Default::default()
        });

        let app = router().with_state(st);
        let uri = format!("/api/v1/governance/voting-power?snapshot_block=99");
        let res = app
            .oneshot(
                Request::builder()
                    .uri(&uri)
                    .header("x-user-id", uid.to_string())
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let j: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(j["stake_snapshot"]["read_status"], "ok");
        assert_eq!(
            j["country_pool_share_snapshot"]["read_status"],
            "skipped_no_investor_share_tokens_configured"
        );
        assert_eq!(j["total_weight_units"], json!(1));
    }

    #[tokio::test]
    async fn comp_b092_country_pool_snapshot_two_tokens_ok() {
        let w1 = "0x000000000000000000000000000000000000000000000000000000000000000a";
        let w2 = "0x000000000000000000000000000000000000000000000000000000000000000b";
        let rpc = spawn_mock_rpc_sequence(vec![w1, w2]).await;

        let uid = Uuid::parse_str("33333333-3333-4333-8333-333333333333").unwrap();
        let wallet = "0x4444444444444444444444444444444444444444";
        let user = UserRow {
            id: uid,
            email: "c@c".into(),
            password_hash: None,
            role: "tourist".into(),
            kyc_status: "none".into(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: Some(wallet.into()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        let mut users = HashMap::new();
        users.insert(uid, user);
        let co = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore {
                users,
                ..Default::default()
            })),
            config: ChainOffConfig::default(),
            db_pool: None,
        };
        let mut st = api_meta_state(Some(co));
        st.chain_config = Some(ChainConfig {
            rpc_url: rpc,
            chain_id: 31337,
            investor_share_token_addresses: vec![
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".into(),
                "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".into(),
            ],
            ..Default::default()
        });

        let q = GovernanceVotingPowerQuery {
            snapshot_block: Some(7),
        };
        let v = country_pool_share_snapshot_value(&st, Some(uid), &q, Some(3)).await;
        assert_eq!(v["read_status"], "ok");
        assert_eq!(v["block"], json!(7));
        let tokens = v["tokens"].as_array().expect("tokens array");
        assert_eq!(tokens.len(), 2);
        assert_eq!(tokens[0]["read_status"], "ok");
        assert_eq!(tokens[0]["balance_u256_hex"].as_str().unwrap(), w1);
        assert_eq!(tokens[1]["balance_u256_hex"].as_str().unwrap(), w2);
        assert_eq!(v["reconcile"]["delegation_units_mvp"], json!(3));
    }

    #[tokio::test]
    async fn comp_b092_http_voting_power_includes_country_pool_snapshot_ok() {
        let bal = "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000";
        let rpc = spawn_mock_rpc_sequence(vec![bal]).await;
        let uid = Uuid::parse_str("55555555-5555-4555-8555-555555555555").unwrap();
        let wallet = "0x6666666666666666666666666666666666666666";
        let user = UserRow {
            id: uid,
            email: "p@p".into(),
            password_hash: None,
            role: "tourist".into(),
            kyc_status: "none".into(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: Some(wallet.into()),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };
        let mut users = HashMap::new();
        users.insert(uid, user);
        let co = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore {
                users,
                ..Default::default()
            })),
            config: ChainOffConfig::default(),
            db_pool: None,
        };
        let mut st = api_meta_state(Some(co));
        st.chain_config = Some(ChainConfig {
            rpc_url: rpc,
            chain_id: 31337,
            staking_address: None,
            investor_share_token_addresses: vec!["0xdddddddddddddddddddddddddddddddddddddddd".into()],
            ..Default::default()
        });

        let app = router().with_state(st);
        let uri = "/api/v1/governance/voting-power?snapshot_block=12";
        let res = app
            .oneshot(
                Request::builder()
                    .uri(uri)
                    .header("x-user-id", uid.to_string())
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let j: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(j["stake_snapshot"]["read_status"], "skipped_no_staking_address");
        assert_eq!(j["country_pool_share_snapshot"]["read_status"], "ok");
        assert_eq!(
            j["country_pool_share_snapshot"]["tokens"][0]["balance_u256_hex"],
            json!(bal)
        );
    }
}
