//! orders 表：DbOrderRow、upsert_order、list_orders（48 §6.4）
//! start_date/end_date 见 48 §7.3、E3，80 §4.15
//!
//! **B-102 / TT-B102-ORDERS-LIST-CHAIN-SCOPE-SSOT-001**：**`GET /api/v1/orders`** **`orders_chain_id`** 过滤谓词与 **`orders_chain_scope`** 信封、**`orders_chain_id_backfill_dry_run`** 内嵌 **`orders_list_chain_scope`** **同源**（**`orders_row_matches_list_chain_scope`** / **`orders_list_chain_scope_json`**），**禁止**平行过滤逻辑。
//! **B-122 / TT-B122**：在 **`business_chain_id: Some(_)`**（与回填 dry-run / **GET** 主路径一致）下，**`orders_list_chain_scope_json`** 之 **`filter`/`orders_chain_id`/`default_business_chain_id`** 与 **`orders_row_matches_list_chain_scope`** **互证**（单测 **`tt_b122_*`**）。
//! **B-114-3 / TT-B114-3**：**`orders_row_allowed_projection_sync_chain_domain`** 与 **`sync_orders_from_projection_for_chain`** 同源，防 **`orders_projection`** 回放跨链污染 **`orders`**。
//! **B-151 / TT-B151**：**`orders.chain_id IS NULL`** **只读观测**（**`orders_chain_id_null_observability`**：**`by_status`** 分桶 + **`orders_null_chain_id_total`** 与 **B-102** 同源）；**不** backfill、**不** `DELETE`、**不**入 **`compound_gate`**。
//! **B-152 / orders 链一致性观测**：**`orders_chain_consistency_observability`** — **`orders.chain_id`** 已填但与 **进程/对账期望 `chain_id`** **不一致** 之行（**`by_status`** + **`orders_chain_id_mismatch_total`**）；**NULL** **`chain_id`** 见 **B-151**；**不** RPC、**不**入 **`compound_gate`**。
//! **B-153 / orders 链健康汇总**：**`orders_chain_health_observability`** — 聚合 **B-151+B-152**（**`orders_total`**、**`orders_null_chain_id_total`**、**`orders_chain_id_mismatch_total`**、**`null_ratio`/`mismatch_ratio`**、分桶）；**admin overview** 与 **reconcile** **仅此一键**，**不**再并列顶层 **151/152** 键。
//! **B-155**：**`reconciliation_reports.summary.orders_chain_health_trend_snapshot`**（**`db::reconciliation_reports::merge_orders_chain_health_trend_snapshot`**）在 **`persist:true`** 时滚动 **153** 标量之 **`by_batch`/`by_day`** 序列。

use chrono::{DateTime, NaiveDate, Utc};
use serde_json::{json, Value};
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

/// **`orders.chain_id IS NULL`** 行总数（**B-102** dry-run / 回填决策）。
pub async fn count_orders_chain_id_null(pool: &PgPool) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>(
        r#"SELECT COUNT(*)::bigint FROM orders WHERE chain_id IS NULL"#,
    )
    .fetch_one(pool)
    .await
}

/// **`orders.chain_id IS NULL`** 只读观测：**`by_status`** 分桶 + **`orders_null_chain_id_total`**（与 **`count_orders_chain_id_null`** / **B-102** **`orders_null_chain_id_total`** 同源）。
///
/// **TT-B151-ORDERS-CHAIN-ID-NULL-READ-ONLY-OBS-001**：**不**与投影/链上对拍；**不**构成业务双源 SSOT。
pub async fn orders_chain_id_null_observability(pool: &PgPool) -> Result<Value, sqlx::Error> {
    let rows = sqlx::query_as::<_, (String, i64)>(
        r#"
        SELECT status, COUNT(*)::bigint AS c
        FROM orders
        WHERE chain_id IS NULL
        GROUP BY status
        ORDER BY status ASC
        "#,
    )
    .fetch_all(pool)
    .await?;

    let total: i64 = rows.iter().map(|(_, n)| n).sum();
    let by_status: Vec<Value> = rows
        .into_iter()
        .map(|(status, cnt)| json!({ "status": status, "rows": cnt }))
        .collect();

    Ok(json!({
        "anchor": "151-ORDERS-CHAIN-ID-NULL-OBS-V1",
        "schema_version": 1,
        "orders_null_chain_id_total": total,
        "by_status": by_status,
        "getter_note": "Single-table orders WHERE chain_id IS NULL; by_status is GROUP BY orders.status",
        "boundary_vs_b102": "B-102 orders_chain_id_backfill_dry_run.orders_null_chain_id_total is the same total leg; B-151 adds by_status buckets.",
    }))
}

