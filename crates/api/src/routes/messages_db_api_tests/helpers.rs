use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use chrono::Utc;
use http_body_util::BodyExt;
use serde_json::json;
use sqlx::PgPool;
use std::sync::{Arc, OnceLock};
use tokio::sync::{Mutex, RwLock};
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::db::{insert_session, insert_user, upsert_order};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;

static ORDER_MESSAGES_DB_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

pub(super) fn db_it_lock() -> &'static Mutex<()> {
    ORDER_MESSAGES_DB_IT_LOCK.get_or_init(|| Mutex::new(()))
}

pub(super) async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

pub(super) fn auth_bearer(token: &str) -> axum::http::HeaderValue {
    format!("Bearer {}", token).parse().expect("bearer header")
}

pub(super) async fn cleanup_order_bundle(
    pool: &PgPool,
    order_id: Uuid,
    guide_row_id: Uuid,
    tourist_id: Uuid,
    guide_user_id: Uuid,
) {
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
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1 OR user_id = $2")
        .bind(tourist_id)
        .bind(guide_user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1 OR id = $2")
        .bind(tourist_id)
        .bind(guide_user_id)
        .execute(pool)
        .await;
}

pub(super) async fn seed_f026_order_messages_fixture(
    pool: &PgPool,
) -> (Uuid, Uuid, Uuid, Uuid, String) {
    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    let guide_row_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_order_msg_{}", Uuid::new_v4());
    let email_t = format!("ordmsg-t-{tourist_id}@traveltrust.test");
    let email_g = format!("ordmsg-g-{guide_user_id}@traveltrust.test");

    cleanup_order_bundle(pool, order_id, guide_row_id, tourist_id, guide_user_id).await;

    insert_user(
        pool, tourist_id, &email_t, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user tourist");
    insert_user(
        pool,
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
    insert_session(pool, &token, tourist_id)
        .await
        .expect("insert_session");

    sqlx::query(
        r#"INSERT INTO guides (id, user_id, city, country_code, languages, service_types, stake_amount, status, created_at, updated_at)
           VALUES ($1, $2, 'HZ', 'CN', '[]'::jsonb, '[]'::jsonb, '0', 'active', $3, $3)"#,
    )
    .bind(guide_row_id)
    .bind(guide_user_id)
    .bind(now)
    .execute(pool)
    .await
    .expect("insert guides");

    upsert_order(
        pool,
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

    (order_id, guide_row_id, tourist_id, guide_user_id, token)
}

/// **`sessions`** **旅客+向导** 双 **Bearer**，供 **参与方互读** **`002c_*`**。
pub(super) async fn seed_f026_order_messages_fixture_dual(
    pool: &PgPool,
) -> (Uuid, Uuid, Uuid, Uuid, String, String) {
    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    let guide_row_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let now = Utc::now();
    let token_t = format!("tts_order_msg_t_{}", Uuid::new_v4());
    let token_g = format!("tts_order_msg_g_{}", Uuid::new_v4());
    let email_t = format!("ordmsg2-t-{tourist_id}@traveltrust.test");
    let email_g = format!("ordmsg2-g-{guide_user_id}@traveltrust.test");

    cleanup_order_bundle(pool, order_id, guide_row_id, tourist_id, guide_user_id).await;

    insert_user(
        pool, tourist_id, &email_t, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user tourist");
    insert_user(
        pool,
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
    insert_session(pool, &token_t, tourist_id)
        .await
        .expect("insert_session tourist");
    insert_session(pool, &token_g, guide_user_id)
        .await
        .expect("insert_session guide");

    sqlx::query(
        r#"INSERT INTO guides (id, user_id, city, country_code, languages, service_types, stake_amount, status, created_at, updated_at)
           VALUES ($1, $2, 'HZ', 'CN', '[]'::jsonb, '[]'::jsonb, '0', 'active', $3, $3)"#,
    )
    .bind(guide_row_id)
    .bind(guide_user_id)
    .bind(now)
    .execute(pool)
    .await
    .expect("insert guides");

    upsert_order(
        pool,
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

    (
        order_id,
        guide_row_id,
        tourist_id,
        guide_user_id,
        token_t,
        token_g,
    )
}

pub(super) async fn assert_b_msg_002_post_get_messages(
    app: Router,
    token: &str,
    order_id: Uuid,
    content: &str,
) {
    let post_uri = format!("/api/v1/orders/{}/messages", order_id);
    let body = json!({ "content": content }).to_string();
    let post_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&post_uri)
                .header(header::AUTHORIZATION, auth_bearer(token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_body = post_res.into_body().collect().await.unwrap().to_bytes();
    let post_j: serde_json::Value = serde_json::from_slice(&post_body).expect("post json");
    assert_eq!(post_j["status"], "ok");
    assert_eq!(post_j["message"]["content"], content);

    let get_res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(post_uri)
                .header(header::AUTHORIZATION, auth_bearer(token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_body = get_res.into_body().collect().await.unwrap().to_bytes();
    let get_j: serde_json::Value = serde_json::from_slice(&get_body).expect("get json");
    assert_eq!(get_j["status"], "ok");
    let items = get_j["items"].as_array().expect("items");
    assert!(
        items.iter().any(|m| m["content"] == content),
        "expected message in list: {items:?}"
    );
}

pub(super) async fn assert_b_msg_002_post_two_messages_then_get_lists_both(
    app: Router,
    token: &str,
    order_id: Uuid,
    first: &str,
    second: &str,
) {
    let post_uri = format!("/api/v1/orders/{}/messages", order_id);
    for content in [first, second] {
        let post_res = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri(&post_uri)
                    .header(header::AUTHORIZATION, auth_bearer(token))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(json!({ "content": content }).to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(post_res.status(), StatusCode::OK);
        let post_j: serde_json::Value =
            serde_json::from_slice(&post_res.into_body().collect().await.unwrap().to_bytes())
                .expect("post json");
        assert_eq!(post_j["status"], "ok");
        assert_eq!(post_j["message"]["content"], content);
    };    let get_res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&post_uri)
                .header(header::AUTHORIZATION, auth_bearer(token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_j: serde_json::Value =
        serde_json::from_slice(&get_res.into_body().collect().await.unwrap().to_bytes())
            .expect("get json");
    assert_eq!(get_j["status"], "ok");
    let items = get_j["items"].as_array().expect("items");
    assert!(
        items.iter().any(|m| m["content"] == first),
        "expected first in list: {items:?}"
    );
    assert!(
        items.iter().any(|m| m["content"] == second),
        "expected second in list: {items:?}"
    );
}

pub(super) fn app_stack_f026(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}
