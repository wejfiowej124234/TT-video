//! **F-023 / F-024 / F-025 · API·IT（PostgreSQL + `Router::oneshot`）** + **93 §2 / §2.2 / §2.6（ISS-007 窄口径）**
//!
//! - **F-023**：**`POST|GET /api/v1/guides`**、**`GET /api/v1/guides/:id`**、**`GET …/availability`**（**`GET /api/v1/guides` 列表**在 **`chain_off` 实现**中**仅** **`status=active`**，须 **`POST …/stake`** 后方入列表 — 见 **`matrix_93_b_gde_003_*`**）；
//! - **F-024**：**`POST /api/v1/guides/:id/stake`** 且 **`guides`** 表 **`stake_amount`/`status`** 与 HTTP 一致；
//! - **F-025**：**`GET /api/v1/disputes`** / **`GET /api/v1/disputes/:id`**（**`list_disputes_public_page`** / **`get_dispute_public_detail`**）；**`POST /api/v1/orders/:id/dispute`→列表** 见 **`orders_accept_mock_pay_itinerary_confirm_db_api_tests`** **`matrix_93_b_dsp_001_*`**（**B-DSP-001**）；**`POST …/disputes/:id/resolve`** **主栈** 见 **同文件** **`matrix_93_b_dsp_003b_f025_*`**（**B-DSP-003**；**v1.4.281**）。
//!
//! **93 矩阵绑定**：**`matrix_93_b_gde_001_*`** ↔ **B-GDE-001**/**F-023**；**`matrix_93_b_gde_002b_f023_*`** ↔ **B-GDE-002**/**F-023**（**`GET …/guides/:id/availability`** **`Authorization: Bearer`** **`router::app`**；**v1.4.261**）；**`matrix_93_b_gde_004_*`** ↔ **B-GDE-001 扩面**/**F-023**（**`router::app`** **`GET /api/v1/guides?city=`** 在 **`stake` 后**含 **`active`** 向导 — 与 **`matrix_93_b_gde_003_*`** 子栈断言同源、**merge 序**主栈收口）；**`matrix_93_b_gde_004b_f023_*`** ↔ **B-GDE-001**/**F-023**（**`router::app`** **`GET …/guides?city=`** **`stake` 前** **不含** **`pending`** 向导 — **v1.4.265**）；**`matrix_93_b_gde_004c_f023_*`** ↔ **B-GDE-001**/**F-023**（**`GET …/guides?city=&languages=`** / **`service_types=`** **筛选** **`router::app`**；**v1.4.268**）；**`matrix_93_b_gde_004e_f023_*`** ↔ **B-GDE-001**/**F-023**（**`GET …/guides?city=&language=`** **单参** **`router::app`**；**v1.4.269**）；**`matrix_93_b_gde_003_*`** ↔ **B-GDE-003**/**F-024**（**MANUAL-P1**；**95 · ISS-007** 允许 **`oneshot`+PG** 回填 **§8.2·93**，**不**类推其它 **MANUAL**）；**`matrix_93_b_gde_003b_f024_*`** ↔ **B-GDE-003**/**F-024**（**`router::app`**；**v1.4.254**）；**`matrix_93_b_gde_003c_f024_*`** ↔ **B-GDE-003**/**F-024**（**`POST …/stake`** **同额二次** **`200`** **`router::app`**；**v1.4.265**）；**`matrix_93_b_gde_003d_f024_*`** ↔ **B-GDE-001**/**B-GDE-003**/**F-024**（**`POST …/stake`** 后 **`GET …/guides?city=`** **公开列表** **`items[]`** **`stake_amount`/`status`** **与质押一致**；**v1.4.268**）；**`matrix_93_b_dsp_002_*`** ↔ **B-DSP-002**/**F-025**；**`matrix_93_b_dsp_002b_f025_*`** ↔ **B-DSP-002**/**F-025**（**`router::app`**；**v1.4.254**）；**`matrix_93_b_dsp_003b_f025_*`** ↔ **B-DSP-003**/**F-025**（**`orders_accept_mock_pay_itinerary_confirm_db_api_tests`**·**`router::app`**；**v1.4.281**）。
//! **v1.4.238**：**`matrix_93_b_gde_001_f023_post_guide_get_detail_app_stack_ok_pg`** — **`router::app`** 主栈 **`POST …/guides`→`GET …/guides/:id`**（与 **`guides::router()`** 子栈互补）。
//! **v1.4.280**：**`matrix_93_b_gde_001c_f023_post_guide_get_detail_bio_matches_app_stack_ok_pg`** — **`POST …/guides`→`GET …/guides/:id`** **`guide.bio`** **与** **`POST` body** **一致**（**B-GDE-001** **扩链**；与 **`001_f023_*`** **`city`** **断言** **互补**）。
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
use crate::db::{insert_dispute, insert_guide, insert_session, insert_user, upsert_order};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;

