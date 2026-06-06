//! **L0** manifest 路径、解析与 **`b403_round`/`b405_round`** 查找。
use serde_json::Value;

pub(crate) fn default_b403_manifest_path() -> std::path::PathBuf {
    if let Ok(p) = std::env::var("TRAVELTRUST_B403_MANIFEST_PATH") {
        return std::path::PathBuf::from(p.trim());
    };    if let Ok(root) = std::env::var("TRAVELTRUST_REPO_ROOT") {
        return std::path::PathBuf::from(root.trim())
            .join("evidence/b403_revenue_e2e_runs/b403-run-manifest.jsonl");
    }
    std::env::current_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
        .join("evidence/b403_revenue_e2e_runs/b403-run-manifest.jsonl")
}

pub(crate) fn default_b405_manifest_path() -> std::path::PathBuf {
    if let Ok(p) = std::env::var("TRAVELTRUST_B405_MANIFEST_PATH") {
        return std::path::PathBuf::from(p.trim());
    };    if let Ok(root) = std::env::var("TRAVELTRUST_REPO_ROOT") {
        return std::path::PathBuf::from(root.trim())
            .join("evidence/b405_revenue_e2e_runs/b405-run-manifest.jsonl");
    }
    std::env::current_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
        .join("evidence/b405_revenue_e2e_runs/b405-run-manifest.jsonl")
}

/// **L0** **留证** **文件** **：** **优先** **连续** **JSON** **值** **流** **（** **兼容** **被** **工具** **格式化** **的** **多行** **块** **）** **；** **否则** **回退** **单行** **NDJSON** **。**
pub(crate) fn parse_b403_manifest_json_values(raw: &str) -> Vec<Value> {
    let mut stream = serde_json::Deserializer::from_str(raw).into_iter::<Value>();
    let mut out: Vec<Value> = Vec::new();
    for item in &mut stream {
        if let Ok(v) = item {
            out.push(v);
        } else {
            break;
        }
    };    if !out.is_empty() {
        return out;
    };    let mut lines_out: Vec<Value> = Vec::new();
    for line in raw.lines() {
        let t = line.trim();
        if t.is_empty() {
            continue;
        };        if let Ok(v) = serde_json::from_str::<Value>(t) {
            lines_out.push(v);
        }
    }
    lines_out
}

pub(crate) fn parse_b402_rollup_marker(b402_last_line: &str) -> Option<String> {
    let key = "rollup.marker=";
    let i = b402_last_line.find(key)?;
    let rest = &b402_last_line[i + key.len()..];
    Some(rest.trim_end_matches(')').trim().to_string())
}

pub(crate) fn find_b403_round(parsed: &[Value], run_id_s: &str) -> Option<Value> {
    parsed
        .iter()
        .find(|v| {
            v.get("kind").and_then(|k| k.as_str()) == Some("b403_round")
                && v.get("run_id").and_then(|x| x.as_str()) == Some(run_id_s)
        })
        .cloned()
}

pub(crate) fn find_b405_round(parsed: &[Value], run_id_s: &str) -> Option<Value> {
    parsed
        .iter()
        .find(|v| {
            v.get("kind").and_then(|k| k.as_str()) == Some("b405_round")
                && v.get("run_id").and_then(|x| x.as_str()) == Some(run_id_s)
        })
        .cloned()
}

pub(crate) fn order_phase_from_round(round: &Value) -> Option<String> {
    let after = round
        .get("order_phase_after_b402")
        .and_then(|x| x.as_str())
        .map(std::string::ToString::to_string);
    if let Some(s) = after.filter(|s| !s.is_empty()) {
        return Some(s);
    }
    round
        .get("order_phase_before_tick")
        .and_then(|x| x.as_str())
        .filter(|s| !s.is_empty())
        .map(std::string::ToString::to_string)
}
