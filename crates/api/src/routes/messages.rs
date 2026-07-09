//! /api/v1/orders/:id/messages（48 §2.2 routes/messages）

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::chain_off;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::not_impl_json;

pub fn router() -> axum::Router<ApiMetaState> {
    axum::Router::new().route(
        "/api/v1/orders/:id/messages",
        get(get_order_messages).post(post_order_message),
    )
}

pub async fn get_order_messages(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
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
        let Ok(oid) = Uuid::parse_str(&id) else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
            )
                .into_response();
        };
        return match chain_off::messages_list_impl(co.clone(), oid, uid).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("GET /api/v1/orders/:id/messages").into_response()
}

pub async fn post_order_message(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<chain_off::PostMessageBody>,
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
        let Ok(oid) = Uuid::parse_str(&id) else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
            )
                .into_response();
        };
        return match chain_off::message_post_impl(co.clone(), oid, uid, Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("POST /api/v1/orders/:id/messages").into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, GuideRow, OrderRow};
    use crate::state::test_support::api_meta_state;
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use chrono::{DateTime, Utc};
    use http_body_util::BodyExt;
    use std::sync::Arc;
    use tokio::sync::RwLock;
    use tower::util::ServiceExt;
    use traveltrust_core::OrderState;
    use uuid::Uuid;

    const ORDER_PATH: &str = "/api/v1/orders/00000000-0000-4000-8000-000000000001/messages";

    fn chain_off_state_empty() -> ChainOffState {
        ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: None,
        }
    }

    fn order_row(order_id: Uuid, tourist_id: Uuid, guide_id: Uuid, now: DateTime<Utc>) -> OrderRow {
        OrderRow {
            id: order_id,
            tourist_id,
            guide_id,
            amount: "1".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            state: OrderState::Accepted,
            created_at: now,
            accepted_at: Some(now),
            escrowed_at: None,
            completed_at: None,
            dispute_deadline_at: None,
            auto_complete_at: None,
            updated_at: now,
            start_date: None,
            end_date: None,
            sub_status: None,
            tourist_confirmed: None,
            guide_confirmed: None,
            rating_tourist_confirmed: None,
            rating_guide_confirmed: None,
            chain_id: None,
            data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
            ..Default::default()
            }
    }

    /// `guide_user_id` = 向导 **账户** UUID；订单 `guide_id` 存 **guides 行 id**（与 `POST /api/v1/orders` 一致）。
    fn chain_off_state_with_order(
        tourist_id: Uuid,
        guide_user_id: Uuid,
        order_id: Uuid,
    ) -> ChainOffState {
        let now = Utc::now();
        let mut store = ChainOffStore::default();
        let guide_row_id = Uuid::new_v4();
        store.guides.insert(
            guide_row_id,
            GuideRow {
                id: guide_row_id,
                user_id: guide_user_id,
                city: "HZ".to_string(),
                country_code: "CN".to_string(),
                languages: vec!["zh".to_string()],
                service_types: vec!["walking".to_string()],
                bio: None,
                wallet_address: None,
                real_name: None,
                passport_number_hash: None,
                id_photo_url: None,
                language_cert_url: None,
                guide_license_url: None,
                stake_amount: "0".to_string(),
                hourly_rate: None,
                avatar_url: None,
            public_title: None,
                status: "active".to_string(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: now,
                updated_at: now,
                data_origin: "production".into(),
                ..Default::default()
                },
        );
        store.guides_by_user.insert(guide_user_id, guide_row_id);
        store
            .orders
            .insert(order_id, order_row(order_id, tourist_id, guide_row_id, now));
        ChainOffState {
            store: Arc::new(RwLock::new(store)),
            config: ChainOffConfig::default(),
            db_pool: None,
        }
    }

    #[tokio::test]
    async fn get_order_messages_without_chain_off_returns_501_not_impl_json() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri(ORDER_PATH)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_IMPLEMENTED);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["status"], "not_implemented");
        assert_eq!(v["path"], "GET /api/v1/orders/:id/messages");
    }

    #[tokio::test]
    async fn post_order_message_without_chain_off_returns_501_not_impl_json() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(ORDER_PATH)
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"content":"hi"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_IMPLEMENTED);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["status"], "not_implemented");
        assert_eq!(v["path"], "POST /api/v1/orders/:id/messages");
    }

    #[tokio::test]
    async fn get_order_messages_with_chain_off_no_session_returns_401() {
        let app = router().with_state(api_meta_state(Some(chain_off_state_empty())));
        let res = app
            .oneshot(
                Request::builder()
                    .uri(ORDER_PATH)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "login_required");
        assert_eq!(v["message"], "login_required");
    }

    #[tokio::test]
    async fn post_order_message_with_chain_off_no_session_returns_401() {
        let app = router().with_state(api_meta_state(Some(chain_off_state_empty())));
        let res = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(ORDER_PATH)
                    .header("content-type", "application/json")
                    .body(Body::from(r#"{"content":"hi"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "login_required");
        assert_eq!(v["message"], "login_required");
    }

    #[tokio::test]
    async fn get_order_messages_invalid_order_id_returns_400() {
        let tourist = Uuid::new_v4();
        let guide = Uuid::new_v4();
        let order_id = Uuid::parse_str("00000000-0000-4000-8000-000000000001").unwrap();
        let app = router().with_state(api_meta_state(Some(chain_off_state_with_order(
            tourist, guide, order_id,
        ))));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/orders/not-a-uuid/messages")
                    .header("X-User-Id", tourist.to_string())
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "invalid_uuid");
        assert_eq!(v["message"], "invalid_uuid");
    }

    #[tokio::test]
    async fn get_order_messages_unknown_order_returns_404() {
        let tourist = Uuid::new_v4();
        let app = router().with_state(api_meta_state(Some(chain_off_state_empty())));
        let res = app
            .oneshot(
                Request::builder()
                    .uri(ORDER_PATH)
                    .header("X-User-Id", tourist.to_string())
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_FOUND);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "order_not_found");
        assert_eq!(v["message"], "order_not_found");
    }

    #[tokio::test]
    async fn get_order_messages_non_participant_returns_403() {
        let tourist = Uuid::new_v4();
        let guide = Uuid::new_v4();
        let stranger = Uuid::new_v4();
        let order_id = Uuid::parse_str("00000000-0000-4000-8000-000000000001").unwrap();
        let app = router().with_state(api_meta_state(Some(chain_off_state_with_order(
            tourist, guide, order_id,
        ))));
        let res = app
            .oneshot(
                Request::builder()
                    .uri(ORDER_PATH)
                    .header("X-User-Id", stranger.to_string())
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::FORBIDDEN);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "forbidden");
        assert_eq!(v["message"], "forbidden");
    }

    #[tokio::test]
    async fn post_order_message_invalid_order_id_returns_400() {
        let tourist = Uuid::new_v4();
        let guide = Uuid::new_v4();
        let order_id = Uuid::parse_str("00000000-0000-4000-8000-000000000001").unwrap();
        let app = router().with_state(api_meta_state(Some(chain_off_state_with_order(
            tourist, guide, order_id,
        ))));
        let res = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/orders/not-a-uuid/messages")
                    .header("content-type", "application/json")
                    .header("X-User-Id", tourist.to_string())
                    .body(Body::from(r#"{"content":"hi"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "invalid_uuid");
    }

    #[tokio::test]
    async fn post_order_message_unknown_order_returns_404() {
        let tourist = Uuid::new_v4();
        let app = router().with_state(api_meta_state(Some(chain_off_state_empty())));
        let res = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(ORDER_PATH)
                    .header("content-type", "application/json")
                    .header("X-User-Id", tourist.to_string())
                    .body(Body::from(r#"{"content":"hi"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_FOUND);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "order_not_found");
    }

    #[tokio::test]
    async fn post_order_message_non_participant_returns_403() {
        let tourist = Uuid::new_v4();
        let guide = Uuid::new_v4();
        let stranger = Uuid::new_v4();
        let order_id = Uuid::parse_str("00000000-0000-4000-8000-000000000001").unwrap();
        let app = router().with_state(api_meta_state(Some(chain_off_state_with_order(
            tourist, guide, order_id,
        ))));
        let res = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(ORDER_PATH)
                    .header("content-type", "application/json")
                    .header("X-User-Id", stranger.to_string())
                    .body(Body::from(r#"{"content":"hi"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::FORBIDDEN);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "forbidden");
    }

    #[tokio::test]
    async fn get_order_messages_participant_ok_empty_items() {
        let tourist = Uuid::new_v4();
        let guide = Uuid::new_v4();
        let order_id = Uuid::parse_str("00000000-0000-4000-8000-000000000001").unwrap();
        let app = router().with_state(api_meta_state(Some(chain_off_state_with_order(
            tourist, guide, order_id,
        ))));
        let res = app
            .oneshot(
                Request::builder()
                    .uri(ORDER_PATH)
                    .header("X-User-Id", guide.to_string())
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["status"], "ok");
        assert!(v["items"].as_array().unwrap().is_empty());
        assert_eq!(v["tourist_id"], tourist.to_string());
        assert_eq!(v["traveler_id"], tourist.to_string());
    }

    #[tokio::test]
    async fn post_then_get_order_messages_happy_path_200() {
        let tourist = Uuid::new_v4();
        let guide = Uuid::new_v4();
        let order_id = Uuid::parse_str("00000000-0000-4000-8000-000000000001").unwrap();
        let state = api_meta_state(Some(chain_off_state_with_order(tourist, guide, order_id)));
        let app = router().with_state(state);

        let res_post = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(ORDER_PATH)
                    .header("content-type", "application/json")
                    .header("X-User-Id", tourist.to_string())
                    .body(Body::from(r#"{"content":"  hello route  "}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res_post.status(), StatusCode::OK);
        let post_bytes = res_post.into_body().collect().await.unwrap().to_bytes();
        let post_json: serde_json::Value = serde_json::from_slice(&post_bytes).unwrap();
        assert_eq!(post_json["status"], "ok");
        assert_eq!(post_json["message"]["content"], "hello route");
        assert_eq!(post_json["message"]["sender_id"], tourist.to_string());
        assert_eq!(post_json["tourist_id"], tourist.to_string());
        assert_eq!(post_json["traveler_id"], tourist.to_string());

        let res_get = app
            .oneshot(
                Request::builder()
                    .uri(ORDER_PATH)
                    .header("X-User-Id", tourist.to_string())
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res_get.status(), StatusCode::OK);
        let get_bytes = res_get.into_body().collect().await.unwrap().to_bytes();
        let get_json: serde_json::Value = serde_json::from_slice(&get_bytes).unwrap();
        assert_eq!(get_json["status"], "ok");
        let items = get_json["items"].as_array().unwrap();
        assert_eq!(items.len(), 1);
        assert_eq!(items[0]["content"], "hello route");
        assert_eq!(items[0]["sender_id"], tourist.to_string());
        assert_eq!(get_json["tourist_id"], tourist.to_string());
        assert_eq!(get_json["traveler_id"], tourist.to_string());
    }

    #[tokio::test]
    async fn post_order_message_whitespace_only_content_returns_400() {
        let tourist = Uuid::new_v4();
        let guide = Uuid::new_v4();
        let order_id = Uuid::parse_str("00000000-0000-4000-8000-000000000001").unwrap();
        let app = router().with_state(api_meta_state(Some(chain_off_state_with_order(
            tourist, guide, order_id,
        ))));
        let res = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(ORDER_PATH)
                    .header("content-type", "application/json")
                    .header("X-User-Id", tourist.to_string())
                    .body(Body::from(r#"{"content":"   \t  "}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(v["error"], "content_required");
        assert_eq!(v["message"], "content_required");
    }
}
