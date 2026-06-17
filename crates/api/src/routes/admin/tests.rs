use super::*;
use axum::extract::{Json, Path, Query, State};
use axum::http::{HeaderMap, HeaderValue};
use chrono::Utc;
use http_body_util::BodyExt;
use std::collections::HashMap;
use std::sync::Arc;

use crate::chain_off::{
    ChainOffConfig, ChainOffState, ChainOffStore, DisputeRow, GuideRow, OrderRow, ReviewRow,
    UserRow,
};
use crate::db;
use crate::state::EvidenceTimeState;
use traveltrust_core::OrderState;

#[test]
fn supported_admin_target_roles_include_provider_and_region_steward_692() {
    assert!(super::is_supported_target_role("provider"));
    assert!(super::is_supported_target_role("region_steward"));
    assert!(super::is_supported_target_role("traveler"));
}

fn build_state(users: Vec<UserRow>) -> ApiMetaState {
    let mut store = ChainOffStore::default();
    store.users = users
        .into_iter()
        .map(|u| (u.id, u))
        .collect::<HashMap<_, _>>();

    ApiMetaState {
        strict_ssot: false,
        ssot_version: "test".to_string(),
        ssot_sha256_expected: None,
        ssot_sha256_computed: None,
        ssot_sha256_match: false,
        chargeback_policy: "test".to_string(),
        finality_n: 12,
        indexer_state_path: "test".to_string(),
        indexer_checkpoint: crate::state::ProjectorCheckpoint {
            block_number: 0,
            log_index: 0,
        },
        indexer_last_seen_finality_n: 12,
        indexer_replay_required: false,
        pause_mode: false,
        pause_api_allowlist: "".to_string(),
        degraded_mode: false,
        authority_source: "db_projection".to_string(),
        indexer_lag_blocks: 0,
        indexer_lag_max_blocks: 0,
        reorg_detected: false,
        evidence_timestamp_policy: "backend_signed".to_string(),
        evidence_time_state: Arc::new(tokio::sync::RwLock::new(EvidenceTimeState {
            last_seen_utc_rfc3339: Utc::now().to_rfc3339(),
        })),
        evidence_time_state_path: "test".to_string(),
        evidence_receipt_hmac_key: None,
        reconcile_export_ed25519_key: None,
        order_deadline_clock: Arc::new(crate::order_deadline_clock::SystemOrderDeadlineClock),
        chain_off: Some(ChainOffState {
            store: Arc::new(tokio::sync::RwLock::new(store)),
            config: ChainOffConfig::default(),
            db_pool: None,
        }),
        jurisdiction_country_ledger_registry: Arc::new(
            crate::jurisdiction_country_ledger_template::JurisdictionCountryLedgerRegistry::empty(),
        ),
        chain_config: None,
        resolution_outbox: None,
        indexer_state: None,
        indexer_tick_fail_skip_bucket_obs_last: Arc::new(tokio::sync::RwLock::new(None)),
        guide_upload_rate: Arc::new(tokio::sync::RwLock::new(HashMap::new())),
        community_media_upload_rate: Arc::new(tokio::sync::RwLock::new(HashMap::new())),
    }
}

fn build_state_with_chain_off_config_and_chain_config(
    users: Vec<UserRow>,
    co_cfg: ChainOffConfig,
    chain_config: Option<crate::chain::ChainConfig>,
) -> ApiMetaState {
    let mut st = build_state(users);
    if let Some(co) = st.chain_off.as_mut() {
        co.config = co_cfg;
    }
    st.chain_config = chain_config;
    st
}

fn user_with_role(role: &str) -> UserRow {
    let now = Utc::now();
    UserRow {
        id: Uuid::new_v4(),
        email: format!("{}@test.local", role),
        password_hash: None,
        role: role.to_string(),
        kyc_status: "none".to_string(),
        nickname: None,
        avatar_url: None,
        default_wallet_address: None,
        created_at: now,
        updated_at: now,
    }
}

fn bearer_for(uid: Uuid) -> String {
    format!("Bearer bearer_{uid}")
}

fn auth_headers(uid: Uuid) -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert(
        axum::http::header::AUTHORIZATION,
        HeaderValue::from_str(&bearer_for(uid)).expect("valid auth header"),
    );
    headers
}

async fn body_json(resp: axum::response::Response) -> serde_json::Value {
    let collected = resp
        .into_body()
        .collect()
        .await
        .expect("collect response body");
    serde_json::from_slice(&collected.to_bytes()).expect("parse json body")
}

async fn body_string(resp: axum::response::Response) -> String {
    let collected = resp
        .into_body()
        .collect()
        .await
        .expect("collect response body");
    String::from_utf8(collected.to_bytes().to_vec()).expect("utf8 body")
}

fn state_no_chain_off() -> ApiMetaState {
    let mut st = build_state(vec![user_with_role("admin")]);
    st.chain_off = None;
    st
}

async fn assert_chain_off_not_impl(resp: axum::response::Response, expected_path: &str) {
    assert_eq!(resp.status(), StatusCode::NOT_IMPLEMENTED);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "not_implemented");
    assert_eq!(body["path"], expected_path);
}

#[test]
fn admin_attach_meta_build_inserts_meta_when_absent() {
    let mut body = json!({ "status": "ok" });
    admin_attach_meta_build(&mut body);
    let meta = body["meta"].as_object().expect("meta");
    let b = meta.get("build").expect("meta.build");
    assert!(b.get("git_sha").is_some() || b.get("rule").is_some());
}

#[test]
fn admin_attach_meta_build_preserves_other_meta_keys() {
    let mut body = json!({
        "status": "ok",
        "meta": {
            "note": "keep_this",
            "source": "test"
        }
    });
    admin_attach_meta_build(&mut body);
    let meta = body["meta"].as_object().expect("meta");
    assert_eq!(meta.get("note").and_then(|v| v.as_str()), Some("keep_this"));
    assert_eq!(meta.get("source").and_then(|v| v.as_str()), Some("test"));
    assert!(meta.get("build").is_some());
}

#[test]
fn admin_attach_meta_build_replaces_stale_build_object() {
    let mut body = json!({
        "status": "ok",
        "meta": {
            "build": { "git_sha": "stale", "rule": "stale" }
        }
    });
    admin_attach_meta_build(&mut body);
    let sha = body["meta"]["build"]["git_sha"].as_str().unwrap_or("");
    assert_ne!(sha, "stale");
}

