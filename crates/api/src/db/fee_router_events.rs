//! FeeRouter `PlatformFeeRouted` 投影表（110、14 §1.1、04 §四）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use uuid::Uuid;

/// 单页上限（与 04 §3.4 governance fee-routes 一致）
pub const FEE_ROUTES_MAX_LIMIT: u32 = 100;
/// Admin 只读列表单页上限（04 §3.5）
pub const ADMIN_FEE_ROUTER_MAX_LIMIT: u32 = 200;

/// 列表行（`GET /api/v1/governance/fee-routes`）
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct FeeRouterRoutedEventRow {
    pub id: Uuid,
    pub chain_id: i64,
    pub block_number: i64,
    pub log_index: i32,
    pub block_hash: String,
    pub tx_hash: String,
    pub router_address: String,
    pub token_address: String,
    pub amount_u256_hex: String,
    pub to_country_u256_hex: String,
    pub to_stakers_u256_hex: String,
    pub to_reserve_u256_hex: String,
    pub to_ops_u256_hex: String,
    pub inserted_at: DateTime<Utc>,
}

/// 游标：`"{block_number}:{log_index}"`（与链上 log 序一致，降序分页）
pub fn encode_fee_routes_cursor(block_number: i64, log_index: i32) -> String {
    format!("{block_number}:{log_index}")
}

pub fn parse_fee_routes_cursor(s: &str) -> Result<(i64, i32), &'static str> {
    let s = s.trim();
    let (b, l) = s.split_once(':').ok_or("invalid_cursor")?;
    let block: i64 = b.parse().map_err(|_| "invalid_cursor")?;
    let log: i32 = l.parse().map_err(|_| "invalid_cursor")?;
    if block < 0 || log < 0 {
        return Err("invalid_cursor");
    }
    Ok((block, log))
}

/// 解析 limit：缺省 50；`0` 非法；上限 [`FEE_ROUTES_MAX_LIMIT`]
pub fn parse_fee_routes_limit(limit_q: Option<u32>) -> Result<usize, &'static str> {
    match limit_q {
        None => Ok(50),
        Some(0) => Err("invalid_limit"),
        Some(n) => Ok((n.min(FEE_ROUTES_MAX_LIMIT).max(1)) as usize),
    }
}

/// Admin：`GET /api/v1/admin/fee-router/routed-events` 分页上限 [`ADMIN_FEE_ROUTER_MAX_LIMIT`]
pub fn parse_admin_fee_router_limit(limit_q: Option<u32>) -> Result<usize, &'static str> {
    match limit_q {
        None => Ok(50),
        Some(0) => Err("invalid_limit"),
        Some(n) => Ok((n.min(ADMIN_FEE_ROUTER_MAX_LIMIT).max(1)) as usize),
    }
}

/// 汇总（可选按 `chain_id` 过滤）
#[derive(Debug, Clone)]
pub struct FeeRouterRoutedStats {
    pub total: i64,
    pub max_block_number: Option<i64>,
    pub min_block_number: Option<i64>,
    pub latest_inserted_at: Option<DateTime<Utc>>,
}

