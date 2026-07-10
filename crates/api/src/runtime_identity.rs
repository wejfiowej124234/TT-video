//! Platform-wide runtime identity — **single resolver** for deployment profile semantics.
//!
//! All feature gates (showcase seed, public market walkthrough, catalog filters) should call
//! [`RuntimeIdentity::current()`] instead of reading `TRAVELTRUST_DEPLOYMENT_PROFILE` ad hoc.
//!
//! SSOT: `registry/runtime-identity-ssot.v1.json` · Node mirror: `scripts/dev/lib/runtime-identity.cjs`

use std::env;

/// Resolved runtime profile (matches Release Train / RuntimeIdentity SSOT).
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[serde(rename_all = "snake_case")]
pub enum RuntimeProfile {
    Production,
    Staging,
    Development,
    Demo,
    Local,
    Unknown,
}

/// Current process identity snapshot.
#[derive(Debug, Clone, serde::Serialize)]
pub struct RuntimeIdentity {
    pub profile: RuntimeProfile,
    pub deployment_profile_raw: Option<String>,
    pub public_content_profile: &'static str,
}

impl RuntimeIdentity {
    /// Single entry point — mirrors `RuntimeIdentity.current()` in Node guards.
    pub fn current() -> Self {
        let raw = env::var("TRAVELTRUST_DEPLOYMENT_PROFILE")
            .ok()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());
        let profile = resolve_profile(raw.as_deref());
        let public_content_profile = derive_public_content_profile(raw.as_deref());
        Self {
            profile,
            deployment_profile_raw: raw,
            public_content_profile,
        }
    }

    pub fn is_production(&self) -> bool {
        self.profile == RuntimeProfile::Production
    }

    pub fn is_staging(&self) -> bool {
        self.profile == RuntimeProfile::Staging
    }

    pub fn is_local(&self) -> bool {
        self.profile == RuntimeProfile::Local
    }

    pub fn is_development(&self) -> bool {
        self.profile == RuntimeProfile::Development
    }

    pub fn is_demo(&self) -> bool {
        self.profile == RuntimeProfile::Demo
    }

    /// Community showcase PG seed (`TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1`).
    pub fn allows_community_showcase_seed(&self) -> bool {
        if self.is_production() || self.is_staging() {
            return false;
        }
        env_flag_on("TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE") == Some(true)
    }

    /// Local walkthrough guide in public market (`guide@test.com`).
    pub fn allows_seed_guide_public_market(&self) -> bool {
        if let Some(v) = env_flag_on("TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET") {
            return v;
        }
        if env_flag_on("TRAVELTRUST_MANUAL_ACCEPTANCE") == Some(true) {
            return true;
        }
        self.deployment_profile_raw.as_deref() == Some("local")
            && env::var("SEED_TEST_ACCOUNTS").as_deref() == Ok("1")
            && public_catalog_surface_filter_enabled()
    }

    /// Local walkthrough multi-demo in public market.
    pub fn allows_seed_multi_demo_public_market(&self) -> bool {
        if let Some(v) = env_flag_on("TRAVELTRUST_SEED_MULTI_DEMO_PUBLIC_MARKET") {
            return v;
        }
        if env_flag_on("TRAVELTRUST_MANUAL_ACCEPTANCE") == Some(true) {
            return true;
        }
        self.deployment_profile_raw.as_deref() == Some("local")
            && env::var("SEED_TEST_ACCOUNTS").as_deref() == Ok("1")
            && public_catalog_surface_filter_enabled()
    }
}

