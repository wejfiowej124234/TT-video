//! **B-398** / **TT-B398**：**腿间** **`spread_blocks`** **与** **B-391** **`gap_blocks`** **及** **B-392** **`tail_slack_blocks`** **之** **双** **正** **slack** **三角化** **（** **只读** **DB** **+** **checkpoint** **；** **不**入 **`compound_gate`** **）**。
//!
//! **与** **B-396** **/** **B-397**：**不** **替代** **二者** **`dominance_signal`** **；** **本** **键** **在** **`inter_leg_drift`** **且** **两侧** **slack** **均** **为** **正** **时** **比较** **`spread`** **与** **`min/max(gap,tail)`** **分** **桶** **。**
//! **与** **B-395**：**不** **输出** **`spread_anomaly_layer`** **。**

use serde_json::{json, Value};
use sqlx::postgres::PgPool;

/// **TT-B398** / **母表 B-398**：机读锚（**`revenue_pipeline_spread_dual_slack_triangulation_observability`**）。
pub const REVENUE_PIPELINE_SPREAD_DUAL_SLACK_TRIANGULATION_OBS_ANCHOR: &str =
    "398-REVENUE-PIPELINE-SPREAD-DUAL-SLACK-TRIANGULATION-OBS-V1";

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

fn tail_slack_i64(event_log_max: i64, union_max: i64) -> i64 {
    let e = i128::from(event_log_max);
    let u = i128::from(union_max);
    let s = e - u;
    if s > i64::MAX as i128 {
        i64::MAX
    } else if s < i64::MIN as i128 {
        i64::MIN
    } else {
        s as i64
    }
}

