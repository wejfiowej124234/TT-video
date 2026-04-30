//! `POST /auth/login`：按规范化邮箱的滑动窗口限流。
//! 与 `middleware::auth_post_rate_limit_layer`（按客户端 IP）叠加形成双桶防护。

use std::env;

use sqlx::postgres::PgPool;

const DEFAULT_MAX_PER_WINDOW: u32 = 12;
const DEFAULT_WINDOW_SECS: u64 = 900;
const MIN_WINDOW_SECS: u64 = 60;
const MAX_WINDOW_SECS: u64 = 604_800;

fn read_max_per_window() -> u32 {
    env::var("AUTH_LOGIN_PER_EMAIL_MAX_PER_WINDOW")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(DEFAULT_MAX_PER_WINDOW)
}

fn read_window_secs() -> u64 {
    let v = env::var("AUTH_LOGIN_PER_EMAIL_WINDOW_SECS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(DEFAULT_WINDOW_SECS);
    if v < MIN_WINDOW_SECS {
        DEFAULT_WINDOW_SECS
    } else {
        v.min(MAX_WINDOW_SECS)
    }
}

pub(crate) async fn try_consume_login_per_email_slot(
    pool: Option<&PgPool>,
    email_normalized: &str,
) -> bool {
    let max = read_max_per_window();
    if max == 0 {
        return true;
    }
    let window_secs = read_window_secs();
    crate::auth_per_email_send_window::try_consume_email_send_slot(
        pool,
        "login",
        email_normalized,
        max,
        window_secs,
    )
    .await
}

#[cfg(test)]
mod tests {
    use super::try_consume_login_per_email_slot;

    fn restore_env_opt(key: &str, prev: Option<String>) {
        match prev {
            Some(v) => std::env::set_var(key, v),
            None => std::env::remove_var(key),
        }
    }

    #[tokio::test]
    async fn disabled_limit_allows_requests() {
        let _g = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
        let prev_max = std::env::var("AUTH_LOGIN_PER_EMAIL_MAX_PER_WINDOW").ok();
        std::env::set_var("AUTH_LOGIN_PER_EMAIL_MAX_PER_WINDOW", "0");
        let allowed_a =
            try_consume_login_per_email_slot(None, "login-disable-a@traveltrust.test").await;
        let allowed_b =
            try_consume_login_per_email_slot(None, "login-disable-a@traveltrust.test").await;
        restore_env_opt("AUTH_LOGIN_PER_EMAIL_MAX_PER_WINDOW", prev_max);
        assert!(allowed_a);
        assert!(allowed_b);
    }

    #[tokio::test]
    async fn one_per_window_blocks_second_attempt() {
        let _g = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
        let prev_max = std::env::var("AUTH_LOGIN_PER_EMAIL_MAX_PER_WINDOW").ok();
        let prev_window = std::env::var("AUTH_LOGIN_PER_EMAIL_WINDOW_SECS").ok();
        std::env::set_var("AUTH_LOGIN_PER_EMAIL_MAX_PER_WINDOW", "1");
        std::env::set_var("AUTH_LOGIN_PER_EMAIL_WINDOW_SECS", "300");

        let email = format!("login-rate-{}@traveltrust.test", uuid::Uuid::new_v4());
        let first = try_consume_login_per_email_slot(None, email.as_str()).await;
        let second = try_consume_login_per_email_slot(None, email.as_str()).await;

        restore_env_opt("AUTH_LOGIN_PER_EMAIL_MAX_PER_WINDOW", prev_max);
        restore_env_opt("AUTH_LOGIN_PER_EMAIL_WINDOW_SECS", prev_window);
        assert!(first);
        assert!(!second);
    }
}
