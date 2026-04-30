//! **F-010 / F-012 / F-013 · API·IT（PostgreSQL + `Router::oneshot`）**
//!
//! - **F-010**：向导接单后，在 **`P3_CHAIN_OFF=1`** 且未启用生产 mock 闸下，**`POST /api/v1/orders/:id/mock-pay`** → **`escrowed`**。
//! - **F-012**：**`POST /api/v1/itineraries`** → **`draft`** 订单 + **`itineraries`** PG 同事务语义（HTTP 层）。
//! - **F-013**：**`POST /api/v1/orders/:id/confirm-final-plan`**（**`expected_version: 1`**）→ **`snapshot_hash`**；**`accepted`** 下 **`POST …/confirm-bilateral`**（**旅客+向导**）→ **`sub_status=confirmed`**（**`matrix_93_b_ord_005c_f013_*`**）。
//!
//! **93**：**`matrix_93_b_esc_001_*`** ↔ **B-ESC-001**/**F-010**（**§2.5 · AUTO-P0**）；**`matrix_93_b_esc_001b_f010_*`** ↔ **B-ESC-001**/**F-010**（**`router::app`**；**v1.4.253**）；**`matrix_93_b_esc_002b_f010_*`** ↔ **B-ESC-002**/**F-010**（**`POST …/confirm-completion`**→**`completed`**；**`router::app`**；**v1.4.283**）；**`matrix_93_b_esc_005d_f010_*`** ↔ **B-ESC-003**/**F-010**（**双 `POST …/confirm-rating`**→**`sub_status=rating_confirmed`**；**`router::app`**；**v1.4.284**）；**`matrix_93_b_esc_004b_f029_*`** ↔ **B-ESC-004**/**F-029**（**`GET …/chain-sync-status`** **`chain_sync.last_event.state`**；**`router::app`**；**v1.4.283**）；**`matrix_93_b_esc_005b_f027_*`** ↔ **B-ESC-003**/**F-027**（**双 `POST …/reviews`** **`GET …/reviews`** **`items.len()==2`**；**`router::app`**；**v1.4.284**）；**`matrix_93_b_ord_005c_f013_*`** ↔ **B-ORD-005**/**F-013**（**`POST …/confirm-bilateral`** **`sub_status=confirmed`**；**`router::app`**；**v1.4.284**）；**`matrix_93_b_trn_003b_f025_*`** ↔ **B-TRN-003**/**F-025**（**`POST …/dispute`→`GET …/orders/:id`** **`disputed`**；**`router::app`**；**v1.4.283**）；**`matrix_93_b_dsp_001_*`** ↔ **B-DSP-001**/**F-025**（**§2.6 · AUTO-P0**；**`POST …/orders/:id/dispute`** → **`GET /api/v1/disputes`**）；**`matrix_93_b_dsp_001b_f025_*`** ↔ **B-DSP-001**/**F-025**（**`router::app`**；**v1.4.254**）；**`matrix_93_b_dsp_003b_f025_*`** ↔ **B-DSP-003**/**F-025**（**§2.6 · MANUAL-P1**；**`P3_SEED_ARBITRATOR_EMAIL`** **命中注册** **`arbitrator`** →**`POST …/disputes/:id/resolve`**→**`disputes.status=resolved` PG**；**`router::app`**；**v1.4.281**）；**`matrix_93_d_itn_001_*`** ↔ **D-ITN-001**/**F-012**（**§4 · MANUAL-P1**，**ISS-007** 单列回填）；**`matrix_93_d_itn_001b_f012_*`** ↔ **D-ITN-001**/**F-012**（**`router::app`**；**v1.4.253**）；**`matrix_93_d_itn_001c_f012_*`** ↔ **D-ITN-001**/**F-012**（**`POST …/itineraries`→`GET …/orders/:id`** **`itinerary.destination`** **主栈**；**`router::app`**；**v1.4.282**）；**`matrix_93_d_itn_001d_f012_*`** ↔ **D-ITN-001**/**F-012**（**`POST …/itineraries`** **draft** → **`PATCH …/orders/:id/itinerary`** → **`GET …/orders/:id`** **`daily_itinerary` 读回**；**`router::app`**；**v1.4.285**）；**`matrix_93_b_ord_005_*`** ↔ **B-ORD-005**/**F-013**（**§2.3 · MANUAL-P1**，**ISS-007** 单列回填）；**`matrix_93_b_ord_005b_f013_*`** ↔ **B-ORD-005**/**F-013**（**`router::app`**；**v1.4.253**）。判据见 **`spec/93-全站功能验证矩阵-域别回归清单.md`**。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（与 **`orders_create_list_set_escrow_address_db_api_tests`** 同源）；须指向**已迁移**库。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::sync::{Arc, OnceLock};
use tokio::sync::{Mutex as TokioMutex, RwLock};
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::routes::orders::CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS;
use crate::routes::{auth, disputes, guides, itineraries, me, orders};
use crate::state::test_support::{
    api_meta_state, TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK,
};

