//! Governor **`eth_call`** 只读（**B-089 Completion**）：**`state` / `getPastVotes`** 与投影对拍。

use digest::Digest;
use num_bigint::BigUint;
use sha3::Keccak256;
use std::str::FromStr;

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
}
