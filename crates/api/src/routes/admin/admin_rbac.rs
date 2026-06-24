//! **70 · RBAC**：六角色矩阵 + **`admin_console_roles` 落库** + capabilities / 路由 deny 矩阵 / 权限中心写。
//! **② staging 全矩阵 GO · ③ Production GO** 仍为独立闸（见 `phase2_prep.staging_admin_matrix_go`）。

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post, put};
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::db;
use crate::state::ApiMetaState;

use super::{
    admin_attach_meta_build, admin_db_pool_required, require_admin_actor, request_id_from_headers,
    write_admin_audit_log_best_effort,
};

pub const RBAC_MATRIX_VERSION: &str = "admin-rbac-v4-cms-ops-growth-2026-06-07";

pub const CONSOLE_ROLE_SUPER: &str = "SuperAdmin";
pub const CONSOLE_ROLE_OPS: &str = "Ops";
pub const CONSOLE_ROLE_CS: &str = "CS";
pub const CONSOLE_ROLE_RISK: &str = "Risk";
pub const CONSOLE_ROLE_FINANCE: &str = "Finance";
pub const CONSOLE_ROLE_AUDITOR: &str = "Auditor";

pub const ALL_CONSOLE_ROLES_70: &[&str] = &[
    CONSOLE_ROLE_SUPER,
    CONSOLE_ROLE_OPS,
    CONSOLE_ROLE_CS,
    CONSOLE_ROLE_RISK,
    CONSOLE_ROLE_FINANCE,
    CONSOLE_ROLE_AUDITOR,
];

pub const PERM_READ: &str = "admin.read";
pub const PERM_APPROVE: &str = "admin.approve";
pub const PERM_ONBOARDING_READ: &str = "admin.onboarding.read";
pub const PERM_ONBOARDING_WRITE: &str = "admin.onboarding.write";
pub const PERM_ONBOARDING_REVIEW: &str = "admin.onboarding.provider_review";
pub const PERM_STEWARD_REVIEW: &str = "admin.onboarding.steward_review";
pub const PERM_USERS_READ: &str = "admin.users.read";
pub const PERM_USERS_WRITE: &str = "admin.users.write";
pub const PERM_ORDERS_READ: &str = "admin.orders.read";
pub const PERM_DISPUTES_WRITE: &str = "admin.disputes.write";
pub const PERM_COMMUNITY_READ: &str = "admin.community.read";
pub const PERM_COMMUNITY_MODERATE: &str = "admin.community.moderate";
pub const PERM_COMMUNITY_SUPER: &str = "admin.community.super";
pub const PERM_FINANCE_READ: &str = "admin.finance.read";
pub const PERM_TRUST_GROWTH_WRITE: &str = "admin.trust_growth.write";
pub const PERM_PLATFORM_READ: &str = "admin.platform.read";
pub const PERM_PLATFORM_PUBLISH: &str = "admin.platform.publish";
pub const PERM_ACQUISITION_SUSPEND: &str = "admin.acquisition.suspend";
pub const PERM_CONTENT_READ: &str = "admin.content.read";
pub const PERM_CONTENT_WRITE: &str = "admin.content.write";
pub const PERM_CONTENT_PUBLISH: &str = "admin.content.publish";
pub const PERM_OFFICIAL_READ: &str = "admin.official.read";
pub const PERM_OFFICIAL_WRITE: &str = "admin.official.write";
pub const PERM_OFFICIAL_PUBLISH: &str = "admin.official.publish";
pub const PERM_GROWTH_READ: &str = "admin.growth.read";
pub const PERM_GROWTH_WRITE: &str = "admin.growth.write";
pub const PERM_GROWTH_PUBLISH: &str = "admin.growth.publish";
pub const PERM_GROWTH_FRAUD: &str = "admin.growth.fraud";