/// **纯** **内存** **组装** **（** **单测** **）** **。**
#[allow(clippy::too_many_arguments)]
pub fn revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
    expected_chain_id: i64,
    fr_total: i64,
    fr_max: Option<i64>,
    rv_total: i64,
    rv_max: Option<i64>,
    p5_total: i64,
    p5_max: Option<i64>,
    event_log_max_block_number: Option<i64>,
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
    let event_log_json = event_log_max_block_number.map(|n| json!(n)).unwrap_or(Value::Null);

    let (
        min_leg_max_block_number,
        max_leg_max_block_number,
        spread_blocks,
        inter_leg_drift,
        marker,
        gap_blocks,
        tail_slack_blocks,
        triangulation_signal,
        tighter_slack_axis,
        spread_to_min_positive_slack_ratio,
        observation_note,
    ) = if leg_maxes.is_empty() {
        (
            Value::Null,
            Value::Null,
            Value::Null,
            false,
            "incomparable",
            Value::Null,
            Value::Null,
            "n_a_empty_projection",
            Value::Null,
            Value::Null,
            json!("projection_tables_empty_all_legs"),
        )
    } else if leg_maxes.len() == 1 {
        let only = leg_maxes[0];
        let g = gap_blocks_i64(indexer_checkpoint_block_number, only);
        let (ts_json, note) = match event_log_max_block_number {
            None => (Value::Null, json!("event_log_empty_for_chain")),
            Some(el) => {
                let t = tail_slack_i64(el, only);
                (json!(t), json!("ok"))
            }
        };
        (
            json!(only),
            json!(only),
            json!(0_i64),
            false,
            "aligned",
            json!(g),
            ts_json,
            "n_a_single_leg_surface",
            Value::Null,
            Value::Null,
            note,
        )
    } else {
        let min_v = *leg_maxes.iter().min().expect("len>=2");
        let max_v = *leg_maxes.iter().max().expect("len>=2");
        let sp = spread_i64(min_v, max_v);
        let drift = sp > 0;
        let m = if drift { "drift" } else { "aligned" };
        let um = union_max_block_number.expect("len>=2 implies union_max");
        let g = gap_blocks_i64(indexer_checkpoint_block_number, um);

            if !drift {
                let tsj = if event_log_max_block_number.is_none() {
                    Value::Null
                } else {
                    let el = event_log_max_block_number.expect("checked");
                    let t = tail_slack_i64(el, um);
                    json!(t)
                };
            (
                json!(min_v),
                json!(max_v),
                json!(0_i64),
                false,
                m,
                json!(g),
                tsj,
                "aligned_multi_leg_no_inter_leg_spread",
                Value::Null,
                Value::Null,
                json!("ok"),
            )
        } else if event_log_max_block_number.is_none() {
            (
                json!(min_v),
                json!(max_v),
                json!(sp),
                true,
                m,
                json!(g),
                Value::Null,
                "n_a_event_log_tail_incomparable",
                Value::Null,
                Value::Null,
                json!("event_log_empty_for_chain"),
            )
        } else {
            let el = event_log_max_block_number.expect("checked");
            let t = tail_slack_i64(el, um);
            let tsj = json!(t);
            let (tri, axis, ratio, note) = if g <= 0 || t <= 0 {
                (
                    "inter_leg_drift_triangulation_incomparable_non_positive_slack",
                    Value::Null,
                    Value::Null,
                    json!("dual_positive_slack_requires_gap_gt_0_and_tail_slack_gt_0"),
                )
            } else {
                let smin = g.min(t);
                let smax = g.max(t);
                let axis_v = if g < t {
                    json!("indexer_checkpoint_gap")
                } else if t < g {
                    json!("event_log_tail")
                } else {
                    json!("tie")
                };
                let ratio_v = if smin > 0 {
                    json!(sp as f64 / smin as f64)
                } else {
                    Value::Null
                };
                let tri_v = if sp < smin {
                    "inter_leg_drift_spread_lt_min_positive_slack"
                } else if sp < smax {
                    "inter_leg_drift_spread_between_min_max_positive_slack"
                } else {
                    "inter_leg_drift_spread_gte_max_positive_slack"
                };
                (tri_v, axis_v, ratio_v, json!("ok"))
            };
            (
                json!(min_v),
                json!(max_v),
                json!(sp),
                true,
                m,
                json!(g),
                tsj,
                tri,
                axis,
                ratio,
                note,
            )
        }
    };

    json!({
        "anchor": REVENUE_PIPELINE_SPREAD_DUAL_SLACK_TRIANGULATION_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "B-394/B-395-compatible spread_blocks and inter_leg_drift; B-391 gap_blocks; B-392 tail_slack_blocks = event_log_max - union_max. triangulation_signal buckets spread vs min/max of positive gap and tail slack when inter_leg_drift; does not emit spread_anomaly_layer (B-395). Does not replace B-396/B-397 dominance_signal.",
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
        "event_log_max_block_number": event_log_json,
        "indexer_checkpoint_block_number": indexer_checkpoint_block_number,
        "gap_blocks": gap_blocks,
        "tail_slack_blocks": tail_slack_blocks,
        "triangulation_signal": triangulation_signal,
        "tighter_slack_axis": tighter_slack_axis,
        "spread_to_min_positive_slack_ratio": spread_to_min_positive_slack_ratio,
        "marker": marker,
        "observation_note": observation_note,
    })
}

