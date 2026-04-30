//! **F-007** · **`POST …/profile-avatar/presign|commit`** **`Router::oneshot`** 负例（**不**依赖真实 S3；**不**替代 **ISS-008** **presign→PUT→commit** 成功路径）。
//!
//! **与** **`me_profile_avatar_db_api_tests`**：**本机** **`POST …/profile-avatar`** **PG·IT** 互补；本文件 **`presign_storage_not_configured_*`** 子测在 **`DATABASE_URL` 已设** 时临时 **`remove_var`** **`PROFILE_AVATAR_S3_BUCKET`**/**`PROFILE_AVATAR_PUBLIC_BASE_URL`**（**`Drop` 还原**），避免污染并行测例宿主环境。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::routes::{auth, me};
use crate::state::test_support::api_meta_state;

const PROFILE_AVATAR_ENV_KEYS: [&str; 2] =
    ["PROFILE_AVATAR_S3_BUCKET", "PROFILE_AVATAR_PUBLIC_BASE_URL"];

struct ProfileAvatarEnvGuard {
    /// 须先于 **`saved`** 释放：先还原 **`PROFILE_AVATAR_*`**，再放开并行锁（见 **`profile_avatar_env_serial`**）。
    _serial: std::sync::MutexGuard<'static, ()>,
    saved: [Option<String>; 2],
}

impl ProfileAvatarEnvGuard {
    fn clear_s3_public_pair() -> Self {
        let _serial = super::profile_avatar_env_serial::lock_profile_avatar_test_env();
        let saved = [
            std::env::var(PROFILE_AVATAR_ENV_KEYS[0]).ok(),
            std::env::var(PROFILE_AVATAR_ENV_KEYS[1]).ok(),
        ];
        for k in PROFILE_AVATAR_ENV_KEYS {
            std::env::remove_var(k);
        }
        Self { _serial, saved }
    }
}

impl Drop for ProfileAvatarEnvGuard {
    fn drop(&mut self) {
        for (i, k) in PROFILE_AVATAR_ENV_KEYS.iter().enumerate() {
            match &self.saved[i] {
                Some(v) => std::env::set_var(k, v),
                None => std::env::remove_var(k),
            }
        }
    }
}

fn me_only_router(chain_off: Option<ChainOffState>) -> Router {
    me::router().with_state(api_meta_state(chain_off))
}

fn minimal_chain_off_no_pool() -> ChainOffState {
    ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    }
}

async fn response_json(res: axum::response::Response) -> Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

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
async fn post_profile_avatar_presign_without_chain_off_returns_503() {
    let app = me_only_router(None);
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/profile-avatar/presign")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"content_type": "image/jpeg", "content_length": 100}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    let v = response_json(res).await;
    assert_eq!(v["error"], "chain_off_unavailable");
    assert_eq!(v["path"], "POST /api/v1/me/profile-avatar/presign");
}

#[tokio::test]
async fn post_profile_avatar_commit_without_chain_off_returns_503() {
    let app = me_only_router(None);
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/profile-avatar/commit")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"avatar_url": "https://cdn.example.com/p/x.jpg"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    let v = response_json(res).await;
    assert_eq!(v["error"], "chain_off_unavailable");
}

#[tokio::test]
async fn post_profile_avatar_presign_without_session_returns_401() {
    let app = me_only_router(Some(minimal_chain_off_no_pool()));
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/profile-avatar/presign")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"content_type": "image/jpeg", "content_length": 100}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    let v = response_json(res).await;
    assert_eq!(v["error"], "login_required");
}

#[tokio::test]
async fn post_profile_avatar_commit_without_session_returns_401() {
    let app = me_only_router(Some(minimal_chain_off_no_pool()));
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/profile-avatar/commit")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"avatar_url": "https://cdn.example.com/p/x.jpg"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    let v = response_json(res).await;
    assert_eq!(v["error"], "login_required");
}

#[tokio::test]
async fn post_profile_avatar_presign_storage_not_configured_returns_503_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: post_profile_avatar_presign_storage_not_configured_returns_503_pg (DATABASE_URL unset)");
        return;
    };
    let _guard = ProfileAvatarEnvGuard::clear_s3_public_pair();

    let email = format!("me-presign-503-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "p503"
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

    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/profile-avatar/presign")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from(
                    json!({"content_type": "image/jpeg", "content_length": 100}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    let v = response_json(res).await;
    assert_eq!(v["error"], "avatar_object_storage_not_configured");

    cleanup_user_by_email(&pool, &email).await;
}

#[tokio::test]
async fn post_profile_avatar_commit_storage_not_configured_returns_503_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: post_profile_avatar_commit_storage_not_configured_returns_503_pg (DATABASE_URL unset)");
        return;
    };
    let _guard = ProfileAvatarEnvGuard::clear_s3_public_pair();

    let email = format!("me-commit-503-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "c503"
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

    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/profile-avatar/commit")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from(
                    json!({"avatar_url": "https://cdn.example.com/profile-avatars/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/n.jpg"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    let v = response_json(res).await;
    assert_eq!(v["error"], "avatar_object_storage_not_configured");

    cleanup_user_by_email(&pool, &email).await;
}
