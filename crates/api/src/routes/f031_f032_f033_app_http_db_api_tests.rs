//! **F-031 / F-032 / F-033** · **`router::app`** + **`DATABASE_URL`** · **`Router::oneshot`** **API·IT 正路径**（与 **`main`** 中间件序一致；**非**子域 **`community::router()`**/**`trust_growth::router()`**/**`itineraries::router()`** 单栈）。**F-032·Admin obs**：**`GET /api/v1/admin/trust-growth/observability`** 须 **`sessions` Bearer** + **`ChainOffStore.users`** 种子（**`app_with_pool_seeded_users`**）。**F-032·Admin control**：**`PATCH /api/v1/admin/trust-growth/control`**（**`matrix_93_b_tgr_002c_f032_patch_admin_trust_growth_control_weights_frozen_app_stack_ok_pg`**；**v1.4.258**）。**F-032·config**：**`GET /api/v1/trust-growth/config`** **`autopilot_generation`** **↔** **`trust_growth_runtime_state`** **PG**（**`matrix_93_b_tgr_001_f032_get_trust_growth_config_autopilot_gen_matches_runtime_state_pg`**）。**v1.4.260**：**`001b`** **`ingest` 后** **`trust_growth_autopilot_gen_for_env`** **对拍** **`GET …/config`**（**`weights_frozen=false` 可推进代**）；**`cleanup_*`** **`DELETE FROM sessions`** **先行**。**v1.4.256**：**`matrix_93_d_com_011b_f031_*`**（**`Authorization: Bearer`** + **`sessions`**）；**`matrix_93_b_tgr_001b_f032_post_ingest_then_get_trust_growth_config_ok_pg`**（**ingest→config** **链式**）；**`matrix_93_d_itn_002b_f033_*`** / **`matrix_93_d_itn_003b_f033_*`**（**Bearer** **替代** **`x-user-id`**）。**v1.4.273**：**`matrix_93_d_com_011c_f031_bearer_post_then_anon_feed_includes_post_app_stack_ok_pg`**（**Bearer `POST …/posts`**→**无头 `GET …/feed`** **`posts[].id`**）。**v1.4.274**：**`matrix_93_d_com_011d_f031_bearer_post_select_commerce_then_hot_feed_includes_post_app_stack_ok_pg`**（**`SELECT commerce_*` PG 锚** **+** **无头 `GET …/feed?mode=hot`**）。**v1.4.275**：**`matrix_93_d_com_011e_f031_bearer_post_then_bearer_follow_feed_ok_shape_app_stack_ok_pg`**（**Bearer `POST …/posts`**→**Bearer `GET …/feed?mode=follow`** **`200`** **`posts`** **数组**）。**v1.4.276**：**`matrix_93_d_com_011f_f031_follower_get_follow_feed_includes_author_acquisition_post_app_stack_ok_pg`**（**`insert_follow`** **+** **作者 `acquisition_led` 发帖**→**关注者 `mode=follow`** **`posts[].id`**）。
//!
//! **93**：**`matrix_93_d_com_011_f031_*`** / **`matrix_93_d_com_011b_f031_*`** / **`matrix_93_d_com_011c_f031_*`** / **`matrix_93_d_com_011d_f031_*`** / **`matrix_93_d_com_011e_f031_*`** / **`matrix_93_d_com_011f_f031_*`** ↔ **D-COM-011**/**F-031**（**`POST …/community/posts`** **+** **`GET …/community/feed`** **`posts[].id`**；**`011c_*`** = **Bearer** **发帖** **后** **匿名 Feed 读回**；**`011d_*`** = **`commerce_*` PG** **+** **`mode=hot`** **匿名 Feed**；**`011e_*`** = **Bearer `mode=follow`** **Feed 形状**；**`011f_*`** = **`community_follows`** **+** **关注者读** **`mode=follow`** **含 commerce 帖**）；**`matrix_93_b_tgr_001_f032_*`** / **`matrix_93_b_tgr_001b_f032_*`** / **`matrix_93_b_tgr_002c_f032_*`** ↔ **B-TGR-001**/**F-032**；**`matrix_93_d_itn_002_*`** / **`matrix_93_d_itn_002b_*`** / **`matrix_93_d_itn_003_*`** / **`matrix_93_d_itn_003b_*`** ↔ **D-ITN-002**/**D-ITN-003**/**F-033**（**`POST|GET …/itineraries/custom*`**；**`spec/93-全站功能验证矩阵-域别回归清单.md`**）。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**。三测串行以避免 PG 争用。

