//! chain_off 单测：事件解析、行程生成、Discover、消息、确认行程、set_escrow（48 §14.3 按域拆分）

use super::{
    confirm_final_plan_impl, discover_orders_list_impl, event_name_from_topic0,
    generate_itinerary_mock, itinerary_create_impl, itinerary_custom_create_impl,
    message_post_impl, messages_list_impl, order_get_impl, orders_list_impl,
    parse_order_id_and_escrow_from_topics, parse_order_id_bytes32_from_topics,
    parse_platform_fee_routed, parse_region_vault_forwarded, patch_order_itinerary_impl,
    platform_fee_routed_topic0_hex, region_vault_forwarded_topic0_hex,
    set_order_escrow_address_impl, AmountBreakdown, ChainOffConfig, ChainOffState, ChainOffStore,
    ConfirmFinalPlanBody, CreateItineraryBody, CustomItineraryBody, GuideRow, ItineraryBundle,
    ItineraryDayRow, OrderListPage, OrderRow, PatchItineraryBody, PostMessageBody,
    SetEscrowAddressBody, UserRow,
};
use axum::Json;
use crate::order_deadline_clock::SystemOrderDeadlineClock;
use chrono::Utc;
use serde_json::json;
use sha3::{Digest, Keccak256};
use std::sync::Arc;
use tokio::sync::RwLock;
use traveltrust_core::OrderState;
use uuid::Uuid;

fn test_order_deadline_clock() -> SystemOrderDeadlineClock {
    SystemOrderDeadlineClock
}

#[test]
fn event_name_from_topic0_escrow_created() {
    let sig = b"EscrowCreated(bytes32,address)";
    let topic0 = format!("0x{}", hex::encode(Keccak256::digest(sig)));
    assert_eq!(event_name_from_topic0(&topic0), Some("EscrowCreated"));
}

#[test]
fn event_name_from_topic0_released() {
    let sig = b"Released(bytes32,address,uint256,uint256)";
    let topic0 = format!("0x{}", hex::encode(Keccak256::digest(sig)));
    assert_eq!(event_name_from_topic0(&topic0), Some("Released"));
}

#[test]
fn event_name_from_topic0_unknown_returns_none() {
    assert_eq!(
        event_name_from_topic0(
            "0x0000000000000000000000000000000000000000000000000000000000000000"
        ),
        None
    );
}

#[test]
fn event_name_from_topic0_platform_fee_routed() {
    let sig = b"PlatformFeeRouted(address,uint256,uint256,uint256,uint256,uint256)";
    let topic0 = format!("0x{}", hex::encode(Keccak256::digest(sig)));
    assert_eq!(event_name_from_topic0(&topic0), Some("PlatformFeeRouted"));
}

#[test]
fn event_name_from_topic0_region_vault_forwarded() {
    let sig = b"RegionVaultForwarded(address,address,uint256)";
    let topic0 = format!("0x{}", hex::encode(Keccak256::digest(sig)));
    assert_eq!(
        event_name_from_topic0(&topic0),
        Some("RegionVaultForwarded")
    );
}

#[test]
fn parse_platform_fee_routed_decodes_words() {
    let token_topic =
        "0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string();
    let topics = vec!["0xsig".to_string(), token_topic];
    let mut data = Vec::new();
    for v in [1u8, 2, 3, 4, 5] {
        let mut w = [0u8; 32];
        w[31] = v;
        data.extend_from_slice(&w);
    }
    let data_hex = format!("0x{}", hex::encode(&data));
    let (token, words) = parse_platform_fee_routed(&topics, &json!(data_hex)).unwrap();
    assert_eq!(token, "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    assert_eq!(
        words[0],
        "0x0000000000000000000000000000000000000000000000000000000000000001"
    );
    assert_eq!(
        words[4],
        "0x0000000000000000000000000000000000000000000000000000000000000005"
    );
}

