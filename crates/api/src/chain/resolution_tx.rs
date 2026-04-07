//! **`executeResolution`** 交易 input 解析 + **`eth_getTransactionByHash`**（B-094 Target：`orders_projection` 细分终态）

use sha3::{Digest, Keccak256};
use traveltrust_core::{terminal_order_state_from_resolution_amounts, OrderState};

fn execute_resolution_selector() -> [u8; 4] {
    let h = Keccak256::digest(b"executeResolution(bytes32,bytes32,uint256,uint256,uint256)");
    [h[0], h[1], h[2], h[3]]
}

/// 将 ABI 词（32 字节大端 u256）转为 `u128`；高 16 字节非零则 `None`。
fn word_be_to_u128(word: &[u8; 32]) -> Option<u128> {
    if word[..16].iter().any(|&b| b != 0) {
        return None;
    }
    Some(u128::from_be_bytes(word[16..32].try_into().ok()?))
}

/// 解析 **`executeResolution(bytes32,bytes32,uint256,uint256,uint256)`** 三腿金额（guide, traveler_refund, platform_fee）。
#[must_use]
pub fn parse_execute_resolution_amounts(input: &[u8]) -> Option<(u128, u128, u128)> {
    const NEED: usize = 4 + 32 * 5;
    if input.len() < NEED {
        return None;
    }
    if input[0..4] != execute_resolution_selector() {
        return None;
    }
    let g = word_be_to_u128(input[68..100].try_into().ok()?)?;
    let t = word_be_to_u128(input[100..132].try_into().ok()?)?;
    let p = word_be_to_u128(input[132..164].try_into().ok()?)?;
    Some((g, t, p))
}

/// 与合约守恒一致：`total = guide + traveler + platform`，再交 core 映射。
#[must_use]
pub fn orders_projection_status_from_resolution_input(input: &[u8]) -> Option<&'static str> {
    let (g, t, p) = parse_execute_resolution_amounts(input)?;
    let total = g.checked_add(t)?.checked_add(p)?;
    let st = terminal_order_state_from_resolution_amounts(g, t, p, total)?;
    Some(match st {
        OrderState::Refunded => "refunded",
        OrderState::PartiallyRefunded => "partially_refunded",
        OrderState::Slashed => "slashed",
        OrderState::Completed => "completed",
        _ => None?,
    })
}

/// **`ResolutionExecuted`** 投影：能取交易且解析 **`executeResolution`** 三腿则用细分终态，否则 **`fallback_status`**（通常为内存 **`Completed`**）。
pub async fn orders_projection_status_for_resolution_executed_event(
    rpc_url: Option<&str>,
    tx_hash_hex: &str,
    fallback_status: &'static str,
) -> &'static str {
    let Some(rpc) = rpc_url.map(str::trim).filter(|s| !s.is_empty()) else {
        return fallback_status;
    };
    match eth_get_transaction_input(rpc, tx_hash_hex).await {
        Ok(Some(ref input)) => {
            orders_projection_status_from_resolution_input(input).unwrap_or(fallback_status)
        }
        _ => fallback_status,
    }
}

/// `eth_getTransactionByHash` → 解码 **`input`**（十六进制）；`result` 为 null 时 **`Ok(None)`**。
pub async fn eth_get_transaction_input(
    rpc_url: &str,
    tx_hash_hex: &str,
) -> Result<Option<Vec<u8>>, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_getTransactionByHash",
        "params": [tx_hash_hex.trim()],
        "id": 1u32,
    });
    let res: serde_json::Value = client
        .post(rpc_url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    if let Some(err) = res.get("error") {
        let msg = err
            .get("message")
            .and_then(|m| m.as_str())
            .unwrap_or("eth_getTransactionByHash error");
        return Err(msg.to_string());
    }
    let tx = match res.get("result") {
        Some(r) if !r.is_null() => r,
        _ => return Ok(None),
    };
    let input_hex = tx
        .get("input")
        .and_then(|x| x.as_str())
        .unwrap_or("0x");
    let raw = hex::decode(input_hex.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    Ok(Some(raw))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn pad_u256(v: u128) -> [u8; 32] {
        let mut w = [0u8; 32];
        w[16..32].copy_from_slice(&v.to_be_bytes());
        w
    }

    fn build_calldata(g: u128, t: u128, p: u128) -> Vec<u8> {
        let mut out = Vec::with_capacity(164);
        out.extend_from_slice(&execute_resolution_selector());
        out.extend_from_slice(&[7u8; 32]);
        out.extend_from_slice(&[8u8; 32]);
        out.extend_from_slice(&pad_u256(g));
        out.extend_from_slice(&pad_u256(t));
        out.extend_from_slice(&pad_u256(p));
        out
    }

    #[test]
    fn b094_templates_map_to_projection_status() {
        let total: u128 = 1000;
        let refunded = build_calldata(0, total, 0);
        assert_eq!(
            orders_projection_status_from_resolution_input(&refunded),
            Some("refunded")
        );
        let partial = build_calldata(300, 650, 50);
        assert_eq!(
            orders_projection_status_from_resolution_input(&partial),
            Some("partially_refunded")
        );
        let slashed = build_calldata(0, 800, 200);
        assert_eq!(
            orders_projection_status_from_resolution_input(&slashed),
            Some("slashed")
        );
        let completed = build_calldata(950, 0, 50);
        assert_eq!(
            orders_projection_status_from_resolution_input(&completed),
            Some("completed")
        );
    }

    #[test]
    fn wrong_selector_yields_none() {
        let mut v = build_calldata(0, 1000, 0);
        v[0] = v[0].wrapping_add(1);
        assert!(orders_projection_status_from_resolution_input(&v).is_none());
    }

    #[test]
    fn too_short_input_yields_none() {
        assert!(orders_projection_status_from_resolution_input(&[1, 2, 3]).is_none());
    }

    #[tokio::test]
    async fn resolution_executed_event_skips_rpc_when_url_empty() {
        let s = orders_projection_status_for_resolution_executed_event(None, "0xab", "completed")
            .await;
        assert_eq!(s, "completed");
    }
}
