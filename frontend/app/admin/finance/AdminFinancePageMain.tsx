"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useId, useMemo } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import AdminAuditCompareLinks from "@/components/admin/AdminAuditCompareLinks";
import { AdminFinancePeriodControl } from "@/components/admin/AdminFinancePeriodControl";
import { AdminHomeTreasuryPoolStrip } from "@/components/admin/AdminHomeTreasuryPoolStrip";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { AdminMetaBuildSection, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { adminErrorUserText } from "@/lib/adminFetchDisplay";
import { financePeerRelatedFoldLinks } from "@/lib/admin/adminFinanceRelatedFoldLinks";

import { AdminFinanceSectionBackLinks } from "@/components/admin/AdminFinanceSectionBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminFinanceMetaLedgerSection } from "./AdminFinanceMetaLedgerSection";
import { AdminFinanceSummaryGridSection } from "./AdminFinanceSummaryGridSection";
import { resolveAdminFinanceDerived } from "./adminFinancePageDerived";
import { useAdminFinancePage } from "./useAdminFinancePage";
import { AdminFinanceSummaryDataSourceStrip } from "@/components/admin/AdminFinanceSummaryDataSourceStrip";
import { AdminFinanceEscrowFundSummaryStrip } from "@/components/admin/AdminFinanceEscrowFundSummaryStrip";
import { AdminFinanceRefundProgressStrip } from "@/components/admin/AdminFinanceRefundProgressStrip";
import {
  ADMIN_FIN_SUITE_EXPORT_FOCUS_RING_CLASS,
  ADMIN_FORM_FIELD_FOCUS_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
  ADMIN_SHELL_SECONDARY_BTN_CLASS,
} from "@/lib/adminUi";

/**
 * OD-C-02 · SUITE_PRIMARY_LEGACY_REDIRECT
 * Bare `/admin/finance` soft-redirects to suite; depth leaf only when both
 * `fin_suite_depth=partial` and `fin_suite_module` are present.
 */
export default function AdminFinancePageMain() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageTitleId = useId();
  const financeMetaDlHeadingId = useId();
  const exportCsvFormatHintId = useId();
  const financeExportSubmitFilterHintId = useId();
  const finSuiteDepth = searchParams.get("fin_suite_depth") ?? "";
  const finSuiteModule = searchParams.get("fin_suite_module") ?? "";
  const isSuiteDepthLeaf = finSuiteDepth === "partial" && Boolean(finSuiteModule);

  useEffect(() => {
    if (!isSuiteDepthLeaf) {
      router.replace("/admin/finance-suite");
    }
  }, [isSuiteDepthLeaf, router]);

  const {
    loading,
    refreshing,
    error,
    exporting,
    exportError,
    meta,
    summary,
    downloadFinanceSummaryCsv,
  } = useAdminFinancePage();

  const derived = useMemo(() => resolveAdminFinanceDerived(meta), [meta]);
  const exportFromSuite = finSuiteModule === "export";

  if (!isSuiteDepthLeaf) {
    return null;
  }

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_finance_title")}
      subtitle={t("admin_finance_subtitle_l5")}
      headerAside={
        <>
          <AdminFinanceSectionBackLinks />
          <form
            className={`flex max-w-sm flex-col gap-1 sm:max-w-xs sm:items-end ${exportFromSuite ? ADMIN_FIN_SUITE_EXPORT_FOCUS_RING_CLASS : ""}`}
            aria-label={t("admin_finance_export_csv_aria")}
            data-tt-admin-fin-suite-export-focus={exportFromSuite ? "1" : undefined}
            aria-describedby={`${financeExportSubmitFilterHintId} ${exportCsvFormatHintId}`}
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void downloadFinanceSummaryCsv();
            }}
          >
            <p id={financeExportSubmitFilterHintId} className="text-meta text-ink-600 leading-relaxed sm:text-right">
              {t("admin_finance_export_submit_filter_hint")}
            </p>
            <button
              type="submit"
              className={`${ADMIN_SHELL_SECONDARY_BTN_CLASS} disabled:opacity-50 ${ADMIN_FORM_FIELD_FOCUS_CLASS}`}
              disabled={loading || exporting}
              aria-label={t("admin_finance_export_csv_aria")}
            >
              {exporting ? t("admin_finance_exporting") : t("admin_finance_export_csv")}
            </button>
            <p id={exportCsvFormatHintId} className="text-meta text-ink-500 sm:text-right">
              {t("admin_finance_export_csv_format_hint")}
            </p>
          </form>
        </>
      }
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={financePeerRelatedFoldLinks("/admin/finance")}
        ariaLabelKey="admin_finance_related_aria"
        foldSummaryKey="admin_finance_related_fold"
        dataTtFold="finance-summary"
      />
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.FINANCE_READ}
        messageKey="admin_perm_denied_finance_read"
      />

      <div className="mt-4" data-tt-admin-finance-period-host="1">
        <AdminFinancePeriodControl />
      </div>

      {!loading ? (
        <div className="mt-4">
          <AdminFinanceSummaryDataSourceStrip meta={meta} summary={summary} />
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="mt-4 space-y-4">
          <AdminFinanceEscrowFundSummaryStrip summary={summary} />
          <AdminFinanceRefundProgressStrip summary={summary} />
        </div>
      ) : null}

      <div className="mt-4" data-tt-admin-finance-treasury-bridge="1">
        <AdminHomeTreasuryPoolStrip />
      </div>

      <AdminFinanceSuiteDepthNotice />
      <AdminFinanceSuitePartialChecklist />
      <AdminFinanceModuleDepthWorkspace
        settlement={{
          summary: (summary ?? null) as Record<string, unknown> | null,
          meta: meta as Record<string, unknown> | null,
          loading,
        }}
        exportPanel={{
          exporting,
          onExport: () => void downloadFinanceSummaryCsv(),
          meta: meta as Record<string, unknown> | null,
        }}
      />

      <AdminAuditCompareLinks />

      <AdminMetaBuildSection meta={meta && isAdminMetaRecord(meta) ? meta : null} loading={loading} error={error} />

      {loading ? (
        <AdminListLoadingStatus message={t("admin_loading")} />
      ) : null}

      {error ? (
        <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
      ) : null}

      {exportError ? (
        <AdminListFetchError errorKind={exportError} message={adminErrorUserText(exportError, t)} />
      ) : null}

      {!loading && !error && summary && (
        <section
          className={`mt-6 space-y-4${refreshing ? ` ${ADMIN_LIST_REFRESHING_SURFACE_CLASS}` : ""}`}
          aria-label={t("admin_finance_summary_aria")}
          aria-busy={refreshing || undefined}
          data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
        >
          {meta && (
            <AdminFinanceMetaLedgerSection
              t={t}
              financeMetaDlHeadingId={financeMetaDlHeadingId}
              meta={meta}
              derived={derived}
            />
          )}

          <AdminFinanceSummaryGridSection t={t} summary={summary} />
        </section>
      )}

      {!loading && !error && !summary ? (
        <AdminListPageEmptyState
          messageKey="admin_finance_summary_empty"
          nextLinks={[{ href: "/admin/finance-suite", labelKey: "admin_fin_suite_title" }]}
        />
      ) : null}
    </AdminListPageChrome>
  );
}
