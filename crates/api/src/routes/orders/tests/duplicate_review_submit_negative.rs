//! P07 重复 **`POST …/reviews`**：第二次 → **409** **`already_reviewed`**（**TT-P07-DUPLICATE-REVIEW-SUBMIT-E2E-001** / **B-441**）。

use axum::body::Body;
use axum::http::{Request, StatusCode};
use chrono::Utc;
use http_body_util::BodyExt;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower::ServiceExt;
use traveltrust_core::OrderState;
use uuid::Uuid;

use crate::chain_off::{
    ChainOffConfig, ChainOffState, ChainOffStore, GuideRow, OrderRow, UserRow,
};
use crate::state::test_support::api_meta_state;

use super::super::router;

fn chain_off_state_completed_order_with_users(
    tourist_id: Uuid,
    guide_user_id: Uuid,
    order_id: Uuid,
) -> ChainOffState {
    let now = Utc::now();
    let tourist_created = now - chrono::Duration::days(30);
    let mut store = ChainOffStore::default();
    store.users.insert(
        tourist_id,
        UserRow {
            id: tourist_id,
            email: "t-dup-rev@test.com".to_string(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            created_at: tourist_created,
            updated_at: now,
        },
    );
    store.users.insert(
        guide_user_id,
        UserRow {
            id: guide_user_id,
            email: "g-dup-rev@test.com".to_string(),
            password_hash: None,
            role: "guide".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            created_at: now,
            updated_at: now,
        },
    );
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
            status: "active".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.guides_by_user.insert(guide_user_id, guide_row_id);
    store.orders.insert(
        order_id,
        OrderRow {
            id: order_id,
            tourist_id,
            guide_id: guide_row_id,
            amount: "100".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            state: OrderState::Completed,
            created_at: now,
            accepted_at: Some(now),
            escrowed_at: Some(now),
            completed_at: Some(now),
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
        },
    );
    ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    }
}

fn post_reviews_json(order_id: Uuid, user_id: Uuid, body: &[u8]) -> Request<Body> {
    Request::builder()
        .method("POST")
        .uri(format!("/api/v1/orders/{order_id}/reviews"))
        .header("content-type", "application/json")
        .header("X-User-Id", user_id.to_string())
        .body(Body::from(body.to_vec()))
        .unwrap()
}

#[tokio::test]
async fn post_reviews_twice_second_returns_409_already_reviewed() {
    let tourist = Uuid::new_v4();
    let guide = Uuid::new_v4();
    let order_id = Uuid::parse_str("00000000-0000-4000-8000-0000000000c9").unwrap();
    let app = router().with_state(api_meta_state(Some(
        chain_off_state_completed_order_with_users(tourist, guide, order_id),
    )));
    let payload = br#"{"score":5,"comment":"ok"}"#;

    let res_ok = app
        .clone()
        .oneshot(post_reviews_json(order_id, tourist, payload))
        .await
        .unwrap();
    assert_eq!(res_ok.status(), StatusCode::OK);

    let res_dup = app
        .oneshot(post_reviews_json(order_id, tourist, payload))
        .await
        .unwrap();
    assert_eq!(res_dup.status(), StatusCode::CONFLICT);
    let bytes = res_dup.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["error"], "already_reviewed");
    assert_eq!(v["message"], "already_reviewed");
}
