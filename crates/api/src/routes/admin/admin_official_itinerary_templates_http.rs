//! Admin · O-S3 Official Itinerary Templates M9

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

use super::admin_rbac::{self, PERM_OFFICIAL_PUBLISH, PERM_OFFICIAL_READ, PERM_OFFICIAL_WRITE};

fn official_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

fn official_err(code: &str) -> (StatusCode, Json<Value>) {
    (
        StatusCode::CONFLICT,
        Json(json!({ "status": "error", "error": code })),
    )
}

fn official_not_found() -> (StatusCode, Json<Value>) {
    (
        StatusCode::NOT_FOUND,
        Json(json!({ "status": "error", "error": "not_found" })),
    )
}

#[derive(Debug, Deserialize)]
pub struct AdminOfficialItineraryTemplatesQuery {
    pub author_account_id: Option<Uuid>,
    pub country_iso: Option<String>,
    pub publish_status: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCreateOfficialItineraryTemplateBody {
    pub title: String,
    pub author_account_id: Uuid,
    pub country_iso: Option<String>,
    pub city_id: Option<Uuid>,
    pub days_json: Option<Value>,
    pub budget_json: Option<Value>,
    pub cover_image_url: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchOfficialItineraryTemplateBody {
    pub title: Option<String>,
    pub author_account_id: Option<Uuid>,
    pub country_iso: Option<String>,
    pub city_id: Option<Uuid>,
    pub days_json: Option<Value>,
    pub budget_json: Option<Value>,
    pub cover_image_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminOfficialPublishBody {
    pub reason: Option<String>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/official/itinerary-templates",
            get(get_admin_official_itinerary_templates).post(post_admin_official_itinerary_template),
        )
        .route(
            "/api/v1/admin/official/itinerary-templates/:id",
            get(get_admin_official_itinerary_template).patch(patch_admin_official_itinerary_template),
        )
        .route(
            "/api/v1/admin/official/itinerary-templates/:id/submit-review",
            post(post_admin_official_itinerary_template_submit_review),
        )
        .route(
            "/api/v1/admin/official/itinerary-templates/:id/request-publish",
            post(post_admin_official_itinerary_template_request_publish),
        )
        .route(
            "/api/v1/admin/official/itinerary-templates/:id/publish",
            post(post_admin_official_itinerary_template_publish),
        )
        .route(
            "/api/v1/admin/official/itinerary-templates/:id/archive",
            post(post_admin_official_itinerary_template_archive),
        )
}

pub async fn get_admin_official_itinerary_templates(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOfficialItineraryTemplatesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    match db::list_official_itinerary_templates_admin(
        pool,
        q.author_account_id,
        q.country_iso.as_deref().filter(|s| !s.is_empty()),
        q.publish_status.as_deref().filter(|s| !s.is_empty()),
        q.limit.unwrap_or(50),
    )
    .await
    {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => db_err("official_itinerary_templates_list_failed", e),
    }
}

pub async fn get_admin_official_itinerary_template(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    match db::get_official_itinerary_template_admin(pool, id).await {
        Ok(Some(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(None) => official_not_found().into_response(),
        Err(e) => db_err("official_itinerary_template_get_failed", e),
    }
}

pub async fn post_admin_official_itinerary_template(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCreateOfficialItineraryTemplateBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::create_official_itinerary_template_admin(
        pool,
        actor_id,
        db::CreateOfficialItineraryTemplateInput {
            title: body.title,
            author_account_id: body.author_account_id,
            country_iso: body.country_iso,
            city_id: body.city_id,
            days_json: body.days_json.unwrap_or_else(|| json!([])),
            budget_json: body.budget_json.unwrap_or_else(|| json!({})),
            cover_image_url: body.cover_image_url,
        },
        req_id,
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_itinerary_template_create_failed", e),
    }
}

pub async fn patch_admin_official_itinerary_template(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchOfficialItineraryTemplateBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::patch_official_itinerary_template_admin(
        pool,
        id,
        actor_id,
        db::PatchOfficialItineraryTemplateInput {
            title: body.title,
            author_account_id: body.author_account_id,
            country_iso: body.country_iso,
            city_id: body.city_id,
            days_json: body.days_json,
            budget_json: body.budget_json,
            cover_image_url: body.cover_image_url,
        },
        req_id,
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_itinerary_template_patch_failed", e),
    }
}

pub async fn post_admin_official_itinerary_template_submit_review(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::submit_official_itinerary_template_review(pool, id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_itinerary_template_submit_review_failed", e),
    }
}

pub async fn post_admin_official_itinerary_template_request_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminOfficialPublishBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::request_official_itinerary_template_publish(
        pool,
        id,
        actor_id,
        body.reason.as_deref(),
        req_id,
    )
    .await
    {
        Ok(Ok(approval_id)) => Json(json!({
            "status": "ok",
            "approval_request_id": approval_id,
            "action": "ops.itinerary_template.publish",
        }))
        .into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_itinerary_template_request_publish_failed", e),
    }
}

pub async fn post_admin_official_itinerary_template_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_PUBLISH).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::publish_official_itinerary_template_admin(pool, id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_itinerary_template_publish_failed", e),
    }
}

pub async fn post_admin_official_itinerary_template_archive(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::archive_official_itinerary_template_admin(pool, id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_itinerary_template_archive_failed", e),
    }
}

fn service_unavailable() -> axum::response::Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({ "status": "error", "error": "official_db_unavailable" })),
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
