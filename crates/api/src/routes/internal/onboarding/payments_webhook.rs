//! **POST /api/v1/internal/onboarding/payments/webhook** 主处理与 **apply** 结果映射。

use axum::body::Bytes;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::db::{
    apply_payment_webhook, finalize_onboarding_webhook_job_after_apply,
    insert_onboarding_webhook_dlq, insert_onboarding_webhook_job,
    run_onboarding_webhook_job_worker, WebhookApplyOutcome,
};
use crate::state::ApiMetaState;

use super::security::{
    env_onboarding_webhook_queue_inline_drain_default_true, env_truthy,
    onboarding_webhook_hmac_secret, onboarding_webhook_max_age_secs,
    verify_onboarding_webhook_hmac, verify_onboarding_webhook_timestamp_optional,
    OnboardingPaymentWebhookBody, ONBOARDING_WEBHOOK_IDEMPOTENCY_KEY_MAX_BYTES,
    ONBOARDING_WEBHOOK_PROVIDER_EVENT_ID_MAX_BYTES,
    ONBOARDING_WEBHOOK_PROVIDER_PAYMENT_REF_MAX_BYTES,
};
use crate::routes::internal::common;

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
            let body_dump: Value = serde_json::to_value(parsed)
                .unwrap_or_else(|_| json!({ "detail": "serialize_failed" }));
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
    };
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
    };    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.clone()) {
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
    };    if parsed.idempotency_key.trim().is_empty()
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
    };    let idem_trim = parsed.idempotency_key.trim();
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
    };    let ev_trim = parsed.provider_event_id.trim();
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
    };    if let Some(ref pref) = parsed.provider_payment_ref {
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
    };    let pref_trim = parsed
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
        };        let job_id = match insert_onboarding_webhook_job(&pool, &payload_val).await {
            Ok(id) => id,
            Err(e) => {
                eprintln!(
                    "[onboarding_webhook] insert_onboarding_webhook_job err={}",
                    e
                );
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
            let outcome =
                apply_payment_webhook(&pool, idem_trim, ev_trim, parsed.outcome.trim(), pref_trim)
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
            return map_webhook_apply_outcome_to_http(outcome, &parsed, &pool, idem_trim, ev_trim)
                .await;
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
    };    let outcome =
        apply_payment_webhook(&pool, idem_trim, ev_trim, parsed.outcome.trim(), pref_trim).await;
    map_webhook_apply_outcome_to_http(outcome, &parsed, &pool, idem_trim, ev_trim).await
}
