//! chain_off 订单：CreateOrderBody、OpenDisputeBody、SetEscrowAddressBody、ConfirmFinalPlanBody、orders_list、order_get、order_create、confirm_final_plan、set_order_escrow_address（48 §5.5；50-80-2 乐观锁、50-80-3 Canonical）

use axum::{http::StatusCode, Json};
use chrono::{DateTime, Duration, NaiveDate, Utc};
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
use crate::db;
use crate::order_deadline_clock::OrderDeadlineClock;
use traveltrust_core::{
    fee_route_country::{resolve_fee_route_country_from_zh_destination, FeeRouteCountryResolve},
    OrderState,
};

#[cfg(test)]
use std::sync::Mutex;

/// 单测并行安全：模拟链上读数；**`None`**=未覆盖，**`Some(None)`**=强制链读失败（**fail-closed** → **`governance_ssot_fallback_p3`**），**`Some(Some(d))`**=强制 Governor 返回 d 天（**`governance_ssot_chain_governor`**）。
#[cfg(test)]
static ORDER_DEADLINE_SSOT_REVIEW_DAYS_TEST_HOOK: Mutex<Option<Option<i64>>> = Mutex::new(None);

/// 并行 `cargo test` 下 **`ORDER_DEADLINE_SSOT_REVIEW_DAYS_TEST_HOOK`** 须串行。
#[cfg(test)]
static ORDER_DEADLINE_SSOT_HOOK_TEST_MUTEX: Mutex<()> = Mutex::new(());

/// 供 **`routes/admin.rs`** 等跨模块单测与其它 **`orders`** 用例并行时串行化 hook。
#[cfg(test)]
pub(crate) fn order_deadline_ssot_parallel_test_guard(
) -> std::sync::MutexGuard<'static, ()> {
    ORDER_DEADLINE_SSOT_HOOK_TEST_MUTEX.lock().expect("ssot hook test mutex")
}

#[cfg(test)]
pub(crate) fn order_deadline_ssot_test_hook_reset() {
    *ORDER_DEADLINE_SSOT_REVIEW_DAYS_TEST_HOOK.lock().unwrap() = None;
}

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

/// `POST /api/v1/orders` 创建的 Created 订单无行程包；为 confirm-final-plan / GET 详情
/// 与 50-80-3 canonical 快照提供与订单金额一致的最小只读 bundle（目的地取产品期允许中文国名）。
pub(super) fn minimal_itinerary_bundle_for_simple_order(order: &OrderRow) -> ItineraryBundle {
    let amount_f64: f64 = order.amount.trim().replace(',', "").parse().unwrap_or(0.0);
    let ab = AmountBreakdown {
        hotel: 0.0,
        catering: 0.0,
        tickets: 0.0,
        guide_fee: amount_f64,
        vehicle: 0.0,
        platform_fee: 0.0,
        total_budget: amount_f64,
    };
    let day = ItineraryDayRow {
        day_index: 1,
        content_text: "order_create placeholder itinerary".to_string(),
        ..Default::default()
    };
    ItineraryBundle {
        order_id: order.id,
        version: 1,
        destination: "中国".to_string(),
        city: "上海".to_string(),
        days: vec![day],
        amount_breakdown: ab,
        snapshot_hash: None,
        cover_image: None,
    }
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

/// B-097：向 **`order`** JSON 写入 **`projection_terminal`** + **`display_status`**（有投影行时徽章以投影 **`status`** 为 SSOT）。
fn apply_orders_projection_fields_to_order_json(
    body: &mut serde_json::Value,
    order_state_str: &str,
    term: Option<&db::OrdersProjectionTerminalRow>,
    db_err: Option<&str>,
) {
    let Some(order_j) = body.get_mut("order").and_then(|v| v.as_object_mut()) else {
        return;
    };
    match db_err {
        Some(err) => {
            order_j.insert(
                "projection_terminal".to_string(),
                db::projection_terminal_json_degraded(err),
            );
            order_j.insert("display_status".to_string(), json!(order_state_str));
        }
        None => {
            let pt = db::projection_terminal_json_for_api(order_state_str, term);
            let disp = term.map(|t| t.status.as_str()).unwrap_or(order_state_str);
            order_j.insert("projection_terminal".to_string(), pt);
            order_j.insert("display_status".to_string(), json!(disp));
        }
    }
}

/// 列表项：在 **`order_list_item_json`** 结果上附加 **`projection_terminal`** / **`display_status`**。
fn apply_orders_projection_fields_to_list_item_json(
    item: &mut serde_json::Value,
    order_state_str: &str,
    term: Option<&db::OrdersProjectionTerminalRow>,
) {
    let Some(obj) = item.as_object_mut() else {
        return;
    };
    let pt = db::projection_terminal_json_for_api(order_state_str, term);
    let disp = term.map(|t| t.status.as_str()).unwrap_or(order_state_str);
    obj.insert("projection_terminal".to_string(), pt);
    obj.insert("display_status".to_string(), json!(disp));
}

fn order_list_item_json(
    store: &super::ChainOffStore,
    o: &OrderRow,
    rating_resolution: &RatingReviewWindowResolution,
    deadline_as_of_utc: DateTime<Utc>,
) -> serde_json::Value {
    let ((payment_deadline, chat_confirm_deadline, rating_deadline), deadline_obs) =
        compute_order_deadlines_with_rating_observability(
            o,
            rating_resolution,
            true,
            deadline_as_of_utc,
        );
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
        "state": order_state_to_str(o.state),
        "sub_status": o.sub_status,
        "destination": destination,
        "city": city,
        "days": days,
        "travel_date": travel_date,
        "image": image,
        "escrow_address": o.escrow_address,
        "created_at": o.created_at.to_rfc3339(),
        "accepted_at": o.accepted_at.map(|t| t.to_rfc3339()),
        "escrowed_at": o.escrowed_at.map(|t| t.to_rfc3339()),
        "completed_at": o.completed_at.map(|t| t.to_rfc3339()),
        "payment_deadline": payment_deadline,
        "chat_confirm_deadline": chat_confirm_deadline,
        "rating_deadline": rating_deadline,
        "deadline_rating_observability": deadline_obs
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
    if let Some(u) = store.users.get(&o.tourist_id) {
        if let Some(nick) = u.nickname.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
            item["traveler_nickname"] = json!(nick);
        }
    }
    item["business_line"] = json!(super::order_business_line_for_chain_off(o));
    if let Some(ref kind) = o.order_kind {
        item["order_kind"] = json!(kind);
    }
    item
}

/// **B-102 / TT-122 / B-122**：列表链范围（谓词 **SSOT**：**`db::orders::orders_row_matches_list_chain_scope`**；**`orders_chain_scope`**：**`db::orders::orders_list_chain_scope_json`**；单测 **`tt_b122_*`**）。
/// - **`business_chain_id`**：**`None`**（实例未解析 **`CHAIN_ID`**）→ **不过滤**。
/// - **`query_chain_id`**：**`None`** → **默认范围**：**`order.chain_id IS NULL`**（历史/未赋值）**或** **`== business_chain_id`**。
/// - **`query_chain_id == Some(q)`** 且 **`q == business`**：**同上**（含 NULL legacy）。
/// - **`query_chain_id == Some(q)`** 且 **`q != business`**：**严格** **`order.chain_id == Some(q)`**（**不含** NULL）。
pub fn order_matches_orders_list_chain_scope(
    o: &OrderRow,
    business_chain_id: Option<i64>,
    query_chain_id: Option<i64>,
) -> bool {
    crate::db::orders_row_matches_list_chain_scope(
        o.chain_id,
        business_chain_id,
        query_chain_id,
    )
}

/// **GET /api/v1/orders/:id**：若订单已写 **`chain_id`** 且与 **`ChainConfig.chain_id`** 不一致 → **404**（与 **`order_not_found`** 同形，防泄漏）。
pub fn order_chain_mismatch_for_public_read(o: &OrderRow, chain: &ChainConfig) -> bool {
    let want = (chain.chain_id.min(i64::MAX as u64)) as i64;
    match o.chain_id {
        None => false,
        Some(cid) => cid != want,
    }
}

/// W4 / Guide Order Corridor：`GET /api/v1/orders?hat=guide` 仅返回当前用户 **`guides_by_user`** 行 id 与 **`order.guide_id`** 匹配的接待单。
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OrdersListHat {
    Guide,
    Merchant,
    Traveler,
}

pub fn parse_orders_list_hat(raw: Option<&str>) -> Result<Option<OrdersListHat>, &'static str> {
    match raw.map(str::trim).filter(|s| !s.is_empty()) {
        None => Ok(None),
        Some("guide") => Ok(Some(OrdersListHat::Guide)),
        Some("merchant") => Ok(Some(OrdersListHat::Merchant)),
        Some("traveler") => Ok(Some(OrdersListHat::Traveler)),
        Some(_) => Err("invalid_hat"),
    }
}

#[must_use]
pub fn order_matches_orders_list_hat(
    store: &ChainOffStore,
    o: &OrderRow,
    user_id: Uuid,
    hat: Option<OrdersListHat>,
) -> bool {
    match hat {
        None => true,
        Some(OrdersListHat::Guide) => store
            .guides_by_user
            .get(&user_id)
            .is_some_and(|guide_row_id| o.guide_id == *guide_row_id),
        Some(OrdersListHat::Merchant) => {
            super::order_business_line_for_chain_off(o) == "merchant_service"
                && super::order_guide_user_id(store, o) == Some(user_id)
        }
        Some(OrdersListHat::Traveler) => o.tourist_id == user_id,
    }
}

fn orders_list_hat_json(hat: Option<OrdersListHat>) -> Option<&'static str> {
    match hat {
        None => None,
        Some(OrdersListHat::Guide) => Some("guide"),
        Some(OrdersListHat::Merchant) => Some("merchant"),
        Some(OrdersListHat::Traveler) => Some("traveler"),
    }
}

