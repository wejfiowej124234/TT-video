//! **STRICT_SSOT** / **SSOT_SHA256** / **`--ssot-runtime-check`** / **CHARGEBACK_POLICY** 启动闸（自 **`run.rs`** 抽出，48 模块化）。

use std::path::PathBuf;

use crate::ssot;

/// **`run()`** 前半段 SSOT 与 chargeback 显式配置快照（供 **`startup_snapshot`** / **`ApiMetaState`**）。
pub(crate) struct StartupSsotEnv {
    pub strict_ssot: bool,
    pub ssot_version: String,
    pub ssot_sha256_expected: Option<String>,
    pub ssot_sha256_computed: Option<String>,
    pub ssot_sha256_match: bool,
    pub chargeback_policy: String,
}

/// 与原先 **`run.rs`** 行为一致：不满足 **`STRICT_SSOT`** / **`CHECK_SSOT`** 时 **`process::exit(1)`**。
pub(crate) fn enforce_startup_ssot_and_chargeback(args: &[String]) -> StartupSsotEnv {
    let strict_ssot = std::env::var("STRICT_SSOT").as_deref() == Ok("1")
        || std::env::var("CHECK_SSOT").as_deref() == Ok("1");

    let ssot_version = std::env::var("SSOT_VERSION").unwrap_or_else(|_| "unset".to_string());
    if strict_ssot && ssot_version == "unset" {
        eprintln!("STRICT_SSOT/CHECK_SSOT=1: SSOT_VERSION 未设置，拒绝启动");
        std::process::exit(1);
    };    let ssot_sha256_expected = std::env::var("SSOT_SHA256").ok();
    let ssot_doc_path = PathBuf::from("docs/spec/08-3-参数与门禁表.md");
    let (ssot_sha256_computed, ssot_sha256_match) =
        match ssot::compute_file_sha256_hex(&ssot_doc_path) {
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
                "STRICT_SSOT/CHECK_SSOT=1: 必须设置 SSOT_SHA256，并与 docs/spec/08-3-参数与门禁表.md sha256 一致"
            );
            std::process::exit(1);
        };        let Some(computed) = ssot_sha256_computed.as_deref() else {
            eprintln!(
                "STRICT_SSOT/CHECK_SSOT=1: 无法计算 docs/spec/08-3-参数与门禁表.md sha256；请确保运行时包含该文件（或调整部署方式以提供可校验的 SSOT 副本）"
            );
            std::process::exit(1);
        };        if !expected.eq_ignore_ascii_case(computed) {
            eprintln!(
                "STRICT_SSOT/CHECK_SSOT=1: SSOT_SHA256 不匹配 computed={} expected={}，拒绝启动",
                computed, expected
            );
            std::process::exit(1);
        }
    };
    if args.iter().any(|a| a == "--ssot-runtime-check") {
        let code = ssot::run_ssot_runtime_check(strict_ssot, &ssot_version);
        std::process::exit(code);
    };    let chargeback_policy =
        std::env::var("CHARGEBACK_POLICY").unwrap_or_else(|_| "unset".to_string());
    if strict_ssot && chargeback_policy == "unset" {
        eprintln!(
            "STRICT_SSOT/CHECK_SSOT=1: CHARGEBACK_POLICY 未设置，拒绝启动（08-3 chargebackPolicy 为关键 param_key，运行时必须显式配置）"
        );
        std::process::exit(1);
    }

    StartupSsotEnv {
        strict_ssot,
        ssot_version,
        ssot_sha256_expected,
        ssot_sha256_computed,
        ssot_sha256_match,
        chargeback_policy,
    }
}
