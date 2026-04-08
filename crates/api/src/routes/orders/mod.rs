//! /api/v1/orders（48 §2.2 routes/orders）

mod mutations;
mod reviews;

use axum::extract::{Path, Query, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, patch, post};
use axum::Json;
use axum::Router;
use digest::Digest;
use serde::Deserialize;
use serde_json::json;
use sha3::Keccak256;
use uuid::Uuid;

use crate::chain;
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

/// **`GET /api/v1/orders/:id`** 根级 **`escrow_chain_state*`**：与 **`internal::escrow_chain_status_label`** 同源字符串（**`chain::EscrowChainStatus`**）。
fn escrow_chain_status_label_order_detail_ssot(s: &chain::EscrowChainStatus) -> &'static str {
    match s {
        chain::EscrowChainStatus::None => "None",
        chain::EscrowChainStatus::Created => "Created",
        chain::EscrowChainStatus::Funded => "Funded",
        chain::EscrowChainStatus::Completed => "Completed",
        chain::EscrowChainStatus::Refunded => "Refunded",
        chain::EscrowChainStatus::Disputed => "Disputed",
        chain::EscrowChainStatus::Resolved => "Resolved",
        chain::EscrowChainStatus::PartiallyRefunded => "PartiallyRefunded",
        chain::EscrowChainStatus::Slashed => "Slashed",
    }
}

/// 与 **`internal::terminal_escrow_label_for_reconcile`** 同源：仅链上 **放款类终态** 返回标签（**`escrow_release_state*`**）；**`Funded`****/****`Disputed`** 等非终态返回 **`None`**。
fn escrow_release_terminal_label_order_detail_ssot(
    s: &chain::EscrowChainStatus,
) -> Option<&'static str> {
    match s {
        chain::EscrowChainStatus::Completed => Some("Completed"),
        chain::EscrowChainStatus::Refunded => Some("Refunded"),
        chain::EscrowChainStatus::Resolved => Some("Resolved"),
        chain::EscrowChainStatus::PartiallyRefunded => Some("PartiallyRefunded"),
        chain::EscrowChainStatus::Slashed => Some("Slashed"),
        _ => None,
    }
}

/// **TT-ESCROW-SSOT-DISPUTE-STATE-008**：链上 **争议生命周期**（**`Disputed` / `Resolved`**）时返回标签（**`escrow_dispute_state*`**）；**无争议** 返回 **`None`**。
fn escrow_dispute_lifecycle_label_order_detail_ssot(
    s: &chain::EscrowChainStatus,
) -> Option<&'static str> {
    match s {
        chain::EscrowChainStatus::Disputed => Some("Disputed"),
        chain::EscrowChainStatus::Resolved => Some("Resolved"),
        _ => None,
    }
}

/// 与 **`chain::get_escrow_status`** 内 **`escrowOf(bytes32)`** 同源（**`orders`** 内重复 **RPC**，避免改 **`chain/*`**）。
const ORDER_DETAIL_ESCROW_OF_SELECTOR: [u8; 4] = [0x87, 0x90, 0x6b, 0x1e];

fn order_detail_evm_fn_selector(sig: &str) -> [u8; 4] {
    let h = Keccak256::digest(sig.as_bytes());
    [h[0], h[1], h[2], h[3]]
}

async fn order_detail_jsonrpc_eth_call_hex(
    rpc_url: &str,
    to: &str,
    data: &str,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "method": "eth_call",
        "params": [{"to": to, "data": data}, "latest"],
        "id": 1
    });
    let res: serde_json::Value = client
        .post(rpc_url.trim())
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;
    res.get("result")
        .and_then(|r| r.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| {
            res.get("error")
                .and_then(|e| e.get("message").and_then(|m| m.as_str()))
                .unwrap_or("eth_call failed")
                .to_string()
        })
}

