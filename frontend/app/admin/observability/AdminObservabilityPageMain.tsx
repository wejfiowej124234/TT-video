"use client";

import Link from "next/link";
import { useId } from "react";

import AdminAuditCompareLinks from "@/components/admin/AdminAuditCompareLinks";
import { AdminObservabilityOpsStrip } from "@/components/admin/AdminObservabilityOpsStrip";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminMetaBuildSection, isAdminMetaRecord } from "@/components/admin/AdminMetaBuildPanel";
import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";

import { AdminObservabilityOverviewSection } from "./AdminObservabilityOverviewSection";
import { useAdminObservabilityPage } from "./useAdminObservabilityPage";

/** Phase 5 / 07：管理员可观测快照（与后端 /meta 限流同源字段）。 */
export function AdminObservabilityPageMain() {
  const { t } = useTranslation();
  const pageTitleId = useId();
  const chainBlockId = useId();
  const rateLimitsBlockId = useId();
  const alertsBlockId = useId();
  const { loading, error, body } = useAdminObservabilityPage();

  const ov = body?.overview;
  const meta = body && isAdminMetaRecord(body.meta) ? body.meta : null;

  return (
    <AdminDetailPageChrome
      titleId={pageTitleId}
      title={t("admin_observability_title")}
      subtitle={t("admin_observability_subtitle")}
      headerAside={
        <>
          <Link href="/admin/audit" className={adminPageNavLinkClass()}>
            {t("admin_observability_linkAuditLogs")}
          </Link>
          <Link href="/admin/audit/operations" className={adminPageNavLinkClass()}>
            {t("admin_observability_linkAuditOps")}
          </Link>
          <Link href="/admin/indexer/reconcile-reports" className={adminPageNavLinkClass()}>
            {t("admin_observability_linkReconcileReports")}
          </Link>
          <Link href="/admin/alerts/incidents" className={adminPageNavLinkClass()}>
            {t("admin_observability_linkIncidents")}
          </Link>
          <Link href="/admin/trust-growth" className={adminPageNavLinkClass()}>
            {t("admin_shell_nav_trust_growth")}
          </Link>
          <Link href="/admin" className={adminPageNavLinkClass()}>
            {t("admin_schema_back")}
          </Link>
        </>
      }
    >
      <AdminAuditCompareLinks />
      <AdminObservabilityOpsStrip />
      <AdminMetaBuildSection meta={meta} loading={loading} error={error} />
      <AdminObservabilityOverviewSection
        loading={loading}
        error={error}
        ov={ov}
        chainBlockId={chainBlockId}
        rateLimitsBlockId={rateLimitsBlockId}
        alertsBlockId={alertsBlockId}
      />
    </AdminDetailPageChrome>
  );
}
