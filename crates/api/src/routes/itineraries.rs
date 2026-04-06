//! /api/v1/itineraries（48 §2.2 routes/itineraries）、49 A POST /api/v1/itineraries/custom

use axum::extract::State;
use axum::http::HeaderMap;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::post;
use axum::Json;
use axum::Router;

use crate::chain_off;
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

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/itineraries/custom", post(itinerary_custom_create))
        .route("/api/v1/itineraries", post(itinerary_create))
}
