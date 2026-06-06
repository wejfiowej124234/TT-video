//! **B-451**：**`GET`/`POST …/orders/:id/reviews`** **`meta.review_json_contract`** **（** **`schema_version`** **+** **`anchor`** **）** **机读** **，** **与** **B-449/B-450** **正交** **（** **只** **读** **根级** **`meta`** **）** **。**

use axum::body::Body;
use axum::http::{Request, StatusCode};
use chrono::Utc;
use http_body_util::BodyExt;
use serde_json::Value;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower::ServiceExt;
use traveltrust_core::OrderState;
use uuid::Uuid;

use crate::chain_off::{
    review_submit_impl, reviews_list_impl, ChainOffConfig, ChainOffState, ChainOffStore, GuideRow,
    OrderRow, SubmitReviewBody, UserRow, REVIEW_JSON_CONTRACT_ANCHOR, REVIEW_JSON_CONTRACT_SCHEMA_VERSION,
};
use crate::db::{self, upsert_order};
use crate::state::test_support::api_meta_state;
use axum::Json;

use super::super::router;
use super::review_weight_dual_path_parity_b447::{
    build_store, cleanup, pool_or_skip, B447_ORDER_AMOUNT,
};

fn assert_review_json_contract_meta(meta: &Value) {
    let o = meta.as_object().expect("B-451: meta must be object");
    let rjc = &o["review_json_contract"];
    assert!(
        rjc.is_object(),
        "B-451: meta.review_json_contract must be object, got {rjc:?}"
    );
    assert_eq!(
        rjc["schema_version"].as_u64(),
        Some(REVIEW_JSON_CONTRACT_SCHEMA_VERSION),
        "B-451: schema_version"
    );
    assert_eq!(
        rjc["anchor"].as_str(),
        Some(REVIEW_JSON_CONTRACT_ANCHOR),
        "B-451: anchor"
    );
}

