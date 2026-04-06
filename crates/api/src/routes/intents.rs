//! 签名 Intent 路由：仅落 outbox，链上执行由执行器完成（04 扩展、48 从 main 迁出）

use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::response::IntoResponse;
use axum::routing::post;
use axum::Json;
use axum::Router;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::HashSet;
use std::env;

use crate::state::ApiMetaState;
use traveltrust_core::OutboxItem;

#[derive(Debug, Deserialize, Serialize)]
struct SignedIntent {
    chain_id: u64,
    verifying_contract: String,
    signer: String,
    signature: String,
    typed_data: serde_json::Value,
    #[serde(default)]
    intent_nonce: Option<String>,
    #[serde(default)]
    intent_ts_ms: Option<i64>,
}

fn env_chain_id() -> Option<u64> {
    env::var("CHAIN_ID").ok().and_then(|v| v.parse().ok())
}

fn normalize_addr(s: &str) -> String {
    s.trim().to_ascii_lowercase()
}

fn parse_addr_set(raw: &str) -> HashSet<String> {
    raw.split(|c: char| c == ',' || c == ';' || c == '\n' || c == '\t' || c == ' ')
        .filter_map(|s| {
            let t = s.trim();
            if t.is_empty() {
                None
            } else {
                Some(normalize_addr(t))
            }
        })
        .collect()
}

fn validate_intent_policy(intent: &SignedIntent, strict_ssot: bool) -> Result<(), String> {
    let allow_raw = env::var("VERIFYING_CONTRACT_ALLOWLIST").ok();
    let allow = allow_raw
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(parse_addr_set);
    if strict_ssot && allow.is_none() {
        return Err(
            "missing VERIFYING_CONTRACT_ALLOWLIST in strict mode (must be non-bypassable)"
                .to_string(),
        );
    }
    if let Some(set) = allow {
        let vc = normalize_addr(&intent.verifying_contract);
        if !set.contains(&vc) {
            return Err("verifying_contract not allowlisted".to_string());
        }
    }
    let deny_raw = env::var("SIGNER_BLACKLIST").ok();
    if let Some(raw) = deny_raw.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        let deny = parse_addr_set(raw);
        let signer = normalize_addr(&intent.signer);
        if deny.contains(&signer) {
            return Err("signer blacklisted".to_string());
        }
    }
    Ok(())
}

fn validate_intent_shape(intent: &SignedIntent) -> Result<(), String> {
    if intent.verifying_contract.trim().is_empty() {
        return Err("verifying_contract empty".to_string());
    }
    if intent.signer.trim().is_empty() {
        return Err("signer empty".to_string());
    }
    if intent.signature.trim().is_empty() {
        return Err("signature empty".to_string());
    }
    if intent.typed_data.is_null() {
        return Err("typed_data null".to_string());
    }
    if let Some(expected) = env_chain_id() {
        if intent.chain_id != expected {
            return Err(format!(
                "chain_id mismatch: expected={} got={}",
                expected, intent.chain_id
            ));
        }
    }
    Ok(())
}

fn outbox_dir() -> String {
    env::var("OUTBOX_DIR").unwrap_or_else(|_| "data/outbox".to_string())
}

fn audit_headers(headers: &HeaderMap) -> (String, String) {
    let req_id = headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown")
        .to_string();
    let msg_id = headers
        .get("x-message-id")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("unknown")
        .to_string();
    (req_id, msg_id)
}

fn idem_key(headers: &HeaderMap) -> Option<String> {
    headers
        .get("Idempotency-Key")
        .or_else(|| headers.get("X-Idempotency-Key"))
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route(
            "/api/v1/orders/:id/confirm-completion-intent",
            post(post_order_confirm_completion_intent),
        )
        .route(
            "/api/v1/orders/:id/open-dispute-intent",
            post(post_order_open_dispute_intent),
        )
        .route(
            "/api/v1/disputes/:id/execute-resolution-intent",
            post(post_dispute_execute_resolution_intent),
        )
}

