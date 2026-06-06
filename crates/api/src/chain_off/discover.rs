//! chain_off：`GET /api/v1/discover/orders` 数据源；前端列表主 UI 为 `/market`（48 §5.7、49 D、04 §3.4）

use std::collections::HashMap;

use axum::{http::StatusCode, Json};
use serde_json::json;

use super::itineraries::{infer_cover_image_from_days, ItineraryBundle};
use super::{order_state_to_str, ChainOffState, OrderListPage, OrderRow};
use traveltrust_core::OrderState;
use uuid::Uuid;

/// 自由市场左栏可展示：Draft 草稿 + Created 已发布，且尚未指派向导（与前端 `isOrderPublishedToDiscover` 对拍）。
pub(crate) fn order_eligible_for_discover_market(o: &OrderRow) -> bool {
    if o.guide_id != Uuid::nil() {
        return false;
    }
    matches!(o.state, OrderState::Draft | OrderState::Created)
}

/// 与 GET `/orders/:id` 之 **itinerary** 及卡片 **breakdown** 同源；供 GET discover 与 GET `/orders` 列表复用（07 §5.1 / 56-S11）。
pub(crate) fn bundle_discover_preview_fields(bundle: &ItineraryBundle) -> serde_json::Value {
    let ab = &bundle.amount_breakdown;
    let daily: Vec<serde_json::Value> = bundle
        .days
        .iter()
        .map(|d| {
            serde_json::to_value(d).unwrap_or_else(|_| {
                json!({"day_index": d.day_index, "content_text": d.content_text, "content_images": d.content_images})
            })
        })
        .collect();
    json!({
        "breakdown": {
            "guideFee": ab.guide_fee,
            "carFee": ab.vehicle,
            "hotel": ab.hotel,
            "food": ab.catering,
            "tickets": ab.tickets,
            "misc": ab.platform_fee
        },
        "itinerary": {
            "version": bundle.version,
            "snapshot_hash": bundle.snapshot_hash,
            "daily_itinerary": daily,
            "amount_breakdown": {
                "hotel": ab.hotel,
                "catering": ab.catering,
                "tickets": ab.tickets,
                "guide_fee": ab.guide_fee,
                "vehicle": ab.vehicle,
                "platform_fee": ab.platform_fee,
                "total_budget": ab.total_budget
            }
        }
    })
}

fn discover_card_json(o: &OrderRow, bundle: &ItineraryBundle) -> serde_json::Value {
    let travel_date = o.start_date.map(|d| d.to_string()).unwrap_or_default();
    let preview = bundle_discover_preview_fields(bundle);
    let p = preview
        .as_object()
        .expect("bundle_discover_preview_fields returns object");
    let mut card = json!({
        "id": o.id.to_string(),
        "order_id": o.id.to_string(),
        "tourist_id": o.tourist_id.to_string(),
        "traveler_id": o.tourist_id.to_string(),
        "guide_id": o.guide_id.to_string(),
        "amount": o.amount,
        "currency": o.currency,
        "status": order_state_to_str(o.state),
        "state": order_state_to_str(o.state),
        "sub_status": o.sub_status,
        "destination": bundle.destination,
        "city": bundle.city,
        "country": bundle.destination,
        "days": bundle.days.len() as u32,
        "travel_date": travel_date,
        "version": bundle.version,
        "image": bundle
            .cover_image
            .clone()
            .or_else(|| infer_cover_image_from_days(&bundle.days)),
        "escrow_address": o.escrow_address,
        "breakdown": p["breakdown"].clone(),
        "itinerary": p["itinerary"].clone(),
    });
    if let Some(cid) = o.chain_id {
        card["chain_id"] = json!(cid);
    }
    card
}