use super::disputes;
use super::guides;

static GUIDES_DISPUTES_DB_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

fn db_it_lock() -> &'static Mutex<()> {
    GUIDES_DISPUTES_DB_IT_LOCK.get_or_init(|| Mutex::new(()))
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

async fn cleanup_guide_user(pool: &PgPool, guide_user_id: Uuid) {
    let _ = sqlx::query("DELETE FROM guides WHERE user_id = $1")
        .bind(guide_user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(guide_user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(guide_user_id)
        .execute(pool)
        .await;
}

async fn cleanup_dispute_bundle(
    pool: &PgPool,
    dispute_id: Uuid,
    order_id: Uuid,
    guide_row_id: Uuid,
    tourist_id: Uuid,
    guide_user_id: Uuid,
) {
    let _ = sqlx::query("DELETE FROM disputes WHERE id = $1")
        .bind(dispute_id)
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
async fn matrix_93_b_gde_001_f023_post_guide_get_detail_and_availability() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_001_f023_post_guide_get_detail_and_availability (DATABASE_URL unset)"
        );
        return;
    };

    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_{}", Uuid::new_v4());
    let email = format!("guides-f023-{guide_user_id}@traveltrust.test");

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
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
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let app = guides::router().with_state(api_meta_state(Some(co)));

    let post_body = json!({
        "city": "Hangzhou",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_001"
    });
    let post_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();

    let get_res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/guides/{guide_id_str}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_json = response_json(get_res).await;
    assert_eq!(get_json["status"], "ok");
    assert_eq!(get_json["guide"]["city"], "Hangzhou");

    let av_res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/guides/{guide_id_str}/availability"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(av_res.status(), StatusCode::OK);
    let av_json = response_json(av_res).await;
    assert_eq!(av_json["status"], "ok");
    assert_eq!(av_json["guide_id"], guide_id_str);
    assert!(av_json["occupied_ranges"].is_array());

    cleanup_guide_user(&pool, guide_user_id).await;
}

fn app_stack_f023(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

/// **93 · B-GDE-001** → **§8.2 · F-023**：**`router::app`** 主栈 **`POST /api/v1/guides`→`GET /api/v1/guides/:id`**（**`GET …/availability`** 仍见 **`matrix_93_b_gde_001_f023_post_guide_get_detail_and_availability`**）。
#[tokio::test]
async fn matrix_93_b_gde_001_f023_post_guide_get_detail_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_001_f023_post_guide_get_detail_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_app_{}", Uuid::new_v4());
    let email = format!("guides-f023-app-{guide_user_id}@traveltrust.test");

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
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
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let router = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Hangzhou",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_001_app_stack"
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();

    let get_res = router
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/guides/{guide_id_str}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_json = response_json(get_res).await;
    assert_eq!(get_json["status"], "ok");
    assert_eq!(get_json["guide"]["city"], "Hangzhou");

    cleanup_guide_user(&pool, guide_user_id).await;
}

