//! **`POST /api/v1/hooks/stripe/onboarding`** — Stripe Dashboard / CLI → TravelTrust.

mod charge_refund;
mod checkout;
mod dispute;
mod payment_intent;

use std::time::Duration;

use axum::body::Bytes;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};

use super::config::stripe_webhook_secret_trimmed;
use super::signature::{decode_whsec, verify_stripe_signature};

/// **POST /api/v1/hooks/stripe/onboarding** — Stripe Dashboard / CLI → TravelTrust.
pub async fn post_stripe_onboarding_webhook(
    State(state): State<crate::state::ApiMetaState>,
    headers: HeaderMap,
    body: Bytes,
) -> impl IntoResponse {
    let Some(whsec_raw) = stripe_webhook_secret_trimmed() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "stripe_webhook_not_configured",
                "message": "stripe_webhook_not_configured",
                "detail": "Set TRAVELTRUST_STRIPE_WEBHOOK_SECRET (whsec_…) to accept Stripe webhooks.",
            })),
        )
            .into_response();
    };
    let Ok(whsec_bytes) = decode_whsec(&whsec_raw) else {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "stripe_webhook_secret_invalid",
                "message": "stripe_webhook_secret_invalid",
            })),
        )
            .into_response();
    };
    let sig = headers
        .get("Stripe-Signature")
        .or_else(|| headers.get("stripe-signature"))
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    if sig.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "missing_stripe_signature",
                "message": "missing_stripe_signature",
            })),
        )
            .into_response();
    };    let tol_secs: i64 = std::env::var("TRAVELTRUST_STRIPE_WEBHOOK_TOLERANCE_SECS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(300)
        .clamp(60, 86400);
    if verify_stripe_signature(
        body.as_ref(),
        sig,
        &whsec_bytes,
        Duration::from_secs(tol_secs as u64),
    )
    .is_err()
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "stripe_webhook_invalid_signature",
                "message": "stripe_webhook_invalid_signature",
            })),
        )
            .into_response();
    };    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.clone()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::OK,
                Json(json!({
                    "status": "ok",
                    "received": true,
                    "applied": false,
                    "meta": { "detail": "database pool not mounted" }
                })),
            )
                .into_response();
        }
    };
    let event: Value = match serde_json::from_slice(body.as_ref()) {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "invalid_body",
                    "message": "invalid_body",
                    "detail": e.to_string(),
                })),
            )
                .into_response();
        }
    };
    let event_id = event["id"].as_str().unwrap_or("unknown_event");
    let event_type = event["type"].as_str().unwrap_or("");

    if event_type == "checkout.session.completed" {
        return checkout::handle_checkout_session_completed(&pool, &event, event_id, event_type)
            .await;
    }
    if event_type == "charge.refunded" {
        return charge_refund::handle_charge_refunded(&pool, &event, event_id, event_type).await;
    }
    if event_type == "charge.dispute.funds_withdrawn" {
        return dispute::handle_dispute_funds_withdrawn(&pool, &event, event_id, event_type).await;
    }
    if event_type != "payment_intent.succeeded" {
        return (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "received": true,
                "applied": false,
                "event_type": event_type,
                "event_id": event_id,
            })),
        )
            .into_response();
    }

    payment_intent::handle_payment_intent_succeeded(&pool, &event, event_id).await
}
