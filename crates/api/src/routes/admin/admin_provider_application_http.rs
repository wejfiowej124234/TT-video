//! Admin · 商家资质申请审核

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
pub struct AdminProviderApplicationsQuery {
    pub status: Option<String>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/provider-applications",
            get(get_admin_provider_applications_list),
        )
        .route(
            "/api/v1/admin/users/:id/provider-application",
            get(get_admin_user_provider_application),
        )
        .route(
            "/api/v1/admin/users/:id/provider-application-review",
            patch(patch_admin_provider_application_review),
        )
}

pub async fn get_admin_provider_applications_list(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminProviderApplicationsQuery>,
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
    chain_off::list_provider_applications_admin_impl(co, q.status).await.into_response()
}

pub async fn get_admin_user_provider_application(
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
    };    let target_user_id = match Uuid::parse_str(user_id_raw.trim()) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_user_id")),
            )
                .into_response();
        }
    };    match chain_off::get_provider_application_for_user_impl(co, target_user_id).await {
        Ok(j) => j.into_response(),
        Err((code, j)) => (code, j).into_response(),
    }
}

pub async fn patch_admin_provider_application_review(
    State(state): State<ApiMetaState>,
    Path(user_id_raw): Path<String>,
    headers: HeaderMap,
    Json(body): Json<chain_off::PatchProviderApplicationReviewBody>,
) -> impl IntoResponse {
    let (actor_id, _) = match admin_rbac::require_admin_permission(&state, &headers, PERM_ONBOARDING_REVIEW).await
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
    let review_status = body.status.clone();
    match chain_off::admin_review_provider_application_impl(co, target_user_id, Json(body)).await {
        Ok(j) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.users.provider_application_review",
                Some("users"),
                Some(target_user_id.to_string().as_str()),
                json!({
                    "target_user_id": target_user_id.to_string(),
                    "status": review_status,
                }),
            )
            .await;
            j.into_response()
        }
        Err((code, j)) => (code, j).into_response(),
    }
}
