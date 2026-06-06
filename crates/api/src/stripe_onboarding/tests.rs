use base64::engine::general_purpose::STANDARD;
use base64::Engine as _;
use chrono::Utc;
use hmac::{Hmac, Mac};
use serde_json::json;
use sha2::Sha256;
use std::time::Duration;

use super::ensure::{
    payment_intent_id_from_session_json, payment_intent_id_from_stripe_expandable,
    stripe_latest_charge_id_from_pi_json,
};
use super::signature::{build_stripe_webhook_signature_header, verify_stripe_signature};

type HmacSha256 = Hmac<Sha256>;

#[test]
fn build_stripe_webhook_signature_header_verify_roundtrip() {
    let key32 = [3u8; 32];
    let whsec_val = format!("whsec_{}", STANDARD.encode(key32));
    let body = br#"{"id":"evt_x"}"#;
    let sig = build_stripe_webhook_signature_header(body, &whsec_val).unwrap();
    let decoded = STANDARD
        .decode(whsec_val.trim_start_matches("whsec_"))
        .expect("decode whsec payload");
    verify_stripe_signature(body, &sig, &decoded, Duration::from_secs(300)).unwrap();
}

#[test]
fn stripe_latest_charge_id_from_pi_json_string_or_object() {
    let s = json!({"latest_charge": "ch_s"});
    assert_eq!(
        stripe_latest_charge_id_from_pi_json(&s).as_deref(),
        Some("ch_s")
    );
    let o = json!({"latest_charge": {"id": "ch_o"}});
    assert_eq!(
        stripe_latest_charge_id_from_pi_json(&o).as_deref(),
        Some("ch_o")
    );
}

#[test]
fn stripe_expandable_payment_intent_from_dispute_shape() {
    let d = json!({"charge": "ch_x", "payment_intent": "pi_from_dispute"});
    assert_eq!(
        payment_intent_id_from_stripe_expandable(&d).as_deref(),
        Some("pi_from_dispute")
    );
}

#[test]
fn payment_intent_id_from_session_json_string_or_object() {
    let s = json!({"payment_intent": "pi_str"});
    assert_eq!(
        payment_intent_id_from_session_json(&s).as_deref(),
        Some("pi_str")
    );
    let o = json!({"payment_intent": {"id": "pi_obj"}});
    assert_eq!(
        payment_intent_id_from_session_json(&o).as_deref(),
        Some("pi_obj")
    );
}

#[test]
fn verify_stripe_signature_roundtrip() {
    let whsec = b"unit_test_hmac_material";
    let body = br#"{"id":"evt_test"}"#;
    let ts = Utc::now().timestamp();
    let mut to_sign = Vec::new();
    to_sign.extend_from_slice(ts.to_string().as_bytes());
    to_sign.push(b'.');
    to_sign.extend_from_slice(body);
    let mut mac = HmacSha256::new_from_slice(whsec).unwrap();
    mac.update(&to_sign);
    let hx = hex::encode(mac.finalize().into_bytes());
    let sig = format!("t={ts},v1={hx}");
    assert!(verify_stripe_signature(body, &sig, whsec, Duration::from_secs(300)).is_ok());
}
