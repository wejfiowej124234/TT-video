//! E2E-A-01 · Official OPS public read-only handlers

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::api_json;
use crate::db;
use crate::state::ApiMetaState;

fn official_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

fn db_unavailable() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(api_json::err_key_detail(
            "official_ops_db_unavailable",
            "DATABASE_URL required and official ops migrations applied",
        )),
    )
}

pub async fn get_cold_start_campaign_for_surface(
    State(state): State<ApiMetaState>,
    Path(surface): Path<String>,
) -> impl IntoResponse {
    let surface = surface.trim();
    if surface.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(api_json::err_key("cold_start_surface_required")),
        )
            .into_response();
    }
    let Some(pool) = official_pool(&state) else {
        return db_unavailable().into_response();
    };
    match db::get_deployed_cold_start_campaign_for_surface(pool, surface).await {
        Ok(Some(campaign)) => Json(json!({
            "status": "ok",
            "surface": surface,
            "campaign": campaign,
        }))
        .into_response(),
        Ok(None) => Json(json!({
            "status": "ok",
            "surface": surface,
            "campaign": null,
        }))
        .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(api_json::err_key_detail("cold_start_read_failed", e.to_string())),
        )
            .into_response(),
    }
}