const SUPER_ADMIN_PERMS: &[&str] = &[
    PERM_READ,
    PERM_APPROVE,
    PERM_ONBOARDING_READ,
    PERM_ONBOARDING_WRITE,
    PERM_ONBOARDING_REVIEW,
    PERM_STEWARD_REVIEW,
    PERM_USERS_READ,
    PERM_USERS_WRITE,
    PERM_ORDERS_READ,
    PERM_DISPUTES_WRITE,
    PERM_COMMUNITY_READ,
    PERM_COMMUNITY_MODERATE,
    PERM_COMMUNITY_SUPER,
    PERM_FINANCE_READ,
    PERM_TRUST_GROWTH_WRITE,
    PERM_PLATFORM_READ,
    PERM_PLATFORM_PUBLISH,
    PERM_ACQUISITION_SUSPEND,
    PERM_CONTENT_READ,
    PERM_CONTENT_WRITE,
    PERM_CONTENT_PUBLISH,
    PERM_OFFICIAL_READ,
    PERM_OFFICIAL_WRITE,
    PERM_OFFICIAL_PUBLISH,
    PERM_GROWTH_READ,
    PERM_GROWTH_WRITE,
    PERM_GROWTH_PUBLISH,
    PERM_GROWTH_FRAUD,
];

const OPS_PERMS: &[&str] = &[
    PERM_READ,
    PERM_ONBOARDING_READ,
    PERM_ONBOARDING_WRITE,
    PERM_ONBOARDING_REVIEW,
    PERM_STEWARD_REVIEW,
    PERM_USERS_READ,
    PERM_USERS_WRITE,
    PERM_ORDERS_READ,
    PERM_DISPUTES_WRITE,
    PERM_COMMUNITY_READ,
    PERM_COMMUNITY_MODERATE,
    PERM_FINANCE_READ,
    PERM_TRUST_GROWTH_WRITE,
    PERM_PLATFORM_READ,
    PERM_ACQUISITION_SUSPEND,
    PERM_CONTENT_READ,
    PERM_CONTENT_WRITE,
    PERM_OFFICIAL_READ,
    PERM_OFFICIAL_WRITE,
    PERM_GROWTH_READ,
    PERM_GROWTH_WRITE,
    PERM_GROWTH_FRAUD,
];

const CS_PERMS: &[&str] = &[
    PERM_READ,
    PERM_USERS_READ,
    PERM_ORDERS_READ,
    PERM_COMMUNITY_READ,
    PERM_ONBOARDING_READ,
    PERM_CONTENT_READ,
    PERM_OFFICIAL_READ,
    PERM_GROWTH_READ,
];

const RISK_PERMS: &[&str] = &[
    PERM_READ,
    PERM_USERS_READ,
    PERM_USERS_WRITE,
    PERM_ORDERS_READ,
    PERM_DISPUTES_WRITE,
    PERM_COMMUNITY_READ,
    PERM_COMMUNITY_MODERATE,
    PERM_ONBOARDING_READ,
    PERM_ONBOARDING_REVIEW,
    PERM_STEWARD_REVIEW,
    PERM_TRUST_GROWTH_WRITE,
    PERM_ACQUISITION_SUSPEND,
    PERM_CONTENT_READ,
    PERM_OFFICIAL_READ,
    PERM_GROWTH_READ,
    PERM_GROWTH_FRAUD,
];

const FINANCE_PERMS: &[&str] = &[
    PERM_READ,
    PERM_FINANCE_READ,
    PERM_ORDERS_READ,
    PERM_ONBOARDING_READ,
    PERM_PLATFORM_READ,
    PERM_GROWTH_READ,
];

const AUDITOR_PERMS: &[&str] = &[
    PERM_READ,
    PERM_USERS_READ,
    PERM_ORDERS_READ,
    PERM_COMMUNITY_READ,
    PERM_FINANCE_READ,
    PERM_ONBOARDING_READ,
    PERM_PLATFORM_READ,
    PERM_CONTENT_READ,
    PERM_OFFICIAL_READ,
    PERM_GROWTH_READ,
];

