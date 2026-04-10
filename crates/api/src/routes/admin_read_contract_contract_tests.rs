//! **Read Contract**：只读 **admin** GET 响应与 **`SourceKind`** 语义的最小契约测试（**不**改业务 handler）。

use axum::extract::{Query, State};
use axum::http::{HeaderMap, HeaderValue, StatusCode};
use axum::response::IntoResponse;
use chrono::Utc;
use http_body_util::BodyExt;
use serde_json::Value;
use std::sync::Arc;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, UserRow};
use crate::routes::admin::{
    get_admin_audit_operations, get_admin_cross_check, get_admin_drift_summary,
    get_admin_indexer_health, AdminAuditOperationsQuery,
};
use crate::source_kind::{validate_body_matches_source_kind, SourceKind};
use crate::state::test_support::api_meta_state;

async fn response_json(res: axum::response::Response) -> Value {
    let bytes = res
        .into_body()
        .collect()
        .await
        .expect("body")
        .to_bytes();
    serde_json::from_slice(&bytes).expect("json")
}

fn admin_auth_headers(uid: Uuid) -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert(
        axum::http::header::AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer bearer_{uid}")).expect("auth header"),
    );
    headers
}

fn state_with_admin_user() -> (crate::state::ApiMetaState, Uuid) {
    let now = Utc::now();
    let admin = UserRow {
        id: Uuid::new_v4(),
        email: "admin@test.local".to_string(),
        password_hash: None,
        role: "admin".to_string(),
        kyc_status: "none".to_string(),
        nickname: None,
        avatar_url: None,
        default_wallet_address: None,
        created_at: now,
        updated_at: now,
    };
    let uid = admin.id;
    let mut store = ChainOffStore::default();
    store.users.insert(uid, admin);
    let co = ChainOffState {
        store: Arc::new(tokio::sync::RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    (api_meta_state(Some(co)), uid)
}

fn assert_no_root_chain_read(body: &Value, label: &str) {
    if let Some(ds) = body.get("data_source").and_then(|v| v.as_str()) {
        assert_ne!(
            ds, "chain_read",
            "{label}: admin read must not claim root chain_read"
        );
    }
}

#[tokio::test]
async fn read_contract_admin_cross_check_slots_match_source_kinds() {
    let (st, uid) = state_with_admin_user();
    let res = get_admin_cross_check(State(st), admin_auth_headers(uid))
        .await
        .into_response();
    assert_eq!(res.status(), StatusCode::OK);
    let body = response_json(res).await;
    let fee = &body["fee_pool_projection"]["body"];
    let pool = &body["governance_pool_chain"]["body"];
    let pref = &body["protocol_reference"]["body"];
    validate_body_matches_source_kind(SourceKind::Projection, fee, "admin_cross_fee").unwrap();
    validate_body_matches_source_kind(SourceKind::ChainSSOT, pool, "admin_cross_pool").unwrap();
    validate_body_matches_source_kind(SourceKind::Reference, pref, "admin_cross_pref").unwrap();
    assert!(body["meta"]["build"].is_object());
}

#[tokio::test]
async fn read_contract_admin_drift_summary_shape() {
    let (st, uid) = state_with_admin_user();
    let res = get_admin_drift_summary(State(st), admin_auth_headers(uid))
        .await
        .into_response();
    assert_eq!(res.status(), StatusCode::OK);
    let body = response_json(res).await;
    assert_eq!(body["status"], "ok");
    assert!(body.get("drift_detected").is_some());
    assert!(body["delta"].is_array());
    assert!(body["meta"]["build"].is_object());
    assert_no_root_chain_read(&body, "drift-summary");
}

#[tokio::test]
async fn read_contract_admin_audit_operations_catalog_shape() {
    let (st, uid) = state_with_admin_user();
    let res = get_admin_audit_operations(
        State(st),
        Query(AdminAuditOperationsQuery::default()),
        admin_auth_headers(uid),
    )
    .await
    .into_response();
    assert_eq!(res.status(), StatusCode::OK);
    let body = response_json(res).await;
    assert_eq!(body["status"], "ok");
    assert!(body["operations"].is_array());
    assert_eq!(
        body["applied_filters"]["source"].as_str(),
        Some("action_catalog_v1")
    );
    assert!(body["meta"]["build"].is_object());
    assert_no_root_chain_read(&body, "audit-operations");
}

#[tokio::test]
async fn read_contract_admin_indexer_health_shape() {
    let (st, uid) = state_with_admin_user();
    let res = get_admin_indexer_health(State(st), admin_auth_headers(uid))
        .await
        .into_response();
    assert_eq!(res.status(), StatusCode::OK);
    let body = response_json(res).await;
    assert_eq!(body["status"], "ok");
    assert!(body["health"].is_object());
    assert!(body["meta"]["build"].is_object());
    assert_no_root_chain_read(&body, "indexer-health");
}
