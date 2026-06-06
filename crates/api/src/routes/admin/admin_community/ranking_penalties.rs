//! Ranking snapshots + penalties list (admin community).

use axum::extract::Query;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use super::super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminCommunityPenaltiesQuery,
    AdminCommunityRankingSnapshotsQuery,
};
use super::helpers::is_allowed_community_penalty_status_filter;
use crate::db;
use crate::state::ApiMetaState;

/// GET /api/v1/admin/community/ranking/snapshots（160、04 §3.4）
pub async fn get_admin_community_ranking_snapshots(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityRankingSnapshotsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let fm_sub = query.feed_mode.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let feed_mode_pattern: Option<String> =
        fm_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_community_ranking_snapshots(pool, feed_mode_pattern.as_deref(), limit)
        .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_ranking_snapshots_query_failed",
                )),
            )
                .into_response();
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.ranking_snapshots.read",
        Some("community_ranking_snapshots"),
        None,
        json!({ "result_count": rows.len(), "limit": limit, "feed_mode": fm_sub }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "feed_mode": r.feed_mode,
                "item_count": r.item_count,
                "top_post_ids": r.top_post_ids.iter().map(|u| u.to_string()).collect::<Vec<_>>(),
                "notes": r.notes,
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": { "limit": limit, "feed_mode": fm_sub },
        "meta": {
            "note": "feed 排序快照审计占位；写入 pipeline 仍待 421/观测接入",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

/// GET /api/v1/admin/community/penalties（160、04 §3.4）
pub async fn get_admin_community_penalties(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityPenaltiesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    if let Some(ref st) = query.status {
        let t = st.trim();
        if !t.is_empty() && !is_allowed_community_penalty_status_filter(t) {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key(
                    "invalid_community_penalty_status_filter",
                )),
            )
                .into_response();
        }
    };    let subject = match query
        .subject_user_id
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
                        "invalid_penalty_query_subject_user_id",
                    )),
                )
                    .into_response();
            }
        },
        None => None,
    };
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
                    Json(crate::api_json::err_key("invalid_penalty_query_report_id")),
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
    let st_f = query
        .status
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let rows = match db::list_community_penalties_admin(pool, limit, subject, report_id, st_f).await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_penalties_query_failed",
                )),
            )
                .into_response();
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.penalties.read",
        Some("community_penalties"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "subject_user_id": subject.map(|u| u.to_string()),
            "report_id": report_id.map(|u| u.to_string()),
            "status": st_f,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "report_id": r.report_id.map(|u| u.to_string()),
                "subject_user_id": r.subject_user_id.to_string(),
                "action": r.action,
                "status": r.status,
                "reason": r.reason,
                "created_by": r.created_by.to_string(),
                "expires_at": r.expires_at.map(|t| t.to_rfc3339()),
                "metadata": r.metadata.0,
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "subject_user_id": query.subject_user_id,
            "report_id": query.report_id,
            "status": query.status,
        },
        "meta": {
            "note": "community_penalties 处罚落账",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
