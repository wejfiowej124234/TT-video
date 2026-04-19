//! P5-5 链事件索引器：消费 EscrowCreated/Deposited/Released/Refunded/DisputeOpened/ResolutionExecuted，
//! 及可选 **FeeRouter** `PlatformFeeRouted`（`FEE_ROUTER_ADDRESS`）、**RegionVault** `RegionVaultForwarded`（`REGION_VAULT_ADDRESS`、110、14 §1.1），
//! **`RegionShareSnapshotLine`**（**B-115-4** / **P5-3**：与 **`REGION_VAULT_ADDRESS`** 同址 `eth_getLogs` 可合并命中；**P5-3-1** 起 **`RegionVault.emitRegionShareSnapshotLine`** 链上发出，**`indexer_tick`** 解析后幂等写入 **`region_share_snapshot_lines`**），
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

/// 单条 log 的完整信息（含 topics 供投影解析 orderId/escrow；**`log_address`** 供 **P5-1-B** 与 FeeRouter/RegionVault 同址校验）
pub type EscrowLogEntry = (
    u64,
    u32,
    String,
    String,
    String,
    serde_json::Value,
    Vec<String>,
    String,
);

fn push_eth_log_entry(log: &serde_json::Value, out: &mut Vec<EscrowLogEntry>) {
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
    let log_address = log
        .get("address")
        .and_then(|a| a.as_str())
        .unwrap_or("")
        .to_string();
    out.push((
        block_number,
        log_index,
        block_hash,
        tx_hash,
        kind,
        data,
        topics_arr,
        log_address,
    ));
}

/// 从链上拉取一段区块的 Escrow 相关日志（eth_getLogs），与 09/01 §9 一致。
/// address: factory 或 escrow；topics[0] 为事件签名 hash。
/// 返回 `(block_number, log_index, block_hash, tx_hash, kind, data, topics, log_address)` 列表，调用方按序应用并更新 checkpoint。
pub async fn fetch_escrow_logs(
    rpc_url: &str,
    factory_address: &str,
    from_block: u64,
    to_block: u64,
) -> Result<Vec<EscrowLogEntry>, String> {
    validate_inclusive_block_range_for_eth_get_logs(from_block, to_block)?;
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
        push_eth_log_entry(log, &mut out);
    }
    let mut out = filter_escrow_log_entries_to_inclusive_block_range(out, from_block, to_block);
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
    validate_inclusive_block_range_for_eth_get_logs(from_block, to_block)?;
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
        push_eth_log_entry(log, &mut out);
    }
    let mut out = filter_escrow_log_entries_to_inclusive_block_range(out, from_block, to_block);
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

/// Reorg 后**仅内存**回滚：丢弃 `block_number >= from_block_inclusive` 的已索引事件，并把 checkpoint 设为剩余前缀的尾事件（无则归零）。
/// **深度任意**：同一调用即剥除 **连续 N 个块**（如原 **10/11/12** 一并丢弃），再按新 canonical **`eth_getLogs`** 重放 **10'～12'**（**B-114-4** 单测 **`b114_4_reorg_multi_block_*`**）。
/// 与 **`internal::perform_indexer_reorg_rewind_execute`** 中 DB 删尾 **`>= from_block`** 对齐（110 §3.1.3），便于重扫同一高度下新 canonical hash 的 log 而不产生重复 `(chain_id, block_number, log_index)` 记录。
pub async fn rewind_indexer_memory_state_after_reorg(
    state: &IndexerStateHandle,
    from_block_inclusive: u64,
) -> (u64, u32, String) {
    let mut g = state.write().await;
    g.events
        .retain(|e| e.block_number < from_block_inclusive);
    if let Some(last_ev) = g
        .events
        .iter()
        .max_by_key(|e| (e.block_number, e.log_index))
        .map(|e| (e.block_number, e.log_index, e.block_hash.clone()))
    {
        g.last_block = last_ev.0;
        g.last_log_index = last_ev.1;
        g.last_block_hash = last_ev.2.clone();
        last_ev
    } else {
        g.last_block = 0;
        g.last_log_index = 0;
        g.last_block_hash.clear();
        (0, 0, String::new())
    }
}

/// **`indexer_tick`** 每轮（含 **`reorg_detected` → `perform_indexer_reorg_rewind_execute` → `continue`** 后）用于 **`eth_getLogs`** 的 **`fromBlock`**：**`last_block + 1`**（**B-114-5 / TT-B114-5**）。
/// 与 **`internal::indexer_tick`** 读锁内计算 **同源**，reorg 内存/DB 删尾后首轮回合起扫与 checkpoint **对齐**（不断档、不重扫已确认尾块）。
#[must_use]
pub fn indexer_tick_scan_from_block_lower_bound(state: &IndexerState) -> u64 {
    state.last_block + 1
}

