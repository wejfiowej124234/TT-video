//! chain_off 行程：CreateItineraryBody、CustomItineraryBody、ItineraryDayRow、AmountBreakdown、ItineraryBundle、
//! generate_itinerary_mock、itinerary_create_impl、itinerary_custom_create_impl（48 §5.6、49 A.7）

use axum::{http::StatusCode, Json};
use chrono::{NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value as JsonValue};
use uuid::Uuid;

use super::{order_state_to_str, ChainOffState, OrderRow};
use traveltrust_core::OrderState;

// ---------- 49 A 自由市场自定义行程（POST /api/v1/itineraries/custom） ----------

/// 游客侧单日行程（49 A.7）；attractions/food 可为字符串数组或 [{name, image?}]，hotel 可为字符串或 {name, image?}，便于与创建时配图一致
#[derive(Clone, Debug, Deserialize)]
pub struct CustomDayPlan {
    pub city: String,
    /// 兼容 ["name1","name2"] 或 [{ "name": "x", "image": "url" }]
    #[serde(default)]
    pub attractions: Vec<JsonValue>,
    #[serde(default)]
    pub food: Vec<JsonValue>,
    #[serde(default)]
    pub hotel: Option<JsonValue>,
    #[serde(default)]
    pub city_transport: Option<String>,
    #[serde(default)]
    pub transport: Option<String>,
}

/// 向导侧单日行程（49 A.7）；可选当日景区/美食配图，与创建时上传一致
#[derive(Clone, Debug, Deserialize)]
pub struct CustomGuideDayPlan {
    pub city: String,
    #[serde(default)]
    pub attractions: String,
    #[serde(default)]
    pub food: String,
    #[serde(default)]
    pub hotel: String,
    #[serde(default)]
    pub attraction_image: Option<String>,
    #[serde(default)]
    pub food_image: Option<String>,
}

/// 自定义行程请求体（49 A.7）
#[derive(Clone, Debug, Deserialize)]
pub struct CustomItineraryBody {
    pub creator_type: String,
    /// 国家：**中文名**，须为 `traveltrust_core::PRODUCT_COUNTRY_NAMES_ZH` 之一（与 `GET /meta.product_countries.name_zh`、前端 `productCountries.ts` 一致）；**勿**传 ISO 双字母。
    pub country: String,
    pub total_days: u32,
    pub amount: serde_json::Value,
    #[serde(default = "default_currency")]
    pub currency: String,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub image: Option<String>,
    #[serde(default = "default_headcount")]
    pub headcount: u32,
    #[serde(default)]
    pub travel_date: Option<String>,
    #[serde(default)]
    pub day_plans: Option<Vec<CustomDayPlan>>,
    #[serde(default)]
    pub guide_day_plans: Option<Vec<CustomGuideDayPlan>>,
    #[serde(default)]
    pub need_guide: Option<String>,
    #[serde(default)]
    pub breakdown: Option<CustomBreakdown>,
    #[serde(default)]
    pub transport_legs: Option<Vec<TransportLeg>>,
    /// 可选：预选向导（`guides` 表主键 UUID）；与 `POST /api/v1/itineraries`、`POST /api/v1/orders` 同一语义（5.1 / 5.2）
    #[serde(default)]
    pub guide_id: Option<String>,
}

/// `POST /itineraries/custom` **`creator_type`**：旅行者侧与 **87** **`traveler`** 协议名对齐（698），与 **`tourist`** 同轨校验（**699**：与 **`users_role_is_traveler_side`** 同源）。
pub(crate) fn custom_creator_is_traveler_side(creator_type: &str) -> bool {
    super::users_role_is_traveler_side(creator_type)
}

fn default_currency() -> String {
    "USD".to_string()
}
fn default_headcount() -> u32 {
    1
}

#[derive(Clone, Debug, Deserialize)]
pub struct CustomBreakdown {
    pub guide_fee: Option<f64>,
    pub car_fee: Option<f64>,
    #[serde(default)]
    pub attractions_fee: Option<f64>,
    #[serde(default)]
    pub food_fee: Option<f64>,
    #[serde(default)]
    pub hotel_fee: Option<f64>,
}

#[derive(Clone, Debug, Deserialize)]
pub struct TransportLeg {
    pub from: String,
    pub to: String,
    #[serde(default)]
    pub r#type: Option<String>,
}

/// 17 ① 输入：目的地、城市、出行日期、天数、酒店类型、美食偏好、交通、预算、备注
/// 56-S3：可选 cities 为城市序列（如 [北京, 上海, 杭州]），有则 mock/AI 仅产出这些城市，不生成未选城市
#[derive(Clone, Debug, Deserialize)]
pub struct CreateItineraryBody {
    pub destination: String,
    pub city: String,
    #[allow(dead_code)]
    pub travel_date: String,
    pub days: u32,
    /// 56-S3 多城市契约：城市序列，长度 N；有则生成 N 天且第 i 天对应 cities[i]，不生成未选城市
    #[serde(default)]
    pub cities: Option<Vec<String>>,
    #[serde(default)]
    pub hotel_type: Option<String>,
    #[serde(default)]
    pub food_preference: Option<String>,
    #[serde(default)]
    pub transport: Option<String>,
    #[serde(default)]
    pub budget_min: Option<f64>,
    #[serde(default)]
    pub budget_max: Option<f64>,
    #[serde(default)]
    #[allow(dead_code)]
    pub notes: Option<String>,
    /// 可选：预选向导（`guides` 表主键 UUID）；与 `POST /api/v1/orders` `guide_id` 同一语义（5.1 / 5.2 深链）
    #[serde(default)]
    pub guide_id: Option<String>,
}

