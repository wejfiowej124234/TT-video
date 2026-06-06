//! POST community appeal review (super_admin).

use axum::extract::Path;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use super::super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers,
    require_super_admin_uid, write_admin_audit_log_best_effort, AdminCommunityAppealReviewBody,
};
use super::helpers::is_allowed_community_appeal_decision;
use crate::db;
use crate::state::ApiMetaState;

/// POST /api/v1/admin/community/appeals/:id/review（160、04 §3.4）
pub async fn post_admin_community_appeal_review(
    State(state): State<ApiMetaState>,
    Path(raw_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminCommunityAppealReviewBody>,
) -> impl IntoResponse {
    let actor_id = match require_super_admin_uid(&state, &headers).await {
        Ok(v) => v,
        Err(resp) => return resp,
    };
    let id = match Uuid::parse_str(raw_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_community_appeal_id")),
            )
                .into_response();
        }
    };    let dec = body.decision.trim();
    if !is_allowed_community_appeal_decision(dec) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(
                "invalid_community_appeal_decision",
            )),
        )
            .into_response();
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let cur = match db::get_community_report_appeal_by_id(pool, id).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_appeal_query_failed",
                )),
            )
                .into_response();
        }
    };    let Some(cur) = cur else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("community_appeal_not_found")),
        )
            .into_response();
    };    if cur.status != "pending" {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("community_appeal_not_pending")),
        )
            .into_response();
    };    if cur.version != body.expected_version {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "community_appeal_version_conflict",
                "current_version": cur.version,
            })),
        )
            .into_response();
    };    let note = body.reviewer_note.as_deref();
    let updated = match db::review_community_report_appeal(
        pool,
        id,
        body.expected_version,
        dec,
        note,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_appeal_review_failed",
                )),
            )
                .into_response();
        }
    };    let Some(updated) = updated else {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key(
                "admin_community_appeal_review_race",
            )),
        )
            .into_response();
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.community.appeals.review",
        Some("community_report_appeals"),
        Some(&id.to_string()),
        json!({
            "report_id": updated.report_id.to_string(),
            "decision": dec,
            "version_before": body.expected_version,
            "version_after": updated.version,
        }),
    )
    .await;
    let mut body = json!({
        "status": "ok",
        "item": {
            "id": updated.id.to_string(),
            "report_id": updated.report_id.to_string(),
            "appellant_id": updated.appellant_id.to_string(),
            "body": updated.body,
            "status": updated.status,
            "reviewer_note": updated.reviewer_note,
            "version": updated.version,
            "created_at": updated.created_at.to_rfc3339(),
            "reviewed_at": updated.reviewed_at.map(|t| t.to_rfc3339()),
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
