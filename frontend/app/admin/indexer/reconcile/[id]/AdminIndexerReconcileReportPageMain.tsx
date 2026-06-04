"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { JsonBlock, StoredReportSummaryDigest } from "./adminIndexerReconcileReportPageDigests";
import { downloadJsonFile } from "./adminIndexerReconcileReportPageModel";
import { useAdminIndexerReconcileReportPage } from "./useAdminIndexerReconcileReportPage";
import { ADMIN_FOCUS_RING_CORE_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
/** 70 / 110 / 200：对账报告最小只读（须 admin）。 */
export function AdminIndexerReconcileReportPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const reportJsonBlockHeadingId = useId();
  const reconcileDetailToolsFilterHintId = useId();
  const { reportId, loading, error, payload, meta, refresh } = useAdminIndexerReconcileReportPage();

  const [jsonCopied, setJsonCopied] = useState(false);
  const copyFlashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyFlashTimer.current) clearTimeout(copyFlashTimer.current);
    };
  }, []);

  const reportJson =
    payload?.report != null ? JSON.stringify(payload.report, null, 2) : null;
  const rep =
    payload != null &&
    payload.report !== null &&
    typeof payload.report === "object"
      ? (payload.report as Record<string, unknown>)
      : null;
  const headerReportType = typeof rep?.report_type === "string" ? rep.report_type.trim() : "";
  const headerChainId = rep?.chain_id;

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_indexer_reconcile_title")}
      subtitle={
        <>
          <p>{t("admin_indexer_reconcile_subtitle")}</p>
          {reportId ? (
            <p className="mt-2 font-mono text-small text-ink-500 break-all">
              {t("admin_indexer_reconcile_idLabel")}: {reportId}
            </p>
          ) : null}
          {rep && !loading && !error ? (
            <div className="mt-2 space-y-1">
              {headerReportType ? (
                <p className="font-mono text-small text-ink-700">
                  {t("admin_indexer_last_reconcile_report_type", { type: headerReportType })}
                </p>
              ) : null}
              <p className="text-meta text-ink-600">
                {typeof headerChainId === "number"
                  ? t("admin_indexer_last_reconcile_chain", { id: String(headerChainId) })
                  : t("admin_indexer_last_reconcile_chain_unknown")}
              </p>
            </div>
          ) : null}
        </>
      }
      headerAside={
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
                  refresh();
                }}
              >
                <button
                  type="submit"
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
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
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
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
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
                >
                  {t("admin_indexer_reconcile_download_json")}
                </button>
              </form>
            ) : null}
            <Link
              href="/admin/indexer/reconcile-reports"
              className={`${adminPageNavLinkClass()}`}
            >
              {t("admin_indexer_reconcile_list_link")}
            </Link>
            <Link
              href="/admin/observability"
              className={`${adminPageNavLinkClass()}`}
            >
              {t("admin_observability_title")}
            </Link>
            <Link
              href="/admin/indexer"
              className={`${adminPageNavLinkClass()}`}
            >
              {t("admin_indexer_reconcile_backIndexer")}
            </Link>
            <Link href="/admin" className={`${adminPageNavLinkClass()}`}>
              {t("admin_indexer_back")}
            </Link>
          </div>
        </div>
      }
    >
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <section className="mt-6 rounded-[var(--radius-xl)] border border-ink-200 bg-bg-console p-4" aria-label={t("admin_indexer_reconcile_payload_aria")}>
        {!reportId ? (
          <AdminAlertError message={t("admin_indexer_reconcile_missingId")} />
        ) : loading ? (
            <AdminListLoadingStatus message={t("admin_indexer_reconcile_loading")} className="text-body text-ink-600" />
          ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
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
              className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start rounded-[var(--radius-md)] border border-ink-200/70 p-1 text-left transition hover:border-ink-400 ${ADMIN_LINK_FOCUS_CLASS}`}
              aria-labelledby={reportJsonBlockHeadingId}
            >
              <h2 id={reportJsonBlockHeadingId} className="text-small font-semibold uppercase tracking-wide text-ink-500">
                {t("admin_indexer_reconcile_reportBlock")}
              </h2>
              <JsonBlock value={payload.report} />
            </Link>
          </div>
        ) : (
          <p className="text-body text-ink-700" role="status">
            {t("admin_indexer_reconcile_empty")}
          </p>
        )}
      </section>
    </AdminDetailPageChrome>
  );
}
