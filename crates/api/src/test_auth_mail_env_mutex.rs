//! Serializes auth-related **process env** mutation (`TRAVELTRUST_*` / `AUTH_LOGIN_*` /
//! `TRAVELTRUST_AUTH_EMAIL_KEY_PEPPER` / `TRAVELTRUST_AUTH_TOKEN_PEPPER` / mail IT guards)
//! against tiny in-memory rate-limit unit tests that read the same env vars.
//!
//! `std::sync::Mutex` is held across `await` in `#[tokio::test]` the same way as the historical
//! `AUTH_MAIL_IT_MUTEX` pattern in `routes/auth_register_login_logout_db_api_tests.rs`.

use std::sync::Mutex;

static AUTH_MAIL_ENV_TEST_MUTEX: Mutex<()> = Mutex::new(());

pub(crate) fn lock_auth_mail_env_tests() -> std::sync::MutexGuard<'static, ()> {
    match AUTH_MAIL_ENV_TEST_MUTEX.lock() {
        Ok(g) => g,
        // A prior test may have panicked while holding the lock; recover so the suite can continue.
        Err(poisoned) => poisoned.into_inner(),
    }
}