/// 机读路由 × 权限（与 `registry/admin-rbac-route-matrix.v1.yaml` 同源；烟测探针用）。
pub const ROUTE_DENY_MATRIX: &[(&str, &str, &str)] = &[
    ("GET", "/api/v1/admin/users", PERM_USERS_READ),
    ("GET", "/api/v1/admin/orders", PERM_ORDERS_READ),
    ("GET", "/api/v1/admin/finance/summary", PERM_FINANCE_READ),
    ("GET", "/api/v1/admin/flags", PERM_PLATFORM_READ),
    ("POST", "/api/v1/admin/flags/:id/publish", PERM_PLATFORM_PUBLISH),
    ("POST", "/api/v1/admin/policies/publish", PERM_PLATFORM_PUBLISH),
    ("POST", "/api/v1/admin/tenant-scopes/:id/publish", PERM_PLATFORM_PUBLISH),
    ("POST", "/api/v1/admin/scheduler/jobs/:job_code/rerun", PERM_APPROVE),
    ("GET", "/api/v1/admin/approvals", PERM_APPROVE),
    ("GET", "/api/v1/admin/approvals/:id", PERM_APPROVE),
    ("POST", "/api/v1/admin/approvals/:id/approve", PERM_APPROVE),
    ("POST", "/api/v1/admin/approvals/:id/reject", PERM_APPROVE),
    ("PATCH", "/api/v1/admin/community/reports/:id", PERM_COMMUNITY_MODERATE),
    ("POST", "/api/v1/admin/community/penalties", PERM_COMMUNITY_MODERATE),
    ("PATCH", "/api/v1/admin/trust-growth/control", PERM_TRUST_GROWTH_WRITE),
    ("POST", "/api/v1/admin/compliance/data-requests/:id/update", PERM_APPROVE),
    ("PUT", "/api/v1/admin/users/:id/console-role", PERM_USERS_WRITE),
    // Finance cluster
    ("GET", "/api/v1/admin/finance/summary/export", PERM_FINANCE_READ),
    ("GET", "/api/v1/admin/fee-router/routed-events", PERM_FINANCE_READ),
    (
        "GET",
        "/api/v1/admin/region-vault/forwarded-events",
        PERM_FINANCE_READ,
    ),
    (
        "GET",
        "/api/v1/admin/region-vault/forwarded-events/export",
        PERM_FINANCE_READ,
    ),
    // Audit cluster
    ("GET", "/api/v1/admin/audit/operations", PERM_READ),
    ("GET", "/api/v1/admin/audit-logs", PERM_READ),
    ("GET", "/api/v1/admin/audit-logs/:id", PERM_READ),
    ("GET", "/api/v1/admin/auth-audit-events", PERM_READ),
    // Community cluster (read)
    ("GET", "/api/v1/admin/community/reports", PERM_COMMUNITY_READ),
    ("GET", "/api/v1/admin/community/appeals", PERM_COMMUNITY_READ),
    (
        "GET",
        "/api/v1/admin/community/moderation/cases",
        PERM_COMMUNITY_READ,
    ),
    ("GET", "/api/v1/admin/community/penalties", PERM_COMMUNITY_READ),
    (
        "GET",
        "/api/v1/admin/community/ranking/snapshots",
        PERM_COMMUNITY_READ,
    ),
    (
        "GET",
        "/api/v1/admin/community/risk-signals",
        PERM_COMMUNITY_READ,
    ),
    (
        "GET",
        "/api/v1/admin/community/policy-change-logs",
        PERM_COMMUNITY_READ,
    ),
    (
        "PATCH",
        "/api/v1/admin/community/moderation/:id",
        PERM_COMMUNITY_MODERATE,
    ),
    (
        "PATCH",
        "/api/v1/admin/community/comments/:id",
        PERM_COMMUNITY_MODERATE,
    ),
    (
        "POST",
        "/api/v1/admin/community/appeals/:id/review",
        PERM_COMMUNITY_SUPER,
    ),
    (
        "PATCH",
        "/api/v1/admin/community/abuse-policy",
        PERM_COMMUNITY_SUPER,
    ),
];

pub fn is_valid_console_role_70(role: &str) -> bool {
    ALL_CONSOLE_ROLES_70.contains(&role.trim())
}

pub fn users_role_to_console_role_70(users_role: &str) -> &'static str {
    match users_role.trim() {
        "super_admin" => CONSOLE_ROLE_SUPER,
        "admin" => CONSOLE_ROLE_OPS,
        _ => CONSOLE_ROLE_OPS,
    }
}

#[cfg(test)]
std::thread_local! {
    static TEST_CONSOLE_ROLE_OVERRIDE: std::cell::RefCell<Option<String>> =
        const { std::cell::RefCell::new(None) };
}

