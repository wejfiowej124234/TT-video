"use client";

import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { ReconcileReportsFilterCard } from "./ReconcileReportsFilterCard";
import { ReconcileReportsPageHeader } from "./ReconcileReportsPageHeader";
import { ReconcileReportsTableSection } from "./ReconcileReportsTableSection";
import { useAdminIndexerReconcileReportsPage } from "./useAdminIndexerReconcileReportsPage";

export function ReconcileReportsPageMain() {
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
    handleCopyUrl,
    meta,
    error,
    exportError,
    router,
    reportType,
    chainIdStr,
    projectionClean,
    issuesMinStr,
    limit,
    appliedFilters,
    hasActiveFilters,
    filterDraft,
    setFilterDraft,
    chainFilterDraft,
    setChainFilterDraft,
    cleanFilterDraft,
    setCleanFilterDraft,
    issuesMinDraft,
    setIssuesMinDraft,
    applyFilters,
    resetFilters,
    reportTypeInputId,
    chainIdInputId,
    projectionCleanSelectId,
    issuesMinInputId,
    limitSelectId,
    datalistId,
    reconcileReportFilterHintId,
    reconcileChainFilterHintId,
    reconcileIssuesMinHintId,
    reconcileActiveReportTypeDescId,
    reconcileActiveChainDescId,
    reconcileActiveCleanDescId,
    reconcileActiveIssuesMinDescId,
    adminAppliedFiltersDescId,
    adminListApplyResetHintId,
    items,
    total,
    page,
    totalPages,
    rangeFrom,
    rangeTo,
    limitOptions,
    listQuery,
    onPerPageLimitChange,
  } = useAdminIndexerReconcileReportsPage();

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_indexer_reconcile_reports_title")}
      subtitle={t("admin_indexer_reconcile_reports_subtitle")}
      preHeader={
        <p id={reconcileReportsExportFilterHintId} className="text-meta text-ink-600 leading-relaxed">
          {t("admin_indexer_reconcile_reports_export_filter_hint")}
        </p>
      }
      headerAside={
        <ReconcileReportsPageHeader
          t={t}
          pageTitleId={pageTitleId}
          reconcileReportsExportFilterHintId={reconcileReportsExportFilterHintId}
          loading={loading}
          exportingFormat={exportingFormat}
          urlCopied={urlCopied}
          onExportCsv={onExportCsv}
          onExportJson={onExportJson}
          onExportCsvAll={onExportCsvAll}
          onExportJsonAll={onExportJsonAll}
          onCopyUrl={handleCopyUrl}
        />
      }
    >
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />

      {exportError ? (
        <div className="mt-4">
          <AdminListFetchError errorKind={exportError} message={adminErrorUserText(exportError, t)} />
        </div>
      ) : null}

      <ReconcileReportsFilterCard
        t={t}
        router={router}
        reportType={reportType}
        chainIdStr={chainIdStr}
        projectionClean={projectionClean}
        issuesMinStr={issuesMinStr}
        limit={limit}
        loading={loading}
        error={error}
        appliedFilters={appliedFilters}
        hasActiveFilters={hasActiveFilters}
        filterDraft={filterDraft}
        setFilterDraft={setFilterDraft}
        chainFilterDraft={chainFilterDraft}
        setChainFilterDraft={setChainFilterDraft}
        cleanFilterDraft={cleanFilterDraft}
        setCleanFilterDraft={setCleanFilterDraft}
        issuesMinDraft={issuesMinDraft}
        setIssuesMinDraft={setIssuesMinDraft}
        onApplyFilters={applyFilters}
        onResetFilters={resetFilters}
        reportTypeInputId={reportTypeInputId}
        chainIdInputId={chainIdInputId}
        projectionCleanSelectId={projectionCleanSelectId}
        issuesMinInputId={issuesMinInputId}
        limitSelectId={limitSelectId}
        datalistId={datalistId}
        reconcileReportFilterHintId={reconcileReportFilterHintId}
        reconcileChainFilterHintId={reconcileChainFilterHintId}
        reconcileIssuesMinHintId={reconcileIssuesMinHintId}
        reconcileActiveReportTypeDescId={reconcileActiveReportTypeDescId}
        reconcileActiveChainDescId={reconcileActiveChainDescId}
        reconcileActiveCleanDescId={reconcileActiveCleanDescId}
        reconcileActiveIssuesMinDescId={reconcileActiveIssuesMinDescId}
        adminAppliedFiltersDescId={adminAppliedFiltersDescId}
        adminListApplyResetHintId={adminListApplyResetHintId}
      />

      <ReconcileReportsTableSection
        t={t}
        loading={loading}
        error={error}
        items={items}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        rangeFrom={rangeFrom}
        rangeTo={rangeTo}
        limitOptions={limitOptions}
        listQuery={listQuery}
        onPerPageLimitChange={onPerPageLimitChange}
      />
    </AdminListPageChrome>
  );
}