async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

fn db_router(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    Router::new()
        .merge(auth::router())
        .merge(me::router())
        .merge(guides::router())
        .merge(orders::router())
        .merge(disputes::router())
        .merge(itineraries::router())
        .with_state(api_meta_state(Some(chain_off)))
}

static MOCK_PAY_ITIN_APP_STACK_IT_LOCK: OnceLock<TokioMutex<()>> = OnceLock::new();

fn mock_pay_itin_app_stack_it_lock() -> &'static TokioMutex<()> {
    MOCK_PAY_ITIN_APP_STACK_IT_LOCK.get_or_init(|| TokioMutex::new(()))
}

fn app_stack_router(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

async fn response_json(res: axum::response::Response) -> Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

fn auth_bearer_value(token: impl AsRef<str>) -> axum::http::HeaderValue {
    format!("Bearer {}", token.as_ref())
        .parse()
        .expect("bearer header value")
}

async fn cleanup_order_participants(pool: &PgPool, tourist_email: &str, guide_email: &str) {
    let _ = sqlx::query(
        r#"DELETE FROM disputes
           WHERE order_id IN (
             SELECT o.id FROM orders o
             WHERE o.tourist_id IN (SELECT id FROM users WHERE lower(email) = lower($1))
                OR o.guide_id IN (
                  SELECT g.id FROM guides g
                  JOIN users u ON g.user_id = u.id
                  WHERE lower(u.email) = lower($2)
                )
           )"#,
    )
    .bind(tourist_email)
    .bind(guide_email)
    .execute(pool)
    .await;

    let _ = sqlx::query(
        r#"DELETE FROM orders
           WHERE tourist_id IN (SELECT id FROM users WHERE lower(email) = lower($1))
              OR guide_id IN (
                SELECT g.id FROM guides g
                JOIN users u ON g.user_id = u.id
                WHERE lower(u.email) = lower($2)
              )"#,
    )
    .bind(tourist_email)
    .bind(guide_email)
    .execute(pool)
    .await;

    let _ = sqlx::query(
        r#"DELETE FROM guides
           WHERE user_id IN (
             SELECT id FROM users WHERE lower(email) = lower($1)
           )"#,
    )
    .bind(guide_email)
    .execute(pool)
    .await;

    for email in [tourist_email, guide_email] {
        let _ = sqlx::query(
            r#"DELETE FROM sessions USING users u
               WHERE sessions.user_id = u.id AND lower(u.email) = lower($1)"#,
        )
        .bind(email)
        .execute(pool)
        .await;
        let _ = sqlx::query("DELETE FROM users WHERE lower(email) = lower($1)")
            .bind(email)
            .execute(pool)
            .await;
    }
}

fn arb_email_for_mockpay_tourist(tourist_email: &str) -> String {
    let rest = tourist_email
        .strip_prefix("orders-mockpay-it-t-")
        .unwrap_or_else(|| panic!("unexpected tourist_email pattern: {tourist_email}"));
    format!("orders-mockpay-it-arb-{rest}")
}

async fn cleanup_arb_user(pool: &PgPool, arb_email: &str) {
    let _ = sqlx::query(
        r#"DELETE FROM sessions USING users u
           WHERE sessions.user_id = u.id AND lower(u.email) = lower($1)"#,
    )
    .bind(arb_email)
    .execute(pool)
    .await;
    let _ = sqlx::query("DELETE FROM users WHERE lower(email) = lower($1)")
        .bind(arb_email)
        .execute(pool)
        .await;
}

/// Restores a single env var on drop (used for **`P3_SEED_ARBITRATOR_EMAIL`** in **B-DSP-003** flows).
struct RestoreEnvVar {
    key: &'static str,
    previous: Option<String>,
}

impl Drop for RestoreEnvVar {
    fn drop(&mut self) {
        match &self.previous {
            None => std::env::remove_var(self.key),
            Some(v) => std::env::set_var(self.key, v),
        }
    }
}

/// Restores **`P3_CHAIN_OFF`** to its previous value (or removes it) on drop.
struct RestoreP3ChainOff {
    previous: Option<String>,
}

impl Drop for RestoreP3ChainOff {
    fn drop(&mut self) {
        match &self.previous {
            None => std::env::remove_var("P3_CHAIN_OFF"),
            Some(v) => std::env::set_var("P3_CHAIN_OFF", v),
        }
    }
}

/// **B-ESC-001（前缀）**：注册 → 向导 **`POST …/guides`** → **`stake`** → 旅客 **`POST …/orders`** → 向导 **`POST …/accept`** → **`accepted`**。**不** **`mock-pay`**。**不** cleanup。
/// 返回 **`(app, tourist_email, guide_email, order_id, token_tourist, token_guide)`** 供 **`confirm-bilateral`** / **`mock-pay`** 等续链。
async fn run_b_esc_001_to_accepted_with_app(
    pool: &PgPool,
    app: Router,
) -> (Router, String, String, String, String, String) {
    let suffix = Uuid::new_v4();
    let tourist_email = format!("orders-mockpay-it-t-{suffix}@traveltrust.test");
    let guide_email = format!("orders-mockpay-it-g-{suffix}@traveltrust.test");

    cleanup_order_participants(pool, &tourist_email, &guide_email).await;

    let reg_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &tourist_email,
                        "password": "TestPass12!",
                        "nickname": "tourist_mp"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        reg_t.status(),
        StatusCode::OK,
        "{:?}",
        response_json(reg_t).await
    );
    let token_t = response_json(reg_t).await["token"]
        .as_str()
        .expect("tourist token")
        .to_string();

    let reg_g = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &guide_email,
                        "password": "TestPass12!",
                        "nickname": "guide_mp"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        reg_g.status(),
        StatusCode::OK,
        "{:?}",
        response_json(reg_g).await
    );
    let token_g = response_json(reg_g).await["token"]
        .as_str()
        .expect("guide token")
        .to_string();

    let gc = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::from(
                    json!({
                        "city": "Shanghai",
                        "country_code": "CN",
                        "languages": ["zh"],
                        "service_types": ["walking"]
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    let gc_status = gc.status();
    let gc_j = response_json(gc).await;
    assert_eq!(gc_status, StatusCode::OK, "{:?}", gc_j);
    let guide_row_id = gc_j["guide"]["id"].as_str().expect("guide id").to_string();

    let stake = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/guides/{guide_row_id}/stake"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::from(json!({"amount": "1"}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        stake.status(),
        StatusCode::OK,
        "{:?}",
        response_json(stake).await
    );

    let create = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({
                        "guide_id": guide_row_id,
                        "amount": "100",
                        "currency": "USD"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        create.status(),
        StatusCode::OK,
        "{:?}",
        response_json(create).await
    );
    let create_j = response_json(create).await;
    let order_id = create_j["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();

    let accept = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/accept"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        accept.status(),
        StatusCode::OK,
        "{:?}",
        response_json(accept).await
    );
    let accept_j = response_json(accept).await;
    assert_eq!(accept_j["order"]["status"], "accepted");

    (app, tourist_email, guide_email, order_id, token_t, token_g)
}

/// **B-ESC-001**：接单 → **`mock-pay`** → **`escrowed`**；**`GET /orders/:id`** 再读一致。**不** cleanup。
/// 返回 **`(app, tourist_email, guide_email, order_id, token_tourist, token_guide)`** 供 **`B-DSP-001`** / **`B-ESC-002`** 等续链。
async fn run_b_esc_001_mock_pay_flow_with_app(
    pool: &PgPool,
    app: Router,
) -> (Router, String, String, String, String, String) {
    let (app, tourist_email, guide_email, order_id, token_t, token_g) =
        run_b_esc_001_to_accepted_with_app(pool, app).await;

    let pay = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/mock-pay"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        pay.status(),
        StatusCode::OK,
        "{:?}",
        response_json(pay).await
    );
    let pay_j = response_json(pay).await;
    assert_eq!(pay_j["status"], "ok");
    assert_eq!(pay_j["order"]["status"], "escrowed");
    assert!(pay_j["order"]["escrowed_at"].is_string());

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        get.status(),
        StatusCode::OK,
        "{:?}",
        response_json(get).await
    );
    let gj = response_json(get).await;
    assert_eq!(gj["order"]["status"], "escrowed");

    (app, tourist_email, guide_email, order_id, token_t, token_g)
}