/// 55-S12：订单列表含 destination、city、travel_date、days，且按 order_id 唯一（store.orders 即按 id 唯一）。
/// 不传 `limit` 时保持全量返回（兼容旧客户端）；传 `limit` 时按 `updated_at DESC, id DESC` 分页，`cursor` 为上一页最后一条的 `id`。
/// B-102 链范围；**`state_filter == Draft`** 时不施加链过滤，以便用户清理全部草稿（与 `itinerary_create` cap 计数一致）。
#[must_use]
pub fn order_visible_in_orders_list(
    store: &ChainOffStore,
    o: &OrderRow,
    user_id: Uuid,
    state_filter: Option<OrderState>,
    business_line_filter: Option<&str>,
    business_chain_id: Option<i64>,
    orders_list_chain_id: Option<i64>,
) -> bool {
    super::order_is_participant(store, o, user_id)
        && state_filter.map_or(true, |s| o.state == s)
        && business_line_filter.map_or(true, |line| {
            super::order_matches_business_line_filter(o, line)
        })
        && (state_filter == Some(OrderState::Draft)
            || order_matches_orders_list_chain_scope(o, business_chain_id, orders_list_chain_id))
}

/// **`state_filter`**：`GET /api/v1/orders?state=` 与 `order.state` 精确匹配（B-071）；`None` 表示不过滤。
/// **`orders_list_chain_id`**：`GET /api/v1/orders?orders_chain_id=`（**B-102**）；**`None`** = 默认业务链范围。
pub async fn orders_list_impl(
    state: ChainOffState,
    order_deadline_clock: &dyn OrderDeadlineClock,
    chain_config: Option<&ChainConfig>,
    user_id: Uuid,
    page: OrderListPage,
    state_filter: Option<OrderState>,
    business_line_filter: Option<&str>,
    orders_list_chain_id: Option<i64>,
    list_hat: Option<OrdersListHat>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let deadline_as_of_utc = order_deadline_clock.now_utc();
    let rating_resolution =
        rating_review_window_resolution_for_orders_api(&state.config, chain_config).await;
    let business = state.config.business_chain_id;
    let store = state.store.read().await;
    let mut rows: Vec<&OrderRow> = store
        .orders
        .values()
        .filter(|o| {
            order_visible_in_orders_list(
                &store,
                o,
                user_id,
                state_filter,
                business_line_filter,
                business,
                orders_list_chain_id,
            ) && order_matches_orders_list_hat(&store, o, user_id, list_hat)
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
        let staged: Vec<(Uuid, String, serde_json::Value)> = page_rows
            .iter()
            .map(|o| {
                (
                    o.id,
                    order_state_to_str(o.state).to_string(),
                    order_list_item_json(&store, o, &rating_resolution, deadline_as_of_utc),
                )
            })
            .collect();
        drop(store);
        let ids: Vec<Uuid> = staged.iter().map(|(id, _, _)| *id).collect();
        let proj = match state.db_pool.as_ref() {
            Some(pool) => db::fetch_orders_projection_terminals_by_order_uuids(pool, &ids)
                .await
                .unwrap_or_default(),
            None => std::collections::HashMap::new(),
        };
        let items: Vec<_> = staged
            .into_iter()
            .map(|(id, os, mut item)| {
                apply_orders_projection_fields_to_list_item_json(&mut item, &os, proj.get(&id));
                item
            })
            .collect();
        let scope = crate::db::orders_list_chain_scope_json(business, orders_list_chain_id);
        let hat_json = orders_list_hat_json(list_hat);
        return Ok(Json(json!({
            "status": "ok",
            "items": items,
            "page": {
                "limit": lim,
                "next_cursor": next_cursor,
                "has_more": has_more
            },
            "orders_chain_scope": scope,
            "list_hat": hat_json
        })));
    }

    let staged: Vec<(Uuid, String, serde_json::Value)> = rows
        .into_iter()
        .map(|o| {
            (
                o.id,
                order_state_to_str(o.state).to_string(),
                order_list_item_json(&store, o, &rating_resolution, deadline_as_of_utc),
            )
        })
        .collect();
    drop(store);
    let ids: Vec<Uuid> = staged.iter().map(|(id, _, _)| *id).collect();
    let proj = match state.db_pool.as_ref() {
        Some(pool) => db::fetch_orders_projection_terminals_by_order_uuids(pool, &ids)
            .await
            .unwrap_or_default(),
        None => std::collections::HashMap::new(),
    };
    let items: Vec<_> = staged
        .into_iter()
        .map(|(id, os, mut item)| {
            apply_orders_projection_fields_to_list_item_json(&mut item, &os, proj.get(&id));
            item
        })
        .collect();
    let scope = crate::db::orders_list_chain_scope_json(business, orders_list_chain_id);
    let hat_json = orders_list_hat_json(list_hat);
    Ok(Json(json!({
        "status": "ok",
        "items": items,
        "orders_chain_scope": scope,
        "list_hat": hat_json
    })))
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

/// **`rating_deadline`** 用的评价窗口天数解析结果（**TT-B110-SEQ2-ORDERS-DEADLINE-SSOT-OBSERVE-001** / **TT-B110-SEQ2-ORDERS-DEADLINE-GOVERNANCE-CHAIN-READ-001**）。
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(crate) struct RatingReviewWindowResolution {
    pub effective_days: i64,
    /// 机读源：**`p3_review_window_days`** | **`governance_ssot_chain_governor`**（**`TravelTrustGovernor.orderRatingReviewWindowDays()`**）| **`governance_ssot_fallback_p3`**（链读失败 / 无 Governor / 越界 **fail-closed**）
    pub source: &'static str,
    pub governance_order_deadline_chain_ssot: bool,
    pub p3_review_window_days_config: i64,
}

pub(crate) fn resolve_rating_review_window_for_deadlines(
    review_window_days_fallback: i64,
    governance_order_deadline_chain_ssot: bool,
    chain_review_window_days: Option<i64>,
) -> RatingReviewWindowResolution {
    if !governance_order_deadline_chain_ssot {
        return RatingReviewWindowResolution {
            effective_days: review_window_days_fallback,
            source: "p3_review_window_days",
            governance_order_deadline_chain_ssot: false,
            p3_review_window_days_config: review_window_days_fallback,
        };
    }

    #[cfg(test)]
    {
        if let Ok(g) = ORDER_DEADLINE_SSOT_REVIEW_DAYS_TEST_HOOK.lock() {
            if let Some(inner) = *g {
                return match inner {
                    Some(d) => RatingReviewWindowResolution {
                        effective_days: d,
                        source: "governance_ssot_chain_governor",
                        governance_order_deadline_chain_ssot: true,
                        p3_review_window_days_config: review_window_days_fallback,
                    },
                    None => RatingReviewWindowResolution {
                        effective_days: review_window_days_fallback,
                        source: "governance_ssot_fallback_p3",
                        governance_order_deadline_chain_ssot: true,
                        p3_review_window_days_config: review_window_days_fallback,
                    },
                };
            }
        }
    }
    if let Some(d) = chain_review_window_days {
        if (1..=3660).contains(&d) {
            return RatingReviewWindowResolution {
                effective_days: d,
                source: "governance_ssot_chain_governor",
                governance_order_deadline_chain_ssot: true,
                p3_review_window_days_config: review_window_days_fallback,
            };
        }
    }
    RatingReviewWindowResolution {
        effective_days: review_window_days_fallback,
        source: "governance_ssot_fallback_p3",
        governance_order_deadline_chain_ssot: true,
        p3_review_window_days_config: review_window_days_fallback,
    }
}

/// **`GOVERNANCE_ORDER_DEADLINE_CHAIN_SSOT`**：对 **`GOVERNOR_ADDRESS`** **`eth_call` `orderRatingReviewWindowDays()`**（与 **`rating_review_window_resolution_for_orders_api`** 同源）。
pub(crate) async fn rating_review_window_resolution_for_orders_api(
    chain_off_cfg: &super::ChainOffConfig,
    chain_config: Option<&crate::chain::ChainConfig>,
) -> RatingReviewWindowResolution {
    let chain_days = if chain_off_cfg.governance_order_deadline_chain_ssot {
        crate::chain::governor::fetch_governor_order_rating_review_window_days(chain_config).await
    } else {
        None
    };
    resolve_rating_review_window_for_deadlines(
        chain_off_cfg.review_window_days,
        chain_off_cfg.governance_order_deadline_chain_ssot,
        chain_days,
    )
}

/// 只读可观测块：**`payment_deadline` / `chat_confirm_deadline`** 不读此对象；仅说明 **`rating_deadline`** 窗口天数的 SSOT 路径。
pub(crate) fn deadline_rating_observability_value(
    res: &RatingReviewWindowResolution,
    chain_off_mounted: bool,
) -> JsonValue {
    json!({
        "anchor": "TT-B110-SEQ2-ORDERS-DEADLINE-SSOT-OBSERVE-001",
        "chain_off_mounted": chain_off_mounted,
        "review_window_days_effective": res.effective_days,
        "review_window_days_source": res.source,
        "governance_order_deadline_chain_ssot": res.governance_order_deadline_chain_ssot,
        "p3_review_window_days_config": res.p3_review_window_days_config,
        "rule": "Observability only; rating_deadline = completed_at + review_window_days_effective when state=completed; payment_deadline/chat_confirm_deadline ignore this block; governance_ssot_chain_governor = TravelTrustGovernor.orderRatingReviewWindowDays() eth_call when GOVERNANCE_ORDER_DEADLINE_CHAIN_SSOT",
    })
}

/// **`GET /meta`** 嵌套 **`reconcile_probe`**：比对 [`rating_review_window_resolution_for_orders_api`] 与独立 [`crate::chain::governor::probe_governor_order_rating_review_window_chain`]（**TT-B110-SEQ2-ORDERS-DEADLINE-RECONCILE-PROBE-001**）。
pub(crate) fn deadline_ssot_reconcile_pass(
    cfg: &super::ChainOffConfig,
    resolution: &RatingReviewWindowResolution,
    probe: &crate::chain::governor::GovernorRatingWindowProbe,
) -> bool {
    if !cfg.governance_order_deadline_chain_ssot {
        return resolution.source == "p3_review_window_days"
            && resolution.effective_days == cfg.review_window_days;
    }
    match probe.probe_leg {
        "eth_call_ok" => {
            let Some(d) = probe.chain_read_days else {
                return false;
            };
            resolution.source == "governance_ssot_chain_governor"
                && resolution.effective_days == d
        }
        "value_out_of_range"
        | "eth_call_failed"
        | "skipped_no_governor"
        | "skipped_rpc_unconfigured"
        | "skipped_no_chain_config" => {
            resolution.source == "governance_ssot_fallback_p3"
                && resolution.effective_days == cfg.review_window_days
        }
        _ => false,
    }
}

pub(crate) fn merge_deadline_reconcile_probe_into_observability(
    mut obs: JsonValue,
    cfg: &super::ChainOffConfig,
    resolution: &RatingReviewWindowResolution,
    probe: crate::chain::governor::GovernorRatingWindowProbe,
) -> JsonValue {
    let pass = deadline_ssot_reconcile_pass(cfg, resolution, &probe);
    let gov_probe = serde_json::to_value(&probe).unwrap_or_else(|_| json!({}));
    let reconcile = json!({
        "anchor": "TT-B110-SEQ2-ORDERS-DEADLINE-RECONCILE-PROBE-001",
        "pass": pass,
        "governor_probe": gov_probe,
        "resolution_review_window_days_source": resolution.source,
        "resolution_review_window_days_effective": resolution.effective_days,
        "rule": "Independent eth_call orderRatingReviewWindowDays() vs rating_review_window_resolution_for_orders_api; pass when source/effective matches probe_leg (governance_ssot_chain_governor + chain days, or governance_ssot_fallback_p3 / p3_review_window_days per GOVERNANCE_ORDER_DEADLINE_CHAIN_SSOT)."
    });
    if let Some(o) = obs.as_object_mut() {
        o.insert("reconcile_probe".to_string(), reconcile);
    }
    obs
}

/// **`GET /api/v1/admin/observability/overview`** · **`overview.orders_deadline_ssot_ops_check`**（**TT-B110-SEQ2-ORDERS-DEADLINE-OPS-CHECK-001**）：由 **`rating_review_window_resolution_for_orders_api`** / **`probe_governor_order_rating_review_window_chain`** / **`deadline_ssot_reconcile_pass`** 派生；**`exit_code_hint`** **0** = 健康，**1** = 须介入（与 **`overview.orders_deadline_ssot`** 提示字段同源，**不**改其键语义）。
pub(crate) fn orders_deadline_ssot_ops_check_value(
    chain_off_mounted: bool,
    cfg: &super::ChainOffConfig,
    resolution: &RatingReviewWindowResolution,
    probe: &crate::chain::governor::GovernorRatingWindowProbe,
) -> JsonValue {
    if !chain_off_mounted {
        return json!({
            "anchor": "TT-B110-SEQ2-ORDERS-DEADLINE-OPS-CHECK-001",
            "overall": "fail",
            "exit_code_hint": 1,
            "degraded": false,
            "checks": {
                "chain_off_mounted": {
                    "status": "fail",
                    "detail": "chain_off not mounted; orders deadline SSOT unavailable (GET /api/v1/orders* may 501)"
                },
                "governance_chain_read": { "status": "skipped", "detail": "chain_off_unmounted" },
                "fallback_path": { "status": "skipped", "detail": "chain_off_unmounted" },
                "reconcile_probe": { "status": "skipped", "detail": "chain_off_unmounted" }
            },
            "rule": "Ops gate: fail closed when chain_off unmounted; scripts may use exit_code_hint for non-zero exit."
        });
    }

    let reconcile_pass = deadline_ssot_reconcile_pass(cfg, resolution, probe);

    let known_probe_leg = matches!(
        probe.probe_leg,
        "eth_call_ok"
            | "value_out_of_range"
            | "eth_call_failed"
            | "skipped_no_governor"
            | "skipped_rpc_unconfigured"
            | "skipped_no_chain_config"
    );

    let governance_chain_read = if !cfg.governance_order_deadline_chain_ssot {
        json!({
            "status": "skipped",
            "detail": "governance_order_deadline_chain_ssot false; p3_review_window_days path only"
        })
    } else if !known_probe_leg {
        json!({
            "status": "fail",
            "detail": format!("unknown probe_leg={}", probe.probe_leg)
        })
    } else if probe.probe_leg == "eth_call_ok" {
        if reconcile_pass {
            json!({
                "status": "ok",
                "detail": "orderRatingReviewWindowDays eth_call_ok; resolution matches probe"
            })
        } else {
            json!({
                "status": "fail",
                "detail": "eth_call_ok but resolution/probe mismatch (see reconcile_probe)"
            })
        }
    } else if reconcile_pass {
        json!({
            "status": "degraded",
            "detail": format!(
                "probe_leg={}; using fail-closed p3 fallback while SSOT reconcile still passes",
                probe.probe_leg
            )
        })
    } else {
        json!({
            "status": "fail",
            "detail": format!(
                "probe_leg={}; resolution/probe mismatch (see reconcile_probe)",
                probe.probe_leg
            )
        })
    };

    let fallback_path = if !cfg.governance_order_deadline_chain_ssot {
        json!({
            "status": "skipped",
            "detail": "governance_order_deadline_chain_ssot false"
        })
    } else if probe.probe_leg == "eth_call_ok" {
        let ok = resolution.source == "governance_ssot_chain_governor"
            && probe
                .chain_read_days
                .is_some_and(|d| d == resolution.effective_days);
        if ok {
            json!({
                "status": "ok",
                "detail": "chain read ok; governance_ssot_chain_governor active"
            })
        } else {
            json!({
                "status": "fail",
                "detail": "eth_call_ok but resolution is not governance_ssot_chain_governor or days differ"
            })
        }
    } else if resolution.source == "governance_ssot_fallback_p3"
        && resolution.effective_days == cfg.review_window_days
    {
        json!({
            "status": "ok",
            "detail": "governance_ssot_fallback_p3 matches p3_review_window_days_config"
        })
    } else {
        json!({
            "status": "fail",
            "detail": "expected governance_ssot_fallback_p3 with p3_review_window_days_config when chain read did not yield ok"
        })
    };

    let reconcile_probe = if reconcile_pass {
        json!({ "status": "ok", "detail": "deadline_ssot_reconcile_pass true" })
    } else {
        json!({ "status": "fail", "detail": "deadline_ssot_reconcile_pass false" })
    };

    let chain_ok = chain_off_mounted;
    let degraded = cfg.governance_order_deadline_chain_ssot
        && probe.probe_leg != "eth_call_ok"
        && known_probe_leg
        && reconcile_pass;

    let checks_obj = json!({
        "chain_off_mounted": {
            "status": if chain_ok { "ok" } else { "fail" },
            "detail": "chain_off mounted for orders deadline SSOT"
        },
        "governance_chain_read": governance_chain_read,
        "fallback_path": fallback_path,
        "reconcile_probe": reconcile_probe
    });

    let any_fail = !chain_ok
        || !reconcile_pass
        || governance_chain_read["status"] == json!("fail")
        || fallback_path["status"] == json!("fail");

    let overall = if any_fail { "fail" } else { "ok" };
    let exit_code_hint = if overall == "ok" { 0 } else { 1 };

    json!({
        "anchor": "TT-B110-SEQ2-ORDERS-DEADLINE-OPS-CHECK-001",
        "overall": overall,
        "exit_code_hint": exit_code_hint,
        "degraded": degraded,
        "checks": checks_obj,
        "rule": "Unified ops gate: chain_off + governance_chain_read + fallback_path + reconcile_probe; exit_code_hint 1 => investigate (cron / jq scripts)."
    })
}

/// Admin 可观测：**`overview.orders_deadline_ssot`** + **`overview.orders_deadline_ssot_ops_check`** 单次 RPC（**TT-B110-SEQ2-ORDERS-DEADLINE-OPS-CHECK-001**）。
pub(crate) async fn orders_deadline_ssot_admin_overview_bundle(
    chain_off: Option<&ChainOffState>,
    chain_config: Option<&ChainConfig>,
) -> (JsonValue, JsonValue) {
    let Some(co) = chain_off else {
        let hint = json!({
            "anchor": "TT-B110-SEQ2-ORDERS-DEADLINE-ADMIN-DEBUG-HINT-001",
            "chain_off_mounted": false,
            "rule": "chain_off not mounted; orders deadline SSOT admin hint unavailable (GET /api/v1/orders* may 501)"
        });
        let dummy_cfg = super::ChainOffConfig::default();
        let dummy_res = RatingReviewWindowResolution {
            effective_days: dummy_cfg.review_window_days,
            source: "p3_review_window_days",
            governance_order_deadline_chain_ssot: false,
            p3_review_window_days_config: dummy_cfg.review_window_days,
        };
        let dummy_probe = crate::chain::governor::GovernorRatingWindowProbe {
            probe_leg: "skipped_no_chain_config",
            chain_read_days: None,
            eth_call_error: None,
        };
        let ops = orders_deadline_ssot_ops_check_value(false, &dummy_cfg, &dummy_res, &dummy_probe);
        return (hint, ops);
    };
    let res =
        rating_review_window_resolution_for_orders_api(&co.config, chain_config).await;
    let probe =
        crate::chain::governor::probe_governor_order_rating_review_window_chain(chain_config).await;
    let reconcile_probe_pass = deadline_ssot_reconcile_pass(&co.config, &res, &probe);
    let hint = json!({
        "anchor": "TT-B110-SEQ2-ORDERS-DEADLINE-ADMIN-DEBUG-HINT-001",
        "chain_off_mounted": true,
        "review_window_days_source": res.source,
        "review_window_days_effective": res.effective_days,
        "governance_order_deadline_chain_ssot": res.governance_order_deadline_chain_ssot,
        "p3_review_window_days_config": res.p3_review_window_days_config,
        "reconcile_probe_pass": reconcile_probe_pass,
        "reconcile_probe_leg": probe.probe_leg,
        "rule": "Admin read-only; same SSOT paths as GET /meta orders.deadline_rating_observability + reconcile pass vs probe_leg (TT-B110-SEQ2-ORDERS-DEADLINE-RECONCILE-PROBE-001)."
    });
    let ops = orders_deadline_ssot_ops_check_value(true, &co.config, &res, &probe);
    (hint, ops)
}

/// **`GET /api/v1/admin/observability/overview`** · **`overview.orders_deadline_ssot`**（**TT-B110-SEQ2-ORDERS-DEADLINE-ADMIN-DEBUG-HINT-001**）：与 **`rating_review_window_resolution_for_orders_api`** / **`reconcile_probe`** 同源，**不**改 **`GET /meta`** 与公开订单 JSON。
pub(crate) async fn orders_deadline_ssot_admin_overview_hint(
    chain_off: Option<&ChainOffState>,
    chain_config: Option<&ChainConfig>,
) -> JsonValue {
    orders_deadline_ssot_admin_overview_bundle(chain_off, chain_config)
        .await
        .0
}

/// **`deadline_as_of_utc`**：**TT-B110-SEQ2-ORDERS-DEADLINE-CLOCK-INJECT-001** 注入的「请求级」时钟快照；当前 **53-S12** 三键仍仅由行内 **`accepted_at` / `updated_at` / `completed_at`** 推导，**不**读 **`as_of`**，以便未来相对「现在」的 deadline 与单测固定时钟对齐。
fn order_deadline_triple_for_rating_window(
    o: &OrderRow,
    review_window_days: i64,
    _deadline_as_of_utc: DateTime<Utc>,
) -> (Option<String>, Option<String>, Option<String>) {
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
    (payment_deadline, chat_confirm_deadline, rating_deadline)
}

/// 53-S12：**`GET /api/v1/orders/:id`** 与 **`GET /api/v1/orders`** 列表项同源的可选 deadline（ISO8601）+ **TT-B110-SEQ2-ORDERS-DEADLINE-SSOT-OBSERVE-001** 可观测块。
fn compute_order_deadlines_with_rating_observability(
    o: &OrderRow,
    rating_resolution: &RatingReviewWindowResolution,
    chain_off_mounted: bool,
    deadline_as_of_utc: DateTime<Utc>,
) -> (
    (Option<String>, Option<String>, Option<String>),
    JsonValue,
) {
    let triple = order_deadline_triple_for_rating_window(
        o,
        rating_resolution.effective_days,
        deadline_as_of_utc,
    );
    let obs = deadline_rating_observability_value(rating_resolution, chain_off_mounted);
    (triple, obs)
}

/// 与 `GET /api/v1/orders/:id` 成功响应同形（含可选 `itinerary`）；**不做** tourist/guide 参与方校验（70：`GET /api/v1/admin/orders/:id`）。
pub fn order_detail_envelope(
    store: &ChainOffStore,
    o: &OrderRow,
    rating_resolution: &RatingReviewWindowResolution,
    chain_config: Option<&ChainConfig>,
    deadline_as_of_utc: DateTime<Utc>,
) -> JsonValue {
    let order_id = o.id;
    let ((payment_deadline, chat_confirm_deadline, rating_deadline), deadline_obs) =
        compute_order_deadlines_with_rating_observability(
            o,
            rating_resolution,
            true,
            deadline_as_of_utc,
        );

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
        "service_tourist_confirmed": o.service_tourist_confirmed,
        "service_guide_confirmed": o.service_guide_confirmed,
        "payment_deadline": payment_deadline,
        "chat_confirm_deadline": chat_confirm_deadline,
        "rating_deadline": rating_deadline,
        "deadline_rating_observability": deadline_obs
    });
    if let Some(ref kind) = o.order_kind {
        order_json["order_kind"] = json!(kind);
    }
    if let Some(listing_id) = o.market_listing_id {
        order_json["market_listing_id"] = json!(listing_id.to_string());
    }
    if let Some(cid) = o.chain_id {
        order_json["chain_id"] = json!(cid);
    }
    let mut resp = json!({ "status": "ok", "order": order_json });
    if let Some(bundle) = store.itineraries.get(&order_id) {
        // 与 order_list_item_json / 55-S12 / 53-S12 一致：详情 order 上补齐目的地、城市、天数、出行日，便于前端会话侧只读摘要（53-S7）与列表字段对齐
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

        // B-083 / TT-B083-FEE-ROUTE-COUNTRY-ORDER-META-SSOT-001：`itinerary.destination`（**`FEE_ROUTE_COUNTRY_SSOT_FIELD`**）→ **`resolve_fee_route_country_from_zh_destination`** → **`iso3166_alpha2` / `bucket_route_key`** 或显式 **reject**（与 **GET /meta** **`orders.fee_route_country_ssot`** 同源语义）。
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
    order_deadline_clock: &dyn OrderDeadlineClock,
    chain_config: Option<&ChainConfig>,
    order_id: Uuid,
    user_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let deadline_as_of_utc = order_deadline_clock.now_utc();
    let rating_resolution =
        rating_review_window_resolution_for_orders_api(&state.config, chain_config).await;
    let (mut body, order_state_str) = {
        let store = state.store.read().await;
        let o = store.orders.get(&order_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?;
        if !crate::chain_off::order_is_participant(&store, o, user_id) {
            return Err((
                StatusCode::FORBIDDEN,
                Json(crate::chain_off::order_participant_hints::order_forbidden_json(
                    &store, o,
                )),
            ));
        }
        if let Some(cfg) = chain_config {
            if order_chain_mismatch_for_public_read(o, cfg) {
                return Err((
                    StatusCode::NOT_FOUND,
                    Json(json!({"error": "order_not_found", "message": "order_not_found", "hint": "order_chain_mismatch"})),
                ));
            }
        }
        let order_state_str = order_state_to_str(o.state);
        let body = order_detail_envelope(
            &store,
            o,
            &rating_resolution,
            chain_config,
            deadline_as_of_utc,
        );
        (body, order_state_str)
    };

    match state.db_pool.as_ref() {
        None => {
            apply_orders_projection_fields_to_order_json(&mut body, &order_state_str, None, None);
        }
        Some(pool) => match db::fetch_orders_projection_terminal_by_order_uuid(pool, order_id).await {
            Ok(term) => {
                apply_orders_projection_fields_to_order_json(&mut body, &order_state_str, term.as_ref(), None);
            }
            Err(e) => {
                eprintln!(
                    "[audit] GET /orders/:id projection_terminal fetch failed order_id={} error={}",
                    order_id, e
                );
                apply_orders_projection_fields_to_order_json(
                    &mut body,
                    &order_state_str,
                    None,
                    Some(&e.to_string()),
                );
            }
        },
    }

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
    if !super::guides::guide_can_accept_orders(&guide.status) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(super::guides::guide_order_gate_err_key(
                &guide.status,
            ))),
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
    if let (Some(s), Some(e)) = (start_date, end_date) {
        match super::schedule_booking::guide_trip_range_conflicts(
            &store,
            body.guide_id,
            s,
            e,
            None,
        )
        .await
        {
            Ok(true) => {
                return Err((
                    StatusCode::CONFLICT,
                    Json(json!({
                        "error": "schedule_conflict",
                        "message": "schedule_conflict",
                        "hint": "所选出行日期与向导已占用档期冲突"
                    })),
                ));
            }
            Ok(false) => {}
            Err(_) => {}
        }
    }
    let id = Uuid::new_v4();
    let now = Utc::now();
    let tourist_email = store
        .users
        .get(&user_id)
        .map(|u| u.email.clone())
        .unwrap_or_default();
    let data_origin = super::infer_entity_data_origin_from_email(&tourist_email).to_string();
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
            service_tourist_confirmed: None,
            service_guide_confirmed: None,
        chain_id: state.config.business_chain_id,
        data_origin,
        order_kind: None,
        market_listing_id: None,
        ..Default::default()
    };
    store.orders.insert(id, order.clone());
    store.itineraries.insert(id, minimal_itinerary_bundle_for_simple_order(&order));
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
                store.itineraries.remove(&id);
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
        let accepted_bilateral_confirmed = order.state == OrderState::Accepted
            && order.sub_status.as_deref() == Some("confirmed")
            && order.tourist_confirmed == Some(true)
            && order.guide_confirmed == Some(true);
        if order.state != OrderState::Draft && !accepted_bilateral_confirmed {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(
                    json!({"error": "order_not_draft", "message": "order_not_draft", "hint": "仅 Draft 订单可确认最终版本；或 Accepted 且双方已完成双边确认（sub_status=confirmed）"}),
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
    let publish_on_save = order.state == OrderState::Draft && order.guide_id.is_nil();
    let order_state_before = order.state;
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
    let mut published_to_market = false;
    let mut order_state_str = order_state_to_str(order_state_before);
    if publish_on_save {
        let mut store = state.store.write().await;
        if let Some(ord) = store.orders.get_mut(&order_id) {
            if ord.state == OrderState::Draft && ord.guide_id.is_nil() {
                ord.state = OrderState::Created;
                ord.updated_at = Utc::now();
                published_to_market = true;
                order_state_str = order_state_to_str(ord.state);
                let ord_clone = ord.clone();
                drop(store);
                persist_order_if_db(&state, &ord_clone).await;
            }
        }
    } else {
        let store = state.store.read().await;
        if let Some(ord) = store.orders.get(&order_id) {
            order_state_str = order_state_to_str(ord.state);
        }
    }
    audit_key_write_stderr("patch_order_itinerary", request_id, user_id, order_id);
    Ok(Json(json!({
        "status": "ok",
        "order_id": order_id.to_string(),
        "version": version,
        "published_to_market": published_to_market,
        "order_state": order_state_str
    })))
}

#[derive(Debug, Deserialize)]
pub struct PatchOrderGuideBody {
    pub guide_id: String,
}

#[derive(Debug, Deserialize)]
pub struct PatchOrderTripDatesBody {
    pub start_date: String,
    pub end_date: String,
}

/// PATCH /api/v1/orders/:id/trip-dates — 改期（Created/Accepted · 未 Escrowed；04 §3.4 改期=同单更新档期，Escrow 后须新单）
pub async fn patch_order_trip_dates_impl(
    state: ChainOffState,
    request_id: Option<&str>,
    order_id: Uuid,
    user_id: Uuid,
    Json(body): Json<PatchOrderTripDatesBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let (start_date, end_date) =
        parse_optional_date_range(Some(&body.start_date), Some(&body.end_date));
    let (Some(s), Some(e)) = (start_date, end_date) else {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid_date_range",
                "message": "invalid_date_range"
            })),
        ));
    };

    let mut store = state.store.write().await;
    let order_before = store
        .orders
        .get(&order_id)
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?
        .clone();

    if !super::order_is_participant(&store, &order_before, user_id) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "forbidden", "message": "forbidden"})),
        ));
    }
    if order_before.state != OrderState::Created && order_before.state != OrderState::Accepted {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "order_not_editable",
                "message": "order_not_editable",
                "hint": "仅 Created/Accepted 可改期；Escrow 后请取消并新建订单"
            })),
        ));
    }

    let guide_id = order_before.guide_id;
    if super::schedule_booking::guide_trip_range_conflicts(&store, guide_id, s, e, Some(order_id))
        .await
        .unwrap_or(false)
    {
        return Err((
            StatusCode::CONFLICT,
            Json(json!({
                "error": "schedule_conflict",
                "message": "schedule_conflict"
            })),
        ));
    }

    let order = store.orders.get_mut(&order_id).expect("order exists");
    order.start_date = Some(s);
    order.end_date = Some(e);
    order.updated_at = Utc::now();
    let order_clone = order.clone();
    drop(store);

    if state.db_pool.is_some() {
        persist_order_if_db(&state, &order_clone).await;
    }
    audit_key_write_stderr("patch_order_trip_dates", request_id, user_id, order_id);
    Ok(Json(json!({
        "status": "ok",
        "order": {
            "id": order_id.to_string(),
            "start_date": s.format("%Y-%m-%d").to_string(),
            "end_date": e.format("%Y-%m-%d").to_string()
        }
    })))
}

