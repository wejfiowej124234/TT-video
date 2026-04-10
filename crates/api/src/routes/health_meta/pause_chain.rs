//! B-091：`factoryPaused` / `distributePaused` 链上只读快照（eth_call）。

use digest::Digest;
use sha3::Keccak256;

use crate::chain;

/// B-091：`factoryPaused()` / `distributePaused()` 的 **4** 字节 selector（Solidity **`bool public`** getter）。
pub(crate) fn b091_evm_selector(canonical_sig: &str) -> [u8; 4] {
    let h = Keccak256::digest(canonical_sig.as_bytes());
    [h[0], h[1], h[2], h[3]]
}

async fn eth_call_bool_latest(
    client: &reqwest::Client,
    rpc_url: &str,
    to: &str,
    selector: [u8; 4],
) -> Result<bool, String> {
    let data = format!("0x{}", hex::encode(selector));
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": to, "data": data}, "latest"],
        "id": 1
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
    let hex_result = res.get("result").and_then(|r| r.as_str()).ok_or_else(|| {
        res.get("error")
            .and_then(|e| e.get("message").and_then(|m| m.as_str()))
            .unwrap_or("eth_call failed")
            .to_string()
    })?;
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Err("eth_call result too short".to_string());
    }
    Ok(raw[31] != 0)
}

pub(crate) struct MetaPauseChainSnapshot {
    pub(crate) factory_paused: Option<bool>,
    pub(crate) distribute_paused: Option<bool>,
    pub(crate) read_status: &'static str,
    pub(crate) read_error: Option<String>,
}

/// **TT-COMP-B091**：在 **`CHAIN_RPC_URL`** 与对应合约地址可用时 **`eth_call`** 读 **`factoryPaused` / `distributePaused`**；否则 **`null`** + 显式 **`chain_pause_read.status`**（**禁止**伪造链上真值）。
pub(crate) async fn meta_pause_chain_snapshot(cfg: Option<&chain::ChainConfig>) -> MetaPauseChainSnapshot {
    let Some(cfg) = cfg else {
        return MetaPauseChainSnapshot {
            factory_paused: None,
            distribute_paused: None,
            read_status: "chain_unavailable",
            read_error: None,
        };
    };
    if !cfg.is_configured() {
        return MetaPauseChainSnapshot {
            factory_paused: None,
            distribute_paused: None,
            read_status: "chain_unavailable",
            read_error: None,
        };
    }
    let sel_factory = b091_evm_selector("factoryPaused()");
    let sel_dist = b091_evm_selector("distributePaused()");
    let mut factory_paused = None;
    let mut distribute_paused = None;
    let mut errors: Vec<String> = Vec::new();
    let mut attempted = false;

    if let Some(to_raw) = cfg
        .escrow_factory_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        attempted = true;
        let to = if to_raw.starts_with("0x") || to_raw.starts_with("0X") {
            to_raw.to_string()
        } else {
            format!("0x{}", to_raw)
        };
        // 每路独立 **Client**：避免连接复用下单次 **accept** mock / 部分代理对 **pipeline** 行为不一致（B-091 单测与运维读链）。
        match eth_call_bool_latest(&reqwest::Client::new(), &cfg.rpc_url, &to, sel_factory).await {
            Ok(b) => factory_paused = Some(b),
            Err(e) => errors.push(format!("factoryPaused: {e}")),
        }
    }

    if let Some(to_raw) = cfg
        .fee_router_address
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
    {
        attempted = true;
        let to = if to_raw.starts_with("0x") || to_raw.starts_with("0X") {
            to_raw.to_string()
        } else {
            format!("0x{}", to_raw)
        };
        match eth_call_bool_latest(&reqwest::Client::new(), &cfg.rpc_url, &to, sel_dist).await {
            Ok(b) => distribute_paused = Some(b),
            Err(e) => errors.push(format!("distributePaused: {e}")),
        }
    }

    let read_status = if !attempted {
        "chain_pause_targets_unset"
    } else if errors.is_empty() {
        "eth_call"
    } else {
        "eth_call_error"
    };
    let read_error = if errors.is_empty() {
        None
    } else {
        Some(errors.join("; "))
    };
    MetaPauseChainSnapshot {
        factory_paused,
        distribute_paused,
        read_status,
        read_error,
    }
}
