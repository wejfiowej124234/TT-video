//! Stripe Checkout / PaymentIntent 分支（与 **`stripe_onboarding`** 同源）。

use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use sqlx::PgPool;
use std::ops::ControlFlow;

use crate::db::OnboardingEntitlementRow;
use crate::stripe_onboarding;

use super::types::PaymentIntentBody;

pub(super) async fn maybe_stripe_checkout_response(
    pool: &PgPool,
    row: &OnboardingEntitlementRow,
    idem: &str,
    parsed: &PaymentIntentBody,
) -> ControlFlow<axum::response::Response, ()> {
    if !stripe_onboarding::stripe_checkout_enabled() {
        return ControlFlow::Continue(());
    };    let success_url = parsed
        .return_url
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let Some(su) = success_url else {
        return ControlFlow::Break(
            (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "missing_return_url_for_stripe_checkout",
                    "message": "missing_return_url_for_stripe_checkout",
                    "detail": "TRAVELTRUST_ONBOARDING_STRIPE_CHECKOUT=1 requires body.return_url (https) for Stripe Checkout success_url.",
                })),
            )
                .into_response(),
        );
    };    let lower = su.to_ascii_lowercase();
    if (!lower.starts_with("https://") && !lower.starts_with("http://")) || su.len() > 2048 {
        return ControlFlow::Break(
            (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "invalid_return_url_for_stripe_checkout",
                    "message": "invalid_return_url_for_stripe_checkout",
                    "detail": "return_url must be http(s) and at most 2048 characters.",
                })),
            )
                .into_response(),
        );
    };    match stripe_onboarding::ensure_checkout_session_for_entitlement(pool, row, idem, su).await {
        Ok(surf) => {
            let impl_status = if surf.session_complete_no_url {
                "onboarding_checkout_stripe_session_complete"
            } else {
                "onboarding_checkout_stripe_open"
            };            let detail = if surf.session_complete_no_url {
                "Checkout Session completed; wait for Stripe webhook or refresh entitlements. Hosted Checkout reduces in-page card handling; SAQ/PCI boundaries remain per 96-02/96-03."
            } else {
                "Open psp.checkout_url in browser to pay. Webhook checkout.session.completed (or payment_intent.succeeded) marks paid."
            }
            ControlFlow::Break(
                Json(json!({
                    "status": "ok",
                    "entitlement_id": row.id,
                    "idempotency_key": idem,
                    "return_url": parsed.return_url,
                    "psp": {
                        "provider": "stripe",
                        "client_secret": serde_json::Value::Null,
                        "checkout_url": surf.checkout_url,
                    },
                    "meta": {
                        "implementation_status": impl_status,
                        "stripe_checkout_session_id": surf.checkout_session_id,
                        "stripe_checkout_status": surf.session_status,
                        "stripe_payment_intent_id": surf.payment_intent_id,
                        "detail": detail,
                        "doc": concat!("docs", "/spec/", "04-附录-商家主理人准入费HTTP契约草案-配96-18.md", " §2")
                    }
                }))
                .into_response(),
            )
        }
        Err(e) => {
            eprintln!("[onboarding] stripe Checkout Session err={}", e);
            ControlFlow::Break(
                (
                    StatusCode::BAD_GATEWAY,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_psp_unavailable",
                        "message": "onboarding_psp_unavailable",
                        "detail": format!("Stripe Checkout Session: {e}"),
                    })),
                )
                    .into_response(),
            )
        }
    }
}

pub(super) async fn maybe_stripe_payment_intent_response(
    pool: &PgPool,
    row: &OnboardingEntitlementRow,
    idem: &str,
    parsed: &PaymentIntentBody,
) -> ControlFlow<axum::response::Response, ()> {
    if !stripe_onboarding::stripe_onboarding_enabled() {
        return ControlFlow::Continue(());
    };    match stripe_onboarding::ensure_payment_intent_for_entitlement(pool, row, idem).await {
        Ok(surf) => {
            let impl_status = if surf.status == "succeeded" {
                "onboarding_payment_intent_stripe_completed"
            } else {
                "onboarding_payment_intent_stripe"
            };            let detail = if surf.client_secret.is_none() && surf.status != "succeeded" {
                "Stripe returned no client_secret for this PaymentIntent state."
            } else if surf.status == "succeeded" {
                "PaymentIntent already succeeded on Stripe; refresh entitlements or wait for webhook."
            } else {
                "Use psp.client_secret with Stripe.js; configure Stripe webhook POST /api/v1/hooks/stripe/onboarding."
            }
            ControlFlow::Break(
                Json(json!({
                    "status": "ok",
                    "entitlement_id": row.id,
                    "idempotency_key": idem,
                    "return_url": parsed.return_url,
                    "psp": {
                        "provider": "stripe",
                        "client_secret": surf.client_secret,
                        "checkout_url": serde_json::Value::Null,
                    },
                    "meta": {
                        "implementation_status": impl_status,
                        "stripe_payment_intent_id": surf.payment_intent_id,
                        "stripe_status": surf.status,
                        "detail": detail,
                        "doc": concat!("docs", "/spec/", "04-附录-商家主理人准入费HTTP契约草案-配96-18.md", " §2")
                    }
                }))
                .into_response(),
            )
        }
        Err(e) => {
            eprintln!("[onboarding] stripe PaymentIntent err={}", e);
            ControlFlow::Break(
                (
                    StatusCode::BAD_GATEWAY,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_psp_unavailable",
                        "message": "onboarding_psp_unavailable",
                        "detail": format!("Stripe PaymentIntent: {e}"),
                    })),
                )
                    .into_response(),
            )
        }
    }
}
