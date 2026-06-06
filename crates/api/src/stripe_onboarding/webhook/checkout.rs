use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::db::{apply_payment_webhook, WebhookApplyOutcome};

use super::super::ensure::payment_intent_id_from_session_json;

pub(crate) async fn handle_checkout_session_completed(
    pool: &PgPool,
    event: &Value,
    event_id: &str,
    event_type: &str,
) -> axum::response::Response {
    let obj = &event["data"]["object"];
    let payment_status = obj["payment_status"].as_str().unwrap_or("");
    if payment_status != "paid" {
        return (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "event_type": event_type,
                "event_id": event_id,
                "detail": format!("checkout.session payment_status={payment_status}"),
            })),
        )
            .into_response();
    };    let idem = obj["metadata"]["traveltrust_idempotency_key"]
        .as_str()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let Some(idem) = idem else {
        return (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "event_id": event_id,
                "detail": "missing traveltrust_idempotency_key in Checkout Session metadata",
            })),
        )
            .into_response();
    };    let pi_opt = payment_intent_id_from_session_json(obj);
    let pi_ref = pi_opt.as_deref().filter(|s| !s.is_empty());
    match apply_payment_webhook(pool, idem, event_id, "succeeded", pi_ref).await {
        Ok(WebhookApplyOutcome::Accepted) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": true,
                "event_id": event_id,
                "source": "checkout.session.completed",
            })),
        )
            .into_response(),
        Ok(WebhookApplyOutcome::DuplicateEvent) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "duplicate": true,
                "event_id": event_id,
                "source": "checkout.session.completed",
            })),
        )
            .into_response(),
        Ok(WebhookApplyOutcome::UnknownIdempotencyKey) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "event_id": event_id,
                "detail": "unknown_idempotency_key",
                "source": "checkout.session.completed",
            })),
        )
            .into_response(),
        Err(e) => {
            eprintln!("[stripe_onboarding_webhook] checkout apply err={e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "stripe_webhook_apply_failed",
                    "message": "stripe_webhook_apply_failed",
                })),
            )
                .into_response()
        }
    }
}
