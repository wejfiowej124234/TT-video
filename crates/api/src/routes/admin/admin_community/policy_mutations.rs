//! Abuse policy / comment visibility / penalty POST (admin community).

use axum::extract::Path;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use super::super::{
    admin_attach_meta_build, admin_db_pool_required, admin_rbac, request_id_from_headers,
    require_super_admin_uid, write_admin_audit_log_best_effort,
    AdminCommunityCommentVisibilityBody, AdminCommunityPenaltyCreateBody,
};
use super::super::admin_rbac::PERM_COMMUNITY_MODERATE;
use super::helpers::{community_abuse_policy_patch_is_empty, parse_optional_penalty_expires_at};
use crate::db;
use crate::state::ApiMetaState;

/// PATCH /api/v1/admin/community/abuse-policy（160 §5；**super_admin**；同事务写 `community_policy_change_logs`）
pub async fn patch_admin_community_abuse_policy(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(patch): Json<db::CommunityAbusePolicyPatch>,
) -> impl IntoResponse {
    let actor_id = match require_super_admin_uid(&state, &headers).await {
        Ok(uid) => uid,
        Err(resp) => return resp,
    };
    if community_abuse_policy_patch_is_empty(&patch) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("abuse_policy_patch_empty")),
        )
            .into_response();
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let before = db::get_community_abuse_policy(pool).await;
    let after = db::apply_community_abuse_policy_patch(before.clone(), &patch);
    if before == after {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("abuse_policy_no_effective_change")),
        )
            .into_response();
    };    if let Err(err_key) = db::validate_community_abuse_policy_row(&after) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(err_key)),
        )
            .into_response();
    };    if db::save_community_abuse_policy_and_audit_log(pool, actor_id, &after, &before)
        .await
        .is_err()
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key(
                "admin_community_abuse_policy_update_failed",
            )),
        )
            .into_response();
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.community.abuse_policy.patch",
        Some("community_abuse_policy"),
        None,
        json!({ "patch": patch }),
    )
    .await;
    let policy_json = serde_json::to_value(&after).unwrap_or_else(|_| json!({}));
    let mut body = json!({
        "status": "ok",
        "policy": policy_json,
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// PATCH /api/v1/admin/community/comments/:id（160、04 §3.4）
pub async fn patch_admin_community_comment(
    State(state): State<ApiMetaState>,
    Path(raw_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminCommunityCommentVisibilityBody>,
) -> impl IntoResponse {
    let actor_id = match admin_rbac::require_admin_permission(&state, &headers, PERM_COMMUNITY_MODERATE).await
    {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let id = match Uuid::parse_str(raw_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_comment_id")),
            )
                .into_response();
        }
    };    let vis = body.visibility_status.trim();
    if !db::is_allowed_comment_visibility_status(vis) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(
                "invalid_comment_visibility_status",
            )),
        )
            .into_response();
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let updated = match db::update_comment_visibility_status(pool, id, vis).await {
        Ok(b) => b,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_comment_update_failed",
                )),
            )
                .into_response();
        }
    };    if !updated {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("community_comment_not_found")),
        )
            .into_response();
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.community.comments.visibility",
        Some("community_comments"),
        Some(&id.to_string()),
        json!({ "visibility_status": vis }),
    )
    .await;
    let mut body = json!({
        "status": "ok",
        "id": id.to_string(),
        "visibility_status": vis,
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// POST /api/v1/admin/community/penalties（160、04 §3.4）
pub async fn post_admin_community_penalty(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCommunityPenaltyCreateBody>,
) -> impl IntoResponse {
    let actor_id = match admin_rbac::require_admin_permission(&state, &headers, PERM_COMMUNITY_MODERATE).await
    {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let subject_user_id = match Uuid::parse_str(body.subject_user_id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_penalty_subject_user_id")),
            )
                .into_response();
        }
    };    let act = body.action.trim();
    if act.is_empty() || !db::is_allowed_community_penalty_action(act) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_community_penalty_action")),
        )
            .into_response();
    };    let report_id = match body
        .report_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        Some(s) => match Uuid::parse_str(s) {
            Ok(u) => {
                let exists = match db::get_community_report_by_id(pool, u).await {
                    Ok(v) => v.is_some(),
                    Err(_) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key(
                                "admin_community_penalty_report_query_failed",
                            )),
                        )
                            .into_response();
                    }
                };                if !exists {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key(
                            "community_report_not_found_for_penalty",
                        )),
                    )
                        .into_response();
                }
                Some(u)
            }
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key("invalid_penalty_report_id")),
                )
                    .into_response();
            }
        },
        None => None,
    };
    let expires_at = match parse_optional_penalty_expires_at(&body.expires_at) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_penalty_expires_at")),
            )
                .into_response();
        }
    };    let reason = body
        .reason
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());

    let pid = match db::insert_community_penalty(
        pool,
        report_id,
        subject_user_id,
        act,
        reason,
        actor_id,
        expires_at,
        body.metadata.clone(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_penalty_insert_failed",
                )),
            )
                .into_response();
        }
    }

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.community.penalties.create",
        Some("community_penalties"),
        Some(&pid.to_string()),
        json!({
            "report_id": report_id.map(|u| u.to_string()),
            "subject_user_id": subject_user_id.to_string(),
            "source": "admin_post",
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "id": pid.to_string(),
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
