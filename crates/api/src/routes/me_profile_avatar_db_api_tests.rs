//! **F-007 · API·IT（PostgreSQL + 本机头像路径）**：注册 → **`POST /api/v1/me/profile-avatar`**（**`content_base64`**）→ **`GET /api/v1/me`** 可见 **`user.avatar_url`**（**`/api/v1/uploads/profile-avatars/<user_id>.jpg`**）。
//!
//! **93**：**`matrix_93_a_ava_001_*`** ↔ **A-AVA-001**/**F-007**（**§1**；**`spec/93-全站功能验证矩阵-域别回归清单.md`**）；**`matrix_93_a_ava_001b_f007_*`** ↔ **A-AVA-001**/**F-007**（**`router::app`**；**v1.4.255**）。
//!
//! **范围**：**无** **`PROFILE_AVATAR_S3_*`** 时的 **ephemeral local** 落盘 + **`users.avatar_url`**。**S3/MinIO 正路径**（**A-AVA-002**）见 **`me_profile_avatar_s3_minio_db_api_tests`**（**`TRAVELTRUST_PROFILE_AVATAR_S3_MINIO_IT=1`**；**ISS-008** **运维残余** 仍见 **95 §9**）。
//!
//! **跳过条件**：未设置 **`DATABASE_URL`**（与 **`auth_register_login_logout_db_api_tests`** 同源）。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use base64::Engine;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::path::PathBuf;
use std::sync::{Arc, OnceLock};
use tokio::sync::{Mutex as TokioMutex, RwLock};
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::db;
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::routes::{auth, me};
use crate::state::test_support::api_meta_state;

static ME_AVATAR_APP_STACK_IT_LOCK: OnceLock<TokioMutex<()>> = OnceLock::new();

fn me_avatar_app_stack_it_lock() -> &'static TokioMutex<()> {
    ME_AVATAR_APP_STACK_IT_LOCK.get_or_init(|| TokioMutex::new(()))
}

/// 最小 **1×1** JPEG（与 **`post_me_profile_avatar`** 魔数校验一致）。
const MIN_JPEG_1X1: &[u8] = &[
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
    0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
    0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
    0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
    0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
    0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
    0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xff, 0xc4, 0x00, 0x14,
    0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x37, 0xff, 0xd9,
];

async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

fn db_router(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    Router::new()
        .merge(auth::router())
        .merge(me::router())
        .with_state(api_meta_state(Some(chain_off)))
}

fn app_stack_router(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

async fn response_json(res: axum::response::Response) -> Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

fn auth_bearer_value(token: impl AsRef<str>) -> axum::http::HeaderValue {
    format!("Bearer {}", token.as_ref())
        .parse()
        .expect("bearer header value")
}

async fn cleanup_user_by_email(pool: &PgPool, email: &str) {
    let _ = sqlx::query(
        r#"DELETE FROM sessions USING users u
           WHERE sessions.user_id = u.id AND lower(u.email) = lower($1)"#,
    )
    .bind(email)
    .execute(pool)
    .await;
    let _ = sqlx::query("DELETE FROM users WHERE lower(email) = lower($1)")
        .bind(email)
        .execute(pool)
        .await;
}

#[tokio::test]
async fn matrix_93_a_ava_001_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_ava_001_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_pg (DATABASE_URL unset)"
        );
        return;
    };

    let email = format!("me-avatar-db-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "av_it"
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
        .unwrap()
        .to_string();

    let uid = db::get_user_id_by_token(&pool, &token)
        .await
        .expect("get_user_id_by_token")
        .expect("session user");
    let expected_path = format!("/api/v1/uploads/profile-avatars/{}.jpg", uid);
    let b64 = base64::engine::general_purpose::STANDARD.encode(MIN_JPEG_1X1);
    let data_url = format!("data:image/jpeg;base64,{}", b64);

    let post_av = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/profile-avatar")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from(
                    json!({ "content_base64": data_url }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        post_av.status(),
        StatusCode::OK,
        "{:?}",
        response_json(post_av).await
    );
    let pj = response_json(post_av).await;
    assert_eq!(
        pj.pointer("/avatar_url").and_then(|x| x.as_str()),
        Some(expected_path.as_str())
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
        gj.pointer("/user/avatar_url").and_then(|x| x.as_str()),
        Some(expected_path.as_str())
    );

    let path = PathBuf::from("data")
        .join("profile_avatars")
        .join(format!("{}.jpg", uid));
    let _ = std::fs::remove_file(&path);

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-AVA-001** → **§8.2 · F-007**：本机 **`POST …/profile-avatar`** → **`GET /me`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg(
) {
    let _lock = me_avatar_app_stack_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_ava_001b_f007_post_profile_avatar_local_persists_avatar_url_on_get_me_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let email = format!("me-avatar-app-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "av_app"
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
        .unwrap()
        .to_string();

    let uid = db::get_user_id_by_token(&pool, &token)
        .await
        .expect("get_user_id_by_token")
        .expect("session user");
    let expected_path = format!("/api/v1/uploads/profile-avatars/{}.jpg", uid);
    let b64 = base64::engine::general_purpose::STANDARD.encode(MIN_JPEG_1X1);
    let data_url = format!("data:image/jpeg;base64,{}", b64);

    let post_av = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/profile-avatar")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from(
                    json!({ "content_base64": data_url }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        post_av.status(),
        StatusCode::OK,
        "{:?}",
        response_json(post_av).await
    );
    let pj = response_json(post_av).await;
    assert_eq!(
        pj.pointer("/avatar_url").and_then(|x| x.as_str()),
        Some(expected_path.as_str())
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
        gj.pointer("/user/avatar_url").and_then(|x| x.as_str()),
        Some(expected_path.as_str())
    );

    let path = PathBuf::from("data")
        .join("profile_avatars")
        .join(format!("{}.jpg", uid));
    let _ = std::fs::remove_file(&path);

    cleanup_user_by_email(&pool, &email).await;
}
