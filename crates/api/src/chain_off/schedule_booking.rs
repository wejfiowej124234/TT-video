//! 向导预约档期：重叠校验（80 §4.15 · B-079）— 创建 / 接单 / 改期同源。

use chrono::NaiveDate;
use traveltrust_core::OrderState;
use uuid::Uuid;

use super::ChainOffStore;
use crate::schedule_engine::{self, DateRange};

/// 给定向导出行区间是否与已占用档期冲突（`lock_slot` + Accepted/Escrowed/Disputed 订单）。
pub async fn guide_trip_range_conflicts(
    store: &ChainOffStore,
    guide_id: Uuid,
    start: NaiveDate,
    end: NaiveDate,
    exclude_order_id: Option<Uuid>,
) -> Result<bool, String> {
    let range = DateRange::new(start, end)?;
    if schedule_engine::has_overlapping_lock(guide_id, start, end).await? {
        return Ok(true);
    }
    for o in store.orders.values() {
        if o.guide_id != guide_id {
            continue;
        }
        if exclude_order_id == Some(o.id) {
            continue;
        }
        if !matches!(
            o.state,
            OrderState::Accepted | OrderState::Escrowed | OrderState::Disputed
        ) {
            continue;
        }
        let (Some(s), Some(e)) = (o.start_date, o.end_date) else {
            continue;
        };
        if let Ok(other) = DateRange::new(s, e) {
            if schedule_engine::check_overlap(&range, &other) {
                return Ok(true);
            }
        }
    }
    Ok(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use traveltrust_core::OrderState;

    use crate::chain_off::{ChainOffStore, OrderRow};

    fn order_with_dates(guide_id: Uuid, start: &str, end: &str, state: OrderState) -> OrderRow {
        let now = Utc::now();
        OrderRow {
            id: Uuid::new_v4(),
            tourist_id: Uuid::new_v4(),
            guide_id,
            amount: "100".into(),
            currency: "USD".into(),
            escrow_address: None,
            state,
            created_at: now,
            accepted_at: None,
            escrowed_at: None,
            completed_at: None,
            dispute_deadline_at: None,
            auto_complete_at: None,
            updated_at: now,
            start_date: NaiveDate::parse_from_str(start, "%Y-%m-%d").ok(),
            end_date: NaiveDate::parse_from_str(end, "%Y-%m-%d").ok(),
            sub_status: None,
            tourist_confirmed: None,
            guide_confirmed: None,
            rating_tourist_confirmed: None,
            rating_guide_confirmed: None,
            chain_id: None,
            data_origin: "test".into(),
            order_kind: None,
            market_listing_id: None,
            ..Default::default()
            }
    }

    #[tokio::test]
    async fn conflicts_with_accepted_order_range() {
        let guide_id = Uuid::new_v4();
        let mut store = ChainOffStore::default();
        let o = order_with_dates(guide_id, "2026-07-10", "2026-07-12", OrderState::Accepted);
        store.orders.insert(o.id, o);
        let hit = guide_trip_range_conflicts(
            &store,
            guide_id,
            NaiveDate::from_ymd_opt(2026, 7, 11).unwrap(),
            NaiveDate::from_ymd_opt(2026, 7, 13).unwrap(),
            None,
        )
        .await
        .unwrap();
        assert!(hit);
    }

    #[tokio::test]
    async fn excludes_self_on_reschedule() {
        let guide_id = Uuid::new_v4();
        let mut store = ChainOffStore::default();
        let o = order_with_dates(guide_id, "2026-07-10", "2026-07-12", OrderState::Accepted);
        let oid = o.id;
        store.orders.insert(oid, o);
        let hit = guide_trip_range_conflicts(
            &store,
            guide_id,
            NaiveDate::from_ymd_opt(2026, 7, 10).unwrap(),
            NaiveDate::from_ymd_opt(2026, 7, 12).unwrap(),
            Some(oid),
        )
        .await
        .unwrap();
        assert!(!hit);
    }
}
