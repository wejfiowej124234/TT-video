use super::super::*;
use crate::order_deadline_clock::SystemOrderDeadlineClock;
use crate::state::{ApiMetaState, EvidenceTimeState, ProjectorCheckpoint};
use axum::http::{header::AUTHORIZATION, HeaderMap, HeaderValue};
use chrono::Utc;
use http_body_util::BodyExt;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

fn build_state() -> ApiMetaState {
    ApiMetaState {
        strict_ssot: false,
        ssot_version: "test".to_string(),
        ssot_sha256_expected: None,
        ssot_sha256_computed: None,
        ssot_sha256_match: true,
        chargeback_policy: "warn".to_string(),
        finality_n: 12,
        indexer_state_path: "test".to_string(),
        indexer_checkpoint: ProjectorCheckpoint {
            block_number: 10,
            log_index: 1,
        },
        indexer_last_seen_finality_n: 12,
        indexer_replay_required: false,
        pause_mode: false,
        pause_api_allowlist: "".to_string(),
        degraded_mode: false,
        authority_source: "db_projection".to_string(),
        indexer_lag_blocks: 0,
        indexer_lag_max_blocks: 0,
        reorg_detected: false,
        evidence_timestamp_policy: "backend_signed".to_string(),
        evidence_time_state: Arc::new(RwLock::new(EvidenceTimeState {
            last_seen_utc_rfc3339: Utc::now().to_rfc3339(),
        })),
        evidence_time_state_path: "test".to_string(),
        evidence_receipt_hmac_key: None,
        reconcile_export_ed25519_key: None,
        order_deadline_clock: Arc::new(SystemOrderDeadlineClock),
        chain_off: None,
        jurisdiction_country_ledger_registry: Arc::new(
            crate::jurisdiction_country_ledger_template::JurisdictionCountryLedgerRegistry::empty(),
        ),
        chain_config: None,
        resolution_outbox: None,
        indexer_state: None,
        indexer_tick_fail_skip_bucket_obs_last: Arc::new(RwLock::new(None)),
        guide_upload_rate: Arc::new(RwLock::new(HashMap::new())),
        community_media_upload_rate: Arc::new(RwLock::new(HashMap::new())),
    }
}

