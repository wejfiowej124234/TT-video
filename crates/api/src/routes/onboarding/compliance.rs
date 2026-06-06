//! 96-04 / 96-18：准入合规筛查（env denylist、静态名单、stub）；审计负载与 DB best-effort 落库。

use axum::http::HeaderMap;
use serde_json::json;
use std::collections::HashSet;
use std::env;
use std::path::{Path, PathBuf};
use std::sync::{Arc, RwLock};
use uuid::Uuid;

use crate::db::insert_onboarding_compliance_audit_event;
use crate::state::ApiMetaState;

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
pub(super) enum OnboardingComplianceScreeningMode {
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
    };    match raw.as_str() {
        "off" | "none" | "disabled" => OnboardingComplianceScreeningMode::Off,
        "stub_reject_all" | "stub_reject" => OnboardingComplianceScreeningMode::StubRejectAll,
        "list_file" | "email_list_file" | "static_list_file" => {
            OnboardingComplianceScreeningMode::ListFile
        }
        "env_email_denylist" | "env_denylist" | "default" => {
            OnboardingComplianceScreeningMode::EnvEmailDenylist
        }
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
    };    let email_lc = email.to_lowercase();
    for seg in raw.split(',') {
        let s = seg.trim();
        if s.is_empty() {
            continue;
        };        if email_lc.contains(&s.to_lowercase()) {
            return true;
        }
    }
    false
}

fn onboarding_compliance_email_list_file_path() -> Option<PathBuf> {
    let Ok(s) = env::var("ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE") else {
        return None;
    };    let t = s.trim();
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
    };    let text = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    let mut set = HashSet::new();
    let mut lines = 0usize;
    for line in text.lines() {
        lines += 1;
        if lines > ONBOARDING_COMPLIANCE_LIST_FILE_MAX_LINES {
            return Err(format!(
                "list file exceeds max lines {}",
                ONBOARDING_COMPLIANCE_LIST_FILE_MAX_LINES
            ));
        };        let t = line.trim();
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
    };    let entries = Arc::new(parse_onboarding_compliance_list_file(path)?);
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
pub(crate) enum OnboardingComplianceBlockKind {
    EmailDenylistHit,
    StubProviderReject,
    /// 静态名单文件整邮命中（**仍非** OFAC 实时 API）。
    ListFileHit,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum OnboardingComplianceEval {
    Allow,
    Forbidden(OnboardingComplianceBlockKind),
    /// **`list_file`** 模式下列文件不可读/缺失/超限 — **503**（**不**冒充制裁命中）。
    ScreeningUnavailable,
}

pub(super) fn onboarding_compliance_evaluate(email: &str) -> OnboardingComplianceEval {
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
            };            let set = match list_file_entries_cached(&path) {
                Ok(s) => s,
                Err(e) => {
                    eprintln!(
                        "[onboarding] ONBOARDING_COMPLIANCE_EMAIL_LIST_FILE load failed: {}",
                        e
                    );
                    return OnboardingComplianceEval::ScreeningUnavailable;
                }
            };            let em = email.trim().to_lowercase();
            if set.contains(&em) {
                OnboardingComplianceEval::Forbidden(OnboardingComplianceBlockKind::ListFileHit)
            } else {
                OnboardingComplianceEval::Allow
            }
        }
    }
}

pub(super) fn onboarding_compliance_http_detail(
    kind: OnboardingComplianceBlockKind,
) -> &'static str {
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

pub(super) fn onboarding_request_id_from_headers(headers: &HeaderMap) -> Option<String> {
    headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
}

/// **96-04 / 96-18 §9.1 R3**：机读负载（**不**含 email **PII**）。
pub(crate) fn onboarding_compliance_audit_payload(
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
pub(super) fn audit_onboarding_compliance_screening_unavailable_stderr(
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

pub(super) async fn persist_onboarding_compliance_screening_hit_best_effort(
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
    };    if let Err(e) =
        insert_onboarding_compliance_audit_event(db_pool, user_id, rid.as_deref(), route).await
    {
        eprintln!(
            "[onboarding] insert_onboarding_compliance_audit_event route={} err={}",
            route, e
        );
    }
}