use std::sync::{Arc, OnceLock};
use tokio::sync::{Mutex, RwLock};

use axum::body::Body;
use axum::http::{header, HeaderValue, Request, StatusCode};
use chrono::Utc;
use http_body_util::BodyExt;
use serde_json::json;
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, UserRow};
use crate::db::{insert_follow, insert_session, insert_user};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;

static F031_F032_F033_APP_PG_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn triple_lock() -> &'static Mutex<()> {
    F031_F032_F033_APP_PG_LOCK.get_or_init(|| Mutex::new(()))
}

async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

async fn trust_growth_autopilot_gen_for_env(pool: &PgPool, tg_env: &str) -> i64 {
    sqlx::query_scalar(
        "SELECT COALESCE(autopilot_generation, 0) FROM trust_growth_runtime_state WHERE environment = $1",
    )
    .bind(tg_env)
    .fetch_optional(pool)
    .await
    .expect("select trust_growth_runtime_state.autopilot_generation")
    .unwrap_or(0)
}

async fn cleanup_community_user_listing(pool: &PgPool, uid: Uuid, listing_id: Uuid) {
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(uid)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM community_posts WHERE user_id = $1")
        .bind(uid)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM market_listings WHERE id = $1")
        .bind(listing_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(uid)
        .execute(pool)
        .await;
}

async fn insert_market_listing(
    pool: &PgPool,
    id: Uuid,
    variant: &str,
    owner_user_id: Uuid,
    status: &str,
    now: chrono::DateTime<Utc>,
) {
    sqlx::query(
        r#"INSERT INTO market_listings (id, variant, owner_user_id, payload, status, created_at, updated_at)
           VALUES ($1, $2, $3, '{}'::jsonb, $4, $5, $5)"#,
    )
    .bind(id)
    .bind(variant)
    .bind(owner_user_id)
    .bind(status)
    .bind(now)
    .execute(pool)
    .await
    .expect("insert market_listings");
}

async fn cleanup_admin_session_user(pool: &PgPool, user_id: Uuid) {
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
}

async fn cleanup_itinerary_orders(pool: &PgPool, tourist_id: Uuid) {
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(tourist_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM itinerary_custom_drafts WHERE owner_user_id = $1")
        .bind(tourist_id)
        .execute(pool)
        .await;
    let _ = sqlx::query(
        "DELETE FROM itineraries WHERE order_id IN (SELECT id FROM orders WHERE tourist_id = $1)",
    )
    .bind(tourist_id)
    .execute(pool)
    .await;
    let _ = sqlx::query("DELETE FROM orders WHERE tourist_id = $1")
        .bind(tourist_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(tourist_id)
        .execute(pool)
        .await;
}

fn app_with_pool(pool: PgPool) -> axum::Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

/// 与 **`insert_user`** 同源身份写入 **`ChainOffStore.users`**（**`require_admin_actor`** 读内存态）。
fn app_with_pool_seeded_users(pool: PgPool, users: Vec<UserRow>) -> axum::Router {
    let mut store = ChainOffStore::default();
    for u in users {
        store.users.insert(u.id, u);
    }
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

/// **F-031**：**`POST /api/v1/community/posts`** + **`commerce_showcase_kind`=`acquisition_led`** + **`commerce_market_listing_id`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_011_f031_post_community_post_acquisition_led_listing_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011_f031_post_community_post_acquisition_led_listing_pg (DATABASE_URL unset)"
        );
        return;
    };

    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f031-app-{uid}@traveltrust.test");

    cleanup_community_user_listing(&pool, uid, listing_id).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_market_listing(&pool, listing_id, "acquisition", uid, "published", now).await;

    let router = app_with_pool(pool.clone());
    let body = json!({
        "body": "f031 acquisition_led app stack",
        "post_type": "text",
        "commerce_showcase_kind": "acquisition_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = router
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-user-id", uid.to_string())
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let post_id: Uuid = v["id"].as_str().unwrap().parse().unwrap();

    let row: (Option<String>, Option<Uuid>) = sqlx::query_as(
        "SELECT commerce_showcase_kind, commerce_market_listing_id FROM community_posts WHERE id = $1",
    )
    .bind(post_id)
    .fetch_one(&pool)
    .await
    .expect("select commerce columns");
    assert_eq!(row.0.as_deref(), Some("acquisition_led"));
    assert_eq!(row.1, Some(listing_id));

    cleanup_community_user_listing(&pool, uid, listing_id).await;
}

/// **93 · D-COM-011** → **§8.2 · F-031**：**`POST …/community/posts`**（**`acquisition_led`**；**`Authorization: Bearer`** + **`sessions`**；**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_011b_f031_post_community_post_acquisition_led_listing_bearer_app_stack_ok_pg(
) {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011b_f031_post_community_post_acquisition_led_listing_bearer_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f031-bearer-{uid}@traveltrust.test");
    let session_token = format!("f031_bearer_sess_{}", Uuid::new_v4());

    cleanup_community_user_listing(&pool, uid, listing_id).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &session_token, uid)
        .await
        .expect("insert_session");
    insert_market_listing(&pool, listing_id, "acquisition", uid, "published", now).await;

    let router = app_with_pool(pool.clone());
    let auth = format!("Bearer {}", session_token);
    let body = json!({
        "body": "f031 acquisition_led bearer app stack",
        "post_type": "text",
        "commerce_showcase_kind": "acquisition_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = router
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth"),
                )
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let post_id: Uuid = v["id"].as_str().unwrap().parse().unwrap();

    let row: (Option<String>, Option<Uuid>) = sqlx::query_as(
        "SELECT commerce_showcase_kind, commerce_market_listing_id FROM community_posts WHERE id = $1",
    )
    .bind(post_id)
    .fetch_one(&pool)
    .await
    .expect("select commerce columns");
    assert_eq!(row.0.as_deref(), Some("acquisition_led"));
    assert_eq!(row.1, Some(listing_id));

    cleanup_community_user_listing(&pool, uid, listing_id).await;
}

/// **93 · D-COM-011** → **§8.2 · F-031**：**`POST …/community/posts`**（**acquisition_led**）后 **`GET /api/v1/community/feed`** **200** 且 **`posts`** 含该帖 **`id`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_com_011_f031_get_community_feed_includes_acquisition_led_post_after_create_pg()
{
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011_f031_get_community_feed_includes_acquisition_led_post_after_create_pg (DATABASE_URL unset)"
        );
        return;
    };

    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f031-feed-{uid}@traveltrust.test");

    cleanup_community_user_listing(&pool, uid, listing_id).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_market_listing(&pool, listing_id, "acquisition", uid, "published", now).await;

    let router = app_with_pool(pool.clone());
    let body = json!({
        "body": "f031 feed readback app stack",
        "post_type": "text",
        "commerce_showcase_kind": "acquisition_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-user-id", uid.to_string())
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot post");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    let post_id: Uuid = v["id"].as_str().unwrap().parse().unwrap();

    let feed_res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/community/feed?limit=50")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed");
    assert_eq!(
        feed_res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(feed_res).await
    );
    let feed_j = response_json(feed_res).await;
    assert_eq!(feed_j["status"], "ok");
    let posts = feed_j["posts"].as_array().expect("posts array");
    let want = post_id.to_string();
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(want.as_str())),
        "feed should include acquisition_led post id {want}"
    );

    cleanup_community_user_listing(&pool, uid, listing_id).await;
}

