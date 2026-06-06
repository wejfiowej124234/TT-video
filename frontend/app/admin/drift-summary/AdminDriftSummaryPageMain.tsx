"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuiteBackLinks } from "@/components/admin/AdminFinanceSuiteBackLinks";
import { AdminOpsDetailRelatedFold } from "@/components/admin/AdminOpsDetailRelatedFold";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import type { NormalizedAdminDriftSummary } from "@/lib/apiClient";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { formatDriftDetected, formatDriftSummaryUnknownJson } from "./adminDriftSummaryPageModel";
import { financeGovernanceRelatedFoldLinks } from "@/lib/admin/adminFinanceGovernanceRelatedFoldLinks";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass,
  ADMIN_CONSOLE_JSON_BLOCK_CLASS,
  ADMIN_LIST_REFRESHING_SURFACE_CLASS,
} from "@/lib/adminUi";
/** Epic C-04：漂移摘要只读页（C-02 归一化）；不提供修复动作。 */
export default function AdminDriftSummaryPageMain({
  loading,
  refreshing,
  error,
  model,
}: {
  loading: boolean;
  refreshing: boolean;
  error: AdminFetchErrorKind | null;
  model: NormalizedAdminDriftSummary | null;
}) {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const noticeId = useId();

  return (
    <AdminListPageChrome
      titleId={pageTitleId}
      title={t("admin_drift_summary_title")}
      subtitle={
        <>
          <AdminNoticeBanner
            id={noticeId}
            tone="readonly"
            size="lg"
            message={t("admin_audit_tools_read_only_scope")}
            data-testid="admin-audit-read-only-scope"
          />
          <p className="mt-3">{t("admin_drift_summary_subtitle_l5")}</p>
        </>
      }
      headerAside={<AdminFinanceSuiteBackLinks />}
    >
      <AdminOpsDetailRelatedFold
        relatedLinks={financeGovernanceRelatedFoldLinks("/admin/drift-summary")}
        ariaLabelKey="admin_finance_related_aria"
        foldSummaryKey="admin_finance_related_fold"
        dataTtFold="fin-governance-drift-summary"
      />
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.READ}
        messageKey="admin_perm_denied_read"
      />
      <AdminFinanceSuiteDepthNotice />
      <AdminFinanceSuitePartialChecklist />
      <AdminFinanceModuleDepthWorkspace
        drift={{
          driftDetected: model?.drift_detected ?? null,
          status: model?.status ?? null,
          loading,
          error: Boolean(error),
        }}
      />

      <div className="mt-6 space-y-4">
        {loading && !model ? (
          <AdminListLoadingStatus message={t("admin_drift_summary_loading")} className="text-body text-ink-600" />
        ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : model ? (
          <AdminWarmL5Surface
            as="section"
            aria-labelledby={pageTitleId}
            className={refreshing ? ADMIN_LIST_REFRESHING_SURFACE_CLASS : undefined}
            data-tt-admin-list-refreshing={refreshing ? "1" : undefined}
          >
            {model.status ? (
              <p className="mb-3 font-mono text-small text-ink-800 text-ink-600">
                {t("admin_drift_summary_status_label")}: <span className="text-ink-900">{model.status}</span>
              </p>
            ) : null}
            <p className="text-meta text-ink-600">
              <span className="font-mono text-ink-700">{t("admin_drift_summary_drift_detected_label")}</span>
              {": "}
              <span
                className="font-mono text-ink-900"
                data-testid="admin-drift-summary-drift-detected"
              >
                {formatDriftDetected(model.drift_detected, t("admin_drift_summary_drift_detected_not_provided"))}
              </span>
            </p>
            <p className="mt-3 text-small font-medium text-ink-600">{t("admin_drift_summary_delta_label")}</p>
            <pre
              className={`mt-1 ${ADMIN_CONSOLE_JSON_BLOCK_CLASS}`}
              data-testid="admin-drift-summary-delta"
              data-tt-admin-gov-json-block="1"
            >
              {formatDriftSummaryUnknownJson(model.delta)}
            </pre>
          </AdminWarmL5Surface>
        ) : null}
      </div>
    </AdminListPageChrome>
  );
}
