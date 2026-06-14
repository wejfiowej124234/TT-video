//! Admin · G-S6 Airdrop snapshot & reward calculation（链下 · 无链上发放）

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_GROWTH_READ, PERM_GROWTH_WRITE};
use super::write_admin_audit_log_best_effort;

#[derive(Debug, Deserialize)]
pub struct AdminAirdropListQuery {
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCreateAirdropBody {
    pub name: String,
    pub gov_pool_amount: i64,
}

#[derive(Debug, Deserialize)]
pub struct AdminAirdropExportQuery {
    pub limit: Option<i64>,
}

fn growth_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/growth/airdrop-campaigns",
            get(get_admin_airdrop_campaigns).post(post_admin_airdrop_campaign),
        )
        .route(
            "/api/v1/admin/growth/airdrop-campaigns/:id",
            get(get_admin_airdrop_campaign),
        )
        .route(
            "/api/v1/admin/growth/airdrop-campaigns/:id/snapshot",
            post(post_admin_airdrop_snapshot),
        )
        .route(
            "/api/v1/admin/growth/airdrop-campaigns/:id/calculate",
            post(post_admin_airdrop_calculate),
        )
        .route(
            "/api/v1/admin/growth/airdrop-campaigns/:id/recalculate",
            post(post_admin_airdrop_recalculate),
        )
        .route(
            "/api/v1/admin/growth/airdrop-campaigns/:id/reconcile",
            get(get_admin_airdrop_reconcile),
        )
        .route(
            "/api/v1/admin/growth/airdrop-campaigns/:id/export",
            get(get_admin_airdrop_export),
        )
        .route(
            "/api/v1/admin/growth/airdrop-campaigns/:id/snapshots",
            get(get_admin_airdrop_snapshots),
        )
}

async fn parse_campaign_id(raw: &str) -> Result<Uuid, axum::response::Response> {
    Uuid::parse_str(raw.trim()).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_campaign_id"})),
        )
            .into_response()
    })
}

pub async fn get_admin_airdrop_campaigns(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminAirdropListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::list_airdrop_campaigns(pool, q.limit.unwrap_or(50)).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => internal_err("airdrop_campaign_list_failed", e),
    }
}

pub async fn post_admin_airdrop_campaign(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCreateAirdropBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let name = body.name.trim();
    if name.is_empty() || body.gov_pool_amount <= 0 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_airdrop_campaign"})),
        )
            .into_response();
    }
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::create_airdrop_campaign(pool, name, body.gov_pool_amount, Some(actor_id)).await {
        Ok(row) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.growth.airdrop.create",
                Some("airdrop_campaigns"),
                Some(row.id.to_string().as_str()),
                json!({ "name": name, "gov_pool_amount": body.gov_pool_amount }),
            )
            .await;
            Json(json!({ "status": "ok", "item": row })).into_response()
        }
        Err(e) => internal_err("airdrop_campaign_create_failed", e),
    }
}

pub async fn get_admin_airdrop_campaign(
    State(state): State<ApiMetaState>,
    Path(id_raw): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let campaign_id = match parse_campaign_id(&id_raw).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::get_airdrop_campaign(pool, campaign_id).await {
        Ok(Some(row)) => Json(json!({ "status": "ok", "item": row })).into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({"status": "error", "error": "campaign_not_found"})),
        )
            .into_response(),
        Err(e) => internal_err("airdrop_campaign_get_failed", e),
    }
}

pub async fn post_admin_airdrop_snapshot(
    State(state): State<ApiMetaState>,
    Path(id_raw): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let campaign_id = match parse_campaign_id(&id_raw).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::lock_airdrop_snapshot(pool, campaign_id).await {
        Ok(row) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.growth.airdrop.snapshot",
                Some("airdrop_campaigns"),
                Some(campaign_id.to_string().as_str()),
                json!({ "snapshot_user_count": row.snapshot_user_count }),
            )
            .await;
            Json(json!({ "status": "ok", "item": row })).into_response()
        }
        Err(e) if e.to_string().contains("campaign_not_draft") => (
            StatusCode::CONFLICT,
            Json(json!({"status": "error", "error": "campaign_not_draft"})),
        )
            .into_response(),
        Err(e) => internal_err("airdrop_snapshot_failed", e),
    }
}

