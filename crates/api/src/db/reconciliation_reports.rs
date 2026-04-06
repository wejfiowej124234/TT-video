//! 对账报告只追加表 `reconciliation_reports`（04 附录、110）

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::postgres::PgPool;
use sqlx::types::Json;
use uuid::Uuid;

/// internal **indexer-reconcile** 持久化摘要所用 `report_type`
pub const REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS: &str = "orders_projection_vs_orders";

pub async fn insert_reconciliation_report(
    pool: &PgPool,
    report_type: &str,
    chain_id: Option<i64>,
    summary: &Value,
) -> Result<Uuid, sqlx::Error> {
    sqlx::query_scalar(
        r#"
        INSERT INTO reconciliation_reports (report_type, chain_id, summary)
        VALUES ($1, $2, $3)
        RETURNING id
        "#,
    )
    .bind(report_type)
    .bind(chain_id)
    .bind(Json(summary))
    .fetch_one(pool)
    .await
}

#[derive(Debug, sqlx::FromRow)]
pub struct ReconciliationReportRow {
    pub id: Uuid,
    pub report_type: String,
    pub chain_id: Option<i64>,
    pub period_start: Option<DateTime<Utc>>,
    pub period_end: Option<DateTime<Utc>>,
    pub summary: Json<Value>,
    pub details_path: Option<String>,
    pub created_at: DateTime<Utc>,
}

