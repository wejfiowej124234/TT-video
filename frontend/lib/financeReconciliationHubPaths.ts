/**
 * Epic E-05 / E-08：`/admin/finance-reconciliation` 对 `GET …/admin/finance/summary` 的 JSON 路径清单。
 * 变更页展示列时须同步本文件与 `financeReconciliationHub.contract.test.ts`。
 */
export const FINANCE_RECONCILIATION_HUB_META_SCALAR_KEYS = [
  "generated_at",
  "source",
  "db_order_count",
  "db_orders_with_escrow_count",
  "orders_projection_reconcile_report_count",
  "reconciliation_reports_total_count",
  "reconciliation_reports_with_open_issues_count",
  "reconciliation_reports_projection_unclean_count",
  "reconciliation_reports_projection_clean_count",
] as const;

export const FINANCE_RECONCILIATION_HUB_SUMMARY_SCALAR_KEYS = [
  "order_count",
  "dispute_count",
  "orders_with_escrow_address_count",
  "orders_amount_parse_error_count",
] as const;

export const FINANCE_RECONCILIATION_HUB_LAST_STORED_KEYS = [
  "report_id",
  "report_type",
  "created_at",
  "chain_id",
  "projection_reconcile_clean",
  "issues_total",
] as const;

/** 嵌套在 `meta` 下的对象键名（本页 `pathRows` 前缀）。 */
export const FINANCE_RECONCILIATION_HUB_LAST_STORED_META_KEY =
  "last_stored_orders_projection_reconcile" as const;
