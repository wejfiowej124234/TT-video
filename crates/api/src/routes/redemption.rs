//! Country Pool NAV 赎回只读报价 · Protocol Convergence P2

use axum::extract::Query;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;

use crate::chain_off;
use crate::state::ApiMetaState;

#[derive(Debug, Deserialize)]
pub struct RedemptionQuoteQuery {
    pub jurisdiction: String,
}

pub async fn get_redemption_quote(Query(q): Query<RedemptionQuoteQuery>) -> impl IntoResponse {
    match chain_off::redemption_quote_json(&q.jurisdiction) {
        Ok(j) => Json(j).into_response(),
        Err(code) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": code, "message": code})),
        )
            .into_response(),
    }
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route("/api/v1/redemption/quote", get(get_redemption_quote))
}
