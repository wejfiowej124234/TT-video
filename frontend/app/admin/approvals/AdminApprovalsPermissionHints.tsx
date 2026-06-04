"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminPermissionDeniedBanner } from "@/components/admin/AdminPermissionDeniedBanner";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import {
  ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS,
  ADMIN_INLINE_LINK_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 审批页 capabilities 门闸（与 API `admin.approve` 同源）+ Ops 下一步引导。 */
export function AdminApprovalsPermissionHints() {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const denied =
    caps.permissionsLoaded &&
    !caps.capabilitiesUnavailable &&
    !caps.hasPermission(ADMIN_PERM.APPROVE);

  return (
    <>
      <AdminPermissionDeniedBanner
        permission={ADMIN_PERM.APPROVE}
        messageKey="admin_perm_denied_approve"
      />
      {denied ? (
        <div
          className="mt-4 rounded-[var(--radius-lg)] border border-ink-200 bg-ink-50/80 p-4"
          data-tt-admin-approvals-ops-guide="1"
          role="status"
        >
          <p className="text-small font-medium text-ink-900">{t("admin_approvals_ops_denied_title")}</p>
          <p className="mt-1 text-small text-ink-600">{t("admin_approvals_ops_denied_lead")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/admin/permissions"
              className={`${touchTargetLink44Classes} ${ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS}`}
            >
              {t("admin_approvals_ops_denied_cta_permissions")}
            </Link>
            <Link
              href="/admin/operator-guide"
              className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] border border-ink-200 bg-white px-4 text-small font-medium text-ink-700 hover:border-ink-300 ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_approvals_ops_denied_cta_guide")}
            </Link>
            <Link
              href={ADMIN_INBOX_QUEUE_HREFS.reports}
              className={`${touchTargetLink44Classes} font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_home_primary_cta_reports")}
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
