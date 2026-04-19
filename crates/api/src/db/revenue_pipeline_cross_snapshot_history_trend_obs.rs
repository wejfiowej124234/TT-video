//! **B-388** / **TT-B388**：**revenue_pipeline** **cross-snapshot** **历史** **趋势**（**≥2** **个** **persist** **点** **序列**；**不**入 **`compound_gate`**）。

use serde_json::{json, Value};

use super::reconciliation_reports::ReconciliationReportRow;

/// **TT-B388** / **母表 B-388**：机读锚（**`revenue_pipeline_cross_snapshot_history_trend_observability`**）。
pub const REVENUE_PIPELINE_CROSS_SNAPSHOT_HISTORY_TREND_OBS_ANCHOR: &str =
    "388-REVENUE-PIPELINE-CROSS-SNAPSHOT-HISTORY-TREND-OBS-V1";

/// **summary** 根级 **`revenue_pipeline_bundle_cross_snapshot_drift_observability`**。
const B387_SUMMARY_KEY: &str = "revenue_pipeline_bundle_cross_snapshot_drift_observability";

/// **与** **B-156** **`by_batch`** **上限** **同量级** **（** **机读** **cap** **）**。
pub const REVENUE_PIPELINE_CROSS_SNAPSHOT_HISTORY_MAX_POINTS: usize = 32;

fn marker_str(v: &Value) -> Option<&str> {
    v.get("marker")?.as_str()
}

fn is_drift_marker(m: Option<&str>) -> bool {
    matches!(m, Some("drift"))
}

fn is_incomparable_marker(m: Option<&str>) -> bool {
    matches!(m, Some("incomparable"))
}

/// **`classify`**：**`aligned`** **/** **`drift`** **/** **`null`**（**incomparable** **/** **缺键** **/** **null** **marker**）。
fn classify_aligned_drift(m: Option<&str>) -> Option<&'static str> {
    match m {
        Some("aligned") => Some("aligned"),
        Some("drift") => Some("drift"),
        _ => None,
    }
}