/// 单日行程（17 ① 输出；52 §3.1 统一表兼容：保留 content_text/content_images，扩展可选字段）
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct ItineraryDayRow {
    pub day_index: u32,
    /// 当日行程文字；52 中与 description 二选一或同存
    #[serde(default)]
    pub content_text: String,
    #[serde(default)]
    pub content_images: Vec<String>,
    // ----- 52 统一表可选字段（兼容旧 days_json） -----
    #[serde(default)]
    pub date: Option<String>,
    #[serde(default)]
    pub city: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub images: Option<Vec<String>>,
    #[serde(default)]
    pub attractions: Option<serde_json::Value>,
    #[serde(default)]
    pub dining: Option<serde_json::Value>,
    #[serde(default)]
    pub city_transport: Option<serde_json::Value>,
    #[serde(default)]
    pub inter_city_transport: Option<serde_json::Value>,
    #[serde(default)]
    pub hotel: Option<serde_json::Value>,
    #[serde(default)]
    pub price_note: Option<serde_json::Value>,
    #[serde(default)]
    pub notes: Option<String>,
}

/// 费用明细（17 ①）
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct AmountBreakdown {
    pub hotel: f64,
    pub catering: f64,
    pub tickets: f64,
    pub guide_fee: f64,
    pub vehicle: f64,
    pub platform_fee: f64,
    pub total_budget: f64,
}

/// 从 travel_date (YYYY-MM-DD) 和 days 得到 (start_date, end_date)（80 §4.15.6）
fn parse_itinerary_date_range(
    travel_date: &str,
    days: u32,
) -> (Option<NaiveDate>, Option<NaiveDate>) {
    let start = NaiveDate::parse_from_str(travel_date.trim(), "%Y-%m-%d").ok();
    let days = days.max(1).min(365);
    match start {
        Some(s) => {
            let end = s
                .and_hms_opt(0, 0, 0)
                .and_then(|dt| dt.checked_add_signed(chrono::Duration::days((days - 1) as i64)))
                .map(|dt| dt.date());
            (Some(s), end)
        }
        None => (None, None),
    }
}

/// 行程包：关联 Draft 订单，version=1，每日行程 + 费用明细；cover_image 用于订单卡片与详情首图一致
#[derive(Clone, Debug)]
pub struct ItineraryBundle {
    #[allow(dead_code)]
    pub order_id: Uuid,
    pub version: u32,
    pub destination: String,
    pub city: String,
    pub days: Vec<ItineraryDayRow>,
    pub amount_breakdown: AmountBreakdown,
    pub snapshot_hash: Option<String>,
    #[allow(dead_code)]
    pub cover_image: Option<String>,
}

fn non_empty_image_url(s: &str) -> Option<String> {
    let t = s.trim();
    if t.is_empty() {
        None
    } else {
        Some(t.to_string())
    }
}

fn first_image_from_named_items_array(arr: &JsonValue) -> Option<String> {
    let a = arr.as_array()?;
    for item in a {
        match item {
            JsonValue::Object(o) => {
                if let Some(JsonValue::String(img)) = o.get("image") {
                    if let Some(u) = non_empty_image_url(img) {
                        return Some(u);
                    }
                }
            }
            _ => {}
        }
    }
    None
}

fn first_image_from_hotel_value(hotel: &JsonValue) -> Option<String> {
    match hotel {
        JsonValue::Object(o) => o
            .get("image")
            .and_then(|v| v.as_str())
            .and_then(non_empty_image_url),
        _ => None,
    }
}

/// 从已反序列化的日行推导封面（与 56-S11 / 前端首日图启发式一致）；DB 无单独 cover 列时由 hydrate 调用。
pub fn infer_cover_image_from_days(days: &[ItineraryDayRow]) -> Option<String> {
    let mut indexed: Vec<(u32, &ItineraryDayRow)> = days.iter().map(|d| (d.day_index, d)).collect();
    indexed.sort_by_key(|(i, _)| *i);
    for (_, d) in indexed {
        for img in &d.content_images {
            if let Some(u) = non_empty_image_url(img) {
                return Some(u);
            }
        }
        if let Some(ref imgs) = d.images {
            for img in imgs {
                if let Some(u) = non_empty_image_url(img) {
                    return Some(u);
                }
            }
        }
        if let Some(ref a) = d.attractions {
            if let Some(u) = first_image_from_named_items_array(a) {
                return Some(u);
            }
        }
        if let Some(ref din) = d.dining {
            if let Some(u) = first_image_from_named_items_array(din) {
                return Some(u);
            }
        }
        if let Some(ref h) = d.hotel {
            if let Some(u) = first_image_from_hotel_value(h) {
                return Some(u);
            }
        }
    }
    None
}

const MOCK_ITINERARY_DAY_IMAGES: [&str; 4] = [
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&q=80",
    "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
];

fn mock_itinerary_day_image(day_index: u32) -> String {
    let idx = (day_index.saturating_sub(1) as usize) % MOCK_ITINERARY_DAY_IMAGES.len();
    MOCK_ITINERARY_DAY_IMAGES[idx].to_string()
}

