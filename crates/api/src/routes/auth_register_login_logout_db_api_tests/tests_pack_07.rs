use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db;
use crate::email_transport;

use super::env_guards::*;
use super::support::*;

/// P1: 登录防枚举——不存在账号与错误密码均返回同一错误键与状态码。
#[tokio::test]
async fn login_not_found_and_wrong_password_have_same_contract_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: login_not_found_and_wrong_password_have_same_contract_pg (DATABASE_URL unset)"
        );
        return;
    }
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
    }
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
    }
    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    clear_auth_email_send_windows_for_it(&pool).await;
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
    assert_eq!(
        limited
            .headers()
            .get(header::RETRY_AFTER)
            .and_then(|h| h.to_str().ok()),
        Some("3600")
    );
    let limited_j = response_json(limited).await;
    assert_eq!(
        limited_j.get("error"),
        Some(&json!("auth_login_per_email_rate_limited"))
    );
    assert_eq!(limited_j.get("retry_after_sec"), Some(&json!(3600)));
    assert_eq!(limited_j.get("retry_after_seconds"), Some(&json!(3600)));

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
