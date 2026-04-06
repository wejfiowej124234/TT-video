//! chain_off 证据：EvidenceReceiptRow、EvidencePostBody、evidence_list、evidence_post（48 §5.9、50-EV1 双写 DB、50-O-80-2 Import Quote 校验；**817** **`GET|POST …/orders/:id/evidence`** **根级**/**`receipt`** **`tourist_id`****/**`traveler_id`** **87** **镜像**）

use axum::{http::StatusCode, Json};
use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::json;
use sha3::{Digest, Keccak256};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use uuid::Uuid;

use super::disputes::dispute_party_mirror;
use super::ChainOffState;
use crate::db;

/// 证据回执（链下占位：01 §6、50-B4 含可选 schemaVersion/promptVersion/snapshotHash/quoteHash 供 replay/审计）
#[derive(Clone, Debug)]
pub struct EvidenceReceiptRow {
    pub content_hash: String,
    pub created_at: DateTime<Utc>,
    pub uploader_id: Uuid,
    #[allow(dead_code)]
    pub schema_version: Option<String>,
    #[allow(dead_code)]
    pub prompt_version: Option<String>,
    #[allow(dead_code)]
    pub snapshot_hash: Option<String>,
    #[allow(dead_code)]
    pub quote_hash: Option<String>,
}

#[derive(Deserialize)]
pub struct EvidencePostBody {
    pub content_hash: String,
    #[serde(default)]
    pub schema_version: Option<String>,
    #[serde(default)]
    pub prompt_version: Option<String>,
    #[serde(default)]
    pub snapshot_hash: Option<String>,
    #[serde(default)]
    pub quote_hash: Option<String>,
    /// 50-O-80-2 Import Quote：可选 canonical 报价串，服务端校验 keccak256(quote_canonical) == quote_hash
    #[serde(default)]
    pub quote_canonical: Option<String>,
}

/// 证据 content_hash 最大长度（01 §6 证据 DoS P0 大小/类型白名单）
const EVIDENCE_CONTENT_HASH_MAX_LEN: usize = 128;

/// 50-O-80-2：Import Quote 时 quote_canonical 最大字节数（防 DoS）
const EVIDENCE_QUOTE_CANONICAL_MAX_LEN: usize = 65_536;

/// 证据提交限流：每 (order_id, user_id) 每分钟请求数上限
fn evidence_rate_limit_check(
    order_id: Uuid,
    user_id: Uuid,
) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
    let limit = std::env::var("EVIDENCE_MAX_REQUESTS_PER_MINUTE")
        .ok()
        .and_then(|s| s.parse::<u32>().ok())
        .unwrap_or(0);
    if limit == 0 {
        return Ok(());
    }
    static STORE: std::sync::OnceLock<Mutex<HashMap<(Uuid, Uuid), Vec<Instant>>>> =
        std::sync::OnceLock::new();
    let store = STORE.get_or_init(|| Mutex::new(HashMap::new()));
    let now = Instant::now();
    let window = Duration::from_secs(60);
    let mut guard = store.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(crate::api_json::err_key("rate_limit_unavailable")),
        )
    })?;
    let key = (order_id, user_id);
    let vec = guard.entry(key).or_default();
    vec.retain(|t| now.saturating_duration_since(*t) < window);
    if vec.len() >= limit as usize {
        return Err((
            StatusCode::TOO_MANY_REQUESTS,
            Json(json!({
                "error": "evidence_rate_limit_exceeded",
                "message": "evidence_rate_limit_exceeded",
                "max_per_minute": limit,
            })),
        ));
    }
    vec.push(now);
    Ok(())
}

pub async fn evidence_list_impl(
    state: ChainOffState,
    order_id: Uuid,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let store = state.store.read().await;
    let order = store.orders.get(&order_id).ok_or((
        StatusCode::NOT_FOUND,
        Json(json!({"error": "order_not_found", "message": "order_not_found"})),
    ))?;
    let (tourist_id, traveler_id) = dispute_party_mirror(Some(order));
    let receipts = store
        .evidence_receipts
        .get(&order_id)
        .cloned()
        .unwrap_or_default();
    let items: Vec<_> = receipts
        .iter()
        .map(|r| {
            json!({
                "content_hash": r.content_hash,
                "created_at": r.created_at.to_rfc3339(),
                "uploader_id": r.uploader_id.to_string(),
                "schema_version": r.schema_version,
                "prompt_version": r.prompt_version,
                "snapshot_hash": r.snapshot_hash,
                "quote_hash": r.quote_hash,
            })
        })
        .collect();
    Ok(Json(json!({
        "status": "ok",
        "items": items,
        "tourist_id": tourist_id,
        "traveler_id": traveler_id,
    })))
}

