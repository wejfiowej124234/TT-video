"use client";

import { AdminShellPrefetchLink } from "@/components/admin/AdminShellPrefetchLink";

import { useTranslation } from "@/components/LocaleProvider";
import { adminPageNavLinkClass } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 队列/审批/举报列表页顶栏回链：任务收件箱 → 工作台（默认由面包屑 SSOT · batch57 默认关）。 */
export function AdminInboxQueueBackLinks(props: { showWorkspace?: boolean; showInbox?: boolean }) {
  const { t } = useTranslation();
  const { showWorkspace = false, showInbox = false } = props;
  const link = adminPageNavLinkClass();

  if (!showInbox && !showWorkspace) {
    return null;
  }

  return (
    <>
      {showInbox ? (
        <AdminShellPrefetchLink
          href="/admin/inbox"
          className={`${touchTargetLink44Classes} ${link} ${travelFocusRingOffset2Classes}`}
          data-tt-admin-queue-back-inbox="1"
        >
          {t("admin_unified_inbox_nav_short")}
        </AdminShellPrefetchLink>
      ) : null}
      {showWorkspace ? (
        <AdminShellPrefetchLink href="/admin" className={`${touchTargetLink44Classes} ${link} ${travelFocusRingOffset2Classes}`}>
          {t("admin_shell_nav_workspace")}
        </AdminShellPrefetchLink>
      ) : null}
    </>
  );
}
