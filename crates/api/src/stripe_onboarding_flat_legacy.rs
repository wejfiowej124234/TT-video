//! Optional **Stripe** **PaymentIntent** or **Checkout Session** for **96-18** onboarding (test / staging / production).
//!
//! Enabled only when **`TRAVELTRUST_STRIPE_SECRET_KEY`** (or legacy **`STRIPE_SECRET_KEY`**) is non-empty
//! **and** **`TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1`**. **Checkout**：再加 **`TRAVELTRUST_ONBOARDING_STRIPE_CHECKOUT=1`**
//! 且 **`POST …/payment-intents`** 体须带 **`return_url`**（**`success_url`**）。Public webhook: **`POST /api/v1/hooks/stripe/onboarding`**
//! with **`Stripe-Signature`** and **`TRAVELTRUST_STRIPE_WEBHOOK_SECRET`** (`whsec_…`) — 处理 **`payment_intent.succeeded`**
//! （**`latest_charge` → `metadata.stripe.charge_id`**）、**`checkout.session.completed`**（**`payment_status=paid`**）、**`charge.refunded`**
//! （**全额** → **`refunded`**；**部分** **`0<refunded<amount`** → **`stripe_charge_refund_partial`** **审计** **不改** **`paid`**；若已 **`refunded`/`revoked`** 则仅 **审计** **`onboarding_payment_events`**）与 **`charge.dispute.funds_withdrawn`**
//! （**`paid` → `revoked`**；**终态** **仅审计**；按 **`charge_id`** 或回退 **`payment_intent`**）。
//! **Admin** **`POST …/financial-reversal`**（**`refund`**）：**`TRAVELTRUST_ONBOARDING_STRIPE_ADMIN_PSP_REFUND=1`** 时在 **DB** 已 **`refunded`** 后 **best-effort** **`POST /v1/refunds`**（**`charge`** 优先，否则 **`payment_intent`**）。

use axum::body::Bytes;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use base64::{engine::general_purpose::STANDARD, Engine as _};
use chrono::Utc;
use hmac::{Hmac, Mac};
use reqwest::header::{HeaderMap as ReqHeaderMap, HeaderValue, AUTHORIZATION};
use serde_json::{json, Value};
use sha2::Sha256;
use sqlx::PgPool;
use std::time::Duration;
use uuid::Uuid;

use crate::db::{
    apply_payment_webhook, apply_stripe_charge_full_refund_webhook,
    apply_stripe_charge_partial_refund_webhook_audit, apply_stripe_dispute_funds_withdrawn_webhook,
    merge_entitlement_stripe_charge_id, merge_entitlement_stripe_charge_id_by_idempotency_key,
    merge_entitlement_stripe_checkout, merge_entitlement_stripe_payment_intent, OnboardingEntitlementRow,
    StripeChargeRefundWebhookOutcome, StripeDisputeWebhookOutcome, StripePartialRefundWebhookOutcome,
    WebhookApplyOutcome,
};

type HmacSha256 = Hmac<Sha256>;

/// **Opt-in** PSP path (never implied by DB-only mode).
pub fn stripe_onboarding_enabled() -> bool {
    stripe_secret_key().is_some()
        && std::env::var("TRAVELTRUST_ONBOARDING_STRIPE_ENABLED").as_deref() == Ok("1")
}

/// **Stripe Checkout Session**（**`psp.checkout_url`**）— 仍须 **`stripe_onboarding_enabled()`**。
pub fn stripe_checkout_enabled() -> bool {
    stripe_onboarding_enabled() && std::env::var("TRAVELTRUST_ONBOARDING_STRIPE_CHECKOUT").as_deref() == Ok("1")
}

pub fn stripe_secret_key() -> Option<String> {
    let v = std::env::var("TRAVELTRUST_STRIPE_SECRET_KEY")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .or_else(|| std::env::var("STRIPE_SECRET_KEY").ok().filter(|s| !s.trim().is_empty()));
    v.map(|s| s.trim().to_string())
}

