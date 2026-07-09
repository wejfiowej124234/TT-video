//! **B-447**：**`POST …/reviews`** 在 **`insert_review` → `Ok(true)`**（**`db_pool`** **成功** **持久化** **）与 **无** **`db_pool`** **（** **纯内存** **）** **两** **条** **成功** **路径** **下** **，** **`weight`** **与** **`weight_breakdown`** **JSON** **数值** **语义** **须** **一致** **（** **与** **B-444** **`ON CONFLICT`** **幂等** **路径** **故意** **不** **重放** **`breakdown`** **正交** **）** **。**

use axum::body::Body;
use axum::http::{Request, StatusCode};
use chrono::Utc;
use http_body_util::BodyExt;
use serde_json::Value;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower::ServiceExt;
use traveltrust_core::OrderState;
use uuid::Uuid;

use crate::chain_off::{
    ChainOffConfig, ChainOffState, ChainOffStore, GuideRow, OrderRow, UserRow,
};
use crate::db::{self, upsert_order};
use crate::state::test_support::api_meta_state;

use super::super::router;

pub(in crate::routes::orders::tests) const B447_ORDER_AMOUNT: &str = "512.375";
const PAYLOAD: &[u8] = br#"{"score":5,"comment":"b447-parity"}"#;

pub(in crate::routes::orders::tests) async fn pool_or_skip() -> Option<PgPool> {
    let url = std::env::var("DATABASE_URL").ok()?.trim().to_string();
    if url.is_empty() {
        return None;
    }
    Some(
        PgPoolOptions::new()
            .max_connections(4)
            .connect(&url)
            .await
            .expect("DATABASE_URL connect"),
    )
}

