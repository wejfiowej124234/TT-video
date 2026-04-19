//! **B-392** / **TT-B392**：**三** **经济** **投影** **union max** **与** **`event_log`** **本链** **MAX(block_number)** **尾** **间隙** **（** **只读** **DB** **；** **不**入 **`compound_gate`** **）**。
//!
//! **语义**：投影行 **不应** 声称 **高于** **已** **物化** **之** **`event_log`** **尾块** **（** **否则** **`marker=drift`** **）** **；** **`tail_slack_blocks = event_log_max − union_max ≥ 0`** **为** **aligned** **。**

use serde_json::{json, Value};
use sqlx::postgres::PgPool;

/// **TT-B392** / **母表 B-392**：机读锚（**`revenue_pipeline_union_max_vs_event_log_max_block_tail_coverage_observability`**）。
pub const REVENUE_PIPELINE_UNION_MAX_VS_EVENT_LOG_MAX_BLOCK_TAIL_COVERAGE_OBS_ANCHOR: &str =
    "392-REVENUE-PIPELINE-UNION-MAX-VS-EVENT-LOG-MAX-BLOCK-TAIL-COVERAGE-OBS-V1";

fn union_max_from_legs(
    fr_total: i64,
    fr_max: Option<i64>,
    rv_total: i64,
    rv_max: Option<i64>,
    p5_total: i64,
    p5_max: Option<i64>,
) -> Option<i64> {
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
    if candidates.is_empty() {
        None
    } else {
        Some(candidates.into_iter().max().unwrap_or(0))
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
pub fn revenue_pipeline_union_max_vs_event_log_max_block_tail_coverage_observability_v1(
    expected_chain_id: i64,
    fr_total: i64,
    fr_max: Option<i64>,
    rv_total: i64,
    rv_max: Option<i64>,
    p5_total: i64,
    p5_max: Option<i64>,
    event_log_max_block_number: Option<i64>,
) -> Value {
    let union_max = union_max_from_legs(fr_total, fr_max, rv_total, rv_max, p5_total, p5_max);

    let (tail_slack_blocks, marker, observation_note) = match (union_max, event_log_max_block_number) {
        (None, _) => (
            Value::Null,
            "incomparable",
            json!("projection_tables_empty_all_legs"),
        ),
        (Some(_), None) => (
            Value::Null,
            "incomparable",
            json!("event_log_empty_for_chain"),
        ),
        (Some(um), Some(el)) => {
            let slack = tail_slack_i64(el, um);
            let m = if slack < 0 {
                "drift"
            } else {
                "aligned"
            };
            (json!(slack), m, json!("ok"))
        }
    };

    json!({
        "anchor": REVENUE_PIPELINE_UNION_MAX_VS_EVENT_LOG_MAX_BLOCK_TAIL_COVERAGE_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "union_max = max of per-table MAX(block_number) where the table has rows for chain_id (fee_router_routed_events, region_vault_forwarded_events, p5_country_ledger_lines). event_log_max_block_number = MAX(block_number) FROM event_log WHERE chain_id=:chain. tail_slack_blocks = event_log_max_block_number - union_max; negative means economic projection claims blocks beyond indexed event_log tail (drift).",
        "union_max_block_number": union_max.map(|n| json!(n)).unwrap_or(Value::Null),
        "event_log_max_block_number": event_log_max_block_number.map(|n| json!(n)).unwrap_or(Value::Null),
        "tail_slack_blocks": tail_slack_blocks,
        "marker": marker,
        "observation_note": observation_note,
    })
}

/// **异步** **：** **三** **表** **stats** **+** **`event_log`** **max** **。**
pub async fn revenue_pipeline_union_max_vs_event_log_max_block_tail_coverage_observability(
    pool: &PgPool,
    expected_chain_id: i64,
) -> Result<Value, sqlx::Error> {
    let (fr, rv, p5) = tokio::try_join!(
        super::fee_router_routed_stats(pool, Some(expected_chain_id)),
        super::region_vault_forwarded_stats(pool, Some(expected_chain_id)),
        super::p5_country_ledger_lines_stats(pool, Some(expected_chain_id)),
    )?;
    let el = super::event_log_max_block_number_for_chain(pool, expected_chain_id).await?;
    Ok(revenue_pipeline_union_max_vs_event_log_max_block_tail_coverage_observability_v1(
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
    fn b392_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_UNION_MAX_VS_EVENT_LOG_MAX_BLOCK_TAIL_COVERAGE_OBS_ANCHOR,
            "392-REVENUE-PIPELINE-UNION-MAX-VS-EVENT-LOG-MAX-BLOCK-TAIL-COVERAGE-OBS-V1"
        );
    }

    #[test]
    fn b392_aligned_when_event_log_ahead() {
        let v = revenue_pipeline_union_max_vs_event_log_max_block_tail_coverage_observability_v1(
            137, 1, Some(10), 0, None, 0, None, Some(100),
        );
        assert_eq!(v["tail_slack_blocks"], json!(90));
        assert_eq!(v["marker"], json!("aligned"));
    }

    #[test]
    fn b392_drift_when_union_above_event_log() {
        let v = revenue_pipeline_union_max_vs_event_log_max_block_tail_coverage_observability_v1(
            137, 1, Some(500), 0, None, 0, None, Some(100),
        );
        assert_eq!(v["tail_slack_blocks"], json!(-400));
        assert_eq!(v["marker"], json!("drift"));
    }

    #[test]
    fn b392_incomparable_no_projection() {
        let v = revenue_pipeline_union_max_vs_event_log_max_block_tail_coverage_observability_v1(
            137, 0, None, 0, None, 0, None, Some(1),
        );
        assert!(v["tail_slack_blocks"].is_null());
        assert_eq!(v["marker"], json!("incomparable"));
    }
}
