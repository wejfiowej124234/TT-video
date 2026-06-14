//! Admin · O-S2 Official Guides M8

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
pub struct AdminOfficialGuidesQuery {
    pub author_account_id: Option<Uuid>,
    pub publish_status: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCreateOfficialGuideBody {
    pub author_account_id: Uuid,
    pub title: String,
    pub body: String,
    pub destination: Option<String>,
    pub tags: Option<Vec<String>>,
    pub cover_url: Option<String>,
    pub featured: Option<bool>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchOfficialGuideBody {
    pub title: Option<String>,
    pub body: Option<String>,
    pub destination: Option<String>,
    pub tags: Option<Vec<String>>,
    pub cover_url: Option<String>,
    pub featured: Option<bool>,
    pub author_account_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct AdminOfficialPublishBody {
    pub reason: Option<String>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/official/guides",
            get(get_admin_official_guides).post(post_admin_official_guide),
        )
        .route(
            "/api/v1/admin/official/guides/:id",
            get(get_admin_official_guide).patch(patch_admin_official_guide),
        )
        .route(
            "/api/v1/admin/official/guides/:id/submit-review",
            post(post_admin_official_guide_submit_review),
        )
        .route(
            "/api/v1/admin/official/guides/:id/request-publish",
            post(post_admin_official_guide_request_publish),
        )
        .route(
            "/api/v1/admin/official/guides/:id/publish",
            post(post_admin_official_guide_publish),
        )
        .route(
            "/api/v1/admin/official/guides/:id/archive",
            post(post_admin_official_guide_archive),
        )
}

pub async fn get_admin_official_guides(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOfficialGuidesQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    match db::list_official_guide_posts_admin(
        pool,
        q.author_account_id,
        q.publish_status.as_deref().filter(|s| !s.is_empty()),
        q.limit.unwrap_or(50),
    )
    .await
    {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => db_err("official_guides_list_failed", e),
    }
}

pub async fn get_admin_official_guide(
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
    match db::get_official_guide_post_admin(pool, id).await {
        Ok(Some(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(None) => official_not_found().into_response(),
        Err(e) => db_err("official_guide_get_failed", e),
    }
}

pub async fn post_admin_official_guide(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCreateOfficialGuideBody>,
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
    match db::create_official_guide_post_admin(
        pool,
        actor_id,
        db::CreateOfficialGuidePostInput {
            author_account_id: body.author_account_id,
            title: body.title,
            body: body.body,
            destination: body.destination,
            tags: body.tags.unwrap_or_default(),
            cover_url: body.cover_url,
            featured: body.featured.unwrap_or(false),
        },
        req_id,
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_guide_create_failed", e),
    }
}

pub async fn patch_admin_official_guide(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchOfficialGuideBody>,
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
    match db::patch_official_guide_post_admin(
        pool,
        id,
        actor_id,
        db::PatchOfficialGuidePostInput {
            title: body.title,
            body: body.body,
            destination: body.destination,
            tags: body.tags,
            cover_url: body.cover_url,
            featured: body.featured,
            author_account_id: body.author_account_id,
        },
        req_id,
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_guide_patch_failed", e),
    }
}

pub async fn post_admin_official_guide_submit_review(
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
    match db::submit_official_guide_post_review(pool, id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_guide_submit_review_failed", e),
    }
}

pub async fn post_admin_official_guide_request_publish(
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
    match db::request_official_guide_post_publish(pool, id, actor_id, body.reason.as_deref(), req_id).await {
        Ok(Ok(approval_id)) => Json(json!({
            "status": "ok",
            "approval_request_id": approval_id,
            "action": "ops.official.guide.publish",
        }))
        .into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_guide_request_publish_failed", e),
    }
}

pub async fn post_admin_official_guide_publish(
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
    match db::publish_official_guide_post_admin(pool, id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_guide_publish_failed", e),
    }
}

pub async fn post_admin_official_guide_archive(
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
    match db::archive_official_guide_post_admin(pool, id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("official_guide_archive_failed", e),
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
