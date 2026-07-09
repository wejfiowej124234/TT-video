//! W4b · Protocol Operations Console — read-only admin Vacancy Ledger ops (Indexer SSOT).

use axum::extract::{Path, Query, State};
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
use traveltrust_vacancy_indexer::vacancy_ops::{
    build_indexer_health_ops, build_reconciliation_ops, event_explorer_ledger_fields,
    indexer_health_ops_to_json, reconciliation_ops_to_json, runtime_activation_label,
};
use traveltrust_vacancy_indexer::vacancy_transparency::{
    known_jurisdictions_from_registry, meta_to_json, vacancy_transparency_meta,
};

#[derive(Debug, Deserialize)]
pub struct VacancyOpsQuery {
    pub jurisdiction: Option<String>,
    pub events_limit: Option<u32>,
}

const EVENTS_DEFAULT: u32 = 50;
const EVENTS_MAX: u32 = 200;

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/vacancy-ledger", get(get_admin_vacancy_operations_console))
        .route(
            "/vacancy-ledger/:jurisdiction",
            get(get_admin_vacancy_ledger_snapshot),
        )
}

async fn get_admin_vacancy_operations_console(
    State(state): State<ApiMetaState>,
    Query(q): Query<VacancyOpsQuery>,
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
    envelope["console"] = json!("ProtocolOperationsConsole");
    envelope["runtimeActivation"] = json!(runtime_activation_label(&meta.runtime_status));

    let filter_j = q
        .jurisdiction
        .as_deref()
        .map(|s| s.trim().to_uppercase())
        .filter(|s| s.len() == 2 && s.chars().all(|c| c.is_ascii_alphabetic()));
    let events_limit = q.events_limit.unwrap_or(EVENTS_DEFAULT).min(EVENTS_MAX);

    let Some(co) = state.chain_off.as_ref() else {
        envelope["reconciliation"] = reconciliation_ops_to_json(&build_reconciliation_ops(
            &meta.runtime_status,
            &meta.reconcile_status,
            None,
            None,
        ));
        envelope["indexerHealth"] = json!({});
        envelope["jurisdictions"] = json!([]);
        envelope["events"] = json!([]);
        envelope["note"] = json!("chain_off_unavailable");
        return (StatusCode::OK, Json(envelope)).into_response();
    };
    let Some(pool) = co.db_pool.as_ref() else {
        envelope["note"] = json!("database_unavailable");
        envelope["events"] = json!([]);
        return (StatusCode::OK, Json(envelope)).into_response();
    };

    let stats = db::vacancy_projection_stats(pool, chain_id)
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
    let event_count = db::count_vacancy_events(pool, chain_id).await.unwrap_or(0) as u64;
    let last_event_at = db::latest_vacancy_event_timestamp(pool, chain_id)
        .await
        .ok()
        .flatten()
        .map(|t| t.to_rfc3339());

    let projection_block = stats.max_block.map(|b| b as u64);
    let checkpoint_block = checkpoint.map(|(b, _)| b as u64);
    let reconciliation = build_reconciliation_ops(
        &meta.runtime_status,
        &meta.reconcile_status,
        checkpoint_block,
        projection_block,
    );
    let indexer_health = build_indexer_health_ops(
        projection_block,
        stats.max_log_index.map(|i| i as u32),
        last_event_at,
        event_count,
        checkpoint_block,
    );
    envelope["reconciliation"] = reconciliation_ops_to_json(&reconciliation);
    envelope["indexerHealth"] = indexer_health_ops_to_json(&indexer_health);

    let projections = db::list_vacancy_ledger_projections(pool, chain_id)
        .await
        .unwrap_or_default();
    let mut by_j = std::collections::HashMap::new();
    for row in projections {
        by_j.insert(row.jurisdiction.clone(), row);
    }
    let jurisdiction_ids: Vec<String> = filter_j
        .clone()
        .map(|j| vec![j])
        .unwrap_or_else(|| {
            let mut ids = known_jurisdictions_from_registry();
            for k in by_j.keys() {
                if !ids.iter().any(|x| x == k) {
                    ids.push(k.clone());
                }
            }
            ids.sort();
            ids
        });

    let jurisdictions: Vec<serde_json::Value> = jurisdiction_ids
        .iter()
        .map(|j| {
            let indexed = by_j.get(j);
            json!({
                "jurisdiction": j,
                "runtimeStatus": meta.runtime_status,
                "indexed": indexed.is_some(),
                "ledger": indexed.map(|r| db::snapshot_to_public_json(&r.snapshot)),
                "updatedAt": indexed.and_then(|r| r.updated_at.clone()),
            })
        })
        .collect();
    envelope["jurisdictions"] = json!(jurisdictions);

    let explorer_rows = db::list_vacancy_event_explorer(
        pool,
        chain_id,
        filter_j.as_deref(),
        events_limit,
    )
    .await
    .unwrap_or_default();
    let events: Vec<serde_json::Value> = explorer_rows
        .into_iter()
        .map(|row| {
            let fields = event_explorer_ledger_fields(&row.topic0, &row.topics, &row.data);
            json!({
                "occurredAt": row.created_at,
                "event": row.event_type,
                "jurisdiction": row.jurisdiction,
                "blockNumber": row.block_number,
                "logIndex": row.log_index,
                "txHash": row.tx_hash,
                "ledgerFields": fields,
                "dataSource": "indexer",
            })
        })
        .collect();
    envelope["events"] = json!(events);

    (StatusCode::OK, Json(envelope)).into_response()
}

async fn get_admin_vacancy_ledger_snapshot(
    State(state): State<ApiMetaState>,
    Path(jurisdiction): Path<String>,
) -> impl IntoResponse {
    let j = jurisdiction.trim().to_uppercase();
    if j.len() != 2 || !j.chars().all(|c| c.is_ascii_alphabetic()) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": "invalid_jurisdiction",
                "detail": "jurisdiction must be two ASCII letters"
            })),
        )
            .into_response();
    }

    let Some(co) = state.chain_off.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "chain_off_unavailable" })),
        )
            .into_response();
    };
    let Some(pool) = co.db_pool.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "database_unavailable" })),
        )
            .into_response();
    };

    let chain_id = ChainConfig::from_env()
        .map(|c| (c.chain_id.min(i64::MAX as u64)) as i64)
        .unwrap_or(0);

    match db::get_vacancy_ledger_projection(pool, chain_id, &j).await {
        Ok(Some(snap)) => (
            StatusCode::OK,
            Json(db::snapshot_to_public_json(&snap)),
        )
            .into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(json!({
                "error": "vacancy_ledger_not_indexed",
                "jurisdiction": j
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "vacancy_ledger_read_failed", "detail": e.to_string() })),
        )
            .into_response(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn public_json_uses_indexer_fields_only() {
        let snap = crate::chain::vacancy_ledger_indexer::VacancyLedgerSnapshot {
            jurisdiction: "JP".to_string(),
            state: "SWEEP".to_string(),
            principal: "1000".to_string(),
            swept: "250".to_string(),
            reserve: "500".to_string(),
            disbursed: "250".to_string(),
            sweep_enabled: false,
            steward_activation_epoch_id: Some("3".to_string()),
            last_block: Some(42),
            last_log_index: Some(1),
        };
        let v = db::snapshot_to_public_json(&snap);
        assert_eq!(v["reserve"], "500");
        assert_eq!(v["dataSource"], "indexer");
        assert_eq!(v["readOnly"], true);
        assert!(v.get("computedReserve").is_none());
    }
}
