"use client";

import { AdminShellPrefetchLink } from "@/components/admin/AdminShellPrefetchLink";
import { useTranslation } from "@/components/LocaleProvider";
import { ADMIN_INBOX_WORKFLOW_IDS } from "@/lib/admin/adminInboxWorkflowOrder";
import type { AdminUnifiedInboxTask } from "@/lib/admin/adminUnifiedInboxTasks";
import {
  ADMIN_INBOX_WORKFLOW_CHIP_ACTIVE_CLASS,
  ADMIN_INBOX_WORKFLOW_CHIP_IDLE_CLASS,
  ADMIN_INBOX_WORKFLOW_NAV_PANEL_CLASS,
  ADMIN_TEXT_META_CLASS,
  ADMIN_TEXT_MUTED_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** ① 首页 / 统一收件箱 · 动线快链（商家→主理人→审批→社区）。 */
export function AdminInboxWorkflowQuickNav(props: {
  tasks: readonly AdminUnifiedInboxTask[];
  loading?: boolean;
  placement: "home" | "unified";
  /** 首页聚焦：快链不展示 0 计数，避免与单队列大卡重复 */
  hideZeroCounts?: boolean;
  /** 聚焦首页 · 无 inset 编组框 */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const { tasks, loading, placement, hideZeroCounts, compact } = props;

  const byId = new Map(tasks.map((task) => [task.id, task]));
  const ordered = ADMIN_INBOX_WORKFLOW_IDS.map((id) => byId.get(id)).filter(
    (task): task is AdminUnifiedInboxTask => Boolean(task) && !task.permissionDenied,
  );

  if (ordered.length === 0) return null;

  return (
    <nav
      className={`${compact ? "mt-2" : "mt-3"} flex flex-wrap items-center gap-2 ${
        compact ? "" : ADMIN_INBOX_WORKFLOW_NAV_PANEL_CLASS
      }`}
      aria-label={t("admin_inbox_workflow_quick_nav_aria")}
      data-tt-admin-inbox-workflow-quick-nav={placement}
    >
      <span className={`w-full text-small font-medium sm:w-auto ${ADMIN_TEXT_META_CLASS}`}>
        {t("admin_inbox_workflow_quick_nav_label")}
      </span>
      {ordered.map((task, index) => {
        const hasWork = !loading && task.count !== null && task.count > 0;
        const countLabel =
          loading || task.count === null ? "…" : task.count > 0 ? String(task.count) : "0";
        const showCountBadge =
          !hideZeroCounts && (!loading && task.count !== null && task.count > 0);
        return (
          <AdminShellPrefetchLink
            key={task.id}
            href={task.href}
            className={`${touchTargetLink44Classes} gap-2 ${travelFocusRingOffset2Classes} ${
              hasWork ? ADMIN_INBOX_WORKFLOW_CHIP_ACTIVE_CLASS : ADMIN_INBOX_WORKFLOW_CHIP_IDLE_CLASS
            }`}
            data-tt-admin-inbox-workflow-step={task.id}
            data-tt-admin-inbox-workflow-step-index={index + 1}
          >
            <span className={`tabular-nums ${ADMIN_TEXT_MUTED_CLASS}`} aria-hidden>
              {index + 1}.
            </span>
            <span>{t(task.labelKey)}</span>
            {showCountBadge ? (
              <span className={`tabular-nums font-semibold ${hasWork ? "text-[#ffe8d4]" : ADMIN_TEXT_MUTED_CLASS}`}>
                {countLabel}
              </span>
            ) : null}
          </AdminShellPrefetchLink>
        );
      })}
    </nav>
  );
}
