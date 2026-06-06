use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};

use crate::db::{
    admin_onboarding_entitlement_detail_json, get_onboarding_entitlement_by_id,
    record_paid_entitlement_financial_reversal_admin, revoke_onboarding_entitlement_pending_admin,
    RecordPaidFinancialReversalOutcome, RevokePendingEntitlementAdminOutcome,
};
use crate::state::ApiMetaState;
use crate::stripe_onboarding::try_admin_psp_refund_after_financial_reversal;

use super::helpers::parse_entitlement_path_id;
use super::types::{FinancialReversalBody, RevokeOnboardingEntitlementBody};

pub async fn post_admin_onboarding_entitlement_revoke(
    State(state): State<ApiMetaState>,
    Path(ent_id_raw): Path<String>,
    headers: HeaderMap,
    Json(body): Json<RevokeOnboardingEntitlementBody>,
) -> impl IntoResponse {
    let actor = match super::super::admin_rbac::require_admin_permission(
        &state,
        &headers,
        super::super::admin_rbac::PERM_ONBOARDING_WRITE,
    )
    .await
    {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::super::admin_db_pool_required(&state) {
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
            Json(crate::api_json::err_key(
                "onboarding_entitlement_not_revokable",
            )),
        )
            .into_response();
    };    let outcome =
        match revoke_onboarding_entitlement_pending_admin(pool, id, &reason_store, actor.0).await {
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
                Json(crate::api_json::err_key(
                    "onboarding_entitlement_not_revokable",
                )),
            )
                .into_response();
        }
    };
    let mut out = json!({
        "status": "ok",
        "meta": { "implementation_status": "onboarding_entitlements_admin_revoke_db" },
        "entitlement": admin_onboarding_entitlement_detail_json(&ent),
    });
    super::super::admin_attach_meta_build(&mut out);

    let request_id = super::super::request_id_from_headers(&headers);
    super::super::write_admin_audit_log_best_effort(
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
    let actor = match super::super::admin_rbac::require_admin_permission(
        &state,
        &headers,
        super::super::admin_rbac::PERM_ONBOARDING_WRITE,
    )
    .await
    {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match super::super::admin_db_pool_required(&state) {
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
            Json(crate::api_json::err_key(
                "onboarding_financial_reversal_reason_required",
            )),
        )
            .into_response();
    };    let kind = body.reversal_kind.trim();
    let kind_lc = kind.to_ascii_lowercase();
    if kind_lc != "refund" && kind_lc != "chargeback" {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(
                "onboarding_financial_reversal_kind_invalid",
            )),
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
            super::super::admin_attach_meta_build(&mut out);

            let request_id = super::super::request_id_from_headers(&headers);
            super::super::write_admin_audit_log_best_effort(
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
            Json(crate::api_json::err_key(
                "onboarding_entitlement_already_refunded",
            )),
        )
            .into_response(),
        RecordPaidFinancialReversalOutcome::InvalidReversalKind => (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(
                "onboarding_financial_reversal_kind_invalid",
            )),
        )
            .into_response(),
    }
}
