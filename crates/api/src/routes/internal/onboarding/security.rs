//! 内网准入 webhook：**HMAC**、时间窗、字段上限与 JSON 体（**96-09**）。

use axum::http::HeaderMap;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use std::env;

type HmacSha256 = Hmac<Sha256>;

pub(super) fn onboarding_webhook_hmac_secret() -> Option<String> {
    env::var("ONBOARDING_WEBHOOK_HMAC_SECRET")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

/// **`ONBOARDING_WEBHOOK_MAX_AGE_SECS`**：正数启用；上限 **7 天** 防误配。
pub(super) fn onboarding_webhook_max_age_secs() -> Option<i64> {
    env::var("ONBOARDING_WEBHOOK_MAX_AGE_SECS")
        .ok()
        .and_then(|s| s.parse::<i64>().ok())
        .filter(|&n| n > 0)
        .map(|n| n.min(86400 * 7))
}

pub(super) fn verify_onboarding_webhook_timestamp_optional(
    headers: &HeaderMap,
    max_age: i64,
) -> Result<(), &'static str> {
    let raw = headers
        .get("X-Onboarding-Webhook-Timestamp")
        .or_else(|| headers.get("x-onboarding-webhook-timestamp"))
        .and_then(|v| v.to_str().ok())
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let Some(raw) = raw else {
        return Err("missing_timestamp");
    };    let ts: i64 = raw.parse().map_err(|_| "invalid_timestamp")?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    if (now - ts).abs() > max_age {
        return Err("timestamp_out_of_window");
    }
    Ok(())
}

pub(super) fn hmac_hex(secret: &str, body: &[u8]) -> Result<String, ()> {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).map_err(|_| ())?;
    mac.update(body);
    Ok(hex::encode(mac.finalize().into_bytes()))
}

fn webhook_hmac_ct_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    };    let mut acc = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        acc |= x ^ y;
    }
    acc == 0
}

/// **`Ok(())`** 或 **缺失 / 无效** 签名（相对 **`v1=<hex>`**）。
pub(super) fn verify_onboarding_webhook_hmac(
    secret: &str,
    body: &[u8],
    headers: &HeaderMap,
) -> Result<(), &'static str> {
    let expected_hex = hmac_hex(secret, body).map_err(|_| "invalid_hmac_key")?;
    let expected = format!("v1={}", expected_hex);
    let sig_header = headers
        .get("X-Onboarding-Webhook-Signature")
        .or_else(|| headers.get("x-onboarding-webhook-signature"))
        .and_then(|v| v.to_str().ok())
        .map(str::trim);
    let Some(sig) = sig_header else {
        return Err("missing_signature");
    };    if webhook_hmac_ct_eq(sig.as_bytes(), expected.as_bytes()) {
        Ok(())
    } else {
        Err("bad_signature")
    }
}

/// 与 **`POST …/onboarding/payment-intents`** 头 **`Idempotency-Key`** 上限一致（JSON 体 **`idempotency_key`** 同源）。
pub(super) const ONBOARDING_WEBHOOK_IDEMPOTENCY_KEY_MAX_BYTES: usize = 256;
/// **`onboarding_payment_events.payload_ref`** 与运维日志对齐。
pub(super) const ONBOARDING_WEBHOOK_PROVIDER_EVENT_ID_MAX_BYTES: usize = 512;
pub(super) const ONBOARDING_WEBHOOK_PROVIDER_PAYMENT_REF_MAX_BYTES: usize = 512;

#[derive(Debug, Deserialize, Serialize)]
pub(super) struct OnboardingPaymentWebhookBody {
    /// 契约版本；当前仅 **1**。
    pub schema_version: u32,
    /// 与 **`onboarding_entitlements.idempotency_key`** 对齐（**payment-intents** 写入时生成/传入）。
    pub idempotency_key: String,
    /// PSP 或清算网关事件 id；**幂等** 与 **`onboarding_payment_events(entitlement_id, payload_ref)`** 唯一索引对齐。
    pub provider_event_id: String,
    /// **`succeeded`** | **`failed`**（**`failed`** 仅记事件，**不**自动 **`paid`**）。
    pub outcome: String,
    #[serde(default)]
    pub provider_payment_ref: Option<String>,
}

pub(super) fn env_truthy(k: &str) -> bool {
    std::env::var(k)
        .map(|s| {
            let t = s.trim().to_ascii_lowercase();
            t == "1" || t == "true" || t == "yes"
        })
        .unwrap_or(false)
}

/// **`ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN`**：未设或 **true** = 同请求 **`apply`**（默认，与旧 **200** 对齐）；显式 **0/false** = **`tokio::spawn`** + **202**。
pub(super) fn env_onboarding_webhook_queue_inline_drain_default_true() -> bool {
    std::env::var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN")
        .map(|s| {
            let t = s.trim().to_ascii_lowercase();
            !(t == "0" || t == "false" || t == "no")
        })
        .unwrap_or(true)
}
