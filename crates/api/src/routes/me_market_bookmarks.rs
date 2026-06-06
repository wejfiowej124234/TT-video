//! **F-020 · 自由市场星标**：**`GET|POST /api/v1/me/market-bookmarks`**、**`DELETE …/:target_type/:target_id`**。

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{delete, get};
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::db::{
    delete_market_travel_bookmark, insert_market_travel_bookmark_validated,
    list_market_travel_bookmark_guide_ids, list_market_travel_bookmark_order_ids,
    MarketBookmarkUpsertOutcome,
};
use crate::state::{extract_user_with_session_check, ApiMetaState};

fn login_required() -> impl IntoResponse {
    (
        StatusCode::UNAUTHORIZED,
        Json(json!({"status": "error", "error": "unauthorized", "message": "login_required"})),
    )
}

fn service_unavailable() -> impl IntoResponse {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({"status": "error", "error": "service_unavailable", "message": "service_unavailable"})),
    )
}

fn pool_from_state(state: &ApiMetaState) -> Option<sqlx::PgPool> {
    state.chain_off.as_ref()?.db_pool.clone()
}

pub async fn get_me_market_bookmarks(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Some(user_id) = extract_user_with_session_check(&state, &headers).await else {
        return login_required().into_response();
    };    let Some(pool) = pool_from_state(&state) else {
        return service_unavailable().into_response();
    };    match (
        list_market_travel_bookmark_order_ids(&pool, user_id).await,
        list_market_travel_bookmark_guide_ids(&pool, user_id).await,
    ) {
        (Ok(order_ids), Ok(guide_ids)) => Json(json!({
            "status": "ok",
            "order_ids": order_ids.iter().map(|id| id.to_string()).collect::<Vec<_>>(),
            "guide_ids": guide_ids.iter().map(|id| id.to_string()).collect::<Vec<_>>(),
        }))
        .into_response(),
        _ => service_unavailable().into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct PostMarketBookmarkBody {
    target_type: String,
    target_id: String,
}

pub async fn post_me_market_bookmarks(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<PostMarketBookmarkBody>,
) -> impl IntoResponse {
    let Some(user_id) = extract_user_with_session_check(&state, &headers).await else {
        return login_required().into_response();
    };    let Some(pool) = pool_from_state(&state) else {
        return service_unavailable().into_response();
    };    let target_type = body.target_type.trim().to_lowercase();
    if target_type != "order" && target_type != "guide" {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_target_type", "message": "invalid_target_type"})),
        )
            .into_response();
    };    let Ok(target_id) = Uuid::parse_str(body.target_id.trim()) else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_uuid", "message": "invalid_uuid"})),
        )
            .into_response();
    };    match insert_market_travel_bookmark_validated(&pool, user_id, &target_type, target_id).await {
        Ok(MarketBookmarkUpsertOutcome::Inserted | MarketBookmarkUpsertOutcome::IdempotentAlready) => {
            Json(json!({"status": "ok"})).into_response()
        }
        Ok(MarketBookmarkUpsertOutcome::TargetNotFound) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "bookmark_target_not_found", "message": "bookmark_target_not_found"})),
        )
            .into_response(),
        Err(_) => service_unavailable().into_response(),
    }
}

pub async fn delete_me_market_bookmark(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path((target_type, target_id)): Path<(String, String)>,
) -> impl IntoResponse {
    let Some(user_id) = extract_user_with_session_check(&state, &headers).await else {
        return login_required().into_response();
    };    let Some(pool) = pool_from_state(&state) else {
        return service_unavailable().into_response();
    };    let tt = target_type.trim().to_lowercase();
    if tt != "order" && tt != "guide" {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_target_type", "message": "invalid_target_type"})),
        )
            .into_response();
    };    let Ok(tid) = Uuid::parse_str(target_id.trim()) else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"status": "error", "error": "invalid_uuid", "message": "invalid_uuid"})),
        )
            .into_response();
    };    match delete_market_travel_bookmark(&pool, user_id, &tt, tid).await {
        Ok(0) => (
            StatusCode::NOT_FOUND,
            Json(json!({"status": "error", "error": "bookmark_not_found", "message": "bookmark_not_found"})),
        )
            .into_response(),
        Ok(_) => Json(json!({"status": "ok"})).into_response(),
        Err(_) => service_unavailable().into_response(),
    }
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/me/market-bookmarks",
            get(get_me_market_bookmarks).post(post_me_market_bookmarks),
        )
        .route(
            "/api/v1/me/market-bookmarks/:target_type/:target_id",
            delete(delete_me_market_bookmark),
        )
}
