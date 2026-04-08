//! **B-110 · SSOT-02**：链上余额 **只读** 封装（与 **B110-SSOT-01** 锚点语义对齐）。
//! **不**挂载 **`GET /api/v1/governance/pool`**；失败 **`Result::Err`**，**禁止**静默当零。

use sha3::{Digest, Keccak256};

fn norm_hex_addr(a: &str) -> String {
    let s = a.trim().to_ascii_lowercase();
    let s = s.strip_prefix("0x").unwrap_or(&s);
    format!("0x{:0>40}", s)
}

fn norm_u256_hex(h: &str) -> String {
    let s = h.trim().to_ascii_lowercase();
    let s = s.strip_prefix("0x").unwrap_or(&s);
    if s.len() > 64 {
        return h.to_string();
    }
    format!("0x{:0>64}", s)
}

fn evm_fn_selector(sig: &str) -> [u8; 4] {
    let h = Keccak256::digest(sig.as_bytes());
    [h[0], h[1], h[2], h[3]]
}

fn eth_call_uint256_result_to_norm_hex(hex_result: &str) -> Result<String, String> {
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Err("eth_call result too short".to_string());
    }
    let slot = &raw[raw.len() - 32..];
    Ok(norm_u256_hex(&format!("0x{}", hex::encode(slot))))
}

/// **`eth_getBalance(address, "latest")`** → **Wei** 的规范 **`0x` + 64 hex**（**全宽 uint256**）。
/// RPC/解码失败返回 **`Err`**（**不**返回 `"0x00…"` 冒充成功）。
pub async fn eth_get_native_balance_wei_hex(rpc_url: &str, address: &str) -> Result<String, String> {
    let addr = norm_hex_addr(address);
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_getBalance",
        "params": [addr, "latest"],
        "id": 1
    });
    let res: serde_json::Value = client
        .post(rpc_url.trim())
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let hex_result = res.get("result").and_then(|r| r.as_str()).ok_or_else(|| {
        res.get("error")
            .and_then(|e| e.get("message").and_then(|m| m.as_str()))
            .unwrap_or("eth_getBalance failed")
            .to_string()
    })?;
    if hex_result.len() < 3 || !hex_result.starts_with("0x") {
        return Err("eth_getBalance result not hex quantity".to_string());
    }
    Ok(norm_u256_hex(hex_result))
}

/// **`eth_call`**：**`ERC20.balanceOf(holder)`** → 余额 **uint256** 规范 hex。
pub async fn eth_call_erc20_balance_of_u256_hex(
    rpc_url: &str,
    token_contract: &str,
    holder: &str,
) -> Result<String, String> {
    let token = norm_hex_addr(token_contract.trim());
    let holder_h = norm_hex_addr(holder.trim());
    let holder_word = holder_h
        .strip_prefix("0x")
        .ok_or_else(|| "holder address invalid".to_string())?;
    let arg = format!("{:0>64}", holder_word);
    let sel = evm_fn_selector("balanceOf(address)");
    let data = format!("0x{}{}", hex::encode(sel), arg);
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": token, "data": data}, "latest"],
        "id": 1
    });
    let res: serde_json::Value = client
        .post(rpc_url.trim())
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let hex_result = res.get("result").and_then(|r| r.as_str()).ok_or_else(|| {
        res.get("error")
            .and_then(|e| e.get("message").and_then(|m| m.as_str()))
            .unwrap_or("eth_call balanceOf failed")
            .to_string()
    })?;
    eth_call_uint256_result_to_norm_hex(hex_result)
}

// —— B110-SSOT-01 命名锚点（地址/代币均由调用方传入；与 **04/14** 环境键一致）——

/// **`pool_balance`** 链上锚：**`balanceOf(FeeRouter)`**，**`token`** = **`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`**。
#[inline]
pub async fn ssot_read_fee_router_erc20_balance_hex(
    rpc_url: &str,
    fee_router_address: &str,
    governance_pool_ssot_token: &str,
) -> Result<String, String> {
    eth_call_erc20_balance_of_u256_hex(rpc_url, governance_pool_ssot_token, fee_router_address).await
}

/// **`country_pool`** 链上锚：**`balanceOf(RegionVault)`**，**`token`** 同上 **SSOT 代币**。
#[inline]
pub async fn ssot_read_region_vault_erc20_balance_hex(
    rpc_url: &str,
    region_vault_address: &str,
    governance_pool_ssot_token: &str,
) -> Result<String, String> {
    eth_call_erc20_balance_of_u256_hex(rpc_url, governance_pool_ssot_token, region_vault_address).await
}

/// **`treasury_pool`** 链上锚（最小）：**`eth_getBalance(GovernanceTreasury)`**（原生 Wei）。
#[inline]
pub async fn ssot_read_governance_treasury_native_balance_wei_hex(
    rpc_url: &str,
    governance_treasury_address: &str,
) -> Result<String, String> {
    eth_get_native_balance_wei_hex(rpc_url, governance_treasury_address).await
}

/// **`treasury_erc20_pool`** 链上锚：**`ERC20.balanceOf(GovernanceTreasury)`**，**`token_address`** = **`GOVERNANCE_TREASURY_SSOT_TOKEN_ADDRESS`**（与 **`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`** 分键；**04/14**）。
#[inline]
pub async fn ssot_read_governance_treasury_erc20_balance_hex(
    rpc_url: &str,
    treasury_address: &str,
    token_address: &str,
) -> Result<String, String> {
    eth_call_erc20_balance_of_u256_hex(rpc_url, token_address, treasury_address).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn eth_call_uint256_result_to_norm_hex_pads() {
        let h = eth_call_uint256_result_to_norm_hex(
            "0x0000000000000000000000000000000000000000000000000000000000000001",
        )
        .expect("ok");
        assert_eq!(
            h,
            "0x0000000000000000000000000000000000000000000000000000000000000001"
        );
    }

    #[test]
    fn eth_call_uint256_result_to_norm_hex_short_errors() {
        assert!(eth_call_uint256_result_to_norm_hex("0x01").is_err());
    }

    #[test]
    fn norm_u256_hex_pads_short_quantity() {
        assert_eq!(
            norm_u256_hex("0x1"),
            "0x0000000000000000000000000000000000000000000000000000000000000001"
        );
    }
}
