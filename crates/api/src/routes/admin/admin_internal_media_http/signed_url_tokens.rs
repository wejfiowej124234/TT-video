//! `GET …/admin/media/signed-url-tokens`

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
    write_admin_audit_log_best_effort, AdminMediaSignedUrlTokensQuery,
};

use super::helpers::parse_media_signed_url_tokens_scope_filter;

pub async fn get_admin_media_signed_url_tokens(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminMediaSignedUrlTokensQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);

    let scope_filter = match parse_media_signed_url_tokens_scope_filter(&query.url_scope) {
        Ok(s) => s,
        Err(()) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "invalid_media_signed_url_tokens_scope_filter",
                    "url_scope must be read|download or omitted",
                )),
            )
                .into_response();
        }
    };
    let issued_uuid: Option<Uuid> = match query.issued_to.as_deref() {
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
                                "invalid_media_signed_url_tokens_issued_to_filter",
                            )),
                        )
                            .into_response();
                    }
                }
            }
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
                                "invalid_media_signed_url_tokens_token_id_filter",
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

    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_signed_url_tokens(
        pool,
        object_id_pattern.as_deref(),
        scope_filter,
        issued_uuid,
        token_uuid,
        limit,
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("signed_url_tokens_query_failed")),
            )
                .into_response();
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.media.signed_url_tokens.read",
        Some("signed_url_tokens"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "object_id": obj_sub,
            "url_scope": scope_filter,
            "issued_to": issued_uuid.map(|u| u.to_string()),
            "token_id": token_uuid.map(|u| u.to_string()),
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "object_id": r.object_id,
                "url_scope": r.url_scope,
                "expires_at": r.expires_at.to_rfc3339(),
                "issued_to": r.issued_to.to_string(),
                "created_at": r.created_at.to_rfc3339(),
            })
        })
        .collect();
    let mut body = json!({
        "status": "ok",
        "items": items,
        "applied_filters": {
            "limit": limit,
            "object_id": obj_sub,
            "url_scope": scope_filter,
            "issued_to": issued_uuid.map(|u| u.to_string()),
            "token_id": token_uuid.map(|u| u.to_string()),
        },
        "meta": {
            "source": "db",
            "note": "270 POST /media/signed-urls issuance ledger; no object storage bytes in MVP",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
