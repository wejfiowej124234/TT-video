use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db;
use crate::email_transport;
use crate::session_cookie::SESSION_COOKIE_NAME_LEGACY;

use super::env_guards::*;
use super::support::*;

/// **93 · A-LOG-003** → **§8.2 · F-003**：主栈 **`POST /auth/logout`** 仅 **`Cookie: traveltrust_session_token`**（无 **`Authorization`**）删除 **`sessions`**；后续 **`GET /me`** **401**（与 **`pg_logout_cookie_only_*`** / **`matrix_93_a_log_003b_*`** 互补）。
#[tokio::test]
async fn matrix_93_a_log_003c_f003_cookie_only_logout_then_me_unauthorized_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_log_003c_f003_cookie_only_logout_then_me_unauthorized_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
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
    }
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
    }
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
    };    let _serial = AUTH_AUDIT_IT_MUTEX.lock().expect("auth_audit_it serial");
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
