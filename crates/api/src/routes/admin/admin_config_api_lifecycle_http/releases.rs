//! `GET …/admin/config/releases`

use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;

use crate::routes::admin::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort, AdminConfigReleasesQuery,
};

pub async fn get_admin_config_releases(
    State(state): State<ApiMetaState>,
    Query(query): Query<AdminConfigReleasesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let limit = query.limit.unwrap_or(50).clamp(1, 200);
    let rk_filter = query.release_key.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 256 {
            None
        } else {
            Some(t)
        }
    });
    let st_filter: Option<&str> = match query.status.as_ref() {
        None => None,
        Some(s) => {
            let t = s.trim();
            if t.is_empty() {
                None
            } else if matches!(t, "draft" | "published" | "rolled_back") {
                Some(t)
            } else {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(crate::api_json::err_key_detail(
                        "invalid_config_release_status",
                        "status must be draft, published, rolled_back, or omitted",
                    )),
                )
                    .into_response();
            }
        }
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let rows = match db::list_config_releases(pool, rk_filter, st_filter, limit).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("config_releases_query_failed")),
            )
                .into_response()
        }
    }
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.config.releases.read",
        Some("config_releases"),
        None,
        json!({
            "result_count": rows.len(),
            "limit": limit,
            "release_key": rk_filter,
            "status": st_filter,
        }),
    )
    .await;
    let items: Vec<_> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id.to_string(),
                "release_key": r.release_key,
                "version_label": r.version_label,
                "status": r.status,
                "effective_from": r.effective_from.map(|t| t.to_rfc3339()),
                "rolled_back_at": r.rolled_back_at.map(|t| t.to_rfc3339()),
                "notes": r.notes,
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
            "release_key": rk_filter,
            "status": st_filter,
        },
        "meta": {
            "source": "db",
            "note": "220 baseline ledger; not all runtime config yet",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
