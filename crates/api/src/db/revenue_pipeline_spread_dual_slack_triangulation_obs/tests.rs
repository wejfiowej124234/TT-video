use serde_json::{json, Value};

use super::{
    revenue_pipeline_spread_dual_slack_triangulation_observability_v1,
    REVENUE_PIPELINE_SPREAD_DUAL_SLACK_TRIANGULATION_OBS_ANCHOR,
};

#[test]
fn b398_anchor_constant() {
    assert_eq!(
        REVENUE_PIPELINE_SPREAD_DUAL_SLACK_TRIANGULATION_OBS_ANCHOR,
        "398-REVENUE-PIPELINE-SPREAD-DUAL-SLACK-TRIANGULATION-OBS-V1"
    );
}

#[test]
fn b398_empty() {
    let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
        137,
        0,
        None,
        0,
        None,
        0,
        None,
        Some(1),
        100,
    );
    assert_eq!(v["triangulation_signal"], json!("n_a_empty_projection"));
    assert_eq!(v["gap_blocks"], Value::Null);
}

#[test]
fn b398_single_leg() {
    let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
        137,
        1,
        Some(50),
        0,
        None,
        0,
        None,
        Some(100),
        100,
    );
    assert_eq!(v["triangulation_signal"], json!("n_a_single_leg_surface"));
}

#[test]
fn b398_aligned_multi() {
    let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
        137,
        1,
        Some(10),
        1,
        Some(10),
        0,
        None,
        Some(100),
        100,
    );
    assert_eq!(
        v["triangulation_signal"],
        json!("aligned_multi_leg_no_inter_leg_spread")
    );
}

#[test]
fn b398_drift_no_el() {
    let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
        137,
        1,
        Some(10),
        1,
        Some(20),
        0,
        None,
        None,
        100,
    );
    assert_eq!(
        v["triangulation_signal"],
        json!("n_a_event_log_tail_incomparable")
    );
}

#[test]
fn b398_drift_non_positive_slack() {
    let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
        137,
        1,
        Some(10),
        1,
        Some(200),
        0,
        None,
        Some(100),
        100,
    );
    assert_eq!(
        v["triangulation_signal"],
        json!("inter_leg_drift_triangulation_incomparable_non_positive_slack")
    );
}

#[test]
fn b398_drift_lt_min() {
    let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
        137,
        1,
        Some(10),
        1,
        Some(20),
        1,
        Some(15),
        Some(1000),
        500,
    );
    assert_eq!(v["spread_blocks"], json!(10));
    assert_eq!(v["gap_blocks"], json!(480));
    assert_eq!(v["tail_slack_blocks"], json!(980));
    assert_eq!(
        v["triangulation_signal"],
        json!("inter_leg_drift_spread_lt_min_positive_slack")
    );
    assert_eq!(v["tighter_slack_axis"], json!("indexer_checkpoint_gap"));
    assert_eq!(
        v["spread_to_min_positive_slack_ratio"],
        json!(10.0_f64 / 480.0_f64)
    );
}

#[test]
fn b398_drift_between_min_max() {
    // union_max=100 → gap=40 (checkpoint 140), tail=60 (event_log 160), spread=50 (legs 50/100).
    let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
        137,
        1,
        Some(100),
        1,
        Some(50),
        1,
        Some(75),
        Some(160),
        140,
    );
    assert_eq!(v["spread_blocks"], json!(50));
    assert_eq!(v["gap_blocks"], json!(40));
    assert_eq!(v["tail_slack_blocks"], json!(60));
    assert_eq!(
        v["triangulation_signal"],
        json!("inter_leg_drift_spread_between_min_max_positive_slack")
    );
    assert_eq!(v["tighter_slack_axis"], json!("indexer_checkpoint_gap"));
}

#[test]
fn b398_drift_gte_max() {
    // union_max=50 → gap=30 (checkpoint 80), tail=40 (event_log 90), spread=40 (legs 10/50/30).
    let v = revenue_pipeline_spread_dual_slack_triangulation_observability_v1(
        137,
        1,
        Some(10),
        1,
        Some(50),
        1,
        Some(30),
        Some(90),
        80,
    );
    assert_eq!(v["spread_blocks"], json!(40));
    assert_eq!(v["gap_blocks"], json!(30));
    assert_eq!(v["tail_slack_blocks"], json!(40));
    assert_eq!(
        v["triangulation_signal"],
        json!("inter_leg_drift_spread_gte_max_positive_slack")
    );
    assert_eq!(v["tighter_slack_axis"], json!("indexer_checkpoint_gap"));
    assert_eq!(
        v["spread_to_min_positive_slack_ratio"],
        json!(40.0_f64 / 30.0_f64)
    );
}
