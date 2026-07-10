//! /api/v1/orders（48 §2.2 routes/orders）

mod mutations;
mod order_detail_chain_ssot;
mod reviews;

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, patch, post};
use axum::Json;
use axum::Router;
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

use crate::chain;
use crate::chain_off;
use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::not_impl_json;
use mutations::{
    confirm_final_plan, order_accept, order_cancel, order_confirm_bilateral,
    order_confirm_completion, order_confirm_rating, order_confirm_service_completion, order_mock_pay, patch_order_guide,
    patch_order_itinerary, patch_order_trip_dates, set_order_escrow_address,
};
use reviews::{review_submit, reviews_list};

/// **714**：非 chain_off 最小成功体根级 `note` 稳定句（与 `GET /meta` `order_chain_sync_status.minimal_body_note_stable` 机读同源）。
pub(crate) const CHAIN_SYNC_MINIMAL_BODY_NOTE: &str =
    "minimal runtime snapshot when order projection backend is unavailable";

/// **715**：成功体根级 `status` 字面（与 `chain_sync.status` pending/confirmed/unknown 区分；与 `GET /meta` `order_chain_sync_status.success_body_envelope_status` 机读同源）。
pub(crate) const CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS: &str = "ok";

/// **716**：200 成功体 `chain_sync` 必有顶层 JSON 键（与 `GET /meta` `order_chain_sync_status.chain_sync_required_top_keys` 机读同源）。
pub(crate) const CHAIN_SYNC_REQUIRED_TOP_KEYS: &[&str] =
    &["status", "finality_n", "checkpoint", "last_event"];

/// **717**：`GET /meta` `order_chain_sync_status.method_path` 与 `router().route` 挂载路径同源（机读锁 `method_path_contract_717`）。
pub(crate) const CHAIN_SYNC_ROUTE_PATH: &str = "/api/v1/orders/:id/chain-sync-status";

/// **717**：HTTP 方法 + 路径字面（与 **`CHAIN_SYNC_ROUTE_PATH`** 对读：`GET {CHAIN_SYNC_ROUTE_PATH}`）。
pub(crate) const CHAIN_SYNC_STATUS_METHOD_AND_PATH: &str =
    "GET /api/v1/orders/:id/chain-sync-status";

/// **718**：`GET /meta` `order_chain_sync_status.code` 机读锚点（实现文件路径 + `get_order_chain_sync_status` 符号；与 `code_contract_718` 同源）。
pub(crate) const CHAIN_SYNC_STATUS_HANDLER_CODE: &str =
    "crates/api/src/routes/orders/mod.rs get_order_chain_sync_status";

/// **719**：`GET /meta` `order_chain_sync_status.status_values` 与 **`713`**** **`chain_sync.status`** **三值** **同源**（顺序 **`pending` → `confirmed` → `unknown`**）。
pub(crate) const CHAIN_SYNC_STATUS_VALUES: &[&str] = &["pending", "confirmed", "unknown"];

/// **720**：`GET /meta` `order_chain_sync_status.absent_reason_values` 与 **`703`**** **`event_log_snapshot_absent_reason`** **五键** **同源**（顺序 **`no_database` → `no_chain_context` → `no_row` → `read_failed` → `projection_backend_unavailable`**）。
pub(crate) const CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS: &[&str] = &[
    "no_database",
    "no_chain_context",
    "no_row",
    "read_failed",
    "projection_backend_unavailable",
];

/// **721**：**chain_off** 时 **`chain_sync.last_event`** 对象顶层键（与 **`GET /meta`**** **`order_chain_sync_status.last_event_top_keys`** **及 **`706`** **同源**；顺序 **`state` → `updated_at` → `escrow_address`**）。
pub(crate) const CHAIN_SYNC_LAST_EVENT_TOP_KEYS: &[&str] =
    &["state", "updated_at", "escrow_address"];

/// **723**：成功体 **`chain_sync.checkpoint`** 对象顶层键（与 **`GET /meta`**** **`order_chain_sync_status.checkpoint_top_keys`** **及 **`710`****/**`712`** **同源**；顺序 **`block_number` → `log_index` → `source`**）。
pub(crate) const CHAIN_SYNC_CHECKPOINT_TOP_KEYS: &[&str] = &["block_number", "log_index", "source"];

/// **724**：**`chain_sync.checkpoint.source`** 与 **`GET /meta.indexer.checkpoint.source`** **合法机器值（与 **`order_chain_sync_status.checkpoint_source_values`** **及 **`712`** **同源**；顺序 **`runtime` → `startup_snapshot`**；**`ApiMetaState::indexer_checkpoint_for_observability`** **写入**）。
pub(crate) const CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES: &[&str] = &["runtime", "startup_snapshot"];

