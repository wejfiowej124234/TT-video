//! Internal observability-ish routes: alerts, incident, indexer-status.
use axum::extract::{Query, State};
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};

use crate::chain;
use crate::db;
use crate::state::ApiMetaState;

use super::observability_shell;

/// 与 **`GET …/admin/indexer/health`** 同源：最新 **`orders_projection_vs_orders`** 小摘要（无整份 summary）。
async fn snapshot_last_stored_orders_projection_reconcile(state: &ApiMetaState) -> Option<Value> {
    let pool = state
        .chain_off
        .as_ref()
        .and_then(|co| co.db_pool.as_ref())?;
    match db::admin_last_stored_orders_projection_reconcile(pool).await {
        Ok(Some(v)) => Some(v),
        Ok(None) | Err(_) => None,
    }
}

/// POST /api/v1/internal/alerts/test-fire：触发告警演练（最小可用）
pub async fn internal_alerts_test_fire(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let last = snapshot_last_stored_orders_projection_reconcile(&state).await;
    let mut body = json!({
        "status": "accepted",
        "task": "alerts_test_fire",
        "severity": "P2",
        "source": "internal",
        "snapshot": {
            "finality_n": state.finality_n,
            "lag_blocks": state.indexer_lag_blocks,
            "reorg_detected": state.reorg_detected
        }
    });
    observability_shell::merge_last_stored_orders_projection_reconcile_at(
        &mut body,
        "/snapshot",
        last,
    );
    Json(body).into_response()
}

/// POST /api/v1/internal/incident/open：创建事故工单（最小可用）
pub async fn internal_incident_open(State(state): State<ApiMetaState>) -> impl IntoResponse {
    let last = snapshot_last_stored_orders_projection_reconcile(&state).await;
    let mut body = json!({
        "status": "accepted",
        "task": "incident_open",
        "incident": {
            "id": format!("INC-{}", Utc::now().format("%Y%m%d%H%M%S")),
            "state": "opened",
            "owner_group": "ops"
        },
        "context": {
            "finality_n": state.finality_n,
            "lag_blocks": state.indexer_lag_blocks
        }
    });
    observability_shell::merge_last_stored_orders_projection_reconcile_at(
        &mut body,
        "/context",
        last,
    );
    Json(body).into_response()
}

#[derive(Debug, Default, Deserialize)]
pub struct IndexerStatusQuery {
    /// `1` / `true` / `yes` / `on`：即时只读跑 **`orders`↔`orders_projection`** 对账并写入 **`live_orders_projection_reconcile`**（须 **PgPool** + **ChainConfig**）。
    #[serde(default)]
    pub live_reconcile: Option<String>,
}

pub(crate) fn indexer_status_wants_live_reconcile(q: &IndexerStatusQuery) -> bool {
    q.live_reconcile.as_deref().map_or(false, |s| {
        matches!(
            s.trim().to_ascii_lowercase().as_str(),
            "1" | "true" | "yes" | "on"
        )
    })
}

/// **110 §3.4 Partial** / **RUNBOOK §2.55**：reorg 后**人工** replay/reconcile 路径说明；全自动回滚仍为 **Target**。
/// 嵌入 **`GET …/internal/indexer-status`** 便于探针、**`jq`** 与 **`indexer-public-snapshot`** 留痕（锚点 **`110-REORG-RECOVERY-HINT`**）。
fn indexer_reorg_recovery_hint_json() -> Value {
    json!({
        "anchor": "110-REORG-RECOVERY-HINT",
        "runbook": "ops/RUNBOOK.md §2.55",
        "spec": "110 §3.4 Partial: indexer-reorg-rewind + replay; full orders/memory rollback still Target",
        "steps": [
            "Optional: set INDEXER_REORG_AUTO_REWIND_ON_TICK=1 with DATABASE_URL so a single indexer-tick may auto-run the same rewind as indexer-reorg-rewind once per tick (see tick response reorg_auto_rewind; limitations unchanged)",
            "Pause indexer-tick jobs until chain head and stored last_block_hash are verified against RPC",
            "POST /api/v1/internal/indexer-reorg-rewind JSON {\"rewind_from_block\": <same as reorg_suspected.block_number>} — truncate event_log/fee_router tail, rewind memory checkpoint, clear+replay orders_projection (see response limitations)",
            "POST /api/v1/internal/indexer-replay — idempotent rebuild if needed (rewind already replays)",
            "POST /api/v1/internal/indexer-reconcile — check issues_total / projection_reconcile_clean; use persist:true only after approval",
            "Resume indexer-tick when indexer.last_block_hash matches canonical eth_getBlockByNumber(last_block)"
        ],
        "paths": {
            "indexer_status": "/api/v1/internal/indexer-status",
            "indexer_reorg_rewind": "/api/v1/internal/indexer-reorg-rewind",
            "indexer_replay": "/api/v1/internal/indexer-replay",
            "indexer_reconcile": "/api/v1/internal/indexer-reconcile",
            "indexer_tick": "/api/v1/internal/indexer-tick"
        }
    })
}

