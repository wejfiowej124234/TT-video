//! **70 / 96-18 / 96-09**：`GET/PATCH/POST /api/v1/admin/onboarding/*` 与 **`GET …/admin/users/:id/onboarding-entitlements`**。
//! 行为与 **`onboarding_app_stack_db_api_tests`** **`matrix_93_admin_onb_*`** 对拍。

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::db::{
    admin_onboarding_entitlement_detail_json, get_onboarding_entitlement_by_id,
    list_entitlements_for_user, list_onboarding_compliance_audit_events_admin,
    list_onboarding_entitlements_admin, list_onboarding_payment_events_admin,
    list_onboarding_payment_events_for_entitlement_admin, list_onboarding_webhook_dlq_admin,
    list_onboarding_webhook_jobs_admin, merge_onboarding_entitlement_admin_metadata,
    record_paid_entitlement_financial_reversal_admin, revoke_onboarding_entitlement_pending_admin,
    OnboardingComplianceAuditEventListRow, OnboardingPaymentEventListRow,
    OnboardingWebhookDlqListRow, OnboardingWebhookJobListRow, RecordPaidFinancialReversalOutcome,
    RevokePendingEntitlementAdminOutcome,
};
use crate::routes::chain_off_unavailable_json;
use crate::stripe_onboarding::try_admin_psp_refund_after_financial_reversal;
use crate::state::ApiMetaState;

const ADMIN_ONBOARDING_METADATA_PATCH_MAX_BYTES: usize = 16384;

#[derive(Debug, Default, Deserialize)]
pub struct AdminOnboardingEntitlementsListQuery {
    #[serde(default)]
    pub user_id: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub role_target: Option<String>,
    #[serde(default)]
    pub limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminOnboardingWebhookJobsQuery {
    #[serde(default)]
    pub user_id: Option<String>,
    #[serde(default)]
    pub limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminOnboardingWebhookDlqQuery {
    #[serde(default)]
    pub user_id: Option<String>,
    #[serde(default)]
    pub limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminOnboardingComplianceAuditQuery {
    #[serde(default)]
    pub user_id: Option<String>,
    #[serde(default)]
    pub limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminOnboardingPaymentEventsQuery {
    #[serde(default)]
    pub entitlement_id: Option<String>,
    #[serde(default)]
    pub event_type: Option<String>,
    #[serde(default)]
    pub limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminOnboardingEntitlementPaymentEventsQuery {
    #[serde(default)]
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct PatchAdminOnboardingEntitlementBody {
    pub admin: Value,
}

#[derive(Debug, Deserialize)]
pub struct RevokeOnboardingEntitlementBody {
    pub reason: String,
}

#[derive(Debug, Deserialize)]
pub struct FinancialReversalBody {
    pub reason: String,
    pub reversal_kind: String,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/users/:user_id/onboarding-entitlements",
            get(get_admin_user_onboarding_entitlements),
        )
        .route(
            "/api/v1/admin/onboarding/entitlements/:entitlement_id/payment-events",
            get(get_admin_onboarding_entitlement_payment_events),
        )
        .route(
            "/api/v1/admin/onboarding/entitlements/:entitlement_id/revoke",
            post(post_admin_onboarding_entitlement_revoke),
        )
        .route(
            "/api/v1/admin/onboarding/entitlements/:entitlement_id/financial-reversal",
            post(post_admin_onboarding_entitlement_financial_reversal),
        )
        .route(
            "/api/v1/admin/onboarding/entitlements/:entitlement_id",
            get(get_admin_onboarding_entitlement_by_id).patch(patch_admin_onboarding_entitlement),
        )
        .route(
            "/api/v1/admin/onboarding/entitlements",
            get(get_admin_onboarding_entitlements_list),
        )
        .route(
            "/api/v1/admin/onboarding/payment-events",
            get(get_admin_onboarding_payment_events_list),
        )
        .route(
            "/api/v1/admin/onboarding/webhook-jobs",
            get(get_admin_onboarding_webhook_jobs),
        )
        .route(
            "/api/v1/admin/onboarding/webhook-dlq",
            get(get_admin_onboarding_webhook_dlq),
        )
        .route(
            "/api/v1/admin/onboarding/compliance-audit-events",
            get(get_admin_onboarding_compliance_audit_events),
        )
}

fn clamp_limit(raw: Option<i64>) -> i64 {
    let mut limit = raw.unwrap_or(100);
    if limit < 1 {
        limit = 1;
    };    if limit > 500 {
        limit = 500;
    }
    limit
}

fn truncate_128(s: &str) -> String {
    s.chars().take(128).collect()
}

fn truncate_64(s: &str) -> String {
    s.chars().take(64).collect()
}

fn parse_uuid_query_user_id(raw: &Option<String>) -> Result<(Option<Uuid>, Value), ()> {
    let Some(s) = raw.as_ref() else {
        return Ok((None, Value::Null));
    };    let t = s.trim();
    if t.is_empty() {
        return Ok((None, Value::Null));
    };    let u = Uuid::parse_str(t).map_err(|_| ())?;
    Ok((Some(u), json!(u.to_string())))
}

fn parse_entitlement_id_query(raw: &Option<String>) -> Result<(Option<Uuid>, Value), ()> {
    let Some(s) = raw.as_ref() else {
        return Ok((None, Value::Null));
    };    let t = s.trim();
    if t.is_empty() {
        return Ok((None, Value::Null));
    };    let u = Uuid::parse_str(t).map_err(|_| ())?;
    Ok((Some(u), json!(u.to_string())))
}

fn parse_event_type_filter(raw: &Option<String>) -> (Option<String>, Value) {
    let Some(s) = raw.as_ref() else {
        return (None, Value::Null);
    };    let t = s.trim();
    if t.is_empty() {
        return (None, Value::Null);
    };    let trunc = truncate_64(t);
    (Some(trunc.clone()), json!(trunc))
}

fn parse_status_role_filter(raw: &Option<String>) -> (Option<String>, Value) {
    let Some(s) = raw.as_ref() else {
        return (None, Value::Null);
    };    let t = s.trim();
    if t.is_empty() {
        return (None, Value::Null);
    };    let trunc = truncate_128(t);
    (Some(trunc.clone()), json!(trunc))
}

fn parse_entitlement_path_id(raw: &str) -> Result<Uuid, Response> {
    Uuid::parse_str(raw).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_onboarding_entitlement_id")),
        )
            .into_response()
    })
}

fn parse_user_path_id(raw: &str) -> Result<Uuid, Response> {
    Uuid::parse_str(raw).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_user_id")),
        )
            .into_response()
    })
}