#[cfg(test)]
pub fn test_console_role_override_snapshot() -> Option<String> {
    TEST_CONSOLE_ROLE_OVERRIDE.with(|c| c.borrow().clone())
}

#[cfg(test)]
pub fn set_test_console_role_override(role: Option<&str>) {
    TEST_CONSOLE_ROLE_OVERRIDE.with(|c| {
        *c.borrow_mut() = role
            .map(|r| r.trim().to_string())
            .filter(|s| !s.is_empty() && is_valid_console_role_70(s));
    });
}

#[cfg(test)]
pub fn restore_test_console_role_override(previous: Option<String>) {
    TEST_CONSOLE_ROLE_OVERRIDE.with(|c| *c.borrow_mut() = previous);
}

pub fn console_role_70_override_from_env() -> Option<String> {
    #[cfg(test)]
    if let Some(v) = test_console_role_override_snapshot() {
        return Some(v);
    }
    std::env::var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty() && is_valid_console_role_70(s))
}

pub fn effective_console_role_70(users_role: &str) -> String {
    if let Some(o) = console_role_70_override_from_env() {
        return o;
    }
    users_role_to_console_role_70(users_role).to_string()
}

pub fn permissions_for_console_role_70(console_role: &str) -> &'static [&'static str] {
    match console_role.trim() {
        CONSOLE_ROLE_SUPER => SUPER_ADMIN_PERMS,
        CONSOLE_ROLE_OPS => OPS_PERMS,
        CONSOLE_ROLE_CS => CS_PERMS,
        CONSOLE_ROLE_RISK => RISK_PERMS,
        CONSOLE_ROLE_FINANCE => FINANCE_PERMS,
        CONSOLE_ROLE_AUDITOR => AUDITOR_PERMS,
        _ => &[],
    }
}

pub fn console_role_has_permission(console_role: &str, permission: &str) -> bool {
    permissions_for_console_role_70(console_role).contains(&permission)
}

pub fn permissions_for_role(users_role: &str) -> Vec<&'static str> {
    let console = effective_console_role_70(users_role);
    permissions_for_console_role_70(&console).to_vec()
}

/// 同步回退（无 DB）；优先用 `resolve_effective_console_role`。
pub fn role_has_permission(users_role: &str, permission: &str) -> bool {
    let console = effective_console_role_70(users_role);
    console_role_has_permission(&console, permission)
}

pub async fn resolve_effective_console_role(
    state: &ApiMetaState,
    user_id: Uuid,
    users_role: &str,
) -> (String, &'static str) {
    if let Some(o) = console_role_70_override_from_env() {
        return (o, "env:TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE");
    }
    if let Some(pool) = state
        .chain_off
        .as_ref()
        .and_then(|c| c.db_pool.as_ref())
    {
        if db::admin_console_roles_table_exists(pool).await {
            if let Ok(Some(db_role)) = db::get_admin_console_role(pool, user_id).await {
                if is_valid_console_role_70(&db_role) {
                    return (db_role, "db:admin_console_roles");
                }
            }
        }
    }
    (
        users_role_to_console_role_70(users_role).to_string(),
        "users.role_mapped",
    )
}

pub async fn actor_has_permission(
    state: &ApiMetaState,
    user_id: Uuid,
    users_role: &str,
    permission: &str,
) -> bool {
    let (console, _) = resolve_effective_console_role(state, user_id, users_role).await;
    console_role_has_permission(&console, permission)
}

async fn admin_2fa_blocks_actor(
    state: &ApiMetaState,
    headers: &HeaderMap,
    user_id: Uuid,
    console_role: &str,
) -> bool {
    if super::admin_security_totp::admin_2fa_skip_from_env() {
        return false;
    }
    let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) else {
        return false;
    };
    let Ok(policy) = db::get_admin_2fa_policy(pool).await else {
        return false;
    };
    let enforced = policy.get("enforced").and_then(|v| v.as_bool()) == Some(true);
    if !enforced {
        return false;
    }
    let required: Vec<String> = policy
        .get("required_console_roles")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|x| x.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default();
    if !(enforced && required.iter().any(|r| r == console_role)) {
        return false;
    }
    if !super::admin_security_totp::admin_totp_enrollment_verified(state, user_id).await {
        return true;
    }
    !super::admin_security_totp::admin_2fa_session_valid(headers, user_id)
}

