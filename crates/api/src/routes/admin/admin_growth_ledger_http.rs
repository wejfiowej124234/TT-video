//! Admin · G-S2 Reward Ledger 只读查询 + G-S5 审计/漂移/标记

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, patch, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_GROWTH_FRAUD, PERM_GROWTH_READ, PERM_GROWTH_WRITE};
use super::write_admin_audit_log_best_effort;

#[derive(Debug, Deserialize)]
pub struct AdminRewardLedgerQuery {
    pub user_id: Option<Uuid>,
    pub source: Option<String>,
    pub fraud_status: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminPatchLedgerFraudBody {
    pub fraud_status: String,
}

#[derive(Debug, Deserialize)]
pub struct AdminReconcileFixBody {
    pub user_id: Uuid,
}

fn growth_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/growth/reward-ledger",
            get(get_admin_reward_ledger),
        )
        .route(
            "/api/v1/admin/growth/reward-ledger/reconcile",
            get(get_admin_reward_ledger_reconcile),
        )
        .route(
            "/api/v1/admin/growth/reward-ledger/reconcile/fix",
            post(post_admin_reward_ledger_reconcile_fix),
        )
        .route(
            "/api/v1/admin/growth/reward-ledger/:id",
            patch(patch_admin_reward_ledger_fraud),
        )
}

pub async fn get_admin_reward_ledger(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminRewardLedgerQuery>,
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
    let source = q
        .source
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    let fraud = q
        .fraud_status
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    match db::list_growth_ledger_admin(
        pool,
        q.user_id,
        source,
        fraud,
        q.limit.unwrap_or(100),
    )
    .await
    {
        Ok(items) => {
            let count = items.len();
            Json(json!({ "status": "ok", "count": count, "items": items })).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "growth_ledger_list_failed",
                "message": e.to_string(),
            })),
        )
            .into_response(),
    }
}

pub async fn get_admin_reward_ledger_reconcile(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminRewardLedgerQuery>,
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
    if let Some(user_id) = q.user_id {
        match db::reconcile_user_growth_points(pool, user_id).await {
            Ok(row) => Json(json!({ "status": "ok", "item": row })).into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"status": "error", "error": "growth_reconcile_failed", "message": e.to_string()})),
            )
                .into_response(),
        }
    } else {
        match db::list_growth_points_drift(pool, q.limit.unwrap_or(50)).await {
            Ok(items) => Json(json!({
                "status": "ok",
                "drift_count": items.len(),
                "items": items,
            }))
            .into_response(),
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"status": "error", "error": "growth_reconcile_failed", "message": e.to_string()})),
            )
                .into_response(),
        }
    }
}

pub async fn post_admin_reward_ledger_reconcile_fix(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminReconcileFixBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_WRITE).await {
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
    match db::fix_user_growth_points_drift(pool, body.user_id).await {
        Ok(row) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.growth.reward_ledger.reconcile_fix",
                Some("users"),
                Some(body.user_id.to_string().as_str()),
                json!({ "user_id": body.user_id, "item": row }),
            )
            .await;
            Json(json!({ "status": "ok", "item": row })).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "growth_reconcile_fix_failed",
                "message": e.to_string(),
            })),
        )
            .into_response(),
    }
}

pub async fn patch_admin_reward_ledger_fraud(
    State(state): State<ApiMetaState>,
    Path(id_raw): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchLedgerFraudBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_FRAUD).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let ledger_id = match Uuid::parse_str(id_raw.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"status": "error", "error": "invalid_ledger_id"})),
            )
                .into_response();
        }
    };
    if !db::is_valid_ledger_fraud_mark(body.fraud_status.trim()) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_ledger_fraud_status"})),
        )
            .into_response();
    }
    let Some(pool) = growth_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"status": "error", "error": "growth_db_unavailable"})),
        )
            .into_response();
    };
    match db::patch_ledger_fraud_status(pool, ledger_id, body.fraud_status.trim()).await {
        Ok(true) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.growth.reward_ledger.fraud_mark",
                Some("growth_point_ledger"),
                Some(ledger_id.to_string().as_str()),
                json!({
                    "ledger_id": ledger_id,
                    "fraud_status": body.fraud_status,
                }),
            )
            .await;
            Json(json!({ "status": "ok", "ledger_id": ledger_id })).into_response()
        }
        Ok(false) => (
            StatusCode::NOT_FOUND,
            Json(json!({"status": "error", "error": "ledger_not_found"})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "growth_ledger_fraud_patch_failed",
                "message": e.to_string(),
            })),
        )
            .into_response(),
    }
}
