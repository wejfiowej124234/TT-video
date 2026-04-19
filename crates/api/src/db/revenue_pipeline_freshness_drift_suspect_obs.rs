//! **B-390** / **TT-B390**：**B-389** **freshness** **与** **B-386** **bundle** **对拍** **marker** **的** **关联** **suspect** **观测** **（** **不**入 **`compound_gate`** **）**。

use serde_json::{json, Value};

/// **TT-B390** / **母表 B-390**：机读锚（**`revenue_pipeline_freshness_drift_suspect_observability`**）。
pub const REVENUE_PIPELINE_FRESHNESS_DRIFT_SUSPECT_OBS_ANCHOR: &str =
    "390-REVENUE-PIPELINE-FRESHNESS-DRIFT-SUSPECT-OBS-V1";

/// **与** **B-389** **同源** **：** **`TRAVELTRUST_REVENUE_PIPELINE_FRESHNESS_STALE_SUSPECT_SECS`** **（** **默认** **86400** **）** **。**
pub fn revenue_pipeline_freshness_stale_suspect_threshold_seconds() -> u64 {
    std::env::var("TRAVELTRUST_REVENUE_PIPELINE_FRESHNESS_STALE_SUSPECT_SECS")
        .ok()
        .and_then(|s| s.parse().ok())
        .filter(|&n| n > 0)
        .unwrap_or(86_400)
}

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

const FR: &str = "fee_router_platform_fee_routed_log_count_chain_vs_db_observability";
const RV: &str = "region_vault_forwarded_log_count_chain_vs_db_observability";
const P5: &str = "p5_country_ledger_credited_log_count_chain_vs_db_observability";

