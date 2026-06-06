//! 启动时 indexer 审计 **JSONL** 行 + **`finalityN`** 变更告警 / **`STRICT_INDEXER_REPLAY`** 退出（自 **`run.rs`** 抽出）。

use std::path::Path;

use chrono::Utc;
use serde_json::json;

use super::ingest::IndexerState;

/// 与原先 **`run.rs`** 一致：写 **`data/indexer_audit.jsonl`**；**`replay_required`** 且 **`STRICT_INDEXER_REPLAY=1`** 时 **`process::exit(1)`**。
pub(crate) fn indexer_startup_audit_jsonl_and_replay_gate(
    indexer_state_path_display: &str,
    finality_n: u64,
    indexer_state: &IndexerState,
    replay_required: bool,
    strict_indexer_replay: bool,
) {
    let _ = super::append_jsonl_value(
        Path::new("data/indexer_audit.jsonl"),
        json!({
            "ts": Utc::now().to_rfc3339(),
            "action": "startup",
            "finality_n_used": finality_n,
            "indexer_state_path": indexer_state_path_display,
            "checkpoint": {
                "block_number": indexer_state.checkpoint.block_number,
                "log_index": indexer_state.checkpoint.log_index,
            },
            "last_seen_finality_n": indexer_state.last_seen_finality_n,
            "replay_required": replay_required,
            "strict_indexer_replay": strict_indexer_replay,
            "rule": "每次事件消费必须可回放：checkpoint=(block,logIndex) + finalityNUsed 需可审计",
        }),
    );
    if replay_required {
        let msg = format!(
            "finalityN 变更检测到：state.last_seen_finality_n={} current.FINALITY_N={}。必须先执行回放/重放前置动作：traveltrust-api --indexer-replay-finality-change（写死：checkpoint 必含 logIndex；finalityN 改一次必须回放一次）",
            indexer_state.last_seen_finality_n, finality_n
        );
        if strict_indexer_replay {
            eprintln!("STRICT_INDEXER_REPLAY=1: {}", msg);
            std::process::exit(1);
        }
        eprintln!("WARN: {}", msg);
    }
}
