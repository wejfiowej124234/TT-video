//! chain_off 对账与链事件投影：索引器、topic0 解析、投影、对账（48 §5.12）

use chrono::Utc;
use sha3::{Digest, Keccak256};
use uuid::Uuid;

use super::ChainOffStore;
use traveltrust_core::OrderState;

/// P5-5 索引器：从 store 中收集所有已有关联的 escrow 合约地址，供拉取链上日志
pub fn list_escrow_addresses_for_indexer(store: &ChainOffStore) -> Vec<String> {
    store
        .orders
        .values()
        .filter_map(|o| o.escrow_address.as_ref().cloned())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect()
}

/// 从链事件 topic0（keccak256(event_sig)）解析为事件名，供投影使用
pub fn event_name_from_topic0(topic0: &str) -> Option<&'static str> {
    let topic_hex = topic0.trim_start_matches("0x").to_lowercase();
    if topic_hex.len() != 64 {
        return None;
    }
    let sigs: &[(&[u8], &str)] = &[
        (
            b"EscrowCreated(bytes32,address)".as_slice(),
            "EscrowCreated",
        ),
        // 合约使用 Deposited；平台口径统一映射为 Paid。
        (
            b"Deposited(bytes32,address,address,uint256)".as_slice(),
            "Paid",
        ),
        (
            b"DisputeOpened(bytes32,address,address,bytes32)".as_slice(),
            "DisputeOpened",
        ),
        (
            b"Released(bytes32,address,uint256,uint256)".as_slice(),
            "Released",
        ),
        (b"Refunded(bytes32,address,uint256)".as_slice(), "Refunded"),
        (
            b"ResolutionExecuted(bytes32,address,bytes32,bytes32)".as_slice(),
            "ResolutionExecuted",
        ),
        (
            b"PartialRefundExecuted(bytes32,address,uint256,uint256,uint256)".as_slice(),
            "PartialRefundExecuted",
        ),
        (
            b"SlashedExecuted(bytes32,address,uint256,uint256,uint256)".as_slice(),
            "SlashedExecuted",
        ),
        (
            b"PlatformFeeRouted(address,uint256,uint256,uint256,uint256,uint256)".as_slice(),
            "PlatformFeeRouted",
        ),
        (
            b"RegionVaultForwarded(address,address,uint256)".as_slice(),
            "RegionVaultForwarded",
        ),
        (
            b"ProposalCreated(uint256,address,uint256,uint256,uint256,string)".as_slice(),
            "ProposalCreated",
        ),
        (
            b"VoteCast(address,uint256,uint8,uint256)".as_slice(),
            "VoteCast",
        ),
        (
            b"ProposalQueued(uint256,bytes32)".as_slice(),
            "ProposalQueued",
        ),
        (
            b"ProposalExecuted(uint256)".as_slice(),
            "ProposalExecuted",
        ),
        (
            b"ProposalCanceled(uint256)".as_slice(),
            "ProposalCanceled",
        ),
    ];
    for (sig, name) in sigs {
        if hex::encode(Keccak256::digest(sig)) == topic_hex {
            return Some(name);
        }
    }
    None
}

/// 从 `PlatformFeeRouted` 的 topics[1]（indexed token）与 data（五路 uint256）解析字段；供索引器 DB 投影。
pub fn parse_platform_fee_routed(
    topics: &[String],
    data: &serde_json::Value,
) -> Option<(String, [String; 5])> {
    let token = topic1_to_address(topics.get(1)?)?;
    let data_str = data.as_str()?;
    let raw = hex::decode(data_str.trim_start_matches("0x")).ok()?;
    if raw.len() < 160 {
        return None;
    }
    let mut words = [
        String::new(),
        String::new(),
        String::new(),
        String::new(),
        String::new(),
    ];
    for i in 0..5 {
        let chunk = &raw[i * 32..(i + 1) * 32];
        words[i] = format!("0x{}", hex::encode(chunk));
    }
    Some((token, words))
}

/// `RegionVaultForwarded`：`topics[1]` token、`topics[2]` to、`data` 单字 **uint256** amount。
pub fn parse_region_vault_forwarded(
    topics: &[String],
    data: &serde_json::Value,
) -> Option<(String, String, String)> {
    let token = topic1_to_address(topics.get(1)?)?;
    let to = topic1_to_address(topics.get(2)?)?;
    let data_str = data.as_str()?;
    let raw = hex::decode(data_str.trim_start_matches("0x")).ok()?;
    if raw.len() < 32 {
        return None;
    }
    let amount_hex = format!("0x{}", hex::encode(&raw[0..32]));
    Some((token, to, amount_hex))
}

