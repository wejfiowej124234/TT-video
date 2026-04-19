//! **B-397** / **TT-B397**：**腿间** **`spread_blocks`** **与** **B-392** **同源** **`tail_slack_blocks`** **（** **`event_log_max`****−****`union_max`** **）** **之** **相对** **主导** **（** **只读** **DB** **；** **不**入 **`compound_gate`** **）**。
//!
//! **与** **B-394** **/** **B-395**：**`spread_blocks`** **/** **`inter_leg_drift`** **同源** **；** **不** **输出** **`spread_anomaly_layer`** **。**
//! **与** **B-392**：**`tail_slack_blocks`** **/** **`event_log_max_block_number`** **计** **面** **同源** **；** **本** **键** **专** **答** **spread** **vs** **tail** **，** **不** **替代** **B-392** **单** **键** **。**
//! **与** **B-396**：**B-396** **对** **checkpoint** **`gap_blocks`** **；** **本** **键** **对** **ingestion** **尾** **间隙** **，** **正交** **。**

use serde_json::{json, Value};
use sqlx::postgres::PgPool;

/// **TT-B397** / **母表 B-397**：机读锚（**`revenue_pipeline_spread_vs_event_log_tail_observability`**）。
pub const REVENUE_PIPELINE_SPREAD_VS_EVENT_LOG_TAIL_OBS_ANCHOR: &str =
    "397-REVENUE-PIPELINE-SPREAD-VS-EVENT-LOG-TAIL-OBS-V1";

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
pub fn revenue_pipeline_spread_vs_event_log_tail_observability_v1(
    expected_chain_id: i64,
    fr_total: i64,
    fr_max: Option<i64>,
    rv_total: i64,
    rv_max: Option<i64>,
    p5_total: i64,
    p5_max: Option<i64>,
    event_log_max_block_number: Option<i64>,
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
        tail_slack_blocks,
        dominance_signal,
        spread_to_positive_tail_ratio,
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
        let (ts, dom_tail, note) = match event_log_max_block_number {
            None => (Value::Null, "n_a_event_log_tail_incomparable", json!("event_log_empty_for_chain")),
            Some(el) => {
                let t = tail_slack_i64(el, only);
                (
                    json!(t),
                    "n_a_single_leg_surface",
                    json!("ok"),
                )
            }
        };
        (
            json!(only),
            json!(only),
            json!(0_i64),
            false,
            "aligned",
            ts,
            dom_tail,
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

        let (ts_val, dom, ratio, note) = if event_log_max_block_number.is_none() {
            (
                Value::Null,
                "n_a_event_log_tail_incomparable",
                Value::Null,
                json!("event_log_empty_for_chain"),
            )
        } else if !drift {
            let el = event_log_max_block_number.expect("checked");
            let t = tail_slack_i64(el, um);
            (
                json!(t),
                "aligned_multi_leg_no_inter_leg_spread",
                Value::Null,
                json!("ok"),
            )
        } else {
            let el = event_log_max_block_number.expect("checked");
            let t = tail_slack_i64(el, um);
            if t <= 0 {
                (
                    json!(t),
                    "inter_leg_drift_with_non_positive_tail_slack",
                    Value::Null,
                    json!("inter_leg_spread_with_tail_slack_lte_zero_same_semantics_as_b392_non_positive_tail"),
                )
            } else {
                let ratio_v = json!(sp as f64 / t as f64);
                let dom_v = if sp < t {
                    "inter_leg_drift_small_vs_positive_tail_slack"
                } else {
                    "inter_leg_drift_large_vs_positive_tail_slack"
                };
                (json!(t), dom_v, ratio_v, json!("ok"))
            }
        };

        (
            json!(min_v),
            json!(max_v),
            json!(sp),
            drift,
            m,
            ts_val,
            dom,
            ratio,
            note,
        )
    };

    json!({
        "anchor": REVENUE_PIPELINE_SPREAD_VS_EVENT_LOG_TAIL_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "B-394/B-395-compatible spread_blocks and inter_leg_drift; B-392-compatible tail_slack_blocks = event_log_max_block_number - union_max (union_max = max of per-leg max where table has rows). dominance_signal compares inter-leg spread vs positive tail slack when applicable; does not emit spread_anomaly_layer (B-395). Orthogonal to B-396 (checkpoint gap).",
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
        "tail_slack_blocks": tail_slack_blocks,
        "dominance_signal": dominance_signal,
        "spread_to_positive_tail_ratio": spread_to_positive_tail_ratio,
        "marker": marker,
        "observation_note": observation_note,
    })
}

