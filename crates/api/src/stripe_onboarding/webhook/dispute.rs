use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::db::{apply_stripe_dispute_funds_withdrawn_webhook, StripeDisputeWebhookOutcome};

use super::super::ensure::payment_intent_id_from_stripe_expandable;

pub(crate) async fn handle_dispute_funds_withdrawn(
    pool: &PgPool,
    event: &Value,
    event_id: &str,
    _event_type: &str,
) -> axum::response::Response {
    let d = &event["data"]["object"];
    let ch_raw = d["charge"].as_str().map(str::trim).unwrap_or("");
    let pi_dis = payment_intent_id_from_stripe_expandable(d);
    match apply_stripe_dispute_funds_withdrawn_webhook(
        pool,
        event_id,
        ch_raw,
        pi_dis.as_deref(),
    )
    .await
    {
        Ok(StripeDisputeWebhookOutcome::Applied) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": true,
                "event_id": event_id,
                "source": "charge.dispute.funds_withdrawn",
            })),
        )
            .into_response(),
        Ok(StripeDisputeWebhookOutcome::DuplicateEvent) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "duplicate": true,
                "event_id": event_id,
                "source": "charge.dispute.funds_withdrawn",
            })),
        )
            .into_response(),
        Ok(StripeDisputeWebhookOutcome::AuditOnlyAlreadyFinal) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "event_id": event_id,
                "source": "charge.dispute.funds_withdrawn",
                "detail": "stripe_dispute_funds_withdrawn_entitlement_already_terminal_audit_recorded",
            })),
        )
            .into_response(),
        Ok(StripeDisputeWebhookOutcome::UnknownEntitlement) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "event_id": event_id,
                "detail": "unknown_charge_or_payment_intent_or_not_paid",
                "source": "charge.dispute.funds_withdrawn",
            })),
        )
            .into_response(),
        Err(e) => {
            eprintln!("[stripe_onboarding_webhook] dispute funds_withdrawn apply err={e}");
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
