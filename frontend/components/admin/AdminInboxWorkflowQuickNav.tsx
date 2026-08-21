"use client";

import { AdminShellPrefetchLink } from "@/components/admin/AdminShellPrefetchLink";
import { useTranslation } from "@/components/LocaleProvider";
import {
  ADMIN_INBOX_WORKFLOW_CHIPS_ROW_CLASS,
  TT_ADMIN_INBOX_WORKFLOW_CHIPS_MARK,
} from "@/lib/admin/adminInboxWorkflowChipsHu442";
import { ADMIN_INBOX_WORKFLOW_IDS } from "@/lib/admin/adminInboxWorkflowOrder";
import type { AdminUnifiedInboxTask } from "@/lib/admin/adminUnifiedInboxTasks";
import {
  ADMIN_INBOX_WORKFLOW_CHIP_ACTIVE_CLASS,
  ADMIN_INBOX_WORKFLOW_NAV_PANEL_CLASS,
  ADMIN_TEXT_META_CLASS,
  ADMIN_TEXT_MUTED_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** ① 首页 / 统一收件箱 · 动线快链（商家→向导→主理人→审批→争议→社区）。HU-442 · 横滑芯片。 */
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
    (task): task is AdminUnifiedInboxTask => task != null && !task.permissionDenied,
  );

  if (ordered.length === 0) return null;

  const navClassName = compact
    ? "mt-2"
    : `mt-3 ${ADMIN_INBOX_WORKFLOW_NAV_PANEL_CLASS}`;

  return (
    <nav
      className={navClassName}
      aria-label={t("admin_inbox_workflow_quick_nav_aria")}
      data-tt-admin-inbox-workflow-quick-nav={placement}
      data-tt-admin-inbox-workflow-chips="hu442"
      data-tt-admin-inbox-workflow-chips-mark={TT_ADMIN_INBOX_WORKFLOW_CHIPS_MARK}
    >
      <span className="sr-only">{TT_ADMIN_INBOX_WORKFLOW_CHIPS_MARK}</span>
      <div className={ADMIN_INBOX_WORKFLOW_CHIPS_ROW_CLASS}>
        <span className={"shrink-0 text-small font-medium " + ADMIN_TEXT_META_CLASS}>
          {t("admin_inbox_workflow_quick_nav_label")}
        </span>
        {ordered.map((task, index) => {
          const showCountBadge =
            !hideZeroCounts && !loading && task.count !== null && task.count > 0;
          const chipClass =
            touchTargetLink44Classes +
            " shrink-0 gap-2 " +
            travelFocusRingOffset2Classes +
            " " +
            ADMIN_INBOX_WORKFLOW_CHIP_ACTIVE_CLASS;
          return (
            <AdminShellPrefetchLink
              key={task.id}
              href={task.href}
              className={chipClass}
              data-tt-admin-inbox-workflow-step={task.id}
              data-tt-admin-inbox-workflow-step-index={index + 1}
            >
              <span className={"tabular-nums " + ADMIN_TEXT_MUTED_CLASS} aria-hidden>
                {index + 1}.
              </span>
              <span>{t(task.labelKey)}</span>
              {showCountBadge ? (
                <span className="tabular-nums font-semibold text-[#ffe8d4]">{task.count}</span>
              ) : null}
            </AdminShellPrefetchLink>
          );
        })}
      </div>
    </nav>
  );
}
