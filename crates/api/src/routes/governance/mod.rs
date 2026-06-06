//! /api/v1/governance（49 G 治理与激励；04 §3.4、49 G.4、50-G1；**protocol-reference** 见 84 文档镜像；**`GET …/governance/params`** 占位聚合见 **B-124**）
//! 有 DB 时从 governance_pool / governance_reward_records / fee_router_routed_events / region_vault_forwarded_events 读取；无 DB 时返回占位。
//! **fee-pool-aggregates**（B-084）：对两投影表按 token / pool_id 做 **uint256 Σ**（只读对账）。
//! 发放逻辑（谁在何时获得多少）待产品定稿后补，见 50 §六附、04 §3.4。
//! Target 语义：FeeRouter/链上治理未部署时，本路由**不得**被理解为链上池真值；占位响应带 `X-Implementation-Status: placeholder`（82 §六 T6、83 SSOT）。
//! TT-MOD-B3-04：第一层目录化（`routes/governance/mod.rs`）；move-only；HTTP/JSON/守卫语义未改。
//! TT-MOD-B3-05：第二层分域（`common` / `pool_chain` / `governance_pool` / `governance_reads` / `fee_pool_aggregate` / `doc_params` / `router`）；move-only；对外 `router()` 与 `crate::routes::governance::*` 导出不变。

mod common;
mod doc_params;
mod fee_pool_aggregate;
mod governance_pool;
mod governance_reads;
mod pool_chain;
mod governance_pool_meta_alignment_b177;
mod router;
mod state_machines;

/// `router` 与 `doc_params` 直连；**`get_protocol_reference`** 供 **`admin_cross_check`** 等同源组装；其余供契约测试。
pub use doc_params::get_protocol_reference;
#[cfg(test)]
pub use doc_params::{get_governance_params, get_protocol_reference_pending};
pub use fee_pool_aggregate::{get_governance_fee_pool_aggregates, FeePoolAggregatesQuery};
pub(crate) use fee_pool_aggregate::fee_pool_cross_check_from_pref;
pub use governance_pool::get_governance_pool;
#[cfg(test)]
pub use governance_reads::{
    get_governance_fee_routes, get_governance_rewards, get_governance_vault_forwards, FeeRoutesQuery,
};
pub(crate) use pool_chain::pool_ssot_parallel_chain_snapshot;
pub(crate) use governance_pool_meta_alignment_b177::governance_pool_meta_chain_alignment_observability_b177;
pub use router::router;

#[cfg(test)]
mod tests {
    use super::*;
    use super::fee_pool_aggregate::{build_fee_pool_aggregate_body, fee_pool_cross_check_json};
    use super::doc_params::{
        GOV_HTTP_IMPL_STATUS_DOC_REFERENCE, GOV_HTTP_IMPL_STATUS_DOC_REFERENCE_PENDING,
    };
    use super::pool_chain::{
        balance_consistency_hint_from_balance_reads, fee_router_alignment_reads_from_eth_results,
        fee_router_balance_read_from_eth_result, fee_router_erc20_balance_read_from_optional,
        pool_chain_alignment_hint,
    };
    use axum::response::IntoResponse;
    use crate::chain::ChainConfig;
    use crate::db;
    use crate::routes::governance_doc_reference;
    use crate::routes::governance_proposals::get_governance_proposals_list;
    use crate::state::test_support::api_meta_state;
    use crate::state::ApiMetaState;
    use axum::extract::Query;

