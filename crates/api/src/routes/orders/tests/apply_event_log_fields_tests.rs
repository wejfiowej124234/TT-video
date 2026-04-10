use super::super::apply_chain_sync_event_log_fields;
use serde_json::json;

#[test]
fn prefers_snapshot_and_omits_absent_reason() {
    let mut m = serde_json::Map::new();
    apply_chain_sync_event_log_fields(
        &mut m,
        Some(json!({"finality_n_used": 12})),
        Some("no_row"),
    );
    assert!(m.contains_key("event_log_snapshot"));
    assert!(!m.contains_key("event_log_snapshot_absent_reason"));
}

#[test]
fn writes_absent_reason_when_no_snapshot() {
    let mut m = serde_json::Map::new();
    apply_chain_sync_event_log_fields(&mut m, None, Some("read_failed"));
    assert_eq!(
        m.get("event_log_snapshot_absent_reason"),
        Some(&json!("read_failed"))
    );
    assert!(!m.contains_key("event_log_snapshot"));
}
