//! **TT-B161**：`investor_stake_state_events` / `investor_lock_state_events` 投影尾块 vs **进程** **`ApiMetaState.indexer_checkpoint`** 的只读块滞后观测（**不**扩 indexer-tick、drift marker、FeeRouter、RegionVault、orders、`GET /meta`）。

use serde_json::{json, Value};
use sqlx::postgres::PgPool;

pub const STAKE_LOCK_PROJECTION_BLOCK_LAG_OBS_ANCHOR: &str =
    "161-STAKE-LOCK-PROJECTION-BLOCK-LAG-OBS-V1";

const GETTER_NOTE: &str = "TT-B161: MAX(block_number) FROM investor_stake_state_events / investor_lock_state_events WHERE chain_id; lag_vs_checkpoint = indexer_checkpoint_block_number - max (signed; negative => projection tail above checkpoint). Checkpoint = process ApiMetaState.indexer_checkpoint.block_number. Read-only; NOT B-153 (event_log vs RPC chain head). NOT compound_gate.";

/// **`MAX(block_number)`** 按 **`chain_id`**；**无行** 时 **`stake_events_max_block_number`/`lock_events_max_block_number`** 为 **`null`**，滞后字段同为 **`null`**。
pub async fn stake_lock_projection_block_lag_observability(
    pool: &PgPool,
    chain_id: i64,
    indexer_checkpoint_block_number: i64,
) -> Result<Value, sqlx::Error> {
    let stake_max: Option<i64> = sqlx::query_scalar(
        r#"SELECT MAX(block_number) FROM investor_stake_state_events WHERE chain_id = $1"#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;

    let lock_max: Option<i64> = sqlx::query_scalar(
        r#"SELECT MAX(block_number) FROM investor_lock_state_events WHERE chain_id = $1"#,
    )
    .bind(chain_id)
    .fetch_one(pool)
    .await?;

    let stake_lag = stake_max.map(|m| indexer_checkpoint_block_number - m);
    let lock_lag = lock_max.map(|m| indexer_checkpoint_block_number - m);

    Ok(json!({
        "anchor": STAKE_LOCK_PROJECTION_BLOCK_LAG_OBS_ANCHOR,
        "schema_version": 1,
        "chain_id": chain_id,
        "indexer_checkpoint_block_number": indexer_checkpoint_block_number,
        "stake_events_max_block_number": stake_max,
        "lock_events_max_block_number": lock_max,
        "stake_lag_vs_checkpoint_blocks": stake_lag,
        "lock_lag_vs_checkpoint_blocks": lock_lag,
        "getter_note": GETTER_NOTE,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn b161_anchor_constant() {
        assert_eq!(
            STAKE_LOCK_PROJECTION_BLOCK_LAG_OBS_ANCHOR,
            "161-STAKE-LOCK-PROJECTION-BLOCK-LAG-OBS-V1"
        );
    }

    #[tokio::test]
    async fn b161_stake_lock_block_lag_json_shape() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!(
                    "b161_stake_lock_block_lag_json_shape: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        const CHAIN: i64 = 999_991_661;
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(2)
            .connect(&url)
            .await
            .expect("connect DATABASE_URL");
        sqlx::query("DELETE FROM investor_stake_state_events WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup stake");
        sqlx::query("DELETE FROM investor_lock_state_events WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup lock");

        let v = stake_lock_projection_block_lag_observability(&pool, CHAIN, 100_i64)
            .await
            .expect("obs");
        assert_eq!(
            v["anchor"].as_str(),
            Some(STAKE_LOCK_PROJECTION_BLOCK_LAG_OBS_ANCHOR)
        );
        assert_eq!(v["schema_version"], 1);
        assert_eq!(v["chain_id"], CHAIN);
        assert_eq!(v["indexer_checkpoint_block_number"], 100);
        assert!(v["stake_events_max_block_number"].is_null());
        assert!(v["lock_events_max_block_number"].is_null());
        assert!(v["stake_lag_vs_checkpoint_blocks"].is_null());
        assert!(v["lock_lag_vs_checkpoint_blocks"].is_null());
        assert!(v["getter_note"].is_string());
    }

    /// 投影尾高于 checkpoint 时 **`stake_lag_vs_checkpoint_blocks`** 为 **负**（与 release proof 切片一致）。
    #[tokio::test]
    async fn b161_tail_above_checkpoint_negative_lag() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!(
                    "b161_tail_above_checkpoint_negative_lag: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        const CHAIN: i64 = 999_991_662;
        let pool = sqlx::postgres::PgPoolOptions::new()
            .max_connections(2)
            .connect(&url)
            .await
            .expect("connect DATABASE_URL");
        sqlx::query("DELETE FROM investor_stake_state_events WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup stake");
        sqlx::query("DELETE FROM investor_lock_state_events WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup lock");

        crate::db::insert_investor_stake_state_event(
            &pool,
            CHAIN,
            62_i64,
            0_i32,
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
            "0x1111111111111111111111111111111111111111",
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "Staked",
            "0x01",
        )
        .await
        .expect("insert stake");

        let v = stake_lock_projection_block_lag_observability(&pool, CHAIN, 0_i64)
            .await
            .expect("obs");
        assert_eq!(v["stake_events_max_block_number"], 62);
        assert_eq!(v["stake_lag_vs_checkpoint_blocks"], -62);
        assert!(v["lock_events_max_block_number"].is_null());
        assert!(v["lock_lag_vs_checkpoint_blocks"].is_null());

        sqlx::query("DELETE FROM investor_stake_state_events WHERE chain_id = $1")
            .bind(CHAIN)
            .execute(&pool)
            .await
            .expect("cleanup stake tail");
    }
}