/// **`mock-pay`→`escrowed`** → 向导 **`POST …/confirm-completion`** → **`completed`**（**`GET …/orders/:id`** 再读）。
async fn run_b_esc_002_completed_with_app(
    pool: &PgPool,
    app: Router,
) -> (Router, String, String, String, String, String) {
    let (app, tourist_email, guide_email, order_id, token_t, token_g) =
        run_b_esc_001_mock_pay_flow_with_app(pool, app).await;

    let cc = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/confirm-completion"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(cc.status(), StatusCode::OK, "{:?}", response_json(cc).await);
    let cc_j = response_json(cc).await;
    assert_eq!(cc_j["order"]["status"], "completed");

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        get.status(),
        StatusCode::OK,
        "{:?}",
        response_json(get).await
    );
    let gj = response_json(get).await;
    assert_eq!(gj["order"]["status"], "completed");

    (app, tourist_email, guide_email, order_id, token_t, token_g)
}

async fn run_b_esc_001_mock_pay_flow(
    pool: &PgPool,
) -> (Router, String, String, String, String, String) {
    run_b_esc_001_mock_pay_flow_with_app(pool, db_router(pool.clone())).await
}

#[tokio::test]
async fn f010_post_order_accept_mock_pay_escrowed_db_api() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: f010_post_order_accept_mock_pay_escrowed_db_api (DATABASE_URL unset)");
        return;
    };

    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let (_app, tourist_email, guide_email, _, _, _) = run_b_esc_001_mock_pay_flow(&pool).await;
    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **D-ITN-001**：**`POST /itineraries`** **200** + **`itineraries`** **PG** 行；返回 **`order_id`** + **`token_t`** 供 **`001c`** **`GET /orders/:id`** 链。**不** cleanup。
