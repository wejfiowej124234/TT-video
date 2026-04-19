//! **B-394** / **TT-B394**：**三** **经济** **投影表** **各** **`max(block_number)`** **之** **跨腿** **块** **spread** **（** **只读** **DB** **；** **不**入 **`compound_gate`** **）**。
//!
//! **语义**：在 **至少两** **条** **非空** **腿** **上**，**`spread_blocks = max(leg_max) − min(leg_max)`**；**`spread_blocks > 0`** **→** **`marker=drift`** **（** **腿间** **索引** **进度** **不一致** **）**。

use serde_json::{json, Value};
use sqlx::postgres::PgPool;

/// **TT-B394** / **母表 B-394**：机读锚（**`revenue_pipeline_per_leg_projection_max_block_spread_observability`**）。
pub const REVENUE_PIPELINE_PER_LEG_PROJECTION_MAX_BLOCK_SPREAD_OBS_ANCHOR: &str =
    "394-REVENUE-PIPELINE-PER-LEG-PROJECTION-MAX-BLOCK-SPREAD-OBS-V1";

fn spread_i64(min_v: i64, max_v: i64) -> i64 {
    let d = i128::from(max_v) - i128::from(min_v);
    if d > i64::MAX as i128 {
        i64::MAX
    } else if d < i64::MIN as i128 {
        i64::MIN
    } else {
        d as i64
    }
}

/// **纯** **内存** **组装** **（** **单测** **）** **。**
pub fn revenue_pipeline_per_leg_projection_max_block_spread_observability_v1(
    expected_chain_id: i64,
    fr_total: i64,
    fr_max: Option<i64>,
    rv_total: i64,
    rv_max: Option<i64>,
    p5_total: i64,
    p5_max: Option<i64>,
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

    let mut leg_maxes: Vec<i64> = Vec::new();
    if fr_total > 0 {
        if let Some(m) = fr_max {
            leg_maxes.push(m);
        }
    }
    if rv_total > 0 {
        if let Some(m) = rv_max {
            leg_maxes.push(m);
        }
    }
    if p5_total > 0 {
        if let Some(m) = p5_max {
            leg_maxes.push(m);
        }
    }

    let (min_leg_max_block_number, max_leg_max_block_number, spread_blocks, marker, observation_note) =
        if leg_maxes.is_empty() {
            (
                Value::Null,
                Value::Null,
                Value::Null,
                "incomparable",
                json!("projection_tables_empty_all_legs"),
            )
        } else if leg_maxes.len() == 1 {
            let only = leg_maxes[0];
            (
                json!(only),
                json!(only),
                json!(0_i64),
                "aligned",
                json!("single_leg_no_inter_leg_spread"),
            )
        } else {
            let min_v = *leg_maxes.iter().min().unwrap_or(&0);
            let max_v = *leg_maxes.iter().max().unwrap_or(&0);
            let sp = spread_i64(min_v, max_v);
            let m = if sp > 0 { "drift" } else { "aligned" };
            (
                json!(min_v),
                json!(max_v),
                json!(sp),
                m,
                json!("ok"),
            )
        };

    json!({
        "anchor": REVENUE_PIPELINE_PER_LEG_PROJECTION_MAX_BLOCK_SPREAD_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "DB max(block_number) per fee_router_routed_events / region_vault_forwarded_events / p5_country_ledger_lines for this chain_id; only legs with rows participate. spread_blocks = max(leg_max) - min(leg_max) when at least two legs have max; 0 when one leg; incomparable when zero legs.",
        "per_leg_max_block_number": {
            "fee_router_routed_events": leg_fr,
            "region_vault_forwarded_events": leg_rv,
            "p5_country_ledger_lines": leg_p5,
        },
        "min_leg_max_block_number": min_leg_max_block_number,
        "max_leg_max_block_number": max_leg_max_block_number,
        "spread_blocks": spread_blocks,
        "marker": marker,
        "observation_note": observation_note,
    })
}

/// **异步** **：** **三** **表** **stats** **。**
pub async fn revenue_pipeline_per_leg_projection_max_block_spread_observability(
    pool: &PgPool,
    expected_chain_id: i64,
) -> Result<Value, sqlx::Error> {
    let (fr, rv, p5) = tokio::try_join!(
        super::fee_router_routed_stats(pool, Some(expected_chain_id)),
        super::region_vault_forwarded_stats(pool, Some(expected_chain_id)),
        super::p5_country_ledger_lines_stats(pool, Some(expected_chain_id)),
    )?;
    Ok(revenue_pipeline_per_leg_projection_max_block_spread_observability_v1(
        expected_chain_id,
        fr.total,
        fr.max_block_number,
        rv.total,
        rv.max_block_number,
        p5.total,
        p5.max_block_number,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn b394_empty_legs_incomparable() {
        let v = revenue_pipeline_per_leg_projection_max_block_spread_observability_v1(80002, 0, None, 0, None, 0, None);
        assert_eq!(v["marker"], "incomparable");
        assert!(v["spread_blocks"].is_null());
    }

    #[test]
    fn b394_single_leg_aligned_zero_spread() {
        let v = revenue_pipeline_per_leg_projection_max_block_spread_observability_v1(80002, 1, Some(10), 0, None, 0, None);
        assert_eq!(v["marker"], "aligned");
        assert_eq!(v["spread_blocks"], json!(0));
    }

    #[test]
    fn b394_two_legs_drift_when_max_differs() {
        let v = revenue_pipeline_per_leg_projection_max_block_spread_observability_v1(80002, 1, Some(100), 1, Some(50), 0, None);
        assert_eq!(v["marker"], "drift");
        assert_eq!(v["spread_blocks"], json!(50));
        assert_eq!(v["min_leg_max_block_number"], json!(50));
        assert_eq!(v["max_leg_max_block_number"], json!(100));
    }

    #[test]
    fn b394_three_legs_aligned_same_max() {
        let v = revenue_pipeline_per_leg_projection_max_block_spread_observability_v1(80002, 1, Some(7), 1, Some(7), 1, Some(7));
        assert_eq!(v["marker"], "aligned");
        assert_eq!(v["spread_blocks"], json!(0));
    }
}
