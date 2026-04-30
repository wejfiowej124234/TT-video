//! **F-001～F-006 · API·IT（PostgreSQL）**：**F-001～003** 注册/登录/登出 **`sessions`** 与 **`GET /me`**；**F-004～006** 见 **`matrix_93_a_me_*` / `matrix_93_a_pwd_*`**（**93 §1**）。
//!
//! **93 §1（A 域）**：**`matrix_93_a_reg_001_*`** ↔ **A-REG-001**/**F-001**；**`matrix_93_a_reg_001b_*`** ↔ **A-REG-001**/**F-001**（**`router::app`**；**v1.4.249**）；**`matrix_93_a_reg_002_*`** ↔ **A-REG-002**/**F-001**；**`matrix_93_a_reg_002b_*`** ↔ **A-REG-002**/**F-001**（**`router::app`**；**v1.4.248**）；**`matrix_93_a_log_001_*`** ↔ **A-LOG-001**/**F-002**；**`matrix_93_a_log_001b_*`** ↔ **A-LOG-001**/**F-002**（**`router::app`**；**v1.4.250**）；**`matrix_93_a_log_002b_f002_*`** ↔ **A-LOG-002**/**F-002**（**连续** **`GET /api/v1/me`** **`router::app`**；**v1.4.262**）；**`matrix_93_a_log_003_*`** ↔ **A-LOG-003**/**F-003**；**`matrix_93_a_log_003b_*`** ↔ **A-LOG-003**/**F-003**（**`router::app`**；**v1.4.249**）；**`matrix_93_a_log_004_*`** ↔ **A-LOG-004**/**F-002**；**`matrix_93_a_log_004b_*`** ↔ **A-LOG-004**/**F-002**（**`router::app`** **主栈**；**v1.4.247**）；**`matrix_93_a_log_005_*`** ↔ **A-LOG-005**/**F-003**；**`matrix_93_a_log_005b_*`** ↔ **A-LOG-005**/**F-003**（**`router::app`**；**v1.4.248**）；**`matrix_93_a_me_001_*`** ↔ **A-ME-001**/**F-004**；**`matrix_93_a_me_001b_*`** ↔ **A-ME-001**/**F-004**（**`router::app`**；**v1.4.247**）；**`matrix_93_a_me_003b_f004_*`** ↔ **A-ME-003**/**F-004**（**`GET /api/v1/me/stats`** **`router::app`**；**v1.4.261**）；**`matrix_93_a_me_003c_f004_*`** ↔ **A-ME-003**/**F-004**（**`GET /api/v1/me/stats`** **无身份头** **`router::app`** **401** **`auth_placeholder_layer`** **`unauthorized`**；**v1.4.270**）；**`matrix_93_a_me_002_*`** ↔ **A-ME-002**/**F-005**（**AUTO-P0**）；**`matrix_93_a_me_002b_*`** ↔ **A-ME-002**/**F-005**（**`router::app`**；**v1.4.247**）；**`matrix_93_a_me_005b_f005_*`** ↔ **A-ME-002**/**F-005**（**`PUT …/me`** **`default_wallet_address`** **`router::app`**；**v1.4.262**）；**`matrix_93_a_pwd_001_*`** ↔ **A-PWD-001**/**F-006**；**`matrix_93_a_pwd_001b_*`** ↔ **A-PWD-001**/**F-006**（**`router::app`**；**v1.4.248**）；**`matrix_93_a_pwd_002_*`** ↔ **A-PWD-002**/**F-006**；**`matrix_93_a_pwd_002b_*`** ↔ **A-PWD-002**/**F-006**（**`router::app`**；**v1.4.249**；**95 · ISS-007** 窄口径：**`DATABASE_URL` + `oneshot`** 回填 **§8.2·93**，**不**升格 **全矩阵 `report.json`**）。判据见 **`spec/93-全站功能验证矩阵-域别回归清单.md`** §1 表。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（与 **`routes/community/tests_create_post_commerce_db.rs`** 同源）。已设置时由 **`it_db_pool::connect_migrated_pg_it_pool`** 连接并执行与 **`startup`** 相同的 **SQLx 迁移**（空库亦可）。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::sync::{Arc, Mutex, OnceLock};
use tokio::sync::{Mutex as TokioMutex, RwLock};
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::db;
use crate::email_transport;
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::routes::{auth, me};
use crate::session_cookie::SESSION_COOKIE_NAME_LEGACY;
use crate::state::test_support::api_meta_state;

static AUTH_APP_STACK_DB_IT_LOCK: OnceLock<TokioMutex<()>> = OnceLock::new();

fn auth_app_stack_it_lock() -> &'static TokioMutex<()> {
    AUTH_APP_STACK_DB_IT_LOCK.get_or_init(|| TokioMutex::new(()))
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

fn app_stack_router_with_store(pool: PgPool, store: ChainOffStore) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(store)),
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

/// **`TRAVELTRUST_AUTH_OMIT_TOKEN_BODY=1`** 时 **`POST /auth/refresh`** 体可能无 **`token`**，须从 **`Set-Cookie`** 取新会话（与 **`routes::auth::auth_refresh`** 同源）。
fn refreshed_session_token_from_refresh_parts(body: &Value, set_cookie_lines: &[String]) -> String {
    if let Some(t) = body
        .get("token")
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        return t.to_string();
    }
    for line in set_cookie_lines {
        let first = line.split(';').next().unwrap_or("").trim();
        if let Some(v) = first.strip_prefix(concat!("traveltrust_session_token", "=")) {
            return v.to_string();
        }
        if let Some(v) = first.strip_prefix("__Host-traveltrust_session=") {
            return v.to_string();
        }
    }
    panic!("refreshed session token missing in JSON body and Set-Cookie headers");
}

async fn cleanup_user_by_email(pool: &PgPool, email: &str) {
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

struct RestoreP3SeedArbitratorEmail {
    previous: Option<String>,
}

impl Drop for RestoreP3SeedArbitratorEmail {
    fn drop(&mut self) {
        match &self.previous {
            Some(v) => std::env::set_var("P3_SEED_ARBITRATOR_EMAIL", v),
            None => std::env::remove_var("P3_SEED_ARBITRATOR_EMAIL"),
        }
    }
}

#[tokio::test]
async fn register_creates_pg_session_logout_deletes_me_401() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: register_creates_pg_session_logout_deletes_me_401 (DATABASE_URL unset)");
        return;
    };

    let email = format!("auth-db-it-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
    let reg = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": email,
                        "password": "TestPass12!",
                        "nickname": "db_it"
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
    let reg_j = response_json(reg).await;
    let token = reg_j
        .get("token")
        .and_then(|t| t.as_str())
        .expect("token")
        .to_string();
    assert!(token.starts_with("tts_"));

    let uid = db::get_user_id_by_token(&pool, &token)
        .await
        .expect("get_user_id_by_token")
        .expect("session row after register");

    let me_ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_ok.status(), StatusCode::OK);

    let logout = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/logout")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(logout.status(), StatusCode::OK);

    assert!(
        db::get_user_id_by_token(&pool, &token)
            .await
            .expect("get_user_id_by_token 2")
            .is_none(),
        "session row must be deleted in PostgreSQL"
    );

    let me_401 = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_401.status(), StatusCode::UNAUTHORIZED);

    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(uid)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(uid)
        .execute(&pool)
        .await;
}

/// **PG**：**`POST /auth/logout`** 仅 **`Cookie: traveltrust_session_token`**（无 **`Authorization`**）删除 **`sessions`** 行；后续 **`GET /me`** **401**。
#[tokio::test]
async fn pg_logout_cookie_only_deletes_session_and_me_unauthorized() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: pg_logout_cookie_only_deletes_session_and_me_unauthorized (DATABASE_URL unset)"
        );
        return;
    };

    let email = format!("auth-db-cookie-logout-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
    let reg = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": email,
                        "password": "TestPass12!",
                        "nickname": "cookie_logout_pg"
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
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|t| t.as_str())
        .expect("token")
        .to_string();
    assert!(token.starts_with("tts_"));

    let cookie = format!("{}={}", SESSION_COOKIE_NAME_LEGACY, token);
    let me_ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::COOKIE, &cookie)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_ok.status(), StatusCode::OK);

    let logout = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/logout")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::COOKIE, &cookie)
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(logout.status(), StatusCode::OK);

    assert!(
        db::get_user_id_by_token(&pool, &token)
            .await
            .expect("get_user_id_by_token after cookie logout")
            .is_none(),
        "PostgreSQL session must be removed after cookie-only logout"
    );

    let me_401 = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::COOKIE, &cookie)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_401.status(), StatusCode::UNAUTHORIZED);

    cleanup_user_by_email(&pool, &email).await;
}

/// **PG**：**`POST /auth/refresh`** 仅 **`Cookie`**（空 body）轮换 **`sessions`** token（与 **`routes/auth`** 从 Cookie 注入 `refresh_token` 同源）。
#[tokio::test]
async fn pg_post_auth_refresh_cookie_only_rotates_session_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: pg_post_auth_refresh_cookie_only_rotates_session_pg (DATABASE_URL unset)");
        return;
    };

    let email = format!("auth-db-cookie-refresh-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
    let reg = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": email,
                        "password": "TestPass12!",
                        "nickname": "cookie_refresh_pg"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|t| t.as_str())
        .expect("token")
        .to_string();
    assert!(token.starts_with("tts_"));

    let cookie = format!("{}={}", SESSION_COOKIE_NAME_LEGACY, token);
    let refr = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/refresh")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::COOKIE, &cookie)
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        refr.status(),
        StatusCode::OK,
        "{:?}",
        response_json(refr).await
    );
    let rj = response_json(refr).await;
    let refreshed = rj
        .get("token")
        .and_then(|t| t.as_str())
        .expect("refreshed token");
    assert!(refreshed.starts_with("tts_"));
    assert_ne!(refreshed, token.as_str());
    assert_eq!(rj.get("status"), Some(&json!("ok")));

    assert!(
        db::get_user_id_by_token(&pool, &token)
            .await
            .expect("old token lookup")
            .is_none(),
        "old session token must not resolve after rotate"
    );
    assert!(
        db::get_user_id_by_token(&pool, refreshed)
            .await
            .expect("new token lookup")
            .is_some(),
        "new session token must resolve in PostgreSQL"
    );

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn login_after_register_issues_distinct_pg_session() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: login_after_register_issues_distinct_pg_session (DATABASE_URL unset)");
        return;
    };

    let email = format!("auth-db-login-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());

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
                        "nickname": "login_it"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let t1 = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();

    let out = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/logout")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&t1))
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(out.status(), StatusCode::OK);

    let login = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        login.status(),
        StatusCode::OK,
        "{:?}",
        response_json(login).await
    );
    let t2 = response_json(login)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();
    assert_ne!(t1, t2);
    assert!(db::get_user_id_by_token(&pool, &t2)
        .await
        .expect("get uid t2")
        .is_some());

    let uid = db::get_user_id_by_token(&pool, &t2).await.unwrap().unwrap();
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(uid)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(uid)
        .execute(&pool)
        .await;
}

