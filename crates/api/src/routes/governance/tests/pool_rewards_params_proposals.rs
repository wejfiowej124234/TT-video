//! Governance route tests — `pool_rewards_params_proposals.rs`.
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

use super::helpers::*;

#[tokio::test]
async fn governance_pool_placeholder_branch_chain_alignment_hint_consistency() {
    let v = governance_pool_response_json(api_meta_state(None)).await;
    assert_eq!(
        v.get("data_source").and_then(|x| x.as_str()),
        Some("placeholder")
    );
    assert_governance_pool_chain_alignment_hint_projection_not_aligned(&v["chain_alignment_hint"]);
}

/// 需 **`DATABASE_URL`** 指向已迁移库（含 **`governance_pool`** 表）。**CI 无 DB 时提前返回**（仍验 **placeholder** 枝于上测）。
#[tokio::test]
async fn governance_pool_database_branches_chain_alignment_hint_consistency_when_database_url_set()
{
    let url = match std::env::var("DATABASE_URL") {
        Ok(u) if !u.trim().is_empty() => u,
        _ => {
            eprintln!(
                "governance_pool database/database_empty branches: skip (DATABASE_URL unset)"
            );
            return;
        }
    };    let pool = match PgPoolOptions::new()
        .max_connections(2)
        .acquire_timeout(Duration::from_secs(5))
        .connect(&url)
        .await
    {
        Ok(p) => p,
        Err(e) => {
            eprintln!("governance_pool DB branches: skip (connect failed): {e}");
            return;
        }
    };
    let state_with_pool = || {
        let co = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(pool.clone()),
        };
        api_meta_state(Some(co))
    };

    sqlx::query("DELETE FROM governance_pool")
        .execute(&pool)
        .await
        .expect("delete governance_pool for empty-branch test");

    let v_empty = governance_pool_response_json(state_with_pool()).await;
    assert_eq!(
        v_empty.get("data_source").and_then(|x| x.as_str()),
        Some("database_empty")
    );
    assert_governance_pool_chain_alignment_hint_projection_not_aligned(
        &v_empty["chain_alignment_hint"],
    );

    sqlx::query(
        "INSERT INTO governance_pool (balance, currency, updated_at) VALUES ($1, $2, NOW())",
    )
    .bind("42")
    .bind("TT")
    .execute(&pool)
    .await
    .expect("insert governance_pool for database-branch test");

    let v_db = governance_pool_response_json(state_with_pool()).await;
    assert_eq!(
        v_db.get("data_source").and_then(|x| x.as_str()),
        Some("database")
    );
    assert_governance_pool_chain_alignment_hint_projection_not_aligned(
        &v_db["chain_alignment_hint"],
    );
}

async fn governance_rewards_response_parts(
    state: ApiMetaState,
) -> (
    axum::http::StatusCode,
    axum::http::HeaderMap,
    serde_json::Value,
) {
    let res = get_governance_rewards(State(state)).await.into_response();
    let status = res.status();
    let headers = res.headers().clone();
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("rewards json");
    (status, headers, v)
}

#[tokio::test]
async fn governance_rewards_response_placeholder_branch() {
    let (status, headers, v) = governance_rewards_response_parts(api_meta_state(None)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        headers
            .get("x-implementation-status")
            .and_then(|h| h.to_str().ok()),
        Some("placeholder")
    );
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
    assert_eq!(
        v.get("items").and_then(|x| x.as_array()).map(|a| a.len()),
        Some(0)
    );
    assert_eq!(
        v.get("data_source").and_then(|x| x.as_str()),
        Some("placeholder")
    );
}

/// 需 **`DATABASE_URL`**；**CI 无 DB 时提前返回**。
#[tokio::test]
async fn governance_rewards_response_database_branch_when_database_url_set() {
    let url = match std::env::var("DATABASE_URL") {
        Ok(u) if !u.trim().is_empty() => u,
        _ => {
            eprintln!("governance_rewards database branch: skip (DATABASE_URL unset)");
            return;
        }
    };    let pool = match PgPoolOptions::new()
        .max_connections(2)
        .acquire_timeout(Duration::from_secs(5))
        .connect(&url)
        .await
    {
        Ok(p) => p,
        Err(e) => {
            eprintln!("governance_rewards database branch: skip (connect failed): {e}");
            return;
        }
    };    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    let (status, headers, v) = governance_rewards_response_parts(api_meta_state(Some(co))).await;
    assert_eq!(status, StatusCode::OK);
    assert!(
        headers.get("x-implementation-status").is_none(),
        "database branch must not set placeholder header"
    );
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
    assert_eq!(
        v.get("data_source").and_then(|x| x.as_str()),
        Some("database")
    );
    assert_eq!(
        v.get("rule_version").and_then(|x| x.as_str()),
        Some("governance_rewards_v1")
    );
    assert!(v.get("items").and_then(|x| x.as_array()).is_some());
}

