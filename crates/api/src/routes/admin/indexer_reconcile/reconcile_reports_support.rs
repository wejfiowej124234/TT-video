//! **`reconciliation_reports`** Query 类型、CSV 行构造、导出分页聚合与 **`report`** JSON 载荷装配。
use serde::Deserialize;
use serde_json::json;

use crate::db;

use super::super::finance_summary::csv_escape_cell;
use super::super::reconcile_export_headers::ADMIN_RECONCILE_EXPORT_ALL_MAX_ROWS;

#[derive(Debug, Deserialize)]
pub struct AdminReconcileReportsQuery {
    #[serde(default = "default_admin_reconcile_reports_limit")]
    pub limit: i64,
    #[serde(default)]
    pub offset: i64,
    #[serde(default)]
    pub report_type: Option<String>,
    /// 精确匹配 **`reconciliation_reports.chain_id`**（与 **`internal/indexer-reconcile`** 持久化一致）
    #[serde(default)]
    pub chain_id: Option<i64>,
    /// 精确匹配 **`summary.stats.projection_reconcile_clean`**（与持久化 JSON 一致）
    #[serde(default)]
    pub projection_reconcile_clean: Option<bool>,
    /// 最小 **`summary.stats.issues_total`**（**`issues_total`** 缺失或非数字时按 **`-1`** 参与比较，故 **`issues_min` > 0** 时不会命中）
    #[serde(default)]
    pub issues_min: Option<i64>,
}

fn default_admin_reconcile_reports_limit() -> i64 {
    30
}

/// 与 **`GET …/indexer/reconcile-reports`**、**`…/export`** 共用筛选与分页上界。
pub(super) fn parse_admin_reconcile_reports_query(
    q: &AdminReconcileReportsQuery,
) -> (
    i64,
    i64,
    Option<String>,
    Option<i64>,
    Option<bool>,
    Option<i64>,
) {
    let limit = q.limit.clamp(1, 100);
    let offset = q.offset.max(0);
    let rt_filter = q.report_type.as_ref().and_then(|s| {
        let t = s.trim();
        if t.is_empty() || t.len() > 200 {
            None
        } else {
            Some(t.to_string())
        }
    });
    let chain_id_filter = q.chain_id;
    let projection_clean_filter = q.projection_reconcile_clean;
    let issues_min_filter = q
        .issues_min
        .filter(|&n| n > 0)
        .map(|n| n.min(1_000_000_000));
    (
        limit,
        offset,
        rt_filter,
        chain_id_filter,
        projection_clean_filter,
        issues_min_filter,
    )
}

