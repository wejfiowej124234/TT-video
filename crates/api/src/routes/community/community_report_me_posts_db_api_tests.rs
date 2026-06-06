//! **F-018 / F-019 · API·IT（PostgreSQL + `Router::oneshot` + Bearer）**
//!
//! - **F-018**：**`POST /api/v1/community/reports`** 在目标帖存在时返回 **`status=ok`** 与 **`id`**。
//! - **F-019**：**`GET /api/v1/community/me/posts`** 在库内存在本人帖时返回 **`status=ok`** 且列表含该帖 **`id`**。
//! - **v1.4.241**：**`matrix_93_d_com_010_f018_post_report_persists_pg_row_app_stack_ok_pg`** / **`matrix_93_d_com_009_f019_get_me_posts_lists_own_post_app_stack_ok_pg`** — **`router::app`** 主栈（与 **`community::router()`** **`app_with_pool`** **互补**）。
//! - **v1.4.272**：**`matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg`** — **`POST …/reports`** 后 **无身份头** **`GET …/posts/:id`** **公开读**（**`router::app`**）。
//!
//! **93 §4.1**：**`matrix_93_d_com_010_*`** ↔ **D-COM-010**/**F-018**；**`matrix_93_d_com_009_*`** ↔ **D-COM-009**/**F-019**；**v1.4.270**：**`matrix_93_d_com_009f_f019_*`** ↔ **D-COM-009**/**F-019**（**`GET …/community/me/posts`** **无身份头** **`router::app`** **401** **`auth_placeholder_layer`** **`unauthorized`**；**勿与** **`community_feed_like_collect_db_api_tests`** **`009b_*`** **`me/collects`** **前缀撞车**）（**`spec/93-全站功能验证矩阵-域别回归清单.md`** **v1.4.51** §4.1）。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（须**已迁移**库）。

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
use crate::state::test_support::api_meta_state;

use super::router;

/// 与 **`community_feed_like_collect_db_api_tests`** 同源：并行 PG·IT 时偶发 **503**；串行化本文件两测。
static COMMUNITY_REPORT_ME_POSTS_DB_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn db_it_lock() -> &'static Mutex<()> {
    COMMUNITY_REPORT_ME_POSTS_DB_IT_LOCK.get_or_init(|| Mutex::new(()))
}

async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

fn auth_bearer(token: &str) -> axum::http::HeaderValue {
    format!("Bearer {}", token).parse().expect("bearer header")
}

fn app_with_pool(pool: PgPool) -> Router {
    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    router().with_state(api_meta_state(Some(co)))
}

fn app_stack_report_pool(pool: PgPool) -> Router {
    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(co)), idem, Some(pool))
}

async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

async fn cleanup_users_posts_and_reports(pool: &PgPool, user_ids: &[Uuid], post_ids: &[Uuid]) {
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
    }
    if !user_ids.is_empty() {
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
async fn run_d_com_010_report_flow(pool: &PgPool, app: Router) -> (Uuid, Uuid, Uuid, String) {
    let reporter_id = Uuid::new_v4();
    let author_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_report_{}", Uuid::new_v4());
    let email_r = format!("report-r-{reporter_id}@traveltrust.test");
    let email_a = format!("report-a-{author_id}@traveltrust.test");

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
async fn run_d_com_009_me_posts_flow(pool: &PgPool, app: Router) -> (Uuid, Uuid) {
    let uid = Uuid::new_v4();
    let token = format!("tts_me_posts_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("me-posts-{uid}@traveltrust.test");

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

#[tokio::test]
async fn f018_post_community_report_persists_ok_when_target_post_exists() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f018_post_community_report_persists_ok_when_target_post_exists (DATABASE_URL unset)");
        return;
    };

    let (reporter_id, author_id, post_id, _token) =
        run_d_com_010_report_flow(&pool, app_with_pool(pool.clone())).await;
    cleanup_users_posts_and_reports(&pool, &[reporter_id, author_id], &[post_id]).await;
}

#[tokio::test]
async fn f019_get_me_posts_lists_inserted_post() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f019_get_me_posts_lists_inserted_post (DATABASE_URL unset)");
        return;
    };

    let (uid, post_id) = run_d_com_009_me_posts_flow(&pool, app_with_pool(pool.clone())).await;
    cleanup_users_posts_and_reports(&pool, &[uid], &[post_id]).await;
}

