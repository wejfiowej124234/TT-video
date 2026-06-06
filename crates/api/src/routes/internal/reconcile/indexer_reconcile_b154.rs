//! B-154 duration + batch stats helper for indexer-reconcile (TT-MOD split).
use serde_json::{json, Value};

use crate::db;

/// **B-154**：**`db::reconcile_orders_projection_vs_orders`** 耗时 + **`OrdersProjectionReconcileStats`** 行计数（**无** **`samples`**）。
pub(crate) fn indexer_reconcile_duration_batch_stats_observability_value(
    stats: &db::OrdersProjectionReconcileStats,
    reconcile_core_duration_ms: u64,
) -> Value {
    json!({
        "anchor": "154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-V1",
        "schema_version": 1,
        "reconcile_core_duration_ms": reconcile_core_duration_ms,
        "chain_id": stats.chain_id,
        "batch_row_counts": {
            "orders_with_escrow": stats.orders_with_escrow,
            "projection_rows_chain": stats.projection_rows_chain,
            "malformed_projection_order_id_bytes": stats.malformed_projection_order_id_bytes,
            "matched": stats.matched,
            "missing_projection": stats.missing_projection,
            "status_mismatch": stats.status_mismatch,
            "escrow_mismatch": stats.escrow_mismatch,
            "orphan_projections": stats.orphan_projections,
            "issues_total": stats.issues_total,
            "projection_reconcile_clean": stats.projection_reconcile_clean,
        },
        "getter_note": "reconcile_core_duration_ms is wall time for db::reconcile_orders_projection_vs_orders only; batch_row_counts mirror response stats without samples.",
    })
}

#[cfg(test)]
mod b154_indexer_reconcile_duration_batch_stats_tests {
    use super::indexer_reconcile_duration_batch_stats_observability_value;
    use crate::db::OrdersProjectionReconcileStats;
    use serde_json::json;

    #[test]
    fn b154_duration_batch_stats_anchor_and_batch_keys() {
        let stats = OrdersProjectionReconcileStats {
            chain_id: 137,
            orders_with_escrow: 5,
            projection_rows_chain: 4,
            matched: 3,
            ..Default::default()
        };
        let v = indexer_reconcile_duration_batch_stats_observability_value(&stats, 42);
        assert_eq!(
            v["anchor"],
            json!("154-INDEXER-RECONCILE-DURATION-BATCH-STATS-OBS-V1")
        );
        assert_eq!(v["reconcile_core_duration_ms"], json!(42));
        assert!(v.get("batch_row_counts").is_some());
        assert_eq!(v["chain_id"], json!(137));
    }
}
