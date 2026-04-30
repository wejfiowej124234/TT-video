//! **F-021 / F-022 · API·IT（PostgreSQL + `Router::oneshot`）**
//!
//! - **F-021**：**`GET /api/v1/market/provider/listings`** 在 **`market_listings`** 存在 **`variant=provider`** **`published`** 行时返回 **`status=ok`** 且 **`items`** 含该行 **`id`**（**93 §2.1 B-MKT-005**；`matrix_93_b_mkt_005_*`）；**`POST …/market/provider/listings`** **Bearer** 发布后 **`GET`** 目录含该 **`listing_id`**（**B-MKT-007**；**`matrix_93_b_mkt_007_*`**）。
//! - **F-022**：**`GET /api/v1/market/acquisition/listings`** 同理 **`variant=acquisition`**（**93 §2.1 B-MKT-006**；`matrix_93_b_mkt_006_*`）；**`POST …/market/acquisition/listings`**（**B-MKT-008**；**`matrix_93_b_mkt_008_*`**）。
//! - **v1.4.239**：**`matrix_93_b_mkt_005_f021_get_provider_listings_app_stack_ok_pg`** / **`matrix_93_b_mkt_006_f022_get_acquisition_listings_app_stack_ok_pg`** — **`router::app`** 主栈（与 **`market_subsite::router()`** 子栈互补）。
//! - **v1.4.264**：**`matrix_93_b_mkt_009_f021_get_provider_listing_detail_app_stack_ok_pg`** / **`matrix_93_b_mkt_010_f022_get_acquisition_listing_detail_app_stack_ok_pg`** — **`GET …/listings/:id`** **`listing.id`** **`router::app`**（**B-MKT-009 / B-MKT-010**）。
//! - **v1.4.267**：**`matrix_93_b_mkt_007b_f021_post_provider_draft_then_get_app_stack_ok_pg`** / **`matrix_93_b_mkt_008b_f022_post_acquisition_draft_then_get_app_stack_ok_pg`** — **`POST|GET …/listings/drafts*`** **`payload` PG 读回**（**B-MKT-011 / B-MKT-012**）。
//! - **v1.4.280**：**`matrix_93_b_mkt_007c_f021_post_provider_listing_then_get_detail_payload_title_app_stack_ok_pg`** / **`matrix_93_b_mkt_008c_f022_post_acquisition_listing_then_get_detail_payload_title_app_stack_ok_pg`** — **`POST` 已发布 listing** → **`GET …/listings/:id`** **`listing.payload.title`** **与** **`POST` 入参** **一致**（**B-MKT-007+009 / B-MKT-008+010** **链式主栈**；与 **单测种子** **`009`/`010`** **互补**）。
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
use crate::db::{insert_market_listing, insert_session, insert_user};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;

use super::market_subsite;

static MARKET_SUBSITE_CATALOG_DB_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn db_it_lock() -> &'static Mutex<()> {
    MARKET_SUBSITE_CATALOG_DB_IT_LOCK.get_or_init(|| Mutex::new(()))
}

fn auth_bearer(token: &str) -> axum::http::HeaderValue {
    format!("Bearer {}", token).parse().expect("bearer header")
}

async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

fn chain_off_for_pool(pool: &PgPool) -> ChainOffState {
    ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    }
}

fn app_stack_mkt_catalog(pool: PgPool) -> Router {
    let co = chain_off_for_pool(&pool);
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(co)), idem, Some(pool))
}

