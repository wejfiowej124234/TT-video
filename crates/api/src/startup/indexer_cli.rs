//! `--indexer-replay-finality-change` / `--indexer-validate-jsonl` / `--indexer-ingest-jsonl` 早退分支（48 自 `run.rs` 拆出）。

use std::path::{Path, PathBuf};

use chrono::Utc;
use serde_json::json;

use super::ingest::{
    apply_finality_change_replay_plan, ingest_events_from_jsonl, persist_indexer_state,
    validate_events_jsonl, IndexerState,
};

/// 若命中 indexer 子命令并已处理完毕，返回 `Ok(true)`（调用方应 `return Ok(())`）；否则 `Ok(false)` 继续正常启动。
pub(crate) fn try_handle_indexer_cli_commands(
    args: &[String],
    indexer_state_path: &Path,
    indexer_state_path_display: &str,
    finality_n: u64,
    indexer_state: &mut IndexerState,
) -> Result<bool, Box<dyn std::error::Error + Send + Sync>> {
    if args.iter().any(|a| a == "--indexer-replay-finality-change") {
        let plan = apply_finality_change_replay_plan(indexer_state, finality_n);
        persist_indexer_state(indexer_state_path, indexer_state)?;
        let _ = super::append_jsonl_value(
            Path::new("data/indexer_audit.jsonl"),
            json!({
                "ts": Utc::now().to_rfc3339(),
                "action": "replay_plan_applied",
                "finality_n_used": finality_n,
                "indexer_state_path": indexer_state_path_display.to_string(),
                "checkpoint": {
                    "block_number": indexer_state.checkpoint.block_number,
                    "log_index": indexer_state.checkpoint.log_index,
                },
                "plan": plan,
            }),
        );
        println!(
            "indexer_replay_plan: {}",
            serde_json::to_string(&plan).unwrap_or_else(|_| "{}".to_string())
        );
        return Ok(true);
    }
    if let Some(pos) = args.iter().position(|a| a == "--indexer-validate-jsonl") {
        let Some(input) = args.get(pos + 1) else {
            return Err("--indexer-validate-jsonl requires a file path".into());
        };        let input_path = PathBuf::from(input);
        let report = validate_events_jsonl(&input_path)?;
        println!(
            "indexer_validate: total_lines={} parsed_events={} unique_in_file={} dup_in_file={} input={}",
            report.total_lines,
            report.parsed_events,
            report.unique_in_file,
            report.duplicates_in_file,
            input_path.to_string_lossy(),
        );
        return Ok(true);
    }
    if let Some(pos) = args.iter().position(|a| a == "--indexer-ingest-jsonl") {
        let Some(input) = args.get(pos + 1) else {
            return Err("--indexer-ingest-jsonl requires a file path".into());
        };        let input_path = PathBuf::from(input);
        let seen_keys_path = std::env::var("INDEXER_SEEN_KEYS_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("data/indexer_seen_keys.json"));
        let events_log_path = std::env::var("INDEXER_EVENTS_LOG_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("data/indexer_events.jsonl"));
        let audit_log_path = std::env::var("INDEXER_AUDIT_LOG_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("data/indexer_audit.jsonl"));

        let ingest = ingest_events_from_jsonl(
            &input_path,
            &seen_keys_path,
            &events_log_path,
            &audit_log_path,
            indexer_state,
            finality_n,
        )?;
        persist_indexer_state(indexer_state_path, indexer_state)?;
        println!(
            "indexer_ingest: applied={} duplicates={} input={} checkpoint={}:{}",
            ingest.applied,
            ingest.duplicates,
            input_path.to_string_lossy(),
            indexer_state.checkpoint.block_number,
            indexer_state.checkpoint.log_index
        );
        return Ok(true);
    }

    Ok(false)
}
