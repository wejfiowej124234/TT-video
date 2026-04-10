//! `build` / `meta_build_value` / startup 日志同源（120/140、730）。

use std::env;

use serde_json::json;

use super::meta_contract_keys::{format_meta_build_top_keys_contract_730, META_BUILD_TOP_KEYS};

/// 120/140：发布证据与运行实例对齐。`git_sha` 优先运行时 `TRAVELTRUST_GIT_SHA` / `GIT_COMMIT_SHA` / `SOURCE_VERSION`，否则编译期 `TRAVELTRUST_BUILD_GIT_SHA`（`cargo build` 前 export），均无则 `"unknown"`。`deployed_at` 可选 ISO8601（`TRAVELTRUST_DEPLOYED_AT` 或 `DEPLOYED_AT`）。
pub(crate) fn meta_build_snapshot(
    runtime_git_sha: Option<String>,
    compile_git_sha: Option<&'static str>,
    deployed_at: Option<String>,
) -> serde_json::Value {
    let sha = runtime_git_sha
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string())
        .or_else(|| {
            compile_git_sha
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string())
        })
        .unwrap_or_else(|| "unknown".to_string());
    let dep = deployed_at
        .as_ref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());
    json!({
        "git_sha": sha,
        "deployed_at": dep,
        "rule": "120/140：预发/生产建议在容器或进程注入 TRAVELTRUST_GIT_SHA（或 GIT_COMMIT_SHA、SOURCE_VERSION）与 TRAVELTRUST_DEPLOYED_AT（UTC ISO8601）；镜像构建可在 cargo 前 export TRAVELTRUST_BUILD_GIT_SHA 写入编译期兜底"
    })
}

/// 与 GET `/meta` 的 **`build`**、**`startup_snapshot` · `META_BUILD_*`** 同源（单一事实来源）。**730**：返回体含 **`build_top_keys`** / **`build_top_keys_contract_730`**（**`META_BUILD_TOP_KEYS`** 五键顺序），与 **`GET /meta/build`** 一致。
pub fn meta_build_value() -> serde_json::Value {
    let runtime_git_sha = env::var("TRAVELTRUST_GIT_SHA")
        .or_else(|_| env::var("GIT_COMMIT_SHA"))
        .or_else(|_| env::var("SOURCE_VERSION"))
        .ok();
    let deployed_at = env::var("TRAVELTRUST_DEPLOYED_AT")
        .or_else(|_| env::var("DEPLOYED_AT"))
        .ok();
    attach_meta_build_top_keys_contract_730(meta_build_snapshot(
        runtime_git_sha,
        option_env!("TRAVELTRUST_BUILD_GIT_SHA"),
        deployed_at,
    ))
}

fn attach_meta_build_top_keys_contract_730(mut v: serde_json::Value) -> serde_json::Value {
    if let Some(obj) = v.as_object_mut() {
        let append =
            "；730 GET /meta build 对象 build_top_keys / build_top_keys_contract_730 与 META_BUILD_TOP_KEYS 五键顺序同源";
        if let Some(serde_json::Value::String(r)) = obj.get_mut("rule") {
            r.push_str(append);
        }
        let keys730: serde_json::Value = serde_json::to_value(META_BUILD_TOP_KEYS)
            .expect("META_BUILD_TOP_KEYS serializes to JSON array");
        obj.insert("build_top_keys".to_string(), keys730);
        obj.insert(
            "build_top_keys_contract_730".to_string(),
            serde_json::Value::String(format_meta_build_top_keys_contract_730()),
        );
    }
    v
}

/// 与 GET `/meta` 响应中 `build` 块同源，写入 `startup_snapshot` 一行（15 附录〇、Runbook；目标环境 evidence 可 grep）。
pub fn meta_build_for_startup_log() -> (String, String) {
    let v = meta_build_value();
    let sha = v["git_sha"].as_str().unwrap_or("unknown").to_string();
    let dep_label = match &v["deployed_at"] {
        serde_json::Value::String(s) => {
            let t = s.trim();
            if t.is_empty() {
                "unset".to_string()
            } else {
                t.to_string()
            }
        }
        serde_json::Value::Null => "unset".to_string(),
        _ => "unset".to_string(),
    };
    (sha, dep_label)
}
