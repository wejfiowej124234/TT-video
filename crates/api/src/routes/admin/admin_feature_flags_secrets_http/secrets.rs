//! `GET …/admin/secrets/metadata`

use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;

use crate::routes::admin::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminSecretsMetadataQuery,
};

use super::helpers::{is_allowed_secret_metadata_status, parse_admin_scope_token};

pub async fn get_admin_secrets_metadata(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminSecretsMetadataQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(200).clamp(1, 200);
    let key_sub = query.key_alias.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let key_alias_pattern: Option<String> =
        key_sub.map(|sub| format!("%{}%", db::escape_sql_like_pattern(sub)));
    let st_filter: Option<&str> = match query.status.as_ref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else if is_allowed_secret_metadata_status(t) {
                Some(t)
            } else {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "invalid_secret_metadata_status",
                        "status must be active, deprecated, revoked, pending, suspended, or omitted",
                    )),
                )
                    .into_response();
            }
        }
    };    let env_filter: Option<&str> = match query.env_scope.as_ref() {
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
                                "invalid_secret_metadata_env_scope",
                                "env_scope must be 1–64 chars [a-zA-Z0-9._-] or omitted",
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
    let rows = match db::list_secret_key_metadata(
        pool,
        key_alias_pattern.as_deref(),
        st_filter,
        env_filter,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("secret_metadata_query_failed")),
            )
                .into_response()
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.secrets.metadata.read",
        Some("secret_key_metadata"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "key_alias_substring": key_sub,
            "status": st_filter,
            "env_scope": env_filter,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "key_alias": r.key_alias,
                "env_scope": r.env_scope,
                "last_rotated_at": r.last_rotated_at.map(|t| t.to_rfc3339()),
                "next_rotation_due": r.next_rotation_due.map(|t| t.to_rfc3339()),
                "status": r.status,
                "notes": r.notes,
                "updated_at": r.updated_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "key_alias": key_sub,
            "status": st_filter,
            "env_scope": env_filter,
        },
        "meta": {
            "source": "db",
            "policy": "no_secret_values",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
