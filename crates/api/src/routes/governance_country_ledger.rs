//! P5-1-C：**GET /api/v1/governance/country-ledger/{jurisdiction}** — **`country_ledger_ssot_v0`** 链上只读（与 **B-110** 根级 **`pool_balance` / `country_pool*` / `treasury_*pool*` / `fee_pool_aggregates`** **正交**）。

use axum::extract::{Path, State};
use axum::http::header::{HeaderName, HeaderValue};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use axum::Router;
use serde_json::{json, Map, Value};

use crate::chain;
use crate::state::ApiMetaState;

/// 与 **`CountryPoolLedgerV0.version()`**、**P5-1** 规格一致
pub const COUNTRY_LEDGER_RULE_VERSION: &str = "country_ledger_ssot_v0";

/// 试点 **ERC20**（**分键**于 **`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`**，避免 **B-110** 混读）
pub const COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS_ENV: &str = "COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS";

#[must_use]
pub fn country_ledger_response_has_forbidden_b110_root_key(v: &Value) -> Option<&'static str> {
    let obj = v.as_object()?;
    const BAD: &[&str] = &[
        "fee_pool_aggregates",
        "country_pool",
        "country_pool_data_source",
        "country_pool_is_chain_ssot",
        "treasury_pool",
        "treasury_pool_data_source",
        "treasury_pool_is_chain_ssot",
        "treasury_erc20_pool",
        "treasury_erc20_pool_data_source",
        "treasury_erc20_pool_is_chain_ssot",
    ];
    for k in BAD {
        if obj.contains_key(*k) {
            return Some(k);
        }
    }
    None
}

