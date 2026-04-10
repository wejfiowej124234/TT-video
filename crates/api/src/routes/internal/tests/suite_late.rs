use super::super::*;
use super::support::*;
use crate::chain;
use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::db;
use crate::jsonrpc_mock_server::read_http_request_headers_and_body;
use crate::state::{ApiMetaState, EvidenceTimeState, ProjectorCheckpoint};
use axum::extract::{Path as AxumPath, Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use chrono::Utc;
use http_body_util::BodyExt;
use sqlx::postgres::PgPoolOptions;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::io::AsyncWriteExt;
use tokio::net::TcpListener;
use tokio::sync::RwLock;
use uuid::Uuid;

#[tokio::test]
async fn indexer_reconcile_requires_chain_config() {
    let resp = indexer_reconcile(State(build_state()), None)
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
async fn indexer_reconcile_returns_chain_not_configured_when_indexer_state_missing() {
    let resp = indexer_reconcile(State(build_state_chain_only_no_indexer_no_db_pool()), None)
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
async fn indexer_reconcile_requires_db_pool_when_chain_ready() {
    let resp = indexer_reconcile(State(build_state_chain_ready_no_db_pool()), None)
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("database_required_for_reconcile")
    );
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("database_required_for_reconcile")
    );
    assert_eq!(
        v.get("hint").and_then(|x| x.as_str()),
        Some("chain_off with DATABASE_URL required for orders vs orders_projection reconcile")
    );
}

#[tokio::test]
async fn indexer_reconcile_chain_ready_dead_db_reports_reconcile_orders_projection_failed() {
    let resp = indexer_reconcile(State(build_state_chain_ready_with_dead_db_pool()), None)
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("reconcile_orders_projection_failed")
    );
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("reconcile_orders_projection_failed")
    );
    let detail = v.get("detail").and_then(|x| x.as_str()).unwrap_or("");
    assert!(!detail.is_empty(), "detail must carry sqlx error text");
}

/// **`persist:true`** 仅在对账 **`Ok`** 之后生效；**死池** 仍首道 **`reconcile_orders_projection_failed`**（**不**触及 **`persist_reconciliation_report_failed`**）。
#[tokio::test]
async fn indexer_reconcile_chain_ready_dead_db_with_persist_true_still_reconcile_orders_projection_failed(
) {
    let mut body = IndexerReconcileBody::default();
    body.persist = true;
    let resp = indexer_reconcile(
        State(build_state_chain_ready_with_dead_db_pool()),
        Some(Json(body)),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
    let bytes = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&bytes).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("reconcile_orders_projection_failed")
    );
}

#[test]
fn indexer_reconcile_body_deserializes_sync_memory_from_db_checkpoint() {
    let v = json!({"sync_indexer_memory_from_db_checkpoint": true});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.sync_indexer_memory_from_db_checkpoint);
}

#[test]
fn indexer_reconcile_body_deserializes_include_chain_tip() {
    let v = json!({"include_chain_tip": true});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.include_chain_tip);
}

#[test]
fn indexer_reconcile_body_deserializes_include_event_log_escrow_coverage() {
    let v = json!({"include_event_log_escrow_coverage": true});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.include_event_log_escrow_coverage);
}

#[test]
fn indexer_reconcile_body_deserializes_include_multi_table_chain_observability() {
    let v = json!({"include_multi_table_chain_observability": true});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.include_multi_table_chain_observability);
}

#[test]
fn b171_multi_table_chain_observability_v1_shell_shape() {
    use crate::routes::internal::common;
    let v = common::multi_table_chain_observability_v1(
        137,
        42161,
        vec![json!({"table":"event_log","chain_id":1,"row_count":2,"max_block_number":99})],
    );
    assert_eq!(
        v.get("anchor").and_then(|x| x.as_str()),
        Some("171-MULTI-TABLE-CHAIN-OBSERVABILITY-V1")
    );
    assert_eq!(v.get("schema_version").and_then(|x| x.as_u64()), Some(1));
    let rows = v
        .pointer("/multi_table_chain_matrix/rows")
        .and_then(|x| x.as_array());
    assert!(rows.is_some_and(|a| a.len() == 1));
    let rt = v.get("runtime").expect("runtime");
    assert_eq!(rt.get("config_chain_id").and_then(|x| x.as_u64()), Some(137));
    assert_eq!(rt.get("reconcile_chain_id").and_then(|x| x.as_u64()), Some(42161));
    assert!(v.get("observed_at").and_then(|x| x.as_str()).is_some());
}

#[test]
fn indexer_reconcile_body_deserializes_include_reorg_sentinel_observability() {
    let v = json!({"include_reorg_sentinel_observability": true});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.include_reorg_sentinel_observability);
}

/// **TT-B169**：mock **`eth_getBlockByNumber`** 与内存 **`last_block_hash`** 一致 → **`hash_mismatch_at_last_indexed_block`** 为 **false**。
#[tokio::test]
async fn b169_reorg_sentinel_hash_compare_matches_rpc_canonical() {
    use crate::routes::internal::common;
    const LAST: u64 = 7;
    const HASH: &str = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind mock rpc");
    let port = listener.local_addr().unwrap().port();
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

    let mut s = build_state();
    let h = chain::indexer::new_indexer_state();
    {
        let mut g = h.write().await;
        g.last_block = LAST;
        g.last_log_index = 2;
        g.last_block_hash = HASH.to_string();
    }
    s.indexer_state = Some(h);
    s.reorg_detected = false;

    let v = common::reorg_sentinel_observability_v1(&s, &format!("http://127.0.0.1:{port}")).await;
    assert_eq!(
        v.get("anchor").and_then(|x| x.as_str()),
        Some("169-REORG-SENTINEL-OBS-V1")
    );
    assert_eq!(v.get("state_reorg_detected"), Some(&json!(false)));
    let hc = v.get("hash_compare_at_indexed_height").expect("hash_compare");
    assert_eq!(hc.get("attempted"), Some(&json!(true)));
    assert_eq!(hc.get("rpc_ok"), Some(&json!(true)));
    assert_eq!(
        hc.get("hash_mismatch_at_last_indexed_block"),
        Some(&json!(false))
    );
    assert_eq!(
        hc.get("canonical_last_block_hash").and_then(|x| x.as_str()),
        Some(HASH)
    );
}