/// **`POST /auth/login`**：若 **`P3_SEED_ARBITRATOR_EMAIL`** 事后与邮箱对齐，将 **`users.role`** 从 **`tourist`** 升为 **`arbitrator`**（与注册时命中 seed 同源；修 **F-025** 陈旧 PG 行）。
#[tokio::test]
async fn login_upgrades_p3_seed_arbitrator_row_from_tourist_to_arbitrator_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: login_upgrades_p3_seed_arbitrator_row_from_tourist_to_arbitrator_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = auth_app_stack_it_lock().lock().await;
    let prev_seed = std::env::var("P3_SEED_ARBITRATOR_EMAIL").ok();
    let _restore_seed = RestoreP3SeedArbitratorEmail {
        previous: prev_seed,
    };
    std::env::remove_var("P3_SEED_ARBITRATOR_EMAIL");

    let email = format!("p3-login-repair-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());

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
                        "nickname": "p3_repair"
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
    let reg_j = response_json(reg).await;
    assert_eq!(reg_j["role"], "tourist");

    std::env::set_var("P3_SEED_ARBITRATOR_EMAIL", &email);

    let login = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        login.status(),
        StatusCode::OK,
        "{:?}",
        response_json(login).await
    );
    let login_j = response_json(login).await;
    assert_eq!(login_j["role"], "arbitrator");

    let db_role: String =
        sqlx::query_scalar("SELECT role FROM users WHERE lower(email) = lower($1)")
            .bind(&email)
            .fetch_one(&pool)
            .await
            .expect("db role");
    assert_eq!(db_role, "arbitrator");

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn put_me_updates_nickname_visible_on_get_me_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: put_me_updates_nickname_visible_on_get_me_pg (DATABASE_URL unset)");
        return;
    };

    let email = format!("me-put-db-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "n1"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();

    let put = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PUT)
                .uri("/api/v1/me")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from(json!({"nickname": "n2"}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        put.status(),
        StatusCode::OK,
        "{:?}",
        response_json(put).await
    );

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    // 04 §3.4 / `get_me_impl`：`nickname` 在根级 `user` 下，非扁平字段。
    assert_eq!(
        gj.pointer("/user/nickname").and_then(|n| n.as_str()),
        Some("n2")
    );

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn put_me_password_revokes_pg_session_login_with_new_password() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: put_me_password_revokes_pg_session_login_with_new_password (DATABASE_URL unset)"
        );
        return;
    };

    let email = format!("me-pw-db-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "pw"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();

    let ch = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PUT)
                .uri("/api/v1/me/password")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from(
                    json!({
                        "old_password": "TestPass12!",
                        "new_password": "NewPass345!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ch.status(), StatusCode::OK, "{:?}", response_json(ch).await);

    assert!(
        db::get_user_id_by_token(&pool, token.as_str())
            .await
            .unwrap()
            .is_none(),
        "sessions revoked after password change"
    );

    let me_dead = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_dead.status(), StatusCode::UNAUTHORIZED);

    let login = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "NewPass345!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        login.status(),
        StatusCode::OK,
        "{:?}",
        response_json(login).await
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-REG-001** → **§8.2 · F-001**：`POST /auth/register` **200** 且 **`users`** 落行（**`DATABASE_URL` + `Router::oneshot`**）。
#[tokio::test]
async fn matrix_93_a_reg_001_register_success_pg_users_row() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_reg_001_register_success_pg_users_row (DATABASE_URL unset)");
        return;
    };

    let email = format!("93-a-reg-001-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "m93reg"
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

    let cnt: i64 =
        sqlx::query_scalar("SELECT COUNT(*)::bigint FROM users WHERE lower(email) = lower($1)")
            .bind(&email)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(cnt, 1, "A-REG-001 expects users row");

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-LOG-001** → **§8.2 · F-002**：`POST /auth/login` **200** + **`GET /api/v1/me`** **200**（Bearer）。
#[tokio::test]
async fn matrix_93_a_log_001_login_then_get_me_200() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_log_001_login_then_get_me_200 (DATABASE_URL unset)");
        return;
    };

    let email = format!("93-a-log-001-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "m93log"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    let login = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        login.status(),
        StatusCode::OK,
        "{:?}",
        response_json(login).await
    );
    let token = response_json(login)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .expect("login token")
        .to_string();

    let me = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me.status(), StatusCode::OK, "{:?}", response_json(me).await);

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-LOG-001** → **§8.2 · F-002**：`POST /auth/login` **200** + **`GET /api/v1/me`** **200**（Bearer；**`router::app`**）。
#[tokio::test]
async fn matrix_93_a_log_001b_f002_login_then_get_me_200_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_log_001b_f002_login_then_get_me_200_app_stack_ok_pg (DATABASE_URL unset)");
        return;
    };

    let email = format!("93-a-log-001b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let _lock = auth_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
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
                        "nickname": "m93logb"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    let login = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        login.status(),
        StatusCode::OK,
        "{:?}",
        response_json(login).await
    );
    let token = response_json(login)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .expect("login token")
        .to_string();

    let me = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me.status(), StatusCode::OK, "{:?}", response_json(me).await);

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-LOG-002** → **§8.2 · F-002**：**`POST /auth/login`** 后 **连续两次** **`GET /api/v1/me`** **200**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_a_log_002b_f002_login_then_get_me_twice_200_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_log_002b_f002_login_then_get_me_twice_200_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let email = format!("93-a-log-002b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let _lock = auth_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
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
                        "nickname": "m93log2b"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    let login = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        login.status(),
        StatusCode::OK,
        "{:?}",
        response_json(login).await
    );
    let token = response_json(login)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .expect("login token")
        .to_string();

    let me1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me1.status(), StatusCode::OK);
    let j1 = response_json(me1).await;
    assert!(j1.get("user").is_some(), "{j1:?}");
    let u1 = j1["user"]["id"].as_str().expect("user id").to_string();

    let me2 = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me2.status(), StatusCode::OK);
    let j2 = response_json(me2).await;
    let u2 = j2["user"]["id"].as_str().expect("user id").to_string();
    assert_eq!(u1, u2);

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-LOG-003** → **§8.2 · F-003**：`POST /auth/logout` 后 **`GET /api/v1/me`** **401**。
#[tokio::test]
async fn matrix_93_a_log_003_logout_then_get_me_401() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_log_003_logout_then_get_me_401 (DATABASE_URL unset)");
        return;
    };

    let email = format!("93-a-log-003-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "m93out"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();

    let logout = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/logout")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(logout.status(), StatusCode::OK);

    let me_401 = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_401.status(), StatusCode::UNAUTHORIZED);

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-ME-001** → **§8.2 · F-004**：注册后 **`GET /api/v1/me`** **200**，**`user.email` / `user.nickname`** 与账号一致。
#[tokio::test]
async fn matrix_93_a_me_001_register_then_get_me_user_fields_match() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_me_001_register_then_get_me_user_fields_match (DATABASE_URL unset)"
        );
        return;
    };

    let email = format!("93-a-me-001-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "me001nick"
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
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .expect("register token")
        .to_string();

    let me = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me.status(), StatusCode::OK, "{:?}", response_json(me).await);
    let mj = response_json(me).await;
    assert_eq!(
        mj.pointer("/user/email").and_then(|e| e.as_str()),
        Some(email.as_str())
    );
    assert_eq!(
        mj.pointer("/user/nickname").and_then(|n| n.as_str()),
        Some("me001nick")
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-ME-002** → **§8.2 · F-005**：**`PUT /api/v1/me`** 改昵称 → **`GET /api/v1/me`** 再读一致（**PG**）。
#[tokio::test]
async fn matrix_93_a_me_002_put_nickname_then_get_me_reflects_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_me_002_put_nickname_then_get_me_reflects_pg (DATABASE_URL unset)"
        );
        return;
    };

    let email = format!("93-a-me-002-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "before"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();

    let put = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PUT)
                .uri("/api/v1/me")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from(json!({"nickname": "after"}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        put.status(),
        StatusCode::OK,
        "{:?}",
        response_json(put).await
    );

    let get = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(
        gj.pointer("/user/nickname").and_then(|n| n.as_str()),
        Some("after")
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-PWD-001** → **§8.2 · F-006**：**`PUT /api/v1/me/password`** 成功 → 旧 **Bearer** **`GET /me`** **401** → 新密码 **`POST /auth/login`** **200**（**MANUAL-P1** 用例的 **PG·oneshot** 回填；见模块头 **ISS-007** 互指）。
#[tokio::test]
async fn matrix_93_a_pwd_001_change_password_revokes_session_new_login_ok() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_pwd_001_change_password_revokes_session_new_login_ok (DATABASE_URL unset)");
        return;
    };

    let email = format!("93-a-pwd-001-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "pwd001"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();

    let ch = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PUT)
                .uri("/api/v1/me/password")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from(
                    json!({
                        "old_password": "TestPass12!",
                        "new_password": "NewPass345!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ch.status(), StatusCode::OK, "{:?}", response_json(ch).await);

    assert!(
        db::get_user_id_by_token(&pool, token.as_str())
            .await
            .unwrap()
            .is_none(),
        "sessions revoked after password change (A-PWD-001)"
    );

    let me_dead = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_dead.status(), StatusCode::UNAUTHORIZED);

    let login = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "NewPass345!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        login.status(),
        StatusCode::OK,
        "{:?}",
        response_json(login).await
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// 与 **`matrix_93_a_pwd_002_*` / `matrix_93_a_reg_002_*`** 并行安全：**`TRAVELTRUST_EMAIL_TRANSPORT`/`PEPPER`** 与 **`email_transport`·`cfg(test)`** **`raw`** 槽；与 **`auth_login_per_email_limit`** 单元测共享 **`test_auth_mail_env_mutex`**（进程级 env）。
static AUTH_AUDIT_IT_MUTEX: Mutex<()> = Mutex::new(());

fn restore_env_opt(key: &str, prev: Option<String>) {
    match prev {
        Some(v) => std::env::set_var(key, v),
        None => std::env::remove_var(key),
    }
}

struct ForgotResetTestEnvGuard {
    prev_transport: Option<String>,
    prev_pepper: Option<String>,
}

impl ForgotResetTestEnvGuard {
    fn set_log_transport_and_pepper() -> Self {
        let prev_transport = std::env::var("TRAVELTRUST_EMAIL_TRANSPORT").ok();
        let prev_pepper = std::env::var("TRAVELTRUST_AUTH_TOKEN_PEPPER").ok();
        std::env::set_var("TRAVELTRUST_EMAIL_TRANSPORT", "log");
        std::env::set_var(
            "TRAVELTRUST_AUTH_TOKEN_PEPPER",
            "it-test-auth-token-pepper-32bytes!!",
        );
        Self {
            prev_transport,
            prev_pepper,
        }
    }
}

impl Drop for ForgotResetTestEnvGuard {
    fn drop(&mut self) {
        restore_env_opt("TRAVELTRUST_EMAIL_TRANSPORT", self.prev_transport.take());
        restore_env_opt("TRAVELTRUST_AUTH_TOKEN_PEPPER", self.prev_pepper.take());
    }
}

struct ForgotPerEmailRateLimitEnvGuard {
    prev_max: Option<String>,
    prev_window_secs: Option<String>,
}

impl ForgotPerEmailRateLimitEnvGuard {
    fn set(max_per_window: u32, window_secs: u64) -> Self {
        let prev_max = std::env::var("AUTH_FORGOT_PASSWORD_PER_EMAIL_MAX_PER_WINDOW").ok();
        let prev_window_secs = std::env::var("AUTH_FORGOT_PASSWORD_PER_EMAIL_WINDOW_SECS").ok();
        std::env::set_var(
            "AUTH_FORGOT_PASSWORD_PER_EMAIL_MAX_PER_WINDOW",
            max_per_window.to_string(),
        );
        std::env::set_var(
            "AUTH_FORGOT_PASSWORD_PER_EMAIL_WINDOW_SECS",
            window_secs.to_string(),
        );
        Self {
            prev_max,
            prev_window_secs,
        }
    }
}

impl Drop for ForgotPerEmailRateLimitEnvGuard {
    fn drop(&mut self) {
        restore_env_opt(
            "AUTH_FORGOT_PASSWORD_PER_EMAIL_MAX_PER_WINDOW",
            self.prev_max.take(),
        );
        restore_env_opt(
            "AUTH_FORGOT_PASSWORD_PER_EMAIL_WINDOW_SECS",
            self.prev_window_secs.take(),
        );
    }
}

struct LoginPerEmailRateLimitEnvGuard {
    prev_max: Option<String>,
    prev_window_secs: Option<String>,
}

impl LoginPerEmailRateLimitEnvGuard {
    fn set(max_per_window: u32, window_secs: u64) -> Self {
        let prev_max = std::env::var("AUTH_LOGIN_PER_EMAIL_MAX_PER_WINDOW").ok();
        let prev_window_secs = std::env::var("AUTH_LOGIN_PER_EMAIL_WINDOW_SECS").ok();
        std::env::set_var(
            "AUTH_LOGIN_PER_EMAIL_MAX_PER_WINDOW",
            max_per_window.to_string(),
        );
        std::env::set_var("AUTH_LOGIN_PER_EMAIL_WINDOW_SECS", window_secs.to_string());
        Self {
            prev_max,
            prev_window_secs,
        }
    }
}

impl Drop for LoginPerEmailRateLimitEnvGuard {
    fn drop(&mut self) {
        restore_env_opt("AUTH_LOGIN_PER_EMAIL_MAX_PER_WINDOW", self.prev_max.take());
        restore_env_opt(
            "AUTH_LOGIN_PER_EMAIL_WINDOW_SECS",
            self.prev_window_secs.take(),
        );
    }
}

struct LoginRiskRateLimitEnvGuard {
    prev_per_ip_max: Option<String>,
    prev_per_ip_window_secs: Option<String>,
    prev_global_max: Option<String>,
    prev_global_window_secs: Option<String>,
}

impl LoginRiskRateLimitEnvGuard {
    fn set(
        per_ip_max_per_window: u32,
        per_ip_window_secs: u64,
        global_max_per_window: u32,
        global_window_secs: u64,
    ) -> Self {
        let prev_per_ip_max = std::env::var("AUTH_LOGIN_PER_IP_MAX_PER_WINDOW").ok();
        let prev_per_ip_window_secs = std::env::var("AUTH_LOGIN_PER_IP_WINDOW_SECS").ok();
        let prev_global_max = std::env::var("AUTH_LOGIN_GLOBAL_MAX_PER_WINDOW").ok();
        let prev_global_window_secs = std::env::var("AUTH_LOGIN_GLOBAL_WINDOW_SECS").ok();
        std::env::set_var(
            "AUTH_LOGIN_PER_IP_MAX_PER_WINDOW",
            per_ip_max_per_window.to_string(),
        );
        std::env::set_var(
            "AUTH_LOGIN_PER_IP_WINDOW_SECS",
            per_ip_window_secs.to_string(),
        );
        std::env::set_var(
            "AUTH_LOGIN_GLOBAL_MAX_PER_WINDOW",
            global_max_per_window.to_string(),
        );
        std::env::set_var(
            "AUTH_LOGIN_GLOBAL_WINDOW_SECS",
            global_window_secs.to_string(),
        );
        Self {
            prev_per_ip_max,
            prev_per_ip_window_secs,
            prev_global_max,
            prev_global_window_secs,
        }
    }
}

impl Drop for LoginRiskRateLimitEnvGuard {
    fn drop(&mut self) {
        restore_env_opt(
            "AUTH_LOGIN_PER_IP_MAX_PER_WINDOW",
            self.prev_per_ip_max.take(),
        );
        restore_env_opt(
            "AUTH_LOGIN_PER_IP_WINDOW_SECS",
            self.prev_per_ip_window_secs.take(),
        );
        restore_env_opt(
            "AUTH_LOGIN_GLOBAL_MAX_PER_WINDOW",
            self.prev_global_max.take(),
        );
        restore_env_opt(
            "AUTH_LOGIN_GLOBAL_WINDOW_SECS",
            self.prev_global_window_secs.take(),
        );
    }
}

struct ForgotRiskRateLimitEnvGuard {
    prev_per_ip_max: Option<String>,
    prev_per_ip_window_secs: Option<String>,
    prev_global_max: Option<String>,
    prev_global_window_secs: Option<String>,
}

impl ForgotRiskRateLimitEnvGuard {
    fn set(
        per_ip_max_per_window: u32,
        per_ip_window_secs: u64,
        global_max_per_window: u32,
        global_window_secs: u64,
    ) -> Self {
        let prev_per_ip_max = std::env::var("AUTH_FORGOT_PASSWORD_PER_IP_MAX_PER_WINDOW").ok();
        let prev_per_ip_window_secs = std::env::var("AUTH_FORGOT_PASSWORD_PER_IP_WINDOW_SECS").ok();
        let prev_global_max = std::env::var("AUTH_FORGOT_PASSWORD_GLOBAL_MAX_PER_WINDOW").ok();
        let prev_global_window_secs = std::env::var("AUTH_FORGOT_PASSWORD_GLOBAL_WINDOW_SECS").ok();
        std::env::set_var(
            "AUTH_FORGOT_PASSWORD_PER_IP_MAX_PER_WINDOW",
            per_ip_max_per_window.to_string(),
        );
        std::env::set_var(
            "AUTH_FORGOT_PASSWORD_PER_IP_WINDOW_SECS",
            per_ip_window_secs.to_string(),
        );
        std::env::set_var(
            "AUTH_FORGOT_PASSWORD_GLOBAL_MAX_PER_WINDOW",
            global_max_per_window.to_string(),
        );
        std::env::set_var(
            "AUTH_FORGOT_PASSWORD_GLOBAL_WINDOW_SECS",
            global_window_secs.to_string(),
        );
        Self {
            prev_per_ip_max,
            prev_per_ip_window_secs,
            prev_global_max,
            prev_global_window_secs,
        }
    }
}

impl Drop for ForgotRiskRateLimitEnvGuard {
    fn drop(&mut self) {
        restore_env_opt(
            "AUTH_FORGOT_PASSWORD_PER_IP_MAX_PER_WINDOW",
            self.prev_per_ip_max.take(),
        );
        restore_env_opt(
            "AUTH_FORGOT_PASSWORD_PER_IP_WINDOW_SECS",
            self.prev_per_ip_window_secs.take(),
        );
        restore_env_opt(
            "AUTH_FORGOT_PASSWORD_GLOBAL_MAX_PER_WINDOW",
            self.prev_global_max.take(),
        );
        restore_env_opt(
            "AUTH_FORGOT_PASSWORD_GLOBAL_WINDOW_SECS",
            self.prev_global_window_secs.take(),
        );
    }
}

struct AuthAuditFailClosedTestEnvGuard {
    prev_fail_closed: Option<String>,
    prev_force_fail: Option<String>,
}

impl AuthAuditFailClosedTestEnvGuard {
    fn set(fail_closed: bool) -> Self {
        let prev_fail_closed = std::env::var("AUTH_AUDIT_FAIL_CLOSED").ok();
        let prev_force_fail = std::env::var("TRAVELTRUST_TEST_AUTH_AUDIT_FORCE_FAIL").ok();
        if fail_closed {
            std::env::set_var("AUTH_AUDIT_FAIL_CLOSED", "1");
        } else {
            std::env::set_var("AUTH_AUDIT_FAIL_CLOSED", "0");
        }
        std::env::set_var("TRAVELTRUST_TEST_AUTH_AUDIT_FORCE_FAIL", "1");
        Self {
            prev_fail_closed,
            prev_force_fail,
        }
    }
}

impl Drop for AuthAuditFailClosedTestEnvGuard {
    fn drop(&mut self) {
        restore_env_opt("AUTH_AUDIT_FAIL_CLOSED", self.prev_fail_closed.take());
        restore_env_opt(
            "TRAVELTRUST_TEST_AUTH_AUDIT_FORCE_FAIL",
            self.prev_force_fail.take(),
        );
    }
}

struct AuthAuditAsyncQueueEnvGuard {
    prev_enabled: Option<String>,
}

impl AuthAuditAsyncQueueEnvGuard {
    fn disable() -> Self {
        let prev_enabled = std::env::var("AUTH_AUDIT_ASYNC_QUEUE_ENABLED").ok();
        std::env::set_var("AUTH_AUDIT_ASYNC_QUEUE_ENABLED", "0");
        Self { prev_enabled }
    }
}

impl Drop for AuthAuditAsyncQueueEnvGuard {
    fn drop(&mut self) {
        restore_env_opt("AUTH_AUDIT_ASYNC_QUEUE_ENABLED", self.prev_enabled.take());
    }
}

/// **93 · A-PWD-002** → **§8.2 · F-006**（**F-001** 注册 / **F-002** 登录）：**`POST /auth/forgot-password`** → **`POST /auth/reset-password`** → **新密 `POST /auth/login` 200**、**旧密 401**（**`TRAVELTRUST_EMAIL_TRANSPORT=log` + pepper**；**`email_transport::test_*` raw 侧车**）。
#[tokio::test]
async fn matrix_93_a_pwd_002_f006_forgot_reset_password_new_login_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_pwd_002_f006_forgot_reset_password_new_login_ok_pg (DATABASE_URL unset)");
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let _ = email_transport::test_take_password_reset_raw_for_it();

    let email = format!("93-a-pwd-002-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "pwd002"
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

    let forgot = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/forgot-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "email": &email }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(forgot.status(), StatusCode::OK);
    let forgot_j = response_json(forgot).await;
    assert_eq!(
        forgot_j.get("message"),
        Some(&json!("if_account_exists_email_sent"))
    );

    let raw = email_transport::test_take_password_reset_raw_for_it()
        .expect("password_reset raw captured for IT");
    assert!(!raw.is_empty(), "reset raw token");

    let reset = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/reset-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "token": raw,
                        "new_password": "ResetPass56!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reset.status(), StatusCode::OK);
    let reset_j = response_json(reset).await;
    assert_eq!(reset_j.get("message"), Some(&json!("password_reset")));

    let login_bad = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(login_bad.status(), StatusCode::UNAUTHORIZED);

    let login_ok = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "ResetPass56!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        login_ok.status(),
        StatusCode::OK,
        "{:?}",
        response_json(login_ok).await
    );

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn auth_login_per_email_limit_returns_429_after_window_exhausted() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: auth_login_per_email_limit_returns_429_after_window_exhausted (DATABASE_URL unset)");
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _rate_env = LoginPerEmailRateLimitEnvGuard::set(1, 3600);
    let email = format!("auth-login-rate-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;
    let app = db_router(pool.clone());

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
                        "nickname": "login_rate"
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

    // First login consumes per-email slot.
    let first = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        first.status(),
        StatusCode::OK,
        "{:?}",
        response_json(first).await
    );

    let second = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(second.status(), StatusCode::TOO_MANY_REQUESTS);
    let second_j = response_json(second).await;
    assert_eq!(
        second_j.get("error"),
        Some(&json!("auth_login_per_email_rate_limited"))
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// P0: reset-password 成功后，重置前会话必须失效（旧 Bearer 访问 `/api/v1/me` 返回 401）。
#[tokio::test]
async fn forgot_reset_password_revokes_pre_reset_session_token_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: forgot_reset_password_revokes_pre_reset_session_token_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let _ = email_transport::test_take_password_reset_raw_for_it();

    let email = format!("pwd-reset-revoke-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "pwd_reset_revoke"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let reg_j = response_json(reg).await;
    let old_token = reg_j
        .get("token")
        .and_then(|t| t.as_str())
        .expect("register token")
        .to_string();

    let forgot = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/forgot-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "email": &email }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(forgot.status(), StatusCode::OK);

    let raw = email_transport::test_take_password_reset_raw_for_it()
        .expect("password_reset raw captured for IT");
    let reset = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/reset-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "token": raw,
                        "new_password": "ResetPass56!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reset.status(), StatusCode::OK);

    let me_with_old = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&old_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_with_old.status(), StatusCode::UNAUTHORIZED);

    cleanup_user_by_email(&pool, &email).await;
}

/// P0: reset token 必须单次消费，二次提交返回 invalid_reset_token。
#[tokio::test]
async fn forgot_reset_password_token_cannot_be_reused_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: forgot_reset_password_token_cannot_be_reused_pg (DATABASE_URL unset)");
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let _ = email_transport::test_take_password_reset_raw_for_it();

    let email = format!("pwd-reset-reuse-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "pwd_reset_reuse"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    let forgot = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/forgot-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "email": &email }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(forgot.status(), StatusCode::OK);

    let raw = email_transport::test_take_password_reset_raw_for_it()
        .expect("password_reset raw captured for IT");
    let first = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/reset-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "token": raw,
                        "new_password": "ResetPass56!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(first.status(), StatusCode::OK);

    let second = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/reset-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "token": raw,
                        "new_password": "ResetPass78!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(second.status(), StatusCode::BAD_REQUEST);
    let second_j = response_json(second).await;
    assert_eq!(second_j.get("error"), Some(&json!("invalid_reset_token")));

    cleanup_user_by_email(&pool, &email).await;
}

/// P1: forgot-password 超限后仍返回统一语义（防枚举），并且窗口事件仅消耗一次配额。
#[tokio::test]
async fn forgot_password_rate_limited_keeps_uniform_response_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: forgot_password_rate_limited_keeps_uniform_response_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let _limit_env = ForgotPerEmailRateLimitEnvGuard::set(1, 3600);
    let _ = email_transport::test_take_password_reset_raw_for_it();

    let email = format!("pwd-forgot-limit-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "forgot_limit"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    let first = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/forgot-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "email": &email }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(first.status(), StatusCode::OK);
    let first_j = response_json(first).await;
    assert_eq!(
        first_j.get("message"),
        Some(&json!("if_account_exists_email_sent"))
    );

    let second = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/forgot-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "email": &email }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(second.status(), StatusCode::OK);
    let second_j = response_json(second).await;
    assert_eq!(
        second_j.get("message"),
        Some(&json!("if_account_exists_email_sent"))
    );

    let token_count: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)::bigint FROM auth_email_tokens WHERE purpose = 'password_reset' AND user_id = (SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1)"#,
    )
    .bind(&email)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(
        token_count, 1,
        "rate-limited second request must not issue new token"
    );

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn forgot_password_per_ip_rate_limited_keeps_uniform_response_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: forgot_password_per_ip_rate_limited_keeps_uniform_response_pg (DATABASE_URL unset)");
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let _per_email_disabled = ForgotPerEmailRateLimitEnvGuard::set(0, 3600);
    let _risk_limit_env = ForgotRiskRateLimitEnvGuard::set(1, 3600, 0, 60);
    let _ = email_transport::test_take_password_reset_raw_for_it();

    let email = format!("pwd-forgot-ip-limit-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "forgot_ip_limit"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    let first = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/forgot-password")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-forwarded-for", "203.0.113.10")
                .body(Body::from(json!({ "email": &email }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(first.status(), StatusCode::OK);

    let second = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/forgot-password")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-forwarded-for", "203.0.113.10")
                .body(Body::from(json!({ "email": &email }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(second.status(), StatusCode::OK);
    let second_j = response_json(second).await;
    assert_eq!(
        second_j.get("message"),
        Some(&json!("if_account_exists_email_sent"))
    );

    let token_count: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)::bigint FROM auth_email_tokens WHERE purpose = 'password_reset' AND user_id = (SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1)"#,
    )
    .bind(&email)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(
        token_count, 1,
        "ip-rate-limited second request must not issue new token"
    );

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn login_per_ip_rate_limited_returns_429_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: login_per_ip_rate_limited_returns_429_pg (DATABASE_URL unset)");
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _per_email_disabled = LoginPerEmailRateLimitEnvGuard::set(0, 300);
    let _risk_limit_env = LoginRiskRateLimitEnvGuard::set(1, 3600, 0, 60);

    let email = format!("login-ip-limit-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "login_ip_limit"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    let first = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-forwarded-for", "198.51.100.20")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(first.status(), StatusCode::OK);

    let second = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-forwarded-for", "198.51.100.20")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(second.status(), StatusCode::TOO_MANY_REQUESTS);
    let second_j = response_json(second).await;
    assert_eq!(
        second_j.get("error"),
        Some(&json!("auth_login_per_ip_rate_limited"))
    );

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn forgot_password_global_rate_limited_keeps_uniform_response_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: forgot_password_global_rate_limited_keeps_uniform_response_pg (DATABASE_URL unset)");
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let _per_email_disabled = ForgotPerEmailRateLimitEnvGuard::set(0, 3600);
    let _risk_limit_env = ForgotRiskRateLimitEnvGuard::set(0, 3600, 1, 60);
    let _ = email_transport::test_take_password_reset_raw_for_it();

    let email = format!(
        "pwd-forgot-global-limit-{}@traveltrust.test",
        Uuid::new_v4()
    );
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "forgot_global_limit"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    let first = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/forgot-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "email": &email }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(first.status(), StatusCode::OK);

    let second = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/forgot-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "email": &email }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(second.status(), StatusCode::OK);
    let second_j = response_json(second).await;
    assert_eq!(
        second_j.get("message"),
        Some(&json!("if_account_exists_email_sent"))
    );

    let token_count: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)::bigint FROM auth_email_tokens WHERE purpose = 'password_reset' AND user_id = (SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1)"#,
    )
    .bind(&email)
    .fetch_one(&pool)
    .await
    .unwrap();
    assert_eq!(
        token_count, 1,
        "global-rate-limited second request must not issue new token"
    );

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn login_global_rate_limited_returns_429_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: login_global_rate_limited_returns_429_pg (DATABASE_URL unset)");
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _per_email_disabled = LoginPerEmailRateLimitEnvGuard::set(0, 300);
    let _risk_limit_env = LoginRiskRateLimitEnvGuard::set(0, 3600, 1, 60);

    let email = format!("login-global-limit-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "login_global_limit"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    let first = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(first.status(), StatusCode::OK);

    let second = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(second.status(), StatusCode::TOO_MANY_REQUESTS);
    let second_j = response_json(second).await;
    assert_eq!(
        second_j.get("error"),
        Some(&json!("auth_login_global_rate_limited"))
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// P1: 登录防枚举——不存在账号与错误密码均返回同一错误键与状态码。
#[tokio::test]
async fn login_not_found_and_wrong_password_have_same_contract_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: login_not_found_and_wrong_password_have_same_contract_pg (DATABASE_URL unset)"
        );
        return;
    };

    let known_email = format!("login-known-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &known_email).await;
    let unknown_email = format!("login-unknown-{}@traveltrust.test", Uuid::new_v4());

    let app = db_router(pool.clone());
    let reg = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &known_email,
                        "password": "TestPass12!",
                        "nickname": "login_contract"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    let wrong_password = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &known_email,
                        "password": "WrongPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(wrong_password.status(), StatusCode::UNAUTHORIZED);
    let wrong_j = response_json(wrong_password).await;

    let not_found = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &unknown_email,
                        "password": "WrongPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(not_found.status(), StatusCode::UNAUTHORIZED);
    let not_found_j = response_json(not_found).await;

    assert_eq!(wrong_j.get("error"), Some(&json!("invalid_credentials")));
    assert_eq!(
        not_found_j.get("error"),
        Some(&json!("invalid_credentials"))
    );
    assert_eq!(
        wrong_j, not_found_j,
        "login failure contract must be identical"
    );

    cleanup_user_by_email(&pool, &known_email).await;
}

