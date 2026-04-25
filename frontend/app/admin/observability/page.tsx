"use client";

import Link from "next/link";
import { useEffect, useState, useId } from "react";

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

type OverviewBody = {
  status?: string;
  error?: string;
  /** 与 Admin 列表接口一致：顶层 meta.build 同 GET /meta.build */
  meta?: unknown;
  overview?: {
    chain_id?: string;
    /** 与 GET /meta.build 同源（07 · 5.6C / 120 / 140） */
    build?: Record<string, unknown>;
    indexer?: Record<string, unknown>;
    rate_limits?: Record<string, unknown>;
    alerts?: Record<string, unknown>;
    audit?: Record<string, unknown>;
  };
  actor?: Record<string, unknown>;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

type LastStoredReconciliation = {
  report_id?: string;
  report_type?: string;
  chain_id?: number | null;
  created_at?: string;
  projection_reconcile_clean?: boolean | null;
  issues_total?: number | null;
};

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="mt-1 max-h-64 overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

/** Phase 5 / 07：管理员可观测快照（与后端 /meta 限流同源字段）。 */
export default function AdminObservabilityPage() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const chainBlockId = useId();
  const rateLimitsBlockId = useId();
  const alertsBlockId = useId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AdminFetchErrorKind | null>(null);
  const [body, setBody] = useState<OverviewBody | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { "x-request-id": `admin-obs-${Date.now()}` };
    try {
      Object.assign(headers, getAuthHeaders());
    } catch {
      // 401/403 handled below
    }

    adminFetchJson<OverviewBody>("AdminObservabilityPage", apiUrl(routes.admin.observabilityOverview), { headers })
      .then(({ res, body: json }) => {
        if (res.status === 403 || res.status === 401) {
          throw new Error("forbidden");
        }
        if (!res.ok) {
          throw new Error(json.error || `request_failed_${res.status}`);
        }
        return json;
      })
      .then(setBody)
      .catch((e: unknown) => {
        logAdminFetch("AdminObservabilityPage", e);
        setError(adminFetchErrorKind(e));
      })
      .finally(() => setLoading(false));
  }, []);

  const ov = body?.overview;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-8" aria-labelledby={pageTitleId}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id={pageTitleId} className="text-h3 font-semibold text-ink-900">
            {t("admin_observability_title")}
          </h1>
          <p className="mt-1 text-body text-ink-600">{t("admin_observability_subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small">
          <Link href="/admin/audit" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>
            {t("admin_observability_linkAuditLogs")}
          </Link>
          <Link href="/admin/audit/operations" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>
            {t("admin_observability_linkAuditOps")}
          </Link>
          <Link
            href="/admin/indexer/reconcile-reports"
            className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_observability_linkReconcileReports")}
          </Link>
          <Link href="/admin/alerts/incidents" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>
            {t("admin_observability_linkIncidents")}
          </Link>
          <Link
            href="/admin/trust-growth"
            className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_shell_nav_trust_growth")}
          </Link>
          <Link href="/admin" className={`${touchTargetLink44Classes} text-travel-500 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}>
            {t("admin_schema_back")}
          </Link>
        </div>
      </header>

      <AdminAuditCompareLinks />

      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4" aria-label={t("admin_observability_overview_aria")}>
        {loading ? (
          <p className="text-body text-ink-600">{t("admin_observability_loading")}</p>
        ) : error ? (
          <p className="text-body text-danger" role="alert">
            {adminErrorUserText(error, t)}
          </p>
        ) : ov ? (
          <div className="space-y-6">
            <Link
              href="/admin/indexer"
              className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/70 bg-bg-console/50 p-3 text-left text-ink-800 transition motion-reduce:transition-none hover:border-travel-400 hover:text-travel-700 ${travelFocusRingOffset2Classes}`}
              aria-labelledby={chainBlockId}
            >
              <h2 id={chainBlockId} className="text-small font-semibold uppercase tracking-wide text-ink-500">
                {t("admin_observability_chainId")}
              </h2>
              <p className="mt-1 font-mono text-body text-ink-900">{ov.chain_id ?? t("admin_em_dash")}</p>
            </Link>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">
                  {t("admin_observability_indexer")}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Link
                    href="/admin/indexer"
                    className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
                  >
                    {t("admin_observability_linkIndexer")}
                  </Link>
                  <Link
                    href="/admin/indexer/reconcile-reports"
                    className={`${touchTargetLink44Classes} text-small font-medium text-travel-600 hover:underline underline-offset-2 transition-colors motion-reduce:transition-none ${travelFocusRingOffset2Classes}`}
                  >
                    {t("admin_observability_linkReconcileReports")}
                  </Link>
                </div>
              </div>
              {(() => {
                const idx = asRecord(ov.indexer);
                if (!idx) {
                  return null;
                }
                const cp = asRecord(idx.checkpoint);
                const block = typeof cp?.block_number === "number" ? cp.block_number : null;
                const log = typeof cp?.log_index === "number" ? cp.log_index : null;
                const lag = typeof idx.lag_blocks === "number" ? idx.lag_blocks : null;
                const lagMax = typeof idx.lag_max_blocks === "number" ? idx.lag_max_blocks : null;
                const finalityN = typeof idx.finality_n === "number" ? idx.finality_n : null;
                const lastSeenFn = typeof idx.last_seen_finality_n === "number" ? idx.last_seen_finality_n : null;
                const reorg = idx.reorg_detected === true;
                const replayReq = idx.replay_required === true;
                const lr = asRecord(idx.last_stored_reconciliation) as LastStoredReconciliation | null;
                const reportId = lr?.report_id?.trim();
                const clean = lr?.projection_reconcile_clean;
                const issues = lr?.issues_total;
                const rtLabel = lr?.report_type?.trim();
                const chainLine =
                  typeof lr?.chain_id === "number"
                    ? t("admin_indexer_last_reconcile_chain", { id: String(lr.chain_id) })
                    : t("admin_indexer_last_reconcile_chain_unknown");

                const summaryHref = reportId
                  ? `/admin/indexer/reconcile/${encodeURIComponent(reportId)}`
                  : "/admin/indexer";
                const summaryAria = reportId
                  ? t("admin_indexer_last_reconcile_open")
                  : t("admin_observability_linkIndexer");

                return (
                  <Link
                    href={summaryHref}
                    className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start mb-4 space-y-2 rounded-[var(--radius-md)] border border-ink-200 bg-white/90 p-4 text-left text-ink-800 transition motion-reduce:transition-none hover:border-travel-400 hover:text-travel-700 ${travelFocusRingCoreOffset2WhiteClasses}`}
                    aria-label={summaryAria}
                  >
                    <h3 className="text-small font-semibold text-ink-800">{t("admin_observability_indexer_summary_heading")}</h3>
                    {block !== null && log !== null ? (
                      <p className="text-body text-ink-700">
                        {t("admin_observability_indexer_checkpoint", { block: String(block), log: String(log) })}
                      </p>
                    ) : null}
                    {lag !== null && lagMax !== null ? (
                      <p className="text-body text-ink-700">
                        {t("admin_observability_indexer_lag", { lag: String(lag), max: String(lagMax) })}
                      </p>
                    ) : null}
                    {finalityN !== null ? (
                      <p className="text-body text-ink-700">
                        {t("admin_observability_indexer_finality", {
                          n: String(finalityN),
                          seen: lastSeenFn !== null ? String(lastSeenFn) : t("admin_em_dash"),
                        })}
                      </p>
                    ) : null}
                    <p className="text-body text-ink-700">
                      {reorg ? t("admin_observability_indexer_reorg_true") : t("admin_observability_indexer_reorg_false")}
                    </p>
                    <p className="text-body text-ink-700">
                      {replayReq ? t("admin_observability_indexer_replay_required") : t("admin_observability_indexer_replay_ok")}
                    </p>
                    {reportId ? (
                      <div className="border-t border-ink-200 pt-3 mt-2">
                        <h4 className="text-small font-semibold text-ink-800">{t("admin_indexer_last_reconcile_heading")}</h4>
                        {rtLabel ? (
                          <p className="mt-2 text-meta font-mono text-ink-700">
                            {t("admin_indexer_last_reconcile_report_type", { type: rtLabel })}
                          </p>
                        ) : null}
                        <p className="mt-2 text-body text-ink-700">
                          {clean === true
                            ? t("admin_indexer_last_reconcile_clean_yes")
                            : clean === false
                              ? t("admin_indexer_last_reconcile_clean_no")
                              : t("admin_indexer_last_reconcile_clean_unknown")}
                        </p>
                        <p className="mt-1 text-body text-ink-600">
                          {typeof issues === "number"
                            ? t("admin_indexer_last_reconcile_issues", {
                                count: String(issues),
                                colon: t("market_fin_colon"),
                              })
                            : t("admin_indexer_last_reconcile_issues_unknown", { colon: t("market_fin_colon") })}
                        </p>
                        <p className="mt-1 text-meta text-ink-600">{chainLine}</p>
                        {lr?.created_at && !Number.isNaN(Date.parse(lr.created_at)) ? (
                          <p className="mt-1 text-meta text-ink-500">
                            {t("admin_indexer_last_reconcile_at", { ts: new Date(lr.created_at).toLocaleString() })}
                          </p>
                        ) : null}
                        <p className="mt-2 text-small font-medium text-travel-600">
                          {t("admin_indexer_last_reconcile_open")}
                        </p>
                      </div>
                    ) : null}
                  </Link>
                );
              })()}
              <Link
                href="/admin/indexer"
                className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/50 p-1 text-left transition motion-reduce:transition-none hover:border-travel-400 ${travelFocusRingOffset2Classes}`}
                aria-label={t("admin_observability_linkIndexer")}
              >
                <JsonBlock value={ov.indexer ?? {}} />
              </Link>
            </div>
            <Link
              href="/admin/audit"
              className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/70 bg-bg-console/30 p-3 text-left text-ink-800 transition motion-reduce:transition-none hover:border-travel-400 hover:text-travel-700 ${travelFocusRingOffset2Classes}`}
              aria-labelledby={rateLimitsBlockId}
            >
              <h2 id={rateLimitsBlockId} className="text-small font-semibold uppercase tracking-wide text-ink-500">
                {t("admin_observability_rateLimits")}
              </h2>
              <JsonBlock value={ov.rate_limits ?? {}} />
            </Link>
            <Link
              href="/admin/alerts/incidents"
              className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/70 bg-bg-console/30 p-3 text-left text-ink-800 transition motion-reduce:transition-none hover:border-travel-400 hover:text-travel-700 ${travelFocusRingOffset2Classes}`}
              aria-labelledby={alertsBlockId}
            >
              <h2 id={alertsBlockId} className="text-small font-semibold uppercase tracking-wide text-ink-500">
                {t("admin_observability_alerts")}
              </h2>
              <JsonBlock value={ov.alerts ?? {}} />
            </Link>
          </div>
        ) : (
          <p className="text-body text-ink-600">{t("admin_observability_noData")}</p>
        )}
      </section>
    </main>
  );
}