/// **93 · D-COM-010** → **§8.2 · F-018**。
#[tokio::test]
async fn matrix_93_d_com_010_post_report_persists_pg_row() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_d_com_010_post_report_persists_pg_row (DATABASE_URL unset)");
        return;
    };

    let (reporter_id, author_id, post_id, _token) =
        run_d_com_010_report_flow(&pool, app_with_pool(pool.clone())).await;
    cleanup_users_posts_and_reports(&pool, &[reporter_id, author_id], &[post_id]).await;
}

/// **93 · D-COM-009** → **§8.2 · F-019**。
#[tokio::test]
async fn matrix_93_d_com_009_get_me_posts_lists_own_post() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_d_com_009_get_me_posts_lists_own_post (DATABASE_URL unset)");
        return;
    };

    let (uid, post_id) = run_d_com_009_me_posts_flow(&pool, app_with_pool(pool.clone())).await;
    cleanup_users_posts_and_reports(&pool, &[uid], &[post_id]).await;
}

/// **93 · D-COM-010** → **§8.2 · F-018**（**`router::app`**；与 **`matrix_93_d_com_010_post_report_persists_pg_row`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_010_f018_post_report_persists_pg_row_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_010_f018_post_report_persists_pg_row_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (reporter_id, author_id, post_id, _token) =
        run_d_com_010_report_flow(&pool, app_stack_report_pool(pool.clone())).await;
    cleanup_users_posts_and_reports(&pool, &[reporter_id, author_id], &[post_id]).await;
}

/// **93 · D-COM-010** → **§8.2 · F-018**：**`POST …/reports`** 后 **无身份头** **`GET …/posts/:id`** **公开读**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg()
{
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_010b_f018_report_then_get_post_detail_unauthenticated_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let app = app_stack_report_pool(pool.clone());
    let (reporter_id, author_id, post_id, _token) =
        run_d_com_010_report_flow(&pool, app.clone()).await;

    let get = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get post detail unauthenticated after report app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["post"]["id"], post_id.to_string());
    assert_eq!(gj["post"]["body"], "report target body");
    assert!(
        gj["post"].get("liked_by_me").is_none(),
        "anonymous viewer must not receive liked_by_me"
    );
    assert!(
        gj["post"].get("collected_by_me").is_none(),
        "anonymous viewer must not receive collected_by_me"
    );

    cleanup_users_posts_and_reports(&pool, &[reporter_id, author_id], &[post_id]).await;
}

/// **93 · D-COM-009** → **§8.2 · F-019**（**`router::app`**；与 **`matrix_93_d_com_009_get_me_posts_lists_own_post`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_009_f019_get_me_posts_lists_own_post_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009_f019_get_me_posts_lists_own_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (uid, post_id) =
        run_d_com_009_me_posts_flow(&pool, app_stack_report_pool(pool.clone())).await;
    cleanup_users_posts_and_reports(&pool, &[uid], &[post_id]).await;
}

/// **93 · D-COM-009（门闸）** → **§8.2 · F-019**：**`router::app`** **`GET /api/v1/community/me/posts`** **无** **`Authorization`/`X-User-Id`** **→** **401** **`unauthorized`**（**`auth_placeholder_layer`**）。
#[tokio::test]
async fn matrix_93_d_com_009f_f019_get_me_posts_unauthorized_without_bearer_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009f_f019_get_me_posts_unauthorized_without_bearer_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let app = app_stack_report_pool(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/posts?limit=20")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    let j = response_json(res).await;
    assert_eq!(j["error"], "unauthorized");
    assert_eq!(j["message"], "unauthorized");
}
