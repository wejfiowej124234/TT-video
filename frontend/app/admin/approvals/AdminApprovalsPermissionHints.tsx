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
  ADMIN_SHELL_SECONDARY_BTN_CLASS,
  ADMIN_CONSOLE_MUTED_PANEL_CLASS,
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
          className={`mt-4 ${ADMIN_CONSOLE_MUTED_PANEL_CLASS} p-4`}
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
              className={`${touchTargetLink44Classes} ${ADMIN_SHELL_SECONDARY_BTN_CLASS} ${travelFocusRingOffset2Classes}`}
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
