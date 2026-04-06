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
