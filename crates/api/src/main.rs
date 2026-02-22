//! TravelTrust API 入口：Axum + CORS，路由与 04 §三 对齐
//!
//! SSOT：Backend 启动时从 env SSOT_VERSION 读取；STRICT_SSOT=1 时未设置则拒绝启动。见 08-5 §4、Runbook §10、04 §四。
//! traceId：响应头 x-request-id 由请求头带入或自动生成，与 01 §9 贯通 requestId→txHash→logIndex 一致。
//! 路由：/health、/api/v1/guides 为占位实现；其余为 501 占位，实现时按 04 §三 与 01 §10 17 条（幂等、traceId）补齐。
//! 幂等：请求头 Idempotency-Key / X-Idempotency-Key 在中间件透传并回写；对 POST/PUT 做 key 去重与结果复用（01 §10 #14），缓存键=method+path+key，最多 1000 条。
//! 环境变量：PORT（默认 3000）、CORS_ORIGINS（逗号分隔的允许 origin，未设则开发态允许任意；生产应设置）。

use axum::{
    body::Body,
    extract::Path,
    http::{header::HeaderName, header::HeaderValue, HeaderMap, Method, Request, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    routing::{get, post, put},
    Json, Router,
};
use bytes::Bytes;
use chrono::{DateTime, Utc};
use hmac::{Hmac, Mac};
use http_body_util::BodyExt;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sha2::Digest;
use std::collections::{BTreeSet, HashMap};
use std::env;
use std::fs;
use std::io::Write;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use tower_http::cors::{AllowOrigin, Any, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::timeout::TimeoutLayer;
use traveltrust_core::{FileOutbox, OutboxItem};

const IDEMPOTENCY_CACHE_MAX: usize = 1000;
const REQUEST_TIMEOUT_SECS: u64 = 30;
const REQUEST_BODY_LIMIT_BYTES: usize = 1024 * 1024;

const DEFAULT_FINALITY_N: u64 = 12;

type HmacSha256 = Hmac<sha2::Sha256>;

fn compute_file_sha256_hex(path: &std::path::Path) -> Result<String, String> {
    let bytes = fs::read(path).map_err(|e| e.to_string())?;
    let digest = sha2::Sha256::digest(bytes);
    Ok(hex_lower(&digest))
}

fn hex_lower(bytes: &[u8]) -> String {
    let mut out = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        out.push_str(&format!("{:02x}", b));
    }
    out
}

#[derive(Serialize)]
struct SsotRuntimeMismatch {
    key: String,
    expected: String,
    actual: String,
}

#[derive(Serialize)]
struct SsotRuntimeChange {
    key: String,
    before: Option<String>,
    after: Option<String>,
}

#[derive(Serialize)]
struct SsotRuntimeAuditEntry {
    ts_utc: DateTime<Utc>,
    ok: bool,
    strict: bool,
    source: String,
    actor: Option<String>,
    approver: Option<String>,
    workitem_id: Option<String>,
    reason: Option<String>,
    ssot_version: String,
    ssot_doc_path: String,
    ssot_sha256: Option<String>,
    runtime_snapshot_path: String,
    last_snapshot_path: String,
    missing_keys: Vec<String>,
    mismatches: Vec<SsotRuntimeMismatch>,
    changes_since_last: Vec<SsotRuntimeChange>,
}

fn normalize_for_compare(s: &str) -> String {
    let trimmed = s.trim();
    let mut out = String::with_capacity(trimmed.len());
    let mut prev_space = false;
    for ch in trimmed.chars() {
        let is_space = ch.is_whitespace();
        if is_space {
            if !prev_space {
                out.push(' ');
            }
        } else {
            out.push(ch);
        }
        prev_space = is_space;
    }
    // normalize spaces around commas
    out = out.replace(" ,", ",").replace(", ", ",");
    out
}

fn ssot_strip_markdown_cell(s: &str) -> String {
    s.trim()
        .trim_matches('|')
        .trim()
        .replace("**", "")
        .replace('`', "")
        .trim()
        .to_string()
}

fn extract_ssot_section<'a>(content: &'a str, heading: &str) -> Option<&'a str> {
    let start = content.find(heading)?;
    let rest = &content[start + heading.len()..];
    let mut end_idx = rest.len();
    for marker in ["\n## ", "\n---\n"] {
        if let Some(i) = rest.find(marker) {
            end_idx = end_idx.min(i);
        }
    }
    Some(&rest[..end_idx])
}

fn parse_ssot_mapping_keys(ssot_md: &str) -> Vec<String> {
    let section = match extract_ssot_section(ssot_md, "## 关键 key 与 08-4 章节映射") {
        Some(s) => s,
        None => return vec![],
    };

    let mut keys: Vec<String> = Vec::new();
    for line in section.lines() {
        let line = line.trim();
        if !line.starts_with('|') {
            continue;
        }
        if line.contains("| param_key ") {
            continue;
        }
        if line.starts_with("|---") {
            continue;
        }
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() < 3 {
            continue;
        }
        // parts[0] and parts[last] are empty due to leading/trailing |
        let cell = ssot_strip_markdown_cell(parts[1]);
        if cell.is_empty() || cell.starts_with('(') {
            continue;
        }
        for raw in cell
            .replace('，', " , ")
            .replace('、', " , ")
            .split(',')
        {
            let k = raw.trim();
            if !k.is_empty() {
                keys.push(k.to_string());
            }
        }
    }
    keys.sort();
    keys.dedup();
    keys
}

fn parse_ssot_26_key_values(ssot_md: &str) -> HashMap<String, String> {
    let section = match extract_ssot_section(ssot_md, "## 建议优先入 SSOT 的 26 个 key") {
        Some(s) => s,
        None => return HashMap::new(),
    };

    let mut map: HashMap<String, String> = HashMap::new();
    for line in section.lines() {
        let line = line.trim();
        if !line.starts_with('|') {
            continue;
        }
        if line.contains("| param_key ") {
            continue;
        }
        if line.starts_with("|---") {
            continue;
        }

        let parts: Vec<&str> = line.split('|').collect();
        // Expect: | key | desc | scope | value | ... |
        if parts.len() < 6 {
            continue;
        }
        let key = ssot_strip_markdown_cell(parts[1]);
        let value = ssot_strip_markdown_cell(parts[4]);
        if key.is_empty() {
            continue;
        }
        map.insert(key, value);
    }
    map
}

fn json_value_to_string(v: &serde_json::Value) -> String {
    match v {
        serde_json::Value::Null => "null".to_string(),
        serde_json::Value::Bool(b) => b.to_string(),
        serde_json::Value::Number(n) => n.to_string(),
        serde_json::Value::String(s) => s.to_string(),
        serde_json::Value::Array(arr) => arr.iter().map(json_value_to_string).collect::<Vec<_>>().join(","),
        serde_json::Value::Object(_) => v.to_string(),
    }
}

fn load_json_object(path: &std::path::Path) -> Result<HashMap<String, serde_json::Value>, String> {
    let bytes = fs::read(path).map_err(|e| format!("read {}: {}", path.display(), e))?;
    let v: serde_json::Value = serde_json::from_slice(&bytes)
        .map_err(|e| format!("parse json {}: {}", path.display(), e))?;
    let obj = v
        .as_object()
        .ok_or_else(|| format!("json must be an object: {}", path.display()))?;
    Ok(obj.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
}

fn append_jsonl(path: &std::path::Path, line: &str) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("mkdir {}: {}", parent.display(), e))?;
    }
    let mut f = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
        .map_err(|e| format!("open {}: {}", path.display(), e))?;
    f.write_all(line.as_bytes())
        .and_then(|_| f.write_all(b"\n"))
        .map_err(|e| format!("write {}: {}", path.display(), e))?;
    Ok(())
}

fn write_bytes_atomic(path: &std::path::Path, bytes: &[u8]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("mkdir {}: {}", parent.display(), e))?;
    }

    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, bytes).map_err(|e| format!("write {}: {}", tmp.display(), e))?;

    // On Windows, fs::rename fails if destination exists. Implement a safe replace:
    // 1) move existing -> .bak (best-effort)
    // 2) move tmp -> dest
    // 3) cleanup .bak
    let bak = path.with_extension("json.bak");

    if path.exists() {
        let _ = fs::remove_file(&bak);
        if let Err(e) = fs::rename(path, &bak) {
            // If we can't move the old file away, avoid clobbering.
            let _ = fs::remove_file(&tmp);
            return Err(format!(
                "cannot prepare replace (rename old {} -> {}): {}",
                path.display(),
                bak.display(),
                e
            ));
        }
    }

    if let Err(e) = fs::rename(&tmp, path) {
        // Try to rollback.
        let _ = fs::remove_file(path);
        let _ = fs::rename(&bak, path);
        let _ = fs::remove_file(&tmp);
        return Err(format!(
            "replace failed (rename {} -> {}): {}",
            tmp.display(),
            path.display(),
            e
        ));
    }

    let _ = fs::remove_file(&bak);
    Ok(())
}

