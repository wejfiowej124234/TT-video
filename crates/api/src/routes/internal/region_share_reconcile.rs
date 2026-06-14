//! BE-RS-01 · `POST /api/v1/internal/region-share-reconcile`

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Json, Router};
use axum::routing::post;
use serde::Deserialize;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;

use super::common;

#[derive(Debug, Deserialize, Default)]
pub struct RegionShareReconcileBody {
    pub chain_id: Option<i64>,
    #[serde(default)]
    pub persist: bool,
    #[serde(default)]
    pub fire_alert_on_drift: bool,
}

fn reconcile_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/internal/region-share-reconcile",
        post(post_internal_region_share_reconcile),
    )
}

pub async fn post_internal_region_share_reconcile(
    State(state): State<ApiMetaState>,
    Json(body): Json<RegionShareReconcileBody>,
) -> impl IntoResponse {
    if let Some(r) = common::internal_operator_secret_required_response() {
        return r;
    }
    let Some(pool) = reconcile_pool(&state) else {
        return common::json_internal_db_unavailable_error().into_response();
    };
    match db::run_region_share_reconcile(
        pool,
        body.chain_id,
        body.persist,
        body.fire_alert_on_drift,
    )
    .await
    {
        Ok(result) => {
            let status = if result.projection_closure_clean {
                StatusCode::OK
            } else {
                StatusCode::OK
            };
            (
                status,
                Json(json!({
                    "status": "ok",
                    "projection_closure_clean": result.projection_closure_clean,
                    "amount_triangle_marker": result.amount_triangle_marker,
                    "epoch_reconcile_marker": result.epoch_reconcile_marker,
                    "report_id": result.report_id.map(|u| u.to_string()),
                    "region_share_projection_closure_observability":
                        result.summary.get("region_share_projection_closure_observability"),
                    "amount_triangle": result.summary.get("amount_triangle"),
                    "epoch_reconcile": result.summary.get("epoch_reconcile"),
                    "drift_alert": result.summary.get("drift_alert"),
                    "summary": result.summary,
                })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "region_share_reconcile_failed",
                "message": e.to_string(),
            })),
        )
            .into_response(),
    }
}
