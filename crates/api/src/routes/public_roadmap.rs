//! Public product roadmap read API (independent from announcements / Pulse)

use axum::extract::{Query, State};
use axum::http::{HeaderMap, HeaderValue, StatusCode};
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use serde::Deserialize;
use serde_json::json;

use crate::state::ApiMetaState;

fn pool(state: &ApiMetaState) -> Option<&sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.as_ref()
}

fn public_cache_headers() -> HeaderMap {
    let mut h = HeaderMap::new();
    h.insert(
        "cache-control",
        HeaderValue::from_static("public, max-age=60, stale-while-revalidate=120"),
    );
    h.insert("x-tt-roadmap-source", HeaderValue::from_static("cms-rust"));
    h
}

#[derive(Debug, Deserialize)]
pub struct PublicRoadmapQuery {
    pub limit: Option<i64>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route("/api/v1/public/roadmap", get(get_public_roadmap))
}

pub async fn get_public_roadmap(
    State(state): State<ApiMetaState>,
    Query(q): Query<PublicRoadmapQuery>,
) -> impl IntoResponse {
    let Some(pool) = pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "catalog_db_unavailable",
                "section": null,
                "items": [],
                "source": "unavailable"
            })),
        )
            .into_response();
    };
    let limit = q.limit.unwrap_or(20);
    let section = match crate::db::get_public_roadmap_section(pool).await {
        Ok(s) => s,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "public_roadmap_section_failed",
                    "message": e.to_string()
                })),
            )
                .into_response();
        }
    };
    let items = match crate::db::list_public_roadmap_milestones(pool, limit).await {
        Ok(i) => i,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "public_roadmap_milestones_failed",
                    "message": e.to_string()
                })),
            )
                .into_response();
        }
    };
    let source = if section.is_some() || !items.is_empty() {
        "cms"
    } else {
        "cms_empty"
    };
    (
        public_cache_headers(),
        Json(json!({
            "status": "ok",
            "section": section,
            "items": items,
            "source": source
        })),
    )
        .into_response()
}
