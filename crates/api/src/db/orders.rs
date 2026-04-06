//! orders 表：DbOrderRow、upsert_order、list_orders（48 §6.4）
//! start_date/end_date 见 48 §7.3、E3，80 §4.15

use chrono::{DateTime, NaiveDate, Utc};
use sqlx::postgres::{PgPool, Postgres};
use sqlx::Transaction;
use uuid::Uuid;

/// 订单行（DB 用；status 字符串，与 chain_off::OrderRow 对齐）
/// 53：sub_status 与双边/评分确认字段（附录 B）
/// 55-S1：guide_id 可空（Draft/自定义行程无向导时）
#[derive(Debug, sqlx::FromRow)]
pub struct DbOrderRow {
    pub id: Uuid,
    pub tourist_id: Uuid,
    pub guide_id: Option<Uuid>,
    pub amount: String,
    pub currency: String,
    pub status: String,
    pub escrow_address: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub accepted_at: Option<DateTime<Utc>>,
    pub escrowed_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub dispute_deadline_at: Option<DateTime<Utc>>,
    pub auto_complete_at: Option<DateTime<Utc>>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub sub_status: Option<String>,
    pub tourist_confirmed: Option<bool>,
    pub guide_confirmed: Option<bool>,
    pub rating_tourist_confirmed: Option<bool>,
    pub rating_guide_confirmed: Option<bool>,
    /// 业务归属链（**`CHAIN_ID`** / 与 **`chain::ChainConfig`** 同源口径）；**NULL** = 历史行或未配置 RPC
    pub chain_id: Option<i64>,
}

/// 插入或更新订单（创建与状态变更时双写；53 含 sub_status 与确认字段；55-S1 guide_id 可选）
pub async fn upsert_order(
    pool: &PgPool,
    id: Uuid,
    tourist_id: Uuid,
    guide_id: Option<Uuid>,
    amount: &str,
    currency: &str,
    status: &str,
    escrow_address: Option<&str>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    accepted_at: Option<DateTime<Utc>>,
    escrowed_at: Option<DateTime<Utc>>,
    completed_at: Option<DateTime<Utc>>,
    dispute_deadline_at: Option<DateTime<Utc>>,
    auto_complete_at: Option<DateTime<Utc>>,
    start_date: Option<NaiveDate>,
    end_date: Option<NaiveDate>,
    sub_status: Option<&str>,
    tourist_confirmed: Option<bool>,
    guide_confirmed: Option<bool>,
    rating_tourist_confirmed: Option<bool>,
    rating_guide_confirmed: Option<bool>,
    chain_id: Option<i64>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO orders (id, tourist_id, guide_id, amount, currency, status, escrow_address, created_at, updated_at, accepted_at, escrowed_at, completed_at, dispute_deadline_at, auto_complete_at, start_date, end_date, sub_status, tourist_confirmed, guide_confirmed, rating_tourist_confirmed, rating_guide_confirmed, chain_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            escrow_address = EXCLUDED.escrow_address,
            updated_at = EXCLUDED.updated_at,
            accepted_at = COALESCE(EXCLUDED.accepted_at, orders.accepted_at),
            escrowed_at = COALESCE(EXCLUDED.escrowed_at, orders.escrowed_at),
            completed_at = COALESCE(EXCLUDED.completed_at, orders.completed_at),
            dispute_deadline_at = EXCLUDED.dispute_deadline_at,
            auto_complete_at = EXCLUDED.auto_complete_at,
            start_date = EXCLUDED.start_date,
            end_date = EXCLUDED.end_date,
            sub_status = EXCLUDED.sub_status,
            tourist_confirmed = EXCLUDED.tourist_confirmed,
            guide_confirmed = EXCLUDED.guide_confirmed,
            rating_tourist_confirmed = EXCLUDED.rating_tourist_confirmed,
            rating_guide_confirmed = EXCLUDED.rating_guide_confirmed,
            chain_id = COALESCE(orders.chain_id, EXCLUDED.chain_id)
        "#,
    )
    .bind(id)
    .bind(tourist_id)
    .bind(guide_id)
    .bind(amount)
    .bind(currency)
    .bind(status)
    .bind(escrow_address)
    .bind(created_at)
    .bind(updated_at)
    .bind(accepted_at)
    .bind(escrowed_at)
    .bind(completed_at)
    .bind(dispute_deadline_at)
    .bind(auto_complete_at)
    .bind(start_date)
    .bind(end_date)
    .bind(sub_status)
    .bind(tourist_confirmed)
    .bind(guide_confirmed)
    .bind(rating_tourist_confirmed)
    .bind(rating_guide_confirmed)
    .bind(chain_id)
    .execute(pool)
    .await?;
    Ok(())
}