/// **93 · B-GDE-001** → **§8.2 · F-023**：**`router::app`** **`POST …/guides`→`GET …/guides/:id`** **`guide.bio`** **读回**。
#[tokio::test]
async fn matrix_93_b_gde_001c_f023_post_guide_get_detail_bio_matches_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_001c_f023_post_guide_get_detail_bio_matches_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_bio_{}", Uuid::new_v4());
    let email = format!("guides-f023-bio-{guide_user_id}@traveltrust.test");
    let bio = "matrix_93_b_gde_001c_bio_roundtrip";

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
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
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let router = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Suzhou",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": bio
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();

    let get_res = router
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/guides/{guide_id_str}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_json = response_json(get_res).await;
    assert_eq!(get_json["status"], "ok");
    assert_eq!(get_json["guide"]["bio"], bio);

    cleanup_guide_user(&pool, guide_user_id).await;
}

/// **93 · B-GDE-002** → **§8.2 · F-023**：**`router::app`** 主栈 **`GET /api/v1/guides/:id/availability`** **`Authorization: Bearer`** **`{ status, guide_id, occupied_ranges }`**。
#[tokio::test]
async fn matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_002b_f023_get_guide_availability_ok_shape_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_gde002b_app_{}", Uuid::new_v4());
    let email = format!("guides-f023-av2-{guide_user_id}@traveltrust.test");

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
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
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let router = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Hangzhou",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_002b_app_stack"
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();

    let av_res = router
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/guides/{guide_id_str}/availability"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(av_res.status(), StatusCode::OK);
    let av_json = response_json(av_res).await;
    assert_eq!(av_json["status"], "ok");
    assert_eq!(av_json["guide_id"], guide_id_str);
    assert!(av_json["occupied_ranges"].is_array());

    cleanup_guide_user(&pool, guide_user_id).await;
}

/// **93 · B-GDE-001（公开列表 · `router::app`）** → **§8.2 · F-023**：**`POST …/guides`→`POST …/stake`→`GET /api/v1/guides?city=`** **`items`** 含该向导（**主栈**；**ISS-007** 脚注 **`GET /guides` 公开列表** 窄收口）。
#[tokio::test]
async fn matrix_93_b_gde_004_f023_public_get_guides_list_includes_active_after_stake_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_004_f023_public_get_guides_list_includes_active_after_stake_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_appstk_{}", Uuid::new_v4());
    let email = format!("guides-f023-list-{guide_user_id}@traveltrust.test");

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
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
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let router = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Shanghai",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_004_app_stack"
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();

    let stake_body = json!({ "amount": "100" });
    let stake_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/guides/{guide_id_str}/stake"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(stake_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(stake_res.status(), StatusCode::OK);
    let stake_json = response_json(stake_res).await;
    assert_eq!(stake_json["status"], "ok");
    assert_eq!(stake_json["guide_status"], "active");

    let list_res = router
        .oneshot(
            Request::builder()
                .uri("/api/v1/guides?city=Shanghai")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK);
    let list_json = response_json(list_res).await;
    assert_eq!(list_json["status"], "ok");
    let items = list_json["items"].as_array().unwrap();
    let found = items
        .iter()
        .any(|it| it["id"].as_str() == Some(guide_id_str));
    assert!(
        found,
        "GET /guides?city= (router::app) should include staked active guide"
    );

    cleanup_guide_user(&pool, guide_user_id).await;
}

/// **93 · B-GDE-001** → **§8.2 · F-023**：**`POST …/guides`** 后、**`POST …/stake` 前**，**`GET /api/v1/guides?city=Shanghai`** **`items`** **不含** **`pending`** 向导（**`router::app`**；与 **`matrix_93_b_gde_004_f023_*`** **互补**）。
#[tokio::test]
async fn matrix_93_b_gde_004b_f023_public_get_guides_list_excludes_pending_before_stake_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_004b_f023_public_get_guides_list_excludes_pending_before_stake_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_004b_{}", Uuid::new_v4());
    let email = format!("guides-f023-004b-{guide_user_id}@traveltrust.test");

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
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
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let router = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Shanghai",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_004b_pending_list"
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();

    let list_res = router
        .oneshot(
            Request::builder()
                .uri("/api/v1/guides?city=Shanghai")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK);
    let list_json = response_json(list_res).await;
    assert_eq!(list_json["status"], "ok");
    let items = list_json["items"].as_array().unwrap();
    let found = items
        .iter()
        .any(|it| it["id"].as_str() == Some(guide_id_str));
    assert!(
        !found,
        "GET /guides?city= before stake must not list pending guide id={guide_id_str}: {list_json:?}"
    );

    cleanup_guide_user(&pool, guide_user_id).await;
}

