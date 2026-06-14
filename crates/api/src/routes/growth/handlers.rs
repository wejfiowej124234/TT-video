use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::api_json;
use crate::db;
use crate::state::ApiMetaState;

#[derive(Debug, Deserialize)]
pub struct ReferralsValidateQuery {
    pub code: Option<String>,
}

fn growth_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

pub async fn get_referrals_validate(
    State(state): State<ApiMetaState>,
    Query(q): Query<ReferralsValidateQuery>,
) -> impl IntoResponse {
    let Some(pool) = growth_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(api_json::err_key_detail(
                "growth_db_unavailable",
                "DATABASE_URL required and growth migrations applied",
            )),
        )
            .into_response();
    };
    let raw = q.code.as_deref().unwrap_or("").trim();
    if raw.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(api_json::err_key("referral_code_required")),
        )
            .into_response();
    }
    let result = db::validate_referral_code(pool, raw).await;
    Json(json!({
        "status": "ok",
        "valid": result.valid,
        "code": result.code,
        "code_type": result.code_type,
        "label": result.label,
        "is_active": result.is_active,
        "reason": result.reason,
    }))
    .into_response()
}
