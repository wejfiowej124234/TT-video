//! **B-401** / **TT-B401**：**B-389** **persist** **freshness** **与** **B-400** **triangulation–concordance** **bundle** **marker** **之** **关联** **suspect** **（** **不**入 **`compound_gate`** **）**。
//!
//! **与** **B-390**：**同源** **`classify_freshness`** **/** **`suspect_for_marker`** **族** **，** **bundle** **换** **为** **B-400** **（** **两** **子** **`marker`** **+** **`rollup.marker`** **）** **。**

use serde_json::{json, Value};

/// **TT-B401** / **母表 B-401**：机读锚（**`revenue_pipeline_spread_triangulation_concordance_bundle_freshness_suspect_observability`**）。
pub const REVENUE_PIPELINE_SPREAD_TRIANGULATION_CONCORDANCE_BUNDLE_FRESHNESS_SUSPECT_OBS_ANCHOR: &str =
    "401-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-FRESHNESS-SUSPECT-OBS-V1";

const TRI: &str = "revenue_pipeline_spread_dual_slack_triangulation_observability";
const CON: &str = "revenue_pipeline_spread_dual_axis_dominance_concordance_observability";

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum AbnormalReason {
    Ok,
    MissingBundle,
    Stale,
}

fn classify_freshness(freshness: &Value, threshold_secs: u64) -> AbnormalReason {
    let note = freshness
        .get("observation_note")
        .and_then(|n| n.as_str())
        .unwrap_or("");
    if note == "no_stored_revenue_pipeline_bundle_report" {
        return AbnormalReason::MissingBundle;
    }
    if note == "ok" {
        if let Some(age) = freshness.get("age_seconds").and_then(|a| a.as_u64()) {
            if age > threshold_secs {
                return AbnormalReason::Stale;
            }
        }
    }
    AbnormalReason::Ok
}

fn leg_marker_str(v: &Value) -> &'static str {
    match v.get("marker").and_then(|m| m.as_str()) {
        Some("aligned") => "aligned",
        Some("drift") => "drift",
        Some("unavailable") => "unavailable",
        Some("incomparable") => "incomparable",
        Some(_) | None => "incomparable",
    }
}

fn suspect_for_marker(reason: AbnormalReason, m: &str) -> bool {
    match reason {
        AbnormalReason::Ok => false,
        AbnormalReason::MissingBundle => true,
        AbnormalReason::Stale => m == "drift" || m == "incomparable",
    }
}

