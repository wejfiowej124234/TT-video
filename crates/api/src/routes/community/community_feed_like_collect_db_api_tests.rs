//! **F-014 / F-015 / F-016 / F-017 · API·IT（PostgreSQL + `Router::oneshot`）**
//!
//! - **F-014**：**`GET /api/v1/community/feed`**（默认 **`recommend`**）在库内存在公开帖时返回 **`status=ok`** 与帖子列表。
//! - **F-015**：**`POST …/community/posts`** + **`GET …/posts/:id`** 详情可读。
//! - **F-016**：**`POST /api/v1/community/posts/:id/like`** → **`status=ok`**。
//! - **F-017**：**`POST /api/v1/community/posts/:id/collect`** → **`status=ok`**。
//! - **v1.4.241**：**`matrix_93_d_com_008_f017_post_collect_twice_idempotent_app_stack_ok_pg`** — **`router::app`** 主栈（与 **`matrix_93_d_com_008_post_collect_twice_idempotent`** **互补**）。
//! - **v1.4.242**：**`matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg`** / **`matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg`** / **`matrix_93_d_com_009b_f019_get_me_collects_includes_post_after_collect_app_stack_ok_pg`** — **`DELETE …/like`**、**`DELETE …/collect`**、**`GET …/me/collects`**（**`router::app`**）。
//! - **v1.4.243**：**`matrix_93_d_com_003d_f016_get_post_detail_liked_by_me_true_after_like_app_stack_ok_pg`** / **`matrix_93_d_com_008c_f017_get_post_detail_collected_by_me_true_after_collect_app_stack_ok_pg`** / **`matrix_93_d_com_009c_f019_get_me_likes_includes_post_after_like_app_stack_ok_pg`** — **`GET …/posts/:id`** **`liked_by_me`/`collected_by_me`**、**`GET …/me/likes`**（**`router::app`**）。
//! - **v1.4.244**：**`matrix_93_d_com_003e_f016_get_post_detail_liked_by_me_false_after_unlike_app_stack_ok_pg`** / **`matrix_93_d_com_008d_f017_get_post_detail_collected_by_me_false_after_uncollect_app_stack_ok_pg`** / **`matrix_93_d_com_009d_f019_get_me_likes_excludes_post_after_unlike_app_stack_ok_pg`** — **`DELETE …/like`**/**`DELETE …/collect`** 后详情与 **`me/likes`** 读回（**`router::app`**）。
//! - **v1.4.245**：**`matrix_93_d_com_003f_f016_get_feed_post_liked_by_me_true_after_like_app_stack_ok_pg`** / **`matrix_93_d_com_008e_f017_get_feed_post_collected_by_me_true_after_collect_app_stack_ok_pg`** / **`matrix_93_d_com_009e_f019_get_me_collects_excludes_post_after_uncollect_app_stack_ok_pg`** — **`GET …/feed`**（**Bearer**）**`liked_by_me`/`collected_by_me`**；**`DELETE …/collect`** 后 **`me/collects`**（**`router::app`**）。
//! - **v1.4.272**：**`matrix_93_d_com_008f_f017_collect_then_get_detail_unauthenticated_collect_count_ok_app_stack_ok_pg`** / **`matrix_93_d_com_009g_f019_get_me_likes_empty_list_ok_bearer_app_stack_ok_pg`** — **收藏后匿名** **`GET …/posts/:id`** **`collect_count`** **且无** **`collected_by_me`**；**Bearer** **`GET …/me/likes`** **空列表**（**`router::app`**）。
//! - **v1.4.273**：**`matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg`** — **`GET …/feed?tag=`** **精确匹配** **含** **Bearer** **发帖** **`tags[]`** **帖**（**`router::app`**）。
//! - **v1.4.274**：**`matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg`** — **匿名** **`GET …/feed?mode=hot`** **`posts`** **含** **主栈种子帖**（**`router::app`**）。
//! - **v1.4.275**：**`matrix_93_d_com_001f_f014_bearer_get_feed_follow_mode_ok_shape_app_stack_ok_pg`** — **Bearer** **`GET …/feed?mode=follow`** **`200`** **`posts`** **数组**（**`router::app`**；无关注时 **可空**）。
//! - **v1.4.276**：**`matrix_93_d_com_001g_f014_bearer_follow_feed_includes_followed_author_post_app_stack_ok_pg`** — **`community_follows`** **后** **Bearer** **`GET …/feed?mode=follow`** **`posts`** **含** **被关注者** **新帖** **`id`**（**`router::app`**）。
//!
//! **93 §4.1（D 域 · AUTO-P0）**：**`matrix_93_d_com_001_*`** ↔ **D-COM-001**/**F-014**（**`matrix_93_d_com_001_f014_feed_cursor_second_page_*`** / **`matrix_93_d_com_001b_f014_feed_cursor_second_page_*`**：**RFC3339 `cursor`** 第二页正路径；**`001b_*`** = **`router::app`**）；**`matrix_93_d_com_001c_f014_*`**：**`tag` 过滤** **主栈**；**`matrix_93_d_com_001e_f014_*`**：**`mode=hot`** **主栈**；**`matrix_93_d_com_001f_f014_*`**：**`mode=follow`** **Bearer** **主栈**；**`matrix_93_d_com_001g_f014_*`**：**`mode=follow`** **+** **`insert_follow`** **读回**；**`matrix_93_d_com_002_*`** ↔ **D-COM-002**/**F-015**（**`matrix_93_d_com_002b_f015_*`**：**Bearer** **发帖** → **无身份头** **`GET …/posts/:id`** **公开读**）；**`matrix_93_d_com_003_*`** ↔ **D-COM-003**/**F-016**（**`matrix_93_d_com_003g_f016_*`**：**点赞** 后 **匿名** **`GET …/posts/:id`** **`like_count`** **且不返回** **`liked_by_me`**）；**`matrix_93_d_com_008_*`** ↔ **D-COM-008**/**F-017**（判据见 **`spec/93-全站功能验证矩阵-域别回归清单.md`** §4.1；**`008f_*`**：**收藏** 后 **匿名详情** **`collect_count`**）；**`matrix_93_d_com_009g_f019_*`** ↔ **D-COM-009**/**F-019**（**`GET …/me/likes`** **空** **`likes`**）。
//! - **v1.4.240**：**`matrix_93_d_com_001_f014_get_feed_includes_seeded_text_post_app_stack_ok_pg`** / **`matrix_93_d_com_002_f015_post_then_get_post_detail_matches_app_stack_ok_pg`** / **`matrix_93_d_com_003_f016_post_like_twice_idempotent_app_stack_ok_pg`** — **`router::app`** 主栈（与 **`community::router()`** **`app_with_pool`** **互补**）。
//! - **v1.4.271**：**`matrix_93_d_com_001b_f014_feed_cursor_second_page_includes_older_post_app_stack_ok_pg`** / **`matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg`** / **`matrix_93_d_com_003g_f016_like_then_get_detail_unauthenticated_like_count_ok_app_stack_ok_pg`** — **`router::app`** **F-014/F-015/F-016` 正路径扩格**（**`spec/95-全链路生产就绪检查清单与完成度矩阵.md`** **v1.4.271**）。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（与 **`tests_create_post_commerce_db`** 同源）；须指向**已迁移**库。

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