#[test]
fn parse_region_vault_forwarded_decodes_token_to_amount() {
    let token_topic =
        "0x000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".to_string();
    let to_topic = "0x000000000000000000000000cccccccccccccccccccccccccccccccccccccccc".to_string();
    let topics = vec!["0xsig".to_string(), token_topic, to_topic];
    let mut w = [0u8; 32];
    w[31] = 42;
    let data_hex = format!("0x{}", hex::encode(&w));
    let (token, to, amount) = parse_region_vault_forwarded(&topics, &json!(data_hex)).unwrap();
    assert_eq!(token, "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    assert_eq!(to, "0xcccccccccccccccccccccccccccccccccccccccc");
    assert_eq!(
        amount,
        "0x000000000000000000000000000000000000000000000000000000000000002a"
    );
}

/// B-116-2-2：`reconcile` topic0 与 `chain/*_verify` 委托一致，且 `event_name_from_topic0` 可反查事件名。
#[test]
fn economic_events_topic0_ssot_matches_chain_verify_modules() {
    use crate::chain::fee_router_verify::platform_fee_routed_topic0_hex as fr_topic0;
    use crate::chain::region_vault_verify::region_vault_forwarded_topic0_hex as rv_topic0;
    assert_eq!(
        platform_fee_routed_topic0_hex().to_ascii_lowercase(),
        fr_topic0().to_ascii_lowercase()
    );
    assert_eq!(
        region_vault_forwarded_topic0_hex().to_ascii_lowercase(),
        rv_topic0().to_ascii_lowercase()
    );
    assert_eq!(
        event_name_from_topic0(&platform_fee_routed_topic0_hex()),
        Some("PlatformFeeRouted")
    );
    assert_eq!(
        event_name_from_topic0(&region_vault_forwarded_topic0_hex()),
        Some("RegionVaultForwarded")
    );
}

#[test]
fn parse_platform_fee_routed_rejects_insufficient_topics() {
    let topics = vec![platform_fee_routed_topic0_hex()];
    let data = json!("0x0000000000000000000000000000000000000000000000000000000000000001");
    assert!(parse_platform_fee_routed(&topics, &data).is_none());
}

#[test]
fn parse_platform_fee_routed_rejects_short_data() {
    let token_topic =
        "0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string();
    let topics = vec![platform_fee_routed_topic0_hex(), token_topic];
    let data = json!("0x00");
    assert!(parse_platform_fee_routed(&topics, &data).is_none());
}

#[test]
fn parse_platform_fee_routed_rejects_non_string_data() {
    let token_topic =
        "0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string();
    let topics = vec![platform_fee_routed_topic0_hex(), token_topic];
    assert!(parse_platform_fee_routed(&topics, &json!({})).is_none());
}

#[test]
fn parse_region_vault_forwarded_rejects_insufficient_topics() {
    let topics = vec![
        region_vault_forwarded_topic0_hex(),
        "0x000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".to_string(),
    ];
    let data = json!("0x0000000000000000000000000000000000000000000000000000000000000001");
    assert!(parse_region_vault_forwarded(&topics, &data).is_none());
}

#[test]
fn parse_region_vault_forwarded_rejects_short_data() {
    let topics = vec![
        region_vault_forwarded_topic0_hex(),
        "0x000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".to_string(),
        "0x000000000000000000000000cccccccccccccccccccccccccccccccccccccccc".to_string(),
    ];
    let data = json!("0x00");
    assert!(parse_region_vault_forwarded(&topics, &data).is_none());
}

#[test]
fn parse_order_id_and_escrow_from_topics_minimal() {
    let id = Uuid::new_v4();
    let mut bytes = [0u8; 32];
    bytes[16..32].copy_from_slice(id.as_bytes());
    let topics = vec!["0xsig".to_string(), format!("0x{}", hex::encode(bytes))];
    let (parsed_id, escrow) = parse_order_id_and_escrow_from_topics(&topics, false).unwrap();
    assert_eq!(parsed_id, id);
    assert_eq!(escrow, None);
}

#[test]
fn parse_order_id_and_escrow_from_topics_with_escrow() {
    let id = Uuid::new_v4();
    let mut bytes = [0u8; 32];
    bytes[16..32].copy_from_slice(id.as_bytes());
    let topics = vec![
        "0xsig".to_string(),
        format!("0x{}", hex::encode(bytes)),
        "0x0000000000000000000000000000000000001234".to_string(),
    ];
    let (parsed_id, escrow) = parse_order_id_and_escrow_from_topics(&topics, true).unwrap();
    assert_eq!(parsed_id, id);
    assert_eq!(
        escrow.as_deref(),
        Some("0x0000000000000000000000000000000000001234")
    );
}

#[test]
fn parse_order_id_and_escrow_from_topics_too_few_returns_none() {
    let topics = vec!["0xonly".to_string()];
    assert!(parse_order_id_and_escrow_from_topics(&topics, false).is_none());
}

#[test]
fn parse_order_id_bytes32_roundtrip_with_uuid_tail() {
    let id = Uuid::new_v4();
    let mut bytes = [0u8; 32];
    bytes[16..32].copy_from_slice(id.as_bytes());
    let topics = vec!["0xsig".to_string(), format!("0x{}", hex::encode(bytes))];
    let raw = parse_order_id_bytes32_from_topics(&topics).unwrap();
    assert_eq!(raw, bytes);
}

// ---------- P15 行程生成逻辑、Draft 写入可测 ----------
#[test]
fn generate_itinerary_mock_returns_version1_structure() {
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "北京".to_string(),
        travel_date: "2025-06-01".to_string(),
        days: 3,
        cities: None,
        hotel_type: Some("舒适型".to_string()),
        food_preference: Some("当地特色".to_string()),
        transport: Some("地铁".to_string()),
        budget_min: Some(2000.0),
        budget_max: Some(3000.0),
        notes: None,
        guide_id: None,
    };
    let (days, amount) = generate_itinerary_mock(&body);
    assert_eq!(days.len(), 3);
    assert!(days[0].content_text.contains("北京"));
    assert_eq!(amount.total_budget, 2500.0); // (2000+3000)/2
    assert!(amount.hotel > 0.0);
    assert!(amount.guide_fee > 0.0);
}

/// 56-S3 多城市契约：传入 cities 时 mock 仅产出所选城市，天数=len(cities)，不生成未选城市
#[test]
fn generate_itinerary_mock_multi_city_56_s3() {
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "北京".to_string(),
        travel_date: "2025-06-01".to_string(),
        days: 5,
        cities: Some(vec![
            "北京".to_string(),
            "上海".to_string(),
            "杭州".to_string(),
        ]),
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(3000.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let (days, _amount) = generate_itinerary_mock(&body);
    assert_eq!(days.len(), 3, "output only selected cities, 3 days");
    assert_eq!(days[0].city.as_deref(), Some("北京"));
    assert_eq!(days[1].city.as_deref(), Some("上海"));
    assert_eq!(days[2].city.as_deref(), Some("杭州"));
    assert!(days[0].content_text.contains("第1天：北京"));
    assert!(days[1].content_text.contains("第2天：上海"));
    assert!(days[2].content_text.contains("第3天：杭州"));
}

#[tokio::test]
async fn itinerary_create_impl_stores_draft_order_and_bundle() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "上海".to_string(),
        travel_date: "2025-07-01".to_string(),
        days: 2,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(1000.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let res = itinerary_create_impl(state.clone(), user_id, Json(body)).await;
    let Ok(Json(json)) = res else {
        panic!("itinerary_create_impl should succeed");
    };
    assert_eq!(json["status"], "ok");
    assert_eq!(json["version"], 1);
    assert_eq!(json["order_status"], "draft");
    let order_id = Uuid::parse_str(json["order_id"].as_str().unwrap()).unwrap();
    let store = state.store.read().await;
    let order = store.orders.get(&order_id).expect("order should exist");
    assert_eq!(order.state, OrderState::Draft);
    assert_eq!(order.tourist_id, user_id);
    let bundle = store
        .itineraries
        .get(&order_id)
        .expect("itinerary bundle should exist");
    assert_eq!(bundle.version, 1);
    assert_eq!(bundle.days.len(), 2);
    assert_eq!(bundle.amount_breakdown.total_budget, 1000.0);
}

#[tokio::test]
async fn itinerary_create_impl_with_guide_id_persists_guide_on_order() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let guide_row_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    store.guides.insert(
        guide_row_id,
        GuideRow {
            id: guide_row_id,
            user_id: guide_user_id,
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
        },
    );
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "杭州".to_string(),
        travel_date: "2025-08-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(500.0),
        budget_max: None,
        notes: None,
        guide_id: Some(guide_row_id.to_string()),
    };
    let res = itinerary_create_impl(state.clone(), user_id, Json(body)).await;
    let Ok(Json(json)) = res else {
        panic!("itinerary_create_impl should succeed");
    };
    let order_id = Uuid::parse_str(json["order_id"].as_str().unwrap()).unwrap();
    let store = state.store.read().await;
    let order = store.orders.get(&order_id).expect("order");
    assert_eq!(order.guide_id, guide_row_id);
}

#[tokio::test]
async fn itinerary_create_impl_invalid_guide_id_returns_400() {
    let state = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "杭州".to_string(),
        travel_date: "2025-08-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(100.0),
        budget_max: None,
        notes: None,
        guide_id: Some("not-a-uuid".to_string()),
    };
    let res = itinerary_create_impl(state, Uuid::new_v4(), Json(body)).await;
    let Err((status, Json(json))) = res else {
        panic!("expected 400");
    };
    assert_eq!(status.as_u16(), 400);
    assert_eq!(json["error"], "invalid_guide_id");
}