#[tokio::test]
async fn role_change_request_requires_db_pool() {
    let admin = user_with_role("admin");
    let target = user_with_role("tourist");
    let target_id = target.id;
    let resp = post_admin_user_role_change_request(
        State(build_state(vec![admin.clone(), target])),
        Path(target_id.to_string()),
        auth_headers(admin.id),
        Json(AdminRoleChangeRequestBody {
            target_role: "guide".to_string(),
            reason: Some("test".to_string()),
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn get_admin_approvals_returns_note_without_db() {
    let admin = user_with_role("super_admin");
    let resp = get_admin_approvals(
        State(build_state(vec![admin.clone()])),
        Query(AdminApprovalQuery {
            status: None,
            limit: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    assert_eq!(body["note"], "admin_approvals_no_db");
    let meta = body["meta"].as_object().expect("meta object");
    assert_eq!(
        meta.get("note").and_then(|v| v.as_str()),
        Some("admin_approvals_no_db")
    );
    assert!(meta.get("build").is_some());
}

#[tokio::test]
async fn get_admin_approvals_forbidden_for_ops_console_role() {
    let admin = user_with_role("admin");
    let resp = get_admin_approvals(
        State(build_state(vec![admin.clone()])),
        Query(AdminApprovalQuery {
            status: None,
            limit: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_permission_denied");
}

#[tokio::test]
async fn admin_finance_summary_forbidden_for_cs_console_role() {
    std::env::set_var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE", "CS");
    let admin = user_with_role("admin");
    let resp = get_admin_finance_summary(
        State(build_state(vec![admin.clone()])),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    std::env::remove_var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE");
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_permission_denied");
}

#[tokio::test]
async fn admin_fee_router_forbidden_for_cs_console_role() {
    std::env::set_var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE", "CS");
    let admin = user_with_role("admin");
    let resp = get_admin_fee_router_routed_events(
        State(build_state(vec![admin.clone()])),
        Query(AdminFeeRouterRoutedQuery {
            chain_id: None,
            limit: None,
            cursor: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    std::env::remove_var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE");
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_permission_denied");
}

#[tokio::test]
async fn admin_audit_logs_ok_for_cs_console_role() {
    std::env::set_var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE", "CS");
    let admin = user_with_role("admin");
    let resp = get_admin_audit_logs(
        State(build_state(vec![admin.clone()])),
        Query(AdminAuditQuery {
            actor_id: None,
            action: None,
            resource_type: None,
            limit: Some(3),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    std::env::remove_var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE");
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["note"], "admin_audit_log_no_db");
}

#[tokio::test]
async fn cert3_console_role_rbac_matrix_sequential() {
    let admin = user_with_role("admin");

    std::env::set_var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE", "Finance");
    let finance_summary = get_admin_finance_summary(
        State(build_state(vec![admin.clone()])),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(finance_summary.status(), StatusCode::OK);

    let finance_approvals = get_admin_approvals(
        State(build_state(vec![admin.clone()])),
        Query(AdminApprovalQuery {
            status: None,
            limit: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(finance_approvals.status(), StatusCode::FORBIDDEN);

    std::env::set_var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE", "Risk");
    let risk_community = get_admin_community_reports(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityReportsQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_ne!(risk_community.status(), StatusCode::FORBIDDEN);
    assert_eq!(risk_community.status(), StatusCode::SERVICE_UNAVAILABLE);

    let risk_finance = get_admin_finance_summary(
        State(build_state(vec![admin.clone()])),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(risk_finance.status(), StatusCode::FORBIDDEN);

    std::env::set_var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE", "Auditor");
    let auditor_audit = get_admin_audit_logs(
        State(build_state(vec![admin.clone()])),
        Query(AdminAuditQuery {
            actor_id: None,
            action: None,
            resource_type: None,
            limit: Some(3),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(auditor_audit.status(), StatusCode::OK);

    let auditor_penalty = post_admin_community_penalty(
        State(build_state(vec![admin.clone()])),
        auth_headers(admin.id),
        Json(AdminCommunityPenaltyCreateBody {
            subject_user_id: Uuid::new_v4().to_string(),
            action: "warn".to_string(),
            report_id: None,
            reason: None,
            expires_at: None,
            metadata: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(auditor_penalty.status(), StatusCode::FORBIDDEN);

    std::env::set_var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE", "SuperAdmin");
    let super_approvals = get_admin_approvals(
        State(build_state(vec![admin.clone()])),
        Query(AdminApprovalQuery {
            status: None,
            limit: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(super_approvals.status(), StatusCode::OK);

    std::env::set_var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE", "Ops");
    let ops_finance = get_admin_finance_summary(
        State(build_state(vec![admin.clone()])),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(ops_finance.status(), StatusCode::OK);
    let ops_approvals = get_admin_approvals(
        State(build_state(vec![admin.clone()])),
        Query(AdminApprovalQuery {
            status: None,
            limit: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(ops_approvals.status(), StatusCode::FORBIDDEN);

    std::env::set_var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE", "CS");
    let cs_finance = get_admin_finance_summary(
        State(build_state(vec![admin.clone()])),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(cs_finance.status(), StatusCode::FORBIDDEN);
    let cs_audit = get_admin_audit_logs(
        State(build_state(vec![admin.clone()])),
        Query(AdminAuditQuery {
            actor_id: None,
            action: None,
            resource_type: None,
            limit: Some(3),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(cs_audit.status(), StatusCode::OK);

    std::env::remove_var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE");
}

#[tokio::test]
async fn admin_approval_detail_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let aid = Uuid::new_v4();
    let resp = get_admin_approval_by_id(
        State(build_state(vec![tourist.clone()])),
        Path(aid.to_string()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_approval_detail_invalid_id_returns_400() {
    let sa = user_with_role("super_admin");
    let resp = get_admin_approval_by_id(
        State(build_state(vec![sa.clone()])),
        Path("bad".to_string()),
        auth_headers(sa.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_approval_id");
}

#[tokio::test]
async fn admin_approval_detail_requires_db() {
    let sa = user_with_role("super_admin");
    let aid = Uuid::new_v4();
    let resp = get_admin_approval_by_id(
        State(build_state(vec![sa.clone()])),
        Path(aid.to_string()),
        auth_headers(sa.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_finance_summary_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_finance_summary(
        State(build_state(vec![tourist.clone()])),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_finance_summary_ok_includes_meta_and_disputes() {
    let admin = user_with_role("admin");
    let st = build_state(vec![admin.clone()]);
    let did = Uuid::new_v4();
    let oid = Uuid::new_v4();
    let now = Utc::now();
    {
        let co = st.chain_off.as_ref().unwrap();
        let mut store = co.store.write().await;
        store.disputes.insert(
            did,
            DisputeRow {
                id: did,
                order_id: oid,
                status: "open".to_string(),
                evidence_hashes: vec![],
                arbitrator_id: None,
                refund_ratio: None,
                slash_guide: None,
                resolved_at: None,
                created_at: now,
                updated_at: now,
                arb_fee_paid: None,
                dispute_sequence: 1,
            },
        );
    }
    let resp = get_admin_finance_summary(State(st), auth_headers(admin.id))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    assert_eq!(body["meta"]["source"], "chain_off");
    assert!(body["meta"]["generated_at"].is_string());
    assert_eq!(body["summary"]["order_count"], 0);
    assert_eq!(body["summary"]["dispute_count"], 1);
    assert_eq!(body["summary"]["dispute_status_counts"]["open"], 1);
    assert_eq!(body["summary"]["orders_with_escrow_address_count"], 0);
    assert_eq!(body["summary"]["orders_amount_parse_error_count"], 0);
    assert!(body["meta"]["build"]["git_sha"].is_string());
    assert!(body["meta"]["build"]["rule"].is_string());
    assert!(body["meta"]["fee_router_address"].is_null());
    assert!(body["meta"]["fee_router_stats"].is_null());
    assert!(body["meta"]["region_vault_address"].is_null());
    assert!(body["meta"]["region_vault_stats"].is_null());
    assert!(body["meta"]["last_stored_orders_projection_reconcile"].is_null());
    assert!(body["meta"]["orders_projection_reconcile_report_count"].is_null());
    assert!(body["meta"]["reconciliation_reports_total_count"].is_null());
    assert!(body["meta"]["reconciliation_reports_with_open_issues_count"].is_null());
    assert!(body["meta"]["reconciliation_reports_projection_unclean_count"].is_null());
    assert!(body["meta"]["reconciliation_reports_projection_clean_count"].is_null());
}

#[tokio::test]
async fn admin_finance_summary_not_impl_without_chain_off() {
    assert_chain_off_not_impl(
        get_admin_finance_summary(State(state_no_chain_off()), HeaderMap::new())
            .await
            .into_response(),
        "GET /api/v1/admin/finance/summary",
    )
    .await;
}

#[tokio::test]
async fn admin_finance_summary_export_csv_ok() {
    use axum::http::header::CONTENT_TYPE;

    let admin = user_with_role("admin");
    let st = build_state(vec![admin.clone()]);
    let did = Uuid::new_v4();
    let oid = Uuid::new_v4();
    let now = Utc::now();
    {
        let co = st.chain_off.as_ref().unwrap();
        let mut store = co.store.write().await;
        store.disputes.insert(
            did,
            DisputeRow {
                id: did,
                order_id: oid,
                status: "open".to_string(),
                evidence_hashes: vec![],
                arbitrator_id: None,
                refund_ratio: None,
                slash_guide: None,
                resolved_at: None,
                created_at: now,
                updated_at: now,
                arb_fee_paid: None,
                dispute_sequence: 1,
            },
        );
    }
    let resp = get_admin_finance_summary_export(
        State(st),
        Query(AdminFinanceSummaryExportQuery {
            format: "csv".to_string(),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    assert_eq!(
        resp.headers()
            .get(CONTENT_TYPE)
            .and_then(|h| h.to_str().ok()),
        Some("text/csv; charset=utf-8")
    );
    let text = body_string(resp).await;
    assert!(text.contains("export,kind,finance_summary_v2\n"));
    assert!(text.contains("meta,source,chain_off\n"));
    assert!(text.contains("summary,dispute_count,1\n"));
    assert!(text.contains("summary.dispute_status_counts,open,1\n"));
}

#[test]
fn finance_summary_to_csv_flattens_router_vault_and_projection_meta() {
    let meta = json!({
        "source": "chain_off",
        "fee_router_address": "0xfee",
        "fee_router_stats": {
            "total": 2,
            "max_block_number": 10,
            "min_block_number": 1,
            "latest_inserted_at": "2020-01-01T00:00:00Z"
        },
        "region_vault_stats": {
            "total": 3,
            "max_block_number": null,
            "min_block_number": null,
            "latest_inserted_at": null
        },
        "last_stored_orders_projection_reconcile": {
            "report_id": "r1",
            "projection_reconcile_clean": true,
            "nested": { "x": 1 }
        }
    });
    let summary = json!({ "order_count": 1 });
    let csv = finance_summary_to_csv(&meta, &summary);
    assert!(csv.starts_with("export,kind,finance_summary_v2\n"));
    assert!(csv.contains("meta,fee_router_address,0xfee\n"));
    assert!(csv.contains("meta.fee_router_stats,total,2\n"));
    assert!(csv.contains("meta.region_vault_stats,total,3\n"));
    assert!(csv.contains("meta.last_stored_orders_projection_reconcile,report_id,r1\n"));
    assert!(csv.contains(
        "meta.last_stored_orders_projection_reconcile,projection_reconcile_clean,true\n"
    ));
    assert!(csv.contains("meta.last_stored_orders_projection_reconcile,nested,"));
    assert!(csv.contains("summary,order_count,1\n"));
}

#[tokio::test]
async fn admin_finance_summary_export_rejects_unknown_format() {
    let admin = user_with_role("admin");
    let st = build_state(vec![admin.clone()]);
    let resp = get_admin_finance_summary_export(
        State(st),
        Query(AdminFinanceSummaryExportQuery {
            format: "json".to_string(),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "bad_request");
}

#[tokio::test]
async fn admin_finance_summary_export_not_impl_without_chain_off() {
    assert_chain_off_not_impl(
        get_admin_finance_summary_export(
            State(state_no_chain_off()),
            Query(AdminFinanceSummaryExportQuery {
                format: "csv".to_string(),
            }),
            HeaderMap::new(),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/finance/summary/export",
    )
    .await;
}

#[tokio::test]
async fn admin_fee_router_routed_events_not_impl_without_chain_off() {
    assert_chain_off_not_impl(
        get_admin_fee_router_routed_events(
            State(state_no_chain_off()),
            Query(AdminFeeRouterRoutedQuery {
                limit: None,
                cursor: None,
                chain_id: None,
            }),
            HeaderMap::new(),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/fee-router/routed-events",
    )
    .await;
}

#[tokio::test]
async fn admin_region_vault_forwarded_events_not_impl_without_chain_off() {
    assert_chain_off_not_impl(
        get_admin_region_vault_forwarded_events(
            State(state_no_chain_off()),
            Query(AdminRegionVaultForwardedQuery {
                limit: None,
                cursor: None,
                chain_id: None,
            }),
            HeaderMap::new(),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/region-vault/forwarded-events",
    )
    .await;
}

#[tokio::test]
async fn admin_users_not_impl_without_chain_off() {
    assert_chain_off_not_impl(
        get_admin_users(
            State(state_no_chain_off()),
            Query(AdminUsersListQuery {
                limit: None,
                role: None,
                kyc_status: None,
            }),
            HeaderMap::new(),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/users",
    )
    .await;
}

/// 与上三则同族：`chain_off` 在 handler 首部即判空并 **`not_impl_json`** 的其余只读入口（07 §5.6C）。
#[tokio::test]
async fn admin_memory_first_gets_not_impl_without_chain_off() {
    let id = Uuid::new_v4().to_string();
    assert_chain_off_not_impl(
        get_admin_user_by_id(
            State(state_no_chain_off()),
            Path(id.clone()),
            HeaderMap::new(),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/users/:id",
    )
    .await;
    assert_chain_off_not_impl(
        get_admin_guides(
            State(state_no_chain_off()),
            Query(AdminGuidesListQuery {
                limit: None,
                status: None,
            }),
            HeaderMap::new(),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/guides",
    )
    .await;
    assert_chain_off_not_impl(
        get_admin_guide_by_id(
            State(state_no_chain_off()),
            Path(id.clone()),
            HeaderMap::new(),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/guides/:id",
    )
    .await;
    assert_chain_off_not_impl(
        patch_admin_guide_registration(
            State(state_no_chain_off()),
            Path(id.clone()),
            HeaderMap::new(),
            Json(AdminPatchGuideRegistrationBody {
                status: "active".to_string(),
                rejection_codes: vec![],
                rejection_message: None,
            }),
        )
        .await
        .into_response(),
        "PATCH /api/v1/admin/guides/:id",
    )
    .await;
    assert_chain_off_not_impl(
        get_admin_orders(
            State(state_no_chain_off()),
            Query(AdminOrdersListQuery {
                limit: None,
                state: None,
            }),
            HeaderMap::new(),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/orders",
    )
    .await;
    assert_chain_off_not_impl(
        get_admin_order_by_id(
            State(state_no_chain_off()),
            Path(id.clone()),
            HeaderMap::new(),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/orders/:id",
    )
    .await;
    assert_chain_off_not_impl(
        get_admin_reviews(
            State(state_no_chain_off()),
            Query(AdminReviewsQuery {
                limit: None,
                min_score: None,
                max_score: None,
            }),
            HeaderMap::new(),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/reviews",
    )
    .await;
    assert_chain_off_not_impl(
        get_admin_review_by_id(
            State(state_no_chain_off()),
            Path(id.clone()),
            HeaderMap::new(),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/reviews/:id",
    )
    .await;
    assert_chain_off_not_impl(
        get_admin_disputes(
            State(state_no_chain_off()),
            Query(AdminDisputesListQuery {
                limit: None,
                status: None,
            }),
            HeaderMap::new(),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/disputes",
    )
    .await;
    assert_chain_off_not_impl(
        get_admin_dispute_by_id(State(state_no_chain_off()), Path(id), HeaderMap::new())
            .await
            .into_response(),
        "GET /api/v1/admin/disputes/:id",
    )
    .await;
}

/// 与「handler 首部 **`chain_off` 判空**」不同：已带 **`Authorization: Bearer`** 时 **`require_admin_actor`** 仍要求内存态，返回 **`GET /api/v1/admin/*`**（70 / 07 §5.6C）。
#[tokio::test]
async fn admin_require_admin_actor_not_impl_without_chain_off_with_bearer() {
    const STAR: &str = "GET /api/v1/admin/*";

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_observability_overview(State(st), auth_headers(admin.id))
            .await
            .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        post_admin_user_role_change_request(
            State(st),
            Path(Uuid::new_v4().to_string()),
            auth_headers(admin.id),
            Json(AdminRoleChangeRequestBody {
                target_role: "guide".to_string(),
                reason: None,
            }),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_schema_migrations(
            State(st),
            Query(AdminSchemaMigrationsQuery { limit: None }),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_indexer_health(State(st), auth_headers(admin.id))
            .await
            .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_indexer_reconcile_reports(
            State(st),
            Query(AdminReconcileReportsQuery {
                limit: 30,
                offset: 0,
                report_type: None,
                chain_id: None,
                projection_reconcile_clean: None,
                issues_min: None,
            }),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_flags(
            State(st),
            Query(AdminFlagsQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("super_admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_approvals(
            State(st),
            Query(AdminApprovalQuery {
                status: None,
                limit: None,
            }),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_audit_logs(
            State(st),
            Query(AdminAuditQuery {
                limit: None,
                actor_id: None,
                action: None,
                resource_type: None,
            }),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_jobs(
            State(st),
            Query(AdminJobsQuery {
                limit: None,
                status: None,
            }),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_community_reports(
            State(st),
            Query(AdminCommunityReportsQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_compliance_data_requests(
            State(st),
            Query(AdminComplianceDataRequestsQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_policies(
            State(st),
            Query(AdminPoliciesQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_tenant_scopes(
            State(st),
            Query(AdminTenantScopesQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_config_releases(
            State(st),
            Query(AdminConfigReleasesQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_secrets_metadata(
            State(st),
            Query(AdminSecretsMetadataQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_api_versions(
            State(st),
            Query(AdminApiVersionsQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_lifecycle_state_machines(
            State(st),
            Query(AdminLifecycleStateMachinesQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_internal_tool_audits(
            State(st),
            Query(AdminInternalToolAuditsQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_media_access_logs(
            State(st),
            Query(AdminMediaAccessLogsQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_media_signed_url_tokens(
            State(st),
            Query(AdminMediaSignedUrlTokensQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_community_appeals(
            State(st),
            Query(AdminCommunityAppealsQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_community_ranking_snapshots(
            State(st),
            Query(AdminCommunityRankingSnapshotsQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_community_penalties(
            State(st),
            Query(AdminCommunityPenaltiesQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_community_moderation_cases(
            State(st),
            Query(AdminCommunityModerationCasesQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_community_risk_signals(
            State(st),
            Query(AdminCommunityRiskSignalsQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_community_policy_change_logs(
            State(st),
            Query(AdminCommunityPolicyChangeLogsQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_alert_incident_by_id(
            State(st),
            Path("incident-star-contract".to_string()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_audit_operations(
            State(st),
            Query(AdminAuditOperationsQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_audit_log_by_id(
            State(st),
            Path(Uuid::new_v4().to_string()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_approval_by_id(
            State(st),
            Path(Uuid::new_v4().to_string()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_config_release_by_id(
            State(st),
            Path(Uuid::new_v4().to_string()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_indexer_reconcile_report(
            State(st),
            Path("latest".to_string()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        get_admin_scheduler_jobs(
            State(st),
            Query(AdminSchedulerJobsQuery::default()),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        post_admin_community_penalty(
            State(st),
            auth_headers(admin.id),
            Json(AdminCommunityPenaltyCreateBody {
                subject_user_id: Uuid::new_v4().to_string(),
                action: "warn".to_string(),
                report_id: None,
                reason: None,
                expires_at: None,
                metadata: None,
            }),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        patch_admin_community_comment(
            State(st),
            Path(Uuid::new_v4().to_string()),
            auth_headers(admin.id),
            Json(AdminCommunityCommentVisibilityBody {
                visibility_status: "hidden".to_string(),
            }),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;

    let admin = user_with_role("admin");
    let mut st = build_state(vec![admin.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        patch_admin_community_moderation(
            State(st),
            Path(Uuid::new_v4().to_string()),
            auth_headers(admin.id),
            Json(AdminCommunityModerationBody {
                expected_version: 1,
                status: "open".to_string(),
                admin_notes: None,
                disposition: None,
                record_penalty: None,
            }),
        )
        .await
        .into_response(),
        STAR,
    )
    .await;
}

/// Admin **写**路径在无 **`chain_off`** 时须 **501** **`not_implemented`**（handler 首部或 **`require_admin_actor`**）。
#[tokio::test]
async fn admin_require_super_admin_uid_not_impl_without_chain_off_with_bearer() {
    let sa = user_with_role("super_admin");

    let mut st = build_state(vec![sa.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        post_admin_approval_approve(
            State(st),
            Path(Uuid::new_v4().to_string()),
            auth_headers(sa.id),
            Json(AdminApprovalActionBody {
                reason: Some("ok".to_string()),
            }),
        )
        .await
        .into_response(),
        "POST /api/v1/admin/approvals/:id/approve",
    )
    .await;

    let sa = user_with_role("super_admin");
    let mut st = build_state(vec![sa.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        post_admin_flag_publish(
            State(st),
            Path(Uuid::new_v4().to_string()),
            auth_headers(sa.id),
            Json(AdminFlagPublishBody {
                enabled: true,
                rollout_percent: None,
                region: None,
                expected_version: 1,
            }),
        )
        .await
        .into_response(),
        "POST /api/v1/admin/flags/:id/publish",
    )
    .await;

    let sa = user_with_role("super_admin");
    let mut st = build_state(vec![sa.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        post_admin_policy_publish(
            State(st),
            Path(Uuid::new_v4().to_string()),
            auth_headers(sa.id),
            Json(AdminPolicyPublishBody {
                status: "active".to_string(),
                expected_version: 1,
            }),
        )
        .await
        .into_response(),
        "POST /api/v1/admin/policies/:id/publish",
    )
    .await;

    let sa = user_with_role("super_admin");
    let mut st = build_state(vec![sa.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        post_admin_tenant_scope_publish(
            State(st),
            Path(Uuid::new_v4().to_string()),
            auth_headers(sa.id),
            Json(AdminTenantScopePublishBody {
                status: "draft".to_string(),
                expected_version: 1,
            }),
        )
        .await
        .into_response(),
        "POST /api/v1/admin/tenants/scopes/:id/publish",
    )
    .await;

    let sa = user_with_role("super_admin");
    let mut st = build_state(vec![sa.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        post_admin_community_appeal_review(
            State(st),
            Path(Uuid::new_v4().to_string()),
            auth_headers(sa.id),
            Json(AdminCommunityAppealReviewBody {
                expected_version: 1,
                decision: "accepted".to_string(),
                reviewer_note: None,
            }),
        )
        .await
        .into_response(),
        "POST /api/v1/admin/community/appeals/:id/review",
    )
    .await;

    let sa = user_with_role("super_admin");
    let mut st = build_state(vec![sa.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        patch_admin_community_abuse_policy(
            State(st),
            auth_headers(sa.id),
            Json(db::CommunityAbusePolicyPatch {
                comment_rate_window_sec: Some(120),
                ..Default::default()
            }),
        )
        .await
        .into_response(),
        "PATCH /api/v1/admin/community/abuse-policy",
    )
    .await;

    let sa = user_with_role("super_admin");
    let mut st = build_state(vec![sa.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        post_admin_compliance_data_request_update(
            State(st),
            Path(Uuid::new_v4().to_string()),
            auth_headers(sa.id),
            Json(AdminComplianceDataRequestUpdateBody {
                expected_version: 1,
                status: None,
                notes: None,
                export_signature: None,
                record_hash_fingerprint: None,
                event_type: "internal_note".to_string(),
                event_detail: None,
            }),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/*",
    )
    .await;

    let sa = user_with_role("super_admin");
    let mut st = build_state(vec![sa.clone()]);
    st.chain_off = None;
    assert_chain_off_not_impl(
        post_admin_scheduler_job_rerun(
            State(st),
            Path("indexer_tick".to_string()),
            auth_headers(sa.id),
            Json(AdminSchedulerRerunBody {
                reason: Some("test".to_string()),
            }),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/*",
    )
    .await;
}

#[tokio::test]
async fn approval_requires_super_admin_role() {
    let admin = user_with_role("admin");
    let resp = post_admin_approval_approve(
        State(build_state(vec![admin.clone()])),
        Path(Uuid::new_v4().to_string()),
        auth_headers(admin.id),
        Json(AdminApprovalActionBody {
            reason: Some("ok".to_string()),
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_permission_denied");
}

#[tokio::test]
async fn admin_users_forbidden_for_non_admin_actor() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_users(
        State(build_state(vec![tourist.clone()])),
        Query(AdminUsersListQuery {
            limit: None,
            role: None,
            kyc_status: None,
        }),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_required");
}

#[tokio::test]
async fn admin_guides_forbidden_for_non_admin_actor() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_guides(
        State(build_state(vec![tourist.clone()])),
        Query(AdminGuidesListQuery {
            limit: None,
            status: None,
        }),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_required");
}

#[tokio::test]
async fn admin_guides_ok_for_admin_includes_guide_row() {
    let admin = user_with_role("admin");
    let st = build_state(vec![admin.clone()]);
    let gid = Uuid::new_v4();
    let uid = Uuid::new_v4();
    {
        let co = st.chain_off.as_ref().unwrap();
        let mut store = co.store.write().await;
        store.guides.insert(
            gid,
            GuideRow {
                id: gid,
                user_id: uid,
                city: "Beijing".to_string(),
                country_code: "CN".to_string(),
                languages: vec!["zh".to_string()],
                service_types: vec!["city".to_string()],
                bio: Some("bio".to_string()),
                wallet_address: Some("0xabc".to_string()),
                real_name: Some("Test Guide".to_string()),
                passport_number_hash: Some("hash".to_string()),
                id_photo_url: Some("https://example.com/id.jpg".to_string()),
                language_cert_url: None,
                guide_license_url: None,
                stake_amount: "100".to_string(),
                hourly_rate: None,
                avatar_url: None,
            public_title: None,
                status: "pending_review".to_string(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
                data_origin: "production".into(),
            },
        );
    }
    let resp = get_admin_guides(
        State(st),
        Query(AdminGuidesListQuery {
            limit: None,
            status: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    let items = body["items"].as_array().unwrap();
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["city"], "Beijing");
    assert_eq!(items[0]["user_id"], uid.to_string());
    assert!(items[0].get("passport_number_hash").is_none());
}

#[tokio::test]
async fn admin_orders_list_includes_traveler_id_mirror() {
    let admin = user_with_role("admin");
    let st = build_state(vec![admin.clone()]);
    let oid = Uuid::new_v4();
    let tid = Uuid::new_v4();
    let gid = Uuid::new_v4();
    let now = Utc::now();
    {
        let co = st.chain_off.as_ref().unwrap();
        let mut store = co.store.write().await;
        store.orders.insert(
            oid,
            OrderRow {
                id: oid,
                tourist_id: tid,
                guide_id: gid,
                amount: "100".to_string(),
                currency: "USD".to_string(),
                escrow_address: None,
                state: OrderState::Draft,
                created_at: now,
                accepted_at: None,
                escrowed_at: None,
                completed_at: None,
                dispute_deadline_at: None,
                auto_complete_at: None,
                updated_at: now,
                start_date: None,
                end_date: None,
                sub_status: None,
                tourist_confirmed: None,
                guide_confirmed: None,
                rating_tourist_confirmed: None,
                rating_guide_confirmed: None,
                chain_id: None,
                data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
            },
        );
    }
    let resp = get_admin_orders(
        State(st),
        Query(AdminOrdersListQuery {
            limit: Some(50),
            state: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    let items = body["items"].as_array().unwrap();
    assert_eq!(items.len(), 1);
    let row = &items[0];
    assert_eq!(row["tourist_id"].as_str().unwrap(), tid.to_string());
    assert_eq!(row["traveler_id"].as_str().unwrap(), tid.to_string());
}

#[tokio::test]
async fn admin_disputes_list_includes_tourist_traveler_mirror() {
    let admin = user_with_role("admin");
    let st = build_state(vec![admin.clone()]);
    let oid = Uuid::new_v4();
    let did = Uuid::new_v4();
    let tid = Uuid::new_v4();
    let gid = Uuid::new_v4();
    let now = Utc::now();
    {
        let co = st.chain_off.as_ref().unwrap();
        let mut store = co.store.write().await;
        store.orders.insert(
            oid,
            OrderRow {
                id: oid,
                tourist_id: tid,
                guide_id: gid,
                amount: "100".to_string(),
                currency: "USD".to_string(),
                escrow_address: None,
                state: OrderState::Draft,
                created_at: now,
                accepted_at: None,
                escrowed_at: None,
                completed_at: None,
                dispute_deadline_at: None,
                auto_complete_at: None,
                updated_at: now,
                start_date: None,
                end_date: None,
                sub_status: None,
                tourist_confirmed: None,
                guide_confirmed: None,
                rating_tourist_confirmed: None,
                rating_guide_confirmed: None,
                chain_id: None,
                data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
            },
        );
        store.disputes.insert(
            did,
            DisputeRow {
                id: did,
                order_id: oid,
                status: "open".to_string(),
                evidence_hashes: vec![],
                arbitrator_id: None,
                refund_ratio: None,
                slash_guide: None,
                resolved_at: None,
                created_at: now,
                updated_at: now,
                arb_fee_paid: None,
                dispute_sequence: 1,
            },
        );
    }
    let resp = get_admin_disputes(
        State(st),
        Query(AdminDisputesListQuery {
            limit: Some(50),
            status: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    let items = body["items"].as_array().unwrap();
    assert_eq!(items.len(), 1);
    let row = &items[0];
    assert_eq!(row["tourist_id"].as_str().unwrap(), tid.to_string());
    assert_eq!(row["traveler_id"].as_str().unwrap(), tid.to_string());
}

#[tokio::test]
async fn admin_reviews_list_includes_tourist_traveler_mirror() {
    let admin = user_with_role("admin");
    let st = build_state(vec![admin.clone()]);
    let oid = Uuid::new_v4();
    let rid = Uuid::new_v4();
    let tid = Uuid::new_v4();
    let gid = Uuid::new_v4();
    let rv = Uuid::new_v4();
    let ee = Uuid::new_v4();
    let now = Utc::now();
    {
        let co = st.chain_off.as_ref().unwrap();
        let mut store = co.store.write().await;
        store.orders.insert(
            oid,
            OrderRow {
                id: oid,
                tourist_id: tid,
                guide_id: gid,
                amount: "100".to_string(),
                currency: "USD".to_string(),
                escrow_address: None,
                state: OrderState::Draft,
                created_at: now,
                accepted_at: None,
                escrowed_at: None,
                completed_at: None,
                dispute_deadline_at: None,
                auto_complete_at: None,
                updated_at: now,
                start_date: None,
                end_date: None,
                sub_status: None,
                tourist_confirmed: None,
                guide_confirmed: None,
                rating_tourist_confirmed: None,
                rating_guide_confirmed: None,
                chain_id: None,
                data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
            },
        );
        store.reviews.push(ReviewRow {
            id: rid,
            order_id: oid,
            reviewer_id: rv,
            reviewee_id: ee,
            score: 5,
            weight: 1.0,
            comment: None,
            created_at: now,
        });
    }
    let resp = get_admin_reviews(
        State(st),
        Query(AdminReviewsQuery {
            limit: Some(50),
            min_score: None,
            max_score: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    let items = body["items"].as_array().unwrap();
    assert_eq!(items.len(), 1);
    let row = &items[0];
    assert_eq!(row["tourist_id"].as_str().unwrap(), tid.to_string());
    assert_eq!(row["traveler_id"].as_str().unwrap(), tid.to_string());
}

#[tokio::test]
async fn admin_guide_detail_forbidden_for_non_admin_actor() {
    let tourist = user_with_role("tourist");
    let gid = Uuid::new_v4();
    let resp = get_admin_guide_by_id(
        State(build_state(vec![tourist.clone()])),
        Path(gid.to_string()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_guide_detail_invalid_id_returns_400() {
    let admin = user_with_role("admin");
    let resp = get_admin_guide_by_id(
        State(build_state(vec![admin.clone()])),
        Path("not-uuid".to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_guide_id");
}

#[tokio::test]
async fn admin_guide_detail_not_found() {
    let admin = user_with_role("admin");
    let gid = Uuid::new_v4();
    let resp = get_admin_guide_by_id(
        State(build_state(vec![admin.clone()])),
        Path(gid.to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn admin_guide_detail_ok_matches_list_shape() {
    let admin = user_with_role("admin");
    let gid = Uuid::new_v4();
    let uid = Uuid::new_v4();
    let st = build_state(vec![admin.clone()]);
    {
        let co = st.chain_off.as_ref().unwrap();
        let mut store = co.store.write().await;
        store.guides.insert(
            gid,
            GuideRow {
                id: gid,
                user_id: uid,
                city: "Shanghai".to_string(),
                country_code: "CN".to_string(),
                languages: vec!["en".to_string()],
                service_types: vec!["hike".to_string()],
                bio: Some("detail bio".to_string()),
                wallet_address: Some("0x0000000000000000000000000000000000000001".to_string()),
                real_name: Some("Guide Name".to_string()),
                passport_number_hash: Some("secret_hash".to_string()),
                id_photo_url: None,
                language_cert_url: None,
                guide_license_url: None,
                stake_amount: "50".to_string(),
                hourly_rate: None,
                avatar_url: None,
            public_title: None,
                status: "active".to_string(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
                data_origin: "production".into(),
            },
        );
    }
    let resp = get_admin_guide_by_id(State(st), Path(gid.to_string()), auth_headers(admin.id))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    assert_eq!(body["guide"]["city"], "Shanghai");
    assert_eq!(body["guide"]["user_id"], uid.to_string());
    assert!(body["guide"].get("passport_number_hash").is_none());
}

#[tokio::test]
async fn admin_order_detail_forbidden_for_non_admin_actor() {
    let tourist = user_with_role("tourist");
    let oid = Uuid::new_v4();
    let resp = get_admin_order_by_id(
        State(build_state(vec![tourist.clone()])),
        Path(oid.to_string()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_order_detail_invalid_id_returns_400() {
    let admin = user_with_role("admin");
    let resp = get_admin_order_by_id(
        State(build_state(vec![admin.clone()])),
        Path("not-a-uuid".to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_order_id");
}

#[tokio::test]
async fn admin_order_detail_not_found() {
    let admin = user_with_role("admin");
    let oid = Uuid::new_v4();
    let resp = get_admin_order_by_id(
        State(build_state(vec![admin.clone()])),
        Path(oid.to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn admin_order_detail_ok_matches_public_order_shape() {
    let admin = user_with_role("admin");
    let tid = Uuid::new_v4();
    let gid = Uuid::new_v4();
    let oid = Uuid::new_v4();
    let now = Utc::now();
    let st = build_state(vec![admin.clone()]);
    {
        let co = st.chain_off.as_ref().unwrap();
        let mut store = co.store.write().await;
        store.orders.insert(
            oid,
            OrderRow {
                id: oid,
                tourist_id: tid,
                guide_id: gid,
                amount: "100".to_string(),
                currency: "USDT".to_string(),
                escrow_address: None,
                state: OrderState::Draft,
                created_at: now,
                accepted_at: None,
                escrowed_at: None,
                completed_at: None,
                dispute_deadline_at: None,
                auto_complete_at: None,
                updated_at: now,
                start_date: None,
                end_date: None,
                sub_status: None,
                tourist_confirmed: None,
                guide_confirmed: None,
                rating_tourist_confirmed: None,
                rating_guide_confirmed: None,
                chain_id: None,
                data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
            },
        );
    }
    let resp = get_admin_order_by_id(State(st), Path(oid.to_string()), auth_headers(admin.id))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    assert_eq!(body["order"]["id"], oid.to_string());
    assert_eq!(body["order"]["amount"], "100");
    let tid_str = tid.to_string();
    assert_eq!(body["order"]["tourist_id"].as_str().unwrap(), tid_str);
    assert_eq!(body["order"]["traveler_id"].as_str().unwrap(), tid_str);
}

#[tokio::test]
async fn admin_dispute_detail_forbidden_for_non_admin_actor() {
    let tourist = user_with_role("tourist");
    let did = Uuid::new_v4();
    let resp = get_admin_dispute_by_id(
        State(build_state(vec![tourist.clone()])),
        Path(did.to_string()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_dispute_detail_invalid_id_returns_400() {
    let admin = user_with_role("admin");
    let resp = get_admin_dispute_by_id(
        State(build_state(vec![admin.clone()])),
        Path("not-uuid".to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_dispute_id");
}

#[tokio::test]
async fn admin_dispute_detail_not_found() {
    let admin = user_with_role("admin");
    let did = Uuid::new_v4();
    let resp = get_admin_dispute_by_id(
        State(build_state(vec![admin.clone()])),
        Path(did.to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn admin_dispute_detail_ok_matches_public_dispute_shape() {
    let admin = user_with_role("admin");
    let oid = Uuid::new_v4();
    let did = Uuid::new_v4();
    let now = Utc::now();
    let st = build_state(vec![admin.clone()]);
    {
        let co = st.chain_off.as_ref().unwrap();
        let mut store = co.store.write().await;
        store.disputes.insert(
            did,
            DisputeRow {
                id: did,
                order_id: oid,
                status: "open".to_string(),
                evidence_hashes: vec!["0xabc".to_string()],
                arbitrator_id: None,
                refund_ratio: None,
                slash_guide: None,
                resolved_at: None,
                created_at: now,
                updated_at: now,
                arb_fee_paid: None,
                dispute_sequence: 1,
            },
        );
    }
    let resp =
        get_admin_dispute_by_id(State(st), Path(did.to_string()), auth_headers(admin.id))
            .await
            .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    assert_eq!(body["dispute"]["id"], did.to_string());
    assert_eq!(body["dispute"]["order_id"], oid.to_string());
    assert_eq!(body["dispute"]["status"], "open");
}

#[tokio::test]
async fn admin_user_detail_forbidden_for_non_admin_actor() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_user_by_id(
        State(build_state(vec![tourist.clone()])),
        Path(tourist.id.to_string()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_user_detail_invalid_id_returns_400() {
    let admin = user_with_role("admin");
    let resp = get_admin_user_by_id(
        State(build_state(vec![admin.clone()])),
        Path("nope".to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_user_id");
}

#[tokio::test]
async fn admin_user_detail_not_found() {
    let admin = user_with_role("admin");
    let uid = Uuid::new_v4();
    let resp = get_admin_user_by_id(
        State(build_state(vec![admin.clone()])),
        Path(uid.to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn admin_user_detail_ok_excludes_password_hash() {
    let admin = user_with_role("admin");
    let mut target = user_with_role("tourist");
    target.nickname = Some("nick".to_string());
    target.password_hash = Some("secret-hash".to_string());
    let tid = target.id;
    let st = build_state(vec![admin.clone(), target]);
    let resp = get_admin_user_by_id(State(st), Path(tid.to_string()), auth_headers(admin.id))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    assert_eq!(body["user"]["id"], tid.to_string());
    assert_eq!(body["user"]["nickname"], "nick");
    assert!(body["user"].get("password_hash").is_none());
}

#[tokio::test]
async fn admin_review_detail_forbidden_for_non_admin_actor() {
    let tourist = user_with_role("tourist");
    let rid = Uuid::new_v4();
    let resp = get_admin_review_by_id(
        State(build_state(vec![tourist.clone()])),
        Path(rid.to_string()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_review_detail_invalid_id_returns_400() {
    let admin = user_with_role("admin");
    let resp = get_admin_review_by_id(
        State(build_state(vec![admin.clone()])),
        Path("not-uuid".to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_review_id");
}

#[tokio::test]
async fn admin_review_detail_not_found() {
    let admin = user_with_role("admin");
    let rid = Uuid::new_v4();
    let resp = get_admin_review_by_id(
        State(build_state(vec![admin.clone()])),
        Path(rid.to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn admin_review_detail_ok_from_memory() {
    let admin = user_with_role("admin");
    let rid = Uuid::new_v4();
    let oid = Uuid::new_v4();
    let tid = Uuid::new_v4();
    let gid = Uuid::new_v4();
    let rv = Uuid::new_v4();
    let ee = Uuid::new_v4();
    let now = Utc::now();
    let st = build_state(vec![admin.clone()]);
    {
        let co = st.chain_off.as_ref().unwrap();
        let mut store = co.store.write().await;
        store.orders.insert(
            oid,
            OrderRow {
                id: oid,
                tourist_id: tid,
                guide_id: gid,
                amount: "10".to_string(),
                currency: "USD".to_string(),
                escrow_address: None,
                state: OrderState::Draft,
                created_at: now,
                accepted_at: None,
                escrowed_at: None,
                completed_at: None,
                dispute_deadline_at: None,
                auto_complete_at: None,
                updated_at: now,
                start_date: None,
                end_date: None,
                sub_status: None,
                tourist_confirmed: None,
                guide_confirmed: None,
                rating_tourist_confirmed: None,
                rating_guide_confirmed: None,
                chain_id: None,
                data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
            },
        );
        store.reviews.push(ReviewRow {
            id: rid,
            order_id: oid,
            reviewer_id: rv,
            reviewee_id: ee,
            score: 2,
            weight: 1.0,
            comment: Some("bad".to_string()),
            created_at: now,
        });
    }
    let resp = get_admin_review_by_id(State(st), Path(rid.to_string()), auth_headers(admin.id))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    assert_eq!(body["review"]["id"], rid.to_string());
    assert_eq!(body["review"]["score"], 2);
    assert_eq!(
        body["review"]["tourist_id"].as_str().unwrap(),
        tid.to_string()
    );
    assert_eq!(
        body["review"]["traveler_id"].as_str().unwrap(),
        tid.to_string()
    );
    assert_eq!(body["meta"]["source"], "memory");
    assert!(body["meta"]["build"].is_object());
}

#[tokio::test]
async fn admin_reviews_forbidden_for_non_admin_actor() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_reviews(
        State(build_state(vec![tourist.clone()])),
        Query(AdminReviewsQuery {
            limit: None,
            min_score: None,
            max_score: None,
        }),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_required");
}

#[tokio::test]
async fn admin_reviews_returns_ok_for_admin_empty_store() {
    let admin = user_with_role("admin");
    let resp = get_admin_reviews(
        State(build_state(vec![admin.clone()])),
        Query(AdminReviewsQuery {
            limit: Some(10),
            min_score: None,
            max_score: Some(2),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    assert_eq!(body["applied_filters"]["limit"], 10);
    assert_eq!(body["applied_filters"]["max_score"], 2);
    assert_eq!(body["applied_filters"]["source"], "memory");
    assert!(body["items"].as_array().unwrap().is_empty());
}

#[tokio::test]
async fn admin_observability_overview_requires_admin_role() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_observability_overview(
        State(build_state(vec![tourist.clone()])),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_required");
}

#[tokio::test]
async fn admin_observability_alert_rules_requires_admin_role() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_observability_alert_rules(
        State(build_state(vec![tourist.clone()])),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_observability_alert_rules_returns_rules_view_for_admin() {
    let admin = user_with_role("admin");
    let resp = get_admin_observability_alert_rules(
        State(build_state(vec![admin.clone()])),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    let rv = &body["rules_view"];
    assert_eq!(rv["schema_version"], 1);
    assert_eq!(rv["config_source"], "env");
    assert!(rv["config_fingerprint"].as_str().unwrap().len() >= 8);
    assert!(rv["effective_thresholds"]["INDEXER_LAG_MAX_BLOCKS_effective"].is_number());
    let meta_b = &body["meta"]["build"];
    assert!(meta_b["git_sha"].is_string());
}

#[tokio::test]
async fn admin_observability_overview_returns_min_snapshot_for_admin() {
    let admin = user_with_role("admin");
    let resp = get_admin_observability_overview(
        State(build_state(vec![admin.clone()])),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    assert_eq!(body["overview"]["alerts"]["active"], 0);
    let oa1 = &body["overview"]["observability_alerting_v1"];
    assert_eq!(oa1["anchor"], "OBSERVABILITY-THRESHOLD-ALERTS-V3");
    assert_eq!(oa1["schema_version"], 3);
    assert_eq!(oa1["rules_config"]["schema_version"], 1);
    assert_eq!(body["overview"]["alerts"]["active"], oa1["alert_summary"]["active"]);
    assert!(body["overview"]["rate_limits"]
        .get("api_requests_per_minute_per_client")
        .is_some());
    assert!(body["overview"]["chain_id"].is_string());
    let idx = &body["overview"]["indexer"];
    assert_eq!(idx["checkpoint"]["block_number"], 0);
    assert_eq!(idx["checkpoint"]["log_index"], 0);
    assert_eq!(idx["last_seen_finality_n"], 12);
    assert_eq!(idx["lag_max_blocks"], 0);
    assert_eq!(idx["finality_n"], 12);
    let b = &body["overview"]["build"];
    assert!(b["git_sha"].is_string());
    assert!(b["rule"].is_string());
    let meta_b = &body["meta"]["build"];
    assert!(meta_b["git_sha"].is_string());
    assert_eq!(meta_b["git_sha"], b["git_sha"]);
    let b153 = &body["overview"]["indexer_head_vs_db_latest_block_drift_observability"];
    assert_eq!(
        b153["anchor"].as_str(),
        Some("153-INDEXER-HEAD-VS-DB-LATEST-BLOCK-DRIFT-OBS-V1")
    );
    assert_eq!(b153["schema_version"], 1);
    assert_eq!(
        b153["observation_note"].as_str(),
        Some("database_pool_unavailable")
    );
    let b164 = &body["overview"]["fee_router_fee_routes_vs_routed_events_drift_observability"];
    assert_eq!(
        b164["anchor"].as_str(),
        Some(db::FEE_ROUTER_FEE_ROUTES_VS_ROUTED_EVENTS_DRIFT_ANCHOR)
    );
    assert_eq!(b164["schema_version"], 1);
    assert_eq!(
        b164["observation_note"].as_str(),
        Some("database_pool_unavailable")
    );
    let b165 = &body["overview"]["vault_forwards_vs_forwarded_events_drift_observability"];
    assert_eq!(
        b165["anchor"].as_str(),
        Some(db::VAULT_FORWARDS_VS_FORWARDED_EVENTS_DRIFT_ANCHOR)
    );
    assert_eq!(b165["schema_version"], 1);
    assert_eq!(
        b165["observation_note"].as_str(),
        Some("database_pool_unavailable")
    );
    let b161 = &body["overview"]["stake_lock_projection_block_lag_observability"];
    assert_eq!(
        b161["anchor"].as_str(),
        Some(db::STAKE_LOCK_PROJECTION_BLOCK_LAG_OBS_ANCHOR)
    );
    assert_eq!(b161["schema_version"], 1);
    assert_eq!(
        b161["observation_note"].as_str(),
        Some("database_pool_unavailable")
    );
    let b152 = &body["overview"]["governance_proposals_projection_null_fields_observability"];
    assert_eq!(
        b152["anchor"].as_str(),
        Some(db::GOVERNANCE_PROPOSALS_PROJECTION_NULL_FIELDS_OBS_ANCHOR)
    );
    assert_eq!(b152["schema_version"], 1);
    assert_eq!(
        b152["observation_note"].as_str(),
        Some("database_pool_unavailable")
    );
    let b155_amt = &body["overview"]["orders_amount_chain_vs_escrow_drift_observability"];
    assert_eq!(
        b155_amt["anchor"].as_str(),
        Some(db::ORDERS_AMOUNT_CHAIN_VS_ESCROW_DRIFT_ANCHOR)
    );
    assert_eq!(b155_amt["schema_version"], 1);
    assert_eq!(
        b155_amt["observation_note"].as_str(),
        Some("database_pool_unavailable")
    );
    let b168_escrow = &body["overview"]["escrow_status_chain_vs_orders_drift_observability"];
    assert_eq!(
        b168_escrow["anchor"].as_str(),
        Some(db::ESCROW_STATUS_CHAIN_VS_ORDERS_DRIFT_OBS_ANCHOR)
    );
    assert_eq!(b168_escrow["schema_version"], 1);
    assert_eq!(
        b168_escrow["observation_note"].as_str(),
        Some("database_pool_unavailable")
    );
    let b162_rpc_meta = &body["overview"]["rpc_escrow_sample_meta"];
    assert_eq!(
        b162_rpc_meta["anchor"].as_str(),
        Some(db::RPC_ESCROW_SAMPLE_META_ANCHOR)
    );
    assert_eq!(
        b162_rpc_meta["observation_note"].as_str(),
        Some("database_pool_unavailable")
    );
    let b160_ce = &body["overview"]["correction_executor_rows_observability"];
    assert_eq!(
        b160_ce["anchor"].as_str(),
        Some(db::CORRECTION_EXECUTOR_ROWS_OBS_ANCHOR)
    );
    assert_eq!(b160_ce["schema_version"], 1);
    assert_eq!(
        b160_ce["observation_note"].as_str(),
        Some("database_pool_unavailable")
    );
    let od = &body["overview"]["orders_deadline_ssot"];
    assert_eq!(
        od["anchor"].as_str(),
        Some("TT-B110-SEQ2-ORDERS-DEADLINE-ADMIN-DEBUG-HINT-001")
    );
    assert_eq!(od["chain_off_mounted"], json!(true));
    assert_eq!(
        od["review_window_days_source"].as_str(),
        Some("p3_review_window_days")
    );
    assert!(od["reconcile_probe_pass"].as_bool().unwrap());
    let op = &body["overview"]["orders_deadline_ssot_ops_check"];
    assert_eq!(
        op["anchor"].as_str(),
        Some("TT-B110-SEQ2-ORDERS-DEADLINE-OPS-CHECK-001")
    );
    assert_eq!(op["overall"], "ok");
    assert_eq!(op["exit_code_hint"], json!(0));
    assert_eq!(op["checks"]["reconcile_probe"]["status"], "ok");
}

#[tokio::test]
async fn admin_observability_overview_orders_deadline_ssot_chain_read_success_hint() {
    use tokio::io::AsyncWriteExt;
    use tokio::net::TcpListener;

    let _serial = crate::chain_off::order_deadline_ssot_parallel_test_guard();
    crate::chain_off::order_deadline_ssot_test_hook_reset();

    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    tokio::spawn(async move {
        for _ in 0..2 {
            let (mut socket, _) = listener.accept().await.unwrap();
            let _ = crate::jsonrpc_mock_server::read_http_request_headers_and_body(&mut socket)
                .await;
            let result =
                "0x000000000000000000000000000000000000000000000000000000000000002a";
            let payload = serde_json::json!({"jsonrpc":"2.0","id":1,"result":result});
            let payload = serde_json::to_vec(&payload).unwrap();
            let hdr = format!(
                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\nContent-Type: application/json\r\n\r\n",
                payload.len()
            );
            let _ = socket.write_all(hdr.as_bytes()).await;
            let _ = socket.write_all(&payload).await;
        }
    });
    tokio::task::yield_now().await;

    let mut co_cfg = ChainOffConfig::default();
    co_cfg.governance_order_deadline_chain_ssot = true;
    co_cfg.review_window_days = 7;

    let chain = crate::chain::ChainConfig {
        rpc_url: format!("http://127.0.0.1:{port}"),
        chain_id: 1,
        escrow_factory_address: None,
        fee_router_address: None,
        region_vault_address: None,
        country_pool_ledger_address: None,
        investor_share_token_addresses: vec![],
        staking_address: None,
        guide_staking_address: None,
        staking_provider_address: None,
        investor_lock_contract_addresses: vec![],
        governor_address: Some("0x0000000000000000000000000000000000000001".to_string()),
        governance_timelock_address: None,
        governance_votes_token_address: None,
        treasury_address: None,
        registry_address: None,
        executor_max_amount_per_tx: None,
        executor_max_amount_per_day: None,
        executor_retry_count: 3,
    };

    let admin = user_with_role("admin");
    let st = build_state_with_chain_off_config_and_chain_config(
        vec![admin.clone()],
        co_cfg,
        Some(chain),
    );
    let resp = get_admin_observability_overview(State(st), auth_headers(admin.id))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    let od = &body["overview"]["orders_deadline_ssot"];
    assert_eq!(od["review_window_days_source"].as_str(), Some("governance_ssot_chain_governor"));
    assert_eq!(od["review_window_days_effective"], json!(42));
    assert_eq!(od["reconcile_probe_leg"].as_str(), Some("eth_call_ok"));
    assert_eq!(od["reconcile_probe_pass"], json!(true));
    let op = &body["overview"]["orders_deadline_ssot_ops_check"];
    assert_eq!(op["overall"], "ok");
    assert_eq!(op["exit_code_hint"], json!(0));
    assert_eq!(op["degraded"], json!(false));
    assert_eq!(op["checks"]["governance_chain_read"]["status"], "ok");
    assert_eq!(op["checks"]["fallback_path"]["status"], "ok");
}

#[tokio::test]
async fn admin_observability_overview_orders_deadline_ssot_old_governor_fallback_hint() {
    use tokio::io::AsyncWriteExt;
    use tokio::net::TcpListener;

    let _serial = crate::chain_off::order_deadline_ssot_parallel_test_guard();
    crate::chain_off::order_deadline_ssot_test_hook_reset();

    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    tokio::spawn(async move {
        for _ in 0..2 {
            let (mut socket, _) = listener.accept().await.unwrap();
            let _ = crate::jsonrpc_mock_server::read_http_request_headers_and_body(&mut socket)
                .await;
            let payload = serde_json::json!({"jsonrpc":"2.0","id":1,"error":{"code":3,"message":"execution reverted"}});
            let payload = serde_json::to_vec(&payload).unwrap();
            let hdr = format!(
                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\nContent-Type: application/json\r\n\r\n",
                payload.len()
            );
            let _ = socket.write_all(hdr.as_bytes()).await;
            let _ = socket.write_all(&payload).await;
        }
    });
    tokio::task::yield_now().await;

    let mut co_cfg = ChainOffConfig::default();
    co_cfg.governance_order_deadline_chain_ssot = true;
    co_cfg.review_window_days = 11;

    let chain = crate::chain::ChainConfig {
        rpc_url: format!("http://127.0.0.1:{port}"),
        chain_id: 1,
        escrow_factory_address: None,
        fee_router_address: None,
        region_vault_address: None,
        country_pool_ledger_address: None,
        investor_share_token_addresses: vec![],
        staking_address: None,
        guide_staking_address: None,
        staking_provider_address: None,
        investor_lock_contract_addresses: vec![],
        governor_address: Some("0x0000000000000000000000000000000000000001".to_string()),
        governance_timelock_address: None,
        governance_votes_token_address: None,
        treasury_address: None,
        registry_address: None,
        executor_max_amount_per_tx: None,
        executor_max_amount_per_day: None,
        executor_retry_count: 3,
    };

    let admin = user_with_role("admin");
    let st = build_state_with_chain_off_config_and_chain_config(
        vec![admin.clone()],
        co_cfg,
        Some(chain),
    );
    let resp = get_admin_observability_overview(State(st), auth_headers(admin.id))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    let od = &body["overview"]["orders_deadline_ssot"];
    assert_eq!(
        od["review_window_days_source"].as_str(),
        Some("governance_ssot_fallback_p3")
    );
    assert_eq!(od["review_window_days_effective"], json!(11));
    assert_eq!(od["reconcile_probe_leg"].as_str(), Some("eth_call_failed"));
    assert_eq!(od["reconcile_probe_pass"], json!(true));
    let op = &body["overview"]["orders_deadline_ssot_ops_check"];
    assert_eq!(op["overall"], "ok");
    assert_eq!(op["exit_code_hint"], json!(0));
    assert_eq!(op["degraded"], json!(true));
    assert_eq!(op["checks"]["governance_chain_read"]["status"], "degraded");
    assert_eq!(op["checks"]["fallback_path"]["status"], "ok");
}

#[tokio::test]
async fn admin_observability_overview_orders_deadline_ssot_rpc_failure_fallback_hint() {
    let _serial = crate::chain_off::order_deadline_ssot_parallel_test_guard();
    crate::chain_off::order_deadline_ssot_test_hook_reset();

    let mut co_cfg = ChainOffConfig::default();
    co_cfg.governance_order_deadline_chain_ssot = true;
    co_cfg.review_window_days = 13;

    let chain = crate::chain::ChainConfig {
        rpc_url: "http://127.0.0.1:9".to_string(),
        chain_id: 1,
        escrow_factory_address: None,
        fee_router_address: None,
        region_vault_address: None,
        country_pool_ledger_address: None,
        investor_share_token_addresses: vec![],
        staking_address: None,
        guide_staking_address: None,
        staking_provider_address: None,
        investor_lock_contract_addresses: vec![],
        governor_address: Some("0x1111111111111111111111111111111111111111".to_string()),
        governance_timelock_address: None,
        governance_votes_token_address: None,
        treasury_address: None,
        registry_address: None,
        executor_max_amount_per_tx: None,
        executor_max_amount_per_day: None,
        executor_retry_count: 3,
    };

    let admin = user_with_role("admin");
    let st = build_state_with_chain_off_config_and_chain_config(
        vec![admin.clone()],
        co_cfg,
        Some(chain),
    );
    let resp = get_admin_observability_overview(State(st), auth_headers(admin.id))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    let od = &body["overview"]["orders_deadline_ssot"];
    assert_eq!(
        od["review_window_days_source"].as_str(),
        Some("governance_ssot_fallback_p3")
    );
    assert_eq!(od["review_window_days_effective"], json!(13));
    assert_eq!(od["reconcile_probe_leg"].as_str(), Some("eth_call_failed"));
    assert_eq!(od["reconcile_probe_pass"], json!(true));
    let op = &body["overview"]["orders_deadline_ssot_ops_check"];
    assert_eq!(op["overall"], "ok");
    assert_eq!(op["exit_code_hint"], json!(0));
    assert_eq!(op["degraded"], json!(true));
    assert_eq!(op["checks"]["governance_chain_read"]["status"], "degraded");
    assert_eq!(op["checks"]["fallback_path"]["status"], "ok");
}

#[tokio::test]
async fn admin_indexer_health_returns_ok_with_core_fields_for_admin() {
    let admin = user_with_role("admin");
    let resp = get_admin_indexer_health(
        State(build_state(vec![admin.clone()])),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    let h = &body["health"];
    assert_eq!(h["finality_n"], 12);
    assert!(h.get("checkpoint").is_some());
    assert!(h.get("runtime").is_some());
    assert!(h.get("last_seen_finality_n").is_some());
    let meta_b = &body["meta"]["build"];
    assert!(meta_b["git_sha"].is_string());
}

#[tokio::test]
async fn admin_alert_incident_returns_min_payload_for_admin() {
    let admin = user_with_role("admin");
    let incident_id = "INC-TEST-001".to_string();
    let resp = get_admin_alert_incident_by_id(
        State(build_state(vec![admin.clone()])),
        Path(incident_id.clone()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    assert_eq!(body["incident"]["id"], incident_id);
}

#[tokio::test]
async fn admin_reconcile_report_returns_min_contract_response() {
    let admin = user_with_role("admin");
    let report_id = "reconcile-001".to_string();
    let resp = get_admin_indexer_reconcile_report(
        State(build_state(vec![admin.clone()])),
        Path(report_id.clone()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    assert_eq!(body["report"]["id"], report_id);
    assert_eq!(body["report"]["state"], "target");
}

#[tokio::test]
async fn admin_reconcile_report_latest_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_indexer_reconcile_report(
        State(build_state(vec![admin.clone()])),
        Path("latest".to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_reconcile_reports_list_requires_db() {
    use axum::extract::Query;
    let admin = user_with_role("admin");
    let resp = get_admin_indexer_reconcile_reports(
        State(build_state(vec![admin.clone()])),
        Query(AdminReconcileReportsQuery {
            limit: 30,
            offset: 0,
            report_type: None,
            chain_id: None,
            projection_reconcile_clean: None,
            issues_min: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[test]
fn reconcile_reports_list_to_csv_empty_has_header_row() {
    let csv = reconcile_reports_list_to_csv(&[]);
    assert!(csv.starts_with(
        "id,report_type,chain_id,created_at,issues_total,projection_reconcile_clean,"
    ));
    assert_eq!(csv.lines().count(), 1);
}

#[test]
fn reconcile_export_response_sha256_hex_empty_body() {
    assert_eq!(
        reconcile_export_response_sha256_hex(b""),
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
}

#[test]
fn reconcile_export_ed25519_sign_verify_roundtrip() {
    use ed25519_dalek::{Signature, Verifier};
    let seed = [11u8; 32];
    let sk = ed25519_dalek::SigningKey::from_bytes(&seed);
    let body = b"hello export";
    let hex_sig = reconcile_export_ed25519_hex(Some(&sk), body).expect("sig");
    let raw = hex::decode(&hex_sig).expect("hex decode");
    let sa: [u8; 64] = raw.try_into().expect("len 64");
    let sig = Signature::from_bytes(&sa);
    sk.verifying_key()
        .verify(body, &sig)
        .expect("ed25519 verify export body");
}

#[test]
fn parse_reconcile_export_list_mode_accepts_all_alias() {
    assert!(matches!(
        parse_reconcile_export_list_mode(Some(&"ALL".to_string())),
        Ok(ReconcileExportListMode::AllFiltered)
    ));
    assert!(matches!(
        parse_reconcile_export_list_mode(Some(&"filtered_all".to_string())),
        Ok(ReconcileExportListMode::AllFiltered)
    ));
    assert!(matches!(
        parse_reconcile_export_list_mode(None),
        Ok(ReconcileExportListMode::Page)
    ));
}

#[tokio::test]
async fn admin_reconcile_reports_export_rejects_unknown_format() {
    use axum::extract::Query;
    let admin = user_with_role("admin");
    let resp = get_admin_indexer_reconcile_reports_export(
        State(build_state(vec![admin.clone()])),
        Query(AdminReconcileReportsExportQuery {
            filters: AdminReconcileReportsQuery {
                limit: 30,
                offset: 0,
                report_type: None,
                chain_id: None,
                projection_reconcile_clean: None,
                issues_min: None,
            },
            format: "xlsx".to_string(),
            export_scope: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "bad_request");
    assert_eq!(
        body["message"].as_str().unwrap_or(""),
        "format must be csv or json"
    );
}

#[tokio::test]
async fn admin_reconcile_reports_export_json_requires_db() {
    use axum::extract::Query;
    let admin = user_with_role("admin");
    let resp = get_admin_indexer_reconcile_reports_export(
        State(build_state(vec![admin.clone()])),
        Query(AdminReconcileReportsExportQuery {
            filters: AdminReconcileReportsQuery {
                limit: 30,
                offset: 0,
                report_type: None,
                chain_id: None,
                projection_reconcile_clean: None,
                issues_min: None,
            },
            format: "json".to_string(),
            export_scope: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_reconcile_reports_export_requires_db() {
    use axum::extract::Query;
    let admin = user_with_role("admin");
    let resp = get_admin_indexer_reconcile_reports_export(
        State(build_state(vec![admin.clone()])),
        Query(AdminReconcileReportsExportQuery {
            filters: AdminReconcileReportsQuery {
                limit: 30,
                offset: 0,
                report_type: None,
                chain_id: None,
                projection_reconcile_clean: None,
                issues_min: None,
            },
            format: "csv".to_string(),
            export_scope: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_reconcile_reports_export_rejects_bad_export_scope() {
    use axum::extract::Query;
    let admin = user_with_role("admin");
    let resp = get_admin_indexer_reconcile_reports_export(
        State(build_state(vec![admin.clone()])),
        Query(AdminReconcileReportsExportQuery {
            filters: AdminReconcileReportsQuery {
                limit: 30,
                offset: 0,
                report_type: None,
                chain_id: None,
                projection_reconcile_clean: None,
                issues_min: None,
            },
            format: "csv".to_string(),
            export_scope: Some("nope".to_string()),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "bad_request");
    assert_eq!(
        body["message"].as_str().unwrap_or(""),
        "export_scope must be page or all"
    );
}

#[tokio::test]
async fn admin_audit_operations_returns_min_payload_for_admin() {
    let admin = user_with_role("admin");
    let resp = get_admin_audit_operations(
        State(build_state(vec![admin.clone()])),
        Query(AdminAuditOperationsQuery { limit: None }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    assert_eq!(body["status"], "ok");
    let ops = body["operations"].as_array().expect("operations array");
    assert_eq!(body["applied_filters"]["limit"], 50);
    assert_eq!(body["applied_filters"]["source"], "action_catalog_v1");
    let total = ADMIN_AUDIT_ACTION_CODES.len();
    assert_eq!(body["catalog_total"], total);
    assert_eq!(body["returned"], 50.min(total));
    assert_eq!(ops.len(), 50.min(total));
    assert_eq!(ops[0]["code"].as_str(), Some("admin.alert.incident.read"));
    assert_eq!(ops[0]["mutating"].as_bool(), Some(false));
}

#[tokio::test]
async fn admin_audit_operations_limit_200_returns_full_catalog() {
    let admin = user_with_role("admin");
    let resp = get_admin_audit_operations(
        State(build_state(vec![admin.clone()])),
        Query(AdminAuditOperationsQuery { limit: Some(200) }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = body_json(resp).await;
    let total = ADMIN_AUDIT_ACTION_CODES.len();
    let ops = body["operations"].as_array().expect("operations array");
    assert_eq!(body["catalog_total"], total);
    assert_eq!(body["returned"], total);
    assert_eq!(ops.len(), total);
    assert_eq!(
        ops[total - 1]["code"].as_str(),
        Some(ADMIN_AUDIT_ACTION_CODES[total - 1])
    );
}

#[tokio::test]
async fn admin_audit_log_detail_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let lid = Uuid::new_v4();
    let resp = get_admin_audit_log_by_id(
        State(build_state(vec![tourist.clone()])),
        Path(lid.to_string()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_audit_log_detail_invalid_id_returns_400() {
    let admin = user_with_role("admin");
    let resp = get_admin_audit_log_by_id(
        State(build_state(vec![admin.clone()])),
        Path("not-a-uuid".to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_audit_log_id");
}

#[tokio::test]
async fn admin_audit_log_detail_requires_db() {
    let admin = user_with_role("admin");
    let lid = Uuid::new_v4();
    let resp = get_admin_audit_log_by_id(
        State(build_state(vec![admin.clone()])),
        Path(lid.to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_fee_router_routed_events_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_fee_router_routed_events(
        State(build_state(vec![admin.clone()])),
        Query(AdminFeeRouterRoutedQuery {
            limit: Some(10),
            cursor: None,
            chain_id: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_fee_router_routed_events_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_fee_router_routed_events(
        State(build_state(vec![tourist.clone()])),
        Query(AdminFeeRouterRoutedQuery {
            limit: None,
            cursor: None,
            chain_id: None,
        }),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_required");
}

#[tokio::test]
async fn admin_fee_router_routed_events_limit_zero_returns_400_before_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_fee_router_routed_events(
        State(build_state(vec![admin.clone()])),
        Query(AdminFeeRouterRoutedQuery {
            limit: Some(0),
            cursor: None,
            chain_id: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_limit");
}

#[tokio::test]
async fn admin_fee_router_routed_events_bad_cursor_returns_400_before_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_fee_router_routed_events(
        State(build_state(vec![admin.clone()])),
        Query(AdminFeeRouterRoutedQuery {
            limit: None,
            cursor: Some("x:y:z".to_string()),
            chain_id: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_cursor");
}

#[tokio::test]
async fn admin_region_vault_forwarded_events_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_region_vault_forwarded_events(
        State(build_state(vec![admin.clone()])),
        Query(AdminRegionVaultForwardedQuery {
            limit: Some(10),
            cursor: None,
            chain_id: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_region_vault_forwarded_events_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_region_vault_forwarded_events(
        State(build_state(vec![tourist.clone()])),
        Query(AdminRegionVaultForwardedQuery {
            limit: None,
            cursor: None,
            chain_id: None,
        }),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_required");
}

#[tokio::test]
async fn admin_region_vault_forwarded_events_limit_zero_returns_400_before_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_region_vault_forwarded_events(
        State(build_state(vec![admin.clone()])),
        Query(AdminRegionVaultForwardedQuery {
            limit: Some(0),
            cursor: None,
            chain_id: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_limit");
}

#[tokio::test]
async fn admin_region_vault_forwarded_events_bad_cursor_returns_400_before_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_region_vault_forwarded_events(
        State(build_state(vec![admin.clone()])),
        Query(AdminRegionVaultForwardedQuery {
            limit: None,
            cursor: Some("-1:0".to_string()),
            chain_id: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_cursor");
}

/// 可复核 curl（**`TOKEN`** / **`BASE`** 替换为运行环境）：
/// `curl -sS -D - -o vault-forwarded.csv -H "Authorization: Bearer TOKEN" "${BASE}/api/v1/admin/region-vault/forwarded-events/export?format=csv"`
#[tokio::test]
async fn admin_region_vault_forwarded_events_export_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_region_vault_forwarded_events_export(
        State(build_state(vec![admin.clone()])),
        Query(AdminRegionVaultForwardedExportQuery {
            format: "csv".to_string(),
            chain_id: None,
            limit: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_region_vault_forwarded_events_export_not_impl_without_chain_off() {
    let admin = user_with_role("admin");
    assert_chain_off_not_impl(
        get_admin_region_vault_forwarded_events_export(
            State(state_no_chain_off()),
            Query(AdminRegionVaultForwardedExportQuery {
                format: "csv".to_string(),
                chain_id: None,
                limit: None,
            }),
            auth_headers(admin.id),
        )
        .await
        .into_response(),
        "GET /api/v1/admin/region-vault/forwarded-events/export",
    )
    .await;
}

#[tokio::test]
async fn admin_region_vault_forwarded_events_export_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_region_vault_forwarded_events_export(
        State(build_state(vec![tourist.clone()])),
        Query(AdminRegionVaultForwardedExportQuery {
            format: "csv".to_string(),
            chain_id: None,
            limit: None,
        }),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_required");
}

#[tokio::test]
async fn admin_region_vault_forwarded_events_export_bad_format_returns_400_before_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_region_vault_forwarded_events_export(
        State(build_state(vec![admin.clone()])),
        Query(AdminRegionVaultForwardedExportQuery {
            format: "xml".to_string(),
            chain_id: None,
            limit: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "bad_request");
}

#[tokio::test]
async fn admin_region_vault_forwarded_events_export_limit_zero_returns_400_before_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_region_vault_forwarded_events_export(
        State(build_state(vec![admin.clone()])),
        Query(AdminRegionVaultForwardedExportQuery {
            format: "csv".to_string(),
            chain_id: None,
            limit: Some(0),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_limit");
}

#[test]
fn region_vault_forwarded_export_csv_empty_rows_header_only() {
    let csv = super::region_vault_forwarded_export_csv(&[]);
    assert_eq!(
        csv,
        "chain_id,block_number,log_index,block_hash,tx_hash,vault_address,token_address,to_address,amount_u256_hex,inserted_at,id\n"
    );
}

#[test]
fn region_vault_forwarded_export_csv_one_row_matches_sha256_of_body() {
    use sha2::{Digest, Sha256};
    let now = Utc::now();
    let id = Uuid::nil();
    let row = db::RegionVaultForwardedEventRow {
        id,
        chain_id: 1,
        block_number: 10,
        log_index: 2,
        block_hash: "0xbb".to_string(),
        tx_hash: "0xcc".to_string(),
        vault_address: "0xvv".to_string(),
        token_address: "0xtt".to_string(),
        to_address: "0xto".to_string(),
        amount_u256_hex: "0x1".to_string(),
        inserted_at: now,
    };
    let csv = super::region_vault_forwarded_export_csv(std::slice::from_ref(&row));
    assert!(csv.starts_with(
        "chain_id,block_number,log_index,block_hash,tx_hash,vault_address,token_address,to_address,amount_u256_hex,inserted_at,id\n"
    ));
    let lines: Vec<&str> = csv.lines().collect();
    assert_eq!(lines.len(), 2);
    assert!(lines[1].contains(&id.to_string()));
    let sha_api = super::reconcile_export_response_sha256_hex(csv.as_bytes());
    assert_eq!(sha_api.len(), 64);
    assert_eq!(sha_api, hex::encode(Sha256::digest(csv.as_bytes())));
}

#[tokio::test]
async fn admin_flags_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_flags(
        State(build_state(vec![admin.clone()])),
        Query(AdminFlagsQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_flags_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_flags(
        State(build_state(vec![tourist.clone()])),
        Query(AdminFlagsQuery::default()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_flags_invalid_enabled_returns_400() {
    let admin = user_with_role("admin");
    let resp = get_admin_flags(
        State(build_state(vec![admin.clone()])),
        Query(AdminFlagsQuery {
            limit: None,
            flag_code: None,
            enabled: Some("maybe".to_string()),
            scope: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_feature_flag_enabled_filter");
}

#[tokio::test]
async fn admin_secrets_metadata_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_secrets_metadata(
        State(build_state(vec![admin.clone()])),
        Query(AdminSecretsMetadataQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn admin_secrets_metadata_invalid_status_returns_400() {
    let admin = user_with_role("admin");
    let resp = get_admin_secrets_metadata(
        State(build_state(vec![admin.clone()])),
        Query(AdminSecretsMetadataQuery {
            limit: None,
            key_alias: None,
            status: Some("nope".to_string()),
            env_scope: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_secret_metadata_status");
}

#[tokio::test]
async fn admin_secrets_metadata_invalid_env_scope_returns_400() {
    let admin = user_with_role("admin");
    let resp = get_admin_secrets_metadata(
        State(build_state(vec![admin.clone()])),
        Query(AdminSecretsMetadataQuery {
            limit: None,
            key_alias: None,
            status: None,
            env_scope: Some("bad scope!".to_string()),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_secret_metadata_env_scope");
}

#[tokio::test]
async fn admin_flag_publish_requires_super_admin() {
    let admin = user_with_role("admin");
    let resp = post_admin_flag_publish(
        State(build_state(vec![admin.clone()])),
        Path(Uuid::new_v4().to_string()),
        auth_headers(admin.id),
        Json(AdminFlagPublishBody {
            enabled: true,
            rollout_percent: None,
            region: None,
            expected_version: 1,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_permission_denied");
}

#[tokio::test]
async fn admin_flag_publish_invalid_uuid() {
    let sa = user_with_role("super_admin");
    let resp = post_admin_flag_publish(
        State(build_state(vec![sa.clone()])),
        Path("not-a-uuid".to_string()),
        auth_headers(sa.id),
        Json(AdminFlagPublishBody {
            enabled: true,
            rollout_percent: None,
            region: None,
            expected_version: 1,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_jobs_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_jobs(
        State(build_state(vec![admin.clone()])),
        Query(AdminJobsQuery {
            limit: None,
            status: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn admin_jobs_invalid_status_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_jobs(
        State(build_state(vec![admin.clone()])),
        Query(AdminJobsQuery {
            limit: None,
            status: Some("nope".to_string()),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_job_status_filter");
}

#[tokio::test]
async fn admin_scheduler_jobs_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_scheduler_jobs(
        State(build_state(vec![admin.clone()])),
        Query(AdminSchedulerJobsQuery {
            limit: None,
            job_code: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn admin_scheduler_jobs_invalid_job_code_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_scheduler_jobs(
        State(build_state(vec![admin.clone()])),
        Query(AdminSchedulerJobsQuery {
            limit: None,
            job_code: Some("bad code!".to_string()),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_job_code");
}

#[tokio::test]
async fn admin_config_releases_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_config_releases(
        State(build_state(vec![admin.clone()])),
        Query(AdminConfigReleasesQuery {
            limit: None,
            release_key: None,
            status: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn admin_config_releases_invalid_status_returns_400() {
    let admin = user_with_role("admin");
    let resp = get_admin_config_releases(
        State(build_state(vec![admin.clone()])),
        Query(AdminConfigReleasesQuery {
            limit: None,
            release_key: None,
            status: Some("nope".to_string()),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_config_release_status");
}

#[tokio::test]
async fn admin_config_release_by_id_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_config_release_by_id(
        State(build_state(vec![admin.clone()])),
        Path(Uuid::new_v4().to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_config_release_by_id_invalid_uuid_returns_400() {
    let admin = user_with_role("admin");
    let resp = get_admin_config_release_by_id(
        State(build_state(vec![admin.clone()])),
        Path("not-a-uuid".to_string()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_config_release_id");
}

#[tokio::test]
async fn admin_api_versions_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_api_versions(
        State(build_state(vec![admin.clone()])),
        Query(AdminApiVersionsQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_api_versions_invalid_status_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_api_versions(
        State(build_state(vec![admin.clone()])),
        Query(AdminApiVersionsQuery {
            limit: None,
            api_version: None,
            status: Some("nope".to_string()),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_admin_api_version_status_filter");
}

#[tokio::test]
async fn admin_api_versions_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_api_versions(
        State(build_state(vec![tourist.clone()])),
        Query(AdminApiVersionsQuery::default()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_lifecycle_state_machines_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_lifecycle_state_machines(
        State(build_state(vec![admin.clone()])),
        Query(AdminLifecycleStateMachinesQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_lifecycle_state_machines_invalid_anomaly_flag_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_lifecycle_state_machines(
        State(build_state(vec![admin.clone()])),
        Query(AdminLifecycleStateMachinesQuery {
            limit: None,
            machine_code: None,
            domain: None,
            entity_type: None,
            version: None,
            source_of_truth: None,
            anomaly_flag: Some("maybe".to_string()),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_lifecycle_anomaly_flag_filter");
}

#[tokio::test]
async fn admin_lifecycle_state_machines_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_lifecycle_state_machines(
        State(build_state(vec![tourist.clone()])),
        Query(AdminLifecycleStateMachinesQuery::default()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_policies_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_policies(
        State(build_state(vec![admin.clone()])),
        Query(AdminPoliciesQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_policies_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_policies(
        State(build_state(vec![tourist.clone()])),
        Query(AdminPoliciesQuery::default()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_policies_invalid_status_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_policies(
        State(build_state(vec![admin.clone()])),
        Query(AdminPoliciesQuery {
            limit: None,
            policy_code: None,
            status: Some("live".to_string()),
            scope_type: None,
            binding_role: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_admin_policy_status_filter");
}

#[tokio::test]
async fn admin_tenant_scopes_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_tenant_scopes(
        State(build_state(vec![admin.clone()])),
        Query(AdminTenantScopesQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_tenant_scopes_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_tenant_scopes(
        State(build_state(vec![tourist.clone()])),
        Query(AdminTenantScopesQuery::default()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_tenant_scopes_invalid_status_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_tenant_scopes(
        State(build_state(vec![admin.clone()])),
        Query(AdminTenantScopesQuery {
            limit: None,
            tenant_key: None,
            region_code: None,
            status: Some("retired".to_string()),
            scope_class: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_tenant_scope_status_filter");
}

#[tokio::test]
async fn admin_tenant_scopes_invalid_scope_class_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_tenant_scopes(
        State(build_state(vec![admin.clone()])),
        Query(AdminTenantScopesQuery {
            limit: None,
            tenant_key: None,
            region_code: None,
            status: None,
            scope_class: Some("invalid_class".to_string()),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_tenant_scope_class_filter");
}

#[tokio::test]
async fn admin_tenant_scope_publish_requires_super_admin() {
    let admin = user_with_role("admin");
    let resp = post_admin_tenant_scope_publish(
        State(build_state(vec![admin.clone()])),
        Path(Uuid::new_v4().to_string()),
        auth_headers(admin.id),
        Json(AdminTenantScopePublishBody {
            status: "active".to_string(),
            expected_version: 1,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_permission_denied");
}

#[tokio::test]
async fn admin_tenant_scope_publish_invalid_uuid() {
    let sa = user_with_role("super_admin");
    let resp = post_admin_tenant_scope_publish(
        State(build_state(vec![sa.clone()])),
        Path("not-uuid".to_string()),
        auth_headers(sa.id),
        Json(AdminTenantScopePublishBody {
            status: "active".to_string(),
            expected_version: 1,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_tenant_scope_publish_invalid_status() {
    let sa = user_with_role("super_admin");
    let resp = post_admin_tenant_scope_publish(
        State(build_state(vec![sa.clone()])),
        Path(Uuid::new_v4().to_string()),
        auth_headers(sa.id),
        Json(AdminTenantScopePublishBody {
            status: "nope".to_string(),
            expected_version: 1,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_community_reports_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_reports(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityReportsQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_community_reports_invalid_status_filter() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_reports(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityReportsQuery {
            status: Some("nope".to_string()),
            ..Default::default()
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_community_reports_invalid_reporter_id_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_reports(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityReportsQuery {
            reporter_id: Some("bad".to_string()),
            ..Default::default()
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(
        body["error"],
        "invalid_community_reports_reporter_id_filter"
    );
}

#[tokio::test]
async fn admin_community_reports_invalid_target_id_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_reports(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityReportsQuery {
            target_id: Some("nope".to_string()),
            ..Default::default()
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_community_reports_target_id_filter");
}

#[tokio::test]
async fn admin_community_reports_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_community_reports(
        State(build_state(vec![tourist.clone()])),
        Query(AdminCommunityReportsQuery::default()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_community_appeals_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_appeals(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityAppealsQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_community_appeals_invalid_status_filter() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_appeals(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityAppealsQuery {
            status: Some("nope".to_string()),
            ..Default::default()
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_community_appeals_invalid_report_id() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_appeals(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityAppealsQuery {
            report_id: Some("not-a-uuid".to_string()),
            ..Default::default()
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_community_moderation_invalid_uuid() {
    let admin = user_with_role("admin");
    let resp = patch_admin_community_moderation(
        State(build_state(vec![admin.clone()])),
        Path("bad".to_string()),
        auth_headers(admin.id),
        Json(AdminCommunityModerationBody {
            expected_version: 1,
            status: "open".to_string(),
            admin_notes: None,
            disposition: None,
            record_penalty: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_community_penalties_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_penalties(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityPenaltiesQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn admin_community_penalties_invalid_subject_uuid() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_penalties(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityPenaltiesQuery {
            subject_user_id: Some("not-a-uuid".to_string()),
            ..Default::default()
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_community_penalties_invalid_status_filter() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_penalties(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityPenaltiesQuery {
            status: Some("nope".to_string()),
            ..Default::default()
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_community_moderation_cases_invalid_actor_id_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_moderation_cases(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityModerationCasesQuery {
            actor_id: Some("bad".to_string()),
            ..Default::default()
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(
        body["error"],
        "invalid_moderation_cases_query_actor_id_filter"
    );
}

#[tokio::test]
async fn post_admin_community_penalty_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = post_admin_community_penalty(
        State(build_state(vec![tourist.clone()])),
        auth_headers(tourist.id),
        Json(AdminCommunityPenaltyCreateBody {
            subject_user_id: Uuid::new_v4().to_string(),
            action: "warn".to_string(),
            report_id: None,
            reason: None,
            expires_at: None,
            metadata: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn patch_admin_community_comment_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = patch_admin_community_comment(
        State(build_state(vec![tourist.clone()])),
        Path(Uuid::new_v4().to_string()),
        auth_headers(tourist.id),
        Json(AdminCommunityCommentVisibilityBody {
            visibility_status: "hidden".to_string(),
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn patch_admin_community_comment_requires_db() {
    let admin = user_with_role("admin");
    let resp = patch_admin_community_comment(
        State(build_state(vec![admin.clone()])),
        Path(Uuid::new_v4().to_string()),
        auth_headers(admin.id),
        Json(AdminCommunityCommentVisibilityBody {
            visibility_status: "hidden".to_string(),
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn get_admin_community_risk_signals_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_risk_signals(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityRiskSignalsQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn get_admin_community_policy_change_logs_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_policy_change_logs(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityPolicyChangeLogsQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn admin_community_policy_change_logs_invalid_actor_id_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_policy_change_logs(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityPolicyChangeLogsQuery {
            actor_id: Some("x".to_string()),
            ..Default::default()
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(
        body["error"],
        "invalid_community_policy_change_logs_actor_id_filter"
    );
}

#[tokio::test]
async fn patch_admin_community_abuse_policy_requires_super_admin() {
    let admin = user_with_role("admin");
    let resp = patch_admin_community_abuse_policy(
        State(build_state(vec![admin.clone()])),
        auth_headers(admin.id),
        Json(db::CommunityAbusePolicyPatch {
            comment_max_per_window: Some(25),
            ..Default::default()
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn patch_admin_community_abuse_policy_empty_patch_bad_request() {
    let sa = user_with_role("super_admin");
    let resp = patch_admin_community_abuse_policy(
        State(build_state(vec![sa.clone()])),
        auth_headers(sa.id),
        Json(db::CommunityAbusePolicyPatch::default()),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn patch_admin_community_abuse_policy_requires_db() {
    let sa = user_with_role("super_admin");
    let resp = patch_admin_community_abuse_policy(
        State(build_state(vec![sa.clone()])),
        auth_headers(sa.id),
        Json(db::CommunityAbusePolicyPatch {
            comment_max_per_window: Some(25),
            ..Default::default()
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn admin_community_appeal_review_requires_super_admin() {
    let admin = user_with_role("admin");
    let resp = post_admin_community_appeal_review(
        State(build_state(vec![admin.clone()])),
        Path(Uuid::new_v4().to_string()),
        auth_headers(admin.id),
        Json(AdminCommunityAppealReviewBody {
            expected_version: 1,
            decision: "accepted".to_string(),
            reviewer_note: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_community_appeal_review_invalid_uuid() {
    let sa = user_with_role("super_admin");
    let resp = post_admin_community_appeal_review(
        State(build_state(vec![sa.clone()])),
        Path("not-uuid".to_string()),
        auth_headers(sa.id),
        Json(AdminCommunityAppealReviewBody {
            expected_version: 1,
            decision: "rejected".to_string(),
            reviewer_note: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_community_ranking_snapshots_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_community_ranking_snapshots(
        State(build_state(vec![admin.clone()])),
        Query(AdminCommunityRankingSnapshotsQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn admin_compliance_data_requests_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_compliance_data_requests(
        State(build_state(vec![admin.clone()])),
        Query(AdminComplianceDataRequestsQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_compliance_data_requests_invalid_status_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_compliance_data_requests(
        State(build_state(vec![admin.clone()])),
        Query(AdminComplianceDataRequestsQuery {
            limit: None,
            request_ref: None,
            subject_id: None,
            request_type: None,
            status: Some("bogus".to_string()),
            jurisdiction: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_compliance_request_status_filter");
}

#[tokio::test]
async fn admin_compliance_data_requests_invalid_type_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_compliance_data_requests(
        State(build_state(vec![admin.clone()])),
        Query(AdminComplianceDataRequestsQuery {
            limit: None,
            request_ref: None,
            subject_id: None,
            request_type: Some("delete_all".to_string()),
            status: None,
            jurisdiction: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_compliance_request_type_filter");
}

#[tokio::test]
async fn admin_compliance_data_requests_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_compliance_data_requests(
        State(build_state(vec![tourist.clone()])),
        Query(AdminComplianceDataRequestsQuery::default()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_internal_tool_audits_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_internal_tool_audits(
        State(build_state(vec![admin.clone()])),
        Query(AdminInternalToolAuditsQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_internal_tool_audits_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_internal_tool_audits(
        State(build_state(vec![tourist.clone()])),
        Query(AdminInternalToolAuditsQuery::default()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_internal_tool_audits_invalid_approval_id_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_internal_tool_audits(
        State(build_state(vec![admin.clone()])),
        Query(AdminInternalToolAuditsQuery {
            limit: None,
            tool_id: None,
            action_code: None,
            actor_id: None,
            approval_request_id: Some("not-a-uuid".to_string()),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(
        body["error"],
        "invalid_internal_tool_audit_approval_request_id_filter"
    );
}

#[tokio::test]
async fn admin_media_access_logs_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_media_access_logs(
        State(build_state(vec![admin.clone()])),
        Query(AdminMediaAccessLogsQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_media_access_logs_forbidden_for_non_admin() {
    let tourist = user_with_role("tourist");
    let resp = get_admin_media_access_logs(
        State(build_state(vec![tourist.clone()])),
        Query(AdminMediaAccessLogsQuery::default()),
        auth_headers(tourist.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_media_access_logs_invalid_action_filter() {
    let admin = user_with_role("admin");
    let resp = get_admin_media_access_logs(
        State(build_state(vec![admin.clone()])),
        Query(AdminMediaAccessLogsQuery {
            limit: None,
            action: Some("bad!action".to_string()),
            object_id: None,
            actor_or_ip: None,
            token_id: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_media_access_logs_action");
}

#[tokio::test]
async fn admin_media_access_logs_invalid_token_id_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_media_access_logs(
        State(build_state(vec![admin.clone()])),
        Query(AdminMediaAccessLogsQuery {
            limit: None,
            action: None,
            object_id: None,
            actor_or_ip: None,
            token_id: Some("not-a-uuid".to_string()),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "invalid_media_access_logs_token_id_filter");
}

#[tokio::test]
async fn admin_media_signed_url_tokens_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_media_signed_url_tokens(
        State(build_state(vec![admin.clone()])),
        Query(AdminMediaSignedUrlTokensQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_media_signed_url_tokens_invalid_scope_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_media_signed_url_tokens(
        State(build_state(vec![admin.clone()])),
        Query(AdminMediaSignedUrlTokensQuery {
            limit: None,
            object_id: None,
            url_scope: Some("stream".to_string()),
            issued_to: None,
            token_id: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(
        body["error"],
        "invalid_media_signed_url_tokens_scope_filter"
    );
}

#[tokio::test]
async fn admin_media_signed_url_tokens_invalid_issued_to_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_media_signed_url_tokens(
        State(build_state(vec![admin.clone()])),
        Query(AdminMediaSignedUrlTokensQuery {
            limit: None,
            object_id: None,
            url_scope: None,
            issued_to: Some("x".to_string()),
            token_id: None,
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(
        body["error"],
        "invalid_media_signed_url_tokens_issued_to_filter"
    );
}

#[tokio::test]
async fn admin_media_signed_url_tokens_invalid_token_id_returns_400_without_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_media_signed_url_tokens(
        State(build_state(vec![admin.clone()])),
        Query(AdminMediaSignedUrlTokensQuery {
            limit: None,
            object_id: None,
            url_scope: None,
            issued_to: None,
            token_id: Some("nope".to_string()),
        }),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = body_json(resp).await;
    assert_eq!(
        body["error"],
        "invalid_media_signed_url_tokens_token_id_filter"
    );
}

#[tokio::test]
async fn admin_policy_publish_requires_super_admin() {
    let admin = user_with_role("admin");
    let resp = post_admin_policy_publish(
        State(build_state(vec![admin.clone()])),
        Path(Uuid::new_v4().to_string()),
        auth_headers(admin.id),
        Json(AdminPolicyPublishBody {
            status: "active".to_string(),
            expected_version: 1,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_permission_denied");
}

#[tokio::test]
async fn admin_policy_publish_invalid_uuid() {
    let sa = user_with_role("super_admin");
    let resp = post_admin_policy_publish(
        State(build_state(vec![sa.clone()])),
        Path("not-uuid".to_string()),
        auth_headers(sa.id),
        Json(AdminPolicyPublishBody {
            status: "active".to_string(),
            expected_version: 1,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_policy_publish_invalid_status() {
    let sa = user_with_role("super_admin");
    let resp = post_admin_policy_publish(
        State(build_state(vec![sa.clone()])),
        Path(Uuid::new_v4().to_string()),
        auth_headers(sa.id),
        Json(AdminPolicyPublishBody {
            status: "nope".to_string(),
            expected_version: 1,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_compliance_data_request_events_requires_db() {
    let admin = user_with_role("admin");
    let resp = get_admin_compliance_data_request_events(
        State(build_state(vec![admin.clone()])),
        Path(Uuid::new_v4().to_string()),
        Query(AdminComplianceDataRequestEventsQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = body_json(resp).await;
    assert_eq!(body["error"], "admin_db_required");
}

#[tokio::test]
async fn admin_compliance_data_request_events_invalid_uuid() {
    let admin = user_with_role("admin");
    let resp = get_admin_compliance_data_request_events(
        State(build_state(vec![admin.clone()])),
        Path("bad".to_string()),
        Query(AdminComplianceDataRequestEventsQuery::default()),
        auth_headers(admin.id),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_compliance_data_request_update_requires_super_admin() {
    let admin = user_with_role("admin");
    let resp = post_admin_compliance_data_request_update(
        State(build_state(vec![admin.clone()])),
        Path(Uuid::new_v4().to_string()),
        auth_headers(admin.id),
        Json(AdminComplianceDataRequestUpdateBody {
            expected_version: 1,
            status: None,
            notes: None,
            export_signature: None,
            record_hash_fingerprint: None,
            event_type: "comment".to_string(),
            event_detail: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_compliance_data_request_update_invalid_event_type() {
    let sa = user_with_role("super_admin");
    let resp = post_admin_compliance_data_request_update(
        State(build_state(vec![sa.clone()])),
        Path(Uuid::new_v4().to_string()),
        auth_headers(sa.id),
        Json(AdminComplianceDataRequestUpdateBody {
            expected_version: 1,
            status: None,
            notes: None,
            export_signature: None,
            record_hash_fingerprint: None,
            event_type: "   ".to_string(),
            event_detail: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn admin_scheduler_rerun_requires_super_admin() {
    let admin = user_with_role("admin");
    let resp = post_admin_scheduler_job_rerun(
        State(build_state(vec![admin.clone()])),
        Path("indexer.tick".to_string()),
        auth_headers(admin.id),
        Json(AdminSchedulerRerunBody { reason: None }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn admin_scheduler_rerun_invalid_job_code() {
    let sa = user_with_role("super_admin");
    let resp = post_admin_scheduler_job_rerun(
        State(build_state(vec![sa.clone()])),
        Path("bad code!".to_string()),
        auth_headers(sa.id),
        Json(AdminSchedulerRerunBody { reason: None }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
}