/// 可被浏览的订单列表（Draft + Created 且未指派向导，供前端 **自由市场 `/market`** 卡片消费；HTTP 路径保留 **`GET /api/v1/discover/orders`**）；49 D：country/city 筛选；50-80-5 按 created_at 倒序。
/// 55-S12：按 order_id 唯一；**可选** `limit`+`cursor` 分页（`updated_at DESC, id DESC`），不传 limit 时行为与历史一致（全量、按 created_at 倒序）。
pub async fn discover_orders_list_impl(
    state: ChainOffState,
    country: Option<String>,
    city: Option<String>,
    days: Option<u32>,
    page: OrderListPage,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    let country_trim = country
        .as_deref()
        .map(|s| s.trim())
        .filter(|s| !s.is_empty());
    let city_trim = city.as_deref().map(|s| s.trim()).filter(|s| !s.is_empty());
    let days_filter = days.filter(|d| (1..=30).contains(d));

    let business = state.config.business_chain_id;
    let pairs: Vec<(OrderRow, ItineraryBundle)> = store
        .orders
        .values()
        .filter(|o| {
            order_eligible_for_discover_market(o)
                && super::orders::order_matches_orders_list_chain_scope(o, business, None)
        })
        .filter_map(|o| {
            let bundle = store.itineraries.get(&o.id)?;
            if super::public_catalog_surface_filter_enabled()
                && super::market_public_surface::is_smoke_discover_order(&store, o, bundle)
            {
                return None;
            }
            if country_trim.map_or(true, |c| bundle.destination.eq_ignore_ascii_case(c))
                && city_trim.map_or(true, |c| bundle.city.eq_ignore_ascii_case(c))
                && days_filter.map_or(true, |d| bundle.days.len() as u32 == d)
            {
                Some((o.clone(), bundle.clone()))
            } else {
                None
            }
        })
        .collect();

    // 54-S9 / 55-S12：按 order_id 唯一；内存 store 虽为 HashMap，此处再折叠一次，防未来多源合并或重复键。
    let mut by_id: HashMap<uuid::Uuid, (OrderRow, ItineraryBundle)> = HashMap::new();
    for (o, b) in pairs {
        by_id.entry(o.id).or_insert((o, b));
    }
    let mut pairs: Vec<_> = by_id.into_values().collect();

    if let Some(lim) = page.limit {
        pairs.sort_by(|(a, _), (b, _)| (b.updated_at, b.id).cmp(&(a.updated_at, a.id)));
        let start = match page.cursor {
            None => 0usize,
            Some(cid) => pairs
                .iter()
                .position(|(o, _)| o.id == cid)
                .map(|i| i + 1)
                .ok_or_else(|| {
                    (
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key_detail(
                            "invalid_cursor",
                            "cursor must be the id field of the last item from the previous page",
                        )),
                    )
                })?,
        };
        let total = pairs.len();
        let page_pairs: Vec<_> = pairs.into_iter().skip(start).take(lim).collect();
        let has_more = start + page_pairs.len() < total;
        let next_cursor = if has_more {
            page_pairs.last().map(|(o, _)| o.id.to_string())
        } else {
            None
        };
        let items: Vec<_> = page_pairs
            .iter()
            .map(|(o, b)| discover_card_json(o, b))
            .collect();
        return Ok(Json(json!({
            "status": "ok",
            "items": items,
            "page": {
                "limit": lim,
                "next_cursor": next_cursor,
                "has_more": has_more
            }
        })));
    }

    pairs.sort_by(|(a, _), (b, _)| b.created_at.cmp(&a.created_at));
    let items: Vec<_> = pairs
        .into_iter()
        .map(|(o, b)| discover_card_json(&o, &b))
        .collect();
    Ok(Json(json!({ "status": "ok", "items": items })))
}

#[cfg(test)]
mod discover_participant_id_tests {
    use super::*;
    use chrono::Utc;
    use traveltrust_core::OrderState;
    use uuid::Uuid;

    use super::super::itineraries::{AmountBreakdown, ItineraryBundle};

    fn minimal_bundle(oid: Uuid) -> ItineraryBundle {
        ItineraryBundle {
            order_id: oid,
            version: 1,
            destination: "中国".into(),
            city: "上海".into(),
            days: vec![],
            amount_breakdown: AmountBreakdown {
                hotel: 0.,
                catering: 0.,
                tickets: 0.,
                guide_fee: 0.,
                vehicle: 0.,
                platform_fee: 0.,
                total_budget: 0.,
            },
            snapshot_hash: None,
            cover_image: None,
        }
    }

    #[test]
    fn discover_card_includes_tourist_traveler_guide_ids() {
        let oid = Uuid::new_v4();
        let tid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let now = Utc::now();
        let o = OrderRow {
            id: oid,
            tourist_id: tid,
            guide_id: gid,
            amount: "100".into(),
            currency: "USD".into(),
            escrow_address: None,
            state: OrderState::Draft,
            created_at: now,
            accepted_at: None,
            escrowed_at: None,
            completed_at: None,
            dispute_deadline_at: None,
            auto_complete_at: None,
            updated_at: now,
            start_date: None,
            end_date: None,
            sub_status: None,
            tourist_confirmed: None,
            guide_confirmed: None,
            rating_tourist_confirmed: None,
            rating_guide_confirmed: None,
            chain_id: None,
            data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
        };
        let card = discover_card_json(&o, &minimal_bundle(oid));
        assert_eq!(card["tourist_id"].as_str().unwrap(), tid.to_string());
        assert_eq!(card["traveler_id"].as_str().unwrap(), tid.to_string());
        assert_eq!(card["guide_id"].as_str().unwrap(), gid.to_string());
    }
}
