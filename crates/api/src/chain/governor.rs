//! Governor **`eth_call`** 只读（**B-089 Completion**）：**`state` / `getPastVotes`** 与投影对拍；**TT-B110**：**`orderRatingReviewWindowDays()`**。

use digest::Digest;
use num_bigint::BigUint;
use sha3::Keccak256;
use std::str::FromStr;

use super::ChainConfig;

fn selector4(sig: &str) -> [u8; 4] {
    let h = Keccak256::digest(sig.as_bytes());
    [h[0], h[1], h[2], h[3]]
}

fn pad_u256_be(n: &str) -> Result<[u8; 32], ()> {
    let v = BigUint::from_str(n).map_err(|_| ())?;
    let b = v.to_bytes_be();
    if b.len() > 32 {
        return Err(());
    }
    let mut out = [0u8; 32];
    out[32 - b.len()..].copy_from_slice(&b);
    Ok(out)
}

fn pad_address(addr_hex: &str) -> Result<[u8; 32], ()> {
    let s = addr_hex.trim().trim_start_matches("0x");
    let h = hex::decode(s).map_err(|_| ())?;
    if h.len() != 20 {
        return Err(());
    }
    let mut out = [0u8; 32];
    out[12..].copy_from_slice(&h);
    Ok(out)
}

fn decode_u256_result(hex_res: &str) -> Option<BigUint> {
    let s = hex_res.trim().trim_start_matches("0x");
    let raw = hex::decode(s).ok()?;
    if raw.is_empty() {
        return None;
    }
    Some(BigUint::from_bytes_be(&raw))
}

/// **`state(uint256)`** → **0..=6**（与 **`TravelTrustGovernor.ProposalState`** 一致）。
/// **`TravelTrustGovernor.orderRatingReviewWindowDays()`**（public getter）→ **uint256**；有效范围由调用方过滤 **1..=3660**（**TT-B110-SEQ2-ORDERS-DEADLINE-GOVERNANCE-CHAIN-READ-001**）。
pub async fn eth_call_governor_order_rating_review_window_days(
    rpc_url: &str,
    governor: &str,
) -> Result<i64, String> {
    let sel = selector4("orderRatingReviewWindowDays()");
    let hex_data = format!("0x{}", hex::encode(sel));
    let to = normalize_addr(governor);
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{ "to": to, "data": hex_data }, "latest"],
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
    let r = res
        .get("result")
        .and_then(|x| x.as_str())
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or("eth_call orderRatingReviewWindowDays failed")
                .to_string()
        })?;
    let u = decode_u256_result(r).ok_or_else(|| "decode orderRatingReviewWindowDays failed".to_string())?;
    let s = u.to_string();
    s.parse::<i64>()
        .map_err(|_| "orderRatingReviewWindowDays exceeds i64".to_string())
}

/// 独立 **`eth_call`** 探针（**TT-B110-SEQ2-ORDERS-DEADLINE-RECONCILE-PROBE-001**）：与 [`fetch_governor_order_rating_review_window_days`] 同源解码，但保留失败原因与越界原始值，供 **`GET /meta`** **`reconcile_probe`** 与 **`rating_review_window_resolution_for_orders_api`** 对拍。
#[derive(Debug, Clone, serde::Serialize)]
pub struct GovernorRatingWindowProbe {
    pub probe_leg: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub chain_read_days: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub eth_call_error: Option<String>,
}

pub async fn probe_governor_order_rating_review_window_chain(
    chain_config: Option<&ChainConfig>,
) -> GovernorRatingWindowProbe {
    let Some(c) = chain_config else {
        return GovernorRatingWindowProbe {
            probe_leg: "skipped_no_chain_config",
            chain_read_days: None,
            eth_call_error: None,
        };
    };
    if !c.is_configured() {
        return GovernorRatingWindowProbe {
            probe_leg: "skipped_rpc_unconfigured",
            chain_read_days: None,
            eth_call_error: None,
        };
    }
    let gov = match c
        .governor_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        Some(g) => g,
        None => {
            return GovernorRatingWindowProbe {
                probe_leg: "skipped_no_governor",
                chain_read_days: None,
                eth_call_error: None,
            };
        }
    };
    match eth_call_governor_order_rating_review_window_days(c.rpc_url.trim(), gov).await {
        Ok(d) if (1..=3660).contains(&d) => GovernorRatingWindowProbe {
            probe_leg: "eth_call_ok",
            chain_read_days: Some(d),
            eth_call_error: None,
        },
        Ok(d) => GovernorRatingWindowProbe {
            probe_leg: "value_out_of_range",
            chain_read_days: Some(d),
            eth_call_error: None,
        },
        Err(e) => GovernorRatingWindowProbe {
            probe_leg: "eth_call_failed",
            chain_read_days: None,
            eth_call_error: Some(e),
        },
    }
}

