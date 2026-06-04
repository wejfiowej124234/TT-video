import type { ReconcileReportRow } from "./reconcileReportsPageModel";

type TFn = (key: string) => string;

export function formatReconcileReportCreatedAt(iso: string): string {
  if (!iso || Number.isNaN(Date.parse(iso))) return iso;
  return new Date(iso).toLocaleString();
}

export function reconcileReportCleanCellText(row: ReconcileReportRow, t: TFn): string {
  const v = row.projection_reconcile_clean;
  if (v === true) return t("admin_indexer_reconcile_reports_clean_yes");
  if (v === false) return t("admin_indexer_reconcile_reports_clean_no");
  return t("admin_indexer_reconcile_reports_clean_unknown");
}

export function reconcileReportBreakdownTitle(row: ReconcileReportRow, t: TFn): string {
  const b = row.stats_breakdown;
  const legend = t("admin_indexer_reconcile_reports_breakdown_tooltip");
  if (!b || typeof b !== "object") return legend;
  return `${legend}\n\n${JSON.stringify(b, null, 2)}`;
}

export function reconcileReportEconomicProjectionTitle(row: ReconcileReportRow, t: TFn): string {
  const legend = t("admin_indexer_reconcile_reports_econ_tooltip");
  const eco = row.economic_projection_row_counts;
  if (!eco || typeof eco !== "object") return legend;
  return `${legend}\n\n${JSON.stringify(eco, null, 2)}`;
}

export function reconcileReportEventLogEscrowTitle(row: ReconcileReportRow, t: TFn): string {
  const legend = t("admin_indexer_reconcile_reports_event_log_tooltip");
  const ev = row.event_log_escrow_coverage;
  if (!ev || typeof ev !== "object") return legend;
  return `${legend}\n\n${JSON.stringify(ev, null, 2)}`;
}
