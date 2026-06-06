use serde_json::{json, Value};

use super::constants::REVENUE_PIPELINE_SPREAD_DUAL_SLACK_TRIANGULATION_OBS_ANCHOR;
use super::math::{gap_blocks_i64, spread_i64, tail_slack_i64};

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
    };    let leg_rv = if rv_total > 0 {
        json!(rv_max)
    } else {
        Value::Null
    };    let leg_p5 = if p5_total > 0 {
        json!(p5_max)
    } else {
        Value::Null
    };
    let mut leg_maxes: Vec<i64> = Vec::new();
    if fr_total > 0 {
        if let Some(m) = fr_max {
            leg_maxes.push(m);
        }
    };    if rv_total > 0 {
        if let Some(m) = rv_max {
            leg_maxes.push(m);
        }
    };    if p5_total > 0 {
        if let Some(m) = p5_max {
            leg_maxes.push(m);
        }
    };    let union_max_block_number = if leg_maxes.is_empty() {
        None
    } else {
        Some(*leg_maxes.iter().max().expect("len>=1"))
    };
    let union_max_json = match union_max_block_number {
        Some(n) => json!(n),
        None => Value::Null,
    };
    let event_log_json = event_log_max_block_number
        .map(|n| json!(n))
        .unwrap_or(Value::Null);

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
        }
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
            let tsj = match event_log_max_block_number {
                None => Value::Null,
                Some(el) => json!(tail_slack_i64(el, um)),
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
        } else if let Some(el) = event_log_max_block_number {
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
                };                let tri_v = if sp < smin {
                    "inter_leg_drift_spread_lt_min_positive_slack"
                } else if sp < smax {
                    "inter_leg_drift_spread_between_min_max_positive_slack"
                } else {
                    "inter_leg_drift_spread_gte_max_positive_slack"
                }
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
        } else {
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
        }
    }

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