#[tokio::test]
async fn itinerary_create_impl_unknown_guide_id_returns_guide_not_found() {
    let state = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let missing = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "杭州".to_string(),
        travel_date: "2025-08-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(100.0),
        budget_max: None,
        notes: None,
        guide_id: Some(missing.to_string()),
    };
    let res = itinerary_create_impl(state, Uuid::new_v4(), Json(body)).await;
    let Err((status, Json(json))) = res else {
        panic!("expected 400");
    };
    assert_eq!(status.as_u16(), 400);
    assert_eq!(json["error"], "guide_not_found");
}

#[tokio::test]
async fn itinerary_create_impl_invalid_destination_country_returns_400() {
    let state = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let body = CreateItineraryBody {
        destination: "意大利".to_string(),
        city: "罗马".to_string(),
        travel_date: "2025-08-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(100.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let res = itinerary_create_impl(state, Uuid::new_v4(), Json(body)).await;
    let Err((status, Json(json))) = res else {
        panic!("expected 400");
    };
    assert_eq!(status.as_u16(), 400);
    assert_eq!(json["error"], "invalid_destination_country");
}

#[tokio::test]
async fn itinerary_create_impl_invalid_city_for_country_returns_400() {
    let state = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "巴黎".to_string(),
        travel_date: "2025-08-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(100.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let res = itinerary_create_impl(state, Uuid::new_v4(), Json(body)).await;
    let Err((status, Json(json))) = res else {
        panic!("expected 400");
    };
    assert_eq!(status.as_u16(), 400);
    assert_eq!(json["error"], "invalid_city_for_country");
}

#[tokio::test]
async fn itinerary_create_impl_cities_array_non_preset_returns_400() {
    let state = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "北京".to_string(),
        travel_date: "2025-08-01".to_string(),
        days: 3,
        cities: Some(vec!["北京".to_string(), "巴黎".to_string()]),
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(100.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let res = itinerary_create_impl(state, Uuid::new_v4(), Json(body)).await;
    let Err((status, Json(json))) = res else {
        panic!("expected 400");
    };
    assert_eq!(status.as_u16(), 400);
    assert_eq!(json["error"], "invalid_city_for_country");
}

#[tokio::test]
async fn patch_order_itinerary_impl_invalid_city_returns_400() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "北京".to_string(),
        travel_date: "2025-08-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(500.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let Ok(Json(j)) = itinerary_create_impl(state.clone(), user_id, Json(body)).await else {
        panic!("create");
    };
    let order_id = Uuid::parse_str(j["order_id"].as_str().unwrap()).unwrap();

    let patch = PatchItineraryBody {
        daily_itinerary: Some(vec![ItineraryDayRow {
            day_index: 1,
            city: Some("巴黎".to_string()),
            content_text: "day1".to_string(),
            ..Default::default()
        }]),
        amount_breakdown: None,
    };
    let res = patch_order_itinerary_impl(state, None, order_id, user_id, Json(patch)).await;
    let Err((status, Json(err))) = res else {
        panic!("expected 400");
    };
    assert_eq!(status.as_u16(), 400);
    assert_eq!(err["error"], "invalid_city_for_country");
}

#[tokio::test]
async fn patch_order_itinerary_impl_accepts_preset_city() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "北京".to_string(),
        travel_date: "2025-08-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(500.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let Ok(Json(j)) = itinerary_create_impl(state.clone(), user_id, Json(body)).await else {
        panic!("create");
    };
    let order_id = Uuid::parse_str(j["order_id"].as_str().unwrap()).unwrap();

    let patch = PatchItineraryBody {
        daily_itinerary: Some(vec![ItineraryDayRow {
            day_index: 1,
            city: Some("上海".to_string()),
            content_text: "updated".to_string(),
            ..Default::default()
        }]),
        amount_breakdown: None,
    };
    let res = patch_order_itinerary_impl(state.clone(), None, order_id, user_id, Json(patch)).await;
    let Ok(Json(out)) = res else {
        panic!("patch ok");
    };
    assert_eq!(out["status"], "ok");
    assert_eq!(out["version"], 2);
    let store = state.store.read().await;
    let b = store.itineraries.get(&order_id).expect("bundle");
    assert_eq!(b.days[0].city.as_deref(), Some("上海"));
}

#[tokio::test]
async fn patch_order_itinerary_impl_publishes_draft_to_market() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "北京".to_string(),
        travel_date: "2025-08-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(500.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let Ok(Json(j)) = itinerary_create_impl(state.clone(), user_id, Json(body)).await else {
        panic!("create");
    };
    let order_id = Uuid::parse_str(j["order_id"].as_str().unwrap()).unwrap();
    {
        let store = state.store.read().await;
        assert_eq!(
            store.orders.get(&order_id).expect("order").state,
            OrderState::Draft
        );
    }

    let patch = PatchItineraryBody {
        daily_itinerary: Some(vec![ItineraryDayRow {
            day_index: 1,
            city: Some("北京".to_string()),
            content_text: "publish save".to_string(),
            ..Default::default()
        }]),
        amount_breakdown: None,
    };
    let Ok(Json(out)) =
        patch_order_itinerary_impl(state.clone(), None, order_id, user_id, Json(patch)).await
    else {
        panic!("patch ok");
    };
    assert_eq!(out["status"], "ok");
    assert_eq!(out["published_to_market"], true);
    assert_eq!(out["order_state"], "created");
    let store = state.store.read().await;
    assert_eq!(
        store.orders.get(&order_id).expect("order").state,
        OrderState::Created
    );
}

/// 07 §5.2：非产品期中文 `destination` 的存量行程包，PATCH 不强制 `daily_itinerary[].city` 落在 preset 清单。
#[tokio::test]
async fn patch_order_itinerary_impl_non_product_destination_skips_city_validation() {
    let user_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let now = Utc::now();
    let mut store = ChainOffStore::default();
    store.orders.insert(
        order_id,
        OrderRow {
            id: order_id,
            tourist_id: user_id,
            guide_id: Uuid::nil(),
            amount: "100.00".to_string(),
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
        },
    );
    store.itineraries.insert(
        order_id,
        ItineraryBundle {
            order_id,
            version: 1,
            destination: "意大利".to_string(),
            city: "罗马".to_string(),
            days: vec![ItineraryDayRow {
                day_index: 1,
                city: Some("罗马".to_string()),
                content_text: "old".to_string(),
                ..Default::default()
            }],
            amount_breakdown: AmountBreakdown {
                hotel: 0.0,
                catering: 0.0,
                tickets: 0.0,
                guide_fee: 0.0,
                vehicle: 0.0,
                platform_fee: 0.0,
                total_budget: 100.0,
            },
            snapshot_hash: None,
            cover_image: None,
        },
    );
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let patch = PatchItineraryBody {
        daily_itinerary: Some(vec![ItineraryDayRow {
            day_index: 1,
            city: Some("威尼斯（非预设清单）".to_string()),
            content_text: "updated".to_string(),
            ..Default::default()
        }]),
        amount_breakdown: None,
    };
    let res = patch_order_itinerary_impl(state.clone(), None, order_id, user_id, Json(patch)).await;
    let Ok(Json(out)) = res else {
        panic!("expected ok for legacy non-product destination");
    };
    assert_eq!(out["status"], "ok");
    assert_eq!(out["version"], 2);
    let store = state.store.read().await;
    let b = store.itineraries.get(&order_id).expect("bundle");
    assert_eq!(b.days[0].city.as_deref(), Some("威尼斯（非预设清单）"));
}

