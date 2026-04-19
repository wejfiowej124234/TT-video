//! **B-396** / **TT-B396**：**腿间** **`spread_blocks`** **与** **union max** **相对** **indexer checkpoint** **之** **`gap_blocks`** **的** **相对** **主导** **上下文** **（** **DB** **+** **进程** **`indexer_checkpoint`** **；** **不**入 **`compound_gate`** **）**。
//!
//! **与** **B-394** **/** **B-395**：**`spread_blocks`** **/** **`inter_leg_drift`** **计** **面** **同源** **；** **本** **键** **不** **输出** **`spread_anomaly_layer`** **（** **属** **B-395** **）** **。**
//! **与** **B-391**：**`gap_blocks`** **与** **`union_max_block_number`** **计** **面** **同源** **；** **本** **键** **专** **答** **spread** **vs** **gap** **之** **相对** **叙事** **，** **不** **替代** **B-391** **单** **键** **。**

use serde_json::{json, Value};
use sqlx::postgres::PgPool;

/// **TT-B396** / **母表 B-396**：机读锚（**`revenue_pipeline_spread_vs_union_indexer_gap_observability`**）。
pub const REVENUE_PIPELINE_SPREAD_VS_UNION_INDEXER_GAP_OBS_ANCHOR: &str =
    "396-REVENUE-PIPELINE-SPREAD-VS-UNION-INDEXER-GAP-OBS-V1";

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

/// **纯** **内存** **组装** **（** **单测** **）** **。**
#[allow(clippy::too_many_arguments)]
pub fn revenue_pipeline_spread_vs_union_indexer_gap_observability_v1(
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

    let union_max_block_number = if leg_maxes.is_empty() {
        None
    } else {
        Some(*leg_maxes.iter().max().expect("len>=1"))
    };
    let union_max_json = match union_max_block_number {
        Some(n) => json!(n),
        None => Value::Null,
    };

    let (
        min_leg_max_block_number,
        max_leg_max_block_number,
        spread_blocks,
        inter_leg_drift,
        marker,
        gap_blocks,
        dominance_signal,
        spread_to_positive_gap_ratio,
        observation_note,
    ) = if leg_maxes.is_empty() {
        (
            Value::Null,
            Value::Null,
            Value::Null,
            false,
            "incomparable",
            Value::Null,
            "n_a_empty_projection",
            Value::Null,
            json!("projection_tables_empty_all_legs"),
        )
    } else if leg_maxes.len() == 1 {
        let only = leg_maxes[0];
        let g = gap_blocks_i64(indexer_checkpoint_block_number, only);
        (
            json!(only),
            json!(only),
            json!(0_i64),
            false,
            "aligned",
            json!(g),
            "n_a_single_leg_surface",
            Value::Null,
            json!("single_leg_no_inter_leg_spread"),
        )
    } else {
        let min_v = *leg_maxes.iter().min().expect("len>=2");
        let max_v = *leg_maxes.iter().max().expect("len>=2");
        let sp = spread_i64(min_v, max_v);
        let drift = sp > 0;
        let m = if drift { "drift" } else { "aligned" };
        let um = union_max_block_number.expect("len>=2 implies union_max");
        let g = gap_blocks_i64(indexer_checkpoint_block_number, um);

        let (dom, ratio, note) = if !drift {
            (
                "aligned_multi_leg_no_inter_leg_spread",
                Value::Null,
                json!("ok"),
            )
        } else if g <= 0 {
            (
                "inter_leg_drift_with_non_positive_union_gap",
                Value::Null,
                json!("inter_leg_spread_with_union_gap_lte_zero_same_semantics_as_b391_non_positive_gap"),
            )
        } else {
            // g > 0 && drift
            let ratio_v = if g > 0 {
                json!(sp as f64 / g as f64)
            } else {
                Value::Null
            };
            let dom_v = if sp < g {
                "inter_leg_drift_small_vs_positive_union_gap"
            } else {
                "inter_leg_drift_large_vs_positive_union_gap"
            };
            (dom_v, ratio_v, json!("ok"))
        };

        (
            json!(min_v),
            json!(max_v),
            json!(sp),
            drift,
            m,
            json!(g),
            dom,
            ratio,
            note,
        )
    };

    json!({
        "anchor": REVENUE_PIPELINE_SPREAD_VS_UNION_INDEXER_GAP_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "B-394/B-395-compatible spread_blocks and inter_leg_drift over per-leg max(block_number); B-391-compatible gap_blocks = indexer_checkpoint_block_number - union_max (union_max = max of leg maxes where the table has rows). dominance_signal compares inter-leg spread vs positive gap when both apply; does not emit spread_anomaly_layer (B-395).",
        "per_leg_max_block_number": {
            "fee_router_routed_events": leg_fr,
            "region_vault_forwarded_events": leg_rv,
            "p5_country_ledger_lines": leg_p5,
        },
        "min_leg_max_block_number": min_leg_max_block_number,
        "max_leg_max_block_number": max_leg_max_block_number,
        "spread_blocks": spread_blocks,
        "inter_leg_drift": inter_leg_drift,
        "union_max_block_number": union_max_json,
        "indexer_checkpoint_block_number": indexer_checkpoint_block_number,
        "gap_blocks": gap_blocks,
        "dominance_signal": dominance_signal,
        "spread_to_positive_gap_ratio": spread_to_positive_gap_ratio,
        "marker": marker,
        "observation_note": observation_note,
    })
}