/// **`factory.escrowOf(orderId)`** → Escrow 合约地址；**零地址** 或 **未配置** → **`None`**。
async fn order_detail_read_escrow_address_hex(
    cfg: &chain::ChainConfig,
    order_id_bytes: [u8; 32],
) -> Result<Option<String>, String> {
    if !cfg.is_configured() {
        return Ok(None);
    }
    let factory = cfg
        .escrow_factory_address
        .as_ref()
        .ok_or_else(|| "ESCROW_FACTORY_ADDRESS not set".to_string())?
        .trim_start_matches("0x");
    let to = format!("0x{}", factory);
    let data = format!(
        "0x{}{}",
        hex::encode(ORDER_DETAIL_ESCROW_OF_SELECTOR),
        hex::encode(order_id_bytes)
    );
    let hex_result = order_detail_jsonrpc_eth_call_hex(&cfg.rpc_url, &to, &data).await?;
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Ok(None);
    }
    let escrow_addr = raw[12..32].to_vec();
    if escrow_addr.iter().all(|&b| b == 0) {
        return Ok(None);
    }
    Ok(Some(format!("0x{}", hex::encode(&escrow_addr))))
}

/// **`Escrow.token()`** → **ERC20** 合约地址（**`0x` + 40 hex**）。
async fn order_detail_read_escrow_token_address_hex(
    rpc_url: &str,
    escrow_hex: &str,
) -> Result<String, String> {
    let sel = order_detail_evm_fn_selector("token()");
    let data = format!("0x{}", hex::encode(sel));
    let hex_result = order_detail_jsonrpc_eth_call_hex(rpc_url, escrow_hex, &data).await?;
    let raw = hex::decode(hex_result.trim_start_matches("0x")).map_err(|e| e.to_string())?;
    if raw.len() < 32 {
        return Err("token() eth_call result too short".to_string());
    }
    let slot = &raw[raw.len() - 32..];
    let addr = &slot[12..32];
    Ok(format!("0x{}", hex::encode(addr)))
}

fn u256_norm_hex_is_non_zero(norm_hex: &str) -> bool {
    let s = norm_hex
        .strip_prefix("0x")
        .unwrap_or(norm_hex)
        .trim_start_matches('0');
    !s.is_empty()
}

/// **TT-ESCROW-SSOT-AMOUNT-011**：**`ERC20.balanceOf(escrow)`** 规范 **uint256 hex**（与 **`chain::balance_read::eth_call_erc20_balance_of_u256_hex`** 同源）；**仅** **`> 0`** 时写入根级三键；**`0`** / **RPC 失败** / **无 Escrow** → **不写入**（**不**用订单金额或 DB 推导）。
async fn merge_escrow_locked_amount_ssot_into_order_detail_if_ok(
    body: &mut serde_json::Value,
    chain_config: Option<&chain::ChainConfig>,
    order_id: Uuid,
) {
    let Some(cfg) = chain_config else {
        return;
    };
    let bytes = db::order_uuid_to_projection_order_id(order_id);
    let Ok(Some(escrow_hex)) = order_detail_read_escrow_address_hex(cfg, bytes).await else {
        return;
    };
    let Ok(token_hex) = order_detail_read_escrow_token_address_hex(&cfg.rpc_url, &escrow_hex).await
    else {
        return;
    };
    if token_hex.eq_ignore_ascii_case("0x0000000000000000000000000000000000000000") {
        return;
    }
    let Ok(bal_hex) = chain::balance_read::eth_call_erc20_balance_of_u256_hex(
        cfg.rpc_url.trim(),
        &token_hex,
        &escrow_hex,
    )
    .await
    else {
        return;
    };
    if !u256_norm_hex_is_non_zero(&bal_hex) {
        return;
    }
    let Some(m) = body.as_object_mut() else {
        return;
    };
    m.insert("escrow_locked_amount".to_string(), json!(bal_hex));
    m.insert(
        "escrow_locked_amount_data_source".to_string(),
        json!("chain_read"),
    );
    m.insert(
        "escrow_locked_amount_is_chain_ssot".to_string(),
        json!(true),
    );
}

