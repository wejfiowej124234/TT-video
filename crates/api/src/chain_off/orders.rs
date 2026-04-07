//! chain_off 订单：CreateOrderBody、OpenDisputeBody、SetEscrowAddressBody、ConfirmFinalPlanBody、orders_list、order_get、order_create、confirm_final_plan、set_order_escrow_address（48 §5.5；50-80-2 乐观锁、50-80-3 Canonical）

use axum::{http::StatusCode, Json};
use chrono::{Duration, NaiveDate, Utc};
use serde::Deserialize;
use serde_json::{json, Value as JsonValue};
use sha3::{Digest, Keccak256};
use std::collections::BTreeMap;
use uuid::Uuid;

use super::itineraries::{
    infer_cover_image_from_days, validate_daily_itinerary_cities_for_destination, AmountBreakdown,
    ItineraryBundle, ItineraryDayRow,
};
use super::{
    audit_key_write_stderr, order_state_to_str, persist_order_if_db, strict_order_db_write_enabled,
    try_persist_order_to_db, ChainOffState, ChainOffStore, OrderListPage, OrderRow,
};
use crate::chain::ChainConfig;
use traveltrust_core::{
    fee_route_country::{resolve_fee_route_country_from_zh_destination, FeeRouteCountryResolve},
    OrderState,
};

/// 解析可选的 start/end 日期（YYYY-MM-DD）；两者都有且合法时返回 Some，否则 (None, None)
fn parse_optional_date_range(
    start: Option<&str>,
    end: Option<&str>,
) -> (Option<NaiveDate>, Option<NaiveDate>) {
    let start_date = start.and_then(|s| NaiveDate::parse_from_str(s.trim(), "%Y-%m-%d").ok());
    let end_date = end.and_then(|s| NaiveDate::parse_from_str(s.trim(), "%Y-%m-%d").ok());
    match (start_date, end_date) {
        (Some(s), Some(e)) if e >= s => (Some(s), Some(e)),
        _ => (None, None),
    }
}

#[derive(Deserialize)]
pub struct CreateOrderBody {
    pub guide_id: Uuid,
    pub amount: String,
    #[serde(default = "default_currency")]
    pub currency: String,
    #[serde(default)]
    pub escrow_address: Option<String>,
    /// 档期 start_date (YYYY-MM-DD)，与 end_date 同时提供时参与 schedule_engine 重叠校验（80 §4.15）
    #[serde(default)]
    pub start_date: Option<String>,
    #[serde(default)]
    pub end_date: Option<String>,
}

fn default_currency() -> String {
    "USD".to_string()
}

#[derive(Deserialize)]
pub struct OpenDisputeBody {
    #[serde(default)]
    #[allow(dead_code)]
    pub reason: Option<String>,
    #[serde(default)]
    pub arb_fee_paid: Option<String>,
}

#[derive(Deserialize)]
pub struct SetEscrowAddressBody {
    pub escrow_address: String,
}

/// 50-80-2：confirm-final-plan 乐观锁，请求须带当前期望的 version，后端 CAS 校验
#[derive(Deserialize)]
pub struct ConfirmFinalPlanBody {
    pub expected_version: u32,
}

/// 53 PATCH /api/v1/orders/:id/itinerary — 行程修改写回（04 登记；body 与 52 统一表一致；仅参与方、未 Escrowed 前可改）
#[derive(Deserialize, Default)]
pub struct PatchItineraryBody {
    #[serde(default)]
    pub daily_itinerary: Option<Vec<ItineraryDayRow>>,
    #[serde(default)]
    pub amount_breakdown: Option<AmountBreakdown>,
}

/// 结算代币精度（80-附录-01 最小单位）；与链上 USDC 等一致
const TOKEN_DECIMALS: u32 = 6;

fn f64_to_smallest_unit(v: f64) -> i64 {
    (v * 10_f64.powi(TOKEN_DECIMALS as i32)).round() as i64
}