pub async fn post_admin_airdrop_calculate(
    State(state): State<ApiMetaState>,
    Path(id_raw): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    airdrop_calculate_impl(&state, &headers, &id_raw, false).await
}

pub async fn post_admin_airdrop_recalculate(
    State(state): State<ApiMetaState>,
    Path(id_raw): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    airdrop_calculate_impl(&state, &headers, id_raw.as_str(), true).await
}

async fn airdrop_calculate_impl(
    state: &ApiMetaState,
    headers: &HeaderMap,
    id_raw: &str,
    recalc: bool,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(state, headers, PERM_GROWTH_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let campaign_id = match parse_campaign_id(id_raw).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(state) else {
        return growth_db_unavailable();
    };
    match db::calculate_airdrop_allocations(pool, campaign_id, recalc).await {
        Ok(row) => {
            write_admin_audit_log_best_effort(
                state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                if recalc {
                    "admin.growth.airdrop.recalculate"
                } else {
                    "admin.growth.airdrop.calculate"
                },
                Some("airdrop_campaigns"),
                Some(campaign_id.to_string().as_str()),
                json!({
                    "eligible_points_total": row.eligible_points_total,
                    "calculation_version": row.calculation_version,
                }),
            )
            .await;
            Json(json!({ "status": "ok", "item": row })).into_response()
        }
        Err(e) if e.to_string().contains("campaign_snapshot_not_locked") => (
            StatusCode::CONFLICT,
            Json(json!({"status": "error", "error": "campaign_snapshot_not_locked"})),
        )
            .into_response(),
        Err(e) => internal_err("airdrop_calculate_failed", e),
    }
}

pub async fn get_admin_airdrop_reconcile(
    State(state): State<ApiMetaState>,
    Path(id_raw): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let campaign_id = match parse_campaign_id(&id_raw).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::airdrop_reconcile_summary(pool, campaign_id).await {
        Ok(Some(summary)) => Json(json!({ "status": "ok", "summary": summary })).into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({"status": "error", "error": "campaign_not_found"})),
        )
            .into_response(),
        Err(e) => internal_err("airdrop_reconcile_failed", e),
    }
}

pub async fn get_admin_airdrop_export(
    State(state): State<ApiMetaState>,
    Path(id_raw): Path<String>,
    Query(q): Query<AdminAirdropExportQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let campaign_id = match parse_campaign_id(&id_raw).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::list_airdrop_export_rows(pool, campaign_id, q.limit.unwrap_or(5000)).await {
        Ok(items) => Json(json!({
            "status": "ok",
            "count": items.len(),
            "disclaimer": "off_chain_notional_only_no_on_chain_transfer",
            "items": items,
        }))
        .into_response(),
        Err(e) => internal_err("airdrop_export_failed", e),
    }
}

pub async fn get_admin_airdrop_snapshots(
    State(state): State<ApiMetaState>,
    Path(id_raw): Path<String>,
    Query(q): Query<AdminAirdropListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let campaign_id = match parse_campaign_id(&id_raw).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::list_campaign_snapshots(pool, campaign_id, q.limit.unwrap_or(100)).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => internal_err("airdrop_snapshots_list_failed", e),
    }
}

fn growth_db_unavailable() -> axum::response::Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({"status": "error", "error": "growth_db_unavailable"})),
    )
        .into_response()
}

fn internal_err(code: &str, e: sqlx::Error) -> axum::response::Response {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(json!({
            "status": "error",
            "error": code,
            "message": e.to_string(),
        })),
    )
        .into_response()
}
