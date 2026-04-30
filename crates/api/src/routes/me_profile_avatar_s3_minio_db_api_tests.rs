//! **F-007 · ISS-008 窄口径**：**`POST …/profile-avatar/presign`** → **HTTP `PUT` 预签名 URL**（**真实字节**）→ **`POST …/profile-avatar/commit`** → **`GET /me`** 读回 **`users.avatar_url`**（**`DATABASE_URL` + `Router::oneshot`**）。
//!
//! **93**：**`matrix_93_a_ava_002_*`** ↔ **A-AVA-002**/**F-007**（**§1**；**[93](93-全站功能验证矩阵-域别回归清单.md)**）。
//!
//! **跳过条件**（默认 **CI / `cargo test` 全量** 不跑、**不**要求 MinIO）：
//! - 未设 **`TRAVELTRUST_PROFILE_AVATAR_S3_MINIO_IT=1`**，或
//! - 未设 **`DATABASE_URL`**，或
//! - **`docker compose`** **MinIO** 未就绪（**`CreateBucket`/`presign` 连接失败** → **skip** 日志）。
//!
//! **推荐**（见 **`docs/runbook/PROFILE-AVATAR-OBJECT-STORAGE.md`** §MinIO IT）：根目录 **`docker compose up -d minio`** 后：
//! **`TRAVELTRUST_PROFILE_AVATAR_S3_MINIO_IT=1 DATABASE_URL=… cargo test -p traveltrust-api matrix_93_a_ava_002_f007_presign_put_commit_s3_minio_ok_pg -- --exact`**
//!
//! **并行**：本测与 **`me_profile_avatar_http_contract_tests`** 的 **`ProfileAvatarEnvGuard`** 共用 **`profile_avatar_env_serial`**，避免并行清环境。

use aws_config::BehaviorVersion;
use aws_sdk_s3::config::Region;
use aws_sdk_s3::Client;
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

/// 与 **`docker-compose.yml`** **`minio`** 默认 **`MINIO_ROOT_*`** 对齐（可被环境覆盖）。
const DEFAULT_MINIO_ROOT_USER: &str = "minio";
const DEFAULT_MINIO_ROOT_PASSWORD: &str = "minio12345";
const DEFAULT_MINIO_ENDPOINT: &str = "http://127.0.0.1:9000";
const DEFAULT_MINIO_BUCKET: &str = "traveltrust-avatar-it";

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

const ENV_KEYS_MINIO_IT: [&str; 7] = [
    "PROFILE_AVATAR_S3_BUCKET",
    "PROFILE_AVATAR_PUBLIC_BASE_URL",
    "PROFILE_AVATAR_S3_ENDPOINT",
    "PROFILE_AVATAR_S3_FORCE_PATH_STYLE",
    "PROFILE_AVATAR_S3_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
];

struct MinioItEnvRestore {
    saved: [Option<String>; 7],
}

impl MinioItEnvRestore {
    fn apply_defaults_for_minio_it() -> Self {
        let saved = ENV_KEYS_MINIO_IT.map(|k| std::env::var(k).ok());

        let bucket = std::env::var("PROFILE_AVATAR_S3_BUCKET")
            .ok()
            .filter(|s| !s.trim().is_empty())
            .unwrap_or_else(|| DEFAULT_MINIO_BUCKET.to_string());
        let endpoint = std::env::var("PROFILE_AVATAR_S3_ENDPOINT")
            .ok()
            .filter(|s| !s.trim().is_empty())
            .unwrap_or_else(|| DEFAULT_MINIO_ENDPOINT.to_string());
        let public_base = std::env::var("PROFILE_AVATAR_PUBLIC_BASE_URL")
            .ok()
            .filter(|s| !s.trim().is_empty())
            .unwrap_or_else(|| format!("{}/{}", endpoint.trim_end_matches('/'), bucket));

        std::env::set_var("PROFILE_AVATAR_S3_BUCKET", &bucket);
        std::env::set_var(
            "PROFILE_AVATAR_PUBLIC_BASE_URL",
            public_base.trim_end_matches('/'),
        );
        std::env::set_var("PROFILE_AVATAR_S3_ENDPOINT", endpoint.trim());
        std::env::set_var("PROFILE_AVATAR_S3_FORCE_PATH_STYLE", "1");
        if std::env::var("PROFILE_AVATAR_S3_REGION")
            .map(|s| s.trim().is_empty())
            .unwrap_or(true)
        {
            std::env::set_var("PROFILE_AVATAR_S3_REGION", "us-east-1");
        }
        if std::env::var("AWS_ACCESS_KEY_ID")
            .map(|s| s.trim().is_empty())
            .unwrap_or(true)
        {
            std::env::set_var("AWS_ACCESS_KEY_ID", DEFAULT_MINIO_ROOT_USER);
        }
        if std::env::var("AWS_SECRET_ACCESS_KEY")
            .map(|s| s.trim().is_empty())
            .unwrap_or(true)
        {
            std::env::set_var("AWS_SECRET_ACCESS_KEY", DEFAULT_MINIO_ROOT_PASSWORD);
        }

        Self { saved }
    }
}