/// **93 · D-COM-011** → **§8.2 · F-031**：**Bearer** **`POST …/community/posts`**（**`acquisition_led`**）后 **无身份头** **`GET …/community/feed`** **`posts[].id`** **含新帖**（**`router::app`**；与 **`x-user-id`** **`011_f031_*`** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_011c_f031_bearer_post_then_anon_feed_includes_post_app_stack_ok_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011c_f031_bearer_post_then_anon_feed_includes_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f031-feed-bearer-{uid}@traveltrust.test");
    let session_token = format!("f031_feed_bearer_{}", Uuid::new_v4());

    cleanup_community_user_listing(&pool, uid, listing_id).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &session_token, uid)
        .await
        .expect("insert_session");
    insert_market_listing(&pool, listing_id, "acquisition", uid, "published", now).await;

    let router = app_with_pool(pool.clone());
    let auth = format!("Bearer {}", session_token);
    let body = json!({
        "body": "f031 011c bearer then anon feed app stack",
        "post_type": "text",
        "commerce_showcase_kind": "acquisition_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth"),
                )
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot post bearer");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let post_id: Uuid = v["id"].as_str().unwrap().parse().unwrap();

    let feed_res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/community/feed?limit=50")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed anon");
    assert_eq!(
        feed_res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(feed_res).await
    );
    let feed_j = response_json(feed_res).await;
    assert_eq!(feed_j["status"], "ok");
    let posts = feed_j["posts"].as_array().expect("posts array");
    let want = post_id.to_string();
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(want.as_str())),
        "anon feed should include acquisition_led post id {want}"
    );

    cleanup_community_user_listing(&pool, uid, listing_id).await;
}