async fn post_reviews_full_json(co: ChainOffState, order_id: Uuid, reviewer_user_id: Uuid) -> Value {
    let app = router().with_state(api_meta_state(Some(co)));
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(format!("/api/v1/orders/{order_id}/reviews"))
                .header("content-type", "application/json")
                .header("X-User-Id", reviewer_user_id.to_string())
                .body(Body::from(br#"{"score":5,"comment":"ok"}"#.to_vec()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK, "B-451: POST reviews must be 200");
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&bytes).expect("json body")
}

#[tokio::test]
async fn b451_post_reviews_memory_success_includes_meta_review_json_contract() {
    let anchor = Utc::now();
    let guide_reviewer_created = anchor - chrono::Duration::days(400);
    let tourist_created = anchor - chrono::Duration::days(1);

    let tourist_b = Uuid::new_v4();
    let guide_user_b = Uuid::new_v4();
    let guide_row_b = Uuid::new_v4();
    let order_b = Uuid::new_v4();
    let email_tb = format!("b451-t-{tourist_b}@traveltrust.test");
    let email_gb = format!("b451-g-{guide_user_b}@traveltrust.test");

    let store_b = build_store(
        anchor,
        tourist_b,
        guide_user_b,
        guide_row_b,
        order_b,
        B447_ORDER_AMOUNT,
        &email_tb,
        &email_gb,
        guide_reviewer_created,
        tourist_created,
    );
    let co = ChainOffState {
        store: Arc::new(RwLock::new(store_b)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let full = post_reviews_full_json(co, order_b, guide_user_b).await;
    assert_eq!(full["status"], "ok");
    assert_review_json_contract_meta(&full["meta"]);
    assert!(full["review"]["weight_breakdown"].is_object());
}

#[tokio::test]
async fn b451_get_reviews_list_includes_meta_review_json_contract() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let tourist_created = now - chrono::Duration::days(400);
    let tourist_id = Uuid::new_v4();
    let guide_id = Uuid::new_v4();
    store.users.insert(
        tourist_id,
        UserRow {
            id: tourist_id,
            email: "b451l-t@test.com".to_string(),
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
            email: "b451l-g@test.com".to_string(),
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

    let Ok(Json(list0)) = reviews_list_impl(state.clone(), order_id).await else {
        panic!("reviews_list");
    };
    assert_review_json_contract_meta(&list0["meta"]);

    let Ok(Json(_sub)) = review_submit_impl(
        state.clone(),
        order_id,
        guide_id,
        Json(SubmitReviewBody {
            score: 5,
            comment: None,
        }),
    )
    .await
    else {
        panic!("review_submit");
    };

    let Ok(Json(list1)) = reviews_list_impl(state, order_id).await else {
        panic!("reviews_list after submit");
    };
    assert_review_json_contract_meta(&list1["meta"]);
}

/// **`db_pool`** **+** **仅** **DB** **已有** **`reviews`** **行** **（** **内存** **无** **）** **→** **`insert_review`→`Ok(false)`** **幂等** **路径** **（** **同** **B-444** **）** **须** **含** **`meta.review_json_contract`** **。**
#[tokio::test]
async fn b451_post_reviews_db_pool_idempotent_includes_meta_review_json_contract() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: b451_post_reviews_db_pool_idempotent_includes_meta_review_json_contract (DATABASE_URL unset)");
        return;
    };

    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    let guide_row_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let review_id_db = Uuid::new_v4();
    let now = Utc::now();

    let email_t = format!("b451b-t-{tourist_id}@traveltrust.test");
    let email_g = format!("b451b-g-{guide_user_id}@traveltrust.test");

    cleanup(
        &pool,
        order_id,
        guide_row_id,
        tourist_id,
        guide_user_id,
    )
    .await;

    db::insert_user(
        &pool,
        tourist_id,
        &email_t,
        None,
        "tourist",
        "none",
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user tourist");
    db::insert_user(
        &pool,
        guide_user_id,
        &email_g,
        None,
        "guide",
        "none",
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user guide");

    sqlx::query(
        r#"INSERT INTO guides (id, user_id, city, country_code, languages, service_types, stake_amount, status, created_at, updated_at)
           VALUES ($1, $2, 'HZ', 'CN', '[]'::jsonb, '[]'::jsonb, '0', 'active', $3, $3)"#,
    )
    .bind(guide_row_id)
    .bind(guide_user_id)
    .bind(now)
    .execute(&pool)
    .await
    .expect("insert guides");

    upsert_order(
        &pool,
        order_id,
        tourist_id,
        Some(guide_row_id),
        "100",
        "USD",
        "completed",
        None,
        now,
        now,
        Some(now),
        Some(now),
        Some(now),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
    )
    .await
    .expect("upsert_order");

    sqlx::query(
        r#"INSERT INTO reviews (id, order_id, reviewer_id, reviewee_id, score, weight, comment, created_at)
           VALUES ($1, $2, $3, $4, 5, 1.0, 'b451-seed', $5)"#,
    )
    .bind(review_id_db)
    .bind(order_id)
    .bind(guide_user_id)
    .bind(tourist_id)
    .bind(now)
    .execute(&pool)
    .await
    .expect("insert reviews seed");

    let mut store = ChainOffStore::default();
    store.users.insert(
        tourist_id,
        UserRow {
            id: tourist_id,
            email: email_t,
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            created_at: now - chrono::Duration::days(30),
            updated_at: now,
        },
    );
    store.users.insert(
        guide_user_id,
        UserRow {
            id: guide_user_id,
            email: email_g,
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
            data_origin: "production".into(),
        order_kind: None,
        market_listing_id: None,
        },
    );

    let co = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };

    let v = post_reviews_full_json(co, order_id, guide_user_id).await;
    assert_eq!(v["review"]["weight_breakdown_note"], "persisted_review_inputs_not_replayed");
    assert!(v["review"]["weight_breakdown"].is_null());
    assert_review_json_contract_meta(&v["meta"]);

    cleanup(
        &pool,
        order_id,
        guide_row_id,
        tourist_id,
        guide_user_id,
    )
    .await;
}
