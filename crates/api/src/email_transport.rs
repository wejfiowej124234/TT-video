//! 出站邮件：**`TRAVELTRUST_EMAIL_TRANSPORT`**
//! — **`off`**（默认，禁用出站；忘记密码 **503**）|
//! **`log`**（stderr 单行 JSON，可观测）|
//! **`resend`**（[Resend](https://resend.com) **HTTPS** `POST /emails`，见 **`email_transport_resend`**）。
//! **`auth_email_tokens`** 仍仅存 **HMAC**；**raw** 仅经 HTTPS 发往 provider，**不入库**。

use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EmailTransport {
    Off,
    Log,
    Resend,
}

pub fn read_email_transport() -> EmailTransport {
    let v = std::env::var("TRAVELTRUST_EMAIL_TRANSPORT")
        .unwrap_or_default()
        .trim()
        .to_ascii_lowercase();
    if v == "log" {
        EmailTransport::Log
    } else if v == "resend" {
        EmailTransport::Resend
    } else {
        EmailTransport::Off
    }
}

/// 允许的前端域名白名单（逗号分隔，支持完整 base URL 或仅 host）。
/// 未设置时仅允许 `localhost` / `127.0.0.1`（防默认值被带到公网域名）。
pub fn read_public_app_base_allowlist() -> Vec<String> {
    std::env::var("TRAVELTRUST_PUBLIC_APP_BASE_URL_ALLOWLIST")
        .ok()
        .map(|raw| {
            raw.split(',')
                .map(|s| s.trim().to_ascii_lowercase())
                .filter(|s| !s.is_empty())
                .collect::<Vec<_>>()
        })
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| vec!["localhost".to_string(), "127.0.0.1".to_string()])
}

/// 校验公开链接基址是否命中 allowlist；失败时返回 false，调用方应 fail-closed。
pub fn is_public_app_base_url_allowed(base: &str, allowlist: &[String]) -> bool {
    let parsed = match url::Url::parse(base) {
        Ok(v) => v,
        Err(_) => return false,
    };
    let host = match parsed.host_str() {
        Some(h) => h.to_ascii_lowercase(),
        None => return false,
    };
    let normalized_base = base.trim().trim_end_matches('/').to_ascii_lowercase();
    allowlist.iter().any(|allowed| {
        if allowed.contains("://") {
            normalized_base == allowed.trim_end_matches('/')
        } else {
            host == *allowed
        }
    })
}

/// 前端验证页/重置页基址（无尾斜杠）；未设置时默认本地 Next。
pub fn read_public_app_base_url() -> String {
    std::env::var("TRAVELTRUST_PUBLIC_APP_BASE_URL")
        .ok()
        .map(|s| s.trim().trim_end_matches('/').to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "http://localhost:3000".to_string())
}

