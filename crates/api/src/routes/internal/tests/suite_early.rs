use super::super::*;
use super::support::*;
use crate::chain;
use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::db;
use crate::jsonrpc_mock_server::read_http_request_headers_and_body;
use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use http_body_util::BodyExt;
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tokio::io::AsyncWriteExt;
use tokio::net::TcpListener;
use tokio::sync::RwLock;
use uuid::Uuid;

#[tokio::test]
async fn internal_alerts_test_fire_returns_accepted() {
    let resp = internal_alerts_test_fire(State(build_state()))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("accepted"));
    let snap = v.get("snapshot").expect("snapshot");
    assert!(snap
        .get("last_stored_orders_projection_reconcile")
        .is_none());
    assert_eq!(snap.get("finality_n").and_then(|x| x.as_u64()), Some(12));
}

/// **`PgPool` 已挂但不可连** 时 **`admin_last_stored_*`** 快照失败 → **不**附加 **`last_stored`**（与 **无池** 外观一致；**不**长挂）。
#[tokio::test]
async fn internal_alerts_test_fire_chain_ready_dead_db_omits_last_stored_snapshot() {
    let resp = internal_alerts_test_fire(State(build_state_chain_ready_with_dead_db_pool()))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    let snap = v.get("snapshot").expect("snapshot");
    assert!(snap
        .get("last_stored_orders_projection_reconcile")
        .is_none());
}

#[tokio::test]
async fn internal_incident_open_returns_accepted() {
    let resp = internal_incident_open(State(build_state()))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    let ctx = v.get("context").expect("context");
    assert!(ctx.get("last_stored_orders_projection_reconcile").is_none());
}

#[tokio::test]
async fn internal_incident_open_chain_ready_dead_db_omits_last_stored_in_context() {
    let resp = internal_incident_open(State(build_state_chain_ready_with_dead_db_pool()))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    let ctx = v.get("context").expect("context");
    assert!(ctx.get("last_stored_orders_projection_reconcile").is_none());
}

#[test]
fn attach_meta_build_to_tick_ok_body_inserts_build() {
    let mut body = json!({"status": "ok", "message": "no_new_blocks"});
    attach_meta_build_to_tick_ok_body(&mut body);
    let meta = body.get("meta").expect("meta");
    let build = meta.get("build").expect("meta.build");
    assert!(build.get("git_sha").is_some());
    assert!(build.get("rule").is_some());
}

#[test]
fn ssot_parallel_chain_snapshot_gate_patterns() {
    let all = json!({
        "fee_router_erc20_balance_read": {"read_status": "ok"},
        "governance_treasury_native_balance_read": {"read_status": "ok"},
        "region_vault_erc20_balance_read": {"read_status": "ok"},
    });
    let g = ssot_parallel_chain_snapshot_gate(&all);
    assert_eq!(g["pass"], true);
    assert_eq!(g["pattern"].as_str(), Some("all_readable"));

    let partial = json!({
        "fee_router_erc20_balance_read": {"read_status": "ok"},
        "governance_treasury_native_balance_read": serde_json::Value::Null,
        "region_vault_erc20_balance_read": serde_json::Value::Null,
    });
    let g2 = ssot_parallel_chain_snapshot_gate(&partial);
    assert_eq!(g2["pass"], false);
    assert_eq!(g2["pattern"].as_str(), Some("partial_readable"));

    let none = json!({
        "fee_router_erc20_balance_read": serde_json::Value::Null,
        "governance_treasury_native_balance_read": serde_json::Value::Null,
        "region_vault_erc20_balance_read": serde_json::Value::Null,
    });
    let g3 = ssot_parallel_chain_snapshot_gate(&none);
    assert_eq!(g3["pass"], false);
    assert_eq!(g3["pattern"].as_str(), Some("none_readable"));
}

/// **RegionVault 腿**单独可读仍为 **`partial_readable` / `pass:false`**：本 gate 只统计三腿并行观测，**不**等价于根级 **`country_pool`** 链上主读已启用或已对齐。
#[test]
fn ssot_parallel_chain_snapshot_gate_region_vault_leg_ok_alone_is_partial_not_root_country_pool_ssot() {
    let rv_only = json!({
        "fee_router_erc20_balance_read": serde_json::Value::Null,
        "governance_treasury_native_balance_read": serde_json::Value::Null,
        "region_vault_erc20_balance_read": {"read_status": "ok"},
    });
    let g = ssot_parallel_chain_snapshot_gate(&rv_only);
    assert_eq!(g["pass"], false);
    assert_eq!(g["pattern"].as_str(), Some("partial_readable"));
    assert_eq!(g["readable_legs"], 1);
    assert_eq!(g["legs"]["region_vault_erc20_balance_read_ok"], true);
}

/// **GovernanceTreasury 原生 Wei 腿**单独可读仍为 **`partial_readable` / `pass:false`**：本 gate 只统计三腿并行观测，**不**等价于根级 **`treasury_pool*`** 链上主读已启用或已对齐（**TT-SSOT-SWITCH-APPLY-002**）。
#[test]
fn ssot_parallel_chain_snapshot_gate_treasury_native_leg_ok_alone_is_partial_not_root_treasury_pool_ssot() {
    let tr_only = json!({
        "fee_router_erc20_balance_read": serde_json::Value::Null,
        "governance_treasury_native_balance_read": {"read_status": "ok"},
        "region_vault_erc20_balance_read": serde_json::Value::Null,
    });
    let g = ssot_parallel_chain_snapshot_gate(&tr_only);
    assert_eq!(g["pass"], false);
    assert_eq!(g["pattern"].as_str(), Some("partial_readable"));
    assert_eq!(g["readable_legs"], 1);
    assert_eq!(g["legs"]["governance_treasury_native_balance_read_ok"], true);
}

