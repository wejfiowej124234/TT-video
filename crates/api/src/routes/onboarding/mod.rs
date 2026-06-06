//! **96-18** **F-034～F-038** 商家/主理人准入费 HTTP 字面挂载（与 **04-附录-商家主理人准入费HTTP契约草案-配96-18** **§2** 路径一致；仓库 **`docs`** 下 **`spec/`**）。
//! **PSP**：默认 **`psp.client_secret` / `checkout_url` = null`**（仅 DB + 内网 webhook 闭环）。**可选 Stripe**：**`TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1`** 且配置 **`TRAVELTRUST_STRIPE_SECRET_KEY`** 时 **`POST …/payment-intents`** 出网创建 **PaymentIntent** 并返回 **`client_secret`**；**`POST /api/v1/hooks/stripe/onboarding`** 接 **`payment_intent.succeeded`**。**PG**：**`onboarding_entitlements` / `onboarding_payment_events`** / **`onboarding_compliance_audit_events`**（**合规筛查**；默认 **env 子串 denylist**，可选 **`ONBOARDING_COMPLIANCE_SCREENING_MODE`**（另 **`list_file`** + **`ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE`**））已接线时 **payment-intents** 落 **`pending`**、webhook 幂等 **`paid`**、**`entitlements/me`** 读库。

use axum::extract::{Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::middleware::from_fn;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use chrono::{Duration, Utc};
use serde::Deserialize;
use serde_json::json;
use std::collections::HashSet;
use std::env;
use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};
use uuid::Uuid;

use crate::db::{
    entitlement_to_json, find_paid_entitlement_for_role, get_user_by_id,
    insert_onboarding_compliance_audit_event, insert_or_get_pending_entitlement, list_entitlements_for_user,
    update_user_role_if_safe, InsertPendingEntitlementOutcome,
};
use crate::middleware::onboarding_user_write_rate_limit_response_if_exceeded;
use crate::onboarding_counters::{
    inc_onboarding_entitlements_me_get, inc_onboarding_payment_intents_post, inc_onboarding_quote_get,
    inc_onboarding_role_confirm_post, onboarding_http_response_metrics_layer,
};
use crate::state::{extract_session_auth_outcome, ApiMetaState, SessionAuthOutcome};
use crate::stripe_onboarding;

use super::not_impl_json;

mod fee_schedule_v1;
mod local_dev;

pub fn onboarding_local_dev_enabled() -> bool {
    env::var("TRAVELTRUST_ONBOARDING_LOCAL_DEV").as_deref() == Ok("1")
}

#[derive(Debug, Deserialize)]
pub struct OnboardingQuoteQuery {
    pub role: Option<String>,
    pub sku: Option<String>,
    pub fee_schedule_version: Option<String>,
    pub jurisdictions: Option<String>,
}

#[derive(Debug, Deserialize)]
struct PaymentIntentBody {
    pub role: String,
    #[serde(default)]
    pub sku: Option<String>,
    #[serde(default)]
    pub jurisdictions: Option<String>,
    #[serde(default)]
    pub return_url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RoleConfirmBody {
    pub role: String,
}

/// 与 **`idempotency_key`** **TEXT** 列及运维日志上限对齐（**UUID**/**Stripe 风格** 远小于此上限）。
const ONBOARDING_IDEMPOTENCY_KEY_MAX_BYTES: usize = 256;

/// **`ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE`** UTF-8 上限（防 OOM）。
const ONBOARDING_COMPLIANCE_LIST_FILE_MAX_BYTES: usize = 512 * 1024;
/// 名单行数上限（含空行/注释）。
const ONBOARDING_COMPLIANCE_LIST_FILE_MAX_LINES: usize = 100_000;

struct OnboardingComplianceListFileCache {
    path: PathBuf,
    mtime_ns: u128,
    entries: Arc<HashSet<String>>,
}

static ONBOARDING_COMPLIANCE_LIST_FILE_CACHE: RwLock<Option<OnboardingComplianceListFileCache>> =
    RwLock::new(None);

/// **`ONBOARDING_COMPLIANCE_SCREENING_MODE`**（**96-04 / 96-18 批次 B**）：扩展点；**默认** 与历史行为一致（**env 子串 denylist**）。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum OnboardingComplianceScreeningMode {
    /// 仅 **`ONBOARDING_COMPLIANCE_EMAIL_DENYLIST`**（**非** OFAC）。
    EnvEmailDenylist,
    /// 跳过一切机读拒服（**禁止** 在生产不经书面闸门开启）。
    Off,
    /// 合成 **403**（供 provider / 审计链 **IT**）；**禁止** 在生产开启。
    StubRejectAll,
    /// **`ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE`**：每行一邮箱，**整邮匹配**（大小写不敏感）；**非** 实时名单 API。
    ListFile,
}

fn onboarding_compliance_screening_mode() -> OnboardingComplianceScreeningMode {
    let raw = match env::var("ONBOARDING_COMPLIANCE_SCREENING_MODE") {
        Ok(s) => s.trim().to_ascii_lowercase(),
        Err(_) => return OnboardingComplianceScreeningMode::EnvEmailDenylist,
    };
    if raw.is_empty() {
        return OnboardingComplianceScreeningMode::EnvEmailDenylist;
    }
    match raw.as_str() {
        "off" | "none" | "disabled" => OnboardingComplianceScreeningMode::Off,
        "stub_reject_all" | "stub_reject" => OnboardingComplianceScreeningMode::StubRejectAll,
        "list_file" | "email_list_file" | "static_list_file" => OnboardingComplianceScreeningMode::ListFile,
        "env_email_denylist" | "env_denylist" | "default" => OnboardingComplianceScreeningMode::EnvEmailDenylist,
        other => {
            eprintln!(
                "[onboarding] unknown ONBOARDING_COMPLIANCE_SCREENING_MODE={other:?}; using env_email_denylist"
            );
            OnboardingComplianceScreeningMode::EnvEmailDenylist
        }
    }
}

