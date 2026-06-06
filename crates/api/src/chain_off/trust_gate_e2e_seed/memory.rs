//! 聚合写入 **chain_off** 内存 store（两段：`memory_users_orders` + `memory_disputes_tail`）。

use chrono::{DateTime, Utc};

use crate::chain_off::ChainOffStore;

use super::ids::TrustGateFixtureIds;
use super::memory_disputes_tail;
use super::memory_orders_early;
use super::memory_users_guides;

pub(super) fn fill_store(
    store: &mut ChainOffStore,
    ids: &TrustGateFixtureIds,
    password_hash: &str,
    now: DateTime<Utc>,
    old_created: DateTime<Utc>,
) {
    memory_users_guides::apply(store, ids, password_hash, now);
    memory_orders_early::apply(store, ids, now, old_created);
    memory_disputes_tail::apply(store, ids, now);
}
