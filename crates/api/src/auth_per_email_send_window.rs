//! 出站邮件按**任意字符串键**的进程内滑动窗口（Batch F/G 共用）。键须由调用方带业务前缀（如 **`forgot:`** / **`reg_verify:`**），避免不同桶互相挤占。

use std::collections::HashMap;
use std::time::Instant;

use sqlx::postgres::PgPool;
use tokio::sync::Mutex;

fn auth_email_key_pepper() -> Option<String> {
    std::env::var("TRAVELTRUST_AUTH_EMAIL_KEY_PEPPER")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .or_else(crate::email_transport::auth_token_pepper)
}

fn derive_email_rate_key(email_normalized: &str) -> String {
    if let Some(pepper) = auth_email_key_pepper() {
        return crate::email_transport::hash_raw_email_token(email_normalized, &pepper);
    }
    email_normalized.to_string()
}

/// `max_per_window > 0`；`window_secs` 已由调用方钳位。
pub(crate) async fn try_consume_sliding_window_slot(
    map_key: &str,
    max_per_window: u32,
    window_secs: u64,
) -> bool {
    debug_assert!(max_per_window > 0);
    static STORE: std::sync::OnceLock<Mutex<HashMap<String, Vec<Instant>>>> =
        std::sync::OnceLock::new();
    let store = STORE.get_or_init(|| Mutex::new(HashMap::new()));
    let now = Instant::now();
    let window = std::time::Duration::from_secs(window_secs);
    let mut guard = store.lock().await;
    let vec = guard.entry(map_key.to_string()).or_default();
    vec.retain(|t| now.saturating_duration_since(*t) < window);
    if vec.len() >= max_per_window as usize {
        return false;
    }
    vec.push(now);
    true
}

/// Prefer DB-backed distributed window when pool is available.
/// Falls back to process-local sliding window for no-DB/test paths.
pub(crate) async fn try_consume_email_send_slot(
    pool: Option<&PgPool>,
    bucket: &str,
    email_normalized: &str,
    max_per_window: u32,
    window_secs: u64,
) -> bool {
    if max_per_window == 0 {
        return true;
    }
    let email_key = derive_email_rate_key(email_normalized);
    let map_key = format!("{}:{}", bucket, email_key);
    if let Some(p) = pool {
        match crate::db::try_consume_email_send_slot(
            p,
            bucket,
            &email_key,
            max_per_window,
            window_secs,
        )
        .await
        {
            Ok(v) => v,
            Err(e) => {
                eprintln!(
                    "[audit] auth per-email distributed window failed bucket={} email_key_hash_len={} err={}",
                    bucket,
                    email_key.len(),
                    e
                );
                // Degrade to local in-memory window to avoid total auth email outage.
                try_consume_sliding_window_slot(&map_key, max_per_window, window_secs).await
            }
        }
    } else {
        try_consume_sliding_window_slot(&map_key, max_per_window, window_secs).await
    }
}

/// Generic keyed window (IP / global / device). The key is hashed with the same pepper strategy
/// used by email windows so logs/storage never keep raw identifiers.
pub(crate) async fn try_consume_bucket_key_slot(
    pool: Option<&PgPool>,
    bucket: &str,
    raw_key: &str,
    max_per_window: u32,
    window_secs: u64,
) -> bool {
    if max_per_window == 0 {
        return true;
    }
    let key_norm = raw_key.trim();
    if key_norm.is_empty() {
        return true;
    }
    let key_hash = derive_email_rate_key(key_norm);
    let map_key = format!("{}:{}", bucket, key_hash);
    if let Some(p) = pool {
        match crate::db::try_consume_email_send_slot(
            p,
            bucket,
            &key_hash,
            max_per_window,
            window_secs,
        )
        .await
        {
            Ok(v) => v,
            Err(e) => {
                eprintln!(
                    "[audit] auth keyed distributed window failed bucket={} key_hash_len={} err={}",
                    bucket,
                    key_hash.len(),
                    e
                );
                try_consume_sliding_window_slot(&map_key, max_per_window, window_secs).await
            }
        }
    } else {
        try_consume_sliding_window_slot(&map_key, max_per_window, window_secs).await
    }
}

#[cfg(test)]
mod tests {
    fn restore_env_opt(key: &str, prev: Option<String>) {
        match prev {
            Some(v) => std::env::set_var(key, v),
            None => std::env::remove_var(key),
        }
    }

    fn take_ms(v: &mut Vec<u64>, now: u64, window_ms: u64, max: u32) -> bool {
        v.retain(|t| now.saturating_sub(*t) < window_ms);
        if v.len() >= max as usize {
            return false;
        }
        v.push(now);
        true
    }

    #[test]
    fn sliding_window_blocks_when_full() {
        let mut v = vec![];
        assert!(take_ms(&mut v, 1_000, 60_000, 3));
        assert!(take_ms(&mut v, 2_000, 60_000, 3));
        assert!(take_ms(&mut v, 3_000, 60_000, 3));
        assert!(!take_ms(&mut v, 4_000, 60_000, 3));
        assert!(take_ms(&mut v, 62_000, 60_000, 3));
    }

    #[test]
    fn derive_email_rate_key_uses_auth_email_key_pepper_when_set() {
        let _env_guard = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
        let prev_email_pepper = std::env::var("TRAVELTRUST_AUTH_EMAIL_KEY_PEPPER").ok();
        let prev_token_pepper = std::env::var("TRAVELTRUST_AUTH_TOKEN_PEPPER").ok();
        std::env::set_var("TRAVELTRUST_AUTH_EMAIL_KEY_PEPPER", "email-key-pepper");
        std::env::set_var("TRAVELTRUST_AUTH_TOKEN_PEPPER", "token-pepper-ignored");
        let email = "demo@traveltrust.test";
        let key = super::derive_email_rate_key(email);
        let expected = crate::email_transport::hash_raw_email_token(email, "email-key-pepper");
        assert_eq!(key, expected);
        restore_env_opt("TRAVELTRUST_AUTH_EMAIL_KEY_PEPPER", prev_email_pepper);
        restore_env_opt("TRAVELTRUST_AUTH_TOKEN_PEPPER", prev_token_pepper);
    }

    #[test]
    fn derive_email_rate_key_falls_back_to_token_pepper() {
        let _env_guard = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
        let prev_email_pepper = std::env::var("TRAVELTRUST_AUTH_EMAIL_KEY_PEPPER").ok();
        let prev_token_pepper = std::env::var("TRAVELTRUST_AUTH_TOKEN_PEPPER").ok();
        std::env::remove_var("TRAVELTRUST_AUTH_EMAIL_KEY_PEPPER");
        std::env::set_var("TRAVELTRUST_AUTH_TOKEN_PEPPER", "token-pepper");
        let email = "demo2@traveltrust.test";
        let key = super::derive_email_rate_key(email);
        let expected = crate::email_transport::hash_raw_email_token(email, "token-pepper");
        assert_eq!(key, expected);
        restore_env_opt("TRAVELTRUST_AUTH_EMAIL_KEY_PEPPER", prev_email_pepper);
        restore_env_opt("TRAVELTRUST_AUTH_TOKEN_PEPPER", prev_token_pepper);
    }
}
