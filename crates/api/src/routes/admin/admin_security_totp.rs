//! Admin TOTP 登记与会话（① 预备；`admin_2fa_policy.enforced` 为 true 时生效）。

use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Json;
use axum::Router;
use data_encoding::BASE32_NOPAD;
use hmac::{Hmac, Mac};
use serde::Deserialize;
use serde_json::json;
use sha1::Sha1;
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::admin_rbac::{self, PERM_READ};
use super::{
    admin_attach_meta_build, admin_db_pool_required, request_id_from_headers,
    write_admin_audit_log_best_effort,
};

type HmacSha1 = Hmac<Sha1>;

const SESSION_HEADER: &str = "x-traveltrust-admin-2fa-session";
const SESSION_TTL_SECS: i64 = 12 * 3600;

pub fn admin_2fa_skip_from_env() -> bool {
    std::env::var("TRAVELTRUST_ADMIN_2FA_SKIP")
        .ok()
        .map(|s| {
            let t = s.trim().to_ascii_lowercase();
            t == "1" || t == "true" || t == "yes"
        })
        .unwrap_or(false)
}

fn session_secret() -> String {
    std::env::var("TRAVELTRUST_ADMIN_2FA_SESSION_SECRET")
        .ok()
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| "traveltrust-admin-2fa-dev-session-secret".to_string())
}

pub fn mint_admin_2fa_session_token(user_id: Uuid) -> String {
    let exp = chrono::Utc::now().timestamp() + SESSION_TTL_SECS;
    let payload = format!("{user_id}:{exp}");
    let mut mac =
        HmacSha1::new_from_slice(session_secret().as_bytes()).expect("hmac key");
    mac.update(payload.as_bytes());
    let sig = mac.finalize().into_bytes();
    format!("{payload}:{}", hex::encode(sig))
}

pub fn verify_admin_2fa_session_token(user_id: Uuid, token: &str) -> bool {
    let parts: Vec<&str> = token.split(':').collect();
    if parts.len() != 3 {
        return false;
    }
    let Ok(uid) = Uuid::parse_str(parts[0]) else {
        return false;
    };
    if uid != user_id {
        return false;
    }
    let Ok(exp) = parts[1].parse::<i64>() else {
        return false;
    };
    if chrono::Utc::now().timestamp() > exp {
        return false;
    }
    let payload = format!("{}:{}", parts[0], parts[1]);
    let Ok(sig_bytes) = hex::decode(parts[2]) else {
        return false;
    };
    let mut mac =
        HmacSha1::new_from_slice(session_secret().as_bytes()).expect("hmac key");
    mac.update(payload.as_bytes());
    mac.verify_slice(&sig_bytes).is_ok()
}

fn generate_base32_secret() -> String {
    let raw: [u8; 20] = rand_bytes20();
    BASE32_NOPAD.encode(&raw)
}

fn rand_bytes20() -> [u8; 20] {
    use std::time::{SystemTime, UNIX_EPOCH};
    let t = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let mut out = [0u8; 20];
    let mut x = t as u64;
    for i in 0..20 {
        x ^= x.wrapping_mul(6364136223846793005).wrapping_add(1);
        out[i] = (x >> 33) as u8;
    }
    out
}

pub fn verify_totp_code(secret_base32: &str, code: &str, unix_time: i64) -> bool {
    let code = code.trim();
    if code.len() != 6 || !code.chars().all(|c| c.is_ascii_digit()) {
        return false;
    }
    let Ok(key) = BASE32_NOPAD.decode(secret_base32.trim().as_bytes()) else {
        return false;
    };
    let step = unix_time / 30;
    for delta in [-1i64, 0, 1] {
        let counter = (step + delta) as u64;
        let msg = counter.to_be_bytes();
        let mut mac = HmacSha1::new_from_slice(&key).expect("hmac key");
        mac.update(&msg);
        let hash = mac.finalize().into_bytes();
        let offset = (hash[19] & 0x0f) as usize;
        let binary = ((u32::from(hash[offset]) & 0x7f) << 24)
            | (u32::from(hash[offset + 1]) << 16)
            | (u32::from(hash[offset + 2]) << 8)
            | u32::from(hash[offset + 3]);
        let otp = binary % 1_000_000;
        if format!("{otp:06}") == code {
            return true;
        }
    }
    false
}

