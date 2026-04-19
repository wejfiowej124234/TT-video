//! **B-399** / **TT-B399**：**B-396** **`dominance_signal`**（**checkpoint** **/** **gap** **轴** **）** **与** **B-397** **`dominance_signal`**（**event_log** **尾** **/** **tail** **轴** **）** **之** **合取** **一致性** **（** **只读** **DB** **+** **checkpoint** **；** **不**入 **`compound_gate`** **）**。
//!
//! **与** **B-398**：**B-398** **专答** **`inter_leg_drift`** **且** **双** **正** **slack** **时** **`spread`** **相对** **`min/max(gap,tail)`** **之** **`triangulation_signal`** **；** **本** **键** **不** **输出** **`triangulation_signal`** **/** **`tighter_slack_axis`** **，** **仅** **汇总** **两** **单轴** **`dominance_signal`** **是否** **同向** **（** **小** **/** **大** **）** **或** **落** **`n_a_*`** **/** **单轴** **阻塞** **。**
//! **与** **B-395**：**不** **输出** **`spread_anomaly_layer`** **。**

use serde_json::{json, Value};
use sqlx::postgres::PgPool;

/// **TT-B399** / **母表 B-399**：机读锚（**`revenue_pipeline_spread_dual_axis_dominance_concordance_observability`**）。
pub const REVENUE_PIPELINE_SPREAD_DUAL_AXIS_DOMINANCE_CONCORDANCE_OBS_ANCHOR: &str =
    "399-REVENUE-PIPELINE-SPREAD-DUAL-AXIS-DOMINANCE-CONCORDANCE-OBS-V1";

fn dominance_str(v: &Value) -> Option<&str> {
    v.get("dominance_signal")?.as_str()
}

fn marker_for_concordance(concordance_signal: &str) -> &'static str {
    if concordance_signal.starts_with("n_a_") {
        "incomparable"
    } else if concordance_signal == "concordance_incomparable_mixed_surface" {
        "incomparable"
    } else if concordance_signal == "aligned_multi_leg_no_inter_leg_spread_both_axes" {
        "aligned"
    } else {
        "drift"
    }
}

/// **由** **B-396** **/** **B-397** **同源** **`dominance_signal`** **字符串** **推导** **`concordance_signal`** **（** **纯** **逻辑** **）** **。**
pub fn concordance_signal_from_gap_tail_dominance(gap_ds: &str, tail_ds: &str) -> &'static str {
    if gap_ds == "n_a_empty_projection" || tail_ds == "n_a_empty_projection" {
        return "n_a_empty_projection";
    }
    if tail_ds == "n_a_event_log_tail_incomparable" {
        return "n_a_event_log_tail_incomparable";
    }
    if gap_ds == "n_a_single_leg_surface" || tail_ds == "n_a_single_leg_surface" {
        return "n_a_single_leg_surface";
    }
    if gap_ds == "aligned_multi_leg_no_inter_leg_spread"
        && tail_ds == "aligned_multi_leg_no_inter_leg_spread"
    {
        return "aligned_multi_leg_no_inter_leg_spread_both_axes";
    }

    if gap_ds == "inter_leg_drift_with_non_positive_union_gap"
        && tail_ds == "inter_leg_drift_with_non_positive_tail_slack"
    {
        return "both_axes_inter_leg_drift_with_non_positive_slack";
    }
    if gap_ds == "inter_leg_drift_with_non_positive_union_gap" {
        return "gap_axis_blocked_non_positive_union_gap";
    }
    if tail_ds == "inter_leg_drift_with_non_positive_tail_slack" {
        return "tail_axis_blocked_non_positive_tail_slack";
    }

    let gap_small = gap_ds == "inter_leg_drift_small_vs_positive_union_gap";
    let gap_large = gap_ds == "inter_leg_drift_large_vs_positive_union_gap";
    let tail_small = tail_ds == "inter_leg_drift_small_vs_positive_tail_slack";
    let tail_large = tail_ds == "inter_leg_drift_large_vs_positive_tail_slack";

    if (gap_small || gap_large) && (tail_small || tail_large) {
        if gap_small && tail_small {
            return "both_axes_spread_lt_each_positive_slack";
        }
        if gap_large && tail_large {
            return "both_axes_spread_gte_each_positive_slack";
        }
        return "cross_axis_small_vs_large_tension";
    }

    "concordance_incomparable_mixed_surface"
}

