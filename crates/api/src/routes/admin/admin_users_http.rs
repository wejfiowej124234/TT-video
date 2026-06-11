//! Admin **users** 列表/详情与 **role-change-request**（**04 §3.5**）。

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::chain_off;
use crate::db;
use crate::routes::chain_off_unavailable_json;
use crate::state::ApiMetaState;

use super::admin_handler_common::{
    admin_attach_meta_build, admin_db_pool_required, is_supported_target_role,
    request_id_from_headers, write_admin_audit_log_best_effort,
};
use super::admin_rbac;
use super::{AdminRoleChangeRequestBody, AdminUsersListQuery};

pub async fn get_admin_users(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminUsersListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable_json("GET /api/v1/admin/users").into_response();
    }
    let actor_id = match admin_rbac::require_admin_permission(
        &state,
        &headers,
        admin_rbac::PERM_USERS_READ,
    )
    .await
    {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let limit = q.limit.unwrap_or(100).clamp(1, 500);
    let role_filter = q.role.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let kyc_filter = q
        .kyc_status
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());

    let store = co.store.read().await;

    let mut items: Vec<_> = store
        .users
        .values()
        .filter(|u| {
            role_filter.is_none_or(|r| u.role == r) && kyc_filter.is_none_or(|k| u.kyc_status == k)
        })
        .map(|u| {
            json!({
                "id": u.id,
                "email": u.email,
                "role": u.role,
                "kyc_status": u.kyc_status,
                "created_at": u.created_at,
                "updated_at": u.updated_at,
            })
        })
        .collect();
    items.sort_by(|a, b| {
        b.get("created_at")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .cmp(
                a.get("created_at")
                    .and_then(|v| v.as_str())
                    .unwrap_or_default(),
            )
    });
    let total_after_filter = items.len();
    items.truncate(limit as usize);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.users.read",
        Some("users"),
        None,
        json!({
            "result_count": items.len(),
            "limit": limit,
            "role": role_filter,
            "kyc_status": kyc_filter,
            "matched_before_limit": total_after_filter,
            "source": "memory",
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "role": role_filter,
            "kyc_status": kyc_filter,
            "source": "memory",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_user_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable_json("GET /api/v1/admin/users/:id").into_response();
    };
    let actor_id = match admin_rbac::require_admin_permission(
        &state,
        &headers,
        admin_rbac::PERM_USERS_READ,
    )
    .await
    {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };

    let user_uuid = match Uuid::parse_str(id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_user_id", "message": "invalid_user_id"})),
            )
                .into_response()
        }
    };
    let request_id = request_id_from_headers(&headers);

    let store = co.store.read().await;
    let Some(u) = store.users.get(&user_uuid) else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "user_not_found", "message": "user_not_found"})),
        )
            .into_response();
    }
    let mut body = chain_off::user_admin_detail_envelope(u);
    admin_attach_meta_build(&mut body);

    let resource_id = user_uuid.to_string();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.users.detail.read",
        Some("users"),
        Some(resource_id.as_str()),
        json!({ "user_id": resource_id }),
    )
    .await;

    Json(body).into_response()
}

pub async fn post_admin_user_role_change_request(
    State(state): State<ApiMetaState>,
    Path(target_user_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminRoleChangeRequestBody>,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };

    let target_uid = match Uuid::parse_str(target_user_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_user_id")),
            )
                .into_response()
        }
    };
    let next_role = body.target_role.trim();
    if !is_supported_target_role(next_role) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("unsupported_target_role")),
        )
            .into_response();
    };    let Some(ref co) = state.chain_off else {
        return chain_off_unavailable_json("POST /api/v1/admin/users/:id/role-change-request")
            .into_response();
    };    let store = co.store.read().await;
    let Some(user) = store.users.get(&target_uid) else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("target_user_not_found")),
        )
            .into_response();
    };    let before_role = user.role.clone();
    if before_role == next_role {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("role_unchanged")),
        )
            .into_response();
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let approval_id = match db::create_admin_user_role_change_request_with_audit(
        pool,
        actor_id,
        target_uid,
        &before_role,
        next_role,
        body.reason.as_deref(),
        request_id.as_deref(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_role_change_request_failed")),
            )
                .into_response()
        }
    };
    let mut body = json!({
        "status": "ok",
        "approval_request_id": approval_id,
        "approval_status": "pending",
        "target_user_id": target_uid,
        "from_role": before_role,
        "to_role": next_role,
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
