//! 区域 **RegionShare** Snapshot 链下行级 SSOT（**B-115-1** / 83 Snapshot 叙事；**B-115-4** 经 **`POST …/internal/region-share-snapshot-line`** 与 **`indexer_tick`** 物化）
//!
//! - **独立**于 **`fee_router_routed_events`**、**`region_vault_forwarded_events`**（不得混表）
//! - 幂等键：**`(chain_id, region_id, snapshot_epoch, recipient_address)`**
//! - **`snapshot_epoch`**：该区域一次 Snapshot 轮次（单调整数，产品/治理定义）
//! - **`share_balance_u256_hex`**：该轮次下持有人在 **`snapshot_block_number`** 的份额余额（uint256 0x 词）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow, PartialEq, Eq)]
pub struct RegionShareSnapshotLineRow {
    pub id: Uuid,
    pub chain_id: i64,
    pub region_id: String,
    pub snapshot_epoch: i64,
    pub recipient_address: String,
    pub snapshot_block_number: i64,
    pub share_balance_u256_hex: String,
    pub inserted_at: DateTime<Utc>,
}

/// 插入一行；若违反自然键唯一约束则 **不覆盖**（`ON CONFLICT DO NOTHING`），返回 **`None`**。
pub async fn insert_region_share_snapshot_line(
    pool: &PgPool,
    chain_id: i64,
    region_id: &str,
    snapshot_epoch: i64,
    recipient_address: &str,
    snapshot_block_number: i64,
    share_balance_u256_hex: &str,
) -> Result<Option<Uuid>, sqlx::Error> {
    let id = sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO region_share_snapshot_lines (
            chain_id, region_id, snapshot_epoch, recipient_address,
            snapshot_block_number, share_balance_u256_hex
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (chain_id, region_id, snapshot_epoch, recipient_address) DO NOTHING
        RETURNING id
        "#,
    )
    .bind(chain_id)
    .bind(region_id)
    .bind(snapshot_epoch)
    .bind(recipient_address)
    .bind(snapshot_block_number)
    .bind(share_balance_u256_hex)
    .fetch_optional(pool)
    .await?;
    Ok(id)
}

pub async fn get_region_share_snapshot_line(
    pool: &PgPool,
    chain_id: i64,
    region_id: &str,
    snapshot_epoch: i64,
    recipient_address: &str,
) -> Result<Option<RegionShareSnapshotLineRow>, sqlx::Error> {
    sqlx::query_as::<_, RegionShareSnapshotLineRow>(
        r#"
        SELECT id, chain_id, region_id, snapshot_epoch, recipient_address,
               snapshot_block_number, share_balance_u256_hex, inserted_at
        FROM region_share_snapshot_lines
        WHERE chain_id = $1 AND region_id = $2 AND snapshot_epoch = $3 AND recipient_address = $4
        "#,
    )
    .bind(chain_id)
    .bind(region_id)
    .bind(snapshot_epoch)
    .bind(recipient_address)
    .fetch_optional(pool)
    .await
}

pub async fn list_region_share_snapshot_lines_for_epoch(
    pool: &PgPool,
    chain_id: i64,
    region_id: &str,
    snapshot_epoch: i64,
) -> Result<Vec<RegionShareSnapshotLineRow>, sqlx::Error> {
    sqlx::query_as::<_, RegionShareSnapshotLineRow>(
        r#"
        SELECT id, chain_id, region_id, snapshot_epoch, recipient_address,
               snapshot_block_number, share_balance_u256_hex, inserted_at
        FROM region_share_snapshot_lines
        WHERE chain_id = $1 AND region_id = $2 AND snapshot_epoch = $3
        ORDER BY recipient_address ASC
        "#,
    )
    .bind(chain_id)
    .bind(region_id)
    .bind(snapshot_epoch)
    .fetch_all(pool)
    .await
}

