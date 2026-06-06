//! **96-18**：**`GET /api/v1/onboarding/quote`** 专桶限流（**`ONBOARDING_QUOTE_RATE_LIMIT_PER_MINUTE`**，**60s** 滑动窗口）。

use axum::http::{HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;
use std::collections::HashMap;
use std::env;
use std::sync::OnceLock;
use std::time::{Duration, Instant};
use tokio::sync::Mutex;

const ONBOARDING_QUOTE_RATE_WINDOW_SECS: u64 = 60;
const ONBOARDING_QUOTE_RATE_LIMIT_DEFAULT: u32 = 30;

fn client_key(headers: &HeaderMap) -> String {
    headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.split(',').next())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .or_else(|| headers.get("x-real-ip").and_then(|v| v.to_str().ok()))
        .unwrap_or("default")
        .to_string()
}

fn quote_rate_limit_per_window() -> u32 {
    env::var("ONBOARDING_QUOTE_RATE_LIMIT_PER_MINUTE")
        .ok()
        .and_then(|s| s.parse::<u32>().ok())
        .unwrap_or(ONBOARDING_QUOTE_RATE_LIMIT_DEFAULT)
}

static ONBOARDING_QUOTE_STORE: OnceLock<Mutex<HashMap<String, Vec<Instant>>>> = OnceLock::new();

/// 返回 **`Some(response)`** 当报价专桶超限；**`None`** 允许继续处理（并已计入本请求）。
pub async fn onboarding_quote_rate_limit_response_if_exceeded(
    _pool: Option<&sqlx::PgPool>,
    headers: &HeaderMap,
) -> Option<Response> {
    let limit = quote_rate_limit_per_window();
    if limit == 0 {
        return None;
    }
    let key = format!("onboarding_quote:{}", client_key(headers));
    let store = ONBOARDING_QUOTE_STORE.get_or_init(|| Mutex::new(HashMap::new()));
    let now = Instant::now();
    let window = Duration::from_secs(ONBOARDING_QUOTE_RATE_WINDOW_SECS);
    let over = {
        let mut guard = store.lock().await;
        let vec = guard.entry(key).or_default();
        vec.retain(|t| now.saturating_duration_since(*t) < window);
        if vec.len() >= limit as usize {
            true
        } else {
            vec.push(now);
            false
        }
    };
    if !over {
        return None;
    }
    let mut res = (
        StatusCode::TOO_MANY_REQUESTS,
        Json(json!({
            "status": "error",
            "error": "onboarding_quote_rate_limited",
            "message": "onboarding_quote_rate_limited",
            "retry_after_sec": ONBOARDING_QUOTE_RATE_WINDOW_SECS,
            "retry_after_seconds": ONBOARDING_QUOTE_RATE_WINDOW_SECS,
        })),
    )
        .into_response();
    if let Ok(v) = HeaderValue::from_str(&ONBOARDING_QUOTE_RATE_WINDOW_SECS.to_string()) {
        res.headers_mut()
            .insert(axum::http::header::RETRY_AFTER, v);
    }
    Some(res)
}