async fn run_d_itn_001_draft_bundle_with_app(
    pool: &PgPool,
    app: Router,
) -> (String, String, String, String) {
    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-d-itn-001-t-{suffix}@traveltrust.test");
    let unused_guide_email = format!("93-d-itn-001-ph-{suffix}@traveltrust.test");

    cleanup_order_participants(pool, &tourist_email, &unused_guide_email).await;

    let reg_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &tourist_email,
                        "password": "TestPass12!",
                        "nickname": "tourist_ditn"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        reg_t.status(),
        StatusCode::OK,
        "{:?}",
        response_json(reg_t).await
    );
    let token_t = response_json(reg_t).await["token"]
        .as_str()
        .expect("tourist token")
        .to_string();

    let itin = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/itineraries")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({
                        "destination": "中国",
                        "city": "北京",
                        "travel_date": "2025-07-01",
                        "days": 2,
                        "budget_min": 1000.0,
                        "budget_max": 2000.0
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        itin.status(),
        StatusCode::OK,
        "{:?}",
        response_json(itin).await
    );
    let itin_j = response_json(itin).await;
    assert_eq!(itin_j["status"], "ok");
    assert_eq!(itin_j["version"], 1);
    assert_eq!(itin_j["order_status"], "draft");
    let order_id = itin_j["order_id"].as_str().expect("order_id").to_string();
    let oid = Uuid::parse_str(&order_id).expect("order_id uuid");

    let cnt: i64 =
        sqlx::query_scalar("SELECT COUNT(*)::bigint FROM itineraries WHERE order_id = $1")
            .bind(oid)
            .fetch_one(pool)
            .await
            .unwrap();
    assert_eq!(cnt, 1, "D-ITN-001 expects itineraries row");

    (tourist_email, unused_guide_email, order_id, token_t)
}

async fn run_d_itn_001_draft_only_with_app(pool: &PgPool, app: Router) -> (String, String) {
    let (tourist_email, unused_guide_email, _, _) =
        run_d_itn_001_draft_bundle_with_app(pool, app).await;
    (tourist_email, unused_guide_email)
}

async fn run_d_itn_001_draft_only(pool: &PgPool) -> (String, String) {
    run_d_itn_001_draft_only_with_app(pool, db_router(pool.clone())).await
}

