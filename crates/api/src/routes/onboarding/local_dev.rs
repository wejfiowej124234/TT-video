//! ① 本地开发：模拟准入费 **paid**（须 **`TRAVELTRUST_ONBOARDING_LOCAL_DEV=1`** + **PG**）。

use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::post;
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;

use crate::db::{apply_payment_webhook, WebhookApplyOutcome};
use crate::state::{extract_session_auth_outcome, ApiMetaState, SessionAuthOutcome};

use super::onboarding_local_dev_enabled;

#[derive(Debug, Deserialize)]
pub struct LocalDevMarkPaidBody {
    pub idempotency_key: String,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/onboarding/local-dev/mark-paid",
        post(post_onboarding_local_dev_mark_paid),
    )
}

async fn post_onboarding_local_dev_mark_paid(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<LocalDevMarkPaidBody>,
) -> impl IntoResponse {
    if !onboarding_local_dev_enabled() {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({
                "status": "error",
                "error": "onboarding_local_dev_disabled",
                "message": "onboarding_local_dev_disabled",
            })),
        )
            .into_response();
    };    let _uid = match extract_session_auth_outcome(&state, &headers).await {
        SessionAuthOutcome::User(u) => u,
        SessionAuthOutcome::Unauthorized => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "login_required", "message": "login_required"})),
            )
                .into_response();
        }
        SessionAuthOutcome::SessionStoreUnavailable => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"error": "service_unavailable", "message": "service_unavailable"})),
            )
                .into_response();
        }
    };
    let idem = body.idempotency_key.trim();
    if idem.is_empty() || idem.len() > 256 {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_onboarding_idempotency_key")),
        )
            .into_response();
    };    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_local_dev_requires_db",
                    "message": "onboarding_local_dev_requires_db",
                })),
            )
                .into_response();
        }
    };
    let provider_event_id = format!("local_dev_mark_paid_{}", uuid::Uuid::new_v4());
    match apply_payment_webhook(pool, idem, &provider_event_id, "succeeded", None).await {
        Ok(WebhookApplyOutcome::Accepted) | Ok(WebhookApplyOutcome::DuplicateEvent) => {
            Json(json!({
                "status": "ok",
                "idempotency_key": idem,
                "meta": { "implementation_status": "onboarding_local_dev_mark_paid" }
            }))
            .into_response()
        }
        Ok(WebhookApplyOutcome::UnknownIdempotencyKey) => (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "onboarding_webhook_unknown_idempotency_key",
                "message": "onboarding_webhook_unknown_idempotency_key",
            })),
        )
            .into_response(),
        Err(e) => {
            eprintln!("[onboarding] local_dev mark_paid err={}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_local_dev_mark_paid_failed",
                    "message": "onboarding_local_dev_mark_paid_failed",
                })),
            )
                .into_response()
        }
    }
}
