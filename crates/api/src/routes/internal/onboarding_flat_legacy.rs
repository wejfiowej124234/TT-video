//! **96-18 F-036** / **96-09**：`POST /api/v1/internal/onboarding/payments/webhook`
//! — 有 **`PgPool`** 时 **落库**（幂等 **`payment_events`** + 条件更新 **`entitlements.status`**）；可选 **`ONBOARDING_WEBHOOK_ASYNC_QUEUE=1`** 先入 **`onboarding_webhook_jobs`**（默认 **内联 drain** 仍 **200**；**`ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN=0`** → **202** + **`tokio::spawn`**，除非 **`ONBOARDING_WEBHOOK_QUEUE_EXTERNAL_ONLY=1`** 交由 **`traveltrust-api onboarding-webhook-worker`**）；无池时保持 **stub** 响应（**不**冒充已写库）。
//! **可选 HMAC**：**`ONBOARDING_WEBHOOK_HMAC_SECRET`** 非空时须 **`X-Onboarding-Webhook-Signature: v1=<hex>`**（**HMAC-SHA256(secret, raw_body)**）。
//! **可选重放窗**：**`ONBOARDING_WEBHOOK_MAX_AGE_SECS`** > 0 时须 **`X-Onboarding-Webhook-Timestamp`**（Unix 秒，与 **`Stripe-Signature`** 的 **`t=`** 同语义）；**不**替代 **mTLS** / 提供商签名校验。
//! **可选边缘硬闸**：**`ONBOARDING_INTERNAL_WEBHOOK_ALLOWLIST_CIDRS`**（IPv4 CIDR 列表）、**`ONBOARDING_INTERNAL_WEBHOOK_REQUIRE_HTTPS_FORWARDED=1`**（须 **`X-Forwarded-Proto: https`**）；**mTLS 在 Ingress** 终止，不由本 handler 校验。

use axum::body::Bytes;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use hex;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::Sha256;
use sqlx::PgPool;
use std::env;

use crate::db::{
    apply_payment_webhook, finalize_onboarding_webhook_job_after_apply, insert_onboarding_webhook_dlq,
    insert_onboarding_webhook_job, run_onboarding_webhook_job_worker, WebhookApplyOutcome,
};
use crate::state::ApiMetaState;

use super::common;

type HmacSha256 = Hmac<Sha256>;

fn onboarding_webhook_hmac_secret() -> Option<String> {
    env::var("ONBOARDING_WEBHOOK_HMAC_SECRET")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

/// **`ONBOARDING_WEBHOOK_MAX_AGE_SECS`**：正数启用；上限 **7 天** 防误配。
fn onboarding_webhook_max_age_secs() -> Option<i64> {
    env::var("ONBOARDING_WEBHOOK_MAX_AGE_SECS")
        .ok()
        .and_then(|s| s.parse::<i64>().ok())
        .filter(|&n| n > 0)
        .map(|n| n.min(86400 * 7))
}

fn verify_onboarding_webhook_timestamp_optional(headers: &HeaderMap, max_age: i64) -> Result<(), &'static str> {
    let raw = headers
        .get("X-Onboarding-Webhook-Timestamp")
        .or_else(|| headers.get("x-onboarding-webhook-timestamp"))
        .and_then(|v| v.to_str().ok())
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let Some(raw) = raw else {
        return Err("missing_timestamp");
    };
    let ts: i64 = raw.parse().map_err(|_| "invalid_timestamp")?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    if (now - ts).abs() > max_age {
        return Err("timestamp_out_of_window");
    }
    Ok(())
}

fn hmac_hex(secret: &str, body: &[u8]) -> Result<String, ()> {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).map_err(|_| ())?;
    mac.update(body);
    Ok(hex::encode(mac.finalize().into_bytes()))
}

fn webhook_hmac_ct_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut acc = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        acc |= x ^ y;
    }
    acc == 0
}

