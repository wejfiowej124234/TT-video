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
use crate::routes::me;
use crate::state::test_support::api_meta_state;

static ME_MARKET_BOOKMARKS_DB_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

pub(super) fn db_it_lock() -> &'static Mutex<()> {
    ME_MARKET_BOOKMARKS_DB_IT_LOCK.get_or_init(|| Mutex::new(()))
}

pub(super) async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

pub(super) fn auth_bearer(token: &str) -> axum::http::HeaderValue {
    format!("Bearer {}", token).parse().expect("bearer header")
}

pub(super) async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

/// [93 §2.1 · B-MKT-004] 种子：`guides` + **`orders`** + **`sessions`**（调用方负责 **`cleanup_bookmark_order_bundle`**）。
pub(super) async fn seed_bm004_bookmark_fixture(pool: &PgPool) -> (Uuid, Uuid, Uuid, Uuid, String) {
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
        pool, tourist_id, &email_t, None, "tourist", "none", None, None, None, now, now,
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
        None,
        None,
    )
    .await
    .expect("upsert_order");

    (order_id, guide_row_id, tourist_id, guide_user_id, token)
}

pub(super) async fn assert_bm004_post_get_market_bookmarks(
    app: Router,
    token: &str,
    order_id: Uuid,
) {
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

pub(super) async fn assert_bm004_post_get_guide_bookmarks(
    app: Router,
    token: &str,
    guide_row_id: Uuid,
) {
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
pub(super) async fn assert_bm004_post_get_delete_guide_absent(
    app: Router,
    token: &str,
    guide_row_id: Uuid,
) {
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
pub(super) async fn assert_bm004_post_get_delete_get_order_absent(
    app: Router,
    token: &str,
    order_id: Uuid,
) {
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

pub(super) fn app_stack_bm004(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

/// [93 §2.1 · B-MKT-004] 正路径：星标订单 + GET 列表含 `order_id`（调用方须在前后 `cleanup_bookmark_order_bundle`）。
pub(super) async fn run_b_mkt_004_me_market_bookmark_flow(
    pool: &PgPool,
) -> (Uuid, Uuid, Uuid, Uuid) {
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

pub(super) async fn cleanup_bookmark_order_bundle(
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

pub(super) async fn cleanup_user_by_email(pool: &PgPool, email: &str) {
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