/// **`freshness`**：**B-389** **形** **JSON** **；** **`b400_bundle_opt`**：**本** **次** **请求** **已** **算得** **之** **B-400** **bundle** **（** **无** **则** **suspect** **不** **评估** **）** **。**
pub fn revenue_pipeline_spread_triangulation_concordance_bundle_freshness_suspect_observability_v1(
    expected_chain_id: i64,
    freshness: &Value,
    b400_bundle_opt: Option<&Value>,
    stale_suspect_threshold_seconds: u64,
) -> Value {
    let reason = classify_freshness(freshness, stale_suspect_threshold_seconds);
    let abnormal = reason != AbnormalReason::Ok;
    let reason_str = match reason {
        AbnormalReason::Ok => "ok",
        AbnormalReason::MissingBundle => "missing_bundle",
        AbnormalReason::Stale => "stale",
    };

    let note = freshness
        .get("observation_note")
        .cloned()
        .unwrap_or(Value::Null);
    let age = freshness.get("age_seconds").cloned().unwrap_or(Value::Null);

    let Some(bundle) = b400_bundle_opt else {
        return json!({
            "anchor": REVENUE_PIPELINE_SPREAD_TRIANGULATION_CONCORDANCE_BUNDLE_FRESHNESS_SUSPECT_OBS_ANCHOR,
            "schema_version": 1,
            "expected_chain_id": expected_chain_id,
            "boundary": "Associates B-389 persist freshness (B-386 hub report age) with B-400 bundle child markers + rollup.marker: when freshness is abnormal, marks triangulation leg, concordance leg, and rollup as suspect (missing_bundle: all; stale: drift|incomparable only). Requires B-400 bundle JSON from the same reconcile request.",
            "stale_suspect_threshold_seconds": stale_suspect_threshold_seconds,
            "freshness_observation_note": note,
            "freshness_age_seconds": age,
            "freshness_abnormal": abnormal,
            "freshness_abnormal_reason": reason_str,
            "b400_bundle_in_request": false,
            "suspect_due_to_freshness": Value::Null,
            "rollup_suspect_due_to_freshness": Value::Null,
            "rule": "missing_bundle: all component + rollup markers suspect when bundle present; stale: suspect only drift|incomparable; b400_bundle_in_request false → suspects null.",
        });
    };

    let comps = bundle.get("components").and_then(|c| c.as_object());
    let (m_tri, m_con) = match comps {
        Some(o) => (
            o.get(TRI).map(|v| leg_marker_str(v)).unwrap_or("incomparable"),
            o.get(CON).map(|v| leg_marker_str(v)).unwrap_or("incomparable"),
        ),
        None => ("incomparable", "incomparable"),
    };
    let roll = bundle
        .get("rollup")
        .and_then(|r| r.get("marker"))
        .and_then(|m| m.as_str())
        .unwrap_or("incomparable");

    let s_tri = suspect_for_marker(reason, m_tri);
    let s_con = suspect_for_marker(reason, m_con);
    let s_roll = suspect_for_marker(reason, roll);

    json!({
        "anchor": REVENUE_PIPELINE_SPREAD_TRIANGULATION_CONCORDANCE_BUNDLE_FRESHNESS_SUSPECT_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "Associates B-389 persist freshness (B-386 hub report age) with B-400 bundle child markers + rollup.marker: when freshness is abnormal, marks triangulation leg, concordance leg, and rollup as suspect (missing_bundle: all; stale: drift|incomparable only). Requires B-400 bundle JSON from the same reconcile request.",
        "stale_suspect_threshold_seconds": stale_suspect_threshold_seconds,
        "freshness_observation_note": note,
        "freshness_age_seconds": age,
        "freshness_abnormal": abnormal,
        "freshness_abnormal_reason": reason_str,
        "b400_bundle_in_request": true,
        "suspect_due_to_freshness": {
            TRI: s_tri,
            CON: s_con,
        },
        "rollup_suspect_due_to_freshness": s_roll,
        "rule": "missing_bundle: all component + rollup markers suspect when bundle present; stale: suspect only drift|incomparable; b400_bundle_in_request false → suspects null.",
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn b401_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_SPREAD_TRIANGULATION_CONCORDANCE_BUNDLE_FRESHNESS_SUSPECT_OBS_ANCHOR,
            "401-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-FRESHNESS-SUSPECT-OBS-V1"
        );
    }

    #[test]
    fn b401_no_bundle_in_request() {
        let f = json!({"observation_note": "ok", "age_seconds": 10});
        let v = revenue_pipeline_spread_triangulation_concordance_bundle_freshness_suspect_observability_v1(
            1, &f, None, 86400,
        );
        assert_eq!(v["b400_bundle_in_request"], json!(false));
        assert!(v["suspect_due_to_freshness"].is_null());
    }

    #[test]
    fn b401_stale_marks_drift_leg() {
        let f = json!({"observation_note": "ok", "age_seconds": 90000});
        let b400 = json!({
            "components": {
                TRI: {"marker": "drift"},
                CON: {"marker": "aligned"},
            },
            "rollup": {"marker": "incomparable"},
        });
        let v = revenue_pipeline_spread_triangulation_concordance_bundle_freshness_suspect_observability_v1(
            1,
            &f,
            Some(&b400),
            86400,
        );
        assert_eq!(v["suspect_due_to_freshness"][TRI], json!(true));
        assert_eq!(v["suspect_due_to_freshness"][CON], json!(false));
        assert_eq!(v["rollup_suspect_due_to_freshness"], json!(true));
    }
}
