//! Admin · CMS public announcements

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, patch, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::db::{
    self, CmsAnnouncementCreateInput, CmsAnnouncementPatchInput,
};
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_CONTENT_PUBLISH, PERM_CONTENT_READ, PERM_CONTENT_WRITE};
use super::cms_announcement_lane_rbac::require_cms_announcement_lanes;
use super::write_admin_audit_log_best_effort;

fn pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

fn err(code: &str) -> (StatusCode, Json<Value>) {
    (
        StatusCode::CONFLICT,
        Json(json!({ "status": "error", "error": code })),
    )
}

fn invalid(code: &str) -> (StatusCode, Json<Value>) {
    (
        StatusCode::BAD_REQUEST,
        Json(json!({ "status": "error", "error": code })),
    )
}

fn map_cms_mutation_err(code: &str) -> (StatusCode, Json<Value>) {
    match code {
        "slug_required" | "invalid_slug" | "invalid_lane" | "invalid_cta_href" | "title_required" => {
            invalid(code)
        }
        "published_immutable" | "invalid_publish_transition" | "invalid_unpublish_transition" => {
            err(code)
        }
        _ => err(code),
    }
}

fn not_found() -> (StatusCode, Json<Value>) {
    (
        StatusCode::NOT_FOUND,
        Json(json!({ "status": "error", "error": "not_found" })),
    )
}

async fn require_cms_lane_access_for_id(
    state: &ApiMetaState,
    headers: &HeaderMap,
    pool: &sqlx::PgPool,
    id: Uuid,
    base_perm: &str,
    extra_lane: Option<&str>,
) -> Result<(Uuid, String), axum::response::Response> {
    let row = match db::get_admin_cms_announcement_by_id(pool, id).await {
        Ok(Some(r)) => r,
        Ok(None) => return Err(not_found().into_response()),
        Err(e) => {
            return Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "cms_announcement_lookup_failed",
                    "message": e.to_string()
                })),
            )
                .into_response());
        }
    };
    let mut lanes = vec![row.lane.as_str()];
    if let Some(l) = extra_lane.filter(|l| *l != row.lane.as_str()) {
        lanes.push(l);
    }
    require_cms_announcement_lanes(state, headers, &lanes, base_perm).await
}

#[derive(Debug, Deserialize)]
pub struct AdminCmsAnnouncementListQuery {
    pub publish_status: Option<String>,
    pub lane: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCmsAnnouncementVersionBody {
    pub version: i32,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/content/announcements",
            get(get_admin_cms_announcements).post(post_admin_cms_announcement),
        )
        .route(
            "/api/v1/admin/content/announcements/:id",
            patch(patch_admin_cms_announcement),
        )
        .route(
            "/api/v1/admin/content/announcements/:id/publish",
            post(post_admin_cms_announcement_publish),
        )
        .route(
            "/api/v1/admin/content/announcements/:id/unpublish",
            post(post_admin_cms_announcement_unpublish),
        )
        .route(
            "/api/v1/admin/content/announcements/:id/submit-review",
            post(post_admin_cms_announcement_submit_review),
        )
        .route(
            "/api/v1/admin/content/announcements/:id/archive",
            post(post_admin_cms_announcement_archive),
        )
}