fn run_ssot_runtime_check(strict: bool, ssot_version: &str) -> i32 {
    let ssot_doc_path = env::var("SSOT_DOC_PATH").unwrap_or_else(|_| "docs/08-3-参数与门禁表.md".to_string());
    let runtime_snapshot_path = env::var("RUNTIME_PARAM_SNAPSHOT_PATH").unwrap_or_else(|_| "data/runtime_params.json".to_string());
    let last_snapshot_path = env::var("SSOT_RUNTIME_LAST_SNAPSHOT_PATH").unwrap_or_else(|_| "data/runtime_params_last.json".to_string());
    let audit_log_path = env::var("SSOT_RUNTIME_AUDIT_LOG_PATH").unwrap_or_else(|_| "data/ssot_runtime_audit.jsonl".to_string());

    let source = env::var("SSOT_AUDIT_SOURCE").unwrap_or_else(|_| "periodic".to_string());
    let actor = env::var("SSOT_AUDIT_ACTOR").ok();
    let approver = env::var("SSOT_AUDIT_APPROVER").ok();
    let workitem_id = env::var("SSOT_AUDIT_WORKITEM_ID").ok();
    let reason = env::var("SSOT_AUDIT_REASON").ok();

    let ssot_doc_pathbuf = std::path::PathBuf::from(&ssot_doc_path);
    let runtime_snapshot_pathbuf = std::path::PathBuf::from(&runtime_snapshot_path);
    let last_snapshot_pathbuf = std::path::PathBuf::from(&last_snapshot_path);
    let audit_log_pathbuf = std::path::PathBuf::from(&audit_log_path);

    let ssot_md = match fs::read_to_string(&ssot_doc_pathbuf) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("FAIL: 读取 SSOT 文档失败: path={} err={}", ssot_doc_path, e);
            return 1;
        }
    };

    let mapping_keys = parse_ssot_mapping_keys(&ssot_md);
    if mapping_keys.is_empty() {
        eprintln!("FAIL: 无法从 08-3 提取映射 key 列表（标题或表格格式可能被破坏）：{}", ssot_doc_path);
        return 1;
    }
    let expected_values = parse_ssot_26_key_values(&ssot_md);

    let ssot_sha256 = compute_file_sha256_hex(&ssot_doc_pathbuf).ok();

    let runtime_obj = match load_json_object(&runtime_snapshot_pathbuf) {
        Ok(o) => o,
        Err(e) => {
            eprintln!("FAIL: 读取运行时参数快照失败: {}", e);
            return if strict { 3 } else { 0 };
        }
    };

    let prev_obj = load_json_object(&last_snapshot_pathbuf).ok();

    let mut missing_keys: Vec<String> = Vec::new();
    let mut mismatches: Vec<SsotRuntimeMismatch> = Vec::new();
    let mut changes_since_last: Vec<SsotRuntimeChange> = Vec::new();

    for key in &mapping_keys {
        let actual_v = runtime_obj.get(key);
        if actual_v.is_none() {
            missing_keys.push(key.clone());
            continue;
        }
        let actual = normalize_for_compare(&json_value_to_string(actual_v.unwrap()));
        let expected_raw = expected_values
            .get(key)
            .cloned()
            .unwrap_or_else(|| "<missing_in_08-3_value_table>".to_string());
        let expected = normalize_for_compare(&expected_raw);
        if expected != actual {
            mismatches.push(SsotRuntimeMismatch {
                key: key.clone(),
                expected: expected_raw,
                actual: json_value_to_string(actual_v.unwrap()),
            });
        }

        if let Some(prev) = prev_obj.as_ref().and_then(|o| o.get(key)) {
            let before = Some(json_value_to_string(prev));
            let after = actual_v.map(json_value_to_string);
            if before != after {
                changes_since_last.push(SsotRuntimeChange {
                    key: key.clone(),
                    before,
                    after,
                });
            }
        }
    }

    let ok = missing_keys.is_empty() && mismatches.is_empty();
    let entry = SsotRuntimeAuditEntry {
        ts_utc: Utc::now(),
        ok,
        strict,
        source,
        actor,
        approver,
        workitem_id,
        reason,
        ssot_version: ssot_version.to_string(),
        ssot_doc_path: ssot_doc_path.clone(),
        ssot_sha256,
        runtime_snapshot_path: runtime_snapshot_path.clone(),
        last_snapshot_path: last_snapshot_path.clone(),
        missing_keys,
        mismatches,
        changes_since_last,
    };

    // append audit log (jsonl)
    if let Ok(line) = serde_json::to_string(&entry) {
        if let Err(e) = append_jsonl(&audit_log_pathbuf, &line) {
            eprintln!("WARN: 写入 SSOT 运行时审计日志失败: {}", e);
        }
    }

    // Update last snapshot for next diff.
    if let Some(parent) = last_snapshot_pathbuf.parent() {
        let _ = fs::create_dir_all(parent);
    }
    if let Ok(bytes) = serde_json::to_vec_pretty(&serde_json::Value::Object(
        runtime_obj
            .iter()
            .map(|(k, v)| (k.clone(), v.clone()))
            .collect(),
    )) {
        let _ = fs::write(&last_snapshot_pathbuf, bytes);
    }

    if ok {
        println!("OK: SSOT runtime check passed (keys={} strict={})", mapping_keys.len(), strict);
        return 0;
    }

    eprintln!(
        "DRIFT: SSOT runtime check failed: missing_keys={} mismatches={} strict={} audit_log={}",
        entry.missing_keys.len(),
        entry.mismatches.len(),
        strict,
        audit_log_path
    );
    if strict {
        2
    } else {
        0
    }
}

fn main() {
    if let Err(e) = run() {
        eprintln!("TravelTrust API 启动失败: {}", e);
        std::process::exit(1);
    }
}