/// **96-04 / 96-18**：逗号分隔子串（大小写不敏感 **`contains`**）；**非** OFAC 真源，运维可配 **kill** 域或内测账号。
fn onboarding_compliance_email_denied(email: &str) -> bool {
    let Ok(raw) = env::var("ONBOARDING_COMPLIANCE_EMAIL_DENYLIST") else {
        return false;
    };
    let email_lc = email.to_lowercase();
    for seg in raw.split(',') {
        let s = seg.trim();
        if s.is_empty() {
            continue;
        }
        if email_lc.contains(&s.to_lowercase()) {
            return true;
        }
    }
    false
}

fn onboarding_compliance_email_list_file_path() -> Option<PathBuf> {
    let Ok(s) = env::var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE") else {
        return None;
    };
    let t = s.trim();
    if t.is_empty() {
        None
    } else {
        Some(PathBuf::from(t))
    }
}

fn parse_onboarding_compliance_list_file(path: &Path) -> Result<HashSet<String>, String> {
    let meta = std::fs::metadata(path).map_err(|e| e.to_string())?;
    let len = meta.len() as usize;
    if len > ONBOARDING_COMPLIANCE_LIST_FILE_MAX_BYTES {
        return Err(format!(
            "list file exceeds max bytes {}",
            ONBOARDING_COMPLIANCE_LIST_FILE_MAX_BYTES
        ));
    }
    let text = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    let mut set = HashSet::new();
    let mut lines = 0usize;
    for line in text.lines() {
        lines += 1;
        if lines > ONBOARDING_COMPLIANCE_LIST_FILE_MAX_LINES {
            return Err(format!(
                "list file exceeds max lines {}",
                ONBOARDING_COMPLIANCE_LIST_FILE_MAX_LINES
            ));
        }
        let t = line.trim();
        if t.is_empty() || t.starts_with('#') {
            continue;
        }
        set.insert(t.to_lowercase());
    }
    Ok(set)
}

fn list_file_mtime_ns(path: &Path) -> Result<u128, String> {
    let meta = std::fs::metadata(path).map_err(|e| e.to_string())?;
    let mtime = meta.modified().map_err(|e| e.to_string())?;
    Ok(mtime
        .duration_since(std::time::SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos())
}

/// 按 **`mtime`** 热重载；**路径变更** 时丢弃旧缓存项。
fn list_file_entries_cached(path: &Path) -> Result<Arc<HashSet<String>>, String> {
    let mtime_ns = list_file_mtime_ns(path)?;
    {
        let guard = ONBOARDING_COMPLIANCE_LIST_FILE_CACHE
            .read()
            .unwrap_or_else(|e| e.into_inner());
        if let Some(c) = guard.as_ref() {
            if c.path == path && c.mtime_ns == mtime_ns {
                return Ok(Arc::clone(&c.entries));
            }
        }
    }
    let entries = Arc::new(parse_onboarding_compliance_list_file(path)?);
    let mut guard = ONBOARDING_COMPLIANCE_LIST_FILE_CACHE
        .write()
        .unwrap_or_else(|e| e.into_inner());
    *guard = Some(OnboardingComplianceListFileCache {
        path: path.to_path_buf(),
        mtime_ns,
        entries: Arc::clone(&entries),
    });
    Ok(entries)
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum OnboardingComplianceBlockKind {
    EmailDenylistHit,
    StubProviderReject,
    /// 静态名单文件整邮命中（**仍非** OFAC 实时 API）。
    ListFileHit,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum OnboardingComplianceEval {
    Allow,
    Forbidden(OnboardingComplianceBlockKind),
    /// **`list_file`** 模式下列文件不可读/缺失/超限 — **503**（**不**冒充制裁命中）。
    ScreeningUnavailable,
}

fn onboarding_compliance_evaluate(email: &str) -> OnboardingComplianceEval {
    match onboarding_compliance_screening_mode() {
        OnboardingComplianceScreeningMode::Off => OnboardingComplianceEval::Allow,
        OnboardingComplianceScreeningMode::StubRejectAll => {
            OnboardingComplianceEval::Forbidden(OnboardingComplianceBlockKind::StubProviderReject)
        }
        OnboardingComplianceScreeningMode::EnvEmailDenylist => {
            if onboarding_compliance_email_denied(email) {
                OnboardingComplianceEval::Forbidden(OnboardingComplianceBlockKind::EmailDenylistHit)
            } else {
                OnboardingComplianceEval::Allow
            }
        }
        OnboardingComplianceScreeningMode::ListFile => {
            let Some(path) = onboarding_compliance_email_list_file_path() else {
                return OnboardingComplianceEval::ScreeningUnavailable;
            };
            let set = match list_file_entries_cached(&path) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!(
                        "[onboarding] ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE load failed: {}",
                        e
                    );
                    return OnboardingComplianceEval::ScreeningUnavailable;
                }
            };
            let em = email.trim().to_lowercase();
            if set.contains(&em) {
                OnboardingComplianceEval::Forbidden(OnboardingComplianceBlockKind::ListFileHit)
            } else {
                OnboardingComplianceEval::Allow
            }
        }
    }
}

fn onboarding_compliance_http_detail(kind: OnboardingComplianceBlockKind) -> &'static str {
    match kind {
        OnboardingComplianceBlockKind::EmailDenylistHit => {
            "ONBOARDING_COMPLIANCE_EMAIL_DENYLIST matched; not a substitute for full sanctions screening."
        }
        OnboardingComplianceBlockKind::StubProviderReject => {
            "ONBOARDING_COMPLIANCE_SCREENING_MODE=stub_reject_all synthetic block (testing only; not OFAC)."
        }
        OnboardingComplianceBlockKind::ListFileHit => {
            "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE matched (exact email, case-insensitive); not a substitute for live OFAC/list-API screening."
        }
    }
}

