//! `community_media_assets` 表：S3 multipart 会话元数据（270 / Phase1）。

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use sqlx::types::Json;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Clone, Debug, FromRow)]
pub struct CommunityMediaAssetRow {
    pub id: Uuid,
    pub owner_user_id: Uuid,
    pub object_key: String,
    pub content_type: String,
    pub byte_length: i64,
    pub part_size_bytes: i64,
    pub part_count: i32,
    pub sha256_hex: Option<String>,
    pub state: String,
    pub duration_ms: Option<i32>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub cover_object_key: Option<String>,
    pub playback_url: Option<String>,
    pub playback_manifest_json: Option<Json<serde_json::Value>>,
    pub s3_multipart_upload_id: Option<String>,
    pub last_error: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn insert_community_media_asset_pending(
    pool: &PgPool,
    asset_id: Uuid,
    owner_user_id: Uuid,
    object_key: &str,
    content_type: &str,
    byte_length: i64,
    part_size_bytes: i64,
    part_count: i32,
    s3_multipart_upload_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"INSERT INTO community_media_assets (
            id, owner_user_id, object_key, content_type, byte_length,
            part_size_bytes, part_count, state, s3_multipart_upload_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_upload', $8)"#,
    )
    .bind(asset_id)
    .bind(owner_user_id)
    .bind(object_key)
    .bind(content_type)
    .bind(byte_length)
    .bind(part_size_bytes)
    .bind(part_count)
    .bind(s3_multipart_upload_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_community_media_asset_owned(
    pool: &PgPool,
    asset_id: Uuid,
    owner_user_id: Uuid,
) -> Result<Option<CommunityMediaAssetRow>, sqlx::Error> {
    sqlx::query_as::<_, CommunityMediaAssetRow>(
        r#"SELECT
            id, owner_user_id, object_key, content_type, byte_length,
            part_size_bytes, part_count, sha256_hex, state,
            duration_ms, width, height, cover_object_key, playback_url,
            playback_manifest_json, s3_multipart_upload_id, last_error,
            created_at, updated_at
        FROM community_media_assets
        WHERE id = $1 AND owner_user_id = $2"#,
    )
    .bind(asset_id)
    .bind(owner_user_id)
    .fetch_optional(pool)
    .await
}

pub async fn mark_community_media_asset_failed(
    pool: &PgPool,
    asset_id: Uuid,
    owner_user_id: Uuid,
    err: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"UPDATE community_media_assets
        SET state = 'failed', last_error = $3, updated_at = now()
        WHERE id = $1 AND owner_user_id = $2"#,
    )
    .bind(asset_id)
    .bind(owner_user_id)
    .bind(err)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn mark_community_media_asset_uploaded(
    pool: &PgPool,
    asset_id: Uuid,
    owner_user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        r#"UPDATE community_media_assets
        SET state = 'uploaded', updated_at = now()
        WHERE id = $1 AND owner_user_id = $2 AND state = 'pending_upload'"#,
    )
    .bind(asset_id)
    .bind(owner_user_id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

pub async fn mark_community_media_asset_processing(
    pool: &PgPool,
    asset_id: Uuid,
    owner_user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        r#"UPDATE community_media_assets
        SET state = 'processing', updated_at = now()
        WHERE id = $1 AND owner_user_id = $2 AND state = 'uploaded'"#,
    )
    .bind(asset_id)
    .bind(owner_user_id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

pub async fn finalize_community_media_asset_ready(
    pool: &PgPool,
    asset_id: Uuid,
    owner_user_id: Uuid,
    playback_url: &str,
    byte_length: i64,
    sha256_hex: Option<&str>,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        r#"UPDATE community_media_assets
        SET state = 'ready',
            playback_url = $3,
            byte_length = $4,
            sha256_hex = COALESCE($5, sha256_hex),
            updated_at = now()
        WHERE id = $1 AND owner_user_id = $2 AND state = 'processing'"#,
    )
    .bind(asset_id)
    .bind(owner_user_id)
    .bind(playback_url)
    .bind(byte_length)
    .bind(sha256_hex)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}
