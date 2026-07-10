use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::support::*;

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
        stats.get("orders_total").is_some_and(|v| v.is_number()),
        "{stats:?}"
    );
    assert!(
        stats.get("total_spent").is_some_and(|v| v.is_number()),
        "{stats:?}"
    );
    assert!(
        stats.get("reviews_count").is_some_and(|v| v.is_number()),
        "{stats:?}"
    );

    cleanup_user_by_email(&pool, &email).await;
}
