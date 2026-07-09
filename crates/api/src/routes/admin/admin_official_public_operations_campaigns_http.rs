//! Admin · Public Operations · Unified Campaign Center (F-OO-14～19)

use axum::extract::{Path, Query, State};
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::routing::{delete, get, post};
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_cold_start_http;
use super::admin_rbac::{self, PERM_OFFICIAL_READ, PERM_OFFICIAL_WRITE};

#[derive(Debug, Deserialize)]
pub struct PublicOpsCampaignsQuery {
    pub campaign_kind: Option<String>,
    pub publish_status: Option<String>,
    pub limit: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct PublicOpsCreateCampaignBody {
    pub name: String,
    pub campaign_kind: String,
    pub surfaces: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct PublicOpsCreateCampaignItemBody {
    pub item_type: String,
    pub item_ref_id: Uuid,
    pub sort_order: Option<i32>,
    pub payload: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct PublicOpsCampaignPreviewQuery {
    pub surface: Option<String>,
}

fn official_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

fn service_unavailable() -> axum::response::Response {
    (
        axum::http::StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({ "status": "error", "error": "database_required" })),
    )
        .into_response()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/official/public-operations/campaigns",
            get(get_public_ops_campaigns).post(post_public_ops_campaign),
        )
        .route(
            "/api/v1/admin/official/public-operations/campaigns/kinds",
            get(get_public_ops_campaign_kinds),
        )
        .route(
            "/api/v1/admin/official/public-operations/campaigns/:id",
            get(get_public_ops_campaign),
        )
        .route(
            "/api/v1/admin/official/public-operations/campaigns/:id/preview",
            get(get_public_ops_campaign_preview),
        )
        .route(
            "/api/v1/admin/official/public-operations/campaigns/:id/submit-review",
            post(post_public_ops_campaign_submit_review),
        )
        .route(
            "/api/v1/admin/official/public-operations/campaigns/:id/request-deploy",
            post(post_public_ops_campaign_request_deploy),
        )
        .route(
            "/api/v1/admin/official/public-operations/campaigns/:id/deploy",
            post(post_public_ops_campaign_deploy),
        )
        .route(
            "/api/v1/admin/official/public-operations/campaigns/:id/rollback",
            post(post_public_ops_campaign_rollback),
        )
        .route(
            "/api/v1/admin/official/public-operations/campaigns/:id/items",
            post(post_public_ops_campaign_item),
        )
        .route(
            "/api/v1/admin/official/public-operations/campaigns/:campaign_id/items/:item_id",
            delete(delete_public_ops_campaign_item),
        )
}

pub async fn get_public_ops_campaign_kinds(
    State(_state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&_state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let kinds: Vec<Value> = db::PUBLIC_OPS_CAMPAIGN_KINDS
        .iter()
        .map(|k| {
            json!({
                "id": k,
                "feature_id": db::campaign_kind_feature_id(k),
                "default_surfaces": db::default_surfaces_for_campaign_kind(k),
            })
        })
        .collect();
    Json(json!({ "status": "ok", "kinds": kinds })).into_response()
}

pub async fn get_public_ops_campaigns(
    State(state): State<ApiMetaState>,
    Query(q): Query<PublicOpsCampaignsQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let kind = q
        .campaign_kind
        .as_deref()
        .and_then(db::normalize_public_ops_campaign_kind);
    if q.campaign_kind.as_deref().is_some_and(|s| !s.is_empty()) && kind.is_none() {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "invalid_campaign_kind" })),
        )
            .into_response();
    }
    match db::list_cold_start_campaigns_admin(
        pool,
        q.publish_status.as_deref().filter(|s| !s.is_empty()),
        kind.as_deref(),
        q.limit.unwrap_or(50),
    )
    .await
    {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => admin_cold_start_http::db_err("public_ops_campaigns_list_failed", e),
    }
}

pub async fn get_public_ops_campaign(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    admin_cold_start_http::get_admin_cold_start_campaign(State(state), Path(id), headers).await
}

pub async fn post_public_ops_campaign(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<PublicOpsCreateCampaignBody>,
) -> impl IntoResponse {
    let Some(campaign_kind) = db::normalize_public_ops_campaign_kind(&body.campaign_kind) else {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "invalid_campaign_kind" })),
        )
            .into_response();
    };
    let surfaces = body.surfaces.unwrap_or_default();
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
            surfaces,
            campaign_kind,
        },
        req_id,
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err(code)) => admin_cold_start_http::official_err(code).into_response(),
        Err(e) => admin_cold_start_http::db_err("public_ops_campaign_create_failed", e),
    }
}

pub async fn post_public_ops_campaign_item(
    State(state): State<ApiMetaState>,
    Path(campaign_id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<PublicOpsCreateCampaignItemBody>,
) -> impl IntoResponse {
    admin_cold_start_http::post_admin_cold_start_campaign_item(
        State(state),
        Path(campaign_id),
        headers,
        Json(admin_cold_start_http::AdminCreateColdStartItemBody {
            item_type: body.item_type,
            item_ref_id: body.item_ref_id,
            sort_order: body.sort_order,
            payload: body.payload,
        }),
    )
    .await
}

pub async fn delete_public_ops_campaign_item(
    State(state): State<ApiMetaState>,
    Path((campaign_id, item_id)): Path<(Uuid, Uuid)>,
    headers: HeaderMap,
) -> impl IntoResponse {
    admin_cold_start_http::delete_admin_cold_start_campaign_item(
        State(state),
        Path((campaign_id, item_id)),
        headers,
    )
    .await
}

pub async fn post_public_ops_campaign_submit_review(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    admin_cold_start_http::post_admin_cold_start_campaign_submit_review(
        State(state),
        Path(id),
        headers,
    )
    .await
}

pub async fn post_public_ops_campaign_request_deploy(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<admin_cold_start_http::AdminColdStartDeployBody>,
) -> impl IntoResponse {
    admin_cold_start_http::post_admin_cold_start_campaign_request_deploy(
        State(state),
        Path(id),
        headers,
        Json(body),
    )
    .await
}

pub async fn post_public_ops_campaign_deploy(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    admin_cold_start_http::post_admin_cold_start_campaign_deploy(State(state), Path(id), headers).await
}

pub async fn post_public_ops_campaign_rollback(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
) -> impl IntoResponse {
    admin_cold_start_http::post_admin_cold_start_campaign_rollback(
        State(state),
        Path(id),
        headers,
    )
    .await
}

pub async fn get_public_ops_campaign_preview(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    Query(q): Query<PublicOpsCampaignPreviewQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_OFFICIAL_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = official_pool(&state) else {
        return service_unavailable();
    };
    let surface = q
        .surface
        .as_deref()
        .filter(|s| !s.is_empty())
        .unwrap_or("market_feed");
    match db::preview_public_ops_campaign(pool, id, surface).await {
        Ok(Some(preview)) => Json(json!({ "status": "ok", "preview": preview })).into_response(),
        Ok(None) => (
            axum::http::StatusCode::NOT_FOUND,
            Json(json!({ "status": "error", "error": "not_found" })),
        )
            .into_response(),
        Err(e) => admin_cold_start_http::db_err("public_ops_campaign_preview_failed", e),
    }
}
