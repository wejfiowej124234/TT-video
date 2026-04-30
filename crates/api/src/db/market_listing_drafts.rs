//! **`market_listing_drafts`**：自由市场子站创作台草稿（94），与 **`POST|GET …/market/*/listings/drafts`** 对读。

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct MarketListingDraftRow {
    pub id: Uuid,
    pub variant: String,
    pub payload: Value,
    pub saved_at: DateTime<Utc>,
    pub owner_user_id: Uuid,
}

/// 仅当 **`id` + `variant` + `owner_user_id`** 均匹配时返回行（否则 **`None`**，与「不存在」同形，防 UUID 枚举）。
pub async fn select_market_listing_draft_by_id_for_owner(
    pool: &PgPool,
    id: Uuid,
    variant: &str,
    owner_user_id: Uuid,
) -> Result<Option<MarketListingDraftRow>, sqlx::Error> {
    sqlx::query_as::<_, MarketListingDraftRow>(
        "SELECT id, variant, payload, saved_at, owner_user_id FROM market_listing_drafts WHERE id = $1 AND variant = $2 AND owner_user_id = $3",
    )
    .bind(id)
    .bind(variant)
    .bind(owner_user_id)
    .fetch_optional(pool)
    .await
}

pub async fn insert_market_listing_draft(
    pool: &PgPool,
    id: Uuid,
    variant: &str,
    owner_user_id: Uuid,
    payload: &Value,
    saved_at: DateTime<Utc>,
) -> Result<u64, sqlx::Error> {
    let n = sqlx::query(
        "INSERT INTO market_listing_drafts (id, variant, owner_user_id, payload, saved_at) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(id)
    .bind(variant)
    .bind(owner_user_id)
    .bind(payload)
    .bind(saved_at)
    .execute(pool)
    .await?
    .rows_affected();
    Ok(n)
}
