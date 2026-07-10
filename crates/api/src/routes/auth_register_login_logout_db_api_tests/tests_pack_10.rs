use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::env_guards::*;
use super::support::*;

#[tokio::test]
async fn auth_wallet_failure_error_contract_smoke_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: auth_wallet_failure_error_contract_smoke_pg (DATABASE_URL unset)");
        return;
    };
    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    clear_auth_email_send_windows_for_it(&pool).await;
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
        login_limited
            .headers()
            .get(header::RETRY_AFTER)
            .and_then(|h| h.to_str().ok()),
        Some("3600")
    );
    let login_limited_j = response_json(login_limited).await;
    assert_eq!(
        login_limited_j.get("error"),
        Some(&json!("auth_login_per_email_rate_limited"))
    );
    assert_eq!(login_limited_j.get("retry_after_sec"), Some(&json!(3600)));
    assert_eq!(
        login_limited_j.get("retry_after_seconds"),
        Some(&json!(3600))
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