/// 50-80-3：按 80-附录-01 Canonical Payload 白皮书构建参与 snapshotHash 的 JSON（键字母序、金额最小单位）
fn build_canonical_payload(order: &OrderRow, bundle: &ItineraryBundle) -> String {
    let chain_id = std::env::var("CHAIN_ID").unwrap_or_else(|_| "137".to_string());
    let settlement_token = std::env::var("SETTLEMENT_TOKEN").unwrap_or_else(|_| "".to_string());
    let token_symbol = std::env::var("TOKEN_SYMBOL").unwrap_or_else(|_| "USDC".to_string());
    let contract_version = std::env::var("CONTRACT_VERSION").unwrap_or_else(|_| "1".to_string());
    let amount_f64: f64 = order.amount.trim().replace(',', "").parse().unwrap_or(0.0);
    let amount = f64_to_smallest_unit(amount_f64);
    let ab = &bundle.amount_breakdown;
    let amount_breakdown: BTreeMap<String, i64> = [
        ("catering", f64_to_smallest_unit(ab.catering)),
        ("guide_fee", f64_to_smallest_unit(ab.guide_fee)),
        ("hotel", f64_to_smallest_unit(ab.hotel)),
        ("platform_fee", f64_to_smallest_unit(ab.platform_fee)),
        ("tickets", f64_to_smallest_unit(ab.tickets)),
        ("total_budget", f64_to_smallest_unit(ab.total_budget)),
        ("vehicle", f64_to_smallest_unit(ab.vehicle)),
    ]
    .into_iter()
    .map(|(k, v)| (k.to_string(), v))
    .collect();
    let start_date = order
        .start_date
        .as_ref()
        .map(|d| d.format("%Y-%m-%d").to_string())
        .unwrap_or_else(|| "".to_string());
    let end_date = order
        .end_date
        .as_ref()
        .map(|d| d.format("%Y-%m-%d").to_string())
        .unwrap_or_else(|| "".to_string());
    let mut m: BTreeMap<String, JsonValue> = BTreeMap::new();
    m.insert(
        "amount".to_string(),
        JsonValue::Number(serde_json::Number::from(amount)),
    );
    let ab_obj: BTreeMap<String, JsonValue> = amount_breakdown
        .into_iter()
        .map(|(k, v)| (k, JsonValue::Number(serde_json::Number::from(v))))
        .collect();
    m.insert(
        "amount_breakdown".to_string(),
        JsonValue::Object(ab_obj.into_iter().collect()),
    );
    m.insert(
        "cancellation_rules".to_string(),
        JsonValue::Object(Default::default()),
    );
    m.insert("chain_id".to_string(), JsonValue::String(chain_id));
    m.insert("city".to_string(), JsonValue::String(bundle.city.clone()));
    m.insert(
        "contract_version".to_string(),
        JsonValue::String(contract_version),
    );
    m.insert(
        "currency".to_string(),
        JsonValue::String(order.currency.clone()),
    );
    m.insert(
        "days".to_string(),
        JsonValue::Number(serde_json::Number::from(bundle.days.len() as i64)),
    );
    m.insert(
        "destination".to_string(),
        JsonValue::String(bundle.destination.clone()),
    );
    m.insert("end_date".to_string(), JsonValue::String(end_date));
    m.insert(
        "guide_id".to_string(),
        JsonValue::String(order.guide_id.to_string()),
    );
    m.insert(
        "order_id".to_string(),
        JsonValue::String(order.id.to_string()),
    );
    m.insert(
        "policies".to_string(),
        JsonValue::Object(Default::default()),
    );
    m.insert(
        "schemaVersion".to_string(),
        JsonValue::String("1".to_string()),
    );
    m.insert(
        "settlement_token".to_string(),
        JsonValue::String(settlement_token),
    );
    m.insert("start_date".to_string(), JsonValue::String(start_date));
    m.insert(
        "token_decimals".to_string(),
        JsonValue::Number(serde_json::Number::from(TOKEN_DECIMALS as i64)),
    );
    m.insert("token_symbol".to_string(), JsonValue::String(token_symbol));
    m.insert(
        "total_budget".to_string(),
        JsonValue::Number(serde_json::Number::from(f64_to_smallest_unit(
            ab.total_budget,
        ))),
    );
    m.insert(
        "traveler_id".to_string(),
        JsonValue::String(order.tourist_id.to_string()),
    );
    m.insert(
        "version".to_string(),
        JsonValue::Number(serde_json::Number::from(bundle.version as i64)),
    );
    serde_json::to_string(&m).unwrap_or_default()
}

