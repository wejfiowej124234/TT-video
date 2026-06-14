//! Admin · G-S3 Early Bird Stage 管理

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, patch};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_GROWTH_READ, PERM_GROWTH_WRITE};
use super::write_admin_audit_log_best_effort;

fn growth_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/growth/early-bird/stages",
            get(get_admin_early_bird_stages),
        )
        .route(
            "/api/v1/admin/growth/early-bird/stages/:stage_number",
            patch(patch_admin_early_bird_stage),
        )
        .route(
            "/api/v1/admin/growth/early-bird/reconcile",
            get(get_admin_early_bird_reconcile),
        )
}

pub async fn get_admin_early_bird_stages(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"status": "error", "error": "growth_db_unavailable"})),
        )
            .into_response();
    };
    match db::list_early_bird_stages(pool).await {
        Ok(stages) => {
            let stats = db::early_bird_stage_user_counts(pool).await.unwrap_or_default();
            Json(json!({
                "status": "ok",
                "count": stages.len(),
                "items": stages,
                "user_counts_by_stage": stats,
            }))
            .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "early_bird_list_failed",
                "message": e.to_string(),
            })),
        )
            .into_response(),
    }
}

#[derive(Debug, Deserialize, Default)]
pub struct PatchEarlyBirdStageBody {
    pub is_active: Option<bool>,
    pub user_rank_from: Option<i32>,
    pub user_rank_to: Option<i32>,
    pub multiplier: Option<f64>,
}

pub async fn patch_admin_early_bird_stage(
    State(state): State<ApiMetaState>,
    Path(stage_raw): Path<String>,
    headers: HeaderMap,
    Json(body): Json<PatchEarlyBirdStageBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let stage_number: i32 = match stage_raw.trim().parse() {
        Ok(n) if n > 0 => n,
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"status": "error", "error": "invalid_stage_number"})),
            )
                .into_response();
        }
    };
    let Some(pool) = growth_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"status": "error", "error": "growth_db_unavailable"})),
        )
            .into_response();
    };
    if let Some(m) = body.multiplier {
        if !(m.is_finite() && m > 0.0 && m <= 10.0) {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"status": "error", "error": "invalid_early_bird_multiplier"})),
            )
                .into_response();
        }
    }
    let input = db::PatchEarlyBirdStageInput {
        is_active: body.is_active,
        user_rank_from: body.user_rank_from,
        user_rank_to: body.user_rank_to,
        multiplier: body.multiplier,
    };
    match db::patch_early_bird_stage_admin(pool, stage_number, input).await {
        Ok(Some(row)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.growth.early_bird.patch",
                Some("early_bird_stages"),
                Some(stage_number.to_string().as_str()),
                json!({
                    "stage_number": row.stage_number,
                    "multiplier": row.multiplier,
                    "is_active": row.is_active,
                }),
            )
            .await;
            Json(json!({"status": "ok", "item": row})).into_response()
        }
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({"status": "error", "error": "early_bird_stage_not_found"})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "early_bird_patch_failed",
                "message": e.to_string(),
            })),
        )
            .into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct EarlyBirdReconcileQuery {
    pub limit: Option<i64>,
}

pub async fn get_admin_early_bird_reconcile(
    State(state): State<ApiMetaState>,
    Query(_q): Query<EarlyBirdReconcileQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"status": "error", "error": "growth_db_unavailable"})),
        )
            .into_response();
    };
    match db::early_bird_reconcile_summary(pool).await {
        Ok(summary) => Json(json!({"status": "ok", "summary": summary})).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "early_bird_reconcile_failed",
                "message": e.to_string(),
            })),
        )
            .into_response(),
    }
}
