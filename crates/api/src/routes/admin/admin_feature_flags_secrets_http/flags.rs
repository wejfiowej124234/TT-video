//! `GET …/admin/flags`

use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;

use crate::routes::admin::{
    admin_attach_meta_build, admin_db_pool_required, parse_feature_flag_enabled_filter,
    request_id_from_headers, require_admin_actor, write_admin_audit_log_best_effort,
    AdminFlagsQuery,
};

use super::helpers::parse_admin_scope_token;

pub async fn get_admin_flags(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminFlagsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(200).clamp(1, 200);
    let code_sub = query.flag_code.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let flag_code_pattern: Option<String> =
        code_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let enabled_filter = match parse_feature_flag_enabled_filter(&query.enabled) {
        Ok(v) => v,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "invalid_feature_flag_enabled_filter",
                    "enabled must be true|false|1|0|yes|no or omitted",
                )),
            )
                .into_response();
        }
    };    let scope_filter: Option<&str> = match query.scope.as_ref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                match parse_admin_scope_token(s) {
                    Some(tok) => Some(tok),
                    None => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(crate::api_json::err_key_detail(
                                "invalid_feature_flag_scope_filter",
                                "scope must be 1–64 chars [a-zA-Z0-9._-] or omitted",
                            )),
                        )
                            .into_response();
                    }
                }
            }
        }
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_feature_flags(
        pool,
        flag_code_pattern.as_deref(),
        enabled_filter,
        scope_filter,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("feature_flags_query_failed")),
            )
                .into_response()
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.flags.read",
        Some("feature_flags"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "flag_code": code_sub,
            "enabled": enabled_filter,
            "scope": scope_filter,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "flag_code": r.flag_code,
                "description": r.description,
                "scope": r.scope,
                "enabled": r.enabled,
                "rollout_percent": r.rollout_percent,
                "region": r.region,
                "version": r.version,
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "flag_code": code_sub,
            "enabled": enabled_filter,
            "scope": scope_filter,
        },
        "meta": {
            "source": "db",
            "note": "220/240 baseline; consumers may still read env until wired",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