fn order_list_item_json(store: &super::ChainOffStore, o: &OrderRow) -> serde_json::Value {
    let bundle = store.itineraries.get(&o.id);
    let (destination, city, days, travel_date, image) = bundle
        .map(|b| {
            let dest = b.destination.clone();
            let city = b.city.clone();
            let days = b.days.len() as u32;
            let travel_date = o.start_date.map(|d| d.to_string()).unwrap_or_default();
            let image = b
                .cover_image
                .clone()
                .or_else(|| infer_cover_image_from_days(&b.days));
            (dest, city, days, travel_date, image)
        })
        .unwrap_or_else(|| (String::new(), String::new(), 0u32, String::new(), None));
    let mut item = json!({
        "id": o.id.to_string(),
        "order_id": o.id.to_string(),
        "tourist_id": o.tourist_id.to_string(),
        "traveler_id": o.tourist_id.to_string(),
        "guide_id": o.guide_id.to_string(),
        "amount": o.amount,
        "currency": o.currency,
        "status": order_state_to_str(o.state),
        "destination": destination,
        "city": city,
        "days": days,
        "travel_date": travel_date,
        "image": image,
        "escrow_address": o.escrow_address,
        "created_at": o.created_at.to_rfc3339(),
        "accepted_at": o.accepted_at.map(|t| t.to_rfc3339()),
        "escrowed_at": o.escrowed_at.map(|t| t.to_rfc3339()),
        "completed_at": o.completed_at.map(|t| t.to_rfc3339())
    });
    if let Some(cid) = o.chain_id {
        item["chain_id"] = json!(cid);
    }
    if let Some(b) = bundle {
        let preview = super::discover::bundle_discover_preview_fields(b);
        if let (Some(io), Some(po)) = (item.as_object_mut(), preview.as_object()) {
            if let Some(v) = po.get("breakdown") {
                io.insert("breakdown".to_string(), v.clone());
            }
            if let Some(v) = po.get("itinerary") {
                io.insert("itinerary".to_string(), v.clone());
            }
        }
    }
    item
}

