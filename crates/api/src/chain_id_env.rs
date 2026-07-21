//! CHAIN_ID resolution — MN-CFG-137 fail-closed for staging/production.
//!
//! Local/dev may still use legacy default **137** when explicitly allowed.
//! Staging / production / `TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS=1` / `TRAVELTRUST_REQUIRE_CHAIN_ID=1`
//! **must** set `CHAIN_ID` (no silent Polygon default).

use std::env;

use crate::runtime_identity::RuntimeIdentity;

/// True when missing / invalid `CHAIN_ID` must refuse (no default 137).
#[must_use]
pub fn chain_id_fail_closed() -> bool {
    if env_flag_on("TRAVELTRUST_REQUIRE_CHAIN_ID") {
        return true;
    }
    if env_flag_on("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS") {
        return true;
    }
    let id = RuntimeIdentity::current();
    id.is_production() || id.is_staging()
}

#[must_use]
fn env_flag_on(key: &str) -> bool {
    matches!(
        env::var(key).ok().as_deref().map(str::trim),
        Some("1") | Some("true") | Some("TRUE") | Some("yes") | Some("YES") | Some("on") | Some("ON")
    )
}

/// Parse explicit `CHAIN_ID` when set and positive.
#[must_use]
pub fn parse_explicit_chain_id() -> Option<u64> {
    env::var("CHAIN_ID")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .and_then(|s| s.parse::<u64>().ok())
        .filter(|&id| id > 0)
}

/// Resolve business chain id for ChainConfig / money-path binds.
///
/// - Explicit `CHAIN_ID` → Some(id)
/// - Fail-closed profile + missing → None (caller must refuse)
/// - Local/dev legacy → Some(137)
#[must_use]
pub fn resolve_business_chain_id() -> Option<u64> {
    if let Some(id) = parse_explicit_chain_id() {
        return Some(id);
    }
    if chain_id_fail_closed() {
        return None;
    }
    Some(137)
}

/// String form for meta / observability (legacy local default only when not fail-closed).
#[must_use]
pub fn resolve_business_chain_id_string() -> Option<String> {
    resolve_business_chain_id().map(|id| id.to_string())
}

/// Startup gate: staging/production must have explicit CHAIN_ID.
pub fn enforce_startup_chain_id_or_exit() {
    if !chain_id_fail_closed() {
        return;
    }
    if parse_explicit_chain_id().is_some() {
        return;
    }
    eprintln!(
        "MN-CFG-137: CHAIN_ID required under staging/production / PRODUCTION_SAFE_DEFAULTS (no default 137); refusing start"
    );
    std::process::exit(1);
}

/// Startup gate: staging/production must have non-empty INTERNAL_API_SECRET.
pub fn enforce_startup_internal_api_secret_or_exit() {
    if !chain_id_fail_closed() {
        // same profile gate as chain id (staging/prod/safe-defaults)
        return;
    }
    let ok = env::var("INTERNAL_API_SECRET")
        .ok()
        .map(|s| !s.trim().is_empty())
        .unwrap_or(false);
    if ok {
        return;
    }
    eprintln!(
        "MN-IAS-01: INTERNAL_API_SECRET required under staging/production / PRODUCTION_SAFE_DEFAULTS (fail-closed); refusing start"
    );
    std::process::exit(1);
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Mutex, OnceLock};

    fn env_lock() -> std::sync::MutexGuard<'static, ()> {
        static M: OnceLock<Mutex<()>> = OnceLock::new();
        M.get_or_init(|| Mutex::new(())).lock().unwrap()
    }

    #[test]
    fn resolve_uses_explicit_chain_id() {
        let _g = env_lock();
        std::env::set_var("CHAIN_ID", "11155111");
        std::env::remove_var("TRAVELTRUST_REQUIRE_CHAIN_ID");
        std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
        std::env::remove_var("TRAVELTRUST_DEPLOYMENT_PROFILE");
        assert_eq!(resolve_business_chain_id(), Some(11155111));
        std::env::remove_var("CHAIN_ID");
    }

    #[test]
    fn resolve_fail_closed_when_require_flag() {
        let _g = env_lock();
        std::env::remove_var("CHAIN_ID");
        std::env::set_var("TRAVELTRUST_REQUIRE_CHAIN_ID", "1");
        std::env::remove_var("TRAVELTRUST_DEPLOYMENT_PROFILE");
        assert_eq!(resolve_business_chain_id(), None);
        std::env::remove_var("TRAVELTRUST_REQUIRE_CHAIN_ID");
    }

    #[test]
    fn resolve_legacy_137_when_local() {
        let _g = env_lock();
        std::env::remove_var("CHAIN_ID");
        std::env::remove_var("TRAVELTRUST_REQUIRE_CHAIN_ID");
        std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
        std::env::set_var("TRAVELTRUST_DEPLOYMENT_PROFILE", "local");
        assert_eq!(resolve_business_chain_id(), Some(137));
        std::env::remove_var("TRAVELTRUST_DEPLOYMENT_PROFILE");
    }
}
