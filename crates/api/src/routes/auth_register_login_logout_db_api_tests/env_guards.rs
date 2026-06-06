//! Env / rate-limit / audit guards for **`auth_register_login_logout_db_api_tests`**
//!（**`TRAVELTRUST_EMAIL_TRANSPORT`/`PEPPER`**/**`email_transport` raw 槽**/**`test_auth_mail_env_mutex`** 同源并行安全）。

use std::sync::Mutex;

/// 进程级 **`auth_audit`** IT 串行（与 **`auth_login_per_email_limit`** 等单元测共享 **`Mutex` 槽**）。
pub(crate) static AUTH_AUDIT_IT_MUTEX: Mutex<()> = Mutex::new(());

pub(crate) fn restore_env_opt(key: &str, prev: Option<String>) {
    match prev {
        Some(v) => std::env::set_var(key, v),
        None => std::env::remove_var(key),
    }
}

pub(crate) struct ForgotResetTestEnvGuard {
    prev_transport: Option<String>,
    prev_pepper: Option<String>,
    prev_forgot_per_ip_max: Option<String>,
}

impl ForgotResetTestEnvGuard {
    pub(crate) fn set_log_transport_and_pepper() -> Self {
        let prev_transport = std::env::var("TRAVELTRUST_EMAIL_TRANSPORT").ok();
        let prev_pepper = std::env::var("TRAVELTRUST_AUTH_TOKEN_PEPPER").ok();
        let prev_forgot_per_ip_max =
            std::env::var("AUTH_FORGOT_PASSWORD_PER_IP_MAX_PER_WINDOW").ok();
        std::env::set_var("TRAVELTRUST_EMAIL_TRANSPORT", "log");
        std::env::set_var(
            "TRAVELTRUST_AUTH_TOKEN_PEPPER",
            "it-test-auth-token-pepper-32bytes!!",
        );
        // IT 无 `X-Forwarded-For` 时共用 `default` 桶；关闭 per-IP 避免 PG 窗口表污染导致假限流。
        std::env::set_var("AUTH_FORGOT_PASSWORD_PER_IP_MAX_PER_WINDOW", "0");
        Self {
            prev_transport,
            prev_pepper,
            prev_forgot_per_ip_max,
        }
    }
}

impl Drop for ForgotResetTestEnvGuard {
    fn drop(&mut self) {
        restore_env_opt("TRAVELTRUST_EMAIL_TRANSPORT", self.prev_transport.take());
        restore_env_opt("TRAVELTRUST_AUTH_TOKEN_PEPPER", self.prev_pepper.take());
        restore_env_opt(
            "AUTH_FORGOT_PASSWORD_PER_IP_MAX_PER_WINDOW",
            self.prev_forgot_per_ip_max.take(),
        );
    }
}

pub(crate) struct ForgotPerEmailRateLimitEnvGuard {
    prev_max: Option<String>,
    prev_window_secs: Option<String>,
}

impl ForgotPerEmailRateLimitEnvGuard {
    pub(crate) fn set(max_per_window: u32, window_secs: u64) -> Self {
        let prev_max = std::env::var("AUTH_FORGOT_PASSWORD_PER_EMAIL_MAX_PER_WINDOW").ok();
        let prev_window_secs = std::env::var("AUTH_FORGOT_PASSWORD_PER_EMAIL_WINDOW_SECS").ok();
        std::env::set_var(
            "AUTH_FORGOT_PASSWORD_PER_EMAIL_MAX_PER_WINDOW",
            max_per_window.to_string(),
        );
        std::env::set_var(
            "AUTH_FORGOT_PASSWORD_PER_EMAIL_WINDOW_SECS",
            window_secs.to_string(),
        );
        Self {
            prev_max,
            prev_window_secs,
        }
    }
}

impl Drop for ForgotPerEmailRateLimitEnvGuard {
    fn drop(&mut self) {
        restore_env_opt(
            "AUTH_FORGOT_PASSWORD_PER_EMAIL_MAX_PER_WINDOW",
            self.prev_max.take(),
        );
        restore_env_opt(
            "AUTH_FORGOT_PASSWORD_PER_EMAIL_WINDOW_SECS",
            self.prev_window_secs.take(),
        );
    }
}