/// **`freshness`**：**B-389** **形** **JSON** **；** **`bundle_opt`**：**本** **次** **请求** **已** **算得** **之** **B-386** **bundle** **（** **无** **则** **只** **输出** **`bundle_in_request:false`** **）** **。**
pub fn revenue_pipeline_freshness_drift_suspect_observability_v1(
    expected_chain_id: i64,
    freshness: &Value,
    bundle_opt: Option<&Value>,
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

    let Some(bundle) = bundle_opt else {
        return json!({
            "anchor": REVENUE_PIPELINE_FRESHNESS_DRIFT_SUSPECT_OBS_ANCHOR,
            "schema_version": 1,
            "expected_chain_id": expected_chain_id,
            "boundary": "Associates B-389 persist freshness with B-386 bundle leg markers: when freshness is abnormal, marks per-leg and rollup comparisons as suspect (missing_bundle: all legs+rollup; stale: drift|incomparable only). Requires bundle JSON from the same reconcile request.",
            "stale_suspect_threshold_seconds": stale_suspect_threshold_seconds,
            "freshness_observation_note": note,
            "freshness_age_seconds": age,
            "freshness_abnormal": abnormal,
            "freshness_abnormal_reason": reason_str,
            "bundle_in_request": false,
            "suspect_due_to_freshness": Value::Null,
            "rollup_suspect_due_to_freshness": Value::Null,
            "rule": "missing_bundle: all component markers treated as suspect when bundle present; stale: suspect only drift|incomparable; bundle_in_request false → suspects not evaluated (null).",
        });
    };

    let comps = bundle.get("components").and_then(|c| c.as_object());
    let (m_fr, m_rv, m_p5) = match comps {
        Some(o) => (
            o.get(FR).map(|v| leg_marker_str(v)).unwrap_or("incomparable"),
            o.get(RV).map(|v| leg_marker_str(v)).unwrap_or("incomparable"),
            o.get(P5).map(|v| leg_marker_str(v)).unwrap_or("incomparable"),
        ),
        None => ("incomparable", "incomparable", "incomparable"),
    };
    let roll = bundle
        .get("rollup")
        .and_then(|r| r.get("marker"))
        .and_then(|m| m.as_str())
        .unwrap_or("incomparable");

    let s_fr = suspect_for_marker(reason, m_fr);
    let s_rv = suspect_for_marker(reason, m_rv);
    let s_p5 = suspect_for_marker(reason, m_p5);
    let s_roll = suspect_for_marker(reason, roll);

    json!({
        "anchor": REVENUE_PIPELINE_FRESHNESS_DRIFT_SUSPECT_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "Associates B-389 persist freshness with B-386 bundle leg markers: when freshness is abnormal, marks per-leg and rollup comparisons as suspect (missing_bundle: all legs+rollup; stale: drift|incomparable only). Requires bundle JSON from the same reconcile request.",
        "stale_suspect_threshold_seconds": stale_suspect_threshold_seconds,
        "freshness_observation_note": note,
        "freshness_age_seconds": age,
        "freshness_abnormal": abnormal,
        "freshness_abnormal_reason": reason_str,
        "bundle_in_request": true,
        "suspect_due_to_freshness": {
            FR: s_fr,
            RV: s_rv,
            P5: s_p5,
        },
        "rollup_suspect_due_to_freshness": s_roll,
        "rule": "missing_bundle: all component markers treated as suspect when bundle present; stale: suspect only drift|incomparable; bundle_in_request false → suspects not evaluated (null).",
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn b390_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_FRESHNESS_DRIFT_SUSPECT_OBS_ANCHOR,
            "390-REVENUE-PIPELINE-FRESHNESS-DRIFT-SUSPECT-OBS-V1"
        );
    }

    fn sample_bundle(fr: &str, rv: &str, p5: &str, roll: &str) -> Value {
        json!({
            "rollup": { "marker": roll },
            "components": {
                FR: { "marker": fr },
                RV: { "marker": rv },
                P5: { "marker": p5 },
            }
        })
    }

    #[test]
    fn b390_ok_aligned_all_false() {
        let f = json!({"observation_note": "ok", "age_seconds": 10});
        let b = sample_bundle("aligned", "aligned", "aligned", "aligned");
        let v = revenue_pipeline_freshness_drift_suspect_observability_v1(1, &f, Some(&b), 86400);
        assert_eq!(v["freshness_abnormal"], json!(false));
        assert_eq!(v["bundle_in_request"], json!(true));
        assert_eq!(v["suspect_due_to_freshness"][FR], json!(false));
        assert_eq!(v["rollup_suspect_due_to_freshness"], json!(false));
    }

    #[test]
    fn b390_missing_bundle_all_suspect() {
        let f = json!({"observation_note": "no_stored_revenue_pipeline_bundle_report"});
        let b = sample_bundle("aligned", "aligned", "aligned", "aligned");
        let v = revenue_pipeline_freshness_drift_suspect_observability_v1(1, &f, Some(&b), 86400);
        assert_eq!(v["freshness_abnormal"], json!(true));
        assert_eq!(v["freshness_abnormal_reason"], json!("missing_bundle"));
        assert_eq!(v["suspect_due_to_freshness"][FR], json!(true));
        assert_eq!(v["rollup_suspect_due_to_freshness"], json!(true));
    }

    #[test]
    fn b390_stale_only_drift_suspect() {
        let f = json!({"observation_note": "ok", "age_seconds": 90000});
        let b = sample_bundle("drift", "aligned", "incomparable", "aligned");
        let v = revenue_pipeline_freshness_drift_suspect_observability_v1(1, &f, Some(&b), 86400);
        assert_eq!(v["freshness_abnormal_reason"], json!("stale"));
        assert_eq!(v["suspect_due_to_freshness"][FR], json!(true));
        assert_eq!(v["suspect_due_to_freshness"][RV], json!(false));
        assert_eq!(v["suspect_due_to_freshness"][P5], json!(true));
        assert_eq!(v["rollup_suspect_due_to_freshness"], json!(false));
    }

    #[test]
    fn b390_no_bundle_null_suspects() {
        let f = json!({"observation_note": "ok", "age_seconds": 1});
        let v = revenue_pipeline_freshness_drift_suspect_observability_v1(1, &f, None, 86400);
        assert_eq!(v["bundle_in_request"], json!(false));
        assert!(v["suspect_due_to_freshness"].is_null());
    }
}
