use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::support::*;

/// **93 · A-LOG-002** → **§8.2 · F-002**：**`POST /auth/login`** 后 **连续两次** **`GET /api/v1/me`** **200**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_a_log_002b_f002_login_then_get_me_twice_200_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_log_002b_f002_login_then_get_me_twice_200_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let email = format!("93-a-log-002b-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;

    let _lock = auth_app_stack_it_lock().lock().await;
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
                        "nickname": "m93log2b"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    let login = app
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
        login.status(),
        StatusCode::OK,
        "{:?}",
        response_json(login).await
    );
    let token = response_json(login)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .expect("login token")
        .to_string();

    let me1 = app
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
    assert_eq!(me1.status(), StatusCode::OK);
    let j1 = response_json(me1).await;
    assert!(j1.get("user").is_some(), "{j1:?}");
    let u1 = j1["user"]["id"].as_str().expect("user id").to_string();

    let me2 = app
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
    assert_eq!(me2.status(), StatusCode::OK);
    let j2 = response_json(me2).await;
    let u2 = j2["user"]["id"].as_str().expect("user id").to_string();
    assert_eq!(u1, u2);

    cleanup_user_by_email(&pool, &email).await;
}
/// **93 · A-LOG-003** → **§8.2 · F-003**：`POST /auth/logout` 后 **`GET /api/v1/me`** **401**。
#[tokio::test]
async fn matrix_93_a_log_003_logout_then_get_me_401() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_log_003_logout_then_get_me_401 (DATABASE_URL unset)");
        return;
    };
    let email = format!("93-a-log-003-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "m93out"
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
/// **93 · A-ME-001** → **§8.2 · F-004**：注册后 **`GET /api/v1/me`** **200**，**`user.email` / `user.nickname`** 与账号一致。
#[tokio::test]
async fn matrix_93_a_me_001_register_then_get_me_user_fields_match() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_me_001_register_then_get_me_user_fields_match (DATABASE_URL unset)"
        );
        return;
    };
    let email = format!("93-a-me-001-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "me001nick"
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
        Some("me001nick")
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-ME-002** → **§8.2 · F-005**：**`PUT /api/v1/me`** 改昵称 → **`GET /api/v1/me`** 再读一致（**PG**）。
#[tokio::test]
async fn matrix_93_a_me_002_put_nickname_then_get_me_reflects_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_me_002_put_nickname_then_get_me_reflects_pg (DATABASE_URL unset)"
        );
        return;
    };
    let email = format!("93-a-me-002-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "before"
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
                .body(Body::from(json!({"nickname": "after"}).to_string()))
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
        Some("after")
    );

    cleanup_user_by_email(&pool, &email).await;
}
