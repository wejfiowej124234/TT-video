//! itineraries 表：ItineraryRow、insert_itinerary、update_itinerary_snapshot_hash、list_itineraries（48 §6.5）

use chrono::{DateTime, Utc};
use serde_json::Value as JsonValue;
use sqlx::postgres::{PgPool, Postgres};
use sqlx::Transaction;
use uuid::Uuid;

/// 行程行（DB；days/amount_breakdown 为 JSON，hydrate 时反序列化为 chain_off::ItineraryBundle）
#[derive(Debug)]
#[allow(dead_code)]
pub struct ItineraryRow {
    pub id: Uuid,
    pub order_id: Uuid,
    pub draft_id: Option<String>,
    pub version: i32,
    pub destination: String,
    pub city: String,
    pub days_json: JsonValue,
    pub amount_breakdown_json: Option<JsonValue>,
    pub snapshot_hash: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// did-rank：行程行 + 关联订单的游客用户 id（`is_me` 用；无订单行时为 `None`）
#[derive(Debug)]
pub struct DidRankItineraryEntry {
    pub row: ItineraryRow,
    pub order_tourist_id: Option<Uuid>,
}

/// 插入行程（POST /api/v1/itineraries 双写）
pub async fn insert_itinerary(
    pool: &PgPool,
    order_id: Uuid,
    draft_id: Option<&str>,
    version: i32,
    destination: &str,
    city: &str,
    days_json: &JsonValue,
    amount_breakdown_json: Option<&JsonValue>,
    snapshot_hash: Option<&str>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO itineraries (order_id, draft_id, version, destination, city, days_json, amount_breakdown_json, snapshot_hash, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (order_id) DO UPDATE SET
            version = EXCLUDED.version,
            destination = EXCLUDED.destination,
            city = EXCLUDED.city,
            days_json = EXCLUDED.days_json,
            amount_breakdown_json = EXCLUDED.amount_breakdown_json,
            snapshot_hash = COALESCE(EXCLUDED.snapshot_hash, itineraries.snapshot_hash),
            updated_at = EXCLUDED.updated_at
        "#,
    )
    .bind(order_id)
    .bind(draft_id)
    .bind(version)
    .bind(destination)
    .bind(city)
    .bind(days_json)
    .bind(amount_breakdown_json)
    .bind(snapshot_hash)
    .bind(created_at)
    .bind(updated_at)
    .execute(pool)
    .await?;
    Ok(())
}

/// 55-S9：事务内插入行程（与 upsert_order_tx 同事务创建订单+行程）
pub async fn insert_itinerary_tx(
    tx: &mut Transaction<'_, Postgres>,
    order_id: Uuid,
    draft_id: Option<&str>,
    version: i32,
    destination: &str,
    city: &str,
    days_json: &JsonValue,
    amount_breakdown_json: Option<&JsonValue>,
    snapshot_hash: Option<&str>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO itineraries (order_id, draft_id, version, destination, city, days_json, amount_breakdown_json, snapshot_hash, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (order_id) DO UPDATE SET
            version = EXCLUDED.version,
            destination = EXCLUDED.destination,
            city = EXCLUDED.city,
            days_json = EXCLUDED.days_json,
            amount_breakdown_json = EXCLUDED.amount_breakdown_json,
            snapshot_hash = COALESCE(EXCLUDED.snapshot_hash, itineraries.snapshot_hash),
            updated_at = EXCLUDED.updated_at
        "#,
    )
    .bind(order_id)
    .bind(draft_id)
    .bind(version)
    .bind(destination)
    .bind(city)
    .bind(days_json)
    .bind(amount_breakdown_json)
    .bind(snapshot_hash)
    .bind(created_at)
    .bind(updated_at)
    .execute(&mut **tx)
    .await?;
    Ok(())
}

/// B-MEDIA-001 eng: bind platform media asset as itinerary cover (prefer over data URL).
pub async fn set_itinerary_cover_media_asset_id_tx(
    tx: &mut Transaction<'_, Postgres>,
    order_id: Uuid,
    cover_media_asset_id: Uuid,
    updated_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE itineraries
           SET cover_media_asset_id = $1, updated_at = $2
         WHERE order_id = $3
        "#,
    )
    .bind(cover_media_asset_id)
    .bind(updated_at)
    .bind(order_id)
    .execute(&mut **tx)
    .await?;
    Ok(())
}

/// 55-S2：更新行程 days/amount_breakdown/version（PATCH itinerary 写回 DB）
pub async fn update_itinerary_days_breakdown_version(
    pool: &PgPool,
    order_id: Uuid,
    days_json: &JsonValue,
    amount_breakdown_json: Option<&JsonValue>,
    version: i32,
    updated_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE itineraries SET days_json = $1, amount_breakdown_json = $2, version = $3, updated_at = $4 WHERE order_id = $5",
    )
    .bind(days_json)
    .bind(amount_breakdown_json)
    .bind(version)
    .bind(updated_at)
    .bind(order_id)
    .execute(pool)
    .await?;
    Ok(())
}

