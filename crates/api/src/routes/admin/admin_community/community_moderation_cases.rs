//! GET /api/v1/admin/community/moderation/cases

use axum::extract::Query;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use super::super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminCommunityModerationCasesQuery,
};
use crate::db;
use crate::state::ApiMetaState;

/// GET /api/v1/admin/community/moderation/cases（160、04 §3.4；审核工单审计行）
pub async fn get_admin_community_moderation_cases(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityModerationCasesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let report_id = match query
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
                        "invalid_moderation_cases_query_report_id",
                    )),
                )
                    .into_response();
            }
        },
        None => None,
    };
    let filter_actor = match query
        .actor_id
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
                        "invalid_moderation_cases_query_actor_id_filter",
                    )),
                )
                    .into_response();
            }
        },
        None => None,
    };
    let sb_sub = query.status_before.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let sa_sub = query.status_after.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 64 {
            None
        } else {
            Some(t)
        }
    });
    let sb_pat = sb_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let sa_pat = sa_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let rows = match db::list_community_moderation_cases_admin(
        pool,
        limit,
        report_id,
        filter_actor,
        sb_pat.as_deref(),
        sa_pat.as_deref(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_moderation_cases_query_failed",
                )),
            )
                .into_response();
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.moderation_cases.read",
        Some("community_moderation_cases"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "report_id": report_id.map(|u| u.to_string()),
            "actor_id": filter_actor.map(|u| u.to_string()),
            "status_before": sb_sub,
            "status_after": sa_sub,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "report_id": r.report_id.to_string(),
                "actor_id": r.actor_id.to_string(),
                "status_before": r.status_before,
                "status_after": r.status_after,
                "admin_notes_snapshot": r.admin_notes_snapshot,
                "disposition_snapshot": r.disposition_snapshot,
                "penalty_id": r.penalty_id.map(|u| u.to_string()),
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "report_id": query.report_id,
            "actor_id": filter_actor.map(|u| u.to_string()),
            "status_before": sb_sub,
            "status_after": sa_sub,
        },
        "meta": {
            "note": "community_moderation_cases 与 PATCH moderation 同事务写入",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