pub(crate) struct LoginPerEmailRateLimitEnvGuard {
    prev_max: Option<String>,
    prev_window_secs: Option<String>,
}

impl LoginPerEmailRateLimitEnvGuard {
    pub(crate) fn set(max_per_window: u32, window_secs: u64) -> Self {
        let prev_max = std::env::var("AUTH_LOGIN_PER_EMAIL_MAX_PER_WINDOW").ok();
        let prev_window_secs = std::env::var("AUTH_LOGIN_PER_EMAIL_WINDOW_SECS").ok();
        std::env::set_var(
            "AUTH_LOGIN_PER_EMAIL_MAX_PER_WINDOW",
            max_per_window.to_string(),
        );
        std::env::set_var("AUTH_LOGIN_PER_EMAIL_WINDOW_SECS", window_secs.to_string());
        Self {
            prev_max,
            prev_window_secs,
        }
    }
}

impl Drop for LoginPerEmailRateLimitEnvGuard {
    fn drop(&mut self) {
        restore_env_opt("AUTH_LOGIN_PER_EMAIL_MAX_PER_WINDOW", self.prev_max.take());
        restore_env_opt(
            "AUTH_LOGIN_PER_EMAIL_WINDOW_SECS",
            self.prev_window_secs.take(),
        );
    }
}

pub(crate) struct LoginRiskRateLimitEnvGuard {
    prev_per_ip_max: Option<String>,
    prev_per_ip_window_secs: Option<String>,
    prev_global_max: Option<String>,
    prev_global_window_secs: Option<String>,
}

impl LoginRiskRateLimitEnvGuard {
    pub(crate) fn set(
        per_ip_max_per_window: u32,
        per_ip_window_secs: u64,
        global_max_per_window: u32,
        global_window_secs: u64,
    ) -> Self {
        let prev_per_ip_max = std::env::var("AUTH_LOGIN_PER_IP_MAX_PER_WINDOW").ok();
        let prev_per_ip_window_secs = std::env::var("AUTH_LOGIN_PER_IP_WINDOW_SECS").ok();
        let prev_global_max = std::env::var("AUTH_LOGIN_GLOBAL_MAX_PER_WINDOW").ok();
        let prev_global_window_secs = std::env::var("AUTH_LOGIN_GLOBAL_WINDOW_SECS").ok();
        std::env::set_var(
            "AUTH_LOGIN_PER_IP_MAX_PER_WINDOW",
            per_ip_max_per_window.to_string(),
        );
        std::env::set_var(
            "AUTH_LOGIN_PER_IP_WINDOW_SECS",
            per_ip_window_secs.to_string(),
        );
        std::env::set_var(
            "AUTH_LOGIN_GLOBAL_MAX_PER_WINDOW",
            global_max_per_window.to_string(),
        );
        std::env::set_var(
            "AUTH_LOGIN_GLOBAL_WINDOW_SECS",
            global_window_secs.to_string(),
        );
        Self {
            prev_per_ip_max,
            prev_per_ip_window_secs,
            prev_global_max,
            prev_global_window_secs,
        }
    }
}

impl Drop for LoginRiskRateLimitEnvGuard {
    fn drop(&mut self) {
        restore_env_opt(
            "AUTH_LOGIN_PER_IP_MAX_PER_WINDOW",
            self.prev_per_ip_max.take(),
        );
        restore_env_opt(
            "AUTH_LOGIN_PER_IP_WINDOW_SECS",
            self.prev_per_ip_window_secs.take(),
        );
        restore_env_opt(
            "AUTH_LOGIN_GLOBAL_MAX_PER_WINDOW",
            self.prev_global_max.take(),
        );
        restore_env_opt(
            "AUTH_LOGIN_GLOBAL_WINDOW_SECS",
            self.prev_global_window_secs.take(),
        );
    }
}

pub(crate) struct ForgotRiskRateLimitEnvGuard {
    prev_per_ip_max: Option<String>,
    prev_per_ip_window_secs: Option<String>,
    prev_global_max: Option<String>,
    prev_global_window_secs: Option<String>,
}

