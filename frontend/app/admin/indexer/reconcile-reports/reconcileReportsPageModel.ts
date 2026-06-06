/** Types, URL/query helpers, and display formatters for the indexer reconcile-reports admin list page. */

export type ReconcileStatsBreakdown = {
  orders_with_escrow?: number | null;
  projection_rows_chain?: number | null;
  matched?: number | null;
  missing_projection?: number | null;
  status_mismatch?: number | null;
  escrow_mismatch?: number | null;
  orphan_projections?: number | null;
  malformed_projection_order_id_bytes?: number | null;
};

export type EconomicProjectionSlice = {
  rows_total?: number | null;
  max_block_number?: number | null;
  min_block_number?: number | null;
  latest_inserted_at?: string | null;
};

export type EconomicProjectionRowCountsList = {
  fee_router_routed_events?: EconomicProjectionSlice | null;
  region_vault_forwarded_events?: EconomicProjectionSlice | null;
};

/** Same path as **`persist` `summary.event_log_escrow_coverage`** / list **`items[].event_log_escrow_coverage`**. */
export type EventLogEscrowCoverageList = {
  escrow_class_event_rows?: number | null;
  escrow_created_rows?: number | null;
  distinct_escrow_address_from_escrow_created?: number | null;
};

export type ReconcileReportRow = {
  id: string;
  report_type: string;
  chain_id: number | null;
  created_at: string;
  issues_total?: number | null;
  projection_reconcile_clean?: boolean | null;
  stats_breakdown?: ReconcileStatsBreakdown | null;
  economic_projection_row_counts?: EconomicProjectionRowCountsList | null;
  event_log_escrow_coverage?: EventLogEscrowCoverageList | null;
};

/** Export job label for header/disable wiring (`null` = idle). */
export type ReconcileExportJob = null | "csv" | "json" | "csv_all" | "json_all";

/** Stashed in list-fetch meta by `useAdminIndexerReconcileReportsPage`. */
export const ADMIN_RECONCILE_PAGE_META_KEY = "__adminReconcilePage";

export type ListRes = {
  status?: string;
  error?: string;
  meta?: unknown;
  applied_filters?: Record<string, unknown>;
  page?: {
    limit: number;
    offset: number;
    total: number;
    report_type?: string | null;
    chain_id?: number | null;
    projection_reconcile_clean?: boolean | null;
    issues_min?: number | null;
  };
  items?: ReconcileReportRow[];
};

/** Matches `db::reconciliation_reports::REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS` for datalist hints. */
export const KNOWN_REPORT_TYPES = ["orders_projection_vs_orders"] as const;

export const REPORT_TYPE_MAX_LEN = 200;
export const CHAIN_ID_PARAM_MAX_LEN = 24;
export const ISSUES_MIN_CAP = 1_000_000_000;
export const ISSUES_MIN_INPUT_MAX_LEN = 12;

/** Aligned with API `limit` clamp 1–100; changing limit resets to page 1 to avoid out-of-range. */
const PAGE_SIZE_PRESETS = [10, 20, 30, 50, 100] as const;

export type ProjectionCleanFilter = "" | "true" | "false";

export function normalizeProjectionCleanParam(raw: string | null): ProjectionCleanFilter {
  const x = (raw ?? "").trim().toLowerCase();
  if (x === "true" || x === "1") return "true";
  if (x === "false" || x === "0") return "false";
  return "";
}

export function normalizeIssuesMinParam(raw: string): string {
  const t = raw.trim();
  if (!/^\d+$/.test(t)) return "";
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.min(ISSUES_MIN_CAP, n));
}

