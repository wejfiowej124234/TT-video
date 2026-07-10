use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db;

use super::env_guards::*;
use super::support::*;

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
                        "new_password": "ResetPass56!",
                        "email": &email
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
    clear_auth_email_send_windows_for_it(&pool).await;
    let _forgot_per_email_off = ForgotPerEmailRateLimitEnvGuard::set(0, 3600);
    let _forgot_risk_off = ForgotRiskRateLimitEnvGuard::set(0, 3600, 0, 60);
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
    clear_auth_email_send_windows_for_it(&pool).await;
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