/// 索引器每轮 `eth_getLogs` 的区块上界：`chain_tip - max(1, finality_n)`（**110 §3.3**，与 `FINALITY_N` 环境变量一致）。
#[must_use]
pub fn indexer_finalized_upper_bound(chain_tip: u64, finality_n: u64) -> u64 {
    chain_tip.saturating_sub(finality_n.max(1))
}

/// Escrow 事件名（与 `db::upsert_orders_projection_chain_snapshot` 中 **`paid_at_*` / `completed_at_*`** 物化列一致）是否属于**资金终态**投影写入。
#[must_use]
pub fn escrow_event_is_orders_projection_funds_terminal(event_name: &str) -> bool {
    matches!(
        event_name,
        "Paid"
            | "Released"
            | "Refunded"
            | "ResolutionExecuted"
            | "PartialRefundExecuted"
            | "SlashedExecuted"
    )
}

/// 在 **`chain_tip`** 与 **`FINALITY_N`** 口径下，**`block_number`** 是否已满足索引器 finality 深度（与 [`indexer_finalized_upper_bound`] 同源）。
#[must_use]
pub fn block_has_indexer_finality_depth(
    block_number: u64,
    chain_tip: u64,
    finality_n: u64,
) -> bool {
    block_number <= indexer_finalized_upper_bound(chain_tip, finality_n)
}

/// **`orders_projection`** 资金终态双写许可：非终态事件始终允许；终态事件仅当块深满足 **FINALITY_N** 时允许（**B-127** 硬闸门，与 tick **`to_block`** 一致）。
#[must_use]
pub fn allow_orders_projection_funds_terminal_write(
    event_name: &str,
    block_number: u64,
    chain_tip: u64,
    finality_n: u64,
) -> bool {
    !escrow_event_is_orders_projection_funds_terminal(event_name)
        || block_has_indexer_finality_depth(block_number, chain_tip, finality_n)
}

/// **`eth_getLogs`** 的 **inclusive** 窗口 **`[from_block, to_block]`**。`from_block > to_block` 视为调用方错误，拒绝对节点发无效区间（避免与「空日志」混淆导致漏扫误判；**B-114-2**）。
pub fn validate_inclusive_block_range_for_eth_get_logs(
    from_block: u64,
    to_block: u64,
) -> Result<(), String> {
    if from_block > to_block {
        return Err(format!(
            "invalid_eth_get_logs_block_range: from_block ({from_block}) > to_block ({to_block})"
        ));
    }
    Ok(())
}

