//! `GET /api/v1/orders/:id` 根级 Escrow 链读 SSOT 合并（B-097）；**`m.insert("escrow_*")` 仅此文件**（见 `scripts/gates/ssot-guard-escrow-orders-detail.py`）。

use digest::Digest;
use serde_json::json;
use sha3::Keccak256;
use uuid::Uuid;

use crate::chain;
use crate::db;

/// **`GET /api/v1/orders/:id`** 根级 **`escrow_chain_state*`**：与 **`internal::escrow_chain_status_label`** 同源字符串（**`chain::EscrowChainStatus`**）。
fn escrow_chain_status_label_order_detail_ssot(s: &chain::EscrowChainStatus) -> &'static str {
    match s {
        chain::EscrowChainStatus::None => "None",
        chain::EscrowChainStatus::Created => "Created",
        chain::EscrowChainStatus::Funded => "Funded",
        chain::EscrowChainStatus::Completed => "Completed",
        chain::EscrowChainStatus::Refunded => "Refunded",
        chain::EscrowChainStatus::Disputed => "Disputed",
        chain::EscrowChainStatus::Resolved => "Resolved",
        chain::EscrowChainStatus::PartiallyRefunded => "PartiallyRefunded",
        chain::EscrowChainStatus::Slashed => "Slashed",
    }
}

/// 与 **`internal::terminal_escrow_label_for_reconcile`** 同源：仅链上 **放款类终态** 返回标签（**`escrow_release_state*`**）；**`Funded`****/****`Disputed`** 等非终态返回 **`None`**。
fn escrow_release_terminal_label_order_detail_ssot(
    s: &chain::EscrowChainStatus,
) -> Option<&'static str> {
    match s {
        chain::EscrowChainStatus::Completed => Some("Completed"),
        chain::EscrowChainStatus::Refunded => Some("Refunded"),
        chain::EscrowChainStatus::Resolved => Some("Resolved"),
        chain::EscrowChainStatus::PartiallyRefunded => Some("PartiallyRefunded"),
        chain::EscrowChainStatus::Slashed => Some("Slashed"),
        _ => None,
    }
}

/// **TT-ESCROW-SSOT-DISPUTE-STATE-008**：链上 **争议生命周期**（**`Disputed` / `Resolved`**）时返回标签（**`escrow_dispute_state*`**）；**无争议** 返回 **`None`**。
fn escrow_dispute_lifecycle_label_order_detail_ssot(
    s: &chain::EscrowChainStatus,
) -> Option<&'static str> {
    match s {
        chain::EscrowChainStatus::Disputed => Some("Disputed"),
        chain::EscrowChainStatus::Resolved => Some("Resolved"),
        _ => None,
    }
}

/// 与 **`chain::get_escrow_status`** 内 **`escrowOf(bytes32)`** 同源（**`orders`** 内重复 **RPC**，避免改 **`chain/*`**）。
const ORDER_DETAIL_ESCROW_OF_SELECTOR: [u8; 4] = [0x87, 0x90, 0x6b, 0x1e];

fn order_detail_evm_fn_selector(sig: &str) -> [u8; 4] {
    let h = Keccak256::digest(sig.as_bytes());
    [h[0], h[1], h[2], h[3]]
}

async fn order_detail_jsonrpc_eth_call_hex(
    rpc_url: &str,
    to: &str,
    data: &str,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": to, "data": data}, "latest"],
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
    res.get("result")
        .and_then(|r| r.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or("eth_call failed")
                .to_string()
        })
}

/// **`factory.escrowOf(orderId)`** → Escrow 合约地址；**零地址** 或 **未配置** → **`None`**。
async fn order_detail_read_escrow_address_hex(
    cfg: &chain::ChainConfig,
    order_id_bytes: [u8; 32],
) -> Result<Option<String>, String> {
    if !cfg.is_configured() {
        return Ok(None);
    };    let factory = cfg
        .escrow_factory_address
        .as_ref()
        .ok_or_else(|| "ESCROW_FACTORY_ADDRESS not set".to_string())?
        .trim_start_matches("0x");
    let to = format!("0x{}", factory);
    let data = format!(
        "0x{}{}",
        hex::encode(ORDER_DETAIL_ESCROW_OF_SELECTOR),
        hex::encode(order_id_bytes)
    );
    let hex_result = order_detail_jsonrpc_eth_call_hex(&cfg.rpc_url, &to, &data).await?;
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Ok(None);
    };    let escrow_addr = raw[12..32].to_vec();
    if escrow_addr.iter().all(|&b| b == 0) {
        return Ok(None);
    }
    Ok(Some(format!("0x{}", hex::encode(&escrow_addr))))
}

