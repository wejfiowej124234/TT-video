//! Governance route tests — `fee_routes.rs`.
#![allow(unused_imports)]

use super::super::doc_params::{
    GOV_HTTP_IMPL_STATUS_DOC_REFERENCE, GOV_HTTP_IMPL_STATUS_DOC_REFERENCE_PENDING,
};
use super::super::fee_pool_aggregate::{build_fee_pool_aggregate_body, fee_pool_cross_check_json};
use super::super::pool_chain::{
    balance_consistency_hint_from_balance_reads, fee_router_alignment_reads_from_eth_results,
    fee_router_balance_read_from_eth_result, fee_router_erc20_balance_read_from_optional,
    pool_chain_alignment_hint,
};
use super::super::*;
use crate::chain::ChainConfig;
use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::db;
use crate::routes::governance_doc_reference;
use crate::routes::governance_proposals::get_governance_proposals_list;
use crate::state::test_support::api_meta_state;
use crate::state::ApiMetaState;
use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use http_body_util::BodyExt;
use serde_json::json;
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;

#[tokio::test]
async fn governance_fee_routes_no_chain_off_sets_placeholder_header() {
    let res = get_governance_fee_routes(
        State(api_meta_state(None)),
        Query(FeeRoutesQuery {
            limit: None,
            cursor: None,
            chain_id: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(res.status(), StatusCode::OK);
    assert_eq!(
        res.headers()
            .get("x-implementation-status")
            .and_then(|h| h.to_str().ok()),
        Some("placeholder")
    );
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
    assert_eq!(v["items"].as_array().map(|a| a.len()), Some(0));
    let page = v.get("page").expect("page");
    assert_eq!(page.get("has_more"), Some(&json!(false)));
    assert!(
        page.get("next_cursor").is_some_and(|x| x.is_null()),
        "placeholder next_cursor must be null"
    );
}

#[tokio::test]
async fn governance_vault_forwards_no_chain_off_sets_placeholder_header() {
    let res = get_governance_vault_forwards(
        State(api_meta_state(None)),
        Query(FeeRoutesQuery {
            limit: None,
            cursor: None,
            chain_id: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(res.status(), StatusCode::OK);
    assert_eq!(
        res.headers()
            .get("x-implementation-status")
            .and_then(|h| h.to_str().ok()),
        Some("placeholder")
    );
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
    assert_eq!(v["items"].as_array().map(|a| a.len()), Some(0));
    let page = v.get("page").expect("page");
    assert_eq!(page.get("has_more"), Some(&json!(false)));
    assert!(
        page.get("next_cursor").is_some_and(|x| x.is_null()),
        "placeholder next_cursor must be null"
    );
}

#[tokio::test]
async fn governance_fee_routes_limit_zero_returns_400() {
    let res = get_governance_fee_routes(
        State(api_meta_state(None)),
        Query(FeeRoutesQuery {
            limit: Some(0),
            cursor: None,
            chain_id: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("invalid_limit")
    );
    assert_eq!(v.get("error"), v.get("message"));
    let d = v.get("detail").and_then(|x| x.as_str()).unwrap_or_default();
    assert!(!d.is_empty(), "detail should carry human hint");
}

#[tokio::test]
async fn governance_fee_routes_bad_cursor_returns_400() {
    let res = get_governance_fee_routes(
        State(api_meta_state(None)),
        Query(FeeRoutesQuery {
            limit: None,
            cursor: Some("not-a-cursor".to_string()),
            chain_id: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(res.status(), StatusCode::BAD_REQUEST);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("invalid_cursor")
    );
    assert_eq!(v.get("error"), v.get("message"));
    let d = v.get("detail").and_then(|x| x.as_str()).unwrap_or_default();
    assert!(!d.is_empty(), "detail should carry human hint");
}

/// B-116-3-1：`limit` 超过 100 时钳位，不返回 400（无 DB 时落入占位枝）。
#[tokio::test]
async fn governance_fee_routes_limit_above_max_clamps_without_400() {
    let res = get_governance_fee_routes(
        State(api_meta_state(None)),
        Query(FeeRoutesQuery {
            limit: Some(500),
            cursor: None,
            chain_id: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(res.status(), StatusCode::OK);
}

fn assert_governance_fee_route_item_contract(item: &serde_json::Value) {
    for k in [
        "id",
        "chain_id",
        "block_number",
        "log_index",
        "block_hash",
        "tx_hash",
        "router_address",
        "token_address",
        "amount_u256_hex",
        "to_country_u256_hex",
        "to_stakers_u256_hex",
        "to_reserve_u256_hex",
        "to_ops_u256_hex",
        "inserted_at",
    ] {
        assert!(item.get(k).is_some(), "missing item key {k}");
    }
}

/// B-116-3-1：分页、`chain_id` 过滤与 `items`/`page` 形状（需已迁移 PG + `fee_router_routed_events`）。
#[tokio::test]
async fn governance_fee_routes_database_branch_pagination_chain_filter_and_item_shape() {
    let url = match std::env::var("DATABASE_URL") {
        Ok(u) if !u.trim().is_empty() => u,
        _ => {
            eprintln!(
                "governance_fee_routes_database_branch_pagination_chain_filter_and_item_shape: skip (DATABASE_URL unset)"
            );
            return;
        }
    };    let pool = match PgPoolOptions::new()
        .max_connections(3)
        .acquire_timeout(Duration::from_secs(5))
        .connect(&url)
        .await
    {
        Ok(p) => p,
        Err(e) => {
            eprintln!("governance_fee_routes DB branch: skip (connect failed): {e}");
            return;
        }
    }

    const CHAIN_A: i64 = 999_991_631;
    const CHAIN_B: i64 = 999_991_632;
    sqlx::query("DELETE FROM fee_router_routed_events WHERE chain_id = $1 OR chain_id = $2")
        .bind(CHAIN_A)
        .bind(CHAIN_B)
        .execute(&pool)
        .await
        .expect("cleanup fee_router_routed_events");

    let router = "0x1111111111111111111111111111111111111111";
    let token = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    let w0 = "0x0000000000000000000000000000000000000000000000000000000000000001";
    let w1 = "0x0000000000000000000000000000000000000000000000000000000000000002";
    let w2 = "0x0000000000000000000000000000000000000000000000000000000000000003";
    let w3 = "0x0000000000000000000000000000000000000000000000000000000000000004";
    let w4 = "0x0000000000000000000000000000000000000000000000000000000000000005";
    for (bn, li) in [(100i64, 0i32), (100, 1), (99, 0), (98, 0), (97, 0)] {
        db::insert_fee_router_routed_event(
            &pool,
            CHAIN_A,
            bn,
            li,
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            router,
            token,
            w0,
            w1,
            w2,
            w3,
            w4,
        )
        .await
        .expect("insert CHAIN_A");
    }
    db::insert_fee_router_routed_event(
        &pool,
        CHAIN_B,
        200,
        0,
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        router,
        token,
        w0,
        w1,
        w2,
        w3,
        w4,
    )
    .await
    .expect("insert CHAIN_B");

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let state = api_meta_state(Some(co));

    let res_page1 = get_governance_fee_routes(
        State(state.clone()),
        Query(FeeRoutesQuery {
            limit: Some(2),
            cursor: None,
            chain_id: Some(CHAIN_A),
        }),
    )
    .await
    .into_response();
    assert_eq!(res_page1.status(), StatusCode::OK);
    assert!(
        res_page1.headers().get("x-implementation-status").is_none(),
        "DB success must not set placeholder header"
    );
    let body = res_page1.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json page1");
    let items = v["items"].as_array().expect("items");
    assert_eq!(items.len(), 2);
    assert_eq!(items[0]["block_number"], json!(100));
    assert_eq!(items[0]["log_index"], json!(1));
    assert_eq!(items[1]["block_number"], json!(100));
    assert_eq!(items[1]["log_index"], json!(0));
    assert_governance_fee_route_item_contract(&items[0]);
    let page = v["page"].as_object().expect("page");
    assert_eq!(page.get("has_more"), Some(&json!(true)));
    assert_eq!(
        page.get("next_cursor").and_then(|x| x.as_str()),
        Some("100:0")
    );

    let res_page2 = get_governance_fee_routes(
        State(state.clone()),
        Query(FeeRoutesQuery {
            limit: Some(2),
            cursor: Some("100:0".to_string()),
            chain_id: Some(CHAIN_A),
        }),
    )
    .await
    .into_response();
    assert_eq!(res_page2.status(), StatusCode::OK);
    let body2 = res_page2.into_body().collect().await.unwrap().to_bytes();
    let v2: serde_json::Value = serde_json::from_slice(&body2).expect("json page2");
    let items2 = v2["items"].as_array().expect("items2");
    assert_eq!(items2.len(), 2);
    assert_eq!(items2[0]["block_number"], json!(99));
    assert_eq!(items2[1]["block_number"], json!(98));
    let page2 = v2["page"].as_object().expect("page2");
    assert_eq!(page2.get("has_more"), Some(&json!(true)));
    assert_eq!(
        page2.get("next_cursor").and_then(|x| x.as_str()),
        Some("98:0")
    );

    let res_tail = get_governance_fee_routes(
        State(state.clone()),
        Query(FeeRoutesQuery {
            limit: Some(10),
            cursor: Some("98:0".to_string()),
            chain_id: Some(CHAIN_A),
        }),
    )
    .await
    .into_response();
    let body3 = res_tail.into_body().collect().await.unwrap().to_bytes();
    let v3: serde_json::Value = serde_json::from_slice(&body3).expect("json tail");
    let items3 = v3["items"].as_array().expect("items3");
    assert_eq!(items3.len(), 1);
    assert_eq!(items3[0]["block_number"], json!(97));
    let page3 = v3["page"].as_object().expect("page3");
    assert_eq!(page3.get("has_more"), Some(&json!(false)));
    assert!(page3.get("next_cursor").is_some_and(|x| x.is_null()));

    sqlx::query("DELETE FROM fee_router_routed_events WHERE chain_id = $1 OR chain_id = $2")
        .bind(CHAIN_A)
        .bind(CHAIN_B)
        .execute(&pool)
        .await
        .expect("cleanup tail");
}
