//! Admin · 向导入驻申请审核队列

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, patch};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::chain_off;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_ONBOARDING_REVIEW};
use super::{require_admin_actor, write_admin_audit_log_best_effort};

#[derive(Debug, Deserialize)]
pub struct AdminGuideApplicationsQuery {
    pub status: Option<String>,
    /// Optional page size; clamped in `admin_onboarding_queue_list_limit` (G089).
    pub limit: Option<i64>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/guide-applications",
            get(get_admin_guide_applications_list),
        )
        .route(
            "/api/v1/admin/users/:id/guide-application",
            get(get_admin_user_guide_application),
        )
        .route(
            "/api/v1/admin/users/:id/guide-application-review",
            patch(patch_admin_guide_application_review),
        )
}

pub async fn get_admin_guide_applications_list(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminGuideApplicationsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _actor = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let co = match state.chain_off.clone() {
        Some(c) => c,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "chain_off_unavailable",
                    "message": "chain_off_unavailable",
                })),
            )
                .into_response();
        }
    };
    match chain_off::list_guide_applications_admin_impl(co, q.status.clone()).await {
        Ok(Json(mut body)) => {
            let limit = super::admin_onboarding_queue_list_limit::clamp_onboarding_queue_list_limit(q.limit);
            super::admin_onboarding_queue_list_limit::apply_onboarding_queue_list_limit(
                &mut body,
                limit,
                q.status.as_deref(),
            );
            Json(body).into_response()
        }
        Err(err) => err.into_response(),
    }
}

pub async fn get_admin_user_guide_application(
    State(state): State<ApiMetaState>,
    Path(user_id_raw): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _actor = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let co = match state.chain_off.clone() {
        Some(c) => c,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "chain_off_unavailable",
                    "message": "chain_off_unavailable",
                })),
            )
                .into_response();
        }
    };
    let target_user_id = match Uuid::parse_str(user_id_raw.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_user_id")),
            )
                .into_response();
        }
    };
    match chain_off::get_guide_application_for_user_admin_impl(co, target_user_id).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn patch_admin_guide_application_review(
    State(state): State<ApiMetaState>,
    Path(user_id_raw): Path<String>,
    headers: HeaderMap,
    Json(body): Json<chain_off::PatchGuideApplicationReviewBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_ONBOARDING_REVIEW).await
        {
            Ok(v) => v,
            Err(r) => return r,
        };
    let co = match state.chain_off.clone() {
        Some(c) => c,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "chain_off_unavailable",
                    "message": "chain_off_unavailable",
                })),
            )
                .into_response();
        }
    };
    let target_user_id = match Uuid::parse_str(user_id_raw.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_user_id")),
            )
                .into_response();
        }
    };
    let request_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match chain_off::admin_review_guide_application_impl(co, target_user_id, Json(body)).await {
        Ok(j) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                request_id,
                "admin.guide_application.review",
                Some("guides"),
                Some(target_user_id.to_string().as_str()),
                json!({
                    "user_id": target_user_id,
                    "application_status": j.0["application_status"].clone(),
                }),
            )
            .await;
            j.into_response()
        }
        Err((code, j)) => (code, j).into_response(),
    }
}