fn role_matrix_preview_json() -> Value {
    let mut m = serde_json::Map::new();
    for r in ALL_CONSOLE_ROLES_70 {
        let perms: Vec<&str> = permissions_for_console_role_70(r).to_vec();
        m.insert(r.to_string(), json!(perms));
    }
    Value::Object(m)
}

fn route_deny_matrix_json() -> Value {
    let items: Vec<Value> = ROUTE_DENY_MATRIX
        .iter()
        .map(|(method, path, perm)| {
            json!({
                "method": method,
                "path": path,
                "required_permission": perm,
            })
        })
        .collect();
    json!({
        "matrix_version": RBAC_MATRIX_VERSION,
        "items": items,
        "note": "phase_01_local_probe_matrix_not_staging_93_go"
    })
}

async fn admin_approval_requests_table_exists(pool: &sqlx::PgPool) -> bool {
    sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'admin_approval_requests'
        )",
    )
    .fetch_one(pool)
    .await
    .unwrap_or(false)
}

async fn admin_audit_logs_table_exists(pool: &sqlx::PgPool) -> bool {
    sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = 'admin_audit_logs'
        )",
    )
    .fetch_one(pool)
    .await
    .unwrap_or(false)
}

fn console_role_direct_assign_enabled() -> bool {
    std::env::var("TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT")
        .ok()
        .map(|s| {
            matches!(
                s.trim().to_ascii_lowercase().as_str(),
                "1" | "true" | "yes"
            )
        })
        .unwrap_or(false)
}

async fn phase2_prep_flags(state: &ApiMetaState) -> Value {
    let pool = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    let db_ready = match pool {
        Some(p) => db::admin_console_roles_table_exists(p).await,
        None => false,
    };
    let approval_wired = match pool {
        Some(p) => admin_approval_requests_table_exists(p).await,
        None => false,
    };
    let audit_persist = match pool {
        Some(p) => admin_audit_logs_table_exists(p).await,
        None => false,
    };
    let enforce_2fa = match pool {
        Some(p) => {
            db::get_admin_2fa_policy(p)
                .await
                .ok()
                .and_then(|p| p.get("enforced").and_then(|v| v.as_bool()))
                == Some(true)
        }
        None => false,
    };
    let adm_u02_local_ready = db_ready && approval_wired && audit_persist;
    json!({
        "admin_console_role_db": db_ready,
        "permission_center_edit": adm_u02_local_ready,
        "console_role_approval_wired": approval_wired,
        "audit_logs_persist": audit_persist,
        "adm_u02_local_ready": adm_u02_local_ready,
        "enforce_2fa": enforce_2fa,
        "totp_verification_wired": true,
        "console_role_direct_allowed": console_role_direct_assign_enabled(),
        "staging_admin_matrix_go": false,
        "production_admin_go": false,
        "implementation_note": "adm_u02_console_role_approval_2fa_audit_local"
    })
}

pub async fn require_admin_permission(
    state: &ApiMetaState,
    headers: &HeaderMap,
    permission: &str,
) -> Result<(Uuid, String), Response> {
    let (uid, role) = require_admin_actor(state, headers).await?;
    let (console, _) = resolve_effective_console_role(state, uid, &role).await;
    if admin_2fa_blocks_actor(state, headers, uid, &console).await {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key("admin_2fa_required")),
        )
            .into_response());
    }
    if !console_role_has_permission(&console, permission) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key("admin_permission_denied")),
        )
            .into_response());
    }
    Ok((uid, role))
}

pub async fn require_super_admin_permission(
    state: &ApiMetaState,
    headers: &HeaderMap,
) -> Result<Uuid, Response> {
    let (uid, _) = require_admin_permission(state, headers, PERM_APPROVE).await?;
    Ok(uid)
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/admin/capabilities", get(get_admin_capabilities))
        .route(
            "/api/v1/admin/rbac/route-matrix",
            get(get_admin_rbac_route_matrix),
        )
        .route(
            "/api/v1/admin/security/2fa-policy",
            get(get_admin_2fa_policy).patch(patch_admin_2fa_policy),
        )
        .route(
            "/api/v1/admin/users/:user_id/console-role",
            put(put_admin_user_console_role),
        )
        .route(
            "/api/v1/admin/users/:user_id/console-role-change-request",
            post(post_admin_user_console_role_change_request),
        )
}

