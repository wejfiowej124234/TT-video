//! P5-5 链事件索引器：消费 EscrowCreated/Deposited/Released/Refunded/DisputeOpened/ResolutionExecuted，
//! 及可选 **FeeRouter** `PlatformFeeRouted`（`FEE_ROUTER_ADDRESS`）、**RegionVault** `RegionVaultForwarded`（`REGION_VAULT_ADDRESS`、110、14 §1.1），
//! 按 blockNumber+logIndex 有序、幂等；checkpoint 持久化（01 §9、04 §四、48 §12.3）。

#![allow(dead_code)]

use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;
use tokio::sync::RwLock;

/// 单条链事件（与合约事件一致，幂等键 (chainId, blockNumber, logIndex)）
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct IndexedChainEvent {
    pub chain_id: u64,
    pub block_number: u64,
    pub log_index: u32,
    pub block_hash: String,
    pub tx_hash: String,
    pub kind: String,
    #[serde(default)]
    pub data: serde_json::Value,
}

/// 索引器状态：已消费事件列表 + checkpoint（重启从 last_block+1 继续）
/// Reorg（01 §9、08-4）：存 last_block_hash，重扫时若同一 block 的 hash 变化则回退 checkpoint 或暂停+人工
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct IndexerState {
    pub last_block: u64,
    pub last_log_index: u32,
    #[serde(default)]
    pub last_block_hash: String,
    pub events: Vec<IndexedChainEvent>,
}

pub type IndexerStateHandle = Arc<RwLock<IndexerState>>;

pub fn new_indexer_state() -> IndexerStateHandle {
    Arc::new(RwLock::new(IndexerState::default()))
}

/// 从磁盘加载运行时索引器状态（48 §12.3；路径为 INDEXER_STATE_PATH + ".runtime"）
pub fn load_indexer_state(path: &Path) -> Option<IndexerState> {
    let bytes = std::fs::read(path).ok()?;
    serde_json::from_slice(&bytes).ok()
}

/// 持久化运行时索引器状态（48 §12.3；indexer_tick 后落盘）
pub fn persist_indexer_state(
    path: &Path,
    state: &IndexerState,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let bytes = serde_json::to_vec_pretty(state)?;
    crate::ssot::write_bytes_atomic(path, &bytes)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    Ok(())
}

/// 单条 log 的完整信息（含 topics 供投影解析 orderId/escrow）
pub type EscrowLogEntry = (
    u64,
    u32,
    String,
    String,
    String,
    serde_json::Value,
    Vec<String>,
);

/// 从链上拉取一段区块的 Escrow 相关日志（eth_getLogs），与 09/01 §9 一致。
/// address: factory 或 escrow；topics[0] 为事件签名 hash。
/// 返回 (block_number, log_index, block_hash, tx_hash, kind, data, topics) 列表，调用方按序应用并更新 checkpoint。
pub async fn fetch_escrow_logs(
    rpc_url: &str,
    factory_address: &str,
    from_block: u64,
    to_block: u64,
) -> Result<Vec<EscrowLogEntry>, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_getLogs",
        "params": [{
            "address": format!("0x{}", factory_address.trim_start_matches("0x")),
            "fromBlock": format!("0x{:x}", from_block),
            "toBlock": format!("0x{:x}", to_block)
        }],
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
    let logs = res
        .get("result")
        .and_then(|r| r.as_array())
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or("eth_getLogs failed")
                .to_string()
        })?;
    let mut out = Vec::new();
    for log in logs {
        let block_number = log
            .get("blockNumber")
            .and_then(|b| b.as_str())
            .and_then(|s| u64::from_str_radix(s.trim_start_matches("0x"), 16).ok())
            .unwrap_or(0);
        let log_index = log
            .get("logIndex")
            .and_then(|l| l.as_str())
            .and_then(|s| u32::from_str_radix(s.trim_start_matches("0x"), 16).ok())
            .unwrap_or(0);
        let block_hash = log
            .get("blockHash")
            .and_then(|b| b.as_str())
            .unwrap_or("")
            .to_string();
        let tx_hash = log
            .get("transactionHash")
            .and_then(|t| t.as_str())
            .unwrap_or("")
            .to_string();
        let topics_arr = log
            .get("topics")
            .and_then(|t| t.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|t| t.as_str().map(String::from))
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let kind = topics_arr
            .first()
            .cloned()
            .unwrap_or_else(|| "unknown".to_string());
        let data = log.get("data").cloned().unwrap_or(serde_json::Value::Null);
        out.push((
            block_number,
            log_index,
            block_hash,
            tx_hash,
            kind,
            data,
            topics_arr,
        ));
    }
    out.sort_by_key(|t| (t.0, t.1));
    Ok(out)
}

