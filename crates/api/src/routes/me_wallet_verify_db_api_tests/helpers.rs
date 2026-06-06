//! Shared router, crypto helpers, and DB cleanup for wallet-verify PG·IT.

use axum::Router;
use http_body_util::BodyExt;
use secp256k1::{Message as SecpMessage, PublicKey, Secp256k1, SecretKey};
use serde_json::{json, Value};
use sha3::Digest;
use sqlx::PgPool;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;

pub(super) fn app_stack_router(pool: PgPool) -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(chain_off)), idem, Some(pool))
}

pub(super) async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

pub(super) fn auth_bearer(token: &str) -> axum::http::HeaderValue {
    format!("Bearer {}", token).parse().expect("bearer header")
}

pub(super) async fn response_json(res: axum::response::Response) -> Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

pub(super) fn eip191_hash(message: &str) -> [u8; 32] {
    let prefix = format!("\x19Ethereum Signed Message:\n{}", message.len());
    let mut hasher = sha3::Keccak256::new();
    hasher.update(prefix.as_bytes());
    hasher.update(message.as_bytes());
    let out = hasher.finalize();
    let mut hash = [0u8; 32];
    hash.copy_from_slice(&out[..32]);
    hash
}

pub(super) fn wallet_address_from_secret(sk: &SecretKey) -> String {
    let secp = Secp256k1::new();
    let pk: PublicKey = sk.public_key(&secp);
    let ser = pk.serialize_uncompressed();
    let h = sha3::Keccak256::digest(&ser[1..]);
    format!("0x{}", hex::encode(&h[12..32]))
}

pub(super) fn sign_personal_message(sk: &SecretKey, message: &str) -> String {
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

pub(super) async fn cleanup_user(pool: &PgPool, user_id: Uuid) {
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