// ---------- 49 A：POST /itineraries/custom 自定义行程 Draft + Bundle ----------
#[tokio::test]
async fn itinerary_custom_create_impl_tourist_stores_draft_and_bundle() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body: CustomItineraryBody = serde_json::from_value(serde_json::json!({
        "creator_type": "tourist",
        "country": "中国",
        "total_days": 2,
        "amount": 1500,
        "currency": "USD",
        "day_plans": [
            { "city": "Beijing", "attractions": ["故宫"], "food": [], "hotel": "Hotel A" },
            { "city": "Shanghai", "attractions": [], "food": ["小笼"], "hotel": null }
        ]
    }))
    .unwrap();
    let res = itinerary_custom_create_impl(state.clone(), user_id, Json(body)).await;
    let Ok(Json(json)) = res else {
        panic!("itinerary_custom_create_impl should succeed");
    };
    assert_eq!(json["status"], "ok");
    assert_eq!(json["order_status"], "draft");
    assert!(json.get("order_id").is_some());
    let order_id = Uuid::parse_str(json["order_id"].as_str().unwrap()).unwrap();
    let store = state.store.read().await;
    let order = store.orders.get(&order_id).expect("order should exist");
    assert_eq!(order.state, OrderState::Draft);
    assert_eq!(order.tourist_id, user_id);
    let bundle = store
        .itineraries
        .get(&order_id)
        .expect("itinerary bundle should exist");
    assert_eq!(bundle.version, 1);
    assert_eq!(bundle.days.len(), 2);
    assert!(bundle.days[0].content_text.contains("Beijing"));
    assert!(bundle.days[1].content_text.contains("Shanghai"));
    assert_eq!(bundle.amount_breakdown.total_budget, 1500.0);
}

#[tokio::test]
async fn itinerary_custom_create_impl_explicit_breakdown_fees() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body: CustomItineraryBody = serde_json::from_value(serde_json::json!({
        "creator_type": "tourist",
        "country": "中国",
        "total_days": 1,
        "amount": 1000,
        "breakdown": {
            "guide_fee": 150,
            "car_fee": 80,
            "attractions_fee": 36,
            "food_fee": 20,
            "hotel_fee": 83
        },
        "day_plans": [
            { "city": "Beijing", "attractions": ["故宫"], "food": ["烤鸭"], "hotel": "tier_comfort" }
        ]
    }))
    .unwrap();
    let res = itinerary_custom_create_impl(state.clone(), user_id, Json(body)).await;
    let Ok(Json(json)) = res else {
        panic!("itinerary_custom_create_impl should succeed");
    };
    assert_eq!(json["status"], "ok");
    let order_id = Uuid::parse_str(json["order_id"].as_str().unwrap()).unwrap();
    let store = state.store.read().await;
    let bundle = store
        .itineraries
        .get(&order_id)
        .expect("itinerary bundle should exist");
    let bd = &bundle.amount_breakdown;
    assert_eq!(bd.tickets, 36.0);
    assert_eq!(bd.catering, 20.0);
    assert_eq!(bd.hotel, 83.0);
    assert_eq!(bd.guide_fee, 150.0);
    assert_eq!(bd.vehicle, 80.0);
    assert_eq!(bd.total_budget, 1000.0);
}

#[tokio::test]
async fn itinerary_custom_create_impl_with_guide_id_persists_guide_on_order() {
    let mut store = ChainOffStore::default();
    let now = Utc::now();
    let guide_row_id = Uuid::new_v4();
    let guide_user_id = Uuid::new_v4();
    store.guides.insert(
        guide_row_id,
        GuideRow {
            id: guide_row_id,
            user_id: guide_user_id,
            city: "Beijing".to_string(),
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
        },
    );
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body: CustomItineraryBody = serde_json::from_value(serde_json::json!({
        "creator_type": "tourist",
        "country": "中国",
        "total_days": 1,
        "amount": 800,
        "currency": "USD",
        "guide_id": guide_row_id.to_string(),
        "day_plans": [{ "city": "Beijing", "attractions": ["故宫"], "food": [], "hotel": "Hotel A" }]
    }))
    .unwrap();
    let res = itinerary_custom_create_impl(state.clone(), user_id, Json(body)).await;
    let Ok(Json(json)) = res else {
        panic!("itinerary_custom_create_impl should succeed");
    };
    let order_id = Uuid::parse_str(json["order_id"].as_str().unwrap()).unwrap();
    let store = state.store.read().await;
    let order = store.orders.get(&order_id).expect("order");
    assert_eq!(order.guide_id, guide_row_id);
}

#[tokio::test]
async fn itinerary_custom_create_impl_invalid_guide_id_returns_400() {
    let state = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let body: CustomItineraryBody = serde_json::from_value(serde_json::json!({
        "creator_type": "tourist",
        "country": "中国",
        "total_days": 1,
        "amount": 500,
        "guide_id": "bad-uuid",
        "day_plans": [{ "city": "Beijing", "attractions": [], "food": [], "hotel": null }]
    }))
    .unwrap();
    let res = itinerary_custom_create_impl(state, Uuid::new_v4(), Json(body)).await;
    let Err((status, Json(json))) = res else {
        panic!("expected 400");
    };
    assert_eq!(status.as_u16(), 400);
    assert_eq!(json["error"], "invalid_guide_id");
}

#[tokio::test]
async fn itinerary_custom_create_impl_unknown_guide_id_returns_guide_not_found() {
    let state = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let missing = Uuid::new_v4();
    let body: CustomItineraryBody = serde_json::from_value(serde_json::json!({
        "creator_type": "tourist",
        "country": "中国",
        "total_days": 1,
        "amount": 500,
        "guide_id": missing.to_string(),
        "day_plans": [{ "city": "Beijing", "attractions": [], "food": [], "hotel": null }]
    }))
    .unwrap();
    let res = itinerary_custom_create_impl(state, Uuid::new_v4(), Json(body)).await;
    let Err((status, Json(json))) = res else {
        panic!("expected 400");
    };
    assert_eq!(status.as_u16(), 400);
    assert_eq!(json["error"], "guide_not_found");
}