/// 55-S12：订单列表含 destination、city、travel_date、days，且按 order_id 唯一（store.orders 即按 id 唯一）。
/// 不传 `limit` 时保持全量返回（兼容旧客户端）；传 `limit` 时按 `updated_at DESC, id DESC` 分页，`cursor` 为上一页最后一条的 `id`。
/// **`state_filter`**：`GET /api/v1/orders?state=` 与 `order.state` 精确匹配（B-071）；`None` 表示不过滤。
pub async fn orders_list_impl(
    state: ChainOffState,
    user_id: Uuid,
    page: OrderListPage,
    state_filter: Option<OrderState>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    let mut rows: Vec<&OrderRow> = store
        .orders
        .values()
        .filter(|o| {
            crate::chain_off::order_is_participant(&store, o, user_id)
                && state_filter.map_or(true, |s| o.state == s)
        })
        .collect();

    if let Some(lim) = page.limit {
        rows.sort_by(|a, b| (b.updated_at, b.id).cmp(&(a.updated_at, a.id)));
        let start = match page.cursor {
            None => 0usize,
            Some(cid) => rows
                .iter()
                .position(|o| o.id == cid)
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
        let total = rows.len();
        let page_rows: Vec<_> = rows.into_iter().skip(start).take(lim).collect();
        let has_more = start + page_rows.len() < total;
        let next_cursor = if has_more {
            page_rows.last().map(|o| o.id.to_string())
        } else {
            None
        };
        let items: Vec<_> = page_rows
            .iter()
            .map(|o| order_list_item_json(&store, o))
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

    let items: Vec<_> = rows
        .into_iter()
        .map(|o| order_list_item_json(&store, o))
        .collect();
    Ok(Json(json!({ "status": "ok", "items": items })))
}

/// B-095：**向导收款 / 平台费入路由 / 国池（RegionVault）** 与 **`ChainConfig` + `guides.wallet_address`** 同源；**禁止**由客户端请求体覆写本对象。
#[must_use]
pub fn order_split_addresses_ssot(
    store: &ChainOffStore,
    order: &OrderRow,
    chain: Option<&ChainConfig>,
) -> JsonValue {
    let guide_receive_address = store
        .guides
        .get(&order.guide_id)
        .and_then(|g| g.wallet_address.as_ref())
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(|s| s.to_string());

    let platform_fee_recipient = chain.and_then(ChainConfig::escrow_platform_fee_recipient);
    let region_vault_address = chain.and_then(|c| {
        c.region_vault_address
            .as_ref()
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
    });
    let registry_address = chain.and_then(|c| {
        c.registry_address
            .as_ref()
            .map(|s| s.trim())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string())
    });

    json!({
        "ssot": "chain_config_plus_guide_row",
        "guide_receive_address": guide_receive_address,
        "platform_fee_recipient": platform_fee_recipient,
        "region_vault_address": region_vault_address,
        "registry_address": registry_address,
        "rule": "EscrowFactory.createEscrow: guide = guide_receive_address; platformFeeRecipient = platform_fee_recipient（须与 GET /meta chain.contracts.escrow_platform_fee_recipient 一致）；RegionVault 入账/转发与 region_vault_address、83/84 一致；链上 Registry 资格读 registry_address"
    })
}

/// 与 `GET /api/v1/orders/:id` 成功响应同形（含可选 `itinerary`）；**不做** tourist/guide 参与方校验（70：`GET /api/v1/admin/orders/:id`）。
pub fn order_detail_envelope(
    store: &ChainOffStore,
    o: &OrderRow,
    review_window_days: i64,
    chain_config: Option<&ChainConfig>,
) -> JsonValue {
    let order_id = o.id;
    // 53-S12：GET order 可选返回 payment_deadline、chat_confirm_deadline、rating_deadline（04/53 附录 A/F）
    let chat_confirm_deadline = match (o.state, o.accepted_at.as_ref(), o.sub_status.as_deref()) {
        (OrderState::Accepted, Some(accepted_at), sub)
            if sub
                .map(|s| s == "guide_claimed" || s == "pending_bilateral")
                .unwrap_or(true) =>
        {
            Some((*accepted_at + Duration::days(7)).to_rfc3339())
        }
        _ => None,
    };
    let payment_deadline = if o.tourist_confirmed == Some(true) && o.guide_confirmed == Some(true) {
        Some((o.updated_at + Duration::hours(24)).to_rfc3339())
    } else {
        None
    };
    let rating_deadline = match (o.state, o.completed_at.as_ref()) {
        (OrderState::Completed, Some(completed_at)) => {
            Some((*completed_at + Duration::days(review_window_days)).to_rfc3339())
        }
        _ => None,
    };

    let mut order_json = json!({
        "id": o.id.to_string(),
        "tourist_id": o.tourist_id.to_string(),
        "traveler_id": o.tourist_id.to_string(),
        "guide_id": o.guide_id.to_string(),
        "amount": o.amount,
        "currency": o.currency,
        "escrow_address": o.escrow_address,
        "state": order_state_to_str(o.state),
        "status": order_state_to_str(o.state),
        "created_at": o.created_at.to_rfc3339(),
        "accepted_at": o.accepted_at.map(|t| t.to_rfc3339()),
        "escrowed_at": o.escrowed_at.map(|t| t.to_rfc3339()),
        "completed_at": o.completed_at.map(|t| t.to_rfc3339()),
        "dispute_deadline_at": o.dispute_deadline_at.map(|t| t.to_rfc3339()),
        "auto_complete_at": o.auto_complete_at.map(|t| t.to_rfc3339()),
        "finality_block": serde_json::Value::Null,
        "escrow_block_number": serde_json::Value::Null,
        "sub_status": o.sub_status,
        "tourist_confirmed": o.tourist_confirmed,
        "guide_confirmed": o.guide_confirmed,
        "rating_tourist_confirmed": o.rating_tourist_confirmed,
        "rating_guide_confirmed": o.rating_guide_confirmed,
        "payment_deadline": payment_deadline,
        "chat_confirm_deadline": chat_confirm_deadline,
        "rating_deadline": rating_deadline
    });
    if let Some(cid) = o.chain_id {
        order_json["chain_id"] = json!(cid);
    }
    let mut resp = json!({ "status": "ok", "order": order_json });
    if let Some(bundle) = store.itineraries.get(&order_id) {
        // 与 order_list_item_json / 55-S12 一致：详情 order 上补齐目的地、城市、天数、出行日，便于前端会话侧只读摘要（53-S7）与列表字段对齐
        let travel_date = o.start_date.map(|d| d.to_string()).unwrap_or_default();
        resp["order"]["destination"] = json!(bundle.destination.clone());
        resp["order"]["city"] = json!(bundle.city.clone());
        resp["order"]["days"] = json!(bundle.days.len() as u32);
        resp["order"]["travel_date"] = json!(travel_date);
        let order_image = bundle
            .cover_image
            .clone()
            .or_else(|| infer_cover_image_from_days(&bundle.days));
        if let Some(ref cover) = order_image {
            if resp["order"].get("image").map_or(true, |v| v.is_null()) {
                resp["order"]["image"] = serde_json::json!(cover);
            }
        }

        // 52 §3.1 / 53 §二附四 / Escrow 详情：凡存在 bundle，参与方 GET 订单均返回只读 itinerary（含 daily_itinerary、amount_breakdown、snapshot_hash）；
        // 与 Draft 专属区别在写路径：仅 Draft 且未 Escrowed 前允许 PATCH itinerary（见 orders PATCH 实现）。
        let daily: Vec<serde_json::Value> = bundle
            .days
            .iter()
            .map(|d| serde_json::to_value(d).unwrap_or_else(|_| json!({"day_index": d.day_index, "content_text": d.content_text, "content_images": d.content_images})))
            .collect();
        resp["itinerary"] = json!({
            "version": bundle.version,
            "snapshot_hash": bundle.snapshot_hash,
            "daily_itinerary": daily,
            "amount_breakdown": {
                "hotel": bundle.amount_breakdown.hotel,
                "catering": bundle.amount_breakdown.catering,
                "tickets": bundle.amount_breakdown.tickets,
                "guide_fee": bundle.amount_breakdown.guide_fee,
                "vehicle": bundle.amount_breakdown.vehicle,
                "platform_fee": bundle.amount_breakdown.platform_fee,
                "total_budget": bundle.amount_breakdown.total_budget
            }
        });

        // B-083：destination → ISO + 国别子路径键；未知国家显式 reject（不静默默认池）
        match resolve_fee_route_country_from_zh_destination(&bundle.destination) {
            FeeRouteCountryResolve::Routed {
                iso3166_alpha2,
                bucket_route_key,
            } => {
                resp["order"]["fee_route_country"] = json!({
                    "ssot_field": traveltrust_core::FEE_ROUTE_COUNTRY_SSOT_FIELD,
                    "name_zh": bundle.destination,
                    "iso3166_alpha2": iso3166_alpha2,
                    "bucket_route_key": bucket_route_key,
                    "on_chain_mvp": "fee_router_single_country_bucket",
                    "note": "Distinct bucket_route_key per ISO for 84 alignment; FeeRouter.sol uses one immutable countryBucket until multi-bucket on-chain routing"
                });
            }
            FeeRouteCountryResolve::RejectUnmapped { code, message } => {
                resp["order"]["fee_route_country"] = json!({
                    "ssot_field": traveltrust_core::FEE_ROUTE_COUNTRY_SSOT_FIELD,
                    "name_zh": bundle.destination,
                    "reject": true,
                    "code": code,
                    "message": message
                });
            }
        }
    }
    if let Some(obj) = resp.get_mut("order").and_then(|v| v.as_object_mut()) {
        obj.insert(
            "split_addresses_ssot".to_string(),
            order_split_addresses_ssot(store, o, chain_config),
        );
    }
    resp
}

pub async fn order_get_impl(
    state: ChainOffState,
    chain_config: Option<&ChainConfig>,
    order_id: Uuid,
    user_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    let o = store.orders.get(&order_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(json!({"error": "order_not_found", "message": "order_not_found"})),
    ))?;
    if !crate::chain_off::order_is_participant(&store, o, user_id) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "forbidden", "message": "forbidden"})),
        ));
    }
    let body = order_detail_envelope(&store, o, state.config.review_window_days, chain_config);
    Ok(Json(body))
}

