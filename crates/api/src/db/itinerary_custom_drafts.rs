//! **`itinerary_custom_drafts`**：自定义行程弹窗草稿（49 A），与 **`POST|GET …/itineraries/custom/drafts`** 对读。

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct ItineraryCustomDraftRow {
    pub id: Uuid,
    pub owner_user_id: Uuid,
    pub payload: Value,
    pub saved_at: DateTime<Utc>,
}

pub async fn insert_itinerary_custom_draft(
    pool: &PgPool,
    id: Uuid,
    owner_user_id: Uuid,
    payload: &Value,
    saved_at: DateTime<Utc>,
) -> Result<u64, sqlx::Error> {
    let n = sqlx::query(
        "INSERT INTO itinerary_custom_drafts (id, owner_user_id, payload, saved_at) VALUES ($1, $2, $3, $4)",
    )
    .bind(id)
    .bind(owner_user_id)
    .bind(payload)
    .bind(saved_at)
    .execute(pool)
    .await?
    .rows_affected();
    Ok(n)
}

/// 仅当 **`id` + `owner_user_id`** 均匹配时返回行（否则 **`None`**，与「不存在」同形，防 UUID 枚举）。
pub async fn select_itinerary_custom_draft_by_id_for_owner(
    pool: &PgPool,
    id: Uuid,
    owner_user_id: Uuid,
) -> Result<Option<ItineraryCustomDraftRow>, sqlx::Error> {
    sqlx::query_as::<_, ItineraryCustomDraftRow>(
        "SELECT id, owner_user_id, payload, saved_at FROM itinerary_custom_drafts WHERE id = $1 AND owner_user_id = $2",
    )
    .bind(id)
    .bind(owner_user_id)
    .fetch_optional(pool)
    .await
}