pub async fn get_admin_capabilities(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let (actor_id, users_role) = match require_admin_actor(&state, &headers).await {
        Ok(v) => v,
        Err(r) => return r,
    };

    let (console_role, source) =
        resolve_effective_console_role(&state, actor_id, &users_role).await;
    let perms: Vec<&'static str> = permissions_for_console_role_70(&console_role).to_vec();

    let mut body = json!({
        "status": "ok",
        "role": users_role,
        "console_role_70": console_role,
        "console_role_source": source,
        "matrix_version": RBAC_MATRIX_VERSION,
        "permissions": perms,
        "target_roles_70": ALL_CONSOLE_ROLES_70,
        "role_matrix_preview": role_matrix_preview_json(),
        "route_deny_matrix_preview": route_deny_matrix_json(),
        "phase2_prep": phase2_prep_flags(&state).await,
        "implementation_note": "phase_01_console_role_db_prep",
    });
    admin_attach_meta_build(&mut body);

    let request_id = request_id_from_headers(&headers);
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.capabilities.read",
        Some("admin_capabilities"),
        None,
        json!({
            "users_role": users_role,
            "console_role_70": console_role,
            "console_role_source": source,
            "permission_count": perms.len(),
        }),
    )
    .await;

    Json(body).into_response()
}

pub async fn get_admin_rbac_route_matrix(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match require_admin_permission(&state, &headers, PERM_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let mut body = json!({
        "status": "ok",
        "route_matrix": route_deny_matrix_json(),
        "phase2_prep": phase2_prep_flags(&state).await,
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

pub async fn get_admin_2fa_policy(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let _ = match require_admin_permission(&state, &headers, PERM_READ).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let policy = match db::get_admin_2fa_policy(pool).await {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_2fa_policy_read_failed")),
            )
                .into_response()
        }
    };
    let mut body = json!({
        "status": "ok",
        "policy": policy,
        "totp_verification_wired": true,
        "implementation_note": "totp_enroll_verify_wired_enforced_via_policy",
    });
    admin_attach_meta_build(&mut body);
    Json(body).into_response()
}

#[derive(Debug, Deserialize)]
pub struct PatchAdmin2faPolicyBody {
    pub enforced: Option<bool>,
}

pub async fn patch_admin_2fa_policy(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<PatchAdmin2faPolicyBody>,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_permission(&state, &headers, PERM_APPROVE).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    let enforced = body.enforced.unwrap_or(false);
    if let Err(_) = db::patch_admin_2fa_policy_enforced(pool, enforced).await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key("admin_2fa_policy_patch_failed")),
        )
            .into_response();
    }
    let policy = db::get_admin_2fa_policy(pool).await.unwrap_or(json!({}));
    let request_id = request_id_from_headers(&headers);
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.2fa_policy.patch",
        Some("admin_security_policies"),
        None,
        json!({ "enforced": enforced }),
    )
    .await;
    let mut resp = json!({
        "status": "ok",
        "policy": policy,
        "totp_verification_wired": true,
    });
    admin_attach_meta_build(&mut resp);
    Json(resp).into_response()
}

#[derive(Debug, Deserialize)]
pub struct PostConsoleRoleChangeRequestBody {
    pub console_role_70: String,
    pub reason: Option<String>,
}

/// ② staging 多实例：目标 `users.role` 以 PG 为准（与 `require_admin_actor` 同源 · TN-P0-001/U02）。
async fn resolve_target_users_role(
    state: &ApiMetaState,
    pool: &sqlx::PgPool,
    target: Uuid,
) -> Result<String, Response> {
    match db::get_user_by_id(pool, target).await {
        Ok(Some(u)) => {
            if let Some(ref co) = state.chain_off {
                let mut store = co.store.write().await;
                if let Some(row) = store.users.get_mut(&target) {
                    row.role = u.role.clone();
                }
            }
            Ok(u.role)
        }
        Ok(None) => {
            let Some(co) = state.chain_off.as_ref() else {
                return Err((
                    StatusCode::NOT_FOUND,
                    Json(crate::api_json::err_key("user_not_found")),
                )
                    .into_response());
            };
            let store = co.store.read().await;
            store
                .users
                .get(&target)
                .map(|u| u.role.clone())
                .ok_or_else(|| {
                    (
                        StatusCode::NOT_FOUND,
                        Json(crate::api_json::err_key("user_not_found")),
                    )
                        .into_response()
                })
        }
        Err(_) => Err((
            StatusCode::SERVICE_UNAVAILABLE,
            Json(crate::api_json::err_key("admin_db_required")),
        )
            .into_response()),
    }
}

