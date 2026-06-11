//! **Read Contract 门禁**：从路由源码扫描 **`GET /api/v1/governance/*`** 与 **`GET /api/v1/admin/*`**，
//! 与注册表 **完全一致**；并对每条路径做 **Router 级 GET smoke**（**禁止 405**）。
//!
//! **不**改业务 handler；新增路由时须同步更新 **`READ_CONTRACT_GOVERNANCE_ADMIN_GET_PATHS`**（与扫描结果对齐）。

use std::collections::BTreeSet;
use std::path::PathBuf;

use axum::body::Body;
use axum::http::{Request, StatusCode};
use tower::util::ServiceExt;

use crate::routes::api_router;
use crate::state::test_support::api_meta_state;

/// 与 `scan_governance_admin_get_paths_from_sources()` 结果必须 **集合相等**（排序后逐字一致）。
const READ_CONTRACT_GOVERNANCE_ADMIN_GET_PATHS: &[&str] = &[
    "/api/v1/admin/alerts/incidents/:id",
    "/api/v1/admin/api-versions",
    "/api/v1/admin/approvals",
    "/api/v1/admin/approvals/:id",
    "/api/v1/admin/audit-logs",
    "/api/v1/admin/audit-logs/:id",
    "/api/v1/admin/audit/operations",
    "/api/v1/admin/auth-audit-events",
    "/api/v1/admin/community/appeals",
    "/api/v1/admin/community/moderation/cases",
    "/api/v1/admin/community/penalties",
    "/api/v1/admin/community/policy-change-logs",
    "/api/v1/admin/community/ranking/snapshots",
    "/api/v1/admin/community/reports",
    "/api/v1/admin/community/risk-signals",
    "/api/v1/admin/compliance/data-requests",
    "/api/v1/admin/compliance/data-requests/:request_id/events",
    "/api/v1/admin/config/releases",
    "/api/v1/admin/config/releases/:id",
    "/api/v1/admin/cross-check",
    "/api/v1/admin/disputes",
    "/api/v1/admin/disputes/:id",
    "/api/v1/admin/drift-summary",
    "/api/v1/admin/fee-router/routed-events",
    "/api/v1/admin/finance/summary",
    "/api/v1/admin/finance/summary/export",
    "/api/v1/admin/flags",
    "/api/v1/admin/guides",
    "/api/v1/admin/guides/:id",
    "/api/v1/admin/indexer/health",
    "/api/v1/admin/indexer/reconcile-report/:id",
    "/api/v1/admin/indexer/reconcile-reports",
    "/api/v1/admin/indexer/reconcile-reports/export",
    "/api/v1/admin/internal-tools/audits",
    "/api/v1/admin/jobs",
    "/api/v1/admin/lifecycle/state-machines",
    "/api/v1/admin/media/access-logs",
    "/api/v1/admin/media/signed-url-tokens",
    "/api/v1/admin/observability/alert-rules",
    "/api/v1/admin/observability/overview",
    "/api/v1/admin/orders",
    "/api/v1/admin/orders/:id",
    "/api/v1/admin/policies",
    "/api/v1/admin/region-vault/forwarded-events",
    "/api/v1/admin/region-vault/forwarded-events/export",
    "/api/v1/admin/reviews",
    "/api/v1/admin/reviews/:id",
    "/api/v1/admin/schema/migrations",
    "/api/v1/admin/scheduler/jobs",
    "/api/v1/admin/secrets/metadata",
    "/api/v1/admin/tenants/scopes",
    "/api/v1/admin/users",
    "/api/v1/admin/users/:id",
    "/api/v1/governance/country-ledger/:jurisdiction",
    "/api/v1/governance/delegate",
    "/api/v1/governance/fee-pool-aggregates",
    "/api/v1/governance/fee-routes",
    "/api/v1/governance/investor-distribution-accruals",
    "/api/v1/governance/investor-share-reconcile",
    "/api/v1/governance/params",
    "/api/v1/governance/pool",
    "/api/v1/governance/proposal-status/:proposal_id",
    "/api/v1/governance/proposals",
    "/api/v1/governance/proposals/:proposal_id",
    "/api/v1/governance/protocol-reference",
    "/api/v1/governance/protocol-reference/pending",
    "/api/v1/governance/rewards",
    "/api/v1/governance/vault-forwards",
    "/api/v1/governance/voting-power",
];

fn route_source_files() -> [PathBuf; 8] {
    let base = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("src/routes");
    [
        base.join("admin/mod.rs"),
        base.join("governance/router.rs"),
        base.join("governance_proposals.rs"),
        base.join("governance_investor_share.rs"),
        base.join("governance_delegate.rs"),
        base.join("governance_voting_power.rs"),
        base.join("governance_country_ledger.rs"),
        base.join("investor_distribution.rs"),
    ]
}

fn find_matching_close_paren(full_src: &str, open_paren_byte_idx: usize) -> Option<usize> {
    let bytes = full_src.as_bytes();
    if bytes.get(open_paren_byte_idx) != Some(&b'(') {
        return None;
    }
    let mut i = open_paren_byte_idx + 1;
    let mut depth = 1u32;
    let mut in_string = false;
    let mut escape = false;
    while i < bytes.len() {
        let b = bytes[i];
        if in_string {
            if escape {
                escape = false;
            } else if b == b'\\' {
                escape = true;
            } else if b == b'"' {
                in_string = false;
            }
            i += 1;
            continue;
        }
        match b {
            b'"' => in_string = true,
            b'(' => depth += 1,
            b')' => {
                depth -= 1;
                if depth == 0 {
                    return Some(i);
                }
            }
            _ => {}
        }
        i += 1;
    }
    None
}