#[tokio::main]
async fn run() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // --- CLI 入口（用于“写死并实现”的运维动作） ---
    // 例：finalityN 变更后必须执行回放/重放前置动作，否则投影可能错乱/漏账。
    let args: Vec<String> = env::args().collect();

    let strict_ssot = env::var("STRICT_SSOT").as_deref() == Ok("1")
        || env::var("CHECK_SSOT").as_deref() == Ok("1");

    let ssot_version = env::var("SSOT_VERSION").unwrap_or_else(|_| "unset".to_string());
    if strict_ssot && ssot_version == "unset" {
        eprintln!("STRICT_SSOT/CHECK_SSOT=1: SSOT_VERSION 未设置，拒绝启动");
        std::process::exit(1);
    }

    // Strict SSOT hash verification (08-5 §4、Runbook §10)
    let ssot_sha256_expected = env::var("SSOT_SHA256").ok();
    let ssot_doc_path = std::path::PathBuf::from("docs/08-3-参数与门禁表.md");
    let (ssot_sha256_computed, ssot_sha256_match) = match compute_file_sha256_hex(&ssot_doc_path) {
        Ok(h) => {
            let matched = ssot_sha256_expected
                .as_deref()
                .is_some_and(|exp| exp.eq_ignore_ascii_case(&h));
            (Some(h), matched)
        }
        Err(e) => {
            eprintln!(
                "WARN: 计算 SSOT 文件 sha256 失败: file={} err={}",
                ssot_doc_path.to_string_lossy(),
                e
            );
            (None, false)
        }
    };

    if strict_ssot {
        let Some(expected) = ssot_sha256_expected.as_deref() else {
            eprintln!(
                "STRICT_SSOT/CHECK_SSOT=1: 必须设置 SSOT_SHA256，并与 docs/08-3-参数与门禁表.md sha256 一致"
            );
            std::process::exit(1);
        };
        let Some(computed) = ssot_sha256_computed.as_deref() else {
            eprintln!(
                "STRICT_SSOT/CHECK_SSOT=1: 无法计算 docs/08-3-参数与门禁表.md sha256；请确保运行时包含该文件（或调整部署方式以提供可校验的 SSOT 副本）"
            );
            std::process::exit(1);
        };
        if !expected.eq_ignore_ascii_case(computed) {
            eprintln!(
                "STRICT_SSOT/CHECK_SSOT=1: SSOT_SHA256 不匹配 computed={} expected={}，拒绝启动",
                computed, expected
            );
            std::process::exit(1);
        }
    }

    // --- SSOT 运行时 drift 复检（可定期触发 + 可留痕） ---
    // Runbook §10：每 24h 至少一次复检；不一致要告警/阻断，并保留校验日志（谁、何时、改了什么）。
    if args.iter().any(|a| a == "--ssot-runtime-check") {
        let code = run_ssot_runtime_check(strict_ssot, &ssot_version);
        std::process::exit(code);
    }

    let chargeback_policy = env::var("CHARGEBACK_POLICY").unwrap_or_else(|_| "unset".to_string());
    if strict_ssot && chargeback_policy == "unset" {
        eprintln!(
            "STRICT_SSOT/CHECK_SSOT=1: CHARGEBACK_POLICY 未设置，拒绝启动（08-3 chargebackPolicy 为关键 param_key，运行时必须显式配置）"
        );
        std::process::exit(1);
    }

    let finality_n: u64 = env::var("FINALITY_N")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(DEFAULT_FINALITY_N);

    let indexer_state_path = env::var("INDEXER_STATE_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("data/indexer_state.json"));
    let indexer_state_path_display = indexer_state_path.to_string_lossy().to_string();

    let mut indexer_state = load_or_init_indexer_state(&indexer_state_path, finality_n);

    // 若是“finalityN 变更回放/重放前置动作”，则在此执行并退出。
    if args.iter().any(|a| a == "--indexer-replay-finality-change") {
        let plan = apply_finality_change_replay_plan(&mut indexer_state, finality_n);
        persist_indexer_state(&indexer_state_path, &indexer_state)?;
        let _ = append_jsonl_value(
            std::path::Path::new("data/indexer_audit.jsonl"),
            json!({
                "ts": Utc::now().to_rfc3339(),
                "action": "replay_plan_applied",
                "finality_n_used": finality_n,
                "indexer_state_path": indexer_state_path_display.clone(),
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
        return Ok(());
    }

    // Indexer ingestion (from JSONL) for deterministic rebuild + evidence.
    // This is a CLI-only mode: read events, apply dedupe, advance checkpoint, persist state, exit.
    if let Some(pos) = args.iter().position(|a| a == "--indexer-validate-jsonl") {
        let Some(input) = args.get(pos + 1) else {
            return Err("--indexer-validate-jsonl requires a file path".into());
        };
        let input_path = std::path::PathBuf::from(input);
        let report = validate_events_jsonl(&input_path)?;
        println!(
            "indexer_validate: total_lines={} parsed_events={} unique_in_file={} dup_in_file={} input={}",
            report.total_lines,
            report.parsed_events,
            report.unique_in_file,
            report.duplicates_in_file,
            input_path.to_string_lossy(),
        );
        return Ok(());
    }
    if let Some(pos) = args.iter().position(|a| a == "--indexer-ingest-jsonl") {
        let Some(input) = args.get(pos + 1) else {
            return Err("--indexer-ingest-jsonl requires a file path".into());
        };
        let input_path = std::path::PathBuf::from(input);
        let seen_keys_path = env::var("INDEXER_SEEN_KEYS_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("data/indexer_seen_keys.json"));
        let events_log_path = env::var("INDEXER_EVENTS_LOG_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("data/indexer_events.jsonl"));
        let audit_log_path = env::var("INDEXER_AUDIT_LOG_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("data/indexer_audit.jsonl"));

        let ingest = ingest_events_from_jsonl(
            &input_path,
            &seen_keys_path,
            &events_log_path,
            &audit_log_path,
            &mut indexer_state,
            finality_n,
        )?;
        persist_indexer_state(&indexer_state_path, &indexer_state)?;
        println!(
            "indexer_ingest: applied={} duplicates={} input={} checkpoint={}:{}",
            ingest.applied,
            ingest.duplicates,
            input_path.to_string_lossy(),
            indexer_state.checkpoint.block_number,
            indexer_state.checkpoint.log_index
        );
        return Ok(());
    }

    // 启动门禁：finalityN 发生变化但未执行 replay 计划 => 在严格模式下拒绝启动。
    let strict_indexer_replay = env::var("STRICT_INDEXER_REPLAY").as_deref() == Ok("1");
    let replay_required = indexer_state.last_seen_finality_n != finality_n;

    let _ = append_jsonl_value(
        std::path::Path::new("data/indexer_audit.jsonl"),
        json!({
            "ts": Utc::now().to_rfc3339(),
            "action": "startup",
            "finality_n_used": finality_n,
            "indexer_state_path": indexer_state_path_display.clone(),
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

    let evidence_timestamp_policy = env::var("EVIDENCE_TIMESTAMP_POLICY")
        .unwrap_or_else(|_| "backend_signed".to_string());

    let receipt_hmac_key = env::var("EVIDENCE_RECEIPT_HMAC_KEY").ok().map(|s| s.into_bytes());
    let time_state_path = env::var("EVIDENCE_TIME_STATE_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("data/evidence_time_state.json"));
    let time_state_path_display = time_state_path.to_string_lossy().to_string();
    let evidence_time_state: Arc<RwLock<EvidenceTimeState>> =
        Arc::new(RwLock::new(load_or_init_evidence_time_state(&time_state_path)));

    // Pause（函数级 allowlist）与权威来源切换（indexer lag/reorg）
    let pause_mode = env::var("PAUSE_MODE").as_deref() == Ok("1");
    let pause_api_allowlist = env::var("PAUSE_API_ALLOWLIST").unwrap_or_else(|_| {
        "GET /health;GET /meta".to_string()
    });

    let indexer_lag_blocks: u64 = env::var("INDEXER_LAG_BLOCKS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(0);
    let indexer_lag_max_blocks: u64 = env::var("INDEXER_LAG_MAX_BLOCKS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(100);
    let reorg_detected = env::var("REORG_DETECTED").as_deref() == Ok("1");
    let degraded_mode = reorg_detected || indexer_lag_blocks > indexer_lag_max_blocks;
    let authority_source = if degraded_mode {
        "pending_finality"
    } else {
        "db_projection"
    };

    println!(
        "startup_snapshot: SSOT_VERSION={} SSOT_SHA256_EXPECTED={} SSOT_SHA256_COMPUTED={} SSOT_SHA256_MATCH={} CHARGEBACK_POLICY={} FINALITY_N={} INDEXER_STATE_PATH={} INDEXER_CHECKPOINT={}:{} INDEXER_LAST_SEEN_FINALITY_N={} INDEXER_REPLAY_REQUIRED={} AUTHORITY_SOURCE={} PAUSE_MODE={} REQUEST_TIMEOUT_SECS={} REQUEST_BODY_LIMIT_BYTES={} IDEMPOTENCY_CACHE_MAX={} EVIDENCE_TIMESTAMP_POLICY={} EVIDENCE_TIME_STATE_PATH={}",
        ssot_version,
        ssot_sha256_expected.clone().unwrap_or_else(|| "unset".to_string()),
        ssot_sha256_computed.clone().unwrap_or_else(|| "unavailable".to_string()),
        ssot_sha256_match,
        chargeback_policy,
        finality_n,
        indexer_state_path_display,
        indexer_state.checkpoint.block_number,
        indexer_state.checkpoint.log_index,
        indexer_state.last_seen_finality_n,
        replay_required,
        authority_source,
        pause_mode,
        REQUEST_TIMEOUT_SECS,
        REQUEST_BODY_LIMIT_BYTES,
        IDEMPOTENCY_CACHE_MAX,
        evidence_timestamp_policy,
        time_state_path_display,
    );

    let cors_origins_raw = env::var("CORS_ORIGINS").ok();
    if strict_ssot {
        let empty = cors_origins_raw.as_deref().map(|s| s.trim().is_empty()).unwrap_or(true);
        if empty {
            eprintln!("STRICT_SSOT/CHECK_SSOT=1: 生产基线要求必须设置 CORS_ORIGINS，拒绝启动");
            std::process::exit(1);
        }
    }

    let cors: CorsLayer = match cors_origins_raw {
        Some(s) if !s.trim().is_empty() => {
            let origins: Result<Vec<HeaderValue>, _> = s
                .split(',')
                .map(|o| HeaderValue::try_from(o.trim()))
                .collect();
            match origins {
                Ok(list) if !list.is_empty() => CorsLayer::new()
                    .allow_origin(AllowOrigin::list(list))
                    .allow_methods(Any)
                    .allow_headers(Any),
                _ => {
                    eprintln!("CORS_ORIGINS 解析失败或为空，使用允许任意 origin（仅建议用于开发）");
                    CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any)
                }
            }
        }
        _ => CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any),
    };

    let idem_cache: Arc<RwLock<IdempotencyCache>> = Arc::new(RwLock::new(IdempotencyCache::default()));
    let idem_cache_clone = Arc::clone(&idem_cache);
    let meta_state = ApiMetaState {
        strict_ssot,
        ssot_version,
        ssot_sha256_expected,
        ssot_sha256_computed,
        ssot_sha256_match,
        chargeback_policy,
        finality_n,
        indexer_state_path: indexer_state_path_display,
        indexer_checkpoint: indexer_state.checkpoint.clone(),
        indexer_last_seen_finality_n: indexer_state.last_seen_finality_n,
        indexer_replay_required: replay_required,
        pause_mode,
        pause_api_allowlist: pause_api_allowlist.clone(),
        degraded_mode,
        authority_source: authority_source.to_string(),
        indexer_lag_blocks,
        indexer_lag_max_blocks,
        reorg_detected,
        evidence_timestamp_policy,
        evidence_time_state,
        evidence_time_state_path: time_state_path_display,
        evidence_receipt_hmac_key: receipt_hmac_key.map(Arc::new),
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/meta", get(meta))
        .route("/api/v1/guides", get(guides_list_placeholder).post(not_impl_v1))
        .route("/api/v1/guides/:id", get(not_impl_guides_id))
        .route("/api/v1/guides/:id/stake", post(not_impl_v1))
        .route("/api/v1/me", get(get_me).put(not_impl_v1))
        .route("/api/v1/me/stats", get(get_me_stats)) // 04 §三 可选：统计摘要，与 /api/v1/me 二选一或并存
        .route("/api/v1/me/password", put(not_impl_v1))
        .route("/api/v1/orders", get(get_orders).post(not_impl_v1))
        .route("/api/v1/orders/:id", get(get_order_by_id))
        .route("/api/v1/orders/:id/accept", post(not_impl_v1))
        .route("/api/v1/orders/:id/cancel", post(not_impl_v1))
        .route(
            "/api/v1/orders/:id/confirm-completion",
            post(post_order_confirm_completion_intent),
        )
        .route("/api/v1/orders/:id/reviews", get(not_impl_v1).post(not_impl_v1))
        .route("/api/v1/orders/:id/evidence", get(not_impl_evidence).post(post_evidence_receipt)) // 04 §三 证据路径：本实现先落 receipt（hash+可信时间戳+签名），文件存储实现可后续补齐
        .route("/api/v1/orders/:id/dispute", post(post_order_open_dispute_intent))
        .route("/api/v1/disputes", get(get_disputes))
        .route("/api/v1/disputes/:id", get(get_dispute_by_id))
        .route(
            "/api/v1/disputes/:id/resolve",
            post(post_dispute_execute_resolution_intent),
        )
        .route("/auth/register", post(not_impl_auth))
        .route("/auth/login", post(not_impl_auth))
        .route("/auth/logout", post(not_impl_auth))
        .route("/auth/refresh", post(not_impl_auth))
        .route("/auth/verify-email", post(not_impl_auth))
        .route("/auth/forgot-password", post(not_impl_auth))
        .route("/auth/reset-password", post(not_impl_auth))
        .with_state(meta_state)
        .layer(TimeoutLayer::new(Duration::from_secs(REQUEST_TIMEOUT_SECS))) // 04 §四 请求超时（写死默认值）
        .layer(RequestBodyLimitLayer::new(REQUEST_BODY_LIMIT_BYTES)) // 1MB（写死默认值）
        .layer(cors)
        .layer(axum::middleware::from_fn(authority_source_layer))
        .layer(axum::middleware::from_fn(pause_gate_layer))
        .layer(axum::middleware::from_fn(request_id_layer))
        .layer(axum::middleware::from_fn(message_id_layer))
        .layer(axum::middleware::from_fn(move |req, next| idempotency_key_layer(idem_cache_clone.clone(), req, next)))
        .layer(axum::middleware::from_fn(auth_placeholder_layer))
        .layer(axum::middleware::from_fn(security_headers_layer));

    // --- Outbox worker (optional) ---
    // Default off: avoid changing runtime behavior unless explicitly enabled.
    let outbox_dir = env::var("OUTBOX_DIR").unwrap_or_else(|_| "data/outbox".to_string());
    let outbox_worker_enabled = env::var("OUTBOX_WORKER").as_deref() == Ok("1");
    let outbox_lease_secs: i64 = env::var("OUTBOX_LEASE_SECS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(60);
    let outbox_poll_ms: u64 = env::var("OUTBOX_POLL_MS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(500);
    let outbox_max_attempts: u32 = env::var("OUTBOX_MAX_ATTEMPTS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(10);
    if outbox_worker_enabled {
        println!(
            "outbox_worker: enabled dir={} lease_secs={} poll_ms={} max_attempts={}",
            outbox_dir, outbox_lease_secs, outbox_poll_ms, outbox_max_attempts
        );
        tokio::spawn(async move {
            if let Err(e) = outbox_worker_loop(
                outbox_dir,
                outbox_lease_secs,
                outbox_poll_ms,
                outbox_max_attempts,
            )
            .await
            {
                eprintln!("outbox_worker: fatal error: {}", e);
            }
        });
    }

    let port: u16 = env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("TravelTrust API listening on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

/// 鉴权占位：当前透传；实现时在此校验 JWT/session，需登录路由返回 401。04 §三 多处「需登录」。
async fn auth_placeholder_layer(req: Request<axum::body::Body>, next: Next) -> Response {
    next.run(req).await
}

#[derive(Default)]
struct IdempotencyCache {
    store: HashMap<String, (StatusCode, Vec<u8>)>,
}

impl IdempotencyCache {
    fn get(&self, k: &str) -> Option<(StatusCode, Vec<u8>)> {
        self.store.get(k).cloned()
    }
    fn insert(&mut self, k: String, v: (StatusCode, Vec<u8>)) {
        if self.store.len() >= IDEMPOTENCY_CACHE_MAX {
            if let Some(first) = self.store.keys().next().cloned() {
                self.store.remove(&first);
            }
        }
        self.store.insert(k, v);
    }
}

/// 幂等（01 §10 #14）：POST/PUT 时按 Idempotency-Key 去重并复用缓存的响应；否则透传并回写 key。
async fn idempotency_key_layer(
    cache: Arc<RwLock<IdempotencyCache>>,
    req: Request<Body>,
    next: Next,
) -> Response {
    let key = req
        .headers()
        .get("Idempotency-Key")
        .or_else(|| req.headers().get("X-Idempotency-Key"))
        .and_then(|v| v.to_str().ok())
        .map(String::from);
    let method = req.method().clone();
    let path = req.uri().path().to_string();
    let is_write = matches!(method, Method::POST | Method::PUT | Method::PATCH | Method::DELETE);

    let strict = env::var("STRICT_SSOT").as_deref() == Ok("1") || env::var("CHECK_SSOT").as_deref() == Ok("1");
    let require_idem = strict || env::var("REQUIRE_IDEMPOTENCY_KEY").as_deref() == Ok("1");
    if is_write && require_idem && key.is_none() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "missing_idempotency_key",
                "required_header": "Idempotency-Key",
                "also_accepted": "X-Idempotency-Key",
                "rule": "写请求必须提供幂等键；否则网络重试/并发会造成重复入队/重复链上尝试，产生资损风险",
            })),
        )
            .into_response();
    }

    if is_write {
        if let Some(ref k) = key {
            let cache_key = format!("{}:{}:{}", method, path, k);
            {
                let guard = cache.read().await;
                if let Some((status, body)) = guard.get(&cache_key) {
                    let req_id = req
                        .headers()
                        .get("x-request-id")
                        .and_then(|v| v.to_str().ok())
                        .map(String::from)
                        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
                    let mut res = (status, Body::from(Bytes::from(body))).into_response();
                    if let (Ok(n1), Ok(v1)) = (
                        HeaderName::try_from("x-request-id"),
                        HeaderValue::try_from(req_id.as_str()),
                    ) {
                        res.headers_mut().insert(n1, v1);
                    }
                    if let (Ok(n2), Ok(v2)) = (
                        HeaderName::try_from("X-Idempotency-Key"),
                        HeaderValue::try_from(k.as_str()),
                    ) {
                        res.headers_mut().insert(n2, v2);
                    }
                    return res;
                }
            }
        }
    }

    let res = next.run(req).await;

    if is_write {
        if let Some(ref k) = key {
            let cache_key = format!("{}:{}:{}", method, path, k);
            let (parts, body) = res.into_parts();
            match BodyExt::collect(body).await {
                Ok(collected) => {
                    let bytes = collected.to_bytes();
                    let status = parts.status;
                    let body_bytes = bytes.to_vec();
                    cache.write().await.insert(cache_key, (status, body_bytes.clone()));
                    let mut out = Response::from_parts(parts, Body::from(Bytes::from(body_bytes)));
                    if let (Ok(n), Ok(v)) = (
                        HeaderName::try_from("X-Idempotency-Key"),
                        HeaderValue::try_from(k.as_str()),
                    ) {
                        out.headers_mut().insert(n, v);
                    }
                    return out;
                }
                Err(_) => {
                    return Response::from_parts(parts, Body::empty());
                }
            }
        }
    } else if let Some(ref k) = key {
        let mut res = res;
        if let (Ok(n), Ok(v)) = (
            HeaderName::try_from("X-Idempotency-Key"),
            HeaderValue::try_from(k.as_str()),
        ) {
            res.headers_mut().insert(n, v);
        }
        return res;
    }

    res
}

/// traceId：与 01 §9 贯通 requestId→txHash→logIndex 一致；响应头 x-request-id 供审计与资损排查。可观测：每请求打印 request_id + path + status（实现时可按 01 §9 SLO 接入结构化日志）。
async fn request_id_layer(req: Request<axum::body::Body>, next: Next) -> Response {
    let id = req
        .headers()
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(String::from)
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let path = req.uri().path().to_string();
    let mut res = next.run(req).await;
    eprintln!("[req] x-request-id={} path={} status={}", id, path, res.status().as_u16());
    if let (Ok(name), Ok(val)) = (
        HeaderName::try_from("x-request-id"),
        axum::http::header::HeaderValue::try_from(id.as_str()),
    ) {
        res.headers_mut().insert(name, val);
    }
    res
}

/// messageId：与 01 §9 串联 requestId→messageId→txHash→logIndex。当前仅生成并回写响应头，后续可与审计日志/事务表落库。
async fn message_id_layer(req: Request<axum::body::Body>, next: Next) -> Response {
    let msg_id = uuid::Uuid::new_v4().to_string();
    let path = req.uri().path().to_string();
    let mut res = next.run(req).await;
    eprintln!(
        "[req] x-message-id={} path={} status={}",
        msg_id,
        path,
        res.status().as_u16()
    );
    if let (Ok(name), Ok(val)) = (
        HeaderName::try_from("x-message-id"),
        axum::http::header::HeaderValue::try_from(msg_id.as_str()),
    ) {
        res.headers_mut().insert(name, val);
    }
    res
}

/// 响应安全头（最小基线）：避免浏览器误嗅探、点击劫持、Referrer 泄漏等。
///
/// - HSTS：仅在 `HSTS=1` 时开启（本地 http/反代场景默认不强制）。
/// - Cache-Control：API 默认 no-store（避免 token/隐私响应被缓存）。
async fn security_headers_layer(req: Request<axum::body::Body>, next: Next) -> Response {
    let mut res = next.run(req).await;

    // 防 MIME 嗅探
    res.headers_mut().insert(
        HeaderName::from_static("x-content-type-options"),
        HeaderValue::from_static("nosniff"),
    );
    // 防点击劫持
    res.headers_mut().insert(
        HeaderName::from_static("x-frame-options"),
        HeaderValue::from_static("DENY"),
    );
    // 限制 Referrer 泄漏
    res.headers_mut().insert(
        HeaderName::from_static("referrer-policy"),
        HeaderValue::from_static("no-referrer"),
    );
    // 禁止缓存（API 默认）
    res.headers_mut().insert(
        HeaderName::from_static("cache-control"),
        HeaderValue::from_static("no-store"),
    );
    // 最小 Permissions-Policy：默认禁用敏感能力（如未来前端同域调用 API）。
    res.headers_mut().insert(
        HeaderName::from_static("permissions-policy"),
        HeaderValue::from_static("geolocation=(), microphone=(), camera=()"),
    );

    if env::var("HSTS").as_deref() == Ok("1") {
        res.headers_mut().insert(
            HeaderName::from_static("strict-transport-security"),
            HeaderValue::from_static("max-age=31536000; includeSubDomains"),
        );
    }

    res
}

async fn health() -> &'static str {
    "ok"
}

#[derive(Clone)]
struct ApiMetaState {
    strict_ssot: bool,
    ssot_version: String,
    ssot_sha256_expected: Option<String>,
    ssot_sha256_computed: Option<String>,
    ssot_sha256_match: bool,
    chargeback_policy: String,
    finality_n: u64,
    indexer_state_path: String,
    indexer_checkpoint: ProjectorCheckpoint,
    indexer_last_seen_finality_n: u64,
    indexer_replay_required: bool,

    pause_mode: bool,
    pause_api_allowlist: String,

    degraded_mode: bool,
    authority_source: String,
    indexer_lag_blocks: u64,
    indexer_lag_max_blocks: u64,
    reorg_detected: bool,

    evidence_timestamp_policy: String,
    evidence_time_state: Arc<RwLock<EvidenceTimeState>>,
    evidence_time_state_path: String,
    evidence_receipt_hmac_key: Option<Arc<Vec<u8>>>,
}

/// GET /meta: 版本与运行时默认配置快照（用于 08 drift/evidence 与 FE 版本绑定）
async fn meta(axum::extract::State(state): axum::extract::State<ApiMetaState>) -> impl IntoResponse {
    let outbox_dir = env::var("OUTBOX_DIR").unwrap_or_else(|_| "data/outbox".to_string());
    let outbox_worker_enabled = env::var("OUTBOX_WORKER").as_deref() == Ok("1");
    let outbox_lease_secs: u64 = env::var("OUTBOX_LEASE_SECS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(60);
    let outbox_poll_ms: u64 = env::var("OUTBOX_POLL_MS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(500);
    let outbox_max_attempts: u64 = env::var("OUTBOX_MAX_ATTEMPTS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(10);

    Json(json!({
        "service": "traveltrust-api",
        "api_version": env!("CARGO_PKG_VERSION"),
        "strict_mode": {
            "strict_ssot": state.strict_ssot,
            "require_idempotency_key": state.strict_ssot || env::var("REQUIRE_IDEMPOTENCY_KEY").as_deref() == Ok("1"),
        },
        "ssot_version": state.ssot_version,
        "ssot": {
            "expected_sha256": state.ssot_sha256_expected,
            "computed_sha256": state.ssot_sha256_computed,
            "match": state.ssot_sha256_match,
            "file": "docs/08-3-参数与门禁表.md",
            "rule": "STRICT_SSOT/CHECK_SSOT=1 时 expected_sha256 必须与 computed_sha256 一致，否则拒绝启动",
        },
        "chargeback_policy": state.chargeback_policy,
        "finality_n": state.finality_n,
        "indexer": {
            "state_path": state.indexer_state_path,
            "checkpoint": {
                "block_number": state.indexer_checkpoint.block_number,
                "log_index": state.indexer_checkpoint.log_index,
            },
            "last_seen_finality_n": state.indexer_last_seen_finality_n,
            "replay_required": state.indexer_replay_required,
            "lag_blocks": state.indexer_lag_blocks,
            "lag_max_blocks": state.indexer_lag_max_blocks,
            "reorg_detected": state.reorg_detected,
        },
        "authority": {
            "source": state.authority_source,
            "degraded_mode": state.degraded_mode,
            "rule": "normal=DB投影；indexer落后或reorg=待最终确认(pending_finality)+冻结关键写操作",
        },
        "pause": {
            "enabled": state.pause_mode,
            "api_allowlist": state.pause_api_allowlist,
            "rule": "PAUSE_MODE=1 时，除 allowlist 外的写操作一律阻断（防 Pause 变万能开关/滥用）",
        },
        "evidence": {
            "timestamp_policy": state.evidence_timestamp_policy,
            "time_state_path": state.evidence_time_state_path,
            "receipt_signature": if state.evidence_receipt_hmac_key.is_some() { "hmac_sha256" } else { "unset" },
            "rollback_detection": "monotonic_last_timestamp (persisted)",
        },
        "defaults": {
            "request_timeout_secs": REQUEST_TIMEOUT_SECS,
            "request_body_limit_bytes": REQUEST_BODY_LIMIT_BYTES,
            "idempotency_cache_max": IDEMPOTENCY_CACHE_MAX,
        },
        "outbox": {
            "dir": outbox_dir,
            "worker_enabled": outbox_worker_enabled,
            "lease_secs": outbox_lease_secs,
            "poll_ms": outbox_poll_ms,
            "max_attempts": outbox_max_attempts,
        }
    }))
}

/// 运行时权威来源中间件：在响应头写入 x-authority-source，且在 degraded_mode 时可阻断关键写操作。
async fn authority_source_layer(
    req: Request<axum::body::Body>,
    next: Next,
) -> Response {
    // 注：这是“写死规则”的工程落点：indexer 落后/reorg 时必须显式进入 pending_finality。
    let authority_source = env::var("API_AUTHORITY_SOURCE").unwrap_or_else(|_| "auto".to_string());
    let mut computed = "db_projection".to_string();

    let indexer_lag_blocks: u64 = env::var("INDEXER_LAG_BLOCKS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(0);
    let indexer_lag_max_blocks: u64 = env::var("INDEXER_LAG_MAX_BLOCKS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(100);
    let reorg_detected = env::var("REORG_DETECTED").as_deref() == Ok("1");
    let chain_congested = env::var("CHAIN_CONGESTED").as_deref() == Ok("1");
    let degraded_mode = reorg_detected || chain_congested || indexer_lag_blocks > indexer_lag_max_blocks;

    if authority_source != "auto" {
        computed = authority_source;
    } else if degraded_mode {
        computed = "pending_finality".to_string();
    }

    // degraded_mode 下阻断关键写（避免 DB 投影与链上相反导致前端状态错乱）
    let method = req.method().clone();
    let path = req.uri().path().to_string();
    let is_write = method == Method::POST || method == Method::PUT;
    let blocks_writes = degraded_mode && is_write;
    if blocks_writes {
        let mut res = (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "degraded_mode",
                "authority_source": computed,
                "reason": "indexer_lag/reorg/chain_congestion",
                "rule": "degraded_mode 时冻结关键写操作；前端应显示‘待最终确认’并仅允许查询",
                "path": path,
                "method": method.to_string(),
            })),
        )
            .into_response();
        if let (Ok(n), Ok(v)) = (
            HeaderName::try_from("x-authority-source"),
            HeaderValue::try_from(computed.as_str()),
        ) {
            res.headers_mut().insert(n, v);
        }
        return res;
    }

    let mut res = next.run(req).await;
    if let (Ok(n), Ok(v)) = (
        HeaderName::try_from("x-authority-source"),
        HeaderValue::try_from(computed.as_str()),
    ) {
        res.headers_mut().insert(n, v);
    }
    res
}

/// Pause 门禁中间件：PAUSE_MODE=1 时，只有 allowlist 命中的接口允许继续。
async fn pause_gate_layer(req: Request<axum::body::Body>, next: Next) -> Response {
    if env::var("PAUSE_MODE").as_deref() != Ok("1") {
        return next.run(req).await;
    }

    let allowlist = env::var("PAUSE_API_ALLOWLIST").unwrap_or_else(|_| "GET /health;GET /meta".to_string());
    let method = req.method().as_str().to_string();
    let path = req.uri().path().to_string();
    let signature = format!("{} {}", method, path);

    if pause_allowlist_match(&allowlist, &signature) {
        return next.run(req).await;
    }

    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({
            "status": "paused",
            "rule": "PAUSE_MODE=1 时仅允许 PAUSE_API_ALLOWLIST 命中的接口继续",
            "signature": signature,
            "pause_api_allowlist": allowlist,
        })),
    )
        .into_response()
}

fn pause_allowlist_match(allowlist: &str, signature: &str) -> bool {
    // allowlist 格式："GET /health;GET /meta;POST /api/v1/orders/*/cancel"
    // 支持 '*' 通配。
    let signature = signature.trim();
    allowlist
        .split(|c| c == ';' || c == ',')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .any(|pattern| wildcard_match(pattern, signature))
}

fn wildcard_match(pattern: &str, text: &str) -> bool {
    // 简易通配：仅支持 '*' 匹配任意子串。
    // 规则足够用于“接口级 allowlist 写死”。
    if pattern == "*" {
        return true;
    }
    let mut parts = pattern.split('*');
    let Some(first) = parts.next() else {
        return pattern == text;
    };
    if !text.starts_with(first) {
        return false;
    }
    let mut idx = first.len();
    for p in parts {
        if p.is_empty() {
            continue;
        }
        match text[idx..].find(p) {
            Some(pos) => idx += pos + p.len(),
            None => return false,
        }
    }
    if !pattern.ends_with('*') {
        // 最后一段必须对齐到结尾
        if let Some(last) = pattern.split('*').last() {
            return text.ends_with(last);
        }
    }
    true
}

async fn guides_list_placeholder() -> &'static str {
    "[]"
}

// --- Indexer state (checkpoint must include logIndex) ---

#[derive(Clone, Debug, Serialize, Deserialize)]
struct ProjectorCheckpoint {
    block_number: u64,
    log_index: u32,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct IndexerState {
    // “写死”：checkpoint 必须包含 logIndex（否则同 tx 多 log / 重复事件 / reorg 重建会失败）
    checkpoint: ProjectorCheckpoint,
    // 用于检测 finalityN 变更并强制回放
    last_seen_finality_n: u64,
}

// --- Indexer event ingestion (file -> deterministic apply) ---

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
    // Required uniqueness key: txHash + logIndex + blockHash (plus chainId).
    format!(
        "{}:{}:{}:{}",
        e.chain_id,
        normalize_hex(&e.tx_hash),
        normalize_hex(&e.block_hash),
        e.log_index
    )
}

fn load_seen_keys(path: &std::path::Path) -> BTreeSet<String> {
    if let Ok(bytes) = fs::read(path) {
        if let Ok(s) = serde_json::from_slice::<SeenKeysState>(&bytes) {
            return s.keys.into_iter().collect();
        }
    }
    BTreeSet::new()
}

fn persist_seen_keys(path: &std::path::Path, keys: &BTreeSet<String>) -> Result<(), String> {
    let body = SeenKeysState {
        keys: keys.iter().cloned().collect(),
    };
    let bytes = serde_json::to_vec_pretty(&body).map_err(|e| e.to_string())?;
    write_bytes_atomic(path, &bytes)?;
    Ok(())
}

#[derive(Clone, Debug)]
struct IndexerIngestReport {
    applied: u64,
    duplicates: u64,
}

#[derive(Clone, Debug)]
struct IndexerValidateReport {
    total_lines: u64,
    parsed_events: u64,
    unique_in_file: u64,
    duplicates_in_file: u64,
}

fn is_hex_like(s: &str) -> bool {
    let t = s.trim();
    let t = t.strip_prefix("0x").unwrap_or(t);
    !t.is_empty() && t.chars().all(|c| c.is_ascii_hexdigit())
}

fn validate_events_jsonl(input_path: &std::path::Path) -> Result<IndexerValidateReport, String> {
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
            return Err(format!("invalid jsonl line {}: tx_hash not hex-like", i + 1));
        }
        if !is_hex_like(&e.block_hash) {
            return Err(format!("invalid jsonl line {}: block_hash not hex-like", i + 1));
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

fn ingest_events_from_jsonl(
    input_path: &std::path::Path,
    seen_keys_path: &std::path::Path,
    indexer_events_log: &std::path::Path,
    indexer_audit_log: &std::path::Path,
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
            let _ = append_jsonl_value(
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

        // Fail-closed: never accept a new (non-duplicate) event that is at/before current checkpoint.
        // If operator needs to rewind, they must run the replay plan (which rewinds checkpoint) or reset state.
        let cp = &indexer_state.checkpoint;
        if (e.block_number, e.log_index) <= (cp.block_number, cp.log_index) {
            let _ = append_jsonl_value(
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

        // Append raw event as the rebuild source-of-truth.
        let _ = append_jsonl_value(
            indexer_events_log,
            json!({
                "ts": Utc::now().to_rfc3339(),
                "event": e,
                "dedupe_key": key,
            }),
        );

        // Advance checkpoint deterministically.
        indexer_state.checkpoint.block_number = e.block_number;
        indexer_state.checkpoint.log_index = e.log_index;

        let _ = append_jsonl_value(
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
    Ok(IndexerIngestReport { applied, duplicates })
}

#[derive(Clone, Debug, Serialize, Deserialize)]
struct FinalityReplayPlan {
    old_finality_n: u64,
    new_finality_n: u64,
    rewind_blocks: u64,
    old_checkpoint: ProjectorCheckpoint,
    new_checkpoint: ProjectorCheckpoint,
    rule: String,
}

fn load_or_init_indexer_state(path: &PathBuf, finality_n: u64) -> IndexerState {
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

fn persist_indexer_state(path: &PathBuf, state: &IndexerState) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let bytes = serde_json::to_vec_pretty(state)?;
    write_bytes_atomic(path, &bytes)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    Ok(())
}

fn apply_finality_change_replay_plan(state: &mut IndexerState, new_finality_n: u64) -> FinalityReplayPlan {
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

// --- Evidence receipt timestamp policy (可信起点 + 回滚检测) ---

#[derive(Clone, Debug, Serialize, Deserialize)]
struct EvidenceTimeState {
    last_seen_utc_rfc3339: String,
}

fn load_or_init_evidence_time_state(path: &PathBuf) -> EvidenceTimeState {
    if let Ok(bytes) = fs::read(path) {
        if let Ok(s) = serde_json::from_slice::<EvidenceTimeState>(&bytes) {
            return s;
        }
    }
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    EvidenceTimeState {
        last_seen_utc_rfc3339: Utc::now().to_rfc3339(),
    }
}

fn persist_evidence_time_state(path: &PathBuf, state: &EvidenceTimeState) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    let bytes = serde_json::to_vec_pretty(state)?;
    write_bytes_atomic(path, &bytes)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn make_temp_dir(name: &str) -> PathBuf {
        let mut p = std::env::temp_dir();
        let n = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        p.push(format!("traveltrust_{}_{}", name, n));
        fs::create_dir_all(&p).unwrap();
        p
    }

    #[test]
    fn write_bytes_atomic_overwrites_existing_file() {
        let dir = make_temp_dir("atomic_write");
        let path = dir.join("state.json");
        write_bytes_atomic(&path, b"one").unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), "one");
        write_bytes_atomic(&path, b"two").unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), "two");
    }

    #[test]
    fn validate_jsonl_counts_duplicates_in_file() {
        let dir = make_temp_dir("validate_jsonl");
        let input = dir.join("events.jsonl");
        let line = r#"{"chain_id":1,"tx_hash":"0xaaa","block_hash":"0xbbb","block_number":10,"log_index":0,"kind":"X"}"#;
        fs::write(&input, format!("{}\n{}\n", line, line)).unwrap();

        let r = validate_events_jsonl(&input).unwrap();
        assert_eq!(r.parsed_events, 2);
        assert_eq!(r.unique_in_file, 1);
        assert_eq!(r.duplicates_in_file, 1);
    }

    #[test]
    fn ingest_rejects_non_duplicate_event_before_checkpoint() {
        let dir = make_temp_dir("ingest_gate");
        let input = dir.join("events.jsonl");
        fs::write(
            &input,
            r#"{"chain_id":1,"tx_hash":"0xaaa","block_hash":"0xbbb","block_number":1,"log_index":0,"kind":"X"}"#,
        )
        .unwrap();

        let seen_keys = dir.join("seen.json");
        let events_log = dir.join("indexer_events.jsonl");
        let audit_log = dir.join("indexer_audit.jsonl");
        let mut state = IndexerState {
            checkpoint: ProjectorCheckpoint {
                block_number: 5,
                log_index: 0,
            },
            last_seen_finality_n: 12,
        };

        let err = ingest_events_from_jsonl(
            &input,
            &seen_keys,
            &events_log,
            &audit_log,
            &mut state,
            12,
        )
        .unwrap_err();
        assert!(err.contains("event at/before checkpoint"));
    }
}

#[derive(Debug, Deserialize)]
struct EvidenceReceiptRequest {
    content_hash: String,
    content_type: Option<String>,
    // 客户端可提供，仅用于审计对照；不作为权威
    client_time_rfc3339: Option<String>,
}

async fn post_evidence_receipt(
    Path(order_id): Path<String>,
    axum::extract::State(state): axum::extract::State<ApiMetaState>,
    headers: HeaderMap,
    Json(payload): Json<EvidenceReceiptRequest>,
) -> impl IntoResponse {
    // 策略：backend_signed（当前可执行落点）
    if state.evidence_timestamp_policy != "backend_signed" {
        return (
            StatusCode::NOT_IMPLEMENTED,
            Json(json!({
                "status": "not_implemented",
                "reason": "当前仅实现 backend_signed（可验证 server receipt 签名 + 回滚检测）",
                "evidence_timestamp_policy": state.evidence_timestamp_policy,
            })),
        );
    }

    let key = match &state.evidence_receipt_hmac_key {
        Some(k) if !k.is_empty() => k.clone(),
        _ => {
            return (
                StatusCode::FAILED_DEPENDENCY,
                Json(json!({
                    "status": "missing_config",
                    "required_env": "EVIDENCE_RECEIPT_HMAC_KEY",
                    "rule": "证据回执必须可验证（签名）；否则证据时间戳可信策略未落地",
                })),
            )
        }
    };

    let now: DateTime<Utc> = Utc::now();
    let now_str = now.to_rfc3339();

    // 回滚检测：last_seen 必须单调不减（持久化）。
    let time_state_path = PathBuf::from(&state.evidence_time_state_path);
    {
        let mut guard = state.evidence_time_state.write().await;
        let last = DateTime::parse_from_rfc3339(&guard.last_seen_utc_rfc3339)
            .ok()
            .map(|dt| dt.with_timezone(&Utc));
        if let Some(last_dt) = last {
            if now < last_dt {
                return (
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "status": "time_rollback_detected",
                        "now_utc": now_str,
                        "last_seen_utc": guard.last_seen_utc_rfc3339,
                        "rule": "检测到服务器时间回滚：必须告警并暂停依赖时间戳的证据/裁决，直到运维确认",
                    })),
                );
            }
        }

        guard.last_seen_utc_rfc3339 = now_str.clone();
        if let Err(e) = persist_evidence_time_state(&time_state_path, &guard) {
            eprintln!("WARN: persist evidence time state failed: {}", e);
        }
    }

    // receipt 签名：HMAC-SHA256(key, canonical_json)
    let receipt_body = json!({
        "order_id": order_id,
        "content_hash": payload.content_hash,
        "content_type": payload.content_type,
        "server_time_utc_rfc3339": now_str,
        "client_time_rfc3339": payload.client_time_rfc3339,
        "policy": "backend_signed",
        "time_rollback_detection": "monotonic_last_timestamp_persisted",
    });
    let canonical = serde_json::to_vec(&receipt_body).unwrap_or_default();
    let mut mac = HmacSha256::new_from_slice(&key).expect("HMAC can take key of any size");
    mac.update(&canonical);
    let sig = mac.finalize().into_bytes();
    let signature_hex: String = sig.iter().map(|b| format!("{:02x}", b)).collect();

    // Outbox: persist the intent to do side effects (pin evidence / notify / chain tx) BEFORE returning.
    // This is a minimal file-backed outbox; handler must be idempotent (at-least-once).
    let idem_key = headers
        .get("Idempotency-Key")
        .or_else(|| headers.get("X-Idempotency-Key"))
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    let outbox_dir = env::var("OUTBOX_DIR").unwrap_or_else(|_| "data/outbox".to_string());
    let outbox = FileOutbox::new(outbox_dir);
    let mut item = OutboxItem::new(
        "evidence_receipt.created",
        json!({
            "receipt": receipt_body,
            "signature": {
                "alg": "hmac-sha256",
                "encoding": "hex",
                "value": signature_hex,
            }
        }),
    );
    item.idempotency_key = idem_key;
    let outbox_item = match outbox.enqueue(item) {
        Ok(i) => i,
        Err(e) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "outbox_persist_failed",
                    "rule": "必须先落 outbox 再做任何外部副作用；否则会出现链成功但DB/持久化失败的不可对账状态",
                    "error": e.to_string(),
                })),
            );
        }
    };

    (
        StatusCode::OK,
        Json(json!({
            "receipt": receipt_body,
            "signature": {
                "alg": "hmac-sha256",
                "encoding": "hex",
                "value": signature_hex,
            }
            ,
            "outbox": {
                "id": outbox_item.id,
                "kind": outbox_item.kind,
                "status": "queued"
            }
        })),
    )
}

async fn outbox_worker_loop(
    outbox_dir: String,
    lease_secs: i64,
    poll_ms: u64,
    max_attempts: u32,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let outbox = FileOutbox::new(outbox_dir);

    // Startup recovery: reclaim expired in-progress items.
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
                        let _ = append_jsonl_value(
                            std::path::Path::new("data/outbox_events.jsonl"),
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
                                &std::path::PathBuf::from("data/alerts"),
                                &item,
                                &err,
                                attempts + 1,
                            );
                            let _ = outbox.dead_letter(item, Some(err_clone));
                            let _ = append_jsonl_value(
                                std::path::Path::new("data/outbox_events.jsonl"),
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
                            let _ = append_jsonl_value(
                                std::path::Path::new("data/outbox_events.jsonl"),
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

fn outbox_retry_delay_secs(kind: &str, attempts: u32) -> i64 {
    // attempts: current attempts count BEFORE this failure is recorded.
    // `reschedule()` will increment attempts by 1.
    let n = attempts as usize;
    match kind {
        // Fixed deterministic policy: no tight loop; gives operators time to investigate.
        "dispute.execute_resolution" => {
            let schedule = [10i64, 30, 120, 300, 900, 1800, 3600];
            schedule[std::cmp::min(n, schedule.len() - 1)]
        }
        _ => (attempts as i64 + 1).clamp(1, 30),
    }
}

fn append_jsonl_value(path: &std::path::Path, value: serde_json::Value) -> Result<(), String> {
    let line = serde_json::to_string(&value).map_err(|e| e.to_string())?;
    append_jsonl(path, &line)
}

fn write_outbox_alert(
    alert_dir: &std::path::PathBuf,
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
    // NOTE: Placeholder handler.
    // Real implementation should:
    // - be idempotent (use idempotency_key / on-chain tx nonce tracking)
    // - commit results durably (tx hash / log index) before acking
    match item.kind.as_str() {
        "evidence_receipt.created" => {
            // Demonstrate side-effect boundary with a durable append-only audit log.
            let line = serde_json::to_string(item).map_err(|e| e.to_string())? + "\n";
            let path = std::path::PathBuf::from("data/outbox_processed.log");
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
        // For now, treat signed intents as audit-only no-op.
        // Execution (chain tx) is the responsibility of a separate executor.
        "order.confirm_completion_intent" | "order.open_dispute_intent" => {
            let line = serde_json::to_string(item).map_err(|e| e.to_string())? + "\n";
            let path = std::path::PathBuf::from("data/outbox_processed.log");
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
        // executeResolution MUST be performed by an executor with atomic semantics.
        // This API process only provides durable retry/dead-letter mechanics.
        "dispute.execute_resolution" => Err("executor_not_configured".to_string()),
        other => Err(format!("unknown outbox kind: {}", other)),
    }
}

// --- Minimal v1 JSON skeletons (unblock FE routing; authority remains backend-only) ---

#[derive(Debug, Serialize)]
struct MeResponse {
    status: &'static str,
    user: serde_json::Value,
}

async fn get_me() -> impl IntoResponse {
    // Auth not implemented yet: return anonymous user.
    Json(MeResponse {
        status: "ok",
        user: json!({
            "id": "anonymous",
            "role": "guest",
            "rule": "当前为占位：鉴权未实现；订单/资金终态必须来自链上事件/后端投影，前端不得自推状态",
        }),
    })
}

async fn get_me_stats() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "stats": {
            "orders_total": 0,
            "disputes_total": 0
        },
        "note": "占位：与 /api/v1/me 二选一或并存"
    }))
}

async fn get_orders() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "items": [],
        "rule": "唯一数据源=后端 API；前端不得自行推进订单状态。完整实现需接入链上事件投影与 finalityN 门禁"
    }))
}

