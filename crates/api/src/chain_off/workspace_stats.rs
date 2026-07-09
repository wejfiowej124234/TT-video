//! Multi-Identity Workspace · 经营数据聚合（W4 · SSOT CONFIRMED）。
//! 与 `frontend/lib/workspace/workspaceOrderBus.ts` · `order_business_line` 枚举对读。

use chrono::{DateTime, Datelike, TimeZone, Utc};
use serde_json::json;
use traveltrust_core::OrderState;
use uuid::Uuid;

use super::{order_guide_user_id, order_is_participant, ChainOffStore, OrderRow};

/// 列表/过滤 SSOT：`trip` · `merchant_service` · `acquisition`。
pub fn order_business_line_for_chain_off(o: &OrderRow) -> &'static str {
    match o.order_kind.as_deref() {
        Some("merchant_listing") => "merchant_service",
        Some("acquisition_listing") => "acquisition",
        _ => "trip",
    }
}

pub fn parse_orders_business_line_filter(raw: Option<&str>) -> Option<&'static str> {
    match raw.map(str::trim).filter(|s| !s.is_empty())? {
        "trip" => Some("trip"),
        "merchant_service" | "merchant" => Some("merchant_service"),
        "acquisition" => Some("acquisition"),
        _ => None,
    }
}

pub fn order_matches_business_line_filter(o: &OrderRow, line: &str) -> bool {
    order_business_line_for_chain_off(o) == line
}

fn order_is_in_progress_pipeline(o: &OrderRow) -> bool {
    matches!(
        o.state,
        OrderState::Created
            | OrderState::Accepted
            | OrderState::Escrowed
            | OrderState::Disputed
    )
}

/// 商家（provider）UTC 自然月经营口径；仅 **`merchant_service`** 且向导侧=商家 user。
pub fn merchant_period_dashboard_stats(
    store: &ChainOffStore,
    merchant_user_id: Uuid,
    now: DateTime<Utc>,
) -> serde_json::Value {
    let y = now.year();
    let m = now.month();
    let period_start = Utc.with_ymd_and_hms(y, m, 1, 0, 0, 0).unwrap();
    let (ny, nm) = if m == 12 {
        (y + 1, 1)
    } else {
        (y, m + 1)
    };
    let period_end = Utc.with_ymd_and_hms(ny, nm, 1, 0, 0, 0).unwrap();
    let billing_period_utc = format!("{y}-{m:02}");
    let mut period_settled_orders_count = 0u64;
    let mut period_expected_earnings = 0.0_f64;
    for o in store.orders.values() {
        if order_business_line_for_chain_off(o) != "merchant_service" {
            continue;
        }
        if order_guide_user_id(store, o) != Some(merchant_user_id) {
            continue;
        }
        if o.state.is_final_financial_state() {
            if o.updated_at >= period_start && o.updated_at < period_end {
                period_settled_orders_count += 1;
            }
        } else if matches!(
            o.state,
            OrderState::Accepted | OrderState::Escrowed | OrderState::Disputed
        ) {
            if let Ok(a) = o.amount.parse::<f64>() {
                period_expected_earnings += a;
            }
        }
    }
    json!({
        "billing_period_utc": billing_period_utc,
        "merchant_period_expected_earnings": period_expected_earnings,
        "merchant_period_settled_orders_count": period_settled_orders_count,
    })
}

pub fn merchant_workspace_stats(
    store: &ChainOffStore,
    merchant_user_id: Uuid,
    now: DateTime<Utc>,
) -> serde_json::Value {
    let mut orders_merchant_total = 0usize;
    let mut merchant_in_progress_count = 0usize;
    for o in store.orders.values() {
        if !order_is_participant(store, o, merchant_user_id) {
            continue;
        }
        if order_business_line_for_chain_off(o) != "merchant_service" {
            continue;
        }
        if order_guide_user_id(store, o) != Some(merchant_user_id) {
            continue;
        }
        orders_merchant_total += 1;
        if order_is_in_progress_pipeline(o) {
            merchant_in_progress_count += 1;
        }
    }
    let mut base = json!({
        "orders_merchant_total": orders_merchant_total,
        "merchant_in_progress_count": merchant_in_progress_count,
    });
    let period = merchant_period_dashboard_stats(store, merchant_user_id, now);
    if let (Some(bo), Some(po)) = (base.as_object_mut(), period.as_object()) {
        for (k, v) in po {
            bo.insert(k.clone(), v.clone());
        }
    }
    base
}

