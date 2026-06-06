use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use chrono::{Duration, Utc};
use serde_json::json;
use std::ops::ControlFlow;

use crate::db::{
    get_user_by_id, insert_or_get_pending_entitlement, InsertPendingEntitlementOutcome,
};
use crate::middleware::onboarding_user_write_rate_limit_response_if_exceeded;
use crate::onboarding_counters::inc_onboarding_payment_intents_post;
use crate::state::{extract_session_auth_outcome, ApiMetaState, SessionAuthOutcome};

use crate::routes::chain_off_unavailable_json;

use super::compliance::{
    audit_onboarding_compliance_screening_unavailable_stderr, onboarding_compliance_evaluate,
    onboarding_compliance_http_detail, onboarding_request_id_from_headers,
    persist_onboarding_compliance_screening_hit_best_effort, OnboardingComplianceEval,
};
use super::helpers::{
    idempotency_key_from_headers, onboarding_payment_intents_disabled,
    ONBOARDING_IDEMPOTENCY_KEY_MAX_BYTES,
};
use super::payment_intents_stripe::{
    maybe_stripe_checkout_response, maybe_stripe_payment_intent_response,
};
use super::types::PaymentIntentBody;

pub(super) async fn post_onboarding_payment_intents(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    inc_onboarding_payment_intents_post();
    if state.chain_off.is_none() {
        return chain_off_unavailable_json("POST /api/v1/onboarding/payment-intents")
            .into_response();
    };    let uid = match extract_session_auth_outcome(&state, &headers).await {
        SessionAuthOutcome::User(u) => u,
        SessionAuthOutcome::Unauthorized => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "status": "error",
                    "error": "login_required",
                    "message": "login_required",
                })),
            )
                .into_response();
        }
        SessionAuthOutcome::SessionStoreUnavailable => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "service_unavailable",
                    "message": "service_unavailable",
                })),
            )
                .into_response();
        }
    };
    let pool_opt = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(resp) = onboarding_user_write_rate_limit_response_if_exceeded(pool_opt, &uid).await
    {
        return resp.into_response();
    };    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.clone()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_payment_not_configured",
                    "message": "onboarding_payment_not_configured",
                    "detail": "PostgreSQL pool not mounted; cannot persist payment intent.",
                })),
            )
                .into_response();
        }
    };
    if onboarding_payment_intents_disabled() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "onboarding_payment_intents_disabled",
                "message": "onboarding_payment_intents_disabled",
                "detail": "ONBOARDING_PAYMENT_INTENTS_DISABLED=1 — creating new payment intents is temporarily disabled.",
            })),
        )
            .into_response();
    };    let idem = match idempotency_key_from_headers(&headers) {
        Some(k) => k,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "missing_onboarding_idempotency_key",
                    "message": "missing_onboarding_idempotency_key",
                    "detail": "Provide Idempotency-Key or X-Idempotency-Key (04-附录 §1).",
                })),
            )
                .into_response();
        }
    };    if idem.len() > ONBOARDING_IDEMPOTENCY_KEY_MAX_BYTES {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "invalid_onboarding_idempotency_key",
                "message": "invalid_onboarding_idempotency_key",
                "detail": format!(
                    "Idempotency-Key must be at most {} UTF-8 bytes.",
                    ONBOARDING_IDEMPOTENCY_KEY_MAX_BYTES
                ),
            })),
        )
            .into_response();
    };    let parsed: PaymentIntentBody = match serde_json::from_value(body) {
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
    let role = parsed.role.to_ascii_lowercase();
    if role != "provider" && role != "region_steward" {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "invalid_onboarding_role",
                "message": "invalid_onboarding_role",
            })),
        )
            .into_response();
    };    let sku = parsed.sku.as_deref().unwrap_or("default").trim();
    let sku = if sku.is_empty() { "default" } else { sku };
    let fee_schedule_version = "stub-v0";
    let expires_at = Utc::now() + Duration::hours(1);

    let user_row = match get_user_by_id(&pool, uid).await {
        Ok(Some(u)) => u,
        Ok(None) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_user_missing",
                    "message": "onboarding_user_missing",
                })),
            )
                .into_response();
        }
        Err(e) => {
            eprintln!("[onboarding] get_user_by_id err={}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_intent_user_read_failed",
                    "message": "onboarding_intent_user_read_failed",
                })),
            )
                .into_response();
        }
    };    match onboarding_compliance_evaluate(&user_row.email) {
        OnboardingComplianceEval::Allow => {}
        OnboardingComplianceEval::Forbidden(kind) => {
            persist_onboarding_compliance_screening_hit_best_effort(
                &state,
                &headers,
                uid,
                "POST /api/v1/onboarding/payment-intents",
                kind,
            )
            .await;
            return (
                StatusCode::FORBIDDEN,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_forbidden_sanctions",
                    "message": "onboarding_forbidden_sanctions",
                    "detail": onboarding_compliance_http_detail(kind),
                })),
            )
                .into_response();
        }
        OnboardingComplianceEval::ScreeningUnavailable => {
            let rid = onboarding_request_id_from_headers(&headers);
            audit_onboarding_compliance_screening_unavailable_stderr(
                "POST /api/v1/onboarding/payment-intents",
                rid.as_deref(),
                uid,
                "list_file_path_missing_or_unreadable",
            );
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_compliance_screening_unavailable",
                    "message": "onboarding_compliance_screening_unavailable",
                    "detail": "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE is missing, unreadable, or exceeds configured size limits; fix the mount before accepting traffic.",
                })),
            )
                .into_response();
        }
    };    let row = match insert_or_get_pending_entitlement(
        &pool,
        uid,
        &role,
        sku,
        fee_schedule_version,
        &idem,
        Some(expires_at),
    )
    .await
    {
        Ok(InsertPendingEntitlementOutcome::Ok(r)) => r,
        Ok(InsertPendingEntitlementOutcome::IdempotencyConflict) => {
            return (
                StatusCode::CONFLICT,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_idempotency_conflict",
                    "message": "onboarding_idempotency_conflict",
                    "detail": "Idempotency-Key is already bound to another user or a different role/sku/fee_schedule_version.",
                })),
            )
                .into_response();
        }
        Err(e) => {
            eprintln!("[onboarding] insert_or_get_pending_entitlement err={}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_intent_persist_failed",
                    "message": "onboarding_intent_persist_failed",
                })),
            )
                .into_response();
        }
    };
    if let ControlFlow::Break(resp) =
        maybe_stripe_checkout_response(&pool, &row, &idem, &parsed).await
    {
        return resp;
    };    if let ControlFlow::Break(resp) =
        maybe_stripe_payment_intent_response(&pool, &row, &idem, &parsed).await
    {
        return resp;
    }

    Json(json!({
        "status": "ok",
        "entitlement_id": row.id,
        "idempotency_key": idem,
        "return_url": parsed.return_url,
        "psp": {
            "client_secret": serde_json::Value::Null,
            "checkout_url": serde_json::Value::Null,
        },
        "meta": {
            "implementation_status": "onboarding_payment_intent_persisted",
            "detail": "PSP client_secret/checkout not wired — entitlement stays pending until POST /api/v1/internal/onboarding/payments/webhook marks paid.",
            "doc": concat!("docs", "/spec/", "04-附录-商家主理人准入费HTTP契约草案-配96-18.md", " §2")
        }
    }))
    .into_response()
}
