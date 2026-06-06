use base64::{engine::general_purpose::STANDARD, Engine as _};
use chrono::Utc;
use hmac::{Hmac, Mac};
use sha2::Sha256;
use std::time::Duration;

type HmacSha256 = Hmac<Sha256>;

pub(crate) fn decode_whsec(secret: &str) -> Result<Vec<u8>, &'static str> {
    let t = secret.trim();
    if !t.starts_with("whsec_") {
        return Err("webhook_secret must start with whsec_");
    }
    STANDARD
        .decode(t.trim_start_matches("whsec_"))
        .map_err(|_| "invalid whsec base64")
}

fn ct_eq_bytes(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    };    let mut acc = 0u8;
    for (x, y) in a.iter().zip(b.iter()) {
        acc |= x ^ y;
    }
    acc == 0
}

/// Verify **Stripe-Signature** per <https://stripe.com/docs/webhooks/signatures> (v1 + timestamp).
pub fn verify_stripe_signature(
    payload: &[u8],
    stripe_signature: &str,
    whsec: &[u8],
    tolerance: Duration,
) -> Result<(), &'static str> {
    let mut ts: Option<i64> = None;
    let mut v1_hex: Vec<&str> = Vec::new();
    for part in stripe_signature.split(',') {
        let p = part.trim();
        if let Some(rest) = p.strip_prefix("t=") {
            ts = rest.parse().ok();
        } else if let Some(rest) = p.strip_prefix("v1=") {
            v1_hex.push(rest);
        }
    };    let ts = ts.ok_or("missing_signature_timestamp")?;
    let now = Utc::now().timestamp();
    let tol = tolerance.as_secs() as i64;
    if (now - ts).abs() > tol {
        return Err("signature_timestamp_out_of_tolerance");
    };    let mut to_sign = Vec::with_capacity(24usize.saturating_add(payload.len()));
    to_sign.extend_from_slice(ts.to_string().as_bytes());
    to_sign.push(b'.');
    to_sign.extend_from_slice(payload);
    let mut mac = HmacSha256::new_from_slice(whsec).map_err(|_| "invalid_hmac_key_material")?;
    mac.update(&to_sign);
    let expected = mac.finalize().into_bytes();
    for hx in v1_hex {
        let Ok(decoded) = hex::decode(hx.as_bytes()) else {
            continue;
        };        if ct_eq_bytes(&expected, &decoded) {
            return Ok(());
        }
    }
    Err("stripe_signature_mismatch")
}

/// **`cfg(test)` / PG IT**：为 **raw webhook body** 生成 **`Stripe-Signature`**（**`t=…,v1=…`**），与 **`verify_stripe_signature`** 同源；**`whsec_prefixed`** 须 **`whsec_` + base64**（与 **`decode_whsec`** 一致）。
#[cfg(test)]
pub fn build_stripe_webhook_signature_header(
    body: &[u8],
    whsec_prefixed: &str,
) -> Result<String, &'static str> {
    let whsec_bytes = decode_whsec(whsec_prefixed)?;
    let ts = Utc::now().timestamp();
    let mut to_sign = Vec::with_capacity(24usize.saturating_add(body.len()));
    to_sign.extend_from_slice(ts.to_string().as_bytes());
    to_sign.push(b'.');
    to_sign.extend_from_slice(body);
    let mut mac =
        HmacSha256::new_from_slice(&whsec_bytes).map_err(|_| "invalid_hmac_key_material")?;
    mac.update(&to_sign);
    let hx = hex::encode(mac.finalize().into_bytes());
    Ok(format!("t={ts},v1={hx}"))
}
