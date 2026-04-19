//! **B-400** / **TT-B400**：**B-398** **`triangulation_signal`** **叙事** **与** **B-399** **`concordance_signal`** **叙事** **之** **并列** **bundle**（**纯** **内存** **组装** **子** **JSON** **；** **不** **重算** **B-394～B-397** **腿面** **；** **不**入 **`compound_gate`** **）。

use serde_json::{json, Value};

/// **TT-B400** / **母表 B-400**：机读锚（**`revenue_pipeline_spread_triangulation_concordance_bundle_observability`**）。
pub const REVENUE_PIPELINE_SPREAD_TRIANGULATION_CONCORDANCE_BUNDLE_OBS_ANCHOR: &str =
    "400-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-OBS-V1";

fn marker_str(v: &Value) -> &'static str {
    match v.get("marker").and_then(|m| m.as_str()) {
        Some("aligned") => "aligned",
        Some("drift") => "drift",
        Some("incomparable") => "incomparable",
        Some(_) | None => "incomparable",
    }
}

/// **worst-of** **B-398** **`marker`** **与** **B-399** **`marker`**：**drift** **>** **incomparable** **>** **aligned** **（** **与** **B-393** **rollup** **同** **族** **）** **。**
fn rollup_two(m398: &str, m399: &str) -> &'static str {
    if m398 == "drift" || m399 == "drift" {
        return "drift";
    }
    if m398 == "incomparable" || m399 == "incomparable" {
        return "incomparable";
    }
    if m398 == "aligned" && m399 == "aligned" {
        return "aligned";
    }
    "incomparable"
}

/// **由** **B-398** **/** **B-399** **完整** **JSON** **成功体** **组装** **bundle** **（** **单测** **/** **indexer-reconcile** **）** **。**
pub fn revenue_pipeline_spread_triangulation_concordance_bundle_observability_v1(
    expected_chain_id: i64,
    revenue_pipeline_spread_dual_slack_triangulation_observability: Value,
    revenue_pipeline_spread_dual_axis_dominance_concordance_observability: Value,
) -> Value {
    let m_tri = marker_str(&revenue_pipeline_spread_dual_slack_triangulation_observability);
    let m_con = marker_str(&revenue_pipeline_spread_dual_axis_dominance_concordance_observability);
    let roll = rollup_two(m_tri, m_con);
    json!({
        "anchor": REVENUE_PIPELINE_SPREAD_TRIANGULATION_CONCORDANCE_BUNDLE_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "Roll-up of TT-B398 (triangulation_signal / dual-slack triangulation) and TT-B399 (concordance_signal / dual-axis dominance concordance). Child JSONs are passed through verbatim under components. rollup.marker is worst-of child markers: drift > incomparable > aligned. Does not emit new spread/gap/tail math; does not replace standalone B-398/B-399 keys.",
        "child_anchors": {
            "revenue_pipeline_spread_dual_slack_triangulation_observability": crate::db::REVENUE_PIPELINE_SPREAD_DUAL_SLACK_TRIANGULATION_OBS_ANCHOR,
            "revenue_pipeline_spread_dual_axis_dominance_concordance_observability": crate::db::REVENUE_PIPELINE_SPREAD_DUAL_AXIS_DOMINANCE_CONCORDANCE_OBS_ANCHOR,
        },
        "components": {
            "revenue_pipeline_spread_dual_slack_triangulation_observability": revenue_pipeline_spread_dual_slack_triangulation_observability,
            "revenue_pipeline_spread_dual_axis_dominance_concordance_observability": revenue_pipeline_spread_dual_axis_dominance_concordance_observability,
        },
        "rollup": {
            "marker": roll,
            "markers": {
                "revenue_pipeline_spread_dual_slack_triangulation_observability": m_tri,
                "revenue_pipeline_spread_dual_axis_dominance_concordance_observability": m_con,
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
    fn b400_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_SPREAD_TRIANGULATION_CONCORDANCE_BUNDLE_OBS_ANCHOR,
            "400-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-OBS-V1"
        );
    }

    #[test]
    fn b400_rollup_drift_wins() {
        let b = revenue_pipeline_spread_triangulation_concordance_bundle_observability_v1(
            137,
            json!({"marker": "aligned", "anchor": "398"}),
            json!({"marker": "drift", "anchor": "399"}),
        );
        assert_eq!(b["rollup"]["marker"], "drift");
    }

    #[test]
    fn b400_rollup_both_aligned() {
        let b = revenue_pipeline_spread_triangulation_concordance_bundle_observability_v1(
            137,
            json!({"marker": "aligned"}),
            json!({"marker": "aligned"}),
        );
        assert_eq!(b["rollup"]["marker"], "aligned");
    }

    #[test]
    fn b400_rollup_incomparable_after_aligned() {
        let b = revenue_pipeline_spread_triangulation_concordance_bundle_observability_v1(
            137,
            json!({"marker": "aligned"}),
            json!({"marker": "incomparable"}),
        );
        assert_eq!(b["rollup"]["marker"], "incomparable");
    }
}