fn payment_event_row_json(r: &OnboardingPaymentEventListRow) -> Value {
    json!({
        "id": r.id,
        "entitlement_id": r.entitlement_id,
        "event_type": r.event_type,
        "payload_ref": r.payload_ref,
        "received_at": r.received_at.to_rfc3339(),
    })
}

fn webhook_job_row_json(r: &OnboardingWebhookJobListRow) -> Value {
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

fn webhook_dlq_row_json(r: &OnboardingWebhookDlqListRow) -> Value {
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

fn compliance_row_json(r: &OnboardingComplianceAuditEventListRow) -> Value {
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

pub async fn get_admin_user_onboarding_entitlements(
    State(state): State<ApiMetaState>,
    Path(user_id_raw): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match super::require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let target_id = match parse_user_path_id(&user_id_raw) {
        Ok(u) => u,
        Err(r) => return r,
    };

    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable_json("GET /api/v1/admin/users/:id/onboarding-entitlements").into_response();
    };    {
        let store = co.store.read().await;
        if !store.users.contains_key(&target_id) {
            return (
                StatusCode::NOT_FOUND,
                Json(crate::api_json::err_key("user_not_found")),
            )
                .into_response();
        }
    };    let rows = match list_entitlements_for_user(pool, target_id).await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": e.to_string()})),
            )
                .into_response();
        }
    };
    let ents: Vec<Value> = rows
        .iter()
        .map(admin_onboarding_entitlement_detail_json)
        .collect();
    let mut body = json!({
        "status": "ok",
        "user_id": target_id,
        "entitlements": ents,
    });
    super::admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_onboarding_entitlements_list(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOnboardingEntitlementsListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor = match super::require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };

    let (filter_uid, applied_uid) = match parse_uuid_query_user_id(&q.user_id) {
        Ok(v) => v,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_user_id")),
            )
                .into_response();
        }
    };    let (filter_status, applied_status) = parse_status_role_filter(&q.status);
    let (filter_role, applied_role) = parse_status_role_filter(&q.role_target);
    let limit = clamp_limit(q.limit);

    let status_ref = filter_status.as_deref();
    let role_ref = filter_role.as_deref();
    let rows = match list_onboarding_entitlements_admin(
        pool,
        filter_uid,
        status_ref,
        role_ref,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": e.to_string()})),
            )
                .into_response();
        }
    };
    let items: Vec<Value> = rows
        .iter()
        .map(admin_onboarding_entitlement_detail_json)
        .collect();

    let mut body = json!({
        "status": "ok",
        "meta": { "implementation_status": "onboarding_entitlements_admin_list_db" },
        "items": items,
        "applied_filters": {
            "user_id": applied_uid,
            "status": applied_status,
            "role_target": applied_role,
            "limit": limit,
        }
    });
    super::admin_attach_meta_build(&mut body);

    let request_id = super::request_id_from_headers(&headers);
    super::write_admin_audit_log_best_effort(
        &state,
        actor.0,
        request_id.as_deref(),
        "admin_onboarding_entitlements_list",
        Some("onboarding_entitlements"),
        None,
        json!({ "limit": limit }),
    )
    .await;

    Json(body).into_response()
}