/// **93 · B-GDE-001** → **§8.2 · F-023**：**`POST …/guides`→`POST …/stake`→`GET /api/v1/guides?city=&languages=`** / **`?city=&service_types=`** **`items`** 仍含该 **`active`** 向导（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_gde_004c_f023_public_get_guides_list_language_and_service_filters_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_004c_f023_public_get_guides_list_language_and_service_filters_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_004c_{}", Uuid::new_v4());
    let email = format!("guides-f023-004c-{guide_user_id}@traveltrust.test");

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
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
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let router = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Shanghai",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_004c_filters"
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();

    let stake_body = json!({ "amount": "100" });
    let stake_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/guides/{guide_id_str}/stake"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(stake_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(stake_res.status(), StatusCode::OK);

    for q in [
        "/api/v1/guides?city=Shanghai&languages=zh",
        "/api/v1/guides?city=Shanghai&service_types=walking",
    ] {
        let list_res = router
            .clone()
            .oneshot(Request::builder().uri(q).body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(list_res.status(), StatusCode::OK, "uri={q}");
        let list_json = response_json(list_res).await;
        assert_eq!(list_json["status"], "ok");
        let items = list_json["items"].as_array().unwrap();
        let found = items
            .iter()
            .any(|it| it["id"].as_str() == Some(guide_id_str));
        assert!(
            found,
            "GET {q} (router::app) should include staked active guide id={guide_id_str}"
        );
    }

    cleanup_guide_user(&pool, guide_user_id).await;
}

/// **93 · B-GDE-001** → **§8.2 · F-023**：**`POST …/guides`→`POST …/stake`→`GET /api/v1/guides?city=&language=`**（**单数** **`language`** **查询参数**）**`items`** 含 **`active`** 向导（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_gde_004e_f023_public_get_guides_list_singular_language_param_zh_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_004e_f023_public_get_guides_list_singular_language_param_zh_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_004e_{}", Uuid::new_v4());
    let email = format!("guides-f023-004e-{guide_user_id}@traveltrust.test");

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
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
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let router = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Shanghai",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_004e_language_param"
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();

    let stake_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/guides/{guide_id_str}/stake"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "amount": "100" }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(stake_res.status(), StatusCode::OK);

    let list_res = router
        .oneshot(
            Request::builder()
                .uri("/api/v1/guides?city=Shanghai&language=zh")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK);
    let list_json = response_json(list_res).await;
    assert_eq!(list_json["status"], "ok");
    let items = list_json["items"].as_array().unwrap();
    let found = items
        .iter()
        .any(|it| it["id"].as_str() == Some(guide_id_str));
    assert!(
        found,
        "GET ?city=Shanghai&language=zh should include staked guide id={guide_id_str}: {list_json:?}"
    );

    cleanup_guide_user(&pool, guide_user_id).await;
}

