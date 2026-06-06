use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::db::{apply_payment_webhook, WebhookApplyOutcome};

use super::super::ensure::merge_pi_latest_charge_after_payment_intent_webhook;

pub(crate) async fn handle_payment_intent_succeeded(
    pool: &PgPool,
    event: &Value,
    event_id: &str,
) -> axum::response::Response {
    let obj = &event["data"]["object"];
    let pi_id = obj["id"].as_str().unwrap_or("");
    let idem = obj["metadata"]["traveltrust_idempotency_key"]
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
                "detail": "missing traveltrust_idempotency_key in PaymentIntent metadata",
            })),
        )
            .into_response();
    };
    match apply_payment_webhook(pool, idem, event_id, "succeeded", Some(pi_id)).await {
        Ok(WebhookApplyOutcome::Accepted) => {
            merge_pi_latest_charge_after_payment_intent_webhook(pool, idem, obj).await;
            (
                StatusCode::OK,
                Json(json!({
                    "status": "ok",
                    "received": true,
                    "applied": true,
                    "event_id": event_id,
                })),
            )
                .into_response()
        }
        Ok(WebhookApplyOutcome::DuplicateEvent) => {
            merge_pi_latest_charge_after_payment_intent_webhook(pool, idem, obj).await;
            (
                StatusCode::OK,
                Json(json!({
                    "status": "ok",
                    "received": true,
                    "applied": false,
                    "duplicate": true,
                    "event_id": event_id,
                })),
            )
                .into_response()
        }
        Ok(WebhookApplyOutcome::UnknownIdempotencyKey) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "event_id": event_id,
                "detail": "unknown_idempotency_key",
            })),
        )
            .into_response(),
        Err(e) => {
            eprintln!("[stripe_onboarding_webhook] apply err={e}");
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
