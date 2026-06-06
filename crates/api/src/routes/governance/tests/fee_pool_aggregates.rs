//! Governance route tests — `fee_pool_aggregates.rs`.
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
async fn governance_fee_pool_aggregates_no_chain_off_sets_placeholder_header() {
    let res = get_governance_fee_pool_aggregates(
        State(api_meta_state(None)),
        Query(FeePoolAggregatesQuery { chain_id: None }),
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
    assert_eq!(
        v.get("data_source").and_then(|x| x.as_str()),
        Some("placeholder")
    );
    assert_eq!(
        v["fee_router"]["by_token"].as_array().map(|a| a.len()),
        Some(0)
    );
    assert_eq!(
        v["region_vault"]["by_token"].as_array().map(|a| a.len()),
        Some(0)
    );
    assert_eq!(
        v.get("anchor").and_then(|x| x.as_str()),
        Some("B-084-FEE-POOL-AGGREGATES-PROJECTION")
    );
    assert_eq!(
        v["ssot"].as_str(),
        Some("fee_router_routed_events+region_vault_forwarded_events")
    );
    assert_eq!(v["cross_check"], fee_pool_cross_check_json());
    db::assert_fee_pool_aggregates_root_excludes_governance_pool_ssot_keys(&v);
    db::assert_fee_pool_aggregates_root_orthogonal_b1155_snapshot_claim_distribution(&v);
    assert_fee_pool_aggregates_has_no_root_country_pool_ssot_keys(&v);
    assert_fee_pool_aggregates_has_no_root_treasury_pool_ssot_keys(&v);
    assert_fee_pool_aggregates_has_no_root_treasury_erc20_pool_ssot_keys(&v);
}

/// **B-115-5**：**`governance/pool`** 体不得带 **`fee-pool-aggregates`** 的 **`rule_version`/`ssot`/`anchor`** 冒充。
#[test]
fn b1155_governance_pool_json_does_not_alias_fee_pool_aggregates() {
    let chain_like = json!({
        "status": "ok",
        "pool_balance": "0x01",
        "currency": "0xt",
        "updated_at": null,
        "data_source": "chain_read",
        "is_chain_ssot": true,
        "rule_version": "governance_pool_v1",
        "chain_alignment_hint": {}
    });
    db::assert_governance_pool_root_not_aliases_fee_pool_aggregates(&chain_like);
    let db_like = json!({
        "status": "ok",
        "pool_balance": "100",
        "currency": "TT",
        "updated_at": "2020-01-01T00:00:00Z",
        "data_source": "database",
        "rule_version": "governance_pool_v1",
        "chain_alignment_hint": {}
    });
    db::assert_governance_pool_root_not_aliases_fee_pool_aggregates(&db_like);
}

/// **TT-B084-FEE-POOL-AGGREGATES-PROJECTION-SSOT-001**：生产 **`build_fee_pool_aggregate_body`** 的 **Σ** 标注 **`ssot`/`data_source`** 与 **`db::fetch_*_for_aggregate`** 投影表同源；**`cross_check`** 与 **`fee_pool_cross_check_json`** / **`protocol_reference_json`** 片段一致。
#[test]
fn b084_fee_pool_aggregate_body_projection_ssot_and_cross_check_protocol_reference() {
    use crate::routes::governance_doc_reference;

    let fr = vec![db::FeeRouterAggregateSourceRow {
        token_address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string(),
        amount_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000001"
            .to_string(),
        to_country_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000000"
            .to_string(),
        to_stakers_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000000"
            .to_string(),
        to_reserve_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000000"
            .to_string(),
        to_ops_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000000"
            .to_string(),
    }];
    let rv = vec![db::RegionVaultAggregateSourceRow {
        token_address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".to_string(),
        to_address: "0xcccccccccccccccccccccccccccccccccccccccc".to_string(),
        amount_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000002"
            .to_string(),
    }];
    let v = build_fee_pool_aggregate_body(Some(137), fr, rv).expect("ok");
    assert_eq!(
        v["ssot"].as_str(),
        Some("fee_router_routed_events+region_vault_forwarded_events")
    );
    assert_eq!(v["data_source"].as_str(), Some("projection"));
    assert!(
        v["fee_router"]["note"]
            .as_str()
            .unwrap_or("")
            .contains("PlatformFeeRouted"),
        "fee_router.note should name indexed projection"
    );
    assert!(
        v["region_vault"]["note"]
            .as_str()
            .unwrap_or("")
            .contains("RegionVaultForwarded"),
        "region_vault.note should name projection"
    );
    let cc = fee_pool_cross_check_json();
    assert_eq!(v["cross_check"], cc);
    let pref = governance_doc_reference::protocol_reference_json();
    assert_eq!(cc["protocol_reference_doc_version"], pref["doc_version"]);
    assert_eq!(
        cc["phase1_open_fee_points_sum"],
        pref["checksums"]["phase1_open_fee_points_sum"]
    );
    assert_eq!(
        cc["fee_router_layer1_country_bucket_percent"],
        pref["checksums"]["country_bucket_percent"]
    );
    assert_eq!(
        cc["phase1_countries_count"],
        json!(pref["phase1_countries"].as_array().map(|a| a.len()))
    );
    assert_eq!(v["fee_router"]["by_token"].as_array().unwrap().len(), 1);
    assert_eq!(v["region_vault"]["by_token"].as_array().unwrap().len(), 1);
    db::assert_fee_pool_aggregates_root_excludes_governance_pool_ssot_keys(&v);
    db::assert_fee_pool_aggregates_root_orthogonal_b1155_snapshot_claim_distribution(&v);
    let pools = &v["fee_router"]["by_token"][0]["pools"];
    for k in [
        "allocatable_platform_fee_total_u256_hex",
        "country_bucket_u256_hex",
        "global_stakers_u256_hex",
        "global_reserve_u256_hex",
        "global_ops_u256_hex",
    ] {
        let h = pools[k].as_str().expect("pool u256 hex");
        assert!(h.starts_with("0x") && h.len() > 2, "key {k} must be 0x-hex");
    };    let rv_tok = &v["region_vault"]["by_token"][0];
    assert_eq!(rv_tok["event_row_count"].as_u64(), Some(1));
    assert!(rv_tok["total_forwarded_u256_hex"].as_str().is_some());
    let br = rv_tok["by_recipient"].as_array().expect("by_recipient");
    assert_eq!(br.len(), 1);
    assert!(br[0]["to_address"].as_str().is_some());
    assert!(br[0]["amount_u256_hex"].as_str().is_some());
}

/// **TT-B084-GET-FEE-POOL-AGGREGATES-PATH-001**：**`GET /api/v1/governance/fee-pool-aggregates`**（**`router()`**）与 **`get_governance_fee_pool_aggregates`** 同源 **`cross_check`** / **`ssot`**。
#[tokio::test]
async fn b084_get_fee_pool_aggregates_http_route_placeholder_cross_check() {
    use axum::body::Body;
    use axum::http::{Request, StatusCode};
    use tower::util::ServiceExt;

    let app = router().with_state(api_meta_state(None));
    let res = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/governance/fee-pool-aggregates")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let bytes = res.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(v["cross_check"], fee_pool_cross_check_json());
    assert_eq!(
        v["ssot"].as_str(),
        Some("fee_router_routed_events+region_vault_forwarded_events")
    );
    db::assert_fee_pool_aggregates_root_excludes_governance_pool_ssot_keys(&v);
    db::assert_fee_pool_aggregates_root_orthogonal_b1155_snapshot_claim_distribution(&v);
}

/// B-116-3-3：多 token / 多收款方 Σ 形状 + 根级不得冒充 **`governance/pool`**（B110-SSOT-07）。
#[test]
fn b116_3_3_fee_pool_aggregate_projection_shape_and_no_pool_root_keys() {
    let w0 = "0x0000000000000000000000000000000000000000000000000000000000000001";
    let z = "0x0000000000000000000000000000000000000000000000000000000000000000";
    let fr = vec![
        db::FeeRouterAggregateSourceRow {
            token_address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string(),
            amount_u256_hex: w0.to_string(),
            to_country_u256_hex: w0.to_string(),
            to_stakers_u256_hex: z.to_string(),
            to_reserve_u256_hex: z.to_string(),
            to_ops_u256_hex: z.to_string(),
        },
        db::FeeRouterAggregateSourceRow {
            token_address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".to_string(),
            amount_u256_hex: w0.to_string(),
            to_country_u256_hex: z.to_string(),
            to_stakers_u256_hex: w0.to_string(),
            to_reserve_u256_hex: z.to_string(),
            to_ops_u256_hex: z.to_string(),
        },
    ];
    let rv = vec![
        db::RegionVaultAggregateSourceRow {
            token_address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string(),
            to_address: "0xcccccccccccccccccccccccccccccccccccccccc".to_string(),
            amount_u256_hex: w0.to_string(),
        },
        db::RegionVaultAggregateSourceRow {
            token_address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string(),
            to_address: "0xdddddddddddddddddddddddddddddddddddddddd".to_string(),
            amount_u256_hex: w0.to_string(),
        },
    ];
    let v = build_fee_pool_aggregate_body(Some(7), fr, rv).expect("ok");
    assert_eq!(v["data_source"].as_str(), Some("projection"));
    db::assert_fee_pool_aggregates_root_excludes_governance_pool_ssot_keys(&v);
    db::assert_fee_pool_aggregates_root_orthogonal_b1155_snapshot_claim_distribution(&v);
    assert_ne!(
        v["data_source"].as_str(),
        Some("chain_read"),
        "fee-pool-aggregates root data_source must not be chain_read"
    );
    let fr_bt = v["fee_router"]["by_token"].as_array().unwrap();
    assert_eq!(fr_bt.len(), 2);
    for item in fr_bt {
        let pools = &item["pools"];
        for k in [
            "allocatable_platform_fee_total_u256_hex",
            "country_bucket_u256_hex",
            "global_stakers_u256_hex",
            "global_reserve_u256_hex",
            "global_ops_u256_hex",
        ] {
            assert!(
                pools[k].as_str().is_some_and(|s| s.starts_with("0x")),
                "missing pools.{k}"
            );
        }
    };    let rv_bt = v["region_vault"]["by_token"].as_array().unwrap();
    assert_eq!(rv_bt.len(), 1);
    assert_eq!(rv_bt[0]["event_row_count"].as_u64(), Some(2));
    let br = rv_bt[0]["by_recipient"].as_array().unwrap();
    assert_eq!(br.len(), 2);
}

#[test]
fn fee_pool_aggregate_body_sums_two_fr_rows_same_token() {
    let fr = vec![
        db::FeeRouterAggregateSourceRow {
            token_address: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string(),
            amount_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000001"
                .to_string(),
            to_country_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000002".to_string(),
            to_stakers_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000003".to_string(),
            to_reserve_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000004".to_string(),
            to_ops_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000005"
                .to_string(),
        },
        db::FeeRouterAggregateSourceRow {
            token_address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA".to_string(),
            amount_u256_hex: "0x000000000000000000000000000000000000000000000000000000000000000a"
                .to_string(),
            to_country_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000001".to_string(),
            to_stakers_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_reserve_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_ops_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000000"
                .to_string(),
        },
    ];
    let v = build_fee_pool_aggregate_body(Some(1), fr, vec![]).expect("ok");
    db::assert_fee_pool_aggregates_root_excludes_governance_pool_ssot_keys(&v);
    db::assert_fee_pool_aggregates_root_orthogonal_b1155_snapshot_claim_distribution(&v);
    assert_fee_pool_aggregates_has_no_root_country_pool_ssot_keys(&v);
    assert_fee_pool_aggregates_has_no_root_treasury_pool_ssot_keys(&v);
    assert_fee_pool_aggregates_has_no_root_treasury_erc20_pool_ssot_keys(&v);
    let arr = v["fee_router"]["by_token"].as_array().unwrap();
    assert_eq!(arr.len(), 1);
    let pools = &arr[0]["pools"];
    assert_eq!(
        pools["allocatable_platform_fee_total_u256_hex"]
            .as_str()
            .unwrap(),
        "0x000000000000000000000000000000000000000000000000000000000000000b"
    );
    assert_eq!(
        pools["country_bucket_u256_hex"].as_str().unwrap(),
        "0x0000000000000000000000000000000000000000000000000000000000000003"
    );
    assert_eq!(arr[0]["event_row_count"].as_u64(), Some(2));
}

/// **TT-SSOT-AGGREGATE-EXCLUDE-ERC20-POOL-006**：即使 **`/governance/pool`** 根级可带 **`treasury_erc20_pool*`**，**Σ** 体也**不得**含该三键；聚合结果与「从未在 Σ JSON 根级引入该字段」一致（仅 **`fee_router` / `region_vault`** 树参与累计）。
#[test]
fn fee_pool_aggregate_body_excludes_treasury_erc20_pool_ssot_root_keys() {
    let fr = vec![db::FeeRouterAggregateSourceRow {
        token_address: "0xcccccccccccccccccccccccccccccccccccccccc".to_string(),
        amount_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000001"
            .to_string(),
        to_country_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000000"
            .to_string(),
        to_stakers_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000000"
            .to_string(),
        to_reserve_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000000"
            .to_string(),
        to_ops_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000000"
            .to_string(),
    }];
    let rv = vec![db::RegionVaultAggregateSourceRow {
        token_address: "0xdddddddddddddddddddddddddddddddddddddddd".to_string(),
        to_address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee".to_string(),
        amount_u256_hex: "0x0000000000000000000000000000000000000000000000000000000000000002"
            .to_string(),
    }];
    let v = build_fee_pool_aggregate_body(Some(42), fr.clone(), rv.clone()).expect("ok");
    db::assert_fee_pool_aggregates_root_excludes_governance_pool_ssot_keys(&v);
    db::assert_fee_pool_aggregates_root_orthogonal_b1155_snapshot_claim_distribution(&v);
    assert_fee_pool_aggregates_has_no_root_treasury_erc20_pool_ssot_keys(&v);

    let mut polluted = v.clone();
    if let Some(m) = polluted.as_object_mut() {
        m.insert(
            "treasury_erc20_pool".to_string(),
            json!("0x0000000000000000000000000000000000000000000000000de0b6b3a7640000"),
        );
        m.insert(
            "treasury_erc20_pool_data_source".to_string(),
            json!("chain_read"),
        );
        m.insert("treasury_erc20_pool_is_chain_ssot".to_string(), json!(true));
    };    let baseline = build_fee_pool_aggregate_body(Some(42), fr, rv).expect("ok");
    db::assert_fee_pool_aggregates_root_excludes_governance_pool_ssot_keys(&baseline);
    db::assert_fee_pool_aggregates_root_orthogonal_b1155_snapshot_claim_distribution(&baseline);
    assert_fee_pool_aggregates_has_no_root_treasury_erc20_pool_ssot_keys(&baseline);
    assert_eq!(
        v, baseline,
        "Σ body must not depend on treasury_erc20_pool*"
    );
    assert_ne!(
        polluted, baseline,
        "sanity: polluted JSON differs only by injected pool SSOT keys"
    );
    assert!(
        polluted.get("treasury_erc20_pool").is_some(),
        "sanity: clone was polluted with treasury_erc20_pool"
    );
}