async fn governance_params_response_parts() -> (
    axum::http::StatusCode,
    axum::http::HeaderMap,
    serde_json::Value,
) {
    let res = get_governance_params().await.into_response();
    let status = res.status();
    let headers = res.headers().clone();
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("governance params json");
    (status, headers, v)
}

#[tokio::test]
async fn governance_params_response_placeholder_branch() {
    let (status, headers, v) = governance_params_response_parts().await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        headers
            .get("x-implementation-status")
            .and_then(|h| h.to_str().ok()),
        Some("placeholder")
    );
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
    assert_eq!(
        v.get("data_source").and_then(|x| x.as_str()),
        Some("placeholder")
    );
    assert!(
        v.get("params").is_some_and(|p| p.is_object()),
        "params must be a JSON object"
    );
    assert!(
        v.get("items").and_then(|x| x.as_array()).is_some(),
        "items must be an array"
    );
}

async fn governance_proposals_response_parts(
    state: ApiMetaState,
) -> (
    axum::http::StatusCode,
    axum::http::HeaderMap,
    serde_json::Value,
) {
    let res = get_governance_proposals_list(
        State(state),
        axum::http::HeaderMap::new(),
        Query(crate::routes::governance_proposals::GovernanceProposalsListQuery::default()),
    )
    .await
    .into_response();
    let status = res.status();
    let headers = res.headers().clone();
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("governance proposals json");
    (status, headers, v)
}

/// 非 Governor 索引路径：**JSON** **`data_source`** 为 **`chain_off_mvp`**（**`X-Implementation-Status: chain_off_mvp`**），与 **`governance.rs`** 根级 **`placeholder`** 头不同源。
#[tokio::test]
async fn governance_proposals_response_placeholder_branch() {
    let (status, headers, v) = governance_proposals_response_parts(api_meta_state(None)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        headers
            .get("x-implementation-status")
            .and_then(|h| h.to_str().ok()),
        Some("chain_off_mvp")
    );
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
    assert_eq!(
        v.get("data_source").and_then(|x| x.as_str()),
        Some("chain_off_mvp")
    );
    assert!(v.get("items").and_then(|x| x.as_array()).is_some());
}

/// 需 **`DATABASE_URL`** 且已迁移含 **`governance_proposals_projection`**；**CI 无库/无表时提前返回**。
#[tokio::test]
async fn governance_proposals_response_projection_branch_when_database_url_set() {
    let url = match std::env::var("DATABASE_URL") {
        Ok(u) if !u.trim().is_empty() => u,
        _ => {
            eprintln!("governance_proposals projection branch: skip (DATABASE_URL unset)");
            return;
        }
    };    let pool = match PgPoolOptions::new()
        .max_connections(2)
        .acquire_timeout(Duration::from_secs(5))
        .connect(&url)
        .await
    {
        Ok(p) => p,
        Err(e) => {
            eprintln!("governance_proposals projection branch: skip (connect failed): {e}");
            return;
        }
    };    if sqlx::query("SELECT 1 FROM governance_proposals_projection LIMIT 1")
        .fetch_optional(&pool)
        .await
        .is_err()
    {
        eprintln!(
            "governance_proposals projection branch: skip (governance_proposals_projection missing)"
        );
        return;
    };    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool),
    };
    let mut state = api_meta_state(Some(co));
    state.chain_config = Some(ChainConfig {
        governor_address: Some("0x0000000000000000000000000000000000000001".to_string()),
        chain_id: 999_001,
        ..Default::default()
    });

    let (status, headers, v) = governance_proposals_response_parts(state).await;
    assert_eq!(status, StatusCode::OK);
    assert_ne!(
        headers
            .get("x-implementation-status")
            .and_then(|h| h.to_str().ok()),
        Some("placeholder"),
        "projection list must not use pool/params-style X-Implementation-Status: placeholder"
    );
    assert_eq!(
        headers
            .get("x-implementation-status")
            .and_then(|h| h.to_str().ok()),
        Some("chain_governor_indexed")
    );
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
    assert_eq!(
        v.get("data_source").and_then(|x| x.as_str()),
        Some("governance_proposals_projection")
    );
    assert!(v.get("items").and_then(|x| x.as_array()).is_some());
    if let Some(ga) = v.get("governor_address").and_then(|x| x.as_str()) {
        assert!(
            !ga.trim().is_empty(),
            "governor_address must be non-empty when present"
        );
    }
}
