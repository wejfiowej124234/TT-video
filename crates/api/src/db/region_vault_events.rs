//! RegionVault `RegionVaultForwarded` 投影表（14 §1.1.1、110、04 §四）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct RegionVaultForwardedEventRow {
    pub id: Uuid,
    pub chain_id: i64,
    pub block_number: i64,
    pub log_index: i32,
    pub block_hash: String,
    pub tx_hash: String,
    pub vault_address: String,
    pub token_address: String,
    pub to_address: String,
    pub amount_u256_hex: String,
    pub inserted_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct RegionVaultForwardedStats {
    pub total: i64,
    pub max_block_number: Option<i64>,
    pub min_block_number: Option<i64>,
    pub latest_inserted_at: Option<DateTime<Utc>>,
}

pub async fn region_vault_forwarded_stats(
    pool: &PgPool,
    chain_id: Option<i64>,
) -> Result<RegionVaultForwardedStats, sqlx::Error> {
    let row = sqlx::query_as::<_, (i64, Option<i64>, Option<i64>, Option<DateTime<Utc>>)>(
        r#"
        SELECT
            COUNT(*)::bigint,
            MAX(block_number),
            MIN(block_number),
            MAX(inserted_at)
        FROM region_vault_forwarded_events
        WHERE ($1::bigint IS NULL OR chain_id = $1)
        "#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;
    Ok(RegionVaultForwardedStats {
        total: row.0,
        max_block_number: row.1,
        min_block_number: row.2,
        latest_inserted_at: row.3,
    })
}

/// Admin **`GET …/region-vault/forwarded-events/export`**：单次快照上限（与 reconcile 全量导出硬上限同量级；P5-2-B）。
pub const ADMIN_REGION_VAULT_EXPORT_MAX_ROWS: u32 = 2000;

/// `limit?`：**1～[`ADMIN_REGION_VAULT_EXPORT_MAX_ROWS`]**；缺省取 **最大值**（一次导出尽可能多的最新行）。
pub fn parse_admin_region_vault_export_limit(limit_q: Option<u32>) -> Result<usize, &'static str> {
    match limit_q {
        None => Ok(ADMIN_REGION_VAULT_EXPORT_MAX_ROWS as usize),
        Some(0) => Err("invalid_limit"),
        Some(n) => Ok((n.min(ADMIN_REGION_VAULT_EXPORT_MAX_ROWS).max(1)) as usize),
    }
}

/// 只读导出：**`region_vault_forwarded_events`**、`ORDER BY block_number DESC, log_index DESC`、**`LIMIT max_rows+1`** 判定截断。
pub async fn list_region_vault_forwarded_events_export(
    pool: &PgPool,
    chain_id: Option<i64>,
    max_rows: usize,
) -> Result<(Vec<RegionVaultForwardedEventRow>, bool), sqlx::Error> {
    let fetch = (max_rows as i64).saturating_add(1);
    let mut rows = sqlx::query_as::<_, RegionVaultForwardedEventRow>(
        r#"
        SELECT
            id, chain_id, block_number, log_index, block_hash, tx_hash,
            vault_address, token_address, to_address, amount_u256_hex,
            inserted_at
        FROM region_vault_forwarded_events
        WHERE ($1::bigint IS NULL OR chain_id = $1)
        ORDER BY block_number DESC, log_index DESC
        LIMIT $2
        "#,
    )
    .bind(chain_id)
    .bind(fetch)
    .fetch_all(pool)
    .await?;
    let truncated = rows.len() > max_rows;
    if truncated {
        rows.truncate(max_rows);
    }
    Ok((rows, truncated))
}

pub async fn list_region_vault_forwarded_events(
    pool: &PgPool,
    chain_id: Option<i64>,
    after_block: Option<i64>,
    after_log: Option<i32>,
    limit: usize,
) -> Result<(Vec<RegionVaultForwardedEventRow>, bool), sqlx::Error> {
    let fetch = (limit as i64) + 1;
    let mut rows = sqlx::query_as::<_, RegionVaultForwardedEventRow>(
        r#"
        SELECT
            id, chain_id, block_number, log_index, block_hash, tx_hash,
            vault_address, token_address, to_address, amount_u256_hex,
            inserted_at
        FROM region_vault_forwarded_events
        WHERE ($1::bigint IS NULL OR chain_id = $1)
        AND (
            $2::bigint IS NULL
            OR block_number < $2
            OR (block_number = $2 AND log_index < $3)
        )
        ORDER BY block_number DESC, log_index DESC
        LIMIT $4
        "#,
    )
    .bind(chain_id)
    .bind(after_block)
    .bind(after_log)
    .bind(fetch)
    .fetch_all(pool)
    .await?;
    let has_more = rows.len() > limit;
    if has_more {
        rows.truncate(limit);
    }
    Ok((rows, has_more))
}