/// 56-S3 多城市契约：有 cities 时仅生成所选城市对应天数的日行，不生成未选城市；无 cities 时沿用单 city 逻辑
pub(crate) fn generate_itinerary_mock(
    body: &CreateItineraryBody,
) -> (Vec<ItineraryDayRow>, AmountBreakdown) {
    let total = body
        .budget_min
        .or(body.budget_max)
        .unwrap_or(1000.0)
        .max(0.0);
    let total = if let (Some(a), Some(b)) = (body.budget_min, body.budget_max) {
        (a + b) / 2.0
    } else {
        total
    };
    let amount = AmountBreakdown {
        hotel: (total * 0.35).round(),
        catering: (total * 0.25).round(),
        tickets: (total * 0.15).round(),
        guide_fee: (total * 0.15).round(),
        vehicle: (total * 0.05).round(),
        platform_fee: (total * 0.05).round(),
        total_budget: total.round(),
    };
    let days_vec: Vec<ItineraryDayRow> = match body.cities.as_deref() {
        Some(cities) if !cities.is_empty() => {
            let cities: Vec<String> = cities
                .iter()
                .take(body.days.max(1).min(30) as usize)
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();
            let cities: Vec<String> = if cities.is_empty() {
                vec![body.city.clone()]
            } else {
                cities
            };
            let n = cities.len();
            (1..=n as u32)
                .map(|d| {
                    let city = cities
                        .get((d as usize).saturating_sub(1))
                        .cloned()
                        .unwrap_or_else(|| body.city.clone());
                    ItineraryDayRow {
                        day_index: d,
                        content_text: format!(
                            "{} 第{}天：{}；酒店{}，交通{}，餐饮{}。",
                            body.destination,
                            d,
                            city,
                            body.hotel_type.as_deref().unwrap_or("标准"),
                            body.transport.as_deref().unwrap_or("当地交通"),
                            body.food_preference.as_deref().unwrap_or("当地特色")
                        ),
                        content_images: vec![mock_itinerary_day_image(d)],
                        date: None,
                        city: Some(city),
                        description: None,
                        images: None,
                        attractions: None,
                        dining: None,
                        city_transport: None,
                        inter_city_transport: None,
                        hotel: None,
                        price_note: None,
                        notes: None,
                    }
                })
                .collect()
        }
        _ => {
            let days = body.days.max(1).min(30);
            (1..=days)
                .map(|d| ItineraryDayRow {
                    day_index: d,
                    content_text: format!(
                        "{} {} 第{}天：{}（{}）；酒店{}，交通{}，餐饮{}。",
                        body.destination,
                        body.city,
                        d,
                        body.destination,
                        body.city,
                        body.hotel_type.as_deref().unwrap_or("标准"),
                        body.transport.as_deref().unwrap_or("当地交通"),
                        body.food_preference.as_deref().unwrap_or("当地特色")
                    ),
                    content_images: vec![mock_itinerary_day_image(d)],
                    date: None,
                    city: Some(body.city.clone()),
                    description: None,
                    images: None,
                    attractions: None,
                    dining: None,
                    city_transport: None,
                    inter_city_transport: None,
                    hotel: None,
                    price_note: None,
                    notes: None,
                })
                .collect()
        }
    };
    (days_vec, amount)
}

/// 每用户 Draft 订单上限（80 §4.6、50-80-1）；超限需先归档或拒绝创建。
const DRAFT_CAP_PER_USER: usize = 20;
/// 每用户进行中订单上限（80 §0.2.1、50-80-12）；超限不得再发布新行程。
const IN_PROGRESS_CAP_PER_USER: usize = 5;

fn is_in_progress(state: OrderState) -> bool {
    matches!(
        state,
        OrderState::Created | OrderState::Accepted | OrderState::Escrowed
    )
}

/// `POST /api/v1/itineraries`：`destination` 须为产品期中文国家名；`city` 与 `cities[]` 须为该国预设城市。
/// 默认 **`traveltrust_core::preset_cities`**；`CATALOG_SERVER_GEO_VALIDATION=1` 且 **`db_pool`** 时改读 published catalog（S4）。
async fn validate_create_itinerary_geo(
    pool: Option<&sqlx::PgPool>,
    body: &CreateItineraryBody,
) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
    let dest = body.destination.trim();
    if !crate::catalog_geo_validation::is_allowed_zh_destination_country_resolved(pool, dest).await
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid_destination_country",
                "message": "invalid_destination_country",
                "hint": "destination must be one of GET /meta.product_countries name_zh"
            })),
        ));
    }
    if !crate::catalog_geo_validation::is_preset_city_for_zh_country_resolved(pool, dest, &body.city)
        .await
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid_city_for_country",
                "message": "invalid_city_for_country",
                "hint": "city must be in the preset list for the selected destination country"
            })),
        ));
    }
    if let Some(ref cities) = body.cities {
        for c in cities {
            let t = c.trim();
            if t.is_empty() {
                continue;
            }
            if !crate::catalog_geo_validation::is_preset_city_for_zh_country_resolved(pool, dest, t)
                .await
            {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(json!({
                        "error": "invalid_city_for_country",
                        "message": "invalid_city_for_country",
                        "hint": "each non-empty cities[] entry must be a preset city for destination"
                    })),
                ));
            }
        }
    }
    Ok(())
}

/// `PATCH /api/v1/orders/:id/itinerary`：当行程包 **`destination`** 为产品期中文国家名时，`daily_itinerary[*].city` 若有非空值，须为该国预设城市（与 **POST /api/v1/itineraries** / `preset_cities` 一致）；**非**十国 `destination` 的存量包**不**校验（避免锁死历史数据）。
pub(crate) fn validate_daily_itinerary_cities_for_destination(
    destination: &str,
    days: &[ItineraryDayRow],
) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
    let dest = destination.trim();
    if !traveltrust_core::is_allowed_zh_destination_country(dest) {
        return Ok(());
    }
    for d in days {
        if let Some(ref c) = d.city {
            let t = c.trim();
            if t.is_empty() {
                continue;
            }
            if !traveltrust_core::is_preset_city_for_zh_country(dest, t) {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(json!({
                        "error": "invalid_city_for_country",
                        "message": "invalid_city_for_country",
                        "hint": "daily_itinerary[].city must be a preset city for the itinerary destination when destination is a product-phase country"
                    })),
                ));
            }
        }
    }
    Ok(())
}

