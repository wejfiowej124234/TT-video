//! Wallet verify API DB tests: challenge -> confirm -> put_me gate.

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use chrono::Utc;
use http_body_util::BodyExt;
use secp256k1::{Message as SecpMessage, PublicKey, Secp256k1, SecretKey};
use serde_json::{json, Value};
use sha3::Digest;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::RwLock;
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::db;
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;

fn app_stack_router(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

fn auth_bearer(token: &str) -> axum::http::HeaderValue {
    format!("Bearer {}", token).parse().expect("bearer header")
}

async fn response_json(res: axum::response::Response) -> Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

fn eip191_hash(message: &str) -> [u8; 32] {
    let prefix = format!("\x19Ethereum Signed Message:\n{}", message.len());
    let mut hasher = sha3::Keccak256::new();
    hasher.update(prefix.as_bytes());
    hasher.update(message.as_bytes());
    let out = hasher.finalize();
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&out[..32]);
    hash
}

fn wallet_address_from_secret(sk: &SecretKey) -> String {
    let secp = Secp256k1::new();
    let pk: PublicKey = sk.public_key(&secp);
    let ser = pk.serialize_uncompressed();
    let h = sha3::Keccak256::digest(&ser[1..]);
    format!("0x{}", hex::encode(&h[12..32]))
}

fn sign_personal_message(sk: &SecretKey, message: &str) -> String {
    let secp = Secp256k1::new();
    let hash = eip191_hash(message);
    let msg = SecpMessage::from_digest_slice(&hash).expect("hash->message");
    let sig = secp.sign_ecdsa_recoverable(&msg, sk);
    let (rid, compact) = sig.serialize_compact();
    let v = (rid.to_i32() as u8) + 27;
    let mut out = [0u8; 65];
    out[..64].copy_from_slice(&compact);
    out[64] = v;
    format!("0x{}", hex::encode(out))
}

async fn cleanup_user(pool: &PgPool, user_id: Uuid) {
    let _ = sqlx::query("DELETE FROM wallet_verify_challenges WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM auth_audit_events WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
}

#[tokio::test]
async fn wallet_verify_flow_challenge_confirm_replay_rejected_and_put_me_allowed() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: wallet_verify_flow_challenge_confirm_replay_rejected_and_put_me_allowed (DATABASE_URL unset)"
        );
        return;
    };
    let app = app_stack_router(pool.clone());
    let user_id = Uuid::new_v4();
    let token = format!("tts_wallet_verify_it_{}", Uuid::new_v4());
    let email = format!("wallet-verify-{}@traveltrust.test", user_id);
    let now = Utc::now();
    cleanup_user(&pool, user_id).await;
    db::insert_user(
        &pool, user_id, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert user");
    db::insert_session(&pool, &token, user_id)
        .await
        .expect("insert session");

    let sk_bytes = [7u8; 32];
    let sk = SecretKey::from_slice(&sk_bytes).expect("secret key");
    let wallet = wallet_address_from_secret(&sk);

    let challenge_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/wallet/verify/challenge")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "wallet_address": wallet }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(challenge_res.status(), StatusCode::OK);
    let cj = response_json(challenge_res).await;
    let challenge_id = cj["challenge_id"].as_str().expect("challenge_id");
    let message = cj["message"].as_str().expect("message");
    let signature = sign_personal_message(&sk, message);

    let confirm_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/wallet/verify/confirm")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"challenge_id": challenge_id, "signature": signature}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(confirm_res.status(), StatusCode::OK);

    let replay_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/wallet/verify/confirm")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({"challenge_id": challenge_id, "signature": signature}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(replay_res.status(), StatusCode::BAD_REQUEST);
    let rj = response_json(replay_res).await;
    assert_eq!(rj["error"], "invalid_or_expired_wallet_challenge");

    let put_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PUT)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "default_wallet_address": wallet }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        put_res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(put_res).await
    );

    let status_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/wallet/verification-status")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(status_res.status(), StatusCode::OK);
    let sj = response_json(status_res).await;
    assert_eq!(sj["verified"], true);
    assert_eq!(
        sj["wallet_address"].as_str().unwrap().to_ascii_lowercase(),
        wallet.to_ascii_lowercase()
    );
    assert_eq!(sj["verification_method"], "eip191_personal_sign");
    assert!(sj["checked_at"].as_str().is_some());
    assert!(sj["verification_ttl_seconds"].as_i64().unwrap_or_default() > 0);
    assert!(sj["verification_age_seconds"].as_i64().unwrap_or_default() >= 0);

    let events = db::list_auth_audit_events(
        &pool,
        Some("wallet_verify_confirm_success"),
        Some(user_id),
        None,
        None,
        None,
        10,
    )
    .await
    .expect("list auth_audit_events");
    assert!(
        !events.is_empty(),
        "expected wallet_verify_confirm_success audit event"
    );
    cleanup_user(&pool, user_id).await;
}