async fn get_order_by_id(Path(id): Path<String>) -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "order": {
            "id": id,
            "status": "unknown"
        },
        "rule": "占位：订单终态必须来自链上事件/后端投影；degraded_mode 时应显示 pending_finality"
    }))
}

async fn get_disputes() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "items": [],
        "note": "占位：完整实现需链上 dispute 事件投影，并与 checkpoint(block,logIndex) 对齐"
    }))
}

async fn get_dispute_by_id(Path(id): Path<String>) -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "dispute": {
            "id": id,
            "status": "unknown"
        },
        "note": "占位：dispute 状态来自链上事件/后端投影"
    }))
}

#[derive(Debug, Deserialize, Serialize)]
struct SignedIntent {
    chain_id: u64,
    verifying_contract: String,
    signer: String,
    signature: String,
    typed_data: serde_json::Value,
    intent_nonce: Option<String>,
    intent_ts_ms: Option<i64>,
}

fn env_chain_id() -> Option<u64> {
    env::var("CHAIN_ID").ok().and_then(|v| v.parse().ok())
}

fn normalize_addr(s: &str) -> String {
    s.trim().to_ascii_lowercase()
}

fn parse_addr_set(raw: &str) -> std::collections::HashSet<String> {
    raw.split(|c: char| c == ',' || c == ';' || c == '\n' || c == '\t' || c == ' ')
        .filter_map(|s| {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                Some(normalize_addr(t))
            }
        })
        .collect()
}