/// **93 · D-COM-011** → **§8.2 · F-031**：**Bearer** **`POST …/community/posts`**（**`acquisition_led`**）→**`SELECT commerce_showcase_kind`/`commerce_market_listing_id`** **PG 行**→**匿名** **`GET …/community/feed?mode=hot`** **`posts[].id`**（**`router::app`**；与 **`011c_*`** **`recommend` 默认 Feed** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_011d_f031_bearer_post_select_commerce_then_hot_feed_includes_post_app_stack_ok_pg(
) {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011d_f031_bearer_post_select_commerce_then_hot_feed_includes_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f031-011d-hot-{uid}@traveltrust.test");
    let session_token = format!("f031_011d_sess_{}", Uuid::new_v4());

    cleanup_community_user_listing(&pool, uid, listing_id).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &session_token, uid)
        .await
        .expect("insert_session");
    insert_market_listing(&pool, listing_id, "acquisition", uid, "published", now).await;

    let router = app_with_pool(pool.clone());
    let auth = format!("Bearer {}", session_token);
    let body = json!({
        "body": "f031 011d commerce hot feed app stack",
        "post_type": "text",
        "commerce_showcase_kind": "acquisition_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth"),
                )
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot post bearer 011d");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let post_id: Uuid = v["id"].as_str().unwrap().parse().unwrap();

    let row: (Option<String>, Option<Uuid>) = sqlx::query_as(
        "SELECT commerce_showcase_kind, commerce_market_listing_id FROM community_posts WHERE id = $1",
    )
    .bind(post_id)
    .fetch_one(&pool)
    .await
    .expect("select commerce columns 011d");
    assert_eq!(row.0.as_deref(), Some("acquisition_led"));
    assert_eq!(row.1, Some(listing_id));

    let feed_res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/community/feed?mode=hot&limit=50")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed hot anon");
    assert_eq!(
        feed_res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(feed_res).await
    );
    let feed_j = response_json(feed_res).await;
    assert_eq!(feed_j["status"], "ok");
    let posts = feed_j["posts"].as_array().expect("posts array");
    let want = post_id.to_string();
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(want.as_str())),
        "hot feed should include acquisition_led post id {want}"
    );

    cleanup_community_user_listing(&pool, uid, listing_id).await;
}

/// **93 · D-COM-011** → **§8.2 · F-031**：**Bearer** **`POST …/community/posts`**（**`acquisition_led`**）后 **同 Bearer** **`GET …/community/feed?mode=follow&limit=50`** **200** **`status=ok`** **`posts`** **数组**（**`router::app`**；无 **`community_follows`** 时 **可空**；与 **`011d_*` `mode=hot` 匿名** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_011e_f031_bearer_post_then_bearer_follow_feed_ok_shape_app_stack_ok_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011e_f031_bearer_post_then_bearer_follow_feed_ok_shape_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let uid = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f031-011e-follow-{uid}@traveltrust.test");
    let session_token = format!("f031_011e_sess_{}", Uuid::new_v4());

    cleanup_community_user_listing(&pool, uid, listing_id).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &session_token, uid)
        .await
        .expect("insert_session");
    insert_market_listing(&pool, listing_id, "acquisition", uid, "published", now).await;

    let router = app_with_pool(pool.clone());
    let auth = format!("Bearer {}", session_token);
    let body = json!({
        "body": "f031 011e bearer follow feed app stack",
        "post_type": "text",
        "commerce_showcase_kind": "acquisition_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth"),
                )
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot post bearer 011e");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");

    let feed_res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/community/feed?mode=follow&limit=50")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed follow bearer");
    assert_eq!(
        feed_res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(feed_res).await
    );
    let feed_j = response_json(feed_res).await;
    assert_eq!(feed_j["status"], "ok");
    let _posts = feed_j["posts"].as_array().expect("posts array");

    cleanup_community_user_listing(&pool, uid, listing_id).await;
}

