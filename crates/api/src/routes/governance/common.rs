//! `X-Implementation-Status: placeholder` 响应头（**TT-MOD-B3-05 · `common`**）。

use axum::http::header::{HeaderName, HeaderValue};
use axum::response::Response;

pub(super) fn add_placeholder_header(res: &mut Response<axum::body::Body>) {
    res.headers_mut().insert(
        HeaderName::from_static("x-implementation-status"),
        HeaderValue::from_static("placeholder"),
    );
}
