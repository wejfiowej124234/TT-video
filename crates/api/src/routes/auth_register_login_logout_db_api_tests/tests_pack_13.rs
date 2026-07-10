use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::support::*;

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