/// **93 · D-COM-011** → **§8.2 · F-031**：**`insert_follow(follower→author)`** **后** **作者 Bearer** **`POST …/community/posts`**（**`acquisition_led`**）→**关注者 Bearer** **`GET …/community/feed?mode=follow`** **`posts`** **含** **该帖** **`id`**（**`router::app`**；与 **`011e_*` 同用户形状** **互补**）。
#[tokio::test]
async fn matrix_93_d_com_011f_f031_follower_get_follow_feed_includes_author_acquisition_post_app_stack_ok_pg(
) {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_com_011f_f031_follower_get_follow_feed_includes_author_acquisition_post_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let follower_id = Uuid::new_v4();
    let author_id = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let follower_email = format!("f031-011f-flw-{follower_id}@traveltrust.test");
    let follower_sess = format!("f031_011f_flw_{}", Uuid::new_v4());
    let author_email = format!("f031-011f-auth-{author_id}@traveltrust.test");
    let author_sess = format!("f031_011f_auth_{}", Uuid::new_v4());

    cleanup_community_user_listing(&pool, author_id, listing_id).await;
    cleanup_admin_session_user(&pool, follower_id).await;

    insert_user(
        &pool,
        author_id,
        &author_email,
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
    .expect("insert_user author 011f");
    insert_session(&pool, &author_sess, author_id)
        .await
        .expect("insert_session author");
    insert_market_listing(
        &pool,
        listing_id,
        "acquisition",
        author_id,
        "published",
        now,
    )
    .await;

    insert_user(
        &pool,
        follower_id,
        &follower_email,
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
    .expect("insert_user follower 011f");
    insert_session(&pool, &follower_sess, follower_id)
        .await
        .expect("insert_session follower");

    insert_follow(&pool, follower_id, author_id)
        .await
        .expect("insert_follow 011f");

    let router = app_with_pool(pool.clone());
    let auth_author = format!("Bearer {}", author_sess);
    let body = json!({
        "body": "f031 011f acquisition post for follow feed",
        "post_type": "text",
        "commerce_showcase_kind": "acquisition_led",
        "commerce_market_listing_id": listing_id.to_string(),
    });
    let res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/community/posts")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth_author).expect("auth author"),
                )
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot post author 011f");
    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let post_id: Uuid = v["id"].as_str().unwrap().parse().unwrap();

    let auth_follower = format!("Bearer {}", follower_sess);
    let feed_res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/community/feed?mode=follow&limit=50")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth_follower).expect("auth follower"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot feed follower 011f");
    assert_eq!(
        feed_res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(feed_res).await
    );
    let feed_j = response_json(feed_res).await;
    assert_eq!(feed_j["status"], "ok");
    let posts = feed_j["posts"].as_array().expect("posts array");
    let want = post_id.to_string();
    assert!(
        posts
            .iter()
            .any(|p| p["id"].as_str() == Some(want.as_str())),
        "follower follow feed should include author acquisition post id={want}"
    );

    cleanup_community_user_listing(&pool, author_id, listing_id).await;
    cleanup_admin_session_user(&pool, follower_id).await;
}

/// **F-032**：**`POST /api/v1/trust-growth/ingest`** **200**（**`router::app`**；**`trust_growth_moment_view`**）。
#[tokio::test]
async fn matrix_93_b_tgr_001_f032_post_trust_growth_ingest_moment_view_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_tgr_001_f032_post_trust_growth_ingest_moment_view_pg (DATABASE_URL unset)"
        );
        return;
    };

    let router = app_with_pool(pool);
    let run = Uuid::new_v4();
    let res = router
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/trust-growth/ingest")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "event": "trust_growth_moment_view",
                        "payload": { "moment": format!("f032_m_{run}"), "variant_id": format!("f032_v_{run}") }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["ok"], true);
    assert_eq!(v["status"], "ok");
    assert_eq!(v["pgrow3"]["storage"], "postgres");
}

