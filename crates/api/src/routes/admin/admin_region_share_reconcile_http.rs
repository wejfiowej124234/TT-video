//! Admin · BE-RS-01 RegionShare reconcile audit view

use axum::extract::{Path, Query, State};
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_FINANCE_READ};

#[derive(Debug, Deserialize)]
pub struct RegionShareReconcileListQuery {
    pub chain_id: Option<i64>,
    pub limit: Option<i64>,
}

fn finance_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

fn db_unavailable() -> axum::response::Response {
    (
        axum::http::StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({"status": "error", "error": "database_unavailable"})),
    )
        .into_response()
}

fn internal_err(code: &str, e: impl std::fmt::Display) -> axum::response::Response {
    (
        axum::http::StatusCode::INTERNAL_SERVER_ERROR,
        Json(json!({"status": "error", "error": code, "message": e.to_string()})),
    )
        .into_response()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/region-share/reconcile/latest",
            get(get_admin_region_share_reconcile_latest),
        )
        .route(
            "/api/v1/admin/region-share/reconcile/reports",
            get(get_admin_region_share_reconcile_reports),
        )
        .route(
            "/api/v1/admin/region-share/reconcile/reports/:id",
            get(get_admin_region_share_reconcile_report),
        )
}

pub async fn get_admin_region_share_reconcile_latest(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_FINANCE_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = finance_pool(&state) else {
        return db_unavailable();
    };
    match db::get_latest_reconciliation_report_by_type(
        pool,
        db::REPORT_TYPE_REGION_SHARE_PROJECTION_CLOSURE,
    )
    .await
    {
        Ok(Some(row)) => Json(json!({
            "status": "ok",
            "report_id": row.id.to_string(),
            "report_type": row.report_type,
            "chain_id": row.chain_id,
            "created_at": row.created_at.to_rfc3339(),
            "summary": row.summary.0,
        }))
        .into_response(),
        Ok(None) => Json(json!({
            "status": "ok",
            "observation_note": "no_stored_report",
            "getter_note": "Run POST /api/v1/internal/region-share-reconcile with persist:true",
        }))
        .into_response(),
        Err(e) => internal_err("region_share_reconcile_latest_failed", e),
    }
}

pub async fn get_admin_region_share_reconcile_reports(
    State(state): State<ApiMetaState>,
    Query(q): Query<RegionShareReconcileListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_FINANCE_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = finance_pool(&state) else {
        return db_unavailable();
    };
    let limit = q.limit.unwrap_or(20).clamp(1, 100);
    match db::list_region_share_reconcile_reports(pool, q.chain_id, limit).await {
        Ok(items) => {
            let count = items.len();
            Json(json!({ "status": "ok", "count": count, "items": items })).into_response()
        }
        Err(e) => internal_err("region_share_reconcile_reports_list_failed", e),
    }
}

pub async fn get_admin_region_share_reconcile_report(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_FINANCE_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = finance_pool(&state) else {
        return db_unavailable();
    };
    match db::get_reconciliation_report_by_id(pool, id).await {
        Ok(Some(row)) if row.report_type == db::REPORT_TYPE_REGION_SHARE_PROJECTION_CLOSURE => {
            Json(json!({
                "status": "ok",
                "report_id": row.id.to_string(),
                "report_type": row.report_type,
                "chain_id": row.chain_id,
                "created_at": row.created_at.to_rfc3339(),
                "summary": row.summary.0,
            }))
            .into_response()
        }
        Ok(Some(_)) => (
            axum::http::StatusCode::NOT_FOUND,
            Json(json!({"status": "error", "error": "report_type_mismatch"})),
        )
            .into_response(),
        Ok(None) => (
            axum::http::StatusCode::NOT_FOUND,
            Json(json!({"status": "error", "error": "not_found"})),
        )
            .into_response(),
        Err(e) => internal_err("region_share_reconcile_report_get_failed", e),
    }
}
