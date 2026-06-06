//! Governance route tests — `pool_chain_protocol_params.rs`.
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

#[test]
fn balance_consistency_hint_presence_only_patterns() {
    let native_ok = json!({"read_status": "ok", "method": "eth_getBalance(FeeRouter)"});
    let erc20_ok = json!({"read_status": "ok", "method": "balanceOf(FeeRouter)"});
    assert_eq!(
        balance_consistency_hint_from_balance_reads(&native_ok, &erc20_ok)["pattern"],
        json!("both_balance_hints_ok")
    );
    assert_eq!(
        balance_consistency_hint_from_balance_reads(&native_ok, &json!(null))["pattern"],
        json!("native_balance_hint_only")
    );
    assert_eq!(
        balance_consistency_hint_from_balance_reads(&json!(null), &erc20_ok)["pattern"],
        json!("erc20_balance_hint_only")
    );
    assert!(balance_consistency_hint_from_balance_reads(&json!(null), &json!(null)).is_null());
    assert!(balance_consistency_hint_from_balance_reads(
        &json!({"read_status": "ok"}),
        &json!({"read_status": "failed"})
    )["pattern"]
        .as_str()
        .is_some_and(|s| s == "native_balance_hint_only"));
}

#[test]
fn fee_router_erc20_balance_read_optional_null_or_ok() {
    assert!(fee_router_erc20_balance_read_from_optional(None, None).is_null());
    assert!(fee_router_erc20_balance_read_from_optional(
        Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        None
    )
    .is_null());
    assert!(fee_router_erc20_balance_read_from_optional(
        Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
        Some(Err("rpc".into())),
    )
    .is_null());
    let v = fee_router_erc20_balance_read_from_optional(
        Some("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"),
        Some(Ok(
            "0x0000000000000000000000000000000000000000000000000000000000000001".into(),
        )),
    );
    assert_eq!(v["read_status"], json!("ok"));
    assert_eq!(
        v["balance_u256_hex"].as_str(),
        Some("0x0000000000000000000000000000000000000000000000000000000000000001")
    );
}

#[test]
fn fee_router_balance_read_from_eth_result_ok_and_null_on_err() {
    let v = fee_router_balance_read_from_eth_result(&Ok(
        "0x0000000000000000000000000000000000000000000000000000000000000000".into(),
    ));
    assert_eq!(v["read_status"], json!("ok"));
    assert_eq!(
        v["native_balance_wei_hex"].as_str(),
        Some("0x0000000000000000000000000000000000000000000000000000000000000000")
    );
    assert!(fee_router_balance_read_from_eth_result(&Err("rpc".into())).is_null());
}

#[test]
fn fee_router_alignment_reads_covers_readable_partial_unavailable() {
    let (_, _, d) = fee_router_alignment_reads_from_eth_results(&Ok(false), &Ok(100u128));
    assert_eq!(d, json!("fee_router_readable"));

    let (_, _, d) = fee_router_alignment_reads_from_eth_results(&Ok(true), &Err("bps fail".into()));
    assert_eq!(d, json!("fee_router_partial"));

    let (_, _, d) =
        fee_router_alignment_reads_from_eth_results(&Err("paused fail".into()), &Ok(1u128));
    assert_eq!(d, json!("fee_router_partial"));

    let (cr, rr, d) =
        fee_router_alignment_reads_from_eth_results(&Err("a".into()), &Err("b".into()));
    assert_eq!(d, json!("fee_router_unavailable"));
    assert_eq!(cr, json!(null));
    assert_eq!(rr, json!(null));
}

#[tokio::test]
async fn pool_chain_alignment_hint_unmounted_null_derived() {
    let st = api_meta_state(None);
    let hint = pool_chain_alignment_hint(&st).await;
    assert!(hint["chain_alignment_derived"].is_null());
    assert!(hint["fee_router_balance_read"].is_null());
    assert!(hint["fee_router_erc20_balance_read"].is_null());
    assert!(hint["balance_consistency_hint"].is_null());
    assert_eq!(
        hint["ssot_parallel_chain_snapshot"]["is_chain_ssot"],
        json!(false)
    );
    assert!(hint["ssot_parallel_chain_snapshot"]["fee_router_erc20_balance_read"].is_null());
    assert_eq!(hint["chain_config_source"].as_str(), Some("unmounted"));
    assert_eq!(hint["is_chain_ssot"], json!(false));
    assert_eq!(hint["chain_alignment_status"].as_str(), Some("not_aligned"));
}