/// **F-032**：**`GET /api/v1/admin/trust-growth/observability`** **200**（**`router::app`**；**Bearer** + **`sessions`**；**`trust_growth_observability_snapshot`**）。
#[tokio::test]
async fn matrix_93_b_tgr_001_f032_get_admin_trust_growth_observability_ok_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_tgr_001_f032_get_admin_trust_growth_observability_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f032-admin-obs-{admin_id}@traveltrust.test");
    let session_token = format!("f032_admin_obs_sess_{}", Uuid::new_v4());

    cleanup_admin_session_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user admin obs");
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin obs");

    let admin_row = UserRow {
        id: admin_id,
        email: email.clone(),
        password_hash: None,
        role: "admin".to_string(),
        kyc_status: "none".to_string(),
        nickname: None,
        avatar_url: None,
        default_wallet_address: None,
        email_verified_at: None,
        created_at: now,
        updated_at: now,
    };
    let router = app_with_pool_seeded_users(pool.clone(), vec![admin_row]);
    let auth = format!("Bearer {}", session_token);
    let res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/admin/trust-growth/observability")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["anchor"], "trust_growth_obs_v1");
    assert!(v["environment"].is_string());
    assert!(v["control"].is_object());
    assert!(v["metrics"].is_object());

    cleanup_admin_session_user(&pool, admin_id).await;
}

/// **93 · B-TGR-001** → **§8.2 · F-032**：**`PATCH /api/v1/admin/trust-growth/control`** **`200`**（**`router::app`**；**Admin Bearer** + **`sessions`**；**`weights_frozen`** **写回** **`trust_growth_control`**）。
#[tokio::test]
async fn matrix_93_b_tgr_002c_f032_patch_admin_trust_growth_control_weights_frozen_app_stack_ok_pg()
{
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_tgr_002c_f032_patch_admin_trust_growth_control_weights_frozen_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let admin_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f032-admin-ctl-{admin_id}@traveltrust.test");
    let session_token = format!("f032_admin_ctl_sess_{}", Uuid::new_v4());

    cleanup_admin_session_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user admin trust growth control");
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin trust growth control");

    let admin_row = UserRow {
        id: admin_id,
        email: email.clone(),
        password_hash: None,
        role: "admin".to_string(),
        kyc_status: "none".to_string(),
        nickname: None,
        avatar_url: None,
        default_wallet_address: None,
        email_verified_at: None,
        created_at: now,
        updated_at: now,
    };
    let router = app_with_pool_seeded_users(pool.clone(), vec![admin_row]);
    let auth = format!("Bearer {}", session_token);
    let patch = json!({ "weights_frozen": true });
    let res = router
        .oneshot(
            Request::builder()
                .method("PATCH")
                .uri("/api/v1/admin/trust-growth/control")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::from(patch.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["ok"], true);
    assert_eq!(v["control"]["weights_frozen"], true);
    assert!(v["runtime"]["autopilot_generation"].is_number());

    cleanup_admin_session_user(&pool, admin_id).await;
}

/// **93 · B-TGR-001** → **§8.2 · F-032**：**`GET /api/v1/trust-growth/config`** **`autopilot_generation`** **与** **`trust_growth_runtime_state`** **PG** 一致（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_tgr_001_f032_get_trust_growth_config_autopilot_gen_matches_runtime_state_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_tgr_001_f032_get_trust_growth_config_autopilot_gen_matches_runtime_state_pg (DATABASE_URL unset)"
        );
        return;
    };

    let tg_env = std::env::var("TRUST_GROWTH_ENV")
        .unwrap_or_else(|_| "default".to_string())
        .trim()
        .to_string();
    let gen_db = trust_growth_autopilot_gen_for_env(&pool, &tg_env).await;

    let router = app_with_pool(pool);
    let res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/trust-growth/config")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(v["ok"], true);
    assert_eq!(
        v["autopilot_generation"].as_i64(),
        Some(gen_db),
        "GET /trust-growth/config autopilot_generation should match trust_growth_runtime_state row"
    );
    assert_eq!(v["pgrow3"]["storage"], "postgres");
}

