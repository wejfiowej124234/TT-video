"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminAppliedFiltersBanner } from "@/components/admin/AdminAppliedFiltersBanner";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import {
  touchTargetLink44Classes,
  travelFocusRingCoreOffset2Classes,
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

type ReconcileStatsBreakdown = {
  orders_with_escrow?: number | null;
  projection_rows_chain?: number | null;
  matched?: number | null;
  missing_projection?: number | null;
  status_mismatch?: number | null;
  escrow_mismatch?: number | null;
  orphan_projections?: number | null;
  malformed_projection_order_id_bytes?: number | null;
};

type EconomicProjectionSlice = {
  rows_total?: number | null;
  max_block_number?: number | null;
  min_block_number?: number | null;
  latest_inserted_at?: string | null;
};

type EconomicProjectionRowCountsList = {
  fee_router_routed_events?: EconomicProjectionSlice | null;
  region_vault_forwarded_events?: EconomicProjectionSlice | null;
};

/** 与 **`persist` `summary.event_log_escrow_coverage`** / 列表 **`items[].event_log_escrow_coverage`** 同路径 */
type EventLogEscrowCoverageList = {
  escrow_class_event_rows?: number | null;
  escrow_created_rows?: number | null;
  distinct_escrow_address_from_escrow_created?: number | null;
};