/// 从指定合约地址列表拉取日志（用于 Escrow 实例的 Released/Refunded/ResolutionExecuted）
pub async fn fetch_logs_from_addresses(
    rpc_url: &str,
    addresses: &[String],
    from_block: u64,
    to_block: u64,
) -> Result<Vec<EscrowLogEntry>, String> {
    if addresses.is_empty() {
        return Ok(Vec::new());
    }
    let addrs: Vec<String> = addresses
        .iter()
        .map(|a| format!("0x{}", a.trim_start_matches("0x")))
        .collect();
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_getLogs",
        "params": [{
            "address": addrs,
            "fromBlock": format!("0x{:x}", from_block),
            "toBlock": format!("0x{:x}", to_block)
        }],
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
    let logs = res
        .get("result")
        .and_then(|r| r.as_array())
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or("eth_getLogs failed")
                .to_string()
        })?;
    let mut out = Vec::new();
    for log in logs {
        let block_number = log
            .get("blockNumber")
            .and_then(|b| b.as_str())
            .and_then(|s| u64::from_str_radix(s.trim_start_matches("0x"), 16).ok())
            .unwrap_or(0);
        let log_index = log
            .get("logIndex")
            .and_then(|l| l.as_str())
            .and_then(|s| u32::from_str_radix(s.trim_start_matches("0x"), 16).ok())
            .unwrap_or(0);
        let block_hash = log
            .get("blockHash")
            .and_then(|b| b.as_str())
            .unwrap_or("")
            .to_string();
        let tx_hash = log
            .get("transactionHash")
            .and_then(|t| t.as_str())
            .unwrap_or("")
            .to_string();
        let topics_arr = log
            .get("topics")
            .and_then(|t| t.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|t| t.as_str().map(String::from))
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let kind = topics_arr
            .first()
            .cloned()
            .unwrap_or_else(|| "unknown".to_string());
        let data = log.get("data").cloned().unwrap_or(serde_json::Value::Null);
        out.push((
            block_number,
            log_index,
            block_hash,
            tx_hash,
            kind,
            data,
            topics_arr,
        ));
    }
    out.sort_by_key(|t| (t.0, t.1));
    Ok(out)
}

/// 将拉取到的一条 log 转为 IndexedChainEvent 并追加到 state，更新 checkpoint。
/// 同一 `(chain_id, block_number, log_index)` 已存在时不重复 push（at-least-once 重扫 / 合并日志时幂等），仍推进 checkpoint。
/// 返回 **`true`** 表示本条为新事件；**`false`** 表示重复，调用方应跳过重复投影/DB 双写（见 `internal::indexer_tick`）。
pub async fn append_event_and_advance_checkpoint(
    state: &IndexerStateHandle,
    chain_id: u64,
    block_number: u64,
    log_index: u32,
    block_hash: &str,
    tx_hash: &str,
    kind: &str,
    data: serde_json::Value,
) -> bool {
    let mut g = state.write().await;
    let dup = g.events.iter().any(|e| {
        e.chain_id == chain_id && e.block_number == block_number && e.log_index == log_index
    });
    if !dup {
        g.events.push(IndexedChainEvent {
            chain_id,
            block_number,
            log_index,
            block_hash: block_hash.to_string(),
            tx_hash: tx_hash.to_string(),
            kind: kind.to_string(),
            data,
        });
    }
    g.last_block = block_number;
    g.last_log_index = log_index;
    g.last_block_hash = block_hash.to_string();
    !dup
}

/// Reorg 检测：若当前链上同一 block 的 hash 与已存 `last_block_hash` 不一致，说明可能发生 reorg，应暂停 tick 并人工处理（01 §9、110）。
pub fn reorg_detected(last_block_hash: &str, current_block_hash: &str) -> bool {
    let a = last_block_hash.trim().to_ascii_lowercase();
    let b = current_block_hash.trim().to_ascii_lowercase();
    !a.is_empty() && a != b
}