/// **725**：`GET /meta` `indexer.finality_discipline.order_chain_sync_status` **对象** **顶层键** **顺序**（机读锁 **`order_chain_sync_status_top_keys`** / **`order_chain_sync_status_top_keys_contract_725`**；**`order_chain_sync_status_top_keys`** **JSON** **数组** **与同名列** **同源**）。
pub(crate) const ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS: &[&str] = &[
    "method_path",
    "method_path_contract_717",
    "status_values",
    "status_values_contract_719",
    "absent_reason_values",
    "absent_reason_values_contract_720",
    "code",
    "code_contract_718",
    "event_log_snapshot_top_keys",
    "event_log_snapshot_keys_contract_722",
    "optional_event_log_snapshot",
    "optional_event_log_snapshot_absent_reason",
    "last_event_top_keys",
    "last_event_keys_contract_721",
    "checkpoint_top_keys",
    "checkpoint_keys_contract_723",
    "checkpoint_source_values",
    "checkpoint_source_values_contract_724",
    "optional_last_event",
    "success_body_order_id",
    "success_body_envelope_status",
    "chain_sync_required_top_keys",
    "minimal_body_requester",
    "minimal_body_chain_sync_status_unknown",
    "chain_sync_checkpoint",
    "chain_sync_finality_n",
    "chain_sync_checkpoint_source",
    "chain_sync_status_enum",
    "minimal_body_note_stable",
    "order_chain_sync_status_top_keys",
    "order_chain_sync_status_top_keys_contract_725",
    "rule",
];

pub(crate) fn format_order_chain_sync_status_meta_top_keys_contract_725() -> String {
    let mut s = String::from(
        "**725**：**`order_chain_sync_status_top_keys`** **与 **`orders::ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS`** **同源（顺序 ",
    );
    for (i, k) in ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS.iter().enumerate() {
        if i > 0 {
            s.push_str("****→**");
        }
        s.push_str("`");
        s.push_str(k);
        s.push_str("`");
    }
    s.push_str("）");
    s
}

#[derive(Debug, Deserialize)]
pub struct OrdersListQuery {
    pub limit: Option<u32>,
    pub cursor: Option<String>,
    /// B-071：与 `OrderState` 字符串一致（`draft`/`completed`/`cancelled`/`disputed` 等）；空或省略则不过滤
    pub state: Option<String>,
    /// **B-102 / TT-122**：可选 **`orders_chain_id`**（与 **`CHAIN_ID`/`ChainConfig.chain_id`** 同源 **u64**）；**`0` 或未传** 表示用 **默认业务链范围**（见响应 **`orders_chain_scope`**）。
    #[serde(default)]
    pub orders_chain_id: Option<u64>,
    /// W4 Workspace：按 **`business_line`** 过滤（`trip` · `merchant_service` · `acquisition`）。
    #[serde(default)]
    pub business_line: Option<String>,
    /// Guide Order Corridor：`guide` = 仅接待单（`order.guide_id` = 当前用户向导行 id）；`traveler` = 仅游客侧。
    #[serde(default)]
    pub hat: Option<String>,
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/orders", get(get_orders).post(order_create))
        .route("/api/v1/orders/:id", get(get_order_by_id))
        .route(CHAIN_SYNC_ROUTE_PATH, get(get_order_chain_sync_status))
        .route("/api/v1/orders/:id/itinerary", patch(patch_order_itinerary))
        .route("/api/v1/orders/:id/guide", patch(patch_order_guide))
        .route("/api/v1/orders/:id/trip-dates", patch(patch_order_trip_dates))
        .route("/api/v1/orders/:id/accept", post(order_accept))
        .route("/api/v1/orders/:id/cancel", post(order_cancel))
        .route("/api/v1/orders/:id/mock-pay", post(order_mock_pay))
        .route(
            "/api/v1/orders/:id/confirm-completion",
            post(order_confirm_completion),
        )
        .route(
            "/api/v1/orders/:id/confirm-service-completion",
            post(order_confirm_service_completion),
        )
        .route(
            "/api/v1/orders/:id/reviews",
            get(reviews_list).post(review_submit),
        )
        .route(
            "/api/v1/orders/:id/confirm-final-plan",
            post(confirm_final_plan),
        )
        .route(
            "/api/v1/orders/:id/confirm-bilateral",
            post(order_confirm_bilateral),
        )
        .route(
            "/api/v1/orders/:id/confirm-rating",
            post(order_confirm_rating),
        )
        .route(
            "/api/v1/orders/:id/set-escrow-address",
            post(set_order_escrow_address),
        )
}

