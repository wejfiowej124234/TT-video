//! 共享 State 类型与鉴权辅助（48 §4.4、§11.2）

#![allow(dead_code)]

use axum::http::HeaderMap;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::env;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::RwLock;
use uuid::Uuid;

use ed25519_dalek::SigningKey;

use crate::chain;
use crate::chain_off;
use crate::db;

/// 索引器 checkpoint（block_number + log_index），与 main 内 CLI 索引器状态一致。
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ProjectorCheckpoint {
    pub block_number: u64,
    pub log_index: u32,
}

/// 证据时间戳策略的持久化状态（可信起点 + 回滚检测）。
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct EvidenceTimeState {
    pub last_seen_utc_rfc3339: String,
}

fn write_bytes_atomic(path: &std::path::Path, bytes: &[u8]) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("mkdir {}: {}", parent.display(), e))?;
    }
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, bytes).map_err(|e| format!("write {}: {}", tmp.display(), e))?;
    let bak = path.with_extension("json.bak");
    if path.exists() {
        let _ = std::fs::remove_file(&bak);
        std::fs::rename(path, &bak).map_err(|e| {
            format!(
                "cannot prepare replace (rename old {} -> {}): {}",
                path.display(),
                bak.display(),
                e
            )
        })?;
    }
    std::fs::rename(&tmp, path).map_err(|e| {
        format!(
            "replace failed (rename {} -> {}): {}",
            tmp.display(),
            path.display(),
            e
        )
    })?;
    let _ = std::fs::remove_file(&bak);
    Ok(())
}

pub fn load_or_init_evidence_time_state(path: &PathBuf) -> EvidenceTimeState {
    if let Ok(bytes) = std::fs::read(path) {
        if let Ok(s) = serde_json::from_slice::<EvidenceTimeState>(&bytes) {
            return s;
        }
    }
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    EvidenceTimeState {
        last_seen_utc_rfc3339: Utc::now().to_rfc3339(),
    }
}

pub fn persist_evidence_time_state(
    path: &PathBuf,
    state: &EvidenceTimeState,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let bytes = serde_json::to_vec_pretty(state)?;
    write_bytes_atomic(path, &bytes)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    Ok(())
}

/// 所有路由共用的 State；router 只做一次 .with_state(meta_state)（48 §11.2）。
#[derive(Clone)]
pub struct ApiMetaState {
    pub strict_ssot: bool,
    pub ssot_version: String,
    pub ssot_sha256_expected: Option<String>,
    pub ssot_sha256_computed: Option<String>,
    pub ssot_sha256_match: bool,
    pub chargeback_policy: String,
    pub finality_n: u64,
    pub indexer_state_path: String,
    pub indexer_checkpoint: ProjectorCheckpoint,
    pub indexer_last_seen_finality_n: u64,
    pub indexer_replay_required: bool,

    pub pause_mode: bool,
    pub pause_api_allowlist: String,

    pub degraded_mode: bool,
    pub authority_source: String,
    pub indexer_lag_blocks: u64,
    pub indexer_lag_max_blocks: u64,
    pub reorg_detected: bool,

    pub evidence_timestamp_policy: String,
    pub evidence_time_state: Arc<RwLock<EvidenceTimeState>>,
    pub evidence_time_state_path: String,
    pub evidence_receipt_hmac_key: Option<Arc<Vec<u8>>>,

    /// **`RECONCILE_EXPORT_ED25519_SEED_HEX`**（32 字节 hex）；对 **`GET …/reconcile-reports/export`** 响应体做 **Ed25519** 签名（**200** 头 **`x-traveltrust-reconcile-export-ed25519`**）；公钥见 **`GET /meta.admin_exports`**（200 §2.1 Partial）。
    pub reconcile_export_ed25519_key: Option<Arc<SigningKey>>,

    pub chain_off: Option<chain_off::ChainOffState>,
    pub chain_config: Option<chain::ChainConfig>,
    pub resolution_outbox: Option<chain::outbox::ResolutionOutbox>,
    pub indexer_state: Option<chain::indexer::IndexerStateHandle>,
    pub guide_upload_rate: Arc<RwLock<std::collections::HashMap<Uuid, Vec<Instant>>>>,
}

impl ApiMetaState {
    /// 与 `GET /meta` `indexer.checkpoint` 同源（710 / 712）：block、log、`source`。
    pub async fn indexer_checkpoint_for_observability(&self) -> (u64, u32, &'static str) {
        if let Some(ref h) = self.indexer_state {
            let g = h.read().await;
            (g.last_block, g.last_log_index, "runtime")
        } else {
            (
                self.indexer_checkpoint.block_number,
                self.indexer_checkpoint.log_index,
                "startup_snapshot",
            )
        }
    }
}

fn bearer_raw_token(headers: &HeaderMap) -> Option<&str> {
    let auth = headers
        .get(axum::http::header::AUTHORIZATION)?
        .to_str()
        .ok()?;
    let s = auth.trim();
    if s.len() < 8 || !s[..7].eq_ignore_ascii_case("bearer ") {
        return None;
    }
    let token = s[7..].trim();
    if token.is_empty() {
        return None;
    }
    Some(token)
}