pub async fn order_create_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<CreateOrderBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut store = state.store.write().await;
    if let Some(err_key) = crate::chain_off::me::tourist_order_trust_gate(&store, user_id) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key(err_key)),
        ));
    }
    if !store.guides.contains_key(&body.guide_id) {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("guide_not_found")),
        ));
    }
    let guide = store.guides.get(&body.guide_id).unwrap();
    if guide.status != "active" {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("guide_not_active")),
        ));
    }
    if store.guide_slot.get(&body.guide_id).is_some() {
        return Err((
            StatusCode::CONFLICT,
            Json(
                json!({"error": "guide_has_active_order", "message": "guide_has_active_order", "hint": "档期占位：该向导已有 Accepted/Escrowed 订单"}),
            ),
        ));
    }
    let (start_date, end_date) =
        parse_optional_date_range(body.start_date.as_deref(), body.end_date.as_deref());
    let id = Uuid::new_v4();
    let now = Utc::now();
    let order = OrderRow {
        id,
        tourist_id: user_id,
        guide_id: body.guide_id,
        amount: body.amount.clone(),
        currency: body.currency.clone(),
        escrow_address: body.escrow_address.clone(),
        state: OrderState::Created,
        created_at: now,
        accepted_at: None,
        escrowed_at: None,
        completed_at: None,
        dispute_deadline_at: None,
        auto_complete_at: None,
        updated_at: now,
        start_date,
        end_date,
        sub_status: None,
        tourist_confirmed: None,
        guide_confirmed: None,
        rating_tourist_confirmed: None,
        rating_guide_confirmed: None,
        chain_id: state.config.business_chain_id,
    };
    store.orders.insert(id, order.clone());
    drop(store);
    if state.db_pool.is_some() {
        if strict_order_db_write_enabled() {
            if let Err(e) = try_persist_order_to_db(&state, &order).await {
                eprintln!(
                    "[audit] strict order_create: upsert_order failed order_id={} error={}",
                    order.id, e
                );
                let mut store = state.store.write().await;
                store.orders.remove(&id);
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "order_db_persist_failed",
                        "message": "order_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_ORDER_DB_WRITE=1; order removed from memory",
                    })),
                ));
            }
        } else {
            persist_order_if_db(&state, &order).await;
        }
    }
    Ok(Json(json!({
        "status": "ok",
        "order": {
            "id": order.id.to_string(),
            "tourist_id": order.tourist_id.to_string(),
            "traveler_id": order.tourist_id.to_string(),
            "guide_id": order.guide_id.to_string(),
            "amount": order.amount,
            "currency": order.currency,
            "status": order_state_to_str(order.state),
            "created_at": order.created_at.to_rfc3339()
        }
    })))
}

