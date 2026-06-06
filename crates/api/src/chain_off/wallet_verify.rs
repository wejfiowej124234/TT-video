//! Wallet verify challenge / confirm / status（PG 或 chain_off 内存；① 本地可验）

use axum::http::{HeaderMap, StatusCode};
use axum::Json;
use chrono::{Duration, Utc};
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::db;
use crate::wallet_verify_crypto::{normalize_wallet_address, parse_eth_signature_hex, recover_wallet_from_personal_sign};

use super::ChainOffState;

#[derive(Debug, Clone)]
pub struct WalletVerifyMemChallenge {
    pub id: Uuid,
    pub user_id: Uuid,
    pub wallet_address: String,
    pub message: String,
    pub expires_at: chrono::DateTime<Utc>,
    pub consumed: bool,
    pub verified_at: Option<chrono::DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct WalletVerifyChallengeBody {
    pub wallet_address: String,
}

#[derive(Debug, Deserialize)]
pub struct WalletVerifyConfirmBody {
    pub challenge_id: String,
    pub signature: String,
}

fn verification_ttl_seconds() -> i64 {
    std::env::var("WALLET_VERIFICATION_TTL_SECONDS")
        .ok()
        .and_then(|s| s.parse().ok())
        .filter(|&n| n > 0)
        .unwrap_or(86_400)
}

fn challenge_ttl_seconds() -> i64 {
    std::env::var("WALLET_VERIFY_CHALLENGE_TTL_SECONDS")
        .ok()
        .and_then(|s| s.parse().ok())
        .filter(|&n| n > 0)
        .unwrap_or(600)
}

fn build_challenge_message(wallet: &str, nonce: &Uuid, expires_at: chrono::DateTime<Utc>) -> String {
    format!(
        "TravelTrust Wallet Verification\n\nWallet: {wallet}\nNonce: {nonce}\nExpires: {}",
        expires_at.to_rfc3339()
    )
}

fn request_id_from_headers(headers: &HeaderMap) -> Option<String> {
    headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
}

async fn audit_wallet_event(
    pool: &sqlx::PgPool,
    event_type: &str,
    user_id: Uuid,
    headers: &HeaderMap,
    reason: Option<&str>,
    payload: &Value,
) {
    let _ = db::insert_auth_audit_event(
        pool,
        event_type,
        Some(user_id),
        request_id_from_headers(headers).as_deref(),
        None,
        headers.get("user-agent").and_then(|v| v.to_str().ok()),
        reason,
        payload,
    )
    .await;
}

pub async fn wallet_verify_challenge_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<WalletVerifyChallengeBody>,
    _headers: HeaderMap,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let wallet = normalize_wallet_address(&body.wallet_address).ok_or((
        StatusCode::BAD_REQUEST,
        Json(crate::api_json::err_key("invalid_wallet_address")),
    ))?;
    let nonce = Uuid::new_v4();
    let expires_at = Utc::now() + Duration::seconds(challenge_ttl_seconds());
    let message = build_challenge_message(&wallet, &nonce, expires_at);

    if let Some(ref pool) = state.db_pool {
        let id = db::insert_wallet_verify_challenge(pool, user_id, &wallet, &nonce.to_string(), &message, expires_at)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key("db_error")),
                )
            })?;
        return Ok(Json(json!({
            "status": "ok",
            "challenge_id": id.to_string(),
            "message": message,
            "expires_at": expires_at.to_rfc3339()
        })));
    };    let id = Uuid::new_v4();
    let mut store = state.store.write().await;
    let message_for_json = message.clone();
    store.wallet_verify_challenges.insert(
        id,
        WalletVerifyMemChallenge {
            id,
            user_id,
            wallet_address: wallet,
            message,
            expires_at,
            consumed: false,
            verified_at: None,
        },
    );
    Ok(Json(json!({
        "status": "ok",
        "challenge_id": id.to_string(),
        "message": message_for_json,
        "expires_at": expires_at.to_rfc3339()
    })))
}