/// **异步** **：** **三** **表** **stats** **+** **`event_log`** **max** **+** **checkpoint** **。**
pub async fn revenue_pipeline_spread_dual_slack_triangulation_observability(
    pool: &PgPool,
    expected_chain_id: i64,
    indexer_checkpoint_block_number: u64,
) -> Result<Value, sqlx::Error> {
    let (fr, rv, p5) = tokio::try_join!(
        super::fee_router_routed_stats(pool, Some(expected_chain_id)),
        super::region_vault_forwarded_stats(pool, Some(expected_chain_id)),
        super::p5_country_ledger_lines_stats(pool, Some(expected_chain_id)),
    )?;
    let el = super::event_log_max_block_number_for_chain(pool, expected_chain_id).await?;
    Ok(revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
        expected_chain_id,
        fr.total,
        fr.max_block_number,
        rv.total,
        rv.max_block_number,
        p5.total,
        p5.max_block_number,
        el,
        indexer_checkpoint_block_number,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn b398_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_SPREAD_DUAL_SLACK_TRIANGULATION_OBS_ANCHOR,
            "398-REVENUE-PIPELINE-SPREAD-DUAL-SLACK-TRIANGULATION-OBS-V1"
        );
    }

    #[test]
    fn b398_empty() {
        let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
            137, 0, None, 0, None, 0, None, Some(1), 100,
        );
        assert_eq!(v["triangulation_signal"], json!("n_a_empty_projection"));
        assert_eq!(v["gap_blocks"], Value::Null);
    }

    #[test]
    fn b398_single_leg() {
        let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
            137, 1, Some(50), 0, None, 0, None, Some(100), 100,
        );
        assert_eq!(v["triangulation_signal"], json!("n_a_single_leg_surface"));
    }

    #[test]
    fn b398_aligned_multi() {
        let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
            137, 1, Some(10), 1, Some(10), 0, None, Some(100), 100,
        );
        assert_eq!(
            v["triangulation_signal"],
            json!("aligned_multi_leg_no_inter_leg_spread")
        );
    }

    #[test]
    fn b398_drift_no_el() {
        let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
            137, 1, Some(10), 1, Some(20), 0, None, None, 100,
        );
        assert_eq!(
            v["triangulation_signal"],
            json!("n_a_event_log_tail_incomparable")
        );
    }

    #[test]
    fn b398_drift_non_positive_slack() {
        let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
            137, 1, Some(10), 1, Some(200), 0, None, Some(100), 100,
        );
        assert_eq!(
            v["triangulation_signal"],
            json!("inter_leg_drift_triangulation_incomparable_non_positive_slack")
        );
    }

    #[test]
    fn b398_drift_lt_min() {
        let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
            137, 1, Some(10), 1, Some(20), 1, Some(15), Some(1000), 500,
        );
        assert_eq!(v["spread_blocks"], json!(10));
        assert_eq!(v["gap_blocks"], json!(480));
        assert_eq!(v["tail_slack_blocks"], json!(980));
        assert_eq!(
            v["triangulation_signal"],
            json!("inter_leg_drift_spread_lt_min_positive_slack")
        );
        assert_eq!(v["tighter_slack_axis"], json!("indexer_checkpoint_gap"));
        assert_eq!(v["spread_to_min_positive_slack_ratio"], json!(10.0_f64 / 480.0_f64));
    }

    #[test]
    fn b398_drift_between_min_max() {
        // union_max=100 → gap=40 (checkpoint 140), tail=60 (event_log 160), spread=50 (legs 50/100).
        let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
            137, 1, Some(100), 1, Some(50), 1, Some(75), Some(160), 140,
        );
        assert_eq!(v["spread_blocks"], json!(50));
        assert_eq!(v["gap_blocks"], json!(40));
        assert_eq!(v["tail_slack_blocks"], json!(60));
        assert_eq!(
            v["triangulation_signal"],
            json!("inter_leg_drift_spread_between_min_max_positive_slack")
        );
        assert_eq!(v["tighter_slack_axis"], json!("indexer_checkpoint_gap"));
    }

    #[test]
    fn b398_drift_gte_max() {
        // union_max=50 → gap=30 (checkpoint 80), tail=40 (event_log 90), spread=40 (legs 10/50/30).
        let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
            137, 1, Some(10), 1, Some(50), 1, Some(30), Some(90), 80,
        );
        assert_eq!(v["spread_blocks"], json!(40));
        assert_eq!(v["gap_blocks"], json!(30));
        assert_eq!(v["tail_slack_blocks"], json!(40));
        assert_eq!(
            v["triangulation_signal"],
            json!("inter_leg_drift_spread_gte_max_positive_slack")
        );
        assert_eq!(v["tighter_slack_axis"], json!("indexer_checkpoint_gap"));
        assert_eq!(v["spread_to_min_positive_slack_ratio"], json!(40.0_f64 / 30.0_f64));
    }
}
