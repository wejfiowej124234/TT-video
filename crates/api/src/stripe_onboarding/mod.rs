//! Optional **Stripe** **PaymentIntent** or **Checkout Session** for **96-18** onboarding (test / staging / production).
//! Profile gates: [`RuntimeIdentity::current()`] via [`config::stripe_onboarding_runtime_profile`].
//!
//! Enabled only when **`TRAVELTRUST_STRIPE_SECRET_KEY`** (or legacy **`STRIPE_SECRET_KEY`**) is non-empty
//! **and** **`TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1`**. **Checkout**：再加 **`TRAVELTRUST_ONBOARDING_STRIPE_CHECKOUT=1`**
//! 且 **`POST …/payment-intents`** 体须带 **`return_url`**（**`success_url`**）。Public webhook: **`POST /api/v1/hooks/stripe/onboarding`**
//! with **`Stripe-Signature`** and **`TRAVELTRUST_STRIPE_WEBHOOK_SECRET`** (`whsec_…`) — 处理 **`payment_intent.succeeded`**
//! （**`latest_charge` → `metadata.stripe.charge_id`**）、**`checkout.session.completed`**（**`payment_status=paid`**）、**`charge.refunded`**
//! （**全额** → **`refunded`**；**部分** **`0<refunded<amount`** → **`stripe_charge_refund_partial`** **审计** **不改** **`paid`**；若已 **`refunded`/`revoked`** 则仅 **审计** **`onboarding_payment_events`**）与 **`charge.dispute.funds_withdrawn`**
//! （**`paid` → `revoked`**；**终态** **仅审计**；按 **`charge_id`** 或回退 **`payment_intent`**）。
//! **Admin** **`POST …/financial-reversal`**（**`refund`**）：**`TRAVELTRUST_ONBOARDING_STRIPE_ADMIN_PSP_REFUND=1`** 时在 **DB** 已 **`refunded`** 后 **best-effort** **`POST /v1/refunds`**（**`charge`** 优先，否则 **`payment_intent`**）。

mod admin_refund;
mod config;
mod ensure;
mod http_client;
mod signature;
mod webhook;

#[cfg(test)]
mod tests;

pub use admin_refund::try_admin_psp_refund_after_financial_reversal;
pub use config::{stripe_checkout_enabled, stripe_onboarding_enabled, stripe_onboarding_runtime_profile};
pub use ensure::{ensure_checkout_session_for_entitlement, ensure_payment_intent_for_entitlement};
#[cfg(test)]
pub(crate) use signature::build_stripe_webhook_signature_header;
pub use webhook::post_stripe_onboarding_webhook;