/// 解析可选 `guide_id`：缺省或空串 → `Uuid::nil()`；否则须为合法 UUID 且存在于 `guides`。
async fn resolve_preselected_guide_id(
    state: &ChainOffState,
    guide_id: Option<&String>,
) -> Result<Uuid, (StatusCode, Json<serde_json::Value>)> {
    match guide_id
        .map(|s| s.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        None => Ok(Uuid::nil()),
        Some(raw) => {
            let gid = Uuid::parse_str(raw).map_err(|_| {
                (
                    StatusCode::BAD_REQUEST,
                    Json(json!({
                        "error": "invalid_guide_id",
                        "message": "invalid_guide_id",
                        "hint": "guide_id must be a UUID when provided"
                    })),
                )
            })?;
            {
                let store = state.store.read().await;
                if !store.guides.contains_key(&gid) {
                    return Err((
                        StatusCode::BAD_REQUEST,
                        Json(crate::api_json::err_key("guide_not_found")),
                    ));
                }
            }
            Ok(gid)
        }
    }
}

/// 创建行程草稿：接收 17 ① 输入，生成每日行程与费用明细，写入 Draft 订单 + itineraries，返回 version=1。
pub async fn itinerary_create_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<CreateItineraryBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    {
        let store = state.store.read().await;
        let draft_count = store
            .orders
            .values()
            .filter(|o| o.state == OrderState::Draft && o.tourist_id == user_id)
            .count();
        if draft_count >= DRAFT_CAP_PER_USER {
            return Err((
                StatusCode::CONFLICT,
                Json(json!({
                    "error": "draft_cap_exceeded",
                    "message": "draft_cap_exceeded",
                    "hint": "每用户 Draft 上限为 20，请先归档或删除旧草稿",
                    "current_count": draft_count,
                    "cap": DRAFT_CAP_PER_USER
                })),
            ));
        }
        let in_progress = store
            .orders
            .values()
            .filter(|o| o.tourist_id == user_id && is_in_progress(o.state))
            .count();
        if in_progress >= IN_PROGRESS_CAP_PER_USER {
            return Err((
                StatusCode::CONFLICT,
                Json(json!({
                    "error": "in_progress_cap_exceeded",
                    "message": "in_progress_cap_exceeded",
                    "hint": "进行中订单数已达上限，请先完成或取消部分订单后再发布",
                    "current_count": in_progress,
                    "cap": IN_PROGRESS_CAP_PER_USER
                })),
            ));
        }
    }
    if body.days == 0 || body.days > 30 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(
                json!({"error": "invalid_days", "message": "invalid_days", "hint": "days 须为 1～30"}),
            ),
        ));
    }
    if body.destination.is_empty() || body.city.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("destination_and_city_required")),
        ));
    }
    validate_create_itinerary_geo(state.db_pool.as_ref(), &body).await?;
    let guide_uuid = resolve_preselected_guide_id(&state, body.guide_id.as_ref()).await?;
    let (days_vec, amount_breakdown) = generate_itinerary_mock(&body);
    let (start_date, end_date) = parse_itinerary_date_range(&body.travel_date, body.days);
    let order_id = Uuid::new_v4();
    let now = Utc::now();
    let total_str = format!("{:.2}", amount_breakdown.total_budget);
    let bundle = ItineraryBundle {
        order_id,
        version: 1,
        destination: body.destination.clone(),
        city: body.city.clone(),
        days: days_vec.clone(),
        amount_breakdown: amount_breakdown.clone(),
        snapshot_hash: None,
        cover_image: None,
    };
    let tourist_email = {
        let store = state.store.read().await;
        store
            .users
            .get(&user_id)
            .map(|u| u.email.clone())
            .unwrap_or_default()
    };
    let data_origin = super::infer_order_data_origin(&tourist_email, &bundle);
    let order = OrderRow {
        id: order_id,
        tourist_id: user_id,
        guide_id: guide_uuid,
        amount: total_str.clone(),
        currency: "USD".to_string(),
        escrow_address: None,
        state: OrderState::Draft,
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
    {
        let mut store = state.store.write().await;
        store.orders.insert(order_id, order);
        store.itineraries.insert(order_id, bundle);
    }
    if let Some(ref pool) = state.db_pool {
        let order_to_persist = {
            let store = state.store.read().await;
            store.orders.get(&order_id).cloned()
        };
        let days_json =
            serde_json::to_value(&days_vec).unwrap_or_else(|_| JsonValue::Array(vec![]));
        let amount_json =
            serde_json::to_value(&amount_breakdown).unwrap_or_else(|_| JsonValue::Null);
        if let Some(ref o) = order_to_persist {
            if let Ok(mut tx) = pool.begin().await {
                let guide_id = if o.guide_id.is_nil() {
                    None
                } else {
                    Some(o.guide_id)
                };
                let status = order_state_to_str(o.state);
                let chain_id = o.chain_id.or(state.config.business_chain_id);
                if crate::db::upsert_order_tx(
                    &mut tx,
                    o.id,
                    o.tourist_id,
                    guide_id,
                    &o.amount,
                    &o.currency,
                    status,
                    o.escrow_address.as_deref(),
                    o.created_at,
                    o.updated_at,
                    o.accepted_at,
                    o.escrowed_at,
                    o.completed_at,
                    o.dispute_deadline_at,
                    o.auto_complete_at,
                    o.start_date,
                    o.end_date,
                    o.sub_status.as_deref(),
                    o.tourist_confirmed,
                    o.guide_confirmed,
                    o.rating_tourist_confirmed,
                    o.rating_guide_confirmed,
                    o.service_tourist_confirmed,
                    o.service_guide_confirmed,
                    chain_id,
                )
                .await
                .is_ok()
                    && crate::db::insert_itinerary_tx(
                        &mut tx,
                        order_id,
                        None,
                        1,
                        &body.destination,
                        &body.city,
                        &days_json,
                        Some(&amount_json),
                        None,
                        now,
                        now,
                    )
                    .await
                    .is_ok()
                {
                    let _ = tx.commit().await;
                } else {
                    let _ = tx.rollback().await;
                }
            }
        }
    }
    // 52 §3.1 / 53 §二附四：返回完整日行（含 city/description/attractions/dining 等），与 GET order 一致
    let daily_json: Vec<serde_json::Value> = days_vec
        .iter()
        .map(|d| serde_json::to_value(d).unwrap_or_else(|_| json!({"day_index": d.day_index, "content_text": d.content_text, "content_images": d.content_images})))
        .collect();
    Ok(Json(json!({
        "status": "ok",
        "itinerary_id": order_id.to_string(),
        "order_id": order_id.to_string(),
        "version": 1,
        "order_status": "draft",
        "daily_itinerary": daily_json,
        "amount_breakdown": {
            "hotel": amount_breakdown.hotel,
            "catering": amount_breakdown.catering,
            "tickets": amount_breakdown.tickets,
            "guide_fee": amount_breakdown.guide_fee,
            "vehicle": amount_breakdown.vehicle,
            "platform_fee": amount_breakdown.platform_fee,
            "total_budget": amount_breakdown.total_budget
        }
    })))
}

