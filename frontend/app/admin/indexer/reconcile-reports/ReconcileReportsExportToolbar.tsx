"use client";

import { ADMIN_FOCUS_RING_CORE_CLASS, ADMIN_SHELL_SECONDARY_BTN_CLASS } from "@/lib/adminUi";

type TFn = (key: string) => string;

type ExportJob = null | "csv" | "json" | "csv_all" | "json_all";

/** 对账报告列表 · 导出/复制工具条（页身，非顶栏 link wall）。 */
export function ReconcileReportsExportToolbar(props: {
  t: TFn;
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

  return (
    <div
      className="mb-4 flex flex-wrap items-center gap-2 sm:justify-end"
      data-tt-admin-reconcile-reports-export-toolbar="1"
    >
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
          className={`${ADMIN_SHELL_SECONDARY_BTN_CLASS} disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
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
          className={`${ADMIN_SHELL_SECONDARY_BTN_CLASS} disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
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
          className={`${ADMIN_SHELL_SECONDARY_BTN_CLASS} disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
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
          className={`${ADMIN_SHELL_SECONDARY_BTN_CLASS} disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
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
          className={`${ADMIN_SHELL_SECONDARY_BTN_CLASS} disabled:opacity-50 ${ADMIN_FOCUS_RING_CORE_CLASS} focus-visible:ring-offset-bg-console`}
        >
          {urlCopied ? t("admin_indexer_reconcile_reports_copied") : t("admin_indexer_reconcile_reports_copy_url")}
        </button>
      </form>
    </div>
  );
}