#[tokio::test]
async fn chain_sync_status_requires_login() {
    let resp = get_order_chain_sync_status(
        State(build_state()),
        Path(Uuid::new_v4().to_string()),
        HeaderMap::new(),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn chain_sync_status_returns_min_snapshot_when_authenticated() {
    let mut headers = HeaderMap::new();
    let uid = Uuid::new_v4();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer bearer_{}", uid)).expect("valid auth"),
    );

    let resp = get_order_chain_sync_status(
        State(build_state()),
        Path(Uuid::new_v4().to_string()),
        headers,
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["chain_sync"]["checkpoint"]["source"], "startup_snapshot");
    assert_eq!(v["chain_sync"]["checkpoint"]["block_number"], 10);
    assert_eq!(v["chain_sync"]["checkpoint"]["log_index"], 1);
    assert_eq!(v["note"].as_str().unwrap(), CHAIN_SYNC_MINIMAL_BODY_NOTE);
    assert_eq!(
        v["status"].as_str().unwrap(),
        CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS
    );
    let cs = v["chain_sync"].as_object().expect("chain_sync object");
    for key in CHAIN_SYNC_REQUIRED_TOP_KEYS {
        assert!(
            cs.contains_key(*key),
            "716: chain_sync must include top key {key:?}"
        );
    }
    assert!(
        v["chain_sync"]["last_event"].is_null(),
        "716: non-chain_off minimal body last_event must be JSON null"
    );
}

#[test]
fn chain_sync_method_path_aligns_with_route_path_717() {
    assert_eq!(
        format!("GET {}", CHAIN_SYNC_ROUTE_PATH),
        CHAIN_SYNC_STATUS_METHOD_AND_PATH
    );
}

/// **TT-B150-110-ORDERS-CHAIN-SYNC-SNAPSHOT-CLOSE-001**：**110 §六 Implemented** 与 **04 §3.4** 对读的 **716** 四键 + 路由锚。
#[test]
fn b150_chain_sync_status_route_and_chain_sync_core_keys_contract() {
    assert_eq!(
        CHAIN_SYNC_ROUTE_PATH,
        "/api/v1/orders/:id/chain-sync-status"
    );
    assert_eq!(
        CHAIN_SYNC_REQUIRED_TOP_KEYS,
        &["status", "finality_n", "checkpoint", "last_event"][..]
    );
}

#[test]
fn chain_sync_handler_code_embeds_mod_path_and_symbol_718() {
    let s = CHAIN_SYNC_STATUS_HANDLER_CODE;
    assert!(
        s.contains("orders/mod.rs"),
        "718: handler code anchor should name mod path: {s}"
    );
    assert!(
        s.contains("get_order_chain_sync_status"),
        "718: handler code anchor should name handler symbol: {s}"
    );
}

#[test]
fn chain_sync_status_values_order_and_literals_719() {
    assert_eq!(
        CHAIN_SYNC_STATUS_VALUES,
        &["pending", "confirmed", "unknown"][..]
    );
}

#[test]
fn event_log_snapshot_absent_reasons_order_and_literals_720() {
    assert_eq!(
        CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS,
        &[
            "no_database",
            "no_chain_context",
            "no_row",
            "read_failed",
            "projection_backend_unavailable"
        ][..]
    );
}

#[test]
fn chain_sync_last_event_top_keys_order_and_literals_721() {
    assert_eq!(
        CHAIN_SYNC_LAST_EVENT_TOP_KEYS,
        &["state", "updated_at", "escrow_address"][..]
    );
}

#[test]
fn chain_sync_checkpoint_top_keys_order_and_literals_723() {
    assert_eq!(
        CHAIN_SYNC_CHECKPOINT_TOP_KEYS,
        &["block_number", "log_index", "source"][..]
    );
    let v = serde_json::json!({
        "block_number": 40_i64,
        "log_index": 2_i64,
        "source": "runtime"
    });
    let keys: Vec<&str> = v
        .as_object()
        .expect("checkpoint object")
        .keys()
        .map(|s| s.as_str())
        .collect();
    assert_eq!(keys, CHAIN_SYNC_CHECKPOINT_TOP_KEYS);
}

#[test]
fn chain_sync_checkpoint_source_values_order_and_literals_724() {
    assert_eq!(
        CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES,
        &["runtime", "startup_snapshot"][..]
    );
}

#[test]
fn order_chain_sync_status_meta_top_keys_order_and_literals_725() {
    assert_eq!(ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS.len(), 32);
    assert_eq!(
        ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS[29],
        "order_chain_sync_status_top_keys"
    );
    assert_eq!(
        ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS[30],
        "order_chain_sync_status_top_keys_contract_725"
    );
    assert_eq!(ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS[31], "rule");
    let contract = format_order_chain_sync_status_meta_top_keys_contract_725();
    assert!(
        contract.contains("725"),
        "contract should mention 725: {contract}"
    );
    for k in ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS {
        assert!(
            contract.contains(k),
            "contract should embed key {k:?}: {contract}"
        );
    }
}

/// **TT-ESCROW-SSOT-ORDER-STATE-AGGREGATE-EXCLUDE-002**：订单列表/占位等**信封**根级**不得**混入 **`GET /api/v1/orders/:id`** 专属的 **`escrow_chain_state*`** / **`escrow_release_state*`** / **`escrow_dispute_state*`** / **`escrow_locked_amount*`** 链上主读键。
fn assert_orders_envelope_has_no_escrow_chain_state_ssot_root_keys(v: &serde_json::Value) {
    assert!(
        v.get("escrow_chain_state").is_none(),
        "orders envelope must not include root escrow_chain_state"
    );
    assert!(
        v.get("escrow_chain_state_data_source").is_none(),
        "orders envelope must not include root escrow_chain_state_data_source"
    );
    assert!(
        v.get("escrow_chain_state_is_chain_ssot").is_none(),
        "orders envelope must not include root escrow_chain_state_is_chain_ssot"
    );
    assert!(
        v.get("escrow_release_state").is_none(),
        "orders envelope must not include root escrow_release_state"
    );
    assert!(
        v.get("escrow_release_state_data_source").is_none(),
        "orders envelope must not include root escrow_release_state_data_source"
    );
    assert!(
        v.get("escrow_release_state_is_chain_ssot").is_none(),
        "orders envelope must not include root escrow_release_state_is_chain_ssot"
    );
    assert!(
        v.get("escrow_dispute_state").is_none(),
        "orders envelope must not include root escrow_dispute_state"
    );
    assert!(
        v.get("escrow_dispute_state_data_source").is_none(),
        "orders envelope must not include root escrow_dispute_state_data_source"
    );
    assert!(
        v.get("escrow_dispute_state_is_chain_ssot").is_none(),
        "orders envelope must not include root escrow_dispute_state_is_chain_ssot"
    );
    assert!(
        v.get("escrow_locked_amount").is_none(),
        "orders envelope must not include root escrow_locked_amount"
    );
    assert!(
        v.get("escrow_locked_amount_data_source").is_none(),
        "orders envelope must not include root escrow_locked_amount_data_source"
    );
    assert!(
        v.get("escrow_locked_amount_is_chain_ssot").is_none(),
        "orders envelope must not include root escrow_locked_amount_is_chain_ssot"
    );
}

#[tokio::test]
async fn orders_list_placeholder_has_no_escrow_chain_ssot_root_keys_tt_escrow_aggregate_exclude_002(
) {
    let resp = get_orders(
        State(build_state()),
        HeaderMap::new(),
        Query(OrdersListQuery {
            limit: None,
            cursor: None,
            state: None,
            orders_chain_id: None,
            business_line: None,
            hat: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_orders_envelope_has_no_escrow_chain_state_ssot_root_keys(&v);
}

/// **TT-B102-GET-ORDERS-CHAIN-SCOPE-EQUALS-DB-SSOT-001**：**`GET /api/v1/orders?orders_chain_id=`** 的 **`orders_chain_scope`** 与 **`db::orders::orders_list_chain_scope_json`** 一致；可见行与 **`orders_row_matches_list_chain_scope`** 一致（与 **`orders_chain_id_backfill_dry_run.orders_list_chain_scope`** 同源）。
#[tokio::test]
async fn b102_get_orders_chain_scope_matches_db_ssot_and_filters_rows() {
    use crate::chain_off::{
        ChainOffConfig, ChainOffState, ChainOffStore, GuideRow, OrderRow,
    };
    use crate::db::{orders_list_chain_scope_json, orders_row_matches_list_chain_scope};
    use traveltrust_core::OrderState;

    let tid = Uuid::new_v4();
    let gid = Uuid::new_v4();
    let now = Utc::now();

    let mut store = ChainOffStore::default();
    store.sessions.insert(format!("bearer_{}", tid), tid);
    store.guides.insert(
        gid,
        GuideRow {
            id: gid,
            user_id: Uuid::new_v4(),
            city: "".to_string(),
            country_code: "US".to_string(),
            languages: vec![],
            service_types: vec![],
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

    let mk = |cid: Option<i64>| OrderRow {
        id: Uuid::new_v4(),
        tourist_id: tid,
        guide_id: gid,
        amount: "1".to_string(),
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
        chain_id: cid,
        data_origin: "production".into(),
        order_kind: None,
        market_listing_id: None,
    };
    let o_null = mk(None);
    let o137 = mk(Some(137));
    let o1 = mk(Some(1));
    store.orders.insert(o_null.id, o_null.clone());
    store.orders.insert(o137.id, o137.clone());
    store.orders.insert(o1.id, o1.clone());

    let mut cfg = ChainOffConfig::default();
    cfg.business_chain_id = Some(137);

    let mut state = build_state();
    state.chain_off = Some(ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: cfg,
        db_pool: None,
    });

    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer bearer_{}", tid)).expect("auth"),
    );

    let expected_scope = orders_list_chain_scope_json(Some(137), Some(137));
    let resp = get_orders(
        State(state),
        headers,
        Query(OrdersListQuery {
            limit: None,
            cursor: None,
            state: None,
            orders_chain_id: Some(137),
            business_line: None,
            hat: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["orders_chain_scope"], expected_scope);

    let ids: std::collections::HashSet<String> = v["items"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(|x| x["id"].as_str().map(|s| s.to_string()))
        .collect();
    assert!(ids.contains(&o_null.id.to_string()));
    assert!(ids.contains(&o137.id.to_string()));
    assert!(!ids.contains(&o1.id.to_string()));

    assert!(orders_row_matches_list_chain_scope(
        o_null.chain_id,
        Some(137),
        Some(137)
    ));
    assert!(orders_row_matches_list_chain_scope(
        o137.chain_id,
        Some(137),
        Some(137)
    ));
    assert!(!orders_row_matches_list_chain_scope(
        o1.chain_id,
        Some(137),
        Some(137)
    ));
}

/// **TT-B122-GET-ORDERS-STRICT-CHAIN-SCOPE-EQUALS-BACKFILL-DRY-RUN-001**：**`GET /api/v1/orders?orders_chain_id=1`**（**`default_business_chain_id=137`**）之 **`orders_chain_scope`** 与 **`orders_chain_id_backfill_dry_run.orders_list_chain_scope`** 所用 **`orders_list_chain_scope_json(Some(137), Some(1))`** **同值**；列表仅 **`chain_id==1`**。
#[tokio::test]
async fn tt_b122_get_orders_strict_chain_scope_matches_backfill_dry_run_embed() {
    use crate::chain_off::{
        ChainOffConfig, ChainOffState, ChainOffStore, GuideRow, OrderRow,
    };
    use crate::db::orders_list_chain_scope_json;
    use traveltrust_core::OrderState;

    let tid = Uuid::new_v4();
    let gid = Uuid::new_v4();
    let now = Utc::now();

    let mut store = ChainOffStore::default();
    store.sessions.insert(format!("bearer_{}", tid), tid);
    store.guides.insert(
        gid,
        GuideRow {
            id: gid,
            user_id: Uuid::new_v4(),
            city: "".to_string(),
            country_code: "US".to_string(),
            languages: vec![],
            service_types: vec![],
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

    let mk = |cid: Option<i64>| OrderRow {
        id: Uuid::new_v4(),
        tourist_id: tid,
        guide_id: gid,
        amount: "1".to_string(),
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
        chain_id: cid,
        data_origin: "production".into(),
        order_kind: None,
        market_listing_id: None,
    };
    let o_null = mk(None);
    let o137 = mk(Some(137));
    let o1 = mk(Some(1));
    store.orders.insert(o_null.id, o_null.clone());
    store.orders.insert(o137.id, o137.clone());
    store.orders.insert(o1.id, o1.clone());

    let mut cfg = ChainOffConfig::default();
    cfg.business_chain_id = Some(137);

    let mut state = build_state();
    state.chain_off = Some(ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: cfg,
        db_pool: None,
    });

    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer bearer_{}", tid)).expect("auth"),
    );

    let backfill_dry_run_embed = orders_list_chain_scope_json(Some(137), Some(1));
    let resp = get_orders(
        State(state),
        headers,
        Query(OrdersListQuery {
            limit: None,
            cursor: None,
            state: None,
            orders_chain_id: Some(1),
            business_line: None,
            hat: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["orders_chain_scope"], backfill_dry_run_embed);
    assert_eq!(v["orders_chain_scope"]["filter"], "strict_chain_id");

    let ids: std::collections::HashSet<String> = v["items"]
        .as_array()
        .unwrap()
        .iter()
        .filter_map(|x| x["id"].as_str().map(|s| s.to_string()))
        .collect();
    assert!(!ids.contains(&o_null.id.to_string()));
    assert!(!ids.contains(&o137.id.to_string()));
    assert!(ids.contains(&o1.id.to_string()));
}

#[tokio::test]
async fn order_get_placeholder_has_no_escrow_chain_ssot_root_keys_tt_escrow_aggregate_exclude_002(
) {
    let resp = get_order_by_id(
        State(build_state()),
        Path(Uuid::new_v4().to_string()),
        HeaderMap::new(),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_orders_envelope_has_no_escrow_chain_state_ssot_root_keys(&v);
}

/// **TT-B097-GET-ORDER-BY-ID-PROJECTION-TERMINAL-PATH-001**：**`GET /api/v1/orders/:id`** → **`order_get_impl`** → **`apply_orders_projection_fields_to_order_json`**；**`order`** 上必有 **`projection_terminal`**（无 DB 池时为 **null**）；终态 **`display_status`** 与业务 **`status`** 一致。
#[tokio::test]
async fn b097_get_order_by_id_order_object_has_projection_terminal_key() {
    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, OrderRow};
    use traveltrust_core::OrderState;

    let tid = Uuid::new_v4();
    let gid = Uuid::new_v4();
    let oid = Uuid::new_v4();
    let now = Utc::now();
    let mut store = ChainOffStore::default();
    store.sessions.insert(format!("bearer_{}", tid), tid);
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
            chain_id: None,
            data_origin: "production".into(),
        order_kind: None,
        market_listing_id: None,
        },
    );

    let mut state = build_state();
    state.chain_off = Some(ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    });

    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer bearer_{}", tid)).expect("auth header"),
    );

    let resp = get_order_by_id(State(state), Path(oid.to_string()), headers)
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    let order = v.get("order").expect("order envelope");
    assert!(
        order.get("projection_terminal").is_some(),
        "order must include projection_terminal (null when no db row)"
    );
    assert!(order["projection_terminal"].is_null());
    assert_eq!(order["display_status"].as_str(), Some("completed"));
    assert_eq!(order["status"].as_str(), Some("completed"));
}

/// **TT-B095-GET-ORDER-SPLIT-META-CONTRACTS-001**：同一 **`ApiMetaState.chain_config`** 下，**`GET /api/v1/orders/:id`** 的 **`order.split_addresses_ssot`**（生产 **`order_split_addresses_ssot`**）与 **`GET /meta`** **`chain.contracts.escrow_platform_fee_recipient`** 字段值一致。
#[tokio::test]
async fn b095_get_order_by_id_split_addresses_ssot_matches_get_meta_chain_contracts() {
    use crate::chain;
    use crate::routes::api_router;
    use crate::chain_off::{
        ChainOffConfig, ChainOffState, ChainOffStore, GuideRow, OrderRow,
    };
    use axum::body::Body;
    use axum::http::Request;
    use tower::util::ServiceExt;
    use traveltrust_core::OrderState;

    let tid = Uuid::new_v4();
    let gid = Uuid::new_v4();
    let oid = Uuid::new_v4();
    let now = Utc::now();

    let mut store = ChainOffStore::default();
    store.sessions.insert(format!("bearer_{}", tid), tid);
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
    store.orders.insert(
        oid,
        OrderRow {
            id: oid,
            tourist_id: tid,
            guide_id: gid,
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
            data_origin: "production".into(),
        order_kind: None,
        market_listing_id: None,
        },
    );

    let chain_cfg = chain::ChainConfig {
        rpc_url: "http://x".to_string(),
        chain_id: 137,
        escrow_factory_address: None,
        fee_router_address: Some(" 0x1111111111111111111111111111111111111111 ".to_string()),
        region_vault_address: Some("0x2222222222222222222222222222222222222222".to_string()),
        country_pool_ledger_address: None,
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

    let mut state = build_state();
    state.chain_config = Some(chain_cfg);
    state.chain_off = Some(ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    });

    let app = api_router().with_state(state);

    let meta_res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/meta")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(meta_res.status(), StatusCode::OK);
    let meta_body = meta_res.into_body().collect().await.unwrap().to_bytes();
    let meta_v: serde_json::Value = serde_json::from_slice(&meta_body).unwrap();
    let meta_recipient = &meta_v["chain"]["contracts"]["fee_router_address"];

    let order_res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(format!("/api/v1/orders/{}", oid))
                .header(
                    AUTHORIZATION,
                    format!("Bearer bearer_{}", tid),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(order_res.status(), StatusCode::OK);
    let order_body = order_res.into_body().collect().await.unwrap().to_bytes();
    let order_v: serde_json::Value = serde_json::from_slice(&order_body).unwrap();
    let split = order_v["order"]
        .get("split_addresses_ssot")
        .expect("split_addresses_ssot present");
    assert!(split.is_object());
    assert_eq!(&split["platform_fee_recipient"], meta_recipient);
}

/// **TT-B083-FEE-ROUTE-COUNTRY-ORDER-META-SSOT-001**：**`GET /api/v1/orders/:id`** 的 **`order.fee_route_country`** 与 **`order_detail_envelope`** / **`resolve_fee_route_country_from_zh_destination`** 同源；**`GET /meta`** **`orders.fee_route_country_ssot`** 与订单字段 **`ssot_field`**（**`FEE_ROUTE_COUNTRY_SSOT_FIELD`**）及 routed/reject 语义一致；未映射国家显式 **reject**。
#[tokio::test]
async fn b083_get_order_fee_route_country_aligns_meta_orders_ssot_mapped_and_reject() {
    use crate::chain_off::{
        AmountBreakdown, ChainOffConfig, ChainOffState, ChainOffStore, GuideRow,
        ItineraryBundle, ItineraryDayRow, OrderRow,
    };
    use crate::routes::api_router;
    use axum::body::Body;
    use axum::http::Request;
    use tower::util::ServiceExt;
    use traveltrust_core::fee_route_country::{
        resolve_fee_route_country_from_zh_destination, FeeRouteCountryResolve,
    };
    use traveltrust_core::{FEE_ROUTE_COUNTRY_SSOT_FIELD, OrderState};

    let tid = Uuid::new_v4();
    let gid = Uuid::new_v4();
    let oid_mapped = Uuid::new_v4();
    let oid_reject = Uuid::new_v4();
    let now = Utc::now();

    fn bundle_for(order_id: Uuid, destination: &str) -> ItineraryBundle {
        ItineraryBundle {
            order_id,
            version: 1,
            destination: destination.to_string(),
            city: "测试市".to_string(),
            days: vec![ItineraryDayRow {
                day_index: 1,
                content_text: "t".to_string(),
                ..Default::default()
            }],
            amount_breakdown: AmountBreakdown {
                hotel: 0.0,
                catering: 0.0,
                tickets: 0.0,
                guide_fee: 0.0,
                vehicle: 0.0,
                platform_fee: 0.0,
                total_budget: 0.0,
            },
            snapshot_hash: None,
            cover_image: None,
        }
    }

    let mut store = ChainOffStore::default();
    store.sessions.insert(format!("bearer_{}", tid), tid);
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
    for (oid, dest) in [(oid_mapped, "中国"), (oid_reject, "意大利")] {
        store.itineraries.insert(oid, bundle_for(oid, dest));
        store.orders.insert(
            oid,
            OrderRow {
                id: oid,
                tourist_id: tid,
                guide_id: gid,
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
                data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
            },
        );
    }

    let mut state = build_state();
    state.chain_off = Some(ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: None,
    });

    let app = api_router().with_state(state);

    let meta_res = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/meta")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(meta_res.status(), StatusCode::OK);
    let meta_body = meta_res.into_body().collect().await.unwrap().to_bytes();
    let meta_v: serde_json::Value = serde_json::from_slice(&meta_body).unwrap();
    let ssot_doc = meta_v["orders"]["fee_route_country_ssot"]
        .as_str()
        .expect("orders.fee_route_country_ssot");
    assert!(
        ssot_doc.contains(FEE_ROUTE_COUNTRY_SSOT_FIELD),
        "meta should name SSOT field {FEE_ROUTE_COUNTRY_SSOT_FIELD}: {ssot_doc}"
    );
    assert!(
        ssot_doc.contains("iso3166_alpha2") && ssot_doc.contains("bucket_route_key"),
        "meta should document routed shape: {ssot_doc}"
    );
    assert!(
        ssot_doc.contains("reject") && ssot_doc.contains("unmapped"),
        "meta should document explicit reject for unmapped: {ssot_doc}"
    );

    let expect_mapped = resolve_fee_route_country_from_zh_destination("中国");
    let FeeRouteCountryResolve::Routed {
        iso3166_alpha2,
        bucket_route_key,
    } = expect_mapped
    else {
        panic!("expected 中国 → Routed");
    };

    let order_res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(format!("/api/v1/orders/{}", oid_mapped))
                .header(AUTHORIZATION, format!("Bearer bearer_{}", tid))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(order_res.status(), StatusCode::OK);
    let ob = order_res.into_body().collect().await.unwrap().to_bytes();
    let ov: serde_json::Value = serde_json::from_slice(&ob).unwrap();
    let fr = &ov["order"]["fee_route_country"];
    assert_eq!(fr["ssot_field"].as_str(), Some(FEE_ROUTE_COUNTRY_SSOT_FIELD));
    assert_eq!(fr["name_zh"].as_str(), Some("中国"));
    assert_eq!(fr["iso3166_alpha2"].as_str(), Some(iso3166_alpha2));
    assert_eq!(
        fr["bucket_route_key"].as_str(),
        Some(bucket_route_key.as_str())
    );
    assert!(fr.get("reject").is_none());

    let reject_res = app
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(format!("/api/v1/orders/{}", oid_reject))
                .header(AUTHORIZATION, format!("Bearer bearer_{}", tid))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reject_res.status(), StatusCode::OK);
    let rb = reject_res.into_body().collect().await.unwrap().to_bytes();
    let rv: serde_json::Value = serde_json::from_slice(&rb).unwrap();
    let frj = &rv["order"]["fee_route_country"];
    assert_eq!(frj["ssot_field"].as_str(), Some(FEE_ROUTE_COUNTRY_SSOT_FIELD));
    assert_eq!(frj["name_zh"].as_str(), Some("意大利"));
    assert_eq!(frj["reject"], true);
    assert_eq!(
        frj["code"].as_str(),
        Some("fee_route_unmapped_destination")
    );
    assert!(
        frj["message"]
            .as_str()
            .unwrap_or("")
            .contains("explicit reject"),
        "message={:?}",
        frj["message"]
    );
}
