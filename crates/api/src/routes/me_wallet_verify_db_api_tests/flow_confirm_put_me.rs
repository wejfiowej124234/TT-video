//! Happy path: challenge → confirm → replay 400 → PUT /me → verification-status.

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db;

use super::helpers::{
    app_stack_router, auth_bearer, cleanup_user, pool_or_skip, response_json,
    sign_personal_message, wallet_address_from_secret,
};

#[tokio::test]
async fn wallet_verify_flow_challenge_confirm_replay_rejected_and_put_me_allowed() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: wallet_verify_flow_challenge_confirm_replay_rejected_and_put_me_allowed (DATABASE_URL unset)"
        );
        return;
    };    let app = app_stack_router(pool.clone());
    let user_id = Uuid::new_v4();
    let token = format!("tts_wallet_verify_it_{}", Uuid::new_v4());
    let email = format!("wallet-verify-{}@traveltrust.test", user_id);
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

    let sk_bytes = [7u8; 32];
    let sk = secp256k1::SecretKey::from_slice(&sk_bytes).expect("secret key");
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
