//! 按领域聚合路由：各子模块提供 `router()`，于此处 `merge` 后由 `router::app` 统一 `.with_state`。
//! **域清单与 `merge` 次数 SSOT**：`docs/spec/07` §零 0.6、`docs/spec/14` §2.1、`docs/spec/04` §3.4、`crates/api/src/routes/mod.rs`（与历史阶段文 **48** §三 / §11.6 对读，**不**以阶段文替代上述 SSOT）。

mod catalog;
mod growth;
mod official;
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
pub(crate) mod governance_doc_reference;
mod governance_proposals;
mod governance_voting_power;
mod governance_state_machines;
mod guides;
mod health_meta;
mod hooks;
mod intents;
mod internal;
mod investor_distribution;
mod itineraries;
mod me;
mod me_security;
mod me_subroutes;
mod me_profile_avatar;
mod me_referrals;
mod me_market_bookmarks;
mod media;
mod messages;
mod onboarding;
mod provider_applications;
mod market_subsite;
mod market_subsite_list_query;
mod market_merchant_gate;
mod acquisition_publish_gate;
mod orders;
mod redemption;
mod steward;
mod traveltrust_page;
mod public_announcements;
mod public_roadmap;
mod trust_growth;

#[cfg(test)]
mod governance_read_contract_contract_tests;

#[cfg(test)]
mod admin_read_contract_contract_tests;

#[cfg(test)]
mod read_contract_route_guard;

#[cfg(test)]
mod market_subsite_catalog_db_api_tests;

#[cfg(test)]
mod profile_avatar_env_serial;
#[cfg(test)]
mod me_profile_avatar_db_api_tests;
#[cfg(test)]
mod me_profile_avatar_http_contract_tests;
#[cfg(test)]
mod me_profile_avatar_s3_minio_db_api_tests;

use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use axum::Router;
use serde_json::json;

use crate::state::ApiMetaState;

/// 501 占位响应，供各 route 模块使用（契约说明见 **`docs/spec/04`** §三；域清单见 **07** §零 0.6、**14** §2.1）。
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
        .merge(catalog::router())
        .merge(growth::router())
        .merge(official::router())
        .merge(admin::router())
        .merge(me::router())
        .merge(me_security::router())
        .merge(me_subroutes::router())
        .merge(me_referrals::router())
        .merge(me_market_bookmarks::router())
        .merge(guides::router())
        .merge(orders::router())
        .merge(traveltrust_page::router())
        .merge(public_announcements::router())
        .merge(public_roadmap::router())
        .merge(itineraries::router())
        .merge(discover::router())
        .merge(messages::router())
        .merge(disputes::router())
        .merge(evidence::router())
        .merge(media::router())
        .merge(intents::router())
        .merge(community::router())
        .merge(onboarding::router())
        .merge(hooks::router())
        .merge(provider_applications::router())
        .merge(market_subsite::router())
        .merge(country_ledger_jurisdiction::router())
        .merge(did_rank::router())
        .merge(governance::router())
        .merge(steward::router())
        .merge(redemption::router())
        .merge(trust_growth::router())
        .merge(internal::router())
}
