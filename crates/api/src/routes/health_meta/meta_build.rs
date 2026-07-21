//! `build` / `meta_build_value` / startup 日志同源（120/140、730）。
//! Runtime Attestation：`psg_release_version` · `image_digest` · `build_time` · `contract_profile`.

use std::env;

use serde_json::json;

use super::meta_contract_keys::{format_meta_build_top_keys_contract_730, META_BUILD_TOP_KEYS};

const DEFAULT_PSG_RELEASE_VERSION: &str = "PSG-REL-20260722-STAGING-ALIGN-W0";
const DEFAULT_CONTRACT_PROFILE: &str = "v311_fund_safety_candidate_v2";

fn env_nonempty(keys: &[&str]) -> Option<String> {
    for k in keys {
        if let Ok(v) = env::var(k) {
            let t = v.trim();
            if !t.is_empty() {
                return Some(t.to_string());
            }
        }
    }
    None
}

/// Flat release identity for GET `/meta/release-identity` and Version Gate STRICT.
/// Includes Data/CMS baseline fields for eight-axis checks (env-injected at deploy).
pub fn release_identity_value() -> serde_json::Value {
    let build = meta_build_value();
    let artifact_sha = env_nonempty(&[
        "TRAVELTRUST_ARTIFACT_SHA",
        "TT_ARTIFACT_SHA",
    ])
    .unwrap_or_else(|| {
        build
            .get("git_sha")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string()
    });
    let database_baseline = env_nonempty(&[
        "TRAVELTRUST_DATABASE_BASELINE",
        "TT_DATABASE_BASELINE",
    ])
    .unwrap_or_else(|| "staging_rc_ssot_alignment.v1#expected_staging_surface".to_string());
    let cms_baseline = env_nonempty(&["TRAVELTRUST_CMS_BASELINE", "TT_CMS_BASELINE"])
        .unwrap_or_else(|| "public_display_10x4 + catalog_bake=1".to_string());
    json!({
        "psg_release_version": build.get("psg_release_version").cloned().unwrap_or(json!("unknown")),
        "git_sha": build.get("git_sha").cloned().unwrap_or(json!("unknown")),
        "artifact_sha": artifact_sha,
        "image_digest": build.get("image_digest").cloned().unwrap_or(json!("unknown")),
        "build_time": build.get("build_time").cloned().unwrap_or(json!(null)),
        "contract_profile": build.get("contract_profile").cloned().unwrap_or(json!("unknown")),
        "database_baseline": database_baseline,
        "cms_baseline": cms_baseline,
        "attestation_status": build.get("attestation_status").cloned().unwrap_or(json!("unknown")),
    })
}

/// 120/140：发布证据与运行实例对齐。`git_sha` 优先运行时注入，否则编译期，均无则 `"unknown"`。
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
    let deployment_profile = env_nonempty(&["TRAVELTRUST_DEPLOYMENT_PROFILE"]);
    let psg_release_version = env_nonempty(&[
        "TRAVELTRUST_PSG_RELEASE_VERSION",
        "PSG_RELEASE_VERSION",
    ])
    .unwrap_or_else(|| DEFAULT_PSG_RELEASE_VERSION.to_string());
    let image_digest = env_nonempty(&[
        "TRAVELTRUST_IMAGE_DIGEST",
        "TT_RUNTIME_IMAGE_SHA",
        "FLY_IMAGE_REF",
        "IMAGE_DIGEST",
    ])
    .unwrap_or_else(|| "unknown".to_string());
    let build_time = env_nonempty(&[
        "TRAVELTRUST_BUILD_TIME",
        "TRAVELTRUST_DEPLOYED_AT",
        "DEPLOYED_AT",
        "BUILD_TIME",
    ])
    .or_else(|| dep.clone());
    let contract_profile = env_nonempty(&[
        "TRAVELTRUST_CONTRACT_PROFILE",
        "CONTRACT_PROFILE",
        "ACTIVE_DEPLOY_BASELINE",
    ])
    .unwrap_or_else(|| DEFAULT_CONTRACT_PROFILE.to_string());

    let attestation_status = if sha == "unknown" || image_digest == "unknown" {
        "unknown"
    } else {
        "ok"
    };

    json!({
        "git_sha": sha,
        "deployed_at": dep,
        "deployment_profile": deployment_profile,
        "psg_release_version": psg_release_version,
        "image_digest": image_digest,
        "build_time": build_time,
        "contract_profile": contract_profile,
        "attestation_status": attestation_status,
        "rule": "120/140 + Runtime Attestation：注入 TRAVELTRUST_GIT_SHA、TRAVELTRUST_PSG_RELEASE_VERSION、TRAVELTRUST_IMAGE_DIGEST、TRAVELTRUST_BUILD_TIME、TRAVELTRUST_CONTRACT_PROFILE；attestation_status=unknown → Version Gate STRICT BLOCK"
    })
}

/// 与 GET `/meta` 的 **`build`**、**`startup_snapshot` · `META_BUILD_*`** 同源。**730**：含 **`build_top_keys`** / **`build_top_keys_contract_730`**。
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
            "；730 GET /meta build 对象 build_top_keys / build_top_keys_contract_730 与 META_BUILD_TOP_KEYS 顺序同源";
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

/// 与 GET `/meta` 响应中 `build` 块同源，写入 `startup_snapshot` 一行。
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
