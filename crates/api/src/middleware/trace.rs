//! traceId / messageId 中间件（01 §9）

use axum::body::Body;
use axum::http::{header::HeaderName, header::HeaderValue, HeaderMap, Request};
use axum::response::Response;

/// 解析本次 HTTP 交换的 messageId：客户端可传入 **标准 UUID** 以便重试幂等与日志对齐；非法或缺省则服务端生成。
pub(crate) fn resolve_message_id(headers: &HeaderMap) -> String {
    headers
        .get("x-message-id")
        .and_then(|v| v.to_str().ok())
        .and_then(|s| uuid::Uuid::parse_str(s.trim()).ok())
        .map(|u| u.to_string())
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string())
}

/// traceId：与 01 §9 贯通 requestId→txHash→logIndex 一致；响应头 x-request-id 供审计与资损排查。
pub async fn request_id_layer(req: Request<Body>, next: axum::middleware::Next) -> Response {
    let id = req
        .headers()
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(String::from)
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    let path = req.uri().path().to_string();
    let mut res = next.run(req).await;
    eprintln!(
        "[req] x-request-id={} path={} status={}",
        id,
        path,
        res.status().as_u16()
    );
    if let (Ok(name), Ok(val)) = (
        HeaderName::try_from("x-request-id"),
        HeaderValue::try_from(id.as_str()),
    ) {
        res.headers_mut().insert(name, val);
    }
    res
}

/// messageId：与 01 §9 串联 requestId→messageId→txHash→logIndex。
pub async fn message_id_layer(req: Request<Body>, next: axum::middleware::Next) -> Response {
    let msg_id = resolve_message_id(req.headers());
    let path = req.uri().path().to_string();
    let mut res = next.run(req).await;
    eprintln!(
        "[req] x-message-id={} path={} status={}",
        msg_id,
        path,
        res.status().as_u16()
    );
    if let (Ok(name), Ok(val)) = (
        HeaderName::try_from("x-message-id"),
        HeaderValue::try_from(msg_id.as_str()),
    ) {
        res.headers_mut().insert(name, val);
    }
    res
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_message_id_accepts_valid_client_uuid() {
        let mut h = HeaderMap::new();
        let u = uuid::Uuid::from_u128(0x0123_4567_89ab_cdef_0123_4567_89ab_cdef);
        h.insert(
            HeaderName::from_static("x-message-id"),
            HeaderValue::from_str(&u.to_string()).unwrap(),
        );
        assert_eq!(resolve_message_id(&h), u.to_string());
    }

    #[test]
    fn resolve_message_id_ignores_malformed_header() {
        let mut h = HeaderMap::new();
        h.insert(
            HeaderName::from_static("x-message-id"),
            HeaderValue::from_static("not-a-uuid"),
        );
        let got = resolve_message_id(&h);
        assert_ne!(got, "not-a-uuid");
        assert!(uuid::Uuid::parse_str(&got).is_ok());
    }
}
