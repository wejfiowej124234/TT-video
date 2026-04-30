//! **`DATABASE_URL` 可选**：有 PG 时 **`GET` 证据 / 订单消息列表** 以 **`evidence_receipts` / `order_messages`** 为 SSOT（内存无行仍须返回 DB 行；失败 **503**）。
//!
//! 跳过条件：未设置 **`DATABASE_URL`**。

use super::{evidence_list_impl, messages_list_impl, ChainOffConfig, ChainOffState, ChainOffStore};
use axum::Json;
use chrono::Utc;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::db::{self, insert_evidence_receipt, insert_order_message, upsert_order};

async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

async fn cleanup(
    pool: &PgPool,
    order_id: Uuid,
    guide_row_id: Uuid,
    tourist_id: Uuid,
    guide_user_id: Uuid,
) {
    let _ = sqlx::query("DELETE FROM evidence_receipts WHERE order_id = $1")
        .bind(order_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM order_messages WHERE order_id = $1")
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
async fn evidence_list_reads_db_when_pool_even_if_memory_empty() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: evidence_list_reads_db_when_pool_even_if_memory_empty (DATABASE_URL unset)"
        );
        return;
    };

    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    let guide_row_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let now = Utc::now();

    let email_t = format!("evssot-t-{tourist_id}@traveltrust.test");
    let email_g = format!("evssot-g-{guide_user_id}@traveltrust.test");

    cleanup(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;

    db::insert_user(
        &pool, tourist_id, &email_t, None, "tourist", "none", None, None, None, None, now, now,
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
        "escrowed",
        None,
        now,
        now,
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
        None,
    )
    .await
    .expect("upsert_order");

    insert_evidence_receipt(
        &pool, order_id, tourist_id, "cafebabe", None, None, None, None, now,
    )
    .await
    .expect("insert_evidence_receipt");

    let state = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };

    let Ok(Json(list)) = evidence_list_impl(state, order_id, tourist_id).await else {
        panic!("evidence_list_impl");
    };
    let items = list["items"].as_array().expect("items");
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["content_hash"], "cafebabe");

    cleanup(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

#[tokio::test]
async fn messages_list_reads_db_when_pool_even_if_memory_empty() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: messages_list_reads_db_when_pool_even_if_memory_empty (DATABASE_URL unset)"
        );
        return;
    };

    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    let guide_row_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let msg_id = Uuid::new_v4();
    let now = Utc::now();

    let email_t = format!("msgssot-t-{tourist_id}@traveltrust.test");
    let email_g = format!("msgssot-g-{guide_user_id}@traveltrust.test");

    cleanup(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;

    db::insert_user(
        &pool, tourist_id, &email_t, None, "tourist", "none", None, None, None, None, now, now,
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
        "escrowed",
        None,
        now,
        now,
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
        None,
    )
    .await
    .expect("upsert_order");

    insert_order_message(&pool, msg_id, order_id, tourist_id, "db-only line", now)
        .await
        .expect("insert_order_message");

    let state = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };

    let Ok(Json(list)) = messages_list_impl(state, order_id, tourist_id).await else {
        panic!("messages_list_impl");
    };
    let items = list["items"].as_array().expect("items");
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["content"], "db-only line");
    assert_eq!(items[0]["id"], msg_id.to_string());

    cleanup(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}