/// **异步** **：** **三** **表** **stats** **+** **checkpoint** **。**
pub async fn revenue_pipeline_spread_vs_union_indexer_gap_observability(
    pool: &PgPool,
    expected_chain_id: i64,
    indexer_checkpoint_block_number: u64,
) -> Result<Value, sqlx::Error> {
    let (fr, rv, p5) = tokio::try_join!(
        super::fee_router_routed_stats(pool, Some(expected_chain_id)),
        super::region_vault_forwarded_stats(pool, Some(expected_chain_id)),
        super::p5_country_ledger_lines_stats(pool, Some(expected_chain_id)),
    )?;
    Ok(revenue_pipeline_spread_vs_union_indexer_gap_observability_v1(
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
    fn b396_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_SPREAD_VS_UNION_INDEXER_GAP_OBS_ANCHOR,
            "396-REVENUE-PIPELINE-SPREAD-VS-UNION-INDEXER-GAP-OBS-V1"
        );
    }

    #[test]
    fn b396_empty_incomparable() {
        let v = revenue_pipeline_spread_vs_union_indexer_gap_observability_v1(
            137, 0, None, 0, None, 0, None, 100,
        );
        assert_eq!(v["dominance_signal"], json!("n_a_empty_projection"));
        assert_eq!(v["gap_blocks"], Value::Null);
        assert_eq!(v["spread_blocks"], Value::Null);
        assert_eq!(v["inter_leg_drift"], json!(false));
    }

    #[test]
    fn b396_single_leg_surface() {
        let v = revenue_pipeline_spread_vs_union_indexer_gap_observability_v1(
            137, 1, Some(50), 0, None, 0, None, 100,
        );
        assert_eq!(v["dominance_signal"], json!("n_a_single_leg_surface"));
        assert_eq!(v["gap_blocks"], json!(50));
        assert_eq!(v["inter_leg_drift"], json!(false));
    }

    #[test]
    fn b396_aligned_multi_leg_zero_spread() {
        let v = revenue_pipeline_spread_vs_union_indexer_gap_observability_v1(
            137, 1, Some(10), 1, Some(10), 0, None, 100,
        );
        assert_eq!(v["spread_blocks"], json!(0));
        assert_eq!(v["inter_leg_drift"], json!(false));
        assert_eq!(
            v["dominance_signal"],
            json!("aligned_multi_leg_no_inter_leg_spread")
        );
        assert_eq!(v["gap_blocks"], json!(90));
    }

    #[test]
    fn b396_drift_spread_lt_gap() {
        let v = revenue_pipeline_spread_vs_union_indexer_gap_observability_v1(
            137, 1, Some(10), 1, Some(20), 1, Some(15), 100,
        );
        assert_eq!(v["spread_blocks"], json!(10));
        assert_eq!(v["inter_leg_drift"], json!(true));
        assert_eq!(v["union_max_block_number"], json!(20));
        assert_eq!(v["gap_blocks"], json!(80));
        assert_eq!(
            v["dominance_signal"],
            json!("inter_leg_drift_small_vs_positive_union_gap")
        );
        assert_eq!(v["spread_to_positive_gap_ratio"], json!(10.0_f64 / 80.0_f64));
    }

    #[test]
    fn b396_drift_spread_gte_gap() {
        let v = revenue_pipeline_spread_vs_union_indexer_gap_observability_v1(
            137, 1, Some(0), 1, Some(50), 1, Some(30), 100,
        );
        assert_eq!(v["spread_blocks"], json!(50));
        assert_eq!(v["union_max_block_number"], json!(50));
        assert_eq!(v["gap_blocks"], json!(50));
        assert_eq!(
            v["dominance_signal"],
            json!("inter_leg_drift_large_vs_positive_union_gap")
        );
        assert_eq!(v["spread_to_positive_gap_ratio"], json!(1.0_f64));
    }

    #[test]
    fn b396_drift_non_positive_gap() {
        let v = revenue_pipeline_spread_vs_union_indexer_gap_observability_v1(
            137, 1, Some(10), 1, Some(200), 0, None, 100,
        );
        assert_eq!(v["spread_blocks"], json!(190));
        assert_eq!(v["gap_blocks"], json!(-100));
        assert_eq!(
            v["dominance_signal"],
            json!("inter_leg_drift_with_non_positive_union_gap")
        );
        assert_eq!(v["spread_to_positive_gap_ratio"], Value::Null);
    }
}