/// PATCH /api/v1/orders/:id/guide — 草稿/已发布订单选定向导或更换向导（04 §3.4；
/// tourist · 未 Escrowed/终态 · 未 confirm-final-plan · 同向导幂等 OK）
pub async fn patch_order_guide_impl(
    state: ChainOffState,
    request_id: Option<&str>,
    order_id: Uuid,
    user_id: Uuid,
    Json(body): Json<PatchOrderGuideBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let guide_id = Uuid::parse_str(body.guide_id.trim()).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_guide_id", "message": "invalid_guide_id"})),
        )
    })?;

    let mut store = state.store.write().await;
    let order = store
        .orders
        .get(&order_id)
        .ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?
        .clone();

    if order.tourist_id != user_id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "forbidden", "message": "forbidden"})),
        ));
    }
    if let Some(err_key) = crate::chain_off::me::tourist_order_trust_gate(&store, user_id) {
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
            Json(json!({"error": "order_not_editable", "message": "order_not_editable"})),
        ));
    }
    if let Some(bundle) = store.itineraries.get(&order_id) {
        if bundle.snapshot_hash.is_some() {
            return Err((
                StatusCode::CONFLICT,
                Json(json!({
                    "error": "itinerary_already_confirmed",
                    "message": "itinerary_already_confirmed"
                })),
            ));
        }
    }
    if !order.guide_id.is_nil() && order.guide_id == guide_id {
        drop(store);
        return Ok(Json(json!({
            "status": "ok",
            "order_id": order_id.to_string(),
            "guide_id": guide_id.to_string()
        })));
    }
    let guide = store.guides.get(&guide_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(crate::api_json::err_key("guide_not_found")),
    ))?;
    if !super::guides::guide_can_accept_orders(&guide.status) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key(super::guides::guide_order_gate_err_key(
                &guide.status,
            ))),
        ));
    }
    if let Some(occupied_order) = store.guide_slot.get(&guide_id) {
        if *occupied_order != order_id {
            return Err((
                StatusCode::CONFLICT,
                Json(json!({"error": "guide_has_active_order", "message": "guide_has_active_order"})),
            ));
        }
    }

    let previous_guide = order.guide_id;
    if !previous_guide.is_nil()
        && previous_guide != guide_id
        && store.guide_slot.get(&previous_guide) == Some(&order_id)
    {
        store.guide_slot.remove(&previous_guide);
    }
    let order = store.orders.get_mut(&order_id).expect("order exists");
    order.guide_id = guide_id;
    order.updated_at = Utc::now();
    let order_clone = order.clone();
    drop(store);

    if state.db_pool.is_some() {
        persist_order_if_db(&state, &order_clone).await;
    }
    audit_key_write_stderr("patch_order_guide", request_id, user_id, order_id);
    Ok(Json(json!({
        "status": "ok",
        "order_id": order_id.to_string(),
        "guide_id": guide_id.to_string()
    })))
}

