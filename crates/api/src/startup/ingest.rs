//! Indexer state、JSONL 校验与 ingest、finality 回放（48 优化：自 startup 拆出以控制 mod 行数）

use std::collections::{BTreeSet, HashMap};
use std::fs;
use std::path::Path;

use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::ssot;
use crate::state::ProjectorCheckpoint;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct IndexerState {
    /// “写死”：checkpoint 必须包含 logIndex（否则同 tx 多 log / 重复事件 / reorg 重建会失败）
    pub checkpoint: ProjectorCheckpoint,
    /// 用于检测 finalityN 变更并强制回放
    pub last_seen_finality_n: u64,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct ChainEventIn {
    chain_id: u64,
    tx_hash: String,
    block_hash: String,
    block_number: u64,
    log_index: u32,
    kind: String,
    #[serde(default)]
    data: serde_json::Value,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct SeenKeysState {
    keys: Vec<String>,
}

fn normalize_hex(s: &str) -> String {
    s.trim().trim_start_matches("0x").to_ascii_lowercase()
}

fn event_dedupe_key(e: &ChainEventIn) -> String {
    format!(
        "{}:{}:{}:{}",
        e.chain_id,
        normalize_hex(&e.tx_hash),
        normalize_hex(&e.block_hash),
        e.log_index
    )
}

fn load_seen_keys(path: &Path) -> BTreeSet<String> {
    if let Ok(bytes) = fs::read(path) {
        if let Ok(s) = serde_json::from_slice::<SeenKeysState>(&bytes) {
            return s.keys.into_iter().collect();
        }
    }
    BTreeSet::new()
}

fn persist_seen_keys(path: &Path, keys: &BTreeSet<String>) -> Result<(), String> {
    let body = SeenKeysState {
        keys: keys.iter().cloned().collect(),
    };
    let bytes = serde_json::to_vec_pretty(&body).map_err(|e| e.to_string())?;
    ssot::write_bytes_atomic(path, &bytes)?;
    Ok(())
}

#[derive(Clone, Debug)]
pub struct IndexerIngestReport {
    pub applied: u64,
    pub duplicates: u64,
}

#[derive(Clone, Debug)]
pub struct IndexerValidateReport {
    pub total_lines: u64,
    pub parsed_events: u64,
    pub unique_in_file: u64,
    pub duplicates_in_file: u64,
}

fn is_hex_like(s: &str) -> bool {
    let t = s.trim();
    let t = t.strip_prefix("0x").unwrap_or(t);
    !t.is_empty() && t.chars().all(|c| c.is_ascii_hexdigit())
}

/// Validate a JSONL file of chain events; returns counts including in-file duplicates.
pub fn validate_events_jsonl(input_path: &Path) -> Result<IndexerValidateReport, String> {
    let txt = fs::read_to_string(input_path)
        .map_err(|e| format!("read {}: {}", input_path.display(), e))?;

    let mut total_lines = 0u64;
    let mut parsed_events = 0u64;
    let mut counts: HashMap<String, u64> = HashMap::new();

    for (i, line) in txt.lines().enumerate() {
        total_lines += 1;
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let e: ChainEventIn = serde_json::from_str(line)
            .map_err(|err| format!("parse jsonl line {}: {}", i + 1, err))?;

        if e.kind.trim().is_empty() {
            return Err(format!("invalid jsonl line {}: kind is empty", i + 1));
        }
        if !is_hex_like(&e.tx_hash) {
            return Err(format!(
                "invalid jsonl line {}: tx_hash not hex-like",
                i + 1
            ));
        }
        if !is_hex_like(&e.block_hash) {
            return Err(format!(
                "invalid jsonl line {}: block_hash not hex-like",
                i + 1
            ));
        }

        let k = event_dedupe_key(&e);
        *counts.entry(k).or_insert(0) += 1;
        parsed_events += 1;
    }

    let unique_in_file = counts.len() as u64;
    let duplicates_in_file: u64 = counts.values().map(|c| c.saturating_sub(1)).sum();

    Ok(IndexerValidateReport {
        total_lines,
        parsed_events,
        unique_in_file,
        duplicates_in_file,
    })
}

/// Ingest events from a JSONL file: dedupe, advance checkpoint, persist state.
pub fn ingest_events_from_jsonl(
    input_path: &Path,
    seen_keys_path: &Path,
    indexer_events_log: &Path,
    indexer_audit_log: &Path,
    indexer_state: &mut IndexerState,
    finality_n_used: u64,
) -> Result<IndexerIngestReport, String> {
    let txt = fs::read_to_string(input_path)
        .map_err(|e| format!("read {}: {}", input_path.display(), e))?;

    let mut events: Vec<ChainEventIn> = Vec::new();
    for (i, line) in txt.lines().enumerate() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let e: ChainEventIn = serde_json::from_str(line)
            .map_err(|err| format!("parse jsonl line {}: {}", i + 1, err))?;
        events.push(e);
    }
    events.sort_by(|a, b| (a.block_number, a.log_index).cmp(&(b.block_number, b.log_index)));

    let mut seen = load_seen_keys(seen_keys_path);
    let mut applied = 0u64;
    let mut duplicates = 0u64;

    for e in events {
        let key = event_dedupe_key(&e);
        if seen.contains(&key) {
            duplicates += 1;
            let _ = super::append_jsonl_value(
                indexer_audit_log,
                json!({
                    "ts": Utc::now().to_rfc3339(),
                    "action": "event_skipped_duplicate",
                    "finality_n_used": finality_n_used,
                    "dedupe_key": key,
                    "event": {
                        "chain_id": e.chain_id,
                        "tx_hash": e.tx_hash,
                        "block_hash": e.block_hash,
                        "block_number": e.block_number,
                        "log_index": e.log_index,
                        "kind": e.kind,
                    },
                    "checkpoint": {
                        "block_number": indexer_state.checkpoint.block_number,
                        "log_index": indexer_state.checkpoint.log_index,
                    },
                }),
            );
            continue;
        }

        let cp = &indexer_state.checkpoint;
        if (e.block_number, e.log_index) <= (cp.block_number, cp.log_index) {
            let _ = super::append_jsonl_value(
                indexer_audit_log,
                json!({
                    "ts": Utc::now().to_rfc3339(),
                    "action": "event_rejected_before_checkpoint",
                    "finality_n_used": finality_n_used,
                    "dedupe_key": key,
                    "event": {
                        "chain_id": e.chain_id,
                        "tx_hash": e.tx_hash,
                        "block_hash": e.block_hash,
                        "block_number": e.block_number,
                        "log_index": e.log_index,
                        "kind": e.kind,
                    },
                    "checkpoint": {
                        "block_number": cp.block_number,
                        "log_index": cp.log_index,
                    },
                    "rule": "non-duplicate event must be strictly after checkpoint; rewind requires replay plan",
                }),
            );
            return Err(format!(
                "event at/before checkpoint (event={}:{} checkpoint={}:{}). Run --indexer-replay-finality-change (or reset state) before ingest.",
                e.block_number,
                e.log_index,
                cp.block_number,
                cp.log_index
            ));
        }

        let checkpoint_before = indexer_state.checkpoint.clone();

        let _ = super::append_jsonl_value(
            indexer_events_log,
            json!({
                "ts": Utc::now().to_rfc3339(),
                "event": e,
                "dedupe_key": key,
            }),
        );

        indexer_state.checkpoint.block_number = e.block_number;
        indexer_state.checkpoint.log_index = e.log_index;

        let _ = super::append_jsonl_value(
            indexer_audit_log,
            json!({
                "ts": Utc::now().to_rfc3339(),
                "action": "event_applied",
                "finality_n_used": finality_n_used,
                "dedupe_key": key,
                "checkpoint_before": {
                    "block_number": checkpoint_before.block_number,
                    "log_index": checkpoint_before.log_index,
                },
                "checkpoint_after": {
                    "block_number": indexer_state.checkpoint.block_number,
                    "log_index": indexer_state.checkpoint.log_index,
                },
            }),
        );

        seen.insert(key);
        applied += 1;
    }

    persist_seen_keys(seen_keys_path, &seen)?;
    Ok(IndexerIngestReport {
        applied,
        duplicates,
    })
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct FinalityReplayPlan {
    pub old_finality_n: u64,
    pub new_finality_n: u64,
    pub rewind_blocks: u64,
    pub old_checkpoint: ProjectorCheckpoint,
    pub new_checkpoint: ProjectorCheckpoint,
    pub rule: String,
}

pub fn load_or_init_indexer_state(path: &Path, finality_n: u64) -> IndexerState {
    if let Ok(bytes) = fs::read(path) {
        if let Ok(s) = serde_json::from_slice::<IndexerState>(&bytes) {
            return s;
        }
    }
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    IndexerState {
        checkpoint: ProjectorCheckpoint {
            block_number: 0,
            log_index: 0,
        },
        last_seen_finality_n: finality_n,
    }
}

pub fn persist_indexer_state(
    path: &Path,
    state: &IndexerState,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let bytes = serde_json::to_vec_pretty(state)?;
    ssot::write_bytes_atomic(path, &bytes)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    Ok(())
}

pub fn apply_finality_change_replay_plan(
    state: &mut IndexerState,
    new_finality_n: u64,
) -> FinalityReplayPlan {
    let old = state.last_seen_finality_n;
    let rewind_blocks = std::cmp::max(old, new_finality_n).saturating_add(2);
    let old_cp = state.checkpoint.clone();
    let new_block = old_cp.block_number.saturating_sub(rewind_blocks);
    let new_cp = ProjectorCheckpoint {
        block_number: new_block,
        log_index: 0,
    };
    state.checkpoint = new_cp.clone();
    state.last_seen_finality_n = new_finality_n;
    FinalityReplayPlan {
        old_finality_n: old,
        new_finality_n,
        rewind_blocks,
        old_checkpoint: old_cp,
        new_checkpoint: new_cp,
        rule: "finalityN 变更 => 必须回放：checkpoint 回退 max(old,new)+2 blocks，并从 logIndex=0 重新消费；否则投影可能错乱/漏账".to_string(),
    }
}
