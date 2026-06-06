//! Optional destructive / chain-scope side effects for indexer-reconcile OK path.
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::{json, Value};
use sqlx::PgPool;
use std::path::Path;

use crate::chain;
use crate::db;
use crate::state::ApiMetaState;

use super::body::IndexerReconcileBody;

pub(crate) async fn run(
    state: ApiMetaState,
    pool: &PgPool,
    body: &Option<Json<IndexerReconcileBody>>,
    chain_id: u64,
    chain_id_i64: i64,
    mut resp_body: Value,
) -> axum::response::Response {
    if body
        .as_ref()
        .is_some_and(|j| j.0.correction_executor_chain_scope_rollback_dry_run)
    {
        match db::correction_executor_chain_scope_rollback_dry_run(pool, chain_id_i64).await {
            Ok(d) => {
                let mut v = serde_json::to_value(d).unwrap_or_else(|_| json!({}));
                if let Some(obj) = v.as_object_mut() {
                    obj.insert(
                        "anchor".to_string(),
                        json!("110-CORRECTION-EXECUTOR-CHAIN-SCOPE-DRY-RUN"),
                    );
                }
                resp_body["correction_executor_chain_scope_rollback_dry_run"] = v;
            }
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "correction_executor_chain_scope_rollback_dry_run_failed",
                        e.to_string(),
                    )),
                )
                    .into_response();
            }
        }
    };    if body
        .as_ref()
        .is_some_and(|j| j.0.correction_executor_chain_scope_rollback_execute)
    {
        let allowed = matches!(
            std::env::var("TRAVELTRUST_ALLOW_CORRECTION_EXECUTOR_CHAIN_SCOPE_ROLLBACK")
                .as_deref(),
            Ok(v) if v.trim() == "1"
        );
        if !allowed {
            return (
                StatusCode::FORBIDDEN,
                Json(crate::api_json::err_key_detail(
                    "correction_executor_chain_scope_rollback_execute_forbidden",
                    "set TRAVELTRUST_ALLOW_CORRECTION_EXECUTOR_CHAIN_SCOPE_ROLLBACK=1 on the API process to enable destructive chain-scoped correction_log/executor_executions rollback",
                )),
            )
                .into_response();
        };        let expected = db::correction_executor_chain_scope_rollback_expected_confirm(chain_id_i64);
        let got = body
            .as_ref()
            .and_then(|j| {
                j.0.correction_executor_chain_scope_rollback_confirm
                    .as_deref()
            })
            .unwrap_or("");
        if got != expected.as_str() {
            return (
                StatusCode::BAD_REQUEST,
                Json(crate::api_json::err_key_detail(
                    "correction_executor_chain_scope_rollback_execute_confirm_mismatch",
                    format!(
                        "correction_executor_chain_scope_rollback_confirm must equal {:?} for this request chain_id",
                        expected
                    ),
                )),
            )
                .into_response();
        };        match db::correction_executor_chain_scope_rollback_execute(pool, chain_id_i64).await {
            Ok(summary) => {
                let mut v = serde_json::to_value(summary).unwrap_or_else(|_| json!({}));
                if let Some(obj) = v.as_object_mut() {
                    obj.insert(
                        "anchor".to_string(),
                        json!("110-CORRECTION-EXECUTOR-CHAIN-SCOPE-EXECUTE"),
                    );
                }
                resp_body["correction_executor_chain_scope_rollback_execute"] = v;
            }
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "correction_executor_chain_scope_rollback_execute_failed",
                        e.to_string(),
                    )),
                )
                    .into_response();
            }
        }
    };    if body
        .as_ref()
        .is_some_and(|j| j.0.sync_indexer_memory_from_db_checkpoint)
    {
        let allowed = matches!(
            std::env::var("TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB").as_deref(),
            Ok(v) if v.trim() == "1"
        );
        if !allowed {
            return (
                StatusCode::FORBIDDEN,
                Json(crate::api_json::err_key_detail(
                    "indexer_memory_sync_from_db_forbidden",
                    "set TRAVELTRUST_ALLOW_INDEXER_MEMORY_SYNC_FROM_DB=1 on the API process to align in-memory indexer checkpoint with checkpoints_sharded",
                )),
            )
                .into_response();
        };        let Some(ref indexer_handle) = state.indexer_state else {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(crate::api_json::err_key_detail(
                    "indexer_state_unavailable",
                    "indexer state handle not mounted",
                )),
            )
                .into_response();
        };        match db::fetch_indexer_checkpoint_for_chain(
            pool,
            db::INDEXER_CHECKPOINT_CONSUMER_ID,
            chain_id_i64,
        )
        .await
        {
            Ok(db_row) => {
                let before = {
                    let g = indexer_handle.read().await;
                    json!({
                        "last_block": g.last_block,
                        "last_log_index": g.last_log_index,
                        "events_cached": g.events.len(),
                    })
                };
                let (src, bn, li) = match db_row {
                    Some((b, l)) => {
                        if b < 0 {
                            return (
                                StatusCode::INTERNAL_SERVER_ERROR,
                                Json(crate::api_json::err_key_detail(
                                    "indexer_memory_sync_from_db_failed",
                                    "checkpoints_sharded.block_number must be non-negative",
                                )),
                            )
                                .into_response();
                        }
                        ("db_checkpoint_row", b as u64, l.max(0) as u32)
                    }
                    None => ("no_db_row_reset", 0u64, 0u32),
                };
                {
                    let mut g = indexer_handle.write().await;
                    g.events.retain(|e| {
                        e.block_number < bn || (e.block_number == bn && e.log_index <= li)
                    });
                    g.last_block = bn;
                    g.last_log_index = li;
                    g.last_block_hash = g
                        .events
                        .iter()
                        .find(|e| e.block_number == bn && e.log_index == li)
                        .map(|e| e.block_hash.clone())
                        .unwrap_or_default();
                };                let after = {
                    let g = indexer_handle.read().await;
                    json!({
                        "last_block": g.last_block,
                        "last_log_index": g.last_log_index,
                        "events_cached": g.events.len(),
                    })
                };
                let runtime_path_str = format!("{}.runtime", state.indexer_state_path);
                let runtime_path = Path::new(&runtime_path_str);
                {
                    let guard = indexer_handle.read().await;
                    if let Err(e) = chain::indexer::persist_indexer_state(runtime_path, &guard) {
                        return (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(crate::api_json::err_key_detail(
                                "indexer_memory_sync_from_db_persist_failed",
                                format!("{}", e),
                            )),
                        )
                            .into_response();
                    }
                }
                resp_body["indexer_memory_sync_from_db"] = json!({
                    "anchor": "110-INDEXER-MEMORY-SYNC-FROM-DB",
                    "chain_id": chain_id,
                    "source": src,
                    "before": before,
                    "after": after,
                    "note": "GET /meta.indexer.memory reflects live handle; GET /meta.indexer.checkpoint may still show startup snapshot until process restart",
                });
            }
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(crate::api_json::err_key_detail(
                        "indexer_memory_sync_from_db_failed",
                        e.to_string(),
                    )),
                )
                    .into_response();
            }
        }
    }
    (StatusCode::OK, Json(resp_body)).into_response()
}
