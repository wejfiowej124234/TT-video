use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::api_json;
use crate::db;
use crate::state::ApiMetaState;

fn catalog_pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

fn db_unavailable() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(api_json::err_key_detail(
            "catalog_db_unavailable",
            "DATABASE_URL required and catalog migrations applied",
        )),
    )
}

fn ok_list<T: serde::Serialize>(items: Vec<T>) -> impl IntoResponse {
    let count = items.len();
    Json(json!({
        "status": "ok",
        "count": count,
        "items": items,
    }))
}

pub async fn get_countries(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable().into_response();
    };
    match db::list_catalog_countries(pool).await {
        Ok(items) => ok_list(items).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(api_json::err_key_detail("catalog_read_failed", e.to_string())),
        )
            .into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct CitiesQuery {
    pub country_iso: Option<String>,
}

pub async fn get_cities(
    State(state): State<ApiMetaState>,
    Query(q): Query<CitiesQuery>,
) -> impl IntoResponse {
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable().into_response();
    };
    let iso = q
        .country_iso
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_ascii_uppercase());
    match db::list_catalog_cities(pool, iso.as_deref()).await {
        Ok(items) => ok_list(items).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(api_json::err_key_detail("catalog_read_failed", e.to_string())),
        )
            .into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct PoisQuery {
    pub city_id: Option<Uuid>,
    #[serde(rename = "type")]
    pub poi_type: Option<String>,
    pub country_iso: Option<String>,
    pub city: Option<String>,
}

pub async fn get_pois(
    State(state): State<ApiMetaState>,
    Query(q): Query<PoisQuery>,
) -> impl IntoResponse {
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable().into_response();
    };
    let iso = q
        .country_iso
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_ascii_uppercase());
    let city = q.city.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let poi_type = q
        .poi_type
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    if let Some(t) = poi_type {
        if t != "attraction" && t != "food" && t != "hotel" {
            return (
                StatusCode::BAD_REQUEST,
                Json(api_json::err_key_detail(
                    "invalid_catalog_poi_type",
                    "type must be attraction|food|hotel",
                )),
            )
                .into_response();
        }
    }
    match db::list_catalog_pois(pool, q.city_id, iso.as_deref(), city, poi_type).await {
        Ok(items) => ok_list(items).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(api_json::err_key_detail("catalog_read_failed", e.to_string())),
        )
            .into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct PricingQuery {
    pub country_iso: Option<String>,
}

pub async fn get_pricing(
    State(state): State<ApiMetaState>,
    Query(q): Query<PricingQuery>,
) -> impl IntoResponse {
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable().into_response();
    };
    let iso = q
        .country_iso
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_ascii_uppercase());
    match db::list_catalog_pricing(pool, iso.as_deref()).await {
        Ok(items) => ok_list(items).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(api_json::err_key_detail("catalog_read_failed", e.to_string())),
        )
            .into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct IntercityQuery {
    pub from_city_id: Option<Uuid>,
    pub to_city_id: Option<Uuid>,
    pub from_city: Option<String>,
    pub to_city: Option<String>,
    pub country_iso: Option<String>,
}

pub async fn get_intercity_routes(
    State(state): State<ApiMetaState>,
    Query(q): Query<IntercityQuery>,
) -> impl IntoResponse {
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable().into_response();
    };
    let iso = q
        .country_iso
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_ascii_uppercase());
    let from_city = q.from_city.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let to_city = q.to_city.as_deref().map(str::trim).filter(|s| !s.is_empty());
    match db::list_catalog_intercity_routes(
        pool,
        q.from_city_id,
        q.to_city_id,
        from_city,
        to_city,
        iso.as_deref(),
    )
    .await
    {
        Ok(items) => ok_list(items).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(api_json::err_key_detail("catalog_read_failed", e.to_string())),
        )
            .into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct MediaQuery {
    pub asset_kind: Option<String>,
    pub country_iso: Option<String>,
}

pub async fn get_hotel_tiers(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable().into_response();
    };
    match db::list_catalog_hotel_tiers(pool).await {
        Ok(items) => ok_list(items).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(api_json::err_key_detail("catalog_read_failed", e.to_string())),
        )
            .into_response(),
    }
}

pub async fn get_media(
    State(state): State<ApiMetaState>,
    Query(q): Query<MediaQuery>,
) -> impl IntoResponse {
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable().into_response();
    };
    let iso = q
        .country_iso
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_ascii_uppercase());
    let kind = q
        .asset_kind
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    match db::list_catalog_media(pool, kind, iso.as_deref()).await {
        Ok(items) => ok_list(items).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(api_json::err_key_detail("catalog_read_failed", e.to_string())),
        )
            .into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct PoiImagesQuery {
    pub country_iso: Option<String>,
    pub city: Option<String>,
    #[serde(rename = "type")]
    pub poi_type: Option<String>,
}

pub async fn get_poi_images(
    State(state): State<ApiMetaState>,
    Query(q): Query<PoiImagesQuery>,
) -> impl IntoResponse {
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable().into_response();
    };
    let iso = q
        .country_iso
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(|s| s.to_ascii_uppercase());
    let city = q.city.as_deref().map(str::trim).filter(|s| !s.is_empty());
    let poi_type = q
        .poi_type
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());
    if let Some(t) = poi_type {
        if t != "attraction" && t != "food" && t != "hotel" {
            return (
                StatusCode::BAD_REQUEST,
                Json(api_json::err_key_detail(
                    "invalid_catalog_poi_type",
                    "type must be attraction|food|hotel",
                )),
            )
                .into_response();
        }
    }
    match db::list_catalog_poi_images(pool, iso.as_deref(), city, poi_type).await {
        Ok(items) => ok_list(items).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(api_json::err_key_detail("catalog_read_failed", e.to_string())),
        )
            .into_response(),
    }
}

pub async fn get_poi_image_by_id(
    State(state): State<ApiMetaState>,
    axum::extract::Path(poi_id): axum::extract::Path<Uuid>,
) -> impl IntoResponse {
    let Some(pool) = catalog_pool(&state) else {
        return db_unavailable().into_response();
    };
    match db::get_catalog_poi_image_by_id(pool, poi_id).await {
        Ok(Some(row)) => ok_list(vec![row]).into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(api_json::err_key_detail(
                "catalog_poi_image_not_found",
                "published POI image not found",
            )),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(api_json::err_key_detail("catalog_read_failed", e.to_string())),
        )
            .into_response(),
    }
}
