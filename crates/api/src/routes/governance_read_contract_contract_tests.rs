//! **Read Contract**：公开 **governance** 只读响应与 **`SourceKind`** 语义的最小契约测试（**不**改业务 handler）。

use axum::extract::{Query, State};
use axum::response::IntoResponse;
use http_body_util::BodyExt;
use serde_json::{json, Value};

use crate::routes::governance::{
    FeePoolAggregatesQuery, FeeRoutesQuery, get_governance_fee_pool_aggregates,
    get_governance_fee_routes, get_governance_params, get_governance_pool,
    get_governance_vault_forwards, get_protocol_reference,
};
use crate::routes::governance_doc_reference;
use crate::source_kind::validate_body_matches_source_kind;
use crate::source_kind::SourceKind;
use crate::state::test_support::api_meta_state;

async fn response_json(res: axum::response::Response) -> Value {
    let bytes = res
        .into_body()
        .collect()
        .await
        .expect("body")
        .to_bytes();
    serde_json::from_slice(&bytes).expect("json")
}

fn assert_list_read_no_chain_read_root(body: &Value, label: &str) {
    if let Some(ds) = body.get("data_source").and_then(|v| v.as_str()) {
        assert_ne!(
            ds, "chain_read",
            "{label}: projection list read must not claim root chain_read"
        );
    }
}

#[tokio::test]
async fn read_contract_protocol_reference_matches_reference_kind() {
    let body = response_json(get_protocol_reference().await.into_response()).await;
    validate_body_matches_source_kind(SourceKind::Reference, &body, "protocol-reference")
        .expect("reference read contract");
}

#[tokio::test]
async fn read_contract_protocol_reference_pending_mirror_matches_reference_kind() {
    let body = governance_doc_reference::protocol_reference_pending_merged(None);
    validate_body_matches_source_kind(SourceKind::Reference, &body, "protocol-reference/pending")
        .expect("pending mirror");
}

#[tokio::test]
async fn read_contract_params_is_projection_placeholder() {
    let body = response_json(get_governance_params().await.into_response()).await;
    validate_body_matches_source_kind(SourceKind::Projection, &body, "governance/params")
        .expect("params placeholder");
}

#[tokio::test]
async fn read_contract_pool_placeholder_matches_chain_lane() {
    let st = api_meta_state(None);
    let body = response_json(get_governance_pool(State(st)).await.into_response()).await;
    validate_body_matches_source_kind(SourceKind::ChainSSOT, &body, "governance/pool")
        .expect("pool read contract");
}

#[tokio::test]
async fn read_contract_fee_pool_aggregates_placeholder_matches_projection() {
    let st = api_meta_state(None);
    let body = response_json(
        get_governance_fee_pool_aggregates(State(st), Query(FeePoolAggregatesQuery::default()))
            .await
            .into_response(),
    )
    .await;
    validate_body_matches_source_kind(SourceKind::Projection, &body, "fee-pool-aggregates")
        .expect("fee pool aggregates");
}

#[tokio::test]
async fn read_contract_fee_routes_empty_db_matches_projection_list_shape() {
    let st = api_meta_state(None);
    let q: FeeRoutesQuery = serde_json::from_value(json!({})).expect("empty query");
    let body = response_json(
        get_governance_fee_routes(State(st), Query(q))
            .await
            .into_response(),
    )
    .await;
    assert_list_read_no_chain_read_root(&body, "fee-routes");
    assert!(body.get("items").is_some());
}

#[tokio::test]
async fn read_contract_vault_forwards_empty_db_matches_projection_list_shape() {
    let st = api_meta_state(None);
    let q: FeeRoutesQuery = serde_json::from_value(json!({})).expect("empty query");
    let body = response_json(
        get_governance_vault_forwards(State(st), Query(q))
            .await
            .into_response(),
    )
    .await;
    assert_list_read_no_chain_read_root(&body, "vault-forwards");
    assert!(body.get("items").is_some());
}
