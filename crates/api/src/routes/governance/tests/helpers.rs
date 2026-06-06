//! Shared helpers for **`governance`** route tests.

use super::super::get_governance_pool;
use crate::state::ApiMetaState;
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use http_body_util::BodyExt;
use serde_json::json;

/// **B110-SSOT-07 / TT-SSOT-SWITCH-APPLY-001**：`fee-pool-aggregates`（含 **`build_fee_pool_aggregate_body`** Σ 体）**不得**带 **`GET …/governance/pool`** 根级 **`country_pool*`** 链上主读键，以免与 **RegionVault `balanceOf`** SSOT 混淆。
pub(super) fn assert_fee_pool_aggregates_has_no_root_country_pool_ssot_keys(v: &serde_json::Value) {
    assert!(
        v.get("country_pool").is_none(),
        "fee-pool-aggregates response must not include root country_pool"
    );
    assert!(
        v.get("country_pool_data_source").is_none(),
        "fee-pool-aggregates must not include country_pool_data_source"
    );
    assert!(
        v.get("country_pool_is_chain_ssot").is_none(),
        "fee-pool-aggregates must not include country_pool_is_chain_ssot"
    );
}

/// **B110-SSOT-07 / TT-SSOT-SWITCH-APPLY-002**：`fee-pool-aggregates`（含 **`build_fee_pool_aggregate_body`** Σ 体）**不得**带 **`GET …/governance/pool`** 根级 **`treasury_pool*`** 链上主读键，以免与 **`eth_getBalance(GovernanceTreasury)`** SSOT 混淆。
pub(super) fn assert_fee_pool_aggregates_has_no_root_treasury_pool_ssot_keys(
    v: &serde_json::Value,
) {
    assert!(
        v.get("treasury_pool").is_none(),
        "fee-pool-aggregates response must not include root treasury_pool"
    );
    assert!(
        v.get("treasury_pool_data_source").is_none(),
        "fee-pool-aggregates must not include treasury_pool_data_source"
    );
    assert!(
        v.get("treasury_pool_is_chain_ssot").is_none(),
        "fee-pool-aggregates must not include treasury_pool_is_chain_ssot"
    );
}

/// **B110-SSOT-07 / TT-SSOT-AGGREGATE-EXCLUDE-ERC20-POOL-006**：`fee-pool-aggregates`（含 **`build_fee_pool_aggregate_body`** Σ 体）**不得**带 **`GET …/governance/pool`** 根级 **`treasury_erc20_pool*`** 链上主读键；**Σ** 仅投影 **`fee_router` / `region_vault`**，与 **`ERC20.balanceOf(GovernanceTreasury)`** SSOT 无关。
pub(super) fn assert_fee_pool_aggregates_has_no_root_treasury_erc20_pool_ssot_keys(
    v: &serde_json::Value,
) {
    assert!(
        v.get("treasury_erc20_pool").is_none(),
        "fee-pool-aggregates response must not include root treasury_erc20_pool"
    );
    assert!(
        v.get("treasury_erc20_pool_data_source").is_none(),
        "fee-pool-aggregates must not include treasury_erc20_pool_data_source"
    );
    assert!(
        v.get("treasury_erc20_pool_is_chain_ssot").is_none(),
        "fee-pool-aggregates must not include treasury_erc20_pool_is_chain_ssot"
    );
}

/// **`GET …/governance/pool`** **`chain_alignment_hint`**：三键在 **非链上 SSOT** 路径下与 **04** 叙事一致（**`database` / `database_empty` / `placeholder`**）。
pub(super) fn assert_governance_pool_chain_alignment_hint_projection_not_aligned(
    h: &serde_json::Value,
) {
    assert_eq!(h.get("is_chain_ssot"), Some(&json!(false)));
    assert_eq!(
        h.get("data_source").and_then(|x| x.as_str()),
        Some("projection")
    );
    assert_eq!(
        h.get("chain_alignment_status").and_then(|x| x.as_str()),
        Some("not_aligned")
    );
}

pub(super) async fn governance_pool_response_json(state: ApiMetaState) -> serde_json::Value {
    let res = get_governance_pool(State(state)).await.into_response();
    assert_eq!(res.status(), StatusCode::OK);
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).expect("pool json")
}
