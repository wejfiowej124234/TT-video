//! GET community reports / appeals (admin).

use axum::extract::Query;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use super::super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminCommunityAppealsQuery, AdminCommunityReportsQuery,
};
use super::helpers::{
    is_allowed_community_appeal_status_filter, is_allowed_community_report_status,
};
use crate::db;
use crate::state::ApiMetaState;

/// GET /api/v1/admin/community/reports（160、04 §3.4、70）
pub async fn get_admin_community_reports(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityReportsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    if let Some(ref st) = query.status {
        let t = st.trim();
        if !t.is_empty() && !is_allowed_community_report_status(t) {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key(
                    "invalid_community_report_status_filter",
                )),
            )
                .into_response();
        }
    };    let reporter_uuid: Option<Uuid> = match query.reporter_id.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                match Uuid::parse_str(t) {
                    Ok(u) => Some(u),
                    Err(_) => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(crate::api_json::err_key(
                                "invalid_community_reports_reporter_id_filter",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };    let target_uuid: Option<Uuid> = match query.target_id.as_deref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                match Uuid::parse_str(t) {
                    Ok(u) => Some(u),
                    Err(_) => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(crate::api_json::err_key(
                                "invalid_community_reports_target_id_filter",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let status_f = query
        .status
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let tt_sub = query.target_type.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let target_type_pattern: Option<String> =
        tt_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let rc_sub = query.reason_code.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let reason_code_pattern: Option<String> =
        rc_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_community_reports_admin(
        pool,
        limit,
        status_f,
        reporter_uuid,
        target_type_pattern.as_deref(),
        reason_code_pattern.as_deref(),
        target_uuid,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_reports_query_failed",
                )),
            )
                .into_response();
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.reports.read",
        Some("community_reports"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "status": query.status,
            "reporter_id": reporter_uuid.map(|u| u.to_string()),
            "target_type": tt_sub,
            "reason_code": rc_sub,
            "target_id": target_uuid.map(|u| u.to_string()),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "reporter_id": r.reporter_id.to_string(),
                "target_type": r.target_type,
                "target_id": r.target_id.to_string(),
                "reason_code": r.reason_code,
                "details": r.details,
                "evidence_ref": r.evidence_ref,
                "status": r.status,
                "version": r.version,
                "admin_notes": r.admin_notes,
                "disposition": r.disposition,
                "created_at": r.created_at.to_rfc3339(),
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "status": query.status,
            "reporter_id": reporter_uuid.map(|u| u.to_string()),
            "target_type": tt_sub,
            "reason_code": rc_sub,
            "target_id": target_uuid.map(|u| u.to_string()),
        },
        "meta": {
            "note": "160 minimal ledger; appeals ledger: GET …/admin/community/appeals",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/community/appeals（160、04 §3.4；`community_report_appeals` 台账）
pub async fn get_admin_community_appeals(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityAppealsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    if let Some(ref st) = query.status {
        let t = st.trim();
        if !t.is_empty() && !is_allowed_community_appeal_status_filter(t) {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key(
                    "invalid_community_appeal_status_filter",
                )),
            )
                .into_response();
        }
    };    let report_uuid = match query
        .report_id
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        Some(s) => match Uuid::parse_str(s) {
            Ok(u) => Some(u),
            Err(_) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key(
                        "invalid_community_appeal_report_id",
                    )),
                )
                    .into_response();
            }
        },
        None => None,
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let status_f = query
        .status
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let rows =
        match db::list_community_report_appeals_admin(pool, limit, report_uuid, status_f).await {
            Ok(v) => v,
            Err(_) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key(
                        "admin_community_appeals_query_failed",
                    )),
                )
                    .into_response();
            }
        }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.appeals.read",
        Some("community_report_appeals"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "report_id": query.report_id,
            "status": query.status,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "report_id": r.report_id.to_string(),
                "appellant_id": r.appellant_id.to_string(),
                "body": r.body,
                "status": r.status,
                "reviewer_note": r.reviewer_note,
                "version": r.version,
                "created_at": r.created_at.to_rfc3339(),
                "reviewed_at": r.reviewed_at.map(|t| t.to_rfc3339()),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "report_id": query.report_id,
            "status": query.status,
        },
        "meta": {
            "note": "160 appeals ledger; super_admin POST …/appeals/:id/review to decide",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
