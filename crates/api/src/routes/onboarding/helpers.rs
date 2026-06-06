use axum::http::HeaderMap;
use std::env;

/// 与 **`idempotency_key`** **TEXT** 列及运维日志上限对齐（**UUID**/**Stripe 风格** 远小于此上限）。
pub(super) const ONBOARDING_IDEMPOTENCY_KEY_MAX_BYTES: usize = 256;

pub(super) fn onboarding_payment_intents_disabled() -> bool {
    matches!(
        env::var("ONBOARDING_PAYMENT_INTENTS_DISABLED").as_deref(),
        Ok("1")
    )
}

pub(super) fn idempotency_key_from_headers(headers: &HeaderMap) -> Option<String> {
    headers
        .get("Idempotency-Key")
        .or_else(|| headers.get("X-Idempotency-Key"))
        .and_then(|v| v.to_str().ok())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
}
