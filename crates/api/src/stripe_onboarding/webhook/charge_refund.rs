use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use sqlx::PgPool;

use crate::db::{
    apply_stripe_charge_full_refund_webhook, apply_stripe_charge_partial_refund_webhook_audit,
    StripeChargeRefundWebhookOutcome, StripePartialRefundWebhookOutcome,
};

use super::super::ensure::payment_intent_id_from_stripe_expandable;

pub(crate) async fn handle_charge_refunded(
    pool: &PgPool,
    event: &Value,
    event_id: &str,
    event_type: &str,
) -> axum::response::Response {
    let obj = &event["data"]["object"];
    let Some(pi_id) = payment_intent_id_from_stripe_expandable(obj) else {
        return (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "event_type": event_type,
                "event_id": event_id,
                "detail": "missing_or_empty_payment_intent_on_charge",
            })),
        )
            .into_response();
    };    let amount = obj["amount"].as_i64().unwrap_or(0);
    let amount_refunded = obj["amount_refunded"].as_i64().unwrap_or(0);
    if amount <= 0 || amount_refunded <= 0 {
        return (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "event_type": event_type,
                "event_id": event_id,
                "detail": "zero_amount_refund_ignored",
                "amount": amount,
                "amount_refunded": amount_refunded,
            })),
        )
            .into_response();
    };    if amount_refunded < amount {
        return match apply_stripe_charge_partial_refund_webhook_audit(pool, event_id, &pi_id).await
        {
            Ok(StripePartialRefundWebhookOutcome::Recorded) => (
                StatusCode::OK,
                Json(json!({
                    "status": "ok",
                    "received": true,
                    "applied": true,
                    "event_id": event_id,
                    "source": "charge.refunded",
                    "detail": "partial_refund_audit_recorded",
                    "amount": amount,
                    "amount_refunded": amount_refunded,
                    "payment_intent_id": pi_id,
                })),
            )
                .into_response(),
            Ok(StripePartialRefundWebhookOutcome::DuplicateEvent) => (
                StatusCode::OK,
                Json(json!({
                    "status": "ok",
                    "received": true,
                    "applied": false,
                    "duplicate": true,
                    "event_id": event_id,
                    "source": "charge.refunded",
                    "amount": amount,
                    "amount_refunded": amount_refunded,
                })),
            )
                .into_response(),
            Ok(StripePartialRefundWebhookOutcome::UnknownEntitlement) => (
                StatusCode::OK,
                Json(json!({
                    "status": "ok",
                    "received": true,
                    "applied": false,
                    "event_id": event_id,
                    "detail": "unknown_payment_intent_or_not_paid_for_partial_refund_audit",
                    "source": "charge.refunded",
                    "amount": amount,
                    "amount_refunded": amount_refunded,
                })),
            )
                .into_response(),
            Err(e) => {
                eprintln!("[stripe_onboarding_webhook] charge.refunded partial audit err={e}");
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
    };    match apply_stripe_charge_full_refund_webhook(pool, event_id, &pi_id).await {
        Ok(StripeChargeRefundWebhookOutcome::Applied) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": true,
                "event_id": event_id,
                "source": "charge.refunded",
                "payment_intent_id": pi_id,
            })),
        )
            .into_response(),
        Ok(StripeChargeRefundWebhookOutcome::DuplicateEvent) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "duplicate": true,
                "event_id": event_id,
                "source": "charge.refunded",
            })),
        )
            .into_response(),
        Ok(StripeChargeRefundWebhookOutcome::AuditOnlyAlreadyFinal) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "event_id": event_id,
                "source": "charge.refunded",
                "detail": "stripe_charge_refunded_entitlement_already_terminal_audit_recorded",
            })),
        )
            .into_response(),
        Ok(StripeChargeRefundWebhookOutcome::UnknownEntitlement) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "event_id": event_id,
                "detail": "unknown_payment_intent_or_not_paid",
                "source": "charge.refunded",
            })),
        )
            .into_response(),
        Err(e) => {
            eprintln!("[stripe_onboarding_webhook] charge.refunded apply err={e}");
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
