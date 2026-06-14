//! G-S4 · GET /api/v1/me/referrals（用户推荐中心 · 只读 · 须登录）

use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;

use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};

#[derive(Debug, Deserialize)]
pub struct MeReferralsQuery {
    pub events_limit: Option<i64>,
    pub ledger_limit: Option<i64>,
}

fn growth_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route("/api/v1/me/referrals", get(get_me_referrals))
}

pub async fn get_me_referrals(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Query(q): Query<MeReferralsQuery>,
) -> impl IntoResponse {
    let Some(uid) = extract_user_with_session_check(&state, &headers).await else {
        return (
            StatusCode::UNAUTHORIZED,
            Json(json!({"error": "login_required", "message": "login_required"})),
        )
            .into_response();
    };
    let Some(pool) = growth_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "growth_db_unavailable",
            })),
        )
            .into_response();
    };
    match db::get_me_referrals_summary(
        pool,
        uid,
        q.events_limit.unwrap_or(10),
        q.ledger_limit.unwrap_or(10),
    )
    .await
    {
        Ok(summary) => Json(json!({ "status": "ok", "referrals": summary })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "me_referrals_load_failed",
                "message": e.to_string(),
            })),
        )
            .into_response(),
    }
}