pub async fn confirm_final_plan_impl(
    state: ChainOffState,
    request_id: Option<&str>,
    order_id: Uuid,
    user_id: Uuid,
    body: ConfirmFinalPlanBody,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let (order, bundle) = {
        let store = state.store.read().await;
        let order = store.orders.get(&order_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?;
        if !crate::chain_off::order_is_participant(&store, order, user_id) {
            return Err((
                StatusCode::FORBIDDEN,
                Json(json!({"error": "forbidden", "message": "forbidden"})),
            ));
        }
        if let Some(err_key) =
            crate::chain_off::me::order_participant_trust_gate(&store, user_id, order)
        {
            return Err((
                StatusCode::FORBIDDEN,
                Json(crate::api_json::err_key(err_key)),
            ));
        }
        if order.state != OrderState::Draft {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(
                    json!({"error": "order_not_draft", "message": "order_not_draft", "hint": "仅 Draft 订单可确认最终版本"}),
                ),
            ));
        }
        let bundle = store.itineraries.get(&order_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("itinerary_not_found")),
        ))?;
        if bundle.snapshot_hash.is_some() {
            return Err((
                StatusCode::CONFLICT,
                Json(
                    json!({"error": "already_confirmed", "message": "already_confirmed", "snapshot_hash": bundle.snapshot_hash}),
                ),
            ));
        }
        // 50-80-2：乐观锁 CAS，expected_version 与当前 version 不一致则 409
        if body.expected_version != bundle.version {
            return Err((
                StatusCode::CONFLICT,
                Json(json!({
                    "error": "version_conflict",
                    "message": "version_conflict",
                    "hint": "订单已被更新，请用最新 version 重试",
                    "current_version": bundle.version,
                    "expected_version": body.expected_version
                })),
            ));
        }
        (order.clone(), bundle.clone())
    };
    let payload_bytes = build_canonical_payload(&order, &bundle);
    let hash = Keccak256::digest(payload_bytes.as_bytes());
    let snapshot_hash = format!("0x{}", hex::encode(hash));
    {
        let mut store = state.store.write().await;
        if let Some(bundle) = store.itineraries.get_mut(&order_id) {
            bundle.snapshot_hash = Some(snapshot_hash.clone());
        }
    }
    let strict_itin = std::env::var("TRAVELTRUST_STRICT_ITINERARY_DB_WRITE").as_deref() == Ok("1");
    if let Some(ref pool) = state.db_pool {
        if let Err(e) =
            crate::db::update_itinerary_snapshot_hash(pool, order_id, &snapshot_hash, Utc::now())
                .await
        {
            eprintln!(
                "[audit] db update_itinerary_snapshot_hash failed order_id={} error={}",
                order_id, e
            );
            if strict_itin {
                let mut store = state.store.write().await;
                if let Some(bundle) = store.itineraries.get_mut(&order_id) {
                    bundle.snapshot_hash = None;
                }
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "itinerary_db_persist_failed",
                        "message": "itinerary_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_ITINERARY_DB_WRITE=1; snapshot_hash reverted in memory",
                    })),
                ));
            }
        }
    }
    audit_key_write_stderr("confirm_final_plan", request_id, user_id, order_id);
    Ok(Json(json!({
        "status": "ok",
        "order_id": order_id.to_string(),
        "snapshot_hash": snapshot_hash,
        "version": bundle.version
    })))
}

