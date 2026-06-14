//! E2E-A-01 · Official OPS public read-only routes (Cold Start consumer)

mod handlers;

use axum::routing::get;
use axum::Router;

use crate::state::ApiMetaState;

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/official/cold-start/surfaces/:surface",
        get(handlers::get_cold_start_campaign_for_surface),
    )
}
