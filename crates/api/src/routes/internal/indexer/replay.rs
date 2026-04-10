use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::chain_off;
use crate::state::ApiMetaState;

#[derive(Debug, Deserialize, Default)]
pub struct IndexerReplayBody {
    /// 缺省为当前 `chain_config.chain_id`
    #[serde(default)]
    pub chain_id: Option<u64>,
}
/// POST /api/v1/internal/indexer-replay：按 `event_log` 重放 **`orders_projection`**（110 §补全、04 §7.6）。
/// 须 **chain_off.db_pool**；body 可选 `{ "chain_id": <u64> }`。
pub async fn indexer_replay(
    State(state): State<ApiMetaState>,
    body: Option<Json<IndexerReplayBody>>,
) -> impl IntoResponse {
    let Some(config) = state.chain_config.as_ref() else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "chain_not_configured",
                "message": "chain_not_configured",
                "hint": "CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required"
            })),
        )
            .into_response();
    };
    if state.indexer_state.is_none() {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "chain_not_configured",
                "message": "chain_not_configured",
                "hint": "indexer state not initialized"
            })),
        )
            .into_response();
    }
    let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({
                "error": "database_required_for_replay",
                "message": "database_required_for_replay",
                "hint": "chain_off with DATABASE_URL required to replay event_log into orders_projection"
            })),
        )
            .into_response();
    };
    let chain_id = body.and_then(|j| j.0.chain_id).unwrap_or(config.chain_id);
    let chain_id_i64 = (chain_id.min(i64::MAX as u64)) as i64;
    let rpc_for_replay = config.rpc_url.trim();
    let rpc_replay_opt = (!rpc_for_replay.is_empty()).then_some(rpc_for_replay);
    match chain_off::replay_orders_projection_from_event_log(pool, chain_id_i64, rpc_replay_opt)
        .await
    {
        Ok(stats) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "task": "indexer_replay_orders_projection",
                "chain_id": chain_id,
                "checkpoint": {
                    "block_number": state.indexer_checkpoint.block_number,
                    "log_index": state.indexer_checkpoint.log_index
                },
                "finality_n": state.finality_n,
                "stats": stats,
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key_detail(
                "replay_orders_projection_failed",
                e.to_string(),
            )),
        )
            .into_response(),
    }
}