/// 将请求体顶层 **image** 并入第 1 日 `content_images` 首部，便于 `days_json` 落库与 hydrate 时 `infer_cover_image_from_days` 与 **ItineraryBundle.cover_image** 一致（56-S11）。
fn apply_custom_top_level_cover_to_first_day(days: &mut [ItineraryDayRow], cover: Option<&str>) {
    let Some(url) = cover.map(str::trim).filter(|s| !s.is_empty()) else {
        return;
    };
    let Some(first) = days.first_mut() else {
        return;
    };
    if first.content_images.iter().any(|s| s == url) {
        return;
    }
    first.content_images.insert(0, url.to_string());
}

/// 从 CustomItineraryBody 构建 ItineraryDayRow 列表与 AmountBreakdown（49 A.12）
fn custom_body_to_days_and_amount(
    body: &CustomItineraryBody,
) -> (Vec<ItineraryDayRow>, AmountBreakdown) {
    let total = parse_amount_from_value(&body.amount)
        .unwrap_or(0.0)
        .max(0.0);
    let bd = body.breakdown.as_ref();
    let guide_fee = bd.and_then(|b| b.guide_fee).unwrap_or(0.0);
    let vehicle = bd.and_then(|b| b.car_fee).unwrap_or(0.0);
    let tickets_explicit = bd.and_then(|b| b.attractions_fee);
    let catering_explicit = bd.and_then(|b| b.food_fee);
    let hotel_explicit = bd.and_then(|b| b.hotel_fee);
    let amount_breakdown = if tickets_explicit.is_some()
        || catering_explicit.is_some()
        || hotel_explicit.is_some()
    {
        let tickets = tickets_explicit.unwrap_or(0.0).max(0.0);
        let catering = catering_explicit.unwrap_or(0.0).max(0.0);
        let hotel = hotel_explicit.unwrap_or(0.0).max(0.0);
        let known = tickets + catering + hotel + guide_fee + vehicle;
        let platform_fee = (total - known).max(0.0);
        AmountBreakdown {
            hotel,
            catering,
            tickets,
            guide_fee,
            vehicle,
            platform_fee,
            total_budget: total,
        }
    } else {
        let rest = (total - guide_fee - vehicle).max(0.0);
        AmountBreakdown {
            hotel: rest * 0.35,
            catering: rest * 0.25,
            tickets: rest * 0.15,
            guide_fee,
            vehicle,
            platform_fee: rest * 0.05,
            total_budget: total,
        }
    };
    let days_vec: Vec<ItineraryDayRow> = if body.creator_type == "guide" {
        let plans = body.guide_day_plans.as_deref().unwrap_or(&[]);
        (0..body.total_days)
            .map(|i| {
                let p = plans.get(i as usize);
                let city = p.map(|x| x.city.as_str()).unwrap_or("");
                let att = p.map(|x| x.attractions.as_str()).unwrap_or("");
                let food = p.map(|x| x.food.as_str()).unwrap_or("");
                let hotel = p.map(|x| x.hotel.as_str()).unwrap_or("");
                let content =
                    if city.is_empty() && att.is_empty() && food.is_empty() && hotel.is_empty() {
                        format!("第{}天：待填写", i + 1)
                    } else {
                        format!(
                            "第{}天：{}；景区：{}；美食：{}；酒店：{}",
                            i + 1,
                            city,
                            att,
                            food,
                            hotel
                        )
                    };
                let day_images: Vec<String> = p
                    .and_then(|x| {
                        let urls: Vec<String> = x
                            .attraction_image
                            .iter()
                            .chain(x.food_image.iter())
                            .filter_map(|s| {
                                if s.trim().is_empty() {
                                    None
                                } else {
                                    Some(s.clone())
                                }
                            })
                            .collect();
                        if urls.is_empty() {
                            None
                        } else {
                            Some(urls)
                        }
                    })
                    .unwrap_or_default();
                let att_json = if att.is_empty() {
                    None
                } else {
                    Some(serde_json::json!(att
                        .split(',')
                        .filter(|s| !s.trim().is_empty())
                        .map(|s| s.trim().to_string())
                        .collect::<Vec<_>>()))
                };
                let food_json = if food.is_empty() {
                    None
                } else {
                    Some(serde_json::json!(food
                        .split(',')
                        .filter(|s| !s.trim().is_empty())
                        .map(|s| s.trim().to_string())
                        .collect::<Vec<_>>()))
                };
                let hotel_json = if hotel.is_empty() {
                    None
                } else {
                    Some(serde_json::json!({ "name": hotel }))
                };
                ItineraryDayRow {
                    day_index: i + 1,
                    content_text: content.chars().take(2000).collect::<String>(),
                    content_images: day_images.clone(),
                    date: None,
                    city: if city.is_empty() {
                        None
                    } else {
                        Some(city.to_string())
                    },
                    description: None,
                    images: if day_images.is_empty() {
                        None
                    } else {
                        Some(day_images)
                    },
                    attractions: att_json,
                    dining: food_json,
                    city_transport: None,
                    inter_city_transport: None,
                    hotel: hotel_json,
                    price_note: None,
                    notes: None,
                }
            })
            .collect()
    } else {
        let plans = body.day_plans.as_deref().unwrap_or(&[]);
        (0..body.total_days)
            .map(|i| {
                let p = plans.get(i as usize);
                let city = p.map(|x| x.city.as_str()).unwrap_or("");
                let att_items: Vec<(String, Option<String>)> = p
                    .map(|x| {
                        x.attractions
                            .iter()
                            .map(parse_name_image)
                            .filter(|(n, _)| !n.is_empty())
                            .collect()
                    })
                    .unwrap_or_default();
                let food_items: Vec<(String, Option<String>)> = p
                    .map(|x| {
                        x.food
                            .iter()
                            .map(parse_name_image)
                            .filter(|(n, _)| !n.is_empty())
                            .collect()
                    })
                    .unwrap_or_default();
                let (hotel_name, hotel_image) = p
                    .and_then(|x| x.hotel.as_ref())
                    .map(parse_hotel_name_image)
                    .unwrap_or((String::new(), None));
                let attractions_str = att_items
                    .iter()
                    .map(|(n, _)| n.as_str())
                    .collect::<Vec<_>>()
                    .join(",");
                let food_str = food_items
                    .iter()
                    .map(|(n, _)| n.as_str())
                    .collect::<Vec<_>>()
                    .join(",");
                let content = if city.is_empty()
                    && att_items.is_empty()
                    && food_items.is_empty()
                    && hotel_name.is_empty()
                {
                    format!("第{}天：待填写", i + 1)
                } else {
                    format!(
                        "第{}天：{}；景区：{}；美食：{}；酒店：{}",
                        i + 1,
                        city,
                        attractions_str,
                        food_str,
                        hotel_name
                    )
                };
                let att_json = if att_items.is_empty() {
                    None
                } else {
                    Some(serde_json::json!(att_items
                        .into_iter()
                        .map(|(name, image)| {
                            if let Some(img) = image {
                                json!({ "name": name, "image": img })
                            } else {
                                json!({ "name": name })
                            }
                        })
                        .collect::<Vec<_>>()))
                };
                let food_json = if food_items.is_empty() {
                    None
                } else {
                    Some(serde_json::json!(food_items
                        .into_iter()
                        .map(|(name, image)| {
                            if let Some(img) = image {
                                json!({ "name": name, "image": img })
                            } else {
                                json!({ "name": name })
                            }
                        })
                        .collect::<Vec<_>>()))
                };
                let hotel_json = if hotel_name.is_empty() {
                    None
                } else if let Some(img) = hotel_image {
                    Some(serde_json::json!({ "name": hotel_name, "image": img }))
                } else {
                    Some(serde_json::json!({ "name": hotel_name }))
                };
                ItineraryDayRow {
                    day_index: i + 1,
                    content_text: content.chars().take(2000).collect::<String>(),
                    content_images: vec![],
                    date: None,
                    city: if city.is_empty() {
                        None
                    } else {
                        Some(city.to_string())
                    },
                    description: None,
                    images: None,
                    attractions: att_json,
                    dining: food_json,
                    city_transport: None,
                    inter_city_transport: None,
                    hotel: hotel_json,
                    price_note: None,
                    notes: None,
                }
            })
            .collect()
    };
    (days_vec, amount_breakdown)
}