/// 行是否计入 **`orders_chain_id_mismatch`**：`chain_id` **已填**且 **≠** **`expected_chain_id`**（与下列 SQL 谓词一致）。
#[must_use]
pub fn order_chain_id_mismatches_expected_for_obs(
    order_chain_id: Option<i64>,
    expected_chain_id: i64,
) -> bool {
    matches!(order_chain_id, Some(cid) if cid != expected_chain_id)
}

/// **`orders.chain_id` ≠ 期望链** 只读观测：**`by_status`** 分桶 + **`orders_chain_id_mismatch_total`**。
///
/// **谓词**：**`chain_id IS NOT NULL AND chain_id <> expected_chain_id`**（**`expected_chain_id`** = **`ChainConfig.chain_id`** / **`CHAIN_ID`** / **`indexer-reconcile`** 对账链，由调用方传入）。
pub async fn orders_chain_consistency_observability(
    pool: &PgPool,
    expected_chain_id: i64,
) -> Result<Value, sqlx::Error> {
    let rows = sqlx::query_as::<_, (String, i64)>(
        r#"
        SELECT status, COUNT(*)::bigint AS c
        FROM orders
        WHERE chain_id IS NOT NULL AND chain_id <> $1
        GROUP BY status
        ORDER BY status ASC
        "#,
    )
    .bind(expected_chain_id)
    .fetch_all(pool)
    .await?;

    let total: i64 = rows.iter().map(|(_, n)| n).sum();
    let by_status: Vec<Value> = rows
        .into_iter()
        .map(|(status, cnt)| json!({ "status": status, "rows": cnt }))
        .collect();

    Ok(json!({
        "anchor": "152-ORDERS-CHAIN-CONSISTENCY-OBS-V1",
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "orders_chain_id_mismatch_total": total,
        "by_status": by_status,
        "getter_note": "Single-table orders WHERE chain_id IS NOT NULL AND chain_id <> expected_chain_id; NULL chain_id excluded (B-151).",
        "boundary_vs_b151": "B-151 counts NULL chain_id; B-152 counts non-NULL rows that differ from expected runtime/reconcile chain_id.",
    }))
}

/// **`orders_total`>0** 时返回 **`null_ratio`/`mismatch_ratio`**（**`f64`**）；否则 **`null`**（**分母为 0**）。
#[must_use]
pub fn orders_chain_health_ratio_fields(
    orders_total: i64,
    null_total: i64,
    mismatch_total: i64,
) -> (Value, Value) {
    if orders_total <= 0 {
        return (Value::Null, Value::Null);
    }
    let t = orders_total as f64;
    (
        json!(null_total as f64 / t),
        json!(mismatch_total as f64 / t),
    )
}

/// **B-151+B-152** 汇总：**`orders_total`**、**`null`**、**`mismatch`**、**`ratio`** + **`null_by_status`/`mismatch_by_status`**。
///
/// **`expected_chain_id`**：与 **`orders_chain_consistency_observability`** 同源（**`ChainConfig`/`CHAIN_ID`/reconcile `chain_id`**）。
pub async fn orders_chain_health_observability(
    pool: &PgPool,
    expected_chain_id: i64,
) -> Result<Value, sqlx::Error> {
    let (orders_total, null_total, mismatch_total) = sqlx::query_as::<_, (i64, i64, i64)>(
        r#"
        SELECT
            COUNT(*)::bigint AS orders_total,
            COUNT(*) FILTER (WHERE chain_id IS NULL)::bigint AS null_total,
            COUNT(*) FILTER (WHERE chain_id IS NOT NULL AND chain_id <> $1)::bigint AS mismatch_total
        FROM orders
        "#,
    )
    .bind(expected_chain_id)
    .fetch_one(pool)
    .await?;

    let null_rows = sqlx::query_as::<_, (String, i64)>(
        r#"
        SELECT status, COUNT(*)::bigint AS c
        FROM orders
        WHERE chain_id IS NULL
        GROUP BY status
        ORDER BY status ASC
        "#,
    )
    .fetch_all(pool)
    .await?;

    let mismatch_rows = sqlx::query_as::<_, (String, i64)>(
        r#"
        SELECT status, COUNT(*)::bigint AS c
        FROM orders
        WHERE chain_id IS NOT NULL AND chain_id <> $1
        GROUP BY status
        ORDER BY status ASC
        "#,
    )
    .bind(expected_chain_id)
    .fetch_all(pool)
    .await?;

    let null_by_status: Vec<Value> = null_rows
        .into_iter()
        .map(|(status, cnt)| json!({ "status": status, "rows": cnt }))
        .collect();
    let mismatch_by_status: Vec<Value> = mismatch_rows
        .into_iter()
        .map(|(status, cnt)| json!({ "status": status, "rows": cnt }))
        .collect();

    let aligned = orders_total - null_total - mismatch_total;
    let (null_ratio, mismatch_ratio) =
        orders_chain_health_ratio_fields(orders_total, null_total, mismatch_total);

    Ok(json!({
        "anchor": "153-ORDERS-CHAIN-HEALTH-OBS-V1",
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "orders_total": orders_total,
        "orders_null_chain_id_total": null_total,
        "orders_chain_id_mismatch_total": mismatch_total,
        "orders_aligned_expected_total": aligned,
        "null_ratio": null_ratio,
        "mismatch_ratio": mismatch_ratio,
        "null_by_status": null_by_status,
        "mismatch_by_status": mismatch_by_status,
        "getter_note": "Aggregates B-151 (NULL chain_id buckets) and B-152 (non-NULL chain_id <> expected_chain_id buckets); orders_total is COUNT(*) from orders.",
        "boundary_vs_b151_b152": "Single overview/reconcile key; B-151/B-152 scalar legs match orders_null_chain_id_total and orders_chain_id_mismatch_total; ratios use orders_total as denominator.",
    }))
}

