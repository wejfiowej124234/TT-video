//! chain_off 单测：争议 open/list/get/resolve 流程（48 §14.3 按域拆分）

use super::{
    dispute_get_impl, dispute_resolve_impl, disputes_list_impl, order_open_dispute_impl,
    ChainOffConfig, ChainOffState, ChainOffStore, GuideRow, OpenDisputeBody, OrderRow,
    ResolveDisputeBody, UserRow,
};
use axum::Json;
use chrono::Utc;
use std::sync::Arc;
use tokio::sync::RwLock;
use traveltrust_core::OrderState;
use uuid::Uuid;

#[tokio::test]
async fn dispute_list_get_resolve_flow() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let tourist_id = Uuid::new_v4();
    let guide_id = Uuid::new_v4();
    let arb_id = Uuid::new_v4();
    store.users.insert(
        tourist_id,
        UserRow {
            id: tourist_id,
            email: "t@test.com".to_string(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        guide_id,
        UserRow {
            id: guide_id,
            email: "g@test.com".to_string(),
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
    store.users.insert(
        arb_id,
        UserRow {
            id: arb_id,
            email: "a@test.com".to_string(),
            password_hash: None,
            role: "arbitrator".to_string(),
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
            user_id: guide_id,
            city: "Hangzhou".to_string(),
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
            status: "active".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            created_at: now,
            updated_at: now,
            data_origin: "production".into(),
        },
    );
    store.guides_by_user.insert(guide_id, guide_row_id);
    let order_id = Uuid::new_v4();
    store.orders.insert(
        order_id,
        OrderRow {
            id: order_id,
            tourist_id,
            guide_id,
            amount: "1000".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            state: OrderState::Escrowed,
            created_at: now,
            accepted_at: Some(now),
            escrowed_at: Some(now),
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
    store.guide_slot.insert(guide_id, order_id);

    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };

    let open_res = order_open_dispute_impl(
        state.clone(),
        order_id,
        tourist_id,
        Json(OpenDisputeBody {
            reason: None,
            arb_fee_paid: None,
        }),
    )
    .await;
    let Ok(Json(open_json)) = open_res else {
        panic!("open_dispute should succeed");
    };
    let dispute_id = Uuid::parse_str(open_json["dispute"]["id"].as_str().unwrap()).unwrap();
    assert_eq!(open_json["dispute"]["status"], "open");
    let tid = tourist_id.to_string();
    assert_eq!(open_json["dispute"]["tourist_id"], tid);
    assert_eq!(open_json["dispute"]["traveler_id"], tid);

    let Json(list_json) = disputes_list_impl(state.clone()).await;
    let items = list_json["items"].as_array().expect("items");
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["status"], "open");
    assert_eq!(items[0]["tourist_id"], tid);
    assert_eq!(items[0]["traveler_id"], tid);

    let Ok(Json(get_json)) = dispute_get_impl(state.clone(), dispute_id).await else {
        panic!("dispute_get");
    };
    assert_eq!(get_json["dispute"]["status"], "open");
    assert_eq!(get_json["dispute"]["tourist_id"], tid);
    assert_eq!(get_json["dispute"]["traveler_id"], tid);

    let resolve_res = dispute_resolve_impl(
        state.clone(),
        dispute_id,
        arb_id,
        Json(ResolveDisputeBody {
            refund_ratio: 0.5,
            slash_guide: false,
        }),
    )
    .await;
    let Ok(Json(resolve_json)) = resolve_res else {
        panic!("dispute_resolve should succeed");
    };
    assert_eq!(resolve_json["dispute"]["status"], "resolved");
    assert_eq!(resolve_json["order"]["tourist_id"], tid);
    assert_eq!(resolve_json["order"]["traveler_id"], tid);

    let Ok(Json(get2)) = dispute_get_impl(state.clone(), dispute_id).await else {
        panic!("dispute_get after resolve");
    };
    assert_eq!(get2["dispute"]["status"], "resolved");
    assert!(get2["dispute"]["refund_ratio"].as_f64().unwrap() - 0.5 < 1e-9);
}

/// 49 B-T4：P47 争议费用递增 — arb_base_fee > 0 时付费不足返回 400 insufficient_arb_fee
#[tokio::test]
async fn order_open_dispute_impl_insufficient_arb_fee_returns_400() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let tourist_id = Uuid::new_v4();
    let guide_id = Uuid::new_v4();
    store.users.insert(
        tourist_id,
        UserRow {
            id: tourist_id,
            email: "t2@test.com".to_string(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        guide_id,
        UserRow {
            id: guide_id,
            email: "g2@test.com".to_string(),
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
    let order_id = Uuid::new_v4();
    store.orders.insert(
        order_id,
        OrderRow {
            id: order_id,
            tourist_id,
            guide_id,
            amount: "1000".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            state: OrderState::Escrowed,
            created_at: now,
            accepted_at: Some(now),
            escrowed_at: Some(now),
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
    let mut config = ChainOffConfig::default();
    config.arb_base_fee = 100.0;
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config,
        db_pool: None,
    };

    let res = order_open_dispute_impl(
        state.clone(),
        order_id,
        tourist_id,
        Json(OpenDisputeBody {
            reason: None,
            arb_fee_paid: Some("0".to_string()),
        }),
    )
    .await;
    let Err((status, Json(err_json))) = res else {
        panic!("expected 400 insufficient_arb_fee");
    };
    assert_eq!(status.as_u16(), 400);
    assert_eq!(err_json["error"], "insufficient_arb_fee");
    assert_eq!(err_json["dispute_sequence"], 1);
    assert_eq!(err_json["required"].as_f64().unwrap(), 100.0);

    let ok_res = order_open_dispute_impl(
        state,
        order_id,
        tourist_id,
        Json(OpenDisputeBody {
            reason: None,
            arb_fee_paid: Some("100".to_string()),
        }),
    )
    .await;
    let Ok(Json(open_json)) = ok_res else {
        panic!("open with 100 should succeed");
    };
    assert_eq!(open_json["dispute"]["status"], "open");
}