use reqwest::Url;

/// 三测并行抢同一 Postgres 时，`list_feed` / engagement 聚合偶发 **503**；串行化本文件 PG·IT。
static COMMUNITY_FEED_LIKE_COLLECT_DB_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn db_it_lock() -> &'static Mutex<()> {
    COMMUNITY_FEED_LIKE_COLLECT_DB_IT_LOCK.get_or_init(|| Mutex::new(()))
}

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::db::{insert_follow, insert_session, insert_user};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;

use super::router;

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

fn app_stack_feed_pool(pool: PgPool) -> Router {
    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(co)), idem, Some(pool))
}

/// 同 **`setup_app_user_one_post`**，**`router::app`** 全栈（**`IdempotencyCache` + merge 序**）。
async fn setup_app_stack_user_one_post(pool: &PgPool, body: &str) -> (Router, Uuid, Uuid, String) {
    let (uid, token) = seed_user_with_session(pool).await;
    let app_router = app_stack_feed_pool(pool.clone());
    let post_id = create_text_post(&app_router, &token, body).await;
    (app_router, uid, post_id, token)
}

async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

async fn cleanup_user_and_posts(pool: &PgPool, user_id: Uuid) {
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

async fn seed_user_with_session(pool: &PgPool) -> (Uuid, String) {
    let uid = Uuid::new_v4();
    let token = format!("tts_feed_like_collect_{}", Uuid::new_v4());
    let now = Utc::now();
    let email = format!("feed-like-collect-{uid}@traveltrust.test");
    insert_user(
        pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(pool, &token, uid)
        .await
        .expect("insert_session");
    (uid, token)
}

async fn create_text_post(app: &Router, token: &str, body: &str) -> Uuid {
    create_text_post_tagged(app, token, body, None).await
}

async fn create_text_post_tagged(app: &Router, token: &str, body: &str, tag: Option<&str>) -> Uuid {
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
async fn setup_app_user_one_post(pool: &PgPool, body: &str) -> (Router, Uuid, Uuid, String) {
    let (uid, token) = seed_user_with_session(pool).await;
    let app = app_with_pool(pool.clone());
    let post_id = create_text_post(&app, &token, body).await;
    (app, uid, post_id, token)
}

#[tokio::test]
async fn f014_get_community_feed_lists_text_post_db_api() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f014_get_community_feed_lists_text_post_db_api (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, _token) = setup_app_user_one_post(&pool, "f014 feed probe body").await;

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?limit=20")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts array");
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(&post_id.to_string())),
        "feed should include created post id={post_id}"
    );

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn f016_post_community_like_db_api() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f016_post_community_like_db_api (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) = setup_app_user_one_post(&pool, "f016 like probe").await;

    let like = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot like");
    let like_st = like.status();
    let lj = response_json(like).await;
    assert_eq!(like_st, StatusCode::OK, "{:?}", lj);
    assert_eq!(lj["status"], "ok");
    assert_eq!(lj["created"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

#[tokio::test]
async fn f017_post_community_collect_db_api() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f017_post_community_collect_db_api (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) = setup_app_user_one_post(&pool, "f017 collect probe").await;

    let col = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot collect");
    let col_st = col.status();
    let cj = response_json(col).await;
    assert_eq!(col_st, StatusCode::OK, "{:?}", cj);
    assert_eq!(cj["status"], "ok");
    assert_eq!(cj["created"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001** → **§8.2 · F-014**：**`GET /api/v1/community/feed`** **200**；列表含已发帖。
#[tokio::test]
async fn matrix_93_d_com_001_get_feed_includes_seeded_text_post() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001_get_feed_includes_seeded_text_post (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, _token) =
        setup_app_user_one_post(&pool, "93 d-com-001 feed body").await;

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?limit=20")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts");
    assert!(posts
        .iter()
        .any(|p| p["id"].as_str() == Some(&post_id.to_string())));

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001**（**cursor 分页**）→ **§8.2 · F-014**：**`GET …/community/feed?limit=1`** 取 **`next_cursor`** → 第二页 **`200`** 且含更旧帖。
#[tokio::test]
async fn matrix_93_d_com_001_f014_feed_cursor_second_page_includes_older_post_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001_f014_feed_cursor_second_page_includes_older_post_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid_a, token_a) = seed_user_with_session(&pool).await;
    let (uid_b, token_b) = seed_user_with_session(&pool).await;
    let app = app_with_pool(pool.clone());
    let tag = format!("m93cur{}", Uuid::new_v4().simple());
    let _post_older =
        create_text_post_tagged(&app, &token_a, "93 d-com-001 cursor older", Some(&tag)).await;
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    let post_newer =
        create_text_post_tagged(&app, &token_b, "93 d-com-001 cursor newer", Some(&tag)).await;

    let mut u1 = Url::parse("http://tt.internal").expect("static base url");
    u1.set_path("/api/v1/community/feed");
    u1.query_pairs_mut()
        .append_pair("limit", "1")
        .append_pair("tag", &tag);
    let uri1 = format!("{}?{}", u1.path(), u1.query().expect("q1"));

    let page1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(uri1)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed page1");
    let p1_st = page1.status();
    let p1j = response_json(page1).await;
    assert_eq!(p1_st, StatusCode::OK, "{:?}", p1j);
    assert_eq!(p1j["status"], "ok");
    let posts1 = p1j["posts"].as_array().expect("posts page1");
    assert_eq!(posts1.len(), 1);
    let newer_s = post_newer.to_string();
    assert_eq!(posts1[0]["id"].as_str(), Some(newer_s.as_str()));
    let Some(next_c) = p1j["next_cursor"].as_str() else {
        panic!("expected next_cursor when limit=1 and at least two public posts exist");
    };

    let mut u = Url::parse("http://tt.internal").expect("static base url");
    u.set_path("/api/v1/community/feed");
    u.query_pairs_mut()
        .append_pair("limit", "1")
        .append_pair("tag", &tag)
        .append_pair("cursor", next_c);
    let path_q = format!("{}?{}", u.path(), u.query().expect("query built"));

    let page2 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(path_q)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed page2");
    let p2_st = page2.status();
    let p2j = response_json(page2).await;
    assert_eq!(p2_st, StatusCode::OK, "{:?}", p2j);
    assert_eq!(p2j["status"], "ok");
    let posts2 = p2j["posts"].as_array().expect("posts page2");
    assert!(
        !posts2.is_empty(),
        "second page should include older public post(s)"
    );
    assert!(
        posts2
            .iter()
            .all(|p| p["id"].as_str() != Some(newer_s.as_str())),
        "cursor page must not repeat newest id"
    );

    cleanup_user_and_posts(&pool, uid_a).await;
    cleanup_user_and_posts(&pool, uid_b).await;
}

/// **93 · D-COM-001**（**cursor 分页**）→ **§8.2 · F-014**：同 **`matrix_93_d_com_001_f014_feed_cursor_second_page_includes_older_post_pg`**，**`router::app`**（**`IdempotencyCache` + merge 序**）。
#[tokio::test]
async fn matrix_93_d_com_001b_f014_feed_cursor_second_page_includes_older_post_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001b_f014_feed_cursor_second_page_includes_older_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (uid_a, token_a) = seed_user_with_session(&pool).await;
    let (uid_b, token_b) = seed_user_with_session(&pool).await;
    let app = app_stack_feed_pool(pool.clone());
    let tag = format!("m93curb{}", Uuid::new_v4().simple());
    let _post_older =
        create_text_post_tagged(&app, &token_a, "93 d-com-001b cursor older", Some(&tag)).await;
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    let post_newer =
        create_text_post_tagged(&app, &token_b, "93 d-com-001b cursor newer", Some(&tag)).await;

    let mut u1 = Url::parse("http://tt.internal").expect("static base url");
    u1.set_path("/api/v1/community/feed");
    u1.query_pairs_mut()
        .append_pair("limit", "1")
        .append_pair("tag", &tag);
    let uri1 = format!("{}?{}", u1.path(), u1.query().expect("q1"));

    let page1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(uri1)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed page1 app_stack");
    let p1_st = page1.status();
    let p1j = response_json(page1).await;
    assert_eq!(p1_st, StatusCode::OK, "{:?}", p1j);
    assert_eq!(p1j["status"], "ok");
    let posts1 = p1j["posts"].as_array().expect("posts page1");
    assert_eq!(posts1.len(), 1);
    let newer_s = post_newer.to_string();
    assert_eq!(posts1[0]["id"].as_str(), Some(newer_s.as_str()));
    let Some(next_c) = p1j["next_cursor"].as_str() else {
        panic!("expected next_cursor when limit=1 and at least two public posts exist");
    };

    let mut u = Url::parse("http://tt.internal").expect("static base url");
    u.set_path("/api/v1/community/feed");
    u.query_pairs_mut()
        .append_pair("limit", "1")
        .append_pair("tag", &tag)
        .append_pair("cursor", next_c);
    let path_q = format!("{}?{}", u.path(), u.query().expect("query built"));

    let page2 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(path_q)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed page2 app_stack");
    let p2_st = page2.status();
    let p2j = response_json(page2).await;
    assert_eq!(p2_st, StatusCode::OK, "{:?}", p2j);
    assert_eq!(p2j["status"], "ok");
    let posts2 = p2j["posts"].as_array().expect("posts page2");
    assert!(
        !posts2.is_empty(),
        "second page should include older public post(s)"
    );
    assert!(
        posts2
            .iter()
            .all(|p| p["id"].as_str() != Some(newer_s.as_str())),
        "cursor page must not repeat newest id"
    );

    cleanup_user_and_posts(&pool, uid_a).await;
    cleanup_user_and_posts(&pool, uid_b).await;
}