/// 55-S1 验收可自动化：POST /itineraries/custom → GET /api/v1/orders 含该订单且 state=Draft；GET /api/v1/discover/orders 含该订单（前端列表 UI 为 `/market`）
#[tokio::test]
async fn s55_custom_create_then_orders_and_discover_contain_draft() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body: CustomItineraryBody = serde_json::from_value(serde_json::json!({
        "creator_type": "tourist",
        "country": "中国",
        "total_days": 1,
        "amount": 2000,
        "currency": "USD",
        "day_plans": [{ "city": "Hangzhou", "attractions": ["西湖"], "food": [], "hotel": "Hotel B" }]
    }))
    .unwrap();
    let res = itinerary_custom_create_impl(state.clone(), user_id, Json(body)).await;
    let Ok(Json(json)) = res else {
        panic!("itinerary_custom_create_impl should succeed");
    };
    assert_eq!(json["status"], "ok");
    assert_eq!(json["order_status"], "draft");
    let order_id = Uuid::parse_str(json["order_id"].as_str().unwrap()).unwrap();

    let Json(orders) = orders_list_impl(
        state.clone(),
        &test_order_deadline_clock(),
        None,
        user_id,
        OrderListPage::default(),
        None,
        None,
        None,
        None,
    )
        .await
        .expect("orders_list_impl");
    let items = orders["items"].as_array().expect("items");
    assert!(!items.is_empty());
    let found = items.iter().find(|o| {
        o["order_id"]
            .as_str()
            .map(|s| Uuid::parse_str(s).ok() == Some(order_id))
            .unwrap_or(false)
    });
    assert!(
        found.is_some(),
        "GET /api/v1/orders should contain the created order"
    );
    assert_eq!(found.unwrap()["status"], "draft");

    let Json(discover) =
        discover_orders_list_impl(state.clone(), None, None, None, OrderListPage::default())
            .await
            .expect("discover_orders_list_impl");
    let discover_items = discover["items"].as_array().expect("items");
    assert!(
        discover_items.iter().any(|o| o["id"]
            .as_str()
            .map(|s| Uuid::parse_str(s).ok() == Some(order_id))
            .unwrap_or(false)),
        "GET /api/v1/discover/orders should contain the same order_id"
    );
    let disc_card = discover_items
        .iter()
        .find(|o| {
            o["id"]
                .as_str()
                .map(|s| Uuid::parse_str(s).ok() == Some(order_id))
                .unwrap_or(false)
        })
        .expect("discover card for new draft");
    assert!(
        disc_card.get("escrow_address").is_some(),
        "discover item must include escrow_address key (04/14 与 GET /api/v1/orders 同源)"
    );
    assert!(disc_card["escrow_address"].is_null());
    let it = disc_card["itinerary"]
        .as_object()
        .expect("discover card itinerary");
    let daily = it["daily_itinerary"].as_array().expect("daily_itinerary");
    assert!(
        !daily.is_empty(),
        "discover card should embed daily_itinerary (52/07 与 GET order 同源)"
    );
    assert!(it["amount_breakdown"].is_object());
    assert!(disc_card["breakdown"].is_object());
}

/// `GET /api/v1/discover/orders` 卡片 **itinerary** 与 **`GET /api/v1/orders/:id`** 响应 **itinerary** 字节级一致（04 §3.4 / 07 §5.2）
#[tokio::test]
async fn discover_card_itinerary_matches_order_get() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body: CustomItineraryBody = serde_json::from_value(serde_json::json!({
        "creator_type": "tourist",
        "country": "中国",
        "total_days": 2,
        "amount": 3500,
        "currency": "USD",
        "day_plans": [
            { "city": "上海", "attractions": ["外滩"], "food": [], "hotel": null },
            { "city": "上海", "attractions": ["豫园"], "food": [], "hotel": null }
        ]
    }))
    .unwrap();
    let Ok(Json(create_json)) =
        itinerary_custom_create_impl(state.clone(), user_id, Json(body)).await
    else {
        panic!("itinerary_custom_create_impl should succeed");
    };
    let order_id = Uuid::parse_str(create_json["order_id"].as_str().unwrap()).unwrap();

    let Json(get_body) = order_get_impl(
        state.clone(),
        &test_order_deadline_clock(),
        None,
        order_id,
        user_id,
    )
        .await
        .expect("order_get_impl");
    let Json(discover) =
        discover_orders_list_impl(state.clone(), None, None, None, OrderListPage::default())
            .await
            .expect("discover_orders_list_impl");
    let disc_card = discover["items"]
        .as_array()
        .expect("items")
        .iter()
        .find(|o| {
            o["id"]
                .as_str()
                .map(|s| Uuid::parse_str(s).ok() == Some(order_id))
                .unwrap_or(false)
        })
        .expect("discover card for order");

    let get_it = get_body["itinerary"]
        .as_object()
        .expect("GET order itinerary");
    let disc_it = disc_card["itinerary"]
        .as_object()
        .expect("discover itinerary");
    assert_eq!(
        get_it["daily_itinerary"], disc_it["daily_itinerary"],
        "daily_itinerary must match order_get"
    );
    assert_eq!(
        get_it["amount_breakdown"], disc_it["amount_breakdown"],
        "amount_breakdown must match order_get"
    );
    assert_eq!(get_it["version"], disc_it["version"]);
    assert_eq!(get_it["snapshot_hash"], disc_it["snapshot_hash"]);

    // 卡片 breakdown（29 §9 预览键名）与 bundle.amount_breakdown 逐项对齐（discover_card_json）
    {
        let st = state.store.read().await;
        let bundle = st.itineraries.get(&order_id).expect("bundle");
        let ab = &bundle.amount_breakdown;
        let br = disc_card["breakdown"]
            .as_object()
            .expect("discover breakdown");
        let n = |k: &str| -> f64 {
            br[k]
                .as_f64()
                .unwrap_or_else(|| panic!("breakdown.{k} must be JSON number"))
        };
        let close = |a: f64, b: f64| (a - b).abs() < 1e-6;
        assert!(close(n("guideFee"), ab.guide_fee), "guideFee");
        assert!(close(n("carFee"), ab.vehicle), "carFee=vehicle");
        assert!(close(n("hotel"), ab.hotel), "hotel");
        assert!(close(n("food"), ab.catering), "food=catering");
        assert!(close(n("tickets"), ab.tickets), "tickets");
        assert!(close(n("misc"), ab.platform_fee), "misc=platform_fee");
    }
    // 与嵌套 itinerary.amount_breakdown 同源字段可互算（前端 merge 依赖）
    let br = disc_card["breakdown"].as_object().expect("breakdown");
    let disc_ab = disc_it["amount_breakdown"]
        .as_object()
        .expect("amount_breakdown");
    let nf = |v: &serde_json::Value| v.as_f64().expect("number");
    assert!((nf(&br["guideFee"]) - nf(&disc_ab["guide_fee"])).abs() < 1e-6);
    assert!((nf(&br["carFee"]) - nf(&disc_ab["vehicle"])).abs() < 1e-6);
    assert!((nf(&br["misc"]) - nf(&disc_ab["platform_fee"])).abs() < 1e-6);

    // GET /api/v1/orders 列表项与 discover 卡片同形 breakdown + itinerary（07 §5.1）
    let Json(orders_list) = orders_list_impl(
        state.clone(),
        &test_order_deadline_clock(),
        None,
        user_id,
        OrderListPage::default(),
        None,
        None,
        None,
        None,
    )
        .await
        .expect("orders_list_impl");
    let list_item = orders_list["items"]
        .as_array()
        .expect("items")
        .iter()
        .find(|o| {
            o["id"]
                .as_str()
                .map(|s| Uuid::parse_str(s).ok() == Some(order_id))
                .unwrap_or(false)
        })
        .expect("orders list item for same order");
    assert_eq!(list_item["itinerary"], disc_card["itinerary"]);
    assert_eq!(list_item["breakdown"], disc_card["breakdown"]);
}

