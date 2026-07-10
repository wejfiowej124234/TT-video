use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db;
use crate::email_transport;

use super::env_guards::*;
use super::support::*;

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