pub async fn get_admin_onboarding_entitlement_by_id(
    State(state): State<ApiMetaState>,
    Path(ent_id_raw): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor = match super::require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let id = match parse_entitlement_path_id(&ent_id_raw) {
        Ok(u) => u,
        Err(r) => return r,
    };

    let row = match get_onboarding_entitlement_by_id(pool, id).await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": e.to_string()})),
            )
                .into_response();
        }
    };    let Some(ent) = row else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("onboarding_entitlement_not_found")),
        )
            .into_response();
    }
    let mut body = json!({
        "status": "ok",
        "meta": { "implementation_status": "onboarding_entitlements_admin_detail_db" },
        "entitlement": admin_onboarding_entitlement_detail_json(&ent),
    });
    super::admin_attach_meta_build(&mut body);

    let request_id = super::request_id_from_headers(&headers);
    super::write_admin_audit_log_best_effort(
        &state,
        actor.0,
        request_id.as_deref(),
        "admin_onboarding_entitlement_get",
        Some("onboarding_entitlements"),
        Some(&id.to_string()),
        json!({}),
    )
    .await;

    Json(body).into_response()
}

pub async fn patch_admin_onboarding_entitlement(
    State(state): State<ApiMetaState>,
    Path(ent_id_raw): Path<String>,
    headers: HeaderMap,
    Json(body): Json<PatchAdminOnboardingEntitlementBody>,
) -> impl IntoResponse {
    let actor = match super::require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let id = match parse_entitlement_path_id(&ent_id_raw) {
        Ok(u) => u,
        Err(r) => return r,
    };

    if body.admin.is_null() {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("admin_metadata_must_object")),
        )
            .into_response();
    };    if !body.admin.is_object() {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("admin_metadata_must_object")),
        )
            .into_response();
    };    let admin_obj = body.admin.as_object().expect("checked object");
    if admin_obj.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("admin_metadata_empty")),
        )
            .into_response();
    };    let patch_bytes = serde_json::to_vec(&body.admin).unwrap_or_default();
    if patch_bytes.len() > ADMIN_ONBOARDING_METADATA_PATCH_MAX_BYTES {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("admin_metadata_patch_too_large")),
        )
            .into_response();
    };    let updated = match merge_onboarding_entitlement_admin_metadata(pool, id, &body.admin).await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": e.to_string()})),
            )
                .into_response();
        }
    };    let Some(ent) = updated else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("onboarding_entitlement_not_found")),
        )
            .into_response();
    }
    let mut out = json!({
        "status": "ok",
        "meta": { "implementation_status": "onboarding_entitlements_admin_metadata_patch_db" },
        "entitlement": admin_onboarding_entitlement_detail_json(&ent),
    });
    super::admin_attach_meta_build(&mut out);

    let request_id = super::request_id_from_headers(&headers);
    super::write_admin_audit_log_best_effort(
        &state,
        actor.0,
        request_id.as_deref(),
        "admin_onboarding_entitlement_patch",
        Some("onboarding_entitlements"),
        Some(&id.to_string()),
        json!({ "keys": admin_obj.keys().cloned().collect::<Vec<String>>() }),
    )
    .await;

    Json(out).into_response()
}