impl ForgotRiskRateLimitEnvGuard {
    pub(crate) fn set(
        per_ip_max_per_window: u32,
        per_ip_window_secs: u64,
        global_max_per_window: u32,
        global_window_secs: u64,
    ) -> Self {
        let prev_per_ip_max = std::env::var("AUTH_FORGOT_PASSWORD_PER_IP_MAX_PER_WINDOW").ok();
        let prev_per_ip_window_secs = std::env::var("AUTH_FORGOT_PASSWORD_PER_IP_WINDOW_SECS").ok();
        let prev_global_max = std::env::var("AUTH_FORGOT_PASSWORD_GLOBAL_MAX_PER_WINDOW").ok();
        let prev_global_window_secs = std::env::var("AUTH_FORGOT_PASSWORD_GLOBAL_WINDOW_SECS").ok();
        std::env::set_var(
            "AUTH_FORGOT_PASSWORD_PER_IP_MAX_PER_WINDOW",
            per_ip_max_per_window.to_string(),
        );
        std::env::set_var(
            "AUTH_FORGOT_PASSWORD_PER_IP_WINDOW_SECS",
            per_ip_window_secs.to_string(),
        );
        std::env::set_var(
            "AUTH_FORGOT_PASSWORD_GLOBAL_MAX_PER_WINDOW",
            global_max_per_window.to_string(),
        );
        std::env::set_var(
            "AUTH_FORGOT_PASSWORD_GLOBAL_WINDOW_SECS",
            global_window_secs.to_string(),
        );
        Self {
            prev_per_ip_max,
            prev_per_ip_window_secs,
            prev_global_max,
            prev_global_window_secs,
        }
    }
}

impl Drop for ForgotRiskRateLimitEnvGuard {
    fn drop(&mut self) {
        restore_env_opt(
            "AUTH_FORGOT_PASSWORD_PER_IP_MAX_PER_WINDOW",
            self.prev_per_ip_max.take(),
        );
        restore_env_opt(
            "AUTH_FORGOT_PASSWORD_PER_IP_WINDOW_SECS",
            self.prev_per_ip_window_secs.take(),
        );
        restore_env_opt(
            "AUTH_FORGOT_PASSWORD_GLOBAL_MAX_PER_WINDOW",
            self.prev_global_max.take(),
        );
        restore_env_opt(
            "AUTH_FORGOT_PASSWORD_GLOBAL_WINDOW_SECS",
            self.prev_global_window_secs.take(),
        );
    }
}

pub(crate) struct AuthAuditFailClosedTestEnvGuard {
    prev_fail_closed: Option<String>,
    prev_force_fail: Option<String>,
}

impl AuthAuditFailClosedTestEnvGuard {
    pub(crate) fn set(fail_closed: bool) -> Self {
        let prev_fail_closed = std::env::var("AUTH_AUDIT_FAIL_CLOSED").ok();
        let prev_force_fail = std::env::var("TRAVELTRUST_TEST_AUTH_AUDIT_FORCE_FAIL").ok();
        if fail_closed {
            std::env::set_var("AUTH_AUDIT_FAIL_CLOSED", "1");
        } else {
            std::env::set_var("AUTH_AUDIT_FAIL_CLOSED", "0");
        }
        std::env::set_var("TRAVELTRUST_TEST_AUTH_AUDIT_FORCE_FAIL", "1");
        Self {
            prev_fail_closed,
            prev_force_fail,
        }
    }
}

impl Drop for AuthAuditFailClosedTestEnvGuard {
    fn drop(&mut self) {
        restore_env_opt("AUTH_AUDIT_FAIL_CLOSED", self.prev_fail_closed.take());
        restore_env_opt(
            "TRAVELTRUST_TEST_AUTH_AUDIT_FORCE_FAIL",
            self.prev_force_fail.take(),
        );
    }
}

pub(crate) struct AuthAuditAsyncQueueEnvGuard {
    prev_enabled: Option<String>,
}

impl AuthAuditAsyncQueueEnvGuard {
    pub(crate) fn disable() -> Self {
        let prev_enabled = std::env::var("AUTH_AUDIT_ASYNC_QUEUE_ENABLED").ok();
        std::env::set_var("AUTH_AUDIT_ASYNC_QUEUE_ENABLED", "0");
        Self { prev_enabled }
    }
}

impl Drop for AuthAuditAsyncQueueEnvGuard {
    fn drop(&mut self) {
        restore_env_opt("AUTH_AUDIT_ASYNC_QUEUE_ENABLED", self.prev_enabled.take());
    }
}