pub fn admin_2fa_session_valid(headers: &HeaderMap, user_id: Uuid) -> bool {
    if admin_2fa_skip_from_env() {
        return true;
    }
    let Some(hv) = headers.get(SESSION_HEADER) else {
        return false;
    };
    let Ok(token) = hv.to_str() else {
        return false;
    };
    verify_admin_2fa_session_token(user_id, token)
}

pub async fn admin_totp_enrollment_verified(
    state: &ApiMetaState,
    user_id: Uuid,
) -> bool {
    let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) else {
        return false;
    };
    if !db::admin_totp_table_exists(pool).await {
        return false;
    }
    match db::get_admin_totp_enrollment(pool, user_id).await {
        Ok(Some(row)) => row.verified_at.is_some(),
        _ => false,
    }
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/admin/security/totp/status",
            get(get_admin_totp_status),
        )
        .route(
            "/api/v1/admin/security/totp/enroll",
            post(post_admin_totp_enroll),
        )
        .route(
            "/api/v1/admin/security/totp/verify",
            post(post_admin_totp_verify),
        )
}

pub async fn get_admin_totp_status(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (uid, _) = match admin_rbac::require_admin_permission(&state, &headers, PERM_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let row = db::get_admin_totp_enrollment(pool, uid).await.ok().flatten();
    let mut body = json!({
        "status": "ok",
        "enrolled": row.is_some(),
        "verified": row.as_ref().and_then(|r| r.verified_at).is_some(),
        "session_valid": admin_2fa_session_valid(&headers, uid),
        "totp_wired": true,
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn post_admin_totp_enroll(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (uid, _) = match admin_rbac::require_admin_permission(&state, &headers, PERM_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    if !db::admin_totp_table_exists(pool).await {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(crate::api_json::err_key("admin_totp_table_missing")),
        )
            .into_response();
    }
    let secret = generate_base32_secret();
    if let Err(_) = db::upsert_admin_totp_enrollment_pending(pool, uid, &secret).await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key("admin_totp_enroll_failed")),
        )
            .into_response();
    }
    let request_id = request_id_from_headers(&headers);
    write_admin_audit_log_best_effort(
        &state,
        uid,
        request_id.as_deref(),
        "admin.totp.enroll",
        Some("admin_totp_enrollments"),
        Some(uid.to_string().as_str()),
        json!({ "re_enrolled": true }),
    )
    .await;
    let mut body = json!({
        "status": "ok",
        "secret_base32": secret,
        "otpauth_uri": format!("otpauth://totp/TravelTrust:admin?secret={secret}&issuer=TravelTrust"),
        "implementation_note": "scan_then_post_verify_with_6_digit_code",
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

#[derive(Debug, Deserialize)]
pub struct TotpVerifyBody {
    pub code: String,
}

pub async fn post_admin_totp_verify(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<TotpVerifyBody>,
) -> impl IntoResponse {
    let (uid, _) = match admin_rbac::require_admin_permission(&state, &headers, PERM_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let Some(row) = db::get_admin_totp_enrollment(pool, uid).await.ok().flatten() else {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("admin_totp_not_enrolled")),
        )
            .into_response();
    };
    if !verify_totp_code(&row.secret_base32, &body.code, chrono::Utc::now().timestamp()) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("admin_totp_invalid_code")),
        )
            .into_response();
    }
    if let Err(_) = db::mark_admin_totp_verified(pool, uid).await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key("admin_totp_verify_failed")),
        )
            .into_response();
    }
    let session = mint_admin_2fa_session_token(uid);
    let mut resp = json!({
        "status": "ok",
        "verified": true,
        "session_token": session,
        "session_header": SESSION_HEADER,
        "session_ttl_secs": SESSION_TTL_SECS,
    });
    admin_attach_meta_build(&mut resp);
    Json(resp).into_response()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn session_token_roundtrip() {
        let uid = Uuid::from_u128(42);
        let token = mint_admin_2fa_session_token(uid);
        assert!(verify_admin_2fa_session_token(uid, &token));
        assert!(!verify_admin_2fa_session_token(uid, "bad:token:here"));
    }
}