fn onboarding_request_id_from_headers(headers: &HeaderMap) -> Option<String> {
    headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
}

/// **96-04 / 96-18 §9.1 R3**：机读负载（**不**含 email **PII**）。
fn onboarding_compliance_audit_payload(
    route: &'static str,
    request_id: Option<&str>,
    user_id: Uuid,
    kind: OnboardingComplianceBlockKind,
) -> serde_json::Value {
    let rid = request_id
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("-");
    let (decision, screening_tier, note) = match kind {
        OnboardingComplianceBlockKind::EmailDenylistHit => (
            "email_denylist_hit",
            "env_substring_only",
            "Email not logged; ONBOARDING_COMPLIANCE_EMAIL_DENYLIST is not a substitute for OFAC/list-API screening.",
        ),
        OnboardingComplianceBlockKind::StubProviderReject => (
            "stub_provider_reject",
            "stub_provider_only",
            "Synthetic onboarding_forbidden_sanctions for screening provider tests; not OFAC/list-API.",
        ),
        OnboardingComplianceBlockKind::ListFileHit => (
            "list_file_hit",
            "static_file_exact_match",
            "Email not logged; ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE is not a substitute for live OFAC/list-API screening.",
        ),
    };
    json!({
        "audit_schema": "traveltrust.onboarding_compliance.v1",
        "event": "onboarding_compliance_decision",
        "decision": decision,
        "api_error": "onboarding_forbidden_sanctions",
        "route": route,
        "request_id": rid,
        "user_id": user_id.to_string(),
        "screening_tier": screening_tier,
        "note": note
    })
}

/// **stderr 单行 JSON**；运维可 **`grep traveltrust.onboarding_compliance.v1`**。
fn audit_onboarding_compliance_screening_stderr(
    route: &'static str,
    request_id: Option<&str>,
    user_id: Uuid,
    kind: OnboardingComplianceBlockKind,
) {
    eprintln!(
        "{}",
        onboarding_compliance_audit_payload(route, request_id, user_id, kind)
    );
}

/// **stderr** + **`onboarding_compliance_audit_events`**（**best-effort**；插入失败**不**改 **403**）。
fn audit_onboarding_compliance_screening_unavailable_stderr(
    route: &'static str,
    request_id: Option<&str>,
    user_id: Uuid,
    reason: &'static str,
) {
    let rid = request_id
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or("-");
    eprintln!(
        "{}",
        json!({
            "audit_schema": "traveltrust.onboarding_compliance.v1",
            "event": "onboarding_compliance_screening_unavailable",
            "route": route,
            "request_id": rid,
            "user_id": user_id.to_string(),
            "reason": reason,
        })
    );
}

async fn persist_onboarding_compliance_screening_hit_best_effort(
    state: &ApiMetaState,
    headers: &HeaderMap,
    user_id: Uuid,
    route: &'static str,
    kind: OnboardingComplianceBlockKind,
) {
    let rid = onboarding_request_id_from_headers(headers);
    audit_onboarding_compliance_screening_stderr(route, rid.as_deref(), user_id, kind);
    let Some(db_pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) else {
        return;
    };
    if let Err(e) =
        insert_onboarding_compliance_audit_event(db_pool, user_id, rid.as_deref(), route).await
    {
        eprintln!(
            "[onboarding] insert_onboarding_compliance_audit_event route={} err={}",
            route, e
        );
    }
}

fn onboarding_payment_intents_disabled() -> bool {
    matches!(env::var("ONBOARDING_PAYMENT_INTENTS_DISABLED").as_deref(), Ok("1"))
}

fn merge_payment_intent_pricing_fields(mut base: serde_json::Value, pricing: &serde_json::Value) -> serde_json::Value {
    if let (Some(o), Some(p)) = (base.as_object_mut(), pricing.as_object()) {
        for (k, v) in p {
            o.insert(k.clone(), v.clone());
        }
    }
    base
}

fn idempotency_key_from_headers(headers: &HeaderMap) -> Option<String> {
    headers
        .get("Idempotency-Key")
        .or_else(|| headers.get("X-Idempotency-Key"))
        .and_then(|v| v.to_str().ok())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/onboarding/quote", get(get_onboarding_quote))
        .route(
            "/api/v1/onboarding/payment-intents",
            post(post_onboarding_payment_intents),
        )
        .route(
            "/api/v1/onboarding/entitlements/me",
            get(get_onboarding_entitlements_me),
        )
        .route(
            "/api/v1/onboarding/role-confirm",
            post(post_onboarding_role_confirm),
        )
        .merge(local_dev::router())
        .layer(from_fn(onboarding_http_response_metrics_layer))
}

