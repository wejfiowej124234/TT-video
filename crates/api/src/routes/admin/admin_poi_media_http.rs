//! Admin · C-S2 M6 POI image batch review workflow

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
pub struct AdminPoiImageBatchListQuery {
    pub status: Option<String>,
    pub city_id: Option<Uuid>,
    pub poi_kind: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminPoiImageCandidateListQuery {
    pub poi_id: Option<Uuid>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchPoiImageCandidateBody {
    pub review_status: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminSelectPoiImageCandidateBody {
    pub version: i32,
    pub poi_id: Uuid,
    pub candidate_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct AdminPoiImageBatchActionBody {
    pub version: i32,
    pub reason: Option<String>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/content/poi-image-batches",
            get(get_admin_poi_image_batches),
        )
        .route(
            "/api/v1/admin/content/poi-image-batches/:id",
            get(get_admin_poi_image_batch),
        )
        .route(
            "/api/v1/admin/content/poi-image-batches/:id/candidates",
            get(get_admin_poi_image_candidates),
        )
        .route(
            "/api/v1/admin/content/poi-image-batches/:batch_id/candidates/:candidate_id",
            patch(patch_admin_poi_image_candidate),
        )
        .route(
            "/api/v1/admin/content/poi-image-batches/:id/select",
            post(post_admin_poi_image_select),
        )
        .route(
            "/api/v1/admin/content/poi-image-batches/:id/submit-review",
            post(post_admin_poi_image_submit_review),
        )
        .route(
            "/api/v1/admin/content/poi-image-batches/:id/publish",
            post(post_admin_poi_image_publish),
        )
        .route(
            "/api/v1/admin/content/poi-image-batches/:id/request-publish",
            post(post_admin_poi_image_request_publish),
        )
}

pub async fn get_admin_poi_image_batches(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminPoiImageBatchListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    let status = q.status.as_deref().filter(|s| !s.is_empty());
    let poi_kind = q.poi_kind.as_deref().filter(|s| !s.is_empty());
    match db::list_admin_poi_image_batches(pool, status, q.city_id, poi_kind).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "poi_image_batches_list_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn get_admin_poi_image_batch(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match db::get_admin_poi_image_batch(pool, id).await {
        Ok(Some(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(None) => catalog_not_found().into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "poi_image_batch_get_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn get_admin_poi_image_candidates(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    Query(q): Query<AdminPoiImageCandidateListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match db::list_admin_poi_image_candidates(pool, id, q.poi_id).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "poi_image_candidates_list_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn patch_admin_poi_image_candidate(
    State(state): State<ApiMetaState>,
    Path((batch_id, candidate_id)): Path<(Uuid, Uuid)>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchPoiImageCandidateBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    let request_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    let review_status = body.review_status.as_deref().filter(|s| !s.is_empty());
    match db::patch_admin_poi_image_candidate(
        pool,
        batch_id,
        candidate_id,
        review_status,
        body.notes.as_deref(),
        Some(actor_id),
        request_id,
    )
    .await
    {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                request_id,
                "catalog.poi_image.candidate.patch",
                Some("catalog_poi_image_candidates"),
                Some(candidate_id.to_string().as_str()),
                json!({ "batch_id": batch_id, "review_status": item.review_status }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err("not_found")) | Ok(Err("candidate_not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "poi_image_candidate_patch_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn post_admin_poi_image_select(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminSelectPoiImageCandidateBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    let request_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::select_admin_poi_image_candidate(
        pool,
        id,
        body.version,
        body.poi_id,
        body.candidate_id,
        Some(actor_id),
        request_id,
    )
    .await
    {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                request_id,
                "catalog.poi_image.select",
                Some("catalog_poi_image_batches"),
                Some(id.to_string().as_str()),
                json!({ "poi_id": body.poi_id, "candidate_id": body.candidate_id }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err("not_found")) | Ok(Err("candidate_not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "poi_image_select_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn post_admin_poi_image_submit_review(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPoiImageBatchActionBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    let request_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::submit_review_poi_image_batch(pool, id, body.version, Some(actor_id), request_id).await {
        Ok(Ok(version)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                request_id,
                "catalog.poi_image.submit_review",
                Some("catalog_poi_image_batches"),
                Some(id.to_string().as_str()),
                json!({ "version": version }),
            )
            .await;
            Json(json!({ "status": "ok", "version": version, "batch_status": "review" })).into_response()
        }
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "poi_image_submit_review_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn post_admin_poi_image_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPoiImageBatchActionBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_PUBLISH).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    let request_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::publish_poi_image_batch(pool, id, body.version, Some(actor_id), request_id).await {
        Ok(Ok(version)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                request_id,
                "catalog.poi_image.publish",
                Some("catalog_poi_image_batches"),
                Some(id.to_string().as_str()),
                json!({ "version": version }),
            )
            .await;
            Json(json!({ "status": "ok", "version": version, "batch_status": "published" })).into_response()
        }
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "poi_image_publish_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn post_admin_poi_image_request_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPoiImageBatchActionBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match db::create_poi_image_publish_approval_request(
        pool,
        actor_id,
        id,
        body.version,
        body.reason.as_deref(),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(approval_id)) => Json(json!({
            "status": "ok",
            "approval_request_id": approval_id,
            "approval_status": "pending",
            "action": "catalog.poi_image.publish",
        }))
        .into_response(),
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "poi_image_publish_request_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}