/// **B-ORD-005**：**`POST /itineraries`** → **`confirm-final-plan`**（**`expected_version: 1`**）→ **`snapshot_hash`**。**不** cleanup。
async fn run_b_ord_005_itin_then_confirm_final_with_app(
    pool: &PgPool,
    app: Router,
) -> (String, String) {
    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-ord-005-t-{suffix}@traveltrust.test");
    let unused_guide_email = format!("93-b-ord-005-ph-{suffix}@traveltrust.test");

    cleanup_order_participants(pool, &tourist_email, &unused_guide_email).await;

    let reg_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &tourist_email,
                        "password": "TestPass12!",
                        "nickname": "tourist_b05"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        reg_t.status(),
        StatusCode::OK,
        "{:?}",
        response_json(reg_t).await
    );
    let token_t = response_json(reg_t).await["token"]
        .as_str()
        .expect("tourist token")
        .to_string();

    let itin = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/itineraries")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({
                        "destination": "中国",
                        "city": "北京",
                        "travel_date": "2025-07-01",
                        "days": 2,
                        "budget_min": 1000.0,
                        "budget_max": 2000.0
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        itin.status(),
        StatusCode::OK,
        "{:?}",
        response_json(itin).await
    );
    let itin_j = response_json(itin).await;
    assert_eq!(itin_j["status"], "ok");
    assert_eq!(itin_j["version"], 1);
    assert_eq!(itin_j["order_status"], "draft");
    let order_id = itin_j["order_id"].as_str().expect("order_id").to_string();

    let confirm = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/confirm-final-plan"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(json!({ "expected_version": 1 }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        confirm.status(),
        StatusCode::OK,
        "{:?}",
        response_json(confirm).await
    );
    let confirm_j = response_json(confirm).await;
    assert_eq!(confirm_j["status"], "ok");
    let snap = confirm_j["snapshot_hash"].as_str().expect("snapshot_hash");
    assert!(snap.starts_with("0x"), "snapshot_hash: {snap}");

    (tourist_email, unused_guide_email)
}

async fn run_b_ord_005_itin_then_confirm_final(pool: &PgPool) -> (String, String) {
    run_b_ord_005_itin_then_confirm_final_with_app(pool, db_router(pool.clone())).await
}

#[tokio::test]
async fn f012_f013_itinerary_create_then_confirm_final_plan_db_api() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: f012_f013_itinerary_create_then_confirm_final_plan_db_api (DATABASE_URL unset)"
        );
        return;
    };

    let (tourist_email, unused_guide_email) = run_b_ord_005_itin_then_confirm_final(&pool).await;
    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}

/// **93 · B-ESC-001** → **§8.2 · F-010**（**§2.5 · AUTO-P0**）。
#[tokio::test]
async fn matrix_93_b_esc_001_mock_pay_then_get_order_escrowed() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_esc_001_mock_pay_then_get_order_escrowed (DATABASE_URL unset)"
        );
        return;
    };

    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let (_app, tourist_email, guide_email, _, _, _) = run_b_esc_001_mock_pay_flow(&pool).await;
    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-DSP-001** → **§8.2 · F-025**：**`POST /api/v1/orders/:id/dispute`** **200** → **`GET /api/v1/disputes`** **`items[]`** 含新 **`id`**。
