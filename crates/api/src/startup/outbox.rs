//! Outbox worker：重试策略、告警、process_outbox_item、outbox_worker_loop（48 优化：自 startup 拆出）

use std::path::{Path, PathBuf};
use std::time::Duration;

use chrono::Utc;
use serde_json::json;
use traveltrust_core::{FileOutbox, OutboxItem};

fn outbox_retry_delay_secs(kind: &str, attempts: u32) -> i64 {
    let n = attempts as usize;
    match kind {
        "dispute.execute_resolution" => {
            let schedule = [10i64, 30, 120, 300, 900, 1800, 3600];
            schedule[std::cmp::min(n, schedule.len() - 1)]
        }
        _ => (attempts as i64 + 1).clamp(1, 30),
    }
}

fn write_outbox_alert(
    alert_dir: &PathBuf,
    item: &OutboxItem,
    err: &str,
    attempts: u32,
) -> Result<(), String> {
    let _ = std::fs::create_dir_all(alert_dir);
    let path = alert_dir.join(format!("outbox_dead_{}.json", item.id));
    let body = json!({
        "ts": Utc::now().to_rfc3339(),
        "type": "outbox_dead_letter",
        "attempts": attempts,
        "error": err,
        "outbox": item,
        "rule": "达到最大重试次数后必须产生可追踪工单/告警工件；禁止离线手工推进资金与状态",
    });
    let bytes = serde_json::to_vec_pretty(&body).map_err(|e| e.to_string())?;
    std::fs::write(&path, bytes).map_err(|e| e.to_string())?;
    Ok(())
}

fn process_outbox_item(item: &OutboxItem) -> Result<(), String> {
    match item.kind.as_str() {
        "evidence_receipt.created" => {
            let line = serde_json::to_string(item).map_err(|e| e.to_string())? + "\n";
            let path = PathBuf::from("data/outbox_processed.log");
            if let Some(parent) = path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            let mut f = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(path)
                .map_err(|e| e.to_string())?;
            use std::io::Write;
            f.write_all(line.as_bytes()).map_err(|e| e.to_string())?;
            Ok(())
        }
        "order.confirm_completion_intent" | "order.open_dispute_intent" => {
            let line = serde_json::to_string(item).map_err(|e| e.to_string())? + "\n";
            let path = PathBuf::from("data/outbox_processed.log");
            if let Some(parent) = path.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            let mut f = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(path)
                .map_err(|e| e.to_string())?;
            use std::io::Write;
            f.write_all(line.as_bytes()).map_err(|e| e.to_string())?;
            Ok(())
        }
        "dispute.execute_resolution" => Err("executor_not_configured".to_string()),
        other => Err(format!("unknown outbox kind: {}", other)),
    }
}

pub async fn outbox_worker_loop(
    outbox_dir: String,
    lease_secs: i64,
    poll_ms: u64,
    max_attempts: u32,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let outbox = FileOutbox::new(outbox_dir);

    match outbox.recover_stuck(lease_secs) {
        Ok(n) if n > 0 => eprintln!("outbox_worker: recovered {} stuck items", n),
        Ok(_) => {}
        Err(e) => eprintln!("outbox_worker: recover_stuck failed: {}", e),
    }

    loop {
        if let Ok(n) = outbox.recover_stuck(lease_secs) {
            if n > 0 {
                eprintln!("outbox_worker: recovered {} stuck items", n);
            }
        }

        match outbox.claim_next(lease_secs) {
            Ok(Some(claim)) => {
                let item = claim.item;
                let attempts = item.attempts;
                let kind = item.kind.clone();
                let outbox_item_id = item.id;

                let processed = process_outbox_item(&item);
                match processed {
                    Ok(()) => {
                        let _ = outbox.mark_done(item);
                        let _ = super::append_jsonl_value(
                            Path::new("data/outbox_events.jsonl"),
                            json!({
                                "ts": Utc::now().to_rfc3339(),
                                "action": "done",
                                "kind": kind.clone(),
                                "outbox_item_id": outbox_item_id,
                                "attempts": attempts,
                            }),
                        );
                    }
                    Err(err) => {
                        if attempts + 1 >= max_attempts {
                            let err_clone = err.clone();
                            let _ = write_outbox_alert(
                                &PathBuf::from("data/alerts"),
                                &item,
                                &err,
                                attempts + 1,
                            );
                            let _ = outbox.dead_letter(item, Some(err_clone));
                            let _ = super::append_jsonl_value(
                                Path::new("data/outbox_events.jsonl"),
                                json!({
                                    "ts": Utc::now().to_rfc3339(),
                                    "action": "dead_letter",
                                    "kind": kind.clone(),
                                    "outbox_item_id": outbox_item_id,
                                    "attempts": attempts + 1,
                                    "error": err,
                                }),
                            );
                        } else {
                            let delay = outbox_retry_delay_secs(&kind, attempts);
                            let _ = outbox.reschedule(item, delay, Some(err));
                            let _ = super::append_jsonl_value(
                                Path::new("data/outbox_events.jsonl"),
                                json!({
                                    "ts": Utc::now().to_rfc3339(),
                                    "action": "reschedule",
                                    "kind": kind.clone(),
                                    "outbox_item_id": outbox_item_id,
                                    "attempts": attempts + 1,
                                    "delay_secs": delay,
                                }),
                            );
                        }
                    }
                }

                eprintln!("outbox_worker: handled kind={}", kind);
            }
            Ok(None) => {
                tokio::time::sleep(Duration::from_millis(poll_ms)).await;
            }
            Err(e) => {
                eprintln!("outbox_worker: claim_next error: {}", e);
                tokio::time::sleep(Duration::from_millis(poll_ms)).await;
            }
        }
    }
}