/// **93 · B-TGR-001** → **§8.2 · F-032**：**`POST /api/v1/trust-growth/ingest`**（**`moment_view`**）后 **`GET /api/v1/trust-growth/config`** **200**（**`router::app`**；**链式** **PG**）。
#[tokio::test]
async fn matrix_93_b_tgr_001b_f032_post_ingest_then_get_trust_growth_config_ok_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_tgr_001b_f032_post_ingest_then_get_trust_growth_config_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let tg_env = std::env::var("TRUST_GROWTH_ENV")
        .unwrap_or_else(|_| "default".to_string())
        .trim()
        .to_string();

    let router = app_with_pool(pool.clone());
    let run = Uuid::new_v4();
    let ingest_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/trust-growth/ingest")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "event": "trust_growth_moment_view",
                        "payload": { "moment": format!("f032_chain_m_{run}"), "variant_id": format!("f032_chain_v_{run}") }
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("oneshot ingest");

    assert_eq!(
        ingest_res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(ingest_res).await
    );
    let vi = response_json(ingest_res).await;
    assert_eq!(vi["ok"], true);
    assert_eq!(vi["status"], "ok");
    assert_eq!(vi["pgrow3"]["storage"], "postgres");
    let gen_db_after_ingest = trust_growth_autopilot_gen_for_env(&pool, &tg_env).await;
    assert_eq!(
        vi["autopilot_generation"].as_i64(),
        Some(gen_db_after_ingest),
        "ingest response autopilot_generation should match PG trust_growth_runtime_state after commit"
    );

    let cfg_res = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/trust-growth/config")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot config");

    assert_eq!(
        cfg_res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(cfg_res).await
    );
    let vc = response_json(cfg_res).await;
    assert_eq!(vc["status"], "ok");
    assert_eq!(vc["ok"], true);
    assert_eq!(
        vc["autopilot_generation"].as_i64(),
        Some(gen_db_after_ingest),
        "GET /trust-growth/config after ingest should match PG trust_growth_runtime_state (same as ingest body)"
    );
    assert_eq!(vc["pgrow3"]["storage"], "postgres");
}

/// **F-033**：**`POST /api/v1/itineraries/custom`** **200** + **`orders`/`itineraries` PG**（**`router::app`** + **`x-user-id`**）。
#[tokio::test]
async fn matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg (DATABASE_URL unset)"
        );
        return;
    };

    let uid = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f033-app-{uid}@traveltrust.test");

    cleanup_itinerary_orders(&pool, uid).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");

    let router = app_with_pool(pool.clone());
    let body = json!({
        "creator_type": "tourist",
        "country": "中国",
        "total_days": 2,
        "amount": 1500,
        "currency": "USD",
        "day_plans": [
            { "city": "北京", "attractions": ["故宫"], "food": [], "hotel": "Hotel A" },
            { "city": "上海", "attractions": [], "food": ["小笼"], "hotel": null }
        ]
    });

    let res = router
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/itineraries/custom")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-user-id", uid.to_string())
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(v["order_status"], "draft");
    let order_id: Uuid = v["order_id"].as_str().unwrap().parse().unwrap();

    let cnt: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM orders WHERE id = $1 AND tourist_id = $2")
            .bind(order_id)
            .bind(uid)
            .fetch_one(&pool)
            .await
            .expect("count orders");
    assert_eq!(cnt.0, 1);

    let icnt: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM itineraries WHERE order_id = $1")
        .bind(order_id)
        .fetch_one(&pool)
        .await
        .expect("count itineraries");
    assert_eq!(icnt.0, 1);

    cleanup_itinerary_orders(&pool, uid).await;
}

/// **93 · D-ITN-002** → **§8.2 · F-033**：**`POST /api/v1/itineraries/custom`**（**`Authorization: Bearer`** + **`sessions`**；**`router::app`**）**200** + **`orders`/`itineraries` PG**。
#[tokio::test]
async fn matrix_93_d_itn_002b_f033_post_itineraries_custom_persists_orders_bearer_app_stack_ok_pg()
{
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_002b_f033_post_itineraries_custom_persists_orders_bearer_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let uid = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f033-bearer-app-{uid}@traveltrust.test");
    let session_token = format!("f033_bearer_sess_{}", Uuid::new_v4());

    cleanup_itinerary_orders(&pool, uid).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &session_token, uid)
        .await
        .expect("insert_session");

    let router = app_with_pool(pool.clone());
    let auth = format!("Bearer {}", session_token);
    let body = json!({
        "creator_type": "tourist",
        "country": "中国",
        "total_days": 2,
        "amount": 1500,
        "currency": "USD",
        "day_plans": [
            { "city": "北京", "attractions": ["故宫"], "food": [], "hotel": "Hotel A" },
            { "city": "上海", "attractions": [], "food": ["小笼"], "hotel": null }
        ]
    });

    let res = router
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/itineraries/custom")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(v["order_status"], "draft");
    let order_id: Uuid = v["order_id"].as_str().unwrap().parse().unwrap();

    let cnt: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM orders WHERE id = $1 AND tourist_id = $2")
            .bind(order_id)
            .bind(uid)
            .fetch_one(&pool)
            .await
            .expect("count orders");
    assert_eq!(cnt.0, 1);

    let icnt: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM itineraries WHERE order_id = $1")
        .bind(order_id)
        .fetch_one(&pool)
        .await
        .expect("count itineraries");
    assert_eq!(icnt.0, 1);

    cleanup_itinerary_orders(&pool, uid).await;
}

