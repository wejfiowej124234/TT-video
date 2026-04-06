//! **`orders`** 表 → **chain_off** 内存重载（110：**reorg-rewind** / tick 自动回滚后续 **Partial**）。
//! **不**修改 **`orders`** 表；仅使进程内 **`orders`/`guide_slot`** 与当前 DB 一致，并保留**不在** `orders` 表中的仅内存订单（如未落库草稿）。

use serde::Serialize;
use sqlx::PgPool;
use std::collections::{HashMap, HashSet};
use traveltrust_core::OrderState;
use uuid::Uuid;

use crate::db;

use super::{order_from_db, ChainOffStore, OrderRow};

#[derive(Debug, Clone, Serialize)]
pub struct ReloadOrdersFromDbSummary {
    pub db_orders_loaded: usize,
    pub memory_only_orders_preserved: usize,
}

/// 用 **`list_orders`** 覆盖内存订单并 **`guide_slot.clear`** 后按 **Accepted/Escrowed** 重建；**未**出现在 DB 结果中的原内存订单写回。
pub async fn reload_orders_from_db_into_store(
    pool: &PgPool,
    store: &mut ChainOffStore,
) -> Result<ReloadOrdersFromDbSummary, sqlx::Error> {
    let db_rows = db::list_orders(pool).await?;
    let db_ids: HashSet<Uuid> = db_rows.iter().map(|o| o.id).collect();

    let mut memory_only: HashMap<Uuid, OrderRow> = HashMap::new();
    for (id, row) in store.orders.drain() {
        if !db_ids.contains(&id) {
            memory_only.insert(id, row);
        }
    }

    store.guide_slot.clear();
    let db_n = db_rows.len();
    for o in db_rows {
        let order_row = order_from_db(&o);
        let (id, guide_id, state) = (order_row.id, order_row.guide_id, order_row.state);
        store.orders.insert(id, order_row);
        if state == OrderState::Accepted || state == OrderState::Escrowed {
            store.guide_slot.insert(guide_id, id);
        }
    }

    let preserved = memory_only.len();
    for (id, row) in memory_only {
        store.orders.insert(id, row.clone());
        if row.state == OrderState::Accepted || row.state == OrderState::Escrowed {
            store.guide_slot.insert(row.guide_id, id);
        }
    }

    Ok(ReloadOrdersFromDbSummary {
        db_orders_loaded: db_n,
        memory_only_orders_preserved: preserved,
    })
}
