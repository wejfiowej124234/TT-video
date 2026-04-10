//! **Task B-1**：**`GET /api/v1/country-ledger/:jurisdiction`** — 仅依据 **辖区账本配置模板** 返回 **`data_source: chain_ssot`**（**无** **`ChainConfig`** 回落、**无** DB 投影）。

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use axum::Router;
use serde_json::json;

use crate::state::ApiMetaState;

/// GET /api/v1/country-ledger/:jurisdiction
pub async fn get_country_ledger_jurisdiction(
    Path(jurisdiction_raw): Path<String>,
    State(state): State<ApiMetaState>,
) -> impl IntoResponse {
    let jurisdiction = jurisdiction_raw.trim().to_ascii_uppercase();
    if jurisdiction.len() != 2
        || !jurisdiction
            .chars()
            .all(|c| c.is_ascii_alphabetic())
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "error",
                "error": "invalid_jurisdiction",
                "message": "invalid_jurisdiction",
                "jurisdiction": jurisdiction_raw.trim(),
            })),
        )
            .into_response();
    }

    if !state
        .jurisdiction_country_ledger_registry
        .has_chain_ssot_entry(&jurisdiction)
    {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({
                "status": "error",
                "error": "jurisdiction_not_in_registry",
                "message": "jurisdiction_not_in_registry",
                "jurisdiction": jurisdiction,
            })),
        )
            .into_response();
    }

    (
        StatusCode::OK,
        Json(json!({
            "jurisdiction": jurisdiction,
            "data_source": "chain_ssot",
        })),
    )
        .into_response()
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/country-ledger/:jurisdiction",
        get(get_country_ledger_jurisdiction),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::jurisdiction_country_ledger_template::JurisdictionCountryLedgerRegistry;
    use crate::state::test_support::api_meta_state;
    use axum::body::Body;
    use axum::Router;
    use http_body_util::BodyExt;
    use serde_json::Value;
    use std::collections::HashMap;
    use std::sync::Arc;
    use tower::util::ServiceExt;

    fn state_with_registry(r: JurisdictionCountryLedgerRegistry) -> ApiMetaState {
        let mut st = api_meta_state(None);
        st.jurisdiction_country_ledger_registry = Arc::new(r);
        st
    }

    #[tokio::test]
    async fn hit_returns_only_jurisdiction_and_chain_ssot() {
        let mut m = HashMap::new();
        m.insert(
            "CN".to_string(),
            "0x1111111111111111111111111111111111111111".to_string(),
        );
        let st = state_with_registry(JurisdictionCountryLedgerRegistry::from_map(m));
        let app = Router::new()
            .merge(router())
            .with_state(st);
        let res = app
            .oneshot(
                axum::http::Request::builder()
                    .uri("/api/v1/country-ledger/cn")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let body: Value = serde_json::from_slice(&bytes).unwrap();
        let mut keys: Vec<_> = body.as_object().unwrap().keys().cloned().collect();
        keys.sort();
        assert_eq!(keys, vec!["data_source", "jurisdiction"]);
        assert_eq!(body["jurisdiction"], "CN");
        assert_eq!(body["data_source"], "chain_ssot");
        assert!(body.get("rule_version").is_none());
        assert!(body.get("fee_pool_aggregates").is_none());
        assert!(body.get("read_status").is_none());
    }

    #[tokio::test]
    async fn miss_is_404_without_chain_config_fallback() {
        let mut st = api_meta_state(None);
        st.jurisdiction_country_ledger_registry =
            Arc::new(JurisdictionCountryLedgerRegistry::empty());
        st.chain_config = Some(crate::chain::ChainConfig {
            rpc_url: "http://127.0.0.1:9".to_string(),
            chain_id: 1,
            escrow_factory_address: None,
            fee_router_address: Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string()),
            region_vault_address: None,
            country_pool_ledger_address: Some(
                "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".to_string(),
            ),
            investor_share_token_addresses: vec![],
            staking_address: None,
            investor_lock_contract_addresses: vec![],
            governor_address: None,
            governance_timelock_address: None,
            governance_votes_token_address: None,
            registry_address: None,
            executor_max_amount_per_tx: None,
            executor_max_amount_per_day: None,
            executor_retry_count: 3,
        });
        let app = Router::new()
            .merge(router())
            .with_state(st);
        let res = app
            .oneshot(
                axum::http::Request::builder()
                    .uri("/api/v1/country-ledger/DE")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::NOT_FOUND);
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let body: Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(body["error"], "jurisdiction_not_in_registry");
    }
}