fn topic1_to_address(topic: &str) -> Option<String> {
    let hex_s = topic.trim_start_matches("0x");
    if hex_s.len() < 40 {
        return None;
    }
    Some(format!("0x{}", &hex_s[hex_s.len() - 40..]))
}

/// 从 topics[1] 取完整 **bytes32** orderId（32 字节），供 `orders_projection.order_id` 与链上锚点对齐。
/// 与 [`parse_order_id_and_escrow_from_topics`] 取末 16 字节为 Uuid **并存**。
pub fn parse_order_id_bytes32_from_topics(topics: &[String]) -> Option<[u8; 32]> {
    if topics.len() < 2 {
        return None;
    }
    let order_id_hex = topics[1].trim_start_matches("0x");
    if order_id_hex.len() < 64 {
        return None;
    }
    let last_64 = &order_id_hex[order_id_hex.len().saturating_sub(64)..];
    let v = hex::decode(last_64).ok()?;
    if v.len() != 32 {
        return None;
    }
    let mut out = [0u8; 32];
    out.copy_from_slice(&v);
    Some(out)
}

/// 从 log topics 解析 order_id（bytes32 取后 16 字节为 Uuid）及可选的 escrow 地址（topics[2] 取后 20 字节）
pub fn parse_order_id_and_escrow_from_topics(
    topics: &[String],
    want_escrow: bool,
) -> Option<(Uuid, Option<String>)> {
    if topics.len() < 2 {
        return None;
    }
    let order_id_hex = topics[1].trim_start_matches("0x");
    if order_id_hex.len() < 32 {
        return None;
    }
    let last_32_hex = &order_id_hex[order_id_hex.len().saturating_sub(32)..];
    let bytes: [u8; 16] = hex::decode(last_32_hex).ok()?.try_into().ok()?;
    let order_id = Uuid::from_bytes(bytes);
    let escrow = if want_escrow && topics.len() >= 3 {
        let addr_hex = topics[2].trim_start_matches("0x");
        let addr_20 = addr_hex.len().saturating_sub(40);
        Some(format!("0x{}", &addr_hex[addr_20..]))
    } else {
        None
    };
    Some((order_id, escrow))
}

/// 纯状态迁移（与 [`project_chain_event_onto_order`] 一致），供 **`event_log` → `orders_projection`** 回放与单测对齐。
pub fn apply_escrow_event_kind_to_order_state(state: OrderState, kind: &str) -> OrderState {
    match kind {
        "Paid" => {
            if state.can_transition_to(OrderState::Escrowed) {
                OrderState::Escrowed
            } else {
                state
            }
        }
        "DisputeOpened" => {
            if state.can_transition_to(OrderState::Disputed) {
                OrderState::Disputed
            } else {
                state
            }
        }
        "Released" => {
            if state == OrderState::Completed {
                state
            } else if state.can_transition_to(OrderState::Completed) {
                OrderState::Completed
            } else {
                state
            }
        }
        "Refunded" => {
            if state == OrderState::Escrowed {
                OrderState::Refunded
            } else if state.can_transition_to(OrderState::Refunded) {
                OrderState::Refunded
            } else {
                state
            }
        }
        "ResolutionExecuted" => {
            if state.can_transition_to(OrderState::Completed) || state == OrderState::Disputed {
                OrderState::Completed
            } else {
                state
            }
        }
        "PartialRefundExecuted" => {
            if state == OrderState::PartiallyRefunded {
                state
            } else if state == OrderState::Escrowed {
                OrderState::PartiallyRefunded
            } else if state.can_transition_to(OrderState::PartiallyRefunded) {
                OrderState::PartiallyRefunded
            } else {
                state
            }
        }
        "SlashedExecuted" => {
            if state == OrderState::Slashed {
                state
            } else if state == OrderState::Escrowed {
                OrderState::Slashed
            } else if state.can_transition_to(OrderState::Slashed) {
                OrderState::Slashed
            } else {
                state
            }
        }
        _ => state,
    }
}

