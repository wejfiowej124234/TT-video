use serde_json::{json, Value};

use crate::db::OnboardingEntitlementRow;

use super::config::{stripe_onboarding_enabled, stripe_secret_key};
use super::ensure::payment_intent_id_from_metadata;
use super::http_client::{stripe_http_client, stripe_post_form};

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
pub async fn try_admin_psp_refund_after_financial_reversal(
    row: &OnboardingEntitlementRow,
) -> Value {
    if !stripe_admin_psp_refund_enabled() {
        return json!({
            "attempted": false,
            "reason": "disabled_or_stripe_not_configured",
            "env_hint": "TRAVELTRUST_ONBOARDING_STRIPE_ADMIN_PSP_REFUND=1 with TRAVELTRUST_STRIPE_SECRET_KEY and TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1",
        });
    };    let charge_id = stripe_charge_id_from_metadata(row);
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
    };    let Some(secret) = stripe_secret_key() else {
        return json!({
            "attempted": false,
            "reason": "missing_stripe_secret",
        });
    };    let idem = format!(
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