/// 55-S9：事务内插入/更新订单（与 insert_itinerary_tx 同事务创建订单+行程）
pub async fn upsert_order_tx(
    tx: &mut Transaction<'_, Postgres>,
    id: Uuid,
    tourist_id: Uuid,
    guide_id: Option<Uuid>,
    amount: &str,
    currency: &str,
    status: &str,
    escrow_address: Option<&str>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    accepted_at: Option<DateTime<Utc>>,
    escrowed_at: Option<DateTime<Utc>>,
    completed_at: Option<DateTime<Utc>>,
    dispute_deadline_at: Option<DateTime<Utc>>,
    auto_complete_at: Option<DateTime<Utc>>,
    start_date: Option<NaiveDate>,
    end_date: Option<NaiveDate>,
    sub_status: Option<&str>,
    tourist_confirmed: Option<bool>,
    guide_confirmed: Option<bool>,
    rating_tourist_confirmed: Option<bool>,
    rating_guide_confirmed: Option<bool>,
    chain_id: Option<i64>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO orders (id, tourist_id, guide_id, amount, currency, status, escrow_address, created_at, updated_at, accepted_at, escrowed_at, completed_at, dispute_deadline_at, auto_complete_at, start_date, end_date, sub_status, tourist_confirmed, guide_confirmed, rating_tourist_confirmed, rating_guide_confirmed, chain_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            escrow_address = EXCLUDED.escrow_address,
            updated_at = EXCLUDED.updated_at,
            accepted_at = COALESCE(EXCLUDED.accepted_at, orders.accepted_at),
            escrowed_at = COALESCE(EXCLUDED.escrowed_at, orders.escrowed_at),
            completed_at = COALESCE(EXCLUDED.completed_at, orders.completed_at),
            dispute_deadline_at = EXCLUDED.dispute_deadline_at,
            auto_complete_at = EXCLUDED.auto_complete_at,
            start_date = EXCLUDED.start_date,
            end_date = EXCLUDED.end_date,
            sub_status = EXCLUDED.sub_status,
            tourist_confirmed = EXCLUDED.tourist_confirmed,
            guide_confirmed = EXCLUDED.guide_confirmed,
            rating_tourist_confirmed = EXCLUDED.rating_tourist_confirmed,
            rating_guide_confirmed = EXCLUDED.rating_guide_confirmed,
            chain_id = COALESCE(orders.chain_id, EXCLUDED.chain_id)
        "#,
    )
    .bind(id)
    .bind(tourist_id)
    .bind(guide_id)
    .bind(amount)
    .bind(currency)
    .bind(status)
    .bind(escrow_address)
    .bind(created_at)
    .bind(updated_at)
    .bind(accepted_at)
    .bind(escrowed_at)
    .bind(completed_at)
    .bind(dispute_deadline_at)
    .bind(auto_complete_at)
    .bind(start_date)
    .bind(end_date)
    .bind(sub_status)
    .bind(tourist_confirmed)
    .bind(guide_confirmed)
    .bind(rating_tourist_confirmed)
    .bind(rating_guide_confirmed)
    .bind(chain_id)
    .execute(&mut **tx)
    .await?;
    Ok(())
}

/// 加载所有订单（启动 hydrate）；53 含 sub_status 与确认字段
pub async fn list_orders(pool: &PgPool) -> Result<Vec<DbOrderRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, DbOrderRow>(
        "SELECT id, tourist_id, guide_id, amount, currency, status, escrow_address, created_at, updated_at, accepted_at, escrowed_at, completed_at, dispute_deadline_at, auto_complete_at, start_date, end_date, sub_status, tourist_confirmed, guide_confirmed, rating_tourist_confirmed, rating_guide_confirmed, chain_id FROM orders",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows)
}

/// 已填 escrow 的订单 **`id` + `status`**（按 **`updated_at`** 新到旧），供 **indexer-reconcile** RPC 抽样。
#[derive(Debug, sqlx::FromRow)]
pub struct OrderIdStatusRow {
    pub id: Uuid,
    pub status: String,
}

pub async fn list_orders_with_escrow_id_status_limit(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<OrderIdStatusRow>, sqlx::Error> {
    sqlx::query_as::<_, OrderIdStatusRow>(
        r#"
        SELECT id, status
        FROM orders
        WHERE escrow_address IS NOT NULL AND BTRIM(escrow_address) <> ''
        ORDER BY updated_at DESC NULLS LAST
        LIMIT $1
        "#,
    )
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn get_order_by_id(pool: &PgPool, id: Uuid) -> Result<Option<DbOrderRow>, sqlx::Error> {
    sqlx::query_as::<_, DbOrderRow>(
        "SELECT id, tourist_id, guide_id, amount, currency, status, escrow_address, created_at, updated_at, accepted_at, escrowed_at, completed_at, dispute_deadline_at, auto_complete_at, start_date, end_date, sub_status, tourist_confirmed, guide_confirmed, rating_tourist_confirmed, rating_guide_confirmed, chain_id FROM orders WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

/// `orders` 总行数（Admin 财务摘要与 chain_off 对拍）。
pub async fn count_orders(pool: &PgPool) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>("SELECT COUNT(*)::bigint FROM orders")
        .fetch_one(pool)
        .await
}

/// 已填 **`escrow_address`** 的订单数（与链上投影对账口径一致）。
pub async fn count_orders_with_escrow_address(pool: &PgPool) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>(
        r#"SELECT COUNT(*)::bigint FROM orders WHERE escrow_address IS NOT NULL AND BTRIM(escrow_address) <> ''"#,
    )
    .fetch_one(pool)
    .await
}

/// **110 Partial**：reorg replay 后按 **`orders_projection`** 回写 **`orders.status` / `escrow_address`**（须显式 env，见 **`INDEXER_REORG_SYNC_ORDERS_FROM_PROJECTION_AFTER_REWIND`**）。
pub(crate) async fn update_order_status_escrow_for_reorg_sync(
    pool: &PgPool,
    id: Uuid,
    status: &str,
    escrow_address: Option<&str>,
    clear_escrowed_at: bool,
) -> Result<(), sqlx::Error> {
    if clear_escrowed_at {
        sqlx::query(
            r#"
            UPDATE orders
            SET status = $1,
                escrow_address = $2,
                updated_at = now(),
                escrowed_at = NULL
            WHERE id = $3
            "#,
        )
        .bind(status)
        .bind(escrow_address)
        .bind(id)
        .execute(pool)
        .await?;
    } else {
        sqlx::query(
            r#"
            UPDATE orders
            SET status = $1,
                escrow_address = $2,
                updated_at = now()
            WHERE id = $3
            "#,
        )
        .bind(status)
        .bind(escrow_address)
        .bind(id)
        .execute(pool)
        .await?;
    }
    Ok(())
}