type ReconcileReportRow = {
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

type ListRes = {
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

/** 与 `db::reconciliation_reports::REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS` 一致，供 datalist 提示 */
const KNOWN_REPORT_TYPES = ["orders_projection_vs_orders"] as const;

const REPORT_TYPE_MAX_LEN = 200;
const CHAIN_ID_PARAM_MAX_LEN = 24;
const ISSUES_MIN_CAP = 1_000_000_000;
const ISSUES_MIN_INPUT_MAX_LEN = 12;

/** 与 API `limit` clamp 1～100 对齐；变更 limit 时重置为第 1 页以免越界 */
const PAGE_SIZE_PRESETS = [10, 20, 30, 50, 100] as const;

type ProjectionCleanFilter = "" | "true" | "false";

function normalizeProjectionCleanParam(raw: string | null): ProjectionCleanFilter {
  const x = (raw ?? "").trim().toLowerCase();
  if (x === "true" || x === "1") return "true";
  if (x === "false" || x === "0") return "false";
  return "";
}

function normalizeIssuesMinParam(raw: string): string {
  const t = raw.trim();
  if (!/^\d+$/.test(t)) return "";
  const n = Number.parseInt(t, 10);
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.min(ISSUES_MIN_CAP, n));
}

function breakdownNumeric(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** 与 `OrdersProjectionReconcileStats` 字段对齐的紧凑行（无 samples） */
function formatStatsBreakdownOneLine(b: ReconcileStatsBreakdown | undefined | null): string {
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

// Compact line for API `economic_projection_row_counts` (rows + optional max block hint).
function formatEconomicProjectionOneLine(
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

function formatEventLogEscrowCoverageOneLine(
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

function normalizeChainIdParam(raw: string): string {
  const t = raw.trim().slice(0, CHAIN_ID_PARAM_MAX_LEN);
  if (!t) return "";
  if (!/^-?\d+$/.test(t)) return "";
  return t;
}

function limitSelectOptions(current: number): number[] {
  const set = new Set<number>(PAGE_SIZE_PRESETS);
  if (current >= 1 && current <= 100 && !set.has(current)) {
    return [...PAGE_SIZE_PRESETS, current].sort((a, b) => a - b);
  }
  return [...PAGE_SIZE_PRESETS];
}

function parseListQuery(sp: URLSearchParams): {
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

function buildListPath(query: {
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

const RECONCILE_REPORTS_FILTER_FORM_ID = "admin-reconcile-reports-filter-form";

function AdminIndexerReconcileReportsPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const reportTypeInputId = useId();
  const chainIdInputId = useId();
  const projectionCleanSelectId = useId();
  const issuesMinInputId = useId();
  const limitSelectId = useId();
  const datalistId = useId();
  const reconcileReportFilterHintId = useId();
  const reconcileChainFilterHintId = useId();
  const reconcileIssuesMinHintId = useId();
  const reconcileActiveReportTypeDescId = useId();
  const reconcileActiveChainDescId = useId();
  const reconcileActiveCleanDescId = useId();
  const reconcileActiveIssuesMinDescId = useId();
  const adminAppliedFiltersDescId = useId();
  const reconcileReportsExportFilterHintId = useId();
  const adminListApplyResetHintId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { page, limit, offset, reportType, chainIdStr, projectionClean, issuesMinStr } = useMemo(
    () => parseListQuery(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [data, setData] = useState<ListRes | null>(null);
  const [filterDraft, setFilterDraft] = useState(reportType);
  const [chainFilterDraft, setChainFilterDraft] = useState(chainIdStr);
  const [cleanFilterDraft, setCleanFilterDraft] = useState<ProjectionCleanFilter>(projectionClean);
  const [issuesMinDraft, setIssuesMinDraft] = useState(issuesMinStr);
  const [urlCopied, setUrlCopied] = useState(false);
  const copyFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  type ReconcileExportJob = null | "csv" | "json" | "csv_all" | "json_all";
  const [exportingFormat, setExportingFormat] = useState<ReconcileExportJob>(null);
  const [exportError, setExportError] = useState<AdminFetchErrorKind | null>(null);

  useEffect(() => {
    setFilterDraft(reportType);
    setChainFilterDraft(chainIdStr);
    setCleanFilterDraft(projectionClean);
    setIssuesMinDraft(issuesMinStr);
  }, [reportType, chainIdStr, projectionClean, issuesMinStr]);

  useEffect(() => {
    return () => {
      if (copyFlashTimer.current) clearTimeout(copyFlashTimer.current);
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-reconcile-reports-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 handled below
    }

    adminFetchJson<ListRes>(
      "AdminIndexerReconcileReportsPage",
      apiUrl(
        routes.admin.indexerReconcileReports({
          limit,
          offset,
          ...(reportType ? { report_type: reportType } : {}),
          ...(chainIdStr ? { chain_id: chainIdStr } : {}),
          ...(projectionClean === "true" || projectionClean === "false"
            ? { projection_reconcile_clean: projectionClean === "true" }
            : {}),
          ...(issuesMinStr ? { issues_min: Number.parseInt(issuesMinStr, 10) } : {}),
        }),
      ),
      { headers },
    )
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) {
          throw new Error("forbidden");
        }
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setData)
      .catch((e: unknown) => {
        logAdminFetch("AdminIndexerReconcileReportsPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [limit, offset, reportType, chainIdStr, projectionClean, issuesMinStr]);

  const items = data?.items ?? [];
  const meta = data && isAdminMetaRecord(data.meta) ? data.meta : null;
  const afRaw = data?.applied_filters;
  const appliedFilters =
    afRaw != null && typeof afRaw === "object" && !Array.isArray(afRaw)
      ? (afRaw as Record<string, unknown>)
      : null;
  const total = data?.page?.total ?? 0;
  const totalPages = total > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  const rangeFrom = items.length > 0 ? offset + 1 : 0;
  const rangeTo = items.length > 0 ? offset + items.length : 0;
  const limitOptions = useMemo(() => limitSelectOptions(limit), [limit]);

  const listQuery = (nextPage: number, nextLimit: number) =>
    buildListPath({
      page: nextPage,
      limit: nextLimit,
      reportType,
      chainIdStr,
      projectionClean,
      issuesMinStr,
    });

  const hasActiveFilters =
    Boolean(reportType) ||
    Boolean(chainIdStr) ||
    projectionClean === "true" ||
    projectionClean === "false" ||
    Boolean(issuesMinStr);

  const applyFilters = (e?: FormEvent) => {
    e?.preventDefault();
    router.push(
      buildListPath({
        page: 1,
        limit,
        reportType: filterDraft.trim().slice(0, REPORT_TYPE_MAX_LEN),
        chainIdStr: normalizeChainIdParam(chainFilterDraft),
        projectionClean:
          cleanFilterDraft === "true" || cleanFilterDraft === "false" ? cleanFilterDraft : "",
        issuesMinStr: normalizeIssuesMinParam(issuesMinDraft),
      }),
    );
  };

  const resetFilters = () => {
    router.push(
      buildListPath({
        page: 1,
        limit,
        reportType: "",
        chainIdStr: "",
        projectionClean: "",
        issuesMinStr: "",
      }),
    );
  };

  function formatCreatedAt(iso: string): string {
    if (!iso || Number.isNaN(Date.parse(iso))) return iso;
    return new Date(iso).toLocaleString();
  }

  function cleanCellText(row: ReconcileReportRow): string {
    const v = row.projection_reconcile_clean;
    if (v === true) return t("admin_indexer_reconcile_reports_clean_yes");
    if (v === false) return t("admin_indexer_reconcile_reports_clean_no");
    return t("admin_indexer_reconcile_reports_clean_unknown");
  }

  function breakdownTitle(row: ReconcileReportRow): string {
    const b = row.stats_breakdown;
    const legend = t("admin_indexer_reconcile_reports_breakdown_tooltip");
    if (!b || typeof b !== "object") return legend;
    return `${legend}\n\n${JSON.stringify(b, null, 2)}`;
  }

  function economicProjectionTitle(row: ReconcileReportRow): string {
    const legend = t("admin_indexer_reconcile_reports_econ_tooltip");
    const eco = row.economic_projection_row_counts;
    if (!eco || typeof eco !== "object") return legend;
    return `${legend}\n\n${JSON.stringify(eco, null, 2)}`;
  }

  function eventLogEscrowTitle(row: ReconcileReportRow): string {
    const legend = t("admin_indexer_reconcile_reports_event_log_tooltip");
    const ev = row.event_log_escrow_coverage;
    if (!ev || typeof ev !== "object") return legend;
    return `${legend}\n\n${JSON.stringify(ev, null, 2)}`;
  }

  async function downloadReconcileReportsExport(format: "csv" | "json", scope: "page" | "all" = "page") {
    const job: NonNullable<ReconcileExportJob> =
      scope === "all" ? (format === "json" ? "json_all" : "csv_all") : format;
    setExportError(null);
    setExportingFormat(job);
    try {
      const headers: Record<string, string> = {
        "x-request-id": `admin-reconcile-reports-${job}-${Date.now()}`,
      };
      Object.assign(headers, getAuthHeaders());
      const url = apiUrl(
        routes.admin.indexerReconcileReportsExport({
          format,
          ...(scope === "all" ? { exportScope: "all" as const } : {}),
          limit,
          ...(scope === "page" ? { offset } : {}),
          ...(reportType ? { report_type: reportType } : {}),
          ...(chainIdStr ? { chain_id: chainIdStr } : {}),
          ...(projectionClean === "true" || projectionClean === "false"
            ? { projection_reconcile_clean: projectionClean === "true" }
            : {}),
          ...(issuesMinStr ? { issues_min: Number.parseInt(issuesMinStr, 10) } : {}),
        }),
      );
      const res = await fetch(url, { headers });
      if (!res.ok) {
        let msg = `request_failed_${res.status}`;
        try {
          const j = (await res.json()) as { message?: string; error?: string };
          if (typeof j.message === "string" && j.message.trim()) msg = j.message.trim();
          else if (typeof j.error === "string" && j.error.trim()) msg = j.error.trim();
        } catch {
          /* ignore non-JSON */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disp = res.headers.get("Content-Disposition");
      const m = disp?.match(/filename="([^"]+)"/);
      a.href = blobUrl;
      a.download =
        m?.[1] ?? (format === "json" ? "reconcile-reports.json" : "reconcile-reports.csv");
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e: unknown) {
      logAdminFetch("AdminIndexerReconcileReportsExport", e);
      setExportError(adminFetchErrorKind(e));
    } finally {
      setExportingFormat(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_indexer_reconcile_reports_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_indexer_reconcile_reports_subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p id={reconcileReportsExportFilterHintId} className="basis-full text-meta text-ink-600 leading-relaxed">
            {t("admin_indexer_reconcile_reports_export_filter_hint")}
          </p>
          <form
            className="inline"
            aria-describedby={reconcileReportsExportFilterHintId}
            onSubmit={(e) => {
              e.preventDefault();
              void downloadReconcileReportsExport("csv");
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-white`}
              disabled={loading || exportingFormat !== null}
              aria-label={t("admin_indexer_reconcile_reports_export_csv_aria")}
            >
              {exportingFormat === "csv"
                ? t("admin_indexer_reconcile_reports_exporting")
                : t("admin_indexer_reconcile_reports_export_csv")}
            </button>
          </form>
          <form
            className="inline"
            aria-describedby={reconcileReportsExportFilterHintId}
            onSubmit={(e) => {
              e.preventDefault();
              void downloadReconcileReportsExport("json");
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-white`}
              disabled={loading || exportingFormat !== null}
              aria-label={t("admin_indexer_reconcile_reports_export_json_aria")}
            >
              {exportingFormat === "json"
                ? t("admin_indexer_reconcile_reports_exporting")
                : t("admin_indexer_reconcile_reports_export_json")}
            </button>
          </form>
          <form
            className="inline"
            aria-describedby={reconcileReportsExportFilterHintId}
            onSubmit={(e) => {
              e.preventDefault();
              void downloadReconcileReportsExport("csv", "all");
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 bg-bg-console/40 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              disabled={loading || exportingFormat !== null}
              aria-label={t("admin_indexer_reconcile_reports_export_all_csv_aria")}
            >
              {exportingFormat === "csv_all"
                ? t("admin_indexer_reconcile_reports_exporting")
                : t("admin_indexer_reconcile_reports_export_all_csv")}
            </button>
          </form>
          <form
            className="inline"
            aria-describedby={reconcileReportsExportFilterHintId}
            onSubmit={(e) => {
              e.preventDefault();
              void downloadReconcileReportsExport("json", "all");
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 bg-bg-console/40 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              disabled={loading || exportingFormat !== null}
              aria-label={t("admin_indexer_reconcile_reports_export_all_json_aria")}
            >
              {exportingFormat === "json_all"
                ? t("admin_indexer_reconcile_reports_exporting")
                : t("admin_indexer_reconcile_reports_export_all_json")}
            </button>
          </form>
          <form
            className="inline"
            aria-describedby={reconcileReportsExportFilterHintId}
            onSubmit={async (e) => {
              e.preventDefault();
              if (typeof window === "undefined" || !navigator.clipboard?.writeText) return;
              try {
                await navigator.clipboard.writeText(window.location.href);
                setUrlCopied(true);
                if (copyFlashTimer.current) clearTimeout(copyFlashTimer.current);
                copyFlashTimer.current = setTimeout(() => setUrlCopied(false), 2000);
              } catch {
                setUrlCopied(false);
              }
            }}
          >
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
            >
              {urlCopied ? t("admin_indexer_reconcile_reports_copied") : t("admin_indexer_reconcile_reports_copy_url")}
            </button>
          </form>
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link
            href="/admin/indexer"
            className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_indexer_reconcile_reports_back")}
          </Link>
        </div>
      </header>

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {exportError && (
        <p className="mt-4 rounded-[var(--radius-md)] border border-warning/25 bg-warning/10 p-3 text-body text-ink-800" role="alert">
          {adminErrorUserText(exportError, t)}
        </p>
      )}

      <div className="mt-5 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4">
        <form
          id={RECONCILE_REPORTS_FILTER_FORM_ID}
          className="space-y-3"
          aria-label={t("admin_indexer_reconcile_reports_filters_aria")}
          aria-describedby={
            [
              adminListApplyResetHintId,
              reconcileReportFilterHintId,
              reconcileChainFilterHintId,
              reconcileIssuesMinHintId,
              reportType ? reconcileActiveReportTypeDescId : "",
              chainIdStr ? reconcileActiveChainDescId : "",
              projectionClean === "true" || projectionClean === "false" ? reconcileActiveCleanDescId : "",
              issuesMinStr ? reconcileActiveIssuesMinDescId : "",
              !loading && !error && appliedFilters ? adminAppliedFiltersDescId : "",
            ]
              .filter(Boolean)
              .join(" ")
          }
          onSubmit={applyFilters}
        >
          <p className="text-small font-medium text-ink-800">{t("admin_indexer_reconcile_reports_filters_heading")}</p>
          <p id={adminListApplyResetHintId} className="text-meta text-ink-600 leading-relaxed">
            {t("admin_list_filters_apply_reset_hint")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor={reportTypeInputId} className="block text-small font-medium text-ink-600">
            {t("admin_indexer_reconcile_reports_filter_label")}
          </label>
          <input
            id={reportTypeInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 font-mono text-small text-ink-900 ${travelFocusRingCoreOffset2WhiteClasses}`}
            name="report_type"
            list={datalistId}
            maxLength={REPORT_TYPE_MAX_LEN}
            value={filterDraft}
            onChange={(e) => setFilterDraft(e.target.value.slice(0, REPORT_TYPE_MAX_LEN))}
            placeholder={t("admin_indexer_reconcile_reports_filter_placeholder")}
            autoComplete="off"
          />
          <datalist id={datalistId}>
            {KNOWN_REPORT_TYPES.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
          <p id={reconcileReportFilterHintId} className="mt-1 text-meta text-ink-500">
            {t("admin_indexer_reconcile_reports_filter_hint")}
          </p>
        </div>
        <div className="min-w-[10rem] flex-1 sm:max-w-[14rem]">
          <label htmlFor={chainIdInputId} className="block text-small font-medium text-ink-600">
            {t("admin_indexer_reconcile_reports_chain_filter_label")}
          </label>
          <input
            id={chainIdInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 font-mono text-small text-ink-900 ${travelFocusRingCoreOffset2WhiteClasses}`}
            name="chain_id"
            inputMode="numeric"
            maxLength={CHAIN_ID_PARAM_MAX_LEN}
            value={chainFilterDraft}
            onChange={(e) => setChainFilterDraft(e.target.value.slice(0, CHAIN_ID_PARAM_MAX_LEN))}
            placeholder="e.g. 31337"
            autoComplete="off"
          />
          <p id={reconcileChainFilterHintId} className="mt-1 text-meta text-ink-500">
            {t("admin_indexer_reconcile_reports_chain_filter_hint")}
          </p>
        </div>
        <div className="min-w-[11rem] flex-1 sm:max-w-[16rem]">
          <label htmlFor={projectionCleanSelectId} className="block text-small font-medium text-ink-600">
            {t("admin_indexer_reconcile_reports_clean_filter_label")}
          </label>
          <select
            id={projectionCleanSelectId}
            className={`mt-1 inline-flex w-full min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small text-ink-900 ${travelFocusRingCoreOffset2WhiteClasses}`}
            value={cleanFilterDraft}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "true" || v === "false" || v === "") setCleanFilterDraft(v);
            }}
          >
            <option value="">{t("admin_indexer_reconcile_reports_clean_filter_any")}</option>
            <option value="true">{t("admin_indexer_reconcile_reports_clean_filter_yes")}</option>
            <option value="false">{t("admin_indexer_reconcile_reports_clean_filter_no")}</option>
          </select>
        </div>
        <div className="min-w-[9rem] flex-1 sm:max-w-[12rem]">
          <label htmlFor={issuesMinInputId} className="block text-small font-medium text-ink-600">
            {t("admin_indexer_reconcile_reports_issues_min_label")}
          </label>
          <input
            id={issuesMinInputId}
            className={`mt-1 w-full min-h-[44px] rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 font-mono text-small text-ink-900 ${travelFocusRingCoreOffset2WhiteClasses}`}
            name="issues_min"
            inputMode="numeric"
            maxLength={ISSUES_MIN_INPUT_MAX_LEN}
            value={issuesMinDraft}
            onChange={(e) => setIssuesMinDraft(e.target.value.replace(/\D/g, "").slice(0, ISSUES_MIN_INPUT_MAX_LEN))}
            placeholder="≥ 1"
            autoComplete="off"
          />
          <p id={reconcileIssuesMinHintId} className="mt-1 text-meta text-ink-500">
            {t("admin_indexer_reconcile_reports_issues_min_hint")}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor={limitSelectId} className="block text-small font-medium text-ink-600">
            {t("admin_indexer_reconcile_reports_per_page_label")}
          </label>
          <select
            id={limitSelectId}
            className={`mt-1 inline-flex w-full min-h-[44px] min-w-[7rem] items-center justify-start rounded-[var(--radius-sm)] border border-ink-300 bg-white px-3 py-2 text-small text-ink-900 sm:w-auto ${travelFocusRingCoreOffset2WhiteClasses}`}
            value={limit}
            onChange={(e) => {
              const next = Number.parseInt(e.target.value, 10);
              if (!Number.isFinite(next)) return;
              router.push(
                buildListPath({
                  page: 1,
                  limit: next,
                  reportType,
                  chainIdStr,
                  projectionClean,
                  issuesMinStr,
                }),
              );
            }}
          >
            {limitOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
          </div>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            form={RECONCILE_REPORTS_FILTER_FORM_ID}
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] bg-travel-500 px-4 py-2 text-small font-medium text-white hover:bg-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
          >
            {t("admin_indexer_reconcile_reports_filter_apply")}
          </button>
          {hasActiveFilters ? (
            <form
              className="inline"
              aria-describedby={adminListApplyResetHintId}
              onSubmit={(e) => {
                e.preventDefault();
                resetFilters();
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-4 py-2 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_indexer_reconcile_reports_filter_clear")}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      {reportType ? (
        <p id={reconcileActiveReportTypeDescId} className="mt-2 text-meta text-ink-600">
          {t("admin_indexer_reconcile_reports_active_filter").replace("{type}", reportType)}
        </p>
      ) : null}
      {chainIdStr ? (
        <p id={reconcileActiveChainDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_indexer_reconcile_reports_active_chain").replace("{id}", chainIdStr)}
        </p>
      ) : null}
      {projectionClean === "true" || projectionClean === "false" ? (
        <p id={reconcileActiveCleanDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_indexer_reconcile_reports_active_clean").replace(
            "{v}",
            projectionClean === "true"
              ? t("admin_indexer_reconcile_reports_clean_filter_yes")
              : t("admin_indexer_reconcile_reports_clean_filter_no"),
          )}
        </p>
      ) : null}
      {issuesMinStr ? (
        <p id={reconcileActiveIssuesMinDescId} className="mt-1 text-meta text-ink-600">
          {t("admin_indexer_reconcile_reports_active_issues_min").replace("{n}", issuesMinStr)}
        </p>
      ) : null}
      {!loading && !error && appliedFilters ? (
        <AdminAppliedFiltersBanner id={adminAppliedFiltersDescId} variant="card" className="mt-6">
          {t("admin_indexer_reconcile_reports_applied")}: {JSON.stringify(appliedFilters)}
        </AdminAppliedFiltersBanner>
      ) : null}

      <section
        className="mt-6 overflow-x-auto rounded-[var(--radius-xl)] border border-ink-200 bg-white shadow-soft"
        aria-label={t("admin_indexer_reconcile_reports_page_aria")}
      >
        {loading ? (
          <p className="p-4 text-body text-ink-600" role="status">
            {t("admin_indexer_reconcile_reports_loading")}
          </p>
        ) : error ? (
          <p className="p-4 text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : items.length === 0 && total === 0 ? (
          <p className="p-4 text-body text-ink-600" role="status">
            {t("admin_indexer_reconcile_reports_empty")}
          </p>
        ) : items.length === 0 && total > 0 ? (
          <div className="p-4 text-body text-ink-700" role="status">
            <p>{t("admin_indexer_reconcile_reports_empty_page")}</p>
            <Link
              href={listQuery(1, limit)}
              className={`mt-2 ${touchTargetLink44Classes} text-travel-600 hover:underline rounded-[var(--radius-sm)] ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              {t("admin_indexer_reconcile_reports_first_page")}
            </Link>
          </div>
        ) : (
          <table className="min-w-full border-collapse text-left text-body">
            <thead>
              <tr className="border-b border-ink-200 bg-bg-console text-small font-semibold uppercase tracking-wide text-ink-500">
                <th className="px-3 py-2">{t("admin_indexer_reconcile_reports_colId")}</th>
                <th className="px-3 py-2">{t("admin_indexer_reconcile_reports_colType")}</th>
                <th className="px-3 py-2">{t("admin_indexer_reconcile_reports_colChain")}</th>
                <th className="px-3 py-2">{t("admin_indexer_reconcile_reports_colIssues")}</th>
                <th className="px-3 py-2">{t("admin_indexer_reconcile_reports_colClean")}</th>
                <th className="px-3 py-2">{t("admin_indexer_reconcile_reports_colBreakdown")}</th>
                <th className="px-3 py-2">{t("admin_indexer_reconcile_reports_colEcon")}</th>
                <th className="px-3 py-2">{t("admin_indexer_reconcile_reports_colEventLogEscrow")}</th>
                <th className="px-3 py-2">{t("admin_indexer_reconcile_reports_colCreated")}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-ink-100">
                  <td className="max-w-[14rem] truncate px-3 py-2 font-mono text-meta text-ink-800" title={row.id}>
                    {row.id}
                  </td>
                  <td className="px-3 py-2 text-ink-800">{row.report_type}</td>
                  <td className="px-3 py-2 font-mono text-meta text-ink-700">
                    {row.chain_id != null ? String(row.chain_id) : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-meta text-ink-800">
                    {row.issues_total != null ? String(row.issues_total) : "—"}
                  </td>
                  <td className="px-3 py-2 text-meta text-ink-700">{cleanCellText(row)}</td>
                  <td
                    className="max-w-[18rem] truncate px-3 py-2 font-mono text-meta text-ink-700"
                    title={breakdownTitle(row)}
                  >
                    {formatStatsBreakdownOneLine(row.stats_breakdown ?? undefined) || "—"}
                  </td>
                  <td
                    className="max-w-[12rem] truncate px-3 py-2 font-mono text-meta text-ink-700"
                    title={economicProjectionTitle(row)}
                  >
                    {formatEconomicProjectionOneLine(row.economic_projection_row_counts ?? undefined) || "—"}
                  </td>
                  <td
                    className="max-w-[11rem] truncate px-3 py-2 font-mono text-meta text-ink-700"
                    title={eventLogEscrowTitle(row)}
                  >
                    {formatEventLogEscrowCoverageOneLine(row.event_log_escrow_coverage ?? undefined) || "—"}
                  </td>
                  <td className="px-3 py-2 text-meta text-ink-600">{formatCreatedAt(row.created_at)}</td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/indexer/reconcile/${encodeURIComponent(row.id)}`}
                      className={`${touchTargetLink44Classes} text-travel-600 hover:underline rounded-[var(--radius-sm)] ${travelFocusRingCoreOffset2WhiteClasses}`}
                    >
                      {t("admin_indexer_reconcile_reports_open")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {!loading && !error && total > 0 ? (
        <nav
          className="mt-4 flex flex-wrap items-center justify-between gap-3 text-body text-ink-700"
          aria-label={t("admin_indexer_reconcile_reports_pagination_aria")}
        >
          <p className="text-meta text-ink-600">
            {t("admin_indexer_reconcile_reports_range")
              .replace("{from}", String(rangeFrom))
              .replace("{to}", String(rangeTo))
              .replace("{total}", String(total))}
            {" · "}
            {t("admin_indexer_reconcile_reports_page_of")
              .replace("{page}", String(page))
              .replace("{pages}", String(totalPages))}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
                className={`inline-flex min-h-[44px] items-center justify-start rounded-[var(--radius-sm)] border border-ink-300 bg-white px-2 py-1.5 text-small text-ink-900 ${travelFocusRingCoreOffset2WhiteClasses}`}
                value={limit}
                aria-label={t("admin_indexer_reconcile_reports_per_page_label")}
                title={t("admin_indexer_reconcile_reports_per_page_label")}
                onChange={(e) => {
                  const next = Number.parseInt(e.target.value, 10);
                  if (!Number.isFinite(next)) return;
                  router.push(
                    buildListPath({
                      page: 1,
                      limit: next,
                      reportType,
                      chainIdStr,
                      projectionClean,
                      issuesMinStr,
                    }),
                  );
                }}
              >
                {limitOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
            </select>
            {page > 1 ? (
              <Link
                href={listQuery(page - 1, limit)}
                className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_indexer_reconcile_reports_prev")}
              </Link>
            ) : (
              <span className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-100 px-3 py-1.5 text-small text-ink-400">
                {t("admin_indexer_reconcile_reports_prev")}
              </span>
            )}
            {page < totalPages ? (
              <Link
                href={listQuery(page + 1, limit)}
                className={`${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ink-300 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              >
                {t("admin_indexer_reconcile_reports_next")}
              </Link>
            ) : (
              <span className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ink-100 px-3 py-1.5 text-small text-ink-400">
                {t("admin_indexer_reconcile_reports_next")}
              </span>
            )}
          </div>
        </nav>
      ) : null}
    </main>
  );
}

export default function AdminIndexerReconcileReportsPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_indexer_reconcile_reports_title">
      <AdminIndexerReconcileReportsPageInner />
    </AdminSearchParamsSuspense>
  );
}