pub async fn post_admin_user_console_role_change_request(
    State(state): State<ApiMetaState>,
    Path(user_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<PostConsoleRoleChangeRequestBody>,
) -> impl IntoResponse {
    let (actor_id, _) = match require_admin_permission(&state, &headers, PERM_USERS_WRITE).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let target = match Uuid::parse_str(user_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_user_id")),
            )
                .into_response()
        }
    };
    let role = body.console_role_70.trim();
    if !is_valid_console_role_70(role) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_console_role_70")),
        )
            .into_response();
    }
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    if !db::admin_console_roles_table_exists(pool).await
        || !admin_approval_requests_table_exists(pool).await
    {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(crate::api_json::err_key("admin_console_role_approval_unavailable")),
        )
            .into_response();
    }
    let Some(_co) = state.chain_off.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(crate::api_json::err_key("chain_off_unavailable")),
        )
            .into_response();
    };
    let target_role = match resolve_target_users_role(&state, pool, target).await {
        Ok(r) => r,
        Err(r) => return r,
    };
    if target_role != "admin" && target_role != "super_admin" {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("target_not_admin_console_user")),
        )
            .into_response();
    }
    let (before_console, _) = resolve_effective_console_role(&state, target, &target_role).await;
    if before_console == role {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("console_role_unchanged")),
        )
            .into_response();
    }
    let request_id = request_id_from_headers(&headers);
    let approval_id = match db::create_admin_console_role_change_request_with_audit(
        pool,
        actor_id,
        target,
        Some(before_console.as_str()),
        role,
        body.reason.as_deref(),
        request_id.as_deref(),
    )
    .await
    {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(crate::api_json::err_key("admin_console_role_change_request_failed")),
            )
                .into_response()
        }
    };
    let mut resp = json!({
        "status": "ok",
        "approval_request_id": approval_id,
        "approval_status": "pending",
        "action": "admin.console_role.change",
        "target_user_id": target,
        "from_console_role_70": before_console,
        "to_console_role_70": role,
    });
    admin_attach_meta_build(&mut resp);
    Json(resp).into_response()
}

#[derive(Debug, Deserialize)]
pub struct PutConsoleRoleBody {
    pub console_role_70: String,
    pub reason: Option<String>,
}

