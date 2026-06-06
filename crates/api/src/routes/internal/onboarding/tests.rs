use axum::http::HeaderMap;

use super::security::{
    hmac_hex, verify_onboarding_webhook_hmac, verify_onboarding_webhook_timestamp_optional,
};

#[test]
fn hmac_verify_accepts_round_trip_v1_hex() {
    let secret = "unit-secret";
    let body = br#"{"schema_version":1,"idempotency_key":"k","provider_event_id":"e","outcome":"succeeded"}"#;
    let hx = hmac_hex(secret, body).unwrap();
    let mut headers = HeaderMap::new();
    headers.insert(
        "X-Onboarding-Webhook-Signature",
        format!("v1={}", hx).parse().expect("header value"),
    );
    assert!(verify_onboarding_webhook_hmac(secret, body, &headers).is_ok());
}

#[test]
fn webhook_timestamp_optional_accepts_fresh() {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    let mut headers = HeaderMap::new();
    headers.insert(
        "X-Onboarding-Webhook-Timestamp",
        now.to_string().parse().expect("header"),
    );
    assert!(verify_onboarding_webhook_timestamp_optional(&headers, 600).is_ok());
}

#[test]
fn webhook_timestamp_optional_rejects_stale() {
    let old = 1_000_000_i64;
    let mut headers = HeaderMap::new();
    headers.insert(
        "X-Onboarding-Webhook-Timestamp",
        old.to_string().parse().expect("header"),
    );
    assert_eq!(
        verify_onboarding_webhook_timestamp_optional(&headers, 60),
        Err("timestamp_out_of_window")
    );
}