fn validate_intent_policy(intent: &SignedIntent, strict_ssot: bool) -> Result<(), String> {
    let allow_raw = env::var("VERIFYING_CONTRACT_ALLOWLIST").ok();
    let allow = allow_raw
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(parse_addr_set);
    if strict_ssot && allow.is_none() {
        return Err(
            "missing VERIFYING_CONTRACT_ALLOWLIST in strict mode (must be non-bypassable)".to_string(),
        );
    }
    if let Some(set) = allow {
        let vc = normalize_addr(&intent.verifying_contract);
        if !set.contains(&vc) {
            return Err("verifying_contract not allowlisted".to_string());
        }
    }

    let deny_raw = env::var("SIGNER_BLACKLIST").ok();
    if let Some(raw) = deny_raw.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        let deny = parse_addr_set(raw);
        let signer = normalize_addr(&intent.signer);
        if deny.contains(&signer) {
            return Err("signer blacklisted".to_string());
        }
    }

    Ok(())
}

fn validate_intent_shape(intent: &SignedIntent) -> Result<(), String> {
    if intent.verifying_contract.trim().is_empty() {
        return Err("verifying_contract empty".to_string());
    }
    if intent.signer.trim().is_empty() {
        return Err("signer empty".to_string());
    }
    if intent.signature.trim().is_empty() {
        return Err("signature empty".to_string());
    }
    if intent.typed_data.is_null() {
        return Err("typed_data null".to_string());
    }
    if let Some(expected) = env_chain_id() {
        if intent.chain_id != expected {
            return Err(format!(
                "chain_id mismatch: expected={} got={}",
                expected, intent.chain_id
            ));
        }
    }
    Ok(())
}

