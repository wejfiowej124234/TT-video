use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::email_transport;

use super::env_guards::*;
use super::support::*;

#[tokio::test]
async fn forgot_password_per_ip_rate_limited_keeps_uniform_response_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: forgot_password_per_ip_rate_limited_keeps_uniform_response_pg (DATABASE_URL unset)");
        return;
    }
    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    clear_auth_email_send_windows_for_it(&pool).await;
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
    }
    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    clear_auth_email_send_windows_for_it(&pool).await;
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
    assert_eq!(
        second
            .headers()
            .get(header::RETRY_AFTER)
            .and_then(|h| h.to_str().ok()),
        Some("3600"),
        "per-IP login limit: Retry-After must match AUTH_LOGIN_PER_IP_WINDOW_SECS and JSON retry_after_*"
    );
    let second_j = response_json(second).await;
    assert_eq!(
        second_j.get("error"),
        Some(&json!("auth_login_per_ip_rate_limited"))
    );
    assert_eq!(second_j.get("retry_after_sec"), Some(&json!(3600)));
    assert_eq!(second_j.get("retry_after_seconds"), Some(&json!(3600)));

    cleanup_user_by_email(&pool, &email).await;
}
#[tokio::test]
async fn forgot_password_global_rate_limited_keeps_uniform_response_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: forgot_password_global_rate_limited_keeps_uniform_response_pg (DATABASE_URL unset)");
        return;
    }
    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    clear_auth_email_send_windows_for_it(&pool).await;
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
    }
    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    clear_auth_email_send_windows_for_it(&pool).await;
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
    assert_eq!(
        second
            .headers()
            .get(header::RETRY_AFTER)
            .and_then(|h| h.to_str().ok()),
        Some("60"),
        "global login limit: Retry-After must match AUTH_LOGIN_GLOBAL_WINDOW_SECS and JSON retry_after_*"
    );
    let second_j = response_json(second).await;
    assert_eq!(
        second_j.get("error"),
        Some(&json!("auth_login_global_rate_limited"))
    );
    assert_eq!(second_j.get("retry_after_sec"), Some(&json!(60)));
    assert_eq!(second_j.get("retry_after_seconds"), Some(&json!(60)));

    cleanup_user_by_email(&pool, &email).await;
}