/// P5-5 投影：将链上事件应用到 orders 表
pub fn project_chain_event_onto_order(
    store: &mut ChainOffStore,
    order_id: Uuid,
    _chain_id: u64,
    _block_number: u64,
    _log_index: u32,
    kind: &str,
    escrow_address: Option<String>,
) -> bool {
    let order = match store.orders.get_mut(&order_id) {
        Some(o) => o,
        None => return false,
    };
    let now = Utc::now();
    order.updated_at = now;
    if kind == "EscrowCreated" {
        if let Some(addr) = escrow_address {
            order.escrow_address = Some(addr);
        }
    }
    if matches!(
        kind,
        "Paid" | "DisputeOpened" | "Released" | "Refunded" | "ResolutionExecuted" | "PartialRefundExecuted"
            | "SlashedExecuted"
    ) {
        order.state = apply_escrow_event_kind_to_order_state(order.state, kind);
    }
    if kind == "Released" && order.state == OrderState::Completed && order.completed_at.is_none() {
        order.completed_at = Some(now);
    }
    if kind == "Refunded" && order.state == OrderState::Refunded && order.completed_at.is_none() {
        order.completed_at = Some(now);
    }
    if kind == "PartialRefundExecuted"
        && order.state == OrderState::PartiallyRefunded
        && order.completed_at.is_none()
    {
        order.completed_at = Some(now);
    }
    if kind == "SlashedExecuted" && order.state == OrderState::Slashed && order.completed_at.is_none() {
        order.completed_at = Some(now);
    }
    if kind == "ResolutionExecuted"
        && order.state == OrderState::Completed
        && order.completed_at.is_none()
    {
        order.completed_at = Some(now);
    }
    true
}

#[cfg(test)]
mod tests {
    use super::apply_escrow_event_kind_to_order_state;
    use super::event_name_from_topic0;
    use super::project_chain_event_onto_order;
    use crate::chain_off::{ChainOffStore, OrderRow};
    use chrono::Utc;
    use sha3::{Digest, Keccak256};
    use traveltrust_core::OrderState;
    use uuid::Uuid;

    #[test]
    fn apply_paid_moves_accepted_to_escrowed() {
        assert_eq!(
            apply_escrow_event_kind_to_order_state(OrderState::Accepted, "Paid"),
            OrderState::Escrowed
        );
    }

    /// B-094：与 `Escrow.t.sol` 三模板及 `terminal_order_state_from_resolution_amounts` 对齐（事件无金额时的投影仍见 `apply_escrow_event_kind_to_order_state`）。
    #[test]
    fn b094_resolution_amounts_map_to_product_terminals() {
        use traveltrust_core::terminal_order_state_from_resolution_amounts;
        let total = 1000u128;
        assert_eq!(
            terminal_order_state_from_resolution_amounts(0, total, 0, total),
            Some(OrderState::Refunded)
        );
        assert_eq!(
            terminal_order_state_from_resolution_amounts(300, 650, 50, total),
            Some(OrderState::PartiallyRefunded)
        );
        assert_eq!(
            terminal_order_state_from_resolution_amounts(0, 800, 200, total),
            Some(OrderState::Slashed)
        );
    }

    #[test]
    fn released_is_idempotent_when_order_already_completed() {
        let mut store = ChainOffStore::default();
        let id = Uuid::new_v4();
        let tid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let t0 = Utc::now();
        store.orders.insert(
            id,
            OrderRow {
                id,
                tourist_id: tid,
                guide_id: gid,
                amount: "100".to_string(),
                currency: "USD".to_string(),
                escrow_address: Some("0x1234567890123456789012345678901234567890".to_string()),
                state: OrderState::Completed,
                created_at: t0,
                accepted_at: None,
                escrowed_at: None,
                completed_at: Some(t0),
                dispute_deadline_at: None,
                auto_complete_at: None,
                updated_at: t0,
                start_date: None,
                end_date: None,
                sub_status: None,
                tourist_confirmed: None,
                guide_confirmed: None,
                rating_tourist_confirmed: None,
                rating_guide_confirmed: None,
                chain_id: None,
            },
        );
        assert!(project_chain_event_onto_order(
            &mut store, id, 1, 99, 0, "Released", None
        ));
        let o = store.orders.get(&id).unwrap();
        assert_eq!(o.state, OrderState::Completed);
        assert!(o.completed_at.is_some());
    }

    #[test]
    fn refunded_from_escrowed_sets_refunded() {
        let mut store = ChainOffStore::default();
        let id = Uuid::new_v4();
        let tid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let t0 = Utc::now();
        store.orders.insert(
            id,
            OrderRow {
                id,
                tourist_id: tid,
                guide_id: gid,
                amount: "100".to_string(),
                currency: "USD".to_string(),
                escrow_address: Some("0xab".to_string()),
                state: OrderState::Escrowed,
                created_at: t0,
                accepted_at: None,
                escrowed_at: None,
                completed_at: None,
                dispute_deadline_at: None,
                auto_complete_at: None,
                updated_at: t0,
                start_date: None,
                end_date: None,
                sub_status: None,
                tourist_confirmed: None,
                guide_confirmed: None,
                rating_tourist_confirmed: None,
                rating_guide_confirmed: None,
                chain_id: None,
            },
        );
        assert!(project_chain_event_onto_order(
            &mut store, id, 1, 10, 0, "Refunded", None
        ));
        assert_eq!(store.orders.get(&id).unwrap().state, OrderState::Refunded);
    }