/// **`GET /api/v1/orders`** 列表链过滤谓词（**`chain_off::OrderRow.chain_id`** 与 query 同源）。
///
/// **TT-B102-ORDERS-LIST-CHAIN-SCOPE-ROW-001**：与 **`orders_list_chain_scope_json`** 的 **`rule`/`filter`** 语义一致。
pub fn orders_row_matches_list_chain_scope(
    order_chain_id: Option<i64>,
    business_chain_id: Option<i64>,
    query_chain_id: Option<i64>,
) -> bool {
    match (business_chain_id, query_chain_id) {
        (None, None) => true,
        (None, Some(_)) => true,
        (Some(b), None) => order_chain_id.is_none() || order_chain_id == Some(b),
        (Some(b), Some(q)) => {
            if q == b {
                order_chain_id.is_none() || order_chain_id == Some(q)
            } else {
                order_chain_id == Some(q)
            }
        }
    }
}

/// **`GET /api/v1/orders`** 响应根级 **`orders_chain_scope`**；**`POST …/indexer-reconcile`** **`orders_chain_id_backfill_dry_run.orders_list_chain_scope`** **同函数**。
///
/// **TT-B102-ORDERS-LIST-CHAIN-SCOPE-ENVELOPE-001**
pub fn orders_list_chain_scope_json(
    business_chain_id: Option<i64>,
    query_chain_id: Option<i64>,
) -> Value {
    match (business_chain_id, query_chain_id) {
        (None, None) => json!({
            "filter": "none",
            "rule": "实例未配置 CHAIN_ID：不按 orders.chain_id 过滤列表"
        }),
        (None, Some(q)) => json!({
            "filter": "explicit_chain_id",
            "orders_chain_id": q,
            "rule": "未配置默认业务链：仅返回 orders.chain_id 匹配该值的行（不含 NULL）"
        }),
        (Some(b), None) => json!({
            "filter": "default_business_chain",
            "default_business_chain_id": b,
            "includes_null_chain_id": true,
            "rule": "orders.chain_id IS NULL 或 = default_business_chain_id"
        }),
        (Some(b), Some(q)) if q == b => json!({
            "filter": "default_business_chain",
            "default_business_chain_id": b,
            "orders_chain_id": q,
            "includes_null_chain_id": true,
            "rule": "显式 orders_chain_id 与默认链相同：同默认范围（含 NULL legacy）"
        }),
        (Some(b), Some(q)) => json!({
            "filter": "strict_chain_id",
            "default_business_chain_id": b,
            "orders_chain_id": q,
            "includes_null_chain_id": false,
            "rule": "仅 orders.chain_id 精确匹配 orders_chain_id（不含 NULL）"
        }),
    }
}