/// HMAC-SHA256(pepper, raw_token) hex；pepper 须为足够长的机密串（见 Runbook）。
pub fn auth_token_pepper() -> Option<String> {
    std::env::var("TRAVELTRUST_AUTH_TOKEN_PEPPER")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

pub fn hash_raw_email_token(raw: &str, pepper: &str) -> String {
    use hmac::{Hmac, Mac};
    use sha2::Sha256;
    type HmacSha256 = Hmac<Sha256>;
    let mut mac = HmacSha256::new_from_slice(pepper.as_bytes()).expect("HMAC key length");
    mac.update(raw.as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

pub fn gen_opaque_raw_token() -> String {
    format!("{}{}", Uuid::new_v4().simple(), Uuid::new_v4().simple())
}

pub fn log_outbound_auth_email(kind: &str, to_email: &str, subject: &str, url: &str) {
    eprintln!(
        "{}",
        json!({
            "traveltrust_email_outbound": true,
            "kind": kind,
            "to": to_email,
            "subject": subject,
            "url": url,
        })
    );
}

/// **`cfg(test)` only**：`issue_and_send_password_reset` 在 **`insert_token`** 成功后写入一次性 **`raw`**，供 **`auth_register_login_logout_db_api_tests`** 等 **`Router::oneshot`** 用例消费（**生产二进制不包含**）。
#[cfg(test)]
mod password_reset_raw_for_it {
    use std::sync::Mutex;
    pub(super) static RAW: Mutex<Option<String>> = Mutex::new(None);
}

#[cfg(test)]
pub fn test_capture_password_reset_raw_for_it(raw: &str) {
    *password_reset_raw_for_it::RAW
        .lock()
        .expect("password_reset_raw_for_it lock") = Some(raw.to_string());
}

#[cfg(test)]
pub fn test_take_password_reset_raw_for_it() -> Option<String> {
    password_reset_raw_for_it::RAW
        .lock()
        .expect("password_reset_raw_for_it lock")
        .take()
}

/// **`cfg(test)` only**：`issue_and_send_email_verify` 在 **`insert_token`** 成功后写入 **`raw`**，供 **`auth_register_login_logout_db_api_tests`** **`POST /auth/verify-email`** **PG·oneshot** 消费。
#[cfg(test)]
mod email_verify_raw_for_it {
    use std::sync::Mutex;
    pub(super) static RAW: Mutex<Option<String>> = Mutex::new(None);
}

#[cfg(test)]
pub fn test_capture_email_verify_raw_for_it(raw: &str) {
    *email_verify_raw_for_it::RAW
        .lock()
        .expect("email_verify_raw_for_it lock") = Some(raw.to_string());
}

#[cfg(test)]
pub fn test_take_email_verify_raw_for_it() -> Option<String> {
    email_verify_raw_for_it::RAW
        .lock()
        .expect("email_verify_raw_for_it lock")
        .take()
}

#[cfg(test)]
mod read_email_transport_tests {
    use super::read_email_transport;
    use super::EmailTransport;

    fn with_transport<T>(value: Option<&'static str>, f: impl FnOnce() -> T) -> T {
        let _guard = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
        let prev = std::env::var("TRAVELTRUST_EMAIL_TRANSPORT").ok();
        match value {
            Some(v) => std::env::set_var("TRAVELTRUST_EMAIL_TRANSPORT", v),
            None => std::env::remove_var("TRAVELTRUST_EMAIL_TRANSPORT"),
        }
        let out = f();
        match prev {
            Some(v) => std::env::set_var("TRAVELTRUST_EMAIL_TRANSPORT", v),
            None => std::env::remove_var("TRAVELTRUST_EMAIL_TRANSPORT"),
        }
        out
    }

    #[test]
    fn only_log_and_resend_are_active_transports() {
        assert_eq!(
            with_transport(None, read_email_transport),
            EmailTransport::Off
        );
        assert_eq!(
            with_transport(Some(""), read_email_transport),
            EmailTransport::Off
        );
        assert_eq!(
            with_transport(Some("off"), read_email_transport),
            EmailTransport::Off
        );
        assert_eq!(
            with_transport(Some("OFF"), read_email_transport),
            EmailTransport::Off
        );
        assert_eq!(
            with_transport(Some("log"), read_email_transport),
            EmailTransport::Log
        );
        assert_eq!(
            with_transport(Some(" Log "), read_email_transport),
            EmailTransport::Log
        );
        assert_eq!(
            with_transport(Some("resend"), read_email_transport),
            EmailTransport::Resend
        );
        assert_eq!(
            with_transport(Some("RESEND"), read_email_transport),
            EmailTransport::Resend
        );
    }

    /// 常见文档/示例误配：**`smtp`** 在实现中等价于 **未识别 → Off**（忘记密码 **503**），须用 **`resend`** 或 **`log`**。
    #[test]
    fn smtp_typo_maps_to_off_not_a_hidden_transport() {
        assert_eq!(
            with_transport(Some("smtp"), read_email_transport),
            EmailTransport::Off
        );
        assert_eq!(
            with_transport(Some("SMTP"), read_email_transport),
            EmailTransport::Off
        );
    }
}

#[cfg(test)]
mod resend_from_env_key_tests {
    use crate::email_transport_resend::read_resend_from;

    #[test]
    fn resend_from_ignores_traveltrust_email_from() {
        let _guard = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
        let prev_resend = std::env::var("TRAVELTRUST_RESEND_FROM").ok();
        let prev_email_from = std::env::var("TRAVELTRUST_EMAIL_FROM").ok();
        std::env::remove_var("TRAVELTRUST_RESEND_FROM");
        std::env::set_var(
            "TRAVELTRUST_EMAIL_FROM",
            "Only From <only-from@example.com>",
        );
        assert!(
            read_resend_from().is_none(),
            "TRAVELTRUST_EMAIL_FROM must not satisfy Resend from; use TRAVELTRUST_RESEND_FROM"
        );
        std::env::set_var(
            "TRAVELTRUST_RESEND_FROM",
            "TravelTrust <noreply@example.com>",
        );
        assert_eq!(
            read_resend_from().as_deref(),
            Some("TravelTrust <noreply@example.com>")
        );
        match prev_resend {
            Some(v) => std::env::set_var("TRAVELTRUST_RESEND_FROM", v),
            None => std::env::remove_var("TRAVELTRUST_RESEND_FROM"),
        }
        match prev_email_from {
            Some(v) => std::env::set_var("TRAVELTRUST_EMAIL_FROM", v),
            None => std::env::remove_var("TRAVELTRUST_EMAIL_FROM"),
        }
    }
}