pub async fn wallet_verify_confirm_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<WalletVerifyConfirmBody>,
    headers: HeaderMap,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let challenge_id = Uuid::parse_str(body.challenge_id.trim()).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_challenge_id")),
        )
    })?;

    let sig_bytes = match parse_eth_signature_hex(&body.signature) {
        Ok(b) => b,
        Err(code) => {
            if let Some(ref pool) = state.db_pool {
                audit_wallet_event(
                    pool,
                    "wallet_verify_confirm_failure",
                    user_id,
                    &headers,
                    Some(code),
                    &json!({ "challenge_id": challenge_id.to_string() }),
                )
                .await;
            }
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key(code)),
            ));
        }
    };
    if let Some(ref pool) = state.db_pool {
        let row = db::find_valid_wallet_verify_challenge(pool, challenge_id, user_id)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key("db_error")),
                )
            })?
            .ok_or((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_or_expired_wallet_challenge")),
            ))?;

        let recovered = match recover_wallet_from_personal_sign(&row.message, &sig_bytes) {
            Ok(a) => a,
            Err(code) => {
                let status = if code == "wallet_signature_mismatch" {
                    StatusCode::UNAUTHORIZED
                } else {
                    StatusCode::BAD_REQUEST
                }
                audit_wallet_event(
                    pool,
                    "wallet_verify_confirm_failure",
                    user_id,
                    &headers,
                    Some(code),
                    &json!({ "challenge_id": challenge_id.to_string() }),
                )
                .await;
                return Err((status, Json(crate::api_json::err_key(code))));
            }
        };        if recovered.to_lowercase() != row.wallet_address.to_lowercase() {
            audit_wallet_event(
                pool,
                "wallet_verify_confirm_failure",
                user_id,
                &headers,
                Some("wallet_signature_mismatch"),
                &json!({ "challenge_id": challenge_id.to_string() }),
            )
            .await;
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(crate::api_json::err_key("wallet_signature_mismatch")),
            ));
        };        let n = db::consume_wallet_verify_challenge_success(pool, challenge_id)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key("db_error")),
                )
            })?;
        if n == 0 {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_or_expired_wallet_challenge")),
            ));
        }
        audit_wallet_event(
            pool,
            "wallet_verify_confirm_success",
            user_id,
            &headers,
            None,
            &json!({ "wallet_address": row.wallet_address }),
        )
        .await;
        return Ok(Json(json!({
            "status": "ok",
            "verified": true,
            "wallet_address": row.wallet_address
        })));
    }

  // chain_off memory
    let mut store = state.store.write().await;
    let row = store
        .wallet_verify_challenges
        .get(&challenge_id)
        .cloned()
        .filter(|c| c.user_id == user_id && !c.consumed && c.expires_at > Utc::now())
        .ok_or((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_or_expired_wallet_challenge")),
        ))?;

    let recovered = match recover_wallet_from_personal_sign(&row.message, &sig_bytes) {
        Ok(a) => a,
        Err(code) => {
            let status = if code == "wallet_signature_mismatch" {
                StatusCode::UNAUTHORIZED
            } else {
                StatusCode::BAD_REQUEST
            }
            return Err((status, Json(crate::api_json::err_key(code))));
        }
    };    if recovered.to_lowercase() != row.wallet_address.to_lowercase() {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(crate::api_json::err_key("wallet_signature_mismatch")),
        ));
    };    if let Some(c) = store.wallet_verify_challenges.get_mut(&challenge_id) {
        c.consumed = true;
        c.verified_at = Some(Utc::now());
    }
    Ok(Json(json!({
        "status": "ok",
        "verified": true,
        "wallet_address": row.wallet_address
    })))
}

/// Steward / guide submit gates: wallet must be EIP-191 verified for the submitted address (TTL applies).
pub async fn assert_wallet_verified_for_address(
    state: ChainOffState,
    user_id: Uuid,
    expected_wallet: &str,
) -> Result<(), (StatusCode, Json<Value>)> {
    let expected = normalize_wallet_address(expected_wallet).ok_or((
        StatusCode::BAD_REQUEST,
        Json(crate::api_json::err_key("invalid_wallet_address")),
    ))?;
    let Json(body) = wallet_verification_status_impl(state, user_id).await?;
    let verified = body.get("verified").and_then(|v| v.as_bool()) == Some(true);
    let addr = body
        .get("wallet_address")
        .and_then(|v| v.as_str())
        .map(|s| s.to_ascii_lowercase());
    if verified && addr.as_deref() == Some(expected.as_str()) {
        return Ok(());
    }
    Err((
        StatusCode::FORBIDDEN,
        Json(json!({
            "error": "wallet_verify_required",
            "message": "wallet_verify_required"
        })),
    ))
}

pub async fn wallet_verification_status_impl(
    state: ChainOffState,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let ttl = verification_ttl_seconds();
    let checked_at = Utc::now();
    let method = "eip191_personal_sign";

    if let Some(ref pool) = state.db_pool {
        if let Some(row) = db::get_latest_verified_wallet_for_user(pool, user_id)
            .await
            .map_err(|_| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key("db_error")),
                )
            })?
        {
            let age = (checked_at - row.verified_at).num_seconds().max(0);
            if age <= ttl {
                return Ok(Json(json!({
                    "status": "ok",
                    "verified": true,
                    "verification_method": method,
                    "wallet_address": row.wallet_address,
                    "checked_at": checked_at.to_rfc3339(),
                    "verification_ttl_seconds": ttl,
                    "verification_age_seconds": age
                })));
            }
        }
        return Ok(Json(json!({
            "status": "ok",
            "verified": false,
            "verification_method": method,
            "checked_at": checked_at.to_rfc3339(),
            "verification_ttl_seconds": ttl
        })));
    };    let store = state.store.read().await;
    let latest = store
        .wallet_verify_challenges
        .values()
        .filter(|c| c.user_id == user_id && c.verified_at.is_some())
        .max_by_key(|c| c.verified_at);
    if let Some(c) = latest {
        if let Some(vt) = c.verified_at {
            let age = (checked_at - vt).num_seconds().max(0);
            if age <= ttl {
                return Ok(Json(json!({
                    "status": "ok",
                    "verified": true,
                    "verification_method": method,
                    "wallet_address": c.wallet_address,
                    "checked_at": checked_at.to_rfc3339(),
                    "verification_ttl_seconds": ttl,
                    "verification_age_seconds": age
                })));
            }
        }
    }
    Ok(Json(json!({
        "status": "ok",
        "verified": false,
        "verification_method": method,
        "checked_at": checked_at.to_rfc3339(),
        "verification_ttl_seconds": ttl
    })))
}
