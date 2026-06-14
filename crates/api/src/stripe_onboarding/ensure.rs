use serde_json::Value;
use sqlx::PgPool;
use uuid::Uuid;

use crate::db::{
    entitlement_amount_minor_from_metadata, entitlement_currency_from_metadata,
    merge_entitlement_stripe_charge_id, merge_entitlement_stripe_charge_id_by_idempotency_key,
    merge_entitlement_stripe_checkout, merge_entitlement_stripe_payment_intent,
    OnboardingEntitlementRow,
};

use super::config::{
    onboarding_stripe_amount_minor, onboarding_stripe_currency, stripe_currency_for_fee_schedule,
    stripe_secret_key,
};
use super::http_client::{stripe_get_json, stripe_http_client, stripe_post_form};

#[derive(Debug)]
pub struct StripePaymentIntentSurface {
    pub payment_intent_id: String,
    pub client_secret: Option<String>,
    pub status: String,
}

fn entitlement_stripe_amount(row: &OnboardingEntitlementRow) -> i64 {
    entitlement_amount_minor_from_metadata(row).unwrap_or_else(onboarding_stripe_amount_minor)
}

fn entitlement_stripe_currency(row: &OnboardingEntitlementRow) -> String {
    entitlement_currency_from_metadata(row)
        .map(|c| stripe_currency_for_fee_schedule(&c))
        .unwrap_or_else(onboarding_stripe_currency)
}

pub(crate) fn payment_intent_id_from_metadata(row: &OnboardingEntitlementRow) -> Option<String> {
    row.metadata
        .0
        .get("stripe")
        .and_then(|s: &Value| s.get("payment_intent_id"))
        .and_then(|v: &Value| v.as_str())
        .map(str::to_string)
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
    ser.append_pair(
        "metadata[traveltrust_entitlement_id]",
        &entitlement_id.to_string(),
    );
    ser.append_pair(
        "metadata[traveltrust_idempotency_key]",
        traveltrust_idempotency_key,
    );
    ser.finish()
}

pub(crate) fn stripe_latest_charge_id_from_pi_json(v: &Value) -> Option<String> {
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

pub(crate) async fn merge_pi_latest_charge_after_payment_intent_webhook(
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
pub(crate) fn payment_intent_id_from_stripe_expandable(obj: &Value) -> Option<String> {
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
    let status = v["status"].as_str().unwrap_or("unknown").to_string();
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

pub(crate) fn payment_intent_id_from_session_json(v: &Value) -> Option<String> {
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
    ser.append_pair(
        "line_items[0][price_data][unit_amount]",
        &amount_minor.to_string(),
    );
    ser.append_pair(
        "line_items[0][price_data][product_data][name]",
        "TravelTrust onboarding fee",
    );
    ser.append_pair("line_items[0][quantity]", "1");
    ser.append_pair(
        "metadata[traveltrust_entitlement_id]",
        &entitlement_id.to_string(),
    );
    ser.append_pair(
        "metadata[traveltrust_idempotency_key]",
        traveltrust_idempotency_key,
    );
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
    };    let su = success_url.trim();
    if su.is_empty() {
        return Err("missing_return_url".into());
    };    if su.len() > 2048 {
        return Err("return_url_too_long".into());
    };    let lower = su.to_ascii_lowercase();
    if !lower.starts_with("https://") && !lower.starts_with("http://") {
        return Err("return_url_not_http".into());
    };    let secret = stripe_secret_key().ok_or_else(|| "stripe_secret_missing".to_string())?;
    let client = stripe_http_client();
    let amount = entitlement_stripe_amount(row);
    let currency = entitlement_stripe_currency(row);
    if currency.len() != 3 {
        return Err("invalid_stripe_currency".into());
    };    let cancel_url = stripe_checkout_cancel_url(su);
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
        };        if status == "complete" {
            return Ok(StripeOnboardingCheckoutSurface {
                checkout_session_id: cs_id,
                checkout_url: None,
                payment_intent_id: payment_intent_id_from_session_json(&v),
                session_status: status,
                session_complete_no_url: true,
            });
        }
        // `expired` 等：落库新 Session
    };    let form = build_create_checkout_session_form(
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
    merge_entitlement_stripe_checkout(
        pool,
        row.id,
        &checkout_session_id,
        payment_intent_id.as_deref(),
    )
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
    };    let secret = stripe_secret_key().ok_or_else(|| "stripe_secret_missing".to_string())?;
    let client = stripe_http_client();
    let amount = entitlement_stripe_amount(row);
    let currency = entitlement_stripe_currency(row);
    if currency.len() != 3 {
        return Err("invalid_stripe_currency".into());
    };    let stripe_idem_key = format!("tt_onb_pi_{}", row.id);

    if let Some(pi_id) = payment_intent_id_from_metadata(row) {
        let path = format!("payment_intents/{pi_id}");
        let v = stripe_get_json(&client, &secret, &path).await?;
        if let Some(ch) = stripe_latest_charge_id_from_pi_json(&v) {
            if let Err(e) = merge_entitlement_stripe_charge_id(pool, row.id, &ch).await {
                eprintln!("[stripe_onboarding] merge charge_id err={e}");
            }
        }
        return surface_from_pi_json(&v);
    };    let form = build_create_pi_form(amount, &currency, &row.id, traveltrust_idempotency_key);
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
