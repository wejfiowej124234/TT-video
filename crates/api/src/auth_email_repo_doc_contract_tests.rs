//! 仓库级契约：**auth 出站邮件** 的 **`.env.example` / `.env.preprod.local.example`** 与 **`traveltrust-api`** 实现（仅 **`off`/`log`/`resend`**）对齐。
//!
//! 目的：防止文档/示例再次引入 **`TRAVELTRUST_EMAIL_TRANSPORT=smtp`** 或「**`TRAVELTRUST_EMAIL_FROM` 可代替 Resend `from`**」等漂移；**不**替代 Resend HTTPS 真投递手检。

use std::fs;
use std::path::PathBuf;

fn workspace_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .expect("CARGO_MANIFEST_DIR/../../ should be repo root")
}

fn read_repo_file(rel: &str) -> String {
    let p = workspace_root().join(rel);
    fs::read_to_string(&p).unwrap_or_else(|e| panic!("read {}: {e}", p.display()))
}

#[test]
fn dot_env_example_documents_resend_from_and_email_from_split() {
    let s = read_repo_file(".env.example");
    assert!(
        s.contains("TRAVELTRUST_RESEND_FROM"),
        ".env.example must document TRAVELTRUST_RESEND_FROM for Resend"
    );
    assert!(
        s.contains("TRAVELTRUST_RESEND_API_KEY"),
        ".env.example must document TRAVELTRUST_RESEND_API_KEY"
    );
    // 防回归：易混说明（中文「不由」或英文 does not / only）
    assert!(
        s.contains("不由") || s.contains("does not substitute") || s.contains("仅此变量"),
        ".env.example must warn that TRAVELTRUST_EMAIL_FROM is not the Resend from source"
    );
}

#[test]
fn dot_env_preprod_example_uses_resend_not_smtp_as_active_transport() {
    let s = read_repo_file(".env.preprod.local.example");
    for line in s.lines() {
        let t = line.trim();
        if t.starts_with('#') || t.is_empty() {
            continue;
        }
        assert!(
            !t.starts_with("TRAVELTRUST_EMAIL_TRANSPORT=smtp"),
            ".env.preprod.local.example must not set TRAVELTRUST_EMAIL_TRANSPORT=smtp (API has no SMTP transport; use resend)"
        );
        assert!(
            !t.starts_with("SMTP_HOST=") && !t.starts_with("SMTP_PORT="),
            ".env.preprod.local.example must not require SMTP_* for traveltrust-api (removed misaligned block)"
        );
    }
    assert!(
        s.contains("TRAVELTRUST_EMAIL_TRANSPORT=resend"),
        ".env.preprod.local.example should document resend for real outbound"
    );
}

#[test]
fn doc_96_09_does_not_regress_to_bare_email_transport_env_name() {
    let s = read_repo_file(concat!("docs", "/spec/", "96-09-消息通知与异步任务.md"));
    // 误写 `EMAIL_TRANSPORT`（无 TRAVELTRUST_ 前缀）易与实现脱节；允许出现在「更正误写」changelog 行。
    let mut offenders = Vec::new();
    for (i, line) in s.lines().enumerate() {
        if line.contains("`EMAIL_TRANSPORT`") && !line.contains("误写") && !line.contains("更正")
        {
            offenders.push((i + 1, line.to_string()));
        }
    }
    assert!(
        offenders.is_empty(),
        "96-09 must not document bare EMAIL_TRANSPORT as the API env key (use TRAVELTRUST_EMAIL_TRANSPORT). Offenders: {offenders:?}"
    );
}
