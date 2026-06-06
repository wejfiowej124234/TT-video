//! Shared PG·IT helpers for F-014–F-017 feed / like / collect tests.

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
use crate::db::{insert_session, insert_user};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;

use crate::routes::community::router;

/// 三测并行抢同一 Postgres 时，`list_feed` / engagement 聚合偶发 **503**；串行化本文件 PG·IT。
static COMMUNITY_FEED_LIKE_COLLECT_DB_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

pub(super) fn db_it_lock() -> &'static Mutex<()> {
    COMMUNITY_FEED_LIKE_COLLECT_DB_IT_LOCK.get_or_init(|| Mutex::new(()))
}

pub(super) async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

pub(super) fn auth_bearer(token: &str) -> axum::http::HeaderValue {
    format!("Bearer {}", token).parse().expect("bearer header")
}

pub(super) fn app_with_pool(pool: PgPool) -> Router {
    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    router().with_state(api_meta_state(Some(co)))
}

pub(super) fn app_stack_feed_pool(pool: PgPool) -> Router {
    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(co)), idem, Some(pool))
}

/// 同 **`setup_app_user_one_post`**，**`router::app`** 全栈（**`IdempotencyCache` + merge 序**）。
pub(super) async fn setup_app_stack_user_one_post(
    pool: &PgPool,
    body: &str,
) -> (Router, Uuid, Uuid, String) {
    let (uid, token) = seed_user_with_session(pool).await;
    let app_router = app_stack_feed_pool(pool.clone());
    let post_id = create_text_post(&app_router, &token, body).await;
    (app_router, uid, post_id, token)
}

pub(super) async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

pub(super) async fn cleanup_user_and_posts(pool: &PgPool, user_id: Uuid) {
    let _ = sqlx::query(
        "DELETE FROM community_collects WHERE post_id IN (SELECT id FROM community_posts WHERE user_id = $1)",
    )
    .bind(user_id)
    .execute(pool)
    .await;
    let _ = sqlx::query(
        "DELETE FROM community_likes WHERE post_id IN (SELECT id FROM community_posts WHERE user_id = $1)",
    )
    .bind(user_id)
    .execute(pool)
    .await;
    let _ = sqlx::query("DELETE FROM community_posts WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
}

pub(super) async fn seed_user_with_session(pool: &PgPool) -> (Uuid, String) {
    let uid = Uuid::new_v4();
    let token = format!("tts_feed_like_collect_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("feed-like-collect-{uid}@traveltrust.test");
    insert_user(
        pool, uid, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(pool, &token, uid)
        .await
        .expect("insert_session");
    (uid, token)
}

pub(super) async fn create_text_post(app: &Router, token: &str, body: &str) -> Uuid {
    create_text_post_tagged(app, token, body, None).await
}

pub(super) async fn create_text_post_tagged(
    app: &Router,
    token: &str,
    body: &str,
    tag: Option<&str>,
) -> Uuid {
    let body_json = match tag {
        Some(t) => json!({ "body": body, "post_type": "text", "tags": [t] }),
        None => json!({ "body": body, "post_type": "text" }),
    };
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/community/posts")
                .header(header::AUTHORIZATION, auth_bearer(token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body_json.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot create_post");
    let st = res.status();
    let v = response_json(res).await;
    assert_eq!(st, StatusCode::OK, "{:?}", v);
    v["id"].as_str().unwrap().parse().expect("post id uuid")
}

/// **勿**在返回后立刻 **`cleanup_user_and_posts`**（会删 **Bearer** 对应 **`sessions`**）。
pub(super) async fn setup_app_user_one_post(
    pool: &PgPool,
    body: &str,
) -> (Router, Uuid, Uuid, String) {
    let (uid, token) = seed_user_with_session(pool).await;
    let app = app_with_pool(pool.clone());
    let post_id = create_text_post(&app, &token, body).await;
    (app, uid, post_id, token)
}
