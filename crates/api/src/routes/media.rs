//! `POST /api/v1/media/signed-urls`、`GET /api/v1/media/access/:token_id` — 受限对象短期访问（04 §3.4、14、270）。
//!
//! **object_id 约定（MVP）**：`evidence|{order_uuid}|{content_hash_hex}` — 须存在对应 `evidence_receipts` 行，且调用者为订单 `tourist_id` 或 `guide_id`。
//! 须有 `DATABASE_URL` + 迁移 `signed_url_tokens`、`media_access_logs`；无 DB 时 POST 返回 **503**。
//! **POST 签发**：**200** 前写 `media_access_logs` **`issue_ok`**（`actor_or_ip` 同源）。**GET 兑现**：成功与过期（**410**）写 **`read_ok`** / **`read_expired`**（失败仅 `eprintln`，不改变 HTTP）。

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use chrono::{Duration, Utc};
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use std::env;
use uuid::Uuid;

use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/media/signed-urls", post(post_signed_urls))
        .route("/api/v1/media/access/:token_id", get(get_media_access))
}

#[derive(Debug, Deserialize)]
struct SignedUrlsBody {
    object_id: String,
    scope: String,
    #[serde(default)]
    expires_in: Option<u64>,
}

const EXPIRES_MIN: u64 = 60;
const EXPIRES_MAX: u64 = 86_400;

fn public_api_base() -> String {
    let base = env::var("PUBLIC_API_BASE_URL")
        .or_else(|_| env::var("API_PUBLIC_BASE_URL"))
        .unwrap_or_else(|_| {
            let port = env::var("PORT").unwrap_or_else(|_| "8080".to_string());
            format!("http://127.0.0.1:{}", port.trim())
        });
    base.trim_end_matches('/').to_string()
}

/// `evidence|order_uuid|content_hash_hex`
fn parse_evidence_object_id(raw: &str) -> Result<(Uuid, String), &'static str> {
    let parts: Vec<&str> = raw.split('|').collect();
    if parts.len() != 3 || parts[0] != "evidence" {
        return Err("invalid_object_id");
    }
    let order_id = Uuid::parse_str(parts[1]).map_err(|_| "invalid_object_id")?;
    let hash = parts[2].trim();
    if hash.is_empty() || hash.len() > 128 {
        return Err("invalid_object_id");
    }
    if !hash.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err("invalid_object_id");
    }
    Ok((order_id, hash.to_ascii_lowercase()))
}

/// 与 `rate_limit_layer` 同源：`X-Forwarded-For` 首跳 → `X-Real-IP` → `default`（270 `actor_or_ip`）
fn client_actor_for_audit(headers: &HeaderMap) -> String {
    const MAX: usize = 512;
    let s = headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .and_then(|raw| raw.split(',').next().map(str::trim))
        .filter(|x| !x.is_empty())
        .or_else(|| {
            headers
                .get("x-real-ip")
                .and_then(|v| v.to_str().ok())
                .map(str::trim)
        })
        .filter(|x| !x.is_empty())
        .unwrap_or("default");
    s.chars().take(MAX).collect()
}

async fn log_media_access_audit(
    pool: &PgPool,
    token_id: Option<Uuid>,
    object_id: &str,
    actor: &str,
    action: &str,
) {
    if let Err(e) = db::insert_media_access_log(pool, token_id, object_id, actor, action).await {
        eprintln!("media access audit log: {}", e);
    }
}

