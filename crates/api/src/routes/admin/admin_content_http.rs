//! Admin · C-S1 Content Center CRUD + publish queue

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
pub struct AdminContentListQuery {
    pub publish_status: Option<String>,
    pub country_id: Option<Uuid>,
    pub city_id: Option<Uuid>,
    pub poi_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCreateCountryBody {
    pub iso3166: String,
    pub name_zh: String,
    pub name_en: String,
    pub sort_order: Option<i32>,
    pub open_status: Option<String>,
    pub payload: Option<Value>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchCountryBody {
    pub version: i32,
    pub name_zh: Option<String>,
    pub name_en: Option<String>,
    pub sort_order: Option<i32>,
    pub open_status: Option<String>,
    pub payload: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCreateCityBody {
    pub country_id: Uuid,
    pub slug: String,
    pub name_zh: String,
    pub name_en: String,
    pub region_label: Option<String>,
    pub sort_order: Option<i32>,
    pub open_status: Option<String>,
    pub payload: Option<Value>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchCityBody {
    pub version: i32,
    pub name_zh: Option<String>,
    pub name_en: Option<String>,
    pub region_label: Option<String>,
    pub sort_order: Option<i32>,
    pub open_status: Option<String>,
    pub payload: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct AdminCreatePoiBody {
    pub city_id: Uuid,
    pub poi_type: String,
    pub slug: String,
    pub name_zh: String,
    pub name_en: String,
    pub description_zh: Option<String>,
    pub description_en: Option<String>,
    pub tier: Option<String>,
    pub sort_order: Option<i32>,
    pub payload: Option<Value>,
    pub legacy_value: Option<String>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchPoiBody {
    pub version: i32,
    pub name_zh: Option<String>,
    pub name_en: Option<String>,
    pub description_zh: Option<String>,
    pub description_en: Option<String>,
    pub tier: Option<String>,
    pub sort_order: Option<i32>,
    pub payload: Option<Value>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchPricingBody {
    pub version: i32,
    pub currency_code: Option<String>,
    pub per_attraction_cents: Option<i64>,
    pub per_food_cents: Option<i64>,
    pub hotel_base_per_night_cents: Option<i64>,
    pub city_transport_price: Option<Value>,
    pub intercity_price_per_person: Option<Value>,
    pub guide_levels_per_day: Option<Value>,
}

#[derive(Debug, Deserialize, Default)]
pub struct AdminPatchRouteBody {
    pub version: i32,
    pub duration_min: Option<i32>,
    pub price_ref_cents: Option<i64>,
    pub rules_json: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct AdminVersionActionBody {
    pub version: i32,
    pub reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminRevisionsQuery {
    pub entity_type: String,
    pub entity_id: Uuid,
    pub limit: Option<i64>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/content/countries",
            get(get_admin_content_countries).post(post_admin_content_country),
        )
        .route(
            "/api/v1/admin/content/countries/:id",
            patch(patch_admin_content_country),
        )
        .route(
            "/api/v1/admin/content/countries/:id/submit-review",
            post(post_admin_content_country_submit),
        )
        .route(
            "/api/v1/admin/content/countries/:id/publish",
            post(post_admin_content_country_publish),
        )
        .route(
            "/api/v1/admin/content/countries/:id/archive",
            post(post_admin_content_country_archive),
        )
        .route(
            "/api/v1/admin/content/countries/:id/request-publish",
            post(post_admin_content_country_request_publish),
        )
        .route(
            "/api/v1/admin/content/cities",
            get(get_admin_content_cities).post(post_admin_content_city),
        )
        .route(
            "/api/v1/admin/content/cities/:id",
            patch(patch_admin_content_city),
        )
        .route(
            "/api/v1/admin/content/cities/:id/submit-review",
            post(post_admin_content_city_submit),
        )
        .route(
            "/api/v1/admin/content/cities/:id/publish",
            post(post_admin_content_city_publish),
        )
        .route(
            "/api/v1/admin/content/cities/:id/archive",
            post(post_admin_content_city_archive),
        )
        .route(
            "/api/v1/admin/content/pois",
            get(get_admin_content_pois).post(post_admin_content_poi),
        )
        .route(
            "/api/v1/admin/content/pois/:id",
            patch(patch_admin_content_poi),
        )
        .route(
            "/api/v1/admin/content/pois/:id/submit-review",
            post(post_admin_content_poi_submit),
        )
        .route(
            "/api/v1/admin/content/pois/:id/publish",
            post(post_admin_content_poi_publish),
        )
        .route(
            "/api/v1/admin/content/pois/:id/archive",
            post(post_admin_content_poi_archive),
        )
        .route(
            "/api/v1/admin/content/pricing-templates",
            get(get_admin_content_pricing),
        )
        .route(
            "/api/v1/admin/content/pricing-templates/:id",
            patch(patch_admin_content_pricing),
        )
        .route(
            "/api/v1/admin/content/pricing-templates/:id/submit-review",
            post(post_admin_content_pricing_submit),
        )
        .route(
            "/api/v1/admin/content/pricing-templates/:id/publish",
            post(post_admin_content_pricing_publish),
        )
        .route(
            "/api/v1/admin/content/pricing-templates/:id/archive",
            post(post_admin_content_pricing_archive),
        )
        .route(
            "/api/v1/admin/content/pricing-templates/:id/request-publish",
            post(post_admin_content_pricing_request_publish),
        )
        .route(
            "/api/v1/admin/content/intercity-routes",
            get(get_admin_content_routes),
        )
        .route(
            "/api/v1/admin/content/intercity-routes/:id",
            patch(patch_admin_content_route),
        )
        .route(
            "/api/v1/admin/content/intercity-routes/:id/submit-review",
            post(post_admin_content_route_submit),
        )
        .route(
            "/api/v1/admin/content/intercity-routes/:id/publish",
            post(post_admin_content_route_publish),
        )
        .route(
            "/api/v1/admin/content/intercity-routes/:id/archive",
            post(post_admin_content_route_archive),
        )
        .route(
            "/api/v1/admin/content/intercity-routes/:id/request-publish",
            post(post_admin_content_route_request_publish),
        )
        .route(
            "/api/v1/admin/content/publish-queue",
            get(get_admin_content_publish_queue),
        )
        .route(
            "/api/v1/admin/content/revisions",
            get(get_admin_content_revisions),
        )
}

pub async fn get_admin_content_countries(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminContentListQuery>,
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
    let status = q.publish_status.as_deref().filter(|s| !s.is_empty());
    match db::list_admin_catalog_countries(pool, status).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_admin_list_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn post_admin_content_country(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCreateCountryBody>,
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
    let iso = body.iso3166.trim().to_uppercase();
    if iso.len() != 2 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "status": "error", "error": "invalid_iso3166" })),
        )
            .into_response();
    }
    match db::create_admin_catalog_country(
        pool,
        &iso,
        body.name_zh.trim(),
        body.name_en.trim(),
        body.sort_order.unwrap_or(0),
        body.open_status.as_deref().unwrap_or("open"),
        body.payload.unwrap_or_else(|| json!({})),
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(row) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.country.create",
                Some("catalog_countries"),
                Some(row.id.to_string().as_str()),
                json!({ "iso3166": row.iso3166 }),
            )
            .await;
            Json(json!({ "status": "ok", "item": row })).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_admin_create_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn patch_admin_content_country(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchCountryBody>,
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
    match db::patch_admin_catalog_country(
        pool,
        id,
        body.version,
        body.name_zh.as_deref(),
        body.name_en.as_deref(),
        body.sort_order,
        body.open_status.as_deref(),
        body.payload,
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(row)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.country.patch",
                Some("catalog_countries"),
                Some(id.to_string().as_str()),
                json!({ "version": row.version }),
            )
            .await;
            Json(json!({ "status": "ok", "item": row })).into_response()
        }
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_admin_patch_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

async fn country_workflow(
    state: &ApiMetaState,
    headers: &HeaderMap,
    id: Uuid,
    body: AdminVersionActionBody,
    perm_publish: bool,
    op: &str,
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
    if op == "publish" {
        match db::assert_publish_gate_for_catalog_country(pool, id).await {
            Ok(Ok(())) => {}
            Ok(Err(blocks)) => {
                return (
                    StatusCode::CONFLICT,
                    Json(json!({
                        "status": "error",
                        "error": "country_market_gate_blocked",
                        "blocks": blocks,
                    })),
                )
                    .into_response();
            }
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "status": "error",
                        "error": "country_market_gate_check_failed",
                        "message": e.to_string(),
                    })),
                )
                    .into_response();
            }
        }
    }
    let result = match op {
        "submit" => db::submit_review_catalog_country(pool, id, body.version, Some(actor_id), req_id).await,
        "publish" => db::publish_catalog_country(pool, id, body.version, Some(actor_id), req_id).await,
        "archive" => db::archive_catalog_country(pool, id, body.version, Some(actor_id), req_id).await,
        _ => unreachable!(),
    };
    match result {
        Ok(Ok(version)) => {
            write_admin_audit_log_best_effort(
                state,
                actor_id,
                req_id,
                &format!("admin.content.country.{op}"),
                Some("catalog_countries"),
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
            Json(json!({ "status": "error", "error": "catalog_admin_workflow_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn post_admin_content_country_submit(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminVersionActionBody>,
) -> impl IntoResponse {
    country_workflow(&state, &headers, id, body, false, "submit").await
}

pub async fn post_admin_content_country_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminVersionActionBody>,
) -> impl IntoResponse {
    country_workflow(&state, &headers, id, body, true, "publish").await
}

pub async fn post_admin_content_country_archive(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminVersionActionBody>,
) -> impl IntoResponse {
    country_workflow(&state, &headers, id, body, false, "archive").await
}

pub async fn post_admin_content_country_request_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminVersionActionBody>,
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
    match db::create_catalog_publish_approval_request(
        pool,
        actor_id,
        "catalog_countries",
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

pub async fn get_admin_content_cities(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminContentListQuery>,
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
    let status = q.publish_status.as_deref().filter(|s| !s.is_empty());
    match db::list_admin_catalog_cities(pool, q.country_id, status).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_admin_list_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn post_admin_content_city(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCreateCityBody>,
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
    match db::create_admin_catalog_city(
        pool,
        body.country_id,
        body.slug.trim(),
        body.name_zh.trim(),
        body.name_en.trim(),
        body.region_label.as_deref(),
        body.sort_order.unwrap_or(0),
        body.open_status.as_deref().unwrap_or("open"),
        body.payload.unwrap_or_else(|| json!({})),
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(row)) => {
            write_admin_audit_log_best_effort(
                &state,
                actor_id,
                headers.get("x-request-id").and_then(|v| v.to_str().ok()),
                "admin.content.city.create",
                Some("catalog_cities"),
                Some(row.id.to_string().as_str()),
                json!({ "name_zh": row.name_zh }),
            )
            .await;
            Json(json!({ "status": "ok", "item": row })).into_response()
        }
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_admin_create_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn patch_admin_content_city(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchCityBody>,
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
    match db::patch_admin_catalog_city(
        pool,
        id,
        body.version,
        body.name_zh.as_deref(),
        body.name_en.as_deref(),
        body.region_label.as_deref(),
        body.sort_order,
        body.open_status.as_deref(),
        body.payload,
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(row)) => Json(json!({ "status": "ok", "item": row })).into_response(),
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_admin_patch_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

async fn entity_workflow(
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
    let result = match op {
        "submit" => {
            db::submit_review_catalog_entity(pool, table, entity_type, id, body.version, Some(actor_id), req_id)
                .await
        }
        "publish" => {
            db::publish_catalog_entity(pool, table, entity_type, id, body.version, Some(actor_id), req_id).await
        }
        "archive" => {
            db::archive_catalog_entity(pool, table, entity_type, id, body.version, Some(actor_id), req_id).await
        }
        _ => unreachable!(),
    };
    match result {
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
            Json(json!({ "status": "error", "error": "catalog_admin_workflow_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

macro_rules! city_workflow_handler {
    ($name:ident, $op:expr, $publish:expr) => {
        pub async fn $name(
            State(state): State<ApiMetaState>,
            Path(id): Path<Uuid>,
            headers: HeaderMap,
            Json(body): Json<AdminVersionActionBody>,
        ) -> impl IntoResponse {
            entity_workflow(
                &state,
                &headers,
                "catalog_cities",
                "catalog_cities",
                id,
                body,
                $publish,
                $op,
                "admin.content.city",
            )
            .await
        }
    };
}

city_workflow_handler!(post_admin_content_city_submit, "submit", false);
city_workflow_handler!(post_admin_content_city_publish, "publish", true);
city_workflow_handler!(post_admin_content_city_archive, "archive", false);

pub async fn get_admin_content_pois(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminContentListQuery>,
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
    let status = q.publish_status.as_deref().filter(|s| !s.is_empty());
    let poi_type = q.poi_type.as_deref().filter(|s| !s.is_empty());
    match db::list_admin_catalog_pois(pool, q.city_id, poi_type, status).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_admin_list_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn post_admin_content_poi(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<AdminCreatePoiBody>,
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
    match db::create_admin_catalog_poi(
        pool,
        body.city_id,
        body.poi_type.trim(),
        body.slug.trim(),
        body.name_zh.trim(),
        body.name_en.trim(),
        body.description_zh.as_deref(),
        body.description_en.as_deref(),
        body.tier.as_deref(),
        body.sort_order.unwrap_or(0),
        body.payload.unwrap_or_else(|| json!({})),
        body.legacy_value.as_deref(),
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(row)) => Json(json!({ "status": "ok", "item": row })).into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_admin_create_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn patch_admin_content_poi(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchPoiBody>,
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
    match db::patch_admin_catalog_poi(
        pool,
        id,
        body.version,
        body.name_zh.as_deref(),
        body.name_en.as_deref(),
        body.description_zh.as_deref(),
        body.description_en.as_deref(),
        body.tier.as_deref(),
        body.sort_order,
        body.payload,
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(row)) => Json(json!({ "status": "ok", "item": row })).into_response(),
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_admin_patch_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

macro_rules! poi_workflow_handler {
    ($name:ident, $op:expr, $publish:expr) => {
        pub async fn $name(
            State(state): State<ApiMetaState>,
            Path(id): Path<Uuid>,
            headers: HeaderMap,
            Json(body): Json<AdminVersionActionBody>,
        ) -> impl IntoResponse {
            entity_workflow(
                &state,
                &headers,
                "catalog_pois",
                "catalog_pois",
                id,
                body,
                $publish,
                $op,
                "admin.content.poi",
            )
            .await
        }
    };
}

poi_workflow_handler!(post_admin_content_poi_submit, "submit", false);
poi_workflow_handler!(post_admin_content_poi_publish, "publish", true);
poi_workflow_handler!(post_admin_content_poi_archive, "archive", false);

pub async fn get_admin_content_pricing(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminContentListQuery>,
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
    let status = q.publish_status.as_deref().filter(|s| !s.is_empty());
    match db::list_admin_catalog_pricing(pool, status).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_admin_list_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn patch_admin_content_pricing(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchPricingBody>,
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
    match db::patch_admin_catalog_pricing(
        pool,
        id,
        body.version,
        body.currency_code.as_deref(),
        body.per_attraction_cents,
        body.per_food_cents,
        body.hotel_base_per_night_cents,
        body.city_transport_price,
        body.intercity_price_per_person,
        body.guide_levels_per_day,
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(row)) => Json(json!({ "status": "ok", "item": row })).into_response(),
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_admin_patch_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

macro_rules! pricing_workflow_handler {
    ($name:ident, $op:expr, $publish:expr) => {
        pub async fn $name(
            State(state): State<ApiMetaState>,
            Path(id): Path<Uuid>,
            headers: HeaderMap,
            Json(body): Json<AdminVersionActionBody>,
        ) -> impl IntoResponse {
            entity_workflow(
                &state,
                &headers,
                "catalog_pricing_templates",
                "catalog_pricing_templates",
                id,
                body,
                $publish,
                $op,
                "admin.content.pricing",
            )
            .await
        }
    };
}

pricing_workflow_handler!(post_admin_content_pricing_submit, "submit", false);
pricing_workflow_handler!(post_admin_content_pricing_publish, "publish", true);
pricing_workflow_handler!(post_admin_content_pricing_archive, "archive", false);

pub async fn post_admin_content_pricing_request_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminVersionActionBody>,
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
    match db::create_catalog_publish_approval_request(
        pool,
        actor_id,
        "catalog_pricing_templates",
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

pub async fn get_admin_content_routes(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminContentListQuery>,
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
    let status = q.publish_status.as_deref().filter(|s| !s.is_empty());
    match db::list_admin_catalog_routes(pool, status).await {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_admin_list_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn patch_admin_content_route(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminPatchRouteBody>,
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
    match db::patch_admin_catalog_route(
        pool,
        id,
        body.version,
        body.duration_min,
        body.price_ref_cents,
        body.rules_json,
        Some(actor_id),
        headers.get("x-request-id").and_then(|v| v.to_str().ok()),
    )
    .await
    {
        Ok(Ok(row)) => Json(json!({ "status": "ok", "item": row })).into_response(),
        Ok(Err("not_found")) => catalog_not_found().into_response(),
        Ok(Err(code)) => catalog_err(code).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_admin_patch_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

macro_rules! route_workflow_handler {
    ($name:ident, $op:expr, $publish:expr) => {
        pub async fn $name(
            State(state): State<ApiMetaState>,
            Path(id): Path<Uuid>,
            headers: HeaderMap,
            Json(body): Json<AdminVersionActionBody>,
        ) -> impl IntoResponse {
            entity_workflow(
                &state,
                &headers,
                "catalog_intercity_routes",
                "catalog_intercity_routes",
                id,
                body,
                $publish,
                $op,
                "admin.content.route",
            )
            .await
        }
    };
}

route_workflow_handler!(post_admin_content_route_submit, "submit", false);
route_workflow_handler!(post_admin_content_route_publish, "publish", true);
route_workflow_handler!(post_admin_content_route_archive, "archive", false);

pub async fn post_admin_content_route_request_publish(
    State(state): State<ApiMetaState>,
    Path(id): Path<Uuid>,
    headers: HeaderMap,
    Json(body): Json<AdminVersionActionBody>,
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
    match db::create_catalog_publish_approval_request(
        pool,
        actor_id,
        "catalog_intercity_routes",
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

pub async fn get_admin_content_publish_queue(
    State(state): State<ApiMetaState>,
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
    match db::list_admin_catalog_publish_queue(pool).await {
        Ok(items) => Json(json!({
            "status": "ok",
            "queue_key": "catalog_publish_pending",
            "count": items.len(),
            "items": items,
        }))
        .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_publish_queue_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn get_admin_content_revisions(
    State(state): State<ApiMetaState>,
    Query(q): Query<AdminRevisionsQuery>,
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
    match db::list_admin_catalog_revisions(
        pool,
        q.entity_type.trim(),
        q.entity_id,
        q.limit.unwrap_or(50).clamp(1, 200),
    )
    .await
    {
        Ok(items) => Json(json!({ "status": "ok", "count": items.len(), "items": items })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "catalog_revisions_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}
