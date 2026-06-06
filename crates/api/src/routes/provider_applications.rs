//! 商家资质申请 · `POST /api/v1/provider-applications`

use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::post;
use axum::{Json, Router};
use serde_json::json;

use crate::state::{extract_user_with_session_check, ApiMetaState};
use crate::chain_off;

use super::not_impl_json;

pub async fn post_provider_applications(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<chain_off::PostProviderApplicationBody>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let uid = match extract_user_with_session_check(&state, &headers).await {
            Some(u) => u,
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "login_required", "message": "login_required"})),
                )
                    .into_response();
            }
        };
        return match chain_off::post_provider_application_impl(co.clone(), uid, Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("POST /api/v1/provider-applications").into_response()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/provider-applications",
        post(post_provider_applications),
    )
}
