//! W4a · `GET /api/v1/governance/vacancy-ledger` — read-only transparency (Indexer SSOT).

use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::chain::ChainConfig;
use crate::db;
use crate::state::ApiMetaState;

use traveltrust_vacancy_indexer::vacancy_transparency::{
    known_jurisdictions_from_registry, meta_to_json, vacancy_transparency_meta,
};

#[derive(Debug, Deserialize)]
pub struct VacancyLedgerQuery {
    pub jurisdiction: Option<String>,
    pub timeline_limit: Option<u32>,
}

const TIMELINE_DEFAULT: u32 = 50;
const TIMELINE_MAX: u32 = 200;

/// GET /api/v1/governance/vacancy-ledger — Vacancy Ledger transparency (Indexer projection only).
pub async fn get_governance_vacancy_ledger(
    State(state): State<ApiMetaState>,
    Query(q): Query<VacancyLedgerQuery>,
) -> impl IntoResponse {
    let chain_id = ChainConfig::from_env()
        .map(|c| (c.chain_id.min(i64::MAX as u64)) as i64)
        .unwrap_or(11155111);
    let meta = vacancy_transparency_meta(chain_id);
    let mut envelope = meta_to_json(&meta);
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

    let Some(co) = state.chain_off.as_ref() else {
        envelope["jurisdictions"] = json!(build_placeholder_jurisdictions(&meta, filter_j.as_deref()));
        envelope["note"] = json!("chain_off_unavailable");
        return (StatusCode::OK, Json(envelope)).into_response();
    };
    let Some(pool) = co.db_pool.as_ref() else {
        envelope["jurisdictions"] = json!(build_placeholder_jurisdictions(&meta, filter_j.as_deref()));
        envelope["note"] = json!("database_unavailable");
        return (StatusCode::OK, Json(envelope)).into_response();
    };

    let projections = match db::list_vacancy_ledger_projections(pool, chain_id).await {
        Ok(rows) => rows,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "error": "vacancy_ledger_list_failed",
                    "detail": e.to_string()
                })),
            )
                .into_response();
        }
    };

    let mut by_j: std::collections::HashMap<String, db::VacancyLedgerProjectionRow> =
        std::collections::HashMap::new();
    for row in projections {
        by_j.insert(row.jurisdiction.clone(), row);
    }

    let known = known_jurisdictions_from_registry();
    let jurisdiction_ids: Vec<String> = if let Some(ref j) = filter_j {
        vec![j.clone()]
    } else {
        let mut ids: Vec<String> = known;
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
        let indexed = by_j.get(&j);
        let mut entry = json!({
            "jurisdiction": j,
            "runtimeStatus": meta.runtime_status,
            "indexed": indexed.is_some(),
            "ledger": indexed.map(|r| db::snapshot_to_public_json(&r.snapshot)),
        });
        if let Some(detail) = filter_j.as_ref() {
            if detail == &j {
                match db::list_vacancy_timeline_events(pool, chain_id, Some(&j), timeline_limit)
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
                                "dataSource": "indexer",
                            }))
                            .collect::<Vec<_>>());
                    }
                    Err(e) => {
                        entry["timelineError"] = json!(e.to_string());
                    }
                }
            }
        }
        jurisdictions.push(entry);
    }

    envelope["jurisdictions"] = json!(jurisdictions);
    (StatusCode::OK, Json(envelope)).into_response()
}

    fn build_placeholder_jurisdictions(
    meta: &traveltrust_vacancy_indexer::vacancy_transparency::VacancyTransparencyMeta,
    filter: Option<&str>,
) -> Vec<serde_json::Value> {
    let ids: Vec<String> = filter
        .map(|j| vec![j.to_string()])
        .unwrap_or_else(known_jurisdictions_from_registry);
    ids.into_iter()
        .map(|j| {
            json!({
                "jurisdiction": j,
                "runtimeStatus": meta.runtime_status,
                "indexed": false,
                "ledger": null,
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn placeholder_jurisdiction_includes_de() {
        let meta = vacancy_transparency_meta(11155111);
        let rows = build_placeholder_jurisdictions(&meta, None);
        assert!(rows.iter().any(|r| r["jurisdiction"] == "DE"));
        assert_eq!(rows[0]["indexed"], false);
    }
}
