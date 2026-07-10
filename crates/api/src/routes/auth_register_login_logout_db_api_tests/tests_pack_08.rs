use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db;

use super::env_guards::*;
use super::support::*;

#[tokio::test]
async fn auth_login_failure_audit_reason_matches_risk_error_keys_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: auth_login_failure_audit_reason_matches_risk_error_keys_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    clear_auth_email_send_windows_for_it(&pool).await;
    let _audit_queue = AuthAuditAsyncQueueEnvGuard::disable();
    let _per_email_disabled = LoginPerEmailRateLimitEnvGuard::set(0, 3600);
    let _risk_env = LoginRiskRateLimitEnvGuard::set(1, 3600, 1, 3600);
    let email = format!("audit-login-risk-fail-{}@traveltrust.test", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;
    let app = db_router(pool.clone());

    let reg = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!",
                        "nickname": "audit_login_risk_fail"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);

    // 占满 per-IP 桶（max=1）需先有一次同 **`X-Forwarded-For`** 的成功登录；否则首包无法形成 **`auth_login_per_ip_rate_limited`**。
    let warm_ip = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-forwarded-for", "198.51.100.55")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        warm_ip.status(),
        StatusCode::OK,
        "{:?}",
        response_json(warm_ip).await
    );

    let req_ip = format!("it-login-risk-ip-{}", Uuid::new_v4());
    let ip_limited = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-request-id", &req_ip)
                .header("x-forwarded-for", "198.51.100.55")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ip_limited.status(), StatusCode::TOO_MANY_REQUESTS);
    assert_eq!(
        ip_limited
            .headers()
            .get(header::RETRY_AFTER)
            .and_then(|h| h.to_str().ok()),
        Some("3600")
    );
    let ip_limited_j = response_json(ip_limited).await;
    assert_eq!(
        ip_limited_j.get("error"),
        Some(&json!("auth_login_per_ip_rate_limited"))
    );
    assert_eq!(ip_limited_j.get("retry_after_sec"), Some(&json!(3600)));
    assert_eq!(ip_limited_j.get("retry_after_seconds"), Some(&json!(3600)));

    let req_global = format!("it-login-risk-global-{}", Uuid::new_v4());
    let global_limited = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/login")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-request-id", &req_global)
                .header("x-forwarded-for", "203.0.113.66")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(global_limited.status(), StatusCode::TOO_MANY_REQUESTS);
    assert_eq!(
        global_limited
            .headers()
            .get(header::RETRY_AFTER)
            .and_then(|h| h.to_str().ok()),
        Some("3600")
    );
    let global_limited_j = response_json(global_limited).await;
    assert_eq!(
        global_limited_j.get("error"),
        Some(&json!("auth_login_global_rate_limited"))
    );
    assert_eq!(global_limited_j.get("retry_after_sec"), Some(&json!(3600)));
    assert_eq!(
        global_limited_j.get("retry_after_seconds"),
        Some(&json!(3600))
    );

    let failure_events = db::list_auth_audit_events(
        &pool,
        Some("auth_login_failure"),
        None,
        None,
        None,
        None,
        100,
    )
    .await
    .expect("list auth_login_failure events");
    let ip_ev = failure_events
        .iter()
        .find(|e| e.request_id.as_deref() == Some(req_ip.as_str()))
        .expect("auth_login_failure per_ip_rate_limited event");
    assert_eq!(
        ip_ev.reason.as_deref(),
        Some("auth_login_per_ip_rate_limited")
    );
    let global_ev = failure_events
        .iter()
        .find(|e| e.request_id.as_deref() == Some(req_global.as_str()))
        .expect("auth_login_failure global_rate_limited event");
    assert_eq!(
        global_ev.reason.as_deref(),
        Some("auth_login_global_rate_limited")
    );

    cleanup_user_by_email(&pool, &email).await;
}
#[tokio::test]
async fn auth_hot_table_retention_delete_helpers_remove_stale_rows_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: auth_hot_table_retention_delete_helpers_remove_stale_rows_pg (DATABASE_URL unset)");
        return;
    };
    let user_id = Uuid::new_v4();
    let email = format!("auth-hot-retention-{}@traveltrust.test", user_id);
    let token = format!("tts_hot_retention_{}", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;
    let now = chrono::Utc::now();
    db::insert_user(
        &pool, user_id, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert user");
    db::insert_session(&pool, &token, user_id)
        .await
        .expect("insert session");

    sqlx::query(
        r#"UPDATE sessions SET revoked_at = now() - interval '3 days', revoked_reason='test_retention' WHERE token = $1"#,
    )
    .bind(&token)
    .execute(&pool)
    .await
    .expect("age session");

    sqlx::query(
        r#"INSERT INTO auth_email_tokens (user_id, purpose, token_hash, expires_at, consumed_at, created_at)
           VALUES ($1, 'password_reset', $2, now() - interval '3 days', now() - interval '3 days', now() - interval '3 days')"#,
    )
    .bind(user_id)
    .bind(format!("stale_hash_{}", Uuid::new_v4()))
    .execute(&pool)
    .await
    .expect("insert stale auth_email_token");

    sqlx::query(
        r#"INSERT INTO wallet_verify_challenges (user_id, wallet_address, nonce, message, expires_at, consumed_at, verified_at, created_at)
           VALUES ($1, '0x1111111111111111111111111111111111111111', $2, 'retention-test', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days', now() - interval '3 days')"#,
    )
    .bind(user_id)
    .bind(format!("stale_nonce_{}", Uuid::new_v4()))
    .execute(&pool)
    .await
    .expect("insert stale wallet challenge");

    let deleted_sessions = db::delete_stale_sessions(&pool, 1)
        .await
        .expect("delete stale sessions");
    let deleted_tokens = db::delete_stale_auth_email_tokens(&pool, 1)
        .await
        .expect("delete stale auth_email_tokens");
    let deleted_wallet = db::delete_stale_wallet_verify_challenges(&pool, 1)
        .await
        .expect("delete stale wallet challenges");

    assert!(
        deleted_sessions >= 1,
        "expected stale session rows to be deleted"
    );
    assert!(
        deleted_tokens >= 1,
        "expected stale auth_email_tokens rows to be deleted"
    );
    assert!(
        deleted_wallet >= 1,
        "expected stale wallet_verify_challenges rows to be deleted"
    );

    cleanup_user_by_email(&pool, &email).await;
}
#[tokio::test]
async fn session_token_hash_backfill_updates_active_rows_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: session_token_hash_backfill_updates_active_rows_pg (DATABASE_URL unset)");
        return;
    };
    let prev_pepper = std::env::var("TRAVELTRUST_SESSION_TOKEN_PEPPER").ok();
    std::env::set_var(
        "TRAVELTRUST_SESSION_TOKEN_PEPPER",
        "it-session-token-pepper-backfill-32bytes!!",
    );

    let user_id = Uuid::new_v4();
    let email = format!("session-backfill-{}@traveltrust.test", user_id);
    let token = format!("tts_backfill_{}", Uuid::new_v4());
    cleanup_user_by_email(&pool, &email).await;
    let now = chrono::Utc::now();
    db::insert_user(
        &pool, user_id, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert user");
    db::insert_session(&pool, &token, user_id)
        .await
        .expect("insert session");

    sqlx::query("UPDATE sessions SET token_hash = NULL WHERE token = $1")
        .bind(&token)
        .execute(&pool)
        .await
        .expect("reset token_hash to null");

    let missing_before = db::count_active_sessions_missing_token_hash(&pool)
        .await
        .expect("count missing before");
    assert!(
        missing_before >= 1,
        "expected at least one missing token_hash"
    );

    let updated = db::backfill_active_sessions_token_hash(&pool, 100)
        .await
        .expect("backfill active sessions token_hash");
    assert!(updated >= 1, "expected at least one updated row");

    let token_hash: Option<String> = sqlx::query_scalar(
        "SELECT token_hash FROM sessions WHERE token = $1 AND revoked_at IS NULL",
    )
    .bind(&token)
    .fetch_optional(&pool)
    .await
    .expect("fetch session token_hash");
    assert!(
        token_hash
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .is_some(),
        "expected backfilled token_hash for test session"
    );

    cleanup_user_by_email(&pool, &email).await;
    restore_env_opt("TRAVELTRUST_SESSION_TOKEN_PEPPER", prev_pepper);
}
