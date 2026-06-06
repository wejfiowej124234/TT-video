"use client";

import { adminPageNavLinkClass } from "@/lib/adminUi";
import Link from "next/link";
import { useId } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminDetailPageChrome } from "@/components/admin/AdminDetailPageChrome";
import { AdminComplianceDsarWorkflowNotice } from "@/components/admin/AdminComplianceDsarWorkflowNotice";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { AdminPlatformHubRelatedNav } from "@/components/admin/AdminPlatformHubRelatedNav";
import { COMPLIANCE_HUB_RELATED_FOLD_LINKS } from "@/app/admin/config/adminConfigHubPageModel";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { useAdminCanWrite } from "@/lib/admin/useAdminCanWrite";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";

/** spec 500 · DSAR 合规枢纽（① 链至既有 requests 台账；② 全流程 GO 另闸）。 */
export function AdminComplianceHubPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const { canWrite: canApprove } = useAdminCanWrite(ADMIN_PERM.APPROVE);

  return (
    <>
      <AdminPlatformHubRelatedNav
        currentLabelKey="admin_compliance_hub_title"
        relatedLinks={COMPLIANCE_HUB_RELATED_FOLD_LINKS}
        ariaLabelKey="admin_compliance_hub_related_aria"
        foldSummaryKey="admin_compliance_hub_related_fold"
        dataTtNav="compliance"
        dataTtFold="compliance"
      />
      <AdminDetailPageChrome
        titleId={titleId}
        title={t("admin_compliance_hub_title")}
        subtitle={t("admin_compliance_hub_subtitle_l5")}
        mainDataAttrs={{ "data-tt-admin-compliance-hub": "1" }}
      >
        <AdminPermissionDeniedBanner
          permission={ADMIN_PERM.READ}
          messageKey="admin_perm_denied_read"
        />

        <AdminComplianceDsarWorkflowNotice />

        <ul className="mt-6 space-y-3">
          <AdminWarmL5Surface as="li" data-tt-admin-hub-link-card="compliance-list">
            <h2 className="text-body font-semibold">{t("admin_compliance_hub_dsar_list")}</h2>
            <p className="mt-1 text-small text-ink-600">{t("admin_compliance_hub_dsar_list_desc")}</p>
            <Link
              href="/admin/compliance/requests"
              className={`mt-2 inline-block ${adminPageNavLinkClass()}`}
            >
              {t("admin_compliance_hub_open_requests")}
            </Link>
          </AdminWarmL5Surface>
          <AdminWarmL5Surface as="li" data-tt-admin-hub-link-card="compliance-update">
            <h2 className="text-body font-semibold">{t("admin_compliance_hub_dsar_update")}</h2>
            <p className="mt-1 text-small text-ink-600">{t("admin_compliance_hub_dsar_update_desc")}</p>
            {canApprove ? (
              <p className="mt-2 text-meta text-ink-500">{t("admin_compliance_hub_update_via_detail")}</p>
            ) : (
              <p className="mt-2 text-meta text-ink-400">{t("admin_perm_denied_approve")}</p>
            )}
          </AdminWarmL5Surface>
        </ul>

        <AdminNoticeBanner tone="readonly" className="mt-8" message={t("admin_compliance_hub_phase2_note")} />
      </AdminDetailPageChrome>
    </>
  );
}