#[tokio::test]
async fn indexer_status_ok_omits_last_stored_without_db() {
    let resp = indexer_status(State(build_state()), Query(IndexerStatusQuery::default()))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
    assert!(v.get("last_stored_orders_projection_reconcile").is_none());
    assert!(v.get("live_orders_projection_reconcile").is_none());
    assert!(v.get("state").is_some());
    let meta = v.get("meta").expect("meta");
    let build = meta.get("build").expect("meta.build");
    assert!(build.get("git_sha").is_some());
    assert!(build.get("rule").is_some());
    let rr = v.get("reorg_recovery").expect("reorg_recovery hint");
    assert_eq!(
        rr.get("anchor").and_then(|x| x.as_str()),
        Some("110-REORG-RECOVERY-HINT")
    );
    let paths = rr.get("paths").and_then(|x| x.as_object()).expect("paths");
    assert_eq!(
        paths.get("indexer_status").and_then(|x| x.as_str()),
        Some("/api/v1/internal/indexer-status")
    );
    assert_eq!(
        paths.get("indexer_reconcile").and_then(|x| x.as_str()),
        Some("/api/v1/internal/indexer-reconcile")
    );
    assert_eq!(
        paths.get("indexer_tick").and_then(|x| x.as_str()),
        Some("/api/v1/internal/indexer-tick")
    );
    assert_eq!(
        paths.get("indexer_replay").and_then(|x| x.as_str()),
        Some("/api/v1/internal/indexer-replay")
    );
    assert_eq!(
        paths.get("indexer_reorg_rewind").and_then(|x| x.as_str()),
        Some("/api/v1/internal/indexer-reorg-rewind")
    );
    let steps = rr.get("steps").and_then(|x| x.as_array()).expect("steps");
    assert!(
        steps.len() >= 5,
        "reorg_recovery.steps should list replay/reconcile path"
    );
}

/// 链配置 + indexer 句柄已挂载（无 DB）时 **`GET …/internal/indexer-status`** 体与 **110 §3.3** / 探针 **`jq`** 口径对齐。
#[tokio::test]
async fn indexer_status_ok_when_chain_and_memory_mounted_includes_runtime_state_and_meta_build()
{
    let resp = indexer_status(
        State(build_state_chain_ready_no_db_pool()),
        Query(IndexerStatusQuery::default()),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
    let meta = v.get("meta").expect("meta");
    let build = meta.get("build").expect("meta.build");
    assert!(build
        .get("git_sha")
        .and_then(|x| x.as_str())
        .is_some_and(|s| !s.is_empty()));
    assert!(build.get("rule").is_some());
    let idx = v.get("indexer").expect("indexer runtime");
    assert_eq!(idx.get("last_block").and_then(|x| x.as_u64()), Some(0));
    assert_eq!(idx.get("last_log_index").and_then(|x| x.as_u64()), Some(0));
    assert_eq!(idx.get("events_cached").and_then(|x| x.as_u64()), Some(0));
    let st = v.get("state").expect("state");
    assert_eq!(st.get("finality_n").and_then(|x| x.as_u64()), Some(12));
    assert_eq!(
        st.get("finality_n_used").and_then(|x| x.as_u64()),
        Some(12)
    );
    assert!(st.get("chain_tip").unwrap().is_null());
    assert!(st.get("indexer_finalized_upper_bound").unwrap().is_null());
    assert_eq!(
        st.get("last_seen_finality_n").and_then(|x| x.as_u64()),
        Some(12)
    );
    assert_eq!(
        st.get("checkpoint")
            .and_then(|c| c.get("block_number"))
            .and_then(|x| x.as_u64()),
        Some(100)
    );
    assert_eq!(
        st.get("checkpoint")
            .and_then(|c| c.get("log_index"))
            .and_then(|x| x.as_u64()),
        Some(3)
    );
    let rule = st.get("rule").and_then(|x| x.as_str()).unwrap_or("");
    assert!(
        rule.contains("110 §3.3"),
        "state.rule should cite 110 §3.3, got {rule:?}"
    );
    let rr = v.get("reorg_recovery").expect("reorg_recovery");
    assert_eq!(
        rr.get("anchor").and_then(|x| x.as_str()),
        Some("110-REORG-RECOVERY-HINT")
    );
}

#[tokio::test]
async fn indexer_tick_returns_503_chain_not_configured_without_chain_or_indexer() {
    let resp = indexer_tick(State(build_state())).await.into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("chain_not_configured")
    );
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("chain_not_configured")
    );
}

#[tokio::test]
async fn indexer_tick_returns_503_when_escrow_factory_address_missing() {
    let resp = indexer_tick(State(build_state_chain_ready_no_db_pool()))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("ESCROW_FACTORY_ADDRESS not set")
    );
}

fn b116_mock_normalize_addr(a: &str) -> String {
    format!("0x{}", a.trim().trim_start_matches("0x").to_lowercase())
}

fn b116_http_request_json(buf: &[u8]) -> Option<Value> {
    let sep = buf.windows(4).position(|w| w == b"\r\n\r\n")? + 4;
    serde_json::from_slice(&buf[sep..]).ok()
}

fn b116_mock_get_logs_result(
    p0: &Value,
    factory_key: &str,
    router_key: &str,
    vault_key: &str,
    fr_log: &Value,
    rv_log: &Value,
) -> Value {
    if let Some(s) = p0.get("address").and_then(|a| a.as_str()) {
        if b116_mock_normalize_addr(s) == b116_mock_normalize_addr(factory_key) {
            return json!([]);
        }
        return json!([]);
    }
    if let Some(arr) = p0.get("address").and_then(|a| a.as_array()) {
        if arr.len() == 1 {
            let a0 = arr[0].as_str().unwrap_or("");
            let n = b116_mock_normalize_addr(a0);
            if n == b116_mock_normalize_addr(router_key) {
                return json!([fr_log]);
            }
            if n == b116_mock_normalize_addr(vault_key) {
                return json!([rv_log]);
            }
        }
    }
    json!([])
}

