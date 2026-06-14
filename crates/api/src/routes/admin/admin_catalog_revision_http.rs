//! Admin · C-S4 Catalog revision · import · parity · observability

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_CONTENT_PUBLISH, PERM_CONTENT_READ, PERM_CONTENT_WRITE};
use super::write_admin_audit_log_best_effort;

fn catalog_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

fn catalog_err(code: &str) -> (StatusCode, Json<Value>) {
    (
        StatusCode::CONFLICT,
        Json(json!({ "status": "error", "error": code })),
    )
}

fn catalog_not_found() -> (StatusCode, Json<Value>) {
    (
        StatusCode::NOT_FOUND,
        Json(json!({ "status": "error", "error": "not_found" })),
    )
}

#[derive(Debug, Deserialize)]
pub struct AdminRevisionListQuery {
    pub entity_type: Option<String>,
    pub entity_id: Option<Uuid>,
    pub action: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminRevisionCompareQuery {
    pub entity_type: String,
    pub entity_id: Uuid,
    pub version_a: i32,
    pub version_b: i32,
}

#[derive(Debug, Deserialize)]
pub struct AdminRevisionRollbackBody {
    pub entity_type: String,
    pub entity_id: Uuid,
    pub target_version: i32,
    pub current_version: i32,
    pub reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminImportTriggerBody {
    pub mode: String,
    pub skip_m6: Option<bool>,
    pub reason: Option<String>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/admin/content/revisions/detail", get(get_admin_revision_details))
        .route("/api/v1/admin/content/revisions/compare", get(get_admin_revision_compare))
        .route(
            "/api/v1/admin/content/revisions/rollback-history",
            get(get_admin_rollback_history),
        )
        .route("/api/v1/admin/content/revisions/rollback", post(post_admin_revision_rollback))
        .route("/api/v1/admin/content/revisions/:id", get(get_admin_revision_by_id))
        .route("/api/v1/admin/content/import/history", get(get_admin_import_history))
        .route("/api/v1/admin/content/import/trigger", post(post_admin_import_trigger))
        .route("/api/v1/admin/content/catalog/parity", get(get_admin_catalog_parity))
        .route("/api/v1/admin/content/catalog/observability", get(get_admin_catalog_observability))
        .route(
            "/api/v1/admin/content/catalog/geo-validation",
            get(get_admin_catalog_geo_validation),
        )
        .route(
            "/api/v1/admin/content/catalog/geo-validation/history",
            get(get_admin_catalog_geo_validation_history),
        )
        .route(
            "/api/v1/admin/content/catalog/geo-validation/meta-parity",
            get(get_admin_catalog_geo_meta_parity),
        )
}

pub async fn get_admin_revision_details(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminRevisionListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::list_admin_catalog_revision_details(
        pool,
        q.entity_type.as_deref().filter(|s| !s.is_empty()),
        q.entity_id,
        q.action.as_deref().filter(|s| !s.is_empty()),
        q.limit.unwrap_or(50).clamp(1, 200),
    )
    .await
    {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => db_err("revision_list_failed", e),
    }
}

pub async fn get_admin_revision_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::get_admin_catalog_revision_detail(pool, id).await {
        Ok(Some(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(None) => catalog_not_found().into_response(),
        Err(e) => db_err("revision_get_failed", e),
    }
}

pub async fn get_admin_revision_compare(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminRevisionCompareQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::compare_admin_catalog_revisions(
        pool,
        q.entity_type.trim(),
        q.entity_id,
        q.version_a,
        q.version_b,
    )
    .await
    {
        Ok(Some((left, right))) => Json(json!({
            "status": "ok",
            "left": left,
            "right": right,
        }))
        .into_response(),
        Ok(None) => catalog_not_found().into_response(),
        Err(e) => db_err("revision_compare_failed", e),
    }
}

pub async fn post_admin_revision_rollback(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminRevisionRollbackBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_PUBLISH).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::rollback_catalog_entity_to_revision(
        pool,
        body.entity_type.trim(),
        body.entity_id,
        body.target_version,
        body.current_version,
        Some(actor_id),
        req_id,
    )
    .await
    {
        Ok(Ok(version)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                req_id,
                "catalog.revision.rollback",
                Some(body.entity_type.trim()),
                Some(body.entity_id.to_string().as_str()),
                json!({ "target_version": body.target_version, "new_version": version }),
            )
            .await;
            Json(json!({ "status": "ok", "version": version })).into_response()
        }
        Ok(Err("revision_not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => db_err("revision_rollback_failed", e),
    }
}

pub async fn get_admin_rollback_history(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminRevisionListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::list_catalog_rollback_history(pool, q.limit.unwrap_or(50).clamp(1, 200)).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => db_err("rollback_history_failed", e),
    }
}

pub async fn get_admin_import_history(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminRevisionListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::list_catalog_import_batches(pool, q.limit.unwrap_or(50).clamp(1, 200)).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => db_err("import_history_failed", e),
    }
}

pub async fn post_admin_import_trigger(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminImportTriggerBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let mode = body.mode.trim();
    if !["dry-run", "validate", "apply"].contains(&mode) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "invalid_import_mode" })),
        )
            .into_response();
    }
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::create_catalog_import_trigger_request(
        pool,
        actor_id,
        mode,
        body.skip_m6.unwrap_or(false),
        body.reason.as_deref(),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(approval_id) => Json(json!({
            "status": "ok",
            "approval_request_id": approval_id,
            "approval_status": "pending",
            "action": "catalog.import.trigger",
            "mode": mode,
        }))
        .into_response(),
        Err(e) => db_err("import_trigger_failed", e),
    }
}

pub async fn get_admin_catalog_parity(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::build_catalog_parity_checks(pool).await {
        Ok(checks) => {
            let pass = checks.iter().all(|c| c.passed);
            Json(json!({
                "status": "ok",
                "parity_pass": pass,
                "count": checks.len(),
                "items": checks,
            }))
            .into_response()
        }
        Err(e) => db_err("catalog_parity_failed", e),
    }
}

pub async fn get_admin_catalog_observability(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::get_catalog_observability_summary(pool).await {
        Ok(summary) => Json(json!({ "status": "ok", "summary": summary })).into_response(),
        Err(e) => db_err("catalog_observability_failed", e),
    }
}

pub async fn get_admin_catalog_geo_validation(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::get_catalog_geo_validation_summary(pool).await {
        Ok(summary) => {
            let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
            let _ = db::insert_catalog_geo_validation_snapshot_audit(
                pool,
                actor_id,
                req_id,
                &summary,
            )
            .await;
            Json(json!({ "status": "ok", "summary": summary })).into_response()
        }
        Err(e) => db_err("catalog_geo_validation_failed", e),
    }
}

pub async fn get_admin_catalog_geo_validation_history(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminRevisionListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::list_catalog_geo_validation_history(pool, q.limit.unwrap_or(50).clamp(1, 200)).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => db_err("catalog_geo_validation_history_failed", e),
    }
}

pub async fn get_admin_catalog_geo_meta_parity(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::build_meta_product_countries_parity(pool).await {
        Ok(items) => {
            let pass = items.iter().all(|r| r.passed);
            Json(json!({
                "status": "ok",
                "parity_pass": pass,
                "count": items.len(),
                "items": items,
            }))
            .into_response()
        }
        Err(e) => db_err("catalog_geo_meta_parity_failed", e),
    }
}

fn service_unavailable() -> axum::response::Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
    )
        .into_response()
}

fn db_err(code: &str, e: sqlx::Error) -> axum::response::Response {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(json!({ "status": "error", "error": code, "message": e.to_string() })),
    )
        .into_response()
}
