//! `platform_media_assets` — unified Image/Video asset metadata (B-MEDIA-001 eng).
//! Bytes are never the SSOT; Object Storage + CDN (after Owner cutover) are.

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use sqlx::FromRow;
use uuid::Uuid;

/// Production video/image lifecycle (eng SSOT).
pub const PLATFORM_MEDIA_STATUSES: &[&str] = &[
    "draft",
    "uploading",
    "processing",
    "ready",
    "published",
    "failed",
];

#[derive(Clone, Debug, FromRow)]
pub struct PlatformMediaAssetRow {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub object_key: String,
    pub mime_type: String,
    pub byte_size: i64,
    pub status: String,
    pub visibility: String,
    pub domain: String,
    pub kind: String,
    pub sha256_hex: Option<String>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub duration_ms: Option<i32>,
    pub cover_object_key: Option<String>,
    pub playback_url: Option<String>,
    pub cdn_url: Option<String>,
    pub s3_multipart_upload_id: Option<String>,
    pub last_error: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

fn select_cols() -> &'static str {
    r#"id, owner_id, object_key, mime_type, byte_size, status, visibility,
       domain, kind, sha256_hex, width, height, duration_ms, cover_object_key,
       playback_url, cdn_url, s3_multipart_upload_id, last_error,
       created_at, updated_at"#
}

pub async fn insert_platform_media_asset_draft(
    pool: &PgPool,
    asset_id: Uuid,
    owner_id: Uuid,
    object_key: &str,
    mime_type: &str,
    byte_size: i64,
    domain: &str,
    kind: &str,
    visibility: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"INSERT INTO platform_media_assets (
            id, owner_id, object_key, mime_type, byte_size,
            status, visibility, domain, kind
        ) VALUES ($1, $2, $3, $4, $5, 'draft', $6, $7, $8)"#,
    )
    .bind(asset_id)
    .bind(owner_id)
    .bind(object_key)
    .bind(mime_type)
    .bind(byte_size)
    .bind(visibility)
    .bind(domain)
    .bind(kind)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_platform_media_asset(
    pool: &PgPool,
    asset_id: Uuid,
) -> Result<Option<PlatformMediaAssetRow>, sqlx::Error> {
    let q = format!(
        "SELECT {} FROM platform_media_assets WHERE id = $1",
        select_cols()
    );
    sqlx::query_as::<_, PlatformMediaAssetRow>(&q)
        .bind(asset_id)
        .fetch_optional(pool)
        .await
}

pub async fn get_platform_media_asset_owned(
    pool: &PgPool,
    asset_id: Uuid,
    owner_id: Uuid,
) -> Result<Option<PlatformMediaAssetRow>, sqlx::Error> {
    let q = format!(
        "SELECT {} FROM platform_media_assets WHERE id = $1 AND owner_id = $2",
        select_cols()
    );
    sqlx::query_as::<_, PlatformMediaAssetRow>(&q)
        .bind(asset_id)
        .bind(owner_id)
        .fetch_optional(pool)
        .await
}

/// Allowed transitions (eng SSOT). Invalid → Err.
pub fn platform_media_transition_allowed(from: &str, to: &str) -> bool {
    matches!(
        (from, to),
        ("draft", "uploading")
            | ("uploading", "processing")
            | ("uploading", "failed")
            | ("processing", "ready")
            | ("processing", "failed")
            | ("ready", "published")
            | ("ready", "failed")
            | ("published", "failed")
            | ("draft", "failed")
    )
}

pub async fn transition_platform_media_asset(
    pool: &PgPool,
    asset_id: Uuid,
    owner_id: Uuid,
    from_status: &str,
    to_status: &str,
    last_error: Option<&str>,
) -> Result<u64, sqlx::Error> {
    if !platform_media_transition_allowed(from_status, to_status) {
        return Ok(0);
    }
    let res = sqlx::query(
        r#"UPDATE platform_media_assets
        SET status = $4, last_error = $5, updated_at = now()
        WHERE id = $1 AND owner_id = $2 AND status = $3"#,
    )
    .bind(asset_id)
    .bind(owner_id)
    .bind(from_status)
    .bind(to_status)
    .bind(last_error)
    .execute(pool)
    .await?;
    Ok(res.rows_affected())
}

pub async fn set_platform_media_cdn_url(
    pool: &PgPool,
    asset_id: Uuid,
    cdn_url: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"UPDATE platform_media_assets
        SET cdn_url = $2, updated_at = now()
        WHERE id = $1"#,
    )
    .bind(asset_id)
    .bind(cdn_url)
    .execute(pool)
    .await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn status_machine_happy_path() {
        assert!(platform_media_transition_allowed("draft", "uploading"));
        assert!(platform_media_transition_allowed("uploading", "processing"));
        assert!(platform_media_transition_allowed("processing", "ready"));
        assert!(platform_media_transition_allowed("ready", "published"));
        assert!(!platform_media_transition_allowed("draft", "published"));
        assert!(!platform_media_transition_allowed("failed", "ready"));
    }
}
