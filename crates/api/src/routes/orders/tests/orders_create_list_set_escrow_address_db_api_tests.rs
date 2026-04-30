//! **F-008 / F-009 / F-011 · API·IT（PostgreSQL + `Router::oneshot`）**：注册 → 向导建档 → **stake 置 `active`** → **`POST /api/v1/orders`**（`orders`+`itineraries` 同事务）→ **`GET /api/v1/orders`** / **`GET /api/v1/orders/:id`** → **`PATCH …/itinerary`**（**未 Escrowed**）→ **`POST …/set-escrow-address`**。
//!
//! **93 §2（B 域）**：**`matrix_93_b_ord_001_*`** ↔ **B-ORD-001**/**F-008**；**`matrix_93_b_ord_001b_*`** ↔ **B-ORD-001**/**F-008**（**`router::app`**；**v1.4.250**）；**`matrix_93_b_ord_001c_*`** ↔ **B-ORD-001**/**F-008**（**`GET …/orders/:id`** **`created`**；**`router::app`**；**v1.4.252**）；**`matrix_93_b_ord_004b_f008_*`** ↔ **B-ORD-004**/**F-008**（**`PATCH …/itinerary`→`GET …/orders/:id`** **`daily_itinerary` 读回**；**`router::app`**；**v1.4.285**）；**`matrix_93_b_trn_001_*`** ↔ **B-TRN-001**/**F-008**；**`matrix_93_b_trn_001b_*`** ↔ **B-TRN-001**/**F-008**（**`router::app`**；**v1.4.251**）；**`matrix_93_b_ord_002_*`** ↔ **B-ORD-002**/**F-009**；**`matrix_93_b_ord_002b_*`** ↔ **B-ORD-002**/**F-009**（**`router::app`**；**v1.4.251**）；**`matrix_93_b_trn_002_f009_*`** ↔ **B-TRN-002**/**F-009**（**AUTO-P0**）；**`matrix_93_b_trn_002b_f009_*`** ↔ **B-TRN-002**/**F-009**（**`router::app`**；**v1.4.252**）；**`matrix_93_b_ord_003_*`** ↔ **B-ORD-003**/**F-009**；**`matrix_93_b_ord_003b_*`** ↔ **B-ORD-003**/**F-009**（**`router::app`**；**v1.4.251**）；**`matrix_93_b_mkt_001b_f009_*`** ↔ **B-MKT-001**/**F-009**（**`GET /api/v1/discover/orders`** **`router::app`** + **`POST /itineraries`** **draft** 入列；**v1.4.261**）；**`matrix_93_b_mkt_001c_f009_*`** ↔ **B-MKT-001**/**F-009**（**`GET …/discover/orders?country=&city=`** **`router::app`**；**v1.4.265**）；**`matrix_93_b_mkt_001d_f009_*`** ↔ **B-MKT-001**/**B-MKT-002**/**F-009**（**`GET …/discover/orders?country=&city=&limit=`** **`page.limit`**；**v1.4.267**）；**`matrix_93_b_mkt_001e_f009_*`** ↔ **B-MKT-002**/**F-009**（**`GET …/discover/orders?limit=`** **无** **country/city** **`page.limit`**；**v1.4.269**）；**`matrix_93_b_mkt_002b_f009_*`** ↔ **B-MKT-002**/**F-009**（**`GET …/discover/orders?city=&limit=`** **`router::app`**；**v1.4.262**）；**`matrix_93_b_mkt_002c_f009_*`** ↔ **B-MKT-002**/**F-009**（**`cursor` 第二页** **`router::app`**；**v1.4.263**）；**`matrix_93_b_mkt_003b_f009_*`** ↔ **B-MKT-003**/**F-009**（**`GET …/discover/orders` 空列表** **`200`** **`router::app`**；**v1.4.263**）；**`matrix_93_b_ord_006_*`** ↔ **B-ORD-006**/**F-011**（**MANUAL-P1**；**`merge(auth|guides|me|orders)`**）；**`matrix_93_b_ord_006b_*`** ↔ **B-ORD-006**/**F-011**（**`router::app`**；**v1.4.252**；**95 · ISS-007** 回填 **§8.2·93**，见 **`spec/93-全站功能验证矩阵-域别回归清单.md`** §2.3）。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（与 **`auth_register_login_logout_db_api_tests`** 同源）；须指向**已迁移**库。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::collections::HashSet;
use std::sync::{Arc, OnceLock};
use tokio::sync::{Mutex as TokioMutex, RwLock};
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::routes::{auth, guides, me, orders};
use crate::state::test_support::api_meta_state;