/// **`Ok(())`** 或 **缺失 / 无效** 签名（相对 **`v1=<hex>`**）。
fn verify_onboarding_webhook_hmac(secret: &str, body: &[u8], headers: &HeaderMap) -> Result<(), &'static str> {
    let expected_hex = hmac_hex(secret, body).map_err(|_| "invalid_hmac_key")?;
    let expected = format!("v1={}", expected_hex);
    let sig_header = headers
        .get("X-Onboarding-Webhook-Signature")
        .or_else(|| headers.get("x-onboarding-webhook-signature"))
        .and_then(|v| v.to_str().ok())
        .map(str::trim);
    let Some(sig) = sig_header else {
        return Err("missing_signature");
    };
    if webhook_hmac_ct_eq(sig.as_bytes(), expected.as_bytes()) {
        Ok(())
    } else {
        Err("bad_signature")
    }
}

/// 与 **`POST …/onboarding/payment-intents`** 头 **`Idempotency-Key`** 上限一致（JSON 体 **`idempotency_key`** 同源）。
const ONBOARDING_WEBHOOK_IDEMPOTENCY_KEY_MAX_BYTES: usize = 256;
/// **`onboarding_payment_events.payload_ref`** 与运维日志对齐。
const ONBOARDING_WEBHOOK_PROVIDER_EVENT_ID_MAX_BYTES: usize = 512;
const ONBOARDING_WEBHOOK_PROVIDER_PAYMENT_REF_MAX_BYTES: usize = 512;

#[derive(Debug, Deserialize, Serialize)]
struct OnboardingPaymentWebhookBody {
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

fn env_truthy(k: &str) -> bool {
    std::env::var(k)
        .map(|s| {
            let t = s.trim().to_ascii_lowercase();
            t == "1" || t == "true" || t == "yes"
        })
        .unwrap_or(false)
}

/// **`ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN`**：未设或 **true** = 同请求 **`apply`**（默认，与旧 **200** 对齐）；显式 **0/false** = **`tokio::spawn`** + **202**。
fn env_onboarding_webhook_queue_inline_drain_default_true() -> bool {
    std::env::var("ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN")
        .map(|s| {
            let t = s.trim().to_ascii_lowercase();
            !(t == "0" || t == "false" || t == "no")
        })
        .unwrap_or(true)
}

async fn map_webhook_apply_outcome_to_http(
    outcome: Result<WebhookApplyOutcome, sqlx::Error>,
    parsed: &OnboardingPaymentWebhookBody,
    pool: &PgPool,
    idem_trim: &str,
    ev_trim: &str,
) -> Response {
    match outcome {
        Ok(WebhookApplyOutcome::UnknownIdempotencyKey) => (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "onboarding_webhook_unknown_idempotency_key",
                "message": "onboarding_webhook_unknown_idempotency_key",
            })),
        )
            .into_response(),
        Ok(WebhookApplyOutcome::DuplicateEvent) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "accepted": false,
                "duplicate": true,
                "meta": { "implementation_status": "onboarding_webhook_db" }
            })),
        )
            .into_response(),
        Ok(WebhookApplyOutcome::Accepted) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "accepted": true,
                "meta": { "implementation_status": "onboarding_webhook_db" }
            })),
        )
            .into_response(),
        Err(e) => {
            let body_dump: Value =
                serde_json::to_value(parsed).unwrap_or_else(|_| json!({ "detail": "serialize_failed" }));
            match insert_onboarding_webhook_dlq(
                pool,
                idem_trim,
                ev_trim,
                parsed.outcome.trim(),
                &body_dump,
                &e.to_string(),
            )
            .await
            {
                Ok(()) => eprintln!(
                    "[onboarding_webhook] apply_payment_webhook err={} (recorded onboarding_webhook_dlq)",
                    e
                ),
                Err(e2) => eprintln!(
                    "[onboarding_webhook] apply_payment_webhook err={} dlq_persist_failed={}",
                    e, e2
                ),
            }
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_webhook_db_failed",
                    "message": "onboarding_webhook_db_failed",
                })),
            )
                .into_response()
        }
    }
}