/// **`current_b387`**：**本** **次** **reconcile** **已算好** **的** **B-387** **体**；**`prior_reports_newest_first`**：**insert** **前** **已落库** **行** **（** **新** **→** **旧** **，** **已** **cap** **）**。
pub fn revenue_pipeline_cross_snapshot_history_trend_observability_v1(
    expected_chain_id: i64,
    current_b387: &Value,
    prior_reports_newest_first: &[ReconciliationReportRow],
) -> Value {
    let mut series_newest_first: Vec<Value> = Vec::new();

    series_newest_first.push(json!({
        "source": "current_reconcile",
        "report_id": Value::Null,
        "marker": current_b387.get("marker").cloned().unwrap_or(Value::Null),
        "rollup_marker_delta": current_b387.get("rollup_marker_delta").cloned().unwrap_or(Value::Null),
    }));

    for row in prior_reports_newest_first.iter().take(REVENUE_PIPELINE_CROSS_SNAPSHOT_HISTORY_MAX_POINTS.saturating_sub(1)) {
        let ent = row
            .summary
            .0
            .get(B387_SUMMARY_KEY)
            .cloned()
            .unwrap_or(Value::Null);
        if ent.is_null() || !ent.is_object() {
            continue;
        }
        series_newest_first.push(json!({
            "source": "persisted_summary",
            "report_id": row.id.to_string(),
            "created_at": row.created_at.to_rfc3339(),
            "marker": ent.get("marker").cloned().unwrap_or(Value::Null),
            "rollup_marker_delta": ent.get("rollup_marker_delta").cloned().unwrap_or(Value::Null),
        }));
    }

    let points_included = series_newest_first.len() as i64;

    let mut consecutive_drift_streak: i64 = 0;
    for p in &series_newest_first {
        let m = p.get("marker").and_then(|x| x.as_str());
        if is_drift_marker(m) {
            consecutive_drift_streak += 1;
        } else {
            break;
        }
    }

    let mut consecutive_incomparable_tail: i64 = 0;
    for p in &series_newest_first {
        let m = p.get("marker").and_then(|x| x.as_str());
        if is_incomparable_marker(m) {
            consecutive_incomparable_tail += 1;
        } else {
            break;
        }
    }

    let mut last_flip: Value = Value::Null;
    if series_newest_first.len() >= 2 {
        let chronological: Vec<&Value> = series_newest_first.iter().rev().collect();
        for w in chronological.windows(2) {
            let older = w[0];
            let newer = w[1];
            let mo = older.get("marker").and_then(|x| x.as_str());
            let mn = newer.get("marker").and_then(|x| x.as_str());
            let co = classify_aligned_drift(mo);
            let cn = classify_aligned_drift(mn);
            if let (Some(a), Some(b)) = (co, cn) {
                if a != b {
                    last_flip = json!({
                        "from": a,
                        "to": b,
                        "older_report_id": older.get("report_id").cloned().unwrap_or(Value::Null),
                        "newer_report_id": newer.get("report_id").cloned().unwrap_or(Value::Null),
                    });
                }
            }
        }
    }

    let observation_note = if points_included < 2 {
        json!("sparse_series_need_two_or_more_b387_points")
    } else {
        json!("ok")
    };

    json!({
        "anchor": REVENUE_PIPELINE_CROSS_SNAPSHOT_HISTORY_TREND_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "Rolling series from current B-387 plus persisted summaries (newest-first) capped; streaks from newest; last_flip scans aligned<->drift in chronological order.",
        "max_points_kept": REVENUE_PIPELINE_CROSS_SNAPSHOT_HISTORY_MAX_POINTS as i64,
        "points_included": points_included,
        "series_newest_first": series_newest_first,
        "consecutive_drift_streak": consecutive_drift_streak,
        "consecutive_incomparable_tail": consecutive_incomparable_tail,
        "last_flip": last_flip,
        "observation_note": observation_note,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use sqlx::types::Json;
    use uuid::Uuid;

    #[test]
    fn b388_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_CROSS_SNAPSHOT_HISTORY_TREND_OBS_ANCHOR,
            "388-REVENUE-PIPELINE-CROSS-SNAPSHOT-HISTORY-TREND-OBS-V1"
        );
    }

    fn row_with_b387(id: Uuid, m: &str, d: &str) -> ReconciliationReportRow {
        let b387 = json!({
            "marker": m,
            "rollup_marker_delta": d,
        });
        let summary = json!({ B387_SUMMARY_KEY: b387 });
        ReconciliationReportRow {
            id,
            report_type: "orders_projection_vs_orders".to_string(),
            chain_id: Some(137),
            period_start: None,
            period_end: None,
            summary: Json(summary),
            details_path: None,
            created_at: Utc::now(),
        }
    }

    #[test]
    fn b388_streak_and_flip() {
        let cur = json!({"marker": "drift", "rollup_marker_delta": "changed"});
        let r0 = row_with_b387(Uuid::from_u128(1), "aligned", "none");
        let r1 = row_with_b387(Uuid::from_u128(2), "drift", "changed");
        let v = revenue_pipeline_cross_snapshot_history_trend_observability_v1(137, &cur, &[r0, r1]);
        assert_eq!(v["consecutive_drift_streak"], json!(1));
        assert_eq!(v["points_included"], json!(3));
        assert!(v["last_flip"].is_object());
        assert_eq!(v["last_flip"]["from"], json!("aligned"));
        assert_eq!(v["last_flip"]["to"], json!("drift"));
    }

    #[test]
    fn b388_sparse_only_current() {
        let cur = json!({"marker": "incomparable", "rollup_marker_delta": json!(null)});
        let v = revenue_pipeline_cross_snapshot_history_trend_observability_v1(137, &cur, &[]);
        assert_eq!(v["points_included"], json!(1));
        assert_eq!(v["observation_note"], json!("sparse_series_need_two_or_more_b387_points"));
        assert_eq!(v["consecutive_incomparable_tail"], json!(1));
    }
}
