use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::ChainOffStore;
use crate::db;
use crate::email_transport;

use super::env_guards::*;
use super::support::*;

#[tokio::test]
async fn admin_auth_audit_events_support_reason_filter_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: admin_auth_audit_events_support_reason_filter_pg (DATABASE_URL unset)");
        return;
    };
    let admin_id = Uuid::new_v4();
    let admin_email = format!("admin-auth-audit-{}@traveltrust.test", admin_id);
    let admin_token = format!("tts_admin_auth_audit_{}", Uuid::new_v4());
    cleanup_user_by_email(&pool, &admin_email).await;
    let now = chrono::Utc::now();
    db::insert_user(
        &pool,
        admin_id,
        &admin_email,
        None,
        "admin",
        "none",
        Some("admin_audit_reader"),
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert admin user");
    db::insert_session(&pool, &admin_token, admin_id)
        .await
        .expect("insert admin session");
    db::insert_auth_audit_event(
        &pool,
        "auth_login_failure",
        Some(admin_id),
        Some("it-admin-audit-reason-filter"),
        Some("127.0.0.1"),
        Some("it-agent"),
        Some("auth_login_per_email_rate_limited"),
        &json!({"status_code":429,"error":"auth_login_per_email_rate_limited"}),
    )
    .await
    .expect("insert auth audit event");
    db::insert_auth_audit_event(
        &pool,
        "auth_login_failure",
        Some(admin_id),
        Some("it-admin-audit-reason-other"),
        Some("127.0.0.1"),
        Some("it-agent"),
        Some("invalid_credentials"),
        &json!({"status_code":401,"error":"invalid_credentials"}),
    )
    .await
    .expect("insert auth audit event 2");
    db::insert_auth_audit_event(
        &pool,
        "auth_login_failure",
        Some(admin_id),
        Some("it-admin-audit-reason-ip"),
        Some("127.0.0.1"),
        Some("it-agent"),
        Some("auth_login_per_ip_rate_limited"),
        &json!({"status_code":429,"error":"auth_login_per_ip_rate_limited"}),
    )
    .await
    .expect("insert auth audit event 3");
    db::insert_auth_audit_event(
        &pool,
        "auth_login_failure",
        Some(admin_id),
        Some("it-admin-audit-reason-global"),
        Some("127.0.0.1"),
        Some("it-agent"),
        Some("auth_login_global_rate_limited"),
        &json!({"status_code":429,"error":"auth_login_global_rate_limited"}),
    )
    .await
    .expect("insert auth audit event 4");

    let mut seeded_store = ChainOffStore::default();
    seeded_store.users.insert(
        admin_id,
        crate::chain_off::UserRow {
            id: admin_id,
            email: admin_email.clone(),
            password_hash: None,
            role: "admin".to_string(),
            kyc_status: "none".to_string(),
            nickname: Some("admin_audit_reader".to_string()),
            avatar_url: None,
            default_wallet_address: None,
            bio: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    seeded_store.sessions.insert(admin_token.clone(), admin_id);
    let app = app_stack_router_with_store(pool.clone(), seeded_store);

    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/auth-audit-events?event_type=auth_login_failure&reason=auth_login_per_email_rate_limited&limit=20")
                .header(header::AUTHORIZATION, auth_bearer_value(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let status = res.status();
    let body = response_json(res).await;
    assert_eq!(status, StatusCode::OK, "{:?}", body);
    assert_eq!(
        body.pointer("/applied_filters/reason"),
        Some(&json!("auth_login_per_email_rate_limited"))
    );
    let items = body["items"].as_array().expect("items array");
    assert!(
        !items.is_empty(),
        "expected at least one auth audit event with filtered reason"
    );
    assert!(items.iter().all(|it| {
        it.get("reason")
            .and_then(|v| v.as_str())
            .map(|s| s == "auth_login_per_email_rate_limited")
            .unwrap_or(false)
    }));

    let res_ip = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/auth-audit-events?event_type=auth_login_failure&reason=auth_login_per_ip_rate_limited&limit=20")
                .header(header::AUTHORIZATION, auth_bearer_value(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let status_ip = res_ip.status();
    let body_ip = response_json(res_ip).await;
    assert_eq!(status_ip, StatusCode::OK, "{:?}", body_ip);
    assert_eq!(
        body_ip.pointer("/applied_filters/reason"),
        Some(&json!("auth_login_per_ip_rate_limited"))
    );
    let items_ip = body_ip["items"].as_array().expect("items array");
    assert!(
        !items_ip.is_empty(),
        "expected at least one auth audit event with ip-rate-limited reason"
    );
    assert!(items_ip.iter().all(|it| {
        it.get("reason")
            .and_then(|v| v.as_str())
            .map(|s| s == "auth_login_per_ip_rate_limited")
            .unwrap_or(false)
    }));

    let res_global = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/auth-audit-events?event_type=auth_login_failure&reason=auth_login_global_rate_limited&limit=20")
                .header(header::AUTHORIZATION, auth_bearer_value(&admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let status_global = res_global.status();
    let body_global = response_json(res_global).await;
    assert_eq!(status_global, StatusCode::OK, "{:?}", body_global);
    assert_eq!(
        body_global.pointer("/applied_filters/reason"),
        Some(&json!("auth_login_global_rate_limited"))
    );
    let items_global = body_global["items"].as_array().expect("items array");
    assert!(
        !items_global.is_empty(),
        "expected at least one auth audit event with global-rate-limited reason"
    );
    assert!(items_global.iter().all(|it| {
        it.get("reason")
            .and_then(|v| v.as_str())
            .map(|s| s == "auth_login_global_rate_limited")
            .unwrap_or(false)
    }));

    cleanup_user_by_email(&pool, &admin_email).await;
}

/// **A5 · ①**：非 **admin** 角色访问 **`GET …/admin/auth-audit-events`** → **403** **`admin_required`**。
#[tokio::test]
async fn matrix_93_admin_auth_audit_tourist_forbidden_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: admin auth-audit tourist forbidden (DATABASE_URL unset)");
        return;
    };    let _serial = auth_app_stack_it_lock().lock().await;
    let tourist_id = Uuid::new_v4();
    let tourist_email = format!("tourist-auth-audit-{}@traveltrust.test", tourist_id);
    let tourist_token = format!("tts_tourist_auth_audit_{}", Uuid::new_v4());
    cleanup_user_by_email(&pool, &tourist_email).await;
    let now = chrono::Utc::now();
    db::insert_user(
        &pool,
        tourist_id,
        &tourist_email,
        None,
        "tourist",
        "none",
        None,
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("insert tourist");
    db::insert_session(&pool, &tourist_token, tourist_id)
        .await
        .expect("insert tourist session");

    let mut store = ChainOffStore::default();
    store.users.insert(
        tourist_id,
        crate::chain_off::UserRow {
            id: tourist_id,
            email: tourist_email.clone(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            bio: None,
            email_verified_at: None,
            created_at: now,
            updated_at: now,
        },
    );
    store
        .sessions
        .insert(tourist_token.clone(), tourist_id);
    let app = app_stack_router_with_store(pool.clone(), store);

    let res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/admin/auth-audit-events?limit=5")
                .header(header::AUTHORIZATION, auth_bearer_value(&tourist_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::FORBIDDEN);
    let body = response_json(res).await;
    assert_eq!(body["error"].as_str(), Some("admin_required"));

    cleanup_user_by_email(&pool, &tourist_email).await;
}

/// **93 · A-REG-002** → **§8.2 · F-001**：**`POST /auth/register`**（**`TRAVELTRUST_AUTH_TOKEN_PEPPER`** 触发 **`email_verify`** 令牌）→ **`POST /auth/verify-email`** **200** → **`GET /me`** **`user.email_verified_at`** 非空（**`cfg(test)` raw 侧车**）。
#[tokio::test]
async fn matrix_93_a_reg_002_f001_post_verify_email_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_reg_002_f001_post_verify_email_ok_pg (DATABASE_URL unset)");
        return;
    };
    let _serial = crate::test_auth_mail_env_mutex::lock_auth_mail_env_tests();
    let _env = ForgotResetTestEnvGuard::set_log_transport_and_pepper();
    let _ = email_transport::test_take_email_verify_raw_for_it();

    let email = format!("93-a-reg-002-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "reg002"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let reg_j = response_json(reg).await;
    assert_eq!(
        reg_j.get("email_verification_token_issued"),
        Some(&json!(true)),
        "pepper must be set for email verify IT"
    );
    let token = reg_j
        .get("token")
        .and_then(|t| t.as_str())
        .expect("session token")
        .to_string();

    let raw =
        email_transport::test_take_email_verify_raw_for_it().expect("email_verify raw for IT");
    assert!(!raw.is_empty());

    let ver = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/verify-email")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "token": raw }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(ver.status(), StatusCode::OK);
    let ver_j = response_json(ver).await;
    assert_eq!(ver_j.get("message"), Some(&json!("email_verified")));

    let me = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, auth_bearer_value(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me.status(), StatusCode::OK);
    let mj = response_json(me).await;
    assert!(
        mj.pointer("/user/email_verified_at")
            .and_then(|v| v.as_str())
            .is_some_and(|s| !s.is_empty()),
        "user.email_verified_at after verify: {:?}",
        mj
    );

    cleanup_user_by_email(&pool, &email).await;
}

/// **93 · A-LOG-004** → **§8.2 · F-002**：**`POST /auth/refresh`** **`{ \"refresh_token\": \"<tts_…>\" }`** **200**，并轮换为新 token（旧 token 失效）。
#[tokio::test]
async fn matrix_93_a_log_004_f002_post_auth_refresh_rotates_token_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_93_a_log_004_f002_post_auth_refresh_rotates_token_ok_pg (DATABASE_URL unset)");
        return;
    };
    let email = format!("93-a-log-004-{}@traveltrust.test", Uuid::new_v4());
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
                        "nickname": "log004"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let reg_j = response_json(reg).await;
    let token = reg_j
        .get("token")
        .and_then(|t| t.as_str())
        .expect("token")
        .to_string();
    assert!(token.starts_with("tts_"));

    let refr = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/refresh")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({ "refresh_token": token.as_str() }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(refr.status(), StatusCode::OK);
    let rj = response_json(refr).await;
    let refreshed_token = rj
        .get("token")
        .and_then(|t| t.as_str())
        .expect("refreshed token");
    assert!(refreshed_token.starts_with("tts_"));
    assert_ne!(refreshed_token, token.as_str());
    assert_eq!(rj.get("status"), Some(&json!("ok")));

    cleanup_user_by_email(&pool, &email).await;
}
