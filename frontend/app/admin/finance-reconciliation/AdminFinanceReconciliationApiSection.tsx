"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass,
  ADMIN_DEFINITION_LIST_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,} from "@/lib/adminUi";
type Row = { path: string; text: string };

type Props = {
  apiSectionId: string;
  loading: boolean;
  refreshing: boolean;
  error: AdminFetchErrorKind | null;
  metaRows: Row[];
  summaryRows: Row[];
  lastRows: Row[];
  hasReportId: boolean;
  reportIdRaw: string;
};

export function AdminFinanceReconciliationApiSection({
  apiSectionId,
  loading,
  refreshing,
  error,
  metaRows,
  summaryRows,
  lastRows,
  hasReportId,
  reportIdRaw,
}: Props) {
  const { t } = useTranslation();
  const hasCachedRows = metaRows.length > 0 || summaryRows.length > 0 || lastRows.length > 0;

  return (
    <AdminWarmL5Surface
      as="section"
      className="mt-8"
      aria-labelledby={apiSectionId}
      data-tt-admin-fin-reconciliation-api="1"
    >
      <h2 id={apiSectionId} className="text-body font-semibold text-ink-900">
        {t("admin_finance_reconciliation_finance_summary_api_heading")}
      </h2>
      <p className="mt-1 text-meta text-ink-600">{t("admin_finance_reconciliation_finance_summary_api_hint")}</p>

      {loading && !hasCachedRows ? (
        <AdminListLoadingStatus message={t("admin_finance_reconciliation_summary_loading")} className="mt-4 text-body text-ink-600" />
      ) : error ? (
        <AdminListFetchError className="mt-4" errorKind={error} message={adminErrorUserText(error, t)} />
      ) : (
        <div
          className={`mt-4 space-y-6${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
          data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
        >
          <div>
            <h3 className="text-small font-semibold text-ink-700">{t("admin_finance_reconciliation_meta_heading")}</h3>
            <dl className={ADMIN_DEFINITION_LIST_CLASS}>
              {metaRows.map(({ path, text }) => (
                <div
                  key={path}
                  className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
                >
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
            <dl className={ADMIN_DEFINITION_LIST_CLASS}>
              {summaryRows.map(({ path, text }) => (
                <div
                  key={path}
                  className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
                >
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
            <dl className={ADMIN_DEFINITION_LIST_CLASS}>
              {lastRows.map(({ path, text }) => (
                <div
                  key={path}
                  className="grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center"
                >
                  <dt className="font-mono text-meta text-ink-500 break-all">{path}</dt>
                  <dd className="text-body text-ink-800 break-words">{text}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              <Link
                href="/admin/indexer/reconcile-reports"
                className={`${adminPageNavLinkClass()}`}
              >
                {t("admin_finance_reconciliation_open_reconcile_reports")}
              </Link>
              {hasReportId ? (
                <Link
                  href={`/admin/indexer/reconcile/${encodeURIComponent(reportIdRaw)}`}
                  className={`${adminPageNavLinkClass()}`}
                >
                  {t("admin_finance_reconciliation_open_reconcile_detail")}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </AdminWarmL5Surface>
  );
}
