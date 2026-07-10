use std::sync::Arc;

use axum::body::Body;
use axum::http::{header, HeaderValue, Method, Request, StatusCode};
use chrono::Utc;
use http_body_util::BodyExt;
use tokio::sync::RwLock;
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::db::{insert_session, insert_user};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;

use super::helpers::*;

/// **93 · D-ADM-003** → **§8.2 · F-030**：**`GET /api/v1/admin/cross-check`** **`200`**（**`router::app`**；**Admin Bearer** + **`sessions`**；**只读对拍体**）。
#[tokio::test]
async fn matrix_93_d_adm_004d_f030_get_admin_cross_check_ok_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_adm_004d_f030_get_admin_cross_check_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let admin = admin_user_row();
    let admin_id = admin.id;
    let now = Utc::now();
    let email = admin.email.clone();

    cleanup_admin_it_user(&pool, admin_id).await;

    insert_user(
        &pool, admin_id, &email, None, "admin", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user admin cross-check");
    let session_token = format!("admin_it_sess_cross_{}", Uuid::new_v4());
    insert_session(&pool, &session_token, admin_id)
        .await
        .expect("insert_session admin cross-check");

    let auth = format!("Bearer {}", session_token);
    let meta = meta_admin_with_db_pool(pool.clone(), admin, &session_token);
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(meta, idem, Some(pool.clone()));

    let res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/api/v1/admin/cross-check")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert!(v.get("fee_pool_projection").is_some());
    assert!(v.get("governance_pool_chain").is_some());
    assert!(v.get("protocol_reference").is_some());
    assert!(v.get("drift_summary").is_some());

    cleanup_admin_it_user(&pool, admin_id).await;
}

/// **93 · A-ENV-001** → **§8.2 · F-029**：**`GET /health`** **`200`** **`ok`**；**`GET /meta`** **`200`** 且含 **`build`/`api_version`/`database`**（**`router::app`** + **`DATABASE_URL`**）。
#[tokio::test]
async fn matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_a_env_001b_f029_get_health_and_meta_contract_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(api_meta_state(Some(co)), idem, Some(pool.clone()));

    let health = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("health oneshot");
    assert_eq!(health.status(), StatusCode::OK);
    let hb = health.into_body().collect().await.unwrap().to_bytes();
    assert_eq!(std::str::from_utf8(&hb).unwrap().trim(), "ok");

    let meta = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/meta")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("meta oneshot");
    assert_eq!(
        meta.status(),
        StatusCode::OK,
        "{:?}",
        response_json(meta).await
    );
    let mj = response_json(meta).await;
    assert!(mj.get("build").is_some(), "meta.build: {mj:?}");
    assert!(mj.get("api_version").is_some(), "meta.api_version: {mj:?}");
    assert!(mj.get("database").is_some(), "meta.database: {mj:?}");
}