/// **POST /api/v1/internal/onboarding/payments/webhook**
pub async fn post_internal_onboarding_payments_webhook(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    body: Bytes,
) -> impl IntoResponse {
    if let Some(r) = common::internal_operator_secret_required_response() {
        return r;
    }

    if let Some(r) = common::onboarding_internal_webhook_request_gate_response(&headers) {
        return r;
    }

    if let Some(max_age) = onboarding_webhook_max_age_secs() {
        match verify_onboarding_webhook_timestamp_optional(&headers, max_age) {
            Ok(()) => {}
            Err("missing_timestamp") => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_webhook_timestamp_required",
                        "message": "onboarding_webhook_timestamp_required",
                        "detail": format!(
                            "Set X-Onboarding-Webhook-Timestamp (Unix seconds). Max skew ONBOARDING_WEBHOOK_MAX_AGE_SECS={max_age}."
                        ),
                    })),
                )
                    .into_response();
            }
            Err("invalid_timestamp") => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_webhook_timestamp_invalid",
                        "message": "onboarding_webhook_timestamp_invalid",
                    })),
                )
                    .into_response();
            }
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_webhook_timestamp_stale",
                        "message": "onboarding_webhook_timestamp_stale",
                        "detail": format!(
                            "Timestamp outside ONBOARDING_WEBHOOK_MAX_AGE_SECS={max_age} window."
                        ),
                    })),
                )
                    .into_response();
            }
        }
    }

    if let Some(ref sec) = onboarding_webhook_hmac_secret() {
        match verify_onboarding_webhook_hmac(sec, body.as_ref(), &headers) {
            Ok(()) => {}
            Err("missing_signature") => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_webhook_signature_required",
                        "message": "onboarding_webhook_signature_required",
                        "detail": "Set X-Onboarding-Webhook-Signature: v1=<hex> (HMAC-SHA256 over raw body).",
                    })),
                )
                    .into_response();
            }
            Err(_) => {
                return (
                    StatusCode::FORBIDDEN,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_webhook_invalid_signature",
                        "message": "onboarding_webhook_invalid_signature",
                    })),
                )
                    .into_response();
            }
        }
    }

    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.clone()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::OK,
                Json(json!({
                    "status": "ok",
                    "accepted": false,
                    "meta": { "implementation_status": "onboarding_webhook_stub", "detail": "database pool not mounted on chain_off" }
                })),
            )
                .into_response();
        }
    };

    let parsed: OnboardingPaymentWebhookBody = match serde_json::from_slice(body.as_ref()) {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "invalid_body",
                    "message": "invalid_body",
                    "detail": e.to_string(),
                })),
            )
                .into_response();
        }
    };

    if parsed.schema_version != 1 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "invalid_schema_version",
                "message": "invalid_schema_version",
            })),
        )
            .into_response();
    }
    if parsed.idempotency_key.trim().is_empty()
        || parsed.provider_event_id.trim().is_empty()
        || parsed.outcome.trim().is_empty()
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "invalid_webhook_fields",
                "message": "invalid_webhook_fields",
                "detail": "idempotency_key, provider_event_id, outcome are required",
            })),
        )
            .into_response();
    }

    let idem_trim = parsed.idempotency_key.trim();
    if idem_trim.len() > ONBOARDING_WEBHOOK_IDEMPOTENCY_KEY_MAX_BYTES {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "invalid_onboarding_idempotency_key",
                "message": "invalid_onboarding_idempotency_key",
                "detail": format!(
                    "idempotency_key must be at most {} UTF-8 bytes.",
                    ONBOARDING_WEBHOOK_IDEMPOTENCY_KEY_MAX_BYTES
                ),
            })),
        )
            .into_response();
    }
    let ev_trim = parsed.provider_event_id.trim();
    if ev_trim.len() > ONBOARDING_WEBHOOK_PROVIDER_EVENT_ID_MAX_BYTES {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "invalid_onboarding_webhook_field_length",
                "message": "invalid_onboarding_webhook_field_length",
                "detail": format!(
                    "provider_event_id must be at most {} UTF-8 bytes.",
                    ONBOARDING_WEBHOOK_PROVIDER_EVENT_ID_MAX_BYTES
                ),
            })),
        )
            .into_response();
    }
    if let Some(ref pref) = parsed.provider_payment_ref {
        let t = pref.trim();
        if !t.is_empty() && t.len() > ONBOARDING_WEBHOOK_PROVIDER_PAYMENT_REF_MAX_BYTES {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "invalid_onboarding_webhook_field_length",
                    "message": "invalid_onboarding_webhook_field_length",
                    "detail": format!(
                        "provider_payment_ref must be at most {} UTF-8 bytes.",
                        ONBOARDING_WEBHOOK_PROVIDER_PAYMENT_REF_MAX_BYTES
                    ),
                })),
            )
                .into_response();
        }
    }

    let pref_trim = parsed
        .provider_payment_ref
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());

    let async_q = env_truthy("ONBOARDING_WEBHOOK_ASYNC_QUEUE");
    let inline_drain = env_onboarding_webhook_queue_inline_drain_default_true();

    if async_q {
        let payload_val = match serde_json::to_value(&parsed) {
            Ok(v) => v,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_webhook_job_payload_failed",
                        "message": "onboarding_webhook_job_payload_failed",
                        "detail": e.to_string(),
                    })),
                )
                    .into_response();
            }
        };
        let job_id = match insert_onboarding_webhook_job(&pool, &payload_val).await {
            Ok(id) => id,
            Err(e) => {
                eprintln!("[onboarding_webhook] insert_onboarding_webhook_job err={}", e);
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_webhook_db_failed",
                        "message": "onboarding_webhook_db_failed",
                    })),
                )
                    .into_response();
            }
        };

        if inline_drain {
            let outcome = apply_payment_webhook(
                &pool,
                idem_trim,
                ev_trim,
                parsed.outcome.trim(),
                pref_trim,
            )
            .await;
            if let Err(e) = finalize_onboarding_webhook_job_after_apply(
                &pool,
                job_id,
                &outcome,
                idem_trim,
                ev_trim,
                parsed.outcome.trim(),
                &payload_val,
            )
            .await
            {
                eprintln!("[onboarding_webhook] finalize job {} err={}", job_id, e);
            }
            return map_webhook_apply_outcome_to_http(outcome, &parsed, &pool, idem_trim, ev_trim).await;
        }

        // **96-09**：独立进程 drain（**`traveltrust-api onboarding-webhook-worker`**）时须 **`ONBOARDING_WEBHOOK_QUEUE_EXTERNAL_ONLY=1`**，
        // 避免与 **`tokio::spawn(run_onboarding_webhook_job_worker)`** 并发抢 **`pending` → `processing`** 首写。
        if !env_truthy("ONBOARDING_WEBHOOK_QUEUE_EXTERNAL_ONLY") {
            let pool_bg = pool.clone();
            tokio::spawn(async move {
                if let Err(e) = run_onboarding_webhook_job_worker(&pool_bg, job_id).await {
                    eprintln!("[onboarding_webhook_queue] worker job {} err={}", job_id, e);
                }
            });
        }

        return (
            StatusCode::ACCEPTED,
            Json(json!({
                "status": "accepted",
                "queued": true,
                "job_id": job_id,
                "meta": { "implementation_status": "onboarding_webhook_db_queued" }
            })),
        )
            .into_response();
    }

    let outcome = apply_payment_webhook(
        &pool,
        idem_trim,
        ev_trim,
        parsed.outcome.trim(),
        pref_trim,
    )
    .await;
    map_webhook_apply_outcome_to_http(outcome, &parsed, &pool, idem_trim, ev_trim).await
}