#[cfg(test)]
mod orders_list_hat_tests {
    use super::*;
    use chrono::Utc;
    use traveltrust_core::OrderState;

    fn sample_order(tourist_id: Uuid, guide_id: Uuid) -> OrderRow {
        let now = Utc::now();
        OrderRow {
            id: Uuid::new_v4(),
            tourist_id,
            guide_id,
            amount: "1".into(),
            currency: "USD".into(),
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
            service_tourist_confirmed: None,
            service_guide_confirmed: None,
            chain_id: None,
            data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
        }
    }

    #[test]
    fn order_matches_orders_list_hat_guide_uses_guides_by_user_row_id() {
        let user_id = Uuid::new_v4();
        let guide_row_id = Uuid::new_v4();
        let other_guide = Uuid::new_v4();
        let mut store = ChainOffStore::default();
        store.guides_by_user.insert(user_id, guide_row_id);
        let reception = sample_order(Uuid::new_v4(), guide_row_id);
        let tourist_side = sample_order(user_id, other_guide);
        assert!(order_matches_orders_list_hat(
            &store,
            &reception,
            user_id,
            Some(OrdersListHat::Guide),
        ));
        assert!(!order_matches_orders_list_hat(
            &store,
            &tourist_side,
            user_id,
            Some(OrdersListHat::Guide),
        ));
    }

