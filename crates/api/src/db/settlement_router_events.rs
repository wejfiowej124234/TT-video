//! SettlementRouter event projection (L5-C · Money Path Bridge).
//! Tables: `settlement_router_events`, `escrow_settlement_projection`
//! (migration `20260719190000_l5c_settlement_router_projection.sql`).

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::postgres::PgPool;
use uuid::Uuid;

/// Admin list row (`GET /api/v1/admin/settlement-router/events`).
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct SettlementRouterEventRow {
    pub id: Uuid,
    pub chain_id: i64,
    pub block_number: i64,
    pub log_index: i32,
    pub block_hash: String,
    pub tx_hash: String,
    pub router_address: String,
    pub event_name: String,
    pub order_id_hex: String,
    pub escrow_address: Option<String>,
    pub token_address: Option<String>,
    pub amount_u256_hex: Option<String>,
    pub steward_share_u256_hex: Option<String>,
    pub pool_share_u256_hex: Option<String>,
    pub inserted_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct SettlementRouterEventStats {
    pub total: i64,
    pub max_block_number: Option<i64>,
    pub min_block_number: Option<i64>,
    pub latest_inserted_at: Option<DateTime<Utc>>,
}

/// Admin cursor page (desc by block/log; same cursor encoding as FeeRouter).
pub async fn list_settlement_router_events(
    pool: &PgPool,
    chain_id: Option<i64>,
    after_block: Option<i64>,
    after_log: Option<i32>,
    limit: usize,
) -> Result<(Vec<SettlementRouterEventRow>, bool), sqlx::Error> {
    let fetch = (limit as i64) + 1;
    let mut rows = sqlx::query_as::<_, SettlementRouterEventRow>(
        r#"
        SELECT
            id, chain_id, block_number, log_index, block_hash, tx_hash,
            router_address, event_name, order_id_hex, escrow_address,
            token_address, amount_u256_hex, steward_share_u256_hex, pool_share_u256_hex,
            inserted_at
        FROM settlement_router_events
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

pub async fn settlement_router_event_stats(
    pool: &PgPool,
    chain_id: Option<i64>,
) -> Result<SettlementRouterEventStats, sqlx::Error> {
    let row = sqlx::query_as::<_, (i64, Option<i64>, Option<i64>, Option<DateTime<Utc>>)>(
        r#"
        SELECT
            COUNT(*)::bigint,
            MAX(block_number),
            MIN(block_number),
            MAX(inserted_at)
        FROM settlement_router_events
        WHERE ($1::bigint IS NULL OR chain_id = $1)
        "#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;
    Ok(SettlementRouterEventStats {
        total: row.0,
        max_block_number: row.1,
        min_block_number: row.2,
        latest_inserted_at: row.3,
    })
}

/// Per-`event_name` counts for Finance Source Matrix honesty.
pub async fn settlement_router_event_counts_by_name(
    pool: &PgPool,
    chain_id: Option<i64>,
) -> Result<Vec<(String, i64)>, sqlx::Error> {
    sqlx::query_as::<_, (String, i64)>(
        r#"
        SELECT event_name, COUNT(*)::bigint
        FROM settlement_router_events
        WHERE ($1::bigint IS NULL OR chain_id = $1)
        GROUP BY event_name
        ORDER BY event_name
        "#,
    )
    .bind(chain_id)
    .fetch_all(pool)
    .await
}

/// Insert one SettlementRouter log; `(chain_id, block_number, log_index)` conflict → ignore (idempotent).
#[allow(clippy::too_many_arguments)]
pub async fn insert_settlement_router_event(
    pool: &PgPool,
    chain_id: i64,
    block_number: i64,
    log_index: i32,
    block_hash: &str,
    tx_hash: &str,
    router_address: &str,
    event_name: &str,
    order_id_hex: &str,
    escrow_address: Option<&str>,
    token_address: Option<&str>,
    amount_u256_hex: Option<&str>,
    steward_share_u256_hex: Option<&str>,
    pool_share_u256_hex: Option<&str>,
    payload_json: &Value,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        r#"
        INSERT INTO settlement_router_events (
            id, chain_id, block_number, log_index, block_hash, tx_hash,
            router_address, event_name, order_id_hex, escrow_address,
            token_address, amount_u256_hex, steward_share_u256_hex, pool_share_u256_hex,
            payload_json
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (chain_id, block_number, log_index) DO NOTHING
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(chain_id)
    .bind(block_number)
    .bind(log_index)
    .bind(block_hash)
    .bind(tx_hash)
    .bind(router_address)
    .bind(event_name)
    .bind(order_id_hex)
    .bind(escrow_address)
    .bind(token_address)
    .bind(amount_u256_hex)
    .bind(steward_share_u256_hex)
    .bind(pool_share_u256_hex)
    .bind(payload_json)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

/// Upsert per-order settlement SM projection (monotonic on state ordinal when possible).
#[allow(clippy::too_many_arguments)]
pub async fn upsert_escrow_settlement_projection(
    pool: &PgPool,
    chain_id: i64,
    order_id_hex: &str,
    escrow_address: Option<&str>,
    settlement_state: i16,
    settlement_state_name: &str,
    fee_leg_amount_u256_hex: Option<&str>,
    last_event_name: &str,
    last_block_number: i64,
    last_log_index: i32,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO escrow_settlement_projection (
            chain_id, order_id_hex, escrow_address,
            settlement_state, settlement_state_name,
            fee_leg_amount_u256_hex, last_event_name,
            last_block_number, last_log_index, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (chain_id, order_id_hex) DO UPDATE SET
            escrow_address = COALESCE(EXCLUDED.escrow_address, escrow_settlement_projection.escrow_address),
            settlement_state = GREATEST(
                escrow_settlement_projection.settlement_state,
                EXCLUDED.settlement_state
            ),
            settlement_state_name = CASE
                WHEN EXCLUDED.settlement_state >= escrow_settlement_projection.settlement_state
                THEN EXCLUDED.settlement_state_name
                ELSE escrow_settlement_projection.settlement_state_name
            END,
            fee_leg_amount_u256_hex = COALESCE(
                EXCLUDED.fee_leg_amount_u256_hex,
                escrow_settlement_projection.fee_leg_amount_u256_hex
            ),
            last_event_name = CASE
                WHEN (EXCLUDED.last_block_number, EXCLUDED.last_log_index)
                     > (escrow_settlement_projection.last_block_number, escrow_settlement_projection.last_log_index)
                THEN EXCLUDED.last_event_name
                ELSE escrow_settlement_projection.last_event_name
            END,
            last_block_number = CASE
                WHEN (EXCLUDED.last_block_number, EXCLUDED.last_log_index)
                     > (escrow_settlement_projection.last_block_number, escrow_settlement_projection.last_log_index)
                THEN EXCLUDED.last_block_number
                ELSE escrow_settlement_projection.last_block_number
            END,
            last_log_index = CASE
                WHEN (EXCLUDED.last_block_number, EXCLUDED.last_log_index)
                     > (escrow_settlement_projection.last_block_number, escrow_settlement_projection.last_log_index)
                THEN EXCLUDED.last_log_index
                ELSE escrow_settlement_projection.last_log_index
            END,
            updated_at = NOW()
        "#,
    )
    .bind(chain_id)
    .bind(order_id_hex)
    .bind(escrow_address)
    .bind(settlement_state)
    .bind(settlement_state_name)
    .bind(fee_leg_amount_u256_hex)
    .bind(last_event_name)
    .bind(last_block_number)
    .bind(last_log_index)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_settlement_router_events_from_block(
    pool: &PgPool,
    chain_id: i64,
    from_block_inclusive: i64,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        "DELETE FROM settlement_router_events WHERE chain_id = $1 AND block_number >= $2",
    )
    .bind(chain_id)
    .bind(from_block_inclusive)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}

pub async fn delete_escrow_settlement_projection_from_block(
    pool: &PgPool,
    chain_id: i64,
    from_block_inclusive: i64,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        "DELETE FROM escrow_settlement_projection WHERE chain_id = $1 AND last_block_number >= $2",
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
    use serde_json::json;

    /// Indexer write path · insert → stats → counts_by_name → projection upsert → reorg delete.
    /// Requires migrated PG (`settlement_router_events` + `escrow_settlement_projection`).
    #[tokio::test]
    async fn settlement_router_insert_stats_projection_and_reorg_delete_roundtrip() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!(
                    "settlement_router_insert_stats_projection_and_reorg_delete_roundtrip: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        const CHAIN: i64 = 999_991_719;
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(2)
            .connect(&url)
            .await
            .expect("connect DATABASE_URL");

        sqlx::query("DELETE FROM escrow_settlement_projection WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup projection");
        sqlx::query("DELETE FROM settlement_router_events WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup events");

        let router = "0x5a6df184e9c6b1285f8beb50a438d82d5f094d6a";
        let order = "0x00000000000000000000000000000000000000000000000000000000000000ab";
        let escrow = "0xcccccccccccccccccccccccccccccccccccccccc";
        let bh = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        let th = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        let payload = json!({ "settlement_state": 1 });

        let inserted = insert_settlement_router_event(
            &pool,
            CHAIN,
            100,
            0,
            bh,
            th,
            router,
            "FeeLegReceived",
            order,
            Some(escrow),
            Some("0xdddddddddddddddddddddddddddddddddddddddd"),
            Some("0x10"),
            None,
            None,
            &payload,
        )
        .await
        .expect("insert FeeLegReceived");
        assert!(inserted);

        let dup = insert_settlement_router_event(
            &pool,
            CHAIN,
            100,
            0,
            bh,
            th,
            router,
            "FeeLegReceived",
            order,
            Some(escrow),
            None,
            None,
            None,
            None,
            &payload,
        )
        .await
        .expect("idempotent duplicate");
        assert!(!dup, "ON CONFLICT DO NOTHING must report false");

        let inserted2 = insert_settlement_router_event(
            &pool,
            CHAIN,
            101,
            1,
            bh,
            th,
            router,
            "SettlementReadyMarked",
            order,
            Some(escrow),
            None,
            None,
            None,
            None,
            &json!({ "settlement_state": 2 }),
        )
        .await
        .expect("insert SettlementReadyMarked");
        assert!(inserted2);

        upsert_escrow_settlement_projection(
            &pool,
            CHAIN,
            order,
            Some(escrow),
            1,
            "FeeLegReceived",
            Some("0x10"),
            "FeeLegReceived",
            100,
            0,
        )
        .await
        .expect("upsert state 1");
        upsert_escrow_settlement_projection(
            &pool,
            CHAIN,
            order,
            Some(escrow),
            2,
            "SettlementReadyMarked",
            Some("0x10"),
            "SettlementReadyMarked",
            101,
            1,
        )
        .await
        .expect("upsert state 2");

        let st = settlement_router_event_stats(&pool, Some(CHAIN))
            .await
            .expect("stats");
        assert_eq!(st.total, 2);
        assert_eq!(st.min_block_number, Some(100));
        assert_eq!(st.max_block_number, Some(101));

        let by_name = settlement_router_event_counts_by_name(&pool, Some(CHAIN))
            .await
            .expect("counts");
        assert_eq!(by_name.len(), 2);

        let n_ev = delete_settlement_router_events_from_block(&pool, CHAIN, 101)
            .await
            .expect("delete events from 101");
        assert_eq!(n_ev, 1);
        let n_proj = delete_escrow_settlement_projection_from_block(&pool, CHAIN, 101)
            .await
            .expect("delete projection from 101");
        assert_eq!(n_proj, 1);

        let st2 = settlement_router_event_stats(&pool, Some(CHAIN))
            .await
            .expect("stats after reorg");
        assert_eq!(st2.total, 1);
        assert_eq!(st2.max_block_number, Some(100));

        sqlx::query("DELETE FROM escrow_settlement_projection WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup projection tail");
        sqlx::query("DELETE FROM settlement_router_events WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup events tail");
    }
}