async fn post_order_confirm_completion_intent(
    Path(order_id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(intent): Json<SignedIntent>,
) -> impl IntoResponse {
    if let Err(e) = validate_intent_shape(&intent) {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "invalid_intent",
                "error": "invalid_intent",
                "message": "invalid_intent",
                "detail": e,
            })),
        )
            .into_response();
    }
    if let Err(e) = validate_intent_policy(&intent, state.strict_ssot) {
        return (
            axum::http::StatusCode::FORBIDDEN,
            Json(json!({
                "status": "intent_blocked",
                "error": "intent_blocked",
                "message": "intent_blocked",
                "detail": e,
            })),
        )
            .into_response();
    }
    let outbox = traveltrust_core::FileOutbox::new(outbox_dir());
    let (req_id, msg_id) = audit_headers(&headers);
    let mut item = OutboxItem::new(
        "order.confirm_completion_intent",
        json!({
            "order_id": order_id,
            "intent": intent,
            "audit": { "x_request_id": req_id, "x_message_id": msg_id }
        }),
    );
    item.idempotency_key = idem_key(&headers);
    match outbox.enqueue(item) {
        Ok(enqueued) => (
            axum::http::StatusCode::ACCEPTED,
            Json(json!({
                "status": "accepted",
                "rule": "仅记录签名 intent 并进入 outbox；链上交易/状态推进由执行器完成，前端必须以查询结果为准",
                "outbox_item_id": enqueued.id
            })),
        ).into_response(),
        Err(e) => {
            let detail = e.to_string();
            (
                axum::http::StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "outbox_persist_failed",
                    "error": "outbox_persist_failed",
                    "message": "outbox_persist_failed",
                    "detail": detail,
                })),
            )
                .into_response()
        }
    }
}

async fn post_order_open_dispute_intent(
    Path(order_id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(intent): Json<SignedIntent>,
) -> impl IntoResponse {
    if let Err(e) = validate_intent_shape(&intent) {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "invalid_intent",
                "error": "invalid_intent",
                "message": "invalid_intent",
                "detail": e,
            })),
        )
            .into_response();
    }
    if let Err(e) = validate_intent_policy(&intent, state.strict_ssot) {
        return (
            axum::http::StatusCode::FORBIDDEN,
            Json(json!({
                "status": "intent_blocked",
                "error": "intent_blocked",
                "message": "intent_blocked",
                "detail": e,
            })),
        )
            .into_response();
    }
    let outbox = traveltrust_core::FileOutbox::new(outbox_dir());
    let (req_id, msg_id) = audit_headers(&headers);
    let mut item = OutboxItem::new(
        "order.open_dispute_intent",
        json!({
            "order_id": order_id,
            "intent": intent,
            "audit": { "x_request_id": req_id, "x_message_id": msg_id }
        }),
    );
    item.idempotency_key = idem_key(&headers);
    match outbox.enqueue(item) {
        Ok(enqueued) => (
            axum::http::StatusCode::ACCEPTED,
            Json(json!({
                "status": "accepted",
                "rule": "仅记录签名 intent 并进入 outbox；链上交易/状态推进由执行器完成，前端必须以查询结果为准",
                "outbox_item_id": enqueued.id
            })),
        ).into_response(),
        Err(e) => {
            let detail = e.to_string();
            (
                axum::http::StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "outbox_persist_failed",
                    "error": "outbox_persist_failed",
                    "message": "outbox_persist_failed",
                    "detail": detail,
                })),
            )
                .into_response()
        }
    }
}

async fn post_dispute_execute_resolution_intent(
    Path(dispute_id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(intent): Json<SignedIntent>,
) -> impl IntoResponse {
    if let Err(e) = validate_intent_shape(&intent) {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(json!({
                "status": "invalid_intent",
                "error": "invalid_intent",
                "message": "invalid_intent",
                "detail": e,
            })),
        )
            .into_response();
    }
    if let Err(e) = validate_intent_policy(&intent, state.strict_ssot) {
        return (
            axum::http::StatusCode::FORBIDDEN,
            Json(json!({
                "status": "intent_blocked",
                "error": "intent_blocked",
                "message": "intent_blocked",
                "detail": e,
            })),
        )
            .into_response();
    }
    let outbox = traveltrust_core::FileOutbox::new(outbox_dir());
    let (req_id, msg_id) = audit_headers(&headers);
    let mut item = OutboxItem::new(
        "dispute.execute_resolution",
        json!({
            "dispute_id": dispute_id,
            "intent": intent,
            "audit": { "x_request_id": req_id, "x_message_id": msg_id }
        }),
    );
    item.idempotency_key = idem_key(&headers);
    match outbox.enqueue(item) {
        Ok(enqueued) => (
            axum::http::StatusCode::ACCEPTED,
            Json(json!({
                "status": "accepted",
                "rule": "仅进入 outbox；链上交易/资金划转/状态推进必须由执行器以固定重试策略完成，失败不得离线手工推进",
                "outbox_item_id": enqueued.id
            })),
        ).into_response(),
        Err(e) => {
            let detail = e.to_string();
            (
                axum::http::StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "outbox_persist_failed",
                    "error": "outbox_persist_failed",
                    "message": "outbox_persist_failed",
                    "detail": detail,
                })),
            )
                .into_response()
        }
    }
}