/// P2: forgot/reset 链路审计应可检索（request_id + outcome 入库），便于审计平台聚合追踪。
#[tokio::test]
async fn forgot_reset_audit_events_persist_request_id_and_outcome_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: forgot_reset_audit_events_persist_request_id_and_outcome_pg (DATABASE_URL unset)");
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let _audit_queue = AuthAuditAsyncQueueEnvGuard::disable();
    let _ = email_transport::test_take_password_reset_raw_for_it();

    let email = format!("audit-forgot-reset-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "audit_path"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let user_id = response_json(reg)
        .await
        .get("user_id")
        .and_then(|x| x.as_str())
        .and_then(|s| Uuid::parse_str(s).ok())
        .expect("register user_id");

    let forgot_req_id = format!("it-forgot-{}", Uuid::new_v4());
    let forgot = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/forgot-password")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-request-id", &forgot_req_id)
                .body(Body::from(json!({ "email": &email }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(forgot.status(), StatusCode::OK);

    let raw = email_transport::test_take_password_reset_raw_for_it()
        .expect("password_reset raw captured for IT");
    let reset_req_id = format!("it-reset-{}", Uuid::new_v4());
    let reset = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/reset-password")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-request-id", &reset_req_id)
                .body(Body::from(
                    json!({
                        "token": raw,
                        "new_password": "ResetPass56!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reset.status(), StatusCode::OK);

    let forgot_events = db::list_auth_audit_events(
        &pool,
        Some("password_reset_requested"),
        Some(user_id),
        None,
        None,
        None,
        20,
    )
    .await
    .expect("list password_reset_requested audit events");
    let forgot_ev = forgot_events
        .iter()
        .find(|e| e.request_id.as_deref() == Some(forgot_req_id.as_str()))
        .expect("password_reset_requested with test request_id");
    assert_eq!(
        forgot_ev.payload.get("outcome").and_then(|v| v.as_str()),
        Some("accepted_if_exists")
    );

    let reset_events = db::list_auth_audit_events(
        &pool,
        Some("password_reset_consumed"),
        Some(user_id),
        None,
        None,
        None,
        20,
    )
    .await
    .expect("list password_reset_consumed audit events");
    let reset_ev = reset_events
        .iter()
        .find(|e| e.request_id.as_deref() == Some(reset_req_id.as_str()))
        .expect("password_reset_consumed with test request_id");
    assert_eq!(
        reset_ev.payload.get("outcome").and_then(|v| v.as_str()),
        Some("password_rotated_sessions_revoked")
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// P1: 登录失败审计 reason 应与 API error 一致，便于安全审计聚类（invalid_credentials / rate_limited）。
#[tokio::test]
async fn auth_login_failure_audit_reason_matches_error_key_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: auth_login_failure_audit_reason_matches_error_key_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _audit_queue = AuthAuditAsyncQueueEnvGuard::disable();
    let _rate_env = LoginPerEmailRateLimitEnvGuard::set(1, 3600);
    let email = format!("audit-login-fail-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;
    let app = db_router(pool.clone());

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
                        "nickname": "audit_login_fail"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    let req_invalid = format!("it-login-invalid-{}", Uuid::new_v4());
    let invalid = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-request-id", &req_invalid)
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "WrongPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(invalid.status(), StatusCode::UNAUTHORIZED);
    let invalid_j = response_json(invalid).await;
    assert_eq!(invalid_j.get("error"), Some(&json!("invalid_credentials")));

    // 先成功一次占满邮箱桶，再触发 rate-limited。
    let first_ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        first_ok.status(),
        StatusCode::OK,
        "{:?}",
        response_json(first_ok).await
    );

    let req_limited = format!("it-login-limited-{}", Uuid::new_v4());
    let limited = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-request-id", &req_limited)
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(limited.status(), StatusCode::TOO_MANY_REQUESTS);
    let limited_j = response_json(limited).await;
    assert_eq!(
        limited_j.get("error"),
        Some(&json!("auth_login_per_email_rate_limited"))
    );

    let failure_events = db::list_auth_audit_events(
        &pool,
        Some("auth_login_failure"),
        None,
        None,
        None,
        None,
        50,
    )
    .await
    .expect("list auth_login_failure events");
    let invalid_ev = failure_events
        .iter()
        .find(|e| e.request_id.as_deref() == Some(req_invalid.as_str()))
        .expect("auth_login_failure invalid_credentials event");
    assert_eq!(invalid_ev.reason.as_deref(), Some("invalid_credentials"));
    let limited_ev = failure_events
        .iter()
        .find(|e| e.request_id.as_deref() == Some(req_limited.as_str()))
        .expect("auth_login_failure rate_limited event");
    assert_eq!(
        limited_ev.reason.as_deref(),
        Some("auth_login_per_email_rate_limited")
    );

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn auth_login_failure_audit_reason_matches_risk_error_keys_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: auth_login_failure_audit_reason_matches_risk_error_keys_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _audit_queue = AuthAuditAsyncQueueEnvGuard::disable();
    let _per_email_disabled = LoginPerEmailRateLimitEnvGuard::set(0, 3600);
    let _risk_env = LoginRiskRateLimitEnvGuard::set(1, 3600, 1, 3600);
    let email = format!("audit-login-risk-fail-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;
    let app = db_router(pool.clone());

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
                        "nickname": "audit_login_risk_fail"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    let req_ip = format!("it-login-risk-ip-{}", Uuid::new_v4());
    let ip_limited = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-request-id", &req_ip)
                .header("x-forwarded-for", "198.51.100.55")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ip_limited.status(), StatusCode::TOO_MANY_REQUESTS);
    let ip_limited_j = response_json(ip_limited).await;
    assert_eq!(
        ip_limited_j.get("error"),
        Some(&json!("auth_login_per_ip_rate_limited"))
    );

    let req_global = format!("it-login-risk-global-{}", Uuid::new_v4());
    let global_limited = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-request-id", &req_global)
                .header("x-forwarded-for", "203.0.113.66")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(global_limited.status(), StatusCode::TOO_MANY_REQUESTS);
    let global_limited_j = response_json(global_limited).await;
    assert_eq!(
        global_limited_j.get("error"),
        Some(&json!("auth_login_global_rate_limited"))
    );

    let failure_events = db::list_auth_audit_events(
        &pool,
        Some("auth_login_failure"),
        None,
        None,
        None,
        None,
        100,
    )
    .await
    .expect("list auth_login_failure events");
    let ip_ev = failure_events
        .iter()
        .find(|e| e.request_id.as_deref() == Some(req_ip.as_str()))
        .expect("auth_login_failure per_ip_rate_limited event");
    assert_eq!(
        ip_ev.reason.as_deref(),
        Some("auth_login_per_ip_rate_limited")
    );
    let global_ev = failure_events
        .iter()
        .find(|e| e.request_id.as_deref() == Some(req_global.as_str()))
        .expect("auth_login_failure global_rate_limited event");
    assert_eq!(
        global_ev.reason.as_deref(),
        Some("auth_login_global_rate_limited")
    );

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn auth_hot_table_retention_delete_helpers_remove_stale_rows_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: auth_hot_table_retention_delete_helpers_remove_stale_rows_pg (DATABASE_URL unset)");
        return;
    };

    let user_id = Uuid::new_v4();
    let email = format!("auth-hot-retention-{}@traveltrust.test", user_id);
    let token = format!("tts_hot_retention_{}", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;
    let now = chrono::Utc::now();
    db::insert_user(
        &pool, user_id, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert user");
    db::insert_session(&pool, &token, user_id)
        .await
        .expect("insert session");

    sqlx::query(
        r#"UPDATE sessions SET revoked_at = now() - interval '3 days', revoked_reason='test_retention' WHERE token = $1"#,
    )
    .bind(&token)
    .execute(&pool)
    .await
    .expect("age session");

    sqlx::query(
        r#"INSERT INTO auth_email_tokens (user_id, purpose, token_hash, expires_at, consumed_at, created_at)
           VALUES ($1, 'password_reset', $2, now() - interval '3 days', now() - interval '3 days', now() - interval '3 days')"#,
    )
    .bind(user_id)
    .bind(format!("stale_hash_{}", Uuid::new_v4()))
    .execute(&pool)
    .await
    .expect("insert stale auth_email_token");

    sqlx::query(
        r#"INSERT INTO wallet_verify_challenges (user_id, wallet_address, nonce, message, expires_at, consumed_at, verified_at, created_at)
           VALUES ($1, '0x1111111111111111111111111111111111111111', $2, 'retention-test', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days')"#,
    )
    .bind(user_id)
    .bind(format!("stale_nonce_{}", Uuid::new_v4()))
    .execute(&pool)
    .await
    .expect("insert stale wallet challenge");

    let deleted_sessions = db::delete_stale_sessions(&pool, 1)
        .await
        .expect("delete stale sessions");
    let deleted_tokens = db::delete_stale_auth_email_tokens(&pool, 1)
        .await
        .expect("delete stale auth_email_tokens");
    let deleted_wallet = db::delete_stale_wallet_verify_challenges(&pool, 1)
        .await
        .expect("delete stale wallet challenges");

    assert!(
        deleted_sessions >= 1,
        "expected stale session rows to be deleted"
    );
    assert!(
        deleted_tokens >= 1,
        "expected stale auth_email_tokens rows to be deleted"
    );
    assert!(
        deleted_wallet >= 1,
        "expected stale wallet_verify_challenges rows to be deleted"
    );

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn session_token_hash_backfill_updates_active_rows_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: session_token_hash_backfill_updates_active_rows_pg (DATABASE_URL unset)");
        return;
    };

    let prev_pepper = std::env::var("TRAVELTRUST_SESSION_TOKEN_PEPPER").ok();
    std::env::set_var(
        "TRAVELTRUST_SESSION_TOKEN_PEPPER",
        "it-session-token-pepper-backfill-32bytes!!",
    );

    let user_id = Uuid::new_v4();
    let email = format!("session-backfill-{}@traveltrust.test", user_id);
    let token = format!("tts_backfill_{}", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;
    let now = chrono::Utc::now();
    db::insert_user(
        &pool, user_id, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert user");
    db::insert_session(&pool, &token, user_id)
        .await
        .expect("insert session");

    sqlx::query("UPDATE sessions SET token_hash = NULL WHERE token = $1")
        .bind(&token)
        .execute(&pool)
        .await
        .expect("reset token_hash to null");

    let missing_before = db::count_active_sessions_missing_token_hash(&pool)
        .await
        .expect("count missing before");
    assert!(
        missing_before >= 1,
        "expected at least one missing token_hash"
    );

    let updated = db::backfill_active_sessions_token_hash(&pool, 100)
        .await
        .expect("backfill active sessions token_hash");
    assert!(updated >= 1, "expected at least one updated row");

    let missing_after = db::count_active_sessions_missing_token_hash(&pool)
        .await
        .expect("count missing after");
    assert_eq!(missing_after, 0);

    cleanup_user_by_email(&pool, &email).await;
    restore_env_opt("TRAVELTRUST_SESSION_TOKEN_PEPPER", prev_pepper);
}

/// P2: reset 失败路径审计应可检索（request_id + consume_failed outcome）。
#[tokio::test]
async fn reset_password_failure_audit_event_persists_outcome_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: reset_password_failure_audit_event_persists_outcome_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let _audit_queue = AuthAuditAsyncQueueEnvGuard::disable();

    let email = format!("audit-reset-fail-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "audit_reset_fail"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let user_id = response_json(reg)
        .await
        .get("user_id")
        .and_then(|x| x.as_str())
        .and_then(|s| Uuid::parse_str(s).ok())
        .expect("register user_id");

    let reset_req_id = format!("it-reset-fail-{}", Uuid::new_v4());
    let reset = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/reset-password")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-request-id", &reset_req_id)
                .body(Body::from(
                    json!({
                        "token": "deadbeefdeadbeefdeadbeefdeadbeef",
                        "new_password": "ResetPass56!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reset.status(), StatusCode::BAD_REQUEST);

    let failure_events = db::list_auth_audit_events(
        &pool,
        Some("password_reset_consume_failure"),
        Some(user_id),
        None,
        None,
        None,
        20,
    )
    .await
    .expect("list password_reset_consume_failure audit events");
    let failure_ev = failure_events
        .iter()
        .find(|e| e.request_id.as_deref() == Some(reset_req_id.as_str()))
        .expect("password_reset_consume_failure with test request_id");
    assert_eq!(
        failure_ev.payload.get("outcome").and_then(|v| v.as_str()),
        Some("consume_failed")
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// P1: reset-password 失败码契约应稳定：缺 token=token_required，伪 token=invalid_reset_token。
#[tokio::test]
async fn reset_password_failure_error_contract_is_stable_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: reset_password_failure_error_contract_is_stable_pg (DATABASE_URL unset)");
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let app = db_router(pool.clone());

    let missing_token = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/reset-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "new_password": "ResetPass56!" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(missing_token.status(), StatusCode::BAD_REQUEST);
    let missing_j = response_json(missing_token).await;
    assert_eq!(missing_j.get("error"), Some(&json!("token_required")));

    let invalid_token = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/reset-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "token": "deadbeefdeadbeefdeadbeefdeadbeef",
                        "new_password": "ResetPass56!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(invalid_token.status(), StatusCode::BAD_REQUEST);
    let invalid_j = response_json(invalid_token).await;
    assert_eq!(invalid_j.get("error"), Some(&json!("invalid_reset_token")));
}

/// P1: forgot-password 失败审计需落 reason=request_failed，便于与 reset 失败聚合分析。
#[tokio::test]
async fn forgot_password_failure_audit_reason_is_request_failed_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: forgot_password_failure_audit_reason_is_request_failed_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _audit_queue = AuthAuditAsyncQueueEnvGuard::disable();
    let email = format!("audit-forgot-fail-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;
    let app = db_router(pool.clone());

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
                        "nickname": "audit_forgot_fail"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let user_id = response_json(reg)
        .await
        .get("user_id")
        .and_then(|x| x.as_str())
        .and_then(|s| Uuid::parse_str(s).ok())
        .expect("register user_id");

    let prev_transport = std::env::var("TRAVELTRUST_EMAIL_TRANSPORT").ok();
    let prev_pepper = std::env::var("TRAVELTRUST_AUTH_TOKEN_PEPPER").ok();
    std::env::set_var("TRAVELTRUST_EMAIL_TRANSPORT", "off");
    std::env::set_var(
        "TRAVELTRUST_AUTH_TOKEN_PEPPER",
        "it-test-auth-token-pepper-32bytes!!",
    );
    let req_id = format!("it-forgot-fail-{}", Uuid::new_v4());
    let forgot = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/forgot-password")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-request-id", &req_id)
                .body(Body::from(json!({ "email": &email }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    restore_env_opt("TRAVELTRUST_EMAIL_TRANSPORT", prev_transport);
    restore_env_opt("TRAVELTRUST_AUTH_TOKEN_PEPPER", prev_pepper);
    assert_eq!(forgot.status(), StatusCode::SERVICE_UNAVAILABLE);

    let failure_events = db::list_auth_audit_events(
        &pool,
        Some("password_reset_request_failure"),
        Some(user_id),
        None,
        None,
        None,
        20,
    )
    .await
    .expect("list password_reset_request_failure audit events");
    let failure_ev = failure_events
        .iter()
        .find(|e| e.request_id.as_deref() == Some(req_id.as_str()))
        .expect("password_reset_request_failure with test request_id");
    assert_eq!(failure_ev.reason.as_deref(), Some("request_failed"));

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn auth_audit_query_by_event_type_and_reason_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: auth_audit_query_by_event_type_and_reason_pg (DATABASE_URL unset)");
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _audit_queue = AuthAuditAsyncQueueEnvGuard::disable();
    let _rate_env = LoginPerEmailRateLimitEnvGuard::set(1, 3600);
    let email = format!("audit-reason-query-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;
    let app = db_router(pool.clone());

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
                        "nickname": "audit_reason_query"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let user_id = response_json(reg)
        .await
        .get("user_id")
        .and_then(|x| x.as_str())
        .and_then(|s| Uuid::parse_str(s).ok())
        .expect("register user_id");

    let req_limited = format!("it-reason-limited-{}", Uuid::new_v4());
    let first_ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(first_ok.status(), StatusCode::OK);
    let limited = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-request-id", &req_limited)
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(limited.status(), StatusCode::TOO_MANY_REQUESTS);

    let rows = db::list_auth_audit_events_by_reason(
        &pool,
        Some("auth_login_failure"),
        Some("auth_login_per_email_rate_limited"),
        Some(user_id),
        20,
    )
    .await
    .expect("list_auth_audit_events_by_reason");
    assert!(
        rows.iter()
            .any(|r| r.request_id.as_deref() == Some(req_limited.as_str())),
        "expect auth_login_failure filtered by reason to include request"
    );

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn auth_wallet_failure_error_contract_smoke_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: auth_wallet_failure_error_contract_smoke_pg (DATABASE_URL unset)");
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _mail_env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let _rate_env = LoginPerEmailRateLimitEnvGuard::set(1, 3600);
    let email = format!("contract-fail-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;
    let app = db_router(pool.clone());

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
                        "nickname": "contract_fail"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();

    let login_wrong = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "WrongPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(login_wrong.status(), StatusCode::UNAUTHORIZED);
    assert_eq!(
        response_json(login_wrong).await.get("error"),
        Some(&json!("invalid_credentials"))
    );

    // occupy one slot then trigger limit
    let login_ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(login_ok.status(), StatusCode::OK);
    let login_limited = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(login_limited.status(), StatusCode::TOO_MANY_REQUESTS);
    assert_eq!(
        response_json(login_limited).await.get("error"),
        Some(&json!("auth_login_per_email_rate_limited"))
    );

    let reset_missing = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/reset-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"new_password":"ResetPass56!"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reset_missing.status(), StatusCode::BAD_REQUEST);
    assert_eq!(
        response_json(reset_missing).await.get("error"),
        Some(&json!("token_required"))
    );

    let wallet_invalid_id = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/wallet/verify/confirm")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"challenge_id":"not-a-uuid","signature":"0x1234"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(wallet_invalid_id.status(), StatusCode::BAD_REQUEST);
    assert_eq!(
        response_json(wallet_invalid_id).await.get("error"),
        Some(&json!("invalid_challenge_id"))
    );

    let wallet_expired = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/wallet/verify/confirm")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"challenge_id":Uuid::new_v4().to_string(),"signature":"0x1234"})
                        .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(wallet_expired.status(), StatusCode::BAD_REQUEST);
    assert_eq!(
        response_json(wallet_expired).await.get("error"),
        Some(&json!("invalid_or_expired_wallet_challenge"))
    );

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn admin_auth_audit_events_support_reason_filter_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: admin_auth_audit_events_support_reason_filter_pg (DATABASE_URL unset)");
        return;
    };

    let admin_id = Uuid::new_v4();
    let admin_email = format!("admin-auth-audit-{}@traveltrust.test", admin_id);
    let admin_token = format!("tts_admin_auth_audit_{}", Uuid::new_v4());
    cleanup_user_by_email(&pool, &admin_email).await;
    let now = chrono::Utc::now();
    db::insert_user(
        &pool,
        admin_id,
        &admin_email,
        None,
        "admin",
        "none",
        Some("admin_audit_reader"),
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert admin user");
    db::insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert admin session");
    db::insert_auth_audit_event(
        &pool,
        "auth_login_failure",
        Some(admin_id),
        Some("it-admin-audit-reason-filter"),
        Some("127.0.0.1"),
        Some("it-agent"),
        Some("auth_login_per_email_rate_limited"),
        &json!({"status_code":429,"error":"auth_login_per_email_rate_limited"}),
    )
    .await
    .expect("insert auth audit event");
    db::insert_auth_audit_event(
        &pool,
        "auth_login_failure",
        Some(admin_id),
        Some("it-admin-audit-reason-other"),
        Some("127.0.0.1"),
        Some("it-agent"),
        Some("invalid_credentials"),
        &json!({"status_code":401,"error":"invalid_credentials"}),
    )
    .await
    .expect("insert auth audit event 2");
    db::insert_auth_audit_event(
        &pool,
        "auth_login_failure",
        Some(admin_id),
        Some("it-admin-audit-reason-ip"),
        Some("127.0.0.1"),
        Some("it-agent"),
        Some("auth_login_per_ip_rate_limited"),
        &json!({"status_code":429,"error":"auth_login_per_ip_rate_limited"}),
    )
    .await
    .expect("insert auth audit event 3");
    db::insert_auth_audit_event(
        &pool,
        "auth_login_failure",
        Some(admin_id),
        Some("it-admin-audit-reason-global"),
        Some("127.0.0.1"),
        Some("it-agent"),
        Some("auth_login_global_rate_limited"),
        &json!({"status_code":429,"error":"auth_login_global_rate_limited"}),
    )
    .await
    .expect("insert auth audit event 4");

    let mut seeded_store = ChainOffStore::default();
    seeded_store.users.insert(
        admin_id,
        crate::chain_off::UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: Some("admin_audit_reader".to_string()),
            avatar_url: None,
            default_wallet_address: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    seeded_store.sessions.insert(admin_token.clone(), admin_id);
    let app = app_stack_router_with_store(pool.clone(), seeded_store);

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/auth-audit-events?event_type=auth_login_failure&reason=auth_login_per_email_rate_limited&limit=20")
                .header(header::AUTHORIZATION, auth_bearer_value(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let status = res.status();
    let body = response_json(res).await;
    assert_eq!(status, StatusCode::OK, "{:?}", body);
    assert_eq!(
        body.pointer("/applied_filters/reason"),
        Some(&json!("auth_login_per_email_rate_limited"))
    );
    let items = body["items"].as_array().expect("items array");
    assert!(
        !items.is_empty(),
        "expected at least one auth audit event with filtered reason"
    );
    assert!(items.iter().all(|it| {
        it.get("reason")
            .and_then(|v| v.as_str())
            .map(|s| s == "auth_login_per_email_rate_limited")
            .unwrap_or(false)
    }));

    let res_ip = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/auth-audit-events?event_type=auth_login_failure&reason=auth_login_per_ip_rate_limited&limit=20")
                .header(header::AUTHORIZATION, auth_bearer_value(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let status_ip = res_ip.status();
    let body_ip = response_json(res_ip).await;
    assert_eq!(status_ip, StatusCode::OK, "{:?}", body_ip);
    assert_eq!(
        body_ip.pointer("/applied_filters/reason"),
        Some(&json!("auth_login_per_ip_rate_limited"))
    );
    let items_ip = body_ip["items"].as_array().expect("items array");
    assert!(
        !items_ip.is_empty(),
        "expected at least one auth audit event with ip-rate-limited reason"
    );
    assert!(items_ip.iter().all(|it| {
        it.get("reason")
            .and_then(|v| v.as_str())
            .map(|s| s == "auth_login_per_ip_rate_limited")
            .unwrap_or(false)
    }));

    let res_global = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/auth-audit-events?event_type=auth_login_failure&reason=auth_login_global_rate_limited&limit=20")
                .header(header::AUTHORIZATION, auth_bearer_value(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let status_global = res_global.status();
    let body_global = response_json(res_global).await;
    assert_eq!(status_global, StatusCode::OK, "{:?}", body_global);
    assert_eq!(
        body_global.pointer("/applied_filters/reason"),
        Some(&json!("auth_login_global_rate_limited"))
    );
    let items_global = body_global["items"].as_array().expect("items array");
    assert!(
        !items_global.is_empty(),
        "expected at least one auth audit event with global-rate-limited reason"
    );
    assert!(items_global.iter().all(|it| {
        it.get("reason")
            .and_then(|v| v.as_str())
            .map(|s| s == "auth_login_global_rate_limited")
            .unwrap_or(false)
    }));

    cleanup_user_by_email(&pool, &admin_email).await;
}

/// **93 · A-REG-002** → **§8.2 · F-001**：**`POST /auth/register`**（**`TRAVELTRUST_AUTH_TOKEN_PEPPER`** 触发 **`email_verify`** 令牌）→ **`POST /auth/verify-email`** **200** → **`GET /me`** **`user.email_verified_at`** 非空（**`cfg(test)` raw 侧车**）。
#[tokio::test]
async fn matrix_93_a_reg_002_f001_post_verify_email_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_reg_002_f001_post_verify_email_ok_pg (DATABASE_URL unset)");
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let _ = email_transport::test_take_email_verify_raw_for_it();

    let email = format!("93-a-reg-002-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "reg002"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let reg_j = response_json(reg).await;
    assert_eq!(
        reg_j.get("email_verification_token_issued"),
        Some(&json!(true)),
        "pepper must be set for email verify IT"
    );
    let token = reg_j
        .get("token")
        .and_then(|t| t.as_str())
        .expect("session token")
        .to_string();

    let raw =
        email_transport::test_take_email_verify_raw_for_it().expect("email_verify raw for IT");
    assert!(!raw.is_empty());

    let ver = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/verify-email")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "token": raw }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ver.status(), StatusCode::OK);
    let ver_j = response_json(ver).await;
    assert_eq!(ver_j.get("message"), Some(&json!("email_verified")));

    let me = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me.status(), StatusCode::OK);
    let mj = response_json(me).await;
    assert!(
        mj.pointer("/user/email_verified_at")
            .and_then(|v| v.as_str())
            .is_some_and(|s| !s.is_empty()),
        "user.email_verified_at after verify: {:?}",
        mj
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-LOG-004** → **§8.2 · F-002**：**`POST /auth/refresh`** **`{ \"refresh_token\": \"<tts_…>\" }`** **200**，并轮换为新 token（旧 token 失效）。
#[tokio::test]
async fn matrix_93_a_log_004_f002_post_auth_refresh_rotates_token_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_log_004_f002_post_auth_refresh_rotates_token_ok_pg (DATABASE_URL unset)");
        return;
    };

    let email = format!("93-a-log-004-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "log004"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let reg_j = response_json(reg).await;
    let token = reg_j
        .get("token")
        .and_then(|t| t.as_str())
        .expect("token")
        .to_string();
    assert!(token.starts_with("tts_"));

    let refr = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/refresh")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "refresh_token": token.as_str() }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(refr.status(), StatusCode::OK);
    let rj = response_json(refr).await;
    let refreshed_token = rj
        .get("token")
        .and_then(|t| t.as_str())
        .expect("refreshed token");
    assert!(refreshed_token.starts_with("tts_"));
    assert_ne!(refreshed_token, token.as_str());
    assert_eq!(rj.get("status"), Some(&json!("ok")));

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-LOG-005** → **§8.2 · F-003**（**F-002**）：**`POST /auth/logout`** 后 **`POST /auth/refresh`** **401** **`invalid_token`**。
#[tokio::test]
async fn matrix_93_a_log_005_f003_post_auth_refresh_after_logout_unauthorized_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_log_005_f003_post_auth_refresh_after_logout_unauthorized_pg (DATABASE_URL unset)");
        return;
    };

    let email = format!("93-a-log-005-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = db_router(pool.clone());
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
                        "nickname": "log005"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|t| t.as_str())
        .unwrap()
        .to_string();

    let refr_ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/refresh")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "refresh_token": token.as_str() }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(refr_ok.status(), StatusCode::OK);
    let refreshed_token = response_json(refr_ok)
        .await
        .get("token")
        .and_then(|t| t.as_str())
        .expect("refreshed token")
        .to_string();
    assert_ne!(refreshed_token, token);

    let out = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/logout")
                .header(header::AUTHORIZATION, auth_bearer_value(&refreshed_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(out.status(), StatusCode::OK);

    let refr_dead = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/refresh")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "refresh_token": refreshed_token.as_str() }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(refr_dead.status(), StatusCode::UNAUTHORIZED);
    let dj = response_json(refr_dead).await;
    assert_eq!(dj.get("error"), Some(&json!("invalid_token")));

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-LOG-004** → **§8.2 · F-002**：**`POST /auth/refresh`** **`router::app`** 主栈（**`IdempotencyCache` + `api_router` merge 序**）与 **`merge(auth|me)`** **`matrix_93_a_log_004_f002_*`** 互补；轮换新 token。
#[tokio::test]
async fn matrix_93_a_log_004b_f002_post_auth_refresh_rotates_token_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_log_004b_f002_post_auth_refresh_rotates_token_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = auth_app_stack_it_lock().lock().await;

    let email = format!("93-a-log-004b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_router(pool.clone());
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
                        "nickname": "log004b"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let reg_j = response_json(reg).await;
    let token = reg_j
        .get("token")
        .and_then(|t| t.as_str())
        .expect("token")
        .to_string();
    assert!(token.starts_with("tts_"));

    let refr = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/refresh")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "refresh_token": token.as_str() }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(refr.status(), StatusCode::OK);
    let rj = response_json(refr).await;
    let refreshed_token = rj
        .get("token")
        .and_then(|t| t.as_str())
        .expect("refreshed token");
    assert!(refreshed_token.starts_with("tts_"));
    assert_ne!(refreshed_token, token.as_str());
    assert_eq!(rj.get("status"), Some(&json!("ok")));

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-ME-001** → **§8.2 · F-004**：**`GET /api/v1/me`** **`router::app`** 主栈与 **`merge(auth|me)`** **`matrix_93_a_me_001_*`** 互补。
#[tokio::test]
async fn matrix_93_a_me_001b_f004_register_then_get_me_user_fields_match_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_me_001b_f004_register_then_get_me_user_fields_match_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = auth_app_stack_it_lock().lock().await;

    let email = format!("93-a-me-001b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_router(pool.clone());
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
                        "nickname": "me001bnick"
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
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .expect("register token")
        .to_string();

    let me = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me.status(), StatusCode::OK, "{:?}", response_json(me).await);
    let mj = response_json(me).await;
    assert_eq!(
        mj.pointer("/user/email").and_then(|e| e.as_str()),
        Some(email.as_str())
    );
    assert_eq!(
        mj.pointer("/user/nickname").and_then(|n| n.as_str()),
        Some("me001bnick")
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-ME-003（门闸）** → **§8.2 · F-004**：**`GET /api/v1/me/stats`** **无** **`Authorization`/`X-User-Id`** **`router::app`** **→** **401** **`unauthorized`**（**`auth_placeholder_layer`**）。
#[tokio::test]
async fn matrix_93_a_me_003c_f004_get_me_stats_unauthorized_without_bearer_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_me_003c_f004_get_me_stats_unauthorized_without_bearer_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = auth_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let st = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/stats")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(st.status(), StatusCode::UNAUTHORIZED);
    let sj = response_json(st).await;
    assert_eq!(sj.get("error"), Some(&json!("unauthorized")));
    assert_eq!(sj.get("message"), Some(&json!("unauthorized")));
}

/// **93 · A-ME-003** → **§8.2 · F-004**：**`GET /api/v1/me/stats`** **`router::app`** 主栈 **`{ status, stats }`** 根形状（**`stats.orders_total`** 等 **MeCoreStats** 键）。
#[tokio::test]
async fn matrix_93_a_me_003b_f004_get_me_stats_ok_shape_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_me_003b_f004_get_me_stats_ok_shape_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = auth_app_stack_it_lock().lock().await;

    let email = format!("93-a-me-003b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_router(pool.clone());
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
                        "nickname": "me003bstats"
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
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .expect("register token")
        .to_string();

    let st = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/stats")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(st.status(), StatusCode::OK, "{:?}", response_json(st).await);
    let sj = response_json(st).await;
    assert_eq!(sj.get("status"), Some(&json!("ok")));
    let stats = sj
        .get("stats")
        .and_then(|s| s.as_object())
        .expect("stats object");
    assert!(
        stats.get("orders_total").map_or(false, |v| v.is_number()),
        "{stats:?}"
    );
    assert!(
        stats.get("total_spent").map_or(false, |v| v.is_number()),
        "{stats:?}"
    );
    assert!(
        stats.get("reviews_count").map_or(false, |v| v.is_number()),
        "{stats:?}"
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-ME-002** → **§8.2 · F-005**：**`PUT /api/v1/me`** **`router::app`** 主栈与 **`merge(auth|me)`** **`matrix_93_a_me_002_*`** 互补。
#[tokio::test]
async fn matrix_93_a_me_002b_f005_put_nickname_then_get_me_reflects_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_me_002b_f005_put_nickname_then_get_me_reflects_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = auth_app_stack_it_lock().lock().await;

    let email = format!("93-a-me-002b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_router(pool.clone());
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
                        "nickname": "beforeb"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();

    let put = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PUT)
                .uri("/api/v1/me")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from(json!({"nickname": "afterb"}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        put.status(),
        StatusCode::OK,
        "{:?}",
        response_json(put).await
    );

    let get = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(
        gj.pointer("/user/nickname").and_then(|n| n.as_str()),
        Some("afterb")
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-ME-002** → **§8.2 · F-005**：**`PUT /api/v1/me`** **`default_wallet_address`** → **`GET /api/v1/me`** 读回（**`router::app`**）。
#[tokio::test]
async fn matrix_93_a_me_005b_f005_put_default_wallet_then_get_me_reflects_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_me_005b_f005_put_default_wallet_then_get_me_reflects_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = auth_app_stack_it_lock().lock().await;

    let email = format!("93-a-me-005b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_router(pool.clone());
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
                        "nickname": "me005b"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();

    let wallet = "0x2222222222222222222222222222222222222222";
    let put = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PUT)
                .uri("/api/v1/me")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from(
                    json!({ "default_wallet_address": wallet }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        put.status(),
        StatusCode::OK,
        "{:?}",
        response_json(put).await
    );

    let get = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    assert_eq!(
        gj.pointer("/user/default_wallet_address")
            .and_then(|v| v.as_str()),
        Some(wallet)
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-LOG-005** → **§8.2 · F-003**：**`logout`→`refresh`→401** **`router::app`** 主栈与 **`merge(auth|me)`** **`matrix_93_a_log_005_f003_*`** 互补。
#[tokio::test]
async fn matrix_93_a_log_005b_f003_post_auth_refresh_after_logout_unauthorized_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_log_005b_f003_post_auth_refresh_after_logout_unauthorized_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = auth_app_stack_it_lock().lock().await;

    let email = format!("93-a-log-005b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_router(pool.clone());
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
                        "nickname": "log005b"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|t| t.as_str())
        .unwrap()
        .to_string();

    let refr_ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/refresh")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "refresh_token": token.as_str() }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(refr_ok.status(), StatusCode::OK);
    let refreshed_token = response_json(refr_ok)
        .await
        .get("token")
        .and_then(|t| t.as_str())
        .expect("refreshed token")
        .to_string();
    assert_ne!(refreshed_token, token);

    let out = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/logout")
                .header(header::AUTHORIZATION, auth_bearer_value(&refreshed_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(out.status(), StatusCode::OK);

    let refr_dead = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/refresh")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "refresh_token": refreshed_token.as_str() }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(refr_dead.status(), StatusCode::UNAUTHORIZED);
    let dj = response_json(refr_dead).await;
    assert_eq!(dj.get("error"), Some(&json!("invalid_token")));

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-PWD-001** → **§8.2 · F-006**：**`PUT /api/v1/me/password`** **`router::app`** 主栈与 **`merge(auth|me)`** **`matrix_93_a_pwd_001_change_password_revokes_session_new_login_ok`** 互补。
#[tokio::test]
async fn matrix_93_a_pwd_001b_f006_change_password_revokes_session_new_login_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_pwd_001b_f006_change_password_revokes_session_new_login_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = auth_app_stack_it_lock().lock().await;

    let email = format!("93-a-pwd-001b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_router(pool.clone());
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
                        "nickname": "pwd001b"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();

    let ch = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PUT)
                .uri("/api/v1/me/password")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from(
                    json!({
                        "old_password": "TestPass12!",
                        "new_password": "NewPass345!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ch.status(), StatusCode::OK, "{:?}", response_json(ch).await);

    assert!(
        db::get_user_id_by_token(&pool, token.as_str())
            .await
            .unwrap()
            .is_none(),
        "sessions revoked after password change (A-PWD-001 app_stack)"
    );

    let me_dead = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_dead.status(), StatusCode::UNAUTHORIZED);

    let login = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "NewPass345!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        login.status(),
        StatusCode::OK,
        "{:?}",
        response_json(login).await
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-REG-002** → **§8.2 · F-001**：**`verify-email`** **`router::app`** 主栈与 **`merge(auth|me)`** **`matrix_93_a_reg_002_f001_*`** 互补（**`test_auth_mail_env_mutex`** + **`ForgotResetTestEnvGuard`** + **`email_transport` raw**）。
#[tokio::test]
async fn matrix_93_a_reg_002b_f001_post_verify_email_ok_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_reg_002b_f001_post_verify_email_ok_app_stack_ok_pg (DATABASE_URL unset)");
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let _ = email_transport::test_take_email_verify_raw_for_it();

    let _lock = auth_app_stack_it_lock().lock().await;

    let email = format!("93-a-reg-002b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_router(pool.clone());
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
                        "nickname": "reg002b"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let reg_j = response_json(reg).await;
    assert_eq!(
        reg_j.get("email_verification_token_issued"),
        Some(&json!(true)),
        "pepper must be set for email verify IT"
    );
    let token = reg_j
        .get("token")
        .and_then(|t| t.as_str())
        .expect("session token")
        .to_string();

    let raw =
        email_transport::test_take_email_verify_raw_for_it().expect("email_verify raw for IT");
    assert!(!raw.is_empty());

    let ver = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/verify-email")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "token": raw }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ver.status(), StatusCode::OK);
    let ver_j = response_json(ver).await;
    assert_eq!(ver_j.get("message"), Some(&json!("email_verified")));

    let me = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me.status(), StatusCode::OK);
    let mj = response_json(me).await;
    assert!(
        mj.pointer("/user/email_verified_at")
            .and_then(|v| v.as_str())
            .is_some_and(|s| !s.is_empty()),
        "user.email_verified_at after verify: {:?}",
        mj
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-REG-001** → **§8.2 · F-001**：**`POST /auth/register`** **`router::app`** 主栈与 **`merge(auth|me)`** **`matrix_93_a_reg_001_register_success_pg_users_row`** 互补（**`users`** **PG** **`COUNT(*)=1`**）。
#[tokio::test]
async fn matrix_93_a_reg_001b_f001_register_success_pg_users_row_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_reg_001b_f001_register_success_pg_users_row_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = auth_app_stack_it_lock().lock().await;

    let email = format!("93-a-reg-001b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_router(pool.clone());
    let reg = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!",
                        "nickname": "m93regb"
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

    let cnt: i64 =
        sqlx::query_scalar("SELECT COUNT(*)::bigint FROM users WHERE lower(email) = lower($1)")
            .bind(&email)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(cnt, 1, "A-REG-001 app_stack expects users row");

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-LOG-003** → **§8.2 · F-003**：**`POST /auth/logout`** 后 **`GET /api/v1/me`** **401** **`router::app`** 主栈与 **`merge(auth|me)`** **`matrix_93_a_log_003_logout_then_get_me_401`** 互补。
#[tokio::test]
async fn matrix_93_a_log_003b_f003_logout_then_get_me_unauthorized_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_log_003b_f003_logout_then_get_me_unauthorized_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = auth_app_stack_it_lock().lock().await;

    let email = format!("93-a-log-003b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_router(pool.clone());
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
                        "nickname": "m93outb"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();

    let logout = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/logout")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(logout.status(), StatusCode::OK);

    let me_401 = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_401.status(), StatusCode::UNAUTHORIZED);

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-LOG-003** → **§8.2 · F-003**：主栈 **`POST /auth/logout`** 仅 **`Cookie: traveltrust_session_token`**（无 **`Authorization`**）删除 **`sessions`**；后续 **`GET /me`** **401**（与 **`pg_logout_cookie_only_*`** / **`matrix_93_a_log_003b_*`** 互补）。
#[tokio::test]
async fn matrix_93_a_log_003c_f003_cookie_only_logout_then_me_unauthorized_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_log_003c_f003_cookie_only_logout_then_me_unauthorized_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = auth_app_stack_it_lock().lock().await;

    let email = format!("93-a-log-003c-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_router(pool.clone());
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
                        "nickname": "m93outc"
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
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|t| t.as_str())
        .expect("token")
        .to_string();
    assert!(token.starts_with("tts_"));

    let cookie = format!("{}={}", SESSION_COOKIE_NAME_LEGACY, token);
    let me_ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::COOKIE, &cookie)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_ok.status(), StatusCode::OK);

    let logout = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/logout")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::COOKIE, &cookie)
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(logout.status(), StatusCode::OK);

    assert!(
        db::get_user_id_by_token(&pool, &token)
            .await
            .expect("get_user_id_by_token after cookie logout app_stack")
            .is_none(),
        "PostgreSQL session must be removed after cookie-only logout (app_stack)"
    );

    let me_401 = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::COOKIE, &cookie)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_401.status(), StatusCode::UNAUTHORIZED);

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-LOG-004** → **§8.2 · F-002**：主栈 **`POST /auth/refresh`** 仅 **`Cookie`**（空 body）轮换 **`sessions`**（与 **`pg_post_auth_refresh_cookie_only_*`** / **`matrix_93_a_log_004b_*`** 互补）。
#[tokio::test]
async fn matrix_93_a_log_004c_f002_cookie_only_refresh_rotates_token_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_log_004c_f002_cookie_only_refresh_rotates_token_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _lock = auth_app_stack_it_lock().lock().await;

    let email = format!("93-a-log-004c-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_router(pool.clone());
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
                        "nickname": "m93out4c"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let token = response_json(reg)
        .await
        .get("token")
        .and_then(|t| t.as_str())
        .expect("token")
        .to_string();
    assert!(token.starts_with("tts_"));

    let cookie = format!("{}={}", SESSION_COOKIE_NAME_LEGACY, token);
    let refr = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/refresh")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::COOKIE, &cookie)
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(refr.status(), StatusCode::OK);
    let refresh_set_cookies: Vec<String> = refr
        .headers()
        .get_all(header::SET_COOKIE)
        .iter()
        .filter_map(|v| v.to_str().ok().map(str::to_string))
        .collect();
    let rj = response_json(refr).await;
    let refreshed = refreshed_session_token_from_refresh_parts(&rj, &refresh_set_cookies);
    assert!(refreshed.starts_with("tts_"));
    assert_ne!(refreshed, token.as_str());
    assert_eq!(rj.get("status"), Some(&json!("ok")));

    assert!(
        db::get_user_id_by_token(&pool, &token)
            .await
            .expect("old token lookup app_stack cookie refresh")
            .is_none(),
        "old session token must not resolve after rotate"
    );
    assert!(
        db::get_user_id_by_token(&pool, refreshed.as_str())
            .await
            .expect("new token lookup app_stack cookie refresh")
            .is_some(),
        "new session token must resolve in PostgreSQL"
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-PWD-002** → **§8.2 · F-006**：**forgot→reset→新密登录** **`router::app`** 主栈与 **`merge(auth|me)`** **`matrix_93_a_pwd_002_f006_*`** 互补。
#[tokio::test]
async fn matrix_93_a_pwd_002b_f006_forgot_reset_password_new_login_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_pwd_002b_f006_forgot_reset_password_new_login_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let _ = email_transport::test_take_password_reset_raw_for_it();

    let _lock = auth_app_stack_it_lock().lock().await;

    let email = format!("93-a-pwd-002b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_router(pool.clone());
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
                        "nickname": "pwd002b"
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

    let forgot = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/forgot-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "email": &email }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(forgot.status(), StatusCode::OK);
    let forgot_j = response_json(forgot).await;
    assert_eq!(
        forgot_j.get("message"),
        Some(&json!("if_account_exists_email_sent"))
    );

    let raw = email_transport::test_take_password_reset_raw_for_it()
        .expect("password_reset raw captured for IT");
    assert!(!raw.is_empty(), "reset raw token");

    let reset = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/reset-password")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "token": raw,
                        "new_password": "ResetPass56!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reset.status(), StatusCode::OK);
    let reset_j = response_json(reset).await;
    assert_eq!(reset_j.get("message"), Some(&json!("password_reset")));

    let login_bad = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(login_bad.status(), StatusCode::UNAUTHORIZED);

    let login_ok = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "ResetPass56!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        login_ok.status(),
        StatusCode::OK,
        "{:?}",
        response_json(login_ok).await
    );

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn auth_audit_fail_closed_forced_insert_fail_turns_invalid_bearer_into_503() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: auth_audit_fail_closed_forced_insert_fail_turns_invalid_bearer_into_503 (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = AUTH_AUDIT_IT_MUTEX.lock().expect("auth_audit_it serial");
    let _env = AuthAuditFailClosedTestEnvGuard::set(true);
    let app = db_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(
                    header::AUTHORIZATION,
                    auth_bearer_value("tts_invalid_forced_audit_fail"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    let j = response_json(res).await;
    assert_eq!(j.get("error"), Some(&json!("session_db_unavailable")));
}

#[tokio::test]
async fn auth_audit_fail_open_forced_insert_fail_keeps_invalid_bearer_401() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: auth_audit_fail_open_forced_insert_fail_keeps_invalid_bearer_401 (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = AUTH_AUDIT_IT_MUTEX.lock().expect("auth_audit_it serial");
    let _env = AuthAuditFailClosedTestEnvGuard::set(false);
    let app = db_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(
                    header::AUTHORIZATION,
                    auth_bearer_value("tts_invalid_forced_audit_fail"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    let j = response_json(res).await;
    assert_eq!(j.get("error"), Some(&json!("login_required")));
}