pub async fn post_admin_onboarding_entitlement_revoke(
    State(state): State<ApiMetaState>,
    Path(ent_id_raw): Path<String>,
    headers: HeaderMap,
    Json(body): Json<RevokeOnboardingEntitlementBody>,
) -> impl IntoResponse {
    let actor = match super::require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let id = match parse_entitlement_path_id(&ent_id_raw) {
        Ok(u) => u,
        Err(r) => return r,
    };

    let reason = body.reason.trim();
    if reason.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("revoke_reason_required")),
        )
            .into_response();
    };    let reason_store: String = reason.chars().take(4000).collect();

    let existing = match get_onboarding_entitlement_by_id(pool, id).await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": e.to_string()})),
            )
                .into_response();
        }
    };    let Some(ent0) = existing else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("onboarding_entitlement_not_found")),
        )
            .into_response();
    };    if ent0.status != "pending" {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("onboarding_entitlement_not_revokable")),
        )
            .into_response();
    };    let outcome = match revoke_onboarding_entitlement_pending_admin(pool, id, &reason_store, actor.0).await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": e.to_string()})),
            )
                .into_response();
        }
    };    let ent = match outcome {
        RevokePendingEntitlementAdminOutcome::Revoked(e) => e,
        RevokePendingEntitlementAdminOutcome::NotFoundOrNotPending => {
            return (
                StatusCode::CONFLICT,
                Json(crate::api_json::err_key("onboarding_entitlement_not_revokable")),
            )
                .into_response();
        }
    };
    let mut out = json!({
        "status": "ok",
        "meta": { "implementation_status": "onboarding_entitlements_admin_revoke_db" },
        "entitlement": admin_onboarding_entitlement_detail_json(&ent),
    });
    super::admin_attach_meta_build(&mut out);

    let request_id = super::request_id_from_headers(&headers);
    super::write_admin_audit_log_best_effort(
        &state,
        actor.0,
        request_id.as_deref(),
        "admin_onboarding_entitlement_revoke",
        Some("onboarding_entitlements"),
        Some(&id.to_string()),
        json!({}),
    )
    .await;

    Json(out).into_response()
}

