//! S2-API-RO · 公众只读 Catalog CMS（105 §3.2 · 109）
//! `GET /api/v1/catalog/*` — 无鉴权 · 仅 `publish_status=published`

mod handlers;

use axum::routing::get;
use axum::Router;

use crate::state::ApiMetaState;

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/catalog/countries", get(handlers::get_countries))
        .route("/api/v1/catalog/cities", get(handlers::get_cities))
        .route("/api/v1/catalog/pois", get(handlers::get_pois))
        .route("/api/v1/catalog/pricing", get(handlers::get_pricing))
        .route(
            "/api/v1/catalog/intercity-routes",
            get(handlers::get_intercity_routes),
        )
        .route("/api/v1/catalog/media", get(handlers::get_media))
        .route("/api/v1/catalog/hotel-tiers", get(handlers::get_hotel_tiers))
        .route("/api/v1/catalog/poi-images", get(handlers::get_poi_images))
        .route(
            "/api/v1/catalog/poi-images/:poi_id",
            get(handlers::get_poi_image_by_id),
        )
}

#[cfg(test)]
mod tests;
