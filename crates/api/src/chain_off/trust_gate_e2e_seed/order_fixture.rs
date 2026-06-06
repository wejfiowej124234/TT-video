//! 夹具 `OrderRow` 构造（与 trust-gate Playwright 场景对拍）。

use chrono::{DateTime, NaiveDate, Utc};
use uuid::Uuid;

use crate::chain_off::OrderRow;
use traveltrust_core::OrderState;

pub(super) fn base_order(
    id: Uuid,
    tourist: Uuid,
    guide_row: Uuid,
    state: OrderState,
    created_at: DateTime<Utc>,
    amount: &str,
    start: Option<NaiveDate>,
    end: Option<NaiveDate>,
    escrow_address: Option<String>,
    sub: Option<&str>,
) -> OrderRow {
    OrderRow {
        id,
        tourist_id: tourist,
        guide_id: guide_row,
        amount: amount.to_string(),
        currency: "USD".to_string(),
        escrow_address,
        state,
        created_at,
        accepted_at: None,
        escrowed_at: None,
        completed_at: None,
        dispute_deadline_at: None,
        auto_complete_at: None,
        updated_at: created_at,
        start_date: start,
        end_date: end,
        sub_status: sub.map(String::from),
        tourist_confirmed: None,
        guide_confirmed: None,
        rating_tourist_confirmed: None,
        rating_guide_confirmed: None,
        chain_id: None,
        order_kind: None,
        market_listing_id: None,
        data_origin: "production".into(),
    }
}
