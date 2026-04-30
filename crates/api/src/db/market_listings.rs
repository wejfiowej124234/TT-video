//! **`market_listings`**：自由市场已发布目录（94），与 **`GET|POST …/market/*/listings`** 对读。

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct MarketListingRow {
    pub id: Uuid,
    pub variant: String,
    pub owner_user_id: Uuid,
    pub payload: Value,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn list_market_listings_by_variant(
    pool: &PgPool,
    variant: &str,
    limit: i64,
) -> Result<Vec<MarketListingRow>, sqlx::Error> {
    sqlx::query_as::<_, MarketListingRow>(
        r#"SELECT id, variant, owner_user_id, payload, status, created_at, updated_at
           FROM market_listings
           WHERE variant = $1 AND status = 'published'
           ORDER BY updated_at DESC
           LIMIT $2"#,
    )
    .bind(variant)
    .bind(limit)
    .fetch_all(pool)
    .await
}

/// 已发布 listing 且 **owner_user_id** 匹配（用于社区发帖绑定校验）。
pub async fn market_listing_published_owned_by(
    pool: &PgPool,
    listing_id: Uuid,
    owner_user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let n: i64 = sqlx::query_scalar(
        r#"SELECT COUNT(*)::bigint FROM market_listings
           WHERE id = $1 AND owner_user_id = $2 AND status = 'published'"#,
    )
    .bind(listing_id)
    .bind(owner_user_id)
    .fetch_one(pool)
    .await?;
    Ok(n > 0)
}

pub async fn select_market_listing_by_id(
    pool: &PgPool,
    id: Uuid,
    variant: &str,
) -> Result<Option<MarketListingRow>, sqlx::Error> {
    sqlx::query_as::<_, MarketListingRow>(
        r#"SELECT id, variant, owner_user_id, payload, status, created_at, updated_at
           FROM market_listings
           WHERE id = $1 AND variant = $2 AND status = 'published'"#,
    )
    .bind(id)
    .bind(variant)
    .fetch_optional(pool)
    .await
}

pub async fn insert_market_listing(
    pool: &PgPool,
    id: Uuid,
    variant: &str,
    owner_user_id: Uuid,
    payload: &Value,
    now: DateTime<Utc>,
) -> Result<u64, sqlx::Error> {
    let n = sqlx::query(
        r#"INSERT INTO market_listings (id, variant, owner_user_id, payload, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'published', $5, $5)"#,
    )
    .bind(id)
    .bind(variant)
    .bind(owner_user_id)
    .bind(payload)
    .bind(now)
    .execute(pool)
    .await?
    .rows_affected();
    Ok(n)
}
