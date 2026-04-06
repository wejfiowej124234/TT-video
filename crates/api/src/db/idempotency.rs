//! 55-S8：幂等键表 idempotency_keys 读写（跨实例/重启幂等）
//! key_hash = SHA256(method:path:idempotency_key)，response_snapshot = { status, body_base64 }

use axum::http::StatusCode;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use serde_json::json;
use sha2::{Digest, Sha256};
use sqlx::PgPool;

const IDEMPOTENCY_TTL_SECS: i64 = 86400; // 24h

/// 计算幂等键哈希（与表 key_hash 一致）
pub fn key_hash(method: &str, path: &str, idem_key: &str) -> [u8; 32] {
    let s = format!("{}:{}:{}", method, path, idem_key);
    let mut h = Sha256::new();
    h.update(s.as_bytes());
    h.finalize().into()
}

/// 从 DB 读取已缓存的幂等响应；未命中或过期返回 None
pub async fn get_cached_response(
    pool: &PgPool,
    key_hash_bytes: &[u8; 32],
) -> Result<Option<(StatusCode, Vec<u8>)>, sqlx::Error> {
    use sqlx::Row;
    let row = sqlx::query(
        "SELECT response_snapshot FROM idempotency_keys WHERE key_hash = $1 AND (expires_at IS NULL OR expires_at > now())",
    )
    .bind(key_hash_bytes)
    .fetch_optional(pool)
    .await?;
    let Some(row) = row else {
        return Ok(None);
    };
    let snap: serde_json::Value = row.try_get("response_snapshot")?;
    let obj = snap
        .as_object()
        .ok_or_else(|| sqlx::Error::Decode(Box::from("response_snapshot not object")))?;
    let status = obj.get("status").and_then(|v| v.as_u64()).unwrap_or(500) as u16;
    let body_b64 = obj
        .get("body_base64")
        .and_then(|v| v.as_str())
        .ok_or_else(|| sqlx::Error::Decode(Box::from("body_base64 missing")))?;
    let body = BASE64
        .decode(body_b64.as_bytes())
        .map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
    let status_code = StatusCode::from_u16(status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);
    Ok(Some((status_code, body)))
}

/// 写入幂等响应到 DB（key_scope 用于按 scope 清理/查询）
pub async fn save_cached_response(
    pool: &PgPool,
    key_hash_bytes: &[u8; 32],
    key_scope: &str,
    status: StatusCode,
    body: &[u8],
) -> Result<(), sqlx::Error> {
    let body_base64 = BASE64.encode(body);
    let snapshot = json!({ "status": status.as_u16(), "body_base64": body_base64 });
    let expires_at = chrono::Utc::now() + chrono::Duration::seconds(IDEMPOTENCY_TTL_SECS);
    sqlx::query(
        "INSERT INTO idempotency_keys (key_hash, key_scope, response_snapshot, expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (key_hash) DO UPDATE SET response_snapshot = EXCLUDED.response_snapshot, expires_at = EXCLUDED.expires_at",
    )
    .bind(key_hash_bytes)
    .bind(key_scope)
    .bind(&snapshot)
    .bind(expires_at)
    .execute(pool)
    .await?;
    Ok(())
}