async fn get_onboarding_quote(
    State(state): State<ApiMetaState>,
    Query(q): Query<OnboardingQuoteQuery>,
    headers: HeaderMap,
) -> impl IntoResponse {
    inc_onboarding_quote_get();
    if state.chain_off.is_none() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "chain_off_unavailable",
                "message": "chain_off_unavailable",
                "path": "GET /api/v1/onboarding/quote",
            })),
        )
            .into_response();
    }
    let pool_ref = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref());
    if let Some(resp) =
        crate::middleware::onboarding_quote_rate_limit_response_if_exceeded(pool_ref, &headers).await
    {
        return resp.into_response();
    }
    let role = q.role.as_deref().unwrap_or("provider").to_ascii_lowercase();
    if role != "provider" && role != "region_steward" {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "invalid_onboarding_role",
                "message": "invalid_onboarding_role",
            })),
        )
            .into_response();
    }
    let jurisdictions = match fee_schedule_v1::parse_jurisdictions_csv(q.jurisdictions.as_deref()) {
        Ok(j) => j,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": e.error_code(),
                    "message": e.error_code(),
                })),
            )
                .into_response();
        }
    };
    let local_dev = std::env::var("TRAVELTRUST_ONBOARDING_LOCAL_DEV").as_deref() == Ok("1");
    match fee_schedule_v1::quote_fee_schedule_v1(&role, q.sku.as_deref(), &jurisdictions, local_dev)
    {
        Ok(quote) => {
            let impl_status = if quote.local_dev_override {
                "onboarding_quote_fee_schedule_v1_local_dev_override"
            } else {
                "onboarding_quote_fee_schedule_v1"
            };
            let expires_at = (Utc::now() + Duration::hours(1)).to_rfc3339();
            Json(fee_schedule_v1::quote_to_json(
                &quote,
                &jurisdictions,
                &expires_at,
                impl_status,
            ))
            .into_response()
        }
        Err(e) => {
            let status = match e {
                fee_schedule_v1::FeeScheduleError::YamlLoad(_) => StatusCode::SERVICE_UNAVAILABLE,
                _ => StatusCode::BAD_REQUEST,
            };
            (
                status,
                Json(json!({
                    "status": "error",
                    "error": e.error_code(),
                    "message": e.error_code(),
                })),
            )
                .into_response()
        }
    }
}

