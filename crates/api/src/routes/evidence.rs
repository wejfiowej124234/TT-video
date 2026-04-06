//! /api/v1/orders/:id/evidence（48 §2.2 routes/evidence）
//! EvidenceReceiptRequest 与 post_evidence_receipt_impl 原在 main，已迁入本模块。

use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::get;
use axum::Json;
use chrono::{DateTime, Utc};
use hmac::{Hmac, Mac};
use serde::Deserialize;
use serde_json::json;
use std::env;
use std::path::PathBuf;
use uuid::Uuid;

use crate::chain_off;
use crate::state::{self, extract_user_with_session_check, ApiMetaState};
use traveltrust_core::{FileOutbox, OutboxItem};

use super::not_impl_json;

type HmacSha256 = Hmac<sha2::Sha256>;

#[derive(Debug, Deserialize)]
pub(crate) struct EvidenceReceiptRequest {
    pub(crate) content_hash: String,
    pub(crate) content_type: Option<String>,
    pub(crate) client_time_rfc3339: Option<String>,
    /// 50-O-80-2 / 50-B4：可选，与 chain_off EvidencePostBody 对齐
    #[serde(default)]
    pub(crate) schema_version: Option<String>,
    #[serde(default)]
    pub(crate) prompt_version: Option<String>,
    #[serde(default)]
    pub(crate) snapshot_hash: Option<String>,
    #[serde(default)]
    pub(crate) quote_hash: Option<String>,
    #[serde(default)]
    pub(crate) quote_canonical: Option<String>,
}

pub fn router() -> axum::Router<ApiMetaState> {
    axum::Router::new().route(
        "/api/v1/orders/:id/evidence",
        get(get_order_evidence).post(post_order_evidence),
    )
}

pub async fn get_order_evidence(
    State(state): State<ApiMetaState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    if let Some(ref co) = state.chain_off {
        let Ok(order_id) = Uuid::parse_str(&id) else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
            )
                .into_response();
        };
        return match chain_off::evidence_list_impl(co.clone(), order_id).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    not_impl_json(&format!("/api/v1/orders/{}/evidence", id)).into_response()
}

pub async fn post_order_evidence(
    Path(order_id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(payload): Json<EvidenceReceiptRequest>,
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
        let Ok(oid) = Uuid::parse_str(&order_id) else {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "invalid_uuid", "message": "invalid_uuid"})),
            )
                .into_response();
        };
        let body = chain_off::EvidencePostBody {
            content_hash: payload.content_hash.clone(),
            schema_version: payload.schema_version.clone(),
            prompt_version: payload.prompt_version.clone(),
            snapshot_hash: payload.snapshot_hash.clone(),
            quote_hash: payload.quote_hash.clone(),
            quote_canonical: payload.quote_canonical.clone(),
        };
        return match chain_off::evidence_post_impl(co.clone(), oid, uid, Json(body)).await {
            Ok(j) => j.into_response(),
            Err((code, j)) => (code, j).into_response(),
        };
    }
    post_evidence_receipt_impl(Path(order_id), State(state), headers, Json(payload))
        .await
        .into_response()
}

pub(crate) async fn post_evidence_receipt_impl(
    Path(order_id): Path<String>,
    State(state): State<ApiMetaState>,
    headers: HeaderMap,
    Json(payload): Json<EvidenceReceiptRequest>,
) -> impl IntoResponse {
    if state.evidence_timestamp_policy != "backend_signed" {
        return (
            StatusCode::NOT_IMPLEMENTED,
            Json(json!({
                "status": "not_implemented",
                "error": "not_implemented",
                "message": "not_implemented",
                "reason": "当前仅实现 backend_signed（可验证 server receipt 签名 + 回滚检测）",
                "evidence_timestamp_policy": state.evidence_timestamp_policy,
            })),
        );
    }

    let key: Vec<u8> = match &state.evidence_receipt_hmac_key {
        Some(k) if !k.as_ref().is_empty() => (**k).to_vec(),
        _ => {
            return (
                StatusCode::FAILED_DEPENDENCY,
                Json(json!({
                    "status": "missing_config",
                    "required_env": "EVIDENCE_RECEIPT_HMAC_KEY",
                    "rule": "证据回执必须可验证（签名）；否则证据时间戳可信策略未落地",
                })),
            );
        }
    };

    let now: DateTime<Utc> = Utc::now();
    let now_str = now.to_rfc3339();

    let time_state_path = PathBuf::from(&state.evidence_time_state_path);
    {
        let mut guard = state.evidence_time_state.write().await;
        let last = DateTime::parse_from_rfc3339(&guard.last_seen_utc_rfc3339)
            .ok()
            .map(|dt| dt.with_timezone(&Utc));
        if let Some(last_dt) = last {
            if now < last_dt {
                return (
                    StatusCode::SERVICE_UNAVAILABLE,
                    Json(json!({
                        "status": "time_rollback_detected",
                        "now_utc": now_str,
                        "last_seen_utc": guard.last_seen_utc_rfc3339,
                        "rule": "检测到服务器时间回滚：必须告警并暂停依赖时间戳的证据/裁决，直到运维确认",
                    })),
                );
            }
        }
        guard.last_seen_utc_rfc3339 = now_str.clone();
        if let Err(e) = state::persist_evidence_time_state(&time_state_path, &guard) {
            eprintln!("WARN: persist evidence time state failed: {}", e);
        }
    }

    let receipt_body = json!({
        "order_id": order_id,
        "content_hash": payload.content_hash,
        "content_type": payload.content_type,
        "server_time_utc_rfc3339": now_str,
        "client_time_rfc3339": payload.client_time_rfc3339,
        "policy": "backend_signed",
        "time_rollback_detection": "monotonic_last_timestamp_persisted",
    });
    let canonical = serde_json::to_vec(&receipt_body).unwrap_or_default();
    let mut mac = HmacSha256::new_from_slice(&key).expect("HMAC key");
    mac.update(&canonical);
    let sig = mac.finalize().into_bytes();
    let signature_hex: String = sig.iter().map(|b| format!("{:02x}", b)).collect();

    let idem_key = headers
        .get("Idempotency-Key")
        .or_else(|| headers.get("X-Idempotency-Key"))
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());
    let outbox_dir = env::var("OUTBOX_DIR").unwrap_or_else(|_| "data/outbox".to_string());
    let outbox = FileOutbox::new(outbox_dir);
    let mut item = OutboxItem::new(
        "evidence_receipt.created",
        json!({
            "receipt": receipt_body,
            "signature": { "alg": "hmac-sha256", "encoding": "hex", "value": signature_hex }
        }),
    );
    item.idempotency_key = idem_key;
    let outbox_item = match outbox.enqueue(item) {
        Ok(i) => i,
        Err(e) => {
            let detail = e.to_string();
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({
                    "status": "outbox_persist_failed",
                    "error": "outbox_persist_failed",
                    "message": "outbox_persist_failed",
                    "detail": detail,
                    "rule": "必须先落 outbox 再做任何外部副作用；否则会出现链成功但DB/持久化失败的不可对账状态",
                })),
            );
        }
    };

    (
        StatusCode::OK,
        Json(json!({
            "receipt": receipt_body,
            "signature": { "alg": "hmac-sha256", "encoding": "hex", "value": signature_hex },
            "outbox": { "id": outbox_item.id, "kind": outbox_item.kind, "status": "queued" }
        })),
    )
}
