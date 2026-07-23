//! GET `/meta` process-local TTL cache + build singleflight (PERF-001 / PERF-002).
//!
//! Full `/meta` embeds a large SSOT rule corpus (~75KB). Concurrent stampede rebuilds
//! dominate Staging TTFB. Identity probes use `/meta/build` / `/meta/release-identity`;
//! FE hot path prefers `?compact=1` (strips `rule` / `*_top_keys` / `*_contract_*`).

use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

use serde_json::Value;
use tokio::sync::Mutex as AsyncMutex;

#[derive(Clone, Copy, Debug, Eq, PartialEq, Hash)]
pub(super) enum MetaCacheKey {
    Full,
    Compact,
}

impl MetaCacheKey {
    pub(super) fn from_compact(compact: bool) -> Self {
        if compact {
            Self::Compact
        } else {
            Self::Full
        }
    }
}

struct Entry {
    at: Instant,
    body: Value,
}

struct Slot {
    entry: Option<Entry>,
}

fn ttl() -> Duration {
    let secs = std::env::var("META_RESPONSE_CACHE_TTL_SECS")
        .ok()
        .and_then(|v| v.parse::<u64>().ok())
        .unwrap_or(5)
        .clamp(1, 60);
    Duration::from_secs(secs)
}

fn slots() -> &'static Mutex<[Slot; 2]> {
    static SLOTS: OnceLock<Mutex<[Slot; 2]>> = OnceLock::new();
    SLOTS.get_or_init(|| {
        Mutex::new([
            Slot { entry: None },
            Slot { entry: None },
        ])
    })
}

fn idx(key: MetaCacheKey) -> usize {
    match key {
        MetaCacheKey::Full => 0,
        MetaCacheKey::Compact => 1,
    }
}

fn build_locks() -> &'static [AsyncMutex<()>; 2] {
    static LOCKS: OnceLock<[AsyncMutex<()>; 2]> = OnceLock::new();
    LOCKS.get_or_init(|| [AsyncMutex::new(()), AsyncMutex::new(())])
}

/// Return cached body when fresh; otherwise `None`.
pub(super) fn get(key: MetaCacheKey) -> Option<Value> {
    let guard = slots().lock().unwrap_or_else(|e| e.into_inner());
    let slot = &guard[idx(key)];
    let e = slot.entry.as_ref()?;
    if e.at.elapsed() < ttl() {
        Some(e.body.clone())
    } else {
        None
    }
}

pub(super) fn put(key: MetaCacheKey, body: Value) {
    let mut guard = slots().lock().unwrap_or_else(|e| e.into_inner());
    guard[idx(key)].entry = Some(Entry {
        at: Instant::now(),
        body,
    });
}

/// Serialize builders per cache key (singleflight). Caller still double-checks `get` after lock.
pub(super) async fn lock_build(key: MetaCacheKey) -> tokio::sync::MutexGuard<'static, ()> {
    build_locks()[idx(key)].lock().await
}

/// Strip verbose SSOT self-description keys; keep operational fields FE/hot-path need.
pub(super) fn strip_meta_verbose_keys(value: &mut Value) {
    match value {
        Value::Object(map) => {
            map.retain(|k, _| {
                if k == "rule" {
                    return false;
                }
                if k.ends_with("_top_keys") {
                    return false;
                }
                if k.contains("_top_keys_contract_") {
                    return false;
                }
                true
            });
            for v in map.values_mut() {
                strip_meta_verbose_keys(v);
            }
        }
        Value::Array(arr) => {
            for v in arr.iter_mut() {
                strip_meta_verbose_keys(v);
            }
        }
        _ => {}
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn strip_removes_rule_and_top_keys_keeps_ops() {
        let mut v = json!({
            "pause": { "enabled": false, "rule": "long", "pause_top_keys": ["a"], "pause_top_keys_contract_737": "c" },
            "orders": { "order_mock_pay_enabled": true, "rule": "x" },
            "meta_top_keys": ["service"],
            "meta_top_keys_contract_728": "728",
            "chain": {
                "chain_id": "11155111",
                "contracts": {
                    "fee_router_address": "0xabc",
                    "chain_contracts_top_keys": ["fee_router_address"],
                    "chain_contracts_top_keys_contract_759": "759",
                    "rule": "long"
                }
            }
        });
        strip_meta_verbose_keys(&mut v);
        assert_eq!(v["pause"]["enabled"], false);
        assert!(v["pause"].get("rule").is_none());
        assert!(v["pause"].get("pause_top_keys").is_none());
        assert_eq!(v["orders"]["order_mock_pay_enabled"], true);
        assert!(v.get("meta_top_keys").is_none());
        assert_eq!(v["chain"]["chain_id"], "11155111");
        assert_eq!(v["chain"]["contracts"]["fee_router_address"], "0xabc");
        assert!(v["chain"]["contracts"].get("rule").is_none());
        assert!(v["chain"]["contracts"].get("chain_contracts_top_keys").is_none());
    }

    #[test]
    fn cache_roundtrip_ttl() {
        put(MetaCacheKey::Compact, json!({"ok": true}));
        let hit = get(MetaCacheKey::Compact).expect("cached");
        assert_eq!(hit["ok"], true);
        assert!(get(MetaCacheKey::Full).is_none());
    }
}