async fn post_onboarding_payment_intents(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    inc_onboarding_payment_intents_post();
    if state.chain_off.is_none() {
        return not_impl_json("POST /api/v1/onboarding/payment-intents").into_response();
    }
    let uid = match extract_session_auth_outcome(&state, &headers).await {
        SessionAuthOutcome::User(u) => u,
        SessionAuthOutcome::Unauthorized => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "status": "error",
                    "error": "login_required",
                    "message": "login_required",
                })),
            )
                .into_response();
        }
        SessionAuthOutcome::SessionStoreUnavailable => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "service_unavailable",
                    "message": "service_unavailable",
                })),
            )
                .into_response();
        }
    };

    if let Some(resp) = onboarding_user_write_rate_limit_response_if_exceeded(&uid).await {
        return resp.into_response();
    }

    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.clone()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_payment_not_configured",
                    "message": "onboarding_payment_not_configured",
                    "detail": "PostgreSQL pool not mounted; cannot persist payment intent.",
                })),
            )
                .into_response();
        }
    };

    if onboarding_payment_intents_disabled() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "onboarding_payment_intents_disabled",
                "message": "onboarding_payment_intents_disabled",
                "detail": "ONBOARDING_PAYMENT_INTENTS_DISABLED=1 — creating new payment intents is temporarily disabled.",
            })),
        )
            .into_response();
    }

    let idem = match idempotency_key_from_headers(&headers) {
        Some(k) => k,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "missing_onboarding_idempotency_key",
                    "message": "missing_onboarding_idempotency_key",
                    "detail": "Provide Idempotency-Key or X-Idempotency-Key (04-附录 §1).",
                })),
            )
                .into_response();
        }
    };
    if idem.len() > ONBOARDING_IDEMPOTENCY_KEY_MAX_BYTES {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "invalid_onboarding_idempotency_key",
                "message": "invalid_onboarding_idempotency_key",
                "detail": format!(
                    "Idempotency-Key must be at most {} UTF-8 bytes.",
                    ONBOARDING_IDEMPOTENCY_KEY_MAX_BYTES
                ),
            })),
        )
            .into_response();
    }

    let parsed: PaymentIntentBody = match serde_json::from_value(body) {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "invalid_body",
                    "message": "invalid_body",
                    "detail": e.to_string(),
                })),
            )
                .into_response();
        }
    };

    let role = parsed.role.to_ascii_lowercase();
    if role != "provider" && role != "region_steward" {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "invalid_onboarding_role",
                "message": "invalid_onboarding_role",
            })),
        )
            .into_response();
    }

    let sku_for_quote = parsed
        .sku
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty() && *s != "default");
    let jurisdictions = match fee_schedule_v1::resolve_jurisdictions_for_role(
        &role,
        parsed.jurisdictions.as_deref(),
        None,
    ) {
        Ok(j) => j,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": e.error_code(),
                    "message": e.error_code(),
                })),
            )
                .into_response();
        }
    };
    let local_dev = env::var("TRAVELTRUST_ONBOARDING_LOCAL_DEV").as_deref() == Ok("1");
    let quote = match fee_schedule_v1::quote_fee_schedule_v1(&role, sku_for_quote, &jurisdictions, local_dev)
    {
        Ok(q) => q,
        Err(e) => {
            let status = match e {
                fee_schedule_v1::FeeScheduleError::YamlLoad(_) => StatusCode::SERVICE_UNAVAILABLE,
                _ => StatusCode::BAD_REQUEST,
            };
            return (
                status,
                Json(json!({
                    "status": "error",
                    "error": e.error_code(),
                    "message": e.error_code(),
                })),
            )
                .into_response();
        }
    };
    let fee_schedule_version = quote.fee_schedule_version.clone();
    let expires_at = Utc::now() + Duration::hours(1);
    let pricing_metadata = fee_schedule_v1::entitlement_pricing_metadata(&quote, &jurisdictions);
    let pricing_fields = fee_schedule_v1::payment_intent_pricing_fields(&quote, &jurisdictions);

    let user_row = match get_user_by_id(&pool, uid).await {
        Ok(Some(u)) => u,
        Ok(None) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_user_missing",
                    "message": "onboarding_user_missing",
                })),
            )
                .into_response();
        }
        Err(e) => {
            eprintln!("[onboarding] get_user_by_id err={}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_intent_user_read_failed",
                    "message": "onboarding_intent_user_read_failed",
                })),
            )
                .into_response();
        }
    };
    match onboarding_compliance_evaluate(&user_row.email) {
        OnboardingComplianceEval::Allow => {}
        OnboardingComplianceEval::Forbidden(kind) => {
            persist_onboarding_compliance_screening_hit_best_effort(
                &state,
                &headers,
                uid,
                "POST /api/v1/onboarding/payment-intents",
                kind,
            )
            .await;
            return (
                StatusCode::FORBIDDEN,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_forbidden_sanctions",
                    "message": "onboarding_forbidden_sanctions",
                    "detail": onboarding_compliance_http_detail(kind),
                })),
            )
                .into_response();
        }
        OnboardingComplianceEval::ScreeningUnavailable => {
            let rid = onboarding_request_id_from_headers(&headers);
            audit_onboarding_compliance_screening_unavailable_stderr(
                "POST /api/v1/onboarding/payment-intents",
                rid.as_deref(),
                uid,
                "list_file_path_missing_or_unreadable",
            );
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_compliance_screening_unavailable",
                    "message": "onboarding_compliance_screening_unavailable",
                    "detail": "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE is missing, unreadable, or exceeds configured size limits; fix the mount before accepting traffic.",
                })),
            )
                .into_response();
        }
    }

    let row = match insert_or_get_pending_entitlement(
        &pool,
        uid,
        &role,
        &quote.sku,
        &fee_schedule_version,
        &idem,
        Some(expires_at),
        &pricing_metadata,
    )
    .await
    {
        Ok(InsertPendingEntitlementOutcome::Ok(r)) => r,
        Ok(InsertPendingEntitlementOutcome::IdempotencyConflict) => {
            return (
                StatusCode::CONFLICT,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_idempotency_conflict",
                    "message": "onboarding_idempotency_conflict",
                    "detail": "Idempotency-Key is already bound to another user or a different role/sku/fee_schedule_version.",
                })),
            )
                .into_response();
        }
        Err(e) => {
            eprintln!("[onboarding] insert_or_get_pending_entitlement err={}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_intent_persist_failed",
                    "message": "onboarding_intent_persist_failed",
                })),
            )
                .into_response();
        }
    };

    if stripe_onboarding::stripe_checkout_enabled() {
        let success_url = parsed
            .return_url
            .as_deref()
            .map(str::trim)
            .filter(|s| !s.is_empty());
        let Some(su) = success_url else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "missing_return_url_for_stripe_checkout",
                    "message": "missing_return_url_for_stripe_checkout",
                    "detail": "TRAVELTRUST_ONBOARDING_STRIPE_CHECKOUT=1 requires body.return_url (https) for Stripe Checkout success_url.",
                })),
            )
                .into_response();
        };
        let lower = su.to_ascii_lowercase();
        if (!lower.starts_with("https://") && !lower.starts_with("http://")) || su.len() > 2048 {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "invalid_return_url_for_stripe_checkout",
                    "message": "invalid_return_url_for_stripe_checkout",
                    "detail": "return_url must be http(s) and at most 2048 characters.",
                })),
            )
                .into_response();
        }
        match stripe_onboarding::ensure_checkout_session_for_entitlement(&pool, &row, &idem, su).await {
            Ok(surf) => {
                let impl_status = if surf.session_complete_no_url {
                    "onboarding_checkout_stripe_session_complete"
                } else {
                    "onboarding_checkout_stripe_open"
                };
                let detail = if surf.session_complete_no_url {
                    "Checkout Session completed; wait for Stripe webhook or refresh entitlements. Hosted Checkout reduces in-page card handling; SAQ/PCI boundaries remain per 96-02/96-03."
                } else {
                    "Open psp.checkout_url in browser to pay. Webhook checkout.session.completed (or payment_intent.succeeded) marks paid."
                };
                return Json(merge_payment_intent_pricing_fields(
                    json!({
                    "status": "ok",
                    "entitlement_id": row.id,
                    "idempotency_key": idem,
                    "return_url": parsed.return_url,
                    "psp": {
                        "provider": "stripe",
                        "client_secret": serde_json::Value::Null,
                        "checkout_url": surf.checkout_url,
                    },
                    "meta": {
                        "implementation_status": impl_status,
                        "stripe_checkout_session_id": surf.checkout_session_id,
                        "stripe_checkout_status": surf.session_status,
                        "stripe_payment_intent_id": surf.payment_intent_id,
                        "detail": detail,
                        "doc": concat!("docs", "/spec/", "04-附录-商家主理人准入费HTTP契约草案-配96-18.md", " §2")
                    }
                }),
                    &pricing_fields,
                ))
                .into_response();
            }
            Err(e) => {
                eprintln!("[onboarding] stripe Checkout Session err={}", e);
                return (
                    StatusCode::BAD_GATEWAY,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_psp_unavailable",
                        "message": "onboarding_psp_unavailable",
                        "detail": format!("Stripe Checkout Session: {e}"),
                    })),
                )
                    .into_response();
            }
        }
    }

    if stripe_onboarding::stripe_onboarding_enabled() {
        match stripe_onboarding::ensure_payment_intent_for_entitlement(&pool, &row, &idem).await {
            Ok(surf) => {
                let impl_status = if surf.status == "succeeded" {
                    "onboarding_payment_intent_stripe_completed"
                } else {
                    "onboarding_payment_intent_stripe"
                };
                let detail = if surf.client_secret.is_none() && surf.status != "succeeded" {
                    "Stripe returned no client_secret for this PaymentIntent state."
                } else if surf.status == "succeeded" {
                    "PaymentIntent already succeeded on Stripe; refresh entitlements or wait for webhook."
                } else {
                    "Use psp.client_secret with Stripe.js; configure Stripe webhook POST /api/v1/hooks/stripe/onboarding."
                };
                return Json(merge_payment_intent_pricing_fields(
                    json!({
                    "status": "ok",
                    "entitlement_id": row.id,
                    "idempotency_key": idem,
                    "return_url": parsed.return_url,
                    "psp": {
                        "provider": "stripe",
                        "client_secret": surf.client_secret,
                        "checkout_url": serde_json::Value::Null,
                    },
                    "meta": {
                        "implementation_status": impl_status,
                        "stripe_payment_intent_id": surf.payment_intent_id,
                        "stripe_status": surf.status,
                        "detail": detail,
                        "doc": concat!("docs", "/spec/", "04-附录-商家主理人准入费HTTP契约草案-配96-18.md", " §2")
                    }
                }),
                    &pricing_fields,
                ))
                .into_response();
            }
            Err(e) => {
                eprintln!("[onboarding] stripe PaymentIntent err={}", e);
                return (
                    StatusCode::BAD_GATEWAY,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_psp_unavailable",
                        "message": "onboarding_psp_unavailable",
                        "detail": format!("Stripe PaymentIntent: {e}"),
                    })),
                )
                    .into_response();
            }
        }
    }

    Json(merge_payment_intent_pricing_fields(
        json!({
        "status": "ok",
        "entitlement_id": row.id,
        "idempotency_key": idem,
        "return_url": parsed.return_url,
        "psp": {
            "client_secret": serde_json::Value::Null,
            "checkout_url": serde_json::Value::Null,
        },
        "meta": {
            "implementation_status": "onboarding_payment_intent_persisted",
            "detail": "PSP client_secret/checkout not wired — entitlement stays pending until POST /api/v1/internal/onboarding/payments/webhook marks paid.",
            "doc": concat!("docs", "/spec/", "04-附录-商家主理人准入费HTTP契约草案-配96-18.md", " §2")
        }
    }),
        &pricing_fields,
    ))
    .into_response()
}

