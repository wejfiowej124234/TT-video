//! **B-389** / **TT-B389**：**revenue_pipeline** **bundle** **（** **B-386** **）** **在** **`reconciliation_reports`** **中** **最近** **一次** **落库** **的** **年龄** **（** **只读** **DB** **；** **不**入 **`compound_gate`** **）**。

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use uuid::Uuid;

/// **TT-B389** / **母表 B-389**：机读锚（**`revenue_pipeline_latest_persist_freshness_observability`**）。
pub const REVENUE_PIPELINE_LATEST_PERSIST_FRESHNESS_OBS_ANCHOR: &str =
    "389-REVENUE-PIPELINE-LATEST-PERSIST-FRESHNESS-OBS-V1";

/// **对拍** **链路** **：** **`reconciliation_reports.summary`** **须** **已** **含** **B-386** **bundle** **键** **（** **见** **`boundary`** **）** **。**
pub const REVENUE_PIPELINE_BUNDLE_SUMMARY_KEY: &str =
    "revenue_pipeline_log_count_chain_vs_db_bundle_observability";

/// **`latest`**：**insert** **前** **库内** **该** **链** **上** **最新** **一笔** **带** **B-386** **bundle** **的** **报告** **元数据** **（** **无** **则** **`None`** **）** **。**
pub fn revenue_pipeline_latest_persist_freshness_observability_v1(
    expected_chain_id: i64,
    now: DateTime<Utc>,
    latest: Option<(Uuid, DateTime<Utc>)>,
) -> Value {
    let (latest_report_id, latest_report_created_at, age_seconds, observation_note) = match latest {
        Some((id, created_at)) => {
            let secs = (now - created_at).num_seconds().max(0);
            (
                json!(id.to_string()),
                json!(created_at.to_rfc3339()),
                json!(secs),
                json!("ok"),
            )
        }
        None => (Value::Null, Value::Null, Value::Null, json!("no_stored_revenue_pipeline_bundle_report")),
    };

    json!({
        "anchor": REVENUE_PIPELINE_LATEST_PERSIST_FRESHNESS_OBS_ANCHOR,
        "schema_version": 1,
        "expected_chain_id": expected_chain_id,
        "boundary": "Age in whole seconds from reconciliation_reports.created_at of the latest orders_projection_vs_orders row for this chain whose summary contains revenue_pipeline_log_count_chain_vs_db_bundle_observability (B-386 bundle hub); evaluated before the current persist insert.",
        "latest_report_id": latest_report_id,
        "latest_report_created_at": latest_report_created_at,
        "age_seconds": age_seconds,
        "observation_note": observation_note,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn b389_anchor_constant() {
        assert_eq!(
            REVENUE_PIPELINE_LATEST_PERSIST_FRESHNESS_OBS_ANCHOR,
            "389-REVENUE-PIPELINE-LATEST-PERSIST-FRESHNESS-OBS-V1"
        );
    }

    #[test]
    fn b389_no_prior() {
        let now = Utc.with_ymd_and_hms(2026, 4, 15, 12, 0, 0).unwrap();
        let v = revenue_pipeline_latest_persist_freshness_observability_v1(80002, now, None);
        assert_eq!(v["observation_note"], json!("no_stored_revenue_pipeline_bundle_report"));
        assert!(v["age_seconds"].is_null());
    }

    #[test]
    fn b389_age_non_negative() {
        let id = Uuid::from_u128(99);
        let created = Utc.with_ymd_and_hms(2026, 4, 15, 11, 59, 50).unwrap();
        let now = Utc.with_ymd_and_hms(2026, 4, 15, 12, 0, 0).unwrap();
        let v = revenue_pipeline_latest_persist_freshness_observability_v1(80002, now, Some((id, created)));
        assert_eq!(v["age_seconds"], json!(10));
        assert_eq!(v["observation_note"], json!("ok"));
    }
}