#[test]
fn indexer_reconcile_body_deserializes_include_indexer_finality_triple_observability() {
    let v = json!({"include_indexer_finality_triple_observability": true});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.include_indexer_finality_triple_observability);
}

/// **TT-B170**：mock **`eth_blockNumber`** + **`indexer_finalized_upper_bound`** 与 **gap** 只读字段。
#[tokio::test]
async fn b170_indexer_finality_triple_observability_rpc_tip_and_bounds() {
    use crate::routes::internal::common;
    let listener = TcpListener::bind("127.0.0.1:0").await.expect("bind mock rpc");
    let port = listener.local_addr().unwrap().port();
    tokio::spawn(async move {
        loop {
            let Ok((mut socket, _)) = listener.accept().await else {
                break;
            };
            tokio::spawn(async move {
                let Ok(_req) = read_http_request_headers_and_body(&mut socket).await else {
                    return;
                };
                let body = r#"{"jsonrpc":"2.0","id":1,"result":"0x1e"}"#;
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

    let mut s = build_state();
    let h = chain::indexer::new_indexer_state();
    {
        let mut g = h.write().await;
        g.last_block = 5;
        g.last_log_index = 1;
    }
    s.indexer_state = Some(h);
    s.finality_n = 12;

    let v = common::indexer_finality_triple_observability_v1(&s, &format!("http://127.0.0.1:{port}"))
        .await;
    assert_eq!(
        v.get("anchor").and_then(|x| x.as_str()),
        Some("170-INDEXER-FINALITY-TRIPLE-OBS-V1")
    );
    let triple = v.get("triple").expect("triple");
    assert_eq!(triple.get("eth_chain_tip_block_number"), Some(&json!(30)));
    assert_eq!(
        triple.get("indexer_finalized_upper_bound"),
        Some(&json!(18))
    );
    assert_eq!(triple.get("last_indexed_block_number"), Some(&json!(5)));
    assert_eq!(triple.get("last_indexed_log_index"), Some(&json!(1)));
    assert_eq!(triple.get("checkpoint_source"), Some(&json!("runtime")));
    assert_eq!(
        v.get("read_only_gap_blocks_chain_tip_minus_last_indexed"),
        Some(&json!(25))
    );
    let rpc = v.get("rpc").expect("rpc");
    assert_eq!(rpc.get("rpc_ok"), Some(&json!(true)));
}

#[test]
fn indexer_reconcile_body_deserializes_include_indexer_tick_fail_skip_bucket_observability() {
    let v = json!({"include_indexer_tick_fail_skip_bucket_observability": true});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.include_indexer_tick_fail_skip_bucket_observability);
}

#[test]
fn indexer_reconcile_body_deserializes_include_governor_proposal_tail_drift_observability() {
    let v = json!({"include_governor_proposal_tail_drift_observability": true});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.include_governor_proposal_tail_drift_observability);
}

#[test]
fn indexer_reconcile_body_deserializes_include_governor_proposal_state_chain_vs_projection_observability(
) {
    let v = json!({"include_governor_proposal_state_chain_vs_projection_observability": true});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.include_governor_proposal_state_chain_vs_projection_observability);
}

#[test]
fn indexer_reconcile_body_deserializes_include_timelock_delay_meta_mirror_observability() {
    let v = json!({"include_timelock_delay_meta_mirror_observability": true});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.include_timelock_delay_meta_mirror_observability);
}

#[test]
fn indexer_reconcile_body_deserializes_include_governance_pool_meta_chain_alignment_observability()
{
    let v = json!({"include_governance_pool_meta_chain_alignment_observability": true});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.include_governance_pool_meta_chain_alignment_observability);
}

/// **TT-B174**：**`scope`** 分桶计数；**`raw_entries_total`** 与明细条数一致。
#[test]
fn b174_bucket_obs_aggregates_supplemental_skipped_by_scope() {
    use crate::routes::internal::common;
    let v = common::indexer_tick_fail_skip_bucket_observability_v1(
        "2026-01-01T00:00:00Z".into(),
        &[
            json!({"scope":"fee_router","error":"a"}),
            json!({"scope":"fee_router","error":"b"}),
            json!({"scope":"region_vault","error":"c"}),
        ],
        0,
        0,
    );
    assert_eq!(v["skipped_events"]["raw_entries_total"], json!(3));
    let buckets = v["skipped_events"]["buckets"].as_array().expect("buckets");
    assert_eq!(buckets.len(), 2);
    let fr = buckets
        .iter()
        .find(|b| b["reason_scope"] == "fee_router")
        .expect("fee_router bucket");
    assert_eq!(fr["kind"], "supplemental_log_fetch_skipped");
    assert_eq!(fr["count"], json!(2));
}

#[test]
fn b174_bucket_obs_adds_checkpoint_dedup_bucket() {
    use crate::routes::internal::common;
    let v = common::indexer_tick_fail_skip_bucket_observability_v1("t".into(), &[], 10, 3);
    let buckets = v["skipped_events"]["buckets"].as_array().expect("buckets");
    let dedup = buckets
        .iter()
        .find(|b| b["kind"] == "checkpoint_dedup_skipped")
        .expect("dedup bucket");
    assert_eq!(dedup["count"], json!(7));
}

#[test]
fn indexer_reconcile_body_deserializes_verify_fee_router_events_rpc() {
    let v = json!({"verify_fee_router_events_rpc": 12});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert_eq!(b.verify_fee_router_events_rpc, Some(12));
}

#[test]
fn indexer_reconcile_body_deserializes_verify_region_vault_events_rpc() {
    let v = json!({"verify_region_vault_events_rpc": 7});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert_eq!(b.verify_region_vault_events_rpc, Some(7));
}

