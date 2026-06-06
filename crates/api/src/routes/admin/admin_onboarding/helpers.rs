//! 共享解析、裁剪与行 → JSON 映射。

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::db::{
    OnboardingComplianceAuditEventListRow, OnboardingPaymentEventListRow,
    OnboardingWebhookDlqListRow, OnboardingWebhookJobListRow,
};

pub(crate) fn clamp_limit(raw: Option<i64>) -> i64 {
    raw.unwrap_or(100).clamp(1, 500)
}

pub(crate) fn truncate_128(s: &str) -> String {
    s.chars().take(128).collect()
}

pub(crate) fn truncate_64(s: &str) -> String {
    s.chars().take(64).collect()
}

pub(crate) fn parse_uuid_query_user_id(raw: &Option<String>) -> Result<(Option<Uuid>, Value), ()> {
    let Some(s) = raw.as_ref() else {
        return Ok((None, Value::Null));
    };    let t = s.trim();
    if t.is_empty() {
        return Ok((None, Value::Null));
    };    let u = Uuid::parse_str(t).map_err(|_| ())?;
    Ok((Some(u), json!(u.to_string())))
}

pub(crate) fn parse_entitlement_id_query(
    raw: &Option<String>,
) -> Result<(Option<Uuid>, Value), ()> {
    let Some(s) = raw.as_ref() else {
        return Ok((None, Value::Null));
    };    let t = s.trim();
    if t.is_empty() {
        return Ok((None, Value::Null));
    };    let u = Uuid::parse_str(t).map_err(|_| ())?;
    Ok((Some(u), json!(u.to_string())))
}

pub(crate) fn parse_event_type_filter(raw: &Option<String>) -> (Option<String>, Value) {
    let Some(s) = raw.as_ref() else {
        return (None, Value::Null);
    };    let t = s.trim();
    if t.is_empty() {
        return (None, Value::Null);
    };    let trunc = truncate_64(t);
    (Some(trunc.clone()), json!(trunc))
}

pub(crate) fn parse_status_role_filter(raw: &Option<String>) -> (Option<String>, Value) {
    let Some(s) = raw.as_ref() else {
        return (None, Value::Null);
    };    let t = s.trim();
    if t.is_empty() {
        return (None, Value::Null);
    };    let trunc = truncate_128(t);
    (Some(trunc.clone()), json!(trunc))
}

pub(crate) fn parse_entitlement_path_id(raw: &str) -> Result<Uuid, Response> {
    Uuid::parse_str(raw).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(
                "invalid_onboarding_entitlement_id",
            )),
        )
            .into_response()
    })
}

pub(crate) fn parse_user_path_id(raw: &str) -> Result<Uuid, Response> {
    Uuid::parse_str(raw).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_user_id")),
        )
            .into_response()
    })
}

pub(crate) fn payment_event_row_json(r: &OnboardingPaymentEventListRow) -> Value {
    json!({
        "id": r.id,
        "entitlement_id": r.entitlement_id,
        "event_type": r.event_type,
        "payload_ref": r.payload_ref,
        "received_at": r.received_at.to_rfc3339(),
    })
}

pub(crate) fn webhook_job_row_json(r: &OnboardingWebhookJobListRow) -> Value {
    json!({
        "id": r.id,
        "created_at": r.created_at.to_rfc3339(),
        "updated_at": r.updated_at.to_rfc3339(),
        "status": r.status,
        "attempts": r.attempts,
        "last_error": r.last_error,
        "resolution": r.resolution,
        "payload": r.payload.0.clone(),
    })
}

pub(crate) fn webhook_dlq_row_json(r: &OnboardingWebhookDlqListRow) -> Value {
    json!({
        "id": r.id,
        "created_at": r.created_at.to_rfc3339(),
        "idempotency_key": r.idempotency_key,
        "provider_event_id": r.provider_event_id,
        "outcome": r.outcome,
        "raw_body": r.raw_body.0.clone(),
        "error_message": r.error_message,
        "replayed_at": r.replayed_at.map(|t| t.to_rfc3339()),
    })
}

pub(crate) fn compliance_row_json(r: &OnboardingComplianceAuditEventListRow) -> Value {
    json!({
        "id": r.id,
        "created_at": r.created_at.to_rfc3339(),
        "user_id": r.user_id,
        "request_id": r.request_id,
        "route": r.route,
        "decision": r.decision,
        "screening_tier": r.screening_tier,
        "api_error": r.api_error,
    })
}