fn parse_amount_from_value(v: &serde_json::Value) -> Option<f64> {
    match v {
        serde_json::Value::Number(n) => n.as_f64(),
        serde_json::Value::String(s) => s.trim().replace(',', "").parse().ok(),
        _ => None,
    }
}

/// 从 API 的 attraction/food 项解析为 (name, image?)：支持 "name" 或 { "name": "x", "image": "url" }
fn parse_name_image(v: &JsonValue) -> (String, Option<String>) {
    match v {
        JsonValue::String(s) => (s.trim().to_string(), None),
        JsonValue::Object(m) => {
            let name = m
                .get("name")
                .and_then(|n| n.as_str())
                .unwrap_or("")
                .trim()
                .to_string();
            let image = m.get("image").and_then(|i| i.as_str()).map(String::from);
            (name, image)
        }
        _ => (String::new(), None),
    }
}

/// 从 API 的 hotel 解析为 (name, image?)：支持 "name" 或 { "name": "x", "image": "url" }
fn parse_hotel_name_image(v: &JsonValue) -> (String, Option<String>) {
    match v {
        JsonValue::String(s) => (s.trim().to_string(), None),
        JsonValue::Object(m) => {
            let name = m
                .get("name")
                .and_then(|n| n.as_str())
                .unwrap_or("")
                .trim()
                .to_string();
            let image = m.get("image").and_then(|i| i.as_str()).map(String::from);
            (name, image)
        }
        _ => (String::new(), None),
    }
}

