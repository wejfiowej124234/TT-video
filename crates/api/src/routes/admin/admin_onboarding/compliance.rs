use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};

use crate::db::list_onboarding_compliance_audit_events_admin;
use crate::state::ApiMetaState;

use super::helpers::{clamp_limit, compliance_row_json, parse_uuid_query_user_id};
use super::types::AdminOnboardingComplianceAuditQuery;

pub async fn get_admin_onboarding_compliance_audit_events(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOnboardingComplianceAuditQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor = match super::super::admin_rbac::require_admin_permission(
        &state,
        &headers,
        super::super::admin_rbac::PERM_ONBOARDING_READ,
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
    super::super::admin_attach_meta_build(&mut body);

    let request_id = super::super::request_id_from_headers(&headers);
    super::super::write_admin_audit_log_best_effort(
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