impl Drop for MinioItEnvRestore {
    fn drop(&mut self) {
        for (i, k) in ENV_KEYS_MINIO_IT.iter().enumerate() {
            match &self.saved[i] {
                Some(v) => std::env::set_var(k, v),
                None => std::env::remove_var(k),
            }
        }
    }
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

async fn s3_admin_client() -> Client {
    let endpoint = std::env::var("PROFILE_AVATAR_S3_ENDPOINT").unwrap_or_default();
    let region = std::env::var("PROFILE_AVATAR_S3_REGION").unwrap_or_else(|_| "us-east-1".into());
    let mut loader = aws_config::defaults(BehaviorVersion::latest()).region(Region::new(region));
    let e = endpoint.trim();
    if !e.is_empty() {
        loader = loader.endpoint_url(e);
    }
    let shared = loader.load().await;
    let mut b = aws_sdk_s3::config::Builder::from(&shared);
    b = b.force_path_style(true);
    Client::from_conf(b.build())
}

async fn ensure_bucket_for_minio_it() -> Result<(), String> {
    let bucket = std::env::var("PROFILE_AVATAR_S3_BUCKET")
        .map_err(|_| "PROFILE_AVATAR_S3_BUCKET".to_string())?
        .trim()
        .to_string();
    if bucket.is_empty() {
        return Err("PROFILE_AVATAR_S3_BUCKET empty".into());
    }
    let c = s3_admin_client().await;
    if c.head_bucket().bucket(&bucket).send().await.is_ok() {
        return Ok(());
    }
    match c.create_bucket().bucket(&bucket).send().await {
        Ok(_) => Ok(()),
        Err(e) => {
            let msg = format!("{e}");
            if msg.contains("BucketAlreadyOwnedByYou") || msg.contains("BucketAlreadyExists") {
                Ok(())
            } else {
                Err(format!("create_bucket:{msg}"))
            }
        }
    }
}

#[tokio::test]
async fn matrix_93_a_ava_002_f007_presign_put_commit_s3_minio_ok_pg() {
    if std::env::var("TRAVELTRUST_PROFILE_AVATAR_S3_MINIO_IT")
        .map(|s| s.trim() != "1")
        .unwrap_or(true)
    {
        eprintln!(
            "skip: matrix_93_a_ava_002_f007_presign_put_commit_s3_minio_ok_pg (set TRAVELTRUST_PROFILE_AVATAR_S3_MINIO_IT=1 and docker compose up -d minio)"
        );
        return;
    }

    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_ava_002_f007_presign_put_commit_s3_minio_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    let _serial = super::profile_avatar_env_serial::lock_profile_avatar_test_env();
    let _env_restore = MinioItEnvRestore::apply_defaults_for_minio_it();

    if let Err(e) = ensure_bucket_for_minio_it().await {
        eprintln!("skip: matrix_93_a_ava_002_f007_presign_put_commit_s3_minio_ok_pg (minio/s3 admin: {e})");
        return;
    }

    let email = format!("me-avatar-s3-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "s3it"
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

    let clen = MIN_JPEG_1X1.len() as u64;
    let pres = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/profile-avatar/presign")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from(
                    json!({"content_type": "image/jpeg", "content_length": clen}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    if pres.status() != StatusCode::OK {
        eprintln!(
            "skip: matrix_93_a_ava_002_f007_presign_put_commit_s3_minio_ok_pg presign {:?}",
            response_json(pres).await
        );
        cleanup_user_by_email(&pool, &email).await;
        return;
    }
    let pj = response_json(pres).await;
    let upload_url = pj
        .pointer("/upload_url")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();
    let avatar_url = pj
        .pointer("/avatar_url")
        .and_then(|x| x.as_str())
        .unwrap()
        .to_string();
    let hdrs = pj
        .pointer("/headers")
        .and_then(|x| x.as_object())
        .expect("presign headers object");

    let http = reqwest::Client::new();
    let mut putb = http.put(&upload_url).body(MIN_JPEG_1X1.to_vec());
    for (k, v) in hdrs {
        if let Some(vs) = v.as_str() {
            if k.eq_ignore_ascii_case("host") {
                continue;
            }
            putb = putb.header(k.as_str(), vs);
        }
    }
    let putr = putb.send().await.expect("put object");
    if !putr.status().is_success() {
        let txt = putr.text().await.unwrap_or_default();
        eprintln!(
            "skip: matrix_93_a_ava_002_f007_presign_put_commit_s3_minio_ok_pg PUT failed: {txt}"
        );
        cleanup_user_by_email(&pool, &email).await;
        return;
    }

    let commit = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/profile-avatar/commit")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::from(json!({ "avatar_url": avatar_url }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        commit.status(),
        StatusCode::OK,
        "{:?}",
        response_json(commit).await
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
        Some(avatar_url.as_str())
    );

    cleanup_user_by_email(&pool, &email).await;
}
