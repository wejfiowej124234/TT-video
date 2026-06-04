"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
type Row = { path: string; text: string };

type Props = {
  apiSectionId: string;
  loading: boolean;
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
  error,
  metaRows,
  summaryRows,
  lastRows,
  hasReportId,
  reportIdRaw,
}: Props) {
  const { t } = useTranslation();

  return (
    <section
      className="mt-8 rounded-[var(--radius-xl)] border border-ink-200 bg-white p-5 shadow-soft"
      aria-labelledby={apiSectionId}
    >
      <h2 id={apiSectionId} className="text-body font-semibold text-ink-900">
        {t("admin_finance_reconciliation_finance_summary_api_heading")}
      </h2>
      <p className="mt-1 text-meta text-ink-600">{t("admin_finance_reconciliation_finance_summary_api_hint")}</p>

      {loading ? (
        <AdminListLoadingStatus message={t("admin_finance_reconciliation_summary_loading")} className="mt-4 text-body text-ink-600" />
      ) : error ? (
        <AdminListFetchError className="mt-4" errorKind={error} message={adminErrorUserText(error, t)} />
      ) : (
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="text-small font-semibold text-ink-700">{t("admin_finance_reconciliation_meta_heading")}</h3>
            <dl className="mt-2 divide-y divide-ink-100 border border-ink-100 rounded-[var(--radius-md)]">
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
            <dl className="mt-2 divide-y divide-ink-100 border border-ink-100 rounded-[var(--radius-md)]">
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
            <dl className="mt-2 divide-y divide-ink-100 border border-ink-100 rounded-[var(--radius-md)]">
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
    </section>
  );
}