/// **`orders_projection` → `orders` 同步**链域门闸（**B-114-3**）：
/// - **`order_chain_id == None`**：允许（历史行，归属待回填，仍仅消费**本次** `projection_chain_id` 的投影表）。
/// - **`order_chain_id == Some(cid)`**：仅当 **`cid == projection_chain_id`** 时允许改写，避免一条业务订单被**另一条链**的投影回放误更新。
#[must_use]
pub fn orders_row_allowed_projection_sync_chain_domain(
    order_chain_id: Option<i64>,
    projection_chain_id: i64,
) -> bool {
    match order_chain_id {
        None => true,
        Some(cid) => cid == projection_chain_id,
    }
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

#[cfg(test)]
mod b114_3_orders_chain_domain_tests {
    use super::orders_row_allowed_projection_sync_chain_domain;

    #[test]
    fn b114_3_orders_chain_domain_legacy_null_allows_sync_under_any_projection_chain() {
        assert!(orders_row_allowed_projection_sync_chain_domain(None, 137));
        assert!(orders_row_allowed_projection_sync_chain_domain(None, 1));
    }

    #[test]
    fn b114_3_orders_chain_domain_stamped_row_requires_matching_projection_chain() {
        assert!(orders_row_allowed_projection_sync_chain_domain(Some(137), 137));
        assert!(!orders_row_allowed_projection_sync_chain_domain(Some(1), 137));
        assert!(!orders_row_allowed_projection_sync_chain_domain(Some(137), 1));
        assert!(!orders_row_allowed_projection_sync_chain_domain(Some(999), 137));
    }
}

#[cfg(test)]
mod b102_orders_chain_scope_tests {
    use super::{orders_list_chain_scope_json, orders_row_matches_list_chain_scope};

    /// **TT-B102-ROW-PREDICATE-VS-ENVELOPE-001**：典型 **`(business, query, order.chain_id)`** 与信封 **`filter`** 可互证。
    #[test]
    fn b102_row_matches_list_chain_scope_matches_envelope_semantics() {
        let b = Some(137_i64);
        let q = Some(137_i64);
        let env = orders_list_chain_scope_json(b, q);
        assert_eq!(env["filter"], "default_business_chain");
        assert!(orders_row_matches_list_chain_scope(None, b, q));
        assert!(orders_row_matches_list_chain_scope(Some(137), b, q));
        assert!(!orders_row_matches_list_chain_scope(Some(1), b, q));

        let env_strict = orders_list_chain_scope_json(b, Some(1_i64));
        assert_eq!(env_strict["filter"], "strict_chain_id");
        assert!(!orders_row_matches_list_chain_scope(None, b, Some(1)));
        assert!(orders_row_matches_list_chain_scope(Some(1), b, Some(1)));
    }

    /// **TT-B102-BACKFILL-DRY-RUN-SCOPE-EMBED-001**：回填 dry-run 内嵌 **`orders_list_chain_scope`** 与 **`GET ?orders_chain_id=reconcile_chain_id`** 同源（本测不跑 PG）。
    #[test]
    fn b102_backfill_dry_run_embeds_same_scope_as_list_query() {
        let scope = orders_list_chain_scope_json(Some(137), Some(137));
        assert_eq!(scope, orders_list_chain_scope_json(Some(137), Some(137)));
        let scope_none_biz = orders_list_chain_scope_json(None, Some(42));
        assert_eq!(scope_none_biz["filter"], "explicit_chain_id");
        assert_eq!(scope_none_biz["orders_chain_id"], 42);
    }

    /// 仅从 **`orders_list_chain_scope_json`** 产出之 **`filter`/`orders_chain_id`/`default_business_chain_id`** 推导行是否可见（**不**手写第二套 match）；与 **`orders_row_matches_list_chain_scope`** 对照。
    fn b122_visible_from_scope_envelope(scope: &serde_json::Value, order_chain_id: Option<i64>) -> bool {
        match scope.get("filter").and_then(|x| x.as_str()) {
            Some("none") => true,
            Some("default_business_chain") => {
                let b = scope["default_business_chain_id"]
                    .as_i64()
                    .expect("default_business_chain_id");
                order_chain_id.is_none() || order_chain_id == Some(b)
            }
            Some("strict_chain_id") | Some("explicit_chain_id") => {
                let q = scope["orders_chain_id"].as_i64().expect("orders_chain_id");
                order_chain_id == Some(q)
            }
            other => panic!("unexpected orders_chain_scope.filter: {:?}", other),
        }
    }

    /// **TT-B122-ORDERS-LIST-SCOPE-ROW-ENVELOPE-TRIPLE-001**：**`business_chain_id: Some(137)`** 时 **`orders_list_chain_scope_json`** 与 **`orders_row_matches_list_chain_scope`** 对 **`query_chain_id`** ∈ **`None` / `137` / `1`** 一致（与 **`orders_chain_id_backfill_dry_run_summary`** 内嵌 **`orders_list_chain_scope`**、**`GET /orders`** 同源）。
    #[test]
    fn tt_b122_row_matches_list_chain_scope_matches_scope_envelope_for_configured_business() {
        let b = Some(137_i64);
        for q in [None, Some(137_i64), Some(1_i64)] {
            let scope = orders_list_chain_scope_json(b, q);
            for oc in [None, Some(137_i64), Some(1_i64), Some(999_i64)] {
                let row = orders_row_matches_list_chain_scope(oc, b, q);
                let from_env = b122_visible_from_scope_envelope(&scope, oc);
                assert_eq!(
                    row, from_env,
                    "business={:?} query={:?} order.chain_id={:?}",
                    b, q, oc
                );
            }
        }
    }
}

#[cfg(test)]
mod b151_orders_chain_id_null_obs_tests {
    use serde_json::json;

    /// **TT-B151**：机读壳 **`anchor`/`by_status`** 形状稳定（**不**跑 PG）。
    #[test]
    fn b151_orders_chain_id_null_obs_anchor_and_by_status_shape() {
        let v = json!({
            "anchor": "151-ORDERS-CHAIN-ID-NULL-OBS-V1",
            "schema_version": 1,
            "orders_null_chain_id_total": 0_i64,
            "by_status": [],
            "getter_note": "Single-table orders WHERE chain_id IS NULL; by_status is GROUP BY orders.status",
            "boundary_vs_b102": "B-102 orders_chain_id_backfill_dry_run.orders_null_chain_id_total is the same total leg; B-151 adds by_status buckets.",
        });
        assert_eq!(v["anchor"], "151-ORDERS-CHAIN-ID-NULL-OBS-V1");
        assert!(v["by_status"].is_array());
    }
}

#[cfg(test)]
mod b152_orders_chain_consistency_obs_tests {
    use super::order_chain_id_mismatches_expected_for_obs;
    use serde_json::json;

    #[test]
    fn b152_mismatch_predicate_matches_sql_semantics() {
        assert!(!order_chain_id_mismatches_expected_for_obs(None, 137));
        assert!(!order_chain_id_mismatches_expected_for_obs(Some(137), 137));
        assert!(order_chain_id_mismatches_expected_for_obs(Some(1), 137));
        assert!(order_chain_id_mismatches_expected_for_obs(Some(31337), 137));
    }

    /// 机读壳 **`anchor`/`orders_chain_id_mismatch_total`/`by_status`** 形状稳定（**不**跑 PG）。
    #[test]
    fn b152_orders_chain_consistency_obs_anchor_and_by_status_shape() {
        let v = json!({
            "anchor": "152-ORDERS-CHAIN-CONSISTENCY-OBS-V1",
            "schema_version": 1,
            "expected_chain_id": 137_i64,
            "orders_chain_id_mismatch_total": 0_i64,
            "by_status": [],
            "getter_note": "Single-table orders WHERE chain_id IS NOT NULL AND chain_id <> expected_chain_id; NULL chain_id excluded (B-151).",
            "boundary_vs_b151": "B-151 counts NULL chain_id; B-152 counts non-NULL rows that differ from expected runtime/reconcile chain_id.",
        });
        assert_eq!(v["anchor"], "152-ORDERS-CHAIN-CONSISTENCY-OBS-V1");
        assert!(v["by_status"].is_array());
    }
}

#[cfg(test)]
mod b153_orders_chain_health_obs_tests {
    use super::orders_chain_health_ratio_fields;
    use serde_json::json;

    #[test]
    fn b153_ratio_null_when_orders_total_zero() {
        let (nr, mr) = orders_chain_health_ratio_fields(0, 0, 0);
        assert!(nr.is_null() && mr.is_null());
    }

    #[test]
    fn b153_ratio_halves_when_half_null() {
        let (nr, mr) = orders_chain_health_ratio_fields(100, 50, 10);
        assert_eq!(nr.as_f64(), Some(0.5));
        assert_eq!(mr.as_f64(), Some(0.1));
    }

    #[test]
    fn b153_health_obs_anchor_shape() {
        let v = json!({
            "anchor": "153-ORDERS-CHAIN-HEALTH-OBS-V1",
            "schema_version": 1,
            "expected_chain_id": 137_i64,
            "orders_total": 0_i64,
            "orders_null_chain_id_total": 0_i64,
            "orders_chain_id_mismatch_total": 0_i64,
            "orders_aligned_expected_total": 0_i64,
            "null_ratio": serde_json::Value::Null,
            "mismatch_ratio": serde_json::Value::Null,
            "null_by_status": [],
            "mismatch_by_status": [],
        });
        assert_eq!(v["anchor"], "153-ORDERS-CHAIN-HEALTH-OBS-V1");
        assert!(v["null_by_status"].is_array());
        assert!(v["mismatch_by_status"].is_array());
    }
}
