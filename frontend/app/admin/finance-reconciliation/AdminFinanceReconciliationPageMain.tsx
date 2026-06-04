"use client";

import Link from "next/link";
import { useId } from "react";

import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import FinanceReconciliationEpicDHint from "@/components/admin/FinanceReconciliationEpicDHint";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { useTranslation } from "@/components/LocaleProvider";

import { AdminFinanceReconciliationApiSection } from "./AdminFinanceReconciliationApiSection";
import { AdminFinanceReconciliationDriftSection } from "./AdminFinanceReconciliationDriftSection";
import { AdminFinanceReconciliationNavSection } from "./AdminFinanceReconciliationNavSection";
import type { AdminFinanceReconciliationPageViewModel } from "./useAdminFinanceReconciliationPage";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";

type Props = AdminFinanceReconciliationPageViewModel;

export function AdminFinanceReconciliationPageMain(props: Props) {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const disclaimerId = useId();
  const apiSectionId = useId();
  const driftSectionId = useId();
  const driftSemanticNoteId = useId();

  const {
    na,
    loading,
    error,
    metaRows,
    summaryRows,
    lastRows,
    hasReportId,
    reportIdRaw,
    driftStripLoading,
    crossErr,
    driftSummaryErr,
    crossNorm,
    driftNorm,
    hubAlignment,
    driftSummaryDeltaLine,
    crossDriftDeltaLine,
  } = props;

  const alignmentLabel =
    hubAlignment === "aligned"
      ? t("admin_finance_reconciliation_chain_alignment_aligned")
      : hubAlignment === "not_aligned"
        ? t("admin_finance_reconciliation_chain_alignment_not_aligned")
        : t("admin_finance_reconciliation_chain_alignment_unknown");

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_finance_reconciliation_title")}
      subtitle={
        <>
          <div
            id={disclaimerId}
            className="rounded-[var(--radius-lg)] border border-ink-200 bg-ink-50/90 p-4 text-body text-ink-800"
            role="note"
          >
            {t("admin_finance_reconciliation_disclaimer")}
          </div>
          <p className="mt-3">{t("admin_finance_reconciliation_intro")}</p>
        </>
      }
      headerAside={
        <Link
          href="/admin"
          className={`${adminPageNavLinkClass()} shrink-0`}
        >
          {t("admin_schema_back")}
        </Link>
      }
    >
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.FINANCE_READ}
        messageKey="admin_perm_denied_finance_read"
      />
      <AdminFinanceSuiteDepthNotice />
      <AdminFinanceSuitePartialChecklist />
      <AdminFinanceModuleDepthWorkspace
        reconciliation={{
          alignmentLabel,
          driftDeltaLine: driftSummaryDeltaLine,
          crossDeltaLine: crossDriftDeltaLine,
          loading: driftStripLoading,
          error: Boolean(crossErr || driftSummaryErr),
        }}
      />

      <AdminFinanceReconciliationApiSection
        apiSectionId={apiSectionId}
        loading={loading}
        error={error}
        metaRows={metaRows}
        summaryRows={summaryRows}
        lastRows={lastRows}
        hasReportId={hasReportId}
        reportIdRaw={reportIdRaw}
      />
      <AdminFinanceReconciliationDriftSection
        driftSectionId={driftSectionId}
        driftSemanticNoteId={driftSemanticNoteId}
        na={na}
        driftStripLoading={driftStripLoading}
        crossErr={crossErr}
        driftSummaryErr={driftSummaryErr}
        crossNorm={crossNorm}
        driftNorm={driftNorm}
        hubAlignment={hubAlignment}
        driftSummaryDeltaLine={driftSummaryDeltaLine}
        crossDriftDeltaLine={crossDriftDeltaLine}
      />
      <FinanceReconciliationEpicDHint />
      <AdminFinanceReconciliationNavSection />
    </AdminListPageChrome>
  );
}
