//! SSOT 运行时校验与文件工具（从 main 拆出，48 §4.1）

use chrono::{DateTime, Utc};
use serde::Serialize;
use sha2::Digest;
use std::collections::HashMap;
use std::env;
use std::fs;
use std::io::Write;

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

pub fn compute_file_sha256_hex(path: &std::path::Path) -> Result<String, String> {
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
        if line.contains("| param_key ") || line.starts_with("|---") {
            continue;
        }
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() < 3 {
            continue;
        }
        let cell = ssot_strip_markdown_cell(parts[1]);
        if cell.is_empty() || cell.starts_with('(') {
            continue;
        }
        for raw in cell.replace('，', " , ").replace('、', " , ").split(',') {
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
        if !line.starts_with('|') || line.contains("| param_key ") || line.starts_with("|---") {
            continue;
        }
        let parts: Vec<&str> = line.split('|').collect();
        if parts.len() < 6 {
            continue;
        }
        let key = ssot_strip_markdown_cell(parts[1]);
        let value = ssot_strip_markdown_cell(parts[4]);
        if !key.is_empty() {
            map.insert(key, value);
        }
    }
    map
}

fn json_value_to_string(v: &serde_json::Value) -> String {
    match v {
        serde_json::Value::Null => "null".to_string(),
        serde_json::Value::Bool(b) => b.to_string(),
        serde_json::Value::Number(n) => n.to_string(),
        serde_json::Value::String(s) => s.to_string(),
        serde_json::Value::Array(arr) => arr
            .iter()
            .map(json_value_to_string)
            .collect::<Vec<_>>()
            .join(","),
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

pub fn append_jsonl(path: &std::path::Path, line: &str) -> Result<(), String> {
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

pub fn write_bytes_atomic(path: &std::path::Path, bytes: &[u8]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("mkdir {}: {}", parent.display(), e))?;
    }
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, bytes).map_err(|e| format!("write {}: {}", tmp.display(), e))?;
    let bak = path.with_extension("json.bak");
    if path.exists() {
        let _ = fs::remove_file(&bak);
        if let Err(e) = fs::rename(path, &bak) {
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

/// 返回 0=ok, 1=读失败, 2=drift+strict, 3=运行时快照读失败+strict
pub fn run_ssot_runtime_check(strict: bool, ssot_version: &str) -> i32 {
    let ssot_doc_path =
        env::var("SSOT_DOC_PATH").unwrap_or_else(|_| "docs/spec/08-3-参数与门禁表.md".to_string());
    let runtime_snapshot_path = env::var("RUNTIME_PARAM_SNAPSHOT_PATH")
        .unwrap_or_else(|_| "data/runtime_params.json".to_string());
    let last_snapshot_path = env::var("SSOT_RUNTIME_LAST_SNAPSHOT_PATH")
        .unwrap_or_else(|_| "data/runtime_params_last.json".to_string());
    let audit_log_path = env::var("SSOT_RUNTIME_AUDIT_LOG_PATH")
        .unwrap_or_else(|_| "data/ssot_runtime_audit.jsonl".to_string());

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
        eprintln!(
            "FAIL: 无法从 08-3 提取映射 key 列表（标题或表格格式可能被破坏）：{}",
            ssot_doc_path
        );
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

    if let Ok(line) = serde_json::to_string(&entry) {
        let _ = append_jsonl(&audit_log_pathbuf, &line);
    }
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
        println!(
            "OK: SSOT runtime check passed (keys={} strict={})",
            mapping_keys.len(),
            strict
        );
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
