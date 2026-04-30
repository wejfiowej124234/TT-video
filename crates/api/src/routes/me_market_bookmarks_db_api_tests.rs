//! **F-020 · API·IT（PostgreSQL + `Router::oneshot` + Bearer）**
//!
//! - **`POST /api/v1/me/market-bookmarks`**（**`target_type=order`**）→ **`status=ok`**；
//! - **`GET /api/v1/me/market-bookmarks`** → **`order_ids`** 含已存在 **`orders.id`**。
//! - **93 §2.1 B-MKT-004**：`matrix_93_b_mkt_004_*` 与 `run_b_mkt_004_me_market_bookmark_flow` 同源（`spec/93-全站功能验证矩阵-域别回归清单.md`）。
//! - **v1.4.238**：**`matrix_93_b_mkt_004_f020_post_get_market_bookmarks_app_stack_ok_pg`** — **`router::app`** 主栈（与 **`me::router()`** 子栈互补）。
//! - **v1.4.263**：**`matrix_93_b_mkt_003b_f020_get_market_bookmarks_empty_order_ids_ok_app_stack_ok_pg`** — **B-MKT-003** 子证 · **`GET …/me/market-bookmarks`** **无星标** **`order_ids`** **空数组** **`router::app`**。
//! - **v1.4.264**：**`matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg`** — **`POST`→`GET`→`DELETE …/order/:id`→`GET`** **`order_ids`** **不再含** **`orders.id`** **`router::app`**（**B-MKT-004** 扩链）。
//! - **v1.4.268**：**`matrix_93_b_mkt_004d_f020_post_guide_bookmark_then_get_guide_ids_app_stack_ok_pg`** — **`POST …/market-bookmarks`** **`target_type=guide`**→**`GET`** **`guide_ids`** **含** **`guides.id`**（**B-MKT-013**/**F-020**）。
//! - **v1.4.269**：**`matrix_93_b_mkt_004e_f020_post_guide_bookmark_delete_get_guide_ids_absent_app_stack_ok_pg`** — **`POST|GET|DELETE|GET …/me/market-bookmarks/guide/:id`** **`guide_ids`** **不含**（**B-MKT-013**/**F-020**）。
//! - **v1.4.273**：**`matrix_93_b_mkt_004f_f020_post_order_then_guide_bookmarks_get_lists_both_app_stack_ok_pg`** — **同一 Bearer** **`POST` order** **再** **`POST` guide`**→**`GET …/me/market-bookmarks`** **`order_ids`** **与** **`guide_ids`** **同时命中**（**B-MKT-004**/**B-MKT-013**/**F-020**）。
//! - **v1.4.274**：**`matrix_93_b_mkt_004g_f020_post_order_guide_bookmarks_delete_both_then_lists_absent_app_stack_ok_pg`** — **`DELETE …/order/:id`** **+** **`DELETE …/guide/:id`** **后** **`GET`** **`order_ids`/`guide_ids`** **均不含**（**B-MKT-004**/**B-MKT-013**/**F-020**）。
//! - **v1.4.275**：**`matrix_93_b_mkt_004h_f020_post_order_bookmark_invalid_target_type_then_get_preserves_order_app_stack_ok_pg`** — **`POST …/market-bookmarks`** **`target_type=listing`** **400** **`invalid_target_type`** **后** **`GET`** **`order_ids`** **仍含** **已星标** **`orders.id`**（**B-MKT-004**/**F-020**）。
//! - **v1.4.276**：**`matrix_93_b_mkt_004i_f020_post_order_guide_bookmarks_invalid_listing_then_get_preserves_both_app_stack_ok_pg`** — **order+guide 双星标** **后** **`listing`→400** **再** **`GET`** **`order_ids`/`guide_ids`** **均保持**（**B-MKT-004**/**B-MKT-013**/**F-020**）。
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
use crate::db::{insert_session, insert_user, upsert_order};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;

use super::me;

