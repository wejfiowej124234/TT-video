//! /api/v1/itineraries（48 §2.2 routes/itineraries）、49 A POST /api/v1/itineraries/custom

use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use chrono::Utc;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::chain_off;
use crate::db::{
    insert_itinerary_custom_draft, select_itinerary_custom_draft_by_id_for_owner,
};
use crate::state::{extract_user_with_session_check, ApiMetaState};

/// POST /api/v1/itineraries：P15/17 区域① 行程生成
pub async fn itinerary_create(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<chain_off::CreateItineraryBody>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let uid =
            match extract_user_with_session_check(&state, &headers).await {
                Some(u) => u,
                None => return (
                    StatusCode::UNAUTHORIZED,
                    Json(
                        serde_json::json!({"error": "login_required", "message": "login_required"}),
                    ),
                )
                    .into_response(),
            };
        return match chain_off::itinerary_create_impl(co.clone(), uid, Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    (
        StatusCode::NOT_IMPLEMENTED,
        Json(serde_json::json!({
            "status": "not_implemented",
            "error": "not_implemented",
            "message": "not_implemented",
            "path": "POST /api/v1/itineraries",
            "note": "business layer unavailable (unexpected)"
        })),
    )
        .into_response()
}

/// POST /api/v1/itineraries/custom：49 A 自由市场自定义行程
pub async fn itinerary_custom_create(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<chain_off::CustomItineraryBody>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let uid =
            match extract_user_with_session_check(&state, &headers).await {
                Some(u) => u,
                None => return (
                    StatusCode::UNAUTHORIZED,
                    Json(
                        serde_json::json!({"error": "login_required", "message": "login_required"}),
                    ),
                )
                    .into_response(),
            };
        return match chain_off::itinerary_custom_create_impl(co.clone(), uid, Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    (
        StatusCode::NOT_IMPLEMENTED,
        Json(serde_json::json!({
            "status": "not_implemented",
            "error": "not_implemented",
            "message": "not_implemented",
            "path": "POST /api/v1/itineraries/custom",
            "note": "business layer unavailable (unexpected)"
        })),
    )
        .into_response()
}

#[derive(Debug, serde::Deserialize)]
struct CustomDraftPostBody {
    payload: Value,
}

/// POST /api/v1/itineraries/custom/drafts — 弹窗草稿持久化（49 A · D-ITN-003）
pub async fn itinerary_custom_draft_create(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<CustomDraftPostBody>,
) -> impl IntoResponse {
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "login_required", "message": "login_required"})),
            )
                .into_response();
        }
    };
    let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"error": "database_unavailable", "message": "database_unavailable"})),
        )
            .into_response();
    };
    let draft_id = Uuid::new_v4();
    let now = Utc::now();
    if let Err(e) = insert_itinerary_custom_draft(pool, draft_id, uid, &body.payload, now).await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "db_error", "message": e.to_string()})),
        )
            .into_response();
    }
    Json(json!({"status": "ok", "draft_id": draft_id.to_string()})).into_response()
}

/// GET /api/v1/itineraries/custom/drafts/:id
pub async fn itinerary_custom_draft_get(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Path(draft_id): Path<Uuid>,
) -> impl IntoResponse {
    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "login_required", "message": "login_required"})),
            )
                .into_response();
        }
    };
    let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"error": "database_unavailable", "message": "database_unavailable"})),
        )
            .into_response();
    };
    match select_itinerary_custom_draft_by_id_for_owner(pool, draft_id, uid).await {
        Ok(Some(row)) => Json(json!({
            "status": "ok",
            "draft_id": row.id.to_string(),
            "payload": row.payload,
        }))
        .into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "not_found", "message": "not_found"})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": "db_error", "message": e.to_string()})),
        )
            .into_response(),
    }
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/itineraries/custom/drafts", post(itinerary_custom_draft_create))
        .route(
            "/api/v1/itineraries/custom/drafts/:id",
            get(itinerary_custom_draft_get),
        )
        .route("/api/v1/itineraries/custom", post(itinerary_custom_create))
        .route("/api/v1/itineraries", post(itinerary_create))
}