fn stripe_webhook_secret_trimmed() -> Option<String> {
    std::env::var("TRAVELTRUST_STRIPE_WEBHOOK_SECRET")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

/// Smallest USD charge used when env is missing; **test-mode** friendly (**50** = **$0.50**).
pub fn onboarding_stripe_amount_minor() -> i64 {
    let v = std::env::var("TRAVELTRUST_ONBOARDING_STRIPE_AMOUNT_MINOR")
        .ok()
        .and_then(|s| s.parse::<i64>().ok())
        .unwrap_or(50);
    v.clamp(50, 999_999_999)
}

pub fn onboarding_stripe_currency() -> String {
    let raw = std::env::var("TRAVELTRUST_ONBOARDING_STRIPE_CURRENCY").unwrap_or_else(|_| "usd".into());
    let s: String = raw
        .trim()
        .to_ascii_lowercase()
        .chars()
        .filter(|c| c.is_ascii_lowercase())
        .take(3)
        .collect();
    if s.len() == 3 {
        s
    } else {
        "usd".into()
    }
}

fn decode_whsec(secret: &str) -> Result<Vec<u8>, &'static str> {
    let t = secret.trim();
    if !t.starts_with("whsec_") {
        return Err("webhook_secret must start with whsec_");
    }
    STANDARD
        .decode(t.trim_start_matches("whsec_"))
        .map_err(|_| "invalid whsec base64")
}

fn ct_eq_bytes(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut acc = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        acc |= x ^ y;
    }
    acc == 0
}

/// Verify **Stripe-Signature** per <https://stripe.com/docs/webhooks/signatures> (v1 + timestamp).
pub fn verify_stripe_signature(payload: &[u8], stripe_signature: &str, whsec: &[u8], tolerance: Duration) -> Result<(), &'static str> {
    let mut ts: Option<i64> = None;
    let mut v1_hex: Vec<&str> = Vec::new();
    for part in stripe_signature.split(',') {
        let p = part.trim();
        if let Some(rest) = p.strip_prefix("t=") {
            ts = rest.parse().ok();
        } else if let Some(rest) = p.strip_prefix("v1=") {
            v1_hex.push(rest);
        }
    }
    let ts = ts.ok_or("missing_signature_timestamp")?;
    let now = Utc::now().timestamp();
    let tol = tolerance.as_secs() as i64;
    if (now - ts).abs() > tol {
        return Err("signature_timestamp_out_of_tolerance");
    }
    let mut to_sign = Vec::with_capacity(24usize.saturating_add(payload.len()));
    to_sign.extend_from_slice(ts.to_string().as_bytes());
    to_sign.push(b'.');
    to_sign.extend_from_slice(payload);
    let mut mac = HmacSha256::new_from_slice(whsec).map_err(|_| "invalid_hmac_key_material")?;
    mac.update(&to_sign);
    let expected = mac.finalize().into_bytes();
    for hx in v1_hex {
        let Ok(decoded) = hex::decode(hx.as_bytes()) else {
            continue;
        };
        if ct_eq_bytes(&expected, &decoded) {
            return Ok(());
        }
    }
    Err("stripe_signature_mismatch")
}

/// **`cfg(test)` / PG IT**：为 **raw webhook body** 生成 **`Stripe-Signature`**（**`t=…,v1=…`**），与 **`verify_stripe_signature`** 同源；**`whsec_prefixed`** 须 **`whsec_` + base64**（与 **`decode_whsec`** 一致）。
#[cfg(test)]
pub(crate) fn build_stripe_webhook_signature_header(
    body: &[u8],
    whsec_prefixed: &str,
) -> Result<String, &'static str> {
    let whsec_bytes = decode_whsec(whsec_prefixed)?;
    let ts = Utc::now().timestamp();
    let mut to_sign = Vec::with_capacity(24usize.saturating_add(body.len()));
    to_sign.extend_from_slice(ts.to_string().as_bytes());
    to_sign.push(b'.');
    to_sign.extend_from_slice(body);
    let mut mac = HmacSha256::new_from_slice(&whsec_bytes).map_err(|_| "invalid_hmac_key_material")?;
    mac.update(&to_sign);
    let hx = hex::encode(mac.finalize().into_bytes());
    Ok(format!("t={ts},v1={hx}"))
}

