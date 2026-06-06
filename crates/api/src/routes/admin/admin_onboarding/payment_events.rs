use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};

use crate::db::{
    get_onboarding_entitlement_by_id, list_onboarding_payment_events_admin,
    list_onboarding_payment_events_for_entitlement_admin,
};
use crate::state::ApiMetaState;

use super::helpers::{
    clamp_limit, parse_entitlement_id_query, parse_entitlement_path_id, parse_event_type_filter,
    payment_event_row_json,
};
use super::types::{
    AdminOnboardingEntitlementPaymentEventsQuery, AdminOnboardingPaymentEventsQuery,
};

pub async fn get_admin_onboarding_entitlement_payment_events(
    State(state): State<ApiMetaState>,
    Path(ent_id_raw): Path<String>,
    Query(q): Query<AdminOnboardingEntitlementPaymentEventsQuery>,
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
    super::super::admin_attach_meta_build(&mut body);

    let request_id = super::super::request_id_from_headers(&headers);
    super::super::write_admin_audit_log_best_effort(
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
    super::super::admin_attach_meta_build(&mut body);

    let request_id = super::super::request_id_from_headers(&headers);
    super::super::write_admin_audit_log_best_effort(
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