#[tokio::test]
async fn itinerary_custom_create_impl_invalid_days_returns_400() {
    let state = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let body: CustomItineraryBody = serde_json::from_value(serde_json::json!({
        "creator_type": "tourist",
        "country": "中国",
        "total_days": 0,
        "amount": 1000,
        "day_plans": [{ "city": "Beijing", "attractions": [], "food": [], "hotel": null }]
    }))
    .unwrap();
    let res = itinerary_custom_create_impl(state, Uuid::new_v4(), Json(body)).await;
    let Err((status, Json(json))) = res else {
        panic!("expected 400");
    };
    assert_eq!(status.as_u16(), 400);
    assert_eq!(json["error"], "invalid_days");
}

#[tokio::test]
async fn itinerary_custom_create_impl_invalid_country_returns_400() {
    let state = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let body: CustomItineraryBody = serde_json::from_value(serde_json::json!({
        "creator_type": "tourist",
        "country": "意大利",
        "total_days": 1,
        "amount": 1000,
        "day_plans": [{ "city": "罗马", "attractions": [], "food": [], "hotel": null }]
    }))
    .unwrap();
    let res = itinerary_custom_create_impl(state, Uuid::new_v4(), Json(body)).await;
    let Err((status, Json(json))) = res else {
        panic!("expected 400");
    };
    assert_eq!(status.as_u16(), 400);
    assert_eq!(json["error"], "invalid_destination_country");
}

// ---------- P16 门禁：snapshotHash 生成可测、Discover→聊天→确认 可调通 ----------
#[tokio::test]
async fn confirm_final_plan_impl_stores_snapshot_hash() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "杭州".to_string(),
        travel_date: "2025-08-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(500.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let res = itinerary_create_impl(state.clone(), user_id, Json(body)).await;
    let Ok(Json(json)) = res else {
        panic!("itinerary_create_impl should succeed");
    };
    let order_id = Uuid::parse_str(json["order_id"].as_str().unwrap()).unwrap();

    let confirm_body = ConfirmFinalPlanBody {
        expected_version: 1,
    };
    let confirm_res =
        confirm_final_plan_impl(state.clone(), None, order_id, user_id, confirm_body).await;
    let Ok(Json(confirm_json)) = confirm_res else {
        panic!("confirm_final_plan_impl should succeed");
    };
    let hash = confirm_json["snapshot_hash"]
        .as_str()
        .expect("snapshot_hash");
    assert!(hash.starts_with("0x"));
    assert_eq!(hash.len(), 66); // 0x + 64 hex
    assert!(hash[2..].chars().all(|c| c.is_ascii_hexdigit()));

    let store = state.store.read().await;
    let bundle = store.itineraries.get(&order_id).expect("bundle");
    assert_eq!(bundle.snapshot_hash.as_deref(), Some(hash));
}

/// 50-80-2：乐观锁 wrong expected_version 返回 409
#[tokio::test]
async fn confirm_final_plan_version_conflict_returns_409() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "杭州".to_string(),
        travel_date: "2025-08-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(500.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let res = itinerary_create_impl(state.clone(), user_id, Json(body)).await;
    let Ok(Json(json)) = res else {
        panic!("create should succeed");
    };
    let order_id = Uuid::parse_str(json["order_id"].as_str().unwrap()).unwrap();
    let wrong_body = ConfirmFinalPlanBody {
        expected_version: 99,
    };
    let err_res = confirm_final_plan_impl(state.clone(), None, order_id, user_id, wrong_body).await;
    let Err((code, Json(err_json))) = err_res else {
        panic!("expected 409");
    };
    assert_eq!(code, axum::http::StatusCode::CONFLICT);
    assert_eq!(err_json["error"].as_str(), Some("version_conflict"));
    assert_eq!(err_json["current_version"], 1);
    assert_eq!(err_json["expected_version"], 99);
}

#[tokio::test]
async fn discover_orders_list_includes_draft() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "西安".to_string(),
        travel_date: "2025-09-01".to_string(),
        days: 2,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(800.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let _ = itinerary_create_impl(state.clone(), user_id, Json(body)).await;

    let Json(discover) =
        discover_orders_list_impl(state.clone(), None, None, None, OrderListPage::default())
            .await
            .expect("discover");
    let items = discover["items"].as_array().expect("items");
    assert!(!items.is_empty());
    let first = &items[0];
    assert_eq!(first["destination"], "中国");
    assert_eq!(first["city"], "西安");
    assert_eq!(first["days"], 2);

    let Json(discover_city) = discover_orders_list_impl(
        state.clone(),
        None,
        Some("西安".to_string()),
        None,
        OrderListPage::default(),
    )
    .await
    .expect("discover_city");
    assert_eq!(discover_city["items"].as_array().unwrap().len(), 1);
    let Json(discover_nomatch) = discover_orders_list_impl(
        state.clone(),
        None,
        Some("其他".to_string()),
        None,
        OrderListPage::default(),
    )
    .await
    .expect("discover_nomatch");
    assert!(discover_nomatch["items"].as_array().unwrap().is_empty());
}

