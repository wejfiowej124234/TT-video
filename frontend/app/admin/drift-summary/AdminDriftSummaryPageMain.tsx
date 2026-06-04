"use client";

import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminListFetchError } from "@/components/admin/AdminListFetchError";
import { AdminListLoadingStatus } from "@/components/admin/AdminListLoadingStatus";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminErrorUserText, type AdminFetchErrorKind } from "@/lib/adminFetchDisplay";
import type { NormalizedAdminDriftSummary } from "@/lib/apiClient";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import { formatDriftDetected, formatDriftSummaryUnknownJson } from "./adminDriftSummaryPageModel";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
/** Epic C-04：漂移摘要只读页（C-02 归一化）；不提供修复动作。 */
export default function AdminDriftSummaryPageMain({
  loading,
  error,
  model,
}: {
  loading: boolean;
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
          <p className="mt-3">{t("admin_drift_summary_subtitle")}</p>
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
        {loading ? (
          <AdminListLoadingStatus message={t("admin_drift_summary_loading")} className="text-body text-ink-600" />
        ) : error ? (
          <AdminListFetchError errorKind={error} message={adminErrorUserText(error, t)} />
        ) : model ? (
          <section
            className="rounded-[var(--radius-lg)] border border-ink-200 bg-bg-console p-4"
            aria-labelledby={pageTitleId}
          >
            {model.status ? (
              <p className="mb-3 font-mono text-meta text-ink-600">
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
            <p className="mt-3 text-meta font-medium text-ink-600">{t("admin_drift_summary_delta_label")}</p>
            <pre
              className="mt-1 max-h-[min(28rem,55vh)] overflow-auto rounded-[var(--radius-md)] bg-ink-900/90 p-3 text-left text-meta text-ink-100"
              data-testid="admin-drift-summary-delta"
            >
              {formatDriftSummaryUnknownJson(model.delta)}
            </pre>
          </section>
        ) : null}
      </div>
    </AdminListPageChrome>
  );
}
