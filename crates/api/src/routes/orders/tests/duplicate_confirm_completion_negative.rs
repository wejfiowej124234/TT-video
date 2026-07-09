//! P07 双边 service completion：须 Traveler + Guide 各确认一次；对已 Completed 订单 → **409**。

use axum::body::Body;
use axum::http::{Request, StatusCode};
use chrono::Utc;
use http_body_util::BodyExt;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower::ServiceExt;
use traveltrust_core::OrderState;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, GuideRow, OrderRow};
use crate::state::test_support::api_meta_state;

use super::super::router;

fn chain_off_state_escrowed_order(
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
        },
    );
    store.guides_by_user.insert(guide_user_id, guide_row_id);
    let mut order = OrderRow::default();
    order.id = order_id;
    order.tourist_id = tourist_id;
    order.guide_id = guide_row_id;
    order.amount = "100".to_string();
    order.currency = "USD".to_string();
    order.state = OrderState::Escrowed;
    order.created_at = now;
    order.accepted_at = Some(now);
    order.escrowed_at = Some(now);
    order.updated_at = now;
    store.orders.insert(order_id, order);
    ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    }
}

fn post_confirm_service_completion_req(order_id: Uuid, user_id: Uuid) -> Request<Body> {
    Request::builder()
        .method("POST")
        .uri(format!("/api/v1/orders/{order_id}/confirm-service-completion"))
        .header("X-User-Id", user_id.to_string())
        .body(Body::empty())
        .unwrap()
}

#[tokio::test]
async fn post_confirm_service_completion_bilateral_then_duplicate_409() {
    let tourist = Uuid::new_v4();
    let guide = Uuid::new_v4();
    let order_id = Uuid::parse_str("00000000-0000-4000-8000-0000000000b8").unwrap();
    let app = router().with_state(api_meta_state(Some(chain_off_state_escrowed_order(
        tourist, guide, order_id,
    ))));

    let res_guide = app
        .clone()
        .oneshot(post_confirm_service_completion_req(order_id, guide))
        .await
        .unwrap();
    assert_eq!(res_guide.status(), StatusCode::OK);
    let guide_body = res_guide.into_body().collect().await.unwrap().to_bytes();
    let guide_json: serde_json::Value = serde_json::from_slice(&guide_body).unwrap();
    assert_eq!(guide_json["status"], "ok");
    assert_eq!(guide_json["order"]["status"], "escrowed");
    assert_eq!(guide_json["order"]["sub_status"], "service_completion_pending");

    let res_tourist = app
        .clone()
        .oneshot(post_confirm_service_completion_req(order_id, tourist))
        .await
        .unwrap();
    assert_eq!(res_tourist.status(), StatusCode::OK);
    let tourist_body = res_tourist.into_body().collect().await.unwrap().to_bytes();
    let tourist_json: serde_json::Value = serde_json::from_slice(&tourist_body).unwrap();
    assert_eq!(tourist_json["order"]["status"], "completed");
    assert_eq!(tourist_json["order"]["sub_status"], "service_completion_confirmed");

    let res_dup = app
        .oneshot(post_confirm_service_completion_req(order_id, guide))
        .await
        .unwrap();
    assert_eq!(res_dup.status(), StatusCode::CONFLICT);
    let bytes = res_dup.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["error"], "invalid_state");
    assert_eq!(v["current"], "completed");
}