pub(in crate::routes::orders::tests) async fn cleanup(
    pool: &PgPool,
    order_id: Uuid,
    guide_row_id: Uuid,
    tourist_id: Uuid,
    guide_user_id: Uuid,
) {
    let _ = sqlx::query("DELETE FROM reviews WHERE order_id = $1")
        .bind(order_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM orders WHERE id = $1")
        .bind(order_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM guides WHERE id = $1")
        .bind(guide_row_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1 OR id = $2")
        .bind(tourist_id)
        .bind(guide_user_id)
        .execute(pool)
        .await;
}

// `amount`: `OrderRow.amount` string (B-449 may pass `"0"` for boundary coverage).
pub(in crate::routes::orders::tests) fn build_store(
    anchor: chrono::DateTime<Utc>,
    tourist_id: Uuid,
    guide_user_id: Uuid,
    guide_row_id: Uuid,
    order_id: Uuid,
    amount: &str,
    email_t: &str,
    email_g: &str,
    guide_reviewer_created_at: chrono::DateTime<Utc>,
    tourist_created_at: chrono::DateTime<Utc>,
) -> ChainOffStore {
    let mut store = ChainOffStore::default();
    store.users.insert(
        tourist_id,
        UserRow {
            id: tourist_id,
            email: email_t.to_string(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            created_at: tourist_created_at,
            updated_at: anchor,
        },
    );
    store.users.insert(
        guide_user_id,
        UserRow {
            id: guide_user_id,
            email: email_g.to_string(),
            password_hash: None,
            role: "guide".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            created_at: guide_reviewer_created_at,
            updated_at: anchor,
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
            public_title: None,
            status: "active".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            created_at: anchor,
            updated_at: anchor,
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
            amount: amount.to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            state: OrderState::Completed,
            created_at: anchor,
            accepted_at: Some(anchor),
            escrowed_at: Some(anchor),
            completed_at: Some(anchor),
            dispute_deadline_at: None,
            auto_complete_at: None,
            updated_at: anchor,
            start_date: None,
            end_date: None,
            sub_status: None,
            tourist_confirmed: None,
            guide_confirmed: None,
            rating_tourist_confirmed: None,
            rating_guide_confirmed: None,
            service_tourist_confirmed: None,
            service_guide_confirmed: None,
            chain_id: None,
            data_origin: "production".into(),
        order_kind: None,
        market_listing_id: None,
        },
    );
    store
}

fn assert_f64_close(a: f64, b: f64, ctx: &str) {
    assert!(
        (a - b).abs() < 1e-9,
        "B-447: {ctx}: {a} vs {b}"
    );
}

fn assert_weight_breakdown_parity(db: &Value, mem: &Value) {
    assert_eq!(db["score"], mem["score"], "B-447: score");
    let w_db = db["weight"].as_f64().expect("weight f64 (db_pool path)");
    let w_mem = mem["weight"].as_f64().expect("weight f64 (memory path)");
    assert_f64_close(w_db, w_mem, "top-level weight");

    assert!(
        db["weight_breakdown"].is_object(),
        "B-447: db_pool success path must include weight_breakdown object"
    );
    assert!(
        mem["weight_breakdown"].is_object(),
        "B-447: memory path must include weight_breakdown object"
    );
    let bd = &db["weight_breakdown"];
    let bm = &mem["weight_breakdown"];
    assert_eq!(
        bd["rule_version"], bm["rule_version"],
        "B-447: rule_version"
    );
    assert_eq!(
        bd["account_age_days"], bm["account_age_days"],
        "B-447: account_age_days"
    );
    assert_f64_close(
        bd["order_amount"].as_f64().unwrap(),
        bm["order_amount"].as_f64().unwrap(),
        "breakdown.order_amount",
    );
    assert_f64_close(
        bd["amount_factor"].as_f64().unwrap(),
        bm["amount_factor"].as_f64().unwrap(),
        "breakdown.amount_factor",
    );
    assert_f64_close(
        bd["age_factor"].as_f64().unwrap(),
        bm["age_factor"].as_f64().unwrap(),
        "breakdown.age_factor",
    );
    assert_f64_close(
        bd["weight"].as_f64().unwrap(),
        bm["weight"].as_f64().unwrap(),
        "breakdown.weight",
    );
    assert_f64_close(
        bd["guide_historical_score_reserved"]
            .as_f64()
            .unwrap(),
        bm["guide_historical_score_reserved"]
            .as_f64()
            .unwrap(),
        "breakdown.guide_historical_score_reserved",
    );
}

pub(in crate::routes::orders::tests) async fn post_reviews_extract_review(
    co: ChainOffState,
    order_id: Uuid,
    reviewer_user_id: Uuid,
) -> Value {
    let app = router().with_state(api_meta_state(Some(co)));
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(format!("/api/v1/orders/{order_id}/reviews"))
                .header("content-type", "application/json")
                .header("X-User-Id", reviewer_user_id.to_string())
                .body(Body::from(PAYLOAD.to_vec()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK, "B-447: POST reviews must be 200");
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: Value = serde_json::from_slice(&bytes).expect("json body");
    assert_eq!(v["status"], "ok");
    v["review"].clone()
}

#[tokio::test]
async fn b447_post_reviews_weight_breakdown_parity_db_pool_insert_ok_vs_memory_only() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: b447_post_reviews_weight_breakdown_parity_db_pool_insert_ok_vs_memory_only (DATABASE_URL unset)"
        );
        return;
    };

    let anchor = Utc::now();
    let guide_reviewer_created = anchor - chrono::Duration::days(400);
    let tourist_created = anchor - chrono::Duration::days(1);

    let tourist_a = Uuid::new_v4();
    let guide_user_a = Uuid::new_v4();
    let guide_row_a = Uuid::new_v4();
    let order_a = Uuid::new_v4();
    let email_ta = format!("b447a-t-{tourist_a}@traveltrust.test");
    let email_ga = format!("b447a-g-{guide_user_a}@traveltrust.test");

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
    .expect("insert_user tourist A");
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
    .expect("insert_user guide A");

    sqlx::query(
        r#"INSERT INTO guides (id, user_id, city, country_code, languages, service_types, stake_amount, status, created_at, updated_at)
           VALUES ($1, $2, 'HZ', 'CN', '[]'::jsonb, '[]'::jsonb, '0', 'active', $3, $3)"#,
    )
    .bind(guide_row_a)
    .bind(guide_user_a)
    .bind(anchor)
    .execute(&pool)
    .await
    .expect("insert guides A");

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
        None,
        None,
    )
    .await
    .expect("upsert_order A");

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
    let review_db = post_reviews_extract_review(co_pool, order_a, guide_user_a).await;

    let tourist_b = Uuid::new_v4();
    let guide_user_b = Uuid::new_v4();
    let guide_row_b = Uuid::new_v4();
    let order_b = Uuid::new_v4();
    let email_tb = format!("b447b-t-{tourist_b}@traveltrust.test");
    let email_gb = format!("b447b-g-{guide_user_b}@traveltrust.test");

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
    let review_mem = post_reviews_extract_review(co_mem, order_b, guide_user_b).await;

    assert_weight_breakdown_parity(&review_db, &review_mem);

    cleanup(&pool, order_a, guide_row_a, tourist_a, guide_user_a).await;
}