static ORDERS_APP_STACK_DB_IT_LOCK: OnceLock<TokioMutex<()>> = OnceLock::new();

fn orders_app_stack_it_lock() -> &'static TokioMutex<()> {
    ORDERS_APP_STACK_DB_IT_LOCK.get_or_init(|| TokioMutex::new(()))
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
        .with_state(api_meta_state(Some(chain_off)))
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

/// Percent-encode a UTF-8 string for a single `application/x-www-form-urlencoded` query value.
fn utf8_pct_encode_query_component(s: &str) -> String {
    let mut out = String::new();
    for b in s.as_bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(*b as char)
            }
            _ => out.push_str(&format!("%{:02X}", b)),
        }
    }
    out
}

async fn cleanup_order_participants(pool: &PgPool, tourist_email: &str, guide_email: &str) {
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

/// 已注册旅客/向导、向导卡 **`active`**（**stake** 后）— 供 **`matrix_93_b_ord_*`** / **`matrix_93_b_trn_001_*`** 各自 **`POST /orders`** 起测。
struct GuideStakedOrdersCtx {
    app: Router,
    pool: PgPool,
    token_tourist: String,
    token_guide: String,
    guide_row_id: String,
    tourist_email: String,
    guide_email: String,
}

async fn guide_staked_orders_ctx_from_app(
    app: Router,
    pool: PgPool,
    tourist_email: String,
    guide_email: String,
) -> GuideStakedOrdersCtx {
    let reg_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": tourist_email,
                        "password": "TestPass12!",
                        "nickname": "tourist_m93"
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
    let token_tourist = response_json(reg_t)
        .await
        .get("token")
        .and_then(|t| t.as_str())
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
                        "email": guide_email,
                        "password": "TestPass12!",
                        "nickname": "guide_m93"
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
    let token_g = response_json(reg_g)
        .await
        .get("token")
        .and_then(|t| t.as_str())
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
    assert_eq!(gc.status(), StatusCode::OK, "{:?}", response_json(gc).await);
    let guide_row_id = response_json(gc).await["guide"]["id"]
        .as_str()
        .expect("guide id")
        .to_string();

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

    GuideStakedOrdersCtx {
        app,
        pool,
        token_tourist,
        token_guide: token_g,
        guide_row_id,
        tourist_email,
        guide_email,
    }
}

async fn guide_staked_orders_ctx_or_skip() -> Option<GuideStakedOrdersCtx> {
    let pool = pool_or_skip().await?;
    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-ord-{suffix}-t@traveltrust.test");
    let guide_email = format!("93-b-ord-{suffix}-g@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;

    let app = db_router(pool.clone());
    Some(guide_staked_orders_ctx_from_app(app, pool, tourist_email, guide_email).await)
}

async fn guide_staked_orders_ctx_app_stack_or_skip() -> Option<GuideStakedOrdersCtx> {
    let pool = pool_or_skip().await?;
    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-ord-{suffix}-t@traveltrust.test");
    let guide_email = format!("93-b-ord-{suffix}-g@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;

    let _lock = orders_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    Some(guide_staked_orders_ctx_from_app(app, pool, tourist_email, guide_email).await)
}

#[tokio::test]
async fn post_orders_get_list_get_detail_set_escrow_address_happy_path_db_api() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: post_orders_get_list_get_detail_set_escrow_address_happy_path_db_api (DATABASE_URL unset)"
        );
        return;
    };

    let suffix = Uuid::new_v4();
    let tourist_email = format!("orders-db-it-t-{suffix}@traveltrust.test");
    let guide_email = format!("orders-db-it-g-{suffix}@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;

    let app = db_router(pool.clone());

    let reg_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": tourist_email,
                        "password": "TestPass12!",
                        "nickname": "tourist_it"
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
    let reg_t_j = response_json(reg_t).await;
    let token_t = reg_t_j
        .get("token")
        .and_then(|t| t.as_str())
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
                        "email": guide_email,
                        "password": "TestPass12!",
                        "nickname": "guide_it"
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
    let reg_g_j = response_json(reg_g).await;
    let token_g = reg_g_j
        .get("token")
        .and_then(|t| t.as_str())
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
    assert_eq!(gc.status(), StatusCode::OK, "{:?}", response_json(gc).await);
    let gc_j = response_json(gc).await;
    let guide_row_id = gc_j["guide"]["id"].as_str().expect("guide id");

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
    assert_eq!(create_j["status"], "ok");
    let order_id = create_j["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    assert_eq!(create_j["order"]["status"], "created");

    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/orders")
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
    let items = list_j["items"].as_array().expect("items");
    assert!(
        items.iter().any(|it| it["id"].as_str() == Some(&order_id)),
        "list should include created order"
    );

    let detail = app
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
        detail.status(),
        StatusCode::OK,
        "{:?}",
        response_json(detail).await
    );
    let detail_j = response_json(detail).await;
    assert_eq!(detail_j["order"]["id"], order_id);

    let escrow_addr = "0x1234567890123456789012345678901234567890";
    let set_esc = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/set-escrow-address"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({ "escrow_address": escrow_addr }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        set_esc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(set_esc).await
    );
    let set_j = response_json(set_esc).await;
    assert_eq!(set_j["status"], "ok");
    assert_eq!(set_j["escrow_address"], escrow_addr);

    let detail2 = app
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
        detail2.status(),
        StatusCode::OK,
        "{:?}",
        response_json(detail2).await
    );
    let detail2_j = response_json(detail2).await;
    assert_eq!(detail2_j["order"]["escrow_address"], escrow_addr);

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-ORD-001** → **§8.2 · F-008**：**`POST /api/v1/orders`** **200**；**`orders`** 行存在。
#[tokio::test]
async fn matrix_93_b_ord_001_post_orders_ok_persisted_pg_row() {
    let Some(cx) = guide_staked_orders_ctx_or_skip().await else {
        eprintln!("skip: matrix_93_b_ord_001_post_orders_ok_persisted_pg_row (DATABASE_URL unset)");
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
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
    assert_eq!(create_j["status"], "ok");
    let order_id = create_j["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    let oid = uuid::Uuid::parse_str(&order_id).expect("order id uuid");

    let cnt: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM orders WHERE id = $1")
        .bind(oid)
        .fetch_one(&cx.pool)
        .await
        .unwrap();
    assert_eq!(cnt, 1, "B-ORD-001 expects orders row");

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-001** → **§8.2 · F-008**：**`POST /api/v1/orders`** **200**；**`orders`** 行存在（**`router::app`** **主栈**）。
#[tokio::test]
async fn matrix_93_b_ord_001b_f008_post_orders_ok_persisted_pg_row_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_001b_f008_post_orders_ok_persisted_pg_row_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
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
    assert_eq!(create_j["status"], "ok");
    let order_id = create_j["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    let oid = uuid::Uuid::parse_str(&order_id).expect("order id uuid");

    let cnt: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM orders WHERE id = $1")
        .bind(oid)
        .fetch_one(&cx.pool)
        .await
        .unwrap();
    assert_eq!(cnt, 1, "B-ORD-001 app_stack expects orders row");

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-001** → **§8.2 · F-008**：**`POST /api/v1/orders`** 后 **`GET /api/v1/orders/:id`** **`200`**；**`order.status`**=`created`（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_001c_f008_post_order_get_detail_created_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_001c_f008_post_order_get_detail_created_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
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
    let order_id = response_json(create).await["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();

    let detail = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
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
    let dj = response_json(detail).await;
    assert_eq!(dj["order"]["id"], order_id);
    assert_eq!(dj["order"]["status"], "created");

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-004** → **§8.2 · F-008**：**`PATCH /api/v1/orders/:id/itinerary`**（**旅客 Bearer**）**200**；**`GET …/orders/:id`** **`itinerary.daily_itinerary[0].content_text`** **读回**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
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
    let order_id = response_json(create).await["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();

    let patch = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/api/v1/orders/{order_id}/itinerary"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "daily_itinerary": [{
                            "day_index": 1,
                            "city": "上海",
                            "content_text": "matrix_93_b_ord_004b_patch_ok"
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
    assert_eq!(pj["version"], 2);

    let detail = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
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
    let dj = response_json(detail).await;
    let daily = dj["order"]["itinerary"]["daily_itinerary"]
        .as_array()
        .expect("daily_itinerary");
    assert_eq!(
        daily[0]["content_text"].as_str().expect("content_text"),
        "matrix_93_b_ord_004b_patch_ok"
    );

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-TRN-001** → **§8.2 · F-008**：**`POST /api/v1/orders/:id/accept`**（**向导 Bearer**）**200**；**`order.status`**=`accepted`。
#[tokio::test]
async fn matrix_93_b_trn_001_f008_post_order_accept_sets_status_accepted_pg() {
    let Some(cx) = guide_staked_orders_ctx_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_trn_001_f008_post_order_accept_sets_status_accepted_pg (DATABASE_URL unset)"
        );
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
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
    let order_id = response_json(create).await["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();

    let accept = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/accept"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_guide))
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
    let aj = response_json(accept).await;
    assert_eq!(aj["order"]["status"], "accepted");
    assert_eq!(aj["order"]["id"], order_id);

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-TRN-001** → **§8.2 · F-008**：**`POST /api/v1/orders/:id/accept`**（**向导 Bearer**）**200**；**`order.status`**=`accepted`（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_trn_001b_f008_post_order_accept_sets_status_accepted_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_trn_001b_f008_post_order_accept_sets_status_accepted_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
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
    let order_id = response_json(create).await["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();

    let accept = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/accept"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_guide))
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
    let aj = response_json(accept).await;
    assert_eq!(aj["order"]["status"], "accepted");
    assert_eq!(aj["order"]["id"], order_id);

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-002** → **§8.2 · F-009**：**`GET /api/v1/orders`** **200**；**`items[]`** 含刚创建订单 **`id`**。
#[tokio::test]
async fn matrix_93_b_ord_002_f009_get_orders_list_contains_created_order_pg() {
    let Some(cx) = guide_staked_orders_ctx_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_002_f009_get_orders_list_contains_created_order_pg (DATABASE_URL unset)"
        );
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
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
    let order_id = response_json(create).await["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();

    let list = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/orders")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
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
    let items = list_j["items"].as_array().expect("items");
    assert!(
        items
            .iter()
            .any(|it| it["id"].as_str() == Some(order_id.as_str())),
        "B-ORD-002: list should include created order id"
    );

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-002** → **§8.2 · F-009**：**`GET /api/v1/orders`** **200**；**`items[]`** 含刚创建订单 **`id`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_002b_f009_get_orders_list_contains_created_order_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_002b_f009_get_orders_list_contains_created_order_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
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
    let order_id = response_json(create).await["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();

    let list = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/orders")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
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
    let items = list_j["items"].as_array().expect("items");
    assert!(
        items
            .iter()
            .any(|it| it["id"].as_str() == Some(order_id.as_str())),
        "B-ORD-002 app_stack: list should include created order id"
    );

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-TRN-002** → **§8.2 · F-009**：**`POST /api/v1/orders/:id/cancel`**（**旅客 Bearer**）**200**；**`order.status`**=`cancelled`；**`orders.status`** PG 读回。
#[tokio::test]
async fn matrix_93_b_trn_002_f009_post_order_cancel_created_sets_cancelled_pg() {
    let Some(cx) = guide_staked_orders_ctx_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_trn_002_f009_post_order_cancel_created_sets_cancelled_pg (DATABASE_URL unset)"
        );
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
                        "amount": "100",
                        "currency": "USD"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    let create_status = create.status();
    let create_j = response_json(create).await;
    assert_eq!(create_status, StatusCode::OK, "{:?}", create_j);
    let order_id = create_j["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    let oid = Uuid::parse_str(&order_id).expect("order id uuid");

    let cancel = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/cancel"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let cancel_status = cancel.status();
    let cj = response_json(cancel).await;
    assert_eq!(cancel_status, StatusCode::OK, "{:?}", cj);
    assert_eq!(cj["order"]["status"], "cancelled");
    assert_eq!(cj["order"]["id"], order_id);

    let st: String = sqlx::query_scalar("SELECT status FROM orders WHERE id = $1")
        .bind(oid)
        .fetch_one(&cx.pool)
        .await
        .unwrap();
    assert_eq!(st, "cancelled");

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-TRN-002** → **§8.2 · F-009**：**`POST /api/v1/orders/:id/cancel`**（**旅客 Bearer**）**200**；**`order.status`**=`cancelled`；**`orders.status`** PG 读回（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_trn_002b_f009_post_order_cancel_created_sets_cancelled_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_trn_002b_f009_post_order_cancel_created_sets_cancelled_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
                        "amount": "100",
                        "currency": "USD"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    let create_status = create.status();
    let create_j = response_json(create).await;
    assert_eq!(create_status, StatusCode::OK, "{:?}", create_j);
    let order_id = create_j["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    let oid = Uuid::parse_str(&order_id).expect("order id uuid");

    let cancel = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/cancel"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let cancel_status = cancel.status();
    let cj = response_json(cancel).await;
    assert_eq!(cancel_status, StatusCode::OK, "{:?}", cj);
    assert_eq!(cj["order"]["status"], "cancelled");
    assert_eq!(cj["order"]["id"], order_id);

    let st: String = sqlx::query_scalar("SELECT status FROM orders WHERE id = $1")
        .bind(oid)
        .fetch_one(&cx.pool)
        .await
        .unwrap();
    assert_eq!(st, "cancelled");

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-003** → **§8.2 · F-009**：**`GET /api/v1/orders/:id`** **200**；**`order.id` / `order.status`** 与 **`orders`** 行 **`status`** PG 读回一致（**`created`**）。
#[tokio::test]
async fn matrix_93_b_ord_003_f009_get_order_detail_status_matches_orders_pg() {
    let Some(cx) = guide_staked_orders_ctx_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_003_f009_get_order_detail_status_matches_orders_pg (DATABASE_URL unset)"
        );
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
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
    let order_id = response_json(create).await["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    let oid = Uuid::parse_str(&order_id).expect("order id uuid");

    let detail = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
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
    let dj = response_json(detail).await;
    assert_eq!(dj["order"]["id"], order_id);
    assert_eq!(dj["order"]["status"], "created");

    let st: String = sqlx::query_scalar("SELECT status FROM orders WHERE id = $1")
        .bind(oid)
        .fetch_one(&cx.pool)
        .await
        .unwrap();
    assert_eq!(st, "created");

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-003** → **§8.2 · F-009**：**`GET /api/v1/orders/:id`** **200**；**`order.status`** 与 **`orders.status`** PG 一致（**`created`**；**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_003b_f009_get_order_detail_status_matches_orders_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_003b_f009_get_order_detail_status_matches_orders_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
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
    let order_id = response_json(create).await["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    let oid = Uuid::parse_str(&order_id).expect("order id uuid");

    let detail = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
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
    let dj = response_json(detail).await;
    assert_eq!(dj["order"]["id"], order_id);
    assert_eq!(dj["order"]["status"], "created");

    let st: String = sqlx::query_scalar("SELECT status FROM orders WHERE id = $1")
        .bind(oid)
        .fetch_one(&cx.pool)
        .await
        .unwrap();
    assert_eq!(st, "created");

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-MKT-001** → **§8.2 · F-009**：**`POST /api/v1/itineraries`** **draft** 后 **`GET /api/v1/discover/orders`** **`{ status, items }`** 主栈（**`items`** 含该 **`order_id`**）。
#[tokio::test]
async fn matrix_93_b_mkt_001b_f009_get_discover_orders_ok_shape_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_001b_f009_get_discover_orders_ok_shape_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-mkt-001b-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-001b-{suffix}-g@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;

    let app = app_stack_router(pool.clone());

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
                        "nickname": "tourist_mkt001b"
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
    assert_eq!(itin_j["order_status"], "draft");
    let order_id = itin_j["order_id"].as_str().expect("order_id").to_string();

    let disc = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/discover/orders")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        disc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(disc).await
    );
    let dj = response_json(disc).await;
    assert_eq!(dj.get("status"), Some(&json!("ok")));
    let items = dj["items"].as_array().expect("discover items");
    assert!(
        items.iter().any(|c| {
            c["order_id"].as_str() == Some(order_id.as_str())
                || c["id"].as_str() == Some(order_id.as_str())
        }),
        "discover should list draft order_id={order_id}: {dj:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}

/// **93 · B-MKT-001** → **§8.2 · F-009**：**`GET /api/v1/discover/orders?country=…&city=…`** **UTF-8 百分号编码** **筛选** **`itineraries`** **`destination`/`city`**（**`router::app`**；与 **`matrix_93_b_mkt_001b_f009_*`** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_001c_f009_get_discover_orders_country_city_query_filters_draft_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_001c_f009_get_discover_orders_country_city_query_filters_draft_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-mkt-001c-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-001c-{suffix}-g@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;

    let app = app_stack_router(pool.clone());

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
                        "nickname": "tourist_mkt001c"
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
    assert_eq!(itin_j["order_status"], "draft");
    let order_id = itin_j["order_id"].as_str().expect("order_id").to_string();

    let country_q = utf8_pct_encode_query_component("中国");
    let city_q = utf8_pct_encode_query_component("北京");
    let uri = format!("/api/v1/discover/orders?country={country_q}&city={city_q}");

    let disc = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        disc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(disc).await
    );
    let dj = response_json(disc).await;
    assert_eq!(dj.get("status"), Some(&json!("ok")));
    let items = dj["items"].as_array().expect("discover items");
    assert!(
        items.iter().any(|c| {
            c["order_id"].as_str() == Some(order_id.as_str())
                || c["id"].as_str() == Some(order_id.as_str())
        }),
        "discover country+city filter should list draft order_id={order_id}: {dj:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}

/// **93 · B-MKT-001 / B-MKT-002** → **§8.2 · F-009**：**`GET /api/v1/discover/orders?country=…&city=…&limit=…`** **`page.limit`** **且** **`items`** **含** **`order_id`**（**`router::app`**；**`country`+`city`+`limit`** **组合**；与 **`matrix_93_b_mkt_001c_*`**/**`matrix_93_b_mkt_002b_*`** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_001d_f009_get_discover_orders_country_city_limit_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_001d_f009_get_discover_orders_country_city_limit_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-mkt-001d-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-001d-{suffix}-g@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;

    let app = app_stack_router(pool.clone());

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
                        "nickname": "tourist_mkt001d"
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
    assert_eq!(itin_j["order_status"], "draft");
    let order_id = itin_j["order_id"].as_str().expect("order_id").to_string();

    let country_q = utf8_pct_encode_query_component("中国");
    let city_q = utf8_pct_encode_query_component("北京");
    let uri = format!("/api/v1/discover/orders?country={country_q}&city={city_q}&limit=5");

    let disc = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        disc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(disc).await
    );
    let dj = response_json(disc).await;
    assert_eq!(dj.get("status"), Some(&json!("ok")));
    assert_eq!(dj["page"]["limit"], 5);
    let items = dj["items"].as_array().expect("discover items");
    assert!(
        items.iter().any(|c| {
            c["order_id"].as_str() == Some(order_id.as_str())
                || c["id"].as_str() == Some(order_id.as_str())
        }),
        "discover country+city+limit should list draft order_id={order_id}: {dj:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}

/// **93 · B-MKT-002** → **§8.2 · F-009**：**`GET /api/v1/discover/orders?limit=…`** **`page.limit`** **且** **`items`** **含** **`order_id`**（**`router::app`**；**不传** **country/city**；与 **`matrix_93_b_mkt_002b_*`** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-mkt-001e-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-001e-{suffix}-g@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;

    let app = app_stack_router(pool.clone());

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
                        "nickname": "tourist_mkt001e"
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
                        "city": "厦门",
                        "travel_date": "2025-08-01",
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
    assert_eq!(itin_j["order_status"], "draft");
    let order_id = itin_j["order_id"].as_str().expect("order_id").to_string();

    let uri = "/api/v1/discover/orders?limit=20";
    let disc = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        disc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(disc).await
    );
    let dj = response_json(disc).await;
    assert_eq!(dj.get("status"), Some(&json!("ok")));
    assert_eq!(dj["page"]["limit"], 20);
    let items = dj["items"].as_array().expect("discover items");
    assert!(
        items.iter().any(|c| {
            c["order_id"].as_str() == Some(order_id.as_str())
                || c["id"].as_str() == Some(order_id.as_str())
        }),
        "discover limit-only should list draft order_id={order_id}: {dj:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}

/// **93 · B-MKT-002** → **§8.2 · F-009**：**`GET /api/v1/discover/orders?city=…&limit=1`** **`page.limit`** + **`items`**（**`router::app`**；**预设 `city`** + **串行锁**；**列表按更新时间倒序** 下本测草稿应落在 **limit=1** 的首条）。
#[tokio::test]
async fn matrix_93_b_mkt_002b_f009_get_discover_orders_limit_ok_shape_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_002b_f009_get_discover_orders_limit_ok_shape_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let city_preset = "北京";
    let tourist_email = format!("93-b-mkt-002b-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-002b-{suffix}-g@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;

    let app = app_stack_router(pool.clone());

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
                        "nickname": "tourist_mkt002b"
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
                        "city": city_preset,
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
    let order_id = itin_j["order_id"].as_str().expect("order_id").to_string();

    let city_q = utf8_pct_encode_query_component(city_preset);
    let q = format!("/api/v1/discover/orders?city={city_q}&limit=1");
    let disc = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&q)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        disc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(disc).await
    );
    let dj = response_json(disc).await;
    assert_eq!(dj.get("status"), Some(&json!("ok")));
    let page = dj["page"].as_object().expect("page object");
    assert_eq!(page.get("limit"), Some(&json!(1)));
    let items = dj["items"].as_array().expect("items");
    assert_eq!(items.len(), 1, "{dj:?}");
    assert!(
        items[0]["order_id"].as_str() == Some(order_id.as_str())
            || items[0]["id"].as_str() == Some(order_id.as_str()),
        "{dj:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}

async fn post_itinerary_draft_ok(
    app: Router,
    token: &str,
    city: &str,
    travel_date: &str,
) -> String {
    let itin = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/itineraries")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(token))
                .body(Body::from(
                    json!({
                        "destination": "中国",
                        "city": city,
                        "travel_date": travel_date,
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
    let j = response_json(itin).await;
    assert_eq!(j["status"], "ok");
    j["order_id"].as_str().expect("order_id").to_string()
}

/// **93 · B-MKT-002** → **§8.2 · F-009**：**`GET /api/v1/discover/orders?city=…&limit=1&cursor=`** 第二页 **`items[0].order_id`** ≠ 首页（**`router::app`**；**双草稿** **`厦门`**；**`orders_app_stack_it_lock`**）。
#[tokio::test]
async fn matrix_93_b_mkt_002c_f009_discover_orders_cursor_second_page_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_002c_f009_discover_orders_cursor_second_page_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let city_preset = "厦门";
    let tourist_email = format!("93-b-mkt-002c-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-002c-{suffix}-g@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;

    let app = app_stack_router(pool.clone());

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
                        "nickname": "tourist_mkt002c"
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

    let order_a = post_itinerary_draft_ok(app.clone(), &token_t, city_preset, "2025-07-10").await;
    let order_b = post_itinerary_draft_ok(app.clone(), &token_t, city_preset, "2025-07-11").await;
    let mut ours = HashSet::new();
    ours.insert(order_a.clone());
    ours.insert(order_b.clone());

    let city_q = utf8_pct_encode_query_component(city_preset);
    let q_wide = format!("/api/v1/discover/orders?city={city_q}&limit=30");
    let disc_wide = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&q_wide)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(disc_wide.status(), StatusCode::OK);
    let wide_j = response_json(disc_wide).await;
    assert_eq!(wide_j.get("status"), Some(&json!("ok")));
    let wide_items = wide_j["items"].as_array().expect("items");
    let mut found = HashSet::new();
    for c in wide_items {
        let oid = c["order_id"]
            .as_str()
            .or_else(|| c["id"].as_str())
            .unwrap_or("");
        if ours.contains(oid) {
            found.insert(oid.to_string());
        }
    }
    assert_eq!(
        found.len(),
        2,
        "discover should list both draft order_ids for {city_preset}: {wide_j:?}"
    );

    let q1 = format!("/api/v1/discover/orders?city={city_q}&limit=1");
    let disc1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&q1)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(disc1.status(), StatusCode::OK);
    let p1 = response_json(disc1).await;
    let page1 = p1["page"].as_object().expect("page");
    assert_eq!(page1.get("limit"), Some(&json!(1)));
    assert_eq!(
        page1.get("has_more"),
        Some(&json!(true)),
        "need >=2 discover cards for {city_preset}: {p1:?}"
    );
    let items1 = p1["items"].as_array().expect("items");
    assert_eq!(items1.len(), 1);
    let first_id = items1[0]["order_id"]
        .as_str()
        .or_else(|| items1[0]["id"].as_str())
        .expect("order_id");
    let next_c = page1["next_cursor"].as_str().expect("next_cursor");

    let q2 = format!("/api/v1/discover/orders?city={city_q}&limit=1&cursor={next_c}");
    let disc2 = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&q2)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(disc2.status(), StatusCode::OK);
    let p2 = response_json(disc2).await;
    let items2 = p2["items"].as_array().expect("items p2");
    assert_eq!(items2.len(), 1, "{p2:?}");
    let second_id = items2[0]["order_id"]
        .as_str()
        .or_else(|| items2[0]["id"].as_str())
        .expect("order_id p2");
    assert_ne!(first_id, second_id, "{p1:?} {p2:?}");
    assert!(
        found.contains(first_id) && found.contains(second_id),
        "cursor walk should stay within discover cards for this tourist's drafts: first={first_id} second={second_id} found={found:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}

/// **93 · B-MKT-003** → **§8.2 · F-009**：**`GET /api/v1/discover/orders?city=…`** **无匹配草稿** 时 **`items`** 空数组且 **200**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_mkt_003b_f009_get_discover_orders_filter_city_empty_items_200_app_stack_ok_pg()
{
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_003b_f009_get_discover_orders_filter_city_empty_items_200_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-mkt-003b-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-003b-{suffix}-g@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;

    let app = app_stack_router(pool.clone());

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
                        "nickname": "tourist_mkt003b"
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

    let _beijing_oid = post_itinerary_draft_ok(app.clone(), &token_t, "北京", "2025-09-01").await;

    let city_q = utf8_pct_encode_query_component("广州");
    let q = format!("/api/v1/discover/orders?city={city_q}&limit=20");
    let disc = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&q)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        disc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(disc).await
    );
    let dj = response_json(disc).await;
    assert_eq!(dj.get("status"), Some(&json!("ok")));
    let items = dj["items"].as_array().expect("items");
    assert!(
        items.is_empty(),
        "expected no Beijing draft under Guangzhou filter: {dj:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}

/// **93 · B-ORD-006** → **§8.2 · F-011**：**`POST …/set-escrow-address`** **200**；**`GET …/orders/:id`** 再读 **`escrow_address`** 一致（**MANUAL-P1** 用例的 **PG·oneshot** 回填）。
#[tokio::test]
async fn matrix_93_b_ord_006_set_escrow_address_get_detail_reflects() {
    let Some(cx) = guide_staked_orders_ctx_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_006_set_escrow_address_get_detail_reflects (DATABASE_URL unset)"
        );
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
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
    let order_id = response_json(create).await["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();

    let escrow_addr = "0x1234567890123456789012345678901234567890";
    let set_esc = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/set-escrow-address"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({ "escrow_address": escrow_addr }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        set_esc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(set_esc).await
    );
    let sj = response_json(set_esc).await;
    assert_eq!(sj["status"], "ok");
    assert_eq!(sj["escrow_address"], escrow_addr);

    let detail2 = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        detail2.status(),
        StatusCode::OK,
        "{:?}",
        response_json(detail2).await
    );
    let d2j = response_json(detail2).await;
    assert_eq!(
        d2j["order"]["escrow_address"].as_str(),
        Some(escrow_addr),
        "{:?}",
        d2j
    );

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-006** → **§8.2 · F-011**：**`POST …/set-escrow-address`** **200**；**`GET …/orders/:id`** 再读 **`escrow_address`** 一致（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
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
    let order_id = response_json(create).await["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();

    let escrow_addr = "0x1234567890123456789012345678901234567890";
    let set_esc = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/set-escrow-address"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({ "escrow_address": escrow_addr }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        set_esc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(set_esc).await
    );
    let sj = response_json(set_esc).await;
    assert_eq!(sj["status"], "ok");
    assert_eq!(sj["escrow_address"], escrow_addr);

    let detail2 = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        detail2.status(),
        StatusCode::OK,
        "{:?}",
        response_json(detail2).await
    );
    let d2j = response_json(detail2).await;
    assert_eq!(
        d2j["order"]["escrow_address"].as_str(),
        Some(escrow_addr),
        "{:?}",
        d2j
    );

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}
