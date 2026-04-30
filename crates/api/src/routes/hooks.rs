//! Public provider webhooks (**Stripe** 等）。**不**走 **`INTERNAL_API_SECRET`**；各 handler 自带签名校验。

use axum::routing::post;
use axum::Router;

use crate::state::ApiMetaState;
use crate::stripe_onboarding;

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/hooks/stripe/onboarding",
        post(stripe_onboarding::post_stripe_onboarding_webhook),
    )
}