/// [93 §2.1 · B-MKT-005] 种子：`users` + **`market_listings`**（**`variant=provider`**）；调用方负责 **`cleanup_listing_and_user`**。
async fn seed_b_mkt_005_provider_listing(pool: &PgPool) -> (Uuid, Uuid) {
    let owner_id = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("mkt-prov-{owner_id}@traveltrust.test");

    cleanup_listing_and_user(pool, listing_id, owner_id).await;

    insert_user(
        pool, owner_id, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");

    let payload = json!({
        "kind": "merchant_showcase_studio_v1",
        "title": "b-mkt-005 catalog api it",
    });
    insert_market_listing(pool, listing_id, "provider", owner_id, &payload, now)
        .await
        .expect("insert_market_listing");

    (listing_id, owner_id)
}

async fn assert_b_mkt_005_provider_catalog_listings(router: Router, listing_id: Uuid) {
    let res = router
        .oneshot(
            Request::builder()
                .uri("/api/v1/market/provider/listings")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    let items = j["items"].as_array().expect("items");
    assert!(
        items.iter().any(|row| row["id"] == listing_id.to_string()),
        "expected listing id in provider items: {items:?}"
    );
}

/// [93 §2.1 · B-MKT-009] **`GET /api/v1/market/provider/listings/:id`** **`status=ok`**；**`listing.id`** 与路径一致。
async fn assert_b_mkt_009_provider_listing_detail(router: Router, listing_id: Uuid) {
    let uri = format!("/api/v1/market/provider/listings/{}", listing_id);
    let res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    assert_eq!(j["listing"]["id"], listing_id.to_string());
    assert_eq!(j["meta"]["variant"], "provider");
}

/// [93 §2.1 · B-MKT-010] **`GET /api/v1/market/acquisition/listings/:id`** **`status=ok`**；**`listing.id`** 与路径一致。
async fn assert_b_mkt_010_acquisition_listing_detail(router: Router, listing_id: Uuid) {
    let uri = format!("/api/v1/market/acquisition/listings/{}", listing_id);
    let res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    assert_eq!(j["listing"]["id"], listing_id.to_string());
    assert_eq!(j["meta"]["variant"], "acquisition");
}

/// [93 §2.1 · B-MKT-005] `GET …/market/provider/listings` 含已发布 `listing_id`（**`market_subsite::router()`**）。
async fn run_b_mkt_005_provider_catalog_listing_flow(pool: &PgPool) -> (Uuid, Uuid) {
    let (listing_id, owner_id) = seed_b_mkt_005_provider_listing(pool).await;
    let co = chain_off_for_pool(pool);
    let router = market_subsite::router().with_state(api_meta_state(Some(co)));
    assert_b_mkt_005_provider_catalog_listings(router, listing_id).await;
    (listing_id, owner_id)
}

/// [93 §2.1 · B-MKT-006] 种子：**`variant=acquisition`**；调用方负责 **`cleanup_listing_and_user`**。
async fn seed_b_mkt_006_acquisition_listing(pool: &PgPool) -> (Uuid, Uuid) {
    let owner_id = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("mkt-acq-{owner_id}@traveltrust.test");

    cleanup_listing_and_user(pool, listing_id, owner_id).await;

    insert_user(
        pool, owner_id, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");

    let payload = json!({
        "kind": "acquisition_carry_studio_v1",
        "title": "b-mkt-006 catalog api it",
    });
    insert_market_listing(pool, listing_id, "acquisition", owner_id, &payload, now)
        .await
        .expect("insert_market_listing");

    (listing_id, owner_id)
}

async fn assert_b_mkt_006_acquisition_catalog_listings(router: Router, listing_id: Uuid) {
    let res = router
        .oneshot(
            Request::builder()
                .uri("/api/v1/market/acquisition/listings")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    let items = j["items"].as_array().expect("items");
    assert!(
        items.iter().any(|row| row["id"] == listing_id.to_string()),
        "expected listing id in acquisition items: {items:?}"
    );
}

/// [93 §2.1 · B-MKT-006] `GET …/market/acquisition/listings` 含已发布 `listing_id`（**`market_subsite::router()`**）。
async fn run_b_mkt_006_acquisition_catalog_listing_flow(pool: &PgPool) -> (Uuid, Uuid) {
    let (listing_id, owner_id) = seed_b_mkt_006_acquisition_listing(pool).await;
    let co = chain_off_for_pool(pool);
    let router = market_subsite::router().with_state(api_meta_state(Some(co)));
    assert_b_mkt_006_acquisition_catalog_listings(router, listing_id).await;
    (listing_id, owner_id)
}

async fn cleanup_listing_and_user(pool: &PgPool, listing_id: Uuid, owner_id: Uuid) {
    let _ = sqlx::query("DELETE FROM community_posts WHERE commerce_market_listing_id = $1")
        .bind(listing_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM market_listings WHERE id = $1")
        .bind(listing_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(pool)
        .await;
}

async fn cleanup_drafts_sessions_user(pool: &PgPool, owner_id: Uuid) {
    let _ = sqlx::query("DELETE FROM market_listing_drafts WHERE owner_user_id = $1")
        .bind(owner_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(pool)
        .await;
}

#[tokio::test]
async fn f021_get_provider_listings_includes_inserted_published_row() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: f021_get_provider_listings_includes_inserted_published_row (DATABASE_URL unset)"
        );
        return;
    };

    let (listing_id, owner_id) = run_b_mkt_005_provider_catalog_listing_flow(&pool).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// [93 · B-MKT-005] 与 **`f021_*`** 同源（须 **`DATABASE_URL`**）。
#[tokio::test]
async fn matrix_93_b_mkt_005_provider_catalog_listings_flow() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_b_mkt_005_provider_catalog_listings_flow (DATABASE_URL unset)");
        return;
    };
    let (listing_id, owner_id) = run_b_mkt_005_provider_catalog_listing_flow(&pool).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

#[tokio::test]
async fn f022_get_acquisition_listings_includes_inserted_published_row() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f022_get_acquisition_listings_includes_inserted_published_row (DATABASE_URL unset)");
        return;
    };

    let (listing_id, owner_id) = run_b_mkt_006_acquisition_catalog_listing_flow(&pool).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// [93 · B-MKT-006] 与 **`f022_*`** 同源（须 **`DATABASE_URL`**）。
#[tokio::test]
async fn matrix_93_b_mkt_006_acquisition_catalog_listings_flow() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_006_acquisition_catalog_listings_flow (DATABASE_URL unset)"
        );
        return;
    };
    let (listing_id, owner_id) = run_b_mkt_006_acquisition_catalog_listing_flow(&pool).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// **93 · B-MKT-005** → **§8.2 · F-021**：**`router::app`** 主栈 **`GET …/market/provider/listings`**（与 **`market_subsite::router()`** **`matrix_93_b_mkt_005_provider_catalog_listings_flow`** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_005_f021_get_provider_listings_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_005_f021_get_provider_listings_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (listing_id, owner_id) = seed_b_mkt_005_provider_listing(&pool).await;
    let router = app_stack_mkt_catalog(pool.clone());
    assert_b_mkt_005_provider_catalog_listings(router, listing_id).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// **93 · B-MKT-006** → **§8.2 · F-022**：**`router::app`** 主栈 **`GET …/market/acquisition/listings`**（与 **`market_subsite::router()`** **`matrix_93_b_mkt_006_acquisition_catalog_listings_flow`** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_006_f022_get_acquisition_listings_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_006_f022_get_acquisition_listings_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (listing_id, owner_id) = seed_b_mkt_006_acquisition_listing(&pool).await;
    let router = app_stack_mkt_catalog(pool.clone());
    assert_b_mkt_006_acquisition_catalog_listings(router, listing_id).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// **93 · B-MKT-011** → **§8.2 · F-021**：**`router::app`** **`POST …/market/provider/listings/drafts`**（**Bearer**）→**`GET …/drafts/:draft_id`** **`payload`** **PG 读回**。
#[tokio::test]
async fn matrix_93_b_mkt_007b_f021_post_provider_draft_then_get_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_007b_f021_post_provider_draft_then_get_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_mkt_draft_prov_{}", Uuid::new_v4());
    let email = format!("mkt-draft-prov-{owner_id}@traveltrust.test");

    cleanup_drafts_sessions_user(&pool, owner_id).await;

    insert_user(
        &pool, owner_id, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, owner_id)
        .await
        .expect("insert_session");

    let router = app_stack_mkt_catalog(pool.clone());
    let title = "matrix_93_b_mkt_007b provider draft roundtrip";
    let post_body = json!({
        "payload": {
            "kind": "merchant_showcase_studio_v1",
            "title": title
        }
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/provider/listings/drafts")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_j = response_json(post_res).await;
    assert_eq!(post_j["status"], "ok");
    let draft_id = post_j["draft_id"].as_str().expect("draft_id");

    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/api/v1/market/provider/listings/drafts/{draft_id}"
                ))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_j = response_json(get_res).await;
    assert_eq!(get_j["status"], "ok");
    assert_eq!(get_j["draft_id"], draft_id);
    assert_eq!(get_j["payload"]["title"], title);

    cleanup_drafts_sessions_user(&pool, owner_id).await;
}

