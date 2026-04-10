//! P5-1-B：`CountryLedgerCredited` → **`p5_country_ledger_lines`**（与 **fee_router** / **region_vault** 投影 **无 JOIN、无派生**）

use sqlx::postgres::PgPool;
use uuid::Uuid;

/// 插入一条 **P5** 账本行；`(chain_id, block_number, log_index)` 冲突时忽略（幂等）。
pub async fn insert_p5_country_ledger_line(
    pool: &PgPool,
    chain_id: i64,
    block_number: i64,
    log_index: i32,
    block_hash: &str,
    tx_hash: &str,
    ledger_contract_address: &str,
    jurisdiction_id: &str,
    token_address: &str,
    direction: i16,
    amount_u256_hex: &str,
    ref_bytes32_hex: &str,
    source_kind: &str,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        r#"
        INSERT INTO p5_country_ledger_lines (
            id, chain_id, block_number, log_index, block_hash, tx_hash,
            ledger_contract_address, jurisdiction_id, token_address,
            direction, amount_u256_hex, ref_bytes32_hex, source_kind
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (chain_id, block_number, log_index) DO NOTHING
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(chain_id)
    .bind(block_number)
    .bind(log_index)
    .bind(block_hash)
    .bind(tx_hash)
    .bind(ledger_contract_address)
    .bind(jurisdiction_id)
    .bind(token_address)
    .bind(direction)
    .bind(amount_u256_hex)
    .bind(ref_bytes32_hex)
    .bind(source_kind)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn insert_p5_line_idempotent_when_db_available() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!("insert_p5_line_idempotent_when_db_available: skip (DATABASE_URL unset)");
                return;
            }
        };
        const CHAIN: i64 = 999_991_627;
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(2)
            .connect(&url)
            .await
            .expect("connect");
        sqlx::query("DELETE FROM p5_country_ledger_lines WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup");
        let ok1 = insert_p5_country_ledger_line(
            &pool,
            CHAIN,
            1,
            0,
            "0xaa",
            "0xbb",
            "0xcccccccccccccccccccccccccccccccccccccccc",
            "DE",
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            1,
            "0x000000000000000000000000000000000000000000000000000000000000002a",
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "onchain_credit",
        )
        .await
        .expect("insert1");
        assert!(ok1);
        let ok2 = insert_p5_country_ledger_line(
            &pool,
            CHAIN,
            1,
            0,
            "0xaa",
            "0xbb",
            "0xcccccccccccccccccccccccccccccccccccccccc",
            "DE",
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            1,
            "0x000000000000000000000000000000000000000000000000000000000000002a",
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            "onchain_credit",
        )
        .await
        .expect("insert2");
        assert!(!ok2, "second insert should be no-op");
        let (n,): (i64,) = sqlx::query_as(
            "SELECT COUNT(*)::bigint FROM p5_country_ledger_lines WHERE chain_id = $1",
        )
        .bind(CHAIN)
        .fetch_one(&pool)
        .await
        .expect("count");
        assert_eq!(n, 1);
    }
}
