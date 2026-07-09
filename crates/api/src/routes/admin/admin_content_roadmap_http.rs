//! Admin · CMS product roadmap (section + milestones · not announcements list)

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, patch, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::db::{
    self, RoadmapMilestoneCreateInput, RoadmapMilestonePatchInput, RoadmapSectionPatchInput,
    ROADMAP_LANE,
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

fn map_mutation_err(code: &str) -> (StatusCode, Json<Value>) {
    match code {
        "slug_required" | "invalid_slug" | "invalid_cta_href" | "invalid_ops_status" | "title_required" => {
            invalid(code)
        }
        "published_immutable" | "invalid_publish_transition" | "invalid_unpublish_transition" => err(code),
        _ => err(code),
    }
}

fn not_found() -> (StatusCode, Json<Value>) {
    (
        StatusCode::NOT_FOUND,
        Json(json!({ "status": "error", "error": "not_found" })),
    )
}

async fn require_roadmap_lane(
    state: &ApiMetaState,
    headers: &HeaderMap,
    base_perm: &str,
) -> Result<(Uuid, String), axum::response::Response> {
    require_cms_announcement_lanes(state, headers, &[ROADMAP_LANE], base_perm).await
}

#[derive(Debug, Deserialize)]
pub struct AdminRoadmapMilestoneListQuery {
    pub publish_status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminRoadmapVersionBody {
    pub version: i32,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/content/roadmap/section",
            get(get_admin_roadmap_section).patch(patch_admin_roadmap_section),
        )
        .route(
            "/api/v1/admin/content/roadmap/section/submit-review",
            post(post_admin_roadmap_section_submit_review),
        )
        .route(
            "/api/v1/admin/content/roadmap/section/publish",
            post(post_admin_roadmap_section_publish),
        )
        .route(
            "/api/v1/admin/content/roadmap/section/unpublish",
            post(post_admin_roadmap_section_unpublish),
        )
        .route(
            "/api/v1/admin/content/roadmap/milestones",
            get(get_admin_roadmap_milestones).post(post_admin_roadmap_milestone),
        )
        .route(
            "/api/v1/admin/content/roadmap/milestones/:id",
            patch(patch_admin_roadmap_milestone),
        )
        .route(
            "/api/v1/admin/content/roadmap/milestones/:id/:action",
            post(post_admin_roadmap_milestone_workflow),
        )
}

pub async fn get_admin_roadmap_section(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
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
    match db::get_admin_roadmap_section(pool).await {
        Ok(Some(section)) => Json(json!({ "status": "ok", "section": section })).into_response(),
        Ok(None) => not_found().into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "roadmap_section_load_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn patch_admin_roadmap_section(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<RoadmapSectionPatchInput>,
) -> impl IntoResponse {
    let (actor_id, _) = match require_roadmap_lane(&state, &headers, PERM_CONTENT_WRITE).await {
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
    match db::patch_roadmap_section(pool, &body).await {
        Ok(Ok(section)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.roadmap.section.patch",
                Some("cms_roadmap_section"),
                Some(section.id.to_string().as_str()),
                json!({ "version": section.version }),
            )
            .await;
            Json(json!({ "status": "ok", "section": section })).into_response()
        }
        Ok(Err("not_found")) => not_found().into_response(),
        Ok(Err(code)) => map_mutation_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "roadmap_section_patch_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

async fn roadmap_section_workflow(
    state: &ApiMetaState,
    headers: &HeaderMap,
    version: i32,
    publish: Option<bool>,
    review: bool,
    base_perm: &str,
    audit_action: &str,
) -> axum::response::Response {
    let (actor_id, _) = match require_roadmap_lane(state, headers, base_perm).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = pool(state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    let result = if review {
        db::submit_roadmap_section_review(pool, version).await
    } else if publish == Some(true) {
        db::set_roadmap_section_publish_status(pool, version, true).await
    } else {
        db::set_roadmap_section_publish_status(pool, version, false).await
    };
    match result {
        Ok(Ok(section)) => {
            write_admin_audit_log_best_effort(
                state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                audit_action,
                Some("cms_roadmap_section"),
                Some(section.id.to_string().as_str()),
                json!({ "version": section.version }),
            )
            .await;
            Json(json!({ "status": "ok", "section": section })).into_response()
        }
        Ok(Err("not_found")) => not_found().into_response(),
        Ok(Err(code)) => map_mutation_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "roadmap_section_workflow_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn post_admin_roadmap_section_submit_review(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminRoadmapVersionBody>,
) -> impl IntoResponse {
    roadmap_section_workflow(
        &state,
        &headers,
        body.version,
        None,
        true,
        PERM_CONTENT_WRITE,
        "admin.content.roadmap.section.submit_review",
    )
    .await
}

pub async fn post_admin_roadmap_section_publish(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminRoadmapVersionBody>,
) -> impl IntoResponse {
    roadmap_section_workflow(
        &state,
        &headers,
        body.version,
        Some(true),
        false,
        PERM_CONTENT_PUBLISH,
        "admin.content.roadmap.section.publish",
    )
    .await
}

pub async fn post_admin_roadmap_section_unpublish(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminRoadmapVersionBody>,
) -> impl IntoResponse {
    roadmap_section_workflow(
        &state,
        &headers,
        body.version,
        Some(false),
        false,
        PERM_CONTENT_PUBLISH,
        "admin.content.roadmap.section.unpublish",
    )
    .await
}

pub async fn get_admin_roadmap_milestones(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Query(q): Query<AdminRoadmapMilestoneListQuery>,
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
    match db::list_admin_roadmap_milestones(pool, q.publish_status.as_deref()).await {
        Ok(items) => Json(json!({ "status": "ok", "items": items })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "roadmap_milestones_list_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn post_admin_roadmap_milestone(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<RoadmapMilestoneCreateInput>,
) -> impl IntoResponse {
    let (actor_id, _) = match require_roadmap_lane(&state, &headers, PERM_CONTENT_WRITE).await {
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
    match db::create_roadmap_milestone(pool, &body).await {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.roadmap.milestone.create",
                Some("cms_public_announcements"),
                Some(item.id.to_string().as_str()),
                json!({ "slug": item.slug }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err(code)) => map_mutation_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "roadmap_milestone_create_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn patch_admin_roadmap_milestone(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<RoadmapMilestonePatchInput>,
) -> impl IntoResponse {
    let (actor_id, _) = match require_roadmap_lane(&state, &headers, PERM_CONTENT_WRITE).await {
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
    match db::patch_roadmap_milestone(pool, id, &body).await {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.roadmap.milestone.patch",
                Some("cms_public_announcements"),
                Some(id.to_string().as_str()),
                json!({ "version": item.version }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err("not_found")) => not_found().into_response(),
        Ok(Err(code)) => map_mutation_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "roadmap_milestone_patch_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn post_admin_roadmap_milestone_workflow(
    State(state): State<ApiMetaState>,
    Path((id, action)): Path<(Uuid, String)>,
    headers: HeaderMap,
    Json(body): Json<AdminRoadmapVersionBody>,
) -> impl IntoResponse {
    let base = if action == "publish" || action == "unpublish" {
        PERM_CONTENT_PUBLISH
    } else {
        PERM_CONTENT_WRITE
    };
    let (actor_id, _) = match require_roadmap_lane(&state, &headers, base).await {
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
    match db::roadmap_milestone_workflow(pool, id, body.version, &action).await {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                &format!("admin.content.roadmap.milestone.{action}"),
                Some("cms_public_announcements"),
                Some(id.to_string().as_str()),
                json!({ "version": item.version }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err("not_found")) => not_found().into_response(),
        Ok(Err(code)) => map_mutation_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "roadmap_milestone_workflow_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}
