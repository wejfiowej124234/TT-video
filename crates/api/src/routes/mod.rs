//! 按领域聚合路由（48 §三、§11.6）；各子模块提供 router()，此处 merge 后由 router::app 统一 .with_state。

mod admin;
mod admin_cross_check;
mod auth;
mod community;
mod country_ledger_jurisdiction;
mod did_rank;
mod discover;
mod disputes;
mod evidence;
mod governance;
mod governance_country_ledger;
mod governance_delegation_store;
mod governance_investor_share;
mod governance_delegate;
mod governance_doc_reference;
mod governance_proposals;
mod governance_voting_power;
mod guides;
mod health_meta;
mod intents;
mod internal;
mod investor_distribution;
mod itineraries;
mod me;
mod media;
mod messages;
mod orders;
mod traveltrust_page;

#[cfg(test)]
mod governance_read_contract_contract_tests;

#[cfg(test)]
mod admin_read_contract_contract_tests;

#[cfg(test)]
mod read_contract_route_guard;

use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use axum::Router;
use serde_json::json;

use crate::state::ApiMetaState;

/// 501 占位响应，供各 route 模块使用（48 §4.4）
pub(crate) fn not_impl_json(path: &str) -> impl IntoResponse {
    (
        StatusCode::NOT_IMPLEMENTED,
        Json(json!({
            "status": "not_implemented",
            "error": "not_implemented",
            "message": "not_implemented",
            "path": path,
            "doc": "04 §三"
        })),
    )
}

/// 供 `startup` 写入 `startup_snapshot`（与 GET `/meta` · `build` 同源）。
pub(crate) fn meta_build_for_startup_log() -> (String, String) {
    health_meta::meta_build_for_startup_log()
}

/// 与 GET `/meta` · **`build`** 同源；供 admin observability 等内嵌。
pub(crate) fn meta_build_value() -> serde_json::Value {
    health_meta::meta_build_value()
}

/// 聚合各域 Router，不在此处 .with_state；router.rs 中调用后 .with_state(meta_state).layer(...)。
pub fn api_router() -> Router<ApiMetaState> {
    Router::new()
        .merge(health_meta::router())
        .merge(auth::router())
        .merge(admin::router())
        .merge(me::router())
        .merge(guides::router())
        .merge(orders::router())
        .merge(traveltrust_page::router())
        .merge(itineraries::router())
        .merge(discover::router())
        .merge(messages::router())
        .merge(disputes::router())
        .merge(evidence::router())
        .merge(media::router())
        .merge(intents::router())
        .merge(community::router())
        .merge(country_ledger_jurisdiction::router())
        .merge(did_rank::router())
        .merge(governance::router())
        .merge(internal::router())
}
