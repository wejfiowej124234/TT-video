"use client";

import Link from "next/link";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { ADMIN_FOCUS_RING_CORE_CLASS, ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
type TFn = (key: string) => string;

type ExportJob = null | "csv" | "json" | "csv_all" | "json_all";

export function ReconcileReportsPageHeader(props: {
  t: TFn;
  pageTitleId: string;
  reconcileReportsExportFilterHintId: string;
  loading: boolean;
  exportingFormat: ExportJob;
  urlCopied: boolean;
  onExportCsv: () => void;
  onExportJson: () => void;
  onExportCsvAll: () => void;
  onExportJsonAll: () => void;
  onCopyUrl: () => void;
}) {
  const {
    t,
    pageTitleId,
    reconcileReportsExportFilterHintId,
    loading,
    exportingFormat,
    urlCopied,
    onExportCsv,
    onExportJson,
    onExportCsvAll,
    onExportJsonAll,
    onCopyUrl,
  } = props;

  void pageTitleId;

  return (
    <div className="flex flex-wrap items-center gap-3">
        <form
          className="inline"
          aria-describedby={reconcileReportsExportFilterHintId}
          onSubmit={(e) => {
            e.preventDefault();
            onExportCsv();
          }}
        >
          <button
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-white`}
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
            onExportJson();
          }}
        >
          <button
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 bg-white px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-white`}
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
            onExportCsvAll();
          }}
        >
          <button
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 bg-bg-console/40 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
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
            onExportJsonAll();
          }}
        >
          <button
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-200 bg-bg-console/40 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
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
          onSubmit={(e) => {
            e.preventDefault();
            onCopyUrl();
          }}
        >
          <button
            type="submit"
            className={`inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-md)] border border-ink-300 px-3 py-1.5 text-small font-medium text-ink-800 hover:bg-ink-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
          >
            {urlCopied ? t("admin_indexer_reconcile_reports_copied") : t("admin_indexer_reconcile_reports_copy_url")}
          </button>
        </form>
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
          {t("admin_indexer_reconcile_reports_back")}
        </Link>
    </div>
  );
}