#[tokio::test]
async fn matrix_93_b_dsp_001_f025_post_order_dispute_then_list_contains_dispute_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_dsp_001_f025_post_order_dispute_then_list_contains_dispute_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let (app, tourist_email, guide_email, order_id, token_t, _token_g) =
        run_b_esc_001_mock_pay_flow(&pool).await;

    let open = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/dispute"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({ "reason": "matrix_93_b_dsp_001" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        open.status(),
        StatusCode::OK,
        "{:?}",
        response_json(open).await
    );
    let open_j = response_json(open).await;
    assert_eq!(open_j["status"], "ok");
    let dispute_id = open_j["dispute"]["id"]
        .as_str()
        .expect("dispute id")
        .to_string();

    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/disputes?limit=50")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        list.status(),
        StatusCode::OK,
        "{:?}",
        response_json(list).await
    );
    let list_j = response_json(list).await;
    assert_eq!(list_j["status"], "ok");
    let items = list_j["items"].as_array().expect("items");
    assert!(
        items
            .iter()
            .any(|it| it["id"].as_str() == Some(dispute_id.as_str())),
        "B-DSP-001: disputes list should include opened dispute"
    );

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-DSP-001** → **§8.2 · F-025**：**`POST …/dispute`** → **`GET /api/v1/disputes`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let stack_app = app_stack_router(pool.clone());
    let (app, tourist_email, guide_email, order_id, token_t, _token_g) =
        run_b_esc_001_mock_pay_flow_with_app(&pool, stack_app).await;

    let open = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/dispute"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({ "reason": "matrix_93_b_dsp_001b" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        open.status(),
        StatusCode::OK,
        "{:?}",
        response_json(open).await
    );
    let open_j = response_json(open).await;
    assert_eq!(open_j["status"], "ok");
    let dispute_id = open_j["dispute"]["id"]
        .as_str()
        .expect("dispute id")
        .to_string();

    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/disputes?limit=50")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        list.status(),
        StatusCode::OK,
        "{:?}",
        response_json(list).await
    );
    let list_j = response_json(list).await;
    assert_eq!(list_j["status"], "ok");
    let items = list_j["items"].as_array().expect("items");
    assert!(
        items
            .iter()
            .any(|it| it["id"].as_str() == Some(dispute_id.as_str())),
        "B-DSP-001 app_stack: disputes list should include opened dispute"
    );

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-DSP-003** → **§8.2 · F-025**：**`POST /api/v1/disputes/:id/resolve`**（**`P3_SEED_ARBITRATOR_EMAIL`** **注册** **`arbitrator`** **`Bearer`**）→ **`disputes.status=resolved`**（**`router::app`** + **PG**）。
#[tokio::test]
async fn matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let stack_app = app_stack_router(pool.clone());
    let (app, tourist_email, guide_email, order_id, token_t, _token_g) =
        run_b_esc_001_mock_pay_flow_with_app(&pool, stack_app).await;

    let open = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/dispute"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({ "reason": "matrix_93_b_dsp_003b" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        open.status(),
        StatusCode::OK,
        "{:?}",
        response_json(open).await
    );
    let open_j = response_json(open).await;
    assert_eq!(open_j["status"], "ok");
    let dispute_id = open_j["dispute"]["id"]
        .as_str()
        .expect("dispute id")
        .to_string();
    let dispute_uuid = Uuid::parse_str(&dispute_id).expect("dispute uuid");

    let arb_email = arb_email_for_mockpay_tourist(&tourist_email);
    cleanup_arb_user(&pool, &arb_email).await;
    let prev_seed = std::env::var("P3_SEED_ARBITRATOR_EMAIL").ok();
    std::env::set_var("P3_SEED_ARBITRATOR_EMAIL", &arb_email);
    let _restore_seed = RestoreEnvVar {
        key: "P3_SEED_ARBITRATOR_EMAIL",
        previous: prev_seed,
    };

    let reg_a = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &arb_email,
                        "password": "TestPass12!",
                        "nickname": "arb_mp"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        reg_a.status(),
        StatusCode::OK,
        "{:?}",
        response_json(reg_a).await
    );
    let reg_a_j = response_json(reg_a).await;
    assert_eq!(reg_a_j["role"], "arbitrator");
    let token_a = reg_a_j["token"]
        .as_str()
        .expect("arbitrator token")
        .to_string();

    let resolve = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/disputes/{dispute_id}/resolve"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_a))
                .body(Body::from(
                    json!({ "refund_ratio": 1.0, "slash_guide": false }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        resolve.status(),
        StatusCode::OK,
        "{:?}",
        response_json(resolve).await
    );
    let resolve_j = response_json(resolve).await;
    assert_eq!(resolve_j["status"], "ok");
    assert_eq!(resolve_j["dispute"]["status"], "resolved");

    let st: String = sqlx::query_scalar("SELECT status FROM disputes WHERE id = $1")
        .bind(dispute_uuid)
        .fetch_one(&pool)
        .await
        .expect("disputes row");
    assert_eq!(st, "resolved");

    let detail = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/disputes/{dispute_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        detail.status(),
        StatusCode::OK,
        "{:?}",
        response_json(detail).await
    );
    let detail_j = response_json(detail).await;
    assert_eq!(detail_j["dispute"]["status"], "resolved");

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
    cleanup_arb_user(&pool, &arb_email).await;
}

/// **93 · D-ITN-001** → **§8.2 · F-012**（**§4 · MANUAL-P1**；**ISS-007** 单列 **`matrix_93_d_itn_001`**）。
#[tokio::test]
async fn matrix_93_d_itn_001_post_itineraries_draft_persists_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_001_post_itineraries_draft_persists_pg (DATABASE_URL unset)"
        );
        return;
    };

    let (tourist_email, unused_guide_email) = run_d_itn_001_draft_only(&pool).await;
    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}

/// **93 · B-ORD-005** → **§8.2 · F-013**（**§2.3 · MANUAL-P1**；**ISS-007** 单列 **`matrix_93_b_ord_005`**）。
#[tokio::test]
async fn matrix_93_b_ord_005_itinerary_then_confirm_final_snapshot() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_005_itinerary_then_confirm_final_snapshot (DATABASE_URL unset)"
        );
        return;
    };

    let (tourist_email, unused_guide_email) = run_b_ord_005_itin_then_confirm_final(&pool).await;
    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}

