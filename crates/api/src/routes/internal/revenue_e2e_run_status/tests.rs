use super::manifest::{
    find_b403_round, find_b405_round, order_phase_from_round, parse_b402_rollup_marker,
    parse_b403_manifest_json_values,
};
use serde_json::json;

#[test]
fn parse_rollup_marker_from_b402_tail() {
    let s = "b402: ok (B-383+B-386 reconcile == admin overview; bundle rollup.marker=incomparable)";
    assert_eq!(parse_b402_rollup_marker(s).as_deref(), Some("incomparable"));
}

#[test]
fn parse_rollup_marker_missing_returns_none() {
    assert!(parse_b402_rollup_marker("no marker here").is_none());
}

#[test]
fn parse_manifest_accepts_pretty_multiline_concatenated_json() {
    let raw = r#"{
  "kind": "b403_session_start",
  "session_id": "s"
}
{
  "kind": "b403_round",
  "run_id": "r1"
}"#;
    let v = parse_b403_manifest_json_values(raw);
    assert_eq!(v.len(), 2);
    assert_eq!(v[1].get("run_id").and_then(|x| x.as_str()), Some("r1"));
}

#[test]
fn parse_manifest_ndjson_one_line_per_record() {
    let raw = "{\"kind\":\"a\"}\n{\"kind\":\"b\",\"run_id\":\"u\"}\n";
    let v = parse_b403_manifest_json_values(raw);
    assert_eq!(v.len(), 2);
}

#[test]
fn find_b405_round_hits_before_b403_same_file_not_used() {
    let rid = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    let parsed = vec![
        json!({"kind":"b405_session_start","session_id":"s1"}),
        json!({"kind":"b405_round","run_id":rid,"order_id":"11111111-2222-3333-4444-555555555555"}),
    ];
    let r = find_b405_round(&parsed, rid).expect("b405");
    assert_eq!(
        r.get("order_id").and_then(|x| x.as_str()).unwrap().len(),
        36
    );
    assert!(find_b403_round(&parsed, rid).is_none());
}

#[test]
fn order_phase_prefers_after_b402() {
    let v = json!({
        "order_phase_after_b402": "post_b402",
        "order_phase_before_tick": "post_tick_pre_b402"
    });
    assert_eq!(order_phase_from_round(&v).as_deref(), Some("post_b402"));
}
