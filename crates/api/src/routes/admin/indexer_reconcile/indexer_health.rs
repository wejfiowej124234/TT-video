//! Admin indexer 运行时健康快照（**`GET …/admin/indexer/health`**）。
use axum::extract::State;
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

use crate::db;
use crate::state::ApiMetaState;

use super::super::{
    admin_attach_meta_build, request_id_from_headers, require_admin_actor,
    write_admin_audit_log_best_effort,
};

pub async fn get_admin_indexer_health(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let actor_id = match require_admin_actor(&state, &headers).await {
        Ok((uid, _)) => uid,
        Err(resp) => return resp,
    };
    let request_id = request_id_from_headers(&headers);

    let runtime = if let Some(ref idx) = state.indexer_state {
        let g = idx.read().await;
        json!({
            "last_block": g.last_block,
            "last_log_index": g.last_log_index,
            "last_block_hash": g.last_block_hash,
            "events_cached": g.events.len(),
        })
    } else {
        json!({"status": "unavailable"})
    };

    let mut health = json!({
        "finality_n": state.finality_n,
        "checkpoint": {
            "block_number": state.indexer_checkpoint.block_number,
            "log_index": state.indexer_checkpoint.log_index,
        },
        "last_seen_finality_n": state.indexer_last_seen_finality_n,
        "replay_required": state.indexer_replay_required,
        "lag_blocks": state.indexer_lag_blocks,
        "lag_max_blocks": state.indexer_lag_max_blocks,
        "reorg_detected": state.reorg_detected,
        "runtime": runtime,
    });

    if let Some(pool) = state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        if let Ok(Some(v)) = db::admin_last_stored_orders_projection_reconcile(pool).await {
            health["last_stored_reconciliation"] = v;
        }
    };    let mut body = json!({
        "status": "ok",
        "health": health,
    });
    admin_attach_meta_build(&mut body);

    write_admin_audit_log_best_effort(
        &state,
        actor_id,
        request_id.as_deref(),
        "admin.indexer.health.read",
        Some("indexer"),
        None,
        json!({"ok": true}),
    )
    .await;

    Json(body).into_response()
}
