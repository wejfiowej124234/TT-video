//! Env/feature flags for optional Stripe onboarding PSP.

/// **Opt-in** PSP path (never implied by DB-only mode).
pub fn stripe_onboarding_enabled() -> bool {
    stripe_secret_key().is_some()
        && std::env::var("TRAVELTRUST_ONBOARDING_STRIPE_ENABLED").as_deref() == Ok("1")
}

/// **Stripe Checkout Session**（**`psp.checkout_url`**）— 仍须 **`stripe_onboarding_enabled()`**。
pub fn stripe_checkout_enabled() -> bool {
    stripe_onboarding_enabled()
        && std::env::var("TRAVELTRUST_ONBOARDING_STRIPE_CHECKOUT").as_deref() == Ok("1")
}

pub fn stripe_secret_key() -> Option<String> {
    let v = std::env::var("TRAVELTRUST_STRIPE_SECRET_KEY")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .or_else(|| {
            std::env::var("STRIPE_SECRET_KEY")
                .ok()
                .filter(|s| !s.trim().is_empty())
        });
    v.map(|s| s.trim().to_string())
}

pub(crate) fn stripe_webhook_secret_trimmed() -> Option<String> {
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
    let raw =
        std::env::var("TRAVELTRUST_ONBOARDING_STRIPE_CURRENCY").unwrap_or_else(|_| "usd".into());
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
