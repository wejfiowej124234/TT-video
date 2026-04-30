//! **120 / 96-18**：**`/api/v1/onboarding/*`** 粗粒度 **HTTP 到达计数**（进程内 **`AtomicU64`**，供 **`GET /metrics`** **`rate()`** 近似 QPS / 分母）。
//!
//! 另含 **`traveltrust_onboarding_http_responses_total{{route,status_class}}`**：**2xx**（**状态码低于 400**）/ **4xx** / **5xx** 粗分桶（**`onboarding_http_response_metrics_layer`** 包在 **`onboarding::router()`** 上）。
//!
//! **不**替代 **PSP** 真成功/失败语义；**不**含 **Stripe webhook** 独立路径。

use axum::body::Body;
use axum::http::{Request, StatusCode};
use axum::middleware::Next;
use axum::response::Response;
use std::sync::atomic::{AtomicU64, Ordering};

static QUOTE_GET: AtomicU64 = AtomicU64::new(0);
static PAYMENT_INTENTS_POST: AtomicU64 = AtomicU64::new(0);
static ENTITLEMENTS_ME_GET: AtomicU64 = AtomicU64::new(0);
static ROLE_CONFIRM_POST: AtomicU64 = AtomicU64::new(0);

/// **4** 条公开 onboarding 路由 × **3** 个 **`status_class`**（与 **`/metrics`** 标签一致）。
#[rustfmt::skip]
static ONBOARDING_HTTP_RESPONSES: [AtomicU64; 12] = [
    AtomicU64::new(0), AtomicU64::new(0), AtomicU64::new(0),
    AtomicU64::new(0), AtomicU64::new(0), AtomicU64::new(0),
    AtomicU64::new(0), AtomicU64::new(0), AtomicU64::new(0),
    AtomicU64::new(0), AtomicU64::new(0), AtomicU64::new(0),
];

pub const HTTP_RESP_ROUTE_NAMES: [&str; 4] = [
    "quote",
    "payment_intents",
    "entitlements_me",
    "role_confirm",
];

pub const HTTP_RESP_CLASS_NAMES: [&str; 3] = ["2xx", "4xx", "5xx"];

#[inline]
pub fn inc_onboarding_quote_get() {
    QUOTE_GET.fetch_add(1, Ordering::Relaxed);
}

#[inline]
pub fn inc_onboarding_payment_intents_post() {
    PAYMENT_INTENTS_POST.fetch_add(1, Ordering::Relaxed);
}

#[inline]
pub fn inc_onboarding_entitlements_me_get() {
    ENTITLEMENTS_ME_GET.fetch_add(1, Ordering::Relaxed);
}

#[inline]
pub fn inc_onboarding_role_confirm_post() {
    ROLE_CONFIRM_POST.fetch_add(1, Ordering::Relaxed);
}

fn route_idx(path: &str, method: &str) -> Option<usize> {
    match (method, path) {
        ("GET", "/api/v1/onboarding/quote") => Some(0),
        ("POST", "/api/v1/onboarding/payment-intents") => Some(1),
        ("GET", "/api/v1/onboarding/entitlements/me") => Some(2),
        ("POST", "/api/v1/onboarding/role-confirm") => Some(3),
        _ => None,
    }
}

fn status_class_idx(status: StatusCode) -> usize {
    let c = status.as_u16();
    if c < 400 {
        0
    } else if c < 500 {
        1
    } else {
        2
    }
}

#[inline]
pub fn http_response_count(route: usize, class: usize) -> u64 {
    ONBOARDING_HTTP_RESPONSES
        .get(route * 3 + class)
        .map(|c| c.load(Ordering::Relaxed))
        .unwrap_or(0)
}

fn record_onboarding_http_response(path: &str, method: &str, status: StatusCode) {
    let Some(route) = route_idx(path, method) else {
        return;
    };
    let class = status_class_idx(status);
    let idx = route * 3 + class;
    ONBOARDING_HTTP_RESPONSES[idx].fetch_add(1, Ordering::Relaxed);
}

/// **`onboarding::router()`** 专用：在 **`next.run`** 之后按 **最终** **HTTP** **状态** 记账。
pub async fn onboarding_http_response_metrics_layer(
    request: Request<Body>,
    next: Next,
) -> Response {
    let path = request.uri().path().to_string();
    let method = request.method().as_str().to_string();
    let response = next.run(request).await;
    record_onboarding_http_response(&path, &method, response.status());
    response
}

/// 与 **`GET /metrics`** 序列化同源的快照。
#[derive(Debug, Clone, Copy)]
pub struct OnboardingCountersSnapshot {
    pub quote_get: u64,
    pub payment_intents_post: u64,
    pub entitlements_me_get: u64,
    pub role_confirm_post: u64,
}

pub fn snapshot() -> OnboardingCountersSnapshot {
    OnboardingCountersSnapshot {
        quote_get: QUOTE_GET.load(Ordering::Relaxed),
        payment_intents_post: PAYMENT_INTENTS_POST.load(Ordering::Relaxed),
        entitlements_me_get: ENTITLEMENTS_ME_GET.load(Ordering::Relaxed),
        role_confirm_post: ROLE_CONFIRM_POST.load(Ordering::Relaxed),
    }
}