/// **93 · B-MKT-012** → **§8.2 · F-022**：**`router::app`** **`POST …/market/acquisition/listings/drafts`**（**Bearer**）→**`GET …/drafts/:draft_id`** **`payload`** **PG 读回**。
#[tokio::test]
async fn matrix_93_b_mkt_008b_f022_post_acquisition_draft_then_get_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_008b_f022_post_acquisition_draft_then_get_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_mkt_draft_acq_{}", Uuid::new_v4());
    let email = format!("mkt-draft-acq-{owner_id}@traveltrust.test");

    cleanup_drafts_sessions_user(&pool, owner_id).await;

    insert_user(
        &pool, owner_id, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, owner_id)
        .await
        .expect("insert_session");

    let router = app_stack_mkt_catalog(pool.clone());
    let title = "matrix_93_b_mkt_008b acquisition draft roundtrip";
    let post_body = json!({
        "payload": {
            "kind": "acquisition_carry_studio_v1",
            "title": title
        }
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/acquisition/listings/drafts")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_j = response_json(post_res).await;
    assert_eq!(post_j["status"], "ok");
    let draft_id = post_j["draft_id"].as_str().expect("draft_id");

    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!(
                    "/api/v1/market/acquisition/listings/drafts/{draft_id}"
                ))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_j = response_json(get_res).await;
    assert_eq!(get_j["status"], "ok");
    assert_eq!(get_j["draft_id"], draft_id);
    assert_eq!(get_j["payload"]["title"], title);

    cleanup_drafts_sessions_user(&pool, owner_id).await;
}

