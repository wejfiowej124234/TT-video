//! chain_off 单测：评价 list/submit、证据 list/post（48 §14.3 按域拆分）

use super::{
    evidence_list_impl, evidence_post_impl, review_submit_impl, reviews_list_impl, ChainOffConfig,
    ChainOffState, ChainOffStore, EvidencePostBody, GuideRow, OrderRow, SubmitReviewBody, UserRow,
};
use axum::Json;
use chrono::Utc;
use std::sync::Arc;
use tokio::sync::RwLock;
use traveltrust_core::OrderState;
use uuid::Uuid;

#[tokio::test]
async fn p21_reviews_list_submit() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let tourist_created = now - chrono::Duration::days(400);
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
            created_at: tourist_created,
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
            amount: "400".to_string(),
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
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let Ok(Json(list_json)) = reviews_list_impl(state.clone(), order_id).await else {
        panic!("reviews_list");
    };
    assert_eq!(list_json["items"].as_array().unwrap().len(), 0);

    let Ok(Json(submit_json)) = review_submit_impl(
        state.clone(),
        order_id,
        tourist_id,
        Json(SubmitReviewBody {
            score: 5,
            comment: Some("great".to_string()),
        }),
    )
    .await
    else {
        panic!("review_submit");
    };
    assert_eq!(submit_json["review"]["score"], 5);
    assert_eq!(
        submit_json["review"]["tourist_id"].as_str().unwrap(),
        tourist_id.to_string()
    );
    assert_eq!(
        submit_json["review"]["traveler_id"].as_str().unwrap(),
        tourist_id.to_string()
    );
    let bd = &submit_json["review"]["weight_breakdown"];
    assert_eq!(bd["rule_version"], "review_weight_v1");
    assert!(bd["account_age_days"].as_u64().unwrap_or(0) >= 400);
    let w = submit_json["review"]["weight"].as_f64().unwrap();
    assert!(w > 0.21, "reviewer account age should raise weight above fresh-account minimum (~0.2 for amount=400)");

    let Ok(Json(list2)) = reviews_list_impl(state.clone(), order_id).await else {
        panic!("reviews_list after submit");
    };
    assert_eq!(list2["items"].as_array().unwrap().len(), 1);
    let item0 = &list2["items"][0];
    assert_eq!(
        item0["tourist_id"].as_str().unwrap(),
        tourist_id.to_string()
    );
    assert_eq!(
        item0["traveler_id"].as_str().unwrap(),
        tourist_id.to_string()
    );
    assert_eq!(
        list2["meta"]["review_weight_rule_version"],
        "review_weight_v1"
    );
}

#[tokio::test]
async fn p21_review_low_score_requires_comment() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let tourist_id = Uuid::new_v4();
    let guide_id = Uuid::new_v4();
    for (id, email, role) in [
        (tourist_id, "t2@test.com", "tourist"),
        (guide_id, "g2@test.com", "guide"),
    ] {
        store.users.insert(
            id,
            UserRow {
                id,
                email: email.to_string(),
                password_hash: None,
                role: role.to_string(),
                kyc_status: "none".to_string(),
                nickname: None,
                avatar_url: None,
                default_wallet_address: None,
                created_at: now,
                updated_at: now,
            },
        );
    }
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
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };

    let err_short = review_submit_impl(
        state.clone(),
        order_id,
        tourist_id,
        Json(SubmitReviewBody {
            score: 1,
            comment: Some("short".to_string()),
        }),
    )
    .await;
    assert!(err_short.is_err());

    let Ok(Json(ok)) = review_submit_impl(
        state.clone(),
        order_id,
        tourist_id,
        Json(SubmitReviewBody {
            score: 1,
            comment: Some("x".repeat(20)),
        }),
    )
    .await
    else {
        panic!("review_submit low score with long comment");
    };
    assert_eq!(ok["review"]["score"], 1);
}

#[tokio::test]
async fn p21_evidence_list_post() {
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
    let guide_id = Uuid::new_v4();
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
    let order_id = Uuid::new_v4();
    store.orders.insert(
        order_id,
        OrderRow {
            id: order_id,
            tourist_id: user_id,
            guide_id,
            amount: "200".to_string(),
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
        },
    );
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let Ok(Json(list_json)) = evidence_list_impl(state.clone(), order_id).await else {
        panic!("evidence_list");
    };
    assert_eq!(list_json["items"].as_array().unwrap().len(), 0);
    let tid = user_id.to_string();
    assert_eq!(list_json["tourist_id"], tid);
    assert_eq!(list_json["traveler_id"], tid);

    let Ok(Json(post_json)) = evidence_post_impl(
        state.clone(),
        order_id,
        user_id,
        Json(EvidencePostBody {
            content_hash: "abc123".to_string(),
            schema_version: None,
            prompt_version: None,
            snapshot_hash: None,
            quote_hash: None,
            quote_canonical: None,
        }),
    )
    .await
    else {
        panic!("evidence_post");
    };
    assert_eq!(post_json["receipt"]["content_hash"], "abc123");
    assert_eq!(post_json["receipt"]["tourist_id"], tid);
    assert_eq!(post_json["receipt"]["traveler_id"], tid);

    let Ok(Json(list2)) = evidence_list_impl(state.clone(), order_id).await else {
        panic!("evidence_list after post");
    };
    assert_eq!(list2["items"].as_array().unwrap().len(), 1);
    assert_eq!(list2["items"][0]["content_hash"], "abc123");
    assert_eq!(list2["tourist_id"], tid);
    assert_eq!(list2["traveler_id"], tid);
}
