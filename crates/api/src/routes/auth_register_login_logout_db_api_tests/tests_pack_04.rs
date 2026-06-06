use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db;
use crate::email_transport;

use super::env_guards::*;
use super::support::*;

/// **93 · A-PWD-001** → **§8.2 · F-006**：**`PUT /api/v1/me/password`** 成功 → 旧 **Bearer** **`GET /me`** **401** → 新密码 **`POST /auth/login`** **200**（**MANUAL-P1** 用例的 **PG·oneshot** 回填；见模块头 **ISS-007** 互指）。
#[tokio::test]
async fn matrix_93_a_pwd_001_change_password_revokes_session_new_login_ok() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_pwd_001_change_password_revokes_session_new_login_ok (DATABASE_URL unset)");
        return;
    }
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
#[tokio::test]
async fn matrix_93_a_pwd_002_f006_forgot_reset_password_new_login_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_pwd_002_f006_forgot_reset_password_new_login_ok_pg (DATABASE_URL unset)");
        return;
    }
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
    }
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
    assert_eq!(
        second
            .headers()
            .get(header::RETRY_AFTER)
            .and_then(|h| h.to_str().ok()),
        Some("3600"),
        "Retry-After must match JSON retry_after_* (routes/auth → status_json_response_with_429_retry_header)"
    );
    let second_j = response_json(second).await;
    assert_eq!(
        second_j.get("error"),
        Some(&json!("auth_login_per_email_rate_limited"))
    );
    assert_eq!(second_j.get("retry_after_sec"), Some(&json!(3600)));
    assert_eq!(second_j.get("retry_after_seconds"), Some(&json!(3600)));

    cleanup_user_by_email(&pool, &email).await;
}
