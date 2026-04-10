"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState, useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import AdminAuditCompareLinks from "@/components/admin/AdminAuditCompareLinks";
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
  travelFocusRingCoreOffset2WhiteClasses,
  travelFocusRingOffset2Classes,
} from "@/lib/travelLinkFocus";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

type FinanceMeta = {
  generated_at?: string;
  source?: string;
  /** 与 GET /meta.build 同源（07 §5.7 对账快照与发布追溯） */
  build?: Record<string, unknown>;
  db_order_count?: number | null;
  db_orders_with_escrow_count?: number | null;
  /** Rows in `reconciliation_reports` with type `orders_projection_vs_orders` when PgPool present; else null. */
  orders_projection_reconcile_report_count?: number | null;
  /** All rows in `reconciliation_reports` when PgPool present; else null. */
  reconciliation_reports_total_count?: number | null;
  /** Rows with parsed `summary.stats.issues_total` ≥ 1 (same filter as reconcile-reports `issues_min`); else null. */
  reconciliation_reports_with_open_issues_count?: number | null;
  /** Rows with `summary.stats.projection_reconcile_clean === false` (reconcile-reports filter); else null. */
  reconciliation_reports_projection_unclean_count?: number | null;
  /** Rows with `summary.stats.projection_reconcile_clean === true`; else null. */
  reconciliation_reports_projection_clean_count?: number | null;
  /** API `FEE_ROUTER_ADDRESS` when `ChainConfig` loaded; aligns with `GET /meta.chain.contracts` (07 §5.2A). */
  fee_router_address?: string | null;
  /** `null` = no DB / query failed; object = `fee_router_routed_events` rollup (all `chain_id`). */
  fee_router_stats?: unknown;
  /** API `REGION_VAULT_ADDRESS` when `ChainConfig` loaded. */
  region_vault_address?: string | null;
  /** `null` = no DB / query failed; object = `region_vault_forwarded_events` rollup (all `chain_id`). */
  region_vault_stats?: unknown;
  /** `null` = none; object = latest persisted `orders_projection_vs_orders` report digest. */
  last_stored_orders_projection_reconcile?: unknown;
};

type FinanceSummary = {
  order_count?: number;
  state_counts?: Record<string, number>;
  total_amount_by_currency?: Record<string, number>;
  escrowed_amount_by_currency?: Record<string, number>;
  dispute_count?: number;
  dispute_status_counts?: Record<string, number>;
  orders_with_escrow_address_count?: number;
  orders_amount_parse_error_count?: number;
};

type FinanceRes = {
  status?: string;
  meta?: FinanceMeta;
  summary?: FinanceSummary;
  error?: string;
};

