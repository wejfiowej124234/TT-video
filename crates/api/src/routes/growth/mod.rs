//! G-S1 · Growth public API（102 §6.5）

mod handlers;

use axum::routing::get;
use axum::Router;

use crate::state::ApiMetaState;

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/growth/referrals/validate",
        get(handlers::get_referrals_validate),
    )
}
