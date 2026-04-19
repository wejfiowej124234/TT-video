//! **B-393** / **TT-B393**：**B-391** **checkpoint** **腿** **与** **B-392** **`event_log`** **尾** **腿** **之** **rollup** **bundle**（**纯** **内存** **组装** **子** **JSON** **；** **不**入 **`compound_gate`** **）。

use serde_json::{json, Value};

/// **TT-B393** / **母表 B-393**：机读锚（**`revenue_pipeline_union_max_checkpoint_vs_event_log_tail_bundle_observability`**）。
pub const REVENUE_PIPELINE_UNION_MAX_CHECKPOINT_VS_EVENT_LOG_TAIL_BUNDLE_OBS_ANCHOR: &str =
    "393-REVENUE-PIPELINE-UNION-MAX-CHECKPOINT-VS-EVENT-LOG-TAIL-BUNDLE-OBS-V1";

fn marker_str(v: &Value) -> &'static str {
    match v.get("marker").and_then(|m| m.as_str()) {
        Some("aligned") => "aligned",
        Some("drift") => "drift",
        Some("incomparable") => "incomparable",
        Some(_) | None => "incomparable",
    }
}

/// **worst-of** **两** **腿**：**drift** **>** **incomparable** **>** **aligned** **（** **与** **B-386** **三** **腿** **rollup** **同** **族** **，** **无** **`unavailable`** **）** **。**
fn rollup_two(m1: &str, m2: &str) -> &'static str {
    if m1 == "drift" || m2 == "drift" {
        return "drift";
    }
    if m1 == "incomparable" || m2 == "incomparable" {
        return "incomparable";
    }
    if m1 == "aligned" && m2 == "aligned" {
        return "aligned";
    }
    "incomparable"
}

/// **由** **B-391** **/** **B-392** **子** **观测** **JSON** **（** **已** **算得** **）** **组装** **bundle** **。**
pub fn revenue_pipeline_union_max_checkpoint_vs_event_log_tail_bundle_observability_v1(
    expected_chain_id: i64,
    revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability: Value,
    revenue_pipeline_union_max_vs_event_log_max_block_tail_coverage_observability: Value,
) -> Value {
    let m_ck = marker_str(&revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability);
    let m_el = marker_str(&revenue_pipeline_union_max_vs_event_log_max_block_tail_coverage_observability);
    let roll = rollup_two(m_ck, m_el);
    json!({
        "anchor": REVENUE_PIPELINE_UNION_MAX_CHECKPOINT_VS_EVENT_LOG_TAIL_BUNDLE_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "Roll-up of TT-B391 (union max vs indexer checkpoint / gap_blocks) and TT-B392 (union max vs event_log MAX(block_number) / tail_slack_blocks). rollup.marker is worst-of child markers: drift > incomparable > aligned.",
        "components": {
            "revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability": revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability,
            "revenue_pipeline_union_max_vs_event_log_max_block_tail_coverage_observability": revenue_pipeline_union_max_vs_event_log_max_block_tail_coverage_observability,
        },
        "rollup": {
            "marker": roll,
            "markers": {
                "revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability": m_ck,
                "revenue_pipeline_union_max_vs_event_log_max_block_tail_coverage_observability": m_el,
            },
            "rule": "worst-of child markers: drift > incomparable > aligned",
        },
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn b393_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_UNION_MAX_CHECKPOINT_VS_EVENT_LOG_TAIL_BUNDLE_OBS_ANCHOR,
            "393-REVENUE-PIPELINE-UNION-MAX-CHECKPOINT-VS-EVENT-LOG-TAIL-BUNDLE-OBS-V1"
        );
    }

    #[test]
    fn b393_rollup_drift_wins() {
        let b = revenue_pipeline_union_max_checkpoint_vs_event_log_tail_bundle_observability_v1(
            137,
            json!({"marker": "aligned", "anchor": "391"}),
            json!({"marker": "drift", "anchor": "392"}),
        );
        assert_eq!(b["rollup"]["marker"], "drift");
    }

    #[test]
    fn b393_rollup_both_aligned() {
        let b = revenue_pipeline_union_max_checkpoint_vs_event_log_tail_bundle_observability_v1(
            137,
            json!({"marker": "aligned"}),
            json!({"marker": "aligned"}),
        );
        assert_eq!(b["rollup"]["marker"], "aligned");
    }

    #[test]
    fn b393_rollup_incomparable_after_aligned() {
        let b = revenue_pipeline_union_max_checkpoint_vs_event_log_tail_bundle_observability_v1(
            137,
            json!({"marker": "aligned"}),
            json!({"marker": "incomparable"}),
        );
        assert_eq!(b["rollup"]["marker"], "incomparable");
    }
}
