//! **B-391** / **TT-B391**：**三** **经济** **投影表** **`max(block_number)`** **union** **与** **indexer checkpoint** **间隙** **（** **只读** **DB** **+** **进程** **checkpoint** **；** **不**入 **`compound_gate`** **）**。

use serde_json::{json, Value};
use sqlx::postgres::PgPool;

/// **TT-B391** / **母表 B-391**：机读锚（**`revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability`**）。
pub const REVENUE_PIPELINE_UNION_MAX_PROJECTION_BLOCK_VS_INDEXER_CHECKPOINT_OBS_ANCHOR: &str =
    "391-REVENUE-PIPELINE-UNION-MAX-PROJECTION-BLOCK-VS-INDEXER-CHECKPOINT-OBS-V1";

fn gap_blocks_i64(checkpoint: u64, union_max: i64) -> i64 {
    let c = i128::from(checkpoint);
    let u = i128::from(union_max);
    let g = c - u;
    if g > i64::MAX as i128 {
        i64::MAX
    } else if g < i64::MIN as i128 {
        i64::MIN
    } else {
        g as i64
    }
}

/// **纯** **内存** **组装** **（** **单测** **直** **调** **）** **。**
pub fn revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability_v1(
    expected_chain_id: i64,
    fr_total: i64,
    fr_max: Option<i64>,
    rv_total: i64,
    rv_max: Option<i64>,
    p5_total: i64,
    p5_max: Option<i64>,
    indexer_checkpoint_block_number: u64,
) -> Value {
    let leg_fr = if fr_total > 0 {
        json!(fr_max)
    } else {
        Value::Null
    };
    let leg_rv = if rv_total > 0 {
        json!(rv_max)
    } else {
        Value::Null
    };
    let leg_p5 = if p5_total > 0 {
        json!(p5_max)
    } else {
        Value::Null
    };

    let mut candidates: Vec<i64> = Vec::new();
    if fr_total > 0 {
        if let Some(m) = fr_max {
            candidates.push(m);
        }
    }
    if rv_total > 0 {
        if let Some(m) = rv_max {
            candidates.push(m);
        }
    }
    if p5_total > 0 {
        if let Some(m) = p5_max {
            candidates.push(m);
        }
    }

    let union_max_block_number = if candidates.is_empty() {
        None
    } else {
        Some(candidates.into_iter().max().unwrap_or(0))
    };

    let union_max_json = match union_max_block_number {
        Some(n) => json!(n),
        None => Value::Null,
    };

    let (gap_blocks, marker, observation_note) = match union_max_block_number {
        None => (
            Value::Null,
            "incomparable",
            json!("projection_tables_empty_all_legs"),
        ),
        Some(um) => {
            let g = gap_blocks_i64(indexer_checkpoint_block_number, um);
            let m = if g < 0 { "drift" } else { "aligned" };
            (json!(g), m, json!("ok"))
        }
    };

    json!({
        "anchor": REVENUE_PIPELINE_UNION_MAX_PROJECTION_BLOCK_VS_INDEXER_CHECKPOINT_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "DB max(block_number) per fee_router_routed_events / region_vault_forwarded_events / p5_country_ledger_lines for this chain_id; union_max = max of leg maxes where the table has rows. gap_blocks = indexer_checkpoint_block_number - union_max (process indexer checkpoint, same family as reconcile checkpoint / overview.indexer.checkpoint).",
        "per_leg_max_block_number": {
            "fee_router_routed_events": leg_fr,
            "region_vault_forwarded_events": leg_rv,
            "p5_country_ledger_lines": leg_p5,
        },
        "union_max_block_number": union_max_json,
        "indexer_checkpoint_block_number": indexer_checkpoint_block_number,
        "gap_blocks": gap_blocks,
        "marker": marker,
        "observation_note": observation_note,
    })
}

/// **异步** **：** **三** **表** **stats** **+** **checkpoint** **。**
pub async fn revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability(
    pool: &PgPool,
    expected_chain_id: i64,
    indexer_checkpoint_block_number: u64,
) -> Result<Value, sqlx::Error> {
    let (fr, rv, p5) = tokio::try_join!(
        super::fee_router_routed_stats(pool, Some(expected_chain_id)),
        super::region_vault_forwarded_stats(pool, Some(expected_chain_id)),
        super::p5_country_ledger_lines_stats(pool, Some(expected_chain_id)),
    )?;
    Ok(revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability_v1(
        expected_chain_id,
        fr.total,
        fr.max_block_number,
        rv.total,
        rv.max_block_number,
        p5.total,
        p5.max_block_number,
        indexer_checkpoint_block_number,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn b391_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_UNION_MAX_PROJECTION_BLOCK_VS_INDEXER_CHECKPOINT_OBS_ANCHOR,
            "391-REVENUE-PIPELINE-UNION-MAX-PROJECTION-BLOCK-VS-INDEXER-CHECKPOINT-OBS-V1"
        );
    }

    #[test]
    fn b391_empty_legs_incomparable() {
        let v = revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability_v1(
            137, 0, None, 0, None, 0, None, 100,
        );
        assert!(v["union_max_block_number"].is_null());
        assert_eq!(v["gap_blocks"], Value::Null);
        assert_eq!(v["marker"], json!("incomparable"));
        assert_eq!(v["observation_note"], json!("projection_tables_empty_all_legs"));
    }

    #[test]
    fn b391_aligned_when_checkpoint_ahead() {
        let v = revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability_v1(
            137, 1, Some(50), 0, None, 0, None, 100,
        );
        assert_eq!(v["union_max_block_number"], json!(50));
        assert_eq!(v["gap_blocks"], json!(50));
        assert_eq!(v["marker"], json!("aligned"));
    }

    #[test]
    fn b391_drift_when_projection_above_checkpoint() {
        let v = revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability_v1(
            137, 1, Some(200), 0, None, 0, None, 100,
        );
        assert_eq!(v["gap_blocks"], json!(-100));
        assert_eq!(v["marker"], json!("drift"));
    }

    #[test]
    fn b391_union_max_across_legs() {
        let v = revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability_v1(
            137, 1, Some(10), 1, Some(99), 1, Some(50), 100,
        );
        assert_eq!(v["union_max_block_number"], json!(99));
        assert_eq!(v["gap_blocks"], json!(1));
        assert_eq!(v["marker"], json!("aligned"));
    }
}