#[test]
fn indexer_reconcile_body_deserializes_persist_and_chain_id() {
    let v = json!({"persist": true, "chain_id": 42161});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.persist);
    assert_eq!(b.chain_id, Some(42161));
}

/// **TT-B121-INDEXER-RECONCILE-HANDLER-SUMMARY-COMPOUND-SSOT-001**：模拟 **`POST …/indexer-reconcile`** 写入 **`summary`** 的 **`reconcile_compound_pass` / `indexer_reconcile_compound_gate`** 与 **`indexer_reconcile_compound_gate`** 元组**同源**；根级、**`gate.pass`**、**`breakdown` AND** 三元一致。
#[test]
fn tt_b121_handler_summary_compound_matches_compound_gate_tuple() {
    let orders_gate = json!({"pass": true});
    let samples = [
        json!({"coarse_terminal_aligned": true}),
        json!({"coarse_terminal_aligned": true}),
    ];
    let ev_cov = json!({"anchor": "110-EVENT-LOG-ESCROW-COVERAGE", "chain_id": 137});
    let (reconcile_compound_pass, compound_gate) = indexer_reconcile_compound_gate(&orders_gate,
        true,
        None,
        Some(&samples),
        true,
        Some(&ev_cov),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    let summary = json!({
        "task": "indexer_reconcile_orders_projection",
        "reconcile_compound_pass": reconcile_compound_pass,
        "indexer_reconcile_compound_gate": compound_gate.clone(),
    });
    indexer_reconcile_assert_summary_compound_ssot_b121(&summary);
    b101_assert_compound_pass_matches_breakdown(reconcile_compound_pass, &compound_gate);
}

/// **TT-B121-RPC-EVENT-LOG-BREAKDOWN-PARTICIPATES-001**：**`rpc_escrow_samples`** 与 **`event_log_escrow_coverage`** 的 **`participates`/`pass`** 与 **`indexer_reconcile_compound_gate`** breakdown **同源**（RPC 未对齐则 compound **false**，event_log 观测枝 **pass true** 仍参与 AND）。
#[test]
fn tt_b121_rpc_misaligned_event_log_requested_breakdown_matches_gate() {
    let orders_gate = json!({"pass": true});
    let samples = [
        json!({"coarse_terminal_aligned": true}),
        json!({"coarse_terminal_aligned": false}),
    ];
    let ev_cov = json!({"anchor": "110-EVENT-LOG-ESCROW-COVERAGE"});
    let (compound_pass, c) = indexer_reconcile_compound_gate(&orders_gate,
        true,
        None,
        Some(&samples),
        true,
        Some(&ev_cov),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(!compound_pass);
    let summary = json!({
        "reconcile_compound_pass": compound_pass,
        "indexer_reconcile_compound_gate": c.clone(),
    });
    indexer_reconcile_assert_summary_compound_ssot_b121(&summary);
    let bd = c["breakdown"].as_object().unwrap();
    let rpc = bd.get("rpc_escrow_samples").unwrap();
    assert_eq!(rpc["participates"], true);
    assert_eq!(rpc["pass"], false);
    let ev = bd.get("event_log_escrow_coverage").unwrap();
    assert_eq!(ev["participates"], true);
    assert_eq!(ev["pass"], true);
}

/// **TT-B117-INDEXER-RECONCILE-ORDERS-PROJECTION-GATE-PERSIST-SUMMARY-SSOT-001**：**`200`** 根级 **`orders_projection_reconcile_gate`** 与 **`persist` `summary`** 内同键**同源**（handler 自 **`summary`** 取子树；**`insert_reconciliation_report`** 与响应共享 **`summary`** 中该对象）。
#[test]
fn tt_b117_gate_from_persist_summary_matches_assembled_summary() {
    let stats = db::OrdersProjectionReconcileStats {
        chain_id: 137,
        orders_with_escrow: 2,
        projection_rows_chain: 2,
        malformed_projection_order_id_bytes: 0,
        matched: 2,
        missing_projection: 0,
        status_mismatch: 0,
        escrow_mismatch: 0,
        orphan_projections: 0,
        issues_total: 0,
        projection_reconcile_clean: true,
        samples: None,
    };
    let gate = orders_projection_reconcile_gate(&stats);
    let summary = json!({
        "task": "indexer_reconcile_orders_projection",
        "stats": &stats,
        "orders_projection_reconcile_gate": gate.clone(),
    });
    let extracted = indexer_reconcile_orders_projection_gate_from_persist_summary(&summary);
    assert_eq!(extracted, gate);
    let persisted_subtree = summary
        .get("orders_projection_reconcile_gate")
        .expect("summary gate");
    assert_eq!(persisted_subtree, &gate);
    let simulated_http = json!({ "orders_projection_reconcile_gate": extracted });
    assert_eq!(
        simulated_http.get("orders_projection_reconcile_gate"),
        Some(persisted_subtree)
    );
}

/// **TT-B101-INDEXER-RECONCILE-COMPOUND-PASS-TUPLE-001**：根级布尔与 **`gate["pass"]`**、**`breakdown` AND** 三元一致（**`POST …/indexer-reconcile`** 成功体 **`reconcile_compound_pass`** 同源）。
fn b101_assert_compound_pass_matches_breakdown(compound_pass: bool, gate: &serde_json::Value) {
    assert_eq!(
        gate.get("pass").and_then(|v| v.as_bool()),
        Some(compound_pass)
    );
    let bd = gate
        .get("breakdown")
        .and_then(|b| b.as_object())
        .expect("breakdown object");
    assert_eq!(
        compound_pass,
        indexer_reconcile_compound_pass_from_breakdown(bd)
    );
}

/// **TT-B110-SEQ3-ORDERS-DEADLINE-INDEXER-RECONCILE-CHECK-001**：**`orders_deadline_ssot_reconcile`** **`participates:true`** 且 **`pass:false`** 时拉低 **`reconcile_compound_pass`**。
#[test]
fn b110_seq3_compound_gate_orders_deadline_ops_fail_lowers_compound_pass() {
    let gate = json!({"pass": true});
    let od = json!({
        "participates": true,
        "pass": false,
        "state": "ops_check_exit_nonzero",
        "anchor_child": "B110-SEQ3-ORDERS-DEADLINE-SSOT-RECONCILE",
    });
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        None,
        None,
        None,
        Some(od),
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(!compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    let sub = c["breakdown"]["orders_deadline_ssot_reconcile"].as_object().unwrap();
    assert_eq!(sub.get("participates"), Some(&json!(true)));
    assert_eq!(sub.get("pass"), Some(&json!(false)));
}

/// **TT-B110-SEQ6-GOVERNANCE-TIMELOCK-DELAY-CHAIN-SSOT-001**：**`timelock_delay_ssot_reconcile`** **`participates:true`** 且 **`pass:false`** 时拉低 **`reconcile_compound_pass`**。
#[test]
fn b110_seq6_compound_gate_timelock_delay_ops_fail_lowers_compound_pass() {
    let gate = json!({"pass": true});
    let tl = json!({
        "participates": true,
        "pass": false,
        "state": "ops_check_exit_nonzero",
        "anchor_child": "B110-SEQ6-TIMELOCK-DELAY-SSOT-RECONCILE",
    });
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        Some(tl),
        None,
        None,
        None);
    assert!(!compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    let sub = c["breakdown"]["timelock_delay_ssot_reconcile"]
        .as_object()
        .unwrap();
    assert_eq!(sub.get("participates"), Some(&json!(true)));
    assert_eq!(sub.get("pass"), Some(&json!(false)));
}

/// **TT-B110-SEQ8-GOVERNANCE-GOVERNOR-PROPOSAL-THRESHOLD-CHAIN-SSOT-001**：**`governor_proposal_threshold_ssot_reconcile`** **`participates:true`** 且 **`pass:false`** 时拉低 **`reconcile_compound_pass`**。
#[test]
fn b110_seq8_compound_gate_proposal_threshold_ops_fail_lowers_compound_pass() {
    let gate = json!({"pass": true});
    let pt = json!({
        "participates": true,
        "pass": false,
        "state": "ops_check_exit_nonzero",
        "anchor_child": "B110-SEQ8-GOVERNOR-PROPOSAL-THRESHOLD-SSOT-RECONCILE",
    });
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        Some(pt),
        None,
        None);
    assert!(!compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    let sub = c["breakdown"]["governor_proposal_threshold_ssot_reconcile"]
        .as_object()
        .unwrap();
    assert_eq!(sub.get("participates"), Some(&json!(true)));
    assert_eq!(sub.get("pass"), Some(&json!(false)));
}

/// **TT-B110-SEQ9-GOVERNANCE-TIMELOCK-GOVERNOR-ADMIN-CHAIN-SSOT-001**：**`timelock_governor_admin_ssot_reconcile`** **`participates:true`** 且 **`pass:false`** 时拉低 **`reconcile_compound_pass`**。
#[test]
fn b110_seq9_compound_gate_timelock_governor_admin_ops_fail_lowers_compound_pass() {
    let gate = json!({"pass": true});
    let tga = json!({
        "participates": true,
        "pass": false,
        "state": "ops_check_exit_nonzero",
        "anchor_child": "B110-SEQ9-TIMELOCK-GOVERNOR-ADMIN-SSOT-RECONCILE",
    });
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        Some(tga),
        None);
    assert!(!compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    let sub = c["breakdown"]["timelock_governor_admin_ssot_reconcile"]
        .as_object()
        .unwrap();
    assert_eq!(sub.get("participates"), Some(&json!(true)));
    assert_eq!(sub.get("pass"), Some(&json!(false)));
}

/// **TT-B110-SEQ10-GOVERNANCE-GOVERNOR-PROPOSAL-COUNT-CHAIN-SSOT-001**：**`governor_proposal_count_ssot_reconcile`** **`participates:true`** 且 **`pass:false`** 时拉低 **`reconcile_compound_pass`**。
#[test]
fn b110_seq10_compound_gate_governor_proposal_count_ops_fail_lowers_compound_pass() {
    let gate = json!({"pass": true});
    let gpc = json!({
        "participates": true,
        "pass": false,
        "state": "ops_check_exit_nonzero",
        "anchor_child": "B110-SEQ10-GOVERNOR-PROPOSAL-COUNT-SSOT-RECONCILE",
    });
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        Some(gpc));
    assert!(!compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    let sub = c["breakdown"]["governor_proposal_count_ssot_reconcile"]
        .as_object()
        .unwrap();
    assert_eq!(sub.get("participates"), Some(&json!(true)));
    assert_eq!(sub.get("pass"), Some(&json!(false)));
}

/// **TT-B110-SEQ11-GOVERNANCE-GOVERNOR-TOKEN-TIMELOCK-CHAIN-SSOT-001**：**`governor_token_timelock_ssot_reconcile`** **`participates:true`** 且 **`pass:false`** 时拉低 **`reconcile_compound_pass`**。
#[test]
fn b110_seq11_compound_gate_governor_token_timelock_ops_fail_lowers_compound_pass() {
    let gate = json!({"pass": true});
    let gtt = json!({
        "participates": true,
        "pass": false,
        "state": "ops_check_exit_nonzero",
        "anchor_child": "B110-SEQ11-GOVERNOR-TOKEN-TIMELOCK-SSOT-RECONCILE",
    });
    let (compound_pass, c) = indexer_reconcile_compound_gate(
        &gate,
        false,
        None,
        None,
        false,
        None,
        None,
        None,
        None,
        None,
        None,
        Some(gtt),
        None,
        None,
        None,
        None,
    );
    assert!(!compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    let sub = c["breakdown"]["governor_token_timelock_ssot_reconcile"]
        .as_object()
        .unwrap();
    assert_eq!(sub.get("participates"), Some(&json!(true)));
    assert_eq!(sub.get("pass"), Some(&json!(false)));
}

#[test]
fn b101_compound_gate_orders_only_matches_projection_gate() {
    let gate = json!({"pass": true});
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    assert_eq!(
        c.get("anchor").and_then(|x| x.as_str()),
        Some("B101-INDEXER-RECONCILE-COMPOUND-GATE")
    );
}

#[test]
fn b101_compound_gate_orders_false_dominates_even_if_rpc_clean() {
    let gate = json!({"pass": false});
    let samples = [json!({"coarse_terminal_aligned": true})];
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        true,
        None,
        Some(&samples),
        false,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(!compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
}

#[test]
fn b101_compound_gate_rpc_misaligned_fails_when_requested() {
    let gate = json!({"pass": true});
    let samples = [json!({"coarse_terminal_aligned": false})];
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        true,
        None,
        Some(&samples),
        false,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(!compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
}

#[test]
fn b101_compound_gate_rpc_skipped_does_not_fail_compound() {
    let gate = json!({"pass": true});
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        true,
        Some("escrow_factory_or_rpc_not_configured"),
        None,
        false,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
}

#[test]
fn b101_compound_gate_chain_observation_ok_false_fails() {
    let gate = json!({"pass": true});
    let obs = json!({"ok": false, "error": "rpc_down"});
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        None,
        None,
        Some(&obs),
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(!compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
}

/// **TT-B101-RPC-EVENTLOG-CHAIN-COVERAGE-BREAKDOWN-001**：**`rpc_escrow_samples`**（**`coarse_terminal_aligned`**）+ **`event_log_escrow_coverage`** + **`chain_observation`** 同时 **`participates`** 时，根级 **`pass`** 与 **`breakdown`** 子 **`pass`** 同源 AND。
#[test]
fn b101_compound_gate_rpc_event_log_chain_observation_align_with_breakdown() {
    let gate = json!({"pass": true});
    let samples = [
        json!({"coarse_terminal_aligned": true}),
        json!({"coarse_terminal_aligned": true}),
    ];
    let ev = json!({
        "anchor": "110-EVENT-LOG-ESCROW-COVERAGE",
        "escrow_class_event_rows": 3_i64,
        "escrow_created_rows": 1_i64,
    });
    let obs = json!({"ok": true, "anchor": "110-RECONCILE-CHAIN-TIP"});
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        true,
        None,
        Some(&samples),
        true,
        Some(&ev),
        None,
        None,
        Some(&obs),
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    let bd = c.get("breakdown").unwrap();
    let rpc = bd.get("rpc_escrow_samples").unwrap();
    assert_eq!(rpc.get("samples_count").and_then(|x| x.as_u64()), Some(2));
    assert_eq!(
        rpc.get("participates").and_then(|x| x.as_bool()),
        Some(true)
    );
    assert_eq!(rpc.get("pass").and_then(|x| x.as_bool()), Some(true));
    let el = bd.get("event_log_escrow_coverage").unwrap();
    assert_eq!(
        el.get("participates").and_then(|x| x.as_bool()),
        Some(true)
    );
    assert_eq!(
        el.get("anchor_child").and_then(|x| x.as_str()),
        Some("110-EVENT-LOG-ESCROW-COVERAGE")
    );
    let ch = bd.get("chain_observation").unwrap();
    assert_eq!(
        ch.get("participates").and_then(|x| x.as_bool()),
        Some(true)
    );
    assert_eq!(ch.get("pass").and_then(|x| x.as_bool()), Some(true));
}

#[test]
fn b101_compound_gate_fee_router_log_verify_clean_participates() {
    let gate = json!({"pass": true});
    let fr = json!({"log_verify_clean": true, "samples": [1]});
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        Some(&fr),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
}

#[test]
fn b101_compound_gate_fee_router_log_verify_unclean_fails() {
    let gate = json!({"pass": true});
    let fr = json!({"log_verify_clean": false, "samples": [1]});
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        Some(&fr),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(!compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
}

#[test]
fn b101_compound_gate_region_vault_log_verify_clean_participates() {
    let gate = json!({"pass": true});
    let rv = json!({"log_verify_clean": true, "samples": [1]});
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        None,
        Some(&rv),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
}

#[test]
fn b101_compound_gate_region_vault_log_verify_unclean_fails() {
    let gate = json!({"pass": true});
    let rv = json!({"log_verify_clean": false, "samples": [1]});
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        None,
        Some(&rv),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(!compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
}

#[test]
fn b101_compound_gate_fee_router_log_verify_skipped_does_not_fail_compound() {
    let gate = json!({"pass": true});
    let fr = json!({
        "anchor": "B-081-FEE-ROUTER-LOG-VERIFY",
        "skipped": "fee_router_address_not_configured",
        "sample_limit_requested": 5u8,
        "sample_limit_applied": 5usize,
        "samples_returned": 0usize,
        "samples": [],
    });
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        Some(&fr),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    assert_eq!(
        c.get("orders_projection_reconcile_gate_pass"),
        Some(&json!(true))
    );
    let bd = c.get("breakdown").unwrap();
    assert_eq!(
        bd.get("orders_projection")
            .and_then(|x| x.get("pass"))
            .and_then(|x| x.as_bool()),
        Some(true)
    );
    assert_eq!(
        bd.get("fee_router_log_verify")
            .and_then(|x| x.get("participates"))
            .and_then(|x| x.as_bool()),
        Some(false)
    );
}

#[test]
fn b101_compound_gate_region_vault_log_verify_skipped_does_not_fail_compound() {
    let gate = json!({"pass": true});
    let rv = json!({
        "anchor": "B-082-REGION-VAULT-LOG-VERIFY",
        "skipped": "region_vault_address_not_configured",
        "sample_limit_requested": 5u8,
        "sample_limit_applied": 5usize,
        "samples_returned": 0usize,
        "samples": [],
    });
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        None,
        Some(&rv),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    assert_eq!(
        c.get("orders_projection_reconcile_gate_pass"),
        Some(&json!(true))
    );
    let bd = c.get("breakdown").unwrap();
    assert_eq!(
        bd.get("orders_projection")
            .and_then(|x| x.get("pass"))
            .and_then(|x| x.as_bool()),
        Some(true)
    );
    assert_eq!(
        bd.get("region_vault_log_verify")
            .and_then(|x| x.get("participates"))
            .and_then(|x| x.as_bool()),
        Some(false)
    );
}

#[test]
fn b101_compound_gate_fee_router_log_verify_no_rows_does_not_fail_compound() {
    let gate = json!({"pass": true});
    let fr = json!({
        "anchor": "B-081-FEE-ROUTER-LOG-VERIFY",
        "sample_limit_requested": 5u8,
        "sample_limit_applied": 5usize,
        "samples_returned": 0usize,
        "fee_router_projection_rows_fetched": 0usize,
        "samples": [],
        "log_verify_clean": serde_json::Value::Null,
        "no_fee_router_rows": true,
        "fee_router_recipients_on_chain": serde_json::Value::Null,
    });
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        Some(&fr),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    assert_eq!(
        c.get("orders_projection_reconcile_gate_pass"),
        Some(&json!(true))
    );
    let bd = c.get("breakdown").unwrap();
    assert_eq!(
        bd.get("orders_projection")
            .and_then(|x| x.get("pass"))
            .and_then(|x| x.as_bool()),
        Some(true)
    );
    assert_eq!(
        bd.get("fee_router_log_verify")
            .and_then(|x| x.get("participates"))
            .and_then(|x| x.as_bool()),
        Some(false)
    );
}

#[test]
fn b101_compound_gate_region_vault_log_verify_no_rows_does_not_fail_compound() {
    let gate = json!({"pass": true});
    let rv = json!({
        "anchor": "B-082-REGION-VAULT-LOG-VERIFY",
        "sample_limit_requested": 5u8,
        "sample_limit_applied": 5usize,
        "samples_returned": 0usize,
        "region_vault_projection_rows_fetched": 0usize,
        "samples": [],
        "log_verify_clean": serde_json::Value::Null,
        "no_region_vault_rows": true,
    });
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        None,
        Some(&rv),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    assert_eq!(
        c.get("orders_projection_reconcile_gate_pass"),
        Some(&json!(true))
    );
    let bd = c.get("breakdown").unwrap();
    assert_eq!(
        bd.get("orders_projection")
            .and_then(|x| x.get("pass"))
            .and_then(|x| x.as_bool()),
        Some(true)
    );
    assert_eq!(
        bd.get("region_vault_log_verify")
            .and_then(|x| x.get("participates"))
            .and_then(|x| x.as_bool()),
        Some(false)
    );
}

#[test]
fn b101_compound_gate_fee_router_log_verify_missing_clean_key_does_not_fail_compound() {
    let gate = json!({"pass": true});
    let fr = json!({
        "anchor": "B-081-FEE-ROUTER-LOG-VERIFY",
        "sample_limit_requested": 5u8,
        "sample_limit_applied": 5usize,
        "samples_returned": 1usize,
        "fee_router_projection_rows_fetched": 1usize,
        "samples": [{"ok": true}],
        "fee_router_recipients_on_chain": serde_json::Value::Null,
    });
    assert!(
        fr.get("log_verify_clean").is_none(),
        "fixture must omit log_verify_clean key"
    );
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        Some(&fr),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    assert_eq!(
        c.get("orders_projection_reconcile_gate_pass"),
        Some(&json!(true))
    );
    let bd = c.get("breakdown").unwrap();
    assert_eq!(
        bd.get("orders_projection")
            .and_then(|x| x.get("pass"))
            .and_then(|x| x.as_bool()),
        Some(true)
    );
    assert_eq!(
        bd.get("fee_router_log_verify")
            .and_then(|x| x.get("participates"))
            .and_then(|x| x.as_bool()),
        Some(false)
    );
}

#[test]
fn b101_compound_gate_region_vault_log_verify_missing_clean_key_does_not_fail_compound() {
    let gate = json!({"pass": true});
    let rv = json!({
        "anchor": "B-082-REGION-VAULT-LOG-VERIFY",
        "sample_limit_requested": 5u8,
        "sample_limit_applied": 5usize,
        "samples_returned": 1usize,
        "region_vault_projection_rows_fetched": 1usize,
        "samples": [{"ok": true}],
    });
    assert!(
        rv.get("log_verify_clean").is_none(),
        "fixture must omit log_verify_clean key"
    );
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        None,
        Some(&rv),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    assert_eq!(
        c.get("orders_projection_reconcile_gate_pass"),
        Some(&json!(true))
    );
    let bd = c.get("breakdown").unwrap();
    assert_eq!(
        bd.get("orders_projection")
            .and_then(|x| x.get("pass"))
            .and_then(|x| x.as_bool()),
        Some(true)
    );
    assert_eq!(
        bd.get("region_vault_log_verify")
            .and_then(|x| x.get("participates"))
            .and_then(|x| x.as_bool()),
        Some(false)
    );
}

#[test]
fn b101_compound_gate_fee_router_log_verify_clean_null_does_not_fail_compound() {
    let gate = json!({"pass": true});
    let fr = json!({
        "anchor": "B-081-FEE-ROUTER-LOG-VERIFY",
        "sample_limit_requested": 5u8,
        "sample_limit_applied": 5usize,
        "samples_returned": 1usize,
        "fee_router_projection_rows_fetched": 1usize,
        "samples": [{"ok": true}],
        "log_verify_clean": serde_json::Value::Null,
        "fee_router_recipients_on_chain": serde_json::Value::Null,
    });
    assert_eq!(fr.get("log_verify_clean"), Some(&serde_json::Value::Null));
    assert!(fr.get("skipped").is_none());
    assert!(fr.get("no_fee_router_rows").is_none());
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        Some(&fr),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    assert_eq!(
        c.get("orders_projection_reconcile_gate_pass"),
        Some(&json!(true))
    );
    let bd = c.get("breakdown").unwrap();
    assert_eq!(
        bd.get("orders_projection")
            .and_then(|x| x.get("pass"))
            .and_then(|x| x.as_bool()),
        Some(true)
    );
    assert_eq!(
        bd.get("fee_router_log_verify")
            .and_then(|x| x.get("participates"))
            .and_then(|x| x.as_bool()),
        Some(false)
    );
}

#[test]
fn b101_compound_gate_region_vault_log_verify_clean_null_does_not_fail_compound() {
    let gate = json!({"pass": true});
    let rv = json!({
        "anchor": "B-082-REGION-VAULT-LOG-VERIFY",
        "sample_limit_requested": 5u8,
        "sample_limit_applied": 5usize,
        "samples_returned": 1usize,
        "region_vault_projection_rows_fetched": 1usize,
        "samples": [{"ok": true}],
        "log_verify_clean": serde_json::Value::Null,
    });
    assert_eq!(rv.get("log_verify_clean"), Some(&serde_json::Value::Null));
    assert!(rv.get("skipped").is_none());
    assert!(rv.get("no_region_vault_rows").is_none());
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        None,
        Some(&rv),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    assert_eq!(
        c.get("orders_projection_reconcile_gate_pass"),
        Some(&json!(true))
    );
    let bd = c.get("breakdown").unwrap();
    assert_eq!(
        bd.get("orders_projection")
            .and_then(|x| x.get("pass"))
            .and_then(|x| x.as_bool()),
        Some(true)
    );
    assert_eq!(
        bd.get("region_vault_log_verify")
            .and_then(|x| x.get("participates"))
            .and_then(|x| x.as_bool()),
        Some(false)
    );
}

#[test]
fn b101_compound_gate_log_verify_noise_keys_do_not_change_compound_result() {
    let gate = json!({"pass": true});
    let fr = json!({
        "log_verify_clean": true,
        "samples": [1],
        "extra_note": "noise",
        "unexpected_counter": 42i64,
    });
    let rv = json!({
        "log_verify_clean": true,
        "samples": [1],
        "extra_note": "noise",
        "unexpected_counter": 7i64,
    });
    let (compound_pass, c) = indexer_reconcile_compound_gate(&gate,
        false,
        None,
        None,
        false,
        None,
        Some(&fr),
        Some(&rv),
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None);
    assert!(compound_pass);
    b101_assert_compound_pass_matches_breakdown(compound_pass, &c);
    assert_eq!(
        c.get("orders_projection_reconcile_gate_pass"),
        Some(&json!(true))
    );
    let bd = c.get("breakdown").unwrap();
    assert_eq!(
        bd.get("orders_projection")
            .and_then(|x| x.get("pass"))
            .and_then(|x| x.as_bool()),
        Some(true)
    );
    let fr_b = bd.get("fee_router_log_verify").unwrap();
    assert_eq!(
        fr_b.get("participates").and_then(|x| x.as_bool()),
        Some(true)
    );
    assert_eq!(fr_b.get("pass").and_then(|x| x.as_bool()), Some(true));
    let rv_b = bd.get("region_vault_log_verify").unwrap();
    assert_eq!(
        rv_b.get("participates").and_then(|x| x.as_bool()),
        Some(true)
    );
    assert_eq!(rv_b.get("pass").and_then(|x| x.as_bool()), Some(true));
}

#[test]
fn indexer_replay_body_deserializes_optional_chain_id() {
    let v = json!({"chain_id": 80001});
    let b: IndexerReplayBody = serde_json::from_value(v).unwrap();
    assert_eq!(b.chain_id, Some(80001));
    let empty: IndexerReplayBody = serde_json::from_value(json!({})).unwrap();
    assert!(empty.chain_id.is_none());
}

#[test]
fn indexer_reconcile_body_deserializes_orders_chain_id_backfill_dry_run() {
    let v = json!({"orders_chain_id_backfill_dry_run": true});
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.orders_chain_id_backfill_dry_run);
}

#[test]
fn indexer_reconcile_body_deserializes_correction_executor_chain_scope_flags() {
    let v = json!({
        "correction_executor_chain_scope_rollback_dry_run": true,
        "correction_executor_chain_scope_rollback_execute": true,
        "correction_executor_chain_scope_rollback_confirm": "CONFIRM_DELETE_CORRECTION_EXECUTOR_CHAIN_137"
    });
    let b: IndexerReconcileBody = serde_json::from_value(v).unwrap();
    assert!(b.correction_executor_chain_scope_rollback_dry_run);
    assert!(b.correction_executor_chain_scope_rollback_execute);
    assert_eq!(
        b.correction_executor_chain_scope_rollback_confirm
            .as_deref(),
        Some("CONFIRM_DELETE_CORRECTION_EXECUTOR_CHAIN_137")
    );
}

#[tokio::test]
async fn process_resolution_outbox_returns_chain_not_configured_without_chain_or_outbox() {
    let resp = process_resolution_outbox(State(build_state()))
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

/// **TT-B096-RESOLUTION-OUTBOX-PROCESS-PROJECTION-HANDLER-001**：队列非空时 **`process_resolution_outbox`** 走 **`chain::outbox::process_one`** → **`submit_execute_resolution`**；无密钥/RPC 时 **`execute_failed`** 且 **不**出队（等价于「已消费尝试、可追溯失败 detail」）；若环境已配执行器+可用 RPC 则 **`200`** + **`tx_hash`** 且出队。
#[tokio::test]
async fn b096_process_resolution_outbox_process_one_nonempty_queue() {
    let outbox = chain::outbox::new_resolution_outbox();
    chain::outbox::push_resolution(
        &outbox,
        chain::outbox::ResolutionOutboxEntry {
            order_id: "00000000-0000-0000-0000-0000000000b6".to_string(),
            escrow_address: "0x1111111111111111111111111111111111111111".to_string(),
            resolution_id: [0xB6u8; 32],
            decision_hash: [0x96u8; 32],
            guide_amount: 1,
            traveler_refund: 1,
            platform_fee: 1,
        },
    )
    .await;
    let mut s = build_state_chain_only_no_indexer_no_db_pool();
    s.resolution_outbox = Some(outbox.clone());
    let resp = process_resolution_outbox(State(s)).await.into_response();
    let status = resp.status();
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    match status {
        StatusCode::OK => {
            assert_eq!(v.get("processed").and_then(|x| x.as_u64()), Some(1));
            let tx = v.get("tx_hash").and_then(|x| x.as_str()).unwrap_or("");
            assert!(
                tx.starts_with("0x") && tx.len() > 2,
                "expected tx_hash, got {v}"
            );
            assert!(outbox.read().await.is_empty());
        }
        StatusCode::INTERNAL_SERVER_ERROR => {
            assert_eq!(
                v.get("error").and_then(|x| x.as_str()),
                Some("execute_failed")
            );
            let detail = v.get("detail").and_then(|x| x.as_str()).unwrap_or("");
            assert!(
                detail.contains("CHAIN_EXECUTOR_PRIVATE_KEY")
                    || detail.contains("connection")
                    || detail.contains("error sending request")
                    || detail.contains("get nonce")
                    || detail.contains("get gasPrice"),
                "unexpected detail={detail}"
            );
            assert_eq!(outbox.read().await.len(), 1);
        }
        other => panic!("unexpected status {other} body={v}"),
    }
}

#[tokio::test]
async fn post_internal_community_ranking_snapshot_db_unavailable() {
    let resp = post_internal_community_ranking_snapshot(
        State(build_state()),
        Json(InternalCommunityRankingSnapshotBody {
            feed_mode: "latest".to_string(),
            limit: Some(10),
            notes: None,
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("error"));
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("db_unavailable")
    );
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("db_unavailable")
    );
}

#[tokio::test]
async fn patch_feedback_official_reply_db_unavailable() {
    let resp = patch_feedback_official_reply(
        State(build_state()),
        AxumPath("550e8400-e29b-41d4-a716-446655440000".to_string()),
        None,
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("error"));
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("service_unavailable")
    );
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("service_unavailable")
    );
}

#[tokio::test]
async fn patch_feedback_official_reply_rejects_invalid_uuid() {
    let resp = patch_feedback_official_reply(
        State(build_state_chain_ready_with_dead_db_pool()),
        AxumPath("not-a-uuid".to_string()),
        Some(Json(json!({"official_reply": "ok"}))),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("error"));
    assert_eq!(v.get("error").and_then(|x| x.as_str()), Some("invalid_id"));
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("invalid_id")
    );
}

#[tokio::test]
async fn patch_feedback_official_reply_requires_official_reply_or_status() {
    let resp = patch_feedback_official_reply(
        State(build_state_chain_ready_with_dead_db_pool()),
        AxumPath("550e8400-e29b-41d4-a716-446655440000".to_string()),
        Some(Json(json!({}))),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::BAD_REQUEST);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("official_reply_or_status_required")
    );
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("official_reply_or_status_required")
    );
}

#[tokio::test]
async fn internal_scheduler_run_next_db_unavailable() {
    let resp = post_internal_scheduler_run_next(State(build_state()))
        .await
        .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("error"));
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("db_unavailable")
    );
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("db_unavailable")
    );
}

#[tokio::test]
async fn internal_scheduler_enqueue_db_unavailable() {
    let resp = post_internal_scheduler_enqueue(
        State(build_state()),
        Json(InternalSchedulerEnqueueBody {
            job_code: "community.ranking.snapshot.all".to_string(),
            trigger_source: "cron".to_string(),
        }),
    )
    .await
    .into_response();
    assert_eq!(resp.status(), StatusCode::SERVICE_UNAVAILABLE);
    let body = resp.into_body().collect().await.unwrap().to_bytes();
    let v: serde_json::Value = serde_json::from_slice(&body).expect("json");
    assert_eq!(v.get("status").and_then(|x| x.as_str()), Some("error"));
    assert_eq!(
        v.get("error").and_then(|x| x.as_str()),
        Some("db_unavailable")
    );
    assert_eq!(
        v.get("message").and_then(|x| x.as_str()),
        Some("db_unavailable")
    );
}

/// **`GET …/internal/indexer-status?live_reconcile=`** 与 **`IndexerStatusQuery`** 反序列化同口径（**110** 探针 / **`jq`**）。
#[test]
fn indexer_status_wants_live_reconcile_false_when_absent_or_unlisted_tokens() {
    assert!(!indexer_status_wants_live_reconcile(
        &IndexerStatusQuery {
            live_reconcile: None,
        }
    ));
    assert!(!indexer_status_wants_live_reconcile(
        &IndexerStatusQuery {
            live_reconcile: Some("0".into()),
        }
    ));
    assert!(!indexer_status_wants_live_reconcile(
        &IndexerStatusQuery {
            live_reconcile: Some("false".into()),
        }
    ));
    assert!(!indexer_status_wants_live_reconcile(
        &IndexerStatusQuery {
            live_reconcile: Some("no".into()),
        }
    ));
    assert!(!indexer_status_wants_live_reconcile(
        &IndexerStatusQuery {
            live_reconcile: Some("off".into()),
        }
    ));
}

#[test]
fn indexer_status_wants_live_reconcile_true_for_listed_tokens_trimmed_case_insensitive() {
    for s in ["1", "true", "yes", "on", " TRUE ", " Yes ", " ON "] {
        assert!(
            indexer_status_wants_live_reconcile(&IndexerStatusQuery {
                live_reconcile: Some(s.into()),
            }),
            "expected truthy for {s:?}"
        );
    }
}
