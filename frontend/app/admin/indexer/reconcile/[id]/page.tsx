"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminSearchParamsSuspense } from "@/components/admin/AdminSearchParamsSuspense";
import { AdminMetaBuildSection, AdminMetaNoteLink, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import { getAuthHeaders } from "@/lib/apiClient";
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="mt-1 max-h-[min(28rem,70vh)] overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function formatDigestEconomicLine(eco: unknown): string {
  if (!eco || typeof eco !== "object") return "";
  const o = eco as Record<string, unknown>;
  const frRaw = o.fee_router_routed_events;
  const rvRaw = o.region_vault_forwarded_events;
  const fr = frRaw && typeof frRaw === "object" ? (frRaw as Record<string, unknown>) : null;
  const rv = rvRaw && typeof rvRaw === "object" ? (rvRaw as Record<string, unknown>) : null;
  const frN = typeof fr?.rows_total === "number" && Number.isFinite(fr.rows_total) ? fr.rows_total : null;
  const frMx =
    typeof fr?.max_block_number === "number" && Number.isFinite(fr.max_block_number)
      ? fr.max_block_number
      : null;
  const rvN = typeof rv?.rows_total === "number" && Number.isFinite(rv.rows_total) ? rv.rows_total : null;
  const rvMx =
    typeof rv?.max_block_number === "number" && Number.isFinite(rv.max_block_number)
      ? rv.max_block_number
      : null;
  const parts: string[] = [];
  if (frN !== null) {
    parts.push(frMx !== null ? `FR:${frN}↑${frMx}` : `FR:${frN}`);
  } else if (frMx !== null) {
    parts.push(`FR:↑${frMx}`);
  }
  if (rvN !== null) {
    parts.push(rvMx !== null ? `RV:${rvN}↑${rvMx}` : `RV:${rvN}`);
  } else if (rvMx !== null) {
    parts.push(`RV:↑${rvMx}`);
  }
  return parts.join(" ");
}

function formatDigestEventLogLine(ev: unknown): string {
  if (!ev || typeof ev !== "object") return "";
  const o = ev as Record<string, unknown>;
  const cls =
    typeof o.escrow_class_event_rows === "number" && Number.isFinite(o.escrow_class_event_rows)
      ? o.escrow_class_event_rows
      : null;
  const crt =
    typeof o.escrow_created_rows === "number" && Number.isFinite(o.escrow_created_rows)
      ? o.escrow_created_rows
      : null;
  const dst =
    typeof o.distinct_escrow_address_from_escrow_created === "number" &&
    Number.isFinite(o.distinct_escrow_address_from_escrow_created)
      ? o.distinct_escrow_address_from_escrow_created
      : null;
  const parts: string[] = [];
  if (cls !== null) parts.push(`cls:${cls}`);
  if (crt !== null) parts.push(`crt:${crt}`);
  if (dst !== null) parts.push(`dst:${dst}`);
  return parts.join(" ");
}

function formatDigestChainLine(co: unknown): string {
  if (!co || typeof co !== "object") return "";
  const o = co as Record<string, unknown>;
  if (o.ok === false && typeof o.error === "string" && o.error.trim()) {
    const err = o.error.trim();
    return `ok:false ${err.length > 96 ? `${err.slice(0, 96)}…` : err}`;
  }
  const tip =
    typeof o.eth_chain_tip_block_number === "number" && Number.isFinite(o.eth_chain_tip_block_number)
      ? o.eth_chain_tip_block_number
      : null;
  const ub =
    typeof o.indexer_finalized_upper_bound === "number" && Number.isFinite(o.indexer_finalized_upper_bound)
      ? o.indexer_finalized_upper_bound
      : null;
  const parts: string[] = [];
  if (tip !== null) parts.push(`tip:${tip}`);
  if (ub !== null) parts.push(`final≤${ub}`);
  return parts.join(" ");
}

