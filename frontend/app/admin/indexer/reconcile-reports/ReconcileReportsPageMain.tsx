"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSectionBackLinks } from "@/components/admin/AdminFinanceSectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminReconcileReportsListSnapshot } from "@/lib/admin/adminReconcileReportsListSnapshot";
import { RECONCILE_REPORTS_LIST_RELATED_FOLD_LINKS } from "@/lib/admin/adminReconcileReportsListRelatedFoldLinks";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { adminPageNavLinkClass } from "@/lib/adminUi";
import { ReconcileReportsExportToolbar } from "./ReconcileReportsExportToolbar";
import { ReconcileReportsFilterCard } from "./ReconcileReportsFilterCard";
import { ReconcileReportsTableSection } from "./ReconcileReportsTableSection";
import { useAdminIndexerReconcileReportsPage } from "./useAdminIndexerReconcileReportsPage";

export function ReconcileReportsPageMain() {
  const {
    t,
    pageTitleId,
    reconcileReportsExportFilterHintId,
    loading,
    refreshing,
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

  const listSnapshot = useMemo(
    () =>
      adminReconcileReportsListSnapshot({
        total,
        page,
        limit,
        reportType,
        hasActiveFilters,
      }),
    [total, page, limit, reportType, hasActiveFilters],
  );

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_indexer_reconcile_reports_title")}
      subtitle={t("admin_indexer_reconcile_reports_subtitle_l5")}
      preHeader={
        <p id={reconcileReportsExportFilterHintId} className="text-meta text-ink-600 leading-relaxed">
          {t("admin_indexer_reconcile_reports_export_filter_hint")}
        </p>
      }
      headerAside={
        <>
          <AdminFinanceSectionBackLinks />
          <Link
            href="/admin/indexer"
            className={adminPageNavLinkClass()}
            data-tt-admin-reconcile-reports-back-indexer="1"
          >
            {t("admin_indexer_reconcile_reports_back")}
          </Link>
        </>
      }
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={RECONCILE_REPORTS_LIST_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_finance_related_aria"
        foldSummaryKey="admin_finance_related_fold"
        dataTtFold="reconcile-reports-list"
      />
      <ReconcileReportsExportToolbar
        t={t}
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
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.FINANCE_READ}
        messageKey="admin_perm_denied_finance_read"
      />
      <AdminFinanceSuiteDepthNotice />
      <AdminFinanceSuitePartialChecklist />
      <AdminFinanceModuleDepthWorkspace
        reconcileReports={{
          ...listSnapshot,
          loading,
          error: Boolean(error),
        }}
      />
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
        refreshing={refreshing}
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
