//! 判定链下治理 MVP 是否走 **PostgreSQL**（与 Governor 索引模式互斥）。

use sqlx::postgres::PgPool;

use crate::state::ApiMetaState;

/// **`chain_off` + `PgPool`** 且 **未** 配置非空 **`GOVERNOR_ADDRESS`** 时：MVP 列表/详情/投票/委托走 **`governance_mvp_*`** 表。
pub(crate) fn mvp_persist_pool(state: &ApiMetaState) -> Option<&PgPool> {
    if let Some(cfg) = state.chain_config.as_ref() {
        if cfg
            .governor_address
            .as_deref()
            .map(|s| !s.trim().is_empty())
            .unwrap_or(false)
        {
            return None;
        }
    }
    state.chain_off.as_ref()?.db_pool.as_ref()
}
