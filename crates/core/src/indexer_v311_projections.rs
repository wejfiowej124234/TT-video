//! V3.1.1 Indexer projections · Gap IX-01 / IX-02 (Phase A offline SSOT)

use crate::destination_country_v311::ORDER_DESTINATION_COUNTRY_FIELD;
use crate::service_fee_state_v311::ServiceFeeState;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DistributableFeeEvent {
    pub order_id: String,
    pub fee_usdc6: u128,
    pub state: ServiceFeeState,
    pub destination_country: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DistributableProjectionRow {
    pub order_id: String,
    pub fee_usdc6: u128,
    pub state: ServiceFeeState,
}

/// IX-01 · project distributable fee events (only DISTRIBUTABLE/DISTRIBUTED retained for payout views)
#[must_use]
pub fn project_distributable_events(events: &[DistributableFeeEvent]) -> Vec<DistributableProjectionRow> {
    events
        .iter()
        .filter(|e| {
            matches!(
                e.state,
                ServiceFeeState::Distributable | ServiceFeeState::Distributed
            )
        })
        .map(|e| DistributableProjectionRow {
            order_id: e.order_id.clone(),
            fee_usdc6: e.fee_usdc6,
            state: e.state,
        })
        .collect()
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StewardShareIndexRow {
    pub destination_country: String,
    pub steward_share_usdc6: u128,
}

/// IX-02 · index steward share by Order.destination_country only (45% when steward active)
#[must_use]
pub fn index_steward_share_by_destination(
    events: &[DistributableFeeEvent],
    steward_active: bool,
) -> Vec<StewardShareIndexRow> {
    use std::collections::BTreeMap;
    let mut map: BTreeMap<String, u128> = BTreeMap::new();
    if !steward_active {
        return vec![];
    }
    for e in events {
        if e.state != ServiceFeeState::Distributed {
            continue;
        }
        let share = e.fee_usdc6.saturating_mul(4500) / 10_000;
        *map.entry(e.destination_country.clone()).or_default() += share;
    }
    map.into_iter()
        .map(|(destination_country, steward_share_usdc6)| StewardShareIndexRow {
            destination_country,
            steward_share_usdc6,
        })
        .collect()
}

pub fn attribution_field() -> &'static str {
    ORDER_DESTINATION_COUNTRY_FIELD
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ix01_ix02_projection() {
        assert_eq!(attribution_field(), "destination_country");
        let events = vec![
            DistributableFeeEvent {
                order_id: "1".into(),
                fee_usdc6: 1_000_000,
                state: ServiceFeeState::Locked,
                destination_country: "JP".into(),
            },
            DistributableFeeEvent {
                order_id: "2".into(),
                fee_usdc6: 1_000_000,
                state: ServiceFeeState::Distributed,
                destination_country: "JP".into(),
            },
        ];
        let proj = project_distributable_events(&events);
        assert_eq!(proj.len(), 1);
        assert_eq!(proj[0].order_id, "2");
        let idx = index_steward_share_by_destination(&events, true);
        assert_eq!(idx.len(), 1);
        assert_eq!(idx[0].steward_share_usdc6, 450_000);
        assert!(index_steward_share_by_destination(&events, false).is_empty());
    }
}
