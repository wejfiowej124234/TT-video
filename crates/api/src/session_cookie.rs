//! 会话 **HttpOnly** Cookie：默认名 **`traveltrust_session_token`**；生产可选 **`__Host-traveltrust_session`**（须 **`TRAVELTRUST_COOKIE_SECURE=1`**）。
//! 签发/清除/解析与 **`routes/me.rs`、`state`、`chain_off::auth_logout`** 同源。

use axum::http::HeaderMap;

pub const SESSION_COOKIE_NAME_LEGACY: &str = "traveltrust_session_token";
/// **`__Host-` 前缀**：须 **`Secure`** + **`Path=/`**、**不得**带 `Domain`（本模块满足）。
pub const SESSION_COOKIE_NAME_HOST: &str = "__Host-traveltrust_session";

fn truthy_env(name: &str) -> bool {
    std::env::var(name)
        .ok()
        .map(|v| {
            matches!(
                v.trim().to_ascii_lowercase().as_str(),
                "1" | "true" | "on" | "yes"
            )
        })
        .unwrap_or(false)
}

fn cookie_secure_enabled() -> bool {
    truthy_env("TRAVELTRUST_COOKIE_SECURE")
}

/// 签发时使用 **`__Host-…`** 名（须同时 **`TRAVELTRUST_SESSION_COOKIE_HOST_PREFIX=1`** 与 **`TRAVELTRUST_COOKIE_SECURE=1`**）。
fn host_prefix_issue_enabled() -> bool {
    truthy_env("TRAVELTRUST_SESSION_COOKIE_HOST_PREFIX") && cookie_secure_enabled()
}

/// 对外签发/当前进程期望的主 Cookie 名（机读观测等可引用）。
pub fn session_cookie_name_for_issue() -> &'static str {
    if host_prefix_issue_enabled() {
        SESSION_COOKIE_NAME_HOST
    } else {
        SESSION_COOKIE_NAME_LEGACY
    }
}

/// `lax`（默认）、`strict`（`TRAVELTRUST_COOKIE_SAMESITE=strict`）、`none`（须同启 **`TRAVELTRUST_COOKIE_SECURE`**，否则回退 **Lax**）。
fn same_site_directive() -> &'static str {
    match std::env::var("TRAVELTRUST_COOKIE_SAMESITE")
        .ok()
        .map(|s| s.trim().to_ascii_lowercase())
        .as_deref()
    {
        Some("strict") => "Strict",
        Some("none") if cookie_secure_enabled() => "None",
        Some("none") => "Lax",
        _ => "Lax",
    }
}

/// `Set-Cookie`：`HttpOnly`、可选 **`Secure`**、**`SameSite`**（见 **`TRAVELTRUST_COOKIE_SAMESITE`**）。
pub fn build_session_set_cookie(token: &str) -> String {
    let secure_part = if cookie_secure_enabled() {
        "; Secure"
    } else {
        ""
    };
    let same = same_site_directive();
    let name = session_cookie_name_for_issue();
    format!(
        "{}={}; Path=/; HttpOnly; SameSite={}{}",
        name, token, same, secure_part
    )
}

fn one_clear_cookie_header(name: &str) -> String {
    let secure_part = if cookie_secure_enabled() {
        "; Secure"
    } else {
        ""
    };
    let same = same_site_directive();
    format!(
        "{}=; Path=/; Max-Age=0; HttpOnly; SameSite={}{}",
        name, same, secure_part
    )
}

/// 清除会话：返回 **1～2** 条 `Set-Cookie`（ legacy + **`__Host-`** ），登出时**全部追加**以免迁移期残留。
pub fn build_session_clear_cookie_headers() -> Vec<String> {
    let mut out = Vec::with_capacity(2);
    out.push(one_clear_cookie_header(SESSION_COOKIE_NAME_LEGACY));
    if cookie_secure_enabled() {
        out.push(one_clear_cookie_header(SESSION_COOKIE_NAME_HOST));
    }
    out
}

/// 从 **`Cookie`** 解析会话 token（**`__Host-`** 与 legacy **并存**时优先 **`__Host-`**）。
pub fn extract_session_token_from_headers(headers: &HeaderMap) -> Option<String> {
    let raw = headers.get(axum::http::header::COOKIE)?.to_str().ok()?;
    let mut legacy: Option<String> = None;
    let mut host: Option<String> = None;
    for part in raw.split(';') {
        let trimmed = part.trim();
        let Some((name, value)) = trimmed.split_once('=') else {
            continue;
        };
        let token = value.trim();
        if token.is_empty() {
            continue;
        }
        match name.trim() {
            n if n == SESSION_COOKIE_NAME_HOST => host = Some(token.to_string()),
            n if n == SESSION_COOKIE_NAME_LEGACY => legacy = Some(token.to_string()),
            _ => {}
        }
    }
    host.or(legacy)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::HeaderMap;

    #[test]
    fn extracts_session_token_from_cookie_header() {
        let mut h = HeaderMap::new();
        h.insert(
            axum::http::header::COOKIE,
            "a=b; traveltrust_session_token=tts_abc; other=1"
                .parse()
                .unwrap(),
        );
        assert_eq!(
            extract_session_token_from_headers(&h).as_deref(),
            Some("tts_abc")
        );
    }

    #[test]
    fn extract_prefers_host_cookie_when_both_present() {
        let mut h = HeaderMap::new();
        h.insert(
            axum::http::header::COOKIE,
            "traveltrust_session_token=legacy_tok; __Host-traveltrust_session=host_tok"
                .parse()
                .unwrap(),
        );
        assert_eq!(
            extract_session_token_from_headers(&h).as_deref(),
            Some("host_tok")
        );
    }

    #[test]
    fn set_cookie_has_required_attributes() {
        let s = build_session_set_cookie("tok");
        assert!(s.contains("=tok;"));
        assert!(s.contains("Path=/"));
        assert!(s.contains("HttpOnly"));
        assert!(s.contains("SameSite="));
    }

    #[test]
    fn clear_headers_cover_legacy_and_host_when_secure() {
        let _g = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
        let prev = std::env::var("TRAVELTRUST_COOKIE_SECURE").ok();
        std::env::set_var("TRAVELTRUST_COOKIE_SECURE", "1");
        let v = build_session_clear_cookie_headers();
        assert_eq!(v.len(), 2);
        assert!(v[0].starts_with("traveltrust_session_token="));
        assert!(v[1].starts_with("__Host-traveltrust_session="));
        match prev {
            Some(p) => std::env::set_var("TRAVELTRUST_COOKIE_SECURE", p),
            None => std::env::remove_var("TRAVELTRUST_COOKIE_SECURE"),
        }
    }
}