pub async fn post_admin_onboarding_entitlement_financial_reversal(
    State(state): State<ApiMetaState>,
    Path(ent_id_raw): Path<String>,
    headers: HeaderMap,
    Json(body): Json<FinancialReversalBody>,
) -> impl IntoResponse {
    let actor = match super::require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let id = match parse_entitlement_path_id(&ent_id_raw) {
        Ok(u) => u,
        Err(r) => return r,
    };

    let reason = body.reason.trim();
    if reason.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("onboarding_financial_reversal_reason_required")),
        )
            .into_response();
    };    let kind = body.reversal_kind.trim();
    let kind_lc = kind.to_ascii_lowercase();
    if kind_lc != "refund" && kind_lc != "chargeback" {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("onboarding_financial_reversal_kind_invalid")),
        )
            .into_response();
    };    let row = match get_onboarding_entitlement_by_id(pool, id).await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": e.to_string()})),
            )
                .into_response();
        }
    };    if row.is_none() {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("onboarding_entitlement_not_found")),
        )
            .into_response();
    };    let outcome = match record_paid_entitlement_financial_reversal_admin(
        pool,
        id,
        reason,
        kind_lc.as_str(),
        actor.0,
    )
    .await
    {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": e.to_string()})),
            )
                .into_response();
        }
    };
    match outcome {
        RecordPaidFinancialReversalOutcome::Recorded(ent) => {
            let psp = if kind_lc == "refund" {
                try_admin_psp_refund_after_financial_reversal(&ent).await
            } else {
                Value::Null
            };            let mut out = json!({
                "status": "ok",
                "meta": {
                    "implementation_status": "onboarding_entitlements_admin_financial_reversal_db",
                    "psp_refund": psp,
                },
                "entitlement": admin_onboarding_entitlement_detail_json(&ent),
            });
            super::admin_attach_meta_build(&mut out);

            let request_id = super::request_id_from_headers(&headers);
            super::write_admin_audit_log_best_effort(
                &state,
                actor.0,
                request_id.as_deref(),
                "admin_onboarding_entitlement_financial_reversal",
                Some("onboarding_entitlements"),
                Some(&id.to_string()),
                json!({ "reversal_kind": kind_lc }),
            )
            .await;

            Json(out).into_response()
        }
        RecordPaidFinancialReversalOutcome::NotFound => (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("onboarding_entitlement_not_found")),
        )
            .into_response(),
        RecordPaidFinancialReversalOutcome::NotPaid => (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key(
                "onboarding_entitlement_financial_reversal_requires_paid",
            )),
        )
            .into_response(),
        RecordPaidFinancialReversalOutcome::AlreadyRefunded => (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("onboarding_entitlement_already_refunded")),
        )
            .into_response(),
        RecordPaidFinancialReversalOutcome::InvalidReversalKind => (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("onboarding_financial_reversal_kind_invalid")),
        )
            .into_response(),
    }
}

pub async fn get_admin_onboarding_entitlement_payment_events(
    State(state): State<ApiMetaState>,
    Path(ent_id_raw): Path<String>,
    Query(q): Query<AdminOnboardingEntitlementPaymentEventsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor = match super::require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let eid = match parse_entitlement_path_id(&ent_id_raw) {
        Ok(u) => u,
        Err(r) => return r,
    };
    let limit = clamp_limit(q.limit);

    let exists = match get_onboarding_entitlement_by_id(pool, eid).await {
        Ok(v) => v,
        Err(err) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": err.to_string()})),
            )
                .into_response();
        }
    };    if exists.is_none() {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("onboarding_entitlement_not_found")),
        )
            .into_response();
    };    let rows = match list_onboarding_payment_events_for_entitlement_admin(pool, eid, limit).await {
        Ok(v) => v,
        Err(err) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": err.to_string()})),
            )
                .into_response();
        }
    };    let items: Vec<Value> = rows.iter().map(payment_event_row_json).collect();

    let mut body = json!({
        "status": "ok",
        "meta": { "implementation_status": "onboarding_payment_events_admin_db" },
        "items": items,
        "applied_filters": { "limit": limit },
    });
    super::admin_attach_meta_build(&mut body);

    let request_id = super::request_id_from_headers(&headers);
    super::write_admin_audit_log_best_effort(
        &state,
        actor.0,
        request_id.as_deref(),
        "admin_onboarding_payment_events_for_entitlement",
        Some("onboarding_payment_events"),
        Some(&eid.to_string()),
        json!({ "limit": limit }),
    )
    .await;

    Json(body).into_response()
}

pub async fn get_admin_onboarding_payment_events_list(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOnboardingPaymentEventsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor = match super::require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };

    let (filter_eid, applied_eid) = match parse_entitlement_id_query(&q.entitlement_id) {
        Ok(v) => v,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_entitlement_id")),
            )
                .into_response();
        }
    };    let (filter_et, applied_et) = parse_event_type_filter(&q.event_type);
    let limit = clamp_limit(q.limit);
    let et_ref = filter_et.as_deref();

    let rows = match list_onboarding_payment_events_admin(pool, filter_eid, et_ref, limit).await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": e.to_string()})),
            )
                .into_response();
        }
    };    let items: Vec<Value> = rows.iter().map(payment_event_row_json).collect();

    let mut body = json!({
        "status": "ok",
        "meta": { "implementation_status": "onboarding_payment_events_admin_list_db" },
        "items": items,
        "applied_filters": {
            "entitlement_id": applied_eid,
            "event_type": applied_et,
            "limit": limit,
        }
    });
    super::admin_attach_meta_build(&mut body);

    let request_id = super::request_id_from_headers(&headers);
    super::write_admin_audit_log_best_effort(
        &state,
        actor.0,
        request_id.as_deref(),
        "admin_onboarding_payment_events_list",
        Some("onboarding_payment_events"),
        None,
        json!({ "limit": limit }),
    )
    .await;

    Json(body).into_response()
}