pub async fn fee_router_routed_stats(
    pool: &PgPool,
    chain_id: Option<i64>,
) -> Result<FeeRouterRoutedStats, sqlx::Error> {
    let row = sqlx::query_as::<_, (i64, Option<i64>, Option<i64>, Option<DateTime<Utc>>)>(
        r#"
        SELECT
            COUNT(*)::bigint,
            MAX(block_number),
            MIN(block_number),
            MAX(inserted_at)
        FROM fee_router_routed_events
        WHERE ($1::bigint IS NULL OR chain_id = $1)
        "#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;
    Ok(FeeRouterRoutedStats {
        total: row.0,
        max_block_number: row.1,
        min_block_number: row.2,
        latest_inserted_at: row.3,
    })
}

/// 降序分页；`after_*` 为上一页最后一条的 `(block, log)`；多取 1 条判断 `has_more`
pub async fn list_fee_router_routed_events(
    pool: &PgPool,
    chain_id: Option<i64>,
    after_block: Option<i64>,
    after_log: Option<i32>,
    limit: usize,
) -> Result<(Vec<FeeRouterRoutedEventRow>, bool), sqlx::Error> {
    let fetch = (limit as i64) + 1;
    let mut rows = sqlx::query_as::<_, FeeRouterRoutedEventRow>(
        r#"
        SELECT
            id, chain_id, block_number, log_index, block_hash, tx_hash,
            router_address, token_address,
            amount_u256_hex, to_country_u256_hex, to_stakers_u256_hex, to_reserve_u256_hex, to_ops_u256_hex,
            inserted_at
        FROM fee_router_routed_events
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

/// 插入一条路由事件；`(chain_id, block_number, log_index)` 冲突时忽略（幂等）。
pub async fn insert_fee_router_routed_event(
    pool: &PgPool,
    chain_id: i64,
    block_number: i64,
    log_index: i32,
    block_hash: &str,
    tx_hash: &str,
    router_address: &str,
    token_address: &str,
    amount_u256_hex: &str,
    to_country_u256_hex: &str,
    to_stakers_u256_hex: &str,
    to_reserve_u256_hex: &str,
    to_ops_u256_hex: &str,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        r#"
        INSERT INTO fee_router_routed_events (
            id, chain_id, block_number, log_index, block_hash, tx_hash,
            router_address, token_address,
            amount_u256_hex, to_country_u256_hex, to_stakers_u256_hex, to_reserve_u256_hex, to_ops_u256_hex
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
    .bind(router_address)
    .bind(token_address)
    .bind(amount_u256_hex)
    .bind(to_country_u256_hex)
    .bind(to_stakers_u256_hex)
    .bind(to_reserve_u256_hex)
    .bind(to_ops_u256_hex)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

/// **reorg 回滚**：删除 **`block_number >= from_block_inclusive`** 的 FeeRouter 投影行（110 §3.1.3 Partial）。
pub async fn delete_fee_router_routed_events_from_block(
    pool: &PgPool,
    chain_id: i64,
    from_block_inclusive: i64,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        "DELETE FROM fee_router_routed_events WHERE chain_id = $1 AND block_number >= $2",
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

    #[test]
    fn parse_cursor_roundtrip() {
        let s = encode_fee_routes_cursor(12_345, 7);
        assert_eq!(parse_fee_routes_cursor(&s).unwrap(), (12_345, 7));
    }

    #[test]
    fn parse_cursor_rejects_bad() {
        assert!(parse_fee_routes_cursor("").is_err());
        assert!(parse_fee_routes_cursor("abc:1").is_err());
        assert!(parse_fee_routes_cursor("1").is_err());
        assert!(parse_fee_routes_cursor("-1:0").is_err());
        assert!(parse_fee_routes_cursor("0:-1").is_err());
    }

    #[test]
    fn limit_defaults_and_clamps() {
        assert_eq!(parse_fee_routes_limit(None).unwrap(), 50);
        assert_eq!(parse_fee_routes_limit(Some(1)).unwrap(), 1);
        assert_eq!(parse_fee_routes_limit(Some(200)).unwrap(), 100);
        assert_eq!(parse_fee_routes_limit(Some(100)).unwrap(), 100);
        assert_eq!(parse_fee_routes_limit(Some(101)).unwrap(), 100);
        assert!(parse_fee_routes_limit(Some(0)).is_err());
    }

    #[test]
    fn admin_limit_clamps_at_200() {
        assert_eq!(parse_admin_fee_router_limit(Some(500)).unwrap(), 200);
        assert_eq!(parse_admin_fee_router_limit(None).unwrap(), 50);
    }

    /// B-116-2-3：`delete_fee_router_routed_events_from_block` 与 reorg rewind 同源 SQL；需已迁移 PG。
    #[tokio::test]
    async fn delete_fee_router_routed_events_from_block_removes_tail_for_chain() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!(
                    "delete_fee_router_routed_events_from_block_removes_tail_for_chain: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        const CHAIN: i64 = 999_991_623;
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(2)
            .connect(&url)
            .await
            .expect("connect DATABASE_URL");
        sqlx::query("DELETE FROM fee_router_routed_events WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup fee_router_routed_events");
        let router = "0x1111111111111111111111111111111111111111";
        let token = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        let w0 = "0x0000000000000000000000000000000000000000000000000000000000000001";
        let w1 = "0x0000000000000000000000000000000000000000000000000000000000000002";
        let w2 = "0x0000000000000000000000000000000000000000000000000000000000000003";
        let w3 = "0x0000000000000000000000000000000000000000000000000000000000000004";
        let w4 = "0x0000000000000000000000000000000000000000000000000000000000000005";
        for (bn, li) in [(10i64, 0i32), (11, 0), (12, 0)] {
            insert_fee_router_routed_event(
                &pool,
                CHAIN,
                bn,
                li,
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                router,
                token,
                w0,
                w1,
                w2,
                w3,
                w4,
            )
            .await
            .expect("insert");
        }
        let n = delete_fee_router_routed_events_from_block(&pool, CHAIN, 11)
            .await
            .expect("delete");
        assert_eq!(n, 2, "blocks 11 and 12 should be removed");
        let st = fee_router_routed_stats(&pool, Some(CHAIN))
            .await
            .expect("stats");
        assert_eq!(st.total, 1);
        assert_eq!(st.min_block_number, Some(10));
        sqlx::query("DELETE FROM fee_router_routed_events WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup tail");
    }
}