export default function AdminFinancePage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const financeMetaDlHeadingId = useId();
  const exportCsvFormatHintId = useId();
  const financeExportSubmitFilterHintId = useId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<AdminFetchErrorKind | null>(null);
  const [meta, setMeta] = useState<FinanceMeta | null>(null);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);

  useEffect(() => {
    const headers: Record<string, string> = { "x-request-id": `admin-finance-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // Keep empty auth headers and let backend return 401/403.
    }

    adminFetchJson<FinanceRes>("AdminFinancePage", apiUrl(routes.admin.financeSummary), { headers })
      .then(({ res, body }) => {
        if (!res.ok) {
          throw new Error(body.error || `request_failed_${res.status}`);
        }
        return body;
      })
      .then((body) => {
        setMeta(typeof body.meta === "object" && body.meta !== null ? body.meta : null);
        setSummary(body.summary ?? null);
      })
      .catch((e: unknown) => {
        logAdminFetch("AdminFinancePage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  async function downloadFinanceSummaryCsv() {
    setExportError(null);
    setExporting(true);
    try {
      const headers: Record<string, string> = { "x-request-id": `admin-finance-csv-${Date.now()}` };
      Object.assign(headers, getAuthHeaders());
      const res = await fetch(apiUrl(routes.admin.financeSummaryExport), { headers });
      if (!res.ok) {
        let msg = `request_failed_${res.status}`;
        try {
          const j = (await res.json()) as { message?: string; error?: string };
          if (typeof j.message === "string" && j.message.trim()) msg = j.message.trim();
          else if (typeof j.error === "string" && j.error.trim()) msg = j.error.trim();
        } catch {
          /* ignore non-JSON error bodies */
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disp = res.headers.get("Content-Disposition");
      const m = disp?.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = m?.[1] ?? "finance-summary.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      logAdminFetch("AdminFinanceExport", e);
      setExportError(adminFetchErrorKind(e));
    } finally {
      setExporting(false);
    }
  }

  const generatedAt =
    meta?.generated_at && !Number.isNaN(Date.parse(meta.generated_at))
      ? new Date(meta.generated_at).toLocaleString()
      : null;

  const feeRouterStats = meta && isRecord(meta.fee_router_stats) ? meta.fee_router_stats : null;
  const regionVaultStats = meta && isRecord(meta.region_vault_stats) ? meta.region_vault_stats : null;
  const lastProjReconcile =
    meta && isRecord(meta.last_stored_orders_projection_reconcile)
      ? meta.last_stored_orders_projection_reconcile
      : null;
  const lastReportId =
    typeof lastProjReconcile?.report_id === "string" ? lastProjReconcile.report_id.trim() : "";
  const projectionClean = lastProjReconcile?.projection_reconcile_clean;
  const issuesTotal = lastProjReconcile?.issues_total;
  const issuesN = typeof issuesTotal === "number" && Number.isFinite(issuesTotal) ? issuesTotal : null;

  return (
    <main className="mx-auto max-w-6xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_finance_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_finance_subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/observability"
            className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_title")}
          </Link>
          <form
            className="flex max-w-sm flex-col gap-1 sm:max-w-xs sm:items-end"
            aria-label={t("admin_finance_export_csv_aria")}
            aria-describedby={`${financeExportSubmitFilterHintId} ${exportCsvFormatHintId}`}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void downloadFinanceSummaryCsv();
            }}
          >
            <p id={financeExportSubmitFilterHintId} className="text-meta text-ink-600 leading-relaxed sm:text-right">
              {t("admin_finance_export_submit_filter_hint")}
            </p>
            <button
              type="submit"
              className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${travelFocusRingCoreOffset2WhiteClasses}`}
              disabled={loading || exporting}
              aria-label={t("admin_finance_export_csv_aria")}
            >
              {exporting ? t("admin_finance_exporting") : t("admin_finance_export_csv")}
            </button>
            <p id={exportCsvFormatHintId} className="text-meta text-ink-500 sm:text-right">
              {t("admin_finance_export_csv_format_hint")}
            </p>
          </form>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline ${travelFocusRingOffset2Classes}`}>
            {t("admin_schema_back")}
          </Link>
        </div>
      </header>

      <AdminAuditCompareLinks />

      <AdminMetaBuildSection
        meta={meta && isAdminMetaRecord(meta) ? meta : null}
        loading={loading}
        error={error}
      />

      {loading && (
        <p className="mt-6 text-body text-ink-500" role="status">
          {t("admin_loading")}
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-danger/20 bg-danger/5 p-3 text-body text-danger" role="alert">
          {adminErrorUserText(error, t)}
        </p>
      )}

      {exportError && (
        <p className="mt-4 rounded-[var(--radius-md)] border border-warning/25 bg-warning/10 p-3 text-body text-ink-800" role="alert">
          {adminErrorUserText(exportError, t)}
        </p>
      )}

      {!loading && !error && summary && (
        <section className="mt-6 space-y-4" aria-label={t("admin_finance_summary_aria")}>
          {meta && (
            <div className="rounded-[var(--radius-xl)] border border-ink-200 bg-ink-50/80 p-4">
              <Link
                href="/admin/indexer/reconcile-reports"
                className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start -mx-1 -mt-1 rounded-[var(--radius-md)] px-1 pt-1 text-left text-ink-800 transition hover:border-travel-400 hover:text-travel-700 ${travelFocusRingCoreOffset2WhiteClasses}`}
                aria-labelledby={financeMetaDlHeadingId}
              >
                <h2 id={financeMetaDlHeadingId} className="text-body font-medium text-ink-800">
                  {t("admin_finance_meta_title")}
                </h2>
                <dl className="mt-2 grid gap-2 text-small text-ink-700 sm:grid-cols-2">
                <div>
                  <dt className="text-meta text-ink-500">{t("admin_finance_meta_source")}</dt>
                  <dd className="font-mono">{meta.source ?? t("admin_em_dash")}</dd>
                </div>
                <div>
                  <dt className="text-meta text-ink-500">{t("admin_finance_meta_generatedAt")}</dt>
                  <dd className="font-mono">{generatedAt ?? t("admin_em_dash")}</dd>
                </div>
                <div>
                  <dt className="text-meta text-ink-500">{t("admin_finance_meta_dbOrderCount")}</dt>
                  <dd className="font-mono">
                    {meta.db_order_count == null ? t("admin_finance_meta_na") : String(meta.db_order_count)}
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-ink-500">{t("admin_finance_meta_dbEscrowCount")}</dt>
                  <dd className="font-mono">
                    {meta.db_orders_with_escrow_count == null
                      ? t("admin_finance_meta_na")
                      : String(meta.db_orders_with_escrow_count)}
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-ink-500">{t("admin_finance_meta_projectionReconcileReportCount")}</dt>
                  <dd className="font-mono">
                    {meta.orders_projection_reconcile_report_count == null
                      ? t("admin_finance_meta_na")
                      : String(meta.orders_projection_reconcile_report_count)}
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-ink-500">{t("admin_finance_meta_reconciliationReportsTotalCount")}</dt>
                  <dd className="font-mono">
                    {meta.reconciliation_reports_total_count == null
                      ? t("admin_finance_meta_na")
                      : String(meta.reconciliation_reports_total_count)}
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-ink-500">
                    {t("admin_finance_meta_reconciliationReportsWithOpenIssuesCount")}
                  </dt>
                  <dd className="font-mono">
                    {meta.reconciliation_reports_with_open_issues_count == null
                      ? t("admin_finance_meta_na")
                      : String(meta.reconciliation_reports_with_open_issues_count)}
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-ink-500">
                    {t("admin_finance_meta_reconciliationReportsProjectionUncleanCount")}
                  </dt>
                  <dd className="font-mono">
                    {meta.reconciliation_reports_projection_unclean_count == null
                      ? t("admin_finance_meta_na")
                      : String(meta.reconciliation_reports_projection_unclean_count)}
                  </dd>
                </div>
                <div>
                  <dt className="text-meta text-ink-500">
                    {t("admin_finance_meta_reconciliationReportsProjectionCleanCount")}
                  </dt>
                  <dd className="font-mono">
                    {meta.reconciliation_reports_projection_clean_count == null
                      ? t("admin_finance_meta_na")
                      : String(meta.reconciliation_reports_projection_clean_count)}
                  </dd>
                </div>
              </dl>
              </Link>

              <div className="mt-4 border-t border-ink-200/80 pt-4">
                <h3 className="text-small font-semibold text-ink-800">{t("admin_finance_ledger_db_title")}</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Link
                    href="/admin/fee-router#admin-fee-router-events"
                    className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200 bg-white/60 p-3 text-left text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
                  >
                    <p className="text-meta font-medium text-ink-600">{t("admin_finance_meta_feeRouterHeading")}</p>
                    <dl className="mt-2 text-small text-ink-700">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                        <dt className="text-meta text-ink-500 shrink-0">{t("admin_finance_meta_feeRouterEnvAddress")}</dt>
                        <dd className="font-mono text-right break-all sm:text-left">
                          {typeof meta.fee_router_address === "string" && meta.fee_router_address.trim()
                            ? meta.fee_router_address.trim()
                            : t("admin_finance_meta_na")}
                        </dd>
                      </div>
                    </dl>
                    {feeRouterStats ? (
                      <dl className="mt-2 space-y-1 text-small text-ink-700">
                        <div className="flex justify-between gap-2">
                          <dt>{t("admin_fee_router_summaryTotal")}</dt>
                          <dd className="font-mono">
                            {feeRouterStats.total != null ? String(feeRouterStats.total) : t("ui_em_dash")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>{t("admin_fee_router_blockRange")}</dt>
                          <dd className="font-mono text-right">
                            {feeRouterStats.min_block_number != null && feeRouterStats.max_block_number != null
                              ? `${feeRouterStats.min_block_number}–${feeRouterStats.max_block_number}`
                              : t("admin_finance_meta_na")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>{t("admin_fee_router_latestInserted")}</dt>
                          <dd className="font-mono text-right text-meta">
                            {typeof feeRouterStats.latest_inserted_at === "string" &&
                            !Number.isNaN(Date.parse(feeRouterStats.latest_inserted_at))
                              ? new Date(feeRouterStats.latest_inserted_at).toLocaleString()
                              : t("admin_finance_meta_na")}
                          </dd>
                        </div>
                      </dl>
                    ) : (
                      <p className="mt-2 text-small text-ink-500">{t("admin_finance_meta_na")}</p>
                    )}
                  </Link>
                  <Link
                    href="/admin/region-vault#admin-region-vault-events"
                    className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200 bg-white/60 p-3 text-left text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
                  >
                    <p className="text-meta font-medium text-ink-600">{t("admin_finance_meta_regionVaultHeading")}</p>
                    <dl className="mt-2 text-small text-ink-700">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                        <dt className="text-meta text-ink-500 shrink-0">{t("admin_finance_meta_regionVaultEnvAddress")}</dt>
                        <dd className="font-mono text-right break-all sm:text-left">
                          {typeof meta.region_vault_address === "string" && meta.region_vault_address.trim()
                            ? meta.region_vault_address.trim()
                            : t("admin_finance_meta_na")}
                        </dd>
                      </div>
                    </dl>
                    {regionVaultStats ? (
                      <dl className="mt-2 space-y-1 text-small text-ink-700">
                        <div className="flex justify-between gap-2">
                          <dt>{t("admin_region_vault_summaryTotal")}</dt>
                          <dd className="font-mono">
                            {regionVaultStats.total != null ? String(regionVaultStats.total) : t("ui_em_dash")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>{t("admin_region_vault_blockRange")}</dt>
                          <dd className="font-mono text-right">
                            {regionVaultStats.min_block_number != null && regionVaultStats.max_block_number != null
                              ? `${regionVaultStats.min_block_number}–${regionVaultStats.max_block_number}`
                              : t("admin_finance_meta_na")}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>{t("admin_region_vault_latestInserted")}</dt>
                          <dd className="font-mono text-right text-meta">
                            {typeof regionVaultStats.latest_inserted_at === "string" &&
                            !Number.isNaN(Date.parse(regionVaultStats.latest_inserted_at))
                              ? new Date(regionVaultStats.latest_inserted_at).toLocaleString()
                              : t("admin_finance_meta_na")}
                          </dd>
                        </div>
                      </dl>
                    ) : (
                      <p className="mt-2 text-small text-ink-500">{t("admin_finance_meta_na")}</p>
                    )}
                  </Link>
                  <Link
                    href={
                      lastReportId
                        ? `/admin/indexer/reconcile/${encodeURIComponent(lastReportId)}`
                        : "/admin/indexer/reconcile-reports"
                    }
                    className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200 bg-white/60 p-3 text-left text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 sm:col-span-2 xl:col-span-1 ${travelFocusRingCoreOffset2WhiteClasses}`}
                  >
                    <p className="text-meta font-medium text-ink-600">{t("admin_finance_meta_projectionReconcileHeading")}</p>
                    {lastProjReconcile ? (
                      <div className="mt-2 space-y-1 text-small text-ink-700">
                        {typeof lastProjReconcile.report_type === "string" && lastProjReconcile.report_type.trim() ? (
                          <p className="text-meta font-mono text-ink-700">
                            {t("admin_indexer_last_reconcile_report_type").replace(
                              "{type}",
                              lastProjReconcile.report_type.trim(),
                            )}
                          </p>
                        ) : null}
                        <p className="text-body text-ink-700">
                          {projectionClean === true
                            ? t("admin_indexer_last_reconcile_clean_yes")
                            : projectionClean === false
                              ? t("admin_indexer_last_reconcile_clean_no")
                              : t("admin_indexer_last_reconcile_clean_unknown")}
                        </p>
                        <p className="text-body text-ink-600">
                          {issuesN != null
                            ? t("admin_indexer_last_reconcile_issues").replace("{count}", String(issuesN))
                            : t("admin_indexer_last_reconcile_issues_unknown")}
                        </p>
                        <p className="text-meta text-ink-600">
                          {typeof lastProjReconcile.chain_id === "number"
                            ? t("admin_indexer_last_reconcile_chain").replace("{id}", String(lastProjReconcile.chain_id))
                            : t("admin_indexer_last_reconcile_chain_unknown")}
                        </p>
                        {typeof lastProjReconcile.created_at === "string" &&
                          !Number.isNaN(Date.parse(lastProjReconcile.created_at)) && (
                            <p className="text-meta text-ink-500">
                              {t("admin_indexer_last_reconcile_at").replace(
                                "{ts}",
                                new Date(lastProjReconcile.created_at).toLocaleString(),
                              )}
                            </p>
                          )}
                        {lastReportId ? (
                          <p className="pt-1 text-small font-medium text-travel-600">{t("admin_indexer_last_reconcile_open")}</p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-2 text-small text-ink-500">{t("admin_finance_meta_na")}</p>
                    )}
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-small">
                  <Link href="/admin/fee-router" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
                    {t("admin_finance_link_fee_router")}
                  </Link>
                  <Link
                    href="/admin/region-vault#admin-region-vault-events"
                    className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}
                  >
                    {t("admin_finance_link_region_vault")}
                  </Link>
                  <Link href="/admin/indexer" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
                    {t("admin_finance_link_indexer")}
                  </Link>
                  <Link href="/admin/indexer/reconcile-reports" className={`${touchTargetLink44Classes} text-travel-600 hover:underline ${travelFocusRingOffset2Classes}`}>
                    {t("admin_finance_link_reconcile_reports")}
                  </Link>
                </div>
              </div>

              <p className="mt-3 text-meta text-ink-500">{t("admin_finance_meta_hint")}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/admin/orders"
              className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              <h2 className="text-body font-medium text-ink-800">{t("admin_finance_orderCount")}</h2>
              <p className="mt-2 text-h4 font-semibold text-ink-900">{summary.order_count ?? 0}</p>
            </Link>

            <Link
              href="/admin/disputes"
              className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              <h2 className="text-body font-medium text-ink-800">{t("admin_finance_disputeCount")}</h2>
              <p className="mt-2 text-h4 font-semibold text-ink-900">{summary.dispute_count ?? 0}</p>
            </Link>

            <Link
              href="/admin/orders"
              className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              <h2 className="text-body font-medium text-ink-800">{t("admin_finance_ordersEscrowAddr")}</h2>
              <p className="mt-2 text-h4 font-semibold text-ink-900">
                {summary.orders_with_escrow_address_count ?? 0}
              </p>
            </Link>

            <Link
              href="/admin/orders"
              className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              <h2 className="text-body font-medium text-ink-800">{t("admin_finance_amountParseErrors")}</h2>
              <p className="mt-2 text-h4 font-semibold text-ink-900">
                {summary.orders_amount_parse_error_count ?? 0}
              </p>
            </Link>

            <Link
              href="/admin/disputes"
              className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 sm:col-span-2 ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              <h2 className="text-body font-medium text-ink-800">{t("admin_finance_disputeStatusCounts")}</h2>
              <pre className="mt-2 overflow-auto rounded-[var(--radius-md)] bg-ink-50 p-3 text-small text-ink-700">
                {JSON.stringify(summary.dispute_status_counts ?? {}, null, 2)}
              </pre>
            </Link>

            <Link
              href="/admin/orders"
              className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 sm:col-span-2 ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              <h2 className="text-body font-medium text-ink-800">{t("admin_finance_stateCounts")}</h2>
              <pre className="mt-2 overflow-auto rounded-[var(--radius-md)] bg-ink-50 p-3 text-small text-ink-700">
                {JSON.stringify(summary.state_counts ?? {}, null, 2)}
              </pre>
            </Link>

            <Link
              href="/admin/orders"
              className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 sm:col-span-2 ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              <h2 className="text-body font-medium text-ink-800">{t("admin_finance_totalByCurrency")}</h2>
              <pre className="mt-2 overflow-auto rounded-[var(--radius-md)] bg-ink-50 p-3 text-small text-ink-700">
                {JSON.stringify(summary.total_amount_by_currency ?? {}, null, 2)}
              </pre>
            </Link>

            <Link
              href="/admin/orders"
              className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start rounded-[var(--radius-xl)] border border-ink-200 bg-white p-4 text-ink-800 shadow-soft transition hover:border-travel-400 hover:text-travel-600 sm:col-span-2 ${travelFocusRingCoreOffset2WhiteClasses}`}
            >
              <h2 className="text-body font-medium text-ink-800">{t("admin_finance_escrowedByCurrency")}</h2>
              <pre className="mt-2 overflow-auto rounded-[var(--radius-md)] bg-ink-50 p-3 text-small text-ink-700">
                {JSON.stringify(summary.escrowed_amount_by_currency ?? {}, null, 2)}
              </pre>
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