fn stripe_http_client() -> reqwest::Client {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .build()
        .expect("reqwest client for stripe")
}

fn auth_bearer(secret_key: &str) -> Result<HeaderValue, &'static str> {
    HeaderValue::from_str(&format!("Bearer {secret_key}")).map_err(|_| "invalid_stripe_secret_header")
}

#[derive(Debug)]
pub struct StripePaymentIntentSurface {
    pub payment_intent_id: String,
    pub client_secret: Option<String>,
    pub status: String,
}

fn payment_intent_id_from_metadata(row: &OnboardingEntitlementRow) -> Option<String> {
    row.metadata
        .0
        .get("stripe")
        .and_then(|s: &Value| s.get("payment_intent_id"))
        .and_then(|v: &Value| v.as_str())
        .map(str::to_string)
}

async fn stripe_post_form(
    client: &reqwest::Client,
    secret_key: &str,
    path: &str,
    form_body: String,
    stripe_idempotency_key: Option<&str>,
) -> Result<Value, String> {
    let url = format!("https://api.stripe.com/v1/{path}");
    let mut headers = ReqHeaderMap::new();
    headers.insert(AUTHORIZATION, auth_bearer(secret_key).map_err(|e| e.to_string())?);
    headers.insert(
        reqwest::header::CONTENT_TYPE,
        HeaderValue::from_static("application/x-www-form-urlencoded"),
    );
    if let Some(idem) = stripe_idempotency_key {
        if let Ok(h) = HeaderValue::from_str(idem) {
            headers.insert(
                reqwest::header::HeaderName::from_static("stripe-idempotency-key"),
                h,
            );
        }
    }
    let res = client
        .post(url)
        .headers(headers)
        .body(form_body)
        .send()
        .await
        .map_err(|e| format!("stripe_network:{e}"))?;
    let status = res.status();
    let text = res.text().await.map_err(|e| format!("stripe_read_body:{e}"))?;
    let v: Value = serde_json::from_str(&text).unwrap_or(json!({ "raw": text }));
    if !status.is_success() {
        let msg = v["error"]["message"].as_str().unwrap_or("stripe_error");
        return Err(format!("stripe_http_{status}: {msg}"));
    }
    Ok(v)
}

async fn stripe_get_json(client: &reqwest::Client, secret_key: &str, path: &str) -> Result<Value, String> {
    let url = format!("https://api.stripe.com/v1/{path}");
    let mut headers = ReqHeaderMap::new();
    headers.insert(AUTHORIZATION, auth_bearer(secret_key).map_err(|e| e.to_string())?);
    let res = client
        .get(url)
        .headers(headers)
        .send()
        .await
        .map_err(|e| format!("stripe_network:{e}"))?;
    let status = res.status();
    let text = res.text().await.map_err(|e| format!("stripe_read_body:{e}"))?;
    let v: Value = serde_json::from_str(&text).unwrap_or(json!({ "raw": text }));
    if !status.is_success() {
        let msg = v["error"]["message"].as_str().unwrap_or("stripe_error");
        return Err(format!("stripe_http_{status}: {msg}"));
    }
    Ok(v)
}