async fn post_order_confirm_completion_intent(
    Path(order_id): Path<String>,
    axum::extract::State(state): axum::extract::State<ApiMetaState>,
    headers: HeaderMap,
    Json(intent): Json<SignedIntent>,
) -> impl IntoResponse {
    if let Err(e) = validate_intent_shape(&intent) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status":"invalid_intent","error":e})),
        )
            .into_response();
    }
    if let Err(e) = validate_intent_policy(&intent, state.strict_ssot) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({"status":"intent_blocked","error":e})),
        )
            .into_response();
    }

    let outbox_dir = env::var("OUTBOX_DIR").unwrap_or_else(|_| "data/outbox".to_string());
    let outbox = FileOutbox::new(outbox_dir);

    let req_id = headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown")
        .to_string();
    let msg_id = headers
        .get("x-message-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown")
        .to_string();
    let idem_key = headers
        .get("Idempotency-Key")
        .or_else(|| headers.get("X-Idempotency-Key"))
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let mut item = OutboxItem::new(
        "order.confirm_completion_intent",
        json!({
            "order_id": order_id,
            "intent": intent,
            "audit": {
                "x_request_id": req_id,
                "x_message_id": msg_id
            }
        }),
    );
    item.idempotency_key = idem_key;
    let enqueued = match outbox.enqueue(item) {
        Ok(i) => i,
        Err(e) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"outbox_persist_failed","error": e.to_string()})),
            )
                .into_response();
        }
    };

    (
        StatusCode::ACCEPTED,
        Json(json!({
            "status": "accepted",
            "rule": "仅记录签名 intent 并进入 outbox；链上交易/状态推进由执行器完成，前端必须以查询结果为准",
            "outbox_item_id": enqueued.id
        })),
    )
        .into_response()
}

