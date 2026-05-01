//! Onboarding write-path rate limit (96-18). Process-local stub: extend with env-backed
//! sliding windows when product gates require it.

use uuid::Uuid;

/// Returns **`Some(response)`** when the user exceeded the onboarding write budget; **`None`** to allow.
pub async fn onboarding_user_write_rate_limit_response_if_exceeded(
    _user_id: &Uuid,
) -> Option<axum::response::Response> {
    None
}