fn build_create_pi_form(
    amount_minor: i64,
    currency: &str,
    entitlement_id: &Uuid,
    traveltrust_idempotency_key: &str,
) -> String {
    let mut ser = url::form_urlencoded::Serializer::new(String::new());
    ser.append_pair("amount", &amount_minor.to_string());
    ser.append_pair("currency", currency);
    ser.append_pair("automatic_payment_methods[enabled]", "true");
    ser.append_pair("metadata[traveltrust_entitlement_id]", &entitlement_id.to_string());
    ser.append_pair("metadata[traveltrust_idempotency_key]", traveltrust_idempotency_key);
    ser.finish()
}

fn stripe_latest_charge_id_from_pi_json(v: &Value) -> Option<String> {
    match v.get("latest_charge") {
        Some(Value::String(s)) if !s.trim().is_empty() => Some(s.trim().to_string()),
        Some(Value::Object(o)) => o
            .get("id")
            .and_then(|x| x.as_str())
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string()),
        _ => None,
    }
}

async fn merge_pi_latest_charge_after_payment_intent_webhook(
    pool: &PgPool,
    idempotency_key: &str,
    pi_obj: &Value,
) {
    if let Some(ch) = stripe_latest_charge_id_from_pi_json(pi_obj) {
        if let Err(e) =
            merge_entitlement_stripe_charge_id_by_idempotency_key(pool, idempotency_key, &ch).await
        {
            eprintln!("[stripe_onboarding_webhook] merge stripe charge_id err={e}");
        }
    }
}

/// **Charge / Dispute** 体上 **`payment_intent`** 字段（**string** 或 **`{ "id": … }`**）。
fn payment_intent_id_from_stripe_expandable(obj: &Value) -> Option<String> {
    match obj.get("payment_intent") {
        Some(Value::String(s)) if !s.trim().is_empty() => Some(s.trim().to_string()),
        Some(Value::Object(o)) => o
            .get("id")
            .and_then(|v| v.as_str())
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string()),
        _ => None,
    }
}

fn surface_from_pi_json(v: &Value) -> Result<StripePaymentIntentSurface, String> {
    let id = v["id"]
        .as_str()
        .ok_or_else(|| "stripe_response_missing_id".to_string())?
        .to_string();
    let status = v["status"]
        .as_str()
        .unwrap_or("unknown")
        .to_string();
    let client_secret = v["client_secret"].as_str().map(str::to_string);
    Ok(StripePaymentIntentSurface {
        payment_intent_id: id,
        client_secret,
        status,
    })
}

fn checkout_session_id_from_metadata(row: &OnboardingEntitlementRow) -> Option<String> {
    row.metadata
        .0
        .get("stripe")
        .and_then(|s| s.get("checkout_session_id"))
        .and_then(|v| v.as_str())
        .map(str::to_string)
}

fn stripe_checkout_cancel_url(success_url: &str) -> String {
    if success_url.contains('?') {
        format!("{success_url}&onboarding_checkout=canceled=1")
    } else {
        format!("{success_url}?onboarding_checkout=canceled=1")
    }
}

fn payment_intent_id_from_session_json(v: &Value) -> Option<String> {
    if let Some(s) = v["payment_intent"].as_str() {
        return Some(s.to_string());
    }
    v["payment_intent"]["id"].as_str().map(str::to_string)
}

fn build_create_checkout_session_form(
    amount_minor: i64,
    currency: &str,
    entitlement_id: &Uuid,
    traveltrust_idempotency_key: &str,
    success_url: &str,
    cancel_url: &str,
) -> String {
    let mut ser = url::form_urlencoded::Serializer::new(String::new());
    ser.append_pair("mode", "payment");
    ser.append_pair("success_url", success_url);
    ser.append_pair("cancel_url", cancel_url);
    ser.append_pair("line_items[0][price_data][currency]", currency);
    ser.append_pair("line_items[0][price_data][unit_amount]", &amount_minor.to_string());
    ser.append_pair("line_items[0][price_data][product_data][name]", "TravelTrust onboarding fee");
    ser.append_pair("line_items[0][quantity]", "1");
    ser.append_pair("metadata[traveltrust_entitlement_id]", &entitlement_id.to_string());
    ser.append_pair("metadata[traveltrust_idempotency_key]", traveltrust_idempotency_key);
    ser.append_pair(
        "payment_intent_data[metadata][traveltrust_entitlement_id]",
        &entitlement_id.to_string(),
    );
    ser.append_pair(
        "payment_intent_data[metadata][traveltrust_idempotency_key]",
        traveltrust_idempotency_key,
    );
    ser.finish()
}