/// **93 · B-MKT-007** → **§8.2 · F-021**：**`router::app`** **`POST /api/v1/market/provider/listings`**（**Bearer**）→**`GET …/market/provider/listings`** 含新 **`listing_id`**。
#[tokio::test]
async fn matrix_93_b_mkt_007_f021_post_provider_listing_then_get_catalog_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_007_f021_post_provider_listing_then_get_catalog_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_mkt_pub_{}", Uuid::new_v4());
    let email = format!("mkt-pub-prov-{owner_id}@traveltrust.test");

    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;

    insert_user(
        &pool, owner_id, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, owner_id)
        .await
        .expect("insert_session");

    let router = app_stack_mkt_catalog(pool.clone());
    let post_body = json!({
        "payload": {
            "kind": "merchant_showcase_studio_v1",
            "title": "matrix_93_b_mkt_007 provider publish"
        }
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/provider/listings")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_j = response_json(post_res).await;
    assert_eq!(post_j["status"], "ok");
    let listing_id_str = post_j["listing_id"].as_str().expect("listing_id");
    let listing_id = Uuid::parse_str(listing_id_str).expect("listing uuid");

    assert_b_mkt_005_provider_catalog_listings(router, listing_id).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// **93 · B-MKT-007 + B-MKT-009** → **§8.2 · F-021**：**`router::app`** **`POST …/market/provider/listings`** → **`GET …/market/provider/listings/:id`** **`listing.payload.title`** **读回**。
#[tokio::test]
async fn matrix_93_b_mkt_007c_f021_post_provider_listing_then_get_detail_payload_title_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_007c_f021_post_provider_listing_then_get_detail_payload_title_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_mkt_pubc_{}", Uuid::new_v4());
    let email = format!("mkt-pubc-prov-{owner_id}@traveltrust.test");
    let title = "matrix_93_b_mkt_007c provider publish detail title";

    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;

    insert_user(
        &pool, owner_id, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, owner_id)
        .await
        .expect("insert_session");

    let router = app_stack_mkt_catalog(pool.clone());
    let post_body = json!({
        "payload": {
            "kind": "merchant_showcase_studio_v1",
            "title": title
        }
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/provider/listings")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_j = response_json(post_res).await;
    assert_eq!(post_j["status"], "ok");
    let listing_id_str = post_j["listing_id"].as_str().expect("listing_id");
    let listing_id = Uuid::parse_str(listing_id_str).expect("listing uuid");

    let uri = format!("/api/v1/market/provider/listings/{listing_id}");
    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let j = response_json(get_res).await;
    assert_eq!(j["status"], "ok");
    assert_eq!(j["listing"]["id"], listing_id.to_string());
    assert_eq!(j["listing"]["payload"]["title"], title);

    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// **93 · B-MKT-008** → **§8.2 · F-022**：**`router::app`** **`POST /api/v1/market/acquisition/listings`**（**Bearer**）→**`GET …/market/acquisition/listings`** 含新 **`listing_id`**。
#[tokio::test]
async fn matrix_93_b_mkt_008_f022_post_acquisition_listing_then_get_catalog_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_008_f022_post_acquisition_listing_then_get_catalog_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_mkt_acq_{}", Uuid::new_v4());
    let email = format!("mkt-pub-acq-{owner_id}@traveltrust.test");

    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;

    insert_user(
        &pool, owner_id, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, owner_id)
        .await
        .expect("insert_session");

    let router = app_stack_mkt_catalog(pool.clone());
    let post_body = json!({
        "payload": {
            "kind": "acquisition_carry_studio_v1",
            "title": "matrix_93_b_mkt_008 acquisition publish"
        }
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/acquisition/listings")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_j = response_json(post_res).await;
    assert_eq!(post_j["status"], "ok");
    let listing_id_str = post_j["listing_id"].as_str().expect("listing_id");
    let listing_id = Uuid::parse_str(listing_id_str).expect("listing uuid");

    assert_b_mkt_006_acquisition_catalog_listings(router, listing_id).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// **93 · B-MKT-008 + B-MKT-010** → **§8.2 · F-022**：**`router::app`** **`POST …/market/acquisition/listings`** → **`GET …/market/acquisition/listings/:id`** **`listing.payload.title`** **读回**。
#[tokio::test]
async fn matrix_93_b_mkt_008c_f022_post_acquisition_listing_then_get_detail_payload_title_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_008c_f022_post_acquisition_listing_then_get_detail_payload_title_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_mkt_acqc_{}", Uuid::new_v4());
    let email = format!("mkt-pubc-acq-{owner_id}@traveltrust.test");
    let title = "matrix_93_b_mkt_008c acquisition publish detail title";

    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;

    insert_user(
        &pool, owner_id, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, owner_id)
        .await
        .expect("insert_session");

    let router = app_stack_mkt_catalog(pool.clone());
    let post_body = json!({
        "payload": {
            "kind": "acquisition_carry_studio_v1",
            "title": title
        }
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/acquisition/listings")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_j = response_json(post_res).await;
    assert_eq!(post_j["status"], "ok");
    let listing_id_str = post_j["listing_id"].as_str().expect("listing_id");
    let listing_id = Uuid::parse_str(listing_id_str).expect("listing uuid");

    let uri = format!("/api/v1/market/acquisition/listings/{listing_id}");
    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let j = response_json(get_res).await;
    assert_eq!(j["status"], "ok");
    assert_eq!(j["listing"]["id"], listing_id.to_string());
    assert_eq!(j["listing"]["payload"]["title"], title);

    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// **93 · B-MKT-009** → **§8.2 · F-021**：**`router::app`** **`GET /api/v1/market/provider/listings/:id`** **`listing`** **JSON**（**`postgres_catalog`**）。
#[tokio::test]
async fn matrix_93_b_mkt_009_f021_get_provider_listing_detail_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_009_f021_get_provider_listing_detail_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (listing_id, owner_id) = seed_b_mkt_005_provider_listing(&pool).await;
    let router = app_stack_mkt_catalog(pool.clone());
    assert_b_mkt_009_provider_listing_detail(router, listing_id).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// **93 · B-MKT-010** → **§8.2 · F-022**：**`router::app`** **`GET /api/v1/market/acquisition/listings/:id`** **`listing`** **JSON**（**`postgres_catalog`**）。
#[tokio::test]
async fn matrix_93_b_mkt_010_f022_get_acquisition_listing_detail_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_010_f022_get_acquisition_listing_detail_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (listing_id, owner_id) = seed_b_mkt_006_acquisition_listing(&pool).await;
    let router = app_stack_mkt_catalog(pool.clone());
    assert_b_mkt_010_acquisition_listing_detail(router, listing_id).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}