function breakdownNumeric(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Compact line aligned with `OrdersProjectionReconcileStats` (no samples). */
export function formatStatsBreakdownOneLine(b: ReconcileStatsBreakdown | undefined | null): string {
  if (!b || typeof b !== "object") return "";
  const parts: string[] = [];
  const push = (label: string, v: unknown) => {
    const n = breakdownNumeric(v);
    if (n !== null) parts.push(`${label}:${n}`);
  };
  push("ow", b.orders_with_escrow);
  push("pr", b.projection_rows_chain);
  push("ok", b.matched);
  push("miss", b.missing_projection);
  push("st", b.status_mismatch);
  push("esc", b.escrow_mismatch);
  push("orph", b.orphan_projections);
  push("mal", b.malformed_projection_order_id_bytes);
  return parts.join(" ");
}

export function formatEconomicProjectionOneLine(
  eco: EconomicProjectionRowCountsList | undefined | null,
): string {
  if (!eco || typeof eco !== "object") return "";
  const frSlice = eco.fee_router_routed_events;
  const rvSlice = eco.region_vault_forwarded_events;
  const fr = breakdownNumeric(frSlice?.rows_total);
  const frMx = breakdownNumeric(frSlice?.max_block_number);
  const rv = breakdownNumeric(rvSlice?.rows_total);
  const rvMx = breakdownNumeric(rvSlice?.max_block_number);
  const parts: string[] = [];
  if (fr !== null) {
    parts.push(frMx !== null ? `FR:${fr}↑${frMx}` : `FR:${fr}`);
  } else if (frMx !== null) {
    parts.push(`FR:↑${frMx}`);
  }
  if (rv !== null) {
    parts.push(rvMx !== null ? `RV:${rv}↑${rvMx}` : `RV:${rv}`);
  } else if (rvMx !== null) {
    parts.push(`RV:↑${rvMx}`);
  }
  return parts.join(" ");
}

export function formatEventLogEscrowCoverageOneLine(
  ev: EventLogEscrowCoverageList | undefined | null,
): string {
  if (!ev || typeof ev !== "object") return "";
  const cls = breakdownNumeric(ev.escrow_class_event_rows);
  const crt = breakdownNumeric(ev.escrow_created_rows);
  const dst = breakdownNumeric(ev.distinct_escrow_address_from_escrow_created);
  const parts: string[] = [];
  if (cls !== null) parts.push(`cls:${cls}`);
  if (crt !== null) parts.push(`crt:${crt}`);
  if (dst !== null) parts.push(`dst:${dst}`);
  return parts.join(" ");
}

export function normalizeChainIdParam(raw: string): string {
  const t = raw.trim().slice(0, CHAIN_ID_PARAM_MAX_LEN);
  if (!t) return "";
  if (!/^-?\d+$/.test(t)) return "";
  return t;
}

export function limitSelectOptions(current: number): number[] {
  const set = new Set<number>(PAGE_SIZE_PRESETS);
  if (current >= 1 && current <= 100 && !set.has(current)) {
    return [...PAGE_SIZE_PRESETS, current].sort((a, b) => a - b);
  }
  return [...PAGE_SIZE_PRESETS];
}

export function parseListQuery(sp: URLSearchParams): {
  page: number;
  limit: number;
  offset: number;
  reportType: string;
  chainIdStr: string;
  projectionClean: ProjectionCleanFilter;
  issuesMinStr: string;
} {
  let limit = Number.parseInt(sp.get("limit") ?? "30", 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 30;
  limit = Math.min(100, Math.floor(limit));
  let page = Number.parseInt(sp.get("page") ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;
  page = Math.floor(page);
  const rawRt = sp.get("report_type") ?? "";
  const reportType = rawRt.trim().slice(0, REPORT_TYPE_MAX_LEN);
  const chainIdStr = normalizeChainIdParam(sp.get("chain_id") ?? "");
  const projectionClean = normalizeProjectionCleanParam(sp.get("projection_reconcile_clean"));
  const issuesMinStr = normalizeIssuesMinParam(sp.get("issues_min") ?? "");
  return {
    page,
    limit,
    offset: (page - 1) * limit,
    reportType,
    chainIdStr,
    projectionClean,
    issuesMinStr,
  };
}

export function buildListPath(query: {
  page: number;
  limit: number;
  reportType: string;
  chainIdStr: string;
  projectionClean: ProjectionCleanFilter;
  issuesMinStr: string;
}): string {
  const sp = new URLSearchParams();
  sp.set("page", String(query.page));
  sp.set("limit", String(query.limit));
  const rt = query.reportType.trim().slice(0, REPORT_TYPE_MAX_LEN);
  if (rt) sp.set("report_type", rt);
  const cid = normalizeChainIdParam(query.chainIdStr);
  if (cid) sp.set("chain_id", cid);
  if (query.projectionClean === "true" || query.projectionClean === "false") {
    sp.set("projection_reconcile_clean", query.projectionClean);
  }
  const im = normalizeIssuesMinParam(query.issuesMinStr);
  if (im) sp.set("issues_min", im);
  return `/admin/indexer/reconcile-reports?${sp.toString()}`;
}

export const RECONCILE_REPORTS_FILTER_FORM_ID = "admin-reconcile-reports-filter-form";
