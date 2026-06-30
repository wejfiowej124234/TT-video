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
use crate::db::{insert_post, insert_session, insert_user};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::routes::community::router;
use crate::state::test_support::api_meta_state;

/// 与 **`community_feed_like_collect_db_api_tests`** 同源：并行 PG·IT 时偶发 **503**；串行化本文件两测。
static COMMUNITY_REPORT_ME_POSTS_DB_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

pub(super) fn db_it_lock() -> &'static Mutex<()> {
    COMMUNITY_REPORT_ME_POSTS_DB_IT_LOCK.get_or_init(|| Mutex::new(()))
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

pub(super) fn app_stack_report_pool(pool: PgPool) -> Router {
    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(co)), idem, Some(pool))
}

pub(super) async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

pub(super) async fn cleanup_users_posts_and_reports(
    pool: &PgPool,
    user_ids: &[Uuid],
    post_ids: &[Uuid],
) {
    if !post_ids.is_empty() {
        let _ = sqlx::query("DELETE FROM community_reports WHERE target_id = ANY($1)")
            .bind(post_ids)
            .execute(pool)
            .await;
        let _ = sqlx::query("DELETE FROM community_collects WHERE post_id = ANY($1)")
            .bind(post_ids)
            .execute(pool)
            .await;
        let _ = sqlx::query("DELETE FROM community_likes WHERE post_id = ANY($1)")
            .bind(post_ids)
            .execute(pool)
            .await;
        let _ = sqlx::query("DELETE FROM community_posts WHERE id = ANY($1)")
            .bind(post_ids)
            .execute(pool)
            .await;
    };    if !user_ids.is_empty() {
        let _ = sqlx::query(
            "DELETE FROM community_reports WHERE reporter_id = ANY($1) OR (target_type = 'post' AND target_id IN (SELECT id FROM community_posts WHERE user_id = ANY($1)))",
        )
        .bind(user_ids)
        .execute(pool)
        .await;
        let _ = sqlx::query(
            "DELETE FROM community_collects WHERE post_id IN (SELECT id FROM community_posts WHERE user_id = ANY($1))",
        )
        .bind(user_ids)
        .execute(pool)
        .await;
        let _ = sqlx::query(
            "DELETE FROM community_likes WHERE post_id IN (SELECT id FROM community_posts WHERE user_id = ANY($1))",
        )
        .bind(user_ids)
        .execute(pool)
        .await;
        let _ = sqlx::query("DELETE FROM community_posts WHERE user_id = ANY($1)")
            .bind(user_ids)
            .execute(pool)
            .await;
        let _ = sqlx::query("DELETE FROM sessions WHERE user_id = ANY($1)")
            .bind(user_ids)
            .execute(pool)
            .await;
        let _ = sqlx::query("DELETE FROM users WHERE id = ANY($1)")
            .bind(user_ids)
            .execute(pool)
            .await;
    }
}

/// **D-COM-010**。**不** cleanup。返回 **`reporter` session token** 供后续 **`Bearer`** 步骤复用。
pub(super) async fn run_d_com_010_report_flow(
    pool: &PgPool,
    app: Router,
) -> (Uuid, Uuid, Uuid, String) {
    let reporter_id = Uuid::new_v4();
    let author_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_report_{}", Uuid::new_v4());
    let email_r = format!("report-r-{reporter_id}@example.com");
    let email_a = format!("report-a-{author_id}@example.com");

    cleanup_users_posts_and_reports(pool, &[reporter_id, author_id], &[]).await;

    insert_user(
        pool,
        reporter_id,
        &email_r,
        None,
        "tourist",
        "none",
        None,
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert_user reporter");
    insert_user(
        pool, author_id, &email_a, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user author");
    insert_session(pool, &token, reporter_id)
        .await
        .expect("insert_session");

    let post_id = insert_post(
        pool,
        author_id,
        "report target body",
        "text",
        None,
        &[],
        &[],
        None,
        None,
        "production",
        None,
        None,
    )
    .await
    .expect("insert_post");

    let body = json!({
        "target_type": "post",
        "target_id": post_id.to_string(),
        "reason_code": "spam",
        "details": "api-it report",
    });
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/community/reports")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    let rid = j["id"].as_str().expect("report id");
    Uuid::parse_str(rid).expect("report id uuid");

    let cnt: i64 =
        sqlx::query_scalar("SELECT COUNT(*)::bigint FROM community_reports WHERE id = $1")
            .bind(Uuid::parse_str(rid).unwrap())
            .fetch_one(pool)
            .await
            .expect("count report");
    assert_eq!(cnt, 1);

    (reporter_id, author_id, post_id, token)
}

/// **D-COM-009**。**不** cleanup。
pub(super) async fn run_d_com_009_me_posts_flow(pool: &PgPool, app: Router) -> (Uuid, Uuid) {
    let uid = Uuid::new_v4();
    let token = format!("tts_me_posts_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("me-posts-{uid}@example.com");

    cleanup_users_posts_and_reports(pool, &[uid], &[]).await;

    insert_user(
        pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(pool, &token, uid)
        .await
        .expect("insert_session");

    let post_id = insert_post(
        pool,
        uid,
        "me posts api it",
        "text",
        None,
        &[],
        &[],
        None,
        None,
        "production",
        None,
        None,
    )
    .await
    .expect("insert_post");

    let res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/posts?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    let posts = j["posts"].as_array().expect("posts");
    assert!(
        posts.iter().any(|p| p["id"] == post_id.to_string()),
        "expected post id in me/posts: {posts:?}"
    );

    (uid, post_id)
}
