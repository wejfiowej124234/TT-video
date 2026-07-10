use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db;
use crate::session_cookie::SESSION_COOKIE_NAME_LEGACY;

use super::support::*;

#[tokio::test]
async fn register_creates_pg_session_logout_deletes_me_401() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: register_creates_pg_session_logout_deletes_me_401 (DATABASE_URL unset)");
        return;
    };
    let email = format!("auth-db-it-{}@traveltrust.test", Uuid::new_v4());
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
                        "email": email,
                        "password": "TestPass12!",
                        "nickname": "db_it"
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
    let reg_j = response_json(reg).await;
    let token = reg_j
        .get("token")
        .and_then(|t| t.as_str())
        .expect("token")
        .to_string();
    assert!(token.starts_with("tts_"));

    let uid = db::get_user_id_by_token(&pool, &token)
        .await
        .expect("get_user_id_by_token")
        .expect("session row after register");

    let me_ok = app
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
    assert_eq!(me_ok.status(), StatusCode::OK);

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

    assert!(
        db::get_user_id_by_token(&pool, &token)
            .await
            .expect("get_user_id_by_token 2")
            .is_none(),
        "session row must be deleted in PostgreSQL"
    );

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

    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(uid)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(uid)
        .execute(&pool)
        .await;
}

/// **PG**：**`POST /auth/logout`** 仅 **`Cookie: traveltrust_session_token`**（无 **`Authorization`**）删除 **`sessions`** 行；后续 **`GET /me`** **401**。
#[tokio::test]
async fn pg_logout_cookie_only_deletes_session_and_me_unauthorized() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: pg_logout_cookie_only_deletes_session_and_me_unauthorized (DATABASE_URL unset)"
        );
        return;
    };
    let email = format!("auth-db-cookie-logout-{}@traveltrust.test", Uuid::new_v4());
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
                        "email": email,
                        "password": "TestPass12!",
                        "nickname": "cookie_logout_pg"
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
            .expect("get_user_id_by_token after cookie logout")
            .is_none(),
        "PostgreSQL session must be removed after cookie-only logout"
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

/// **PG**：**`POST /auth/refresh`** 仅 **`Cookie`**（空 body）轮换 **`sessions`** token（与 **`routes/auth`** 从 Cookie 注入 `refresh_token` 同源）。
#[tokio::test]
async fn pg_post_auth_refresh_cookie_only_rotates_session_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: pg_post_auth_refresh_cookie_only_rotates_session_pg (DATABASE_URL unset)");
        return;
    };
    let email = format!("auth-db-cookie-refresh-{}@traveltrust.test", Uuid::new_v4());
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
                        "email": email,
                        "password": "TestPass12!",
                        "nickname": "cookie_refresh_pg"
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
    assert_eq!(
        refr.status(),
        StatusCode::OK,
        "{:?}",
        response_json(refr).await
    );
    let rj = response_json(refr).await;
    let refreshed = rj
        .get("token")
        .and_then(|t| t.as_str())
        .expect("refreshed token");
    assert!(refreshed.starts_with("tts_"));
    assert_ne!(refreshed, token.as_str());
    assert_eq!(rj.get("status"), Some(&json!("ok")));

    assert!(
        db::get_user_id_by_token(&pool, &token)
            .await
            .expect("old token lookup")
            .is_none(),
        "old session token must not resolve after rotate"
    );
    assert!(
        db::get_user_id_by_token(&pool, refreshed)
            .await
            .expect("new token lookup")
            .is_some(),
        "new session token must resolve in PostgreSQL"
    );

    cleanup_user_by_email(&pool, &email).await;
}
