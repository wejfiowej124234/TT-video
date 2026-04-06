//! /api/v1/orders（48 §2.2 routes/orders）

mod mutations;
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

use crate::chain_off;
use crate::db;
use crate::state::{extract_user_with_session_check, ApiMetaState};

use super::not_impl_json;
use mutations::{
    confirm_final_plan, order_accept, order_cancel, order_confirm_bilateral,
    order_confirm_completion, order_confirm_rating, order_mock_pay, patch_order_itinerary,
    set_order_escrow_address,
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
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/api/v1/orders", get(get_orders).post(order_create))
        .route("/api/v1/orders/:id", get(get_order_by_id))
        .route(CHAIN_SYNC_ROUTE_PATH, get(get_order_chain_sync_status))
        .route("/api/v1/orders/:id/itinerary", patch(patch_order_itinerary))
        .route("/api/v1/orders/:id/accept", post(order_accept))
        .route("/api/v1/orders/:id/cancel", post(order_cancel))
        .route("/api/v1/orders/:id/mock-pay", post(order_mock_pay))
        .route(
            "/api/v1/orders/:id/confirm-completion",
            post(order_confirm_completion),
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
                match chain_off::orders_list_impl(co.clone(), uid, page, state_filter).await {
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
            state.chain_config.as_ref(),
            order_id,
            uid,
        )
        .await
        {
            Ok(j) => j.into_response(),
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
mod apply_event_log_fields_tests {
    use super::apply_chain_sync_event_log_fields;
    use serde_json::json;

    #[test]
    fn prefers_snapshot_and_omits_absent_reason() {
        let mut m = serde_json::Map::new();
        apply_chain_sync_event_log_fields(
            &mut m,
            Some(json!({"finality_n_used": 12})),
            Some("no_row"),
        );
        assert!(m.contains_key("event_log_snapshot"));
        assert!(!m.contains_key("event_log_snapshot_absent_reason"));
    }

    #[test]
    fn writes_absent_reason_when_no_snapshot() {
        let mut m = serde_json::Map::new();
        apply_chain_sync_event_log_fields(&mut m, None, Some("read_failed"));
        assert_eq!(
            m.get("event_log_snapshot_absent_reason"),
            Some(&json!("read_failed"))
        );
        assert!(!m.contains_key("event_log_snapshot"));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::state::{ApiMetaState, EvidenceTimeState, ProjectorCheckpoint};
    use axum::http::{header::AUTHORIZATION, HeaderValue};
    use chrono::Utc;
    use http_body_util::BodyExt;
    use std::collections::HashMap;
    use std::sync::Arc;
    use tokio::sync::RwLock;

    fn build_state() -> ApiMetaState {
        ApiMetaState {
            strict_ssot: false,
            ssot_version: "test".to_string(),
            ssot_sha256_expected: None,
            ssot_sha256_computed: None,
            ssot_sha256_match: true,
            chargeback_policy: "warn".to_string(),
            finality_n: 12,
            indexer_state_path: "test".to_string(),
            indexer_checkpoint: ProjectorCheckpoint {
                block_number: 10,
                log_index: 1,
            },
            indexer_last_seen_finality_n: 12,
            indexer_replay_required: false,
            pause_mode: false,
            pause_api_allowlist: "".to_string(),
            degraded_mode: false,
            authority_source: "db_projection".to_string(),
            indexer_lag_blocks: 0,
            indexer_lag_max_blocks: 0,
            reorg_detected: false,
            evidence_timestamp_policy: "backend_signed".to_string(),
            evidence_time_state: Arc::new(RwLock::new(EvidenceTimeState {
                last_seen_utc_rfc3339: Utc::now().to_rfc3339(),
            })),
            evidence_time_state_path: "test".to_string(),
            evidence_receipt_hmac_key: None,
            reconcile_export_ed25519_key: None,
            chain_off: None,
            chain_config: None,
            resolution_outbox: None,
            indexer_state: None,
            guide_upload_rate: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    #[tokio::test]
    async fn chain_sync_status_requires_login() {
        let resp = get_order_chain_sync_status(
            State(build_state()),
            Path(Uuid::new_v4().to_string()),
            HeaderMap::new(),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn chain_sync_status_returns_min_snapshot_when_authenticated() {
        let mut headers = HeaderMap::new();
        let uid = Uuid::new_v4();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer bearer_{}", uid)).expect("valid auth"),
        );

        let resp = get_order_chain_sync_status(
            State(build_state()),
            Path(Uuid::new_v4().to_string()),
            headers,
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["chain_sync"]["checkpoint"]["source"], "startup_snapshot");
        assert_eq!(v["chain_sync"]["checkpoint"]["block_number"], 10);
        assert_eq!(v["chain_sync"]["checkpoint"]["log_index"], 1);
        assert_eq!(v["note"].as_str().unwrap(), CHAIN_SYNC_MINIMAL_BODY_NOTE);
        assert_eq!(
            v["status"].as_str().unwrap(),
            CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS
        );
        let cs = v["chain_sync"].as_object().expect("chain_sync object");
        for key in CHAIN_SYNC_REQUIRED_TOP_KEYS {
            assert!(
                cs.contains_key(*key),
                "716: chain_sync must include top key {key:?}"
            );
        }
        assert!(
            v["chain_sync"]["last_event"].is_null(),
            "716: non-chain_off minimal body last_event must be JSON null"
        );
    }

    #[test]
    fn chain_sync_method_path_aligns_with_route_path_717() {
        assert_eq!(
            format!("GET {}", CHAIN_SYNC_ROUTE_PATH),
            CHAIN_SYNC_STATUS_METHOD_AND_PATH
        );
    }

    #[test]
    fn chain_sync_handler_code_embeds_mod_path_and_symbol_718() {
        let s = CHAIN_SYNC_STATUS_HANDLER_CODE;
        assert!(
            s.contains("orders/mod.rs"),
            "718: handler code anchor should name mod path: {s}"
        );
        assert!(
            s.contains("get_order_chain_sync_status"),
            "718: handler code anchor should name handler symbol: {s}"
        );
    }

    #[test]
    fn chain_sync_status_values_order_and_literals_719() {
        assert_eq!(
            CHAIN_SYNC_STATUS_VALUES,
            &["pending", "confirmed", "unknown"][..]
        );
    }

    #[test]
    fn event_log_snapshot_absent_reasons_order_and_literals_720() {
        assert_eq!(
            CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS,
            &[
                "no_database",
                "no_chain_context",
                "no_row",
                "read_failed",
                "projection_backend_unavailable"
            ][..]
        );
    }

    #[test]
    fn chain_sync_last_event_top_keys_order_and_literals_721() {
        assert_eq!(
            CHAIN_SYNC_LAST_EVENT_TOP_KEYS,
            &["state", "updated_at", "escrow_address"][..]
        );
    }

    #[test]
    fn chain_sync_checkpoint_top_keys_order_and_literals_723() {
        assert_eq!(
            CHAIN_SYNC_CHECKPOINT_TOP_KEYS,
            &["block_number", "log_index", "source"][..]
        );
        let v = serde_json::json!({
            "block_number": 40_i64,
            "log_index": 2_i64,
            "source": "runtime"
        });
        let keys: Vec<&str> = v
            .as_object()
            .expect("checkpoint object")
            .keys()
            .map(|s| s.as_str())
            .collect();
        assert_eq!(keys, CHAIN_SYNC_CHECKPOINT_TOP_KEYS);
    }

    #[test]
    fn chain_sync_checkpoint_source_values_order_and_literals_724() {
        assert_eq!(
            CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES,
            &["runtime", "startup_snapshot"][..]
        );
    }

    #[test]
    fn order_chain_sync_status_meta_top_keys_order_and_literals_725() {
        assert_eq!(ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS.len(), 32);
        assert_eq!(
            ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS[29],
            "order_chain_sync_status_top_keys"
        );
        assert_eq!(
            ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS[30],
            "order_chain_sync_status_top_keys_contract_725"
        );
        assert_eq!(ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS[31], "rule");
        let contract = format_order_chain_sync_status_meta_top_keys_contract_725();
        assert!(
            contract.contains("725"),
            "contract should mention 725: {contract}"
        );
        for k in ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS {
            assert!(
                contract.contains(k),
                "contract should embed key {k:?}: {contract}"
            );
        }
    }
}
