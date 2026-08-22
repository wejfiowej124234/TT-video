//! Public CMS announcements read API

use axum::extract::{Path, Query, State};
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
    h.insert("x-tt-announcements-source", HeaderValue::from_static("cms-rust"));
    h
}

#[derive(Debug, Deserialize)]
pub struct PublicAnnouncementsQuery {
    pub lane: Option<String>,
    pub limit: Option<i64>,
    /// Homepage CMS strip: product lane + calendar window; max 3; never static.
    #[serde(default)]
    pub for_home: Option<u8>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/public/announcements", get(get_public_announcements))
        .route("/api/v1/public/announcements/pulse", get(get_public_announcements_pulse))
        .route("/api/v1/public/announcements/:slug", get(get_public_announcement_by_slug))
        // POST_PARITY M7-08: legacy/cms-named public read aliases (same handlers · no auth)
        .route("/api/v1/cms/public/announcements", get(get_public_announcements))
        .route(
            "/api/v1/cms/public/announcements/pulse",
            get(get_public_announcements_pulse),
        )
        .route(
            "/api/v1/cms/public/announcements/:slug",
            get(get_public_announcement_by_slug),
        )
}

pub async fn get_public_announcements(
    State(state): State<ApiMetaState>,
    Query(q): Query<PublicAnnouncementsQuery>,
) -> impl IntoResponse {
    let Some(pool) = pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable", "items": [], "source": "unavailable" })),
        )
            .into_response();
    };
    let for_home = matches!(q.for_home, Some(1));
    let limit = if for_home {
        q.limit.unwrap_or(3)
    } else {
        q.limit.unwrap_or(50)
    };
    match crate::db::list_public_cms_announcements_opts(
        pool,
        q.lane.as_deref(),
        false,
        for_home,
        limit,
    )
    .await
    {
        Ok(items) => {
            let source = if items.is_empty() { "cms_empty" } else { "cms" };
            (
                public_cache_headers(),
                Json(json!({
                    "status": "ok",
                    "items": items,
                    "source": source,
                    "for_home": for_home,
                })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "public_announcements_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn get_public_announcements_pulse(
    State(state): State<ApiMetaState>,
    Query(q): Query<PublicAnnouncementsQuery>,
) -> impl IntoResponse {
    let Some(pool) = pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable", "items": [], "source": "unavailable" })),
        )
            .into_response();
    };
    let limit = q.limit.unwrap_or(6);
    match crate::db::list_public_cms_announcements(pool, Some("product"), true, limit).await {
        Ok(items) => {
            let source = if items.is_empty() { "cms_empty" } else { "cms" };
            (public_cache_headers(), Json(json!({ "status": "ok", "items": items, "source": source }))).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "public_announcements_pulse_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}

pub async fn get_public_announcement_by_slug(
    State(state): State<ApiMetaState>,
    Path(slug): Path<String>,
) -> impl IntoResponse {
    let Some(pool) = pool(&state) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "status": "error", "error": "catalog_db_unavailable" })),
        )
            .into_response();
    };
    match crate::db::get_public_cms_announcement_by_slug(pool, &slug).await {
        Ok(Some(item)) => (
            public_cache_headers(),
            Json(json!({ "status": "ok", "item": item, "source": "cms" })),
        )
            .into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({ "status": "error", "error": "not_found" })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "status": "error", "error": "public_announcement_failed", "message": e.to_string() })),
        )
            .into_response(),
    }
}