/// 49 A：POST /api/v1/itineraries/custom — 自由市场自定义行程，创建 Draft 订单 + 行程包
pub async fn itinerary_custom_create_impl(
    state: ChainOffState,
    user_id: Uuid,
    Json(body): Json<CustomItineraryBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    {
        let store = state.store.read().await;
        let draft_count = store
            .orders
            .values()
            .filter(|o| o.state == OrderState::Draft && o.tourist_id == user_id)
            .count();
        if draft_count >= DRAFT_CAP_PER_USER {
            return Err((
                StatusCode::CONFLICT,
                Json(json!({
                    "error": "draft_cap_exceeded",
                    "message": "draft_cap_exceeded",
                    "hint": "每用户 Draft 上限为 20，请先归档或删除旧草稿",
                    "current_count": draft_count,
                    "cap": DRAFT_CAP_PER_USER
                })),
            ));
        }
        let in_progress = store
            .orders
            .values()
            .filter(|o| o.tourist_id == user_id && is_in_progress(o.state))
            .count();
        if in_progress >= IN_PROGRESS_CAP_PER_USER {
            return Err((
                StatusCode::CONFLICT,
                Json(json!({
                    "error": "in_progress_cap_exceeded",
                    "message": "in_progress_cap_exceeded",
                    "hint": "进行中订单数已达上限，请先完成或取消部分订单后再发布",
                    "current_count": in_progress,
                    "cap": IN_PROGRESS_CAP_PER_USER
                })),
            ));
        }
    }
    if body.creator_type != "guide" && !custom_creator_is_traveler_side(body.creator_type.as_str())
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(
                json!({"error": "invalid_creator_type", "message": "invalid_creator_type", "hint": "creator_type 须为 tourist、traveler（87 协议名，698 与 tourist 同轨）或 guide"}),
            ),
        ));
    }
    if body.total_days == 0 || body.total_days > 30 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(
                json!({"error": "invalid_days", "message": "invalid_days", "hint": "total_days 须为 1～30"}),
            ),
        ));
    }
    if body.country.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("destination_and_city_required")),
        ));
    }
    if !crate::catalog_geo_validation::is_allowed_zh_destination_country_resolved(
        state.db_pool.as_ref(),
        &body.country,
    )
    .await
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key_detail(
                "invalid_destination_country",
                "country must be one of the product allow-list Chinese country names",
            )),
        ));
    }
    if custom_creator_is_traveler_side(body.creator_type.as_str()) {
        let has_city = body
            .day_plans
            .as_deref()
            .map(|p| p.iter().any(|d| !d.city.trim().is_empty()))
            .unwrap_or(false);
        if !has_city {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key("destination_and_city_required")),
            ));
        }
    }
    let total = parse_amount_from_value(&body.amount).unwrap_or(0.0);
    if total <= 0.0 || total.is_nan() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_amount")),
        ));
    }

    let guide_uuid = resolve_preselected_guide_id(&state, body.guide_id.as_ref()).await?;

    let (mut days_vec, amount_breakdown) = custom_body_to_days_and_amount(&body);
    apply_custom_top_level_cover_to_first_day(&mut days_vec, body.image.as_deref());
    let travel_date = body.travel_date.as_deref().unwrap_or("");
    let (start_date, end_date) = parse_itinerary_date_range(travel_date, body.total_days);
    let order_id = Uuid::new_v4();
    let now = Utc::now();
    let total_str = format!("{:.2}", amount_breakdown.total_budget);
    let destination = body.country.clone();
    let city = body
        .day_plans
        .as_ref()
        .and_then(|p| p.first().map(|d| d.city.clone()))
        .or_else(|| {
            body.guide_day_plans
                .as_ref()
                .and_then(|p| p.first().map(|d| d.city.clone()))
        })
        .unwrap_or_else(|| body.country.clone());

    let bundle = ItineraryBundle {
        order_id,
        version: 1,
        destination: destination.clone(),
        city: city.clone(),
        days: days_vec.clone(),
        amount_breakdown: amount_breakdown.clone(),
        snapshot_hash: None,
        cover_image: None,
    };
    let tourist_email = {
        let store = state.store.read().await;
        store
            .users
            .get(&user_id)
            .map(|u| u.email.clone())
            .unwrap_or_default()
    };
    let data_origin = super::infer_order_data_origin(&tourist_email, &bundle);
    let order = OrderRow {
        id: order_id,
        tourist_id: user_id,
        guide_id: guide_uuid,
        amount: total_str.clone(),
        currency: body.currency.clone(),
        escrow_address: None,
        state: OrderState::Draft,
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
    let bundle = ItineraryBundle {
        order_id,
        version: 1,
        destination: destination.clone(),
        city: city.clone(),
        days: days_vec.clone(),
        amount_breakdown: amount_breakdown.clone(),
        snapshot_hash: None,
        cover_image: body
            .image
            .as_ref()
            .filter(|s| !s.trim().is_empty())
            .cloned(),
    };
    {
        let mut store = state.store.write().await;
        store.orders.insert(order_id, order);
        store.itineraries.insert(order_id, bundle);
    }
    if let Some(ref pool) = state.db_pool {
        let order_to_persist = {
            let store = state.store.read().await;
            store.orders.get(&order_id).cloned()
        };
        let days_json =
            serde_json::to_value(&days_vec).unwrap_or_else(|_| JsonValue::Array(vec![]));
        let amount_json =
            serde_json::to_value(&amount_breakdown).unwrap_or_else(|_| JsonValue::Null);
        if let Some(ref o) = order_to_persist {
            if let Ok(mut tx) = pool.begin().await {
                let guide_id = if o.guide_id.is_nil() {
                    None
                } else {
                    Some(o.guide_id)
                };
                let status = order_state_to_str(o.state);
                let chain_id = o.chain_id.or(state.config.business_chain_id);
                if crate::db::upsert_order_tx(
                    &mut tx,
                    o.id,
                    o.tourist_id,
                    guide_id,
                    &o.amount,
                    &o.currency,
                    status,
                    o.escrow_address.as_deref(),
                    o.created_at,
                    o.updated_at,
                    o.accepted_at,
                    o.escrowed_at,
                    o.completed_at,
                    o.dispute_deadline_at,
                    o.auto_complete_at,
                    o.start_date,
                    o.end_date,
                    o.sub_status.as_deref(),
                    o.tourist_confirmed,
                    o.guide_confirmed,
                    o.rating_tourist_confirmed,
                    o.rating_guide_confirmed,
                    o.service_tourist_confirmed,
                    o.service_guide_confirmed,
                    chain_id,
                )
                .await
                .is_ok()
                    && crate::db::insert_itinerary_tx(
                        &mut tx,
                        order_id,
                        None,
                        1,
                        &destination,
                        &city,
                        &days_json,
                        Some(&amount_json),
                        None,
                        now,
                        now,
                    )
                    .await
                    .is_ok()
                {
                    let _ = tx.commit().await;
                } else {
                    let _ = tx.rollback().await;
                }
            }
        }
    }
    // 52 §3.1 / 53 §二附四：返回完整日行，与 GET order、POST create 一致
    let daily_json: Vec<serde_json::Value> = days_vec
        .iter()
        .map(|d| serde_json::to_value(d).unwrap_or_else(|_| json!({"day_index": d.day_index, "content_text": d.content_text, "content_images": d.content_images})))
        .collect();
    Ok(Json(json!({
        "status": "ok",
        "order_id": order_id.to_string(),
        "version": 1,
        "order_status": "draft",
        "daily_itinerary": daily_json,
        "amount_breakdown": {
            "hotel": amount_breakdown.hotel,
            "catering": amount_breakdown.catering,
            "tickets": amount_breakdown.tickets,
            "guide_fee": amount_breakdown.guide_fee,
            "vehicle": amount_breakdown.vehicle,
            "platform_fee": amount_breakdown.platform_fee,
            "total_budget": amount_breakdown.total_budget
        }
    })))
}