#[tokio::test]
async fn matrix_93_b_gde_003_f024_stake_post_persists_guide_row_active() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_b_gde_003_f024_stake_post_persists_guide_row_active (DATABASE_URL unset)");
        return;
    };

    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_{}", Uuid::new_v4());
    let email = format!("guides-f024-{guide_user_id}@traveltrust.test");

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
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
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let app = guides::router().with_state(api_meta_state(Some(co)));

    let post_body = json!({
        "city": "Shanghai",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_003"
    });
    let post_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();
    let guide_id = Uuid::parse_str(guide_id_str).unwrap();

    let stake_body = json!({ "amount": "100" });
    let stake_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/guides/{guide_id_str}/stake"))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(stake_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(stake_res.status(), StatusCode::OK);
    let stake_json = response_json(stake_res).await;
    assert_eq!(stake_json["status"], "ok");
    assert_eq!(stake_json["stake_amount"], "100");
    assert_eq!(stake_json["guide_status"], "active");

    let row: (String, String) =
        sqlx::query_as("SELECT stake_amount, status FROM guides WHERE id = $1 LIMIT 1")
            .bind(guide_id)
            .fetch_one(&pool)
            .await
            .expect("guides row");
    assert_eq!(row.0, "100");
    assert_eq!(row.1, "active");

    let list_res = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/guides?city=Shanghai")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK);
    let list_json = response_json(list_res).await;
    assert_eq!(list_json["status"], "ok");
    let items = list_json["items"].as_array().unwrap();
    let found = items
        .iter()
        .any(|it| it["id"].as_str() == Some(guide_id_str));
    assert!(
        found,
        "GET /guides?city= should include staked active guide (chain_off store)"
    );

    cleanup_guide_user(&pool, guide_user_id).await;
}

/// **93 · B-GDE-003** → **§8.2 · F-024**：**`POST …/stake`** + **PG** + **公开列表**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_003b_f024_stake_post_persists_guide_row_active_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_{}", Uuid::new_v4());
    let email = format!("guides-f024b-{guide_user_id}@traveltrust.test");

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
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
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let app = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Shanghai",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_003b_app_stack"
    });
    let post_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();
    let guide_id = Uuid::parse_str(guide_id_str).unwrap();

    let stake_body = json!({ "amount": "100" });
    let stake_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/guides/{guide_id_str}/stake"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(stake_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(stake_res.status(), StatusCode::OK);
    let stake_json = response_json(stake_res).await;
    assert_eq!(stake_json["status"], "ok");
    assert_eq!(stake_json["stake_amount"], "100");
    assert_eq!(stake_json["guide_status"], "active");

    let row: (String, String) =
        sqlx::query_as("SELECT stake_amount, status FROM guides WHERE id = $1 LIMIT 1")
            .bind(guide_id)
            .fetch_one(&pool)
            .await
            .expect("guides row");
    assert_eq!(row.0, "100");
    assert_eq!(row.1, "active");

    let list_res = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/guides?city=Shanghai")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK);
    let list_json = response_json(list_res).await;
    assert_eq!(list_json["status"], "ok");
    let items = list_json["items"].as_array().unwrap();
    let found = items
        .iter()
        .any(|it| it["id"].as_str() == Some(guide_id_str));
    assert!(
        found,
        "GET /guides?city= (router::app) should include staked active guide"
    );

    cleanup_guide_user(&pool, guide_user_id).await;
}

/// **93 · B-GDE-003** → **§8.2 · F-024**：**`POST …/guides/:id/stake`** **同额** **连击** **`200`** ×2；**`guide_status`** 仍为 **`active`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_gde_003c_f024_post_stake_twice_same_amount_ok_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_003c_f024_post_stake_twice_same_amount_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_003c_{}", Uuid::new_v4());
    let email = format!("guides-f024-003c-{guide_user_id}@traveltrust.test");

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
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
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let app = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Shanghai",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_003c_app_stack"
    });
    let post_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    assert_eq!(post_json["status"], "ok");
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();
    let guide_id = Uuid::parse_str(guide_id_str).unwrap();

    let stake_body = json!({ "amount": "100" });
    for n in 1..=2 {
        let stake_res = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(Method::POST)
                    .uri(format!("/api/v1/guides/{guide_id_str}/stake"))
                    .header(header::AUTHORIZATION, auth_bearer(&token))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(stake_body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(stake_res.status(), StatusCode::OK, "stake call {n}");
        let stake_json = response_json(stake_res).await;
        assert_eq!(stake_json["status"], "ok");
        assert_eq!(stake_json["stake_amount"], "100");
        assert_eq!(stake_json["guide_status"], "active");
    }

    let row: (String, String) =
        sqlx::query_as("SELECT stake_amount, status FROM guides WHERE id = $1 LIMIT 1")
            .bind(guide_id)
            .fetch_one(&pool)
            .await
            .expect("guides row");
    assert_eq!(row.0, "100");
    assert_eq!(row.1, "active");

    cleanup_guide_user(&pool, guide_user_id).await;
}

