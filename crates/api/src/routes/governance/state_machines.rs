//! `GET /api/v1/governance/state-machines` — state-machine.v1 文档镜像

use axum::response::IntoResponse;
use axum::{Json, Router};
use axum::routing::get;

use crate::routes::governance_state_machines::governance_state_machines_json;

pub const GOVERNANCE_STATE_MACHINES_HEADER: &str = "doc-reference-state-machines";

pub async fn get_governance_state_machines() -> impl IntoResponse {
    let mut res = Json(governance_state_machines_json()).into_response();
    if let Ok(hv) = axum::http::HeaderValue::from_str(GOVERNANCE_STATE_MACHINES_HEADER) {
        res.headers_mut().insert("X-Implementation-Status", hv);
    }
    res
}

pub fn state_machines_route() -> Router<crate::state::ApiMetaState> {
    Router::new().route(
        "/api/v1/governance/state-machines",
        get(get_governance_state_machines),
    )
}