fn resolve_profile(raw: Option<&str>) -> RuntimeProfile {
    let seed_on = env::var("SEED_TEST_ACCOUNTS").as_deref() == Ok("1");
    let cors_empty = env::var("CORS_ORIGINS")
        .map(|s| s.trim().is_empty())
        .unwrap_or(true);
    let showcase_on = env_flag_on("TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE") == Some(true)
        || env_flag_on("TRAVELTRUST_MARKET_PUBLIC_SHOWCASE") == Some(true)
        || env_flag_on("DID_RANK_SEED_MARKET_DEMO") == Some(true);

    match raw.map(|s| s.to_ascii_lowercase()).as_deref() {
        Some("production") | Some("prod") => RuntimeProfile::Production,
        Some("staging") | Some("staging_mirror") => RuntimeProfile::Staging,
        Some("local") => {
            if showcase_on {
                RuntimeProfile::Demo
            } else if seed_on {
                RuntimeProfile::Development
            } else {
                RuntimeProfile::Local
            }
        }
        None if seed_on && cors_empty => {
            if showcase_on {
                RuntimeProfile::Demo
            } else {
                RuntimeProfile::Development
            }
        }
        None => RuntimeProfile::Unknown,
        Some(_) => RuntimeProfile::Unknown,
    }
}

fn derive_public_content_profile(raw: Option<&str>) -> &'static str {
    match raw.map(|s| s.to_ascii_lowercase()).as_deref() {
        Some("production") if !showcase_or_demo_on() => "production",
        Some("staging") => "staging",
        Some("local") if showcase_or_demo_on() => "demo",
        Some("local") if env::var("SEED_TEST_ACCOUNTS").as_deref() == Ok("1") => "development",
        Some("local") => "local",
        _ => "unknown",
    }
}

fn showcase_or_demo_on() -> bool {
    env_flag_on("TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE") == Some(true)
        || env_flag_on("TRAVELTRUST_MARKET_PUBLIC_SHOWCASE") == Some(true)
        || env_flag_on("DID_RANK_SEED_MARKET_DEMO") == Some(true)
}

fn env_flag_on(name: &str) -> Option<bool> {
    match env::var(name).ok().as_deref().map(str::trim) {
        Some("0") | Some("false") | Some("FALSE") => Some(false),
        Some("1") | Some("true") | Some("TRUE") => Some(true),
        _ => None,
    }
}

fn public_catalog_surface_filter_enabled() -> bool {
    if let Some(v) = env_flag_on("TRAVELTRUST_PUBLIC_CATALOG_SURFACE") {
        return v;
    }
    if let Some(v) = env_flag_on("TRAVELTRUST_MARKET_PUBLIC_SURFACE") {
        return v;
    }
    if env::var("P3_CHAIN_OFF").as_deref() == Ok("1") {
        return true;
    }
    env::var("SEED_TEST_ACCOUNTS").as_deref() == Ok("1")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn with_vars(pairs: &[(&str, Option<&str>)], f: impl FnOnce()) {
        let saved: Vec<(String, Option<String>)> = pairs
            .iter()
            .map(|(k, _)| (k.to_string(), env::var(k).ok()))
            .collect();
        for (k, v) in pairs {
            match v {
                Some(val) => env::set_var(k, val),
                None => env::remove_var(k),
            }
        }
        f();
        for (k, v) in saved {
            match v {
                Some(val) => env::set_var(&k, val),
                None => env::remove_var(&k),
            }
        }
    }

    #[test]
    fn production_profile_resolves() {
        with_vars(
            &[
                ("TRAVELTRUST_DEPLOYMENT_PROFILE", Some("production")),
                ("SEED_TEST_ACCOUNTS", Some("0")),
            ],
            || {
                let id = RuntimeIdentity::current();
                assert!(id.is_production());
                assert_eq!(id.public_content_profile, "production");
                assert!(!id.allows_community_showcase_seed());
            },
        );
    }

    #[test]
    fn local_development_with_seed() {
        let _env = crate::test_env_serial::lock();
        with_vars(
            &[
                ("TRAVELTRUST_DEPLOYMENT_PROFILE", Some("local")),
                ("SEED_TEST_ACCOUNTS", Some("1")),
                ("TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE", None),
            ],
            || {
                let id = RuntimeIdentity::current();
                assert_eq!(id.profile, RuntimeProfile::Development);
            },
        );
    }
}