/// **93 · B-GDE-001 / B-GDE-003** → **§8.2 · F-024**：**`POST …/stake`** 后 **`GET /api/v1/guides?city=`**（**无 Bearer**）**`items[]`** 命中行 **`stake_amount`** **`100`**、**`status`** **`active`**（**`router::app`**；**`GET …/guides/:id` 无会话** 仍 **401** 门闸 — **不**在本测强扭）。
#[tokio::test]
async fn matrix_93_b_gde_003d_f024_stake_then_public_list_shows_stake_amount_active_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_gde_003d_f024_stake_then_public_list_shows_stake_amount_active_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let guide_user_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_guides_003d_{}", Uuid::new_v4());
    let email = format!("guides-f024-003d-{guide_user_id}@traveltrust.test");

    cleanup_guide_user(&pool, guide_user_id).await;

    insert_user(
        &pool,
        guide_user_id,
        &email,
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
    .expect("insert_user");
    insert_session(&pool, &token, guide_user_id)
        .await
        .expect("insert_session");

    let app = app_stack_f023(pool.clone());

    let post_body = json!({
        "city": "Shanghai",
        "country_code": "CN",
        "languages": ["zh"],
        "service_types": ["walking"],
        "bio": "matrix_93_b_gde_003d_list_stake_fields"
    });
    let post_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_json = response_json(post_res).await;
    let guide_id_str = post_json["guide"]["id"].as_str().unwrap();

    let stake_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/guides/{guide_id_str}/stake"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "amount": "100" }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(stake_res.status(), StatusCode::OK);

    let list_res = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/guides?city=Shanghai")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK);
    let list_json = response_json(list_res).await;
    assert_eq!(list_json["status"], "ok");
    let items = list_json["items"].as_array().expect("items");
    let card = items
        .iter()
        .find(|it| it["id"].as_str() == Some(guide_id_str))
        .unwrap_or_else(|| panic!("guide {guide_id_str} not in public list: {list_json:?}"));
    assert_eq!(card["stake_amount"], "100");
    assert_eq!(card["status"], "active");

    cleanup_guide_user(&pool, guide_user_id).await;
}