/// P1 鉴权增强（企业级审计 S1）：
/// - 若请求带 `Authorization: Bearer`，且配置了 `db_pool`：**仅**接受 sessions 表命中；未命中则 **不**回退到 `X-User-Id`（避免伪造 Bearer + 冒用头）。
/// - 纯内存链下：先查内存 `sessions`，再回退 `extract_user_from_headers`（含 `bearer_<uuid>` / `X-User-Id` 联调）。
/// - 无 Bearer 时仍走 `X-User-Id` 等（过渡兼容；生产建议 `STRICT_SESSION_GATE=1` + 前端携带登录返回的 token）。
pub async fn extract_user_with_session_check(
    state: &ApiMetaState,
    headers: &HeaderMap,
) -> Option<Uuid> {
    if let Some(token) = bearer_raw_token(headers) {
        if let Some(ref co) = state.chain_off {
            if let Some(ref pool) = co.db_pool {
                return match db::get_user_id_by_token(pool, token).await {
                    Ok(Some(uid)) => Some(uid),
                    Ok(None) | Err(_) => None,
                };
            }
            let store = co.store.read().await;
            if let Some(&uid) = store.sessions.get(token) {
                return Some(uid);
            }
        }
        return chain_off::extract_user_from_headers(headers);
    }
    chain_off::extract_user_from_headers(headers)
}

/// 50-O-R1 / Runbook §9：运维声明的链下 **DB 双写失败** 处置策略（`GET /meta` + `startup_snapshot`）。
/// 合法值（大小写不敏感）：`log_only` \| `1`（①）；`strict_503` \| `2` \| `fail_closed`（②）；`alert_only` \| `3`（③）。非法或空 → **`log_only`**。
/// **②** 的实际 503 仍由各 **`TRAVELTRUST_STRICT_*_DB_WRITE=1`** 分路径控制。
pub fn dual_write_failure_policy() -> &'static str {
    normalize_dual_write_policy_str(&env::var("DUAL_WRITE_FAILURE_POLICY").unwrap_or_default())
}

fn normalize_dual_write_policy_str(raw: &str) -> &'static str {
    match raw.trim().to_ascii_lowercase().as_str() {
        "1" | "log_only" => "log_only",
        "2" | "strict_503" | "fail_closed" => "strict_503",
        "3" | "alert_only" => "alert_only",
        _ => "log_only",
    }
}

/// 任一 `TRAVELTRUST_STRICT_*_DB_WRITE=1` 时为 true（与 `GET /meta` evidence/order_messages/… 子块一致）。
pub fn any_traveltrust_strict_db_write() -> bool {
    const KEYS: &[&str] = &[
        "TRAVELTRUST_STRICT_EVIDENCE_DB_WRITE",
        "TRAVELTRUST_STRICT_MESSAGE_DB_WRITE",
        "TRAVELTRUST_STRICT_REVIEW_DB_WRITE",
        "TRAVELTRUST_STRICT_DISPUTE_OPEN_DB_WRITE",
        "TRAVELTRUST_STRICT_DISPUTE_RESOLVE_DB_WRITE",
        "TRAVELTRUST_STRICT_ITINERARY_DB_WRITE",
        "TRAVELTRUST_STRICT_ORDER_DB_WRITE",
        "TRAVELTRUST_STRICT_AUTH_DB_WRITE",
        "TRAVELTRUST_STRICT_SEED_DB_WRITE",
        "TRAVELTRUST_STRICT_GUIDE_DB_WRITE",
    ];
    KEYS.iter().any(|k| env::var(k).as_deref() == Ok("1"))
}

/// 供 `routes/*` 单测构造 **`ApiMetaState`**（Axum `oneshot`），避免各文件重复填 20+ 字段。
#[cfg(test)]
pub(crate) mod test_support {
    use super::{ApiMetaState, EvidenceTimeState, ProjectorCheckpoint};
    use crate::chain_off::ChainOffState;
    use chrono::Utc;
    use std::collections::HashMap;
    use std::sync::Arc;
    use std::time::Instant;
    use tokio::sync::RwLock;
    use uuid::Uuid;

    pub(crate) fn api_meta_state(chain_off: Option<ChainOffState>) -> ApiMetaState {
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
                block_number: 40,
                log_index: 2,
            },
            indexer_last_seen_finality_n: 12,
            indexer_replay_required: false,
            pause_mode: false,
            pause_api_allowlist: String::new(),
            degraded_mode: true,
            authority_source: "pending_finality".to_string(),
            indexer_lag_blocks: 9,
            indexer_lag_max_blocks: 100,
            reorg_detected: true,
            evidence_timestamp_policy: "backend_signed".to_string(),
            evidence_time_state: Arc::new(RwLock::new(EvidenceTimeState {
                last_seen_utc_rfc3339: Utc::now().to_rfc3339(),
            })),
            evidence_time_state_path: "test".to_string(),
            evidence_receipt_hmac_key: None,
            reconcile_export_ed25519_key: None,
            chain_off,
            chain_config: None,
            resolution_outbox: None,
            indexer_state: None,
            guide_upload_rate: Arc::new(RwLock::new(HashMap::<Uuid, Vec<Instant>>::new())),
        }
    }
}

#[cfg(test)]
mod dual_write_policy_tests {
    use super::normalize_dual_write_policy_str;

    #[test]
    fn normalize_aliases_and_default() {
        assert_eq!(normalize_dual_write_policy_str(""), "log_only");
        assert_eq!(normalize_dual_write_policy_str("  "), "log_only");
        assert_eq!(normalize_dual_write_policy_str("bogus"), "log_only");
        assert_eq!(normalize_dual_write_policy_str("1"), "log_only");
        assert_eq!(normalize_dual_write_policy_str("LOG_ONLY"), "log_only");
        assert_eq!(normalize_dual_write_policy_str("2"), "strict_503");
        assert_eq!(normalize_dual_write_policy_str("fail_closed"), "strict_503");
        assert_eq!(normalize_dual_write_policy_str("3"), "alert_only");
    }
}
