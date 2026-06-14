use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use chrono::{Duration, Utc};
use serde::Deserialize;
use serde_json::json;

use crate::middleware::onboarding_quote_rate_limit_response_if_exceeded;
use crate::onboarding_counters::inc_onboarding_quote_get;
use crate::state::ApiMetaState;
use crate::stripe_onboarding;

#[derive(Debug, Deserialize)]
pub struct OnboardingQuoteQuery {
    pub role: Option<String>,
    pub sku: Option<String>,
    pub fee_schedule_version: Option<String>,
}

pub(super) async fn get_onboarding_quote(
    State(state): State<ApiMetaState>,
    Query(q): Query<OnboardingQuoteQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    inc_onboarding_quote_get();
    if state.chain_off.is_none() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "chain_off_unavailable",
                "message": "chain_off_unavailable",
                "path": "GET /api/v1/onboarding/quote",
            })),
        )
            .into_response();
    };    let pool_ref = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(resp) = onboarding_quote_rate_limit_response_if_exceeded(pool_ref, &headers).await {
        return resp;
    };    let role = q.role.as_deref().unwrap_or("provider").to_ascii_lowercase();
    if role != "provider" && role != "region_steward" {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "invalid_onboarding_role",
                "message": "invalid_onboarding_role",
            })),
        )
            .into_response();
    };    let sku = q.sku.as_deref().unwrap_or("default");
    let fee_schedule_version = q.fee_schedule_version.as_deref().unwrap_or("stub-v0");
    let expires_at = Utc::now() + Duration::hours(1);
    let amount_minor = if stripe_onboarding::stripe_onboarding_enabled() {
        stripe_onboarding::onboarding_stripe_amount_minor()
    } else {
        0
    };    let impl_quote = if stripe_onboarding::stripe_onboarding_enabled() {
        "onboarding_quote_with_charge_amount"
    } else {
        "onboarding_quote_stub"
    }
    Json(json!({
        "status": "ok",
        "role": role,
        "sku": sku,
        "fee_schedule_version": fee_schedule_version,
        "currency": "USDC",
        "amount_minor": amount_minor,
        "expires_at": expires_at.to_rfc3339(),
        "refund_policy_version": "stub-v0",
        "meta": {
            "implementation_status": impl_quote,
            "doc": concat!("docs", "/spec/", "04-附录-商家主理人准入费HTTP契约草案-配96-18.md", " §2")
        }
    }))
    .into_response()
}