#[tokio::test]
async fn matrix_93_b_dsp_002_f025_dispute_detail_links_order() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_b_dsp_002_f025_dispute_detail_links_order (DATABASE_URL unset)");
        return;
    };

    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    let guide_row_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let dispute_id = Uuid::new_v4();
    let now = Utc::now();

    cleanup_dispute_bundle(
        &pool,
        dispute_id,
        order_id,
        guide_row_id,
        tourist_id,
        guide_user_id,
    )
    .await;

    insert_user(
        &pool,
        tourist_id,
        &format!("dsp-t-{tourist_id}@traveltrust.test"),
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
    .expect("tourist");
    insert_user(
        &pool,
        guide_user_id,
        &format!("dsp-g-{guide_user_id}@traveltrust.test"),
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
    .expect("guide user");

    insert_guide(
        &pool,
        guide_row_id,
        guide_user_id,
        "HZ",
        "CN",
        &["zh".to_string()],
        &["walking".to_string()],
        Some("dispute seed guide"),
        None,
        None,
        None,
        None,
        None,
        None,
        "0",
        "active",
        now,
        now,
    )
    .await
    .expect("insert_guide");

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

    insert_dispute(
        &pool,
        dispute_id,
        order_id,
        "open",
        &json!([]),
        None,
        None,
        None,
        None,
        now,
        now,
        None,
        1,
    )
    .await
    .expect("insert_dispute");

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let app = disputes::router().with_state(api_meta_state(Some(co)));

    let list_res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/disputes?limit=50")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK);
    let list_json = response_json(list_res).await;
    assert_eq!(list_json["status"], "ok");
    assert_eq!(list_json["page"]["source"], "postgres");
    let items = list_json["items"].as_array().unwrap();
    let id_s = dispute_id.to_string();
    let found = items
        .iter()
        .any(|it| it["id"].as_str() == Some(id_s.as_str()));
    assert!(found, "list should include seeded dispute");

    let detail_res = app
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/disputes/{id_s}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(detail_res.status(), StatusCode::OK);
    let detail_json = response_json(detail_res).await;
    assert_eq!(detail_json["status"], "ok");
    assert_eq!(detail_json["dispute"]["id"], id_s);
    assert_eq!(
        detail_json["dispute"]["order_id"].as_str().unwrap(),
        order_id.to_string()
    );

    cleanup_dispute_bundle(
        &pool,
        dispute_id,
        order_id,
        guide_row_id,
        tourist_id,
        guide_user_id,
    )
    .await;
}

/// **93 · B-DSP-002** → **§8.2 · F-025**：**`GET /api/v1/disputes`** + **`GET …/:id`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_dsp_002b_f025_dispute_detail_links_order_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let tourist_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    let guide_row_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let dispute_id = Uuid::new_v4();
    let now = Utc::now();

    cleanup_dispute_bundle(
        &pool,
        dispute_id,
        order_id,
        guide_row_id,
        tourist_id,
        guide_user_id,
    )
    .await;

    insert_user(
        &pool,
        tourist_id,
        &format!("dsp-tb-{tourist_id}@traveltrust.test"),
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
    .expect("tourist");
    insert_user(
        &pool,
        guide_user_id,
        &format!("dsp-gb-{guide_user_id}@traveltrust.test"),
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
    .expect("guide user");

    let dsp_token = format!("tts_dsp002b_{}", Uuid::new_v4());
    insert_session(&pool, &dsp_token, tourist_id)
        .await
        .expect("insert_session tourist");

    insert_guide(
        &pool,
        guide_row_id,
        guide_user_id,
        "HZ",
        "CN",
        &["zh".to_string()],
        &["walking".to_string()],
        Some("dispute seed guide app_stack"),
        None,
        None,
        None,
        None,
        None,
        None,
        "0",
        "active",
        now,
        now,
    )
    .await
    .expect("insert_guide");

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

    insert_dispute(
        &pool,
        dispute_id,
        order_id,
        "open",
        &json!([]),
        None,
        None,
        None,
        None,
        now,
        now,
        None,
        1,
    )
    .await
    .expect("insert_dispute");

    let app = app_stack_f023(pool.clone());

    let list_res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/v1/disputes?limit=50")
                .header(header::AUTHORIZATION, auth_bearer(&dsp_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(list_res.status(), StatusCode::OK);
    let list_json = response_json(list_res).await;
    assert_eq!(list_json["status"], "ok");
    assert_eq!(list_json["page"]["source"], "postgres");
    let items = list_json["items"].as_array().unwrap();
    let id_s = dispute_id.to_string();
    let found = items
        .iter()
        .any(|it| it["id"].as_str() == Some(id_s.as_str()));
    assert!(found, "list should include seeded dispute (router::app)");

    let detail_res = app
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/disputes/{id_s}"))
                .header(header::AUTHORIZATION, auth_bearer(&dsp_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(detail_res.status(), StatusCode::OK);
    let detail_json = response_json(detail_res).await;
    assert_eq!(detail_json["status"], "ok");
    assert_eq!(detail_json["dispute"]["id"], id_s);
    assert_eq!(
        detail_json["dispute"]["order_id"].as_str().unwrap(),
        order_id.to_string()
    );

    cleanup_dispute_bundle(
        &pool,
        dispute_id,
        order_id,
        guide_row_id,
        tourist_id,
        guide_user_id,
    )
    .await;
}
