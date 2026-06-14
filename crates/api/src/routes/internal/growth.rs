//! G-S2 · Internal growth observer / reconcile · BE-FRD-01 fraud-scan

use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::common;

#[derive(Debug, Deserialize)]
pub struct GrowthAwardPointsBody {
    pub user_id: Uuid,
    pub source: String,
    pub idempotency_key: Option<String>,
    pub related_user_id: Option<Uuid>,
    pub related_entity_type: Option<String>,
    pub related_entity_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct GrowthReconcileQuery {
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct GrowthObserveBody {
    pub user_id: Uuid,
    pub event: String,
}

#[derive(Debug, Deserialize)]
pub struct GrowthFraudScanBody {
    pub user_id: Uuid,
    pub trigger: String,
    pub idempotency_key: Option<String>,
    pub context: Option<GrowthFraudScanContextBody>,
}

#[derive(Debug, Deserialize, Default)]
pub struct GrowthFraudScanContextBody {
    pub client_ip: Option<String>,
    pub email: Option<String>,
    pub referral_code: Option<String>,
    pub default_wallet_address: Option<String>,
    pub user_agent: Option<String>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/internal/growth/award-points",
            post(post_internal_growth_award_points),
        )
        .route(
            "/api/v1/internal/growth/observe",
            post(post_internal_growth_observe),
        )
        .route(
            "/api/v1/internal/growth/reconcile",
            get(get_internal_growth_reconcile),
        )
        .route(
            "/api/v1/internal/growth/fraud-scan",
            post(post_internal_growth_fraud_scan),
        )
}

fn growth_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

pub async fn post_internal_growth_award_points(
    State(state): State<ApiMetaState>,
    Json(body): Json<GrowthAwardPointsBody>,
) -> impl IntoResponse {
    if let Some(r) = common::internal_operator_secret_required_response() {
        return r;
    }
    let Some(pool) = growth_pool(&state) else {
        return common::json_internal_db_unavailable_error().into_response();
    };
    let source = body.source.trim();
    if source.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_growth_source"})),
        )
            .into_response();
    }
    let idem = body
        .idempotency_key
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from)
        .unwrap_or_else(|| format!("manual:{source}:{}", body.user_id));
    let Some(base) = db::points_for_source(source) else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "growth_source_disabled_or_unknown"})),
        )
            .into_response();
    };
    match db::award_growth_points(
        pool,
        body.user_id,
        source,
        base,
        &idem,
        body.related_user_id,
        body.related_entity_type.as_deref(),
        body.related_entity_id,
    )
    .await
    {
        Ok(out) => Json(json!({
            "status": "ok",
            "outcome": format!("{:?}", out.kind),
            "ledger_id": out.ledger_id.map(|u| u.to_string()),
            "points": out.points,
        }))
        .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"status": "error", "error": "growth_award_failed", "message": e.to_string()})),
        )
            .into_response(),
    }
}

pub async fn post_internal_growth_observe(
    State(state): State<ApiMetaState>,
    Json(body): Json<GrowthObserveBody>,
) -> impl IntoResponse {
    if let Some(r) = common::internal_operator_secret_required_response() {
        return r;
    }
    let Some(pool) = growth_pool(&state) else {
        return common::json_internal_db_unavailable_error().into_response();
    };
    let event = body.event.trim();
    if event.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_growth_event"})),
        )
            .into_response();
    }
    db::observe_best_effort(pool, body.user_id, event).await;
    Json(json!({"status": "ok", "event": event})).into_response()
}

pub async fn post_internal_growth_fraud_scan(
    State(state): State<ApiMetaState>,
    Json(body): Json<GrowthFraudScanBody>,
) -> impl IntoResponse {
    if let Some(r) = common::internal_operator_secret_required_response() {
        return r;
    }
    let Some(pool) = growth_pool(&state) else {
        return common::json_internal_db_unavailable_error().into_response();
    };
    let trigger = body.trigger.trim();
    if !matches!(trigger, "register" | "manual" | "scheduled") {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_fraud_scan_trigger"})),
        )
            .into_response();
    }
    let idem = body
        .idempotency_key
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from)
        .unwrap_or_else(|| format!("{trigger}:{}", body.user_id));
    let ctx_body = body.context.unwrap_or_default();
    let ctx = db::GrowthFraudScanContext {
        client_ip: ctx_body.client_ip,
        email: ctx_body.email,
        referral_code: ctx_body.referral_code,
        default_wallet_address: ctx_body.default_wallet_address,
        user_agent: ctx_body.user_agent,
    };
    match db::run_growth_fraud_scan(pool, body.user_id, trigger, &idem, ctx).await {
        Ok(result) => {
            let status = if result.duplicate {
                StatusCode::CONFLICT
            } else {
                StatusCode::OK
            };
            (
                status,
                Json(json!({
                    "status": "ok",
                    "outcome": result.outcome,
                    "rules_fired": result.rules_fired,
                    "scan_run_id": result.scan_run_id,
                    "duplicate": result.duplicate,
                })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"status": "error", "error": "growth_fraud_scan_failed", "message": e.to_string()})),
        )
            .into_response(),
    }
}

pub async fn get_internal_growth_reconcile(
    State(state): State<ApiMetaState>,
    Query(q): Query<GrowthReconcileQuery>,
) -> impl IntoResponse {
    if let Some(r) = common::internal_operator_secret_required_response() {
        return r;
    }
    let Some(pool) = growth_pool(&state) else {
        return common::json_internal_db_unavailable_error().into_response();
    };
    match db::list_growth_points_drift(pool, q.limit.unwrap_or(100)).await {
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
