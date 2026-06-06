"use client";

import { forwardRef } from "react";
import Link from "next/link";

import { useTranslation } from "@/components/LocaleProvider";
import type { AdminUnifiedInboxTask } from "@/lib/admin/adminUnifiedInboxTasks";
import {
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_UNIFIED_INBOX_TASK_DETAIL_CLASS,
  adminPageNavLinkClass,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const TASK_EXTRA_LINKS: Record<
  string,
  readonly { href: string; labelKey: string }[]
> = {
  provider: [
    { href: "/admin/onboarding", labelKey: "admin_onboarding_hub_title" },
    { href: "/admin/operator-guide", labelKey: "admin_home_pinned_guide" },
  ],
  steward: [{ href: "/admin/onboarding", labelKey: "admin_onboarding_hub_title" }],
  approvals: [{ href: "/admin/permissions", labelKey: "admin_permissions_title" }],
  reports: [
    { href: "/admin/community/appeals", labelKey: "admin_appeals_title" },
    { href: "/admin/community/penalties", labelKey: "admin_community_penalties_title" },
  ],
};

/** U5 · ① 统一收件箱任务内联详情（非 ② 全库工单）。 */
export const AdminUnifiedInboxTaskDetail = forwardRef<
  HTMLDivElement,
  { task: AdminUnifiedInboxTask; panelId: string }
>(function AdminUnifiedInboxTaskDetail(props, ref) {
  const { t } = useTranslation();
  const { task, panelId } = props;
  const extras = TASK_EXTRA_LINKS[task.id] ?? [];

  return (
    <div
      ref={ref}
      id={panelId}
      tabIndex={-1}
      className={`${ADMIN_UNIFIED_INBOX_TASK_DETAIL_CLASS} ${travelFocusRingOffset2Classes}`}
      data-tt-admin-unified-inbox-task-detail="1"
      data-tt-admin-unified-inbox-task-detail-id={task.id}
      role="region"
      aria-label={t("admin_unified_inbox_detail_region_aria", { queue: t(task.labelKey) })}
    >
      <p className="text-ink-700">{t("admin_unified_inbox_detail_lead")}</p>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="font-medium text-ink-600">{t("admin_unified_inbox_detail_queue")}</dt>
          <dd className="mt-0.5 text-ink-900">{t(task.labelKey)}</dd>
        </div>
        <div>
          <dt className="font-medium text-ink-600">{t("admin_unified_inbox_detail_pending")}</dt>
          <dd className="mt-0.5 tabular-nums text-ink-900">
            {task.permissionDenied
              ? t("admin_home_inbox_channel_perm_denied")
              : task.count === null
                ? "—"
                : String(task.count)}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {!task.permissionDenied ? (
          <Link
            href={task.href}
            className={`${touchTargetLink44Classes} inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] px-4 font-semibold ${adminPageNavLinkClass()}`}
          >
            {task.count && task.count > 0
              ? t("admin_home_inbox_cta_process")
              : t("admin_home_inbox_cta_view")}
          </Link>
        ) : null}
        {extras.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${touchTargetLink44Classes} font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          >
            {t(link.labelKey)}
          </Link>
        ))}
      </div>
    </div>
  );
});