    /// **B110-SSOT-07 / TT-SSOT-SWITCH-APPLY-001**：`fee-pool-aggregates`（含 **`build_fee_pool_aggregate_body`** Σ 体）**不得**带 **`GET …/governance/pool`** 根级 **`country_pool*`** 链上主读键，以免与 **RegionVault `balanceOf`** SSOT 混淆。
    fn assert_fee_pool_aggregates_has_no_root_country_pool_ssot_keys(v: &serde_json::Value) {
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
    fn assert_fee_pool_aggregates_has_no_root_treasury_pool_ssot_keys(v: &serde_json::Value) {
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
    fn assert_fee_pool_aggregates_has_no_root_treasury_erc20_pool_ssot_keys(v: &serde_json::Value) {
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
    use axum::extract::State;
    use axum::http::StatusCode;
    use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
    use http_body_util::BodyExt;
    use serde_json::json;
    use sqlx::postgres::PgPoolOptions;
    use std::sync::Arc;
    use std::time::Duration;
    use tokio::sync::RwLock;

    /// **`GET …/governance/pool`** **`chain_alignment_hint`**：三键在 **非链上 SSOT** 路径下与 **04** 叙事一致（**`database` / `database_empty` / `placeholder`**）。
    fn assert_governance_pool_chain_alignment_hint_projection_not_aligned(h: &serde_json::Value) {
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

    async fn governance_pool_response_json(state: ApiMetaState) -> serde_json::Value {
        let res = get_governance_pool(State(state)).await.into_response();
        assert_eq!(res.status(), StatusCode::OK);
        let body = res.into_body().collect().await.unwrap().to_bytes();
        serde_json::from_slice(&body).expect("pool json")
    }

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
    async fn governance_pool_database_branches_chain_alignment_hint_consistency_when_database_url_set(
    ) {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!(
                    "governance_pool database/database_empty branches: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        let pool = match PgPoolOptions::new()
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
    ) -> (axum::http::StatusCode, axum::http::HeaderMap, serde_json::Value) {
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
        };
        let pool = match PgPoolOptions::new()
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
        };
        let co = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(pool),
        };
        let (status, headers, v) =
            governance_rewards_response_parts(api_meta_state(Some(co))).await;
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

    async fn governance_params_response_parts(
    ) -> (axum::http::StatusCode, axum::http::HeaderMap, serde_json::Value) {
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
    ) -> (axum::http::StatusCode, axum::http::HeaderMap, serde_json::Value) {
        let res = get_governance_proposals_list(State(state)).await.into_response();
        let status = res.status();
        let headers = res.headers().clone();
        let body = res.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).expect("governance proposals json");
        (status, headers, v)
    }

    /// 非 Governor 索引路径：**JSON** **`data_source`** 为 **`chain_off_mvp`**（**`X-Implementation-Status: chain_off_mvp`**），与 **`governance.rs`** 根级 **`placeholder`** 头不同源。
    #[tokio::test]
    async fn governance_proposals_response_placeholder_branch() {
        let (status, headers, v) =
            governance_proposals_response_parts(api_meta_state(None)).await;
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
                eprintln!(
                    "governance_proposals projection branch: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        let pool = match PgPoolOptions::new()
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
        };
        if sqlx::query("SELECT 1 FROM governance_proposals_projection LIMIT 1")
            .fetch_optional(&pool)
            .await
            .is_err()
        {
            eprintln!(
                "governance_proposals projection branch: skip (governance_proposals_projection missing)"
            );
            return;
        }

        let co = ChainOffState {
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
        assert!(
            fee_router_erc20_balance_read_from_optional(Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"), None)
                .is_null()
        );
        assert!(
            fee_router_erc20_balance_read_from_optional(
                Some("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
                Some(Err("rpc".into())),
            )
            .is_null()
        );
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

        let (_, _, d) =
            fee_router_alignment_reads_from_eth_results(&Ok(true), &Err("bps fail".into()));
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
        assert_eq!(hint["ssot_parallel_chain_snapshot"]["is_chain_ssot"], json!(false));
        assert!(hint["ssot_parallel_chain_snapshot"]["fee_router_erc20_balance_read"].is_null());
        assert_eq!(
            hint["chain_config_source"].as_str(),
            Some("unmounted")
        );
        assert_eq!(hint["is_chain_ssot"], json!(false));
        assert_eq!(
            hint["chain_alignment_status"].as_str(),
            Some("not_aligned")
        );
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
        assert_eq!(hint["ssot_parallel_chain_snapshot"]["is_chain_ssot"], json!(false));
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
        assert_eq!(hint["ssot_parallel_chain_snapshot"]["is_chain_ssot"], json!(false));
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
        assert_eq!(fee_pool_cross_check_from_pref(&pref), fee_pool_cross_check_json());
        let pending = governance_doc_reference::protocol_reference_pending_merged(None);
        assert_eq!(
            pending["pending_package_source"].as_str(),
            Some("mirror")
        );
        assert_eq!(fee_pool_cross_check_from_pref(&pending), fee_pool_cross_check_json());
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
        assert_eq!(reads[0]["relative_path"].as_str(), Some("/api/v1/governance/protocol-reference"));
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
        let d = v
            .get("detail")
            .and_then(|x| x.as_str())
            .unwrap_or_default();
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
        let d = v
            .get("detail")
            .and_then(|x| x.as_str())
            .unwrap_or_default();
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
        };
        let pool = match PgPoolOptions::new()
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
        };

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
        for (bn, li) in [
            (100i64, 0i32),
            (100, 1),
            (99, 0),
            (98, 0),
            (97, 0),
        ] {
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
            res_page1
                .headers()
                .get("x-implementation-status")
                .is_none(),
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

    #[tokio::test]
    async fn governance_vault_forwards_limit_zero_returns_400() {
        let res = get_governance_vault_forwards(
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
        let d = v
            .get("detail")
            .and_then(|x| x.as_str())
            .unwrap_or_default();
        assert!(!d.is_empty(), "detail should carry human hint");
    }

    /// B-116-3-2：`limit` 超过 100 时钳位，不返回 400（无 DB 时落入占位枝）。
    #[tokio::test]
    async fn governance_vault_forwards_limit_above_max_clamps_without_400() {
        let res = get_governance_vault_forwards(
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

    fn assert_governance_vault_forward_item_contract(item: &serde_json::Value) {
        for k in [
            "id",
            "chain_id",
            "block_number",
            "log_index",
            "block_hash",
            "tx_hash",
            "vault_address",
            "token_address",
            "to_address",
            "amount_u256_hex",
            "inserted_at",
        ] {
            assert!(item.get(k).is_some(), "missing item key {k}");
        }
    }

    /// B-116-3-2：分页、`chain_id` 过滤与 `items`/`page` 形状（需已迁移 PG + `region_vault_forwarded_events`）。
    #[tokio::test]
    async fn governance_vault_forwards_database_branch_pagination_chain_filter_and_item_shape() {
        let url = match std::env::var("DATABASE_URL") {
            Ok(u) if !u.trim().is_empty() => u,
            _ => {
                eprintln!(
                    "governance_vault_forwards_database_branch_pagination_chain_filter_and_item_shape: skip (DATABASE_URL unset)"
                );
                return;
            }
        };
        let pool = match PgPoolOptions::new()
            .max_connections(3)
            .acquire_timeout(Duration::from_secs(5))
            .connect(&url)
            .await
        {
            Ok(p) => p,
            Err(e) => {
                eprintln!("governance_vault_forwards DB branch: skip (connect failed): {e}");
                return;
            }
        };

        const CHAIN_A: i64 = 999_991_641;
        const CHAIN_B: i64 = 999_991_642;
        sqlx::query("DELETE FROM region_vault_forwarded_events WHERE chain_id = $1 OR chain_id = $2")
            .bind(CHAIN_A)
            .bind(CHAIN_B)
            .execute(&pool)
            .await
            .expect("cleanup region_vault_forwarded_events");

        let vault = "0x2222222222222222222222222222222222222222";
        let token = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        let to_a = "0xcccccccccccccccccccccccccccccccccccccccc";
        let amt = "0x000000000000000000000000000000000000000000000000000000000000002a";
        for (bn, li) in [
            (100i64, 0i32),
            (100, 1),
            (99, 0),
            (98, 0),
            (97, 0),
        ] {
            db::insert_region_vault_forwarded_event(
                &pool,
                CHAIN_A,
                bn,
                li,
                "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
                vault,
                token,
                to_a,
                amt,
            )
            .await
            .expect("insert CHAIN_A");
        }
        db::insert_region_vault_forwarded_event(
            &pool,
            CHAIN_B,
            200,
            0,
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
            vault,
            token,
            to_a,
            amt,
        )
        .await
        .expect("insert CHAIN_B");

        let co = ChainOffState {
            store: Arc::new(RwLock::new(ChainOffStore::default())),
            config: ChainOffConfig::default(),
            db_pool: Some(pool.clone()),
        };
        let state = api_meta_state(Some(co));

        let res_page1 = get_governance_vault_forwards(
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
            res_page1
                .headers()
                .get("x-implementation-status")
                .is_none(),
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
        assert_governance_vault_forward_item_contract(&items[0]);
        let page = v["page"].as_object().expect("page");
        assert_eq!(page.get("has_more"), Some(&json!(true)));
        assert_eq!(
            page.get("next_cursor").and_then(|x| x.as_str()),
            Some("100:0")
        );

        let res_page2 = get_governance_vault_forwards(
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

        let res_tail = get_governance_vault_forwards(
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

        sqlx::query("DELETE FROM region_vault_forwarded_events WHERE chain_id = $1 OR chain_id = $2")
            .bind(CHAIN_A)
            .bind(CHAIN_B)
            .execute(&pool)
            .await
            .expect("cleanup tail");
    }

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
        assert_eq!(v["fee_router"]["by_token"].as_array().map(|a| a.len()), Some(0));
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
            amount_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000001".to_string(),
            to_country_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_stakers_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_reserve_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_ops_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
        }];
        let rv = vec![db::RegionVaultAggregateSourceRow {
            token_address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".to_string(),
            to_address: "0xcccccccccccccccccccccccccccccccccccccccc".to_string(),
            amount_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000002".to_string(),
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
        }
        let rv_tok = &v["region_vault"]["by_token"][0];
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
        }
        let rv_bt = v["region_vault"]["by_token"].as_array().unwrap();
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
                amount_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000001"
                        .to_string(),
                to_country_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000002"
                        .to_string(),
                to_stakers_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000003"
                        .to_string(),
                to_reserve_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000004"
                        .to_string(),
                to_ops_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000005"
                        .to_string(),
            },
            db::FeeRouterAggregateSourceRow {
                token_address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA".to_string(),
                amount_u256_hex:
                    "0x000000000000000000000000000000000000000000000000000000000000000a"
                        .to_string(),
                to_country_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000001"
                        .to_string(),
                to_stakers_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000000"
                        .to_string(),
                to_reserve_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000000"
                        .to_string(),
                to_ops_u256_hex:
                    "0x0000000000000000000000000000000000000000000000000000000000000000"
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
            pools["allocatable_platform_fee_total_u256_hex"].as_str().unwrap(),
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
            amount_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000001".to_string(),
            to_country_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_stakers_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_reserve_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
            to_ops_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000000".to_string(),
        }];
        let rv = vec![db::RegionVaultAggregateSourceRow {
            token_address: "0xdddddddddddddddddddddddddddddddddddddddd".to_string(),
            to_address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee".to_string(),
            amount_u256_hex:
                "0x0000000000000000000000000000000000000000000000000000000000000002".to_string(),
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
            m.insert("treasury_erc20_pool_data_source".to_string(), json!("chain_read"));
            m.insert("treasury_erc20_pool_is_chain_ssot".to_string(), json!(true));
        }
        let baseline = build_fee_pool_aggregate_body(Some(42), fr, rv).expect("ok");
        db::assert_fee_pool_aggregates_root_excludes_governance_pool_ssot_keys(&baseline);
        db::assert_fee_pool_aggregates_root_orthogonal_b1155_snapshot_claim_distribution(&baseline);
        assert_fee_pool_aggregates_has_no_root_treasury_erc20_pool_ssot_keys(&baseline);
        assert_eq!(v, baseline, "Σ body must not depend on treasury_erc20_pool*");
        assert_ne!(
            polluted, baseline,
            "sanity: polluted JSON differs only by injected pool SSOT keys"
        );
        assert!(
            polluted.get("treasury_erc20_pool").is_some(),
            "sanity: clone was polluted with treasury_erc20_pool"
        );
    }

    #[tokio::test]
    async fn governance_vault_forwards_bad_cursor_returns_400() {
        let res = get_governance_vault_forwards(
            State(api_meta_state(None)),
            Query(FeeRoutesQuery {
                limit: None,
                cursor: Some("abc".to_string()),
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
        let d = v
            .get("detail")
            .and_then(|x| x.as_str())
            .unwrap_or_default();
        assert!(!d.is_empty(), "detail should carry human hint");
    }
}