/// GET /api/v1/governance/country-ledger/:jurisdiction
pub async fn get_governance_country_ledger(
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
                "rule_version": COUNTRY_LEDGER_RULE_VERSION,
                "jurisdiction": jurisdiction_raw.trim(),
            })),
        )
            .into_response();
    }

    let Some(cc) = state.chain_config.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "chain_not_configured",
                "message": "chain_not_configured",
                "rule_version": COUNTRY_LEDGER_RULE_VERSION,
                "jurisdiction": jurisdiction,
            })),
        )
            .into_response();
    };
    if !cc.is_configured() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "status": "error",
                "error": "chain_not_configured",
                "message": "chain_rpc_unconfigured",
                "rule_version": COUNTRY_LEDGER_RULE_VERSION,
                "jurisdiction": jurisdiction,
            })),
        )
            .into_response();
    }

    let rpc = cc.rpc_url.trim();
    let ledger_raw = cc
        .country_pool_ledger_address
        .as_ref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    let token_raw = std::env::var(COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS_ENV)
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());

    let mut m = Map::new();
    m.insert("status".to_string(), json!("ok"));
    m.insert("rule_version".to_string(), json!(COUNTRY_LEDGER_RULE_VERSION));
    m.insert("jurisdiction".to_string(), json!(jurisdiction));
    m.insert("chain_id".to_string(), json!(cc.chain_id));

    let impl_status: &'static str;

    match (&ledger_raw, &token_raw) {
        (None, _) => {
            m.insert(
                "read_status".to_string(),
                json!("skipped_no_ledger_contract_configured"),
            );
            m.insert(
                "data_source".to_string(),
                json!("config"),
            );
            impl_status = "country_ledger_skipped";
        }
        (Some(_ledger), None) => {
            m.insert(
                "read_status".to_string(),
                json!("skipped_no_ssot_token_env"),
            );
            m.insert("data_source".to_string(), json!("config"));
            m.insert(
                "hint".to_string(),
                json!(format!(
                    "set {} for pilot ERC20",
                    COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS_ENV
                )),
            );
            impl_status = "country_ledger_skipped";
        }
        (Some(ledger), Some(token)) => {
            let ledger_n = chain::country_ledger::normalize_evm_address(ledger);
            let token_n = chain::country_ledger::normalize_evm_address(token);
            m.insert("ledger_contract_address".to_string(), json!(ledger_n));
            m.insert("ssot_token_address".to_string(), json!(token_n));

            match chain::country_ledger::eth_call_country_ledger_pilot_jurisdiction(rpc, ledger)
                .await
            {
                Err(e) => {
                    m.insert("read_status".to_string(), json!("pilot_jurisdiction_eth_call_error"));
                    m.insert("error_detail".to_string(), json!(e));
                    impl_status = "country_ledger_partial_read";
                }
                Ok(pilot_id) => {
                    m.insert("pilot_jurisdiction_id".to_string(), json!(&pilot_id));
                    if pilot_id != jurisdiction {
                        m.insert("pilot_matched".to_string(), json!(false));
                        m.insert(
                            "read_status".to_string(),
                            json!("jurisdiction_not_pilot"),
                        );
                        impl_status = "country_ledger_ok";
                    } else {
                        m.insert("pilot_matched".to_string(), json!(true));
                        let j_word = match chain::country_ledger::jurisdiction_id_to_abi_word_hex(&jurisdiction)
                        {
                            Ok(w) => w,
                            Err(e) => {
                                m.insert("read_status".to_string(), json!("internal_jurisdiction_encode_error"));
                                m.insert("error_detail".to_string(), json!(e));
                                impl_status = "country_ledger_partial_read";
                                let body = Value::Object(m);
                                let mut res = Json(body).into_response();
                                res.headers_mut().insert(
                                    HeaderName::from_static("x-implementation-status"),
                                    HeaderValue::from_static(impl_status),
                                );
                                return res;
                            }
                        };
                        // 顺序 `eth_call`：与 FIFO mock（及多数 JSON-RPC 客户端）出队顺序一致；`join!` 并发会导致响应错配 → `partial_chain_read_error`。
                        let bal_r = chain::country_ledger::eth_call_country_ledger_balance(
                            rpc, ledger, token,
                        )
                        .await;
                        let tot_r = chain::country_ledger::eth_call_country_ledger_total_credited(
                            rpc,
                            ledger,
                            &j_word,
                            token,
                        )
                        .await;
                        let ver_r =
                            chain::country_ledger::eth_call_country_ledger_version_string(rpc, ledger)
                                .await;
                        match (bal_r, tot_r, ver_r) {
                            (Ok(bal), Ok(tot), Ok(ver)) => {
                                m.insert(
                                    "ledger_token_balance_u256_hex".to_string(),
                                    json!(bal),
                                );
                                m.insert(
                                    "ledger_total_credited_u256_hex".to_string(),
                                    json!(tot),
                                );
                                m.insert("on_chain_contract_version".to_string(), json!(ver));
                                m.insert("read_status".to_string(), json!("ok"));
                                m.insert("data_source".to_string(), json!("chain_read"));
                                impl_status = "country_ledger_chain_read";
                            }
                            (bal_e, tot_e, ver_e) => {
                                m.insert("read_status".to_string(), json!("partial_chain_read_error"));
                                if let Ok(b) = bal_e {
                                    m.insert(
                                        "ledger_token_balance_u256_hex".to_string(),
                                        json!(b),
                                    );
                                } else if let Err(ref e) = bal_e {
                                    m.insert("balance_read_error".to_string(), json!(e));
                                }
                                if let Ok(t) = tot_e {
                                    m.insert(
                                        "ledger_total_credited_u256_hex".to_string(),
                                        json!(t),
                                    );
                                } else if let Err(ref e) = tot_e {
                                    m.insert("total_credited_read_error".to_string(), json!(e));
                                }
                                if let Ok(v) = ver_e {
                                    m.insert("on_chain_contract_version".to_string(), json!(v));
                                } else if let Err(ref e) = ver_e {
                                    m.insert("version_read_error".to_string(), json!(e));
                                }
                                impl_status = "country_ledger_partial_read";
                            }
                        }
                    }
                }
            }
        }
    }

    let body = Value::Object(m);
    debug_assert!(
        country_ledger_response_has_forbidden_b110_root_key(&body).is_none(),
        "P5-1-C body must not include B-110 pool root keys"
    );
    let mut res = Json(body).into_response();
    res.headers_mut().insert(
        HeaderName::from_static("x-implementation-status"),
        HeaderValue::from_static(impl_status),
    );
    res
}

