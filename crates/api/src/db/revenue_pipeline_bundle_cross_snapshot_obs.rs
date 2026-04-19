//! **B-387** / **TT-B387**：**revenue pipeline bundle** **`rollup.marker`** **跨 persist** **快照对比**（**最新已落库** **`summary`** **bundle** vs **本次** **reconcile** **计算 bundle**；**不**入 **`compound_gate`**）。

use serde_json::{json, Value};
use uuid::Uuid;

/// **TT-B387** / **母表 B-387**：机读锚（**`revenue_pipeline_bundle_cross_snapshot_drift_observability`**）。
pub const REVENUE_PIPELINE_BUNDLE_CROSS_SNAPSHOT_DRIFT_OBS_ANCHOR: &str =
    "387-REVENUE-PIPELINE-BUNDLE-CROSS-SNAPSHOT-DRIFT-OBS-V1";

fn rollup_marker_from_bundle(b: &Value) -> Option<String> {
    b.get("rollup")?
        .get("marker")?
        .as_str()
        .map(std::string::ToString::to_string)
}

/// **prior**：**本次 insert 之前** **`get_latest(orders_projection_vs_orders)`** 报告 **`summary`** 内之 **`revenue_pipeline_log_count_chain_vs_db_bundle_observability`**（若有）。
pub fn revenue_pipeline_bundle_cross_snapshot_drift_observability_v1(
    expected_chain_id: i64,
    current_bundle: &Value,
    prior_report_id: Option<Uuid>,
    prior_bundle: Option<&Value>,
) -> Value {
    let mut base = json!({
        "anchor": REVENUE_PIPELINE_BUNDLE_CROSS_SNAPSHOT_DRIFT_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "Compare rollup.marker of the latest persisted revenue_pipeline_log_count_chain_vs_db_bundle_observability (before this reconcile insert) vs the bundle computed in this reconcile response. prior_report_id is the latest row before insert.",
    });

    let current_marker = rollup_marker_from_bundle(current_bundle);
    let prior_marker = prior_bundle.and_then(|p| rollup_marker_from_bundle(p));

    base.as_object_mut()
        .expect("object")
        .insert(
            "current".into(),
            json!({
                "rollup_marker": current_marker.clone(),
            }),
        );

    if prior_report_id.is_none() {
        base.as_object_mut()
            .expect("object")
            .insert("marker".into(), json!("incomparable"));
        base.as_object_mut()
            .expect("object")
            .insert(
                "observation_note".into(),
                json!("no_prior_reconciliation_report"),
            );
        return base;
    }

    let pid = prior_report_id.expect("checked");
    base.as_object_mut()
        .expect("object")
        .insert(
            "prior_snapshot".into(),
            json!({
                "report_id": pid.to_string(),
                "rollup_marker": prior_marker.clone(),
            }),
        );

    if prior_marker.is_none() {
        base.as_object_mut()
            .expect("object")
            .insert("marker".into(), json!("incomparable"));
        base.as_object_mut()
            .expect("object")
            .insert(
                "observation_note".into(),
                json!("prior_report_missing_revenue_pipeline_bundle"),
            );
        return base;
    }

    if current_marker.is_none() {
        base.as_object_mut()
            .expect("object")
            .insert("marker".into(), json!("incomparable"));
        base.as_object_mut()
            .expect("object")
            .insert(
                "observation_note".into(),
                json!("current_bundle_missing_rollup_marker"),
            );
        return base;
    }

    let pm = prior_marker.expect("prior_marker");
    let cm = current_marker.expect("current_marker");
    let stable = pm == cm;
    let marker = if stable { "aligned" } else { "drift" };
    let delta = if stable { "none" } else { "changed" };

    base.as_object_mut()
        .expect("object")
        .insert("marker".into(), json!(marker));
    base.as_object_mut()
        .expect("object")
        .insert("rollup_marker_delta".into(), json!(delta));
    base.as_object_mut()
        .expect("object")
        .insert(
            "checks".into(),
            json!({
                "cross_bundle_rollup_vs_prior_snapshot": if stable { "aligned" } else { "drift" },
            }),
        );

    base
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn b387_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_BUNDLE_CROSS_SNAPSHOT_DRIFT_OBS_ANCHOR,
            "387-REVENUE-PIPELINE-BUNDLE-CROSS-SNAPSHOT-DRIFT-OBS-V1"
        );
    }

    #[test]
    fn b387_aligned_when_rollup_stable() {
        let b = json!({"rollup": {"marker": "incomparable"}});
        let v = revenue_pipeline_bundle_cross_snapshot_drift_observability_v1(
            137,
            &b,
            Some(Uuid::nil()),
            Some(&b),
        );
        assert_eq!(v["marker"], "aligned");
        assert_eq!(v["rollup_marker_delta"], "none");
    }

    #[test]
    fn b387_drift_when_rollup_changes() {
        let cur = json!({"rollup": {"marker": "drift"}});
        let prev = json!({"rollup": {"marker": "aligned"}});
        let v = revenue_pipeline_bundle_cross_snapshot_drift_observability_v1(
            137,
            &cur,
            Some(Uuid::nil()),
            Some(&prev),
        );
        assert_eq!(v["marker"], "drift");
        assert_eq!(v["rollup_marker_delta"], "changed");
    }
}