    #[test]
    fn partial_refund_executed_from_escrowed_sets_partially_refunded() {
        let mut store = ChainOffStore::default();
        let id = Uuid::new_v4();
        let tid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let t0 = Utc::now();
        store.orders.insert(
            id,
            OrderRow {
                id,
                tourist_id: tid,
                guide_id: gid,
                amount: "100".to_string(),
                currency: "USD".to_string(),
                escrow_address: Some("0xab".to_string()),
                state: OrderState::Escrowed,
                created_at: t0,
                accepted_at: None,
                escrowed_at: None,
                completed_at: None,
                dispute_deadline_at: None,
                auto_complete_at: None,
                updated_at: t0,
                start_date: None,
                end_date: None,
                sub_status: None,
                tourist_confirmed: None,
                guide_confirmed: None,
                rating_tourist_confirmed: None,
                rating_guide_confirmed: None,
                chain_id: None,
            },
        );
        assert!(project_chain_event_onto_order(
            &mut store,
            id,
            1,
            10,
            0,
            "PartialRefundExecuted",
            None
        ));
        let o = store.orders.get(&id).unwrap();
        assert_eq!(o.state, OrderState::PartiallyRefunded);
        assert!(o.completed_at.is_some());
    }

    #[test]
    fn slashed_executed_from_escrowed_sets_slashed() {
        let mut store = ChainOffStore::default();
        let id = Uuid::new_v4();
        let tid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let t0 = Utc::now();
        store.orders.insert(
            id,
            OrderRow {
                id,
                tourist_id: tid,
                guide_id: gid,
                amount: "100".to_string(),
                currency: "USD".to_string(),
                escrow_address: Some("0xab".to_string()),
                state: OrderState::Escrowed,
                created_at: t0,
                accepted_at: None,
                escrowed_at: None,
                completed_at: None,
                dispute_deadline_at: None,
                auto_complete_at: None,
                updated_at: t0,
                start_date: None,
                end_date: None,
                sub_status: None,
                tourist_confirmed: None,
                guide_confirmed: None,
                rating_tourist_confirmed: None,
                rating_guide_confirmed: None,
                chain_id: None,
            },
        );
        assert!(project_chain_event_onto_order(
            &mut store,
            id,
            1,
            10,
            0,
            "SlashedExecuted",
            None
        ));
        let o = store.orders.get(&id).unwrap();
        assert_eq!(o.state, OrderState::Slashed);
        assert!(o.completed_at.is_some());
    }

    #[test]
    fn maps_deposited_topic_to_paid() {
        let topic = format!(
            "0x{}",
            hex::encode(Keccak256::digest(
                b"Deposited(bytes32,address,address,uint256)"
            ))
        );
        assert_eq!(event_name_from_topic0(&topic), Some("Paid"));
    }

    #[test]
    fn maps_dispute_opened_topic() {
        let topic = format!(
            "0x{}",
            hex::encode(Keccak256::digest(
                b"DisputeOpened(bytes32,address,address,bytes32)"
            ))
        );
        assert_eq!(event_name_from_topic0(&topic), Some("DisputeOpened"));
    }

    #[test]
    fn maps_partial_refund_executed_topic() {
        let topic = format!(
            "0x{}",
            hex::encode(Keccak256::digest(
                b"PartialRefundExecuted(bytes32,address,uint256,uint256,uint256)"
            ))
        );
        assert_eq!(event_name_from_topic0(&topic), Some("PartialRefundExecuted"));
    }

    #[test]
    fn maps_slashed_executed_topic() {
        let topic = format!(
            "0x{}",
            hex::encode(Keccak256::digest(
                b"SlashedExecuted(bytes32,address,uint256,uint256,uint256)"
            ))
        );
        assert_eq!(event_name_from_topic0(&topic), Some("SlashedExecuted"));
    }
}

/// P5-5 对账骨架：返回链上状态与 DB 状态是否一致
#[allow(dead_code)]
pub fn reconcile_order_chain_vs_db(
    chain_status: Option<&str>,
    db_state: &OrderState,
) -> Result<bool, String> {
    let chain_done = matches!(
        chain_status,
        Some("Completed")
            | Some("Refunded")
            | Some("Resolved")
            | Some("PartiallyRefunded")
            | Some("Slashed")
    );
    let db_done = matches!(
        db_state,
        OrderState::Completed
            | OrderState::Refunded
            | OrderState::Slashed
            | OrderState::PartiallyRefunded
    );
    if chain_done == db_done {
        return Ok(true);
    }
    Ok(false)
}
