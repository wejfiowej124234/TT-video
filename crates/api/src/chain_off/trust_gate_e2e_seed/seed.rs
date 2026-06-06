//! `seed_trust_gate_e2e_fixtures`：bcrypt →内存→PG best-effort→档期虚拟锁→JSON。

use chrono::{Duration as ChronoDuration, Utc};
use serde_json::json;

use crate::chain_off::ChainOffState;
use crate::schedule_engine;

use super::fixture_response;
use super::ids::TrustGateFixtureIds;
use super::memory;
use super::pg_sync;
use super::prefix::SEED_PASSWORD;

/// 注入 trust-gate Playwright 夹具，返回前端可用的 id / 邮箱映射 JSON。
pub async fn seed_trust_gate_e2e_fixtures(state: &ChainOffState) -> serde_json::Value {
    let password_hash = match bcrypt::hash(SEED_PASSWORD, bcrypt::DEFAULT_COST) {
        Ok(h) => h,
        Err(_) => {
            return json!({
                "status": "error",
                "error": "trust_gate_e2e_bcrypt_failed",
                "message": "trust_gate_e2e_bcrypt_failed"
            });
        }
    };
    let now = Utc::now();
    let old_created = now - ChronoDuration::days(3);
    let ids = TrustGateFixtureIds::bundled();

    {
        let mut store = state.store.write().await;
        memory::fill_store(&mut store, &ids, &password_hash, now, old_created);
    }

    pg_sync::best_effort_double_write(state).await;

    let _ =
        schedule_engine::lock_slot(ids.gr_main, ids.o_slot_virtual, ids.june10, ids.june12).await;

    fixture_response::success_value(&ids)
}