    #[test]
    fn parse_orders_list_hat_rejects_unknown() {
        assert_eq!(parse_orders_list_hat(None).unwrap(), None);
        assert_eq!(
            parse_orders_list_hat(Some("guide")).unwrap(),
            Some(OrdersListHat::Guide)
        );
        assert_eq!(
            parse_orders_list_hat(Some("merchant")).unwrap(),
            Some(OrdersListHat::Merchant)
        );
        assert!(parse_orders_list_hat(Some("invalid")).is_err());
    }

    #[test]
    fn order_matches_orders_list_hat_merchant_uses_seller_user_id() {
        let merchant_user_id = Uuid::new_v4();
        let buyer_id = Uuid::new_v4();
        let guide_row_id = Uuid::new_v4();
        let other_merchant = Uuid::new_v4();
        let mut store = ChainOffStore::default();
        store.guides.insert(
            guide_row_id,
            super::super::GuideRow {
                id: guide_row_id,
                user_id: merchant_user_id,
                city: "杭州".into(),
                country_code: "CN".into(),
                languages: vec![],
                service_types: vec![],
                bio: None,
                wallet_address: None,
                real_name: None,
                passport_number_hash: None,
                id_photo_url: None,
                language_cert_url: None,
                guide_license_url: None,
                stake_amount: "0".into(),
                hourly_rate: None,
                avatar_url: None,
                public_title: None,
                status: "active".into(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
                data_origin: "production".into(),
            },
        );
        let mut seller_order = sample_order(buyer_id, guide_row_id);
        seller_order.order_kind = Some("merchant_listing".into());
        let mut other_order = sample_order(buyer_id, Uuid::new_v4());
        other_order.order_kind = Some("merchant_listing".into());
        store.guides.insert(
            other_order.guide_id,
            super::super::GuideRow {
                id: other_order.guide_id,
                user_id: other_merchant,
                city: "上海".into(),
                country_code: "CN".into(),
                languages: vec![],
                service_types: vec![],
                bio: None,
                wallet_address: None,
                real_name: None,
                passport_number_hash: None,
                id_photo_url: None,
                language_cert_url: None,
                guide_license_url: None,
                stake_amount: "0".into(),
                hourly_rate: None,
                avatar_url: None,
                public_title: None,
                status: "active".into(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
                data_origin: "production".into(),
            },
        );
        assert!(order_matches_orders_list_hat(
            &store,
            &seller_order,
            merchant_user_id,
            Some(OrdersListHat::Merchant),
        ));
        assert!(!order_matches_orders_list_hat(
            &store,
            &other_order,
            merchant_user_id,
            Some(OrdersListHat::Merchant),
        ));
    }
}

#[cfg(test)]
mod patch_order_guide_tests {
    use super::*;
    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, GuideRow};
    use axum::Json;
    use chrono::Utc;
    use std::sync::Arc;
    use tokio::sync::RwLock;
    use traveltrust_core::OrderState;
    use uuid::Uuid;

    fn sample_guide_row(id: Uuid) -> GuideRow {
        let now = Utc::now();
        GuideRow {
            id,
            user_id: Uuid::new_v4(),
            city: "杭州市".to_string(),
            country_code: "CN".to_string(),
            languages: vec!["zh".to_string()],
            service_types: vec!["walking".to_string()],
            bio: None,
            wallet_address: None,
            real_name: None,
            passport_number_hash: None,
            id_photo_url: None,
            language_cert_url: None,
            guide_license_url: None,
            stake_amount: "0".to_string(),
            hourly_rate: None,
            avatar_url: None,
            public_title: None,
            status: "active".to_string(),
            rejection_codes: vec![],
            rejection_message: None,
            created_at: now,
            updated_at: now,
            data_origin: "production".into(),
        }
    }

    fn sample_created_order(order_id: Uuid, tourist_id: Uuid, guide_id: Uuid) -> OrderRow {
        let now = Utc::now();
        OrderRow {
            id: order_id,
            tourist_id,
            guide_id,
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
            service_tourist_confirmed: None,
            service_guide_confirmed: None,
            chain_id: None,
            data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
        }
    }

    #[tokio::test]
    async fn patch_order_guide_reassigns_when_order_already_has_guide() {
        let tourist_id = Uuid::new_v4();
        let order_id = Uuid::new_v4();
        let guide_a = Uuid::new_v4();
        let guide_b = Uuid::new_v4();
        let mut store = ChainOffStore::default();
        store.guides.insert(guide_a, sample_guide_row(guide_a));
        store.guides.insert(guide_b, sample_guide_row(guide_b));
        store.orders.insert(
            order_id,
            sample_created_order(order_id, tourist_id, guide_a),
        );
        let state = ChainOffState {
            store: Arc::new(RwLock::new(store)),
            config: ChainOffConfig::default(),
            db_pool: None,
        };
        let res = patch_order_guide_impl(
            state.clone(),
            None,
            order_id,
            tourist_id,
            Json(PatchOrderGuideBody {
                guide_id: guide_b.to_string(),
            }),
        )
        .await;
        assert!(res.is_ok(), "reassign should succeed");
        let store = state.store.read().await;
        assert_eq!(store.orders.get(&order_id).unwrap().guide_id, guide_b);
    }

    #[tokio::test]
    async fn patch_order_guide_idempotent_same_guide() {
        let tourist_id = Uuid::new_v4();
        let order_id = Uuid::new_v4();
        let guide_id = Uuid::new_v4();
        let mut store = ChainOffStore::default();
        store.guides.insert(guide_id, sample_guide_row(guide_id));
        store.orders.insert(
            order_id,
            sample_created_order(order_id, tourist_id, guide_id),
        );
        let state = ChainOffState {
            store: Arc::new(RwLock::new(store)),
            config: ChainOffConfig::default(),
            db_pool: None,
        };
        let res = patch_order_guide_impl(
            state.clone(),
            None,
            order_id,
            tourist_id,
            Json(PatchOrderGuideBody {
                guide_id: guide_id.to_string(),
            }),
        )
        .await;
        assert!(res.is_ok(), "same guide should be idempotent");
    }
}

#[cfg(test)]
mod traveler_id_alias_tests {
    use super::*;
    use crate::chain_off::{ChainOffStore, GuideRow, UserRow};
    use chrono::{Duration, TimeZone, Utc};
    use serde_json::json;
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
            service_tourist_confirmed: None,
            service_guide_confirmed: None,
            chain_id: None,
            data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
        }
    }

    #[test]
    fn order_list_item_includes_traveler_id_mirror() {
        let tid = Uuid::new_v4();
        let o = sample_order(tid);
        let store = ChainOffStore::default();
        let as_of = Utc::now();
        let r = super::resolve_rating_review_window_for_deadlines(14, false, None);
        let j = order_list_item_json(&store, &o, &r, as_of);
        assert_eq!(j["tourist_id"].as_str().unwrap(), tid.to_string());
        assert_eq!(j["traveler_id"].as_str().unwrap(), tid.to_string());
    }

    #[test]
    fn order_list_item_includes_traveler_nickname_and_sub_status() {
        let tid = Uuid::new_v4();
        let mut o = sample_order(tid);
        o.sub_status = Some("pending_bilateral".into());
        let mut store = ChainOffStore::default();
        store.users.insert(
            tid,
            UserRow {
                id: tid,
                email: "tourist@test.com".into(),
                password_hash: None,
                role: "tourist".into(),
                kyc_status: "none".into(),
                nickname: Some("测试游客".into()),
                avatar_url: None,
                default_wallet_address: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
        );
        let as_of = Utc::now();
        let r = super::resolve_rating_review_window_for_deadlines(14, false, None);
        let j = order_list_item_json(&store, &o, &r, as_of);
        assert_eq!(j["sub_status"].as_str().unwrap(), "pending_bilateral");
        assert_eq!(j["traveler_nickname"].as_str().unwrap(), "测试游客");
    }

    #[test]
    fn orders_list_item_deadlines_match_order_detail_envelope() {
        let tid = Uuid::new_v4();
        let mut o = sample_order(tid);
        let rw = 21i64;
        o.state = OrderState::Completed;
        o.completed_at = Some(Utc::now() - Duration::hours(5));
        o.tourist_confirmed = Some(true);
        o.guide_confirmed = Some(true);
        o.updated_at = Utc::now();

        let store = ChainOffStore::default();
        let as_of = Utc::now();
        let r = super::resolve_rating_review_window_for_deadlines(rw, false, None);
        let item = order_list_item_json(&store, &o, &r, as_of);
        let env = order_detail_envelope(&store, &o, &r, None, as_of);
        for key in ["payment_deadline", "chat_confirm_deadline", "rating_deadline"] {
            assert_eq!(item[key], env["order"][key], "deadline mismatch: {key}");
        }
        assert_eq!(
            item["deadline_rating_observability"],
            env["order"]["deadline_rating_observability"]
        );
    }

    #[test]
    fn tt_b110_resolve_chain_read_success_without_test_hook() {
        let _serial = super::ORDER_DEADLINE_SSOT_HOOK_TEST_MUTEX.lock().unwrap();
        super::order_deadline_ssot_test_hook_reset();
        let r = super::resolve_rating_review_window_for_deadlines(10, true, Some(55));
        assert_eq!(r.effective_days, 55);
        assert_eq!(r.source, "governance_ssot_chain_governor");
    }

    #[test]
    fn tt_b110_resolve_chain_invalid_days_fail_closed_to_p3() {
        let _serial = super::ORDER_DEADLINE_SSOT_HOOK_TEST_MUTEX.lock().unwrap();
        super::order_deadline_ssot_test_hook_reset();
        let r = super::resolve_rating_review_window_for_deadlines(10, true, Some(10_000));
        assert_eq!(r.effective_days, 10);
        assert_eq!(r.source, "governance_ssot_fallback_p3");
    }

    #[test]
    fn tt_b110_resolve_chain_none_fail_closed_to_p3() {
        let _serial = super::ORDER_DEADLINE_SSOT_HOOK_TEST_MUTEX.lock().unwrap();
        super::order_deadline_ssot_test_hook_reset();
        let r = super::resolve_rating_review_window_for_deadlines(21, true, None);
        assert_eq!(r.effective_days, 21);
        assert_eq!(r.source, "governance_ssot_fallback_p3");
    }

    #[tokio::test]
    async fn orders_deadline_ssot_admin_hint_when_chain_off_unmounted() {
        let (hint, ops) = super::orders_deadline_ssot_admin_overview_bundle(None, None).await;
        assert_eq!(
            hint["anchor"].as_str(),
            Some("TT-B110-SEQ2-ORDERS-DEADLINE-ADMIN-DEBUG-HINT-001")
        );
        assert_eq!(hint["chain_off_mounted"], json!(false));
        assert_eq!(
            ops["anchor"].as_str(),
            Some("TT-B110-SEQ2-ORDERS-DEADLINE-OPS-CHECK-001")
        );
        assert_eq!(ops["overall"], "fail");
        assert_eq!(ops["exit_code_hint"], json!(1));
    }

    #[test]
    fn tt_b110_reconcile_pass_ssot_off_ignores_probe_leg() {
        let mut cfg = crate::chain_off::ChainOffConfig::default();
        cfg.review_window_days = 14;
        cfg.governance_order_deadline_chain_ssot = false;
        let res = super::RatingReviewWindowResolution {
            effective_days: 14,
            source: "p3_review_window_days",
            governance_order_deadline_chain_ssot: false,
            p3_review_window_days_config: 14,
        };
        let probe_ok = crate::chain::governor::GovernorRatingWindowProbe {
            probe_leg: "eth_call_ok",
            chain_read_days: Some(99),
            eth_call_error: None,
        };
        assert!(super::deadline_ssot_reconcile_pass(&cfg, &res, &probe_ok));
        let bad = super::RatingReviewWindowResolution {
            effective_days: 14,
            source: "governance_ssot_chain_governor",
            governance_order_deadline_chain_ssot: false,
            p3_review_window_days_config: 14,
        };
        assert!(!super::deadline_ssot_reconcile_pass(&cfg, &bad, &probe_ok));
    }

    #[test]
    fn tt_b110_reconcile_pass_ssot_on_eth_ok_mismatch_fails() {
        let mut cfg = crate::chain_off::ChainOffConfig::default();
        cfg.review_window_days = 7;
        cfg.governance_order_deadline_chain_ssot = true;
        let res = super::RatingReviewWindowResolution {
            effective_days: 7,
            source: "governance_ssot_fallback_p3",
            governance_order_deadline_chain_ssot: true,
            p3_review_window_days_config: 7,
        };
        let probe = crate::chain::governor::GovernorRatingWindowProbe {
            probe_leg: "eth_call_ok",
            chain_read_days: Some(42),
            eth_call_error: None,
        };
        assert!(!super::deadline_ssot_reconcile_pass(&cfg, &res, &probe));
    }

    #[test]
    fn tt_b110_orders_deadline_ssot_ops_check_chain_read_success() {
        let mut cfg = crate::chain_off::ChainOffConfig::default();
        cfg.review_window_days = 7;
        cfg.governance_order_deadline_chain_ssot = true;
        let res = super::RatingReviewWindowResolution {
            effective_days: 42,
            source: "governance_ssot_chain_governor",
            governance_order_deadline_chain_ssot: true,
            p3_review_window_days_config: 7,
        };
        let probe = crate::chain::governor::GovernorRatingWindowProbe {
            probe_leg: "eth_call_ok",
            chain_read_days: Some(42),
            eth_call_error: None,
        };
        let v = super::orders_deadline_ssot_ops_check_value(true, &cfg, &res, &probe);
        assert_eq!(v["overall"], "ok");
        assert_eq!(v["exit_code_hint"], json!(0));
        assert_eq!(v["degraded"], json!(false));
        assert_eq!(v["checks"]["governance_chain_read"]["status"], "ok");
        assert_eq!(v["checks"]["fallback_path"]["status"], "ok");
        assert_eq!(v["checks"]["reconcile_probe"]["status"], "ok");
    }

    #[test]
    fn tt_b110_orders_deadline_ssot_ops_check_eth_call_failed_fallback_ok() {
        let mut cfg = crate::chain_off::ChainOffConfig::default();
        cfg.review_window_days = 11;
        cfg.governance_order_deadline_chain_ssot = true;
        let res = super::RatingReviewWindowResolution {
            effective_days: 11,
            source: "governance_ssot_fallback_p3",
            governance_order_deadline_chain_ssot: true,
            p3_review_window_days_config: 11,
        };
        let probe = crate::chain::governor::GovernorRatingWindowProbe {
            probe_leg: "eth_call_failed",
            chain_read_days: None,
            eth_call_error: Some("rpc".to_string()),
        };
        let v = super::orders_deadline_ssot_ops_check_value(true, &cfg, &res, &probe);
        assert_eq!(v["overall"], "ok");
        assert_eq!(v["exit_code_hint"], json!(0));
        assert_eq!(v["degraded"], json!(true));
        assert_eq!(v["checks"]["governance_chain_read"]["status"], "degraded");
        assert_eq!(v["checks"]["fallback_path"]["status"], "ok");
        assert_eq!(v["checks"]["reconcile_probe"]["status"], "ok");
    }

    #[test]
    fn tt_b110_orders_deadline_ssot_ops_check_reconcile_mismatch_exit_nonzero() {
        let mut cfg = crate::chain_off::ChainOffConfig::default();
        cfg.review_window_days = 7;
        cfg.governance_order_deadline_chain_ssot = true;
        let res = super::RatingReviewWindowResolution {
            effective_days: 7,
            source: "governance_ssot_fallback_p3",
            governance_order_deadline_chain_ssot: true,
            p3_review_window_days_config: 7,
        };
        let probe = crate::chain::governor::GovernorRatingWindowProbe {
            probe_leg: "eth_call_ok",
            chain_read_days: Some(42),
            eth_call_error: None,
        };
        let v = super::orders_deadline_ssot_ops_check_value(true, &cfg, &res, &probe);
        assert_eq!(v["overall"], "fail");
        assert_eq!(v["exit_code_hint"], json!(1));
        assert_eq!(v["checks"]["reconcile_probe"]["status"], "fail");
    }

    #[tokio::test]
    async fn tt_b110_reconcile_probe_end_to_end_chain_read_matches_resolution() {
        use tokio::io::AsyncWriteExt;
        use tokio::net::TcpListener;

        let _serial = super::ORDER_DEADLINE_SSOT_HOOK_TEST_MUTEX.lock().unwrap();
        let _hook = push_ssot_review_days_hook(None);

        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();
        tokio::spawn(async move {
            for _ in 0..2 {
                let (mut socket, _) = listener.accept().await.unwrap();
                let _ = crate::jsonrpc_mock_server::read_http_request_headers_and_body(&mut socket)
                    .await;
                let result =
                    "0x000000000000000000000000000000000000000000000000000000000000002a";
                let payload = serde_json::json!({"jsonrpc":"2.0","id":1,"result":result});
                let payload = serde_json::to_vec(&payload).unwrap();
                let hdr = format!(
                    "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\nContent-Type: application/json\r\n\r\n",
                    payload.len()
                );
                let _ = socket.write_all(hdr.as_bytes()).await;
                let _ = socket.write_all(&payload).await;
            }
        });
        tokio::task::yield_now().await;

        let mut co_cfg = crate::chain_off::ChainOffConfig::default();
        co_cfg.governance_order_deadline_chain_ssot = true;
        co_cfg.review_window_days = 7;

        let chain = crate::chain::ChainConfig {
            rpc_url: format!("http://127.0.0.1:{port}"),
            chain_id: 1,
            escrow_factory_address: None,
            fee_router_address: None,
            region_vault_address: None,
            country_pool_ledger_address: None,
        unallocated_steward_path_vault_address: None,
            investor_share_token_addresses: vec![],
            staking_address: None,
            guide_staking_address: None,
            staking_provider_address: None,
            investor_lock_contract_addresses: vec![],
            governor_address: Some("0x0000000000000000000000000000000000000001".to_string()),
            governance_timelock_address: None,
            governance_votes_token_address: None,
            treasury_address: None,
            registry_address: None,
            executor_max_amount_per_tx: None,
            executor_max_amount_per_day: None,
            executor_retry_count: 3,
        };

        let res =
            super::rating_review_window_resolution_for_orders_api(&co_cfg, Some(&chain)).await;
        let probe =
            crate::chain::governor::probe_governor_order_rating_review_window_chain(Some(&chain))
                .await;
        assert_eq!(res.source, "governance_ssot_chain_governor");
        assert_eq!(res.effective_days, 42);
        assert!(super::deadline_ssot_reconcile_pass(&co_cfg, &res, &probe));
    }

    #[tokio::test]
    async fn tt_b110_reconcile_probe_end_to_end_rpc_error_fallback_matches_resolution() {
        use tokio::io::AsyncWriteExt;
        use tokio::net::TcpListener;

        let _serial = super::ORDER_DEADLINE_SSOT_HOOK_TEST_MUTEX.lock().unwrap();
        let _hook = push_ssot_review_days_hook(None);

        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let port = listener.local_addr().unwrap().port();
        tokio::spawn(async move {
            for _ in 0..2 {
                let (mut socket, _) = listener.accept().await.unwrap();
                let _ = crate::jsonrpc_mock_server::read_http_request_headers_and_body(&mut socket)
                    .await;
                let payload = serde_json::json!({"jsonrpc":"2.0","id":1,"error":{"code":3,"message":"execution reverted"}});
                let payload = serde_json::to_vec(&payload).unwrap();
                let hdr = format!(
                    "HTTP/1.1 200 OK\r\nContent-Length: {}\r\nConnection: close\r\nContent-Type: application/json\r\n\r\n",
                    payload.len()
                );
                let _ = socket.write_all(hdr.as_bytes()).await;
                let _ = socket.write_all(&payload).await;
            }
        });
        tokio::task::yield_now().await;

        let mut co_cfg = crate::chain_off::ChainOffConfig::default();
        co_cfg.governance_order_deadline_chain_ssot = true;
        co_cfg.review_window_days = 11;

        let chain = crate::chain::ChainConfig {
            rpc_url: format!("http://127.0.0.1:{port}"),
            chain_id: 1,
            escrow_factory_address: None,
            fee_router_address: None,
            region_vault_address: None,
            country_pool_ledger_address: None,
        unallocated_steward_path_vault_address: None,
            investor_share_token_addresses: vec![],
            staking_address: None,
            guide_staking_address: None,
            staking_provider_address: None,
            investor_lock_contract_addresses: vec![],
            governor_address: Some("0x0000000000000000000000000000000000000001".to_string()),
            governance_timelock_address: None,
            governance_votes_token_address: None,
            treasury_address: None,
            registry_address: None,
            executor_max_amount_per_tx: None,
            executor_max_amount_per_day: None,
            executor_retry_count: 3,
        };

        let res =
            super::rating_review_window_resolution_for_orders_api(&co_cfg, Some(&chain)).await;
        let probe =
            crate::chain::governor::probe_governor_order_rating_review_window_chain(Some(&chain))
                .await;
        assert_eq!(res.source, "governance_ssot_fallback_p3");
        assert_eq!(res.effective_days, 11);
        assert_eq!(probe.probe_leg, "eth_call_failed");
        assert!(super::deadline_ssot_reconcile_pass(&co_cfg, &res, &probe));
    }

    struct SsotReviewDaysHookRestore(Option<Option<i64>>);

    impl Drop for SsotReviewDaysHookRestore {
        fn drop(&mut self) {
            *super::ORDER_DEADLINE_SSOT_REVIEW_DAYS_TEST_HOOK.lock().unwrap() = self.0;
        }
    }

    fn push_ssot_review_days_hook(v: Option<Option<i64>>) -> SsotReviewDaysHookRestore {
        let mut g = super::ORDER_DEADLINE_SSOT_REVIEW_DAYS_TEST_HOOK.lock().unwrap();
        let prev = *g;
        *g = v;
        SsotReviewDaysHookRestore(prev)
    }

    #[test]
    fn order_deadline_chain_ssot_off_ignores_placeholder_days() {
        let _serial = super::ORDER_DEADLINE_SSOT_HOOK_TEST_MUTEX.lock().unwrap();
        let _g = push_ssot_review_days_hook(Some(Some(99)));
        let tid = Uuid::new_v4();
        let mut o = sample_order(tid);
        let completed = Utc::now() - Duration::hours(1);
        o.state = OrderState::Completed;
        o.completed_at = Some(completed);
        let fallback = 10i64;
        let as_of = Utc::now();
        let res = super::resolve_rating_review_window_for_deadlines(fallback, false, None);
        let ((_, _, r), obs) =
            super::compute_order_deadlines_with_rating_observability(&o, &res, true, as_of);
        let expected = (completed + Duration::days(fallback)).to_rfc3339();
        assert_eq!(r.as_deref(), Some(expected.as_str()));
        assert_eq!(obs["review_window_days_source"].as_str(), Some("p3_review_window_days"));
    }

    #[test]
    fn order_deadline_chain_ssot_on_uses_placeholder_when_set() {
        let _serial = super::ORDER_DEADLINE_SSOT_HOOK_TEST_MUTEX.lock().unwrap();
        let _g = push_ssot_review_days_hook(Some(Some(99)));
        let tid = Uuid::new_v4();
        let mut o = sample_order(tid);
        let completed = Utc::now() - Duration::hours(1);
        o.state = OrderState::Completed;
        o.completed_at = Some(completed);
        let fallback = 10i64;
        let as_of = Utc::now();
        let res = super::resolve_rating_review_window_for_deadlines(fallback, true, None);
        let ((_, _, r), obs) =
            super::compute_order_deadlines_with_rating_observability(&o, &res, true, as_of);
        let expected = (completed + Duration::days(99)).to_rfc3339();
        assert_eq!(r.as_deref(), Some(expected.as_str()));
        assert_eq!(
            obs["review_window_days_source"].as_str(),
            Some("governance_ssot_chain_governor")
        );
    }

    #[test]
    fn order_deadline_chain_ssot_on_falls_back_when_placeholder_absent() {
        let _serial = super::ORDER_DEADLINE_SSOT_HOOK_TEST_MUTEX.lock().unwrap();
        let _g = push_ssot_review_days_hook(Some(None));
        let tid = Uuid::new_v4();
        let mut o = sample_order(tid);
        let completed = Utc::now() - Duration::hours(1);
        o.state = OrderState::Completed;
        o.completed_at = Some(completed);
        let fallback = 21i64;
        let as_of = Utc::now();
        let res = super::resolve_rating_review_window_for_deadlines(fallback, true, None);
        let ((_, _, r), obs) =
            super::compute_order_deadlines_with_rating_observability(&o, &res, true, as_of);
        let expected = (completed + Duration::days(fallback)).to_rfc3339();
        assert_eq!(r.as_deref(), Some(expected.as_str()));
        assert_eq!(
            obs["review_window_days_source"].as_str(),
            Some("governance_ssot_fallback_p3")
        );
    }

    #[test]
    fn orders_list_item_deadlines_match_detail_under_chain_ssot() {
        let _serial = super::ORDER_DEADLINE_SSOT_HOOK_TEST_MUTEX.lock().unwrap();
        let _g = push_ssot_review_days_hook(Some(Some(40)));
        let tid = Uuid::new_v4();
        let mut o = sample_order(tid);
        let rw = 11i64;
        o.state = OrderState::Completed;
        o.completed_at = Some(Utc::now() - Duration::hours(2));
        o.tourist_confirmed = Some(true);
        o.guide_confirmed = Some(true);
        o.updated_at = Utc::now();
        let store = ChainOffStore::default();
        let as_of = Utc::now();
        let r = super::resolve_rating_review_window_for_deadlines(rw, true, None);
        let item = order_list_item_json(&store, &o, &r, as_of);
        let env = order_detail_envelope(&store, &o, &r, None, as_of);
        for key in ["payment_deadline", "chat_confirm_deadline", "rating_deadline"] {
            assert_eq!(item[key], env["order"][key], "deadline mismatch: {key}");
        }
        assert_eq!(
            item["deadline_rating_observability"],
            env["order"]["deadline_rating_observability"]
        );
        assert_eq!(
            env["order"]["deadline_rating_observability"]["review_window_days_source"]
                .as_str(),
            Some("governance_ssot_chain_governor")
        );
        assert_eq!(
            env["order"]["deadline_rating_observability"]["review_window_days_effective"],
            json!(40)
        );
    }

    /// **TT-B110-SEQ2-ORDERS-DEADLINE-CLOCK-INJECT-001**：**`deadline_as_of_utc`** 漂移不改变 **53-S12** 三键（行内时间戳 SSOT）；列表项与详情同源。
    #[test]
    fn tt_b110_deadline_fields_stable_when_deadline_as_of_shifts() {
        let as_of_a = Utc.with_ymd_and_hms(2020, 1, 1, 0, 0, 0).unwrap();
        let as_of_b = Utc.with_ymd_and_hms(2030, 6, 15, 12, 0, 0).unwrap();
        let tid = Uuid::new_v4();
        let mut o = sample_order(tid);
        let completed = Utc.with_ymd_and_hms(2025, 2, 1, 8, 0, 0).unwrap();
        o.state = OrderState::Completed;
        o.completed_at = Some(completed);
        o.tourist_confirmed = Some(true);
        o.guide_confirmed = Some(true);
        o.updated_at = Utc.with_ymd_and_hms(2025, 2, 1, 9, 0, 0).unwrap();
        let store = ChainOffStore::default();
        let rw = 14i64;
        let r = super::resolve_rating_review_window_for_deadlines(rw, false, None);
        let env_a = order_detail_envelope(&store, &o, &r, None, as_of_a);
        let env_b = order_detail_envelope(&store, &o, &r, None, as_of_b);
        let item_a = order_list_item_json(&store, &o, &r, as_of_a);
        let item_b = order_list_item_json(&store, &o, &r, as_of_b);
        for key in ["payment_deadline", "chat_confirm_deadline", "rating_deadline"] {
            assert_eq!(env_a["order"][key], env_b["order"][key], "detail {key}");
            assert_eq!(item_a[key], item_b[key], "list {key}");
        }
        assert_eq!(
            env_a["order"]["deadline_rating_observability"],
            env_b["order"]["deadline_rating_observability"]
        );
    }

    #[test]
    fn order_detail_envelope_includes_traveler_id_mirror() {
        let tid = Uuid::new_v4();
        let o = sample_order(tid);
        let store = ChainOffStore::default();
        let as_of = Utc::now();
        let r = super::resolve_rating_review_window_for_deadlines(14, false, None);
        let env = order_detail_envelope(&store, &o, &r, None, as_of);
        assert_eq!(
            env["order"]["tourist_id"].as_str().unwrap(),
            tid.to_string()
        );
        assert_eq!(
            env["order"]["traveler_id"].as_str().unwrap(),
            tid.to_string()
        );
    }

    /// **TT-B095-SPLIT-ADDRESSES-META-SSOT-ENVELOPE-001**：**`order_split_addresses_ssot`** 与 **`ChainConfig::escrow_platform_fee_recipient`**（**GET /meta** **`chain.contracts.escrow_platform_fee_recipient`** 同源）及 **`order_detail_envelope`** 内嵌一致。
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
                hourly_rate: None,
                avatar_url: None,
            public_title: None,
                status: "active".to_string(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: now,
                updated_at: now,
                data_origin: "production".into(),
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
            country_pool_ledger_address: None,
        unallocated_steward_path_vault_address: None,
            investor_share_token_addresses: vec![],
            staking_address: None,
            guide_staking_address: None,
            staking_provider_address: None,
            investor_lock_contract_addresses: vec![],
            governor_address: None,
            governance_timelock_address: None,
            governance_votes_token_address: None,
            treasury_address: None,
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

        let r = super::resolve_rating_review_window_for_deadlines(14, false, None);
        let env = order_detail_envelope(&store, &o, &r, Some(&chain), now);
        assert_eq!(env["order"]["split_addresses_ssot"], split);
    }

    #[test]
    fn draft_orders_list_includes_off_scope_drafts_for_cleanup() {
        let uid = Uuid::new_v4();
        let mut o = sample_order(uid);
        o.tourist_id = uid;
        o.state = OrderState::Draft;
        o.chain_id = Some(999);
        let mut store = ChainOffStore::default();
        store.orders.insert(o.id, o.clone());
        assert!(!order_matches_orders_list_chain_scope(&o, Some(137), None));
        assert!(order_visible_in_orders_list(
            &store,
            &o,
            uid,
            Some(OrderState::Draft),
            None,
            Some(137),
            None,
        ));
        assert!(!order_visible_in_orders_list(
            &store,
            &o,
            uid,
            None,
            None,
            Some(137),
            None,
        ));
    }

    #[test]
    fn b102_orders_list_chain_scope_default_includes_null_and_business_chain() {
        let mut o_null = sample_order(Uuid::new_v4());
        o_null.chain_id = None;
        let mut o_match = sample_order(Uuid::new_v4());
        o_match.chain_id = Some(137);
        let mut o_other = sample_order(Uuid::new_v4());
        o_other.chain_id = Some(1);
        assert!(order_matches_orders_list_chain_scope(&o_null, Some(137), None));
        assert!(order_matches_orders_list_chain_scope(&o_match, Some(137), None));
        assert!(!order_matches_orders_list_chain_scope(&o_other, Some(137), None));
    }

    #[test]
    fn b102_orders_list_chain_scope_explicit_same_as_business_includes_null() {
        let mut o = sample_order(Uuid::new_v4());
        o.chain_id = None;
        assert!(order_matches_orders_list_chain_scope(&o, Some(137), Some(137)));
    }

    #[test]
    fn b102_orders_list_chain_scope_explicit_other_chain_strict() {
        let mut o = sample_order(Uuid::new_v4());
        o.chain_id = None;
        assert!(!order_matches_orders_list_chain_scope(&o, Some(137), Some(1)));
        o.chain_id = Some(137);
        assert!(!order_matches_orders_list_chain_scope(&o, Some(137), Some(1)));
        o.chain_id = Some(1);
        assert!(order_matches_orders_list_chain_scope(&o, Some(137), Some(1)));
    }

    #[test]
    fn b102_order_chain_mismatch_for_public_read() {
        let chain = crate::chain::ChainConfig {
            rpc_url: "http://x".to_string(),
            chain_id: 137,
            escrow_factory_address: None,
            fee_router_address: None,
            region_vault_address: None,
            country_pool_ledger_address: None,
        unallocated_steward_path_vault_address: None,
            investor_share_token_addresses: vec![],
            staking_address: None,
            guide_staking_address: None,
            staking_provider_address: None,
            investor_lock_contract_addresses: vec![],
            governor_address: None,
            governance_timelock_address: None,
            governance_votes_token_address: None,
            treasury_address: None,
            registry_address: None,
            executor_max_amount_per_tx: None,
            executor_max_amount_per_day: None,
            executor_retry_count: 3,
        };
        let mut o = sample_order(Uuid::new_v4());
        o.chain_id = None;
        assert!(!order_chain_mismatch_for_public_read(&o, &chain));
        o.chain_id = Some(137);
        assert!(!order_chain_mismatch_for_public_read(&o, &chain));
        o.chain_id = Some(1);
        assert!(order_chain_mismatch_for_public_read(&o, &chain));
    }
}