async fn get_onboarding_entitlements_me(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    inc_onboarding_entitlements_me_get();
    if state.chain_off.is_none() {
        return not_impl_json("GET /api/v1/onboarding/entitlements/me").into_response();
    }
    let uid = match extract_session_auth_outcome(&state, &headers).await {
        SessionAuthOutcome::User(u) => u,
        SessionAuthOutcome::Unauthorized => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "status": "error",
                    "error": "login_required",
                    "message": "login_required",
                })),
            )
                .into_response();
        }
        SessionAuthOutcome::SessionStoreUnavailable => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "service_unavailable",
                    "message": "service_unavailable",
                })),
            )
                .into_response();
        }
    };

    if let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.clone()) {
        let rows = match list_entitlements_for_user(&pool, uid).await {
            Ok(r) => r,
            Err(e) => {
                eprintln!("[onboarding] list_entitlements_for_user err={}", e);
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({
                        "status": "error",
                        "error": "onboarding_entitlements_read_failed",
                        "message": "onboarding_entitlements_read_failed",
                    })),
                )
                    .into_response();
            }
        };
        let items: Vec<serde_json::Value> = rows.iter().map(entitlement_to_json).collect();
        return Json(json!({
            "status": "ok",
            "entitlements": items,
            "meta": { "implementation_status": "onboarding_entitlements_db" }
        }))
        .into_response();
    }

    Json(json!({
        "status": "ok",
        "entitlements": [],
        "meta": { "implementation_status": "onboarding_entitlements_stub" }
    }))
    .into_response()
}

