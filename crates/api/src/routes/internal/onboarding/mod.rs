//! **96-18 F-036** / **96-09**：`POST /api/v1/internal/onboarding/payments/webhook`
//! — 有 **`PgPool`** 时 **落库**（幂等 **`payment_events`** + 条件更新 **`entitlements.status`**）；可选 **`ONBOARDING_WEBHOOK_ASYNC_QUEUE=1`** 先入 **`onboarding_webhook_jobs`**（默认 **内联 drain** 仍 **200**；**`ONBOARDING_WEBHOOK_QUEUE_INLINE_DRAIN=0`** → **202** + **`tokio::spawn`**，除非 **`ONBOARDING_WEBHOOK_QUEUE_EXTERNAL_ONLY=1`** 交由 **`traveltrust-api onboarding-webhook-worker`**）；无池时保持 **stub** 响应（**不**冒充已写库）。
//! **可选 HMAC**：**`ONBOARDING_WEBHOOK_HMAC_SECRET`** 非空时须 **`X-Onboarding-Webhook-Signature: v1=<hex>`**（**HMAC-SHA256(secret, raw_body)**）。
//! **可选重放窗**：**`ONBOARDING_WEBHOOK_MAX_AGE_SECS`** > 0 时须 **`X-Onboarding-Webhook-Timestamp`**（Unix 秒，与 **`Stripe-Signature`** 的 **`t=`** 同语义）；**不**替代 **mTLS** / 提供商签名校验。
//! **可选边缘硬闸**：**`ONBOARDING_INTERNAL_WEBHOOK_ALLOWLIST_CIDRS`**（IPv4 CIDR 列表）、**`ONBOARDING_INTERNAL_WEBHOOK_REQUIRE_HTTPS_FORWARDED=1`**（须 **`X-Forwarded-Proto: https`**）；**mTLS 在 Ingress** 终止，不由本 handler 校验。

mod payments_webhook;
mod security;

#[cfg(test)]
mod tests;

pub use payments_webhook::post_internal_onboarding_payments_webhook;
