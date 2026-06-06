//! `GET …/admin/internal-tools/audits`

use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use crate::routes::admin::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminInternalToolAuditsQuery,
};

pub async fn get_admin_internal_tool_audits(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminInternalToolAuditsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let tid_sub = query.tool_id.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let tool_id_pattern: Option<String> =
        tid_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let action_sub = query.action_code.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 128 {
            None
        } else {
            Some(t)
        }
    });
    let action_pattern: Option<String> =
        action_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let actor_sub = query.actor_id.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let actor_pattern: Option<String> =
        actor_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let approval_uuid: Option<Uuid> = match query.approval_request_id.as_deref() {
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
                            Json(crate::api_json::err_key_detail(
                                "invalid_internal_tool_audit_approval_request_id_filter",
                                "approval_request_id must be a UUID or omitted",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_internal_tool_audit_events(
        pool,
        tool_id_pattern.as_deref(),
        action_pattern.as_deref(),
        actor_pattern.as_deref(),
        approval_uuid,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key(
                    "internal_tool_audits_query_failed",
                )),
            )
                .into_response()
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.internal_tools.audits.read",
        Some("internal_tool_audit_events"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "tool_id": tid_sub,
            "action_code": action_sub,
            "actor_id": actor_sub,
            "approval_request_id": approval_uuid.map(|u| u.to_string()),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "tool_id": r.tool_id,
                "tool_name": r.tool_name,
                "action_code": r.action_code,
                "actor_id": r.actor_id,
                "approval_request_id": r.approval_request_id,
                "resource_ref": r.resource_ref,
                "input_digest": r.input_digest,
                "result_digest": r.result_digest,
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "tool_id": tid_sub,
            "action_code": action_sub,
            "actor_id": actor_sub,
            "approval_request_id": approval_uuid.map(|u| u.to_string()),
        },
        "meta": {
            "source": "db",
            "note": "tool_audit_events ledger; high-risk tools still require 450 RBAC/approval",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
