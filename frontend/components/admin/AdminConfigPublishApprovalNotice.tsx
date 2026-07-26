"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useTranslation } from "@/components/LocaleProvider";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { fetchAdminQueueList } from "@/lib/admin/fetchAdminQueueList";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { routes } from "@/lib/api";
import { adminPageNavLinkClass } from "@/lib/adminUi";

/** Flags/Secrets/Policies 发布与审批链叙事一致（CFG-01 · ①）。Batch-13 CF6 · 展示待审批 N。 */
export function AdminConfigPublishApprovalNotice() {
  const { t } = useTranslation();
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchAdminQueueList<{ items?: unknown[] }>(
      "AdminConfigPublishApprovalNotice",
      routes.admin.approvals({ limit: 1, status: "pending" }),
    ).then((res) => {
      if (cancelled) return;
      if (res.errorKind === null && typeof res.total === "number") {
        setPending(res.total);
      } else {
        setPending(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminNoticeBanner
      tone="readonly"
      size="lg"
      className="mt-4"
      data-testid="admin-config-publish-approval-notice"
      dataAttrs={
        pending != null
          ? { "data-tt-admin-config-pending-n": String(pending) }
          : { "data-tt-admin-config-pending-n": "unknown" }
      }
      message={
        <p>
          {pending != null
            ? t("admin_config_publish_approval_notice_with_count", { count: pending })
            : t("admin_config_publish_approval_notice")}{" "}
          <Link href={ADMIN_INBOX_QUEUE_HREFS.approvals} className={`${adminPageNavLinkClass()}`}>
            {t("admin_approvals_title")}
            {pending != null ? ` (${pending})` : ""}
          </Link>
        </p>
      }
    />
  );
}