async fn post_signed_urls(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<SignedUrlsBody>,
) -> impl IntoResponse {
    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "database_required",
                    "message": "database_required",
                    "detail": "POST /api/v1/media/signed-urls 需要 DATABASE_URL 与 signed_url_tokens 迁移（270）",
                })),
            );
        }
    };

    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "error": "login_required",
                    "message": "login_required",
                })),
            );
        }
    };

    let scope = body.scope.to_ascii_lowercase();
    if scope != "read" && scope != "download" {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid_scope_or_expiry",
                "message": "invalid_scope_or_expiry",
                "errors": { "scope": "must be read or download" },
            })),
        );
    }

    let expires_in = body.expires_in.unwrap_or(900);
    if !(EXPIRES_MIN..=EXPIRES_MAX).contains(&expires_in) {
        return (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(json!({
                "error": "policy_violation",
                "message": "policy_violation",
                "errors": { "expires_in": format!("must be between {} and {} seconds", EXPIRES_MIN, EXPIRES_MAX) },
            })),
        );
    }

    let (order_id, content_hash) = match parse_evidence_object_id(&body.object_id) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "error": "invalid_scope_or_expiry",
                    "message": "invalid_object_id",
                    "detail": "expected evidence|<order_uuid>|<content_hash_hex>",
                })),
            );
        }
    };

    let ok = match db::user_can_access_evidence_object(pool, order_id, &content_hash, uid).await {
        Ok(v) => v,
        Err(e) => {
            eprintln!("media signed-urls: db: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "internal_error",
                    "message": "internal_error",
                })),
            );
        }
    };
    if !ok {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({
                "error": "object_not_found",
                "message": "object_not_found",
            })),
        );
    }

    let expires_at = Utc::now() + Duration::seconds(expires_in as i64);
    let token_id =
        match db::insert_signed_url_token(pool, &body.object_id, &scope, expires_at, uid).await {
            Ok(id) => id,
            Err(e) => {
                eprintln!("media signed-urls: insert token: {}", e);
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "error": "internal_error",
                        "message": "internal_error",
                    })),
                );
            }
        };

    let actor = client_actor_for_audit(&headers);
    log_media_access_audit(pool, Some(token_id), &body.object_id, &actor, "issue_ok").await;

    let base = public_api_base();
    let url = format!("{}/api/v1/media/access/{}", base, token_id);

    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "url": url,
            "expires_at": expires_at.to_rfc3339(),
            "token_id": token_id.to_string(),
        })),
    )
}

async fn get_media_access(
    State(state): State<ApiMetaState>,
    Path(token_id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "database_required",
                    "message": "database_required",
                })),
            );
        }
    };

    let actor = client_actor_for_audit(&headers);

    let tid = match Uuid::parse_str(&token_id) {
        Ok(u) => u,
        Err(_) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({
                    "error": "object_not_found",
                    "message": "object_not_found",
                })),
            );
        }
    };

    let row = match db::get_signed_url_token(pool, tid).await {
        Ok(r) => r,
        Err(e) => {
            eprintln!("media access: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "internal_error",
                    "message": "internal_error",
                })),
            );
        }
    };

    let Some(row) = row else {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({
                "error": "object_not_found",
                "message": "object_not_found",
            })),
        );
    };

    if row.expires_at < Utc::now() {
        log_media_access_audit(pool, Some(row.id), &row.object_id, &actor, "read_expired").await;
        return (
            StatusCode::GONE,
            Json(json!({
                "error": "token_expired",
                "message": "token_expired",
                "expires_at": row.expires_at.to_rfc3339(),
            })),
        );
    }

    let (order_id, content_hash) = match parse_evidence_object_id(&row.object_id) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "internal_error",
                    "message": "corrupt_token_object_id",
                })),
            );
        }
    };

    log_media_access_audit(pool, Some(row.id), &row.object_id, &actor, "read_ok").await;

    // 兑现：当前无对象存储字节流；返回元数据 JSON（270 Partial）。download 与 read 同形至接入 S3/CDN。
    (
        StatusCode::OK,
        Json(json!({
            "status": "ok",
            "scope": row.url_scope,
            "order_id": order_id.to_string(),
            "content_hash": content_hash,
            "object_id": row.object_id,
            "implementation_note": "blob streaming not configured; metadata only until 270 object storage",
        })),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_evidence_object_id_ok() {
        let oid = Uuid::new_v4();
        let s = format!("evidence|{}|abcdef0123456789", oid);
        let (o, h) = parse_evidence_object_id(&s).unwrap();
        assert_eq!(o, oid);
        assert_eq!(h, "abcdef0123456789");
    }

    #[test]
    fn parse_evidence_object_id_rejects_bad_hash() {
        assert!(parse_evidence_object_id("evidence|not-uuid|ab").is_err());
    }
}
