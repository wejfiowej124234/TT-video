//! `POST /auth/forgot-password`：按规范化邮箱的进程内滑动窗口限流（Batch F）。
//! 仅对**将真实发信**的已知账号调用；超限返回 **`false`**，handler 仍响应 **200** **`if_account_exists_email_sent`**（防枚举）。**`AUTH_FORGOT_PASSWORD_PER_EMAIL_MAX_PER_WINDOW=0`** 关闭本限流。

use sqlx::postgres::PgPool;
use std::env;

const DEFAULT_MAX_PER_WINDOW: u32 = 4;
const DEFAULT_WINDOW_SECS: u64 = 3600;
const MIN_WINDOW_SECS: u64 = 60;
const MAX_WINDOW_SECS: u64 = 604_800;

fn read_max_per_window() -> u32 {
    env::var("AUTH_FORGOT_PASSWORD_PER_EMAIL_MAX_PER_WINDOW")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(DEFAULT_MAX_PER_WINDOW)
}

fn read_window_secs() -> u64 {
    let v = env::var("AUTH_FORGOT_PASSWORD_PER_EMAIL_WINDOW_SECS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(DEFAULT_WINDOW_SECS);
    if v < MIN_WINDOW_SECS {
        DEFAULT_WINDOW_SECS
    } else {
        v.min(MAX_WINDOW_SECS)
    }
}

/// 尝试占用该邮箱在本窗口内的一次「发信配额」。成功则已记入时间戳。
pub(crate) async fn try_consume_forgot_password_per_email_slot(
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
        "forgot",
        email_normalized,
        max,
        window_secs,
    )
    .await
}
