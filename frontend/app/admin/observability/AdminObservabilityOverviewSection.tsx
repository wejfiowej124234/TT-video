"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { asRecord, type LastStoredReconciliation, type OverviewBody } from "./observabilityPageModel";
import { AdminObservabilityJsonBlock } from "./AdminObservabilityJsonBlock";
import { ADMIN_FORM_FIELD_FOCUS_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
type Props = {
  loading: boolean;
  error: AdminFetchErrorKind | null;
  ov: OverviewBody["overview"] | undefined;
  chainBlockId: string;
  rateLimitsBlockId: string;
  alertsBlockId: string;
};

export function AdminObservabilityOverviewSection({
  loading,
  error,
  ov,
  chainBlockId,
  rateLimitsBlockId,
  alertsBlockId,
}: Props) {
  const { t } = useTranslation();

  return (
    <section className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4" aria-label={t("admin_observability_overview_aria")}>
      {loading ? (
        <AdminListLoadingStatus message={t("admin_observability_loading")} className="text-body text-ink-600" />
      ) : error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : ov ? (
        <div className="space-y-6">
          <Link
            href="/admin/indexer"
            className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/70 bg-bg-console/50 p-3 text-left text-ink-800 transition motion-reduce:transition-none hover:border-ink-400 hover:text-ink-900 ${ADMIN_LINK_FOCUS_CLASS}`}
            aria-labelledby={chainBlockId}
          >
            <h2 id={chainBlockId} className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_observability_chainId")}
            </h2>
            <p className="mt-1 font-mono text-body text-ink-900">{ov.chain_id ?? t("admin_em_dash")}</p>
          </Link>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-small font-semibold uppercase tracking-wide text-ink-500">{t("admin_observability_indexer")}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link
                  href="/admin/indexer"
                  className={`${adminPageNavLinkClass()}`}
                >
                  {t("admin_observability_linkIndexer")}
                </Link>
                <Link
                  href="/admin/indexer/reconcile-reports"
                  className={`${adminPageNavLinkClass()}`}
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

              const summaryHref = reportId ? `/admin/indexer/reconcile/${encodeURIComponent(reportId)}` : "/admin/indexer";
              const summaryAria = reportId ? t("admin_indexer_last_reconcile_open") : t("admin_observability_linkIndexer");

              return (
                <Link
                  href={summaryHref}
                  className={`${touchTargetLink44Classes} !flex-col !items-stretch !justify-start mb-4 space-y-2 rounded-[var(--radius-md)] border border-ink-200 bg-white/90 p-4 text-left text-ink-800 transition motion-reduce:transition-none hover:border-ink-400 hover:text-ink-900 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
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
                      <p className="mt-2 text-small font-medium text-ink-700">{t("admin_indexer_last_reconcile_open")}</p>
                    </div>
                  ) : null}
                </Link>
              );
            })()}
            <Link
              href="/admin/indexer"
              className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/50 p-1 text-left transition motion-reduce:transition-none hover:border-ink-400 ${ADMIN_LINK_FOCUS_CLASS}`}
              aria-label={t("admin_observability_linkIndexer")}
            >
              <AdminObservabilityJsonBlock value={ov.indexer ?? {}} />
            </Link>
          </div>
          <Link
            href="/admin/audit"
            className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/70 bg-bg-console/30 p-3 text-left text-ink-800 transition motion-reduce:transition-none hover:border-ink-400 hover:text-ink-900 ${ADMIN_LINK_FOCUS_CLASS}`}
            aria-labelledby={rateLimitsBlockId}
          >
            <h2 id={rateLimitsBlockId} className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_observability_rateLimits")}
            </h2>
            <AdminObservabilityJsonBlock value={ov.rate_limits ?? {}} />
          </Link>
          <Link
            href="/admin/alerts/incidents"
            className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/70 bg-bg-console/30 p-3 text-left text-ink-800 transition motion-reduce:transition-none hover:border-ink-400 hover:text-ink-900 ${ADMIN_LINK_FOCUS_CLASS}`}
            aria-labelledby={alertsBlockId}
          >
            <h2 id={alertsBlockId} className="text-small font-semibold uppercase tracking-wide text-ink-500">
              {t("admin_observability_alerts")}
            </h2>
            <AdminObservabilityJsonBlock value={ov.alerts ?? {}} />
          </Link>
        </div>
      ) : (
        <p className="text-body text-ink-600">{t("admin_observability_noData")}</p>
      )}
    </section>
  );
}
