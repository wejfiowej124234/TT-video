//! `POST …/admin/flags/:id/publish` (super-admin)

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use crate::routes::admin::{
    admin_attach_meta_build, admin_db_pool_required, admin_rbac, request_id_from_headers,
    write_admin_audit_log_best_effort, AdminFlagPublishBody,
};

pub async fn post_admin_flag_publish(
    State(state): State<ApiMetaState>,
    Path(flag_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminFlagPublishBody>,
) -> impl IntoResponse {
    let actor_id = match admin_rbac::require_admin_permission(
        &state,
        &headers,
        admin_rbac::PERM_PLATFORM_PUBLISH,
    )
    .await
    {
        Ok((v, _)) => v,
        Err(resp) => return resp,
    };
    let id = match Uuid::parse_str(flag_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_flag_id")),
            )
                .into_response()
        }
    };    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let cur = match db::get_feature_flag_by_id(pool, id).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("feature_flag_query_failed")),
            )
                .into_response()
        }
    };    let Some(cur) = cur else {
        return (
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("feature_flag_not_found")),
        )
            .into_response();
    };    if cur.version != body.expected_version {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": "feature_flag_version_conflict",
                "current_version": cur.version,
            })),
        )
            .into_response();
    };    let rollout = match body.rollout_percent {
        Some(p) if (0..=100).contains(&p) => p,
        Some(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_rollout_percent")),
            )
                .into_response()
        }
        None => cur.rollout_percent,
    };
    let region = match body.region {
        None => cur.region.clone(),
        Some(inner) => inner,
    };

    let updated = match db::publish_feature_flag(
        pool,
        id,
        body.expected_version,
        body.enabled,
        rollout,
        region.clone(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("feature_flag_publish_failed")),
            )
                .into_response()
        }
    };    let Some(updated) = updated else {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("feature_flag_publish_race")),
        )
            .into_response();
    }

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.flags.publish",
        Some("feature_flags"),
        Some(&id.to_string()),
        json!({
            "flag_code": updated.flag_code,
            "enabled": updated.enabled,
            "rollout_percent": updated.rollout_percent,
            "region": updated.region,
            "version_before": body.expected_version,
            "version_after": updated.version,
        }),
    )
    .await;

    let mut body = json!({
        "status": "ok",
        "item": {
            "id": updated.id,
            "flag_code": updated.flag_code,
            "description": updated.description,
            "scope": updated.scope,
            "enabled": updated.enabled,
            "rollout_percent": updated.rollout_percent,
            "region": updated.region,
            "version": updated.version,
            "updated_at": updated.updated_at.to_rfc3339(),
        },
        "meta": {
        }
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}