/// 索引器每轮 `eth_getLogs` 的区块上界：`chain_tip - max(1, finality_n)`（**110 §3.3**，与 `FINALITY_N` 环境变量一致）。
#[must_use]
pub fn indexer_finalized_upper_bound(chain_tip: u64, finality_n: u64) -> u64 {
    chain_tip.saturating_sub(finality_n.max(1))
}

/// 获取链上最新区块号（eth_blockNumber），供索引器一轮上界
pub async fn get_latest_block(rpc_url: &str) -> Result<u64, String> {
    let client = reqwest::Client::new();
    let res: serde_json::Value = client
        .post(rpc_url)
        .json(&serde_json::json!({
            "jsonrpc": "2.0",
            "method": "eth_blockNumber",
            "params": [],
            "id": 1
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let hex_str = res.get("result").and_then(|r| r.as_str()).ok_or_else(|| {
        res.get("error")
            .and_then(|e| e.get("message").and_then(|m| m.as_str()))
            .unwrap_or("eth_blockNumber failed")
            .to_string()
    })?;
    u64::from_str_radix(hex_str.trim_start_matches("0x"), 16).map_err(|e| e.to_string())
}

/// `eth_getBlockByNumber(block, false)` → **`hash`**（hex 字符串），供 tick 前与内存 **`last_block_hash`** 比对。
pub async fn get_block_hash_at(rpc_url: &str, block_number: u64) -> Result<String, String> {
    let client = reqwest::Client::new();
    let block_param = format!("0x{:x}", block_number);
    let res: serde_json::Value = client
        .post(rpc_url)
        .json(&serde_json::json!({
            "jsonrpc": "2.0",
            "method": "eth_getBlockByNumber",
            "params": [block_param, false],
            "id": 1
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    let err_msg = || {
        res.get("error")
            .and_then(|e| e.get("message").and_then(|m| m.as_str()))
            .unwrap_or("eth_getBlockByNumber failed")
            .to_string()
    };
    let Some(b) = res.get("result") else {
        return Err(err_msg());
    };
    if b.is_null() {
        return Err("eth_getBlockByNumber: null block (unknown height?)".to_string());
    }
    b.get("hash")
        .and_then(|h| h.as_str())
        .map(str::to_string)
        .ok_or_else(err_msg)
}

/// `Transfer(address,address,uint256)` topic0（keccak 签名）
pub const ERC20_TRANSFER_TOPIC0: &str =
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/// 单条 ERC20 `Transfer`（来自 `eth_getLogs`）
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FetchedErc20Transfer {
    pub block_number: u64,
    pub log_index: u32,
    pub block_hash: String,
    pub tx_hash: String,
    pub token_address: String,
    pub from_address: String,
    pub to_address: String,
    pub value_u256_hex: String,
}

/// 对若干代币合约拉取标准 **`Transfer`**（B-085）
pub async fn fetch_erc20_transfer_logs_for_tokens(
    rpc_url: &str,
    token_addresses: &[String],
    from_block: u64,
    to_block: u64,
) -> Result<Vec<FetchedErc20Transfer>, String> {
    if token_addresses.is_empty() {
        return Ok(Vec::new());
    }
    let addrs: Vec<String> = token_addresses
        .iter()
        .map(|a| format!("0x{}", a.trim_start_matches("0x")))
        .collect();
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_getLogs",
        "params": [{
            "address": addrs,
            "topics": [ERC20_TRANSFER_TOPIC0],
            "fromBlock": format!("0x{:x}", from_block),
            "toBlock": format!("0x{:x}", to_block)
        }],
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
    let logs = res
        .get("result")
        .and_then(|r| r.as_array())
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or("eth_getLogs failed")
                .to_string()
        })?;
    let topic0_want = ERC20_TRANSFER_TOPIC0.trim_start_matches("0x").to_ascii_lowercase();
    let mut out = Vec::new();
    for log in logs {
        let block_number = log
            .get("blockNumber")
            .and_then(|b| b.as_str())
            .and_then(|s| u64::from_str_radix(s.trim_start_matches("0x"), 16).ok())
            .unwrap_or(0);
        let log_index = log
            .get("logIndex")
            .and_then(|l| l.as_str())
            .and_then(|s| u32::from_str_radix(s.trim_start_matches("0x"), 16).ok())
            .unwrap_or(0);
        let block_hash = log
            .get("blockHash")
            .and_then(|b| b.as_str())
            .unwrap_or("")
            .to_string();
        let tx_hash = log
            .get("transactionHash")
            .and_then(|t| t.as_str())
            .unwrap_or("")
            .to_string();
        let token_raw = log
            .get("address")
            .and_then(|a| a.as_str())
            .unwrap_or("")
            .trim_start_matches("0x");
        if token_raw.len() != 40 {
            continue;
        }
        let token_address = format!("0x{}", token_raw.to_ascii_lowercase());
        let topics_arr = log
            .get("topics")
            .and_then(|t| t.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|t| t.as_str().map(String::from))
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let t0 = topics_arr
            .first()
            .map(|s| s.trim_start_matches("0x").to_ascii_lowercase())
            .unwrap_or_default();
        if t0 != topic0_want || topics_arr.len() < 3 {
            continue;
        }
        let data = log.get("data").cloned().unwrap_or(serde_json::Value::Null);
        let Some((from_address, to_address, value_u256_hex)) =
            parse_erc20_transfer_topics_data(&topics_arr, &data)
        else {
            continue;
        };
        out.push(FetchedErc20Transfer {
            block_number,
            log_index,
            block_hash,
            tx_hash,
            token_address,
            from_address,
            to_address,
            value_u256_hex,
        });
    }
    out.sort_by_key(|t| (t.block_number, t.log_index));
    Ok(out)
}

fn topic_word_to_address(topic: &str) -> Option<String> {
    let hex_s = topic.trim_start_matches("0x");
    if hex_s.len() < 40 {
        return None;
    }
    Some(format!("0x{}", &hex_s[hex_s.len() - 40..].to_ascii_lowercase()))
}

fn parse_erc20_transfer_topics_data(
    topics: &[String],
    data: &serde_json::Value,
) -> Option<(String, String, String)> {
    let from_address = topic_word_to_address(topics.get(1)?)?;
    let to_address = topic_word_to_address(topics.get(2)?)?;
    let data_str = data.as_str()?;
    let raw = hex::decode(data_str.trim_start_matches("0x")).ok()?;
    if raw.len() < 32 {
        return None;
    }
    Some((
        from_address,
        to_address,
        format!("0x{}", hex::encode(&raw[0..32])),
    ))
}

#[cfg(test)]
mod tests {
    use super::{
        append_event_and_advance_checkpoint, indexer_finalized_upper_bound, new_indexer_state,
        reorg_detected,
    };
    use serde_json::json;

    #[tokio::test]
    async fn append_event_dedupes_same_block_log_index() {
        let h = new_indexer_state();
        assert!(
            append_event_and_advance_checkpoint(&h, 1, 10, 0, "0xb1", "0xt1", "0xsig", json!({}),)
                .await
        );
        assert!(
            !append_event_and_advance_checkpoint(&h, 1, 10, 0, "0xb1", "0xt1", "0xsig", json!({}),)
                .await
        );
        let g = h.read().await;
        assert_eq!(g.events.len(), 1);
        assert_eq!(g.last_block, 10);
        assert_eq!(g.last_log_index, 0);
    }

    #[test]
    fn reorg_detected_empty_last_is_false() {
        assert!(!reorg_detected("", "0xabc"));
    }

    #[test]
    fn reorg_detected_same_hash_is_false() {
        assert!(!reorg_detected("0xabc", "0xabc"));
    }

    #[test]
    fn reorg_detected_different_hash_is_true() {
        assert!(reorg_detected("0xabc", "0xdef"));
    }

    #[test]
    fn reorg_detected_case_insensitive_match() {
        assert!(!reorg_detected("0xAbC", "0xabc"));
    }

    #[test]
    fn finalized_upper_bound_uses_max_one_for_zero_finality() {
        assert_eq!(indexer_finalized_upper_bound(100, 12), 88);
        assert_eq!(indexer_finalized_upper_bound(100, 0), 99);
    }

    #[test]
    fn finalized_upper_bound_saturates_at_zero() {
        assert_eq!(indexer_finalized_upper_bound(5, 12), 0);
    }
}