/// **异步** **：** **三** **表** **stats** **+** **`event_log`** **max** **。**
pub async fn revenue_pipeline_spread_vs_event_log_tail_observability(
    pool: &PgPool,
    expected_chain_id: i64,
) -> Result<Value, sqlx::Error> {
    let (fr, rv, p5) = tokio::try_join!(
        super::fee_router_routed_stats(pool, Some(expected_chain_id)),
        super::region_vault_forwarded_stats(pool, Some(expected_chain_id)),
        super::p5_country_ledger_lines_stats(pool, Some(expected_chain_id)),
    )?;
    let el = super::event_log_max_block_number_for_chain(pool, expected_chain_id).await?;
    Ok(revenue_pipeline_spread_vs_event_log_tail_observability_v1(
        expected_chain_id,
        fr.total,
        fr.max_block_number,
        rv.total,
        rv.max_block_number,
        p5.total,
        p5.max_block_number,
        el,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn b397_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_SPREAD_VS_EVENT_LOG_TAIL_OBS_ANCHOR,
            "397-REVENUE-PIPELINE-SPREAD-VS-EVENT-LOG-TAIL-OBS-V1"
        );
    }

    #[test]
    fn b397_empty() {
        let v = revenue_pipeline_spread_vs_event_log_tail_observability_v1(
            137, 0, None, 0, None, 0, None, Some(1),
        );
        assert_eq!(v["dominance_signal"], json!("n_a_empty_projection"));
        assert_eq!(v["tail_slack_blocks"], Value::Null);
    }

    #[test]
    fn b397_single_leg_with_el() {
        let v = revenue_pipeline_spread_vs_event_log_tail_observability_v1(
            137, 1, Some(50), 0, None, 0, None, Some(100),
        );
        assert_eq!(v["dominance_signal"], json!("n_a_single_leg_surface"));
        assert_eq!(v["tail_slack_blocks"], json!(50));
    }

    #[test]
    fn b397_multi_aligned() {
        let v = revenue_pipeline_spread_vs_event_log_tail_observability_v1(
            137, 1, Some(10), 1, Some(10), 0, None, Some(100),
        );
        assert_eq!(v["tail_slack_blocks"], json!(90));
        assert_eq!(
            v["dominance_signal"],
            json!("aligned_multi_leg_no_inter_leg_spread")
        );
    }

    #[test]
    fn b397_drift_small_vs_tail() {
        let v = revenue_pipeline_spread_vs_event_log_tail_observability_v1(
            137, 1, Some(10), 1, Some(20), 1, Some(15), Some(100),
        );
        assert_eq!(v["spread_blocks"], json!(10));
        assert_eq!(v["tail_slack_blocks"], json!(80));
        assert_eq!(
            v["dominance_signal"],
            json!("inter_leg_drift_small_vs_positive_tail_slack")
        );
        assert_eq!(v["spread_to_positive_tail_ratio"], json!(10.0_f64 / 80.0_f64));
    }

    #[test]
    fn b397_drift_no_event_log() {
        let v = revenue_pipeline_spread_vs_event_log_tail_observability_v1(
            137, 1, Some(10), 1, Some(20), 0, None, None,
        );
        assert_eq!(v["dominance_signal"], json!("n_a_event_log_tail_incomparable"));
        assert_eq!(v["tail_slack_blocks"], Value::Null);
    }

    #[test]
    fn b397_drift_non_positive_tail() {
        let v = revenue_pipeline_spread_vs_event_log_tail_observability_v1(
            137, 1, Some(10), 1, Some(200), 0, None, Some(100),
        );
        assert_eq!(v["spread_blocks"], json!(190));
        assert_eq!(v["tail_slack_blocks"], json!(-100));
        assert_eq!(
            v["dominance_signal"],
            json!("inter_leg_drift_with_non_positive_tail_slack")
        );
    }
}
