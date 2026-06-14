//! Admin · C-S3 Catalog Operations (hotel tiers · transport · media · landing ambient)

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

use super::admin_content_http::AdminVersionActionBody;
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
pub struct AdminOpsListQuery {
    pub publish_status: Option<String>,
    pub country_id: Option<Uuid>,
    pub asset_kind: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchHotelTierBody {
    pub version: i32,
    pub sort_order: Option<i32>,
    pub multiplier: Option<f64>,
    pub label_key: Option<String>,
    pub description_key: Option<String>,
    pub submit_label_zh: Option<String>,
    pub stock_image_asset_id: Option<Uuid>,
    pub clear_stock_image_asset_id: Option<bool>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchTransportRuleBody {
    pub version: i32,
    pub default_modes: Option<Vec<String>>,
    pub rail_ui_label_key: Option<String>,
    pub flight_ui_label_key: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCreateMediaAssetBody {
    pub asset_kind: String,
    pub source_type: String,
    pub url: String,
    pub source_page_url: Option<String>,
    pub license: Option<Value>,
    pub alt_text_zh: Option<String>,
    pub alt_text_en: Option<String>,
    pub stock_pool_key: Option<String>,
    pub country_id: Option<Uuid>,
    pub city_id: Option<Uuid>,
    pub poi_id: Option<Uuid>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchMediaAssetBody {
    pub version: i32,
    pub url: Option<String>,
    pub source_page_url: Option<String>,
    pub license: Option<Value>,
    pub alt_text_zh: Option<String>,
    pub alt_text_en: Option<String>,
    pub stock_pool_key: Option<String>,
    pub country_id: Option<Uuid>,
    pub clear_country_id: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct AdminPatchLandingAmbientBody {
    pub version: i32,
    pub landing_ambient: Value,
}

async fn ops_workflow(
    state: &ApiMetaState,
    headers: &HeaderMap,
    table: &str,
    entity_type: &str,
    id: Uuid,
    body: AdminVersionActionBody,
    perm_publish: bool,
    op: &str,
    audit_prefix: &str,
) -> axum::response::Response {
    let perm = if perm_publish {
        PERM_CONTENT_PUBLISH
    } else {
        PERM_CONTENT_WRITE
    };
    let (actor_id, _) = match admin_rbac::require_admin_permission(state, headers, perm).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    let req_id = headers.get("x-request-id").and_then(|v| v.to_str().ok());
    match db::ops_entity_workflow(pool, table, entity_type, id, body.version, op, Some(actor_id), req_id).await {
        Ok(Ok(version)) => {
            write_admin_audit_log_best_effort(
                state,
                actor_id,
                req_id,
                &format!("{audit_prefix}.{op}"),
                Some(entity_type),
                Some(id.to_string().as_str()),
                json!({ "version": version }),
            )
            .await;
            Json(json!({ "status": "ok", "entity_id": id, "version": version })).into_response()
        }
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_ops_workflow_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

async fn ops_request_publish(
    state: &ApiMetaState,
    headers: &HeaderMap,
    entity_type: &str,
    id: Uuid,
    body: AdminVersionActionBody,
) -> axum::response::Response {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(state, headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match db::create_catalog_publish_approval_request(
        pool,
        actor_id,
        entity_type,
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
            "action": "catalog.entity.publish",
        }))
        .into_response(),
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_publish_request_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/admin/content/hotel-tiers", get(get_admin_hotel_tiers))
        .route("/api/v1/admin/content/hotel-tiers/:id", get(get_admin_hotel_tier).patch(patch_admin_hotel_tier))
        .route("/api/v1/admin/content/hotel-tiers/:id/submit-review", post(post_admin_hotel_tier_submit))
        .route("/api/v1/admin/content/hotel-tiers/:id/publish", post(post_admin_hotel_tier_publish))
        .route("/api/v1/admin/content/hotel-tiers/:id/archive", post(post_admin_hotel_tier_archive))
        .route(
            "/api/v1/admin/content/hotel-tiers/:id/request-publish",
            post(post_admin_hotel_tier_request_publish),
        )
        .route("/api/v1/admin/content/transport-region-rules", get(get_admin_transport_rules))
        .route(
            "/api/v1/admin/content/transport-region-rules/:id",
            get(get_admin_transport_rule).patch(patch_admin_transport_rule),
        )
        .route(
            "/api/v1/admin/content/transport-region-rules/:id/submit-review",
            post(post_admin_transport_rule_submit),
        )
        .route(
            "/api/v1/admin/content/transport-region-rules/:id/publish",
            post(post_admin_transport_rule_publish),
        )
        .route(
            "/api/v1/admin/content/transport-region-rules/:id/archive",
            post(post_admin_transport_rule_archive),
        )
        .route(
            "/api/v1/admin/content/transport-region-rules/:id/request-publish",
            post(post_admin_transport_rule_request_publish),
        )
        .route(
            "/api/v1/admin/content/media-assets",
            get(get_admin_media_assets).post(post_admin_media_asset),
        )
        .route(
            "/api/v1/admin/content/media-assets/:id",
            get(get_admin_media_asset).patch(patch_admin_media_asset),
        )
        .route(
            "/api/v1/admin/content/media-assets/:id/submit-review",
            post(post_admin_media_asset_submit),
        )
        .route("/api/v1/admin/content/media-assets/:id/publish", post(post_admin_media_asset_publish))
        .route("/api/v1/admin/content/media-assets/:id/archive", post(post_admin_media_asset_archive))
        .route(
            "/api/v1/admin/content/media-assets/:id/request-publish",
            post(post_admin_media_asset_request_publish),
        )
        .route(
            "/api/v1/admin/content/countries/:id/landing-ambient",
            get(get_admin_landing_ambient).patch(patch_admin_landing_ambient),
        )
}

pub async fn get_admin_hotel_tiers(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOpsListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    let status = q.publish_status.as_deref().filter(|s| !s.is_empty());
    match db::list_admin_catalog_hotel_tiers(pool, status).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => db_err("hotel_tiers_list_failed", e),
    }
}

pub async fn get_admin_hotel_tier(
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
    match db::get_admin_catalog_hotel_tier(pool, id).await {
        Ok(Some(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(None) => catalog_not_found().into_response(),
        Err(e) => db_err("hotel_tier_get_failed", e),
    }
}

pub async fn patch_admin_hotel_tier(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchHotelTierBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    let stock = if body.clear_stock_image_asset_id == Some(true) {
        Some(None)
    } else {
        body.stock_image_asset_id.map(Some)
    };
    match db::patch_admin_catalog_hotel_tier(
        pool,
        id,
        body.version,
        body.sort_order,
        body.multiplier,
        body.label_key.as_deref(),
        body.description_key.as_deref(),
        body.submit_label_zh.as_deref(),
        stock,
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => db_err("hotel_tier_patch_failed", e),
    }
}

macro_rules! tier_workflow {
    ($name:ident, $op:expr, $publish:expr) => {
        pub async fn $name(
            State(state): State<ApiMetaState>,
            Path(id): Path<Uuid>,
            headers: HeaderMap,
            Json(body): Json<AdminVersionActionBody>,
        ) -> impl IntoResponse {
            ops_workflow(
                &state,
                &headers,
                "catalog_hotel_tier_definitions",
                "catalog_hotel_tier_definitions",
                id,
                body,
                $publish,
                $op,
                "admin.content.hotel_tier",
            )
            .await
        }
    };
}

tier_workflow!(post_admin_hotel_tier_submit, "submit", false);
tier_workflow!(post_admin_hotel_tier_publish, "publish", true);
tier_workflow!(post_admin_hotel_tier_archive, "archive", false);

pub async fn post_admin_hotel_tier_request_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminVersionActionBody>,
) -> impl IntoResponse {
    ops_request_publish(&state, &headers, "catalog_hotel_tier_definitions", id, body).await
}

pub async fn get_admin_transport_rules(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOpsListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    let status = q.publish_status.as_deref().filter(|s| !s.is_empty());
    match db::list_admin_catalog_transport_rules(pool, status, q.country_id).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => db_err("transport_rules_list_failed", e),
    }
}

pub async fn get_admin_transport_rule(
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
    match db::get_admin_catalog_transport_rule(pool, id).await {
        Ok(Some(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(None) => catalog_not_found().into_response(),
        Err(e) => db_err("transport_rule_get_failed", e),
    }
}

pub async fn patch_admin_transport_rule(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchTransportRuleBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::patch_admin_catalog_transport_rule(
        pool,
        id,
        body.version,
        body.default_modes,
        body.rail_ui_label_key.as_deref(),
        body.flight_ui_label_key.as_deref(),
        body.notes.as_deref(),
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => db_err("transport_rule_patch_failed", e),
    }
}

macro_rules! transport_workflow {
    ($name:ident, $op:expr, $publish:expr) => {
        pub async fn $name(
            State(state): State<ApiMetaState>,
            Path(id): Path<Uuid>,
            headers: HeaderMap,
            Json(body): Json<AdminVersionActionBody>,
        ) -> impl IntoResponse {
            ops_workflow(
                &state,
                &headers,
                "catalog_transport_region_rules",
                "catalog_transport_region_rules",
                id,
                body,
                $publish,
                $op,
                "admin.content.transport_rule",
            )
            .await
        }
    };
}

transport_workflow!(post_admin_transport_rule_submit, "submit", false);
transport_workflow!(post_admin_transport_rule_publish, "publish", true);
transport_workflow!(post_admin_transport_rule_archive, "archive", false);

pub async fn post_admin_transport_rule_request_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminVersionActionBody>,
) -> impl IntoResponse {
    ops_request_publish(&state, &headers, "catalog_transport_region_rules", id, body).await
}

pub async fn get_admin_media_assets(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminOpsListQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    let status = q.publish_status.as_deref().filter(|s| !s.is_empty());
    let kind = q.asset_kind.as_deref().filter(|s| !s.is_empty());
    match db::list_admin_catalog_media_assets(pool, status, kind, q.country_id).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => db_err("media_assets_list_failed", e),
    }
}

pub async fn get_admin_media_asset(
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
    match db::get_admin_catalog_media_asset(pool, id).await {
        Ok(Some(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(None) => catalog_not_found().into_response(),
        Err(e) => db_err("media_asset_get_failed", e),
    }
}

pub async fn post_admin_media_asset(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCreateMediaAssetBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::create_admin_catalog_media_asset(
        pool,
        body.asset_kind.trim(),
        body.source_type.trim(),
        body.url.trim(),
        body.source_page_url.as_deref(),
        body.license.unwrap_or_else(|| json!({})),
        body.alt_text_zh.as_deref(),
        body.alt_text_en.as_deref(),
        body.stock_pool_key.as_deref(),
        body.country_id,
        body.city_id,
        body.poi_id,
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.media_asset.create",
                Some("catalog_media_assets"),
                Some(item.id.to_string().as_str()),
                json!({ "asset_kind": item.asset_kind }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => db_err("media_asset_create_failed", e),
    }
}

pub async fn patch_admin_media_asset(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchMediaAssetBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    let country_id = if body.clear_country_id == Some(true) {
        Some(None)
    } else {
        body.country_id.map(Some)
    };
    match db::patch_admin_catalog_media_asset(
        pool,
        id,
        body.version,
        body.url.as_deref(),
        body.source_page_url.as_deref(),
        body.license,
        body.alt_text_zh.as_deref(),
        body.alt_text_en.as_deref(),
        body.stock_pool_key.as_deref(),
        country_id,
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => db_err("media_asset_patch_failed", e),
    }
}

macro_rules! media_workflow {
    ($name:ident, $op:expr, $publish:expr) => {
        pub async fn $name(
            State(state): State<ApiMetaState>,
            Path(id): Path<Uuid>,
            headers: HeaderMap,
            Json(body): Json<AdminVersionActionBody>,
        ) -> impl IntoResponse {
            ops_workflow(
                &state,
                &headers,
                "catalog_media_assets",
                "catalog_media_assets",
                id,
                body,
                $publish,
                $op,
                "admin.content.media_asset",
            )
            .await
        }
    };
}

media_workflow!(post_admin_media_asset_submit, "submit", false);
media_workflow!(post_admin_media_asset_publish, "publish", true);
media_workflow!(post_admin_media_asset_archive, "archive", false);

pub async fn post_admin_media_asset_request_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminVersionActionBody>,
) -> impl IntoResponse {
    ops_request_publish(&state, &headers, "catalog_media_assets", id, body).await
}

pub async fn get_admin_landing_ambient(
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
    match db::get_admin_country_landing_ambient(pool, id).await {
        Ok(Some(item)) => Json(json!({ "status": "ok", "item": item })).into_response(),
        Ok(None) => catalog_not_found().into_response(),
        Err(e) => db_err("landing_ambient_get_failed", e),
    }
}

pub async fn patch_admin_landing_ambient(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchLandingAmbientBody>,
) -> impl IntoResponse {
    let (actor_id, _) =
        match admin_rbac::require_admin_permission(&state, &headers, PERM_CONTENT_WRITE).await {
            Ok(v) => v,
            Err(r) => return r,
        };
    let Some(pool) = catalog_pool(&state) else {
        return service_unavailable();
    };
    match db::patch_admin_country_landing_ambient(
        pool,
        id,
        body.version,
        body.landing_ambient,
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(item)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.landing_ambient.patch",
                Some("catalog_countries"),
                Some(id.to_string().as_str()),
                json!({ "version": item.version }),
            )
            .await;
            Json(json!({ "status": "ok", "item": item })).into_response()
        }
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => db_err("landing_ambient_patch_failed", e),
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