pub async fn evidence_post_impl(
    state: ChainOffState,
    order_id: Uuid,
    user_id: Uuid,
    Json(body): Json<EvidencePostBody>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    evidence_rate_limit_check(order_id, user_id)?;
    if body.content_hash.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("content_hash_required")),
        ));
    }
    if body.content_hash.len() > EVIDENCE_CONTENT_HASH_MAX_LEN {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(
                json!({"error": "content_hash_too_long", "message": "content_hash_too_long", "max_length": EVIDENCE_CONTENT_HASH_MAX_LEN}),
            ),
        ));
    }
    if !body.content_hash.chars().all(|c| c.is_ascii_hexdigit()) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(crate::api_json::err_key("content_hash_must_be_hex")),
        ));
    }
    if let (Some(ref qh), Some(ref qc)) = (&body.quote_hash, &body.quote_canonical) {
        if qc.len() > EVIDENCE_QUOTE_CANONICAL_MAX_LEN {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(
                    json!({"error": "quote_canonical_too_long", "message": "quote_canonical_too_long", "max_bytes": EVIDENCE_QUOTE_CANONICAL_MAX_LEN}),
                ),
            ));
        }
        let hash = Keccak256::digest(qc.as_bytes());
        let computed = hex::encode(hash);
        if !qh.eq_ignore_ascii_case(&computed) {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(
                    json!({"error": "invalid_quote_hash", "message": "invalid_quote_hash", "rule": "keccak256(quote_canonical) must equal quote_hash (50-O-80-2 Import Quote)"}),
                ),
            ));
        }
    }

    let (has_dispute, receipt) = {
        let store = state.store.read().await;
        let order = store.orders.get(&order_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?;
        if !crate::chain_off::order_is_participant(&store, order, user_id) {
            return Err((
                StatusCode::FORBIDDEN,
                Json(json!({"error": "forbidden", "message": "forbidden"})),
            ));
        }
        if let Some(err_key) =
            crate::chain_off::me::order_participant_trust_gate(&store, user_id, order)
        {
            return Err((
                StatusCode::FORBIDDEN,
                Json(crate::api_json::err_key(err_key)),
            ));
        }
        let has_dispute = store.disputes_by_order.contains_key(&order_id);
        let now = Utc::now();
        let receipt = EvidenceReceiptRow {
            content_hash: body.content_hash.clone(),
            created_at: now,
            uploader_id: user_id,
            schema_version: body.schema_version.clone(),
            prompt_version: body.prompt_version.clone(),
            snapshot_hash: body.snapshot_hash.clone(),
            quote_hash: body.quote_hash.clone(),
        };
        (has_dispute, receipt)
    };

    // Phase 5 / 50-O-R1：有 DB 时先落库再更新内存；strict 时 DB 失败 503。
    let strict_db = std::env::var("TRAVELTRUST_STRICT_EVIDENCE_DB_WRITE").as_deref() == Ok("1");
    let mut db_insert_ok = false;
    if let Some(ref pool) = state.db_pool {
        match db::insert_evidence_receipt(
            pool,
            order_id,
            user_id,
            &receipt.content_hash,
            receipt.schema_version.as_deref(),
            receipt.prompt_version.as_deref(),
            receipt.snapshot_hash.as_deref(),
            receipt.quote_hash.as_deref(),
            receipt.created_at,
        )
        .await
        {
            Ok(()) => db_insert_ok = true,
            Err(e) => {
                eprintln!("WARN: evidence_receipts double-write failed: {}", e);
                if strict_db {
                    return Err((
                        StatusCode::SERVICE_UNAVAILABLE,
                        Json(json!({
                            "error": "evidence_db_persist_failed",
                            "message": "evidence_db_persist_failed",
                            "rule": "TRAVELTRUST_STRICT_EVIDENCE_DB_WRITE=1 requires successful DB insert; retry with same Idempotency-Key if applicable (ops/RUNBOOK §9)",
                        })),
                    ));
                }
            }
        }
    }

    {
        let mut store = state.store.write().await;
        let order = store.orders.get(&order_id).ok_or((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "order_not_found", "message": "order_not_found"})),
        ))?;
        if !crate::chain_off::order_is_participant(&store, order, user_id) {
            return Err((
                StatusCode::FORBIDDEN,
                Json(json!({"error": "forbidden", "message": "forbidden"})),
            ));
        }
        store
            .evidence_receipts
            .entry(order_id)
            .or_default()
            .push(receipt.clone());
        let now = receipt.created_at;
        if let Some(&dispute_id) = store.disputes_by_order.get(&order_id) {
            if let Some(d) = store.disputes.get_mut(&dispute_id) {
                d.evidence_hashes.push(receipt.content_hash.clone());
                d.updated_at = now;
            }
        }
    }

    if db_insert_ok && has_dispute {
        if let Some(ref pool) = state.db_pool {
            let _ =
                db::append_evidence_hash_to_dispute(pool, order_id, &receipt.content_hash).await;
        }
    }

    let (tourist_id, traveler_id) = {
        let store = state.store.read().await;
        let order = store.orders.get(&order_id);
        dispute_party_mirror(order)
    };

    Ok(Json(json!({
        "status": "ok",
        "receipt": {
            "content_hash": receipt.content_hash,
            "created_at": receipt.created_at.to_rfc3339(),
            "uploader_id": receipt.uploader_id.to_string(),
            "tourist_id": tourist_id,
            "traveler_id": traveler_id,
        }
    })))
}
