use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::email_transport;

use super::env_guards::*;
use super::support::*;

/// P0: reset-password 成功后，重置前会话必须失效（旧 Bearer 访问 `/api/v1/me` 返回 401）。
#[tokio::test]
async fn forgot_reset_password_revokes_pre_reset_session_token_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: forgot_reset_password_revokes_pre_reset_session_token_pg (DATABASE_URL unset)"
        );
        return;
    }
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
    }
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
    }
    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    clear_auth_email_send_windows_for_it(&pool).await;
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
