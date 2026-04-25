"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import FinanceReconciliationEpicDHint from "@/components/admin/FinanceReconciliationEpicDHint";
import {
  type AdminFetchErrorKind,
  adminErrorUserText,
  adminFetchErrorKind,
  adminFetchJson,
  logAdminFetch,
} from "@/lib/adminFetchDisplay";
import { apiUrl, routes } from "@/lib/api";
import {
  getAdminCrossCheck,
  getAdminDriftSummary,
  getAuthHeaders,
  normalizeAdminCrossCheckRead,
  normalizeAdminDriftSummaryRead,
  type NormalizedAdminCrossCheck,
  type NormalizedAdminDriftSummary,
} from "@/lib/apiClient";
import {
  deriveChainAlignmentStatus,
  summarizeDeltaForHub,
  type ChainAlignmentHubStatus,
} from "@/lib/financeReconciliationDriftStrip";
import {
  FINANCE_RECONCILIATION_HUB_LAST_STORED_KEYS,
  FINANCE_RECONCILIATION_HUB_META_SCALAR_KEYS,
  FINANCE_RECONCILIATION_HUB_SUMMARY_SCALAR_KEYS,
} from "@/lib/financeReconciliationHubPaths";
import { formatApiPathDisplayValue } from "@/lib/financeReconciliationPathValue";
import {
  touchTargetLink44Classes,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

type FinanceRes = {
  status?: string;
  meta?: unknown;
  summary?: unknown;
  error?: string;
};

/** Epic E-04 导航 + E-05：`GET …/finance/summary` 只读映射展示（无二 Σ、无 0 填充）。 */
export default function AdminFinanceReconciliationPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const disclaimerId = useId();
  const apiSectionId = useId();
  const driftSectionId = useId();
  const driftSemanticNoteId = useId();
  const na = t("admin_finance_reconciliation_data_unavailable");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<FinanceRes | null>(null);

  const [driftStripLoading, setDriftStripLoading] = useState(true);
  const [crossErr, setCrossErr] = useState<AdminFetchErrorKind | null>(null);
  const [driftSummaryErr, setDriftSummaryErr] = useState<AdminFetchErrorKind | null>(null);
  const [crossNorm, setCrossNorm] = useState<NormalizedAdminCrossCheck | null>(null);
  const [driftNorm, setDriftNorm] = useState<NormalizedAdminDriftSummary | null>(null);

  useEffect(() => {
    const headers: Record<string, string> = {
      "x-request-id": `admin-finance-reconciliation-${Date.now()}`,
    };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      /* 无本地凭证时交由后端 401/403 */
    }

    setLoading(true);
    setError(null);
    adminFetchJson<FinanceRes>("AdminFinanceReconciliationPage", apiUrl(routes.admin.financeSummary), {
      headers,
    })
      .then(({ res, body: b }) => {
        if (!res.ok) {
          throw new Error(b.error || `request_failed_${res.status}`);
        }
        return b;
      })
      .then(setBody)
      .catch((e: unknown) => {
        logAdminFetch("AdminFinanceReconciliationPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setDriftStripLoading(true);
    setCrossErr(null);
    setDriftSummaryErr(null);
    setCrossNorm(null);
    setDriftNorm(null);

    void Promise.allSettled([getAdminCrossCheck(), getAdminDriftSummary()]).then((results) => {
      if (cancelled) return;
      const [r0, r1] = results;
      if (r0.status === "fulfilled") {
        setCrossNorm(normalizeAdminCrossCheckRead(r0.value));
      } else {
        logAdminFetch("AdminFinanceReconciliationCrossCheck", r0.reason);
        setCrossErr(adminFetchErrorKind(r0.reason));
      }
      if (r1.status === "fulfilled") {
        setDriftNorm(normalizeAdminDriftSummaryRead(r1.value));
      } else {
        logAdminFetch("AdminFinanceReconciliationDriftSummary", r1.reason);
        setDriftSummaryErr(adminFetchErrorKind(r1.reason));
      }
      setDriftStripLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const meta = body && isRecord(body.meta) ? body.meta : null;
  const summary = body && isRecord(body.summary) ? body.summary : null;
  const lastStored =
    meta && isRecord(meta.last_stored_orders_projection_reconcile)
      ? meta.last_stored_orders_projection_reconcile
      : null;

  const reportIdRaw =
    lastStored && typeof lastStored.report_id === "string" ? lastStored.report_id.trim() : "";
  const hasReportId = reportIdRaw.length > 0;

  const links: { href: string; labelKey: string }[] = [
    { href: "/admin/finance", labelKey: "admin_finance_reconciliation_link_finance" },
    { href: "/admin/cross-check", labelKey: "admin_finance_reconciliation_link_cross_check" },
    { href: "/admin/drift-summary", labelKey: "admin_finance_reconciliation_link_drift" },
    { href: "/admin/indexer", labelKey: "admin_finance_reconciliation_link_indexer" },
    { href: "/admin/indexer/reconcile-reports", labelKey: "admin_finance_reconciliation_link_reconcile_reports" },
  ];

  function pathRows(
    prefix: string,
    keys: readonly string[],
    obj: Record<string, unknown> | null,
  ): { path: string; text: string }[] {
    return keys.map((key) => {
      const path = `${prefix}.${key}`;
      const value = obj ? obj[key] : undefined;
      return { path, text: formatApiPathDisplayValue(value, na) };
    });
  }

  const metaRows = pathRows("meta", FINANCE_RECONCILIATION_HUB_META_SCALAR_KEYS, meta);
  const summaryRows = pathRows("summary", FINANCE_RECONCILIATION_HUB_SUMMARY_SCALAR_KEYS, summary);
  const lastRows = pathRows(
    "meta.last_stored_orders_projection_reconcile",
    FINANCE_RECONCILIATION_HUB_LAST_STORED_KEYS,
    lastStored,
  );

  const hubAlignment = deriveChainAlignmentStatus(driftNorm?.drift_detected);

  function alignmentBadgeClass(s: ChainAlignmentHubStatus): string {
    if (s === "unknown") return "border-warning bg-warning text-white";
    if (s === "not_aligned") return "border-warning bg-warning text-white";
    return "border-ink-200 bg-ink-100 text-ink-800";
  }

  function chainAlignmentLabel(s: ChainAlignmentHubStatus): string {
    if (s === "aligned") return t("admin_finance_reconciliation_chain_alignment_aligned");
    if (s === "not_aligned") return t("admin_finance_reconciliation_chain_alignment_not_aligned");
    return t("admin_finance_reconciliation_chain_alignment_unknown");
  }

  const driftSummaryDeltaLine = summarizeDeltaForHub(driftNorm?.delta, na);
  const crossDriftDeltaLine = summarizeDeltaForHub(crossNorm?.drift_summary?.delta, na);

  return (
    <main className="mx-auto max-w-5xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-full flex-1">
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_finance_reconciliation_title")}
          </h1>
          <div
            id={disclaimerId}
            className="mt-3 rounded-[var(--radius-lg)] border border-ink-200 bg-ink-50/90 p-4 text-body text-ink-800"
            role="note"
          >
            {t("admin_finance_reconciliation_disclaimer")}
          </div>
          <p className="mt-3 text-body text-ink-600">{t("admin_finance_reconciliation_intro")}</p>
        </div>
        <Link
          href="/admin"
          className={`${touchTargetLink44Classes} shrink-0 text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
        >
          {t("admin_schema_back")}
        </Link>
      </header>

      <section
        className="mt-8 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-soft"
        aria-labelledby={apiSectionId}
      >
        <h2 id={apiSectionId} className="text-body font-semibold text-ink-900">
          {t("admin_finance_reconciliation_finance_summary_api_heading")}
        </h2>
        <p className="mt-1 text-meta text-ink-600">{t("admin_finance_reconciliation_finance_summary_api_hint")}</p>

        {loading ? (
          <p className="mt-4 text-body text-ink-600">{t("admin_finance_reconciliation_summary_loading")}</p>
        ) : error ? (
          <p className="mt-4 text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : (
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="text-small font-semibold text-ink-700">{t("admin_finance_reconciliation_meta_heading")}</h3>
              <dl className="mt-2 divide-y divide-ink-100 border border-ink-100 rounded-[var(--radius-md)]">
                {metaRows.map(({ path, text }) => (
                  <div key={path} className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
                    <dt className="font-mono text-meta text-ink-500 break-all">{path}</dt>
                    <dd className="text-body text-ink-800 break-words">{text}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="text-small font-semibold text-ink-700">
                {t("admin_finance_reconciliation_summary_heading")}
              </h3>
              <dl className="mt-2 divide-y divide-ink-100 border border-ink-100 rounded-[var(--radius-md)]">
                {summaryRows.map(({ path, text }) => (
                  <div key={path} className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
                    <dt className="font-mono text-meta text-ink-500 break-all">{path}</dt>
                    <dd className="text-body text-ink-800 break-words">{text}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="text-small font-semibold text-ink-700">
                {t("admin_finance_reconciliation_projection_heading")}
              </h3>
              <dl className="mt-2 divide-y divide-ink-100 border border-ink-100 rounded-[var(--radius-md)]">
                {lastRows.map(({ path, text }) => (
                  <div key={path} className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
                    <dt className="font-mono text-meta text-ink-500 break-all">{path}</dt>
                    <dd className="text-body text-ink-800 break-words">{text}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                <Link
                  href="/admin/indexer/reconcile-reports"
                  className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
                >
                  {t("admin_finance_reconciliation_open_reconcile_reports")}
                </Link>
                {hasReportId ? (
                  <Link
                    href={`/admin/indexer/reconcile/${encodeURIComponent(reportIdRaw)}`}
                    className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
                  >
                    {t("admin_finance_reconciliation_open_reconcile_detail")}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </section>

      <section
        className="mt-8 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-soft"
        aria-labelledby={driftSectionId}
      >
        <h2 id={driftSectionId} className="text-body font-semibold text-ink-900">
          {t("admin_finance_reconciliation_drift_section_title")}
        </h2>
        <p className="mt-1 text-meta text-ink-600">{t("admin_finance_reconciliation_drift_section_hint")}</p>
        <div
          id={driftSemanticNoteId}
          className="mt-3 rounded-[var(--radius-lg)] border border-ink-200 bg-ink-50/90 p-4 text-body text-ink-800"
          role="note"
        >
          <p className="font-medium text-ink-900">{t("admin_finance_reconciliation_drift_semantic_note_title")}</p>
          <p className="mt-1 text-meta text-ink-700">{t("admin_finance_reconciliation_drift_semantic_note_body")}</p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-ink-200 bg-ink-50 px-3 py-2">
              <dt className="font-mono text-meta text-ink-500">data_source</dt>
              <dd className="mt-1 text-small font-medium text-ink-800">
                {t("admin_finance_reconciliation_drift_data_source_projection")}
              </dd>
            </div>
            <div className={`rounded-[var(--radius-md)] border px-3 py-2 ${alignmentBadgeClass(hubAlignment)}`}>
              <dt className="font-mono text-meta opacity-90">chain_alignment_status</dt>
              <dd className="mt-1 text-small font-semibold">{chainAlignmentLabel(hubAlignment)}</dd>
              <p className="mt-1 text-meta opacity-90">{t("admin_finance_reconciliation_chain_alignment_derived_hint")}</p>
            </div>
          </dl>
        </div>

        {driftStripLoading ? (
          <p className="mt-4 text-body text-ink-600">{t("admin_finance_reconciliation_drift_loading")}</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-ink-100 p-4">
              <h3 className="text-small font-semibold text-ink-800">
                {t("admin_finance_reconciliation_drift_from_summary_heading")}
              </h3>
              {driftSummaryErr ? (
                <p className="mt-2 text-body text-danger" role="alert">
                  {adminErrorUserText(driftSummaryErr, t)}
                </p>
              ) : (
                <>
                  <dl className="mt-2 space-y-2 text-body">
                    <div>
                      <dt className="font-mono text-meta text-ink-500">drift-summary.drift_detected</dt>
                      <dd className="text-ink-800">
                        {formatApiPathDisplayValue(driftNorm?.drift_detected, na)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-meta text-ink-500">drift-summary.delta (summary)</dt>
                      <dd className="break-words text-ink-800">{driftSummaryDeltaLine}</dd>
                    </div>
                  </dl>
                  <Link
                    href="/admin/drift-summary"
                    className={`${touchTargetLink44Classes} mt-3 inline-flex text-small font-medium text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
                  >
                    {t("admin_finance_reconciliation_open_drift_full")}
                  </Link>
                </>
              )}
            </div>
            <div className="rounded-[var(--radius-lg)] border border-ink-100 p-4">
              <h3 className="text-small font-semibold text-ink-800">
                {t("admin_finance_reconciliation_drift_from_cross_check_heading")}
              </h3>
              {crossErr ? (
                <p className="mt-2 text-body text-danger" role="alert">
                  {adminErrorUserText(crossErr, t)}
                </p>
              ) : (
                <>
                  <dl className="mt-2 space-y-2 text-body">
                    <div>
                      <dt className="font-mono text-meta text-ink-500">cross-check.drift_summary.drift_detected</dt>
                      <dd className="text-ink-800">
                        {formatApiPathDisplayValue(crossNorm?.drift_summary?.drift_detected, na)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-meta text-ink-500">cross-check.drift_summary.delta (summary)</dt>
                      <dd className="break-words text-ink-800">{crossDriftDeltaLine}</dd>
                    </div>
                  </dl>
                  <Link
                    href="/admin/cross-check"
                    className={`${touchTargetLink44Classes} mt-3 inline-flex text-small font-medium text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
                  >
                    {t("admin_finance_reconciliation_open_cross_check_full")}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      <FinanceReconciliationEpicDHint />

      <nav
        className="mt-8 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-soft"
        aria-label={t("admin_finance_reconciliation_nav_aria")}
      >
        <ul className="space-y-3">
          {links.map(({ href, labelKey }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${touchTargetLink44Classes} inline-flex text-body font-medium text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
              >
                {t(labelKey)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