async fn post_onboarding_role_confirm(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    inc_onboarding_role_confirm_post();
    if state.chain_off.is_none() {
        return not_impl_json("POST /api/v1/onboarding/role-confirm").into_response();
    }
    let uid = match extract_session_auth_outcome(&state, &headers).await {
        SessionAuthOutcome::User(u) => u,
        SessionAuthOutcome::Unauthorized => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "status": "error",
                    "error": "login_required",
                    "message": "login_required",
                })),
            )
                .into_response();
        }
        SessionAuthOutcome::SessionStoreUnavailable => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "service_unavailable",
                    "message": "service_unavailable",
                })),
            )
                .into_response();
        }
    };

    if let Some(resp) = onboarding_user_write_rate_limit_response_if_exceeded(&uid).await {
        return resp.into_response();
    }

    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.clone()) {
        Some(p) => p,
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_entitlement_required",
                    "message": "onboarding_entitlement_required",
                    "detail": "No database pool; cannot verify paid entitlement.",
                })),
            )
                .into_response();
        }
    };

    let user_row = match get_user_by_id(&pool, uid).await {
        Ok(Some(u)) => u,
        Ok(None) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_user_missing",
                    "message": "onboarding_user_missing",
                })),
            )
                .into_response();
        }
        Err(e) => {
            eprintln!("[onboarding] role_confirm get_user_by_id err={}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_role_confirm_user_read_failed",
                    "message": "onboarding_role_confirm_user_read_failed",
                })),
            )
                .into_response();
        }
    };
    match onboarding_compliance_evaluate(&user_row.email) {
        OnboardingComplianceEval::Allow => {}
        OnboardingComplianceEval::Forbidden(kind) => {
            persist_onboarding_compliance_screening_hit_best_effort(
                &state,
                &headers,
                uid,
                "POST /api/v1/onboarding/role-confirm",
                kind,
            )
            .await;
            return (
                StatusCode::FORBIDDEN,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_forbidden_sanctions",
                    "message": "onboarding_forbidden_sanctions",
                    "detail": onboarding_compliance_http_detail(kind),
                })),
            )
                .into_response();
        }
        OnboardingComplianceEval::ScreeningUnavailable => {
            let rid = onboarding_request_id_from_headers(&headers);
            audit_onboarding_compliance_screening_unavailable_stderr(
                "POST /api/v1/onboarding/role-confirm",
                rid.as_deref(),
                uid,
                "list_file_path_missing_or_unreadable",
            );
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_compliance_screening_unavailable",
                    "message": "onboarding_compliance_screening_unavailable",
                    "detail": "ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE is missing, unreadable, or exceeds configured size limits; fix the mount before accepting traffic.",
                })),
            )
                .into_response();
        }
    }

    let parsed: RoleConfirmBody = match serde_json::from_value(body) {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({
                    "status": "error",
                    "error": "invalid_body",
                    "message": "invalid_body",
                    "detail": e.to_string(),
                })),
            )
                .into_response();
        }
    };

    let role = parsed.role.to_ascii_lowercase();
    if role != "provider" && role != "region_steward" {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "invalid_onboarding_role",
                "message": "invalid_onboarding_role",
            })),
        )
            .into_response();
    }

    let ent = match find_paid_entitlement_for_role(&pool, uid, &role).await {
        Ok(v) => v,
        Err(e) => {
            eprintln!("[onboarding] find_paid_entitlement_for_role err={}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_role_confirm_read_failed",
                    "message": "onboarding_role_confirm_read_failed",
                })),
            )
                .into_response();
        }
    };

    if ent.is_none() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "onboarding_entitlement_required",
                "message": "onboarding_entitlement_required",
                "detail": "No paid entitlement for requested role.",
            })),
        )
            .into_response();
    }

    let n = match update_user_role_if_safe(&pool, uid, &role).await {
        Ok(v) => v,
        Err(e) => {
            eprintln!("[onboarding] update_user_role_if_safe err={}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "error": "onboarding_role_confirm_write_failed",
                    "message": "onboarding_role_confirm_write_failed",
                })),
            )
                .into_response();
        }
    };

    if n > 0 {
        if let Some(co) = state.chain_off.as_ref() {
            let mut store = co.store.write().await;
            if let Some(u) = store.users.get_mut(&uid) {
                u.role = role.clone();
            }
        }
    }

    Json(json!({
        "status": "ok",
        "role": role,
        "updated": n > 0,
        "meta": { "implementation_status": "onboarding_role_confirm_db" }
    }))
    .into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
    use crate::state::test_support::api_meta_state;
    use axum::body::Body;
    use axum::http::{header, Request, StatusCode};
    use http_body_util::BodyExt;
    use std::sync::Arc;
    use tokio::sync::RwLock;
    use tower::util::ServiceExt;
    use uuid::Uuid;

    fn chain_off_minimal() -> ChainOffState {
        ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: None,
        }
    }

    fn bearer_for(uid: Uuid) -> String {
        format!("Bearer bearer_{uid}")
    }

    /// **93 · B-ONB-QUOTE / F-034** ↔ **`matrix_93_b_onb_001a_f034_*`**（**`onboarding::router`**；**无** **`chain_off`** → **503** **`chain_off_unavailable`**）。
    #[tokio::test]
    async fn matrix_93_b_onb_001a_f034_get_onboarding_quote_chain_off_unavailable_503_subrouter() {
        let app = router().with_state(api_meta_state(None));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/onboarding/quote?role=provider")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["error"], "chain_off_unavailable");
    }

    /// **93 · B-ONB-QUOTE / F-034** ↔ **`matrix_93_b_onb_001b_f034_*`**（**无效** **`role`** → **400** **`invalid_onboarding_role`**）。
    #[tokio::test]
    async fn matrix_93_b_onb_001b_f034_get_onboarding_quote_invalid_role_400_subrouter() {
        let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/onboarding/quote?role=tourist")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["error"], "invalid_onboarding_role");
    }

    /// **93 · B-ONB-QUOTE / F-034** ↔ **`fee_schedule_v1`** 默认计价。
    #[tokio::test]
    async fn matrix_93_b_onb_001c_f034_get_onboarding_quote_provider_fee_schedule_v1_200_subrouter() {
        let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/onboarding/quote?role=provider&jurisdictions=US")
                    .header("x-forwarded-for", "203.0.113.12")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["fee_schedule_version"], "fee_schedule_v1");
        assert_eq!(v["meta"]["implementation_status"], "onboarding_quote_fee_schedule_v1");
    }

    /// **93 · B-ONB-PAY / F-035** ↔ **`matrix_93_b_onb_002a_f035_*`**（**无** 鉴权头 → **401**）。
    #[tokio::test]
    async fn matrix_93_b_onb_002a_f035_post_onboarding_payment_intents_unauthorized_401_subrouter() {
        let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
        let res = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/onboarding/payment-intents")
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(r#"{"role":"provider"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    }

    /// **93 · B-ONB-PAY / F-035** ↔ **`matrix_93_b_onb_002b_f035_*`**（**Bearer** **链下** → **503** **`onboarding_payment_not_configured`** **stub**）。
    #[tokio::test]
    async fn matrix_93_b_onb_002b_f035_post_onboarding_payment_intents_stub_not_configured_503_subrouter(
    ) {
        let uid = Uuid::new_v4();
        let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
        let res = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/onboarding/payment-intents")
                    .header(header::AUTHORIZATION, bearer_for(uid))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from(r#"{"role":"provider"}"#))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["error"], "onboarding_payment_not_configured");
    }

    /// **93 · B-ONB-ENT / F-037** ↔ **`matrix_93_b_onb_003a_f037_*`**（**策略 B** **资格** **端点**；**无** 鉴权 → **401**）。
    #[tokio::test]
    async fn matrix_93_b_onb_003a_f037_get_onboarding_entitlements_me_unauthorized_401_subrouter() {
        let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/onboarding/entitlements/me")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    }

    /// **93 · B-ONB-ENT / F-037** ↔ **`matrix_93_b_onb_003b_f037_*`**（**stub** **空** **`entitlements`**）。
    #[tokio::test]
    async fn matrix_93_b_onb_003b_f037_get_onboarding_entitlements_me_empty_ok_200_subrouter() {
        let uid = Uuid::new_v4();
        let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
        let res = app
            .oneshot(
                Request::builder()
                    .uri("/api/v1/onboarding/entitlements/me")
                    .header(header::AUTHORIZATION, bearer_for(uid))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert!(v["entitlements"].as_array().unwrap().is_empty());
        assert_eq!(v["meta"]["implementation_status"], "onboarding_entitlements_stub");
    }

    /// **93 · B-ONB-ROLE / F-038** ↔ **`matrix_93_b_onb_004a_f038_*`**（**无** 资格 **→** **400** **`onboarding_entitlement_required`**）。
    #[tokio::test]
    async fn matrix_93_b_onb_004a_f038_post_onboarding_role_confirm_entitlement_required_400_subrouter(
    ) {
        let uid = Uuid::new_v4();
        let app = router().with_state(api_meta_state(Some(chain_off_minimal())));
        let res = app
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/v1/onboarding/role-confirm")
                    .header(header::AUTHORIZATION, bearer_for(uid))
                    .header(header::CONTENT_TYPE, "application/json")
                    .body(Body::from("{}"))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["error"], "onboarding_entitlement_required");
    }

    /// **96-18 R3**：拒服审计 JSON 键稳定（**无** email 字段）。
    #[test]
    fn onboarding_compliance_audit_payload_has_stable_keys() {
        let uid = Uuid::nil();
        let v = super::onboarding_compliance_audit_payload(
            "POST /api/v1/onboarding/payment-intents",
            Some("rid-x"),
            uid,
            super::OnboardingComplianceBlockKind::EmailDenylistHit,
        );
        assert_eq!(v["audit_schema"], "traveltrust.onboarding_compliance.v1");
        assert_eq!(v["decision"], "email_denylist_hit");
        assert_eq!(v["screening_tier"], "env_substring_only");
        assert_eq!(v["request_id"], "rid-x");
        assert_eq!(
            v["user_id"].as_str().unwrap(),
            "00000000-0000-0000-0000-000000000000"
        );
        assert!(v.get("email").is_none());
    }

    #[test]
    fn onboarding_compliance_audit_payload_stub_reject_keys() {
        let uid = Uuid::nil();
        let v = super::onboarding_compliance_audit_payload(
            "POST /api/v1/onboarding/payment-intents",
            None,
            uid,
            super::OnboardingComplianceBlockKind::StubProviderReject,
        );
        assert_eq!(v["decision"], "stub_provider_reject");
        assert_eq!(v["screening_tier"], "stub_provider_only");
        assert_eq!(v["request_id"], "-");
    }

    #[test]
    fn onboarding_compliance_audit_payload_list_file_hit_keys() {
        let uid = Uuid::nil();
        let v = super::onboarding_compliance_audit_payload(
            "POST /api/v1/onboarding/role-confirm",
            Some("rid-lf"),
            uid,
            super::OnboardingComplianceBlockKind::ListFileHit,
        );
        assert_eq!(v["decision"], "list_file_hit");
        assert_eq!(v["screening_tier"], "static_file_exact_match");
        assert_eq!(v["request_id"], "rid-lf");
        assert!(v.get("email").is_none());
    }
}
