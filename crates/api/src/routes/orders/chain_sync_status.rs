//! `GET /api/v1/orders/:id/chain-sync-status`（TT-B150 / 04 §3.4 / 110 §六）。

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use uuid::Uuid;

use crate::chain_off;
use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::chain_sync_contract::{
    CHAIN_SYNC_MINIMAL_BODY_NOTE, CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS,
};

/// **`GET /api/v1/orders/:id/chain-sync-status`** — **TT-B150** 契约与 **04 §3.4** / **110 §六** 对读；机读形状 **716～725** 与 **`GET /meta` `indexer.finality_discipline.order_chain_sync_status`** 同源。
pub async fn get_order_chain_sync_status(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    let Ok(order_id) = Uuid::parse_str(&id) else {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
        )
            .into_response();
    }
    let (cp_block, cp_log, cp_source) = state.indexer_checkpoint_for_observability().await;

    if let Some(ref co) = state.chain_off {
        let uid = match extract_user_with_session_check(&state, &headers).await {
            Some(u) => u,
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "login_required", "message": "login_required"})),
                )
                    .into_response();
            }
        };
        let store = co.store.read().await;
        let Some(order) = store.orders.get(&order_id) else {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "order_not_found", "message": "order_not_found"})),
            )
                .into_response();
        };        if !chain_off::order_detail_readable_by_user(&store, order, uid) {
            return (
                StatusCode::FORBIDDEN,
                Json(json!({"error": "forbidden", "message": "forbidden"})),
            )
                .into_response();
        };        let sync_status = if order.escrow_address.is_some() {
            if matches!(
                order.state,
                traveltrust_core::OrderState::Escrowed | traveltrust_core::OrderState::Completed
            ) {
                "confirmed"
            } else {
                "pending"
            }
        } else {
            "pending"
        };
        let (event_log_snapshot, event_log_absent_reason): (
            Option<serde_json::Value>,
            Option<&'static str>,
        ) = if let Some(ref pool) = co.db_pool {
            match order.chain_id.or(co.config.business_chain_id) {
                Some(cid) => {
                    match db::latest_escrow_event_finality_for_order(pool, cid, order_id).await {
                        Ok(Some(row)) => {
                            (Some(db::escrow_event_finality_snapshot_to_json(&row)), None)
                        }
                        Ok(None) => (None, Some("no_row")),
                        Err(_) => (None, Some("read_failed")),
                    }
                }
                None => (None, Some("no_chain_context")),
            }
        } else {
            (None, Some("no_database"))
        };

        let mut chain_sync = json!({
            "status": sync_status,
            "finality_n": state.finality_n,
            "checkpoint": {
                "block_number": cp_block,
                "log_index": cp_log,
                "source": cp_source,
            },
            "last_event": {
                "state": chain_off::order_state_to_str(order.state),
                "updated_at": order.updated_at.to_rfc3339(),
                "escrow_address": order.escrow_address,
            }
        });
        if let Some(obj) = chain_sync.as_object_mut() {
            apply_chain_sync_event_log_fields(obj, event_log_snapshot, event_log_absent_reason);
        }

        return Json(json!({
            "status": CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS,
            "order_id": order_id,
            "chain_sync": chain_sync,
        }))
        .into_response();
    };    let uid = match extract_user_with_session_check(&state, &headers).await {
        Some(u) => u,
        None => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "login_required", "message": "login_required"})),
            )
                .into_response();
        }
    };
    let mut chain_sync = json!({
        "status": "unknown",
        "finality_n": state.finality_n,
        "checkpoint": {
            "block_number": cp_block,
            "log_index": cp_log,
            "source": cp_source,
        },
        "last_event": null
    });
    if let Some(obj) = chain_sync.as_object_mut() {
        apply_chain_sync_event_log_fields(obj, None, Some("projection_backend_unavailable"));
    }

    Json(json!({
        "status": CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS,
        "order_id": order_id,
        "chain_sync": chain_sync,
        "note": CHAIN_SYNC_MINIMAL_BODY_NOTE,
        "requester": uid
    }))
    .into_response()
}

/// Writes **`event_log_snapshot`** or, when absent, **`event_log_snapshot_absent_reason`** (703).
pub(crate) fn apply_chain_sync_event_log_fields(
    chain_sync: &mut serde_json::Map<String, serde_json::Value>,
    snapshot: Option<serde_json::Value>,
    absent_reason: Option<&'static str>,
) {
    if let Some(snap) = snapshot {
        chain_sync.insert("event_log_snapshot".to_string(), snap);
    } else if let Some(reason) = absent_reason {
        chain_sync.insert(
            "event_log_snapshot_absent_reason".to_string(),
            serde_json::json!(reason),
        );
    }
}
