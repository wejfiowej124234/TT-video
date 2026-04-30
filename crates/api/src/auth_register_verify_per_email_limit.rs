//! 注册成功后的**验证邮件**出站：按规范化邮箱进程内滑动窗口（Batch G）。与 forgot 桶**键前缀隔离**。
//! 超限时 **`try_consume_register_verify_per_email_slot`** 返回 **`false`**，注册 handler 将 **`email_verification_token_issued`** / **`email_verification_link_sent`** 置 **`false`**。**`AUTH_REGISTER_VERIFY_PER_EMAIL_MAX_PER_WINDOW=0`** 关闭。

use sqlx::postgres::PgPool;
use std::env;

const DEFAULT_MAX_PER_WINDOW: u32 = 6;
const DEFAULT_WINDOW_SECS: u64 = 3600;
const MIN_WINDOW_SECS: u64 = 60;
const MAX_WINDOW_SECS: u64 = 604_800;

fn read_max_per_window() -> u32 {
    env::var("AUTH_REGISTER_VERIFY_PER_EMAIL_MAX_PER_WINDOW")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(DEFAULT_MAX_PER_WINDOW)
}

fn read_window_secs() -> u64 {
    let v = env::var("AUTH_REGISTER_VERIFY_PER_EMAIL_WINDOW_SECS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(DEFAULT_WINDOW_SECS);
    if v < MIN_WINDOW_SECS {
        DEFAULT_WINDOW_SECS
    } else {
        v.min(MAX_WINDOW_SECS)
    }
}

pub(crate) async fn try_consume_register_verify_per_email_slot(
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
        "reg_verify",
        email_normalized,
        max,
        window_secs,
    )
    .await
}
