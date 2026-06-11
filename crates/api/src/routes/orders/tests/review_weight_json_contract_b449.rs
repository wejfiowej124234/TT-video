//! **B-449**：**`POST …/reviews`** **三类** **分支** **（** **成功** **A** **/** **幂等** **B** **/** **边界** **成功** **C** **）** **下** **`weight`** **、** **`weight_breakdown`** **、** **`weight_breakdown_note`** **的** **键** **存在性** **与** **`null`** **/** **缺省** **语义** **机读** **。** **与** **B-447** **数值** **parity** **、** **B-444** **HTTP** **200** **幂等** **正交** **：** **本** **文件** **只** **钉** **JSON** **合约** **形状** **。**

use axum::body::Body;
use axum::http::{Request, StatusCode};
use chrono::Utc;
use http_body_util::BodyExt;
use serde_json::Value;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState};
use crate::db::{self, upsert_order};
use crate::state::test_support::api_meta_state;

use super::super::router;
use super::review_weight_dual_path_parity_b447::{
    build_store, cleanup, pool_or_skip, post_reviews_extract_review, B447_ORDER_AMOUNT,
};

fn assert_b449_branch_a_success_contract(review: &Value) {
    let o = review.as_object().expect("B-449 A: review must be object");
    assert!(
        !o.contains_key("weight_breakdown_note"),
        "B-449 A: weight_breakdown_note must be absent (key must not exist; JSON null would break semantic layering)"
    );
    assert!(
        review["weight"].is_number(),
        "B-449 A: weight must be JSON number"
    );
    let w = review["weight"].as_f64().expect("B-449 A: weight f64");
    assert!(w.is_finite(), "B-449 A: weight must be finite");
    assert!(
        review["weight_breakdown"].is_object(),
        "B-449 A: weight_breakdown must be object"
    );
    let bd = &review["weight_breakdown"];
    for k in [
        "order_amount",
        "amount_factor",
        "age_factor",
        "weight",
        "guide_historical_score_reserved",
    ] {
        let n = &bd[k];
        assert!(
            n.is_number(),
            "B-449 A: breakdown.{k} must be number, got {n:?}"
        );
        assert!(
            n.as_f64().expect("f64").is_finite(),
            "B-449 A: breakdown.{k} must be finite"
        );
    }
}

fn assert_b449_branch_b_idempotent_contract(review: &Value) {
    let o = review.as_object().expect("B-449 B: review must be object");
    assert!(
        o.contains_key("weight_breakdown"),
        "B-449 B: weight_breakdown key must be present (null) — paired with weight_breakdown_note"
    );
    assert!(
        review["weight_breakdown"].is_null(),
        "B-449 B: weight_breakdown must be JSON null"
    );
    assert!(
        o.contains_key("weight_breakdown_note"),
        "B-449 B: weight_breakdown_note must be present when breakdown is null"
    );
    assert_eq!(
        review["weight_breakdown_note"].as_str(),
        Some("persisted_review_inputs_not_replayed")
    );
    let w = review["weight"].as_f64().expect("B-449 B: weight");
    assert!(w.is_finite(), "B-449 B: weight must be finite");
}