async fn post_order_open_dispute_intent(
    Path(order_id): Path<String>,
    axum::extract::State(state): axum::extract::State<ApiMetaState>,
    headers: HeaderMap,
    Json(intent): Json<SignedIntent>,
) -> impl IntoResponse {
    if let Err(e) = validate_intent_shape(&intent) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status":"invalid_intent","error":e})),
        )
            .into_response();
    }
    if let Err(e) = validate_intent_policy(&intent, state.strict_ssot) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({"status":"intent_blocked","error":e})),
        )
            .into_response();
    }

    let outbox_dir = env::var("OUTBOX_DIR").unwrap_or_else(|_| "data/outbox".to_string());
    let outbox = FileOutbox::new(outbox_dir);

    let req_id = headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown")
        .to_string();
    let msg_id = headers
        .get("x-message-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown")
        .to_string();
    let idem_key = headers
        .get("Idempotency-Key")
        .or_else(|| headers.get("X-Idempotency-Key"))
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let mut item = OutboxItem::new(
        "order.open_dispute_intent",
        json!({
            "order_id": order_id,
            "intent": intent,
            "audit": {
                "x_request_id": req_id,
                "x_message_id": msg_id
            }
        }),
    );
    item.idempotency_key = idem_key;
    let enqueued = match outbox.enqueue(item) {
        Ok(i) => i,
        Err(e) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"outbox_persist_failed","error": e.to_string()})),
            )
                .into_response();
        }
    };

    (
        StatusCode::ACCEPTED,
        Json(json!({
            "status": "accepted",
            "rule": "仅记录签名 intent 并进入 outbox；链上交易/状态推进由执行器完成，前端必须以查询结果为准",
            "outbox_item_id": enqueued.id
        })),
    )
        .into_response()
}