pub fn router() -> Router<ApiMetaState> {
    Router::new().route(
        "/api/v1/governance/country-ledger/:jurisdiction",
        get(get_governance_country_ledger),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::jsonrpc_mock_server::read_http_request_headers_and_body;
    use crate::state::test_support::api_meta_state;
    use axum::body::Body;
    use axum::Router;
    use http_body_util::BodyExt;
    use tower::util::ServiceExt;
    use std::collections::VecDeque;
    use std::sync::{Arc, Mutex};
    use tokio::io::AsyncWriteExt;
    use tokio::net::TcpListener;

    #[test]
    fn p51c_body_has_no_b110_root_keys_shape() {
        let v = json!({
            "status": "ok",
            "rule_version": COUNTRY_LEDGER_RULE_VERSION,
            "jurisdiction": "DE",
            "chain_id": 1u64,
            "read_status": "skipped_no_ledger_contract_configured",
            "data_source": "config"
        });
        assert!(country_ledger_response_has_forbidden_b110_root_key(&v).is_none());
    }

    #[tokio::test]
    async fn get_country_ledger_de_matches_mock_eth_call_values() {
        let version_hex = "0x0000000000000000000000000000000000000000000000000000000000000020\
             0000000000000000000000000000000000000000000000000000000000000016\
             636f756e7472795f6c65646765725f73736f745f763000000000000000000000";
        let queue: Arc<Mutex<VecDeque<String>>> = Arc::new(Mutex::new(VecDeque::from([
            "0x0000000000000000000000000000000000000000000000000000000000004445"
                .to_string(),
            "0x000000000000000000000000000000000000000000000000000000000000002a"
                .to_string(),
            "0x000000000000000000000000000000000000000000000000000000000000002a"
                .to_string(),
            version_hex.to_string(),
        ])));

        let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind");
        let port = listener.local_addr().unwrap().port();
        let q = Arc::clone(&queue);
        tokio::spawn(async move {
            loop {
                let Ok((mut socket, _)) = listener.accept().await else {
                    break;
                };
                let qc = Arc::clone(&q);
                tokio::spawn(async move {
                    let Ok(buf) = read_http_request_headers_and_body(&mut socket).await else {
                        return;
                    };
                    let sep = buf.windows(4).position(|w| w == b"\r\n\r\n").unwrap_or(0) + 4;
                    let Ok(v) = serde_json::from_slice::<serde_json::Value>(&buf[sep..]) else {
                        return;
                    };
                    let method = v.get("method").and_then(|m| m.as_str()).unwrap_or("");
                    let id = v.get("id").cloned().unwrap_or(json!(1));
                    let result = if method == "eth_call" {
                        let mut g = qc.lock().expect("lock");
                        g.pop_front().unwrap_or_else(|| "0x".to_string())
                    } else {
                        "0x".to_string()
                    };
                    let payload =
                        serde_json::json!({"jsonrpc":"2.0","id": id, "result": result});
                    let s = payload.to_string();
                    let http = format!(
                        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                        s.len(),
                        s
                    );
                    let _ = socket.write_all(http.as_bytes()).await;
                });
            }
        });
        tokio::task::yield_now().await;

        let prev = std::env::var(COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS_ENV).ok();
        std::env::set_var(
            COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS_ENV,
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        );

        let mut st = api_meta_state(None);
        st.chain_config = Some(crate::chain::ChainConfig {
            rpc_url: format!("http://127.0.0.1:{port}"),
            chain_id: 31337,
            escrow_factory_address: None,
            fee_router_address: None,
            region_vault_address: None,
            country_pool_ledger_address: Some(
                "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".to_string(),
            ),
            investor_share_token_addresses: vec![],
            staking_address: None,
            guide_staking_address: None,
            staking_provider_address: None,
            investor_lock_contract_addresses: vec![],
            governor_address: None,
            governance_timelock_address: None,
            governance_votes_token_address: None,
            treasury_address: None,
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
                    .uri("/api/v1/governance/country-ledger/DE")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        match prev {
            Some(ref s) => std::env::set_var(COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS_ENV, s),
            None => std::env::remove_var(COUNTRY_LEDGER_SSOT_TOKEN_ADDRESS_ENV),
        }

        assert_eq!(res.status(), StatusCode::OK);
        assert_eq!(
            res.headers()
                .get("x-implementation-status")
                .and_then(|h| h.to_str().ok()),
            Some("country_ledger_chain_read")
        );
        let bytes = res.into_body().collect().await.unwrap().to_bytes();
        let body: Value = serde_json::from_slice(&bytes).unwrap();
        assert!(country_ledger_response_has_forbidden_b110_root_key(&body).is_none());
        assert_eq!(
            body.get("rule_version").and_then(|x| x.as_str()),
            Some(COUNTRY_LEDGER_RULE_VERSION)
        );
        assert_eq!(
            body.get("ledger_token_balance_u256_hex")
                .and_then(|x| x.as_str()),
            Some("0x000000000000000000000000000000000000000000000000000000000000002a")
        );
        assert_eq!(
            body.get("ledger_total_credited_u256_hex")
                .and_then(|x| x.as_str()),
            Some("0x000000000000000000000000000000000000000000000000000000000000002a")
        );
        assert_eq!(
            body.get("on_chain_contract_version")
                .and_then(|x| x.as_str()),
            Some(COUNTRY_LEDGER_RULE_VERSION)
        );
        assert_eq!(body.get("pilot_matched"), Some(&json!(true)));
    }
}