/// **93 · D-ITN-003** → **§8.2 · F-033**：**`POST /api/v1/itineraries/custom/drafts`** **200** → **`GET /api/v1/itineraries/custom/drafts/:id`** **`payload`** 回读（**`router::app`** + **`x-user-id`** + **`itinerary_custom_drafts`** **PG**）。
#[tokio::test]
async fn matrix_93_d_itn_003_f033_post_custom_draft_then_get_roundtrip_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_003_f033_post_custom_draft_then_get_roundtrip_pg (DATABASE_URL unset)"
        );
        return;
    };

    let uid = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f033-draft-app-{uid}@traveltrust.test");

    cleanup_itinerary_orders(&pool, uid).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");

    let router = app_with_pool(pool.clone());
    let payload = json!({ "creatorType": "tourist", "note": "matrix_93_d_itn_003" });
    let post_body = json!({ "payload": payload.clone() });

    let res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/itineraries/custom/drafts")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-user-id", uid.to_string())
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot post draft");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let draft_id: Uuid = v["draft_id"].as_str().unwrap().parse().unwrap();

    let res_get = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(format!("/api/v1/itineraries/custom/drafts/{draft_id}"))
                .header("x-user-id", uid.to_string())
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot get draft");

    assert_eq!(
        res_get.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res_get).await
    );
    let vg = response_json(res_get).await;
    assert_eq!(vg["status"], "ok");
    assert_eq!(vg["draft_id"], draft_id.to_string());
    assert_eq!(vg["payload"], payload);

    let cnt: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM itinerary_custom_drafts WHERE id = $1 AND owner_user_id = $2",
    )
    .bind(draft_id)
    .bind(uid)
    .fetch_one(&pool)
    .await
    .expect("count itinerary_custom_drafts");
    assert_eq!(cnt.0, 1);

    cleanup_itinerary_orders(&pool, uid).await;
}

/// **93 · D-ITN-003** → **§8.2 · F-033**：**`POST|GET …/itineraries/custom/drafts*`**（**`Authorization: Bearer`** + **`sessions`**；**`router::app`**）**PG** 回读。
#[tokio::test]
async fn matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let uid = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f033-draft-bearer-app-{uid}@traveltrust.test");
    let session_token = format!("f033_draft_bearer_sess_{}", Uuid::new_v4());

    cleanup_itinerary_orders(&pool, uid).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &session_token, uid)
        .await
        .expect("insert_session");

    let router = app_with_pool(pool.clone());
    let auth = format!("Bearer {}", session_token);
    let payload = json!({ "creatorType": "tourist", "note": "matrix_93_d_itn_003b" });
    let post_body = json!({ "payload": payload.clone() });

    let res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/itineraries/custom/drafts")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot post draft");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let draft_id: Uuid = v["draft_id"].as_str().unwrap().parse().unwrap();

    let res_get = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(format!("/api/v1/itineraries/custom/drafts/{draft_id}"))
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot get draft");

    assert_eq!(
        res_get.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res_get).await
    );
    let vg = response_json(res_get).await;
    assert_eq!(vg["status"], "ok");
    assert_eq!(vg["draft_id"], draft_id.to_string());
    assert_eq!(vg["payload"], payload);

    let cnt: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM itinerary_custom_drafts WHERE id = $1 AND owner_user_id = $2",
    )
    .bind(draft_id)
    .bind(uid)
    .fetch_one(&pool)
    .await
    .expect("count itinerary_custom_drafts");
    assert_eq!(cnt.0, 1);

    cleanup_itinerary_orders(&pool, uid).await;
}