async fn post_dispute_execute_resolution_intent(
    Path(dispute_id): Path<String>,
    axum::extract::State(state): axum::extract::State<ApiMetaState>,
    headers: HeaderMap,
    Json(intent): Json<SignedIntent>,
) -> impl IntoResponse {
    if let Err(e) = validate_intent_shape(&intent) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status":"invalid_intent","error":e})),
        )
            .into_response();
    }
    if let Err(e) = validate_intent_policy(&intent, state.strict_ssot) {
        return (
            StatusCode::FORBIDDEN,
            Json(json!({"status":"intent_blocked","error":e})),
        )
            .into_response();
    }

    let outbox_dir = env::var("OUTBOX_DIR").unwrap_or_else(|_| "data/outbox".to_string());
    let outbox = FileOutbox::new(outbox_dir);

    let req_id = headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown")
        .to_string();
    let msg_id = headers
        .get("x-message-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown")
        .to_string();
    let idem_key = headers
        .get("Idempotency-Key")
        .or_else(|| headers.get("X-Idempotency-Key"))
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    // Rule: this endpoint MUST NOT directly advance dispute/order state.
    // It only persists an execute_resolution work item for an executor to process.
    let mut item = OutboxItem::new(
        "dispute.execute_resolution",
        json!({
            "dispute_id": dispute_id,
            "intent": intent,
            "audit": {
                "x_request_id": req_id,
                "x_message_id": msg_id
            }
        }),
    );
    item.idempotency_key = idem_key;

    let enqueued = match outbox.enqueue(item) {
        Ok(i) => i,
        Err(e) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"status":"outbox_persist_failed","error": e.to_string()})),
            )
                .into_response();
        }
    };

    (
        StatusCode::ACCEPTED,
        Json(json!({
            "status": "accepted",
            "rule": "仅进入 outbox；链上交易/资金划转/状态推进必须由执行器以固定重试策略完成，失败不得离线手工推进",
            "outbox_item_id": enqueued.id
        })),
    )
        .into_response()
}

fn not_impl_json(path: &str) -> impl IntoResponse {
    (
        StatusCode::NOT_IMPLEMENTED,
        Json(json!({
            "status": "not_implemented",
            "path": path,
            "doc": "04 §三"
        })),
    )
}

async fn not_impl_guides_id(Path(id): Path<String>) -> impl IntoResponse {
    not_impl_json(&format!("/api/v1/guides/{}", id))
}
async fn not_impl_evidence(Path(id): Path<String>) -> impl IntoResponse {
    not_impl_json(&format!("/api/v1/orders/{}/evidence", id))
}
async fn not_impl_auth() -> impl IntoResponse {
    not_impl_json("/auth/*")
}
async fn not_impl_v1() -> impl IntoResponse {
    not_impl_json("/api/v1/*")
}