pub async fn put_admin_user_console_role(
    State(state): State<ApiMetaState>,
    Path(user_id): Path<String>,
    headers: HeaderMap,
    Json(body): Json<PutConsoleRoleBody>,
) -> impl IntoResponse {
    if !console_role_direct_assign_enabled() {
        return (
            StatusCode::CONFLICT,
            Json(crate::api_json::err_key("console_role_use_approval_flow")),
        )
            .into_response();
    }
    let (actor_id, _) = match require_admin_permission(&state, &headers, PERM_USERS_WRITE).await {
        Ok(v) => v,
        Err(r) => return r,
    };
    let target = match Uuid::parse_str(user_id.trim()) {
        Ok(v) => v,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("invalid_user_id")),
            )
                .into_response()
        }
    };
    let role = body.console_role_70.trim();
    if !is_valid_console_role_70(role) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_console_role_70")),
        )
            .into_response();
    }
    let pool = match admin_db_pool_required(&state) {
        Ok(p) => p,
        Err(r) => return r,
    };
    if !db::admin_console_roles_table_exists(pool).await {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(crate::api_json::err_key("admin_console_roles_table_missing")),
        )
            .into_response();
    }
    let Some(_co) = state.chain_off.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(crate::api_json::err_key("chain_off_unavailable")),
        )
            .into_response();
    };
    let target_role = match resolve_target_users_role(&state, pool, target).await {
        Ok(r) => r,
        Err(r) => return r,
    };
    if target_role != "admin" && target_role != "super_admin" {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("target_not_admin_console_user")),
        )
            .into_response();
    }
    if let Err(_) = db::upsert_admin_console_role(
        pool,
        target,
        role,
        Some(actor_id),
        body.reason.as_deref(),
    )
    .await
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key("admin_console_role_upsert_failed")),
        )
            .into_response();
    }
    let request_id = request_id_from_headers(&headers);
    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.console_role.assign",
        Some("admin_console_roles"),
        Some(target.to_string().as_str()),
        json!({
            "console_role_70": role,
            "reason": body.reason,
        }),
    )
    .await;
    let mut resp = json!({
        "status": "ok",
        "user_id": target,
        "console_role_70": role,
    });
    admin_attach_meta_build(&mut resp);
    Json(resp).into_response()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn super_admin_maps_to_super_console_role() {
        assert_eq!(
            users_role_to_console_role_70("super_admin"),
            CONSOLE_ROLE_SUPER
        );
        assert!(console_role_has_permission(CONSOLE_ROLE_SUPER, PERM_APPROVE));
        assert!(!console_role_has_permission(CONSOLE_ROLE_OPS, PERM_APPROVE));
    }

    #[test]
    fn admin_maps_to_ops_bundle() {
        assert_eq!(users_role_to_console_role_70("admin"), CONSOLE_ROLE_OPS);
        assert!(console_role_has_permission(CONSOLE_ROLE_OPS, PERM_ONBOARDING_REVIEW));
        assert!(!console_role_has_permission(CONSOLE_ROLE_OPS, PERM_PLATFORM_PUBLISH));
    }

    #[test]
    fn cs_and_auditor_are_read_heavy() {
        assert!(!permissions_for_console_role_70(CONSOLE_ROLE_CS).contains(&PERM_ONBOARDING_WRITE));
        assert!(
            !permissions_for_console_role_70(CONSOLE_ROLE_AUDITOR).contains(&PERM_COMMUNITY_MODERATE)
        );
        assert!(permissions_for_console_role_70(CONSOLE_ROLE_AUDITOR).contains(&PERM_FINANCE_READ));
    }

    #[test]
    fn finance_has_finance_read_not_publish() {
        assert!(permissions_for_console_role_70(CONSOLE_ROLE_FINANCE).contains(&PERM_FINANCE_READ));
        assert!(
            !permissions_for_console_role_70(CONSOLE_ROLE_FINANCE).contains(&PERM_PLATFORM_PUBLISH)
        );
        assert!(
            !permissions_for_console_role_70(CONSOLE_ROLE_FINANCE).contains(&PERM_USERS_READ)
        );
    }

    #[test]
    fn route_matrix_has_publish_and_approve() {
        assert!(ROUTE_DENY_MATRIX
            .iter()
            .any(|(_, p, perm)| *p == "/api/v1/admin/flags/:id/publish" && *perm == PERM_PLATFORM_PUBLISH));
    }

    #[test]
    fn six_roles_deny_matrix_coherence() {
        for role in ALL_CONSOLE_ROLES_70 {
            let perms = permissions_for_console_role_70(role);
            assert!(!perms.is_empty(), "role {role} must have permissions");
            for (_, _, required) in ROUTE_DENY_MATRIX {
                let allowed = perms.contains(&required);
                match *role {
                    CONSOLE_ROLE_CS => {
                        if *required == PERM_PLATFORM_PUBLISH || *required == PERM_APPROVE {
                            assert!(!allowed, "CS must not have {required}");
                        }
                    }
                    CONSOLE_ROLE_FINANCE => {
                        if *required == PERM_PLATFORM_PUBLISH || *required == PERM_USERS_READ {
                            assert!(!allowed, "Finance must not have {required}");
                        }
                    }
                    CONSOLE_ROLE_AUDITOR => {
                        if *required == PERM_COMMUNITY_MODERATE
                            || *required == PERM_PLATFORM_PUBLISH
                        {
                            assert!(!allowed);
                        }
                    }
                    _ => {}
                }
            }
        }
    }
}