/// **93 · D-COM-002** → **§8.2 · F-015**：**`POST …/posts`** + **`GET …/posts/:id`** **200**；正文一致。
#[tokio::test]
async fn matrix_93_d_com_002_post_then_get_post_detail_matches() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_002_post_then_get_post_detail_matches (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let body = "93 d-com-002 detail body";
    let (app, uid, post_id, token) = setup_app_user_one_post(&pool, body).await;

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot get post");
    let get_st = get.status();
    let gj = response_json(get).await;
    assert_eq!(get_st, StatusCode::OK, "{:?}", gj);
    assert_eq!(gj["post"]["id"], post_id.to_string());
    assert_eq!(gj["post"]["body"].as_str(), Some(body));

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-003** → **§8.2 · F-016**：**`POST …/like`** 首次 **`created: true`**；二次 **`created: false`**（幂等）。
#[tokio::test]
async fn matrix_93_d_com_003_post_like_twice_idempotent() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_d_com_003_post_like_twice_idempotent (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) = setup_app_user_one_post(&pool, "93 d-com-003 like body").await;

    let like1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like1");
    let st1 = like1.status();
    let j1 = response_json(like1).await;
    assert_eq!(st1, StatusCode::OK, "{:?}", j1);
    assert_eq!(j1["status"], "ok");
    assert_eq!(j1["created"], true);

    let like2 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like2");
    let st2 = like2.status();
    let j2 = response_json(like2).await;
    assert_eq!(st2, StatusCode::OK, "{:?}", j2);
    assert_eq!(j2["status"], "ok");
    assert_eq!(j2["created"], false);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-008** → **§8.2 · F-017**：**`POST …/collect`** 首次 **`created: true`**；二次 **`created: false`**。
#[tokio::test]
async fn matrix_93_d_com_008_post_collect_twice_idempotent() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_d_com_008_post_collect_twice_idempotent (DATABASE_URL unset)");
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_user_one_post(&pool, "93 d-com-008 collect body").await;

    let c1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("collect1");
    let st1 = c1.status();
    let j1 = response_json(c1).await;
    assert_eq!(st1, StatusCode::OK, "{:?}", j1);
    assert_eq!(j1["status"], "ok");
    assert_eq!(j1["created"], true);

    let c2 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("collect2");
    let st2 = c2.status();
    let j2 = response_json(c2).await;
    assert_eq!(st2, StatusCode::OK, "{:?}", j2);
    assert_eq!(j2["status"], "ok");
    assert_eq!(j2["created"], false);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-008** → **§8.2 · F-017**：**`POST …/collect`** 幂等（**`router::app`**；与 **`matrix_93_d_com_008_post_collect_twice_idempotent`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_008_f017_post_collect_twice_idempotent_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_008_f017_post_collect_twice_idempotent_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-008 app_stack collect body").await;

    let c1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("collect1 app_stack");
    let st1 = c1.status();
    let j1 = response_json(c1).await;
    assert_eq!(st1, StatusCode::OK, "{:?}", j1);
    assert_eq!(j1["status"], "ok");
    assert_eq!(j1["created"], true);

    let c2 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("collect2 app_stack");
    let st2 = c2.status();
    let j2 = response_json(c2).await;
    assert_eq!(st2, StatusCode::OK, "{:?}", j2);
    assert_eq!(j2["status"], "ok");
    assert_eq!(j2["created"], false);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001** → **§8.2 · F-014**：**`GET …/community/feed`**（**`router::app`**；与 **`community::router()`** **`matrix_93_d_com_001_get_feed_includes_seeded_text_post`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_001_f014_get_feed_includes_seeded_text_post_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001_f014_get_feed_includes_seeded_text_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, _token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-001 app_stack feed body").await;

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?limit=20")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed app_stack");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts");
    assert!(posts
        .iter()
        .any(|p| p["id"].as_str() == Some(&post_id.to_string())));

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001** → **§8.2 · F-014**：**`GET …/community/feed?tag=`** **200** 且 **`posts`** **含** **带** **`tags[]`** **的帖**（**`router::app`**；与 **`001`/`001b`** **无** **`tag` 单列过滤** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001c_f014_get_feed_tag_filter_includes_tagged_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let tag = format!("m93f014{}", Uuid::new_v4().simple());
    let body = "93 d-com-001c app_stack feed tag filter body";
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_stack_feed_pool(pool.clone());
    let post_id = create_text_post_tagged(&app, &token, body, Some(&tag)).await;

    let feed_uri = format!("/api/v1/community/feed?limit=50&tag={tag}");

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&feed_uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed tag filter app_stack");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts");
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(&post_id.to_string())),
        "feed tag={tag} should include post id={post_id}: {posts:?}"
    );

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001** → **§8.2 · F-014**：**匿名** **`GET …/community/feed?mode=hot&limit=50`** **200** **`posts`** **含** **Bearer** **发帖** **种子** **`id`**（**`router::app`**；与 **`recommend` 默认** **`001_f014_*`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001e_f014_get_feed_hot_mode_includes_seeded_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let body = "93 d-com-001e app_stack feed mode=hot body";
    let (app, uid, post_id, _token) = setup_app_stack_user_one_post(&pool, body).await;

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?mode=hot&limit=50")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed hot app_stack");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts");
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(&post_id.to_string())),
        "hot feed should include seeded post id={post_id}"
    );

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001** → **§8.2 · F-014**：**Bearer** **`GET …/community/feed?mode=follow&limit=20`** **200** **`status=ok`** **`posts`** **为数组**（**`router::app`**；与 **匿名** **`001e_*` `mode=hot`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_001f_f014_bearer_get_feed_follow_mode_ok_shape_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001f_f014_bearer_get_feed_follow_mode_ok_shape_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let body = "93 d-com-001f app_stack follow feed body";
    let (uid, token) = seed_user_with_session(&pool).await;
    let app = app_stack_feed_pool(pool.clone());
    let _post_id = create_text_post(&app, &token, body).await;

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?mode=follow&limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed follow app_stack");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    assert_eq!(fj["status"], "ok");
    let _posts = fj["posts"].as_array().expect("posts array");

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001** → **§8.2 · F-014**：**`insert_follow(follower→author)`** **后** **关注者 Bearer** **`GET …/community/feed?mode=follow`** **`posts`** **含** **作者** **`POST …/posts`** **新帖** **`id`**（**`router::app`**；与 **`001f_*` 仅形状** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_001g_f014_bearer_follow_feed_includes_followed_author_post_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_001g_f014_bearer_follow_feed_includes_followed_author_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;

    let (follower_id, follower_token) = seed_user_with_session(&pool).await;
    let (author_id, author_token) = seed_user_with_session(&pool).await;
    insert_follow(&pool, follower_id, author_id)
        .await
        .expect("insert_follow follower->author");

    let app = app_stack_feed_pool(pool.clone());
    let body = "93 d-com-001g follow feed includes author post";
    let post_id = create_text_post(&app, &author_token, body).await;

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?mode=follow&limit=30")
                .header(header::AUTHORIZATION, auth_bearer(&follower_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed follow 001g");
    let feed_st = feed.status();
    let fj = response_json(feed).await;
    assert_eq!(feed_st, StatusCode::OK, "{:?}", fj);
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts array");
    let want = post_id.to_string();
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(want.as_str())),
        "follow feed should include followed author's post id={want} posts={posts:?}"
    );

    cleanup_user_and_posts(&pool, author_id).await;
    cleanup_user_and_posts(&pool, follower_id).await;
}