/// 解析 **`"..."`** 字面量（仅测试扫描器所需转义）。
fn first_quoted_string_in_route_inner(inner: &str) -> Option<String> {
    let inner = inner.trim_start();
    if !inner.starts_with('"') {
        return None;
    }
    let mut out = String::new();
    let b = inner.as_bytes();
    let mut i = 1usize;
    while i < b.len() {
        match b[i] {
            b'"' => return Some(out),
            b'\\' => {
                i += 1;
                if i >= b.len() {
                    return None;
                }
                match b[i] {
                    b'n' => out.push('\n'),
                    b'r' => out.push('\r'),
                    b't' => out.push('\t'),
                    b'\\' => out.push('\\'),
                    b'"' => out.push('"'),
                    c => out.push(c as char),
                }
                i += 1;
            }
            c => {
                out.push(c as char);
                i += 1;
            }
        }
    }
    None
}

fn extract_governance_admin_get_paths(src: &str) -> BTreeSet<String> {
    let mut out = BTreeSet::new();
    let needle = ".route(";
    let mut search_start = 0usize;
    while let Some(rel) = src[search_start..].find(needle) {
        let pos = search_start + rel;
        let open_paren = pos + needle.len() - 1;
        if let Some(close) = find_matching_close_paren(src, open_paren) {
            let inner = &src[open_paren + 1..close];
            if inner.contains("get(") {
                if let Some(path) = first_quoted_string_in_route_inner(inner) {
                    if path.starts_with("/api/v1/governance/")
                        || path.starts_with("/api/v1/admin/")
                    {
                        out.insert(path);
                    }
                }
            }
            search_start = close + 1;
        } else {
            search_start = pos + needle.len();
        }
    }
    out
}

fn scan_governance_admin_get_paths_from_sources() -> BTreeSet<String> {
    let mut acc = BTreeSet::new();
    for path in route_source_files() {
        let src = std::fs::read_to_string(&path)
            .unwrap_or_else(|e| panic!("read_contract guard: read {}: {e}", path.display()));
        acc.extend(extract_governance_admin_get_paths(&src));
    }
    acc
}

/// 将 Axum 路径模板替换为可请求的 URI（仅用于 smoke）。
fn materialize_read_contract_path(template: &str) -> String {
    let test_uuid = "00000000-0000-0000-0000-0000000000a1";
    let mut s = template.to_string();
    if s.contains("/governance/proposal-status/") {
        s = s.replace(":proposal_id", "1");
    } else if s.contains("/governance/proposals/") {
        s = s.replace(":proposal_id", test_uuid);
    } else {
        s = s.replace(":proposal_id", "1");
    }
    s = s.replace(":jurisdiction", "DE");
    s = s.replace(":id", test_uuid);
    s = s.replace(":request_id", test_uuid);
    s
}

fn admin_router_state() -> (crate::state::ApiMetaState, uuid::Uuid) {
    use chrono::Utc;
    use std::sync::Arc;
    use uuid::Uuid;

    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, UserRow};

    let now = Utc::now();
    let admin = UserRow {
        id: Uuid::new_v4(),
        email: "read-contract-guard@test.local".to_string(),
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

#[test]
fn read_contract_scan_matches_registry() {
    let scanned = scan_governance_admin_get_paths_from_sources();
    let expected: BTreeSet<String> = READ_CONTRACT_GOVERNANCE_ADMIN_GET_PATHS
        .iter()
        .map(|s| (*s).to_string())
        .collect();
    assert_eq!(
        scanned, expected,
        "read_contract: 更新 READ_CONTRACT_GOVERNANCE_ADMIN_GET_PATHS 使其与源码扫描一致。\n\
         仅 governance/admin 的 `.route(.., get(..))` 计入；POST-only 路由不计入。\n\
         scanned_only={:?}\nregistry_only={:?}",
        scanned.difference(&expected).collect::<Vec<_>>(),
        expected.difference(&scanned).collect::<Vec<_>>()
    );
}

#[tokio::test]
async fn read_contract_router_get_smoke_for_all_registered_paths() {
    let (state, admin_uid) = admin_router_state();
    let auth = format!("Bearer bearer_{admin_uid}");
    let app = api_router().with_state(state);

    for template in READ_CONTRACT_GOVERNANCE_ADMIN_GET_PATHS {
        let uri = materialize_read_contract_path(template);
        let mut req = Request::get(&uri).body(Body::empty()).expect("request");
        if uri.starts_with("/api/v1/admin/") {
            req.headers_mut().insert(
                axum::http::header::AUTHORIZATION,
                auth.parse().expect("auth value"),
            );
        }
        let resp = app
            .clone()
            .oneshot(req)
            .await
            .unwrap_or_else(|e| panic!("oneshot {uri}: {e}"));
        let st = resp.status();
        assert_ne!(
            st,
            StatusCode::METHOD_NOT_ALLOWED,
            "GET must be allowed for read contract route: {template} (materialized {uri})"
        );
    }
}
