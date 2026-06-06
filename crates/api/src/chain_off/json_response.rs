//! **429** 响应头与 JSON 体 **`retry_after_*`** 对拍（与 **`middleware/rate_limit`**、**`routes/community/common`** 同源，**①②③**）。

use axum::http::{header, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::Value;

/// 从限流类 JSON 读秒（**`retry_after_sec`** 优先于 **`retry_after_seconds`**，与前端 **`coalesceRetryAfterSecondsFromJson`** 同源）。
#[must_use]
pub(crate) fn retry_sec_from_rate_limit_body(v: &Value) -> Option<u32> {
    v.get("retry_after_sec")
        .and_then(json_u32)
        .or_else(|| v.get("retry_after_seconds").and_then(json_u32))
}

fn json_u32(v: &Value) -> Option<u32> {
    v.as_u64()
        .and_then(|u| u32::try_from(u).ok())
        .or_else(|| v.as_i64().and_then(|i| u32::try_from(i).ok()))
}

/// **`(StatusCode, Json)` → `Response`**：若 **429** 且体已含 **`retry_after_*`**，补 **`Retry-After`**（链下 **`reviews`/`evidence`** 仍返回元组时的收口）。
#[must_use]
pub(crate) fn status_json_response_with_429_retry_header(
    code: StatusCode,
    body: Json<Value>,
) -> Response {
    let sec = if code == StatusCode::TOO_MANY_REQUESTS {
        retry_sec_from_rate_limit_body(&body.0)
    } else {
        None
    };    let mut res = (code, body).into_response();
    if let Some(s) = sec {
        if res.headers().get(header::RETRY_AFTER).is_none() {
            if let Ok(h) = HeaderValue::from_str(&s.to_string()) {
                res.headers_mut().insert(header::RETRY_AFTER, h);
            }
        }
    }
    res
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn retry_sec_prefers_retry_after_sec() {
        let v = json!({"retry_after_sec": 7, "retry_after_seconds": 99});
        assert_eq!(retry_sec_from_rate_limit_body(&v), Some(7));
    }

    #[test]
    fn status_429_injects_retry_after_from_body() {
        let body = Json(json!({
            "error": "review_rate_limit_exceeded",
            "retry_after_sec": 60,
            "retry_after_seconds": 60,
        }));
        let res = status_json_response_with_429_retry_header(StatusCode::TOO_MANY_REQUESTS, body);
        assert_eq!(
            res.headers()
                .get(header::RETRY_AFTER)
                .and_then(|h| h.to_str().ok()),
            Some("60")
        );
    }

    #[test]
    fn status_429_injects_retry_after_from_retry_after_seconds_only() {
        let body = Json(json!({
            "error": "rate_limit_exceeded",
            "retry_after_seconds": 45,
        }));
        let res = status_json_response_with_429_retry_header(StatusCode::TOO_MANY_REQUESTS, body);
        assert_eq!(
            res.headers()
                .get(header::RETRY_AFTER)
                .and_then(|h| h.to_str().ok()),
            Some("45")
        );
    }
}