pub async fn delete_region_share_snapshot_lines_for_epoch(
    pool: &PgPool,
    chain_id: i64,
    region_id: &str,
    snapshot_epoch: i64,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        r#"DELETE FROM region_share_snapshot_lines
           WHERE chain_id = $1 AND region_id = $2 AND snapshot_epoch = $3"#,
    )
    .bind(chain_id)
    .bind(region_id)
    .bind(snapshot_epoch)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn insert_on_conflict_preserves_first_share_balance() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!(
                    "insert_on_conflict_preserves_first_share_balance: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        const CHAIN: i64 = 999_991_551;
        const EPOCH: i64 = 7;
        const REGION: &str = "CN";
        const RECIPIENT: &str = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(2)
            .connect(&url)
            .await
            .expect("connect DATABASE_URL");
        sqlx::query("DELETE FROM region_share_snapshot_lines WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup");

        let first = insert_region_share_snapshot_line(
            &pool,
            CHAIN,
            REGION,
            EPOCH,
            RECIPIENT,
            12_345,
            "0x0000000000000000000000000000000000000000000000000000000000000001",
        )
        .await
        .expect("insert");
        assert!(first.is_some(), "first insert should return id");

        let dup = insert_region_share_snapshot_line(
            &pool,
            CHAIN,
            REGION,
            EPOCH,
            RECIPIENT,
            99_999,
            "0x00000000000000000000000000000000000000000000000000000000000000ff",
        )
        .await
        .expect("dup insert");
        assert!(dup.is_none(), "second insert same key should noop");

        let row = get_region_share_snapshot_line(&pool, CHAIN, REGION, EPOCH, RECIPIENT)
            .await
            .expect("get")
            .expect("row");
        assert_eq!(row.snapshot_block_number, 12_345);
        assert_eq!(
            row.share_balance_u256_hex,
            "0x0000000000000000000000000000000000000000000000000000000000000001"
        );

        sqlx::query("DELETE FROM region_share_snapshot_lines WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup tail");
    }

    #[tokio::test]
    async fn get_and_list_and_delete_by_epoch() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!("get_and_list_and_delete_by_epoch: skip (DATABASE_URL unset)");
                return;
            }
        };
        const CHAIN: i64 = 999_991_552;
        const REGION: &str = "US";
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(2)
            .connect(&url)
            .await
            .expect("connect DATABASE_URL");
        sqlx::query("DELETE FROM region_share_snapshot_lines WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup");

        insert_region_share_snapshot_line(
            &pool,
            CHAIN,
            REGION,
            1,
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            100,
            "0x0000000000000000000000000000000000000000000000000000000000000002",
        )
        .await
        .expect("insert b")
        .expect("id b");
        insert_region_share_snapshot_line(
            &pool,
            CHAIN,
            REGION,
            1,
            "0xcccccccccccccccccccccccccccccccccccccccc",
            100,
            "0x0000000000000000000000000000000000000000000000000000000000000003",
        )
        .await
        .expect("insert c")
        .expect("id c");
        insert_region_share_snapshot_line(
            &pool,
            CHAIN,
            REGION,
            2,
            "0xdddddddddddddddddddddddddddddddddddddddd",
            200,
            "0x0000000000000000000000000000000000000000000000000000000000000004",
        )
        .await
        .expect("insert epoch2")
        .expect("id d");

        assert!(
            get_region_share_snapshot_line(&pool, CHAIN, REGION, 1, "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
                .await
                .expect("get")
                .is_none()
        );

        let list1 = list_region_share_snapshot_lines_for_epoch(&pool, CHAIN, REGION, 1)
            .await
            .expect("list");
        assert_eq!(list1.len(), 2);

        let n = delete_region_share_snapshot_lines_for_epoch(&pool, CHAIN, REGION, 1)
            .await
            .expect("delete");
        assert_eq!(n, 2);

        let list_after = list_region_share_snapshot_lines_for_epoch(&pool, CHAIN, REGION, 1)
            .await
            .expect("list2");
        assert!(list_after.is_empty());
        let list_e2 = list_region_share_snapshot_lines_for_epoch(&pool, CHAIN, REGION, 2)
            .await
            .expect("list e2");
        assert_eq!(list_e2.len(), 1);

        sqlx::query("DELETE FROM region_share_snapshot_lines WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup tail");
    }
}