pub async fn get_orders(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Query(q): Query<OrdersListQuery>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        match extract_user_with_session_check(&state, &headers).await {
            Some(uid) => {
                let page = match chain_off::parse_order_list_page(q.limit, q.cursor) {
                    Ok(p) => p,
                    Err(e) => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(json!({"error": e, "message": e})),
                        )
                            .into_response();
                    }
                };
                let state_filter = match q
                    .state
                    .as_deref()
                    .map(str::trim)
                    .filter(|s| !s.is_empty())
                {
                    None => None,
                    Some(raw) => match chain_off::str_to_order_state(raw) {
                        Some(s) => Some(s),
                        None => {
                            return (
                                StatusCode::BAD_REQUEST,
                                Json(json!({
                                    "error": "invalid_state",
                                    "message": "invalid_state",
                                    "hint": "state must be a known order state, e.g. completed, cancelled, disputed"
                                })),
                            )
                                .into_response();
                        }
                    },
                };
                let orders_list_chain_id = q
                    .orders_chain_id
                    .filter(|&u| u > 0)
                    .map(|u| (u.min(i64::MAX as u64)) as i64);
                let business_line_filter = match q
                    .business_line
                    .as_deref()
                    .map(str::trim)
                    .filter(|s| !s.is_empty())
                {
                    None => None,
                    Some(raw) => match chain_off::parse_orders_business_line_filter(Some(raw)) {
                        Some(line) => Some(line),
                        None => {
                            return (
                                StatusCode::BAD_REQUEST,
                                Json(json!({
                                    "error": "invalid_business_line",
                                    "message": "invalid_business_line",
                                    "hint": "business_line must be trip, merchant_service, or acquisition"
                                })),
                            )
                                .into_response();
                        }
                    },
                };
                let list_hat = match chain_off::parse_orders_list_hat(q.hat.as_deref()) {
                    Ok(h) => h,
                    Err(e) => {
                        return (
                            StatusCode::BAD_REQUEST,
                            Json(json!({
                                "error": e,
                                "message": e,
                                    "hint": "hat must be guide, merchant, or traveler"
                            })),
                        )
                            .into_response();
                    }
                };
                match chain_off::orders_list_impl(
                    co.clone(),
                    state.order_deadline_clock.as_ref(),
                    state.chain_config.as_ref(),
                    uid,
                    page,
                    state_filter,
                    business_line_filter,
                    orders_list_chain_id,
                    list_hat,
                )
                .await
                {
                    Ok(j) => j.into_response(),
                    Err((code, j)) => (code, j).into_response(),
                }
            }
            None => (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "login_required", "message": "login_required"})),
            )
                .into_response(),
        }
    } else {
        Json(json!({
            "status": "ok",
            "items": [],
            "rule": "唯一数据源=后端 API；前端不得自行推进订单状态。完整实现需接入链上事件投影与 finalityN 门禁"
        }))
        .into_response()
    }
}

pub async fn get_order_by_id(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
    headers: HeaderMap,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let uid = match extract_user_with_session_check(&state, &headers).await {
            Some(u) => u,
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "login_required", "message": "login_required"})),
                )
                    .into_response()
            }
        };
        let Ok(order_id) = Uuid::parse_str(&id) else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
            )
                .into_response();
        };
        return match chain_off::order_get_impl(
            co.clone(),
            state.order_deadline_clock.as_ref(),
            state.chain_config.as_ref(),
            order_id,
            uid,
        )
        .await
        {
            Ok(Json(mut body)) => {
                order_detail_chain_ssot::merge_escrow_chain_state_ssot_into_order_detail_if_ok(
                    &mut body,
                    state.chain_config.as_ref(),
                    order_id,
                )
                .await;
                order_detail_chain_ssot::merge_escrow_locked_amount_ssot_into_order_detail_if_ok(
                    &mut body,
                    state.chain_config.as_ref(),
                    order_id,
                )
                .await;
                Json(body).into_response()
            }
            Err((code, j)) => (code, j).into_response(),
        };
    }
    Json(json!({
        "status": "ok",
        "order": { "id": id, "status": "unknown" },
        "rule": "占位：订单终态必须来自链上事件/后端投影；degraded_mode 时应显示 pending_finality"
    }))
    .into_response()
}

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
    };

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
        };
        if order.tourist_id != uid && order.guide_id != uid {
            return (
                StatusCode::FORBIDDEN,
                Json(json!({"error": "forbidden", "message": "forbidden"})),
            )
                .into_response();
        }

        let sync_status = if order.escrow_address.is_some() {
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
    }

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
fn apply_chain_sync_event_log_fields(
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

pub async fn order_create(
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(body): Json<chain_off::CreateOrderBody>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let uid = match extract_user_with_session_check(&state, &headers).await {
            Some(u) => u,
            None => {
                return (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({"error": "login_required", "message": "login_required"})),
                )
                    .into_response()
            }
        };
        return match chain_off::order_create_impl(co.clone(), uid, Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json("POST /api/v1/orders").into_response()
}

#[cfg(test)]
mod tests;
