"use client";

import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { adminPageNavLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

/** Flags/Secrets/Policies 发布与审批链叙事一致（CFG-01 · ①）。 */
export function AdminConfigPublishApprovalNotice() {
  const { t } = useTranslation();

  return (
    <AdminNoticeBanner
      tone="readonly"
      size="lg"
      className="mt-4"
      data-testid="admin-config-publish-approval-notice"
      message={
        <p>
          {t("admin_config_publish_approval_notice")}{" "}
          <Link
            href={ADMIN_INBOX_QUEUE_HREFS.approvals}
            className={`${adminPageNavLinkClass()}`}
          >
            {t("admin_approvals_title")}
          </Link>
        </p>
      }
    />
  );
}
