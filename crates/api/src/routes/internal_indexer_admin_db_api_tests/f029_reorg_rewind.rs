use std::sync::Arc;

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tokio::io::AsyncWriteExt;
use tokio::net::TcpListener;
use tokio::sync::RwLock;
use tower::ServiceExt;

use crate::chain;
use crate::db::insert_event_log;
use crate::jsonrpc_mock_server::read_http_request_headers_and_body;
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::routes::internal;

use super::helpers::*;

/// P1-3: reorg-rewind(force) 在独立 chain_id 上应完成删尾+回放，并回写 indexer checkpoint/runtime。
#[tokio::test]
async fn indexer_reorg_rewind_force_executes_delete_and_replay_on_isolated_chain_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: indexer_reorg_rewind_force_executes_delete_and_replay_on_isolated_chain_pg (DATABASE_URL unset)"
        );
        return;
    };
    let chain_id: u64 = 990_001;
    let chain_id_i64 = chain_id as i64;
    let rewind_from_block: u64 = 12;

    let mut meta = meta_indexer_reconcile_with_pool(pool.clone());
    meta.chain_config = Some(chain::ChainConfig {
        rpc_url: String::new(),
        chain_id,
        escrow_factory_address: None,
        fee_router_address: None,
        region_vault_address: None,
        escrow_factory_v2_address: None,
        country_pool_ledger_address: None,
        unallocated_steward_path_vault_address: None,
        steward_path_vault_address: None,
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
    if let Some(ref idx) = meta.indexer_state {
        let mut g = idx.write().await;
        g.last_block = rewind_from_block;
        g.last_log_index = 2;
        g.last_block_hash = "0xreorg-test-hash".to_string();
    };    let block_hash = vec![7u8; 32];
    let tx_hash = vec![9u8; 32];
    insert_event_log(
        &pool,
        chain_id_i64,
        rewind_from_block as i64,
        0,
        &block_hash,
        &tx_hash,
        "NoopEvent",
        &json!({"k":"v"}),
        12,
    )
    .await
    .expect("insert event_log for reorg rewind IT");

    let app = internal::router().with_state(meta);
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/indexer-reorg-rewind")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "rewind_from_block": rewind_from_block,
                        "force": true
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::OK, "{:?}", res.status());
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(v["task"], "indexer_reorg_rewind");
    assert_eq!(v["chain_id"], json!(chain_id));
    assert_eq!(v["rewind_from_block"], json!(rewind_from_block));
    assert_eq!(v["force"], json!(true));
    assert!(
        v.pointer("/deleted/event_log_rows")
            .and_then(|x| x.as_u64())
            .is_some_and(|n| n >= 1),
        "expected at least one deleted event_log row: {v:?}"
    );
    assert_eq!(v.pointer("/indexer_after/last_block"), Some(&json!(0)));
    assert!(
        v.get("replay_stats").is_some(),
        "replay_stats must exist: {v:?}"
    );
}

/// P2: 非 force 路径下，若链上 hash 与索引状态一致，应返回 reorg_not_detected，防误回滚。
#[tokio::test]
async fn indexer_reorg_rewind_non_force_rejects_when_hash_matches_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: indexer_reorg_rewind_non_force_rejects_when_hash_matches_pg (DATABASE_URL unset)"
        );
        return;
    };

    const LAST_BLOCK: u64 = 13;
    const HASH: &str = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .expect("bind mock rpc");
    let port = listener.local_addr().expect("local addr").port();
    tokio::spawn(async move {
        loop {
            let Ok((mut socket, _)) = listener.accept().await else {
                break;
            };
            tokio::spawn(async move {
                let Ok(_req) = read_http_request_headers_and_body(&mut socket).await else {
                    return;
                };
                let body = format!(
                    r#"{{"jsonrpc":"2.0","id":1,"result":{{"hash":"{}"}}}}"#,
                    HASH
                );
                let resp = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(),
                    body
                );
                let _ = socket.write_all(resp.as_bytes()).await;
            });
        }
    });
    tokio::task::yield_now().await;

    let mut meta = meta_indexer_reconcile_with_pool(pool.clone());
    meta.chain_config = Some(chain::ChainConfig {
        rpc_url: format!("http://127.0.0.1:{port}"),
        chain_id: 137,
        escrow_factory_address: None,
        fee_router_address: None,
        region_vault_address: None,
        escrow_factory_v2_address: None,
        country_pool_ledger_address: None,
        unallocated_steward_path_vault_address: None,
        steward_path_vault_address: None,
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
    if let Some(ref idx) = meta.indexer_state {
        let mut g = idx.write().await;
        g.last_block = LAST_BLOCK;
        g.last_log_index = 0;
        g.last_block_hash = HASH.to_string();
    };    let app = internal::router().with_state(meta);
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/indexer-reorg-rewind")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "rewind_from_block": LAST_BLOCK,
                        "force": false
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::CONFLICT);
    let v = response_json(res).await;
    assert_eq!(v.get("error"), Some(&json!("reorg_not_detected")));
}

/// P2: app-stack 全栈下，非 force 且 hash 一致时同样应返回 reorg_not_detected。
#[tokio::test]
async fn indexer_reorg_rewind_non_force_rejects_when_hash_matches_app_stack_ok_pg() {
    let _g = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: indexer_reorg_rewind_non_force_rejects_when_hash_matches_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };

    const LAST_BLOCK: u64 = 15;
    const HASH: &str = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    let listener = TcpListener::bind("127.0.0.1:0")
        .await
        .expect("bind mock rpc");
    let port = listener.local_addr().expect("local addr").port();
    tokio::spawn(async move {
        loop {
            let Ok((mut socket, _)) = listener.accept().await else {
                break;
            };
            tokio::spawn(async move {
                let Ok(_req) = read_http_request_headers_and_body(&mut socket).await else {
                    return;
                };
                let body = format!(
                    r#"{{"jsonrpc":"2.0","id":1,"result":{{"hash":"{}"}}}}"#,
                    HASH
                );
                let resp = format!(
                    "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    body.len(),
                    body
                );
                let _ = socket.write_all(resp.as_bytes()).await;
            });
        }
    });
    tokio::task::yield_now().await;

    let mut meta = meta_indexer_reconcile_with_pool(pool.clone());
    meta.chain_config = Some(chain::ChainConfig {
        rpc_url: format!("http://127.0.0.1:{port}"),
        chain_id: 137,
        escrow_factory_address: None,
        fee_router_address: None,
        region_vault_address: None,
        escrow_factory_v2_address: None,
        country_pool_ledger_address: None,
        unallocated_steward_path_vault_address: None,
        steward_path_vault_address: None,
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
    if let Some(ref idx) = meta.indexer_state {
        let mut g = idx.write().await;
        g.last_block = LAST_BLOCK;
        g.last_log_index = 0;
        g.last_block_hash = HASH.to_string();
    };    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(meta, idem, Some(pool.clone()));

    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/internal/indexer-reorg-rewind")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "rewind_from_block": LAST_BLOCK,
                        "force": false
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(res.status(), StatusCode::CONFLICT);
    let v = response_json(res).await;
    assert_eq!(v.get("error"), Some(&json!("reorg_not_detected")));
}