pub(crate) fn reconcile_reports_list_to_csv(items: &[db::ReconciliationReportListItem]) -> String {
    use std::fmt::Write;
    let mut buf = String::from(
        "id,report_type,chain_id,created_at,issues_total,projection_reconcile_clean,orders_with_escrow,projection_rows_chain,matched,missing_projection,status_mismatch,escrow_mismatch,orphan_projections,malformed_projection_order_id_bytes,fee_router_routed_events_rows,region_vault_forwarded_events_rows,fee_router_routed_events_max_block_number,fee_router_routed_events_min_block_number,fee_router_routed_events_latest_inserted_at,region_vault_forwarded_events_max_block_number,region_vault_forwarded_events_min_block_number,region_vault_forwarded_events_latest_inserted_at,event_log_escrow_class_rows,event_log_escrow_created_rows,event_log_distinct_escrow_from_created\n",
    );
    for r in items {
        let chain = r.chain_id.map(|c| c.to_string()).unwrap_or_default();
        let issues = r.issues_total.map(|n| n.to_string()).unwrap_or_default();
        let prc = r
            .projection_reconcile_clean
            .map(|b| b.to_string())
            .unwrap_or_default();
        let _ = writeln!(
            buf,
            "{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{},{}",
            csv_escape_cell(&r.id.to_string()),
            csv_escape_cell(&r.report_type),
            csv_escape_cell(&chain),
            csv_escape_cell(&r.created_at.to_rfc3339()),
            csv_escape_cell(&issues),
            csv_escape_cell(&prc),
            csv_escape_cell(
                &r.orders_with_escrow
                    .map(|n| n.to_string())
                    .unwrap_or_default()
            ),
            csv_escape_cell(
                &r.projection_rows_chain
                    .map(|n| n.to_string())
                    .unwrap_or_default()
            ),
            csv_escape_cell(&r.matched.map(|n| n.to_string()).unwrap_or_default()),
            csv_escape_cell(
                &r.missing_projection
                    .map(|n| n.to_string())
                    .unwrap_or_default()
            ),
            csv_escape_cell(&r.status_mismatch.map(|n| n.to_string()).unwrap_or_default()),
            csv_escape_cell(&r.escrow_mismatch.map(|n| n.to_string()).unwrap_or_default()),
            csv_escape_cell(
                &r.orphan_projections
                    .map(|n| n.to_string())
                    .unwrap_or_default()
            ),
            csv_escape_cell(
                &r.malformed_projection_order_id_bytes
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.fee_router_routed_events_rows
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.region_vault_forwarded_events_rows
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.fee_router_routed_events_max_block_number
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.fee_router_routed_events_min_block_number
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                r.fee_router_routed_events_latest_inserted_at
                    .as_deref()
                    .unwrap_or(""),
            ),
            csv_escape_cell(
                &r.region_vault_forwarded_events_max_block_number
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.region_vault_forwarded_events_min_block_number
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                r.region_vault_forwarded_events_latest_inserted_at
                    .as_deref()
                    .unwrap_or(""),
            ),
            csv_escape_cell(
                &r.event_log_escrow_class_rows
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.event_log_escrow_created_rows
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
            csv_escape_cell(
                &r.event_log_distinct_escrow_from_created
                    .map(|n| n.to_string())
                    .unwrap_or_default(),
            ),
        );
    }
    buf
}

/// **`GET …/indexer/reconcile-reports/export`**：`format` 缺省 **`csv`**；**`json`** 为**完整**报告（与 **`…/reconcile-report/:id`** 单条 **`report`** 对象同形，含 **`summary`**），外加 **`page`** 与 **`meta.build`**。
#[derive(Debug, Deserialize)]
pub struct AdminReconcileReportsExportQuery {
    #[serde(flatten)]
    pub filters: AdminReconcileReportsQuery,
    #[serde(default = "default_reconcile_reports_export_format")]
    pub format: String,
    /// **`page`**（缺省）：**`limit`/`offset`** 与列表一致；**`all`** / **`filtered_all`**：忽略 **`offset`**，按 **`limit`** 为页宽拉取**全部**匹配行直至耗尽或达 **`ADMIN_RECONCILE_EXPORT_ALL_MAX_ROWS`**。
    #[serde(default)]
    pub export_scope: Option<String>,
}

fn default_reconcile_reports_export_format() -> String {
    "csv".to_string()
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub(crate) enum ReconcileExportListMode {
    Page,
    AllFiltered,
}

pub(crate) fn parse_reconcile_export_list_mode(
    scope_raw: Option<&String>,
) -> Result<ReconcileExportListMode, &'static str> {
    match scope_raw.map(|s| s.trim().to_ascii_lowercase()).as_deref() {
        None | Some("") | Some("page") => Ok(ReconcileExportListMode::Page),
        Some("all") | Some("filtered_all") => Ok(ReconcileExportListMode::AllFiltered),
        Some(_) => Err("export_scope must be page or all"),
    }
}

pub(super) async fn list_reconciliation_reports_for_export(
    pool: &sqlx::PgPool,
    report_type: Option<&str>,
    chain_id: Option<i64>,
    projection_reconcile_clean: Option<bool>,
    issues_min: Option<i64>,
    page_limit: i64,
    page_offset: i64,
    mode: ReconcileExportListMode,
) -> Result<Vec<db::ReconciliationReportListItem>, sqlx::Error> {
    match mode {
        ReconcileExportListMode::Page => {
            db::list_reconciliation_reports(
                pool,
                report_type,
                chain_id,
                projection_reconcile_clean,
                issues_min,
                page_limit,
                page_offset,
            )
            .await
        }
        ReconcileExportListMode::AllFiltered => {
            let mut all = Vec::new();
            let mut off = 0i64;
            loop {
                let room = ADMIN_RECONCILE_EXPORT_ALL_MAX_ROWS.saturating_sub(all.len() as i64);
                if room == 0 {
                    break;
                };                let chunk = page_limit.min(room);
                let batch = db::list_reconciliation_reports(
                    pool,
                    report_type,
                    chain_id,
                    projection_reconcile_clean,
                    issues_min,
                    chunk,
                    off,
                )
                .await?;
                if batch.is_empty() {
                    break;
                };                let n = batch.len() as i64;
                all.extend(batch);
                if n < chunk {
                    break;
                }
                off += n;
            }
            Ok(all)
        }
    }
}

pub(super) fn reconcile_report_list_stats_breakdown(
    r: &db::ReconciliationReportListItem,
) -> serde_json::Value {
    json!({
        "orders_with_escrow": r.orders_with_escrow,
        "projection_rows_chain": r.projection_rows_chain,
        "matched": r.matched,
        "missing_projection": r.missing_projection,
        "status_mismatch": r.status_mismatch,
        "escrow_mismatch": r.escrow_mismatch,
        "orphan_projections": r.orphan_projections,
        "malformed_projection_order_id_bytes": r.malformed_projection_order_id_bytes,
    })
}

pub(super) fn admin_reconciliation_report_payload(
    row: db::ReconciliationReportRow,
) -> serde_json::Value {
    json!({
        "id": row.id.to_string(),
        "report_type": row.report_type,
        "chain_id": row.chain_id,
        "period_start": row.period_start.map(|t| t.to_rfc3339()),
        "period_end": row.period_end.map(|t| t.to_rfc3339()),
        "summary": row.summary.0,
        "details_path": row.details_path,
        "created_at": row.created_at.to_rfc3339(),
        "state": "stored",
    })
}
