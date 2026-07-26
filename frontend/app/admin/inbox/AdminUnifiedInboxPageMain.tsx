"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/components/LocaleProvider";
import { AdminInboxQueueBackLinks } from "@/components/admin/AdminInboxQueueBackLinks";
import { AdminListPageChrome } from "@/components/admin/AdminListPageChrome";
import { AdminListPageEmptyState } from "@/components/admin/AdminListPageEmptyState";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { useAdminApprovePermissionHint } from "@/lib/admin/adminApprovePermissionHint";
import { adminInboxErrorLabelKey } from "@/lib/admin/adminInboxErrorLabel";
import { adminHomeInboxPendingTotal } from "@/lib/admin/adminHomeInboxPendingTotal";
import { adminHomeKpiMetricDisplay } from "@/lib/admin/adminHomeKpiMetric";
import { AdminUnifiedInboxTaskDetail } from "@/components/admin/AdminUnifiedInboxTaskDetail";
import { buildAdminUnifiedInboxTasks } from "@/lib/admin/adminUnifiedInboxTasks";
import { AdminInboxWorkflowQuickNav } from "@/components/admin/AdminInboxWorkflowQuickNav";
import { ADMIN_EMPTY_NEXT_UNIFIED_INBOX_CLEAR } from "@/lib/admin/adminListEmptyStateNextLinks";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { useAdminUnifiedInboxDetailPanel } from "@/lib/admin/useAdminUnifiedInboxDetailPanel";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { useAdminHomeInbox } from "@/lib/admin/useAdminHomeInbox";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import {
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_INBOX_CHANNEL_ERROR_CLASS,
  ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS,
  ADMIN_INBOX_TASK_CTA_IDLE_CLASS,
  ADMIN_LINK_FOCUS_CLASS,
  adminPageNavLinkClass,
  ADMIN_INFO_BADGE_CLASS,
  ADMIN_CONSOLE_MUTED_PANEL_CLASS,
  ADMIN_TEXT_META_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** U5 · ① 统一任务收件箱（五通道真实计数 + 权限诚实）。 */
export function AdminUnifiedInboxPageMain() {
  const { t } = useTranslation();
  const titleId = useId();
  const caps = useAdminCapabilities();
  const inbox = useAdminHomeInbox();
  const { showInboxFallback } = useAdminApprovePermissionHint();
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const detailToggleRef = useRef<HTMLButtonElement | null>(null);
  const { detailPanelId } = useAdminUnifiedInboxDetailPanel(
    detailTaskId,
    setDetailTaskId,
    detailPanelRef,
    detailToggleRef,
  );

  const tasks = useMemo(
    () =>
      buildAdminUnifiedInboxTasks({
        counts: inbox.counts,
        channels: inbox.channels,
      }),
    [inbox.counts, inbox.channels],
  );

  const totalPending = adminHomeInboxPendingTotal(
    inbox.counts,
    inbox.channels,
    inbox.loading,
    inbox.error,
    caps.hasPermission,
    caps.permissionsLoaded,
  );

  return (
    <AdminListPageChrome
      titleId={titleId}
      title={t("admin_unified_inbox_title")}
      subtitle={t("admin_unified_inbox_subtitle_l5")}
      mainDataAttrs={{ "data-tt-admin-unified-inbox": "1" }}
      headerAside={<AdminInboxQueueBackLinks showWorkspace />}
    >
      {inbox.loading ? (
        <p className="text-small text-ink-600" role="status">
          {t("admin_home_kpi_loading")}
        </p>
      ) : null}
      {inbox.error ? (
        <AdminNoticeBanner
          tone="warning"
          className="mt-2"
          message={
            <>
              {t("admin_home_inbox_error_partial")}{" "}
              <button
                type="button"
                onClick={inbox.reload}
                className={`${touchTargetLink44Classes} font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
              >
                {t("admin_home_inbox_retry")}
              </button>
            </>
          }
        />
      ) : null}

      {/* Batch-12 HU-471 · 双控/举报发现性（≤12 不扩侧栏 · Inbox 一等入口） */}
      <nav
        className={`mt-3 flex flex-wrap items-center gap-2 ${ADMIN_CONSOLE_MUTED_PANEL_CLASS} px-3 py-2.5`}
        aria-label={t("admin_unified_inbox_discover_aria")}
        data-tt-admin-inbox-discover-queues="1"
      >
        <span className={`w-full text-small font-medium sm:w-auto ${ADMIN_TEXT_META_CLASS}`}>
          {t("admin_unified_inbox_discover_label")}
        </span>
        <Link
          href={ADMIN_INBOX_QUEUE_HREFS.approvals}
          className={`${touchTargetLink44Classes} font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          data-tt-admin-inbox-discover-leaf="approvals"
        >
          {t("admin_home_inbox_approvals")}
        </Link>
        <Link
          href={ADMIN_INBOX_QUEUE_HREFS.reports}
          className={`${touchTargetLink44Classes} font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          data-tt-admin-inbox-discover-leaf="reports"
        >
          {t("admin_home_inbox_reports_queue")}
        </Link>
      </nav>

      {!inbox.loading && !inbox.error && totalPending === 0 ? (
        <div
          className={`mt-3 flex items-start gap-2 ${ADMIN_CONSOLE_MUTED_PANEL_CLASS} px-3 py-2.5`}
          role="note"
          data-tt-admin-unified-inbox-scope-honesty="1"
        >
          <span
            className={`mt-0.5 ${ADMIN_INFO_BADGE_CLASS}`}
            aria-hidden
          >
            i
          </span>
          <p className="text-small leading-snug text-ink-600">{t("admin_unified_inbox_scope_note")}</p>
        </div>
      ) : null}

      {!inbox.loading ? (
        <AdminInboxWorkflowQuickNav tasks={tasks} loading={inbox.loading} placement="unified" />
      ) : null}

      {showInboxFallback ? (
        <p className="mt-3 text-small text-ink-600" data-tt-admin-unified-inbox-approve-fallback="1">
          {t("admin_home_inbox_approve_fallback")}{" "}
          <Link
            href="/admin/permissions"
            className={`font-semibold ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_permissions_link")}
          </Link>
        </p>
      ) : null}

      {!inbox.loading && !inbox.error && totalPending === 0 ? (
        <AdminListPageEmptyState
          className="mt-4"
          messageKey="admin_unified_inbox_all_clear"
          nextLinks={ADMIN_EMPTY_NEXT_UNIFIED_INBOX_CLEAR}
        />
      ) : null}

      <ul className="mt-4 space-y-3">
        {tasks.map((task) => {
          const errKey = task.errorKind ? adminInboxErrorLabelKey(task.errorKind) : null;
          const permissionDenied = Boolean(task.permissionDenied);
          const hasWork = !permissionDenied && task.count !== null && task.count > 0;
          const countDisplay = adminHomeKpiMetricDisplay(
            { loading: inbox.loading, count: task.count, permissionDenied },
            t,
            "admin_home_inbox_count",
          );

          return (
            <AdminWarmL5Surface
              as="li"
              key={task.id}
              className={
                hasWork ? "shadow-[0_0_20px_-10px_rgba(252,164,124,0.28)]" : undefined
              }
              data-tt-admin-unified-inbox-task={task.id}
              data-tt-admin-unified-inbox-task-pending={hasWork ? "1" : undefined}
              {...(permissionDenied ? { "data-tt-admin-unified-inbox-perm-denied": task.id } : {})}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-body font-semibold text-ink-900">{t(task.labelKey)}</h2>
                  <p className="mt-1 text-small text-ink-600">{t(task.descKey)}</p>
                  {permissionDenied ? (
                    <p className="mt-2 text-meta text-ink-500">
                      {t("admin_home_inbox_channel_perm_denied")}{" "}
                      <Link
                        href="/admin/permissions"
                        className={`font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
                      >
                        {t("admin_permissions_link")}
                      </Link>
                    </p>
                  ) : null}
                  {errKey ? (
                    <p className={ADMIN_INBOX_CHANNEL_ERROR_CLASS}>{t(errKey)}</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className="text-h3 font-semibold tabular-nums text-ink-800"
                    title={permissionDenied ? t("admin_home_kpi_perm_denied_title") : undefined}
                  >
                    {countDisplay}
                  </span>
                  <div className="flex flex-col items-end gap-2">
                    {!permissionDenied ? (
                      <Link
                        href={task.href}
                        className={`${touchTargetLink44Classes} ${
                          hasWork
                            ? ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS
                            : `${ADMIN_INBOX_TASK_CTA_IDLE_CLASS} ${ADMIN_LINK_FOCUS_CLASS}`
                        }`}
                      >
                        {hasWork ? t("admin_home_inbox_cta_process") : t("admin_home_inbox_cta_view")}
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
                      aria-expanded={detailTaskId === task.id}
                      aria-controls={detailPanelId}
                      data-tt-admin-unified-inbox-task-detail-toggle={task.id}
                      data-tt-admin-unified-inbox-detail-escape="1"
                      data-tt-admin-unified-inbox-detail-focus-return="1"
                      onClick={(e) => {
                        if (detailTaskId !== task.id) {
                          detailToggleRef.current = e.currentTarget;
                        }
                        setDetailTaskId((prev) => (prev === task.id ? null : task.id));
                      }}
                    >
                      {detailTaskId === task.id
                        ? t("admin_unified_inbox_detail_hide")
                        : t("admin_unified_inbox_detail_show")}
                    </button>
                  </div>
                </div>
              </div>
              {detailTaskId === task.id ? (
                <AdminUnifiedInboxTaskDetail
                  ref={detailPanelRef}
                  panelId={detailPanelId}
                  task={task}
                />
              ) : null}
            </AdminWarmL5Surface>
          );
        })}
      </ul>
    </AdminListPageChrome>
  );
}