/// **Stripe Checkout**：开放 **`url`** 或 Session 已终态（**`complete`** → **无 url**，等 Webhook / 刷新资格）。
#[derive(Debug)]
pub struct StripeOnboardingCheckoutSurface {
    pub checkout_session_id: String,
    pub checkout_url: Option<String>,
    pub payment_intent_id: Option<String>,
    pub session_status: String,
    /// Session 已 **complete**：**勿**再创建新 Session（防重复扣款尝试）。
    pub session_complete_no_url: bool,
}

/// Create or retrieve an open **Checkout Session** for a **pending** entitlement row.
pub async fn ensure_checkout_session_for_entitlement(
    pool: &PgPool,
    row: &OnboardingEntitlementRow,
    traveltrust_idempotency_key: &str,
    success_url: &str,
) -> Result<StripeOnboardingCheckoutSurface, String> {
    if row.status != "pending" {
        return Err("entitlement_not_pending".into());
    }
    let su = success_url.trim();
    if su.is_empty() {
        return Err("missing_return_url".into());
    }
    if su.len() > 2048 {
        return Err("return_url_too_long".into());
    }
    let lower = su.to_ascii_lowercase();
    if !lower.starts_with("https://") && !lower.starts_with("http://") {
        return Err("return_url_not_http".into());
    }
    let secret = stripe_secret_key().ok_or_else(|| "stripe_secret_missing".to_string())?;
    let client = stripe_http_client();
    let amount = onboarding_stripe_amount_minor();
    let currency = onboarding_stripe_currency();
    if currency.len() != 3 {
        return Err("invalid_stripe_currency".into());
    }
    let cancel_url = stripe_checkout_cancel_url(su);
    let stripe_idem_key = format!("tt_onb_cs_{}", row.id);

    if let Some(cs_id) = checkout_session_id_from_metadata(row) {
        let path = format!("checkout/sessions/{cs_id}");
        let v = stripe_get_json(&client, &secret, &path).await?;
        let status = v["status"].as_str().unwrap_or("").to_string();
        if status == "open" {
            let url = v["url"]
                .as_str()
                .ok_or_else(|| "stripe_missing_checkout_url".to_string())?
                .to_string();
            return Ok(StripeOnboardingCheckoutSurface {
                checkout_session_id: cs_id,
                checkout_url: Some(url),
                payment_intent_id: payment_intent_id_from_session_json(&v),
                session_status: status,
                session_complete_no_url: false,
            });
        }
        if status == "complete" {
            return Ok(StripeOnboardingCheckoutSurface {
                checkout_session_id: cs_id,
                checkout_url: None,
                payment_intent_id: payment_intent_id_from_session_json(&v),
                session_status: status,
                session_complete_no_url: true,
            });
        }
        // `expired` 等：落库新 Session
    }

    let form = build_create_checkout_session_form(
        amount,
        &currency,
        &row.id,
        traveltrust_idempotency_key,
        su,
        &cancel_url,
    );
    let v = stripe_post_form(
        &client,
        &secret,
        "checkout/sessions",
        form,
        Some(stripe_idem_key.as_str()),
    )
    .await?;
    let checkout_session_id = v["id"]
        .as_str()
        .ok_or_else(|| "stripe_response_missing_id".to_string())?
        .to_string();
    let checkout_url = v["url"]
        .as_str()
        .ok_or_else(|| "stripe_response_missing_url".to_string())?
        .to_string();
    let payment_intent_id = payment_intent_id_from_session_json(&v);
    let session_status = v["status"].as_str().unwrap_or("open").to_string();
    merge_entitlement_stripe_checkout(pool, row.id, &checkout_session_id, payment_intent_id.as_deref())
        .await
        .map_err(|e| format!("db_merge_stripe_checkout:{e}"))?;
    Ok(StripeOnboardingCheckoutSurface {
        checkout_session_id,
        checkout_url: Some(checkout_url),
        payment_intent_id,
        session_status,
        session_complete_no_url: false,
    })
}

