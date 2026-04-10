//! B-185: shared **assembly** helpers for observability JSON bodies only.
//! Does not alter field names, shapes, or when branches run — callers keep all business gates.

use serde_json::{json, Value};
use sqlx::PgPool;

use crate::db;

use super::common;

/// Merge admin **`last_stored_orders_projection_reconcile`** into a nested object (JSON Pointer).
/// Used by alerts (`/snapshot`) and incident (`/context`).
pub(crate) fn merge_last_stored_orders_projection_reconcile_at(
    body: &mut Value,
    pointer: &str,
    last: Option<Value>,
) {
    if let Some(v) = last {
        if let Some(obj) = body.pointer_mut(pointer).and_then(|x| x.as_object_mut()) {
            obj.insert("last_stored_orders_projection_reconcile".to_string(), v);
        }
    }
}

/// Root-level **`last_stored_orders_projection_reconcile`** (`indexer-status` shape).
pub(crate) fn merge_last_stored_orders_projection_reconcile_root(body: &mut Value, last: Option<Value>) {
    if let Some(v) = last {
        body["last_stored_orders_projection_reconcile"] = v;
    }
}

pub(crate) fn live_orders_projection_reconcile_database_unavailable() -> Value {
    json!({
        "ok": false,
        "error": "database_unavailable",
        "message": "DATABASE_URL / PgPool required for live reconcile",
    })
}

pub(crate) fn live_orders_projection_reconcile_chain_not_configured() -> Value {
    json!({
        "ok": false,
        "error": "chain_not_configured",
        "message": "CHAIN_RPC_URL / ChainConfig required for live reconcile",
    })
}

pub(crate) fn live_orders_projection_reconcile_failed(message: String) -> Value {
    json!({
        "ok": false,
        "error": "reconcile_orders_projection_failed",
        "message": message,
    })
}

/// Success branch for **`live_orders_projection_reconcile`** only (no `reconcile_gates`).
pub(crate) async fn live_orders_projection_reconcile_ok_payload(
    pool: &PgPool,
    chain_id: u64,
    stats: db::OrdersProjectionReconcileStats,
) -> Value {
    let chain_id_i64 = (chain_id.min(i64::MAX as u64)) as i64;
    let mut j = json!({
        "ok": true,
        "chain_id": chain_id,
        "issues_total": stats.issues_total,
        "projection_reconcile_clean": stats.projection_reconcile_clean,
        "stats": stats,
    });
    if let Some(c) = common::economic_projection_row_counts_for_chain(pool, chain_id_i64).await {
        j["economic_projection_row_counts"] = c;
    }
    j
}
