"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { AdminFinanceSectionBackLinks } from "@/components/admin/AdminFinanceSectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminAlertError } from "@/components/admin/AdminAlertError";
import { AdminMetaBuildSection, AdminMetaNoteLink } from "@/components/admin/AdminMetaBuildPanel";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { INDEXER_RECONCILE_DETAIL_RELATED_FOLD_LINKS } from "@/lib/admin/adminIndexerReconcileDetailRelatedFoldLinks";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { JsonBlock, StoredReportSummaryDigest } from "./adminIndexerReconcileReportPageDigests";
import { downloadJsonFile } from "./adminIndexerReconcileReportPageModel";
import { useAdminIndexerReconcileReportPage } from "./useAdminIndexerReconcileReportPage";
import { ADMIN_FOCUS_RING_CORE_CLASS, ADMIN_LINK_FOCUS_CLASS, ADMIN_SHELL_SECONDARY_BTN_CLASS, adminPageNavLinkClass,
  ADMIN_FILTER_RESET_BTN_CLASS,
  ADMIN_HUB_DEPTH_LINK_CARD_CLASS,
  ADMIN_MOTION_CARD_HOVER_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";
/** 70 / 110 / 200：对账报告最小只读（须 admin）。 */
export function AdminIndexerReconcileReportPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const reportJsonBlockHeadingId = useId();
  const reconcileDetailToolsFilterHintId = useId();
  const { reportId, loading, refreshing, error, payload, meta, refresh } = useAdminIndexerReconcileReportPage();

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
          <p>{t("admin_indexer_reconcile_subtitle_l5")}</p>
          {reportId ? (
            <p className="mt-2 font-mono text-small text-ink-500 break-all">
              {t("admin_indexer_reconcile_idLabel")}: {reportId}
            </p>
          ) : null}
          {rep && !(loading && !payload) && !error ? (
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
        <AdminFinanceSectionBackLinks>
          <Link
            href="/admin/indexer/reconcile-reports"
            className={adminPageNavLinkClass()}
            data-tt-admin-indexer-reconcile-back-list="1"
          >
            {t("admin_indexer_reconcile_list_link")}
          </Link>
        </AdminFinanceSectionBackLinks>
      }
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={INDEXER_RECONCILE_DETAIL_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_finance_related_aria"
        foldSummaryKey="admin_finance_related_fold"
        dataTtFold="indexer-reconcile-detail"
      />
      {reportId ? (
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          <p id={reconcileDetailToolsFilterHintId} className="w-full text-meta text-ink-600 sm:text-end">
            {t("admin_indexer_reconcile_detail_tools_filter_hint")}
          </p>
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
              className={`inline-flex min-h-[44px] items-center justify-center ${ADMIN_FILTER_RESET_BTN_CLASS} disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
              disabled={loading && !payload}
              data-tt-admin-indexer-reconcile-refresh="1"
            >
              {t("admin_indexer_reconcile_refresh")}
            </button>
          </form>
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
                className={`${ADMIN_SHELL_SECONDARY_BTN_CLASS} ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
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
                className={`${ADMIN_SHELL_SECONDARY_BTN_CLASS} ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
              >
                {t("admin_indexer_reconcile_download_json")}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      <AdminWarmL5Surface as="section" className="mt-6" aria-label={t("admin_indexer_reconcile_payload_aria")}>
        {!reportId ? (
          <AdminAlertError message={t("admin_indexer_reconcile_missingId")} />
        ) : loading && !payload ? (
            <AdminListLoadingStatus message={t("admin_indexer_reconcile_loading")} className="text-body text-ink-600" />
          ) : error && !payload ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : payload?.report ? (
          <div
            className={`space-y-4${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
            data-tt-admin-detail-refreshing={refreshing ? "1" : undefined}
          >
            {payload.note ? (
              <AdminMetaNoteLink>{payload.note}</AdminMetaNoteLink>
            ) : null}
            {typeof payload.report === "object" && payload.report !== null ? (
              <StoredReportSummaryDigest report={payload.report as Record<string, unknown>} t={t} />
            ) : null}
            <Link
              href="/admin/indexer/reconcile-reports"
              className={`${touchTargetLink44Classes} !flex !w-full !flex-col !items-stretch !justify-start ${ADMIN_HUB_DEPTH_LINK_CARD_CLASS} p-1 ${ADMIN_MOTION_CARD_HOVER_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`}
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
      </AdminWarmL5Surface>
    </AdminDetailPageChrome>
  );
}
