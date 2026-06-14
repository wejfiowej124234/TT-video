//! **B-444**：**`db_pool`** 下 **`POST …/reviews`** 在 **`insert_review` → `Ok(false)`** 时须 **200** 幂等，且 **`weight_breakdown_note` = `persisted_review_inputs_not_replayed`**（与 **B-443** 持久层 **`ON CONFLICT`** 解耦 **HTTP** **409** 语义）。
//!
//! 使用 **向导 → 旅行者** 评价方向，使 **`reviewee_id` = `tourist_id`**（**`users`** **FK** 合法）。内存 **`ChainOffStore`** **无** 对应 **`reviews`** 行，仅 **DB** 预插一行，以稳定命中 **Ok(false)** 分支。

use axum::body::Body;
use axum::http::{Request, StatusCode};
use chrono::Utc;
use http_body_util::BodyExt;
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

async fn pool_or_skip() -> Option<PgPool> {
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

async fn cleanup(
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

#[tokio::test]
async fn post_reviews_db_pool_insert_conflict_returns_200_idempotent_persisted_note() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: post_reviews_db_pool_insert_conflict_returns_200_idempotent_persisted_note (DATABASE_URL unset)"
        );
        return;
    };

    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    let guide_row_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let review_id_db = Uuid::new_v4();
    let now = Utc::now();

    let email_t = format!("b444t-{tourist_id}@traveltrust.test");
    let email_g = format!("b444g-{guide_user_id}@traveltrust.test");

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

    // 仅 DB 有评价：向导评旅行者，`reviewee_id` → 旅行者 **users.id**（FK 合法）。
    sqlx::query(
        r#"INSERT INTO reviews (id, order_id, reviewer_id, reviewee_id, score, weight, comment, created_at)
           VALUES ($1, $2, $3, $4, 5, 1.0, 'b444-seed', $5)"#,
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
    // 故意不在内存 `reviews` 中放入该行 —— 模拟仅 DB 已有唯一键行。

    let co = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };

    let app = router().with_state(api_meta_state(Some(co)));

    let payload = br#"{"score":5,"comment":"client-retry"}"#;
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

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "B-444: ON CONFLICT path must stay 200 idempotent, not 409"
    );
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["status"], "ok");
    assert_eq!(
        v["review"]["weight_breakdown_note"],
        "persisted_review_inputs_not_replayed"
    );
    assert!(v["review"]["weight_breakdown"].is_null());
    assert_eq!(v["review"]["id"], review_id_db.to_string());

    cleanup(
        &pool,
        order_id,
        guide_row_id,
        tourist_id,
        guide_user_id,
    )
    .await;
}