#[tokio::test]
async fn discover_orders_list_includes_created_without_guide() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "成都".to_string(),
        travel_date: "2025-10-01".to_string(),
        days: 3,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(1500.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let Ok(Json(create_json)) = itinerary_create_impl(state.clone(), user_id, Json(body)).await else {
        panic!("create itinerary");
    };
    let order_id = Uuid::parse_str(create_json["order_id"].as_str().unwrap()).unwrap();
    {
        let mut store = state.store.write().await;
        let order = store.orders.get_mut(&order_id).expect("order");
        order.state = OrderState::Created;
    }

    let Json(discover) =
        discover_orders_list_impl(state.clone(), None, None, None, OrderListPage::default())
            .await
            .expect("discover");
    let items = discover["items"].as_array().expect("items");
    assert!(
        items.iter().any(|o| o["id"].as_str().map(|s| Uuid::parse_str(s).ok()) == Some(Some(order_id))),
        "Created order without guide should appear in discover"
    );
    assert_eq!(items.iter().find(|o| o["id"].as_str() == Some(order_id.to_string().as_str())).unwrap()["state"], "created");

    {
        let mut store = state.store.write().await;
        let order = store.orders.get_mut(&order_id).expect("order");
        order.guide_id = Uuid::new_v4();
    }
    let Json(after_guide) =
        discover_orders_list_impl(state.clone(), None, None, None, OrderListPage::default())
            .await
            .expect("discover after guide");
    assert!(
        !after_guide["items"]
            .as_array()
            .unwrap()
            .iter()
            .any(|o| o["id"].as_str().map(|s| Uuid::parse_str(s).ok()) == Some(Some(order_id))),
        "order with guide assigned must not appear in discover"
    );
}

#[tokio::test]
async fn discover_orders_list_pagination_limit_and_cursor() {
    let _env = crate::test_env_serial::lock();
    let prev_pcs = std::env::var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE").ok();
    std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", "0");
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    for (dest, city) in [("中国", "北京"), ("中国", "上海"), ("日本", "东京")] {
        let body = CreateItineraryBody {
            destination: dest.to_string(),
            city: city.to_string(),
            travel_date: "2025-12-15".to_string(),
            days: 1,
            cities: None,
            hotel_type: None,
            food_preference: None,
            transport: None,
            budget_min: Some(100.0),
            budget_max: None,
            notes: None,
            guide_id: None,
        };
        let _ = itinerary_create_impl(state.clone(), user_id, Json(body)).await;
    }

    let Ok(Json(p1)) = discover_orders_list_impl(
        state.clone(),
        None,
        None,
        None,
        OrderListPage {
            limit: Some(2),
            cursor: None,
        },
    )
    .await
    else {
        panic!("page1");
    };
    assert_eq!(p1["items"].as_array().unwrap().len(), 2);
    assert_eq!(p1["page"]["has_more"], true);
    let next = p1["page"]["next_cursor"]
        .as_str()
        .expect("next_cursor")
        .to_string();
    let cid = Uuid::parse_str(&next).expect("uuid");

    let Ok(Json(p2)) = discover_orders_list_impl(
        state.clone(),
        None,
        None,
        None,
        OrderListPage {
            limit: Some(2),
            cursor: Some(cid),
        },
    )
    .await
    else {
        panic!("page2");
    };
    assert_eq!(p2["items"].as_array().unwrap().len(), 1);
    assert_eq!(p2["page"]["has_more"], false);
    match prev_pcs {
        Some(v) => std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", v),
        None => std::env::remove_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE"),
    }
}

/// 55-S12：`GET /api/v1/orders` 与 `GET /api/v1/discover/orders` 同源分页（limit/cursor/page）
#[tokio::test]
async fn orders_list_pagination_limit_and_cursor() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    for (dest, city) in [("中国", "广州"), ("中国", "厦门"), ("韩国", "首尔")] {
        let body = CreateItineraryBody {
            destination: dest.to_string(),
            city: city.to_string(),
            travel_date: "2025-12-20".to_string(),
            days: 1,
            cities: None,
            hotel_type: None,
            food_preference: None,
            transport: None,
            budget_min: Some(200.0),
            budget_max: None,
            notes: None,
            guide_id: None,
        };
        let _ = itinerary_create_impl(state.clone(), user_id, Json(body)).await;
    }

    let Ok(Json(p1)) = orders_list_impl(
        state.clone(),
        &test_order_deadline_clock(),
        None,
        user_id,
        OrderListPage {
            limit: Some(2),
            cursor: None,
        },
        None,
        None,
        None,
        None,
    )
    .await
    else {
        panic!("orders page1");
    };
    assert_eq!(p1["items"].as_array().unwrap().len(), 2);
    assert_eq!(p1["page"]["has_more"], true);
    let next = p1["page"]["next_cursor"]
        .as_str()
        .expect("next_cursor")
        .to_string();
    let cid = Uuid::parse_str(&next).expect("uuid");

    let Ok(Json(p2)) = orders_list_impl(
        state.clone(),
        &test_order_deadline_clock(),
        None,
        user_id,
        OrderListPage {
            limit: Some(2),
            cursor: Some(cid),
        },
        None,
        None,
        None,
        None,
    )
    .await
    else {
        panic!("orders page2");
    };
    assert_eq!(p2["items"].as_array().unwrap().len(), 1);
    assert_eq!(p2["page"]["has_more"], false);
}

#[tokio::test]
async fn messages_post_and_list_flow() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "成都".to_string(),
        travel_date: "2025-10-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(600.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let res = itinerary_create_impl(state.clone(), user_id, Json(body)).await;
    let Ok(Json(json)) = res else {
        panic!("itinerary_create_impl should succeed");
    };
    let order_id = Uuid::parse_str(json["order_id"].as_str().unwrap()).unwrap();

    let post_res = message_post_impl(
        state.clone(),
        order_id,
        user_id,
        Json(PostMessageBody {
            content: "Hello P16".to_string(),
        }),
    )
    .await;
    let Ok(Json(post_json)) = post_res else {
        panic!("message_post_impl should succeed");
    };
    assert_eq!(post_json["status"], "ok");
    assert_eq!(post_json["tourist_id"], user_id.to_string());
    assert_eq!(post_json["traveler_id"], user_id.to_string());

    let list_res = messages_list_impl(state.clone(), order_id, user_id).await;
    let Ok(Json(list_json)) = list_res else {
        panic!("messages_list_impl should succeed");
    };
    let items = list_json["items"].as_array().expect("items");
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["content"], "Hello P16");
    assert_eq!(list_json["tourist_id"], user_id.to_string());
    assert_eq!(list_json["traveler_id"], user_id.to_string());
}