/// **93 · B-ESC-001** → **§8.2 · F-010**：**`mock-pay`**→**`escrowed`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (_app, tourist_email, guide_email, _, _, _) =
        run_b_esc_001_mock_pay_flow_with_app(&pool, app).await;
    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-ESC-002** → **§8.2 · F-010**：**向导 Bearer** **`POST …/confirm-completion`**→**`GET …/orders/:id`** **`order.status=completed`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (_app, tourist_email, guide_email, _, _, _) =
        run_b_esc_002_completed_with_app(&pool, app).await;

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-ORD-005** → **§8.2 · F-013**：**`accepted`** 下 **旅客→向导** **`POST …/confirm-bilateral`**→**`GET …/orders/:id`** **`sub_status=confirmed`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_005c_f013_accepted_bilateral_confirm_both_then_get_order_sub_status_confirmed_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_005c_f013_accepted_bilateral_confirm_both_then_get_order_sub_status_confirmed_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (app, tourist_email, guide_email, order_id, token_t, token_g) =
        run_b_esc_001_to_accepted_with_app(&pool, app).await;

    let cb_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/confirm-bilateral"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        cb_t.status(),
        StatusCode::OK,
        "{:?}",
        response_json(cb_t).await
    );

    let cb_g = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/confirm-bilateral"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        cb_g.status(),
        StatusCode::OK,
        "{:?}",
        response_json(cb_g).await
    );

    let get = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        get.status(),
        StatusCode::OK,
        "{:?}",
        response_json(get).await
    );
    let gj = response_json(get).await;
    assert_eq!(gj["order"]["status"], "accepted");
    assert_eq!(gj["order"]["sub_status"], "confirmed");
    assert_eq!(gj["order"]["tourist_confirmed"], true);
    assert_eq!(gj["order"]["guide_confirmed"], true);

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-ESC-003** → **§8.2 · F-027**：**`completed`** 后 **旅客+向导** **`POST …/reviews`**→**`GET …/reviews`** **`items` 长度 `2`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_esc_005b_f027_dual_reviews_after_completed_get_list_len_two_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_esc_005b_f027_dual_reviews_after_completed_get_list_len_two_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (app, tourist_email, guide_email, order_id, token_t, token_g) =
        run_b_esc_002_completed_with_app(&pool, app).await;

    let reviews_uri = format!("/api/v1/orders/{order_id}/reviews");

    let rv_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&reviews_uri)
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({"score": 5, "comment": "matrix_93_b_esc_005b_t"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        rv_t.status(),
        StatusCode::OK,
        "{:?}",
        response_json(rv_t).await
    );

    let rv_g = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&reviews_uri)
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::from(
                    json!({"score": 4, "comment": "matrix_93_b_esc_005b_g"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        rv_g.status(),
        StatusCode::OK,
        "{:?}",
        response_json(rv_g).await
    );

    let list = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&reviews_uri)
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        list.status(),
        StatusCode::OK,
        "{:?}",
        response_json(list).await
    );
    let lj = response_json(list).await;
    let items = lj["items"].as_array().expect("reviews items");
    assert_eq!(items.len(), 2);

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-ESC-003 / 53-S8** → **§8.2 · F-010**：**双评** 后 **旅客+向导** **`POST …/confirm-rating`**→**`GET …/orders/:id`** **`sub_status=rating_confirmed`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_esc_005d_f010_bilateral_confirm_rating_then_order_sub_status_rating_confirmed_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_esc_005d_f010_bilateral_confirm_rating_then_order_sub_status_rating_confirmed_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (app, tourist_email, guide_email, order_id, token_t, token_g) =
        run_b_esc_002_completed_with_app(&pool, app).await;

    let reviews_uri = format!("/api/v1/orders/{order_id}/reviews");

    let rv_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&reviews_uri)
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({"score": 5, "comment": "matrix_93_b_esc_005d_t"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        rv_t.status(),
        StatusCode::OK,
        "{:?}",
        response_json(rv_t).await
    );

    let rv_g = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&reviews_uri)
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::from(
                    json!({"score": 5, "comment": "matrix_93_b_esc_005d_g"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        rv_g.status(),
        StatusCode::OK,
        "{:?}",
        response_json(rv_g).await
    );

    let cr_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/confirm-rating"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        cr_t.status(),
        StatusCode::OK,
        "{:?}",
        response_json(cr_t).await
    );

    let cr_g = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/confirm-rating"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        cr_g.status(),
        StatusCode::OK,
        "{:?}",
        response_json(cr_g).await
    );

    let get = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        get.status(),
        StatusCode::OK,
        "{:?}",
        response_json(get).await
    );
    let gj = response_json(get).await;
    assert_eq!(gj["order"]["status"], "completed");
    assert_eq!(gj["order"]["sub_status"], "rating_confirmed");
    assert_eq!(gj["order"]["rating_tourist_confirmed"], true);
    assert_eq!(gj["order"]["rating_guide_confirmed"], true);

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-TRN-003** → **§8.2 · F-025**：**`POST …/dispute`→`GET …/orders/:id`** **`order.status=disputed`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (app, tourist_email, guide_email, order_id, token_t, _token_g) =
        run_b_esc_001_mock_pay_flow_with_app(&pool, app).await;

    let open = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/dispute"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({ "reason": "matrix_93_b_trn_003b" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        open.status(),
        StatusCode::OK,
        "{:?}",
        response_json(open).await
    );

    let get = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        get.status(),
        StatusCode::OK,
        "{:?}",
        response_json(get).await
    );
    let gj = response_json(get).await;
    assert_eq!(gj["order"]["status"], "disputed");

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-ESC-004** → **§8.2 · F-029**：**`mock-pay` 后** **`GET …/chain-sync-status`** **`200`** **`chain_sync`** **机读键**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (app, tourist_email, guide_email, order_id, token_t, _token_g) =
        run_b_esc_001_mock_pay_flow_with_app(&pool, app).await;

    let sync_path = orders::CHAIN_SYNC_ROUTE_PATH.replace(":id", &order_id);
    let sync = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&sync_path)
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        sync.status(),
        StatusCode::OK,
        "{:?}",
        response_json(sync).await
    );
    let sj = response_json(sync).await;
    assert_eq!(sj["status"], CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS);
    assert_eq!(sj["order_id"], order_id);
    let cs = &sj["chain_sync"];
    assert!(
        cs["status"].is_string(),
        "chain_sync.status present: {sj:?}"
    );
    assert_eq!(cs["last_event"]["state"], "escrowed");

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · D-ITN-001** → **§8.2 · F-012**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (tourist_email, unused_guide_email) = run_d_itn_001_draft_only_with_app(&pool, app).await;
    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}