/// 仅当 **`chain::get_escrow_status`** 返回 **`Ok(Some(_))`** 时写入根级三键；**`Ok(None)`** / **`Err`** / 未配置链 → **不写入**（**不**用 DB **`order.state`** fallback）。
async fn merge_escrow_chain_state_ssot_into_order_detail_if_ok(
    body: &mut serde_json::Value,
    chain_config: Option<&chain::ChainConfig>,
    order_id: Uuid,
) {
    let Some(cfg) = chain_config else {
        return;
    };
    let bytes = db::order_uuid_to_projection_order_id(order_id);
    let Ok(Some(st)) = chain::get_escrow_status(cfg, bytes).await else {
        return;
    };
    let label = escrow_chain_status_label_order_detail_ssot(&st);
    let Some(m) = body.as_object_mut() else {
        return;
    };
    m.insert("escrow_chain_state".to_string(), json!(label));
    m.insert(
        "escrow_chain_state_data_source".to_string(),
        json!("chain_read"),
    );
    m.insert(
        "escrow_chain_state_is_chain_ssot".to_string(),
        json!(true),
    );
    if let Some(rel) = escrow_release_terminal_label_order_detail_ssot(&st) {
        m.insert("escrow_release_state".to_string(), json!(rel));
        m.insert(
            "escrow_release_state_data_source".to_string(),
            json!("chain_read"),
        );
        m.insert(
            "escrow_release_state_is_chain_ssot".to_string(),
            json!(true),
        );
    }
    if let Some(d) = escrow_dispute_lifecycle_label_order_detail_ssot(&st) {
        m.insert("escrow_dispute_state".to_string(), json!(d));
        m.insert(
            "escrow_dispute_state_data_source".to_string(),
            json!("chain_read"),
        );
        m.insert(
            "escrow_dispute_state_is_chain_ssot".to_string(),
            json!(true),
        );
    }
}

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
                let orders_list_chain_id = q
                    .orders_chain_id
                    .filter(|&u| u > 0)
                    .map(|u| (u.min(i64::MAX as u64)) as i64);
                match chain_off::orders_list_impl(
                    co.clone(),
                    uid,
                    page,
                    state_filter,
                    orders_list_chain_id,
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
            state.chain_config.as_ref(),
            order_id,
            uid,
        )
        .await
        {
            Ok(Json(mut body)) => {
                merge_escrow_chain_state_ssot_into_order_detail_if_ok(
                    &mut body,
                    state.chain_config.as_ref(),
                    order_id,
                )
                .await;
                merge_escrow_locked_amount_ssot_into_order_detail_if_ok(
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
    use axum::http::{header::AUTHORIZATION, HeaderMap, HeaderValue};
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

    /// **TT-ESCROW-SSOT-ORDER-STATE-AGGREGATE-EXCLUDE-002**：订单列表/占位等**信封**根级**不得**混入 **`GET /api/v1/orders/:id`** 专属的 **`escrow_chain_state*`** / **`escrow_release_state*`** / **`escrow_dispute_state*`** / **`escrow_locked_amount*`** 链上主读键。
    fn assert_orders_envelope_has_no_escrow_chain_state_ssot_root_keys(v: &serde_json::Value) {
        assert!(
            v.get("escrow_chain_state").is_none(),
            "orders envelope must not include root escrow_chain_state"
        );
        assert!(
            v.get("escrow_chain_state_data_source").is_none(),
            "orders envelope must not include root escrow_chain_state_data_source"
        );
        assert!(
            v.get("escrow_chain_state_is_chain_ssot").is_none(),
            "orders envelope must not include root escrow_chain_state_is_chain_ssot"
        );
        assert!(
            v.get("escrow_release_state").is_none(),
            "orders envelope must not include root escrow_release_state"
        );
        assert!(
            v.get("escrow_release_state_data_source").is_none(),
            "orders envelope must not include root escrow_release_state_data_source"
        );
        assert!(
            v.get("escrow_release_state_is_chain_ssot").is_none(),
            "orders envelope must not include root escrow_release_state_is_chain_ssot"
        );
        assert!(
            v.get("escrow_dispute_state").is_none(),
            "orders envelope must not include root escrow_dispute_state"
        );
        assert!(
            v.get("escrow_dispute_state_data_source").is_none(),
            "orders envelope must not include root escrow_dispute_state_data_source"
        );
        assert!(
            v.get("escrow_dispute_state_is_chain_ssot").is_none(),
            "orders envelope must not include root escrow_dispute_state_is_chain_ssot"
        );
        assert!(
            v.get("escrow_locked_amount").is_none(),
            "orders envelope must not include root escrow_locked_amount"
        );
        assert!(
            v.get("escrow_locked_amount_data_source").is_none(),
            "orders envelope must not include root escrow_locked_amount_data_source"
        );
        assert!(
            v.get("escrow_locked_amount_is_chain_ssot").is_none(),
            "orders envelope must not include root escrow_locked_amount_is_chain_ssot"
        );
    }

    #[tokio::test]
    async fn orders_list_placeholder_has_no_escrow_chain_ssot_root_keys_tt_escrow_aggregate_exclude_002(
    ) {
        let resp = get_orders(
            State(build_state()),
            HeaderMap::new(),
            Query(OrdersListQuery {
                limit: None,
                cursor: None,
                state: None,
                orders_chain_id: None,
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_orders_envelope_has_no_escrow_chain_state_ssot_root_keys(&v);
    }

    /// **TT-B102-GET-ORDERS-CHAIN-SCOPE-EQUALS-DB-SSOT-001**：**`GET /api/v1/orders?orders_chain_id=`** 的 **`orders_chain_scope`** 与 **`db::orders::orders_list_chain_scope_json`** 一致；可见行与 **`orders_row_matches_list_chain_scope`** 一致（与 **`orders_chain_id_backfill_dry_run.orders_list_chain_scope`** 同源）。
    #[tokio::test]
    async fn b102_get_orders_chain_scope_matches_db_ssot_and_filters_rows() {
        use crate::chain_off::{
            ChainOffConfig, ChainOffState, ChainOffStore, GuideRow, OrderRow,
        };
        use crate::db::{orders_list_chain_scope_json, orders_row_matches_list_chain_scope};
        use traveltrust_core::OrderState;

        let tid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let now = Utc::now();

        let mut store = ChainOffStore::default();
        store.sessions.insert(format!("bearer_{}", tid), tid);
        store.guides.insert(
            gid,
            GuideRow {
                id: gid,
                user_id: Uuid::new_v4(),
                city: "".to_string(),
                country_code: "US".to_string(),
                languages: vec![],
                service_types: vec![],
                bio: None,
                wallet_address: None,
                real_name: None,
                passport_number_hash: None,
                id_photo_url: None,
                language_cert_url: None,
                guide_license_url: None,
                stake_amount: "0".to_string(),
                status: "active".to_string(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: now,
                updated_at: now,
            },
        );

        let mk = |cid: Option<i64>| OrderRow {
            id: Uuid::new_v4(),
            tourist_id: tid,
            guide_id: gid,
            amount: "1".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            state: OrderState::Created,
            created_at: now,
            accepted_at: None,
            escrowed_at: None,
            completed_at: None,
            dispute_deadline_at: None,
            auto_complete_at: None,
            updated_at: now,
            start_date: None,
            end_date: None,
            sub_status: None,
            tourist_confirmed: None,
            guide_confirmed: None,
            rating_tourist_confirmed: None,
            rating_guide_confirmed: None,
            chain_id: cid,
        };
        let o_null = mk(None);
        let o137 = mk(Some(137));
        let o1 = mk(Some(1));
        store.orders.insert(o_null.id, o_null.clone());
        store.orders.insert(o137.id, o137.clone());
        store.orders.insert(o1.id, o1.clone());

        let mut cfg = ChainOffConfig::default();
        cfg.business_chain_id = Some(137);

        let mut state = build_state();
        state.chain_off = Some(ChainOffState {
            store: Arc::new(RwLock::new(store)),
            config: cfg,
            db_pool: None,
        });

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer bearer_{}", tid)).expect("auth"),
        );

        let expected_scope = orders_list_chain_scope_json(Some(137), Some(137));
        let resp = get_orders(
            State(state),
            headers,
            Query(OrdersListQuery {
                limit: None,
                cursor: None,
                state: None,
                orders_chain_id: Some(137),
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["orders_chain_scope"], expected_scope);

        let ids: std::collections::HashSet<String> = v["items"]
            .as_array()
            .unwrap()
            .iter()
            .filter_map(|x| x["id"].as_str().map(|s| s.to_string()))
            .collect();
        assert!(ids.contains(&o_null.id.to_string()));
        assert!(ids.contains(&o137.id.to_string()));
        assert!(!ids.contains(&o1.id.to_string()));

        assert!(orders_row_matches_list_chain_scope(
            o_null.chain_id,
            Some(137),
            Some(137)
        ));
        assert!(orders_row_matches_list_chain_scope(
            o137.chain_id,
            Some(137),
            Some(137)
        ));
        assert!(!orders_row_matches_list_chain_scope(
            o1.chain_id,
            Some(137),
            Some(137)
        ));
    }

    /// **TT-B122-GET-ORDERS-STRICT-CHAIN-SCOPE-EQUALS-BACKFILL-DRY-RUN-001**：**`GET /api/v1/orders?orders_chain_id=1`**（**`default_business_chain_id=137`**）之 **`orders_chain_scope`** 与 **`orders_chain_id_backfill_dry_run.orders_list_chain_scope`** 所用 **`orders_list_chain_scope_json(Some(137), Some(1))`** **同值**；列表仅 **`chain_id==1`**。
    #[tokio::test]
    async fn tt_b122_get_orders_strict_chain_scope_matches_backfill_dry_run_embed() {
        use crate::chain_off::{
            ChainOffConfig, ChainOffState, ChainOffStore, GuideRow, OrderRow,
        };
        use crate::db::orders_list_chain_scope_json;
        use traveltrust_core::OrderState;

        let tid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let now = Utc::now();

        let mut store = ChainOffStore::default();
        store.sessions.insert(format!("bearer_{}", tid), tid);
        store.guides.insert(
            gid,
            GuideRow {
                id: gid,
                user_id: Uuid::new_v4(),
                city: "".to_string(),
                country_code: "US".to_string(),
                languages: vec![],
                service_types: vec![],
                bio: None,
                wallet_address: None,
                real_name: None,
                passport_number_hash: None,
                id_photo_url: None,
                language_cert_url: None,
                guide_license_url: None,
                stake_amount: "0".to_string(),
                status: "active".to_string(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: now,
                updated_at: now,
            },
        );

        let mk = |cid: Option<i64>| OrderRow {
            id: Uuid::new_v4(),
            tourist_id: tid,
            guide_id: gid,
            amount: "1".to_string(),
            currency: "USD".to_string(),
            escrow_address: None,
            state: OrderState::Created,
            created_at: now,
            accepted_at: None,
            escrowed_at: None,
            completed_at: None,
            dispute_deadline_at: None,
            auto_complete_at: None,
            updated_at: now,
            start_date: None,
            end_date: None,
            sub_status: None,
            tourist_confirmed: None,
            guide_confirmed: None,
            rating_tourist_confirmed: None,
            rating_guide_confirmed: None,
            chain_id: cid,
        };
        let o_null = mk(None);
        let o137 = mk(Some(137));
        let o1 = mk(Some(1));
        store.orders.insert(o_null.id, o_null.clone());
        store.orders.insert(o137.id, o137.clone());
        store.orders.insert(o1.id, o1.clone());

        let mut cfg = ChainOffConfig::default();
        cfg.business_chain_id = Some(137);

        let mut state = build_state();
        state.chain_off = Some(ChainOffState {
            store: Arc::new(RwLock::new(store)),
            config: cfg,
            db_pool: None,
        });

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer bearer_{}", tid)).expect("auth"),
        );

        let backfill_dry_run_embed = orders_list_chain_scope_json(Some(137), Some(1));
        let resp = get_orders(
            State(state),
            headers,
            Query(OrdersListQuery {
                limit: None,
                cursor: None,
                state: None,
                orders_chain_id: Some(1),
            }),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["orders_chain_scope"], backfill_dry_run_embed);
        assert_eq!(v["orders_chain_scope"]["filter"], "strict_chain_id");

        let ids: std::collections::HashSet<String> = v["items"]
            .as_array()
            .unwrap()
            .iter()
            .filter_map(|x| x["id"].as_str().map(|s| s.to_string()))
            .collect();
        assert!(!ids.contains(&o_null.id.to_string()));
        assert!(!ids.contains(&o137.id.to_string()));
        assert!(ids.contains(&o1.id.to_string()));
    }

    #[tokio::test]
    async fn order_get_placeholder_has_no_escrow_chain_ssot_root_keys_tt_escrow_aggregate_exclude_002(
    ) {
        let resp = get_order_by_id(
            State(build_state()),
            Path(Uuid::new_v4().to_string()),
            HeaderMap::new(),
        )
        .await
        .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_orders_envelope_has_no_escrow_chain_state_ssot_root_keys(&v);
    }

    /// **TT-B097-GET-ORDER-BY-ID-PROJECTION-TERMINAL-PATH-001**：**`GET /api/v1/orders/:id`** → **`order_get_impl`** → **`apply_orders_projection_fields_to_order_json`**；**`order`** 上必有 **`projection_terminal`**（无 DB 池时为 **null**）；终态 **`display_status`** 与业务 **`status`** 一致。
    #[tokio::test]
    async fn b097_get_order_by_id_order_object_has_projection_terminal_key() {
        use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore, OrderRow};
        use traveltrust_core::OrderState;

        let tid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let oid = Uuid::new_v4();
        let now = Utc::now();
        let mut store = ChainOffStore::default();
        store.sessions.insert(format!("bearer_{}", tid), tid);
        store.orders.insert(
            oid,
            OrderRow {
                id: oid,
                tourist_id: tid,
                guide_id: gid,
                amount: "1".to_string(),
                currency: "USD".to_string(),
                escrow_address: None,
                state: OrderState::Completed,
                created_at: now,
                accepted_at: None,
                escrowed_at: None,
                completed_at: Some(now),
                dispute_deadline_at: None,
                auto_complete_at: None,
                updated_at: now,
                start_date: None,
                end_date: None,
                sub_status: None,
                tourist_confirmed: None,
                guide_confirmed: None,
                rating_tourist_confirmed: None,
                rating_guide_confirmed: None,
                chain_id: None,
            },
        );

        let mut state = build_state();
        state.chain_off = Some(ChainOffState {
            store: Arc::new(RwLock::new(store)),
            config: ChainOffConfig::default(),
            db_pool: None,
        });

        let mut headers = HeaderMap::new();
        headers.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer bearer_{}", tid)).expect("auth header"),
        );

        let resp = get_order_by_id(State(state), Path(oid.to_string()), headers)
            .await
            .into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let body = resp.into_body().collect().await.unwrap().to_bytes();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        let order = v.get("order").expect("order envelope");
        assert!(
            order.get("projection_terminal").is_some(),
            "order must include projection_terminal (null when no db row)"
        );
        assert!(order["projection_terminal"].is_null());
        assert_eq!(order["display_status"].as_str(), Some("completed"));
        assert_eq!(order["status"].as_str(), Some("completed"));
    }

    /// **TT-B095-GET-ORDER-SPLIT-META-CONTRACTS-001**：同一 **`ApiMetaState.chain_config`** 下，**`GET /api/v1/orders/:id`** 的 **`order.split_addresses_ssot`**（生产 **`order_split_addresses_ssot`**）与 **`GET /meta`** **`chain.contracts.escrow_platform_fee_recipient`** 字段值一致。
    #[tokio::test]
    async fn b095_get_order_by_id_split_addresses_ssot_matches_get_meta_chain_contracts() {
        use crate::chain;
        use crate::routes::api_router;
        use crate::chain_off::{
            ChainOffConfig, ChainOffState, ChainOffStore, GuideRow, OrderRow,
        };
        use axum::body::Body;
        use axum::http::Request;
        use tower::util::ServiceExt;
        use traveltrust_core::OrderState;

        let tid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let oid = Uuid::new_v4();
        let now = Utc::now();

        let mut store = ChainOffStore::default();
        store.sessions.insert(format!("bearer_{}", tid), tid);
        store.guides.insert(
            gid,
            GuideRow {
                id: gid,
                user_id: Uuid::new_v4(),
                city: "杭州市".to_string(),
                country_code: "CN".to_string(),
                languages: vec![],
                service_types: vec![],
                bio: None,
                wallet_address: Some("0x3333333333333333333333333333333333333333".to_string()),
                real_name: None,
                passport_number_hash: None,
                id_photo_url: None,
                language_cert_url: None,
                guide_license_url: None,
                stake_amount: "0".to_string(),
                status: "active".to_string(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: now,
                updated_at: now,
            },
        );
        store.orders.insert(
            oid,
            OrderRow {
                id: oid,
                tourist_id: tid,
                guide_id: gid,
                amount: "100".to_string(),
                currency: "USD".to_string(),
                escrow_address: None,
                state: OrderState::Created,
                created_at: now,
                accepted_at: None,
                escrowed_at: None,
                completed_at: None,
                dispute_deadline_at: None,
                auto_complete_at: None,
                updated_at: now,
                start_date: None,
                end_date: None,
                sub_status: None,
                tourist_confirmed: None,
                guide_confirmed: None,
                rating_tourist_confirmed: None,
                rating_guide_confirmed: None,
                chain_id: None,
            },
        );

        let chain_cfg = chain::ChainConfig {
            rpc_url: "http://x".to_string(),
            chain_id: 137,
            escrow_factory_address: None,
            fee_router_address: Some(" 0x1111111111111111111111111111111111111111 ".to_string()),
            region_vault_address: Some("0x2222222222222222222222222222222222222222".to_string()),
            investor_share_token_addresses: vec![],
            staking_address: None,
            investor_lock_contract_addresses: vec![],
            governor_address: None,
            governance_votes_token_address: None,
            registry_address: Some("0x4444444444444444444444444444444444444444".to_string()),
            executor_max_amount_per_tx: None,
            executor_max_amount_per_day: None,
            executor_retry_count: 3,
        };

        let mut state = build_state();
        state.chain_config = Some(chain_cfg);
        state.chain_off = Some(ChainOffState {
            store: Arc::new(RwLock::new(store)),
            config: ChainOffConfig::default(),
            db_pool: None,
        });

        let app = api_router().with_state(state);

        let meta_res = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/meta")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(meta_res.status(), StatusCode::OK);
        let meta_body = meta_res.into_body().collect().await.unwrap().to_bytes();
        let meta_v: serde_json::Value = serde_json::from_slice(&meta_body).unwrap();
        let meta_recipient = &meta_v["chain"]["contracts"]["escrow_platform_fee_recipient"];

        let order_res = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/api/v1/orders/{}", oid))
                    .header(
                        AUTHORIZATION,
                        format!("Bearer bearer_{}", tid),
                    )
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(order_res.status(), StatusCode::OK);
        let order_body = order_res.into_body().collect().await.unwrap().to_bytes();
        let order_v: serde_json::Value = serde_json::from_slice(&order_body).unwrap();
        let split = order_v["order"]
            .get("split_addresses_ssot")
            .expect("split_addresses_ssot present");
        assert!(split.is_object());
        assert_eq!(&split["platform_fee_recipient"], meta_recipient);
    }

    /// **TT-B083-FEE-ROUTE-COUNTRY-ORDER-META-SSOT-001**：**`GET /api/v1/orders/:id`** 的 **`order.fee_route_country`** 与 **`order_detail_envelope`** / **`resolve_fee_route_country_from_zh_destination`** 同源；**`GET /meta`** **`orders.fee_route_country_ssot`** 与订单字段 **`ssot_field`**（**`FEE_ROUTE_COUNTRY_SSOT_FIELD`**）及 routed/reject 语义一致；未映射国家显式 **reject**。
    #[tokio::test]
    async fn b083_get_order_fee_route_country_aligns_meta_orders_ssot_mapped_and_reject() {
        use crate::chain_off::{
            AmountBreakdown, ChainOffConfig, ChainOffState, ChainOffStore, GuideRow,
            ItineraryBundle, ItineraryDayRow, OrderRow,
        };
        use crate::routes::api_router;
        use axum::body::Body;
        use axum::http::Request;
        use tower::util::ServiceExt;
        use traveltrust_core::fee_route_country::{
            resolve_fee_route_country_from_zh_destination, FeeRouteCountryResolve,
        };
        use traveltrust_core::{FEE_ROUTE_COUNTRY_SSOT_FIELD, OrderState};

        let tid = Uuid::new_v4();
        let gid = Uuid::new_v4();
        let oid_mapped = Uuid::new_v4();
        let oid_reject = Uuid::new_v4();
        let now = Utc::now();

        fn bundle_for(order_id: Uuid, destination: &str) -> ItineraryBundle {
            ItineraryBundle {
                order_id,
                version: 1,
                destination: destination.to_string(),
                city: "测试市".to_string(),
                days: vec![ItineraryDayRow {
                    day_index: 1,
                    content_text: "t".to_string(),
                    ..Default::default()
                }],
                amount_breakdown: AmountBreakdown {
                    hotel: 0.0,
                    catering: 0.0,
                    tickets: 0.0,
                    guide_fee: 0.0,
                    vehicle: 0.0,
                    platform_fee: 0.0,
                    total_budget: 0.0,
                },
                snapshot_hash: None,
                cover_image: None,
            }
        }

        let mut store = ChainOffStore::default();
        store.sessions.insert(format!("bearer_{}", tid), tid);
        store.guides.insert(
            gid,
            GuideRow {
                id: gid,
                user_id: Uuid::new_v4(),
                city: "杭州市".to_string(),
                country_code: "CN".to_string(),
                languages: vec![],
                service_types: vec![],
                bio: None,
                wallet_address: Some("0x3333333333333333333333333333333333333333".to_string()),
                real_name: None,
                passport_number_hash: None,
                id_photo_url: None,
                language_cert_url: None,
                guide_license_url: None,
                stake_amount: "0".to_string(),
                status: "active".to_string(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: now,
                updated_at: now,
            },
        );
        for (oid, dest) in [(oid_mapped, "中国"), (oid_reject, "意大利")] {
            store.itineraries.insert(oid, bundle_for(oid, dest));
            store.orders.insert(
                oid,
                OrderRow {
                    id: oid,
                    tourist_id: tid,
                    guide_id: gid,
                    amount: "100".to_string(),
                    currency: "USD".to_string(),
                    escrow_address: None,
                    state: OrderState::Created,
                    created_at: now,
                    accepted_at: None,
                    escrowed_at: None,
                    completed_at: None,
                    dispute_deadline_at: None,
                    auto_complete_at: None,
                    updated_at: now,
                    start_date: None,
                    end_date: None,
                    sub_status: None,
                    tourist_confirmed: None,
                    guide_confirmed: None,
                    rating_tourist_confirmed: None,
                    rating_guide_confirmed: None,
                    chain_id: None,
                },
            );
        }

        let mut state = build_state();
        state.chain_off = Some(ChainOffState {
            store: Arc::new(RwLock::new(store)),
            config: ChainOffConfig::default(),
            db_pool: None,
        });

        let app = api_router().with_state(state);

        let meta_res = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/meta")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(meta_res.status(), StatusCode::OK);
        let meta_body = meta_res.into_body().collect().await.unwrap().to_bytes();
        let meta_v: serde_json::Value = serde_json::from_slice(&meta_body).unwrap();
        let ssot_doc = meta_v["orders"]["fee_route_country_ssot"]
            .as_str()
            .expect("orders.fee_route_country_ssot");
        assert!(
            ssot_doc.contains(FEE_ROUTE_COUNTRY_SSOT_FIELD),
            "meta should name SSOT field {FEE_ROUTE_COUNTRY_SSOT_FIELD}: {ssot_doc}"
        );
        assert!(
            ssot_doc.contains("iso3166_alpha2") && ssot_doc.contains("bucket_route_key"),
            "meta should document routed shape: {ssot_doc}"
        );
        assert!(
            ssot_doc.contains("reject") && ssot_doc.contains("unmapped"),
            "meta should document explicit reject for unmapped: {ssot_doc}"
        );

        let expect_mapped = resolve_fee_route_country_from_zh_destination("中国");
        let FeeRouteCountryResolve::Routed {
            iso3166_alpha2,
            bucket_route_key,
        } = expect_mapped
        else {
            panic!("expected 中国 → Routed");
        };

        let order_res = app
            .clone()
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/api/v1/orders/{}", oid_mapped))
                    .header(AUTHORIZATION, format!("Bearer bearer_{}", tid))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(order_res.status(), StatusCode::OK);
        let ob = order_res.into_body().collect().await.unwrap().to_bytes();
        let ov: serde_json::Value = serde_json::from_slice(&ob).unwrap();
        let fr = &ov["order"]["fee_route_country"];
        assert_eq!(fr["ssot_field"].as_str(), Some(FEE_ROUTE_COUNTRY_SSOT_FIELD));
        assert_eq!(fr["name_zh"].as_str(), Some("中国"));
        assert_eq!(fr["iso3166_alpha2"].as_str(), Some(iso3166_alpha2));
        assert_eq!(
            fr["bucket_route_key"].as_str(),
            Some(bucket_route_key.as_str())
        );
        assert!(fr.get("reject").is_none());

        let reject_res = app
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(format!("/api/v1/orders/{}", oid_reject))
                    .header(AUTHORIZATION, format!("Bearer bearer_{}", tid))
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(reject_res.status(), StatusCode::OK);
        let rb = reject_res.into_body().collect().await.unwrap().to_bytes();
        let rv: serde_json::Value = serde_json::from_slice(&rb).unwrap();
        let frj = &rv["order"]["fee_route_country"];
        assert_eq!(frj["ssot_field"].as_str(), Some(FEE_ROUTE_COUNTRY_SSOT_FIELD));
        assert_eq!(frj["name_zh"].as_str(), Some("意大利"));
        assert_eq!(frj["reject"], true);
        assert_eq!(
            frj["code"].as_str(),
            Some("fee_route_unmapped_destination")
        );
        assert!(
            frj["message"]
                .as_str()
                .unwrap_or("")
                .contains("explicit reject"),
            "message={:?}",
            frj["message"]
        );
    }
}
