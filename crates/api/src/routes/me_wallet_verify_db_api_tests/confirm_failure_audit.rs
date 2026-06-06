//! Confirm failures map to auditable reasons.

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::Utc;
use secp256k1::SecretKey;
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db;

use super::helpers::{
    app_stack_router, auth_bearer, cleanup_user, pool_or_skip, response_json,
    sign_personal_message, wallet_address_from_secret,
};

#[tokio::test]
async fn wallet_verify_confirm_failure_reasons_are_auditable() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: wallet_verify_confirm_failure_reasons_are_auditable (DATABASE_URL unset)");
        return;
    };    let app = app_stack_router(pool.clone());
    let user_id = Uuid::new_v4();
    let token = format!("tts_wallet_verify_it_{}", Uuid::new_v4());
    let email = format!("wallet-verify-fail-{}@traveltrust.test", user_id);
    let now = Utc::now();
    cleanup_user(&pool, user_id).await;
    db::insert_user(
        &pool, user_id, &email, None, "tourist", "none", None, None, None, now, now,
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
