use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};

use crate::db::{
    admin_onboarding_entitlement_detail_json, get_onboarding_entitlement_by_id,
    list_onboarding_entitlements_admin, merge_onboarding_entitlement_admin_metadata,
};
use crate::state::ApiMetaState;

use super::helpers::{
    clamp_limit, parse_entitlement_path_id, parse_status_role_filter, parse_uuid_query_user_id,
};
use super::types::{
    AdminOnboardingEntitlementsListQuery, PatchAdminOnboardingEntitlementBody,
    ADMIN_ONBOARDING_METADATA_PATCH_MAX_BYTES,
};

pub async fn get_admin_onboarding_entitlements_list(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOnboardingEntitlementsListQuery>,
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
    };    let (filter_status, applied_status) = parse_status_role_filter(&q.status);
    let (filter_role, applied_role) = parse_status_role_filter(&q.role_target);
    let limit = clamp_limit(q.limit);

    let status_ref = filter_status.as_deref();
    let role_ref = filter_role.as_deref();
    let rows =
        match list_onboarding_entitlements_admin(pool, filter_uid, status_ref, role_ref, limit)
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
    super::super::admin_attach_meta_build(&mut body);

    let request_id = super::super::request_id_from_headers(&headers);
    super::super::write_admin_audit_log_best_effort(
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
    };
    let Some(ent) = row else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("onboarding_entitlement_not_found")),
        )
            .into_response();
    };
    let mut body = json!({
        "status": "ok",
        "meta": { "implementation_status": "onboarding_entitlements_admin_detail_db" },
        "entitlement": admin_onboarding_entitlement_detail_json(&ent),
    });
    super::super::admin_attach_meta_build(&mut body);

    let request_id = super::super::request_id_from_headers(&headers);
    super::super::write_admin_audit_log_best_effort(
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
    };
    let Some(ent) = updated else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("onboarding_entitlement_not_found")),
        )
            .into_response();
    };
    let mut out = json!({
        "status": "ok",
        "meta": { "implementation_status": "onboarding_entitlements_admin_metadata_patch_db" },
        "entitlement": admin_onboarding_entitlement_detail_json(&ent),
    });
    super::super::admin_attach_meta_build(&mut out);

    let request_id = super::super::request_id_from_headers(&headers);
    super::super::write_admin_audit_log_best_effort(
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
