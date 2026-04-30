//! `POST /auth/login` extra risk limits: per-IP and global buckets.

use std::env;

use sqlx::postgres::PgPool;

const DEFAULT_PER_IP_MAX_PER_WINDOW: u32 = 30;
const DEFAULT_PER_IP_WINDOW_SECS: u64 = 900;
const DEFAULT_GLOBAL_MAX_PER_WINDOW: u32 = 1500;
const DEFAULT_GLOBAL_WINDOW_SECS: u64 = 60;
const MIN_WINDOW_SECS: u64 = 10;
const MAX_WINDOW_SECS: u64 = 604_800;

fn read_u32(name: &str, default_value: u32) -> u32 {
    env::var(name)
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(default_value)
}

fn read_window_secs(name: &str, default_value: u64) -> u64 {
    let v = env::var(name)
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(default_value);
    if v < MIN_WINDOW_SECS {
        default_value
    } else {
        v.min(MAX_WINDOW_SECS)
    }
}

pub(crate) async fn try_consume_login_per_ip_slot(pool: Option<&PgPool>, client_ip: &str) -> bool {
    let max = read_u32(
        "AUTH_LOGIN_PER_IP_MAX_PER_WINDOW",
        DEFAULT_PER_IP_MAX_PER_WINDOW,
    );
    if max == 0 {
        return true;
    }
    let window_secs = read_window_secs("AUTH_LOGIN_PER_IP_WINDOW_SECS", DEFAULT_PER_IP_WINDOW_SECS);
    crate::auth_per_email_send_window::try_consume_bucket_key_slot(
        pool,
        "login_ip",
        client_ip,
        max,
        window_secs,
    )
    .await
}

pub(crate) async fn try_consume_login_global_slot(pool: Option<&PgPool>) -> bool {
    let max = read_u32(
        "AUTH_LOGIN_GLOBAL_MAX_PER_WINDOW",
        DEFAULT_GLOBAL_MAX_PER_WINDOW,
    );
    if max == 0 {
        return true;
    }
    let window_secs = read_window_secs("AUTH_LOGIN_GLOBAL_WINDOW_SECS", DEFAULT_GLOBAL_WINDOW_SECS);
    crate::auth_per_email_send_window::try_consume_bucket_key_slot(
        pool,
        "login_global",
        "global",
        max,
        window_secs,
    )
    .await
}