/// **`GOVERNANCE_ORDER_DEADLINE_CHAIN_SSOT`** 为真时：对 **`GOVERNOR_ADDRESS`** 做 **`eth_call`**；失败或越界 → **`None`**（**fail-closed** 回退 **`P3_REVIEW_WINDOW_DAYS`**）。
/// **`votingDelayBlocks()`** / **`votingPeriodBlocks()`** / **`quorumNumeratorBps()`**（**TT-B110-SEQ5**）：**`TravelTrustGovernor`** 只读 **`public immutable`** getter；返回 **十进制字符串**（**`uint256`** 解码）。
pub async fn eth_call_governor_uint256_getter(
    rpc_url: &str,
    governor: &str,
    method_sig: &str,
) -> Result<String, String> {
    let sel = selector4(method_sig);
    let hex_data = format!("0x{}", hex::encode(sel));
    let to = normalize_addr(governor);
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{ "to": to, "data": hex_data }, "latest"],
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
    let r = res
        .get("result")
        .and_then(|x| x.as_str())
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or_else(|| "eth_call governor getter failed")
                .to_string()
        })?;
    let u = decode_u256_result(r).ok_or_else(|| "decode governor getter failed".to_string())?;
    Ok(u.to_string())
}

/// **TT-B110-SEQ5**：独立三键 **`eth_call`** 探针，供 **`GET /meta` `governance.*.reconcile_probe`** 与 resolution 对拍。
#[derive(Debug, Clone, serde::Serialize)]
pub struct GovernorViewParamsProbe {
    pub probe_leg: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub voting_delay_blocks: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub voting_period_blocks: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub quorum_numerator_bps: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

pub async fn probe_governor_view_params_chain(
    chain_config: Option<&ChainConfig>,
) -> GovernorViewParamsProbe {
    let Some(c) = chain_config else {
        return GovernorViewParamsProbe {
            probe_leg: "skipped_no_chain_config",
            voting_delay_blocks: None,
            voting_period_blocks: None,
            quorum_numerator_bps: None,
            detail: None,
        };
    };
    if !c.is_configured() {
        return GovernorViewParamsProbe {
            probe_leg: "skipped_rpc_unconfigured",
            voting_delay_blocks: None,
            voting_period_blocks: None,
            quorum_numerator_bps: None,
            detail: None,
        };
    }
    let gov = match c
        .governor_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        Some(g) => g,
        None => {
            return GovernorViewParamsProbe {
                probe_leg: "skipped_no_governor",
                voting_delay_blocks: None,
                voting_period_blocks: None,
                quorum_numerator_bps: None,
                detail: None,
            };
        }
    };
    let rpc = c.rpc_url.trim();
    let d = eth_call_governor_uint256_getter(rpc, gov, "votingDelayBlocks()").await;
    let p = eth_call_governor_uint256_getter(rpc, gov, "votingPeriodBlocks()").await;
    let q = eth_call_governor_uint256_getter(rpc, gov, "quorumNumeratorBps()").await;
    match (&d, &p, &q) {
        (Ok(a), Ok(b), Ok(q_ok)) => GovernorViewParamsProbe {
            probe_leg: "eth_call_all_ok",
            voting_delay_blocks: Some(a.clone()),
            voting_period_blocks: Some(b.clone()),
            quorum_numerator_bps: Some(q_ok.clone()),
            detail: None,
        },
        _ => {
            let mut parts = Vec::new();
            if let Err(e) = &d {
                parts.push(format!("votingDelayBlocks:{e}"));
            }
            if let Err(e) = &p {
                parts.push(format!("votingPeriodBlocks:{e}"));
            }
            if let Err(e) = &q {
                parts.push(format!("quorumNumeratorBps:{e}"));
            }
            GovernorViewParamsProbe {
                probe_leg: "eth_call_partial",
                voting_delay_blocks: d.ok(),
                voting_period_blocks: p.ok(),
                quorum_numerator_bps: q.ok(),
                detail: Some(parts.join("; ")),
            }
        }
    }
}

