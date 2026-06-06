//! GET /api/v1/admin/community/policy-change-logs

use axum::extract::Query;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use super::super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminCommunityPolicyChangeLogsQuery,
};
use crate::db;
use crate::state::ApiMetaState;

/// GET /api/v1/admin/community/policy-change-logs（160 §5、`community_policy_change_logs`）
pub async fn get_admin_community_policy_change_logs(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminCommunityPolicyChangeLogsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let actor_uuid: Option<Uuid> = match query.actor_id.as_deref() {
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
                                "invalid_community_policy_change_logs_actor_id_filter",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let scope_sub = query.scope.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let scope_pattern: Option<String> =
        scope_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let summary_sub = query.summary.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let summary_pattern: Option<String> =
        summary_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let source_sub = query.source.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let source_pattern: Option<String> =
        source_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_community_policy_change_logs_admin(
        pool,
        scope_pattern.as_deref(),
        summary_pattern.as_deref(),
        source_pattern.as_deref(),
        actor_uuid,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "admin_community_policy_change_logs_query_failed",
                )),
            )
                .into_response();
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.community.policy_change_logs.read",
        Some("community_policy_change_logs"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "scope": scope_sub,
            "summary": summary_sub,
            "source": source_sub,
            "actor_id": actor_uuid.map(|u| u.to_string()),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "actor_id": r.actor_id.map(|u| u.to_string()),
                "scope": r.scope,
                "summary": r.summary,
                "before_snapshot": r.before_snapshot.0,
                "after_snapshot": r.after_snapshot.0,
                "source": r.source,
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "scope": scope_sub,
            "summary": summary_sub,
            "source": source_sub,
            "actor_id": actor_uuid.map(|u| u.to_string()),
        },
        "meta": {
            "note": "community_abuse_policy 等策略变更审计",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
