//! Governance 子路由聚合（**TT-MOD-B3-05 · `router`**）。

use axum::routing::get;
use axum::Router;

use crate::state::ApiMetaState;

use super::doc_params::{
    get_governance_params, get_protocol_reference, get_protocol_reference_pending,
};
use super::fee_pool_aggregate::get_governance_fee_pool_aggregates;
use super::governance_pool::get_governance_pool;
use super::governance_reads::{
    get_governance_fee_routes, get_governance_rewards, get_governance_vault_forwards,
};

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/governance/pool", get(get_governance_pool))
        .route("/api/v1/governance/rewards", get(get_governance_rewards))
        .merge(crate::routes::governance_proposals::router())
        .merge(crate::routes::governance_investor_share::router())
        .merge(crate::routes::investor_distribution::governance_router())
        .merge(crate::routes::governance_delegate::router())
        .merge(crate::routes::governance_voting_power::router())
        .merge(crate::routes::governance_country_ledger::router())
        .route(
            "/api/v1/governance/fee-routes",
            get(get_governance_fee_routes),
        )
        .route(
            "/api/v1/governance/vault-forwards",
            get(get_governance_vault_forwards),
        )
        .route(
            "/api/v1/governance/fee-pool-aggregates",
            get(get_governance_fee_pool_aggregates),
        )
        .route(
            "/api/v1/governance/protocol-reference",
            get(get_protocol_reference),
        )
        .route(
            "/api/v1/governance/protocol-reference/pending",
            get(get_protocol_reference_pending),
        )
        .route("/api/v1/governance/params", get(get_governance_params))
        .merge(super::state_machines::state_machines_route())
}
