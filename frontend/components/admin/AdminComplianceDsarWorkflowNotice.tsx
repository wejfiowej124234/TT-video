"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { ADMIN_LINK_FOCUS_CLASS, adminPageNavLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** DSAR 合规请求工作台动线（CMP-01 · ①）。 */
export function AdminComplianceDsarWorkflowNotice() {
  const { t } = useTranslation();

  return (
    <AdminNoticeBanner
      tone="readonly"
      size="lg"
      className="mt-4"
      data-testid="admin-compliance-dsar-workflow-notice"
      message={
        <p>
          {t("admin_compliance_dsar_workflow_notice")}{" "}
          <Link
            href="/admin/compliance/requests"
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_compliance_requests_title")}
          </Link>
          {" → "}
          <span className="font-medium text-ink-800">{t("admin_compliance_events_title")}</span>
          {" → "}
          <span className="font-medium text-ink-800">{t("admin_compliance_update_title")}</span>
        </p>
      }
    />
  );
}