pub async fn insert_region_vault_forwarded_event(
    pool: &PgPool,
    chain_id: i64,
    block_number: i64,
    log_index: i32,
    block_hash: &str,
    tx_hash: &str,
    vault_address: &str,
    token_address: &str,
    to_address: &str,
    amount_u256_hex: &str,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        r#"
        INSERT INTO region_vault_forwarded_events (
            id, chain_id, block_number, log_index, block_hash, tx_hash,
            vault_address, token_address, to_address, amount_u256_hex
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (chain_id, block_number, log_index) DO NOTHING
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(chain_id)
    .bind(block_number)
    .bind(log_index)
    .bind(block_hash)
    .bind(tx_hash)
    .bind(vault_address)
    .bind(token_address)
    .bind(to_address)
    .bind(amount_u256_hex)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

pub async fn delete_region_vault_forwarded_events_from_block(
    pool: &PgPool,
    chain_id: i64,
    from_block_inclusive: i64,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        "DELETE FROM region_vault_forwarded_events WHERE chain_id = $1 AND block_number >= $2",
    )
    .bind(chain_id)
    .bind(from_block_inclusive)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::encode_fee_routes_cursor;

    #[test]
    fn parse_admin_region_vault_export_limit_defaults_and_clamps() {
        assert_eq!(
            parse_admin_region_vault_export_limit(None).unwrap(),
            ADMIN_REGION_VAULT_EXPORT_MAX_ROWS as usize
        );
        assert_eq!(
            parse_admin_region_vault_export_limit(Some(0)),
            Err("invalid_limit")
        );
        assert_eq!(parse_admin_region_vault_export_limit(Some(1)).unwrap(), 1);
        assert_eq!(
            parse_admin_region_vault_export_limit(Some(999_999)).unwrap(),
            ADMIN_REGION_VAULT_EXPORT_MAX_ROWS as usize
        );
    }

    /// B-116-3-2：`list_region_vault_forwarded_events` 降序分页 + cursor 与 `GET …/governance/vault-forwards` 同源。
    #[tokio::test]
    async fn list_region_vault_forwarded_events_pagination_desc_and_cursor() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!(
                    "list_region_vault_forwarded_events_pagination_desc_and_cursor: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        const CHAIN: i64 = 999_991_643;
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(2)
            .connect(&url)
            .await
            .expect("connect DATABASE_URL");
        sqlx::query("DELETE FROM region_vault_forwarded_events WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup");
        let vault = "0x2222222222222222222222222222222222222222";
        let token = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        let to_a = "0xcccccccccccccccccccccccccccccccccccccccc";
        let amt = "0x0000000000000000000000000000000000000000000000000000000000000001";
        for (bn, li) in [(52i64, 0i32), (51, 1), (51, 0), (50, 0)] {
            insert_region_vault_forwarded_event(
                &pool,
                CHAIN,
                bn,
                li,
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                vault,
                token,
                to_a,
                amt,
            )
            .await
            .expect("insert");
        }
        let (exp_rows, exp_trunc) =
            list_region_vault_forwarded_events_export(&pool, Some(CHAIN), 2)
                .await
                .expect("export");
        assert_eq!(exp_rows.len(), 2);
        assert!(exp_trunc);
        assert_eq!(exp_rows[0].block_number, 52);

        let (rows, has_more) =
            list_region_vault_forwarded_events(&pool, Some(CHAIN), None, None, 2)
                .await
                .expect("list page1");
        assert_eq!(rows.len(), 2);
        assert!(has_more);
        assert_eq!(rows[0].block_number, 52);
        assert_eq!(rows[0].log_index, 0);
        assert_eq!(rows[1].block_number, 51);
        assert_eq!(rows[1].log_index, 1);
        let cur = encode_fee_routes_cursor(rows[1].block_number, rows[1].log_index);
        assert_eq!(cur, "51:1");
        let (rows2, has_more2) = list_region_vault_forwarded_events(
            &pool,
            Some(CHAIN),
            Some(51),
            Some(1),
            2,
        )
        .await
        .expect("list page2");
        assert_eq!(rows2.len(), 2);
        assert!(!has_more2, "only two rows older than 51:1");
        assert_eq!(rows2[0].block_number, 51);
        assert_eq!(rows2[0].log_index, 0);
        assert_eq!(rows2[1].block_number, 50);
        let cur2 = encode_fee_routes_cursor(rows2[1].block_number, rows2[1].log_index);
        assert_eq!(cur2, "50:0");
        let (rows3, has_more3) = list_region_vault_forwarded_events(
            &pool,
            Some(CHAIN),
            Some(50),
            Some(0),
            10,
        )
        .await
        .expect("list tail");
        assert!(rows3.is_empty());
        assert!(!has_more3);
        sqlx::query("DELETE FROM region_vault_forwarded_events WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup tail");
    }

    /// B-116-2-3：`delete_region_vault_forwarded_events_from_block` 与 reorg rewind 同源；需已迁移 PG。
    #[tokio::test]
    async fn delete_region_vault_forwarded_events_from_block_removes_tail_for_chain() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!(
                    "delete_region_vault_forwarded_events_from_block_removes_tail_for_chain: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        const CHAIN: i64 = 999_991_624;
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(2)
            .connect(&url)
            .await
            .expect("connect DATABASE_URL");
        sqlx::query("DELETE FROM region_vault_forwarded_events WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup region_vault_forwarded_events");
        let vault = "0x2222222222222222222222222222222222222222";
        let token = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        let to_a = "0xcccccccccccccccccccccccccccccccccccccccc";
        let amt = "0x000000000000000000000000000000000000000000000000000000000000002a";
        for (bn, li) in [(10i64, 0i32), (11, 0), (12, 0)] {
            insert_region_vault_forwarded_event(
                &pool,
                CHAIN,
                bn,
                li,
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
                vault,
                token,
                to_a,
                amt,
            )
            .await
            .expect("insert");
        }
        let n = delete_region_vault_forwarded_events_from_block(&pool, CHAIN, 11)
            .await
            .expect("delete");
        assert_eq!(n, 2);
        let st = region_vault_forwarded_stats(&pool, Some(CHAIN))
            .await
            .expect("stats");
        assert_eq!(st.total, 1);
        assert_eq!(st.min_block_number, Some(10));
        sqlx::query("DELETE FROM region_vault_forwarded_events WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup tail");
    }
}