/// **TT-B110-SEQ8**：独立 **`proposalThresholdVotes()`** **`eth_call`** 探针，与 **`governance_proposal_threshold_ssot`** resolution 对拍。
#[derive(Debug, Clone, serde::Serialize)]
pub struct GovernorProposalThresholdProbe {
    pub probe_leg: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proposal_threshold_votes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

pub async fn probe_governor_proposal_threshold_chain(
    chain_config: Option<&ChainConfig>,
) -> GovernorProposalThresholdProbe {
    let Some(c) = chain_config else {
        return GovernorProposalThresholdProbe {
            probe_leg: "skipped_no_chain_config",
            proposal_threshold_votes: None,
            detail: None,
        };
    };
    if !c.is_configured() {
        return GovernorProposalThresholdProbe {
            probe_leg: "skipped_rpc_unconfigured",
            proposal_threshold_votes: None,
            detail: None,
        };
    }
    let gov = match c
        .governor_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        Some(g) => g,
        None => {
            return GovernorProposalThresholdProbe {
                probe_leg: "skipped_no_governor",
                proposal_threshold_votes: None,
                detail: None,
            };
        }
    };
    let rpc = c.rpc_url.trim();
    match eth_call_governor_uint256_getter(rpc, gov, "proposalThresholdVotes()").await {
        Ok(s) => GovernorProposalThresholdProbe {
            probe_leg: "eth_call_all_ok",
            proposal_threshold_votes: Some(s),
            detail: None,
        },
        Err(e) => GovernorProposalThresholdProbe {
            probe_leg: "eth_call_failed",
            proposal_threshold_votes: None,
            detail: Some(e),
        },
    }
}

fn decode_eth_call_address_word(hex_res: &str) -> Option<String> {
    let s = hex_res.trim().trim_start_matches("0x").trim_start_matches("0X");
    let raw = hex::decode(s).ok()?;
    if raw.len() < 32 {
        return None;
    }
    let addr = &raw[raw.len() - 20..];
    Some(format!("0x{}", hex::encode(addr)).to_ascii_lowercase())
}

fn is_zero_address_lower(addr: &str) -> bool {
    addr.trim().to_ascii_lowercase() == "0x0000000000000000000000000000000000000000"
}

/// **`token()`** / **`timelock()`**（**TT-B110-SEQ11**）：**`IGovernanceVotes` / `IGovernanceTimelockForGov`** **`immutable`** 引用；**`eth_call`** 返回 **小写 `0x` + 40 hex**。
pub async fn eth_call_governor_address_getter(
    rpc_url: &str,
    governor: &str,
    method_sig: &str,
) -> Result<String, String> {
    let sel = selector4(method_sig);
    let hex_data = format!("0x{}", hex::encode(sel));
    let to = normalize_addr(governor);
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{ "to": to, "data": hex_data }, "latest"],
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
    let r = res
        .get("result")
        .and_then(|x| x.as_str())
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or_else(|| "eth_call governor address getter failed")
                .to_string()
        })?;
    decode_eth_call_address_word(r).ok_or_else(|| "decode governor address getter failed".to_string())
}