#[tokio::test]
async fn wallet_verification_status_unverified_includes_observability_fields() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: wallet_verification_status_unverified_includes_observability_fields (DATABASE_URL unset)"
        );
        return;
    };
    let app = app_stack_router(pool.clone());
    let user_id = Uuid::new_v4();
    let token = format!("tts_wallet_verify_it_{}", Uuid::new_v4());
    let email = format!("wallet-verify-unverified-{}@traveltrust.test", user_id);
    let now = Utc::now();
    cleanup_user(&pool, user_id).await;
    db::insert_user(
        &pool, user_id, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert user");
    db::insert_session(&pool, &token, user_id)
        .await
        .expect("insert session");

    let status_res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/wallet/verification-status")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(status_res.status(), StatusCode::OK);
    let sj = response_json(status_res).await;
    assert_eq!(sj["verified"], false);
    assert_eq!(sj["verification_method"], "eip191_personal_sign");
    assert!(sj["checked_at"].as_str().is_some());
    assert!(sj["verification_ttl_seconds"].as_i64().unwrap_or_default() > 0);
    assert!(sj.get("verification_age_seconds").is_none());
    cleanup_user(&pool, user_id).await;
}

#[tokio::test]
async fn wallet_verify_confirm_failure_reasons_are_auditable() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: wallet_verify_confirm_failure_reasons_are_auditable (DATABASE_URL unset)");
        return;
    };
    let app = app_stack_router(pool.clone());
    let user_id = Uuid::new_v4();
    let token = format!("tts_wallet_verify_it_{}", Uuid::new_v4());
    let email = format!("wallet-verify-fail-{}@traveltrust.test", user_id);
    let now = Utc::now();
    cleanup_user(&pool, user_id).await;
    db::insert_user(
        &pool, user_id, &email, None, "tourist", "none", None, None, None, None, now, now,
    )
    .await
    .expect("insert user");
    db::insert_session(&pool, &token, user_id)
        .await
        .expect("insert session");

    let sk = SecretKey::from_slice(&[8u8; 32]).expect("secret key");
    let wallet = wallet_address_from_secret(&sk);
    let challenge_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/wallet/verify/challenge")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "wallet_address": wallet }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(challenge_res.status(), StatusCode::OK);
    let cj = response_json(challenge_res).await;
    let challenge_id = cj["challenge_id"]
        .as_str()
        .expect("challenge_id")
        .to_string();
    let message = cj["message"].as_str().expect("message").to_string();

    let req_invalid_sig = format!("it-wallet-invalid-sig-{}", Uuid::new_v4());
    let invalid_sig = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/wallet/verify/confirm")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-request-id", &req_invalid_sig)
                .body(Body::from(
                    json!({"challenge_id": challenge_id, "signature": "0x1234"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(invalid_sig.status(), StatusCode::BAD_REQUEST);
    let invalid_j = response_json(invalid_sig).await;
    assert_eq!(
        invalid_j.get("error"),
        Some(&json!("invalid_signature_length"))
    );

    let attacker_sk = SecretKey::from_slice(&[9u8; 32]).expect("attacker secret key");
    let mismatch_sig = sign_personal_message(&attacker_sk, &message);
    let req_mismatch = format!("it-wallet-mismatch-{}", Uuid::new_v4());
    let mismatch_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/wallet/verify/confirm")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-request-id", &req_mismatch)
                .body(Body::from(
                    json!({"challenge_id": challenge_id, "signature": mismatch_sig}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(mismatch_res.status(), StatusCode::UNAUTHORIZED);
    let mismatch_j = response_json(mismatch_res).await;
    assert_eq!(
        mismatch_j.get("error"),
        Some(&json!("wallet_signature_mismatch"))
    );

    let events = db::list_auth_audit_events(
        &pool,
        Some("wallet_verify_confirm_failure"),
        Some(user_id),
        None,
        None,
        None,
        50,
    )
    .await
    .expect("list wallet_verify_confirm_failure audit events");
    let invalid_ev = events
        .iter()
        .find(|e| e.request_id.as_deref() == Some(req_invalid_sig.as_str()))
        .expect("invalid signature failure audit event");
    assert_eq!(
        invalid_ev.reason.as_deref(),
        Some("invalid_signature_length")
    );
    let mismatch_ev = events
        .iter()
        .find(|e| e.request_id.as_deref() == Some(req_mismatch.as_str()))
        .expect("wallet mismatch failure audit event");
    assert_eq!(
        mismatch_ev.reason.as_deref(),
        Some("wallet_signature_mismatch")
    );

    cleanup_user(&pool, user_id).await;
}
