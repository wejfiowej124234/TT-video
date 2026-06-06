//! Orchestrates the OK branch of `POST /api/v1/internal/indexer-reconcile` (split for line-count gate).
use axum::Json;
use sqlx::PgPool;

use crate::chain::ChainConfig;
use crate::db;
use crate::state::ApiMetaState;

use super::body::IndexerReconcileBody;

pub(crate) async fn indexer_reconcile_ok(
    state: ApiMetaState,
    pool: &PgPool,
    config: &ChainConfig,
    body: Option<Json<IndexerReconcileBody>>,
    stats: db::OrdersProjectionReconcileStats,
    persist: bool,
    chain_id: u64,
    chain_id_i64: i64,
    reconcile_core_duration_ms: u64,
) -> axum::response::Response {
    let obs = match super::indexer_reconcile_ok_obs::run(
        &stats,
        reconcile_core_duration_ms,
        &state,
        pool,
        config,
        &body,
        chain_id,
        chain_id_i64,
    )
    .await
    {
        Ok(v) => v,
        Err(r) => return r,
    };
    let mid = match super::indexer_reconcile_ok_ssot::run(
        &state,
        pool,
        &body,
        &stats,
        chain_id,
        chain_id_i64,
        persist,
        obs,
    )
    .await
    {
        Ok(v) => v,
        Err(r) => return r,
    };
    let resp_body = match super::indexer_reconcile_ok_resp::run(
        &state,
        pool,
        &body,
        stats,
        chain_id,
        chain_id_i64,
        mid,
    )
    .await
    {
        Ok(v) => v,
        Err(r) => return r,
    };
    super::indexer_reconcile_ok_mutations::run(
        state,
        pool,
        &body,
        chain_id,
        chain_id_i64,
        resp_body,
    )
    .await
}
