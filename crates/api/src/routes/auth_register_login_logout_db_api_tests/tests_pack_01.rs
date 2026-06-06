use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db;

use super::support::*;

#[tokio::test]
async fn login_after_register_issues_distinct_pg_session() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: login_after_register_issues_distinct_pg_session (DATABASE_URL unset)");
        return;
    }
    let email = format!("auth-db-login-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "login_it"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let t1 = response_json(reg)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();

    let out = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/logout")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&t1))
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(out.status(), StatusCode::OK);

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
    let t2 = response_json(login)
        .await
        .get("token")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();
    assert_ne!(t1, t2);
    assert!(db::get_user_id_by_token(&pool, &t2)
        .await
        .expect("get uid t2")
        .is_some());

    let uid = db::get_user_id_by_token(&pool, &t2).await.unwrap().unwrap();
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(uid)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(uid)
        .execute(&pool)
        .await;
}
/// **`POST /auth/login`**：若 **`P3_SEED_ARBITRATOR_EMAIL`** 事后与邮箱对齐，将 **`users.role`** 从 **`tourist`** 升为 **`arbitrator`**（与注册时命中 seed 同源；修 **F-025** 陈旧 PG 行）。
#[tokio::test]
async fn login_upgrades_p3_seed_arbitrator_row_from_tourist_to_arbitrator_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: login_upgrades_p3_seed_arbitrator_row_from_tourist_to_arbitrator_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _lock = auth_app_stack_it_lock().lock().await;
    let prev_seed = std::env::var("P3_SEED_ARBITRATOR_EMAIL").ok();
    let _restore_seed = RestoreP3SeedArbitratorEmail {
        previous: prev_seed,
    };
    std::env::remove_var("P3_SEED_ARBITRATOR_EMAIL");

    let email = format!("p3-login-repair-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "p3_repair"
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
    assert_eq!(reg_j["role"], "tourist");

    std::env::set_var("P3_SEED_ARBITRATOR_EMAIL", &email);

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
    let login_j = response_json(login).await;
    assert_eq!(login_j["role"], "arbitrator");

    let db_role: String =
        sqlx::query_scalar("SELECT role FROM users WHERE lower(email) = lower($1)")
            .bind(&email)
            .fetch_one(&pool)
            .await
            .expect("db role");
    assert_eq!(db_role, "arbitrator");

    cleanup_user_by_email(&pool, &email).await;
}
#[tokio::test]
async fn put_me_updates_nickname_visible_on_get_me_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: put_me_updates_nickname_visible_on_get_me_pg (DATABASE_URL unset)");
        return;
    }
    let email = format!("me-put-db-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "n1"
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
                .body(Body::from(json!({"nickname": "n2"}).to_string()))
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
    assert_eq!(get.status(), StatusCode::OK);
    let gj = response_json(get).await;
    // 04 §3.4 / `get_me_impl`：`nickname` 在根级 `user` 下，非扁平字段。
    assert_eq!(
        gj.pointer("/user/nickname").and_then(|n| n.as_str()),
        Some("n2")
    );

    cleanup_user_by_email(&pool, &email).await;
}
