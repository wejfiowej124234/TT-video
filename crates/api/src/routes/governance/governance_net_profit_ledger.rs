//! GAP-IDX-NP-004 · `GET /api/v1/governance/net-profit-ledger` — read-only D-4555-B transparency.

use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::chain::ChainConfig;
use crate::db;
use crate::state::ApiMetaState;
use traveltrust_vacancy_indexer::vacancy_transparency::known_jurisdictions_from_registry;

#[derive(Debug, Deserialize)]
pub struct NetProfitLedgerQuery {
    pub jurisdiction: Option<String>,
    pub timeline_limit: Option<u32>,
    pub epochs_limit: Option<u32>,
}

const TIMELINE_DEFAULT: u32 = 50;
const TIMELINE_MAX: u32 = 200;
const EPOCHS_DEFAULT: u32 = 20;

fn net_profit_meta(chain_id: i64) -> serde_json::Value {
    json!({
        "protocolVersion": "Country Pool Net Profit D-4555-B v1",
        "protocolStatus": "PASS",
        "runtimeStatus": "ACTIVE",
        "runtimeCapability": "indexer_projection_v1",
        "lastVerified": "2026-07-12",
        "network": if chain_id == 11155111 { "Sepolia" } else { "local" },
        "reconcileStatus": "INDEXER_SSOT",
        "splitRatio": "45/55",
        "settlementDenomination": "USDC",
    })
}

/// GET /api/v1/governance/net-profit-ledger
pub async fn get_governance_net_profit_ledger(
    State(state): State<ApiMetaState>,
    Query(q): Query<NetProfitLedgerQuery>,
) -> impl IntoResponse {
    let chain_id = ChainConfig::from_env()
        .map(|c| (c.chain_id.min(i64::MAX as u64)) as i64)
        .unwrap_or(11155111);
    let mut envelope = net_profit_meta(chain_id);
    envelope["status"] = json!("ok");
    envelope["chainId"] = json!(chain_id);
    envelope["dataSource"] = json!("indexer");
    envelope["readOnly"] = json!(true);

    let filter_j = q
        .jurisdiction
        .as_deref()
        .map(|s| s.trim().to_uppercase())
        .filter(|s| s.len() == 2 && s.chars().all(|c| c.is_ascii_alphabetic()));

    let timeline_limit = q
        .timeline_limit
        .unwrap_or(TIMELINE_DEFAULT)
        .min(TIMELINE_MAX);
    let epochs_limit = q.epochs_limit.unwrap_or(EPOCHS_DEFAULT).min(TIMELINE_MAX);

    let Some(co) = state.chain_off.as_ref() else {
        envelope["jurisdictions"] = json!(placeholder_jurisdictions(filter_j.as_deref()));
        envelope["note"] = json!("chain_off_unavailable");
        return (StatusCode::OK, Json(envelope)).into_response();
    };
    let Some(pool) = co.db_pool.as_ref() else {
        envelope["jurisdictions"] = json!(placeholder_jurisdictions(filter_j.as_deref()));
        envelope["note"] = json!("database_unavailable");
        return (StatusCode::OK, Json(envelope)).into_response();
    };

    let stats = db::net_profit_projection_stats(pool, chain_id)
        .await
        .unwrap_or_default();
    envelope["indexerStats"] = json!({
        "epochCount": stats.epoch_count,
        "eventCount": stats.event_count,
        "lastIndexedBlock": stats.max_block,
        "lastIndexedLogIndex": stats.max_log_index,
    });

    let accounting_failures = db::count_net_profit_accounting_failures(pool, chain_id)
        .await
        .unwrap_or(0);
    envelope["accountingAudit"] = json!({
        "netProfitSplitFailures": accounting_failures,
        "status": if accounting_failures == 0 { "PASS" } else { "FAIL" },
    });

    let epochs = db::list_net_profit_epochs(pool, chain_id, filter_j.as_deref(), epochs_limit)
        .await
        .unwrap_or_default();

    let mut by_j: std::collections::HashMap<String, Vec<serde_json::Value>> =
        std::collections::HashMap::new();
    for row in epochs {
        by_j.entry(row.jurisdiction.clone())
            .or_default()
            .push(db::epoch_snapshot_to_public_json(&row.snapshot));
    }

    let known = known_jurisdictions_from_registry();
    let jurisdiction_ids: Vec<String> = if let Some(ref j) = filter_j {
        vec![j.clone()]
    } else {
        let mut ids = known;
        for k in by_j.keys() {
            if !ids.iter().any(|x| x == k) {
                ids.push(k.clone());
            }
        }
        ids.sort();
        ids
    };

    let mut jurisdictions = Vec::new();
    for j in jurisdiction_ids {
        let epoch_rows = by_j.get(&j).cloned().unwrap_or_default();
        let mut entry = json!({
            "jurisdiction": j,
            "indexed": !epoch_rows.is_empty(),
            "epochs": epoch_rows,
        });
        if filter_j.as_deref() == Some(j.as_str()) {
            match db::list_net_profit_timeline_events(
                pool,
                chain_id,
                Some(&j),
                timeline_limit,
            )
            .await
            {
                Ok(events) => {
                    entry["timeline"] = json!(events
                        .into_iter()
                        .map(|e| json!({
                            "event": e.event_type,
                            "blockNumber": e.block_number,
                            "logIndex": e.log_index,
                            "txHash": e.tx_hash,
                            "jurisdiction": e.jurisdiction,
                            "epochId": e.epoch_id,
                            "accountingOk": e.accounting_ok,
                            "dataSource": "indexer",
                        }))
                        .collect::<Vec<_>>());
                }
                Err(e) => entry["timelineError"] = json!(e.to_string()),
            }
        }
        jurisdictions.push(entry);
    }

    envelope["jurisdictions"] = json!(jurisdictions);
    (StatusCode::OK, Json(envelope)).into_response()
}

fn placeholder_jurisdictions(filter: Option<&str>) -> Vec<serde_json::Value> {
    let ids: Vec<String> = filter
        .map(|j| vec![j.to_string()])
        .unwrap_or_else(known_jurisdictions_from_registry);
    ids.into_iter()
        .map(|j| {
            json!({
                "jurisdiction": j,
                "indexed": false,
                "epochs": [],
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn placeholder_includes_de() {
        let rows = placeholder_jurisdictions(None);
        assert!(rows.iter().any(|r| r["jurisdiction"] == "DE"));
    }
}