/// 丢弃 **blockNumber** 落在 **inclusive** `[from_block, to_block]` **之外** 的 `eth_getLogs` 解析结果，防止异常返参越界推进 checkpoint（**B-114-2**）。
pub fn filter_escrow_log_entries_to_inclusive_block_range(
    entries: Vec<EscrowLogEntry>,
    from_block: u64,
    to_block: u64,
) -> Vec<EscrowLogEntry> {
    entries
        .into_iter()
        .filter(|e| e.0 >= from_block && e.0 <= to_block)
        .collect()
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

/// JSON-RPC **`eth_chainId`** → **`u64`**（通常为十六进制字符串；少数节点返回十进制数）。
///
/// 供 **`POST …/internal/indexer-reconcile`** **`chain_context`** 与配置 **`chain_id`** 对读（**TT-B175** / **B-175**）。
pub async fn get_eth_chain_id(rpc_url: &str) -> Result<u64, String> {
    let client = reqwest::Client::new();
    let res: serde_json::Value = client
        .post(rpc_url)
        .json(&serde_json::json!({
            "jsonrpc": "2.0",
            "method": "eth_chainId",
            "params": [],
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
            .unwrap_or("eth_chainId failed")
            .to_string()
    };
    let Some(r) = res.get("result") else {
        return Err(err_msg());
    };
    if let Some(s) = r.as_str() {
        return u64::from_str_radix(s.trim_start_matches("0x"), 16).map_err(|e| e.to_string());
    }
    if let Some(n) = r.as_u64() {
        return Ok(n);
    }
    Err("eth_chainId: unexpected result type".to_string())
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

/// 身份质押池事件 topic0（**`IdentityStakingPool`**；旧 **`contracts/src/Staking.sol` 已移除**；与历史 **`Staking`** **事件签名/topic0 兼容**；`indexer::tests::staking_event_topic0s_keccak` 校验）
pub const STAKED_TOPIC0: &str =
    "0x9e71bc8eea02a63969f509818f2dafb9254532904319f9dbda79b67bd34a5f3d";
pub const WITHDRAWN_TOPIC0: &str =
    "0x7084f5476618d8e60b11ef0d7d3f06914655adb8793e28ff7f018d4c76d505d5";
pub const SLASHED_TOPIC0: &str =
    "0x4ed05e9673c26d2ed44f7ef6a7f2942df0ee3b5e1e17db4b99f9dcd261a339cd";

/// **`InvestorShareLockLedger`**（**TT-COMP-B088-LOCK-VAULT-PROJECTION-001**）；`indexer::tests::lock_ledger_event_topic0s_keccak` 校验
pub const LOCKED_TOPIC0: &str =
    "0x9f1ec8c880f76798e7b793325d625e9b60e4082a553c98f42b6cda368dd60008";
pub const UNLOCKED_TOPIC0: &str =
    "0x0f0bc5b519ddefdd8e5f9e6423433aa2b869738de2ae34d58ebc796fc749fa0d";

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
    validate_inclusive_block_range_for_eth_get_logs(from_block, to_block)?;
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
    out.retain(|t| t.block_number >= from_block && t.block_number <= to_block);
    out.sort_by_key(|t| (t.block_number, t.log_index));
    Ok(out)
}

// --- B-115-4：RegionShare 快照行物化（`region_share_snapshot_lines`）---

/// 与 Solidity `event RegionShareSnapshotLine(uint256 indexed snapshotEpoch, address indexed recipient, string regionId, uint256 snapshotBlockNumber, uint256 shareBalance)` 一致（供索引器解析；链上合约可为 Target）。
pub const REGION_SHARE_SNAPSHOT_LINE_EVENT_SIGNATURE: &[u8] =
    b"RegionShareSnapshotLine(uint256,address,string,uint256,uint256)";

#[must_use]
pub fn region_share_snapshot_line_topic0_hex() -> String {
    use sha3::{Digest, Keccak256};
    let h = Keccak256::digest(REGION_SHARE_SNAPSHOT_LINE_EVENT_SIGNATURE);
    format!("0x{}", hex::encode(h))
}

fn topic_word_to_address_snapshot(topic: &str) -> Option<String> {
    let hex_s = topic.trim_start_matches("0x");
    if hex_s.len() < 40 {
        return None;
    }
    Some(format!(
        "0x{}",
        hex_s[hex_s.len() - 40..].to_ascii_lowercase()
    ))
}

fn u256_word_be_low_i64(word: &[u8; 32]) -> Option<i64> {
    if word.iter().take(24).any(|&b| b != 0) {
        return None;
    }
    let mut v: i64 = 0;
    for &b in word.iter().skip(24) {
        v = (v << 8) | (b as i64);
    }
    Some(v)
}

fn u256_word_be_low_u64(word: &[u8; 32]) -> Option<u64> {
    if word.iter().take(24).any(|&b| b != 0) {
        return None;
    }
    let mut v: u64 = 0;
    for &b in word.iter().skip(24) {
        v = (v << 8) | (b as u64);
    }
    Some(v)
}

/// 解析 **`RegionShareSnapshotLine`**；`topic0` 须与 [`region_share_snapshot_line_topic0_hex`] 一致。
pub fn parse_region_share_snapshot_line(
    topics: &[String],
    data: &serde_json::Value,
) -> Option<(i64, String, String, i64, String)> {
    let t0_got = topics.first()?.trim_start_matches("0x").to_ascii_lowercase();
    let t0_want = region_share_snapshot_line_topic0_hex()
        .trim_start_matches("0x")
        .to_ascii_lowercase();
    if t0_got != t0_want || topics.len() < 3 {
        return None;
    }
    let epoch_bytes = hex::decode(topics[1].trim_start_matches("0x")).ok()?;
    if epoch_bytes.len() != 32 {
        return None;
    }
    let mut ew = [0u8; 32];
    ew.copy_from_slice(&epoch_bytes);
    let snapshot_epoch = u256_word_be_low_i64(&ew)?;
    let recipient = topic_word_to_address_snapshot(topics.get(2)?)?;
    let data_str = data.as_str()?;
    let raw = hex::decode(data_str.trim_start_matches("0x")).ok()?;
    if raw.len() < 128 {
        return None;
    }
    let mut w0 = [0u8; 32];
    w0.copy_from_slice(&raw[0..32]);
    let str_off = u256_word_be_low_u64(&w0)? as usize;
    if str_off != 96 {
        return None;
    }
    let mut w1 = [0u8; 32];
    w1.copy_from_slice(&raw[32..64]);
    let snapshot_block = u256_word_be_low_i64(&w1)?;
    let share_hex = format!("0x{}", hex::encode(&raw[64..96]));
    let mut w2 = [0u8; 32];
    w2.copy_from_slice(&raw[96..128]);
    let slen = u256_word_be_low_u64(&w2)? as usize;
    let sstart = str_off.checked_add(32)?;
    if sstart.checked_add(slen)? > raw.len() {
        return None;
    }
    let region_id = std::str::from_utf8(&raw[sstart..sstart + slen])
        .ok()?
        .to_string();
    if region_id.is_empty() {
        return None;
    }
    Some((
        snapshot_epoch,
        region_id,
        recipient,
        snapshot_block,
        share_hex,
    ))
}

/// 单条身份质押池状态事件（`Staked` / `Withdrawn` / `Slashed`；与旧 `Staking` ABI 兼容）
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FetchedStakingStateEvent {
    pub block_number: u64,
    pub log_index: u32,
    pub block_hash: String,
    pub tx_hash: String,
    pub staking_contract_address: String,
    pub event_kind: String,
    pub user_address: String,
    pub amount_u256_hex: String,
}

fn staking_topic0_to_kind(topic0: &str) -> Option<&'static str> {
    let t = topic0.trim_start_matches("0x").to_ascii_lowercase();
    if t == STAKED_TOPIC0.trim_start_matches("0x").to_ascii_lowercase() {
        return Some("Staked");
    }
    if t == WITHDRAWN_TOPIC0.trim_start_matches("0x").to_ascii_lowercase() {
        return Some("Withdrawn");
    }
    if t == SLASHED_TOPIC0.trim_start_matches("0x").to_ascii_lowercase() {
        return Some("Slashed");
    }
    None
}

/// 对 **`STAKING_ADDRESS`** 合约拉取 **`Staked` / `Withdrawn` / `Slashed`**（B-088 Completion）
pub async fn fetch_staking_state_logs(
    rpc_url: &str,
    staking_address: &str,
    from_block: u64,
    to_block: u64,
) -> Result<Vec<FetchedStakingStateEvent>, String> {
    let raw = staking_address.trim().trim_start_matches("0x");
    if raw.len() != 40 || !raw.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("invalid_staking_address".to_string());
    }
    validate_inclusive_block_range_for_eth_get_logs(from_block, to_block)?;
    let addr = format!("0x{}", raw.to_ascii_lowercase());
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_getLogs",
        "params": [{
            "address": addr,
            "topics": [[STAKED_TOPIC0, WITHDRAWN_TOPIC0, SLASHED_TOPIC0]],
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
        let log_addr_raw = log
            .get("address")
            .and_then(|a| a.as_str())
            .unwrap_or("")
            .trim_start_matches("0x");
        if log_addr_raw.len() != 40 {
            continue;
        }
        let staking_contract_address = format!("0x{}", log_addr_raw.to_ascii_lowercase());
        let topics_arr = log
            .get("topics")
            .and_then(|t| t.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|t| t.as_str().map(String::from))
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let Some(t0) = topics_arr.first() else {
            continue;
        };
        let Some(kind) = staking_topic0_to_kind(t0) else {
            continue;
        };
        let Some(user_address) = topics_arr
            .get(1)
            .and_then(|t| topic_word_to_address(t))
        else {
            continue;
        };
        let data = log.get("data").and_then(|d| d.as_str()).unwrap_or("");
        let raw_d = hex::decode(data.trim_start_matches("0x")).unwrap_or_default();
        if raw_d.len() < 32 {
            continue;
        }
        let amount_u256_hex = format!("0x{}", hex::encode(&raw_d[0..32]));
        out.push(FetchedStakingStateEvent {
            block_number,
            log_index,
            block_hash,
            tx_hash,
            staking_contract_address,
            event_kind: kind.to_string(),
            user_address,
            amount_u256_hex,
        });
    }
    out.retain(|t| t.block_number >= from_block && t.block_number <= to_block);
    out.sort_by_key(|t| (t.block_number, t.log_index));
    Ok(out)
}

/// 单条锁仓状态事件（**`Locked` / `Unlocked`**）
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FetchedInvestorLockStateEvent {
    pub block_number: u64,
    pub log_index: u32,
    pub block_hash: String,
    pub tx_hash: String,
    pub lock_contract_address: String,
    pub event_kind: String,
    pub user_address: String,
    pub amount_u256_hex: String,
}

fn lock_topic0_to_kind(topic0: &str) -> Option<&'static str> {
    let t = topic0.trim_start_matches("0x").to_ascii_lowercase();
    if t == LOCKED_TOPIC0.trim_start_matches("0x").to_ascii_lowercase() {
        return Some("Locked");
    }
    if t == UNLOCKED_TOPIC0.trim_start_matches("0x").to_ascii_lowercase() {
        return Some("Unlocked");
    }
    None
}

/// 对 **`INVESTOR_LOCK_CONTRACT_ADDRESSES`** 中各合约拉取 **`Locked` / `Unlocked`**
pub async fn fetch_investor_lock_state_logs(
    rpc_url: &str,
    lock_address: &str,
    from_block: u64,
    to_block: u64,
) -> Result<Vec<FetchedInvestorLockStateEvent>, String> {
    let raw = lock_address.trim().trim_start_matches("0x");
    if raw.len() != 40 || !raw.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("invalid_lock_contract_address".to_string());
    }
    validate_inclusive_block_range_for_eth_get_logs(from_block, to_block)?;
    let addr = format!("0x{}", raw.to_ascii_lowercase());
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_getLogs",
        "params": [{
            "address": addr,
            "topics": [[LOCKED_TOPIC0, UNLOCKED_TOPIC0]],
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
        let log_addr_raw = log
            .get("address")
            .and_then(|a| a.as_str())
            .unwrap_or("")
            .trim_start_matches("0x");
        if log_addr_raw.len() != 40 {
            continue;
        }
        let lock_contract_address = format!("0x{}", log_addr_raw.to_ascii_lowercase());
        let topics_arr = log
            .get("topics")
            .and_then(|t| t.as_array())
            .map(|a| {
                a.iter()
                    .filter_map(|t| t.as_str().map(String::from))
                    .collect::<Vec<_>>()
            })
            .unwrap_or_default();
        let Some(t0) = topics_arr.first() else {
            continue;
        };
        let Some(kind) = lock_topic0_to_kind(t0) else {
            continue;
        };
        let Some(user_address) = topics_arr
            .get(1)
            .and_then(|t| topic_word_to_address(t))
        else {
            continue;
        };
        let data = log.get("data").and_then(|d| d.as_str()).unwrap_or("");
        let raw_d = hex::decode(data.trim_start_matches("0x")).unwrap_or_default();
        if raw_d.len() < 32 {
            continue;
        }
        let amount_u256_hex = format!("0x{}", hex::encode(&raw_d[0..32]));
        out.push(FetchedInvestorLockStateEvent {
            block_number,
            log_index,
            block_hash,
            tx_hash,
            lock_contract_address,
            event_kind: kind.to_string(),
            user_address,
            amount_u256_hex,
        });
    }
    out.retain(|t| t.block_number >= from_block && t.block_number <= to_block);
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
        append_event_and_advance_checkpoint, filter_escrow_log_entries_to_inclusive_block_range,
        get_eth_chain_id, indexer_finalized_upper_bound, new_indexer_state,
        parse_region_share_snapshot_line, reorg_detected, region_share_snapshot_line_topic0_hex,
        rewind_indexer_memory_state_after_reorg, validate_inclusive_block_range_for_eth_get_logs,
        EscrowLogEntry, LOCKED_TOPIC0, REGION_SHARE_SNAPSHOT_LINE_EVENT_SIGNATURE, SLASHED_TOPIC0,
        STAKED_TOPIC0, UNLOCKED_TOPIC0, WITHDRAWN_TOPIC0,
    };
    use serde_json::json;
    use tokio::io::AsyncWriteExt;
    use tokio::net::TcpListener;

    /// **TT-B175**：**`eth_chainId`** 十六进制 **`result`** 解析为 **`u64`**。
    #[tokio::test]
    async fn b175_get_eth_chain_id_parses_hex_result() {
        let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind mock rpc");
        let port = listener.local_addr().unwrap().port();
        tokio::spawn(async move {
            loop {
                let Ok((mut socket, _)) = listener.accept().await else {
                    break;
                };
                let Ok(_req) =
                    crate::jsonrpc_mock_server::read_http_request_headers_and_body(&mut socket).await
                else {
                    continue;
                };
                let body = r#"{"jsonrpc":"2.0","id":1,"result":"0x89"}"#;
                let resp = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(),
                    body
                );
                let _ = socket.write_all(resp.as_bytes()).await;
            }
        });
        tokio::task::yield_now().await;
        let got = get_eth_chain_id(&format!("http://127.0.0.1:{port}"))
            .await
            .expect("eth_chainId ok");
        assert_eq!(got, 137);
    }

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

    /// **B-114-2**：`from_block > to_block` 拒收，避免无效 `eth_getLogs` 与空结果混淆。
    #[test]
    fn b114_2_indexer_scan_range_validate_rejects_from_gt_to() {
        assert!(validate_inclusive_block_range_for_eth_get_logs(2, 1).is_err());
        let e = validate_inclusive_block_range_for_eth_get_logs(10, 9).unwrap_err();
        assert!(
            e.contains("invalid_eth_get_logs_block_range"),
            "unexpected message: {e}"
        );
        assert!(validate_inclusive_block_range_for_eth_get_logs(0, 0).is_ok());
        assert!(validate_inclusive_block_range_for_eth_get_logs(3, 3).is_ok());
        assert!(validate_inclusive_block_range_for_eth_get_logs(1, 100).is_ok());
    }

    /// **B-114-2**：仅保留 **inclusive** `[from, to]` 内区块，边界块不漏、界外不重入。
    #[test]
    fn b114_2_indexer_scan_range_filter_keeps_inclusive_bounds_only() {
        let row = |bn: u64| -> EscrowLogEntry {
            (
                bn,
                0,
                "0xh".into(),
                "0xt".into(),
                "0xsig".into(),
                json!(null),
                vec![],
                "0xa".into(),
            )
        };
        let entries = vec![row(4), row(5), row(6), row(7)];
        let got = filter_escrow_log_entries_to_inclusive_block_range(entries, 5, 6);
        assert_eq!(got.len(), 2);
        assert_eq!(got[0].0, 5);
        assert_eq!(got[1].0, 6);
    }

    /// 模拟 reorg：同一高度下 canonical hash 变化 → 内存删尾后 checkpoint 与事件集一致，可重放新链头。
    #[tokio::test]
    async fn reorg_safety_rewind_truncates_orphan_blocks_and_restores_tail_checkpoint() {
        let h = new_indexer_state();
        assert!(
            append_event_and_advance_checkpoint(&h, 137, 9, 0, "0xhash9", "0xt9", "k9", json!({}),)
                .await
        );
        assert!(
            append_event_and_advance_checkpoint(
                &h,
                137,
                10,
                0,
                "0xdeadbeef",
                "0xt10",
                "k10",
                json!({}),
            )
            .await
        );
        assert!(reorg_detected("0xdeadbeef", "0xcafebabe"));

        let (lb, lli, lhash) = rewind_indexer_memory_state_after_reorg(&h, 10).await;
        assert_eq!(lb, 9);
        assert_eq!(lli, 0);
        assert_eq!(lhash, "0xhash9");

        let g = h.read().await;
        assert_eq!(g.events.len(), 1);
        assert_eq!(g.events[0].block_number, 9);
    }

    /// 模拟 log 集在回滚高度被替换：回滚后重放同 `(block, log_index)` 仅一条，且不残留旧 block_hash。
    #[tokio::test]
    async fn reorg_safety_simulated_canon_replay_after_hash_change_no_duplicate_keys() {
        let h = new_indexer_state();
        let chain_id = 137u64;
        assert!(
            append_event_and_advance_checkpoint(
                &h,
                chain_id,
                10,
                0,
                "0xoldCanon",
                "0xaa",
                "0xsig",
                json!({"phase": "abandoned"}),
            )
            .await
        );
        let g = h.read().await;
        assert_eq!(g.last_block_hash, "0xoldCanon");

        assert!(reorg_detected(&g.last_block_hash, "0xnewCanon"));
        drop(g);

        rewind_indexer_memory_state_after_reorg(&h, 10).await;

        assert!(
            append_event_and_advance_checkpoint(
                &h,
                chain_id,
                10,
                0,
                "0xnewCanon",
                "0xbb",
                "0xsig",
                json!({"phase": "canonical"}),
            )
            .await
        );

        let g = h.read().await;
        assert_eq!(g.events.len(), 1);
        assert_eq!(g.events[0].block_hash, "0xnewCanon");
        assert_eq!(g.events[0].data, json!({"phase": "canonical"}));
        assert_eq!(g.last_block_hash, "0xnewCanon");

        let mut keys = std::collections::HashSet::new();
        for e in &g.events {
            assert!(keys.insert((e.chain_id, e.block_number, e.log_index)));
        }
    }

    /// **B-114-4 / TT-B114-4**：多区块 reorg — 原 **10/11/12** 整段替换为 **10'/11'/12'**；一次 **`rewind(10)`** 后重放，仅新链数据、键唯一、checkpoint 到新 **12**。
    #[tokio::test]
    async fn b114_4_reorg_multi_block_rewind_then_replay_replaces_canonical_prefix() {
        let h = new_indexer_state();
        let cid = 137_u64;
        assert!(
            append_event_and_advance_checkpoint(&h, cid, 8, 0, "0xb8", "0xt8", "k", json!({"stable": true}),)
                .await
        );
        for (bn, bh) in [(10_u64, "0xold10"), (11, "0xold11"), (12, "0xold12")] {
            assert!(
                append_event_and_advance_checkpoint(
                    &h,
                    cid,
                    bn,
                    0,
                    bh,
                    "0xt",
                    "0xsig",
                    json!({"fork": "abandoned"}),
                )
                .await
            );
        }

        let (lb, lli, lhash) = rewind_indexer_memory_state_after_reorg(&h, 10).await;
        assert_eq!(lb, 8);
        assert_eq!(lli, 0);
        assert_eq!(lhash, "0xb8");

        for (bn, bh) in [(10_u64, "0xnew10"), (11, "0xnew11"), (12, "0xnew12")] {
            assert!(
                append_event_and_advance_checkpoint(
                    &h,
                    cid,
                    bn,
                    0,
                    bh,
                    "0xt",
                    "0xsig",
                    json!({"fork": "canonical"}),
                )
                .await
            );
        }

        let g = h.read().await;
        assert_eq!(g.events.len(), 4, "stable 8 + three replayed blocks");
        assert_eq!(g.last_block, 12);
        assert_eq!(g.last_log_index, 0);
        assert_eq!(g.last_block_hash, "0xnew12");

        for bn in [10_u64, 11, 12] {
            let ev = g
                .events
                .iter()
                .find(|e| e.block_number == bn)
                .unwrap_or_else(|| panic!("missing block {bn}"));
            assert_eq!(ev.data, json!({"fork": "canonical"}));
            assert!(
                ev.block_hash.starts_with("0xnew"),
                "block_hash={}",
                ev.block_hash
            );
        }
        let stable = g.events.iter().find(|e| e.block_number == 8).expect("stable 8");
        assert_eq!(stable.data, json!({"stable": true}));

        let mut keys = std::collections::HashSet::new();
        for e in &g.events {
            assert!(keys.insert((e.chain_id, e.block_number, e.log_index)));
        }
    }

    /// **B-114-4**：多区块重放后，同 **`(chain_id, block, log_index)`** 再写入须判重复，避免双份（等价「DB 仅一条新链记录」之幂等键）。
    #[tokio::test]
    async fn b114_4_reorg_multi_block_replay_duplicate_append_is_rejected() {
        let h = new_indexer_state();
        let cid = 99_u64;
        append_event_and_advance_checkpoint(&h, cid, 10, 0, "0xo10", "0xt", "s", json!({})).await;
        append_event_and_advance_checkpoint(&h, cid, 11, 0, "0xo11", "0xt", "s", json!({})).await;
        rewind_indexer_memory_state_after_reorg(&h, 10).await;
        append_event_and_advance_checkpoint(&h, cid, 10, 0, "0xn10", "0xt", "s", json!({})).await;
        append_event_and_advance_checkpoint(&h, cid, 11, 0, "0xn11", "0xt", "s", json!({})).await;
        assert!(
            !append_event_and_advance_checkpoint(
                &h,
                cid,
                11,
                0,
                "0xn11",
                "0xt_other",
                "s",
                json!({"would_dup": true}),
            )
            .await
        );
        let g = h.read().await;
        assert_eq!(g.events.len(), 2);
        assert!(!g.events.iter().any(|e| e.data.get("would_dup").is_some()));
    }

    /// **B-114-5**：**`indexer_tick_scan_from_block_lower_bound`** 与 reorg **`rewind(10)`** 后内存尾一致 → 起扫 **10**（模拟 tick **`continue`** 后首算）。
    #[tokio::test]
    async fn b114_5_reorg_tick_scan_from_block_matches_memory_after_rewind() {
        let h = new_indexer_state();
        let cid = 1_u64;
        append_event_and_advance_checkpoint(&h, cid, 9, 0, "0xb9", "0xt", "s", json!({})).await;
        append_event_and_advance_checkpoint(&h, cid, 10, 0, "0xbad", "0xt", "s", json!({})).await;
        rewind_indexer_memory_state_after_reorg(&h, 10).await;
        let g = h.read().await;
        assert_eq!(super::indexer_tick_scan_from_block_lower_bound(&g), 10);
        assert_eq!(g.last_block, 9);
    }

    /// **B-114-5**：多块重放完成后，起扫下界为 **`last_block + 1`**（与 **B-114-4** 场景衔接）。
    #[tokio::test]
    async fn b114_5_reorg_tick_scan_from_block_after_multi_block_replay() {
        let h = new_indexer_state();
        let cid = 137_u64;
        append_event_and_advance_checkpoint(&h, cid, 8, 0, "0xb8", "0xt", "k", json!({})).await;
        for (bn, bh) in [(10_u64, "0xo10"), (11, "0xo11"), (12, "0xo12")] {
            append_event_and_advance_checkpoint(&h, cid, bn, 0, bh, "0xt", "k", json!({})).await;
        }
        rewind_indexer_memory_state_after_reorg(&h, 10).await;
        for (bn, bh) in [(10_u64, "0xn10"), (11, "0xn11"), (12, "0xn12")] {
            append_event_and_advance_checkpoint(&h, cid, bn, 0, bh, "0xt", "k", json!({})).await;
        }
        let g = h.read().await;
        assert_eq!(g.last_block, 12);
        assert_eq!(super::indexer_tick_scan_from_block_lower_bound(&g), 13);
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

    #[test]
    fn staking_event_topic0s_keccak() {
        use sha3::{Digest, Keccak256};
        let want = [
            STAKED_TOPIC0,
            WITHDRAWN_TOPIC0,
            SLASHED_TOPIC0,
        ];
        let sigs = [
            "Staked(address,uint256)",
            "Withdrawn(address,uint256)",
            "Slashed(address,uint256)",
        ];
        for (sig, w) in sigs.iter().zip(want.iter()) {
            let h = Keccak256::digest(sig.as_bytes());
            let got = format!("0x{}", hex::encode(h));
            assert_eq!(&got, *w, "sig={sig}");
        }
    }

    #[test]
    fn lock_ledger_event_topic0s_keccak() {
        use sha3::{Digest, Keccak256};
        let want = [LOCKED_TOPIC0, UNLOCKED_TOPIC0];
        let sigs = [
            "Locked(address,uint256)",
            "Unlocked(address,uint256)",
        ];
        for (sig, w) in sigs.iter().zip(want.iter()) {
            let h = Keccak256::digest(sig.as_bytes());
            let got = format!("0x{}", hex::encode(h));
            assert_eq!(&got, *w, "sig={sig}");
        }
    }

    fn u256_word(v: u64) -> [u8; 32] {
        let mut o = [0u8; 32];
        o[24..32].copy_from_slice(&v.to_be_bytes());
        o
    }

    #[test]
    fn region_share_snapshot_line_topic0_keccak_stable() {
        use sha3::{Digest, Keccak256};
        let h = Keccak256::digest(REGION_SHARE_SNAPSHOT_LINE_EVENT_SIGNATURE);
        assert_eq!(region_share_snapshot_line_topic0_hex(), format!("0x{}", hex::encode(h)));
    }

    #[test]
    fn parse_region_share_snapshot_line_fixture_cn() {
        let topic0 = region_share_snapshot_line_topic0_hex();
        let epoch_topic = format!("0x{}", hex::encode(u256_word(42)));
        let recipient = "0xdddddddddddddddddddddddddddddddddddddddd";
        let mut rt = [0u8; 32];
        rt[12..32].copy_from_slice(&hex::decode(recipient.trim_start_matches("0x")).unwrap());
        let recipient_topic = format!("0x{}", hex::encode(rt));
        let mut data = Vec::new();
        data.extend_from_slice(&u256_word(96));
        data.extend_from_slice(&u256_word(12));
        data.extend_from_slice(&u256_word(1));
        data.extend_from_slice(&u256_word(2));
        let mut cn = vec![0x43u8, 0x4eu8];
        cn.resize(32, 0u8);
        data.extend_from_slice(&cn);
        let data_hex = format!("0x{}", hex::encode(&data));
        let topics = vec![topic0, epoch_topic, recipient_topic];
        let parsed = parse_region_share_snapshot_line(&topics, &serde_json::json!(data_hex))
            .expect("parse");
        assert_eq!(parsed.0, 42);
        assert_eq!(parsed.1, "CN");
        assert_eq!(parsed.2.to_ascii_lowercase(), recipient.to_ascii_lowercase());
        assert_eq!(parsed.3, 12);
        assert_eq!(
            parsed.4,
            "0x0000000000000000000000000000000000000000000000000000000000000001"
        );
    }

    #[test]
    fn b127_finality_gate_blocks_funds_terminal_projection_when_block_not_finalized() {
        let n = 12u64;
        let tip = 105u64;
        let block = 100u64;
        assert!(
            !super::allow_orders_projection_funds_terminal_write("Released", block, tip, n),
            "Released at {block} with tip {tip} and FINALITY_N={n} must not write terminal projection"
        );
        assert!(
            super::allow_orders_projection_funds_terminal_write("EscrowCreated", block, tip, n),
            "non-terminal escrow events are not gated"
        );
    }

    #[test]
    fn b127_finality_gate_allows_funds_terminal_projection_when_finalized() {
        let n = 12u64;
        let tip = 115u64;
        let block = 100u64;
        assert!(super::allow_orders_projection_funds_terminal_write(
            "Released", block, tip, n
        ));
        assert!(super::allow_orders_projection_funds_terminal_write(
            "Paid", block, tip, n
        ));
    }
}