static ME_MARKET_BOOKMARKS_DB_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn db_it_lock() -> &'static Mutex<()> {
    ME_MARKET_BOOKMARKS_DB_IT_LOCK.get_or_init(|| Mutex::new(()))
}

async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

fn auth_bearer(token: &str) -> axum::http::HeaderValue {
    format!("Bearer {}", token).parse().expect("bearer header")
}

async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

/// [93 §2.1 · B-MKT-004] 种子：`guides` + **`orders`** + **`sessions`**（调用方负责 **`cleanup_bookmark_order_bundle`**）。
async fn seed_bm004_bookmark_fixture(pool: &PgPool) -> (Uuid, Uuid, Uuid, Uuid, String) {
    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    let guide_row_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_mkt_bm_{}", Uuid::new_v4());
    let email_t = format!("mktbm-t-{tourist_id}@traveltrust.test");
    let email_g = format!("mktbm-g-{guide_user_id}@traveltrust.test");

    cleanup_bookmark_order_bundle(pool, order_id, guide_row_id, tourist_id, guide_user_id).await;

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

async fn assert_bm004_post_get_market_bookmarks(app: Router, token: &str, order_id: Uuid) {
    let post_body = json!({
        "target_type": "order",
        "target_id": order_id.to_string(),
    });
    let post_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let pj = response_json(post_res).await;
    assert_eq!(pj["status"], "ok");

    let get_res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let gj = response_json(get_res).await;
    assert_eq!(gj["status"], "ok");
    let ids: Vec<String> = gj["order_ids"]
        .as_array()
        .expect("order_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    assert!(
        ids.contains(&order_id.to_string()),
        "expected order_id in order_ids: {ids:?}"
    );
}

async fn assert_bm004_post_get_guide_bookmarks(app: Router, token: &str, guide_row_id: Uuid) {
    let post_body = json!({
        "target_type": "guide",
        "target_id": guide_row_id.to_string(),
    });
    let post_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let pj = response_json(post_res).await;
    assert_eq!(pj["status"], "ok");

    let get_res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let gj = response_json(get_res).await;
    assert_eq!(gj["status"], "ok");
    let gids: Vec<String> = gj["guide_ids"]
        .as_array()
        .expect("guide_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    assert!(
        gids.contains(&guide_row_id.to_string()),
        "expected guides.id in guide_ids: {gids:?}"
    );
}

/// **`POST|GET`** 向导星标后 **`DELETE /api/v1/me/market-bookmarks/guide/:id`**，再 **`GET`** **`guide_ids`** **不含** 该 **`guides.id`**。
async fn assert_bm004_post_get_delete_guide_absent(app: Router, token: &str, guide_row_id: Uuid) {
    assert_bm004_post_get_guide_bookmarks(app.clone(), token, guide_row_id).await;

    let del_uri = format!("/api/v1/me/market-bookmarks/guide/{}", guide_row_id);
    let del_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(&del_uri)
                .header(header::AUTHORIZATION, auth_bearer(token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(del_res.status(), StatusCode::OK);
    let dj = response_json(del_res).await;
    assert_eq!(dj["status"], "ok");

    let get_res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let gj = response_json(get_res).await;
    assert_eq!(gj["status"], "ok");
    let gids: Vec<String> = gj["guide_ids"]
        .as_array()
        .expect("guide_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    assert!(
        !gids.contains(&guide_row_id.to_string()),
        "expected guide_id absent after DELETE: {gids:?}"
    );
}

/// **`POST|GET`** 星标后 **`DELETE /api/v1/me/market-bookmarks/order/:id`**，再 **`GET`** **`order_ids`** **不含** 该 **`order_id`**。
async fn assert_bm004_post_get_delete_get_order_absent(app: Router, token: &str, order_id: Uuid) {
    assert_bm004_post_get_market_bookmarks(app.clone(), token, order_id).await;

    let del_uri = format!("/api/v1/me/market-bookmarks/order/{}", order_id);
    let del_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(&del_uri)
                .header(header::AUTHORIZATION, auth_bearer(token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(del_res.status(), StatusCode::OK);
    let dj = response_json(del_res).await;
    assert_eq!(dj["status"], "ok");

    let get_res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let gj = response_json(get_res).await;
    assert_eq!(gj["status"], "ok");
    let ids: Vec<String> = gj["order_ids"]
        .as_array()
        .expect("order_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    assert!(
        !ids.contains(&order_id.to_string()),
        "expected order_id absent after DELETE: {ids:?}"
    );
}

fn app_stack_bm004(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

/// [93 §2.1 · B-MKT-004] 正路径：星标订单 + GET 列表含 `order_id`（调用方须在前后 `cleanup_bookmark_order_bundle`）。
async fn run_b_mkt_004_me_market_bookmark_flow(pool: &PgPool) -> (Uuid, Uuid, Uuid, Uuid) {
    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(pool).await;

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let r = me::router().with_state(api_meta_state(Some(co)));
    assert_bm004_post_get_market_bookmarks(r, &token, order_id).await;

    (order_id, guide_row_id, tourist_id, guide_user_id)
}

async fn cleanup_bookmark_order_bundle(
    pool: &PgPool,
    order_id: Uuid,
    guide_row_id: Uuid,
    tourist_id: Uuid,
    guide_user_id: Uuid,
) {
    let _ = sqlx::query(
        "DELETE FROM market_travel_bookmarks WHERE user_id = $1 OR (target_type = 'order' AND target_id = $2)",
    )
    .bind(tourist_id)
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

#[tokio::test]
async fn f020_post_market_bookmark_order_then_get_lists_it() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f020_post_market_bookmark_order_then_get_lists_it (DATABASE_URL unset)");
        return;
    };

    let (order_id, guide_row_id, tourist_id, guide_user_id) =
        run_b_mkt_004_me_market_bookmark_flow(&pool).await;
    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// [93 · B-MKT-004] 与 **`f020_*`** 同源（须 **`DATABASE_URL`**）。
#[tokio::test]
async fn matrix_93_b_mkt_004_me_market_bookmark_flow() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_b_mkt_004_me_market_bookmark_flow (DATABASE_URL unset)");
        return;
    };
    let (order_id, guide_row_id, tourist_id, guide_user_id) =
        run_b_mkt_004_me_market_bookmark_flow(&pool).await;
    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-004** → **§8.2 · F-020**：**`router::app`** 主栈 **`POST|GET …/me/market-bookmarks`**（与 **`me::router()`** **子栈** **`matrix_93_b_mkt_004_me_market_bookmark_flow`** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_004_f020_post_get_market_bookmarks_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004_f020_post_get_market_bookmarks_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_market_bookmarks(router, &token, order_id).await;
    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-004** → **§8.2 · F-020**：**`router::app`** **`POST|GET|DELETE|GET …/me/market-bookmarks`**（**`order`** **星标取消** 后主列表 **不含** **`order_id`**）。
#[tokio::test]
async fn matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004c_f020_post_get_delete_get_market_bookmarks_order_absent_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_delete_get_order_absent(router, &token, order_id).await;
    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-013** → **§8.2 · F-020**：**`router::app`** **`POST …/me/market-bookmarks`** **`target_type=guide`** **`target_id=guides.id`**→**`GET`** **`guide_ids`** **PG 列表含之**。
#[tokio::test]
async fn matrix_93_b_mkt_004d_f020_post_guide_bookmark_then_get_guide_ids_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004d_f020_post_guide_bookmark_then_get_guide_ids_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_guide_bookmarks(router, &token, guide_row_id).await;
    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-013** → **§8.2 · F-020**：**`router::app`** **`POST|GET|DELETE|GET …/me/market-bookmarks`** **`guide`** **取消星标** **`guide_ids`** **不含** **`guides.id`**。
#[tokio::test]
async fn matrix_93_b_mkt_004e_f020_post_guide_bookmark_delete_get_guide_ids_absent_app_stack_ok_pg()
{
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004e_f020_post_guide_bookmark_delete_get_guide_ids_absent_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_delete_guide_absent(router, &token, guide_row_id).await;
    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-004 + B-MKT-013** → **§8.2 · F-020**：**`router::app`** **同一用户** **先** **`POST` order 星标** **再** **`POST` guide 星标**→**`GET …/me/market-bookmarks`** **`order_ids`** **与** **`guide_ids`** **各含目标 id**。
#[tokio::test]
async fn matrix_93_b_mkt_004f_f020_post_order_then_guide_bookmarks_get_lists_both_app_stack_ok_pg()
{
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004f_f020_post_order_then_guide_bookmarks_get_lists_both_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_market_bookmarks(router.clone(), &token, order_id).await;

    let post_guide = json!({
        "target_type": "guide",
        "target_id": guide_row_id.to_string(),
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_guide.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let pj = response_json(post_res).await;
    assert_eq!(pj["status"], "ok");

    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let gj = response_json(get_res).await;
    assert_eq!(gj["status"], "ok");
    let order_ids: Vec<String> = gj["order_ids"]
        .as_array()
        .expect("order_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    let guide_ids: Vec<String> = gj["guide_ids"]
        .as_array()
        .expect("guide_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    assert!(
        order_ids.contains(&order_id.to_string()),
        "expected order_id in order_ids: {order_ids:?}"
    );
    assert!(
        guide_ids.contains(&guide_row_id.to_string()),
        "expected guide_row_id in guide_ids: {guide_ids:?}"
    );

    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-004 + B-MKT-013** → **§8.2 · F-020**：**`router::app`** **order+guide 双星标** **后** **`DELETE …/me/market-bookmarks/order/:id`** **与** **`DELETE …/me/market-bookmarks/guide/:id`** **再** **`GET`** **两列表** **均不含** **对应 id**。
#[tokio::test]
async fn matrix_93_b_mkt_004g_f020_post_order_guide_bookmarks_delete_both_then_lists_absent_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004g_f020_post_order_guide_bookmarks_delete_both_then_lists_absent_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_market_bookmarks(router.clone(), &token, order_id).await;

    let post_guide = json!({
        "target_type": "guide",
        "target_id": guide_row_id.to_string(),
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_guide.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    assert_eq!(response_json(post_res).await["status"], "ok");

    let del_o = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!("/api/v1/me/market-bookmarks/order/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(del_o.status(), StatusCode::OK);
    assert_eq!(response_json(del_o).await["status"], "ok");

    let del_g = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!("/api/v1/me/market-bookmarks/guide/{guide_row_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(del_g.status(), StatusCode::OK);
    assert_eq!(response_json(del_g).await["status"], "ok");

    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let gj = response_json(get_res).await;
    assert_eq!(gj["status"], "ok");
    let order_ids: Vec<String> = gj["order_ids"]
        .as_array()
        .expect("order_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    let guide_ids: Vec<String> = gj["guide_ids"]
        .as_array()
        .expect("guide_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    assert!(
        !order_ids.contains(&order_id.to_string()),
        "expected order_id absent: {order_ids:?}"
    );
    assert!(
        !guide_ids.contains(&guide_row_id.to_string()),
        "expected guide_row_id absent: {guide_ids:?}"
    );

    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-004** → **§8.2 · F-020**：**`router::app`** **`POST` order 星标** **后** **`POST`** **`target_type=listing`** **→** **400** **`invalid_target_type`** **再** **`GET …/me/market-bookmarks`** **`order_ids`** **仍含** **`orders.id`**。
#[tokio::test]
async fn matrix_93_b_mkt_004h_f020_post_order_bookmark_invalid_target_type_then_get_preserves_order_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004h_f020_post_order_bookmark_invalid_target_type_then_get_preserves_order_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_market_bookmarks(router.clone(), &token, order_id).await;

    let bad = json!({
        "target_type": "listing",
        "target_id": order_id.to_string(),
    });
    let bad_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(bad.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(bad_res.status(), StatusCode::BAD_REQUEST);
    let bj = response_json(bad_res).await;
    assert_eq!(bj["error"], "invalid_target_type");

    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let gj = response_json(get_res).await;
    assert_eq!(gj["status"], "ok");
    let order_ids: Vec<String> = gj["order_ids"]
        .as_array()
        .expect("order_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    assert!(
        order_ids.contains(&order_id.to_string()),
        "expected order_id preserved after invalid POST: {order_ids:?}"
    );

    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-004 + B-MKT-013** → **§8.2 · F-020**：**order** **与** **guide** **双 `POST` 星标** **后** **`POST` `target_type=listing`** **→** **400** **`invalid_target_type`** **再** **`GET …/me/market-bookmarks`** **`order_ids`/`guide_ids`** **仍各含** **原 id**（**`router::app`**；与 **`004h_*` 仅 order** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_004i_f020_post_order_guide_bookmarks_invalid_listing_then_get_preserves_both_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004i_f020_post_order_guide_bookmarks_invalid_listing_then_get_preserves_both_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_market_bookmarks(router.clone(), &token, order_id).await;
    assert_bm004_post_get_guide_bookmarks(router.clone(), &token, guide_row_id).await;

    let bad = json!({
        "target_type": "listing",
        "target_id": order_id.to_string(),
    });
    let bad_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(bad.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(bad_res.status(), StatusCode::BAD_REQUEST);
    let bj = response_json(bad_res).await;
    assert_eq!(bj["error"], "invalid_target_type");

    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let gj = response_json(get_res).await;
    assert_eq!(gj["status"], "ok");
    let order_ids: Vec<String> = gj["order_ids"]
        .as_array()
        .expect("order_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    let guide_ids: Vec<String> = gj["guide_ids"]
        .as_array()
        .expect("guide_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    assert!(
        order_ids.contains(&order_id.to_string()),
        "expected order_id preserved: {order_ids:?}"
    );
    assert!(
        guide_ids.contains(&guide_row_id.to_string()),
        "expected guide_row_id preserved: {guide_ids:?}"
    );

    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

async fn cleanup_user_by_email(pool: &PgPool, email: &str) {
    let _ = sqlx::query(
        r#"DELETE FROM sessions USING users u
           WHERE sessions.user_id = u.id AND lower(u.email) = lower($1)"#,
    )
    .bind(email)
    .execute(pool)
    .await;
    let _ = sqlx::query(
        r#"DELETE FROM market_travel_bookmarks
           WHERE user_id IN (SELECT id FROM users WHERE lower(email) = lower($1))"#,
    )
    .bind(email)
    .execute(pool)
    .await;
    let _ = sqlx::query("DELETE FROM users WHERE lower(email) = lower($1)")
        .bind(email)
        .execute(pool)
        .await;
}

/// **93 · B-MKT-003** → **§8.2 · F-020**：**`GET /api/v1/me/market-bookmarks`** **200**；**`order_ids`** **空**（**`router::app`**；**未** **`POST` 星标**）。
#[tokio::test]
async fn matrix_93_b_mkt_003b_f020_get_market_bookmarks_empty_order_ids_ok_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_003b_f020_get_market_bookmarks_empty_order_ids_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let suffix = Uuid::new_v4();
    let email = format!("93-b-mkt-003b-f020-{suffix}@traveltrust.test");
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_bm004(pool.clone());

    let reg = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!",
                        "nickname": "tourist_mkt003b"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        reg.status(),
        StatusCode::OK,
        "{:?}",
        response_json(reg).await
    );
    let token = response_json(reg).await["token"]
        .as_str()
        .expect("token")
        .to_string();

    let get_res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let gj = response_json(get_res).await;
    assert_eq!(gj["status"], "ok");
    let ids = gj["order_ids"].as_array().expect("order_ids");
    assert!(ids.is_empty(), "expected empty order_ids: {gj:?}");

    cleanup_user_by_email(&pool, &email).await;
}
