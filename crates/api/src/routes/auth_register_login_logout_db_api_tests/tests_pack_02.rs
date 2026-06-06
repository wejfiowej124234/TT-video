use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db;

use super::support::*;

#[tokio::test]
async fn put_me_password_revokes_pg_session_login_with_new_password() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: put_me_password_revokes_pg_session_login_with_new_password (DATABASE_URL unset)"
        );
        return;
    }
    let email = format!("me-pw-db-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "pw"
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
        "sessions revoked after password change"
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
/// **93 · A-REG-001** → **§8.2 · F-001**：`POST /auth/register` **200** 且 **`users`** 落行（**`DATABASE_URL` + `Router::oneshot`**）。
#[tokio::test]
async fn matrix_93_a_reg_001_register_success_pg_users_row() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_reg_001_register_success_pg_users_row (DATABASE_URL unset)");
        return;
    }
    let email = format!("93-a-reg-001-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "m93reg"
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

    let cnt: i64 =
        sqlx::query_scalar("SELECT COUNT(*)::bigint FROM users WHERE lower(email) = lower($1)")
            .bind(&email)
            .fetch_one(&pool)
            .await
            .unwrap();
    assert_eq!(cnt, 1, "A-REG-001 expects users row");

    cleanup_user_by_email(&pool, &email).await;
}
/// **93 · A-LOG-001** → **§8.2 · F-002**：`POST /auth/login` **200** + **`GET /api/v1/me`** **200**（Bearer）。
#[tokio::test]
async fn matrix_93_a_log_001_login_then_get_me_200() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_log_001_login_then_get_me_200 (DATABASE_URL unset)");
        return;
    }
    let email = format!("93-a-log-001-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "m93log"
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

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-LOG-001** → **§8.2 · F-002**：`POST /auth/login` **200** + **`GET /api/v1/me`** **200**（Bearer；**`router::app`**）。
#[tokio::test]
async fn matrix_93_a_log_001b_f002_login_then_get_me_200_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_log_001b_f002_login_then_get_me_200_app_stack_ok_pg (DATABASE_URL unset)");
        return;
    }
    let email = format!("93-a-log-001b-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "m93logb"
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

    cleanup_user_by_email(&pool, &email).await;
}