/// **93 · D-COM-002** → **§8.2 · F-015**：**`POST …/posts`→`GET …/posts/:id`**（**`router::app`**；与 **`matrix_93_d_com_002_post_then_get_post_detail_matches`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_002_f015_post_then_get_post_detail_matches_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_002_f015_post_then_get_post_detail_matches_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let body = "93 d-com-002 app_stack detail body";
    let (app, uid, post_id, token) = setup_app_stack_user_one_post(&pool, body).await;

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot get post app_stack");
    let get_st = get.status();
    let gj = response_json(get).await;
    assert_eq!(get_st, StatusCode::OK, "{:?}", gj);
    assert_eq!(gj["post"]["id"], post_id.to_string());
    assert_eq!(gj["post"]["body"].as_str(), Some(body));

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-002** → **§8.2 · F-015**：**Bearer** **发帖** 后 **无** **`Authorization`** **`GET …/posts/:id`** **公开帖** **200**（**`router::app`**；**`liked_by_me`** **缺省** **≠** **403**）。
#[tokio::test]
async fn matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg()
{
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_002b_f015_post_bearer_then_get_detail_unauthenticated_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let body = "93 d-com-002b app_stack anon detail body";
    let (app, uid, post_id, _token) = setup_app_stack_user_one_post(&pool, body).await;

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot get post unauthenticated app_stack");
    let get_st = get.status();
    let gj = response_json(get).await;
    assert_eq!(get_st, StatusCode::OK, "{:?}", gj);
    assert_eq!(gj["post"]["id"], post_id.to_string());
    assert_eq!(gj["post"]["body"].as_str(), Some(body));
    assert!(
        gj["post"].get("liked_by_me").is_none(),
        "anonymous detail must omit liked_by_me"
    );

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-003** → **§8.2 · F-016**：**`POST …/like`** 幂等（**`router::app`**；与 **`matrix_93_d_com_003_post_like_twice_idempotent`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_003_f016_post_like_twice_idempotent_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_003_f016_post_like_twice_idempotent_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-003 app_stack like body").await;

    let like1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like1 app_stack");
    let st1 = like1.status();
    let j1 = response_json(like1).await;
    assert_eq!(st1, StatusCode::OK, "{:?}", j1);
    assert_eq!(j1["status"], "ok");
    assert_eq!(j1["created"], true);

    let like2 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like2 app_stack");
    let st2 = like2.status();
    let j2 = response_json(like2).await;
    assert_eq!(st2, StatusCode::OK, "{:?}", j2);
    assert_eq!(j2["status"], "ok");
    assert_eq!(j2["created"], false);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-003** → **§8.2 · F-016**：**`POST …/like`** → **`DELETE …/like`** → 再 **`POST …/like`** **`created:true`**（**`router::app`**；**`DELETE …/like`** 主栈正路径）。
#[tokio::test]
async fn matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_003b_f016_post_like_delete_relike_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-003b app_stack like delete body").await;

    let like1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like post app_stack");
    assert_eq!(like1.status(), StatusCode::OK);
    let j1 = response_json(like1).await;
    assert_eq!(j1["status"], "ok");
    assert_eq!(j1["created"], true);

    let del = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("delete like app_stack");
    assert_eq!(del.status(), StatusCode::OK);
    let dj = response_json(del).await;
    assert_eq!(dj["status"], "ok");

    let like2 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like post after delete app_stack");
    assert_eq!(like2.status(), StatusCode::OK);
    let j2 = response_json(like2).await;
    assert_eq!(j2["status"], "ok");
    assert_eq!(j2["created"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-008** → **§8.2 · F-017**：**`POST …/collect`** → **`DELETE …/collect`** → 再 **`POST …/collect`** **`created:true`**（**`router::app`**；**`DELETE …/collect`** 主栈正路径）。
#[tokio::test]
async fn matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_008b_f017_post_collect_delete_recollect_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-008b app_stack collect delete body").await;

    let c1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("collect post app_stack");
    assert_eq!(c1.status(), StatusCode::OK);
    let j1 = response_json(c1).await;
    assert_eq!(j1["status"], "ok");
    assert_eq!(j1["created"], true);

    let del = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("delete collect app_stack");
    assert_eq!(del.status(), StatusCode::OK);
    let dj = response_json(del).await;
    assert_eq!(dj["status"], "ok");

    let c2 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("collect post after delete app_stack");
    assert_eq!(c2.status(), StatusCode::OK);
    let j2 = response_json(c2).await;
    assert_eq!(j2["status"], "ok");
    assert_eq!(j2["created"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · `GET …/me/collects`** → **§8.2 · F-019**：收藏后 **`GET /api/v1/community/me/collects`** 列表含 **`post_id`**（**`router::app`**；与 **`matrix_93_d_com_009_get_me_posts_lists_own_post`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_009b_f019_get_me_collects_includes_post_after_collect_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009b_f019_get_me_collects_includes_post_after_collect_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-009b app_stack me collects body").await;

    let c = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("collect for me_collects app_stack");
    assert_eq!(c.status(), StatusCode::OK);
    let cj = response_json(c).await;
    assert_eq!(cj["status"], "ok");
    assert_eq!(cj["created"], true);

    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/collects?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get me collects app_stack");
    assert_eq!(list.status(), StatusCode::OK);
    let lj = response_json(list).await;
    assert_eq!(lj["status"], "ok");
    let collects = lj["collects"].as_array().expect("collects");
    assert!(collects
        .iter()
        .any(|row| { row.get("post_id").and_then(|v| v.as_str()) == Some(&post_id.to_string()) }));

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-003** → **§8.2 · F-016**：**`POST …/like`** 后 **`GET …/posts/:id`** **`post.liked_by_me`** **`true`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_003d_f016_get_post_detail_liked_by_me_true_after_like_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_003d_f016_get_post_detail_liked_by_me_true_after_like_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-003d app_stack liked_by_me body").await;

    let like = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like for detail app_stack");
    assert_eq!(like.status(), StatusCode::OK);

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get post detail app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["status"], "ok");
    assert_eq!(gj["post"]["liked_by_me"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-008** → **§8.2 · F-017**：**`POST …/collect`** 后 **`GET …/posts/:id`** **`post.collected_by_me`** **`true`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_008c_f017_get_post_detail_collected_by_me_true_after_collect_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_008c_f017_get_post_detail_collected_by_me_true_after_collect_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-008c app_stack collected_by_me body").await;

    let c = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("collect for detail app_stack");
    assert_eq!(c.status(), StatusCode::OK);

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get post detail collect app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["status"], "ok");
    assert_eq!(gj["post"]["collected_by_me"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · `GET …/me/likes`** → **§8.2 · F-019**：点赞后 **`GET /api/v1/community/me/likes`** 列表含 **`post_id`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_009c_f019_get_me_likes_includes_post_after_like_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009c_f019_get_me_likes_includes_post_after_like_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-009c app_stack me likes body").await;

    let like = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like for me_likes app_stack");
    assert_eq!(like.status(), StatusCode::OK);
    let lj0 = response_json(like).await;
    assert_eq!(lj0["status"], "ok");
    assert_eq!(lj0["created"], true);

    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/likes?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get me likes app_stack");
    assert_eq!(list.status(), StatusCode::OK);
    let lj = response_json(list).await;
    assert_eq!(lj["status"], "ok");
    let likes = lj["likes"].as_array().expect("likes");
    assert!(likes
        .iter()
        .any(|row| { row.get("post_id").and_then(|v| v.as_str()) == Some(&post_id.to_string()) }));

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-003** → **§8.2 · F-016**：**`POST …/like`** → **`DELETE …/like`** → **`GET …/posts/:id`** **`post.liked_by_me`** **`false`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_003e_f016_get_post_detail_liked_by_me_false_after_unlike_app_stack_ok_pg()
{
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_003e_f016_get_post_detail_liked_by_me_false_after_unlike_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-003e app_stack unlike detail body").await;

    let like = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like before unlike app_stack");
    assert_eq!(like.status(), StatusCode::OK);

    let del = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("delete like app_stack");
    assert_eq!(del.status(), StatusCode::OK);
    let dj = response_json(del).await;
    assert_eq!(dj["status"], "ok");

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get post detail after unlike app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["status"], "ok");
    assert_eq!(gj["post"]["liked_by_me"], false);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-008** → **§8.2 · F-017**：**`POST …/collect`** → **`DELETE …/collect`** → **`GET …/posts/:id`** **`post.collected_by_me`** **`false`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_008d_f017_get_post_detail_collected_by_me_false_after_uncollect_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_008d_f017_get_post_detail_collected_by_me_false_after_uncollect_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-008d app_stack uncollect detail body").await;

    let c = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("collect before uncollect app_stack");
    assert_eq!(c.status(), StatusCode::OK);

    let del = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("delete collect app_stack");
    assert_eq!(del.status(), StatusCode::OK);
    let dj = response_json(del).await;
    assert_eq!(dj["status"], "ok");

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get post detail after uncollect app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["status"], "ok");
    assert_eq!(gj["post"]["collected_by_me"], false);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · `GET …/me/likes`** → **§8.2 · F-019**：**`POST …/like`** → **`DELETE …/like`** → **`GET …/me/likes`** **不含** **`post_id`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_009d_f019_get_me_likes_excludes_post_after_unlike_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009d_f019_get_me_likes_excludes_post_after_unlike_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-009d app_stack me likes after unlike body")
            .await;

    let like = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like before unlike me_likes app_stack");
    assert_eq!(like.status(), StatusCode::OK);

    let del = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("delete like me_likes app_stack");
    assert_eq!(del.status(), StatusCode::OK);

    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/likes?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get me likes after unlike app_stack");
    assert_eq!(list.status(), StatusCode::OK);
    let lj = response_json(list).await;
    assert_eq!(lj["status"], "ok");
    let likes = lj["likes"].as_array().expect("likes");
    assert!(!likes
        .iter()
        .any(|row| { row.get("post_id").and_then(|v| v.as_str()) == Some(&post_id.to_string()) }));

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001 + D-COM-003** → **§8.2 · F-016**：**`POST …/like`** 后 **`GET …/feed`**（**Bearer**）对应帖 **`liked_by_me`** **`true`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_003f_f016_get_feed_post_liked_by_me_true_after_like_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_003f_f016_get_feed_post_liked_by_me_true_after_like_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-003f app_stack feed liked_by_me body").await;

    let like = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like before feed app_stack");
    assert_eq!(like.status(), StatusCode::OK);

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get feed after like app_stack");
    assert_eq!(feed.status(), StatusCode::OK);
    let fj = response_json(feed).await;
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts");
    let row = posts
        .iter()
        .find(|p| p["id"].as_str() == Some(&post_id.to_string()))
        .expect("post in feed");
    assert_eq!(row["liked_by_me"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-003** → **§8.2 · F-016**：**Bearer** **`POST …/like`** 后 **无身份头** **`GET …/posts/:id`**：**`like_count`≥1** 且 **无** **`liked_by_me`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_003g_f016_like_then_get_detail_unauthenticated_like_count_ok_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_003g_f016_like_then_get_detail_unauthenticated_like_count_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-003g anon like_count body").await;

    let like = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/like"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("like before anon detail app_stack");
    assert_eq!(like.status(), StatusCode::OK);

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get post unauthenticated after like app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["post"]["id"], post_id.to_string());
    let lc = gj["post"]["like_count"].as_i64().unwrap_or(0);
    assert!(lc >= 1, "like_count should reflect like; got {lc}");
    assert!(
        gj["post"].get("liked_by_me").is_none(),
        "anonymous viewer must not receive liked_by_me"
    );

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-001 + D-COM-008** → **§8.2 · F-017**：**`POST …/collect`** 后 **`GET …/feed`**（**Bearer**）对应帖 **`collected_by_me`** **`true`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_008e_f017_get_feed_post_collected_by_me_true_after_collect_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_008e_f017_get_feed_post_collected_by_me_true_after_collect_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-008e app_stack feed collected_by_me body")
            .await;

    let c = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("collect before feed app_stack");
    assert_eq!(c.status(), StatusCode::OK);

    let feed = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/feed?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get feed after collect app_stack");
    assert_eq!(feed.status(), StatusCode::OK);
    let fj = response_json(feed).await;
    assert_eq!(fj["status"], "ok");
    let posts = fj["posts"].as_array().expect("posts");
    let row = posts
        .iter()
        .find(|p| p["id"].as_str() == Some(&post_id.to_string()))
        .expect("post in feed");
    assert_eq!(row["collected_by_me"], true);

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · D-COM-008** → **§8.2 · F-017**：**Bearer** **`POST …/collect`** 后 **无身份头** **`GET …/posts/:id`**：**`collect_count`≥1** 且 **无** **`collected_by_me`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_008f_f017_collect_then_get_detail_unauthenticated_collect_count_ok_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_008f_f017_collect_then_get_detail_unauthenticated_collect_count_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) = setup_app_stack_user_one_post(
        &pool,
        "93 d-com-008f app_stack collect_count anon detail body",
    )
    .await;

    let c = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("collect before anon detail app_stack");
    assert_eq!(c.status(), StatusCode::OK);

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/community/posts/{post_id}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get post unauthenticated after collect app_stack");
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(gj["post"]["id"], post_id.to_string());
    let cc = gj["post"]["collect_count"].as_i64().unwrap_or(0);
    assert!(cc >= 1, "collect_count should reflect collect; got {cc}");
    assert!(
        gj["post"].get("collected_by_me").is_none(),
        "anonymous viewer must not receive collected_by_me"
    );

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · `GET …/me/collects`** → **§8.2 · F-019**：**`POST …/collect`** → **`DELETE …/collect`** → **`GET …/me/collects`** **不含** **`post_id`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_009e_f019_get_me_collects_excludes_post_after_uncollect_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009e_f019_get_me_collects_excludes_post_after_uncollect_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, post_id, token) = setup_app_stack_user_one_post(
        &pool,
        "93 d-com-009e app_stack me collects after uncollect body",
    )
    .await;

    let c = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("collect before uncollect me_collects app_stack");
    assert_eq!(c.status(), StatusCode::OK);

    let del = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!("/api/v1/community/posts/{post_id}/collect"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("delete collect me_collects app_stack");
    assert_eq!(del.status(), StatusCode::OK);

    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/collects?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get me collects after uncollect app_stack");
    assert_eq!(list.status(), StatusCode::OK);
    let lj = response_json(list).await;
    assert_eq!(lj["status"], "ok");
    let collects = lj["collects"].as_array().expect("collects");
    assert!(!collects
        .iter()
        .any(|row| { row.get("post_id").and_then(|v| v.as_str()) == Some(&post_id.to_string()) }));

    cleanup_user_and_posts(&pool, uid).await;
}

/// **93 · `GET …/me/likes`** → **§8.2 · F-019**：**Bearer** **从未点赞** **`GET …/me/likes`** **`likes`=[]**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_009g_f019_get_me_likes_empty_list_ok_bearer_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_009g_f019_get_me_likes_empty_list_ok_bearer_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = db_it_lock().lock().await;
    let (app, uid, _post_id, token) =
        setup_app_stack_user_one_post(&pool, "93 d-com-009g empty me likes body").await;

    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/community/me/likes?limit=20")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("get me likes empty app_stack");
    assert_eq!(list.status(), StatusCode::OK);
    let lj = response_json(list).await;
    assert_eq!(lj["status"], "ok");
    let likes = lj["likes"].as_array().expect("likes");
    assert!(
        likes.is_empty(),
        "expected empty likes list before any like; got {likes:?}"
    );

    cleanup_user_and_posts(&pool, uid).await;
}
