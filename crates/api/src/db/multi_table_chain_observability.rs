//! **B-171 / B-176** 共用机读壳的 **DB 侧矩阵行**（**`multi_table_chain_matrix.rows`**）。
//! **B-171**：按表 **`DISTINCT chain_id` + `COUNT(*)`**（**非** **B-151** **`NULL` 专审** — **`orders`** 仅 **`chain_id IS NOT NULL`**）。
//! **B-176**：在同一 **`rows`** 条目中扩展 **`max_block_number`**（**禁止**另起平行顶层 **`max_block_*`** 键族）。
//!
//! **`max_block_number` 语义**：能 **`MAX(block_number)`** 的表用链上块高尾；**`governance_proposals_projection`** 用 **`MAX(snapshot_block)`**；**`region_share_snapshot_lines`** 用 **`MAX(snapshot_block_number)`**；**`orders_projection`** 为单行 **`paid_at_block` / `completed_at_block` / `dispute_opened_at_block`** 之 **`MAX`** 再对链 **`MAX`**；**`orders`** / **`correction_log`** 无块高列 → **`null`**。

use serde_json::{json, Value};
use sqlx::PgPool;

async fn push_matrix_rows(
    pool: &PgPool,
    table: &'static str,
    sql: &str,
    out: &mut Vec<Value>,
) -> Result<(), sqlx::Error> {
    let rows: Vec<(i64, i64, Option<i64>)> = sqlx::query_as(sql).fetch_all(pool).await?;
    for (chain_id, row_count, max_block_number) in rows {
        out.push(json!({
            "table": table,
            "chain_id": chain_id,
            "row_count": row_count,
            "max_block_number": max_block_number,
        }));
    }
    Ok(())
}

/// **TT-B171** + **TT-B176**：**`multi_table_chain_observability.multi_table_chain_matrix.rows`**。
pub async fn multi_table_chain_id_footprint_matrix_rows(pool: &PgPool) -> Result<Vec<Value>, sqlx::Error> {
    let mut rows = Vec::new();

    push_matrix_rows(
        pool,
        "event_log",
        r#"SELECT chain_id, COUNT(*)::bigint, MAX(block_number)::bigint FROM event_log GROUP BY chain_id ORDER BY chain_id"#,
        &mut rows,
    )
    .await?;
    push_matrix_rows(
        pool,
        "orders",
        r#"SELECT chain_id, COUNT(*)::bigint, NULL::bigint FROM orders WHERE chain_id IS NOT NULL GROUP BY chain_id ORDER BY chain_id"#,
        &mut rows,
    )
    .await?;
    push_matrix_rows(
        pool,
        "orders_projection",
        r#"SELECT chain_id, COUNT(*)::bigint,
            MAX((SELECT MAX(v) FROM unnest(ARRAY[paid_at_block, completed_at_block, dispute_opened_at_block]) AS u(v)))::bigint
            FROM orders_projection GROUP BY chain_id ORDER BY chain_id"#,
        &mut rows,
    )
    .await?;
    push_matrix_rows(
        pool,
        "checkpoints_sharded",
        r#"SELECT chain_id, COUNT(*)::bigint, MAX(block_number)::bigint FROM checkpoints_sharded GROUP BY chain_id ORDER BY chain_id"#,
        &mut rows,
    )
    .await?;
    push_matrix_rows(
        pool,
        "fee_router_routed_events",
        r#"SELECT chain_id, COUNT(*)::bigint, MAX(block_number)::bigint FROM fee_router_routed_events GROUP BY chain_id ORDER BY chain_id"#,
        &mut rows,
    )
    .await?;
    push_matrix_rows(
        pool,
        "region_vault_forwarded_events",
        r#"SELECT chain_id, COUNT(*)::bigint, MAX(block_number)::bigint FROM region_vault_forwarded_events GROUP BY chain_id ORDER BY chain_id"#,
        &mut rows,
    )
    .await?;
    push_matrix_rows(
        pool,
        "governance_proposals_projection",
        r#"SELECT chain_id, COUNT(*)::bigint, MAX(snapshot_block)::bigint FROM governance_proposals_projection GROUP BY chain_id ORDER BY chain_id"#,
        &mut rows,
    )
    .await?;
    push_matrix_rows(
        pool,
        "region_share_snapshot_lines",
        r#"SELECT chain_id, COUNT(*)::bigint, MAX(snapshot_block_number)::bigint FROM region_share_snapshot_lines GROUP BY chain_id ORDER BY chain_id"#,
        &mut rows,
    )
    .await?;
    push_matrix_rows(
        pool,
        "p5_country_ledger_lines",
        r#"SELECT chain_id, COUNT(*)::bigint, MAX(block_number)::bigint FROM p5_country_ledger_lines GROUP BY chain_id ORDER BY chain_id"#,
        &mut rows,
    )
    .await?;
    push_matrix_rows(
        pool,
        "correction_log",
        r#"SELECT chain_id, COUNT(*)::bigint, NULL::bigint FROM correction_log GROUP BY chain_id ORDER BY chain_id"#,
        &mut rows,
    )
    .await?;

    Ok(rows)
}
