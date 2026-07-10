//! Admin · O-S4 Cold Start Campaigns M10

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{delete, get, post};
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

pub(crate) fn official_err(code: &str) -> (StatusCode, Json<Value>) {
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
pub struct AdminColdStartCampaignsQuery {
    pub publish_status: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCreateColdStartCampaignBody {
    pub name: String,
    pub surfaces: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchColdStartCampaignBody {
    pub name: Option<String>,
    pub surfaces: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCreateColdStartItemBody {
    pub item_type: String,
    pub item_ref_id: Uuid,
    pub sort_order: Option<i32>,
    pub payload: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct AdminColdStartDeployBody {
    pub reason: Option<String>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/official/cold-start/campaigns",
            get(get_admin_cold_start_campaigns).post(post_admin_cold_start_campaign),
        )
        .route(
            "/api/v1/admin/official/cold-start/campaigns/:id",
            get(get_admin_cold_start_campaign).patch(patch_admin_cold_start_campaign),
        )
        .route(
            "/api/v1/admin/official/cold-start/campaigns/:id/submit-review",
            post(post_admin_cold_start_campaign_submit_review),
        )
        .route(
            "/api/v1/admin/official/cold-start/campaigns/:id/request-deploy",
            post(post_admin_cold_start_campaign_request_deploy),
        )
        .route(
            "/api/v1/admin/official/cold-start/campaigns/:id/deploy",
            post(post_admin_cold_start_campaign_deploy),
        )
        .route(
            "/api/v1/admin/official/cold-start/campaigns/:id/rollback",
            post(post_admin_cold_start_campaign_rollback),
        )
        .route(
            "/api/v1/admin/official/cold-start/campaigns/:id/archive",
            post(post_admin_cold_start_campaign_archive),
        )
        .route(
            "/api/v1/admin/official/cold-start/campaigns/:id/items",
            post(post_admin_cold_start_campaign_item),
        )
        .route(
            "/api/v1/admin/official/cold-start/campaigns/:campaign_id/items/:item_id",
            delete(delete_admin_cold_start_campaign_item),
        )
}

pub async fn get_admin_cold_start_campaigns(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminColdStartCampaignsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    match db::list_cold_start_campaigns_admin(
        pool,
        q.publish_status.as_deref().filter(|s| !s.is_empty()),
        None,
        q.limit.unwrap_or(50),
    )
    .await
    {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => db_err("cold_start_campaigns_list_failed", e),
    }
}

pub async fn get_admin_cold_start_campaign(
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
    match db::get_cold_start_campaign_with_items_admin(pool, id).await {
        Ok(Some((campaign, items))) => {
            Json(json!({ "status": "ok", "item": campaign, "items": items })).into_response()
        }
        Ok(None) => official_not_found().into_response(),
        Err(e) => db_err("cold_start_campaign_get_failed", e),
    }
}

pub async fn post_admin_cold_start_campaign(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCreateColdStartCampaignBody>,
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
    match db::create_cold_start_campaign_admin(
        pool,
        actor_id,
        db::CreateColdStartCampaignInput {
            name: body.name,
            surfaces: body.surfaces.unwrap_or_default(),
            campaign_kind: db::CAMPAIGN_KIND_COLD_START.to_string(),
        },
        req_id,
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("cold_start_campaign_create_failed", e),
    }
}

pub async fn patch_admin_cold_start_campaign(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchColdStartCampaignBody>,
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
    match db::patch_cold_start_campaign_admin(
        pool,
        id,
        actor_id,
        db::PatchColdStartCampaignInput {
            name: body.name,
            surfaces: body.surfaces,
        },
        req_id,
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("cold_start_campaign_patch_failed", e),
    }
}

pub async fn post_admin_cold_start_campaign_submit_review(
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
    match db::submit_cold_start_campaign_review(pool, id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("cold_start_campaign_submit_review_failed", e),
    }
}

pub async fn post_admin_cold_start_campaign_request_deploy(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminColdStartDeployBody>,
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
    match db::request_cold_start_campaign_deploy(pool, id, actor_id, body.reason.as_deref(), req_id).await {
        Ok(Ok(approval_id)) => Json(json!({
            "status": "ok",
            "approval_request_id": approval_id,
            "action": "ops.cold_start.deploy",
        }))
        .into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("cold_start_campaign_request_deploy_failed", e),
    }
}

pub async fn post_admin_cold_start_campaign_deploy(
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
    match db::deploy_cold_start_campaign_admin(pool, id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("cold_start_campaign_deploy_failed", e),
    }
}

pub async fn post_admin_cold_start_campaign_rollback(
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
    match db::rollback_cold_start_campaign_admin(pool, id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("cold_start_campaign_rollback_failed", e),
    }
}

pub async fn post_admin_cold_start_campaign_archive(
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
    match db::archive_cold_start_campaign_admin(pool, id, actor_id, req_id).await {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("cold_start_campaign_archive_failed", e),
    }
}

pub async fn post_admin_cold_start_campaign_item(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminCreateColdStartItemBody>,
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
    match db::create_cold_start_item_admin(
        pool,
        id,
        actor_id,
        db::CreateColdStartItemInput {
            item_type: body.item_type,
            item_ref_id: body.item_ref_id,
            sort_order: body.sort_order.unwrap_or(0),
            payload: body.payload.unwrap_or_else(|| json!({})),
        },
        req_id,
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("cold_start_item_create_failed", e),
    }
}

pub async fn delete_admin_cold_start_campaign_item(
    State(state): State<ApiMetaState>,
    Path((campaign_id, item_id)): Path<(Uuid, Uuid)>,
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
    match db::delete_cold_start_item_admin(pool, campaign_id, item_id, actor_id, req_id).await {
        Ok(Ok(())) => Json(json!({ "status": "ok" })).into_response(),
        Ok(Err(code)) => official_err(code).into_response(),
        Err(e) => db_err("cold_start_item_delete_failed", e),
    }
}

fn service_unavailable() -> axum::response::Response {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({ "status": "error", "error": "official_db_unavailable" })),
    )
        .into_response()
}

pub(crate) fn db_err(code: &str, e: sqlx::Error) -> axum::response::Response {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(json!({ "status": "error", "error": code, "message": e.to_string() })),
    )
        .into_response()
}