function StoredReportSummaryDigest({
  report,
  t,
}: {
  report: Record<string, unknown>;
  t: (key: string) => string;
}) {
  const summary = report.summary;
  if (!summary || typeof summary !== "object") return null;
  const s = summary as Record<string, unknown>;
  const stats = s.stats && typeof s.stats === "object" ? (s.stats as Record<string, unknown>) : null;
  const rawClean = stats?.projection_reconcile_clean;
  const issues = stats?.issues_total;
  const ecoLine = formatDigestEconomicLine(s.economic_projection_row_counts);
  const evLine = formatDigestEventLogLine(s.event_log_escrow_coverage);
  const chainLine = formatDigestChainLine(s.chain_observation);

  const issuesKnown =
    typeof issues === "number"
      ? Number.isFinite(issues)
      : typeof issues === "string" && issues.trim() !== "";

  const show =
    rawClean === true ||
    rawClean === false ||
    issuesKnown ||
    Boolean(ecoLine) ||
    Boolean(evLine) ||
    Boolean(chainLine);

  if (!show) return null;

  const cleanStr =
    rawClean === true
      ? t("admin_indexer_reconcile_reports_clean_yes")
      : rawClean === false
        ? t("admin_indexer_reconcile_reports_clean_no")
        : t("ui_em_dash");
  const issuesStr = issuesKnown ? String(issues) : t("ui_em_dash");

  const rows: { label: string; value: string }[] = [
    { label: t("admin_indexer_reconcile_digest_clean"), value: cleanStr },
    { label: t("admin_indexer_reconcile_digest_issues"), value: issuesStr },
  ];
  if (ecoLine) rows.push({ label: t("admin_indexer_reconcile_digest_econ"), value: ecoLine });
  if (evLine) rows.push({ label: t("admin_indexer_reconcile_digest_escrow_log"), value: evLine });
  if (chainLine) rows.push({ label: t("admin_indexer_reconcile_digest_chain"), value: chainLine });

  return (
    <div className="rounded-[var(--radius-md)] border border-ink-200 bg-bg-console/80 p-3">
      <h3 className="text-small font-semibold uppercase tracking-wide text-ink-500">
        {t("admin_indexer_reconcile_digest_title")}
      </h3>
      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <dt className="text-meta text-ink-500">{row.label}</dt>
            <dd className="font-mono text-small text-ink-900 break-all">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

type ReconcileReportRes = {
  status?: string;
  error?: string;
  report?: Record<string, unknown>;
  note?: string;
  meta?: unknown;
};

function downloadJsonFile(fileBase: string, content: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const safe = fileBase.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "report";
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reconcile-report-${safe}.json`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** 70 / 110 / 200：对账报告最小只读（须 admin）。 */
function AdminIndexerReconcileReportPageInner() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const reportJsonBlockHeadingId = useId();
  const reconcileDetailToolsFilterHintId = useId();
  const params = useParams();
  const reportId = useMemo(() => {
    const raw = params?.id;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return "";
  }, [params]);

  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [payload, setPayload] = useState<ReconcileReportRes | null>(null);
  const [jsonCopied, setJsonCopied] = useState(false);
  const copyFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyFlashTimer.current) clearTimeout(copyFlashTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!reportId) {
      setLoading(false);
      setError(null);
      setPayload(null);
      return;
    }

    setLoading(true);
    setError(null);

    const headers: Record<string, string> = {
      "x-request-id": `admin-reconcile-${reportId}-${Date.now()}`,
    };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 handled below
    }

    const path = routes.admin.indexerReconcileReport(reportId);

    adminFetchJson<ReconcileReportRes>("AdminIndexerReconcileReportPage", apiUrl(path), { headers })
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) {
          throw new Error("forbidden");
        }
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setPayload)
      .catch((e: unknown) => {
        logAdminFetch("AdminIndexerReconcileReportPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, [reportId, refreshTick]);

  const reportJson =
    payload?.report != null ? JSON.stringify(payload.report, null, 2) : null;
  const meta = payload && isAdminMetaRecord(payload.meta) ? payload.meta : null;
  const rep =
    payload != null &&
    payload.report !== null &&
    typeof payload.report === "object"
      ? (payload.report as Record<string, unknown>)
      : null;
  const headerReportType = typeof rep?.report_type === "string" ? rep.report_type.trim() : "";
  const headerChainId = rep?.chain_id;

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_indexer_reconcile_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_indexer_reconcile_subtitle")}</p>
          {reportId ? (
            <p className="mt-2 font-mono text-small text-ink-500 break-all">
              {t("admin_indexer_reconcile_idLabel")}: {reportId}
            </p>
          ) : null}
          {rep && !loading && !error ? (
            <div className="mt-2 space-y-1">
              {headerReportType ? (
                <p className="font-mono text-small text-ink-700">
                  {t("admin_indexer_last_reconcile_report_type").replace("{type}", headerReportType)}
                </p>
              ) : null}
              <p className="text-meta text-ink-600">
                {typeof headerChainId === "number"
                  ? t("admin_indexer_last_reconcile_chain").replace("{id}", String(headerChainId))
                  : t("admin_indexer_last_reconcile_chain_unknown")}
              </p>
            </div>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 sm:items-end">
          {reportId ? (
            <p id={reconcileDetailToolsFilterHintId} className="max-w-xl text-meta text-ink-600 leading-relaxed sm:text-right">
              {t("admin_indexer_reconcile_detail_tools_filter_hint")}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {reportId ? (
            <form
              className="inline"
              aria-describedby={reconcileDetailToolsFilterHintId}
              onSubmit={(e) => {
                e.preventDefault();
                setRefreshTick((n) => n + 1);
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
                disabled={loading}
              >
                {t("admin_indexer_reconcile_refresh")}
              </button>
            </form>
          ) : null}
          {reportJson ? (
            <form
              className="inline"
              aria-describedby={reconcileDetailToolsFilterHintId}
              onSubmit={async (e) => {
                e.preventDefault();
                if (typeof navigator === "undefined" || !navigator.clipboard?.writeText || !reportJson) return;
                try {
                  await navigator.clipboard.writeText(reportJson);
                  setJsonCopied(true);
                  if (copyFlashTimer.current) clearTimeout(copyFlashTimer.current);
                  copyFlashTimer.current = setTimeout(() => setJsonCopied(false), 2000);
                } catch {
                  setJsonCopied(false);
                }
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              >
                {jsonCopied ? t("admin_indexer_reconcile_copied") : t("admin_indexer_reconcile_copy_json")}
              </button>
            </form>
          ) : null}
          {reportJson ? (
            <form
              className="inline"
              aria-describedby={reconcileDetailToolsFilterHintId}
              onSubmit={(e) => {
                e.preventDefault();
                downloadJsonFile(reportId, reportJson);
              }}
            >
              <button
                type="submit"
                className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 ${travelFocusRingCoreOffset2Classes} focus-visible:ring-offset-bg-console`}
              >
                {t("admin_indexer_reconcile_download_json")}
              </button>
            </form>
          ) : null}
          <Link
            href="/admin/indexer/reconcile-reports"
            className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_indexer_reconcile_list_link")}
          </Link>
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <Link
            href="/admin/indexer"
            className={`${touchTargetLink44Classes} text-small text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_indexer_reconcile_backIndexer")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-small text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_indexer_back")}
          </Link>
          </div>
        </div>
      </header>

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4" aria-label={t("admin_indexer_reconcile_payload_aria")}>
        {!reportId ? (
          <p className="text-body text-ink-600" role="alert">
            {t("admin_indexer_reconcile_missingId")}
          </p>
        ) : loading ? (
          <p className="text-body text-ink-600" role="status">
            {t("admin_indexer_reconcile_loading")}
          </p>
        ) : error ? (
          <p className="text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : payload?.report ? (
          <div className="space-y-4">
            {payload.note ? (
              <AdminMetaNoteLink>{payload.note}</AdminMetaNoteLink>
            ) : null}
            {typeof payload.report === "object" && payload.report !== null ? (
              <StoredReportSummaryDigest report={payload.report as Record<string, unknown>} t={t} />
            ) : null}
            <Link
              href="/admin/indexer/reconcile-reports"
              className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/70 p-1 text-left transition hover:border-travel-400 ${travelFocusRingOffset2Classes}`}
              aria-labelledby={reportJsonBlockHeadingId}
            >
              <h2 id={reportJsonBlockHeadingId} className="text-small font-semibold uppercase tracking-wide text-ink-500">
                {t("admin_indexer_reconcile_reportBlock")}
              </h2>
              <JsonBlock value={payload.report} />
            </Link>
          </div>
        ) : (
          <p className="text-body text-ink-600" role="status">
            {t("admin_indexer_reconcile_empty")}
          </p>
        )}
      </section>
    </main>
  );
}

export default function AdminIndexerReconcileReportPage() {
  return (
    <AdminSearchParamsSuspense ariaLabelKey="admin_indexer_reconcile_title">
      <AdminIndexerReconcileReportPageInner />
    </AdminSearchParamsSuspense>
  );
}

