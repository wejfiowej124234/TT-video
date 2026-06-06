//! PATCH community report moderation (admin).

use axum::extract::Path;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use super::super::{
    admin_attach_meta_build, admin_db_pool_required, admin_rbac, request_id_from_headers,
    write_admin_audit_log_best_effort, AdminCommunityModerationBody,
};
use super::helpers::{is_allowed_community_report_status, parse_optional_penalty_expires_at};
use crate::db;
use crate::state::ApiMetaState;

/// PATCH /api/v1/admin/community/moderation/:id（160、04 §3.4；id = report id）
pub async fn patch_admin_community_moderation(
    State(state): State<ApiMetaState>,
    Path(raw_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminCommunityModerationBody>,
) -> impl IntoResponse {
    let actor_id = match admin_rbac::require_admin_permission(
        &state,
        &headers,
        admin_rbac::PERM_COMMUNITY_MODERATE,
    )
    .await
    {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let id = match Uuid::parse_str(raw_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_community_report_id")),
            )
                .into_response();
        }
    };    let st = body.status.trim();
    if !is_allowed_community_report_status(st) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_community_report_status")),
        )
            .into_response();
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let hdr_request_id = request_id_from_headers(&headers);
    let cur = match db::get_community_report_by_id(pool, id).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_report_query_failed",
                )),
            )
                .into_response();
        }
    };    let Some(cur) = cur else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("community_report_not_found")),
        )
            .into_response();
    };    if cur.version != body.expected_version {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "community_report_version_conflict",
                "current_version": cur.version,
            })),
        )
            .into_response();
    };    let notes = body.admin_notes.as_deref();
    let disp = body.disposition.as_deref();

    let (updated, penalty_id): (db::CommunityReportRow, Option<Uuid>) =
        if let Some(ref pin) = body.record_penalty {
            if st != "resolved" {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key(
                        "community_penalty_only_when_resolved",
                    )),
                )
                    .into_response();
            };            let act = pin.action.trim();
            if act.is_empty() || !db::is_allowed_community_penalty_action(act) {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key("invalid_community_penalty_action")),
                )
                    .into_response();
            };            let subject: Option<Uuid> = if let Some(ref sid) = pin.subject_user_id {
                if sid.trim().is_empty() {
                    match db::community_report_default_penalty_subject(pool, &cur).await {
                        Ok(v) => v,
                        Err(_) => {
                            return (
                                StatusCode::INTERNAL_SERVER_ERROR,
                                Json(crate::api_json::err_key(
                                    "admin_community_penalty_subject_query_failed",
                                )),
                            )
                                .into_response();
                        }
                    }
                } else {
                    match Uuid::parse_str(sid.trim()) {
                        Ok(u) => Some(u),
                        Err(_) => {
                            return (
                                StatusCode::BAD_REQUEST,
                                Json(crate::api_json::err_key("invalid_penalty_subject_user_id")),
                            )
                                .into_response();
                        }
                    }
                }
            } else {
                match db::community_report_default_penalty_subject(pool, &cur).await {
                    Ok(v) => v,
                    Err(_) => {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key(
                                "admin_community_penalty_subject_query_failed",
                            )),
                        )
                            .into_response();
                    }
                }
            };            let Some(subject) = subject else {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key("penalty_subject_required")),
                )
                    .into_response();
            };            let expires_at = match parse_optional_penalty_expires_at(&pin.expires_at) {
                Ok(v) => v,
                Err(_) => {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key("invalid_penalty_expires_at")),
                    )
                        .into_response();
                }
            };            let reason = pin
                .reason
                .as_deref()
                .map(str::trim)
                .filter(|s| !s.is_empty())
                .or(notes)
                .or(disp);

            let mut tx = match pool.begin().await {
                Ok(t) => t,
                Err(_) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key(
                            "admin_community_moderation_tx_failed",
                        )),
                    )
                        .into_response();
                }
            };            let updated = match db::update_community_report_moderation_conn(
                &mut tx,
                id,
                body.expected_version,
                st,
                notes,
                disp,
            )
            .await
            {
                Ok(v) => v,
                Err(_) => {
                    let _ = tx.rollback().await;
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key(
                            "admin_community_moderation_update_failed",
                        )),
                    )
                        .into_response();
                }
            };            let Some(updated) = updated else {
                let _ = tx.rollback().await;
                return (
                    StatusCode::CONFLICT,
                    Json(crate::api_json::err_key("admin_community_moderation_race")),
                )
                    .into_response();
            };            let pid = match db::insert_community_penalty_conn(
                &mut tx,
                Some(id),
                subject,
                act,
                reason,
                actor_id,
                expires_at,
                None,
            )
            .await
            {
                Ok(v) => v,
                Err(_) => {
                    let _ = tx.rollback().await;
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key(
                            "admin_community_penalty_insert_failed",
                        )),
                    )
                        .into_response();
                }
            };            if db::insert_community_moderation_case_conn(
                &mut tx,
                id,
                actor_id,
                &cur.status,
                &updated.status,
                updated.admin_notes.as_deref(),
                updated.disposition.as_deref(),
                Some(pid),
            )
            .await
            .is_err()
            {
                let _ = tx.rollback().await;
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key(
                        "admin_community_moderation_case_insert_failed",
                    )),
                )
                    .into_response();
            };            if tx.commit().await.is_err() {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key(
                        "admin_community_moderation_tx_commit_failed",
                    )),
                )
                    .into_response();
            }
            (updated, Some(pid))
        } else {
            let mut tx = match pool.begin().await {
                Ok(t) => t,
                Err(_) => {
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key(
                            "admin_community_moderation_tx_failed",
                        )),
                    )
                        .into_response();
                }
            };            let updated = match db::update_community_report_moderation_conn(
                &mut tx,
                id,
                body.expected_version,
                st,
                notes,
                disp,
            )
            .await
            {
                Ok(v) => v,
                Err(_) => {
                    let _ = tx.rollback().await;
                    return (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(crate::api_json::err_key(
                            "admin_community_moderation_update_failed",
                        )),
                    )
                        .into_response();
                }
            };            let Some(updated) = updated else {
                let _ = tx.rollback().await;
                return (
                    StatusCode::CONFLICT,
                    Json(crate::api_json::err_key("admin_community_moderation_race")),
                )
                    .into_response();
            };            if db::insert_community_moderation_case_conn(
                &mut tx,
                id,
                actor_id,
                &cur.status,
                &updated.status,
                updated.admin_notes.as_deref(),
                updated.disposition.as_deref(),
                None,
            )
            .await
            .is_err()
            {
                let _ = tx.rollback().await;
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key(
                        "admin_community_moderation_case_insert_failed",
                    )),
                )
                    .into_response();
            };            if tx.commit().await.is_err() {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key(
                        "admin_community_moderation_tx_commit_failed",
                    )),
                )
                    .into_response();
            }
            (updated, None)
        };

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        hdr_request_id.as_deref(),
        "admin.community.moderation.update",
        Some("community_reports"),
        Some(&id.to_string()),
        json!({
            "status_before": cur.status,
            "status_after": updated.status,
            "version_before": body.expected_version,
            "version_after": updated.version,
            "penalty_id": penalty_id.map(|p| p.to_string()),
        }),
    )
    .await;

    if let Some(pid) = penalty_id {
        write_admin_audit_log_best_effort(
            &state,
            actor_id,
            hdr_request_id.as_deref(),
            "admin.community.penalties.create",
            Some("community_penalties"),
            Some(&pid.to_string()),
            json!({ "report_id": id.to_string(), "source": "moderation_patch" }),
        )
        .await;
    };    let mut item = json!({
        "id": updated.id.to_string(),
        "reporter_id": updated.reporter_id.to_string(),
        "target_type": updated.target_type,
        "target_id": updated.target_id.to_string(),
        "reason_code": updated.reason_code,
        "details": updated.details,
        "evidence_ref": updated.evidence_ref,
        "status": updated.status,
        "version": updated.version,
        "admin_notes": updated.admin_notes,
        "disposition": updated.disposition,
        "created_at": updated.created_at.to_rfc3339(),
        "updated_at": updated.updated_at.to_rfc3339(),
    });
    if let Some(pid) = penalty_id {
        item["penalty_id"] = json!(pid.to_string());
    };    let mut body = json!({
        "status": "ok",
        "item": item,
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
