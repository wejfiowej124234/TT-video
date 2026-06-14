//! Admin · BE-GCM-01 Country market launches

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, patch, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_CONTENT_PUBLISH, PERM_CONTENT_READ, PERM_CONTENT_WRITE};
use super::write_admin_audit_log_best_effort;

#[derive(Debug, Deserialize)]
pub struct CountryMarketLaunchesQuery {
    pub phase: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCountryMarketLaunchBody {
    pub jurisdiction_iso: String,
    pub catalog_country_id: Option<Uuid>,
    pub owner_user_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct PatchCountryMarketChecklistBody {
    pub checklist: Value,
}

#[derive(Debug, Deserialize)]
pub struct ActivateCountryMarketLaunchBody {
    pub evidence_ref: Option<String>,
}

fn catalog_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/country-market/launches",
            get(get_admin_country_market_launches).post(post_admin_country_market_launch),
        )
        .route(
            "/api/v1/admin/country-market/launches/:id",
            get(get_admin_country_market_launch),
        )
        .route(
            "/api/v1/admin/country-market/launches/:id/checklist",
            patch(patch_admin_country_market_checklist),
        )
        .route(
            "/api/v1/admin/country-market/launches/:id/advance",
            post(post_admin_country_market_advance),
        )
        .route(
            "/api/v1/admin/country-market/launches/:id/activate",
            post(post_admin_country_market_activate),
        )
}

pub async fn get_admin_country_market_launches(
    State(state): State<ApiMetaState>,
    Query(q): Query<CountryMarketLaunchesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable();
    };
    let phase = q.phase.as_deref().map(str::trim).filter(|s| !s.is_empty());
    match db::list_country_market_launches(pool, phase, q.limit.unwrap_or(50)).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => internal_err("country_market_launches_list_failed", e),
    }
}

pub async fn post_admin_country_market_launch(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<CreateCountryMarketLaunchBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(iso) = db::normalize_jurisdiction_iso(&body.jurisdiction_iso) else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_jurisdiction_iso"})),
        )
            .into_response();
    };
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable();
    };
    match db::create_country_market_launch(pool, &iso, body.catalog_country_id, body.owner_user_id).await
    {
        Ok(row) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "country_market.launch.create",
                Some("country_market_launches"),
                Some(row.id.to_string().as_str()),
                json!({ "jurisdiction_iso": iso, "item": row }),
            )
            .await;
            Json(json!({ "status": "ok", "item": row })).into_response()
        }
        Err(e) => internal_err("country_market_launch_create_failed", e),
    }
}

pub async fn get_admin_country_market_launch(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable();
    };
    match db::get_country_market_launch(pool, id).await {
        Ok(Some(row)) => Json(json!({ "status": "ok", "item": row })).into_response(),
        Ok(None) => not_found(),
        Err(e) => internal_err("country_market_launch_get_failed", e),
    }
}

pub async fn patch_admin_country_market_checklist(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<PatchCountryMarketChecklistBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable();
    };
    match db::patch_country_market_checklist(pool, id, body.checklist).await {
        Ok(Some(row)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "country_market.launch.checklist.patch",
                Some("country_market_launches"),
                Some(id.to_string().as_str()),
                json!({ "checklist": row.checklist }),
            )
            .await;
            Json(json!({ "status": "ok", "item": row })).into_response()
        }
        Ok(None) => not_found(),
        Err(e) => internal_err("country_market_checklist_patch_failed", e),
    }
}

pub async fn post_admin_country_market_advance(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable();
    };
    match db::advance_country_market_launch_phase(pool, id).await {
        Ok(Ok(row)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                &format!("country_market.launch.phase.{}", row.phase),
                Some("country_market_launches"),
                Some(id.to_string().as_str()),
                json!({ "phase": row.phase }),
            )
            .await;
            Json(json!({ "status": "ok", "item": row })).into_response()
        }
        Ok(Err(code)) => (
            StatusCode::CONFLICT,
            Json(json!({ "status": "error", "error": code })),
        )
            .into_response(),
        Err(e) => internal_err("country_market_advance_failed", e),
    }
}

pub async fn post_admin_country_market_activate(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<ActivateCountryMarketLaunchBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_PUBLISH).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable();
    };
    let evidence = body.evidence_ref.as_deref().map(str::trim).filter(|s| !s.is_empty());
    match db::activate_country_market_launch(pool, id, evidence).await {
        Ok(Ok(row)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "country_market.launch.activate",
                Some("country_market_launches"),
                Some(id.to_string().as_str()),
                json!({ "jurisdiction_iso": row.jurisdiction_iso, "launched_at": row.launched_at }),
            )
            .await;
            Json(json!({ "status": "ok", "item": row })).into_response()
        }
        Ok(Err(code)) => (
            StatusCode::CONFLICT,
            Json(json!({ "status": "error", "error": code })),
        )
            .into_response(),
        Err(e) => internal_err("country_market_activate_failed", e),
    }
}

fn db_unavailable() -> axum::response::Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({"status": "error", "error": "catalog_db_unavailable"})),
    )
        .into_response()
}

fn not_found() -> axum::response::Response {
    (
        StatusCode::NOT_FOUND,
        Json(json!({"status": "error", "error": "not_found"})),
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