pub async fn get_reconciliation_report_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<ReconciliationReportRow>, sqlx::Error> {
    sqlx::query_as::<_, ReconciliationReportRow>(
        r#"
        SELECT id, report_type, chain_id, period_start, period_end, summary, details_path, created_at
        FROM reconciliation_reports
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

pub async fn get_latest_reconciliation_report_by_type(
    pool: &PgPool,
    report_type: &str,
) -> Result<Option<ReconciliationReportRow>, sqlx::Error> {
    sqlx::query_as::<_, ReconciliationReportRow>(
        r#"
        SELECT id, report_type, chain_id, period_start, period_end, summary, details_path, created_at
        FROM reconciliation_reports
        WHERE report_type = $1
        ORDER BY created_at DESC
        LIMIT 1
        "#,
    )
    .bind(report_type)
    .fetch_optional(pool)
    .await
}

/// Admin **`indexer/health`** 与 **`observability/overview`** 共用：最新 `orders_projection_vs_orders` 小摘要（无整份 **`summary`**）。
pub async fn admin_last_stored_orders_projection_reconcile(
    pool: &PgPool,
) -> Result<Option<Value>, sqlx::Error> {
    let Some(row) =
        get_latest_reconciliation_report_by_type(pool, REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS)
            .await?
    else {
        return Ok(None);
    };
    let stats = row.summary.0.get("stats");
    let projection_reconcile_clean = stats
        .and_then(|s| s.get("projection_reconcile_clean"))
        .and_then(|v| v.as_bool());
    let issues_total = stats
        .and_then(|s| s.get("issues_total"))
        .and_then(Value::as_u64);
    Ok(Some(json!({
        "report_id": row.id.to_string(),
        "report_type": row.report_type,
        "created_at": row.created_at.to_rfc3339(),
        "chain_id": row.chain_id,
        "projection_reconcile_clean": projection_reconcile_clean,
        "issues_total": issues_total,
    })))
}

/// Admin 列表用（不含整份 **`summary`**；从 **`summary.stats`** 抽取门禁字段与分项计数，**不含** **`samples`**）
#[derive(Debug, sqlx::FromRow)]
pub struct ReconciliationReportListItem {
    pub id: Uuid,
    pub report_type: String,
    pub chain_id: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub issues_total: Option<i64>,
    pub projection_reconcile_clean: Option<bool>,
    pub orders_with_escrow: Option<i64>,
    pub projection_rows_chain: Option<i64>,
    pub matched: Option<i64>,
    pub missing_projection: Option<i64>,
    pub status_mismatch: Option<i64>,
    pub escrow_mismatch: Option<i64>,
    pub orphan_projections: Option<i64>,
    pub malformed_projection_order_id_bytes: Option<i64>,
    /// `summary.economic_projection_row_counts.fee_router_routed_events.rows_total`（旧报告无键则为 **NULL**）
    pub fee_router_routed_events_rows: Option<i64>,
    /// `summary.economic_projection_row_counts.region_vault_forwarded_events.rows_total`
    pub region_vault_forwarded_events_rows: Option<i64>,
    pub fee_router_routed_events_max_block_number: Option<i64>,
    pub fee_router_routed_events_min_block_number: Option<i64>,
    pub fee_router_routed_events_latest_inserted_at: Option<String>,
    pub region_vault_forwarded_events_max_block_number: Option<i64>,
    pub region_vault_forwarded_events_min_block_number: Option<i64>,
    pub region_vault_forwarded_events_latest_inserted_at: Option<String>,
    /// `summary.event_log_escrow_coverage.escrow_class_event_rows`（**`include_event_log_escrow_coverage`** 且 **`persist`** 的旧报告无键则为 **NULL**）
    pub event_log_escrow_class_rows: Option<i64>,
    /// `summary.event_log_escrow_coverage.escrow_created_rows`
    pub event_log_escrow_created_rows: Option<i64>,
    /// `summary.event_log_escrow_coverage.distinct_escrow_address_from_escrow_created`
    pub event_log_distinct_escrow_from_created: Option<i64>,
}

fn has_any_economic_projection_list_field(r: &ReconciliationReportListItem) -> bool {
    r.fee_router_routed_events_rows.is_some()
        || r.region_vault_forwarded_events_rows.is_some()
        || r.fee_router_routed_events_max_block_number.is_some()
        || r.fee_router_routed_events_min_block_number.is_some()
        || r.fee_router_routed_events_latest_inserted_at.is_some()
        || r.region_vault_forwarded_events_max_block_number.is_some()
        || r.region_vault_forwarded_events_min_block_number.is_some()
        || r.region_vault_forwarded_events_latest_inserted_at.is_some()
}

/// Admin 列表/CSV 用：自 **`summary`** 抽取的 **`economic_projection_row_counts`**（与 **`POST …/internal/indexer-reconcile`** **`persist`** 同路径；全无则 **`None`**）。
pub fn economic_projection_row_counts_from_list_item(
    r: &ReconciliationReportListItem,
) -> Option<Value> {
    if !has_any_economic_projection_list_field(r) {
        return None;
    }
    Some(json!({
        "fee_router_routed_events": {
            "rows_total": r.fee_router_routed_events_rows,
            "max_block_number": r.fee_router_routed_events_max_block_number,
            "min_block_number": r.fee_router_routed_events_min_block_number,
            "latest_inserted_at": r.fee_router_routed_events_latest_inserted_at,
        },
        "region_vault_forwarded_events": {
            "rows_total": r.region_vault_forwarded_events_rows,
            "max_block_number": r.region_vault_forwarded_events_max_block_number,
            "min_block_number": r.region_vault_forwarded_events_min_block_number,
            "latest_inserted_at": r.region_vault_forwarded_events_latest_inserted_at,
        },
    }))
}

fn has_any_event_log_escrow_coverage_list_field(r: &ReconciliationReportListItem) -> bool {
    r.event_log_escrow_class_rows.is_some()
        || r.event_log_escrow_created_rows.is_some()
        || r.event_log_distinct_escrow_from_created.is_some()
}

/// Admin 列表/CSV 用：自 **`summary`** 抽取的 **`event_log_escrow_coverage`**（与 **`POST …/internal/indexer-reconcile`** **`include_event_log_escrow_coverage` + `persist`** 同路径；全无则 **`None`**）。
pub fn event_log_escrow_coverage_from_list_item(r: &ReconciliationReportListItem) -> Option<Value> {
    if !has_any_event_log_escrow_coverage_list_field(r) {
        return None;
    }
    Some(json!({
        "escrow_class_event_rows": r.event_log_escrow_class_rows,
        "escrow_created_rows": r.event_log_escrow_created_rows,
        "distinct_escrow_address_from_escrow_created": r.event_log_distinct_escrow_from_created,
    }))
}

pub async fn count_reconciliation_reports(
    pool: &PgPool,
    report_type: Option<&str>,
    chain_id: Option<i64>,
    projection_reconcile_clean: Option<bool>,
    issues_min: Option<i64>,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar::<_, i64>(
        r#"
        SELECT COUNT(*)::bigint FROM reconciliation_reports
        WHERE ($1::text IS NULL OR report_type = $1)
          AND ($2::bigint IS NULL OR chain_id = $2)
          AND ($3::boolean IS NULL OR (summary #>> '{stats,projection_reconcile_clean}')::boolean = $3)
          AND (
              $4::bigint IS NULL
              OR COALESCE(NULLIF(TRIM(summary #>> '{stats,issues_total}'), '')::bigint, -1) >= $4
          )
        "#,
    )
    .bind(report_type)
    .bind(chain_id)
    .bind(projection_reconcile_clean)
    .bind(issues_min)
    .fetch_one(pool)
    .await
}

pub async fn list_reconciliation_reports(
    pool: &PgPool,
    report_type: Option<&str>,
    chain_id: Option<i64>,
    projection_reconcile_clean: Option<bool>,
    issues_min: Option<i64>,
    limit: i64,
    offset: i64,
) -> Result<Vec<ReconciliationReportListItem>, sqlx::Error> {
    sqlx::query_as::<_, ReconciliationReportListItem>(
        r#"
        SELECT
            id,
            report_type,
            chain_id,
            created_at,
            NULLIF(TRIM(summary #>> '{stats,issues_total}'), '')::bigint AS issues_total,
            (summary #>> '{stats,projection_reconcile_clean}')::boolean AS projection_reconcile_clean,
            NULLIF(TRIM(summary #>> '{stats,orders_with_escrow}'), '')::bigint AS orders_with_escrow,
            NULLIF(TRIM(summary #>> '{stats,projection_rows_chain}'), '')::bigint AS projection_rows_chain,
            NULLIF(TRIM(summary #>> '{stats,matched}'), '')::bigint AS matched,
            NULLIF(TRIM(summary #>> '{stats,missing_projection}'), '')::bigint AS missing_projection,
            NULLIF(TRIM(summary #>> '{stats,status_mismatch}'), '')::bigint AS status_mismatch,
            NULLIF(TRIM(summary #>> '{stats,escrow_mismatch}'), '')::bigint AS escrow_mismatch,
            NULLIF(TRIM(summary #>> '{stats,orphan_projections}'), '')::bigint AS orphan_projections,
            NULLIF(TRIM(summary #>> '{stats,malformed_projection_order_id_bytes}'), '')::bigint AS malformed_projection_order_id_bytes,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,fee_router_routed_events,rows_total}'), '')::bigint AS fee_router_routed_events_rows,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,region_vault_forwarded_events,rows_total}'), '')::bigint AS region_vault_forwarded_events_rows,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,fee_router_routed_events,max_block_number}'), '')::bigint AS fee_router_routed_events_max_block_number,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,fee_router_routed_events,min_block_number}'), '')::bigint AS fee_router_routed_events_min_block_number,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,fee_router_routed_events,latest_inserted_at}'), '') AS fee_router_routed_events_latest_inserted_at,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,region_vault_forwarded_events,max_block_number}'), '')::bigint AS region_vault_forwarded_events_max_block_number,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,region_vault_forwarded_events,min_block_number}'), '')::bigint AS region_vault_forwarded_events_min_block_number,
            NULLIF(TRIM(summary #>> '{economic_projection_row_counts,region_vault_forwarded_events,latest_inserted_at}'), '') AS region_vault_forwarded_events_latest_inserted_at,
            NULLIF(TRIM(summary #>> '{event_log_escrow_coverage,escrow_class_event_rows}'), '')::bigint AS event_log_escrow_class_rows,
            NULLIF(TRIM(summary #>> '{event_log_escrow_coverage,escrow_created_rows}'), '')::bigint AS event_log_escrow_created_rows,
            NULLIF(TRIM(summary #>> '{event_log_escrow_coverage,distinct_escrow_address_from_escrow_created}'), '')::bigint AS event_log_distinct_escrow_from_created
        FROM reconciliation_reports
        WHERE ($1::text IS NULL OR report_type = $1)
          AND ($2::bigint IS NULL OR chain_id = $2)
          AND ($3::boolean IS NULL OR (summary #>> '{stats,projection_reconcile_clean}')::boolean = $3)
          AND (
              $4::bigint IS NULL
              OR COALESCE(NULLIF(TRIM(summary #>> '{stats,issues_total}'), '')::bigint, -1) >= $4
          )
        ORDER BY created_at DESC, id DESC
        LIMIT $5 OFFSET $6
        "#,
    )
    .bind(report_type)
    .bind(chain_id)
    .bind(projection_reconcile_clean)
    .bind(issues_min)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use uuid::Uuid;

    fn empty_list_item() -> ReconciliationReportListItem {
        ReconciliationReportListItem {
            id: Uuid::nil(),
            report_type: String::new(),
            chain_id: None,
            created_at: Utc::now(),
            issues_total: None,
            projection_reconcile_clean: None,
            orders_with_escrow: None,
            projection_rows_chain: None,
            matched: None,
            missing_projection: None,
            status_mismatch: None,
            escrow_mismatch: None,
            orphan_projections: None,
            malformed_projection_order_id_bytes: None,
            fee_router_routed_events_rows: None,
            region_vault_forwarded_events_rows: None,
            fee_router_routed_events_max_block_number: None,
            fee_router_routed_events_min_block_number: None,
            fee_router_routed_events_latest_inserted_at: None,
            region_vault_forwarded_events_max_block_number: None,
            region_vault_forwarded_events_min_block_number: None,
            region_vault_forwarded_events_latest_inserted_at: None,
            event_log_escrow_class_rows: None,
            event_log_escrow_created_rows: None,
            event_log_distinct_escrow_from_created: None,
        }
    }

    #[test]
    fn economic_projection_row_counts_from_list_item_none_when_all_missing() {
        assert!(economic_projection_row_counts_from_list_item(&empty_list_item()).is_none());
    }

    #[test]
    fn economic_projection_row_counts_from_list_item_includes_partial_rows() {
        let mut r = empty_list_item();
        r.fee_router_routed_events_rows = Some(7);
        let v = economic_projection_row_counts_from_list_item(&r).expect("some");
        assert_eq!(v["fee_router_routed_events"]["rows_total"], 7);
        assert!(v["region_vault_forwarded_events"]["rows_total"].is_null());
    }

    #[test]
    fn economic_projection_row_counts_from_list_item_block_only_still_emits() {
        let mut r = empty_list_item();
        r.fee_router_routed_events_max_block_number = Some(99);
        let v = economic_projection_row_counts_from_list_item(&r).expect("some");
        assert_eq!(v["fee_router_routed_events"]["max_block_number"], 99);
        assert!(v["fee_router_routed_events"]["rows_total"].is_null());
    }

    #[test]
    fn event_log_escrow_coverage_from_list_item_none_when_all_missing() {
        assert!(event_log_escrow_coverage_from_list_item(&empty_list_item()).is_none());
    }

    #[test]
    fn event_log_escrow_coverage_from_list_item_partial() {
        let mut r = empty_list_item();
        r.event_log_escrow_created_rows = Some(42);
        let v = event_log_escrow_coverage_from_list_item(&r).expect("some");
        assert_eq!(v["escrow_created_rows"], 42);
        assert!(v["escrow_class_event_rows"].is_null());
    }
}