pub async fn get_admin_onboarding_webhook_jobs(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOnboardingWebhookJobsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor = match super::require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };

    let (filter_uid, applied_uid) = match parse_uuid_query_user_id(&q.user_id) {
        Ok(v) => v,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_user_id")),
            )
                .into_response();
        }
    };    let limit = clamp_limit(q.limit);

    let rows = match list_onboarding_webhook_jobs_admin(pool, filter_uid, limit).await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": e.to_string()})),
            )
                .into_response();
        }
    };    let items: Vec<Value> = rows.iter().map(webhook_job_row_json).collect();

    let mut body = json!({
        "status": "ok",
        "meta": { "implementation_status": "onboarding_webhook_jobs_admin_db" },
        "items": items,
        "applied_filters": { "user_id": applied_uid, "limit": limit },
    });
    super::admin_attach_meta_build(&mut body);

    let request_id = super::request_id_from_headers(&headers);
    super::write_admin_audit_log_best_effort(
        &state,
        actor.0,
        request_id.as_deref(),
        "admin_onboarding_webhook_jobs_list",
        Some("onboarding_webhook_jobs"),
        None,
        json!({ "limit": limit }),
    )
    .await;

    Json(body).into_response()
}

pub async fn get_admin_onboarding_webhook_dlq(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOnboardingWebhookDlqQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor = match super::require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };

    let (filter_uid, applied_uid) = match parse_uuid_query_user_id(&q.user_id) {
        Ok(v) => v,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_user_id")),
            )
                .into_response();
        }
    };    let limit = clamp_limit(q.limit);

    let rows = match list_onboarding_webhook_dlq_admin(pool, filter_uid, limit).await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": e.to_string()})),
            )
                .into_response();
        }
    };    let items: Vec<Value> = rows.iter().map(webhook_dlq_row_json).collect();

    let mut body = json!({
        "status": "ok",
        "meta": { "implementation_status": "onboarding_webhook_dlq_admin_db" },
        "items": items,
        "applied_filters": { "user_id": applied_uid, "limit": limit },
    });
    super::admin_attach_meta_build(&mut body);

    let request_id = super::request_id_from_headers(&headers);
    super::write_admin_audit_log_best_effort(
        &state,
        actor.0,
        request_id.as_deref(),
        "admin_onboarding_webhook_dlq_list",
        Some("onboarding_webhook_dlq"),
        None,
        json!({ "limit": limit }),
    )
    .await;

    Json(body).into_response()
}

pub async fn get_admin_onboarding_compliance_audit_events(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOnboardingComplianceAuditQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor = match super::require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };

    let (filter_uid, applied_uid) = match parse_uuid_query_user_id(&q.user_id) {
        Ok(v) => v,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_user_id")),
            )
                .into_response();
        }
    };    let limit = clamp_limit(q.limit);

    let rows = match list_onboarding_compliance_audit_events_admin(pool, filter_uid, limit).await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error":"db_error","message": e.to_string()})),
            )
                .into_response();
        }
    };    let items: Vec<Value> = rows.iter().map(compliance_row_json).collect();

    let mut body = json!({
        "status": "ok",
        "meta": { "implementation_status": "onboarding_compliance_audit_events_admin_list_db" },
        "items": items,
        "applied_filters": { "user_id": applied_uid, "limit": limit },
    });
    super::admin_attach_meta_build(&mut body);

    let request_id = super::request_id_from_headers(&headers);
    super::write_admin_audit_log_best_effort(
        &state,
        actor.0,
        request_id.as_deref(),
        "admin_onboarding_compliance_audit_events_list",
        Some("onboarding_compliance_audit_events"),
        None,
        json!({ "limit": limit }),
    )
    .await;

    Json(body).into_response()
}