#[tokio::test]
async fn pool_chain_alignment_hint_not_configured_unknown() {
    let mut st = api_meta_state(None);
    st.chain_config = Some(ChainConfig {
        rpc_url: String::new(),
        chain_id: 99,
        ..Default::default()
    });
    let hint = pool_chain_alignment_hint(&st).await;
    assert_eq!(hint["chain_alignment_derived"], json!("unknown"));
    assert!(hint["fee_router_balance_read"].is_null());
    assert!(hint["fee_router_erc20_balance_read"].is_null());
    assert!(hint["balance_consistency_hint"].is_null());
    assert_eq!(
        hint["ssot_parallel_chain_snapshot"]["is_chain_ssot"],
        json!(false)
    );
}

#[tokio::test]
async fn pool_chain_alignment_hint_configured_but_no_fee_router_unknown() {
    let mut st = api_meta_state(None);
    st.chain_config = Some(ChainConfig {
        rpc_url: "http://127.0.0.1:65534".to_string(),
        chain_id: 1,
        fee_router_address: None,
        ..Default::default()
    });
    let hint = pool_chain_alignment_hint(&st).await;
    assert_eq!(hint["chain_alignment_derived"], json!("unknown"));
    assert!(hint["fee_router_chain_read"].is_null());
    assert!(hint["fee_router_balance_read"].is_null());
    assert!(hint["fee_router_erc20_balance_read"].is_null());
    assert!(hint["balance_consistency_hint"].is_null());
    assert_eq!(
        hint["ssot_parallel_chain_snapshot"]["is_chain_ssot"],
        json!(false)
    );
}

#[tokio::test]
async fn protocol_reference_response_has_doc_reference_header_and_body() {
    let res = get_protocol_reference().await.into_response();
    assert_eq!(res.status(), StatusCode::OK);
    assert_eq!(
        res.headers()
            .get("x-implementation-status")
            .and_then(|h| h.to_str().ok()),
        Some(GOV_HTTP_IMPL_STATUS_DOC_REFERENCE)
    );
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
    assert_eq!(
        v.get("doc_version").and_then(|x| x.as_str()),
        Some(governance_doc_reference::DOC_VERSION)
    );
}

#[tokio::test]
async fn protocol_reference_pending_response_has_pending_header_and_source() {
    let res = get_protocol_reference_pending().await.into_response();
    assert_eq!(res.status(), StatusCode::OK);
    assert_eq!(
        res.headers()
            .get("x-implementation-status")
            .and_then(|h| h.to_str().ok()),
        Some(GOV_HTTP_IMPL_STATUS_DOC_REFERENCE_PENDING)
    );
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
    assert!(
        v.get("pending_package_source")
            .and_then(|x| x.as_str())
            .is_some_and(|s| !s.is_empty()),
        "pending_package_source must be a non-empty string"
    );
}

/// P5-5-2：**`fee_pool_cross_check_json`** 与 **`protocol_reference_json`** 派生关系稳定；**pending 镜像**体与 **cross_check** 旁证一致（**B-084** 仍只引用文档镜像，不读 pending）。
#[test]
fn p552_fee_pool_cross_check_from_pref_matches_protocol_and_pending_mirror() {
    use crate::routes::governance_doc_reference;

    let pref = governance_doc_reference::protocol_reference_json();
    assert_eq!(
        fee_pool_cross_check_from_pref(&pref),
        fee_pool_cross_check_json()
    );
    let pending = governance_doc_reference::protocol_reference_pending_merged(None);
    assert_eq!(pending["pending_package_source"].as_str(), Some("mirror"));
    assert_eq!(
        fee_pool_cross_check_from_pref(&pending),
        fee_pool_cross_check_json()
    );
}

/// P5-5-2：**`/governance/params`** 占位体并列只读指针，与 **protocol-reference\*** 响应头契约一致。
#[tokio::test]
async fn governance_params_lists_protocol_reference_reads_and_doc_version() {
    let res = get_governance_params().await.into_response();
    assert_eq!(res.status(), StatusCode::OK);
    assert_eq!(
        res.headers()
            .get("x-implementation-status")
            .and_then(|h| h.to_str().ok()),
        Some("placeholder")
    );
    let body = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v["protocol_reference_doc_version"].as_str(),
        Some(governance_doc_reference::DOC_VERSION)
    );
    let reads = v["protocol_reference_reads"].as_array().expect("reads");
    assert_eq!(reads.len(), 2);
    assert_eq!(
        reads[0]["relative_path"].as_str(),
        Some("/api/v1/governance/protocol-reference")
    );
    assert_eq!(
        reads[0]["x_implementation_status"].as_str(),
        Some(GOV_HTTP_IMPL_STATUS_DOC_REFERENCE)
    );
    assert_eq!(
        reads[1]["relative_path"].as_str(),
        Some("/api/v1/governance/protocol-reference/pending")
    );
    assert_eq!(
        reads[1]["x_implementation_status"].as_str(),
        Some(GOV_HTTP_IMPL_STATUS_DOC_REFERENCE_PENDING)
    );
}