async fn live_orders_projection_reconcile_payload(state: &ApiMetaState) -> Value {
    let pool = match state.chain_off.as_ref().and_then(|c| c.db_pool.as_ref()) {
        Some(p) => p,
        None => return observability_shell::live_orders_projection_reconcile_database_unavailable(),
    };
    let chain_id = match state.chain_config.as_ref() {
        Some(c) => c.chain_id,
        None => return observability_shell::live_orders_projection_reconcile_chain_not_configured(),
    };
    let chain_id_i64 = (chain_id.min(i64::MAX as u64)) as i64;
    match db::reconcile_orders_projection_vs_orders(pool, chain_id_i64).await {
        Ok(stats) => {
            observability_shell::live_orders_projection_reconcile_ok_payload(pool, chain_id, stats).await
        }
        Err(e) => observability_shell::live_orders_projection_reconcile_failed(e.to_string()),
    }
}

/// GET /api/v1/internal/indexer-status：索引器运行状态与 checkpoint 快照
pub async fn indexer_status(
    State(state): State<ApiMetaState>,
    Query(query): Query<IndexerStatusQuery>,
) -> impl IntoResponse {
    let last = snapshot_last_stored_orders_projection_reconcile(&state).await;
    let runtime = if let Some(ref idx) = state.indexer_state {
        let g = idx.read().await;
        json!({
            "last_block": g.last_block,
            "last_log_index": g.last_log_index,
            "last_block_hash": g.last_block_hash,
            "events_cached": g.events.len(),
        })
    } else {
        json!({"status": "unavailable"})
    };

    let (chain_tip_obs, upper_obs) = if let Some(cfg) = state.chain_config.as_ref() {
        match chain::indexer::get_latest_block(&cfg.rpc_url).await {
            Ok(tip) => {
                let ub = chain::indexer::indexer_finalized_upper_bound(tip, state.finality_n);
                (Some(tip), Some(ub))
            }
            Err(_) => (None, None),
        }
    } else {
        (None, None)
    };

    let mut body = json!({
        "status": "ok",
        "meta": {
            "build": crate::routes::health_meta::meta_build_value()
        },
        "indexer": runtime,
        "state": {
            "finality_n": state.finality_n,
            "finality_n_used": state.finality_n,
            "chain_tip": chain_tip_obs,
            "indexer_finalized_upper_bound": upper_obs,
            "checkpoint": {
                "block_number": state.indexer_checkpoint.block_number,
                "log_index": state.indexer_checkpoint.log_index,
            },
            "last_seen_finality_n": state.indexer_last_seen_finality_n,
            "replay_required": state.indexer_replay_required,
            "lag_blocks": state.indexer_lag_blocks,
            "lag_max_blocks": state.indexer_lag_max_blocks,
            "reorg_detected": state.reorg_detected,
            "rule": "110 §3.3 Partial：indexer-tick 上界 chain_tip−max(1,FINALITY_N)；同 GET /meta.indexer.rule；供 reconcile 门禁与运维对齐",
        }
    });
    body["reorg_recovery"] = indexer_reorg_recovery_hint_json();
    observability_shell::merge_last_stored_orders_projection_reconcile_root(&mut body, last);
    if indexer_status_wants_live_reconcile(&query) {
        body["live_orders_projection_reconcile"] =
            live_orders_projection_reconcile_payload(&state).await;
    }
    Json(body).into_response()
}

/// **`GET …/admin/observability/overview`** 与 **`indexer-reconcile`** **`persist`** 摘要同源：最新报告 **`summary.indexer_head_vs_db_latest_block_drift_observability`**（锚 **`153-INDEXER-HEAD-VS-DB-LATEST-BLOCK-DRIFT-OBS-V1`**）。
pub async fn indexer_head_vs_db_latest_block_drift_observability_v1(
    pool: Option<&sqlx::PgPool>,
    _rpc_url: Option<&str>,
    _expected_chain_id: Option<i64>,
) -> Value {
    const ANCHOR: &str = "153-INDEXER-HEAD-VS-DB-LATEST-BLOCK-DRIFT-OBS-V1";
    let Some(pool) = pool else {
        return json!({
            "anchor": ANCHOR,
            "schema_version": 1,
            "observation_note": "database_pool_unavailable",
        });
    };
    match db::admin_last_indexer_head_vs_db_latest_block_drift_observability(pool).await {
        Ok(Some(v)) => v,
        Ok(None) => json!({
            "anchor": ANCHOR,
            "schema_version": 1,
            "observation_note": "no_stored_snapshot",
            "getter_note": "From latest reconciliation_reports.summary when present; run POST …/internal/indexer-reconcile with persist:true to populate.",
        }),
        Err(e) => json!({
            "anchor": ANCHOR,
            "schema_version": 1,
            "observation_note": "query_failed",
            "error": e.to_string(),
        }),
    }
}
