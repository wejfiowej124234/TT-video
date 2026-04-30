//! 自由市场星标：`market_travel_bookmarks`（用户级、与 `discover/orders` 及向导卡 `id` 对齐）
//! 表上 **`target_id`** 无指向 **`orders` / `guides`** 的外键；写路径在 API 层做存在性校验（94 · P29）。
//! HTTP 写入须用 [`insert_market_travel_bookmark_validated`]，避免「先查后插」窗口内目标被删仍落孤儿行（BM-INSERT-ATOMIC-001）。

use sqlx::PgPool;
use uuid::Uuid;

/// [`insert_market_travel_bookmark_validated`] 的语义分支（单事务内判定）。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MarketBookmarkUpsertOutcome {
    /// 新插入一行。
    Inserted,
    /// 目标仍存在且书签已存在（`ON CONFLICT DO NOTHING`），幂等 **200**。
    IdempotentAlready,
    /// 目标在 `orders` / `guides` 中不存在（或仅瞬时可见性下不可用），**400** `bookmark_target_not_found`。
    TargetNotFound,
}

/// **`order`**：`orders.id`；**`guide`**：**`guides.id`**（与 `orders.guide_id` 同源）。其它类型返回 **`false`**。
pub async fn market_travel_bookmark_target_exists(
    pool: &PgPool,
    target_type: &str,
    target_id: Uuid,
) -> Result<bool, sqlx::Error> {
    match target_type {
        "order" => {
            let n: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM orders WHERE id = $1")
                .bind(target_id)
                .fetch_one(pool)
                .await?;
            Ok(n > 0)
        }
        "guide" => {
            let n: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM guides WHERE id = $1")
                .bind(target_id)
                .fetch_one(pool)
                .await?;
            Ok(n > 0)
        }
        _ => Ok(false),
    }
}

/// 仅返回 **`orders`** 仍存在的星标（与 **`POST …/market-bookmarks`** 目标守卫一致；孤儿行不进入列表 SSOT）。
pub async fn list_market_travel_bookmark_order_ids(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<Uuid>, sqlx::Error> {
    sqlx::query_scalar::<_, Uuid>(
        r#"SELECT b.target_id FROM market_travel_bookmarks b
           INNER JOIN orders o ON o.id = b.target_id
           WHERE b.user_id = $1 AND b.target_type = 'order'
           ORDER BY b.created_at DESC"#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

/// 仅返回 **`guides`** 仍存在的星标。
pub async fn list_market_travel_bookmark_guide_ids(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<Uuid>, sqlx::Error> {
    sqlx::query_scalar::<_, Uuid>(
        r#"SELECT b.target_id FROM market_travel_bookmarks b
           INNER JOIN guides g ON g.id = b.target_id
           WHERE b.user_id = $1 AND b.target_type = 'guide'
           ORDER BY b.created_at DESC"#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

/// 返回 **`rows_affected`**：**`1`** 为新星标，**`0`** 为幂等重复（**`ON CONFLICT DO NOTHING`**）。
///
/// 无目标存在性约束；路由层应优先 [`insert_market_travel_bookmark_validated`]。
pub async fn insert_market_travel_bookmark(
    pool: &PgPool,
    user_id: Uuid,
    target_type: &str,
    target_id: Uuid,
) -> Result<u64, sqlx::Error> {
    let n = sqlx::query(
        r#"INSERT INTO market_travel_bookmarks (user_id, target_type, target_id) VALUES ($1, $2, $3)
           ON CONFLICT (user_id, target_type, target_id) DO NOTHING"#,
    )
    .bind(user_id)
    .bind(target_type)
    .bind(target_id)
    .execute(pool)
    .await?
    .rows_affected();
    Ok(n)
}

/// 单事务：**仅当** `orders` / `guides` 存在对应 **`target_id`** 时插入；与 **`ON CONFLICT DO NOTHING`** 组合后，
/// 用二次 **`EXISTS`** 区分 **`TargetNotFound`** 与 **`IdempotentAlready`**（BM-INSERT-ATOMIC-001）。
///
/// **`target_type`** 须为 **`order`** 或 **`guide`**（与路由规范化一致）。
pub async fn insert_market_travel_bookmark_validated(
    pool: &PgPool,
    user_id: Uuid,
    target_type: &str,
    target_id: Uuid,
) -> Result<MarketBookmarkUpsertOutcome, sqlx::Error> {
    if !matches!(target_type, "order" | "guide") {
        return Ok(MarketBookmarkUpsertOutcome::TargetNotFound);
    }
    let mut tx = pool.begin().await?;
    let inserted: u64 = if target_type == "order" {
        sqlx::query(
            r#"INSERT INTO market_travel_bookmarks (user_id, target_type, target_id)
               SELECT $1, 'order', $2
               WHERE EXISTS (SELECT 1 FROM orders WHERE id = $2)
               ON CONFLICT (user_id, target_type, target_id) DO NOTHING"#,
        )
        .bind(user_id)
        .bind(target_id)
        .execute(&mut *tx)
        .await?
        .rows_affected()
    } else {
        sqlx::query(
            r#"INSERT INTO market_travel_bookmarks (user_id, target_type, target_id)
               SELECT $1, 'guide', $2
               WHERE EXISTS (SELECT 1 FROM guides WHERE id = $2)
               ON CONFLICT (user_id, target_type, target_id) DO NOTHING"#,
        )
        .bind(user_id)
        .bind(target_id)
        .execute(&mut *tx)
        .await?
        .rows_affected()
    };
    if inserted >= 1 {
        tx.commit().await?;
        return Ok(MarketBookmarkUpsertOutcome::Inserted);
    }
    let target_still_exists: bool = if target_type == "order" {
        let n: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM orders WHERE id = $1")
            .bind(target_id)
            .fetch_one(&mut *tx)
            .await?;
        n > 0
    } else {
        let n: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM guides WHERE id = $1")
            .bind(target_id)
            .fetch_one(&mut *tx)
            .await?;
        n > 0
    };
    tx.commit().await?;
    Ok(if target_still_exists {
        MarketBookmarkUpsertOutcome::IdempotentAlready
    } else {
        MarketBookmarkUpsertOutcome::TargetNotFound
    })
}

pub async fn delete_market_travel_bookmark(
    pool: &PgPool,
    user_id: Uuid,
    target_type: &str,
    target_id: Uuid,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        "DELETE FROM market_travel_bookmarks WHERE user_id = $1 AND target_type = $2 AND target_id = $3",
    )
    .bind(user_id)
    .bind(target_type)
    .bind(target_id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}
