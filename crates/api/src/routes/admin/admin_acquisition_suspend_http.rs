//! Admin · PD-009 收购发布 suspend

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::patch;
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_ACQUISITION_SUSPEND};
use super::write_admin_audit_log_best_effort;

#[derive(Debug, Deserialize)]
pub struct AdminAcquisitionPublishSuspendBody {
    pub suspended_until: Option<String>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/admin/users/:id/acquisition-publish-suspend",
        patch(patch_admin_acquisition_publish_suspend),
    )
}

pub async fn patch_admin_acquisition_publish_suspend(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminAcquisitionPublishSuspendBody>,
) -> impl IntoResponse {
    let (actor_id, _) = match admin_rbac::require_admin_permission(&state, &headers, PERM_ACQUISITION_SUSPEND).await
    {
        Ok(v) => v,
        Err(r) => return r,
    };
    let user_uuid = match Uuid::parse_str(id.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "invalid_user_id",
                    "message": "invalid_user_id",
                })),
            )
                .into_response()
        }
    };
    let Some(co) = state.chain_off.as_ref() else {
        return (
            StatusCode::NOT_IMPLEMENTED,
            Json(json!({
                "status": "not_implemented",
                "error": "not_implemented",
                "message": "not_implemented",
            })),
        )
            .into_response();
    };
    let Some(pool) = co.db_pool.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "database_required",
                "message": "database_required",
            })),
        )
            .into_response();
    };
    let target = match db::get_user_by_id(pool, user_uuid).await {
        Ok(Some(u)) => u,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({
                    "status": "error",
                    "error": "target_user_not_found",
                    "message": "target_user_not_found",
                })),
            )
                .into_response()
        }
        Err(e) => {
            eprintln!("WARN: get_user_by_id acquisition suspend: {e}");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "acquisition_trust_lookup_failed",
                    "message": "acquisition_trust_lookup_failed",
                })),
            )
                .into_response();
        }
    };
    let until = match body.suspended_until.as_deref() {
        None => None,
        Some(s) if s.trim().is_empty() => None,
        Some(s) => {
            let parsed = DateTime::parse_from_rfc3339(s.trim()).map_err(|_| ()).and_then(|d| {
                let u = d.with_timezone(&Utc);
                if u <= Utc::now() {
                    Err(())
                } else {
                    Ok(Some(u))
                }
            });
            match parsed {
                Ok(v) => v,
                Err(()) => {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(json!({
                            "status": "error",
                            "error": "acquisition_publish_suspend_until_must_be_future",
                            "message": "acquisition_publish_suspend_until_must_be_future",
                        })),
                    )
                        .into_response()
                }
            }
        }
    };
    if let Err(e) = db::set_acquisition_publish_suspended_until(pool, user_uuid, until).await {
        eprintln!("WARN: set_acquisition_publish_suspended_until: {e}");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "acquisition_trust_lookup_failed",
                "message": "acquisition_trust_lookup_failed",
            })),
        )
            .into_response();
    }
    let effective_until = db::acquisition_publish_suspended_until(pool, user_uuid)
        .await
        .ok()
        .flatten();
    let (suspended, until_rfc3339) = db::acquisition_suspend_admin_projection(effective_until);
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        headers
            .get("x-request-id")
            .and_then(|v| v.to_str().ok()),
        "admin.users.acquisition_publish_suspend",
        Some("users"),
        Some(user_uuid.to_string().as_str()),
        json!({
            "target_user_id": user_uuid.to_string(),
            "suspended_until": until_rfc3339,
            "acquisition_publish_suspended": suspended,
        }),
    )
    .await;
    let _ = target.email;
    Json(json!({
        "status": "ok",
        "acquisition_publish_suspended": suspended,
        "acquisition_publish_suspended_until": until_rfc3339,
    }))
    .into_response()
}

/// 为 Admin 用户 JSON 附加 **`acquisition_publish_suspended*`**（PG SSOT）。
pub async fn attach_acquisition_suspend_fields(
    pool: &sqlx::PgPool,
    user_id: Uuid,
    obj: &mut serde_json::Map<String, serde_json::Value>,
) {
    if let Ok(until) = db::acquisition_publish_suspended_until(pool, user_id).await {
        let (suspended, until_rfc3339) = db::acquisition_suspend_admin_projection(until);
        obj.insert(
            "acquisition_publish_suspended".to_string(),
            json!(suspended),
        );
        match until_rfc3339 {
            Some(s) => {
                obj.insert(
                    "acquisition_publish_suspended_until".to_string(),
                    json!(s),
                );
            }
            None => {
                obj.insert(
                    "acquisition_publish_suspended_until".to_string(),
                    serde_json::Value::Null,
                );
            }
        }
    }
}