/// **P5-1-B**：factory 拉取为空；**`COUNTRY_POOL_LEDGER_ADDRESS`** 单址拉取返回 **`CountryLedgerCredited`**。
fn p51b_mock_get_logs_country_ledger(
    p0: &Value,
    factory_key: &str,
    ledger_key: &str,
    credit_log: &Value,
) -> Value {
    if let Some(s) = p0.get("address").and_then(|a| a.as_str()) {
        if b116_mock_normalize_addr(s) == b116_mock_normalize_addr(factory_key) {
            return json!([]);
        }
        return json!([]);
    }
    if let Some(arr) = p0.get("address").and_then(|a| a.as_array()) {
        if arr.len() == 1 {
            let a0 = arr[0].as_str().unwrap_or("");
            let n = b116_mock_normalize_addr(a0);
            if n == b116_mock_normalize_addr(ledger_key) {
                return json!([credit_log]);
            }
        }
    }
    json!([])
}

async fn b116_write_rpc_ok(socket: &mut tokio::net::TcpStream, body: &Value) {
    let s = body.to_string();
    let resp = format!(
        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        s.len(),
        s
    );
    let _ = socket.write_all(resp.as_bytes()).await;
}

/// B-116-2-3：`indexer_tick` 在 **DATABASE_URL** 下将 **`PlatformFeeRouted` / `RegionVaultForwarded`** 写入两投影表（CI 无 PG 时跳过）。
#[tokio::test]
async fn indexer_tick_persists_fee_router_and_region_vault_events_when_db_configured() {
    let url = match std::env::var("DATABASE_URL") {
        Ok(u) if !u.trim().is_empty() => u,
        _ => {
            eprintln!(
                "indexer_tick_persists_fee_router_and_region_vault_events_when_db_configured: skip (DATABASE_URL unset)"
            );
            return;
        }
    };
    const CHAIN: i64 = 999_991_625;
    const FACTORY: &str = "0x0000000000000000000000000000000000000001";
    const ROUTER: &str = "0x1111111111111111111111111111111111111111";
    const VAULT: &str = "0x2222222222222222222222222222222222222222";

    let pool = PgPoolOptions::new()
        .max_connections(3)
        .connect(&url)
        .await
        .expect("connect DATABASE_URL");
    sqlx::query("DELETE FROM fee_router_routed_events WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await
        .expect("cleanup fee_router");
    sqlx::query("DELETE FROM region_vault_forwarded_events WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await
        .expect("cleanup region_vault");
    sqlx::query("DELETE FROM event_log WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await
        .expect("cleanup event_log");
    sqlx::query(
        "DELETE FROM checkpoints_sharded WHERE consumer_id = $2 AND chain_id = $1",
    )
    .bind(CHAIN)
    .bind(db::INDEXER_CHECKPOINT_CONSUMER_ID)
    .execute(&pool)
    .await
    .expect("cleanup checkpoint");

    let topic0_fr = crate::chain_off::platform_fee_routed_topic0_hex();
    let topic0_rv = crate::chain_off::region_vault_forwarded_topic0_hex();
    let token_topic_fr =
        "0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    let token_topic_rv =
        "0x000000000000000000000000bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    let to_topic_rv =
        "0x000000000000000000000000cccccccccccccccccccccccccccccccccccccccc";
    let mut data_fr = Vec::new();
    for v in 1u8..=5u8 {
        let mut w = [0u8; 32];
        w[31] = v;
        data_fr.extend_from_slice(&w);
    }
    let data_fr_hex = format!("0x{}", hex::encode(&data_fr));
    let mut w_amt = [0u8; 32];
    w_amt[31] = 9;
    let data_rv_hex = format!("0x{}", hex::encode(&w_amt));
    let fr_log = json!({
        "address": ROUTER,
        "blockNumber": "0xa",
        "logIndex": "0x0",
        "blockHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "transactionHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "topics": [topic0_fr, token_topic_fr],
        "data": data_fr_hex
    });
    let rv_log = json!({
        "address": VAULT,
        "blockNumber": "0xb",
        "logIndex": "0x1",
        "blockHash": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "transactionHash": "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        "topics": [topic0_rv, token_topic_rv, to_topic_rv],
        "data": data_rv_hex
    });

    let factory_key = FACTORY.to_string();
    let router_key = ROUTER.to_string();
    let vault_key = VAULT.to_string();
    let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind mock rpc");
    let port = listener.local_addr().unwrap().port();
    tokio::spawn(async move {
        loop {
            let Ok((mut socket, _)) = listener.accept().await else {
                break;
            };
            let factory_k = factory_key.clone();
            let router_k = router_key.clone();
            let vault_k = vault_key.clone();
            let fr_l = fr_log.clone();
            let rv_l = rv_log.clone();
            tokio::spawn(async move {
                let Ok(buf) = read_http_request_headers_and_body(&mut socket).await else {
                    return;
                };
                let Some(v) = b116_http_request_json(&buf) else {
                    return;
                };
                let method = v.get("method").and_then(|m| m.as_str()).unwrap_or("");
                let id = v.get("id").cloned().unwrap_or(json!(1));
                let resp = match method {
                    "eth_blockNumber" => json!({"jsonrpc":"2.0","id":id,"result":"0x1e"}),
                    "eth_getLogs" => {
                        let p0 = v
                            .get("params")
                            .and_then(|p| p.as_array())
                            .and_then(|a| a.first());
                        let logs = if let Some(p0) = p0 {
                            b116_mock_get_logs_result(
                                p0, &factory_k, &router_k, &vault_k, &fr_l, &rv_l,
                            )
                        } else {
                            json!([])
                        };
                        json!({"jsonrpc":"2.0","id":id,"result": logs})
                    }
                    _ => json!({"jsonrpc":"2.0","id":id,"error":{"code":-32601,"message":"not found"}}),
                };
                b116_write_rpc_ok(&mut socket, &resp).await;
            });
        }
    });
    tokio::task::yield_now().await;

    let idx_dir = std::env::temp_dir().join(format!("tt_b116_tick_{}", Uuid::new_v4()));
    std::fs::create_dir_all(&idx_dir).expect("idx temp dir");
    let idx_path = idx_dir.join("idx_state");
    let idx_path_str = idx_path.to_string_lossy().into_owned();

    let mut state = build_state_chain_ready_no_db_pool();
    state.chain_off = Some(ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    });
    state.indexer_state_path = idx_path_str;
    state.chain_config = Some(chain::ChainConfig {
        rpc_url: format!("http://127.0.0.1:{port}"),
        chain_id: CHAIN as u64,
        escrow_factory_address: Some(FACTORY.to_string()),
        fee_router_address: Some(ROUTER.to_string()),
        region_vault_address: Some(VAULT.to_string()),
        country_pool_ledger_address: None,
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
    state.finality_n = 12;

    let resp = indexer_tick(State(state)).await.into_response();
    assert_eq!(resp.status(), StatusCode::OK, "indexer_tick should succeed");
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let tick_json: Value = serde_json::from_slice(&body).expect("tick json");
    assert_eq!(tick_json.get("events_new").and_then(|x| x.as_u64()), Some(2));

    let (fr_n,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM fee_router_routed_events WHERE chain_id = $1",
    )
    .bind(CHAIN)
    .fetch_one(&pool)
    .await
    .expect("count fr");
    let (rv_n,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM region_vault_forwarded_events WHERE chain_id = $1",
    )
    .bind(CHAIN)
    .fetch_one(&pool)
    .await
    .expect("count rv");
    assert_eq!(fr_n, 1, "one PlatformFeeRouted row");
    assert_eq!(rv_n, 1, "one RegionVaultForwarded row");

    let _ = std::fs::remove_dir_all(&idx_dir);
    let _ = sqlx::query("DELETE FROM fee_router_routed_events WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM region_vault_forwarded_events WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM event_log WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await;
    let _ = sqlx::query(
        "DELETE FROM checkpoints_sharded WHERE consumer_id = $2 AND chain_id = $1",
    )
    .bind(CHAIN)
    .bind(db::INDEXER_CHECKPOINT_CONSUMER_ID)
    .execute(&pool)
    .await;
}

/// **B-115-4**：**internal-only** 物化（**前提**：无链上事件亦可写入；与 indexer 路径 **同表**）。
#[tokio::test]
async fn post_internal_region_share_snapshot_line_inserts_when_db_configured() {
    let url = match std::env::var("DATABASE_URL") {
        Ok(u) if !u.trim().is_empty() => u,
        _ => {
            eprintln!(
                "post_internal_region_share_snapshot_line_inserts_when_db_configured: skip (DATABASE_URL unset)"
            );
            return;
        }
    };
    const CHAIN: i64 = 999_991_627;
    const EPOCH: i64 = 100;
    const REGION: &str = "JP";
    const RECIPIENT: &str = "0x1111111111111111111111111111111111111111";
    const SNAP_BLOCK: i64 = 55;
    let pool = PgPoolOptions::new()
        .max_connections(2)
        .connect(&url)
        .await
        .expect("connect DATABASE_URL");
    sqlx::query("DELETE FROM region_share_snapshot_lines WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await
        .expect("cleanup");

    let mut state = build_state_chain_ready_no_db_pool();
    state.chain_off = Some(ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    });
    let resp = post_internal_region_share_snapshot_line(
        State(state),
        Json(RegionShareSnapshotLineBody {
            chain_id: CHAIN,
            region_id: REGION.to_string(),
            snapshot_epoch: EPOCH,
            recipient_address: RECIPIENT.to_string(),
            snapshot_block_number: SNAP_BLOCK,
            share_balance_u256_hex:
                "0x00000000000000000000000000000000000000000000000000000000000003e8"
                    .to_string(),
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let row = db::get_region_share_snapshot_line(&pool, CHAIN, REGION, EPOCH, RECIPIENT)
        .await
        .expect("get")
        .expect("row");
    assert_eq!(row.snapshot_block_number, SNAP_BLOCK);
    assert_eq!(
        row.share_balance_u256_hex,
        "0x00000000000000000000000000000000000000000000000000000000000003e8"
    );

    let _ = sqlx::query("DELETE FROM region_share_snapshot_lines WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await;
}

fn b1154_u256_word(v: u64) -> [u8; 32] {
    let mut o = [0u8; 32];
    o[24..32].copy_from_slice(&v.to_be_bytes());
    o
}

fn b1154_mock_get_logs_snapshot_only(
    p0: &Value,
    factory_key: &str,
    vault_key: &str,
    snap_log: &Value,
) -> Value {
    if let Some(s) = p0.get("address").and_then(|a| a.as_str()) {
        if b116_mock_normalize_addr(s) == b116_mock_normalize_addr(factory_key) {
            return json!([]);
        }
        return json!([]);
    }
    if let Some(arr) = p0.get("address").and_then(|a| a.as_array()) {
        if arr.len() == 1 {
            let a0 = arr[0].as_str().unwrap_or("");
            let n = b116_mock_normalize_addr(a0);
            if n == b116_mock_normalize_addr(vault_key) {
                return json!([snap_log]);
            }
        }
    }
    json!([])
}

/// **B-115-4**：mock **`eth_getLogs`** 返回 **`RegionShareSnapshotLine`**（与 **`REGION_VAULT_ADDRESS`** 同址拉取），`indexer_tick` 写入 **`region_share_snapshot_lines`**。
#[tokio::test]
async fn indexer_tick_persists_region_share_snapshot_line_when_db_configured() {
    let url = match std::env::var("DATABASE_URL") {
        Ok(u) if !u.trim().is_empty() => u,
        _ => {
            eprintln!(
                "indexer_tick_persists_region_share_snapshot_line_when_db_configured: skip (DATABASE_URL unset)"
            );
            return;
        }
    };
    const CHAIN: i64 = 999_991_628;
    const FACTORY: &str = "0x00000000000000000000000000000000000000f1";
    const VAULT: &str = "0x22222222222222222222222222222222222222f2";

    let pool = PgPoolOptions::new()
        .max_connections(3)
        .connect(&url)
        .await
        .expect("connect DATABASE_URL");
    sqlx::query("DELETE FROM region_share_snapshot_lines WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await
        .expect("cleanup snapshot");
    sqlx::query("DELETE FROM event_log WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await
        .expect("cleanup event_log");
    sqlx::query(
        "DELETE FROM checkpoints_sharded WHERE consumer_id = $2 AND chain_id = $1",
    )
    .bind(CHAIN)
    .bind(db::INDEXER_CHECKPOINT_CONSUMER_ID)
    .execute(&pool)
    .await
    .expect("cleanup checkpoint");

    let topic0 = chain::indexer::region_share_snapshot_line_topic0_hex();
    let epoch_topic = format!("0x{}", hex::encode(b1154_u256_word(7)));
    let recipient_hex = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    let mut rt = [0u8; 32];
    rt[12..32].copy_from_slice(&hex::decode(recipient_hex.trim_start_matches("0x")).unwrap());
    let recipient_topic = format!("0x{}", hex::encode(rt));
    let mut data = Vec::new();
    data.extend_from_slice(&b1154_u256_word(96));
    data.extend_from_slice(&b1154_u256_word(12345));
    data.extend_from_slice(&b1154_u256_word(999));
    data.extend_from_slice(&b1154_u256_word(2));
    let mut cn = vec![0x43u8, 0x4eu8];
    cn.resize(32, 0u8);
    data.extend_from_slice(&cn);
    let data_hex = format!("0x{}", hex::encode(&data));
    let snap_log = json!({
        "address": VAULT,
        "blockNumber": "0xc",
        "logIndex": "0x3",
        "blockHash": "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
        "transactionHash": "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        "topics": [topic0, epoch_topic, recipient_topic],
        "data": data_hex
    });

    let factory_key = FACTORY.to_string();
    let vault_key = VAULT.to_string();
    let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind mock rpc");
    let port = listener.local_addr().unwrap().port();
    let snap_clone = snap_log.clone();
    tokio::spawn(async move {
        loop {
            let Ok((mut socket, _)) = listener.accept().await else {
                break;
            };
            let factory_k = factory_key.clone();
            let vault_k = vault_key.clone();
            let sl = snap_clone.clone();
            tokio::spawn(async move {
                let Ok(buf) = read_http_request_headers_and_body(&mut socket).await else {
                    return;
                };
                let Some(v) = b116_http_request_json(&buf) else {
                    return;
                };
                let method = v.get("method").and_then(|m| m.as_str()).unwrap_or("");
                let id = v.get("id").cloned().unwrap_or(json!(1));
                let resp = match method {
                    "eth_blockNumber" => json!({"jsonrpc":"2.0","id":id,"result":"0x1e"}),
                    "eth_getLogs" => {
                        let p0 = v
                            .get("params")
                            .and_then(|p| p.as_array())
                            .and_then(|a| a.first());
                        let logs = if let Some(p0) = p0 {
                            b1154_mock_get_logs_snapshot_only(p0, &factory_k, &vault_k, &sl)
                        } else {
                            json!([])
                        };
                        json!({"jsonrpc":"2.0","id":id,"result": logs})
                    }
                    _ => json!({"jsonrpc":"2.0","id":id,"error":{"code":-32601,"message":"not found"}}),
                };
                b116_write_rpc_ok(&mut socket, &resp).await;
            });
        }
    });
    tokio::task::yield_now().await;

    let idx_dir = std::env::temp_dir().join(format!("tt_b1154_tick_{}", Uuid::new_v4()));
    std::fs::create_dir_all(&idx_dir).expect("idx temp dir");
    let idx_path = idx_dir.join("idx_state");
    let idx_path_str = idx_path.to_string_lossy().into_owned();

    let mut state = build_state_chain_ready_no_db_pool();
    state.chain_off = Some(ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    });
    state.indexer_state_path = idx_path_str.clone();
    state.chain_config = Some(chain::ChainConfig {
        rpc_url: format!("http://127.0.0.1:{port}"),
        chain_id: CHAIN as u64,
        escrow_factory_address: Some(FACTORY.to_string()),
        fee_router_address: None,
        region_vault_address: Some(VAULT.to_string()),
        country_pool_ledger_address: None,
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
    state.finality_n = 12;

    let resp = indexer_tick(State(state)).await.into_response();
    assert_eq!(resp.status(), StatusCode::OK, "indexer_tick should succeed");
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let tick_json: Value = serde_json::from_slice(&body).expect("tick json");
    assert_eq!(tick_json.get("events_new").and_then(|x| x.as_u64()), Some(1));
    assert_eq!(
        tick_json
            .get("region_share_snapshot_lines_new")
            .and_then(|x| x.as_u64()),
        Some(1)
    );

    let row = db::get_region_share_snapshot_line(&pool, CHAIN, "CN", 7, recipient_hex)
        .await
        .expect("get")
        .expect("row");
    assert_eq!(row.snapshot_block_number, 12345);
    assert_eq!(
        row.share_balance_u256_hex,
        "0x00000000000000000000000000000000000000000000000000000000000003e7"
    );

    // P5-3-2：重复 tick — 检查点已越过含 log 的区块，不应再插入 event_log / snapshot 行。
    let mut state2 = build_state_chain_ready_no_db_pool();
    state2.chain_off = Some(ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    });
    state2.indexer_state_path = idx_path_str;
    state2.chain_config = Some(chain::ChainConfig {
        rpc_url: format!("http://127.0.0.1:{port}"),
        chain_id: CHAIN as u64,
        escrow_factory_address: Some(FACTORY.to_string()),
        fee_router_address: None,
        region_vault_address: Some(VAULT.to_string()),
        country_pool_ledger_address: None,
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
    state2.finality_n = 12;
    let resp2 = indexer_tick(State(state2)).await.into_response();
    assert_eq!(resp2.status(), StatusCode::OK, "second indexer_tick should succeed");
    let body2 = resp2.into_body().collect().await.unwrap().to_bytes();
    let tick2: Value = serde_json::from_slice(&body2).expect("tick2 json");
    assert_eq!(tick2.get("events_new").and_then(|x| x.as_u64()), Some(0));
    assert_eq!(
        tick2
            .get("region_share_snapshot_lines_new")
            .and_then(|x| x.as_u64()),
        Some(0)
    );
    let row2 = db::get_region_share_snapshot_line(&pool, CHAIN, "CN", 7, recipient_hex)
        .await
        .expect("get2")
        .expect("row2");
    assert_eq!(row2.id, row.id, "duplicate tick must not insert second snapshot row");

    let _ = std::fs::remove_dir_all(&idx_dir);
    let _ = sqlx::query("DELETE FROM region_share_snapshot_lines WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM event_log WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await;
    let _ = sqlx::query(
        "DELETE FROM checkpoints_sharded WHERE consumer_id = $2 AND chain_id = $1",
    )
    .bind(CHAIN)
    .bind(db::INDEXER_CHECKPOINT_CONSUMER_ID)
    .execute(&pool)
    .await;
}

/// **P5-1-B**：**`CountryLedgerCredited`** 经 **`indexer_tick`** 写入 **`p5_country_ledger_lines`**（CI 无 PG 时跳过）。
#[tokio::test]
async fn indexer_tick_persists_country_ledger_credited_when_db_configured() {
    let url = match std::env::var("DATABASE_URL") {
        Ok(u) if !u.trim().is_empty() => u,
        _ => {
            eprintln!(
                "indexer_tick_persists_country_ledger_credited_when_db_configured: skip (DATABASE_URL unset)"
            );
            return;
        }
    };
    const CHAIN: i64 = 999_991_629;
    const FACTORY: &str = "0x00000000000000000000000000000000000000f1";
    const LEDGER: &str = "0x33333333333333333333333333333333333333f3";

    let pool = PgPoolOptions::new()
        .max_connections(3)
        .connect(&url)
        .await
        .expect("connect DATABASE_URL");
    sqlx::query("DELETE FROM p5_country_ledger_lines WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await
        .expect("cleanup p5_country_ledger_lines");
    sqlx::query("DELETE FROM event_log WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await
        .expect("cleanup event_log");
    sqlx::query(
        "DELETE FROM checkpoints_sharded WHERE consumer_id = $2 AND chain_id = $1",
    )
    .bind(CHAIN)
    .bind(db::INDEXER_CHECKPOINT_CONSUMER_ID)
    .execute(&pool)
    .await
    .expect("cleanup checkpoint");

    let topic0 = chain::country_ledger::country_ledger_credited_topic0_hex();
    let topic1 =
        "0x0000000000000000000000000000000000000000000000000000000000004445".to_string();
    let topic2 =
        "0x000000000000000000000000aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string();
    let data_hex = "0x000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000001";
    let credit_log = json!({
        "address": LEDGER,
        "blockNumber": "0xc",
        "logIndex": "0x2",
        "blockHash": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        "transactionHash": "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
        "topics": [topic0, topic1, topic2],
        "data": data_hex
    });

    let factory_key = FACTORY.to_string();
    let ledger_key = LEDGER.to_string();
    let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind mock rpc");
    let port = listener.local_addr().unwrap().port();
    let log_clone = credit_log.clone();
    tokio::spawn(async move {
        loop {
            let Ok((mut socket, _)) = listener.accept().await else {
                break;
            };
            let factory_k = factory_key.clone();
            let ledger_k = ledger_key.clone();
            let lg = log_clone.clone();
            tokio::spawn(async move {
                let Ok(buf) = read_http_request_headers_and_body(&mut socket).await else {
                    return;
                };
                let Some(v) = b116_http_request_json(&buf) else {
                    return;
                };
                let method = v.get("method").and_then(|m| m.as_str()).unwrap_or("");
                let id = v.get("id").cloned().unwrap_or(json!(1));
                let resp = match method {
                    "eth_blockNumber" => json!({"jsonrpc":"2.0","id":id,"result":"0x1e"}),
                    "eth_getLogs" => {
                        let p0 = v
                            .get("params")
                            .and_then(|p| p.as_array())
                            .and_then(|a| a.first());
                        let logs = if let Some(p0) = p0 {
                            p51b_mock_get_logs_country_ledger(p0, &factory_k, &ledger_k, &lg)
                        } else {
                            json!([])
                        };
                        json!({"jsonrpc":"2.0","id":id,"result": logs})
                    }
                    _ => json!({"jsonrpc":"2.0","id":id,"error":{"code":-32601,"message":"not found"}}),
                };
                b116_write_rpc_ok(&mut socket, &resp).await;
            });
        }
    });
    tokio::task::yield_now().await;

    let idx_dir = std::env::temp_dir().join(format!("tt_p51b_tick_{}", Uuid::new_v4()));
    std::fs::create_dir_all(&idx_dir).expect("idx temp dir");
    let idx_path = idx_dir.join("idx_state");
    let idx_path_str = idx_path.to_string_lossy().into_owned();

    let mut state = build_state_chain_ready_no_db_pool();
    state.chain_off = Some(ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    });
    state.indexer_state_path = idx_path_str;
    state.chain_config = Some(chain::ChainConfig {
        rpc_url: format!("http://127.0.0.1:{port}"),
        chain_id: CHAIN as u64,
        escrow_factory_address: Some(FACTORY.to_string()),
        fee_router_address: None,
        region_vault_address: None,
        country_pool_ledger_address: Some(LEDGER.to_string()),
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
    state.finality_n = 12;

    let resp = indexer_tick(State(state)).await.into_response();
    assert_eq!(resp.status(), StatusCode::OK, "indexer_tick should succeed");
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let tick_json: Value = serde_json::from_slice(&body).expect("tick json");
    assert_eq!(tick_json.get("events_new").and_then(|x| x.as_u64()), Some(1));
    assert_eq!(
        tick_json
            .get("p5_country_ledger_lines_new")
            .and_then(|x| x.as_u64()),
        Some(1)
    );

    let (cnt,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM p5_country_ledger_lines WHERE chain_id = $1",
    )
    .bind(CHAIN)
    .fetch_one(&pool)
    .await
    .expect("count p5");
    assert_eq!(cnt, 1);

    let ledger_n = normalize_hex_addr(LEDGER);
    let (jurisdiction_id, token_address, amount_u256_hex, ref_bytes32_hex, direction, source_kind): (String, String, String, String, i16, String) = sqlx::query_as(
        "SELECT jurisdiction_id, token_address, amount_u256_hex, ref_bytes32_hex, direction, source_kind FROM p5_country_ledger_lines WHERE chain_id = $1",
    )
    .bind(CHAIN)
    .fetch_one(&pool)
    .await
    .expect("row p5");
    assert_eq!(jurisdiction_id, "DE");
    assert_eq!(
        token_address,
        "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );
    assert_eq!(
        amount_u256_hex.to_ascii_lowercase(),
        "0x000000000000000000000000000000000000000000000000000000000000002a"
    );
    assert_eq!(
        ref_bytes32_hex.to_ascii_lowercase(),
        "0x0000000000000000000000000000000000000000000000000000000000000001"
    );
    assert_eq!(direction, 1);
    assert_eq!(source_kind, "onchain_credit");

    let (bh, th, la): (String, String, String) = sqlx::query_as(
        "SELECT block_hash, tx_hash, ledger_contract_address FROM p5_country_ledger_lines WHERE chain_id = $1",
    )
    .bind(CHAIN)
    .fetch_one(&pool)
    .await
    .expect("row p5 meta");
    assert_eq!(
        bh.to_ascii_lowercase(),
        "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
    );
    assert_eq!(
        th.to_ascii_lowercase(),
        "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
    );
    assert_eq!(la, ledger_n);

    let _ = std::fs::remove_dir_all(&idx_dir);
    let _ = sqlx::query("DELETE FROM p5_country_ledger_lines WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM event_log WHERE chain_id = $1")
        .bind(CHAIN)
        .execute(&pool)
        .await;
    let _ = sqlx::query(
        "DELETE FROM checkpoints_sharded WHERE consumer_id = $2 AND chain_id = $1",
    )
    .bind(CHAIN)
    .bind(db::INDEXER_CHECKPOINT_CONSUMER_ID)
    .execute(&pool)
    .await;
}

#[tokio::test]
async fn indexer_status_live_reconcile_reports_db_missing() {
    let resp = indexer_status(
        State(build_state()),
        Query(IndexerStatusQuery {
            live_reconcile: Some("1".to_string()),
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    let live = v
        .get("live_orders_projection_reconcile")
        .expect("live block");
    assert_eq!(live.get("ok"), Some(&serde_json::Value::Bool(false)));
    assert_eq!(
        live.get("error").and_then(|x| x.as_str()),
        Some("database_unavailable")
    );
}

/// 链与内存 indexer 已就绪但 **无 PgPool** 时，即时对账仍须 **DB** 前置 — 与 **`live_orders_projection_reconcile_payload`** 分支 **对读**。
#[tokio::test]
async fn indexer_status_live_reconcile_chain_ready_without_db_still_database_unavailable() {
    let resp = indexer_status(
        State(build_state_chain_ready_no_db_pool()),
        Query(IndexerStatusQuery {
            live_reconcile: Some("on".to_string()),
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    let live = v
        .get("live_orders_projection_reconcile")
        .expect("live block");
    assert_eq!(live.get("ok"), Some(&serde_json::Value::Bool(false)));
    assert_eq!(
        live.get("error").and_then(|x| x.as_str()),
        Some("database_unavailable")
    );
}

/// **`live_reconcile`**：**PgPool** 存在但 **无 ChainConfig** 时须 **`chain_not_configured`**（**不**触发 SQL；与 **04 §3.4**「缺链配置」叙述 **对读**）。
#[tokio::test]
async fn indexer_status_live_reconcile_db_pool_without_chain_reports_chain_not_configured() {
    let resp = indexer_status(
        State(build_state_db_pool_but_no_chain_config()),
        Query(IndexerStatusQuery {
            live_reconcile: Some("1".to_string()),
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    let live = v
        .get("live_orders_projection_reconcile")
        .expect("live block");
    assert_eq!(live.get("ok"), Some(&serde_json::Value::Bool(false)));
    assert_eq!(
        live.get("error").and_then(|x| x.as_str()),
        Some("chain_not_configured")
    );
    assert_eq!(
        live.get("message").and_then(|x| x.as_str()),
        Some("CHAIN_RPC_URL / ChainConfig required for live reconcile")
    );
}

/// **`live_reconcile`**：**ChainConfig** + **PgPool** 均已挂载但 **DB 不可连** 时须 **`reconcile_orders_projection_failed`**（与 **`live_orders_projection_reconcile_payload`** **`Err`** 分支 **对读**；**110** 探针 **`jq`** **`error`** 键）。
#[tokio::test]
async fn indexer_status_live_reconcile_chain_ready_dead_db_reports_reconcile_orders_projection_failed(
) {
    let resp = indexer_status(
        State(build_state_chain_ready_with_dead_db_pool()),
        Query(IndexerStatusQuery {
            live_reconcile: Some("true".to_string()),
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("ok"));
    assert!(v.get("last_stored_orders_projection_reconcile").is_none());
    let live = v
        .get("live_orders_projection_reconcile")
        .expect("live block");
    assert_eq!(live.get("ok"), Some(&serde_json::Value::Bool(false)));
    assert_eq!(
        live.get("error").and_then(|x| x.as_str()),
        Some("reconcile_orders_projection_failed")
    );
    let msg = live
        .get("message")
        .and_then(|x| x.as_str())
        .unwrap_or_default();
    assert!(
        !msg.is_empty(),
        "live_orders_projection_reconcile.message should echo sqlx error"
    );
}

#[tokio::test]
async fn indexer_replay_requires_chain_config() {
    let resp = indexer_replay(State(build_state()), None)
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("chain_not_configured")
    );
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("chain_not_configured")
    );
    assert_eq!(
        v.get("hint").and_then(|x| x.as_str()),
        Some("CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required")
    );
}

#[tokio::test]
async fn indexer_replay_returns_chain_not_configured_when_indexer_state_missing() {
    let resp = indexer_replay(State(build_state_chain_only_no_indexer_no_db_pool()), None)
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("chain_not_configured")
    );
    assert_eq!(
        v.get("hint").and_then(|x| x.as_str()),
        Some("indexer state not initialized")
    );
}

#[tokio::test]
async fn indexer_replay_requires_db_pool_when_chain_ready() {
    let resp = indexer_replay(State(build_state_chain_ready_no_db_pool()), None)
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("database_required_for_replay")
    );
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("database_required_for_replay")
    );
    assert_eq!(
        v.get("hint").and_then(|x| x.as_str()),
        Some("chain_off with DATABASE_URL required to replay event_log into orders_projection")
    );
}

#[tokio::test]
async fn indexer_replay_chain_ready_dead_db_reports_replay_orders_projection_failed() {
    let resp = indexer_replay(State(build_state_chain_ready_with_dead_db_pool()), None)
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("replay_orders_projection_failed")
    );
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("replay_orders_projection_failed")
    );
    let detail = v.get("detail").and_then(|x| x.as_str()).unwrap_or("");
    assert!(!detail.is_empty(), "detail must carry sqlx error text");
}

#[tokio::test]
async fn indexer_reorg_rewind_requires_db_pool_when_chain_ready() {
    let resp = indexer_reorg_rewind(
        State(build_state_chain_ready_no_db_pool()),
        Json(IndexerReorgRewindBody {
            rewind_from_block: 1,
            force: true,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("database_required_for_reorg_rewind")
    );
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("database_required_for_reorg_rewind")
    );
    assert_eq!(
        v.get("hint").and_then(|x| x.as_str()),
        Some("chain_off with DATABASE_URL required")
    );
}

#[tokio::test]
async fn indexer_reorg_rewind_chain_ready_dead_db_reports_delete_event_log_failed() {
    let state = build_state_chain_ready_with_dead_db_pool();
    {
        let h = state.indexer_state.as_ref().expect("indexer");
        let mut g = h.write().await;
        g.last_block = 10;
        g.last_log_index = 0;
        g.last_block_hash =
            "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string();
    }
    let resp = indexer_reorg_rewind(
        State(state),
        Json(IndexerReorgRewindBody {
            rewind_from_block: 10,
            force: true,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("delete_event_log_failed")
    );
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("delete_event_log_failed")
    );
    let detail = v.get("detail").and_then(|x| x.as_str()).unwrap_or("");
    assert!(!detail.is_empty(), "detail must carry sqlx error text");
}

#[tokio::test]
async fn indexer_reorg_rewind_returns_chain_not_configured_without_chain_config() {
    let resp = indexer_reorg_rewind(
        State(build_state()),
        Json(IndexerReorgRewindBody {
            rewind_from_block: 1,
            force: true,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("chain_not_configured")
    );
    assert_eq!(
        v.get("hint").and_then(|x| x.as_str()),
        Some("CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required")
    );
}

#[tokio::test]
async fn indexer_reorg_rewind_returns_chain_not_configured_when_indexer_state_missing() {
    let resp = indexer_reorg_rewind(
        State(build_state_chain_only_no_indexer_no_db_pool()),
        Json(IndexerReorgRewindBody {
            rewind_from_block: 1,
            force: true,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("chain_not_configured")
    );
    assert_eq!(
        v.get("hint").and_then(|x| x.as_str()),
        Some("indexer state not initialized")
    );
}