/// **TT-B097-GET-ORDER-PROJECTION-TERMINAL-SSOT-001**：与 **`order_get_impl`** 在 **`fetch_orders_projection_terminal_by_order_uuid` → `Ok(Some(row))`** 分支同源：**`order_detail_envelope`** + **`apply_orders_projection_fields_to_order_json`**；**`order.projection_terminal.status`** 与 **`orders_projection.status`**（行上 **`OrdersProjectionTerminalRow.status`**）一致。
#[cfg(test)]
mod b097_projection_terminal_order_get_tests {
    use super::*;
    use crate::db;
    use chrono::Utc;
    use std::sync::Arc;
    use tokio::sync::RwLock;
    use traveltrust_core::OrderState;
    use uuid::Uuid;

    #[tokio::test]
    async fn b097_terminal_order_envelope_projection_terminal_status_matches_projection_row() {
        let tid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let oid = Uuid::new_v4();
        let now = Utc::now();
        let mut store = ChainOffStore::default();
        store.orders.insert(
            oid,
            OrderRow {
                id: oid,
                tourist_id: tid,
                guide_id: gid,
                amount: "1".to_string(),
                currency: "USD".to_string(),
                escrow_address: None,
                state: OrderState::Completed,
                created_at: now,
                accepted_at: None,
                escrowed_at: None,
                completed_at: Some(now),
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
            service_tourist_confirmed: None,
            service_guide_confirmed: None,
                chain_id: None,
                data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
            },
        );
        let store = Arc::new(RwLock::new(store));
        let (mut body, order_state_str) = {
            let g = store.read().await;
            let o = g.orders.get(&oid).expect("order");
            let order_state_str = order_state_to_str(o.state);
            let r = super::resolve_rating_review_window_for_deadlines(14, false, None);
            let body = order_detail_envelope(&g, o, &r, None, now);
            (body, order_state_str)
        };

        let projection_status = "completed";
        let row = db::OrdersProjectionTerminalRow {
            status: projection_status.to_string(),
            resolution_type: Some("Released".to_string()),
            updated_at: now,
        };
        apply_orders_projection_fields_to_order_json(&mut body, &order_state_str, Some(&row), None);

        let pt = body["order"]["projection_terminal"].as_object().expect("object");
        assert_eq!(
            pt["status"].as_str(),
            Some(projection_status),
            "projection_terminal.status mirrors orders_projection.status"
        );
        assert_eq!(
            pt["status"].as_str(),
            Some(row.status.as_str()),
            "field equals row SSOT"
        );
        assert_eq!(body["order"]["display_status"].as_str(), Some(projection_status));
        assert_eq!(pt["diverges_from_order_state"], false);
    }
}
