//! GET verification-status when wallet not yet verified.

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::Utc;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db;

use super::helpers::{app_stack_router, auth_bearer, cleanup_user, pool_or_skip, response_json};

#[tokio::test]
async fn wallet_verification_status_unverified_includes_observability_fields() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: wallet_verification_status_unverified_includes_observability_fields (DATABASE_URL unset)"
        );
        return;
    };    let app = app_stack_router(pool.clone());
    let user_id = Uuid::new_v4();
    let token = format!("tts_wallet_verify_it_{}", Uuid::new_v4());
    let email = format!("wallet-verify-unverified-{}@traveltrust.test", user_id);
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