#[cfg(test)]
mod infer_cover_tests {
    use super::{
        apply_custom_top_level_cover_to_first_day, infer_cover_image_from_days, ItineraryDayRow,
    };
    use serde_json::json;

    #[test]
    fn infer_prefers_content_images_then_attractions() {
        let days = vec![
            ItineraryDayRow {
                day_index: 2,
                content_images: vec![],
                ..Default::default()
            },
            ItineraryDayRow {
                day_index: 1,
                content_images: vec!["  https://cdn.example/a.png  ".to_string()],
                ..Default::default()
            },
        ];
        assert_eq!(
            infer_cover_image_from_days(&days).as_deref(),
            Some("https://cdn.example/a.png")
        );
    }

    #[test]
    fn infer_reads_attraction_object_image() {
        let days = vec![ItineraryDayRow {
            day_index: 1,
            attractions: Some(json!([{"name": "X", "image": "https://img/p.jpg"}])),
            ..Default::default()
        }];
        assert_eq!(
            infer_cover_image_from_days(&days).as_deref(),
            Some("https://img/p.jpg")
        );
    }

    #[test]
    fn infer_reads_hotel_object_image() {
        let days = vec![ItineraryDayRow {
            day_index: 1,
            hotel: Some(json!({"name": "H", "image": "https://hotel/h.webp"})),
            ..Default::default()
        }];
        assert_eq!(
            infer_cover_image_from_days(&days).as_deref(),
            Some("https://hotel/h.webp")
        );
    }

    #[test]
    fn apply_custom_top_level_cover_prepends_day_one() {
        let mut days = vec![ItineraryDayRow {
            day_index: 1,
            content_images: vec![],
            ..Default::default()
        }];
        apply_custom_top_level_cover_to_first_day(&mut days, Some("  https://hero/cover.png  "));
        assert_eq!(days[0].content_images, vec!["https://hero/cover.png"]);
        assert_eq!(
            infer_cover_image_from_days(&days).as_deref(),
            Some("https://hero/cover.png")
        );
    }

    #[test]
    fn apply_custom_top_level_cover_skips_duplicate() {
        let mut days = vec![ItineraryDayRow {
            day_index: 1,
            content_images: vec!["https://same".to_string()],
            ..Default::default()
        }];
        apply_custom_top_level_cover_to_first_day(&mut days, Some("https://same"));
        assert_eq!(days[0].content_images.len(), 1);
    }
}

/// 07 §5.2 / 04：`PATCH …/itinerary` 与 POST 同源预设城市规则（非产品期 destination 不强制）。
#[cfg(test)]
mod validate_patch_geo_tests {
    use super::{validate_daily_itinerary_cities_for_destination, ItineraryDayRow};

    #[test]
    fn skips_city_check_when_destination_not_product_phase_zh() {
        let days = vec![ItineraryDayRow {
            day_index: 1,
            city: Some("任意非预设城市".into()),
            ..Default::default()
        }];
        assert!(validate_daily_itinerary_cities_for_destination("意大利", &days).is_ok());
    }

    #[test]
    fn rejects_non_preset_city_for_china() {
        let days = vec![ItineraryDayRow {
            day_index: 1,
            city: Some("火星市".into()),
            ..Default::default()
        }];
        assert!(validate_daily_itinerary_cities_for_destination("中国", &days).is_err());
    }

    #[test]
    fn allows_whitespace_only_city_skipped() {
        let days = vec![ItineraryDayRow {
            day_index: 1,
            city: Some("   ".into()),
            ..Default::default()
        }];
        assert!(validate_daily_itinerary_cities_for_destination("中国", &days).is_ok());
    }

    #[test]
    fn allows_known_preset_for_japan() {
        let days = vec![ItineraryDayRow {
            day_index: 1,
            city: Some("东京".into()),
            ..Default::default()
        }];
        assert!(validate_daily_itinerary_cities_for_destination("日本", &days).is_ok());
    }
}

#[cfg(test)]
mod custom_creator_type_tests {
    use super::custom_creator_is_traveler_side;

    #[test]
    fn traveler_matches_tourist_side_698() {
        assert!(custom_creator_is_traveler_side("tourist"));
        assert!(custom_creator_is_traveler_side("traveler"));
        assert!(custom_creator_is_traveler_side(" TRAVELER "));
        assert!(!custom_creator_is_traveler_side("guide"));
        assert!(!custom_creator_is_traveler_side("provider"));
    }
}