#[cfg(test)]
mod webhook_hmac_tests {
    use super::*;

    #[test]
    fn hmac_verify_accepts_round_trip_v1_hex() {
        let secret = "unit-secret";
        let body = br#"{"schema_version":1,"idempotency_key":"k","provider_event_id":"e","outcome":"succeeded"}"#;
        let hx = hmac_hex(secret, body).unwrap();
        let mut headers = HeaderMap::new();
        headers.insert(
            "X-Onboarding-Webhook-Signature",
            format!("v1={}", hx).parse().expect("header value"),
        );
        assert!(verify_onboarding_webhook_hmac(secret, body, &headers).is_ok());
    }

    #[test]
    fn webhook_timestamp_optional_accepts_fresh() {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;
        let mut headers = HeaderMap::new();
        headers.insert(
            "X-Onboarding-Webhook-Timestamp",
            now.to_string().parse().expect("header"),
        );
        assert!(verify_onboarding_webhook_timestamp_optional(&headers, 600).is_ok());
    }

    #[test]
    fn webhook_timestamp_optional_rejects_stale() {
        let old = 1_000_000_i64;
        let mut headers = HeaderMap::new();
        headers.insert(
            "X-Onboarding-Webhook-Timestamp",
            old.to_string().parse().expect("header"),
        );
        assert_eq!(
            verify_onboarding_webhook_timestamp_optional(&headers, 60),
            Err("timestamp_out_of_window")
        );
    }
}