/// 更新行程 snapshot_hash（P16 确认最终版本双写）
pub async fn update_itinerary_snapshot_hash(
    pool: &PgPool,
    order_id: Uuid,
    snapshot_hash: &str,
    updated_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE itineraries SET snapshot_hash = $1, updated_at = $2 WHERE order_id = $3")
        .bind(snapshot_hash)
        .bind(updated_at)
        .bind(order_id)
        .execute(pool)
        .await?;
    Ok(())
}

/// DID 排行榜：仅 **已完成订单** 的行程，按 `orders.completed_at` 降序（窗口过滤在订单完成时间上；P2 活动量口径）。
pub async fn list_itineraries_did_rank_by_order_completion(
    pool: &PgPool,
    completed_since: Option<DateTime<Utc>>,
    limit: i64,
) -> Result<Vec<DidRankItineraryEntry>, sqlx::Error> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        order_id: Uuid,
        draft_id: Option<String>,
        version: i32,
        destination: String,
        city: String,
        days_json: JsonValue,
        amount_breakdown_json: Option<JsonValue>,
        snapshot_hash: Option<String>,
        created_at: DateTime<Utc>,
        updated_at: DateTime<Utc>,
        tourist_id: Uuid,
    }
    let rows = sqlx::query_as::<_, Row>(
        r#"
        SELECT i.id, i.order_id, i.draft_id, i.version, i.destination, i.city, i.days_json, i.amount_breakdown_json, i.snapshot_hash, i.created_at, i.updated_at, o.tourist_id
        FROM itineraries i
        INNER JOIN orders o ON o.id = i.order_id
        WHERE o.status = 'completed'
          AND o.completed_at IS NOT NULL
          AND ($1::timestamptz IS NULL OR o.completed_at >= $1)
        ORDER BY o.completed_at DESC NULLS LAST, i.created_at DESC
        LIMIT $2
        "#,
    )
    .bind(completed_since)
    .bind(limit)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|r| DidRankItineraryEntry {
            order_tourist_id: Some(r.tourist_id),
            row: ItineraryRow {
                id: r.id,
                order_id: r.order_id,
                draft_id: r.draft_id,
                version: r.version,
                destination: r.destination,
                city: r.city,
                days_json: r.days_json,
                amount_breakdown_json: r.amount_breakdown_json,
                snapshot_hash: r.snapshot_hash,
                created_at: r.created_at,
                updated_at: r.updated_at,
            },
        })
        .collect())
}

/// did-rank：按 `created_at` 下界筛选（None = 与 list_itineraries 相同全量）
pub async fn list_itineraries_created_since(
    pool: &PgPool,
    created_at_min: Option<DateTime<Utc>>,
) -> Result<Vec<DidRankItineraryEntry>, sqlx::Error> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        order_id: Uuid,
        draft_id: Option<String>,
        version: i32,
        destination: String,
        city: String,
        days_json: JsonValue,
        amount_breakdown_json: Option<JsonValue>,
        snapshot_hash: Option<String>,
        created_at: DateTime<Utc>,
        updated_at: DateTime<Utc>,
        tourist_id: Option<Uuid>,
    }
    let rows = sqlx::query_as::<_, Row>(
        r#"
        SELECT i.id, i.order_id, i.draft_id, i.version, i.destination, i.city, i.days_json, i.amount_breakdown_json, i.snapshot_hash, i.created_at, i.updated_at, o.tourist_id
        FROM itineraries i
        LEFT JOIN orders o ON o.id = i.order_id
        WHERE ($1::timestamptz IS NULL OR i.created_at >= $1)
        "#,
    )
    .bind(created_at_min)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|r| DidRankItineraryEntry {
            order_tourist_id: r.tourist_id,
            row: ItineraryRow {
                id: r.id,
                order_id: r.order_id,
                draft_id: r.draft_id,
                version: r.version,
                destination: r.destination,
                city: r.city,
                days_json: r.days_json,
                amount_breakdown_json: r.amount_breakdown_json,
                snapshot_hash: r.snapshot_hash,
                created_at: r.created_at,
                updated_at: r.updated_at,
            },
        })
        .collect())
}

/// 加载所有行程（启动 hydrate）
pub async fn list_itineraries(pool: &PgPool) -> Result<Vec<ItineraryRow>, sqlx::Error> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: Uuid,
        order_id: Uuid,
        draft_id: Option<String>,
        version: i32,
        destination: String,
        city: String,
        days_json: JsonValue,
        amount_breakdown_json: Option<JsonValue>,
        snapshot_hash: Option<String>,
        created_at: DateTime<Utc>,
        updated_at: DateTime<Utc>,
    }
    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, order_id, draft_id, version, destination, city, days_json, amount_breakdown_json, snapshot_hash, created_at, updated_at FROM itineraries",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(|r| ItineraryRow {
            id: r.id,
            order_id: r.order_id,
            draft_id: r.draft_id,
            version: r.version,
            destination: r.destination,
            city: r.city,
            days_json: r.days_json,
            amount_breakdown_json: r.amount_breakdown_json,
            snapshot_hash: r.snapshot_hash,
            created_at: r.created_at,
            updated_at: r.updated_at,
        })
        .collect())
}
