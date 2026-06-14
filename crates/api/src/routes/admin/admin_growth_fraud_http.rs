//! Admin · G-S5 Anti-Fraud & user fraud status ops

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, patch, post};
use axum::{Json, Router};
use chrono::Utc;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_GROWTH_FRAUD, PERM_GROWTH_READ};
use super::write_admin_audit_log_best_effort;

#[derive(Debug, Deserialize)]
pub struct AdminFraudSignalsQuery {
    pub subject_user_id: Option<Uuid>,
    pub risk_level: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminFraudUsersQuery {
    pub fraud_status: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminPatchUserFraudStatusBody {
    pub growth_fraud_status: String,
    pub disable_referral_codes: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct AdminFraudScanRunsQuery {
    pub subject_user_id: Option<Uuid>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminTriggerFraudScanBody {
    pub user_id: Uuid,
}

fn growth_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/growth/anti-fraud/rules",
            get(get_admin_growth_fraud_rules),
        )
        .route(
            "/api/v1/admin/growth/anti-fraud/signals",
            get(get_admin_growth_fraud_signals),
        )
        .route(
            "/api/v1/admin/growth/anti-fraud/users",
            get(get_admin_growth_fraud_users),
        )
        .route(
            "/api/v1/admin/growth/anti-fraud/cases",
            get(get_admin_growth_fraud_cases),
        )
        .route(
            "/api/v1/admin/growth/anti-fraud/users/:user_id",
            patch(patch_admin_growth_fraud_user),
        )
        .route(
            "/api/v1/admin/growth/anti-fraud/scan-runs",
            get(get_admin_growth_fraud_scan_runs),
        )
        .route(
            "/api/v1/admin/growth/anti-fraud/scan-runs/trigger",
            post(post_admin_growth_fraud_scan_trigger),
        )
}

pub async fn get_admin_growth_fraud_rules(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let rules = db::growth_fraud_scan_rules_catalog_v1();
    Json(json!({ "status": "ok", "count": rules.len(), "items": rules })).into_response()
}

pub async fn get_admin_growth_fraud_signals(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminFraudSignalsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    let risk = q
        .risk_level
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    match db::list_growth_fraud_signals(pool, q.subject_user_id, risk, q.limit.unwrap_or(50)).await {
        Ok(items) => {
            let count = items.len();
            Json(json!({ "status": "ok", "count": count, "items": items })).into_response()
        }
        Err(e) => internal_err("growth_fraud_signals_list_failed", e),
    }
}

pub async fn get_admin_growth_fraud_users(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminFraudUsersQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    let status = q
        .fraud_status
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    match db::list_growth_fraud_users(pool, status, q.limit.unwrap_or(50)).await {
        Ok(items) => {
            let count = items.len();
            Json(json!({ "status": "ok", "count": count, "items": items })).into_response()
        }
        Err(e) => internal_err("growth_fraud_users_list_failed", e),
    }
}

pub async fn get_admin_growth_fraud_cases(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminFraudSignalsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::list_open_fraud_cases(pool, q.limit.unwrap_or(50)).await {
        Ok(items) => {
            let count = items.len();
            Json(json!({ "status": "ok", "count": count, "items": items })).into_response()
        }
        Err(e) => internal_err("growth_fraud_cases_list_failed", e),
    }
}

pub async fn patch_admin_growth_fraud_user(
    State(state): State<ApiMetaState>,
    Path(user_id_raw): Path<String>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchUserFraudStatusBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_FRAUD).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let user_id = match Uuid::parse_str(user_id_raw.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"status": "error", "error": "invalid_user_id"})),
            )
                .into_response();
        }
    };
    if !db::is_valid_user_fraud_status(body.growth_fraud_status.trim()) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_growth_fraud_status"})),
        )
            .into_response();
    }
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::patch_user_growth_fraud_status(
        pool,
        user_id,
        body.growth_fraud_status.trim(),
        body.disable_referral_codes.unwrap_or(false),
    )
    .await
    {
        Ok(Some(row)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.growth.fraud.user_status.patch",
                Some("users"),
                Some(user_id.to_string().as_str()),
                json!({
                    "user_id": user_id,
                    "growth_fraud_status": body.growth_fraud_status,
                    "item": row,
                }),
            )
            .await;
            Json(json!({ "status": "ok", "item": row })).into_response()
        }
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({"status": "error", "error": "user_not_found"})),
        )
            .into_response(),
        Err(e) => internal_err("growth_fraud_user_patch_failed", e),
    }
}

pub async fn get_admin_growth_fraud_scan_runs(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminFraudScanRunsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    match db::list_growth_fraud_scan_runs(pool, q.subject_user_id, q.limit.unwrap_or(50)).await {
        Ok(items) => {
            let count = items.len();
            Json(json!({ "status": "ok", "count": count, "items": items })).into_response()
        }
        Err(e) => internal_err("growth_fraud_scan_runs_list_failed", e),
    }
}

pub async fn post_admin_growth_fraud_scan_trigger(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminTriggerFraudScanBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_GROWTH_FRAUD).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = growth_pool(&state) else {
        return growth_db_unavailable();
    };
    let email: Option<String> = sqlx::query_scalar("SELECT email FROM users WHERE id = $1")
        .bind(body.user_id)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten();
    let wallet: Option<String> = sqlx::query_scalar(
        "SELECT default_wallet_address FROM users WHERE id = $1",
    )
    .bind(body.user_id)
    .fetch_optional(pool)
    .await
    .ok()
    .flatten();
    let idem = format!("manual:{}:{}", body.user_id, Utc::now().timestamp_millis());
    let ctx = db::GrowthFraudScanContext {
        client_ip: None,
        email,
        referral_code: None,
        default_wallet_address: wallet,
        user_agent: None,
    };
    match db::run_growth_fraud_scan(pool, body.user_id, "manual", &idem, ctx).await {
        Ok(result) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.growth.fraud.scan.trigger",
                Some("growth_fraud_scan_runs"),
                Some(result.scan_run_id.to_string().as_str()),
                json!({
                    "user_id": body.user_id,
                    "outcome": result.outcome,
                    "rules_fired": result.rules_fired,
                }),
            )
            .await;
            Json(json!({
                "status": "ok",
                "outcome": result.outcome,
                "rules_fired": result.rules_fired,
                "scan_run_id": result.scan_run_id,
            }))
            .into_response()
        }
        Err(e) => internal_err("growth_fraud_scan_trigger_failed", e),
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
