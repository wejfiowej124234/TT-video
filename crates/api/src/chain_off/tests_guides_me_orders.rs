//! chain_off 单测：向导、me、订单创建/接单/mock_pay/确认完成/取消（48 §14.3 按域拆分）

use super::{
    get_me_impl, guide_create_impl, guide_get_impl, guide_stake_impl, guides_list_impl,
    order_accept_impl, order_cancel_impl, order_confirm_completion_impl, order_create_impl,
    order_mock_pay_impl, put_me_impl, ChainOffConfig, ChainOffState, ChainOffStore,
    CreateGuideBody, CreateOrderBody, DisputeRow, GuideRow, OrderListPage, OrderRow, PutMeBody,
    ReviewRow, StakeBody, UserRow,
};
use axum::http::StatusCode;
use axum::Json;
use chrono::Utc;
use std::sync::Arc;
use tokio::sync::RwLock;
use traveltrust_core::OrderState;
use uuid::Uuid;

// ---------- P21 chain_off 单测补全：向导、me、订单生命周期 ----------
#[tokio::test]
async fn p21_guides_create_list_get_stake() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let user_id = Uuid::new_v4();
    store.users.insert(
        user_id,
        UserRow {
            id: user_id,
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
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let create_res = guide_create_impl(
        state.clone(),
        user_id,
        Json(CreateGuideBody {
            city: "Hangzhou".to_string(),
            country_code: Some("CN".to_string()),
            languages: Some(vec!["zh".to_string()]),
            service_types: Some(vec!["walking".to_string()]),
            bio: Some("test guide".to_string()),
            wallet_address: None,
            real_name: None,
            passport_number: None,
            id_photo_url: None,
            language_cert_url: None,
            guide_license_url: None,
        }),
    )
    .await;
    let Ok(Json(create_json)) = create_res else {
        panic!("guide_create should succeed");
    };
    let guide_id = Uuid::parse_str(create_json["guide"]["id"].as_str().unwrap()).unwrap();
    assert_eq!(create_json["guide"]["status"], "pending");

    let Ok(Json(list_json)) =
        guides_list_impl(state.clone(), None, None, None, None, OrderListPage::default()).await
    else {
        panic!("guides_list");
    };
    let items = list_json["items"].as_array().unwrap();
    assert!(items.is_empty()); // pending not in list

    let stake_res = guide_stake_impl(
        state.clone(),
        guide_id,
        Json(StakeBody {
            amount: "100".to_string(),
        }),
    )
    .await;
    let Ok(Json(stake_json)) = stake_res else {
        panic!("guide_stake should succeed");
    };
    assert_eq!(stake_json["stake_amount"], "100");

    let Ok(Json(list2)) = guides_list_impl(
        state.clone(),
        Some("Hangzhou".to_string()),
        None,
        None,
        None,
        OrderListPage::default(),
    )
    .await
    else {
        panic!("guides_list filtered");
    };
    assert_eq!(list2["items"].as_array().unwrap().len(), 1);
    let Ok(Json(get_json)) = guide_get_impl(state.clone(), guide_id).await else {
        panic!("guide_get");
    };
    assert_eq!(get_json["guide"]["city"], "Hangzhou");
    assert_eq!(get_json["guide"]["stake_amount"], "100");
}

#[tokio::test]
async fn guide_create_impl_rejects_disallowed_country_code() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let user_id = Uuid::new_v4();
    store.users.insert(
        user_id,
        UserRow {
            id: user_id,
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
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let res = guide_create_impl(
        state,
        user_id,
        Json(CreateGuideBody {
            city: "Berlin".to_string(),
            country_code: Some("DE".to_string()),
            languages: Some(vec!["de".to_string()]),
            service_types: Some(vec!["walking".to_string()]),
            bio: Some("x".to_string()),
            wallet_address: None,
            real_name: None,
            passport_number: None,
            id_photo_url: None,
            language_cert_url: None,
            guide_license_url: None,
        }),
    )
    .await;
    let Err((status, Json(json))) = res else {
        panic!("expected 400");
    };
    assert_eq!(status.as_u16(), 400);
    assert_eq!(json["error"], "invalid_country_code");
}

#[tokio::test]
async fn guide_create_impl_requires_country_code() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let user_id = Uuid::new_v4();
    store.users.insert(
        user_id,
        UserRow {
            id: user_id,
            email: "g3@test.com".to_string(),
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
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let res = guide_create_impl(
        state,
        user_id,
        Json(CreateGuideBody {
            city: "Hangzhou".to_string(),
            country_code: None,
            languages: Some(vec!["zh".to_string()]),
            service_types: Some(vec!["walking".to_string()]),
            bio: Some("x".to_string()),
            wallet_address: None,
            real_name: None,
            passport_number: None,
            id_photo_url: None,
            language_cert_url: None,
            guide_license_url: None,
        }),
    )
    .await;
    let Err((status, Json(json))) = res else {
        panic!("expected 400");
    };
    assert_eq!(status.as_u16(), 400);
    assert_eq!(json["error"], "invalid_country_code");
}

#[tokio::test]
async fn p21_get_me_put_me() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let user_id = Uuid::new_v4();
    store.users.insert(
        user_id,
        UserRow {
            id: user_id,
            email: "u@test.com".to_string(),
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
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let Ok(Json(me_json)) = get_me_impl(state.clone(), user_id).await else {
        panic!("get_me");
    };
    assert_eq!(me_json["user"]["email"], "u@test.com");
    assert_eq!(me_json["user"]["role"], "tourist");
    assert_eq!(me_json["user"]["role_traveltrust"], "traveler");
    assert_eq!(me_json["trust"]["kyc_status"], "none");
    assert_eq!(me_json["trust"]["wallet_linked"], false);
    assert!(me_json["trust"]["guide_registration_status"].is_null());
    assert_eq!(me_json["trust"]["identity_status"], "active");
    assert_eq!(me_json["trust"]["risk_level"], "low");
    assert_eq!(me_json["trust"]["risk_basis"], "open_disputes_as_party:0");
    assert!(me_json["stats"]["orders_total"].as_u64().unwrap() == 0);

    let Ok(Json(put_json)) = put_me_impl(
        state.clone(),
        user_id,
        Json(PutMeBody {
            nickname: Some("Alice".to_string()),
            avatar_url: None,
            default_wallet_address: None,
            settings_preferences: None,
        }),
    )
    .await
    else {
        panic!("put_me");
    };
    assert_eq!(put_json["user"]["nickname"], "Alice");
    let prefs = serde_json::json!({
        "notification": { "emailDigest": true, "push": false },
        "communityVisibility": "followers",
        "updatedAt": "2026-06-02T00:00:00Z"
    });
    let Ok(Json(put_prefs)) = put_me_impl(
        state.clone(),
        user_id,
        Json(PutMeBody {
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            settings_preferences: Some(prefs.clone()),
        }),
    )
    .await
    else {
        panic!("put_me settings_preferences");
    };
    assert_eq!(put_prefs["user"]["settings_preferences"], prefs);
    assert_eq!(put_json["user"]["role_traveltrust"], "traveler");
    let Ok(Json(me2)) = get_me_impl(state.clone(), user_id).await else {
        panic!("get_me after put");
    };
    assert_eq!(me2["user"]["nickname"], "Alice");
}

#[tokio::test]
async fn p22_chain_off_verify_email_and_resend() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let user_id = Uuid::new_v4();
    let session_token = format!("bearer_{}", user_id);
    store.users.insert(
        user_id,
        UserRow {
            id: user_id,
            email: "verify@test.com".to_string(),
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
    store.sessions.insert(session_token.clone(), user_id);
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let mut headers = axum::http::HeaderMap::new();
    headers.insert(
        axum::http::header::AUTHORIZATION,
        format!("Bearer {}", session_token).parse().unwrap(),
    );
    let Ok(Json(resend)) = super::auth::auth_resend_verification_email(state.clone(), headers.clone()).await
    else {
        panic!("resend_verification_email");
    };
    let dev_token = resend["email_verification_dev_token"]
        .as_str()
        .expect("dev token");
    let Ok(Json(verify)) = super::auth::auth_verify_email_stub(
        state.clone(),
        Json(serde_json::json!({ "token": dev_token })),
    )
    .await
    else {
        panic!("verify_email");
    };
    assert_eq!(verify["message"], "email_verified");
    let Ok(Json(me)) = super::me::get_me_impl(state.clone(), user_id).await else {
        panic!("get_me after verify");
    };
    assert!(me["user"]["email_verified_at"].is_string());
}

#[tokio::test]
async fn p21_order_create_accept_mock_pay_confirm() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let tourist_id = Uuid::new_v4();
    let guide_id = Uuid::new_v4();
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
    let guide_row_id = Uuid::new_v4();
    store.guides.insert(
        guide_row_id,
        GuideRow {
            id: guide_row_id,
            user_id: guide_id,
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
            stake_amount: "100".to_string(),
            status: "active".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            created_at: now,
            updated_at: now,
            data_origin: "production".into(),
        },
    );
    store.guides_by_user.insert(guide_id, guide_row_id);

    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };

    let Ok(Json(create_json)) = order_create_impl(
        state.clone(),
        tourist_id,
        Json(CreateOrderBody {
            guide_id: guide_row_id,
            amount: "500".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            start_date: None,
            end_date: None,
        }),
    )
    .await
    else {
        panic!("order_create");
    };
    let order_id = Uuid::parse_str(create_json["order"]["id"].as_str().unwrap()).unwrap();
    assert_eq!(create_json["order"]["status"], "created");

    let Ok(Json(accept_json)) = order_accept_impl(state.clone(), None, order_id, guide_id).await
    else {
        panic!("order_accept");
    };
    assert_eq!(accept_json["order"]["status"], "accepted");

    let Ok(Json(pay_json)) = order_mock_pay_impl(state.clone(), order_id, tourist_id).await else {
        panic!("order_mock_pay");
    };
    assert_eq!(pay_json["order"]["status"], "escrowed");

    let Ok(Json(confirm_json)) =
        order_confirm_completion_impl(state.clone(), order_id, guide_id).await
    else {
        panic!("order_confirm_completion");
    };
    assert_eq!(confirm_json["order"]["status"], "completed");

    let Ok(Json(me_guide)) = get_me_impl(state.clone(), guide_id).await else {
        panic!("get_me guide");
    };
    assert_eq!(me_guide["user"]["role"], "guide");
    assert_eq!(me_guide["user"]["role_traveltrust"], "guide");
    assert_eq!(me_guide["trust"]["guide_registration_status"], "active");
    assert_eq!(me_guide["trust"]["wallet_linked"], false);
    assert_eq!(me_guide["trust"]["identity_status"], "active");
    assert_eq!(me_guide["trust"]["risk_level"], "low");
    assert_eq!(me_guide["trust"]["risk_basis"], "open_disputes_as_party:0");
}

/// 90 / 53：`guides.status=pending` 时接单 **403** `trust_guide_pending_review`
#[tokio::test]
async fn order_accept_forbidden_when_guide_pending_review() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    store.users.insert(
        tourist_id,
        UserRow {
            id: tourist_id,
            email: "t_pend@test.com".to_string(),
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
        guide_user_id,
        UserRow {
            id: guide_user_id,
            email: "g_pend@test.com".to_string(),
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
            stake_amount: "100".to_string(),
            status: "pending".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            created_at: now,
            updated_at: now,
            data_origin: "production".into(),
        },
    );
    store.guides_by_user.insert(guide_user_id, guide_row_id);
    let order_id = Uuid::new_v4();
    store.orders.insert(
        order_id,
        OrderRow {
            id: order_id,
            tourist_id,
            guide_id: guide_row_id,
            amount: "100".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            state: OrderState::Created,
            created_at: now,
            accepted_at: None,
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
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let Err((status, Json(err))) = order_accept_impl(state, None, order_id, guide_user_id).await
    else {
        panic!("expected accept forbidden");
    };
    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(err["error"], "trust_guide_pending_review");
}

/// 90：`open_disputes_as_party`≥4 → **403** `trust_risk_too_high`
#[tokio::test]
async fn order_accept_forbidden_when_trust_risk_high() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let guide_user_id = Uuid::new_v4();
    store.users.insert(
        guide_user_id,
        UserRow {
            id: guide_user_id,
            email: "g_risk@test.com".to_string(),
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
            stake_amount: "100".to_string(),
            status: "active".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            created_at: now,
            updated_at: now,
            data_origin: "production".into(),
        },
    );
    store.guides_by_user.insert(guide_user_id, guide_row_id);
    for i in 0..4u8 {
        let tid = Uuid::new_v4();
        store.users.insert(
            tid,
            UserRow {
                id: tid,
                email: format!("t{i}_risk@test.com"),
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
        let oid = Uuid::new_v4();
        store.orders.insert(
            oid,
            OrderRow {
                id: oid,
                tourist_id: tid,
                guide_id: guide_row_id,
                amount: "10".to_string(),
                currency: "USD".to_string(),
                escrow_address: None,
                state: OrderState::Disputed,
                created_at: now,
                accepted_at: None,
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
        let did = Uuid::new_v4();
        store.disputes.insert(
            did,
            DisputeRow {
                id: did,
                order_id: oid,
                status: "open".to_string(),
                evidence_hashes: vec![],
                arbitrator_id: None,
                refund_ratio: None,
                slash_guide: None,
                resolved_at: None,
                created_at: now,
                updated_at: now,
                arb_fee_paid: None,
                dispute_sequence: u32::from(i) + 1,
            },
        );
        store.disputes_by_order.insert(oid, did);
    }
    let fresh_tourist = Uuid::new_v4();
    store.users.insert(
        fresh_tourist,
        UserRow {
            id: fresh_tourist,
            email: "t_new@test.com".to_string(),
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
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let Ok(Json(create_json)) = order_create_impl(
        state.clone(),
        fresh_tourist,
        Json(CreateOrderBody {
            guide_id: guide_row_id,
            amount: "50".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            start_date: None,
            end_date: None,
        }),
    )
    .await
    else {
        panic!("order_create");
    };
    let order_id = Uuid::parse_str(create_json["order"]["id"].as_str().unwrap()).unwrap();
    let Err((status, Json(err))) = order_accept_impl(state, None, order_id, guide_user_id).await
    else {
        panic!("expected accept forbidden");
    };
    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(err["error"], "trust_risk_too_high");
}

/// 90 §四.1：游客 KYC **`pending`** → **403** `trust_verification_pending`（**POST /api/v1/orders**）
#[tokio::test]
async fn order_create_forbidden_when_tourist_kyc_pending() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    store.users.insert(
        tourist_id,
        UserRow {
            id: tourist_id,
            email: "t_kyc_pend@test.com".to_string(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "pending".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            created_at: now,
            updated_at: now,
        },
    );
    store.users.insert(
        guide_user_id,
        UserRow {
            id: guide_user_id,
            email: "g_ok@test.com".to_string(),
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
            stake_amount: "100".to_string(),
            status: "active".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            created_at: now,
            updated_at: now,
            data_origin: "production".into(),
        },
    );
    store.guides_by_user.insert(guide_user_id, guide_row_id);
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let Err((status, Json(err))) = order_create_impl(
        state,
        tourist_id,
        Json(CreateOrderBody {
            guide_id: guide_row_id,
            amount: "10".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            start_date: None,
            end_date: None,
        }),
    )
    .await
    else {
        panic!("expected create forbidden");
    };
    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(err["error"], "trust_verification_pending");
}

/// 90：游客侧未决争议 ≥4 → **403** `trust_risk_too_high`（**POST /api/v1/orders**）
#[tokio::test]
async fn order_create_forbidden_when_tourist_risk_high() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    store.users.insert(
        tourist_id,
        UserRow {
            id: tourist_id,
            email: "t_risk_create@test.com".to_string(),
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
        guide_user_id,
        UserRow {
            id: guide_user_id,
            email: "g_risk_create@test.com".to_string(),
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
            stake_amount: "100".to_string(),
            status: "active".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            created_at: now,
            updated_at: now,
            data_origin: "production".into(),
        },
    );
    store.guides_by_user.insert(guide_user_id, guide_row_id);
    for i in 0..4u8 {
        let oid = Uuid::new_v4();
        store.orders.insert(
            oid,
            OrderRow {
                id: oid,
                tourist_id,
                guide_id: guide_row_id,
                amount: "1".to_string(),
                currency: "USD".to_string(),
                escrow_address: None,
                state: OrderState::Disputed,
                created_at: now,
                accepted_at: None,
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
        let did = Uuid::new_v4();
        store.disputes.insert(
            did,
            DisputeRow {
                id: did,
                order_id: oid,
                status: "open".to_string(),
                evidence_hashes: vec![],
                arbitrator_id: None,
                refund_ratio: None,
                slash_guide: None,
                resolved_at: None,
                created_at: now,
                updated_at: now,
                arb_fee_paid: None,
                dispute_sequence: u32::from(i) + 1,
            },
        );
        store.disputes_by_order.insert(oid, did);
    }
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let Err((status, Json(err))) = order_create_impl(
        state,
        tourist_id,
        Json(CreateOrderBody {
            guide_id: guide_row_id,
            amount: "10".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            start_date: None,
            end_date: None,
        }),
    )
    .await
    else {
        panic!("expected create forbidden");
    };
    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(err["error"], "trust_risk_too_high");
}

/// 90：接单后游客 KYC 变 **受限** → **mock-pay** **403** `trust_identity_restricted`
#[tokio::test]
async fn order_mock_pay_forbidden_when_tourist_becomes_restricted() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let tourist_id = Uuid::new_v4();
    let guide_id = Uuid::new_v4();
    store.users.insert(
        tourist_id,
        UserRow {
            id: tourist_id,
            email: "t_suspend_pay@test.com".to_string(),
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
            email: "g_suspend_pay@test.com".to_string(),
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
            user_id: guide_id,
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
            stake_amount: "100".to_string(),
            status: "active".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            created_at: now,
            updated_at: now,
            data_origin: "production".into(),
        },
    );
    store.guides_by_user.insert(guide_id, guide_row_id);
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let Ok(Json(create_json)) = order_create_impl(
        state.clone(),
        tourist_id,
        Json(CreateOrderBody {
            guide_id: guide_row_id,
            amount: "50".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            start_date: None,
            end_date: None,
        }),
    )
    .await
    else {
        panic!("order_create");
    };
    let order_id = Uuid::parse_str(create_json["order"]["id"].as_str().unwrap()).unwrap();
    let Ok(Json(_accept_json)) = order_accept_impl(state.clone(), None, order_id, guide_id).await
    else {
        panic!("order_accept");
    };
    {
        let mut s = state.store.write().await;
        s.users.get_mut(&tourist_id).unwrap().kyc_status = "suspended".to_string();
    }
    let Err((status, Json(err))) = order_mock_pay_impl(state, order_id, tourist_id).await else {
        panic!("expected mock_pay forbidden");
    };
    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(err["error"], "trust_identity_restricted");
}

#[tokio::test]
async fn p21_order_cancel_created() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let tourist_id = Uuid::new_v4();
    let guide_id = Uuid::new_v4();
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
    let guide_row_id = Uuid::new_v4();
    store.guides.insert(
        guide_row_id,
        GuideRow {
            id: guide_row_id,
            user_id: guide_id,
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
            stake_amount: "100".to_string(),
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
            guide_id: guide_row_id,
            amount: "300".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            state: OrderState::Created,
            created_at: now,
            accepted_at: None,
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
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let Ok(Json(cancel_json)) = order_cancel_impl(state.clone(), None, order_id, tourist_id).await
    else {
        panic!("order_cancel");
    };
    assert_eq!(cancel_json["order"]["status"], "cancelled");
}

/// 90：`identity_status` 随向导 `pending`；`risk_level` 随未决争议计数
#[tokio::test]
async fn p21_get_me_trust_identity_and_risk_from_store() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let user_id = Uuid::new_v4();
    store.users.insert(
        user_id,
        UserRow {
            id: user_id,
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
    let gid = Uuid::new_v4();
    store.guides.insert(
        gid,
        GuideRow {
            id: gid,
            user_id,
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
            status: "pending".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            created_at: now,
            updated_at: now,
            data_origin: "production".into(),
        },
    );
    store.guides_by_user.insert(user_id, gid);

    let oid = Uuid::new_v4();
    let tid = Uuid::new_v4();
    store.orders.insert(
        oid,
        OrderRow {
            id: oid,
            tourist_id: tid,
            guide_id: gid,
            amount: "100".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            state: OrderState::Disputed,
            created_at: now,
            accepted_at: None,
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
    let did = Uuid::new_v4();
    store.disputes.insert(
        did,
        DisputeRow {
            id: did,
            order_id: oid,
            status: "open".to_string(),
            evidence_hashes: vec![],
            arbitrator_id: None,
            refund_ratio: None,
            slash_guide: None,
            resolved_at: None,
            created_at: now,
            updated_at: now,
            arb_fee_paid: None,
            dispute_sequence: 1,
        },
    );
    store.disputes_by_order.insert(oid, did);

    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let Ok(Json(me)) = get_me_impl(state, user_id).await else {
        panic!("get_me");
    };
    assert_eq!(me["trust"]["identity_status"], "pending_review");
    assert_eq!(me["trust"]["risk_level"], "low");
    assert_eq!(me["trust"]["risk_basis"], "open_disputes_as_party:1");
    assert_eq!(
        me["trust"]["risk_reason_codes"],
        serde_json::json!(["IDENTITY_PENDING_VERIFICATION", "OPEN_DISPUTES_PRESENT"])
    );
    assert_eq!(
        me["trust"]["recommended_actions"],
        serde_json::json!(["await_verification"])
    );
}

/// 90：`risk_level=medium` 时 `recommended_actions` 含 `enhanced_monitoring`
#[tokio::test]
async fn p21_get_me_trust_medium_risk_recommended_actions() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let user_id = Uuid::new_v4();
    store.users.insert(
        user_id,
        UserRow {
            id: user_id,
            email: "t_risk@test.com".to_string(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "verified".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            created_at: now,
            updated_at: now,
        },
    );
    for i in 0..2u8 {
        let oid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        store.orders.insert(
            oid,
            OrderRow {
                id: oid,
                tourist_id: user_id,
                guide_id: gid,
                amount: "10".to_string(),
                currency: "USD".to_string(),
                escrow_address: None,
                state: OrderState::Disputed,
                created_at: now,
                accepted_at: None,
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
        let did = Uuid::new_v4();
        store.disputes.insert(
            did,
            DisputeRow {
                id: did,
                order_id: oid,
                status: "open".to_string(),
                evidence_hashes: vec![],
                arbitrator_id: None,
                refund_ratio: None,
                slash_guide: None,
                resolved_at: None,
                created_at: now,
                updated_at: now,
                arb_fee_paid: None,
                dispute_sequence: u32::from(i) + 1,
            },
        );
        store.disputes_by_order.insert(oid, did);
    }
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let Ok(Json(me)) = get_me_impl(state, user_id).await else {
        panic!("get_me");
    };
    assert_eq!(me["trust"]["identity_status"], "active");
    assert_eq!(me["trust"]["risk_level"], "medium");
    assert_eq!(
        me["trust"]["risk_reason_codes"],
        serde_json::json!(["OPEN_DISPUTES_ELEVATED"])
    );
    assert_eq!(
        me["trust"]["recommended_actions"],
        serde_json::json!(["enhanced_monitoring"])
    );
}

/// 90：`trust.reputation.as_reviewer` 汇总当前用户已提交评价的条数与权重（与 …/reviews 同源）
#[tokio::test]
async fn get_me_reputation_as_reviewer_v2() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
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
        guide_user_id,
        UserRow {
            id: guide_user_id,
            email: "g3@test.com".to_string(),
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
    let oid = Uuid::new_v4();
    let rid = Uuid::new_v4();
    store.reviews.push(ReviewRow {
        id: rid,
        order_id: oid,
        reviewer_id: tourist_id,
        reviewee_id: guide_user_id,
        score: 5,
        weight: 0.42,
        comment: None,
        created_at: now,
    });
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let Ok(Json(me)) = get_me_impl(state, tourist_id).await else {
        panic!("get_me tourist");
    };
    assert_eq!(
        me["trust"]["reputation"]["rule_version"],
        "me_reputation_summary_v2"
    );
    assert!(me["trust"]["reputation"]["as_guide"].is_null());
    assert_eq!(
        me["trust"]["reputation"]["as_reviewer"]["reviews_written_count"],
        1
    );
    assert_eq!(
        me["trust"]["reputation"]["as_reviewer"]["sum_review_weights"],
        0.42
    );
}
