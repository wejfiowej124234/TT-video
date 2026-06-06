//! Admin **approvals** 列表/详情与 **approve**（**04 §3.5**）。

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_handler_common::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    require_super_admin_uid, write_admin_audit_log_best_effort,
};
use super::{AdminApprovalActionBody, AdminApprovalQuery};

fn admin_approval_request_row_json(r: &db::AdminApprovalRequestRow) -> serde_json::Value {
    json!({
        "id": r.id,
        "action": r.action,
        "resource_type": r.resource_type,
        "resource_id": r.resource_id,
        "requested_by": r.requested_by,
        "approved_by": r.approved_by,
        "status": r.status,
        "reason": r.reason,
        "approve_reason": r.approve_reason,
        "before_payload": r.before_payload,
        "after_payload": r.after_payload,
        "created_at": r.created_at,
        "approved_at": r.approved_at,
    })
}

pub async fn get_admin_approvals(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminApprovalQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };

    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            let mut body = json!({
                "status": "ok",
                "items": [],
                "note": "admin_approvals_no_db",
                "meta": {
                    "note": "admin_approvals_no_db",
                }
            });
            admin_attach_meta_build(&mut body);
            return Json(body).into_response();
        }
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let status_filter = query
        .status
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty());

    let rows = match db::list_admin_approval_requests(pool, status_filter, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_approval_query_failed")),
            )
                .into_response()
        }
    };
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| admin_approval_request_row_json(&r))
        .collect();

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.approvals.read",
        Some("admin_approval_requests"),
        None,
        json!({
            "filters": {
                "status": status_filter,
                "limit": limit,
            },
            "result_count": items.len()
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "status": status_filter,
            "limit": limit,
        },
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_approval_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };

    let approval_uuid = match Uuid::parse_str(id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_approval_id")),
            )
                .into_response()
        }
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    let request_id = request_id_from_headers(&headers);

    let row = match db::get_admin_approval_request_by_id(pool, approval_uuid).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_approval_query_failed")),
            )
                .into_response()
        }
    };
    let Some(r) = row else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("approval_request_not_found")),
        )
            .into_response();
    }
    let mut body = json!({
        "status": "ok",
        "approval_request": admin_approval_request_row_json(&r),
    });
    admin_attach_meta_build(&mut body);

    let resource_id = approval_uuid.to_string();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.approvals.detail.read",
        Some("admin_approval_requests"),
        Some(resource_id.as_str()),
        json!({ "approval_request_id": resource_id }),
    )
    .await;

    Json(body).into_response()
}

pub async fn post_admin_approval_approve(
    State(state): State<ApiMetaState>,
    Path(approval_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminApprovalActionBody>,
) -> impl IntoResponse {
    let approver_id = match require_super_admin_uid(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };

    let approval_uuid = match Uuid::parse_str(approval_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_approval_id")),
            )
                .into_response()
        }
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let existing = match db::get_admin_approval_request_by_id(pool, approval_uuid).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_approval_query_failed")),
            )
                .into_response()
        }
    };    let Some(existing) = existing else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("approval_request_not_found")),
        )
            .into_response();
    };    if existing.status != "pending" {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("approval_request_not_pending")),
        )
            .into_response();
    };    if existing.requested_by == approver_id {
        return (
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key("self_approval_not_allowed")),
        )
            .into_response();
    };    if existing.action != "admin.user.role.change" {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("unsupported_approval_action")),
        )
            .into_response();
    };    let result = match db::approve_admin_user_role_change_request_with_audit(
        pool,
        approval_uuid,
        approver_id,
        body.reason.as_deref(),
        request_id.as_deref(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_approval_apply_failed")),
            )
                .into_response()
        }
    };
    let Some(result) = result else {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("approval_request_apply_conflict")),
        )
            .into_response();
    }
    if let Some(ref co) = state.chain_off {
        let mut store = co.store.write().await;
        if let Some(target_user) = store.users.get_mut(&result.target_user_id) {
            target_user.role = result.to_role.clone();
            target_user.updated_at = Utc::now();
        }
    };    let mut body = json!({
        "status": "ok",
        "approval_request_id": result.approval_id,
        "target_user_id": result.target_user_id,
        "from_role": result.from_role,
        "to_role": result.to_role,
        "approved_by": approver_id,
        "meta": {
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
