//! B-073 / B-092：治理委托内存表 **唯一** `OnceLock`（与 `governance_delegate` / `governance_proposals` 共享）。
//! **权重 SSOT（MVP）**：`1 +`（`delegate_to == voter` 的直接委托人数）；见 **04** 提案详情 **`governance_vote.weight_ssot`**。

use std::collections::HashMap;
use std::sync::{Arc, OnceLock};
use tokio::sync::RwLock;
use uuid::Uuid;

pub type DelegateMap = HashMap<Uuid, Uuid>;

static DELEGATE_STORE: OnceLock<Arc<RwLock<DelegateMap>>> = OnceLock::new();

pub fn delegate_store() -> Arc<RwLock<DelegateMap>> {
    DELEGATE_STORE
        .get_or_init(|| Arc::new(RwLock::new(HashMap::new())))
        .clone()
}

/// 已把票委托给他人者 **不得** 直接 `POST …/vote`（B-092）。
#[inline]
pub fn is_delegating_away(m: &DelegateMap, uid: Uuid) -> bool {
    m.contains_key(&uid)
}

/// 直接委托给 `voter` 的人数（不含自身）。
pub fn direct_delegator_count(m: &DelegateMap, voter: Uuid) -> u64 {
    m.iter().filter(|(_, &d)| d == voter).count() as u64
}

/// 可投票账户在 **当前** 委托图下的权重单位（投票当刻会 **冻结** 写入票仓）。
#[inline]
pub fn voter_weight_units_now(m: &DelegateMap, voter: Uuid) -> u64 {
    1 + direct_delegator_count(m, voter)
}