/// **纯** **内存** **组装** **（** **单测** **）** **：** **输入** **为** **B-396** **/** **B-397** **完整** **JSON** **成功体** **。**
pub fn revenue_pipeline_spread_dual_axis_dominance_concordance_observability_v1(
    expected_chain_id: i64,
    gap_obs: Value,
    tail_obs: Value,
) -> Value {
    let gap_ds = dominance_str(&gap_obs).unwrap_or("");
    let tail_ds = dominance_str(&tail_obs).unwrap_or("");
    let concordance_signal = concordance_signal_from_gap_tail_dominance(gap_ds, tail_ds);
    let marker = marker_for_concordance(concordance_signal);
    let observation_note = if concordance_signal == "concordance_incomparable_mixed_surface" {
        json!("gap_tail_dominance_surface_mismatch")
    } else {
        json!("ok")
    };

    json!({
        "anchor": REVENUE_PIPELINE_SPREAD_DUAL_AXIS_DOMINANCE_CONCORDANCE_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "Rollup of B-396 dominance_signal (checkpoint/gap axis) vs B-397 dominance_signal (event_log tail axis); same per-leg max inputs. Does not emit triangulation_signal (B-398) or spread_anomaly_layer (B-395).",
        "gap_axis_obs_anchor": crate::db::REVENUE_PIPELINE_SPREAD_VS_UNION_INDEXER_GAP_OBS_ANCHOR,
        "tail_axis_obs_anchor": crate::db::REVENUE_PIPELINE_SPREAD_VS_EVENT_LOG_TAIL_OBS_ANCHOR,
        "gap_axis_dominance_signal": gap_obs.get("dominance_signal").cloned().unwrap_or(Value::Null),
        "tail_axis_dominance_signal": tail_obs.get("dominance_signal").cloned().unwrap_or(Value::Null),
        "concordance_signal": concordance_signal,
        "marker": marker,
        "observation_note": observation_note,
    })
}

/// **异步** **：** **与** **B-396/B-397** **同源** **stats** **+** **`event_log`** **max** **+** **checkpoint** **；** **内存** **内** **调** **两** **`_v1`** **再** **合取** **。**
pub async fn revenue_pipeline_spread_dual_axis_dominance_concordance_observability(
    pool: &PgPool,
    expected_chain_id: i64,
    indexer_checkpoint_block_number: u64,
) -> Result<Value, sqlx::Error> {
    let gap = crate::db::revenue_pipeline_spread_vs_union_indexer_gap_obs::revenue_pipeline_spread_vs_union_indexer_gap_observability(
        pool,
        expected_chain_id,
        indexer_checkpoint_block_number,
    )
    .await?;
    let tail = crate::db::revenue_pipeline_spread_vs_event_log_tail_obs::revenue_pipeline_spread_vs_event_log_tail_observability(
        pool,
        expected_chain_id,
    )
    .await?;
    Ok(revenue_pipeline_spread_dual_axis_dominance_concordance_observability_v1(
        expected_chain_id,
        gap,
        tail,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn b399_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_SPREAD_DUAL_AXIS_DOMINANCE_CONCORDANCE_OBS_ANCHOR,
            "399-REVENUE-PIPELINE-SPREAD-DUAL-AXIS-DOMINANCE-CONCORDANCE-OBS-V1"
        );
    }

    #[test]
    fn concordance_both_small() {
        let s = concordance_signal_from_gap_tail_dominance(
            "inter_leg_drift_small_vs_positive_union_gap",
            "inter_leg_drift_small_vs_positive_tail_slack",
        );
        assert_eq!(s, "both_axes_spread_lt_each_positive_slack");
    }

    #[test]
    fn concordance_both_large() {
        let s = concordance_signal_from_gap_tail_dominance(
            "inter_leg_drift_large_vs_positive_union_gap",
            "inter_leg_drift_large_vs_positive_tail_slack",
        );
        assert_eq!(s, "both_axes_spread_gte_each_positive_slack");
    }

    #[test]
    fn concordance_tension() {
        let s = concordance_signal_from_gap_tail_dominance(
            "inter_leg_drift_small_vs_positive_union_gap",
            "inter_leg_drift_large_vs_positive_tail_slack",
        );
        assert_eq!(s, "cross_axis_small_vs_large_tension");
    }

    #[test]
    fn v1_wraps_gap_tail_json() {
        let gap = json!({"dominance_signal": "inter_leg_drift_small_vs_positive_union_gap"});
        let tail = json!({"dominance_signal": "inter_leg_drift_small_vs_positive_tail_slack"});
        let v = revenue_pipeline_spread_dual_axis_dominance_concordance_observability_v1(80002, gap, tail);
        assert_eq!(v["concordance_signal"], json!("both_axes_spread_lt_each_positive_slack"));
        assert_eq!(v["marker"], json!("drift"));
        assert_eq!(
            v["anchor"],
            json!(REVENUE_PIPELINE_SPREAD_DUAL_AXIS_DOMINANCE_CONCORDANCE_OBS_ANCHOR)
        );
    }
}