pub async fn set_order_escrow_address_impl(
    state: ChainOffState,
    order_id: Uuid,
    user_id: Uuid,
    Json(body): Json<SetEscrowAddressBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let addr = body.escrow_address.trim();
    if addr.is_empty() || !addr.starts_with("0x") || addr.len() != 42 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(
                json!({"error": "invalid_escrow_address", "message": "invalid_escrow_address", "hint": "须为 0x 开头的 42 字符地址"}),
            ),
        ));
    }
    let mut store = state.store.write().await;
    let order_snap = store
        .orders
        .get(&order_id)
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?
        .clone();
    if !crate::chain_off::order_is_participant(&store, &order_snap, user_id) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "forbidden", "message": "forbidden"})),
        ));
    }
    if let Some(err_key) =
        crate::chain_off::me::order_participant_trust_gate(&store, user_id, &order_snap)
    {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key(err_key)),
        ));
    }
    let order = store.orders.get_mut(&order_id).expect("order exists");
    let prev_escrow = order.escrow_address.clone();
    let prev_updated_at = order.updated_at;
    order.escrow_address = Some(addr.to_string());
    order.updated_at = Utc::now();
    let order_clone = order.clone();
    drop(store);
    if state.db_pool.is_some() {
        if strict_order_db_write_enabled() {
            if let Err(e) = try_persist_order_to_db(&state, &order_clone).await {
                eprintln!(
                    "[audit] strict set_order_escrow_address: upsert_order failed order_id={} error={}",
                    order_id, e
                );
                let mut store = state.store.write().await;
                if let Some(o) = store.orders.get_mut(&order_id) {
                    o.escrow_address = prev_escrow;
                    o.updated_at = prev_updated_at;
                }
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "order_db_persist_failed",
                        "message": "order_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_ORDER_DB_WRITE=1; escrow_address reverted in memory",
                    })),
                ));
            }
        } else {
            persist_order_if_db(&state, &order_clone).await;
        }
    }
    Ok(Json(json!({
        "status": "ok",
        "order_id": order_id.to_string(),
        "escrow_address": addr
    })))
}

/// 53 PATCH /api/v1/orders/:id/itinerary — 行程修改写回（仅参与方、未 Escrowed 前可改；04 §3.4）
pub async fn patch_order_itinerary_impl(
    state: ChainOffState,
    request_id: Option<&str>,
    order_id: Uuid,
    user_id: Uuid,
    Json(body): Json<PatchItineraryBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut store = state.store.write().await;
    let order = store
        .orders
        .get(&order_id)
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?
        .clone();
    if !crate::chain_off::order_is_participant(&store, &order, user_id) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "forbidden", "message": "forbidden"})),
        ));
    }
    if let Some(err_key) =
        crate::chain_off::me::order_participant_trust_gate(&store, user_id, &order)
    {
        return Err((
            StatusCode::FORBIDDEN,
            Json(crate::api_json::err_key(err_key)),
        ));
    }
    if order.state == OrderState::Escrowed
        || order.state == OrderState::Completed
        || order.state == OrderState::Cancelled
        || order.state == OrderState::Disputed
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "order_not_editable",
                "message": "order_not_editable",
                "hint": "仅未 Escrowed 前可修改行程；当前状态已不可编辑"
            })),
        ));
    }
    let bundle_before = store.itineraries.get(&order_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("itinerary_not_found")),
    ))?;
    let bundle_before = bundle_before.clone();
    let bundle = store
        .itineraries
        .get_mut(&order_id)
        .expect("itinerary exists");
    if bundle.snapshot_hash.is_some() {
        return Err((
            StatusCode::CONFLICT,
            Json(json!({
                "error": "itinerary_already_confirmed",
                "message": "itinerary_already_confirmed",
                "hint": "已确认最终版本，不可再修改行程"
            })),
        ));
    }
    if let Some(ref days) = body.daily_itinerary {
        if !days.is_empty() {
            validate_daily_itinerary_cities_for_destination(&bundle_before.destination, days)?;
            bundle.days = days.clone();
        }
    }
    if let Some(ab) = body.amount_breakdown {
        bundle.amount_breakdown = ab;
    }
    bundle.version += 1;
    let version = bundle.version;
    let days_json = serde_json::to_value(&bundle.days).unwrap_or_else(|_| json!([]));
    let amount_json =
        serde_json::to_value(&bundle.amount_breakdown).unwrap_or_else(|_| json!(null));
    drop(store);
    let strict_itin = std::env::var("TRAVELTRUST_STRICT_ITINERARY_DB_WRITE").as_deref() == Ok("1");
    if let Some(ref pool) = state.db_pool {
        if let Err(e) = crate::db::update_itinerary_days_breakdown_version(
            pool,
            order_id,
            &days_json,
            Some(&amount_json),
            version as i32,
            Utc::now(),
        )
        .await
        {
            eprintln!(
                "[audit] db update_itinerary_days_breakdown_version failed order_id={} error={}",
                order_id, e
            );
            if strict_itin {
                let mut store = state.store.write().await;
                store.itineraries.insert(order_id, bundle_before);
                return Err((
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "error": "itinerary_db_persist_failed",
                        "message": "itinerary_db_persist_failed",
                        "rule": "TRAVELTRUST_STRICT_ITINERARY_DB_WRITE=1; itinerary bundle reverted in memory",
                    })),
                ));
            }
        }
    }
    audit_key_write_stderr("patch_order_itinerary", request_id, user_id, order_id);
    Ok(Json(json!({
        "status": "ok",
        "order_id": order_id.to_string(),
        "version": version
    })))
}