/// Create or retrieve a Stripe PaymentIntent for a **pending** entitlement row.
pub async fn ensure_payment_intent_for_entitlement(
    pool: &PgPool,
    row: &OnboardingEntitlementRow,
    traveltrust_idempotency_key: &str,
) -> Result<StripePaymentIntentSurface, String> {
    if row.status != "pending" {
        return Err("entitlement_not_pending".into());
    }
    let secret = stripe_secret_key().ok_or_else(|| "stripe_secret_missing".to_string())?;
    let client = stripe_http_client();
    let amount = onboarding_stripe_amount_minor();
    let currency = onboarding_stripe_currency();
    if currency.len() != 3 {
        return Err("invalid_stripe_currency".into());
    }

    let stripe_idem_key = format!("tt_onb_pi_{}", row.id);

    if let Some(pi_id) = payment_intent_id_from_metadata(row) {
        let path = format!("payment_intents/{pi_id}");
        let v = stripe_get_json(&client, &secret, &path).await?;
        if let Some(ch) = stripe_latest_charge_id_from_pi_json(&v) {
            if let Err(e) = merge_entitlement_stripe_charge_id(pool, row.id, &ch).await {
                eprintln!("[stripe_onboarding] merge charge_id err={e}");
            }
        }
        return surface_from_pi_json(&v);
    }

    let form = build_create_pi_form(amount, &currency, &row.id, traveltrust_idempotency_key);
    let v = stripe_post_form(
        &client,
        &secret,
        "payment_intents",
        form,
        Some(stripe_idem_key.as_str()),
    )
    .await?;
    let surf = surface_from_pi_json(&v)?;
    merge_entitlement_stripe_payment_intent(pool, row.id, &surf.payment_intent_id)
        .await
        .map_err(|e| format!("db_merge_stripe_metadata:{e}"))?;
    if let Some(ch) = stripe_latest_charge_id_from_pi_json(&v) {
        if let Err(e) = merge_entitlement_stripe_charge_id(pool, row.id, &ch).await {
            eprintln!("[stripe_onboarding] merge charge_id err={e}");
        }
    }
    Ok(surf)
}

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
    }

    let tol_secs: i64 = std::env::var("TRAVELTRUST_STRIPE_WEBHOOK_TOLERANCE_SECS")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(300)
        .clamp(60, 86400);
    if verify_stripe_signature(body.as_ref(), sig, &whsec_bytes, Duration::from_secs(tol_secs as u64)).is_err() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "stripe_webhook_invalid_signature",
                "message": "stripe_webhook_invalid_signature",
            })),
        )
            .into_response();
    }

    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.clone()) {
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
        }
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
                    "detail": "missing traveltrust_idempotency_key in Checkout Session metadata",
                })),
            )
                .into_response();
        };
        let pi_opt = payment_intent_id_from_session_json(obj);
        let pi_ref = pi_opt.as_deref().filter(|s| !s.is_empty());
        return match apply_payment_webhook(&pool, idem, event_id, "succeeded", pi_ref).await {
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
        };
    }

    if event_type == "charge.refunded" {
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
        };
        let amount = obj["amount"].as_i64().unwrap_or(0);
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
        }
        if amount_refunded < amount {
            return match apply_stripe_charge_partial_refund_webhook_audit(&pool, event_id, &pi_id).await {
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
            };
        }
        return match apply_stripe_charge_full_refund_webhook(&pool, event_id, &pi_id).await {
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
        };
    }

    if event_type == "charge.dispute.funds_withdrawn" {
        let d = &event["data"]["object"];
        let ch_raw = d["charge"].as_str().map(str::trim).unwrap_or("");
        let pi_dis = payment_intent_id_from_stripe_expandable(d);
        return match apply_stripe_dispute_funds_withdrawn_webhook(
            &pool,
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
        };
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

    match apply_payment_webhook(&pool, idem, event_id, "succeeded", Some(pi_id)).await {
        Ok(WebhookApplyOutcome::Accepted) => {
            merge_pi_latest_charge_after_payment_intent_webhook(&pool, idem, obj).await;
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
            merge_pi_latest_charge_after_payment_intent_webhook(&pool, idem, obj).await;
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

fn stripe_charge_id_from_metadata(row: &OnboardingEntitlementRow) -> Option<String> {
    row.metadata
        .0
        .get("stripe")
        .and_then(|s: &Value| s.get("charge_id"))
        .and_then(|v: &Value| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
}

fn stripe_payment_intent_id_for_refund(row: &OnboardingEntitlementRow) -> Option<String> {
    if let Some(pi) = payment_intent_id_from_metadata(row) {
        let t = pi.trim();
        if !t.is_empty() {
            return Some(t.to_string());
        }
    }
    row.provider_payment_ref
        .as_deref()
        .map(str::trim)
        .filter(|s| s.starts_with("pi_") && !s.is_empty())
        .map(str::to_string)
}

/// **`TRAVELTRUST_ONBOARDING_STRIPE_ADMIN_PSP_REFUND=1`** 且 **`stripe_onboarding_enabled()`** 时，Admin **退款** 可出网调 **Stripe Refunds**。
pub fn stripe_admin_psp_refund_enabled() -> bool {
    std::env::var("TRAVELTRUST_ONBOARDING_STRIPE_ADMIN_PSP_REFUND").as_deref() == Ok("1")
        && stripe_onboarding_enabled()
}

/// **DB 已提交** **`paid`→`refunded`** 之后调用；失败 **不** 回滚账本，由 **`meta.psp_refund`** 供运维补单。
pub async fn try_admin_psp_refund_after_financial_reversal(row: &OnboardingEntitlementRow) -> Value {
    if !stripe_admin_psp_refund_enabled() {
        return json!({
            "attempted": false,
            "reason": "disabled_or_stripe_not_configured",
            "env_hint": "TRAVELTRUST_ONBOARDING_STRIPE_ADMIN_PSP_REFUND=1 with TRAVELTRUST_STRIPE_SECRET_KEY and TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1",
        });
    }
    let charge_id = stripe_charge_id_from_metadata(row);
    let pi_id = stripe_payment_intent_id_for_refund(row);
    let (form, idem_tail) = match (&charge_id, &pi_id) {
        (Some(ch), _) => {
            let mut ser = url::form_urlencoded::Serializer::new(String::new());
            ser.append_pair("charge", ch);
            (ser.finish(), format!("ch-{}", ch))
        }
        (None, Some(pi)) => {
            let mut ser = url::form_urlencoded::Serializer::new(String::new());
            ser.append_pair("payment_intent", pi);
            (ser.finish(), format!("pi-{}", pi))
        }
        (None, None) => {
            return json!({
                "attempted": true,
                "status": "skipped",
                "reason": "no_stripe_charge_or_payment_intent",
            });
        }
    };
    let Some(secret) = stripe_secret_key() else {
        return json!({
            "attempted": false,
            "reason": "missing_stripe_secret",
        });
    };
    let idem = format!(
        "traveltrust-admin-refund-onb-{}-{}",
        row.id,
        idem_tail.chars().take(120).collect::<String>()
    );
    let client = stripe_http_client();
    match stripe_post_form(&client, &secret, "refunds", form, Some(&idem)).await {
        Ok(v) => {
            let rid = v["id"].as_str().unwrap_or("").to_string();
            eprintln!(
                "{}",
                serde_json::json!({
                    "audit_schema": "traveltrust.onboarding_psp_refund.v1",
                    "event": "stripe_admin_psp_refund",
                    "entitlement_id": row.id.to_string(),
                    "status": "ok",
                    "stripe_refund_id": rid,
                    "idem_prefix": idem.chars().take(80).collect::<String>(),
                })
            );
            json!({
                "attempted": true,
                "status": "ok",
                "stripe_refund_id": rid,
            })
        }
        Err(e) => {
            eprintln!(
                "{}",
                serde_json::json!({
                    "audit_schema": "traveltrust.onboarding_psp_refund.v1",
                    "event": "stripe_admin_psp_refund",
                    "entitlement_id": row.id.to_string(),
                    "status": "failed",
                    "error": e.to_string(),
                    "idem_prefix": idem.chars().take(80).collect::<String>(),
                })
            );
            json!({
                "attempted": true,
                "status": "failed",
                "error": e,
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::engine::general_purpose::STANDARD;

    #[test]
    fn build_stripe_webhook_signature_header_verify_roundtrip() {
        let key32 = [3u8; 32];
        let whsec_val = format!("whsec_{}", STANDARD.encode(key32));
        let body = br#"{"id":"evt_x"}"#;
        let sig = super::build_stripe_webhook_signature_header(body, &whsec_val).unwrap();
        let decoded = STANDARD
            .decode(whsec_val.trim_start_matches("whsec_"))
            .expect("decode whsec payload");
        verify_stripe_signature(body, &sig, &decoded, Duration::from_secs(300)).unwrap();
    }

    #[test]
    fn stripe_latest_charge_id_from_pi_json_string_or_object() {
        let s = json!({"latest_charge": "ch_s"});
        assert_eq!(
            super::stripe_latest_charge_id_from_pi_json(&s).as_deref(),
            Some("ch_s")
        );
        let o = json!({"latest_charge": {"id": "ch_o"}});
        assert_eq!(
            super::stripe_latest_charge_id_from_pi_json(&o).as_deref(),
            Some("ch_o")
        );
    }

    #[test]
    fn stripe_expandable_payment_intent_from_dispute_shape() {
        let d = json!({"charge": "ch_x", "payment_intent": "pi_from_dispute"});
        assert_eq!(
            super::payment_intent_id_from_stripe_expandable(&d).as_deref(),
            Some("pi_from_dispute")
        );
    }

    #[test]
    fn payment_intent_id_from_session_json_string_or_object() {
        let s = json!({"payment_intent": "pi_str"});
        assert_eq!(
            super::payment_intent_id_from_session_json(&s).as_deref(),
            Some("pi_str")
        );
        let o = json!({"payment_intent": {"id": "pi_obj"}});
        assert_eq!(
            super::payment_intent_id_from_session_json(&o).as_deref(),
            Some("pi_obj")
        );
    }

    #[test]
    fn verify_stripe_signature_roundtrip() {
        let whsec = b"unit_test_hmac_material";
        let body = br#"{"id":"evt_test"}"#;
        let ts = Utc::now().timestamp();
        let mut to_sign = Vec::new();
        to_sign.extend_from_slice(ts.to_string().as_bytes());
        to_sign.push(b'.');
        to_sign.extend_from_slice(body);
        let mut mac = HmacSha256::new_from_slice(whsec).unwrap();
        mac.update(&to_sign);
        let hx = hex::encode(mac.finalize().into_bytes());
        let sig = format!("t={ts},v1={hx}");
        assert!(verify_stripe_signature(body, &sig, whsec, Duration::from_secs(300)).is_ok());
    }
}
