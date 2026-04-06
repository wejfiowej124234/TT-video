//! /api/v1/disputes 与 /api/v1/orders/:id/dispute（48 §2.2 routes/disputes）

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::chain;
use crate::chain_off;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::not_impl_json;

pub fn router() -> axum::Router<ApiMetaState> {
    axum::Router::new()
        .route("/api/v1/orders/:id/dispute", post(order_open_dispute))
        .route("/api/v1/disputes", get(get_disputes))
        .route("/api/v1/disputes/:id", get(get_dispute_by_id))
        .route("/api/v1/disputes/:id/resolve", post(dispute_resolve))
}

pub async fn get_disputes(State(state): State<ApiMetaState>) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        return chain_off::disputes_list_impl(co.clone())
            .await
            .into_response();
    }
    not_impl_json("GET /api/v1/disputes").into_response()
}

pub async fn get_dispute_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let Ok(did) = Uuid::parse_str(&id) else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
            )
                .into_response();
        };
        return match chain_off::dispute_get_impl(co.clone(), did).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("GET /api/v1/disputes/:id").into_response()
}

pub async fn order_open_dispute(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
    body: Option<Json<chain_off::OpenDisputeBody>>,
) -> impl IntoResponse {
    let body = body.unwrap_or(Json(chain_off::OpenDisputeBody {
        reason: None,
        arb_fee_paid: None,
    }));
    if let Some(ref co) = state.chain_off {
        let uid = match extract_user_with_session_check(&state, &headers).await {
            Some(u) => u,
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "login_required", "message": "login_required"})),
                )
                    .into_response()
            }
        };
        let Ok(oid) = Uuid::parse_str(&id) else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
            )
                .into_response();
        };
        return match chain_off::order_open_dispute_impl(co.clone(), oid, uid, body).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("POST /api/v1/orders/:id/dispute").into_response()
}

pub async fn dispute_resolve(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<chain_off::ResolveDisputeBody>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let uid = match extract_user_with_session_check(&state, &headers).await {
            Some(u) => u,
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "login_required", "message": "login_required"})),
                )
                    .into_response()
            }
        };
        let Ok(did) = Uuid::parse_str(&id) else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
            )
                .into_response();
        };
        let refund_ratio = body.refund_ratio;
        let slash_guide = body.slash_guide;
        return match chain_off::dispute_resolve_impl(co.clone(), did, uid, Json(body)).await {
            Ok(j) => {
                if let (Some(_config), Some(ref outbox)) =
                    (&state.chain_config, &state.resolution_outbox)
                {
                    if let Some(entry) = chain_off::resolution_outbox_entry_for_dispute(
                        co,
                        did,
                        refund_ratio,
                        slash_guide,
                    )
                    .await
                    {
                        chain::outbox::push_resolution(outbox, entry).await;
                    }
                }
                j.into_response()
            }
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("POST /api/v1/disputes/:id/resolve").into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::test_support::api_meta_state;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use http_body_util::BodyExt;
    use tower::util::ServiceExt;

    #[tokio::test]
    async fn get_disputes_without_chain_off_is_501() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/disputes")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_IMPLEMENTED);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["error"], "not_implemented");
        assert_eq!(v["path"], "GET /api/v1/disputes");
    }

    #[tokio::test]
    async fn get_dispute_by_id_without_chain_off_is_501() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/disputes/00000000-0000-4000-8000-000000000099")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_IMPLEMENTED);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["error"], "not_implemented");
        assert_eq!(v["path"], "GET /api/v1/disputes/:id");
    }
}