#[cfg(test)]
mod traveler_id_alias_tests {
    use super::*;
    use crate::chain_off::{ChainOffStore, GuideRow};
    use chrono::Utc;
    use traveltrust_core::OrderState;
    use uuid::Uuid;

    fn sample_order(tid: Uuid) -> OrderRow {
        let now = Utc::now();
        OrderRow {
            id: Uuid::new_v4(),
            tourist_id: tid,
            guide_id: Uuid::new_v4(),
            amount: "100".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            state: OrderState::Created,
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
        }
    }

    #[test]
    fn order_list_item_includes_traveler_id_mirror() {
        let tid = Uuid::new_v4();
        let o = sample_order(tid);
        let store = ChainOffStore::default();
        let j = order_list_item_json(&store, &o);
        assert_eq!(j["tourist_id"].as_str().unwrap(), tid.to_string());
        assert_eq!(j["traveler_id"].as_str().unwrap(), tid.to_string());
    }

    #[test]
    fn order_detail_envelope_includes_traveler_id_mirror() {
        let tid = Uuid::new_v4();
        let o = sample_order(tid);
        let store = ChainOffStore::default();
        let env = order_detail_envelope(&store, &o, 14, None);
        assert_eq!(
            env["order"]["tourist_id"].as_str().unwrap(),
            tid.to_string()
        );
        assert_eq!(
            env["order"]["traveler_id"].as_str().unwrap(),
            tid.to_string()
        );
    }

    #[test]
    fn b095_split_addresses_match_chain_config_and_meta_escrow_platform_fee_recipient() {
        let tid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let mut store = ChainOffStore::default();
        let now = Utc::now();
        store.guides.insert(
            gid,
            GuideRow {
                id: gid,
                user_id: Uuid::new_v4(),
                city: "杭州市".to_string(),
                country_code: "CN".to_string(),
                languages: vec![],
                service_types: vec![],
                bio: None,
                wallet_address: Some("0x3333333333333333333333333333333333333333".to_string()),
                real_name: None,
                passport_number_hash: None,
                id_photo_url: None,
                language_cert_url: None,
                guide_license_url: None,
                stake_amount: "0".to_string(),
                status: "active".to_string(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: now,
                updated_at: now,
            },
        );
        let mut o = sample_order(tid);
        o.guide_id = gid;

        let chain = crate::chain::ChainConfig {
            rpc_url: "http://x".to_string(),
            chain_id: 137,
            escrow_factory_address: None,
            fee_router_address: Some(" 0x1111111111111111111111111111111111111111 ".to_string()),
            region_vault_address: Some("0x2222222222222222222222222222222222222222".to_string()),
            investor_share_token_addresses: vec![],
            staking_address: None,
            investor_lock_contract_addresses: vec![],
            governor_address: None,
            governance_votes_token_address: None,
            registry_address: Some("0x4444444444444444444444444444444444444444".to_string()),
            executor_max_amount_per_tx: None,
            executor_max_amount_per_day: None,
            executor_retry_count: 3,
        };

        let meta_recipient = chain.escrow_platform_fee_recipient();
        let split = order_split_addresses_ssot(&store, &o, Some(&chain));
        assert_eq!(
            split["platform_fee_recipient"].as_str(),
            meta_recipient.as_deref()
        );
        assert_eq!(
            split["guide_receive_address"].as_str(),
            Some("0x3333333333333333333333333333333333333333")
        );
        assert_eq!(
            split["region_vault_address"].as_str(),
            Some("0x2222222222222222222222222222222222222222")
        );
        assert_eq!(
            split["registry_address"].as_str(),
            Some("0x4444444444444444444444444444444444444444")
        );

        let env = order_detail_envelope(&store, &o, 14, Some(&chain));
        assert_eq!(env["order"]["split_addresses_ssot"], split);
    }
}
