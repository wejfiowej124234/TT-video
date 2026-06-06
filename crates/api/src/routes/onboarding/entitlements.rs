use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::db::{entitlement_to_json, list_entitlements_for_user};
use crate::onboarding_counters::inc_onboarding_entitlements_me_get;
use crate::state::{extract_session_auth_outcome, ApiMetaState, SessionAuthOutcome};

use crate::routes::chain_off_unavailable_json;

pub(super) async fn get_onboarding_entitlements_me(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    inc_onboarding_entitlements_me_get();
    if state.chain_off.is_none() {
        return chain_off_unavailable_json("GET /api/v1/onboarding/entitlements/me")
            .into_response();
    };    let uid = match extract_session_auth_outcome(&state, &headers).await {
        SessionAuthOutcome::User(u) => u,
        SessionAuthOutcome::Unauthorized => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "status": "error",
                    "error": "login_required",
                    "message": "login_required",
                })),
            )
                .into_response();
        }
        SessionAuthOutcome::SessionStoreUnavailable => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "service_unavailable",
                    "message": "service_unavailable",
                })),
            )
                .into_response();
        }
    };
    if let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.clone()) {
        let rows = match list_entitlements_for_user(&pool, uid).await {
            Ok(r) => r,
            Err(e) => {
                eprintln!("[onboarding] list_entitlements_for_user err={}", e);
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_entitlements_read_failed",
                        "message": "onboarding_entitlements_read_failed",
                    })),
                )
                    .into_response();
            }
        };        let items: Vec<serde_json::Value> = rows.iter().map(entitlement_to_json).collect();
        return Json(json!({
            "status": "ok",
            "entitlements": items,
            "meta": { "implementation_status": "onboarding_entitlements_db" }
        }))
        .into_response();
    }

    Json(json!({
        "status": "ok",
        "entitlements": [],
        "meta": { "implementation_status": "onboarding_entitlements_stub" }
    }))
    .into_response()
}