pub async fn get_admin_cms_announcements(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Query(q): Query<AdminCmsAnnouncementListQuery>,
) -> impl IntoResponse {
    if let Err(r) = admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        return r;
    }
    let Some(pool) = pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match db::list_admin_cms_announcements(
        pool,
        q.publish_status.as_deref(),
        q.lane.as_deref(),
    )
    .await
    {
        Ok(items) => Json(json!({ "status": "ok", "items": items })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "cms_announcements_list_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn post_admin_cms_announcement(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<CmsAnnouncementCreateInput>,
) -> impl IntoResponse {
    let (actor_id, _) = match require_cms_announcement_lanes(
        &state,
        &headers,
        &[body.lane.as_str()],
        PERM_CONTENT_WRITE,
    )
    .await
    {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match db::create_cms_announcement(pool, &body).await {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.announcement.create",
                Some("cms_public_announcements"),
                Some(item.id.to_string().as_str()),
                json!({ "slug": item.slug }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err(code)) => map_cms_mutation_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "cms_announcement_create_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn patch_admin_cms_announcement(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<CmsAnnouncementPatchInput>,
) -> impl IntoResponse {
    let Some(pool) = pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    let (actor_id, _) = match require_cms_lane_access_for_id(
        &state,
        &headers,
        pool,
        id,
        PERM_CONTENT_WRITE,
        body.lane.as_deref(),
    )
    .await
    {
        Ok(v) => v,
        Err(r) => return r,
    };
    match db::patch_cms_announcement(pool, id, &body).await {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.announcement.patch",
                Some("cms_public_announcements"),
                Some(id.to_string().as_str()),
                json!({ "version": item.version }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err("not_found")) => not_found().into_response(),
        Ok(Err(code)) => map_cms_mutation_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "cms_announcement_patch_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

async fn publish_toggle(
    state: &ApiMetaState,
    headers: &HeaderMap,
    id: Uuid,
    body: AdminCmsAnnouncementVersionBody,
    publish: bool,
    audit_action: &str,
) -> axum::response::Response {
    let perm = if publish {
        PERM_CONTENT_PUBLISH
    } else {
        PERM_CONTENT_WRITE
    };
    let Some(pool) = pool(state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    let (actor_id, _) = match require_cms_lane_access_for_id(state, headers, pool, id, perm, None).await
    {
        Ok(v) => v,
        Err(r) => return r,
    };
    match db::set_cms_announcement_publish_status(pool, id, body.version, publish).await {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                audit_action,
                Some("cms_public_announcements"),
                Some(id.to_string().as_str()),
                json!({ "version": item.version, "publish_status": item.publish_status }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err("not_found")) => not_found().into_response(),
        Ok(Err(code)) => map_cms_mutation_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({
                "status": "error",
                "error": "cms_announcement_publish_failed",
                "message": e.to_string()
            })),
        )
            .into_response(),
    }
}

pub async fn post_admin_cms_announcement_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminCmsAnnouncementVersionBody>,
) -> impl IntoResponse {
    publish_toggle(&state, &headers, id, body, true, "admin.content.announcement.publish").await
}

pub async fn post_admin_cms_announcement_unpublish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminCmsAnnouncementVersionBody>,
) -> impl IntoResponse {
    publish_toggle(
        &state,
        &headers,
        id,
        body,
        false,
        "admin.content.announcement.unpublish",
    )
    .await
}

pub async fn post_admin_cms_announcement_submit_review(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminCmsAnnouncementVersionBody>,
) -> impl IntoResponse {
    let Some(pool) = pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    let (actor_id, _) =
        match require_cms_lane_access_for_id(&state, &headers, pool, id, PERM_CONTENT_WRITE, None)
            .await
        {
            Ok(v) => v,
            Err(r) => return r,
        };
    match db::submit_cms_announcement_review(pool, id, body.version).await {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.announcement.submit_review",
                Some("cms_public_announcements"),
                Some(id.to_string().as_str()),
                json!({ "version": item.version }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err(code)) => map_cms_mutation_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "cms_announcement_submit_review_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn post_admin_cms_announcement_archive(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminCmsAnnouncementVersionBody>,
) -> impl IntoResponse {
    let Some(pool) = pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    let (actor_id, _) =
        match require_cms_lane_access_for_id(&state, &headers, pool, id, PERM_CONTENT_WRITE, None)
            .await
        {
            Ok(v) => v,
            Err(r) => return r,
        };
    match db::archive_cms_announcement(pool, id, body.version).await {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.announcement.archive",
                Some("cms_public_announcements"),
                Some(id.to_string().as_str()),
                json!({ "version": item.version }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err(code)) => map_cms_mutation_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "cms_announcement_archive_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}
