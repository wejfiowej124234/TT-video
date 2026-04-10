//! Resolution outbox + region share snapshot line (internal).
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use serde_json::json;

use crate::chain;
use crate::db;
use crate::state::ApiMetaState;

use super::common;

/// POST /api/v1/internal/process-resolution-outbox：执行器消费一条裁决并代发链上（P5-4）
pub async fn process_resolution_outbox(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let (config, outbox) = match (&state.chain_config, &state.resolution_outbox) {
        (Some(c), Some(o)) => (c.clone(), o.clone()),
        _ => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({"error": "chain_not_configured", "message": "chain_not_configured", "hint": "CHAIN_RPC_URL and ESCROW_FACTORY_ADDRESS required"})),
            )
                .into_response();
        }
    };
    match chain::outbox::process_one(&outbox, &config).await {
        Some((count, Ok(tx_hash))) => (
            StatusCode::OK,
            Json(json!({"status": "ok", "processed": count, "tx_hash": tx_hash})),
        )
            .into_response(),
        Some((_, Err(e))) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key_detail("execute_failed", e)),
        )
            .into_response(),
        None => (
            StatusCode::OK,
            Json(json!({"status": "ok", "processed": 0, "message": "outbox_empty"})),
        )
            .into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct RegionShareSnapshotLineBody {
    pub chain_id: i64,
    pub region_id: String,
    pub snapshot_epoch: i64,
    pub recipient_address: String,
    pub snapshot_block_number: i64,
    pub share_balance_u256_hex: String,
}

/// POST /api/v1/internal/region-share-snapshot-line — **B-115-4** 内网物化 **`region_share_snapshot_lines`**（**不依赖**链上 Snapshot 事件；与 `indexer_tick` 解析路径 **同表**）。
pub async fn post_internal_region_share_snapshot_line(
    State(state): State<ApiMetaState>,
    Json(body): Json<RegionShareSnapshotLineBody>,
) -> impl IntoResponse {
    let Some(pool) = state.chain_off.as_ref().and_then(|co| co.db_pool.as_ref()) else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(crate::api_json::err_key("database_required_for_region_share_snapshot_line")),
        )
            .into_response();
    };
    let region_id = body.region_id.trim();
    if region_id.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("region_id_required")),
        )
            .into_response();
    }
    let recipient = common::normalize_hex_addr(&body.recipient_address);
    let r = recipient.trim_start_matches("0x");
    if r.len() != 40 || !r.chars().all(|c| c.is_ascii_hexdigit()) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_recipient_address")),
        )
            .into_response();
    }
    let share_hex = body.share_balance_u256_hex.trim();
    if !share_hex.starts_with("0x") {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_share_balance_u256_hex")),
        )
            .into_response();
    }
    let hex_body = share_hex.trim_start_matches("0x");
    if hex_body.len() != 64 || !hex_body.chars().all(|c| c.is_ascii_hexdigit()) {
        return (
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("invalid_share_balance_u256_hex")),
        )
            .into_response();
    }
    match db::insert_region_share_snapshot_line(
        pool,
        body.chain_id,
        region_id,
        body.snapshot_epoch,
        &recipient,
        body.snapshot_block_number,
        share_hex,
    )
    .await
    {
        Ok(Some(id)) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "inserted": true,
                "id": id.to_string(),
            })),
        )
            .into_response(),
        Ok(None) => (
            StatusCode::OK,
            Json(json!({
                "status": "ok",
                "inserted": false,
                "idempotent": true,
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key_detail(
                "insert_region_share_snapshot_line_failed",
                e.to_string(),
            )),
        )
            .into_response(),
    }
}