/// **`Escrow.token()`** → **ERC20** 合约地址（**`0x` + 40 hex**）。
async fn order_detail_read_escrow_token_address_hex(
    rpc_url: &str,
    escrow_hex: &str,
) -> Result<String, String> {
    let sel = order_detail_evm_fn_selector("token()");
    let data = format!("0x{}", hex::encode(sel));
    let hex_result = order_detail_jsonrpc_eth_call_hex(rpc_url, escrow_hex, &data).await?;
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Err("token() eth_call result too short".to_string());
    };    let slot = &raw[raw.len() - 32..];
    let addr = &slot[12..32];
    Ok(format!("0x{}", hex::encode(addr)))
}

fn u256_norm_hex_is_non_zero(norm_hex: &str) -> bool {
    let s = norm_hex
        .strip_prefix("0x")
        .unwrap_or(norm_hex)
        .trim_start_matches('0');
    !s.is_empty()
}

/// **TT-ESCROW-SSOT-AMOUNT-011**：**`ERC20.balanceOf(escrow)`** 规范 **uint256 hex**（与 **`chain::balance_read::eth_call_erc20_balance_of_u256_hex`** 同源）；**仅** **`> 0`** 时写入根级三键；**`0`** / **RPC 失败** / **无 Escrow** → **不写入**（**不**用订单金额或 DB 推导）。
pub(crate) async fn merge_escrow_locked_amount_ssot_into_order_detail_if_ok(
    body: &mut serde_json::Value,
    chain_config: Option<&chain::ChainConfig>,
    order_id: Uuid,
) {
    let Some(cfg) = chain_config else {
        return;
    };    let bytes = db::order_uuid_to_projection_order_id(order_id);
    let Ok(Some(escrow_hex)) = order_detail_read_escrow_address_hex(cfg, bytes).await else {
        return;
    };    let Ok(token_hex) = order_detail_read_escrow_token_address_hex(&cfg.rpc_url, &escrow_hex).await
    else {
        return;
    };    if token_hex.eq_ignore_ascii_case("0x0000000000000000000000000000000000000000") {
        return;
    };    let Ok(bal_hex) = chain::balance_read::eth_call_erc20_balance_of_u256_hex(
        cfg.rpc_url.trim(),
        &token_hex,
        &escrow_hex,
    )
    .await
    else {
        return;
    };    if !u256_norm_hex_is_non_zero(&bal_hex) {
        return;
    };    let Some(m) = body.as_object_mut() else {
        return;
    }
    m.insert("escrow_locked_amount".to_string(), json!(bal_hex));
    m.insert(
        "escrow_locked_amount_data_source".to_string(),
        json!("chain_read"),
    );
    m.insert(
        "escrow_locked_amount_is_chain_ssot".to_string(),
        json!(true),
    );
}

/// 仅当 **`chain::get_escrow_status`** 返回 **`Ok(Some(_))`** 时写入根级三键；**`Ok(None)`** / **`Err`** / 未配置链 → **不写入**（**不**用 DB **`order.state`** fallback）。
pub(crate) async fn merge_escrow_chain_state_ssot_into_order_detail_if_ok(
    body: &mut serde_json::Value,
    chain_config: Option<&chain::ChainConfig>,
    order_id: Uuid,
) {
    let Some(cfg) = chain_config else {
        return;
    };    let bytes = db::order_uuid_to_projection_order_id(order_id);
    let Ok(Some(st)) = chain::get_escrow_status(cfg, bytes).await else {
        return;
    };    let label = escrow_chain_status_label_order_detail_ssot(&st);
    let Some(m) = body.as_object_mut() else {
        return;
    }
    m.insert("escrow_chain_state".to_string(), json!(label));
    m.insert(
        "escrow_chain_state_data_source".to_string(),
        json!("chain_read"),
    );
    m.insert("escrow_chain_state_is_chain_ssot".to_string(), json!(true));
    if let Some(rel) = escrow_release_terminal_label_order_detail_ssot(&st) {
        m.insert("escrow_release_state".to_string(), json!(rel));
        m.insert(
            "escrow_release_state_data_source".to_string(),
            json!("chain_read"),
        );
        m.insert(
            "escrow_release_state_is_chain_ssot".to_string(),
            json!(true),
        );
    };    if let Some(d) = escrow_dispute_lifecycle_label_order_detail_ssot(&st) {
        m.insert("escrow_dispute_state".to_string(), json!(d));
        m.insert(
            "escrow_dispute_state_data_source".to_string(),
            json!("chain_read"),
        );
        m.insert(
            "escrow_dispute_state_is_chain_ssot".to_string(),
            json!(true),
        );
    }
}
