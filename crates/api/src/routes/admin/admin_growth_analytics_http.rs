//! Admin · G-S7 Growth analytics & KOL read-only dashboard（无写路径 · 无积分公式变更）

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_GROWTH_READ};

#[derive(Debug, Deserialize)]
pub struct GrowthAnalyticsQuery {
    pub from: Option<String>,
    pub to: Option<String>,
    pub days: Option<i64>,
    pub limit: Option<i64>,
}

fn growth_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

fn parse_window(q: &GrowthAnalyticsQuery) -> Result<(Option<DateTime<Utc>>, Option<DateTime<Utc>>), axum::response::Response> {
    if let Some(days) = q.days {
        if days > 0 {
            let to = Utc::now();
            let from = to - chrono::Duration::days(days);
            return Ok((Some(from), Some(to)));
        }
    }
    let from = match &q.from {
        None => None,
        Some(s) if s.trim().is_empty() => None,
        Some(s) => DateTime::parse_from_rfc3339(s.trim())
            .map(|d| Some(d.with_timezone(&Utc)))
            .map_err(|_| bad_request("invalid_from"))?,
    };
    let to = match &q.to {
        None => None,
        Some(s) if s.trim().is_empty() => None,
        Some(s) => DateTime::parse_from_rfc3339(s.trim())
            .map(|d| Some(d.with_timezone(&Utc)))
            .map_err(|_| bad_request("invalid_to"))?,
    };
    Ok((from, to))
}

fn bad_request(code: &str) -> axum::response::Response {
    (
        StatusCode::BAD_REQUEST,
        Json(json!({"status": "error", "error": code})),
    )
        .into_response()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/growth/analytics/overview",
            get(get_admin_growth_analytics_overview),
        )
        .route(
            "/api/v1/admin/growth/analytics/funnel",
            get(get_admin_growth_analytics_funnel),
        )
        .route(
            "/api/v1/admin/growth/analytics/top-referrers",
            get(get_admin_growth_analytics_top_referrers),
        )
        .route(
            "/api/v1/admin/growth/kol-center",
            get(get_admin_growth_kol_center),
        )
        .route(
            "/api/v1/admin/growth/kol-center/:code_id",
            get(get_admin_growth_kol_center_detail),
        )
}

pub async fn get_admin_growth_analytics_overview(
    State(state): State<ApiMetaState>,
    Query(q): Query<GrowthAnalyticsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let (from, to) = match parse_window(&q) {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::growth_analytics_overview(pool, from, to).await {
        Ok(summary) => Json(json!({
            "status": "ok",
            "read_only": true,
            "summary": summary,
        }))
        .into_response(),
        Err(e) => internal_err("growth_analytics_overview_failed", e),
    }
}

pub async fn get_admin_growth_analytics_funnel(
    State(state): State<ApiMetaState>,
    Query(q): Query<GrowthAnalyticsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let (from, to) = match parse_window(&q) {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::growth_analytics_funnel(pool, from, to).await {
        Ok(funnel) => Json(json!({
            "status": "ok",
            "read_only": true,
            "funnel": funnel,
        }))
        .into_response(),
        Err(e) => internal_err("growth_analytics_funnel_failed", e),
    }
}

pub async fn get_admin_growth_analytics_top_referrers(
    State(state): State<ApiMetaState>,
    Query(q): Query<GrowthAnalyticsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let (from, to) = match parse_window(&q) {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::list_top_referrers(pool, from, to, q.limit.unwrap_or(25)).await {
        Ok(items) => Json(json!({
            "status": "ok",
            "read_only": true,
            "count": items.len(),
            "items": items,
        }))
        .into_response(),
        Err(e) => internal_err("growth_analytics_top_referrers_failed", e),
    }
}

pub async fn get_admin_growth_kol_center(
    State(state): State<ApiMetaState>,
    Query(q): Query<GrowthAnalyticsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let (from, to) = match parse_window(&q) {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::list_kol_contributions(pool, from, to, q.limit.unwrap_or(50)).await {
        Ok(items) => Json(json!({
            "status": "ok",
            "read_only": true,
            "count": items.len(),
            "items": items,
        }))
        .into_response(),
        Err(e) => internal_err("growth_kol_center_list_failed", e),
    }
}

pub async fn get_admin_growth_kol_center_detail(
    State(state): State<ApiMetaState>,
    Path(code_id_raw): Path<String>,
    Query(q): Query<GrowthAnalyticsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let code_id = match Uuid::parse_str(code_id_raw.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"status": "error", "error": "invalid_code_id"})),
            )
                .into_response()
        }
    };
    let (from, to) = match parse_window(&q) {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::get_kol_contribution_detail(pool, code_id, from, to, q.limit.unwrap_or(20)).await {
        Ok(Some(detail)) => Json(json!({
            "status": "ok",
            "read_only": true,
            "detail": detail,
        }))
        .into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({"status": "error", "error": "kol_code_not_found"})),
        )
            .into_response(),
        Err(e) => internal_err("growth_kol_center_detail_failed", e),
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
