//! `event_log` → `orders_projection` 回放（110、04 §7.6）；与 **indexer-tick** 双写互补，用于补历史或修复投影。

use std::collections::{hash_map::Entry, HashMap};

use serde::Serialize;
use sqlx::postgres::PgPool;
use traveltrust_core::OrderState;
use uuid::Uuid;

use super::{
    apply_escrow_event_kind_to_order_state, order_state_to_str,
    parse_order_id_and_escrow_from_topics, parse_order_id_bytes32_from_topics, str_to_order_state,
};
use crate::db::{self, decode_evm_address_bytes};

#[derive(Debug, Clone, Default, Serialize)]
pub struct OrdersProjectionReplayStats {
    pub rows_scanned: u32,
    pub upserts_ok: u32,
    pub skipped_no_topics: u32,
    pub skipped_no_order_uuid: u32,
    pub skipped_no_order_row: u32,
    pub skipped_no_bytes32: u32,
    pub upsert_errors: u32,
}

fn topics_from_payload(payload: &serde_json::Value) -> Option<Vec<String>> {
    let arr = payload.get("topics")?.as_array()?;
    let mut out = Vec::with_capacity(arr.len());
    for x in arr {
        out.push(x.as_str()?.to_string());
    }
    Some(out)
}

/// 按 `(block_number, log_index)` 顺序重放 Escrow 类 `event_log` 行，幂等 upsert **`orders_projection`**。
/// 订单状态沿事件递进模拟（与 [`super::project_chain_event_onto_order`] 一致）；`tourist_id`/`guide_id`/初始状态以 **`orders`** 行为准。
pub async fn replay_orders_projection_from_event_log(
    pool: &PgPool,
    chain_id: i64,
) -> Result<OrdersProjectionReplayStats, sqlx::Error> {
    let rows = db::list_event_log_escrow_projection_rows(pool, chain_id).await?;
    let mut stats = OrdersProjectionReplayStats {
        rows_scanned: rows.len() as u32,
        ..Default::default()
    };
    let mut sim_state: HashMap<Uuid, OrderState> = HashMap::new();
    let mut sim_escrow: HashMap<Uuid, String> = HashMap::new();

    for row in rows {
        let Some(topics) = topics_from_payload(&row.payload) else {
            stats.skipped_no_topics += 1;
            continue;
        };
        let want_escrow = row.event_type == "EscrowCreated";
        let Some((order_uuid, topic_escrow)) =
            parse_order_id_and_escrow_from_topics(&topics, want_escrow)
        else {
            stats.skipped_no_order_uuid += 1;
            continue;
        };
        let Some(raw32) = parse_order_id_bytes32_from_topics(&topics) else {
            stats.skipped_no_bytes32 += 1;
            continue;
        };
        let Some(db_order) = db::get_order_by_id(pool, order_uuid).await? else {
            stats.skipped_no_order_row += 1;
            continue;
        };

        let st = match sim_state.entry(order_uuid) {
            Entry::Occupied(e) => e.into_mut(),
            Entry::Vacant(v) => {
                let init = str_to_order_state(&db_order.status).unwrap_or(OrderState::Created);
                v.insert(init)
            }
        };
        *st = apply_escrow_event_kind_to_order_state(*st, row.event_type.as_str());

        if row.event_type == "EscrowCreated" {
            if let Some(a) = topic_escrow {
                sim_escrow.insert(order_uuid, a);
            }
        }

        let esc_hex = sim_escrow
            .get(&order_uuid)
            .cloned()
            .or(db_order.escrow_address.clone());
        let esc_bytes = esc_hex.as_deref().and_then(decode_evm_address_bytes);

        let tourist_opt = (!db_order.tourist_id.is_nil()).then_some(db_order.tourist_id);
        let guide_opt = db_order.guide_id.filter(|g| !g.is_nil());

        match db::upsert_orders_projection_chain_snapshot(
            pool,
            &raw32,
            row.chain_id,
            row.block_number,
            row.log_index,
            row.event_type.as_str(),
            tourist_opt,
            guide_opt,
            order_state_to_str(*st),
            esc_bytes.as_deref(),
        )
        .await
        {
            Ok(()) => stats.upserts_ok += 1,
            Err(_) => stats.upsert_errors += 1,
        }
    }

    Ok(stats)
}

#[cfg(test)]
mod tests {
    use super::topics_from_payload;
    use serde_json::json;

    #[test]
    fn topics_from_payload_parses_string_array() {
        let p = json!({"topics": ["0xa", "0xb"], "data": "0x"});
        let t = topics_from_payload(&p).unwrap();
        assert_eq!(t, vec!["0xa", "0xb"]);
    }

    #[test]
    fn topics_from_payload_requires_strings() {
        let p = json!({"topics": [1, 2]});
        assert!(topics_from_payload(&p).is_none());
    }
}
