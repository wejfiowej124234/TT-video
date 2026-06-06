use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;

use super::env_guards::*;
use super::support::*;

#[tokio::test]
async fn auth_audit_fail_open_forced_insert_fail_keeps_invalid_bearer_401() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: auth_audit_fail_open_forced_insert_fail_keeps_invalid_bearer_401 (DATABASE_URL unset)"
        );
        return;
    };    let _serial = AUTH_AUDIT_IT_MUTEX.lock().expect("auth_audit_it serial");
    let _env = AuthAuditFailClosedTestEnvGuard::set(false);
    let app = db_router(pool.clone());
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(
                    header::AUTHORIZATION,
                    auth_bearer_value("tts_invalid_forced_audit_fail"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    let j = response_json(res).await;
    assert_eq!(j.get("error"), Some(&json!("login_required")));
}
