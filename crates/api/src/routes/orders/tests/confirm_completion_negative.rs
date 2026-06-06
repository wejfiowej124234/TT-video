//! P07 错误路径 E2E：`Accepted`（未 Escrowed）时 `POST …/confirm-completion` → **409** `invalid_state`（**TT-P07-CONFIRM-COMPLETION-NOT-ESCROWED-E2E-001** / **B-439**）。

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

fn chain_off_state_accepted_order(
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
            status: "active".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            created_at: now,
            updated_at: now,
            data_origin: "production".into(),
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
        },
    );
    ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    }
}

#[tokio::test]
async fn post_confirm_completion_when_not_escrowed_returns_409_invalid_state() {
    let tourist = Uuid::new_v4();
    let guide = Uuid::new_v4();
    let order_id = Uuid::parse_str("00000000-0000-4000-8000-0000000000a7").unwrap();
    let app = router().with_state(api_meta_state(Some(chain_off_state_accepted_order(
        tourist, guide, order_id,
    ))));
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(format!("/api/v1/orders/{order_id}/confirm-completion"))
                .header("X-User-Id", guide.to_string())
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::CONFLICT);
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["error"], "invalid_state");
    assert_eq!(v["message"], "invalid_state");
    assert_eq!(v["current"], "accepted");
}