/// **93 · D-ITN-001** → **§8.2 · F-012**：**`POST …/itineraries`→`GET /api/v1/orders/:id`** **`order.itinerary.destination`** **与** **`POST` 体** **一致**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_itn_001c_f012_post_itineraries_get_order_detail_destination_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_001c_f012_post_itineraries_get_order_detail_destination_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (tourist_email, unused_guide_email, order_id, token_t) =
        run_d_itn_001_draft_bundle_with_app(&pool, app.clone()).await;

    let get = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        get.status(),
        StatusCode::OK,
        "{:?}",
        response_json(get).await
    );
    let gj = response_json(get).await;
    assert_eq!(gj["order"]["status"], "draft");
    assert_eq!(
        gj["order"]["itinerary"]["destination"]
            .as_str()
            .expect("destination"),
        "中国"
    );

    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}

/// **93 · D-ITN-001 / B-ORD-004** → **§8.2 · F-012**：**`POST …/itineraries`** **draft** → **`PATCH …/orders/:id/itinerary`** → **`GET …/orders/:id`** **`daily_itinerary[0].content_text`** **读回**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg()
{
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (tourist_email, unused_guide_email, order_id, token_t) =
        run_d_itn_001_draft_bundle_with_app(&pool, app.clone()).await;

    let patch = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/api/v1/orders/{order_id}/itinerary"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({
                        "daily_itinerary": [{
                            "day_index": 1,
                            "city": "北京",
                            "content_text": "matrix_93_d_itn_001d_patch_ok"
                        }]
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        patch.status(),
        StatusCode::OK,
        "{:?}",
        response_json(patch).await
    );
    let pj = response_json(patch).await;
    assert_eq!(pj["status"], "ok");

    let get = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        get.status(),
        StatusCode::OK,
        "{:?}",
        response_json(get).await
    );
    let gj = response_json(get).await;
    let daily = gj["order"]["itinerary"]["daily_itinerary"]
        .as_array()
        .expect("daily_itinerary");
    assert_eq!(
        daily[0]["content_text"].as_str().expect("content_text"),
        "matrix_93_d_itn_001d_patch_ok"
    );

    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}

/// **93 · B-ORD-005** → **§8.2 · F-013**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (tourist_email, unused_guide_email) =
        run_b_ord_005_itin_then_confirm_final_with_app(&pool, app).await;
    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}