/// 53-S7：列表项附带 sender_name / sender_avatar_url（与 04、前端 ChatBlock 可选字段一致）
#[tokio::test]
async fn messages_list_includes_sender_profile_when_user_in_store() {
    let user_id = Uuid::new_v4();
    let now = Utc::now();
    let mut store = ChainOffStore::default();
    store.users.insert(
        user_id,
        UserRow {
            id: user_id,
            email: "chat-profile@test.com".to_string(),
            password_hash: None,
            role: "tourist".to_string(),
            kyc_status: "none".to_string(),
            nickname: Some("  ChatNick  ".to_string()),
            avatar_url: Some("https://cdn.example/face.png".to_string()),
            default_wallet_address: None,
            created_at: now,
            updated_at: now,
        },
    );
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "成都".to_string(),
        travel_date: "2025-10-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(600.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let res = itinerary_create_impl(state.clone(), user_id, Json(body)).await;
    let Ok(Json(json)) = res else {
        panic!("itinerary_create_impl should succeed");
    };
    let order_id = Uuid::parse_str(json["order_id"].as_str().unwrap()).unwrap();

    let post_res = message_post_impl(
        state.clone(),
        order_id,
        user_id,
        Json(PostMessageBody {
            content: "with profile".to_string(),
        }),
    )
    .await;
    let Ok(Json(post_json)) = post_res else {
        panic!("message_post_impl should succeed");
    };
    assert_eq!(post_json["message"]["sender_name"], "ChatNick");
    assert_eq!(
        post_json["message"]["sender_avatar_url"],
        "https://cdn.example/face.png"
    );
    assert_eq!(post_json["tourist_id"], user_id.to_string());
    assert_eq!(post_json["traveler_id"], user_id.to_string());

    let Ok(Json(list_json)) = messages_list_impl(state.clone(), order_id, user_id).await else {
        panic!("messages_list_impl should succeed");
    };
    let items = list_json["items"].as_array().expect("items");
    assert_eq!(items.len(), 1);
    assert_eq!(items[0]["sender_name"], "ChatNick");
    assert_eq!(
        items[0]["sender_avatar_url"],
        "https://cdn.example/face.png"
    );
    assert_eq!(list_json["tourist_id"], user_id.to_string());
    assert_eq!(list_json["traveler_id"], user_id.to_string());
}

/// P16 门禁 2：Discover → Order Detail（有 itinerary）→ 聊天 → 确认 全流程可调通（单测内串联）
#[tokio::test]
async fn p16_integration_discover_chat_confirm_flow() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "大理".to_string(),
        travel_date: "2025-11-01".to_string(),
        days: 2,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(1200.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let res = itinerary_create_impl(state.clone(), user_id, Json(body)).await;
    let Ok(Json(create_json)) = res else {
        panic!("create should succeed");
    };
    let order_id = Uuid::parse_str(create_json["order_id"].as_str().unwrap()).unwrap();

    let Json(discover) =
        discover_orders_list_impl(state.clone(), None, None, None, OrderListPage::default())
            .await
            .expect("discover");
    let items = discover["items"].as_array().expect("items");
    assert!(items.iter().any(|o| o["id"]
        .as_str()
        .map(|s| Uuid::parse_str(s).ok() == Some(order_id))
        .unwrap_or(false)));

    let _ = message_post_impl(
        state.clone(),
        order_id,
        user_id,
        Json(PostMessageBody {
            content: "确认行程".to_string(),
        }),
    )
    .await;
    let Ok(Json(list)) = messages_list_impl(state.clone(), order_id, user_id).await else {
        panic!("messages list");
    };
    assert_eq!(list["items"].as_array().unwrap().len(), 1);

    let confirm_body = ConfirmFinalPlanBody {
        expected_version: 1,
    };
    let Ok(Json(confirm)) =
        confirm_final_plan_impl(state.clone(), None, order_id, user_id, confirm_body).await
    else {
        panic!("confirm");
    };
    let hash = confirm["snapshot_hash"].as_str().expect("snapshot_hash");
    assert!(hash.starts_with("0x") && hash.len() == 66);

    let store = state.store.read().await;
    let bundle = store.itineraries.get(&order_id).expect("bundle");
    assert_eq!(bundle.snapshot_hash.as_deref(), Some(hash));
}

/// GET /api/v1/orders/:id：非 Draft（如已接单）仍返回 itinerary，供 Escrow 详情 UnifiedItineraryList 只读展示（53/52）
#[tokio::test]
async fn order_get_includes_itinerary_when_not_draft() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "青岛".to_string(),
        travel_date: "2025-12-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(800.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let Ok(Json(create_json)) = itinerary_create_impl(state.clone(), user_id, Json(body)).await
    else {
        panic!("create");
    };
    let order_id = Uuid::parse_str(create_json["order_id"].as_str().unwrap()).unwrap();
    let guide_placeholder = Uuid::new_v4();
    {
        let mut store = state.store.write().await;
        let order = store.orders.get_mut(&order_id).expect("order");
        order.state = OrderState::Accepted;
        order.guide_id = guide_placeholder;
        order.accepted_at = Some(Utc::now());
    }
    let Ok(Json(get_json)) =
        order_get_impl(state, &test_order_deadline_clock(), None, order_id, user_id).await
    else {
        panic!("order_get_impl");
    };
    let it = get_json["itinerary"].as_object().expect("itinerary object");
    let daily = it["daily_itinerary"].as_array().expect("daily_itinerary");
    assert!(
        !daily.is_empty(),
        "Accepted order with bundle must expose daily_itinerary"
    );
    assert!(it["amount_breakdown"].is_object());
}

#[tokio::test]
async fn set_order_escrow_address_impl_writes_address() {
    let store = ChainOffStore::default();
    let state = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    let user_id = Uuid::new_v4();
    let body = CreateItineraryBody {
        destination: "中国".to_string(),
        city: "杭州".to_string(),
        travel_date: "2025-08-01".to_string(),
        days: 1,
        cities: None,
        hotel_type: None,
        food_preference: None,
        transport: None,
        budget_min: Some(500.0),
        budget_max: None,
        notes: None,
        guide_id: None,
    };
    let res = itinerary_create_impl(state.clone(), user_id, Json(body)).await;
    let Ok(Json(json)) = res else {
        panic!("itinerary_create_impl should succeed");
    };
    let order_id = Uuid::parse_str(json["order_id"].as_str().unwrap()).unwrap();
    let addr = "0x1234567890123456789012345678901234567890";
    let set_res = set_order_escrow_address_impl(
        state.clone(),
        order_id,
        user_id,
        Json(SetEscrowAddressBody {
            escrow_address: addr.to_string(),
        }),
    )
    .await;
    let Ok(Json(set_json)) = set_res else {
        panic!("set_order_escrow_address_impl should succeed");
    };
    assert_eq!(set_json["status"], "ok");
    assert_eq!(set_json["escrow_address"], addr);
    let Ok(Json(get_json)) =
        order_get_impl(state.clone(), &test_order_deadline_clock(), None, order_id, user_id).await
    else {
        panic!("order_get_impl");
    };
    assert_eq!(get_json["order"]["escrow_address"], addr);
    let store = state.store.read().await;
    let order = store.orders.get(&order_id).expect("order");
    assert_eq!(order.escrow_address.as_deref(), Some(addr));
    drop(store);

    let Json(disc) = discover_orders_list_impl(state.clone(), None, None, None, OrderListPage::default())
        .await
        .expect("discover after set escrow");
    let items = disc["items"].as_array().expect("discover items");
    let card = items
        .iter()
        .find(|o| o["id"].as_str() == Some(&order_id.to_string()))
        .expect("draft with escrow still on discover");
    assert_eq!(card["escrow_address"], addr);
}
