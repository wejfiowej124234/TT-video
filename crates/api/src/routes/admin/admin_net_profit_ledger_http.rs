//! GAP-IDX-NP-004 · Admin Protocol Operations — Country Pool Net Profit read-only ops console.

use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::json;

use crate::chain::ChainConfig;
use crate::db;
use crate::db::INDEXER_CHECKPOINT_CONSUMER_ID;
use crate::state::ApiMetaState;
use traveltrust_vacancy_indexer::vacancy_transparency::known_jurisdictions_from_registry;

#[derive(Debug, Deserialize)]
pub struct NetProfitOpsQuery {
    pub jurisdiction: Option<String>,
    pub events_limit: Option<u32>,
}

const EVENTS_DEFAULT: u32 = 50;
const EVENTS_MAX: u32 = 200;

pub fn router() -> Router<ApiMetaState> {
    Router::new().route("/net-profit-ledger", get(get_admin_net_profit_operations_console))
}

async fn get_admin_net_profit_operations_console(
    State(state): State<ApiMetaState>,
    Query(q): Query<NetProfitOpsQuery>,
) -> impl IntoResponse {
    let chain_id = ChainConfig::from_env()
        .map(|c| (c.chain_id.min(i64::MAX as u64)) as i64)
        .unwrap_or(11155111);

    let mut envelope = json!({
        "status": "ok",
        "chainId": chain_id,
        "dataSource": "indexer",
        "readOnly": true,
        "console": "NetProfitOperationsConsole",
        "protocolVersion": "Country Pool Net Profit D-4555-B v1",
        "splitRatio": "45/55",
    });

    let filter_j = q
        .jurisdiction
        .as_deref()
        .map(|s| s.trim().to_uppercase())
        .filter(|s| s.len() == 2 && s.chars().all(|c| c.is_ascii_alphabetic()));
    let events_limit = q.events_limit.unwrap_or(EVENTS_DEFAULT).min(EVENTS_MAX);

    let Some(co) = state.chain_off.as_ref() else {
        envelope["note"] = json!("chain_off_unavailable");
        envelope["events"] = json!([]);
        return (StatusCode::OK, Json(envelope)).into_response();
    };
    let Some(pool) = co.db_pool.as_ref() else {
        envelope["note"] = json!("database_unavailable");
        envelope["events"] = json!([]);
        return (StatusCode::OK, Json(envelope)).into_response();
    };

    let stats = db::net_profit_projection_stats(pool, chain_id)
        .await
        .unwrap_or_default();
    let checkpoint = db::fetch_indexer_checkpoint_for_chain(
        pool,
        INDEXER_CHECKPOINT_CONSUMER_ID,
        chain_id,
    )
    .await
    .ok()
    .flatten();
    let accounting_failures = db::count_net_profit_accounting_failures(pool, chain_id)
        .await
        .unwrap_or(0);
    let last_event_at = db::latest_net_profit_event_timestamp(pool, chain_id)
        .await
        .ok()
        .flatten()
        .map(|t| t.to_rfc3339());

    envelope["indexerHealth"] = json!({
        "lastIndexedBlock": stats.max_block,
        "lastIndexedLogIndex": stats.max_log_index,
        "epochCount": stats.epoch_count,
        "eventCount": stats.event_count,
        "indexerCheckpointBlock": checkpoint.map(|(b, _)| b),
        "lastEventTimestamp": last_event_at,
    });
    envelope["accountingAudit"] = json!({
        "netProfitSplitFailures": accounting_failures,
        "status": if accounting_failures == 0 { "PASS" } else { "FAIL" },
    });

    let epochs = db::list_net_profit_epochs(pool, chain_id, filter_j.as_deref(), 50)
        .await
        .unwrap_or_default();
    let known = known_jurisdictions_from_registry();
    let mut jurisdiction_ids: Vec<String> = if let Some(ref j) = filter_j {
        vec![j.clone()]
    } else {
        let mut ids = known.clone();
        for row in &epochs {
            if !ids.iter().any(|x| x == &row.jurisdiction) {
                ids.push(row.jurisdiction.clone());
            }
        }
        ids.sort();
        ids
    };
    if jurisdiction_ids.is_empty() {
        jurisdiction_ids = known;
    }

    envelope["jurisdictions"] = json!(jurisdiction_ids
        .iter()
        .map(|j| {
            let epoch_rows: Vec<_> = epochs
                .iter()
                .filter(|e| &e.jurisdiction == j)
                .map(|e| db::epoch_snapshot_to_public_json(&e.snapshot))
                .collect();
            json!({
                "jurisdiction": j,
                "indexed": !epoch_rows.is_empty(),
                "epochs": epoch_rows,
            })
        })
        .collect::<Vec<_>>());

    let events = db::list_net_profit_timeline_events(
        pool,
        chain_id,
        filter_j.as_deref(),
        events_limit,
    )
    .await
    .unwrap_or_default();
    envelope["events"] = json!(events
        .into_iter()
        .map(|e| json!({
            "event": e.event_type,
            "jurisdiction": e.jurisdiction,
            "epochId": e.epoch_id,
            "blockNumber": e.block_number,
            "logIndex": e.log_index,
            "txHash": e.tx_hash,
            "accountingOk": e.accounting_ok,
            "accountingNote": e.accounting_note,
        }))
        .collect::<Vec<_>>());

    (StatusCode::OK, Json(envelope)).into_response()
}