/// **TT-B110-SEQ11**：**`token()`** + **`timelock()`** 双 **`eth_call`**；**`immutable`** 绑定须**非零地址**。
#[derive(Debug, Clone, serde::Serialize)]
pub struct GovernorTokenTimelockProbe {
    pub probe_leg: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timelock: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

pub async fn probe_governor_token_timelock_chain(
    chain_config: Option<&ChainConfig>,
) -> GovernorTokenTimelockProbe {
    let Some(c) = chain_config else {
        return GovernorTokenTimelockProbe {
            probe_leg: "skipped_no_chain_config",
            token: None,
            timelock: None,
            detail: None,
        };
    };
    if !c.is_configured() {
        return GovernorTokenTimelockProbe {
            probe_leg: "skipped_rpc_unconfigured",
            token: None,
            timelock: None,
            detail: None,
        };
    }
    let gov = match c
        .governor_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        Some(g) => g,
        None => {
            return GovernorTokenTimelockProbe {
                probe_leg: "skipped_no_governor",
                token: None,
                timelock: None,
                detail: None,
            };
        }
    };
    let rpc = c.rpc_url.trim();
    let t = eth_call_governor_address_getter(rpc, gov, "token()").await;
    let tl = eth_call_governor_address_getter(rpc, gov, "timelock()").await;
    match (&t, &tl) {
        (Ok(ta), Ok(tla))
            if !is_zero_address_lower(ta) && !is_zero_address_lower(tla) =>
        {
            GovernorTokenTimelockProbe {
                probe_leg: "eth_call_all_ok",
                token: Some(ta.clone()),
                timelock: Some(tla.clone()),
                detail: None,
            }
        }
        _ => {
            let mut parts = Vec::new();
            match &t {
                Ok(ta) if is_zero_address_lower(ta) => parts.push("token:zero_address".to_string()),
                Ok(_) => {}
                Err(e) => parts.push(format!("token:{e}")),
            }
            match &tl {
                Ok(tla) if is_zero_address_lower(tla) => parts.push("timelock:zero_address".to_string()),
                Ok(_) => {}
                Err(e) => parts.push(format!("timelock:{e}")),
            }
            GovernorTokenTimelockProbe {
                probe_leg: "eth_call_partial",
                token: t.as_ref().ok().cloned(),
                timelock: tl.as_ref().ok().cloned(),
                detail: Some(parts.join("; ")),
            }
        }
    }
}

/// **TT-B110-SEQ10**：**`proposalCount()`**（**`uint256 public`**，**运行时可增**）；**`reconcile_probe`** 两次读**须相等**，否则记 **`mutable_counter_moved_between_passes`**。
#[derive(Debug, Clone, serde::Serialize)]
pub struct GovernorProposalCountProbe {
    pub probe_leg: &'static str,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proposal_count: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
}

pub async fn probe_governor_proposal_count_chain(
    chain_config: Option<&ChainConfig>,
) -> GovernorProposalCountProbe {
    let Some(c) = chain_config else {
        return GovernorProposalCountProbe {
            probe_leg: "skipped_no_chain_config",
            proposal_count: None,
            detail: None,
        };
    };
    if !c.is_configured() {
        return GovernorProposalCountProbe {
            probe_leg: "skipped_rpc_unconfigured",
            proposal_count: None,
            detail: None,
        };
    }
    let gov = match c
        .governor_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        Some(g) => g,
        None => {
            return GovernorProposalCountProbe {
                probe_leg: "skipped_no_governor",
                proposal_count: None,
                detail: None,
            };
        }
    };
    let rpc = c.rpc_url.trim();
    match eth_call_governor_uint256_getter(rpc, gov, "proposalCount()").await {
        Ok(s) => GovernorProposalCountProbe {
            probe_leg: "eth_call_all_ok",
            proposal_count: Some(s),
            detail: None,
        },
        Err(e) => GovernorProposalCountProbe {
            probe_leg: "eth_call_failed",
            proposal_count: None,
            detail: Some(e),
        },
    }
}

pub async fn fetch_governor_order_rating_review_window_days(
    chain_config: Option<&ChainConfig>,
) -> Option<i64> {
    let c = chain_config?;
    if !c.is_configured() {
        return None;
    }
    let gov = c.governor_address.as_ref()?.trim();
    if gov.is_empty() {
        return None;
    }
    let v = eth_call_governor_order_rating_review_window_days(c.rpc_url.trim(), gov)
        .await
        .ok()?;
    (1..=3660).contains(&v).then_some(v)
}

