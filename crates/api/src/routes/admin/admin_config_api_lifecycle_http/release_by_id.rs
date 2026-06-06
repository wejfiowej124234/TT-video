//! `GET …/admin/config/releases/:id`

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use crate::routes::admin::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort,
};

pub async fn get_admin_config_release_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);
    let id_trim = id.trim();
    let rid = match Uuid::parse_str(id_trim) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_config_release_id")),
            )
                .into_response();
        }
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let row = match db::get_config_release_by_id(pool, rid).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("config_release_query_failed")),
            )
                .into_response()
        }
    };    let Some(r) = row else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("config_release_not_found")),
        )
            .into_response();
    };    let resource_id = r.id.to_string();
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.config.release.read",
        Some("config_releases"),
        Some(resource_id.as_str()),
        json!({ "release_key": r.release_key, "version_label": r.version_label }),
    )
    .await;
    let mut body = json!({
        "status": "ok",
        "release": {
            "id": r.id.to_string(),
            "release_key": r.release_key,
            "version_label": r.version_label,
            "status": r.status,
            "effective_from": r.effective_from.map(|t| t.to_rfc3339()),
            "rolled_back_at": r.rolled_back_at.map(|t| t.to_rfc3339()),
            "notes": r.notes,
            "created_at": r.created_at.to_rfc3339(),
            "updated_at": r.updated_at.to_rfc3339(),
        },
        "meta": {
            "source": "db",
            "note": "220 baseline ledger row",
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
