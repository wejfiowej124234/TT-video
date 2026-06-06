"use client";

import { useId, useMemo } from "react";

import AdminAuditCompareLinks from "@/components/admin/AdminAuditCompareLinks";
import { AdminFinanceModuleDepthWorkspace } from "@/components/admin/AdminFinanceModuleDepthWorkspace";
import { AdminFinanceSuiteDepthNotice } from "@/components/admin/AdminFinanceSuiteDepthNotice";
import { AdminFinanceSuitePartialChecklist } from "@/components/admin/AdminFinanceSuitePartialChecklist";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { adminObservabilityOverviewSnapshot } from "@/lib/admin/adminObservabilityOverviewSnapshot";
import { AdminObservabilityOpsStrip } from "@/components/admin/AdminObservabilityOpsStrip";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminMetaBuildSection } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminObservabilityHubRelatedNav } from "@/components/admin/AdminObservabilityHubRelatedNav";

import { AdminObservabilityOverviewSection } from "./AdminObservabilityOverviewSection";
import { useAdminObservabilityPage } from "./useAdminObservabilityPage";

/** Phase 5 / 07：管理员可观测快照（与后端 /meta 限流同源字段）。 */
export function AdminObservabilityPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const chainBlockId = useId();
  const rateLimitsBlockId = useId();
  const alertsBlockId = useId();
  const { loading, refreshing, error, body, meta } = useAdminObservabilityPage();

  const ov = body?.overview;
  const obsSnapshot = useMemo(
    () => adminObservabilityOverviewSnapshot(ov, body?.status ?? null),
    [ov, body?.status],
  );

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_observability_title")}
      subtitle={t("admin_observability_subtitle_l5")}
    >
      <AdminObservabilityHubRelatedNav />
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.FINANCE_READ}
        messageKey="admin_perm_denied_finance_read"
      />
      <AdminFinanceSuiteDepthNotice />
      <AdminFinanceSuitePartialChecklist />
      <AdminFinanceModuleDepthWorkspace
        observability={{
          ...obsSnapshot,
          loading,
          error: Boolean(error),
        }}
      />
      <AdminAuditCompareLinks />
      <AdminObservabilityOpsStrip />
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />
      <AdminObservabilityOverviewSection
        loading={loading && !body}
        refreshing={refreshing}
        error={error}
        ov={ov}
        chainBlockId={chainBlockId}
        rateLimitsBlockId={rateLimitsBlockId}
        alertsBlockId={alertsBlockId}
      />
    </AdminDetailPageChrome>
  );
}
