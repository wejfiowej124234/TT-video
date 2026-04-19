//! P-SCALE1：`/api/v1/trust-growth/*` — 外部化信任增长服务（Postgres 全局一致）

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::db::{trust_growth_get_config, trust_growth_ingest_and_recompute};
use crate::state::ApiMetaState;

#[derive(Debug, Deserialize)]
pub struct IngestBody {
    pub event: String,
    pub payload: serde_json::Value,
}

pub fn router() -> axum::Router<ApiMetaState> {
    axum::Router::new()
        .route("/api/v1/trust-growth/ingest", axum::routing::post(post_ingest))
        .route("/api/v1/trust-growth/config", axum::routing::get(get_config))
}

async fn post_ingest(
    State(state): State<ApiMetaState>,
    Json(body): Json<IngestBody>,
) -> impl IntoResponse {
    let pool = match &state.chain_off {
        Some(co) => match &co.db_pool {
            Some(p) => p,
            None => {
                return (
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "ok": false,
                        "error": "database_unavailable",
                        "message": "DATABASE_URL / PgPool required for trust growth service"
                    })),
                );
            }
        },
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "ok": false,
                    "error": "chain_off_unavailable"
                })),
            );
        }
    };

    let payload = &body.payload;
    let moment = payload.get("moment").and_then(|x| x.as_str()).unwrap_or("");
    let variant_id = payload.get("variant_id").and_then(|x| x.as_str()).unwrap_or("");
    if moment.is_empty() || variant_id.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "ok": false, "error": "missing_moment_or_variant_id" })),
        );
    }

    let details_open = payload
        .get("details_open")
        .and_then(|x| x.as_bool());

    match trust_growth_ingest_and_recompute(pool, &body.event, moment, variant_id, details_open).await {
        Ok((gen, _moments)) => (
            StatusCode::OK,
            Json(json!({
                "ok": true,
                "autopilot_generation": gen,
                "pgrow3": { "storage": "postgres" }
            })),
        ),
        Err(e) if e == "unknown_event" => (
            StatusCode::BAD_REQUEST,
            Json(json!({ "ok": false, "error": "unknown_event" })),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "ok": false, "error": "ingest_failed", "message": e })),
        ),
    }
}

async fn get_config(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let pool = match &state.chain_off {
        Some(co) => match &co.db_pool {
            Some(p) => p,
            None => {
                return (
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "ok": false,
                        "error": "database_unavailable",
                        "moments": {},
                        "autopilot_generation": 0
                    })),
                );
            }
        },
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({ "ok": false, "error": "chain_off_unavailable" })),
            );
        }
    };

    match trust_growth_get_config(pool).await {
        Ok((gen, moments_json, updated_at)) => (
            StatusCode::OK,
            Json(json!({
                "ok": true,
                "moments": moments_json,
                "autopilot_generation": gen,
                "updated_at": updated_at.to_rfc3339(),
                "pgrow3": {
                    "storage": "postgres",
                    "environment": std::env::var("TRUST_GROWTH_ENV").unwrap_or_else(|_| "default".to_string())
                }
            })),
        ),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "ok": false, "error": "config_read_failed", "message": e.to_string() })),
        ),
    }
}