#[tokio::test]
async fn b449_branch_a_memory_success_weight_json_contract() {
    let anchor = Utc::now();
    let guide_reviewer_created = anchor - chrono::Duration::days(400);
    let tourist_created = anchor - chrono::Duration::days(1);

    let tourist_b = Uuid::new_v4();
    let guide_user_b = Uuid::new_v4();
    let guide_row_b = Uuid::new_v4();
    let order_b = Uuid::new_v4();
    let email_tb = format!("b449a-t-{tourist_b}@traveltrust.test");
    let email_gb = format!("b449a-g-{guide_user_b}@traveltrust.test");

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
    let co_mem = ChainOffState {
        store: Arc::new(RwLock::new(store_b)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let review = post_reviews_extract_review(co_mem, order_b, guide_user_b).await;
    assert_b449_branch_a_success_contract(&review);
}

#[tokio::test]
async fn b449_branch_a_db_pool_first_insert_weight_json_contract() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: b449_branch_a_db_pool_first_insert_weight_json_contract (DATABASE_URL unset)");
        return;
    };

    let anchor = Utc::now();
    let guide_reviewer_created = anchor - chrono::Duration::days(400);
    let tourist_created = anchor - chrono::Duration::days(1);

    let tourist_a = Uuid::new_v4();
    let guide_user_a = Uuid::new_v4();
    let guide_row_a = Uuid::new_v4();
    let order_a = Uuid::new_v4();
    let email_ta = format!("b449db-t-{tourist_a}@traveltrust.test");
    let email_ga = format!("b449db-g-{guide_user_a}@traveltrust.test");

    cleanup(&pool, order_a, guide_row_a, tourist_a, guide_user_a).await;

    db::insert_user(
        &pool,
        tourist_a,
        &email_ta,
        None,
        "tourist",
        "none",
        None,
        None,
        None,
        tourist_created,
        anchor,
    )
    .await
    .expect("insert_user tourist");
    db::insert_user(
        &pool,
        guide_user_a,
        &email_ga,
        None,
        "guide",
        "none",
        None,
        None,
        None,
        guide_reviewer_created,
        anchor,
    )
    .await
    .expect("insert_user guide");

    sqlx::query(
        r#"INSERT INTO guides (id, user_id, city, country_code, languages, service_types, stake_amount, status, created_at, updated_at)
           VALUES ($1, $2, 'HZ', 'CN', '[]'::jsonb, '[]'::jsonb, '0', 'active', $3, $3)"#,
    )
    .bind(guide_row_a)
    .bind(guide_user_a)
    .bind(anchor)
    .execute(&pool)
    .await
    .expect("insert guides");

    upsert_order(
        &pool,
        order_a,
        tourist_a,
        Some(guide_row_a),
        B447_ORDER_AMOUNT,
        "USD",
        "completed",
        None,
        anchor,
        anchor,
        Some(anchor),
        Some(anchor),
        Some(anchor),
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

    let store_a = build_store(
        anchor,
        tourist_a,
        guide_user_a,
        guide_row_a,
        order_a,
        B447_ORDER_AMOUNT,
        &email_ta,
        &email_ga,
        guide_reviewer_created,
        tourist_created,
    );
    let co_pool = ChainOffState {
        store: Arc::new(RwLock::new(store_a)),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let review = post_reviews_extract_review(co_pool, order_a, guide_user_a).await;
    assert_b449_branch_a_success_contract(&review);

    cleanup(&pool, order_a, guide_row_a, tourist_a, guide_user_a).await;
}

#[tokio::test]
async fn b449_branch_c_memory_boundary_zero_order_amount_weight_json_contract() {
    let anchor = Utc::now();
    let guide_reviewer_created = anchor - chrono::Duration::days(200);
    let tourist_created = anchor - chrono::Duration::days(10);

    let tourist = Uuid::new_v4();
    let guide_user = Uuid::new_v4();
    let guide_row = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let email_t = format!("b449c0-t-{tourist}@traveltrust.test");
    let email_g = format!("b449c0-g-{guide_user}@traveltrust.test");

    let store = build_store(
        anchor,
        tourist,
        guide_user,
        guide_row,
        order_id,
        "0",
        &email_t,
        &email_g,
        guide_reviewer_created,
        tourist_created,
    );
    let co = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let review = post_reviews_extract_review(co, order_id, guide_user).await;
    assert_b449_branch_a_success_contract(&review);
    assert!(
        (review["weight_breakdown"]["order_amount"].as_f64().unwrap() - 0.0).abs() < 1e-9,
        "B-449 C: boundary zero amount projects into breakdown.order_amount"
    );
}

#[tokio::test]
async fn b449_branch_b_db_pool_idempotent_weight_json_contract() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: b449_branch_b_db_pool_idempotent_weight_json_contract (DATABASE_URL unset)");
        return;
    };

    use crate::chain_off::{
        ChainOffStore, GuideRow, OrderRow, UserRow,
    };
    use traveltrust_core::OrderState;

    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    let guide_row_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let review_id_db = Uuid::new_v4();
    let now = Utc::now();

    let email_t = format!("b449b-t-{tourist_id}@traveltrust.test");
    let email_g = format!("b449b-g-{guide_user_id}@traveltrust.test");

    cleanup(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;

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
        now - chrono::Duration::days(30),
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
           VALUES ($1, $2, $3, $4, 5, 1.0, 'b449-seed', $5)"#,
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

    let app = router().with_state(api_meta_state(Some(co)));
    let payload = br#"{"score":5,"comment":"b449-retry"}"#;
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(format!("/api/v1/orders/{order_id}/reviews"))
                .header("content-type", "application/json")
                .header("X-User-Id", guide_user_id.to_string())
                .body(Body::from(payload.to_vec()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(res.status(), StatusCode::OK, "B-449 B: idempotent path must be 200");
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["status"], "ok");
    assert_b449_branch_b_idempotent_contract(&v["review"]);
    assert_eq!(v["review"]["id"], review_id_db.to_string());

    cleanup(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}