pub async fn eth_call_governor_state(
    rpc_url: &str,
    governor: &str,
    proposal_id_dec: &str,
) -> Result<u8, String> {
    let sel = selector4("state(uint256)");
    let mut data = sel.to_vec();
    data.extend_from_slice(&pad_u256_be(proposal_id_dec).map_err(|_| "bad proposal id")?);

    let hex_data = format!("0x{}", hex::encode(&data));
    let to = normalize_addr(governor);
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{ "to": to, "data": hex_data }, "latest"],
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
    let r = res
        .get("result")
        .and_then(|x| x.as_str())
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or("eth_call state failed")
                .to_string()
        })?;
    let u = decode_u256_result(r).ok_or_else(|| "decode state failed".to_string())?;
    let n: u8 = u.to_string().parse().map_err(|_| "state out of range".to_string())?;
    Ok(n)
}

/// **`IGovernanceVotes.getPastVotes(address,uint256)`**
pub async fn eth_call_get_past_votes(
    rpc_url: &str,
    token: &str,
    voter_wallet: &str,
    snapshot_block_dec: &str,
) -> Result<String, String> {
    let sel = selector4("getPastVotes(address,uint256)");
    let mut data = sel.to_vec();
    data.extend_from_slice(&pad_address(voter_wallet).map_err(|_| "bad voter address")?);
    data.extend_from_slice(&pad_u256_be(snapshot_block_dec).map_err(|_| "bad block")?);

    let hex_data = format!("0x{}", hex::encode(&data));
    let to = normalize_addr(token);
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{ "to": to, "data": hex_data }, "latest"],
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
    let r = res
        .get("result")
        .and_then(|x| x.as_str())
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or("eth_call getPastVotes failed")
                .to_string()
        })?;
    let u = decode_u256_result(r).ok_or_else(|| "decode votes failed".to_string())?;
    Ok(u.to_string())
}

/// **`castVote(uint256,uint8)`** calldata（前端 / 钱包 **raw tx** 拼装）。
pub fn encode_cast_vote_calldata(proposal_id_dec: &str, support: u8) -> Result<String, ()> {
    if support > 2 {
        return Err(());
    }
    let sel = selector4("castVote(uint256,uint8)");
    let mut data = sel.to_vec();
    data.extend_from_slice(&pad_u256_be(proposal_id_dec)?);
    let mut sup = [0u8; 32];
    sup[31] = support;
    data.extend_from_slice(&sup);
    Ok(format!("0x{}", hex::encode(data)))
}

pub fn governor_state_label(state: u8) -> &'static str {
    match state {
        0 => "pending",
        1 => "active",
        2 => "canceled",
        3 => "defeated",
        4 => "succeeded",
        5 => "queued",
        6 => "executed",
        _ => "unknown",
    }
}

