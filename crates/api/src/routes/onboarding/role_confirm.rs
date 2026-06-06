use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::db::{find_paid_entitlement_for_role, get_user_by_id, update_user_role_if_safe};
use crate::middleware::onboarding_user_write_rate_limit_response_if_exceeded;
use crate::onboarding_counters::inc_onboarding_role_confirm_post;
use crate::state::{extract_session_auth_outcome, ApiMetaState, SessionAuthOutcome};

use crate::routes::chain_off_unavailable_json;

use super::compliance::{
    audit_onboarding_compliance_screening_unavailable_stderr, onboarding_compliance_evaluate,
    onboarding_compliance_http_detail, onboarding_request_id_from_headers,
    persist_onboarding_compliance_screening_hit_best_effort, OnboardingComplianceEval,
};
use super::types::RoleConfirmBody;

pub(super) async fn post_onboarding_role_confirm(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    inc_onboarding_role_confirm_post();
    if state.chain_off.is_none() {
        return chain_off_unavailable_json("POST /api/v1/onboarding/role-confirm").into_response();
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
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_entitlement_required",
                    "message": "onboarding_entitlement_required",
                    "detail": "No database pool; cannot verify paid entitlement.",
                })),
            )
                .into_response();
        }
    };
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
            eprintln!("[onboarding] role_confirm get_user_by_id err={}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_role_confirm_user_read_failed",
                    "message": "onboarding_role_confirm_user_read_failed",
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
                "POST /api/v1/onboarding/role-confirm",
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
                "POST /api/v1/onboarding/role-confirm",
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
    };    let parsed: RoleConfirmBody = match serde_json::from_value(body) {
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
    };    let ent = match find_paid_entitlement_for_role(&pool, uid, &role).await {
        Ok(v) => v,
        Err(e) => {
            eprintln!("[onboarding] find_paid_entitlement_for_role err={}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_role_confirm_read_failed",
                    "message": "onboarding_role_confirm_read_failed",
                })),
            )
                .into_response();
        }
    };
    if ent.is_none() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "onboarding_entitlement_required",
                "message": "onboarding_entitlement_required",
                "detail": "No paid entitlement for requested role.",
            })),
        )
            .into_response();
    };    let n = match update_user_role_if_safe(&pool, uid, &role).await {
        Ok(v) => v,
        Err(e) => {
            eprintln!("[onboarding] update_user_role_if_safe err={}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_role_confirm_write_failed",
                    "message": "onboarding_role_confirm_write_failed",
                })),
            )
                .into_response();
        }
    };
    if let Ok(Some(pg_user)) = get_user_by_id(&pool, uid).await {
        if let Some(ref co) = state.chain_off {
            crate::chain_off::sync_user_role_in_memory_when_pg_matches(
                co,
                uid,
                &role,
                &pg_user.role,
            )
            .await;
        }
    }

    Json(json!({
        "status": "ok",
        "role": role,
        "updated": n > 0,
        "meta": { "implementation_status": "onboarding_role_confirm_db" }
    }))
    .into_response()
}
