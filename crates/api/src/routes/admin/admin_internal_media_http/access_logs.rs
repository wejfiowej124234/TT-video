//! `GET …/admin/media/access-logs`

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
    write_admin_audit_log_best_effort, AdminMediaAccessLogsQuery,
};

use super::helpers::parse_media_access_logs_action_filter;

pub async fn get_admin_media_access_logs(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminMediaAccessLogsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let action_filter = match parse_media_access_logs_action_filter(&query.action) {
        Ok(a) => a,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_media_access_logs_action")),
            )
                .into_response();
        }
    };
    let token_uuid: Option<Uuid> = match query.token_id.as_deref() {
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
                                "invalid_media_access_logs_token_id_filter",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };
    let obj_sub = query.object_id.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let object_id_pattern: Option<String> =
        obj_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let actor_sub = query.actor_or_ip.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let actor_pattern: Option<String> =
        actor_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_media_access_logs(
        pool,
        action_filter,
        object_id_pattern.as_deref(),
        actor_pattern.as_deref(),
        token_uuid,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("media_access_logs_query_failed")),
            )
                .into_response();
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.media.access_logs.read",
        Some("media_access_logs"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "action": action_filter,
            "object_id": obj_sub,
            "actor_or_ip": actor_sub,
            "token_id": token_uuid.map(|u| u.to_string()),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "token_id": r.token_id.map(|u| u.to_string()),
                "object_id": r.object_id,
                "actor_or_ip": r.actor_or_ip,
                "action": r.action,
                "occurred_at": r.occurred_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "action": action_filter,
            "object_id": obj_sub,
            "actor_or_ip": actor_sub,
            "token_id": token_uuid.map(|u| u.to_string()),
        },
        "meta": {
            "source": "db",
            "note": "270 signed-url issue + anonymous redeem audit; actions issue_ok|read_ok|read_expired",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