fn normalize_addr(a: &str) -> String {
    let t = a.trim();
    if t.starts_with("0x") || t.starts_with("0X") {
        t.to_string()
    } else {
        format!("0x{}", t)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::io::AsyncWriteExt;
    use tokio::net::TcpListener;

    #[test]
    fn b098_get_past_votes_selector_stable_for_eth_call() {
        // Same `Keccak256` prefix rule as `state` / `castVote` in this module; must match
        // `GovernanceVotesToken.getPastVotes(address,uint256)` on deployed bytecode.
        assert_eq!(
            hex::encode(selector4("getPastVotes(address,uint256)")),
            "3a46b1a8"
        );
    }

    #[test]
    fn cast_vote_selector_roundtrip() {
        let h = encode_cast_vote_calldata("1", 1).unwrap();
        assert!(h.starts_with("0x"));
        assert!(h.len() > 10);
    }

    #[test]
    fn tt_b110_order_rating_review_window_days_selector_stable() {
        assert_eq!(
            hex::encode(selector4("orderRatingReviewWindowDays()")),
            "a8b799be"
        );
    }

    #[test]
    fn tt_b110_seq10_proposal_count_selector_stable() {
        assert_eq!(hex::encode(selector4("proposalCount()")), "da35c664");
    }

    #[test]
    fn tt_b110_seq14_state_uint256_selector_stable() {
        assert_eq!(hex::encode(selector4("state(uint256)")), "3e4f49e6");
    }

    #[test]
    fn tt_b110_seq11_token_timelock_selectors_stable() {
        assert_eq!(hex::encode(selector4("token()")), "fc0c546a");
        assert_eq!(hex::encode(selector4("timelock()")), "d33219b4");
    }

    #[tokio::test]
    async fn tt_b110_eth_call_order_rating_review_window_days_mock_rpc() {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();
        tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let _ = crate::jsonrpc_mock_server::read_http_request_headers_and_body(&mut socket)
                .await;
            // uint256 42
            let result = "0x000000000000000000000000000000000000000000000000000000000000002a";
            let payload = serde_json::json!({"jsonrpc":"2.0","id":1,"result":result});
            let payload = serde_json::to_vec(&payload).unwrap();
            let hdr = format!(
                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nContent-Type: application/json\r\n\r\n",
                payload.len()
            );
            let _ = socket.write_all(hdr.as_bytes()).await;
            let _ = socket.write_all(&payload).await;
        });
        tokio::task::yield_now().await;
        let v = eth_call_governor_order_rating_review_window_days(
            &format!("http://127.0.0.1:{port}"),
            "0x0000000000000000000000000000000000000001",
        )
        .await
        .unwrap();
        assert_eq!(v, 42);
    }

    #[tokio::test]
    async fn tt_b110_probe_governor_order_rating_review_window_chain_ok_mock_rpc() {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();
        tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            for _ in 0..2 {
                let _ = crate::jsonrpc_mock_server::read_http_request_headers_and_body(&mut socket)
                    .await;
                let result =
                    "0x000000000000000000000000000000000000000000000000000000000000002a";
                let payload = serde_json::json!({"jsonrpc":"2.0","id":1,"result":result});
                let payload = serde_json::to_vec(&payload).unwrap();
                let hdr = format!(
                    "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: keep-alive\r\nContent-Type: application/json\r\n\r\n",
                    payload.len()
                );
                let _ = socket.write_all(hdr.as_bytes()).await;
                let _ = socket.write_all(&payload).await;
            }
        });
        tokio::task::yield_now().await;
        let cfg = ChainConfig {
            rpc_url: format!("http://127.0.0.1:{port}"),
            chain_id: 1,
            escrow_factory_address: None,
            fee_router_address: None,
            region_vault_address: None,
            country_pool_ledger_address: None,
            investor_share_token_addresses: vec![],
            staking_address: None,
            guide_staking_address: None,
            staking_provider_address: None,
            investor_lock_contract_addresses: vec![],
            governor_address: Some("0x0000000000000000000000000000000000000001".to_string()),
            governance_timelock_address: None,
            governance_votes_token_address: None,
            treasury_address: None,
            registry_address: None,
            executor_max_amount_per_tx: None,
            executor_max_amount_per_day: None,
            executor_retry_count: 3,
        };
        let p = probe_governor_order_rating_review_window_chain(Some(&cfg)).await;
        assert_eq!(p.probe_leg, "eth_call_ok");
        assert_eq!(p.chain_read_days, Some(42));
        assert!(p.eth_call_error.is_none());
    }

    #[tokio::test]
    async fn tt_b110_probe_governor_order_rating_review_window_chain_eth_call_failed_mock() {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();
        tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            for _ in 0..2 {
                let _ = crate::jsonrpc_mock_server::read_http_request_headers_and_body(&mut socket)
                    .await;
                let payload = serde_json::json!({"jsonrpc":"2.0","id":1,"error":{"code":3,"message":"execution reverted: no selector"}});
                let payload = serde_json::to_vec(&payload).unwrap();
                let hdr = format!(
                    "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: keep-alive\r\nContent-Type: application/json\r\n\r\n",
                    payload.len()
                );
                let _ = socket.write_all(hdr.as_bytes()).await;
                let _ = socket.write_all(&payload).await;
            }
        });
        tokio::task::yield_now().await;
        let cfg = ChainConfig {
            rpc_url: format!("http://127.0.0.1:{port}"),
            chain_id: 1,
            escrow_factory_address: None,
            fee_router_address: None,
            region_vault_address: None,
            country_pool_ledger_address: None,
            investor_share_token_addresses: vec![],
            staking_address: None,
            guide_staking_address: None,
            staking_provider_address: None,
            investor_lock_contract_addresses: vec![],
            governor_address: Some("0x0000000000000000000000000000000000000001".to_string()),
            governance_timelock_address: None,
            governance_votes_token_address: None,
            treasury_address: None,
            registry_address: None,
            executor_max_amount_per_tx: None,
            executor_max_amount_per_day: None,
            executor_retry_count: 3,
        };
        let p = probe_governor_order_rating_review_window_chain(Some(&cfg)).await;
        assert_eq!(p.probe_leg, "eth_call_failed");
        assert!(p.eth_call_error.is_some());
    }

    #[test]
    fn tt_b110_probe_governor_order_rating_review_window_chain_skipped_no_governor() {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let cfg = ChainConfig {
                rpc_url: "http://127.0.0.1:1".to_string(),
                chain_id: 1,
                escrow_factory_address: None,
                fee_router_address: None,
                region_vault_address: None,
                country_pool_ledger_address: None,
                investor_share_token_addresses: vec![],
                staking_address: None,
                guide_staking_address: None,
                staking_provider_address: None,
                investor_lock_contract_addresses: vec![],
                governor_address: None,
                governance_timelock_address: None,
                governance_votes_token_address: None,
                treasury_address: None,
                registry_address: None,
                executor_max_amount_per_tx: None,
                executor_max_amount_per_day: None,
                executor_retry_count: 3,
            };
            let p = probe_governor_order_rating_review_window_chain(Some(&cfg)).await;
            assert_eq!(p.probe_leg, "skipped_no_governor");
        });
    }

    #[tokio::test]
    async fn tt_b110_probe_governor_order_rating_review_window_chain_value_out_of_range_mock() {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();
        tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            for _ in 0..2 {
                let _ = crate::jsonrpc_mock_server::read_http_request_headers_and_body(&mut socket)
                    .await;
                let result =
                    "0x00000000000000000000000000000000000000000000000000000000000f4240";
                let payload = serde_json::json!({"jsonrpc":"2.0","id":1,"result":result});
                let payload = serde_json::to_vec(&payload).unwrap();
                let hdr = format!(
                    "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: keep-alive\r\nContent-Type: application/json\r\n\r\n",
                    payload.len()
                );
                let _ = socket.write_all(hdr.as_bytes()).await;
                let _ = socket.write_all(&payload).await;
            }
        });
        tokio::task::yield_now().await;
        let cfg = ChainConfig {
            rpc_url: format!("http://127.0.0.1:{port}"),
            chain_id: 1,
            escrow_factory_address: None,
            fee_router_address: None,
            region_vault_address: None,
            country_pool_ledger_address: None,
            investor_share_token_addresses: vec![],
            staking_address: None,
            guide_staking_address: None,
            staking_provider_address: None,
            investor_lock_contract_addresses: vec![],
            governor_address: Some("0x0000000000000000000000000000000000000001".to_string()),
            governance_timelock_address: None,
            governance_votes_token_address: None,
            treasury_address: None,
            registry_address: None,
            executor_max_amount_per_tx: None,
            executor_max_amount_per_day: None,
            executor_retry_count: 3,
        };
        let p = probe_governor_order_rating_review_window_chain(Some(&cfg)).await;
        assert_eq!(p.probe_leg, "value_out_of_range");
        assert_eq!(p.chain_read_days, Some(1_000_000));
    }

    #[tokio::test]
    async fn fetch_governor_order_rating_review_window_days_filters_invalid() {
        let cfg = ChainConfig {
            rpc_url: "http://127.0.0.1:9".to_string(),
            chain_id: 1,
            escrow_factory_address: None,
            fee_router_address: None,
            region_vault_address: None,
            country_pool_ledger_address: None,
            investor_share_token_addresses: vec![],
            staking_address: None,
            guide_staking_address: None,
            staking_provider_address: None,
            investor_lock_contract_addresses: vec![],
            governor_address: Some("0x1111111111111111111111111111111111111111".to_string()),
            governance_timelock_address: None,
            governance_votes_token_address: None,
            treasury_address: None,
            registry_address: None,
            executor_max_amount_per_tx: None,
            executor_max_amount_per_day: None,
            executor_retry_count: 3,
        };
        assert!(fetch_governor_order_rating_review_window_days(Some(&cfg))
            .await
            .is_none());
    }
}