pub fn acquisition_workspace_stats(store: &ChainOffStore, user_id: Uuid) -> serde_json::Value {
    let mut acquisition_orders_as_owner = 0usize;
    let mut acquisition_orders_as_carrier = 0usize;
    let mut acquisition_in_progress_count = 0usize;
    for o in store.orders.values() {
        if order_business_line_for_chain_off(o) != "acquisition" {
            continue;
        }
        let is_owner = o.tourist_id == user_id;
        let is_carrier = order_guide_user_id(store, o) == Some(user_id);
        if !is_owner && !is_carrier {
            continue;
        }
        if is_owner {
            acquisition_orders_as_owner += 1;
        }
        if is_carrier {
            acquisition_orders_as_carrier += 1;
            if order_is_in_progress_pipeline(o) {
                acquisition_in_progress_count += 1;
            }
        }
    }
    json!({
        "acquisition_orders_as_owner": acquisition_orders_as_owner,
        "acquisition_orders_as_carrier": acquisition_orders_as_carrier,
        "acquisition_in_progress_count": acquisition_in_progress_count,
    })
}

pub fn steward_workspace_stats(_store: &ChainOffStore, _user_id: Uuid) -> serde_json::Value {
    json!({
        "steward_governance_workspace": "/governance?view=region",
        "steward_orders_n_a": true,
    })
}

pub fn merge_acquisition_stats_into(base: &mut serde_json::Value, store: &ChainOffStore, user_id: Uuid) {
    let acq = acquisition_workspace_stats(store, user_id);
    let Some(bo) = base.as_object_mut() else {
        return;
    };
    if let Some(ao) = acq.as_object() {
        for (k, v) in ao {
            bo.insert(k.clone(), v.clone());
        }
    }
}

pub fn merge_acquisition_listings_24h_into(
    base: &mut serde_json::Value,
    listings_published_24h: i64,
) {
    let Some(bo) = base.as_object_mut() else {
        return;
    };
    bo.insert(
        "acquisition_listings_published_24h".to_string(),
        json!(listings_published_24h),
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use traveltrust_core::OrderState;
    use uuid::Uuid;

    use crate::chain_off::{ChainOffStore, OrderRow};

    fn sample_order(tourist: Uuid, guide_row: Uuid, kind: Option<&str>) -> OrderRow {
        OrderRow {
            id: Uuid::new_v4(),
            tourist_id: tourist,
            guide_id: guide_row,
            amount: "100".into(),
            currency: "USDT".into(),
            escrow_address: None,
            state: OrderState::Accepted,
            created_at: Utc::now(),
            accepted_at: Some(Utc::now()),
            escrowed_at: None,
            completed_at: None,
            dispute_deadline_at: None,
            auto_complete_at: None,
            updated_at: Utc::now(),
            start_date: None,
            end_date: None,
            sub_status: None,
            tourist_confirmed: None,
            guide_confirmed: None,
            rating_tourist_confirmed: None,
            rating_guide_confirmed: None,
            chain_id: None,
            data_origin: "production".into(),
            order_kind: kind.map(str::to_string),
            market_listing_id: None,
            ..Default::default()
            }
    }

    #[test]
    fn business_line_derivation() {
        let mut o = sample_order(Uuid::new_v4(), Uuid::new_v4(), None);
        assert_eq!(order_business_line_for_chain_off(&o), "trip");
        o.order_kind = Some("merchant_listing".into());
        assert_eq!(order_business_line_for_chain_off(&o), "merchant_service");
        o.order_kind = Some("acquisition_listing".into());
        assert_eq!(order_business_line_for_chain_off(&o), "acquisition");
    }

    #[test]
    fn merchant_stats_scoped_to_merchant_service() {
        let merchant_user = Uuid::new_v4();
        let guide_row = Uuid::new_v4();
        let mut store = ChainOffStore::default();
        store.guides.insert(
            guide_row,
            crate::chain_off::GuideRow {
                id: guide_row,
                user_id: merchant_user,
                city: "test".into(),
                country_code: "CN".into(),
                languages: vec!["zh".into()],
                service_types: vec!["merchant".into()],
                status: "active".into(),
                data_origin: "production".into(),
                ..Default::default()
            },
        );
        store.orders.insert(
            Uuid::new_v4(),
            sample_order(Uuid::new_v4(), guide_row, Some("merchant_listing")),
        );
        store.orders.insert(
            Uuid::new_v4(),
            sample_order(Uuid::new_v4(), guide_row, None),
        );
        let stats = merchant_workspace_stats(&store, merchant_user, Utc::now());
        assert_eq!(stats["orders_merchant_total"].as_u64(), Some(1));
        assert_eq!(stats["merchant_in_progress_count"].as_u64(), Some(1));
    }
}
