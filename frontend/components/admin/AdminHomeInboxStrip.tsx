"use client";

import { AdminInboxWorkflowQuickNav } from "@/components/admin/AdminInboxWorkflowQuickNav";
import { AdminShellPrefetchLink } from "@/components/admin/AdminShellPrefetchLink";
import { AdminWarmL5Surface } from "@/components/admin/AdminWarmL5Surface";
import { useTranslation } from "@/components/LocaleProvider";
import { adminHomeKpiMetricDisplay } from "@/lib/admin/adminHomeKpiMetric";
import { adminHomeInboxPendingTotal } from "@/lib/admin/adminHomeInboxPendingTotal";
import { adminInboxErrorLabelKey } from "@/lib/admin/adminInboxErrorLabel";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { buildAdminUnifiedInboxTasks } from "@/lib/admin/adminUnifiedInboxTasks";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";
import { useAdminApprovePermissionHint } from "@/lib/admin/adminApprovePermissionHint";
import { useAdminShellSidebarVisible } from "@/lib/admin/useAdminShellSidebarVisible";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import {
  ADMIN_CONSOLE_SKELETON_BLOCK_CLASS,
  ADMIN_CONSOLE_SKELETON_LINE_CLASS,
  ADMIN_HOME_WIDGET_CARD_CLASS,
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_INBOX_ALL_CLEAR_CLASS,
  ADMIN_INBOX_ALL_CLEAR_ICON_CLASS,
  ADMIN_INBOX_CHANNEL_ERROR_CLASS,
  ADMIN_INBOX_FOCUS_BANNER_CLASS,
  ADMIN_INBOX_FOCUS_SECTION_CLASS,
  ADMIN_INBOX_OPEN_UNIFIED_SECONDARY_CLASS,
  ADMIN_INBOX_PENDING_COUNT_DISPLAY_CLASS,
  ADMIN_INBOX_PERM_DENIED_ROW_CLASS,
  ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS,
  ADMIN_INBOX_TASK_CTA_FOCUS_CLASS,
  ADMIN_INBOX_TASK_CTA_IDLE_CLASS,
  ADMIN_INBOX_TASK_PENDING_CARD_FOCUS_CLASS,
  TT_ADMIN_INBOX_FOCUS_BANNER_SECONDARY_MARK,
  ADMIN_KPI_CARD_IDLE_CLASS,
  ADMIN_KPI_CARD_PENDING_CLASS,
  ADMIN_MOTION_CARD_HOVER_CLASS,
  ADMIN_TEXT_META_CLASS,
  ADMIN_TEXT_SECONDARY_CLASS,
} from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

const INBOX_LINKS: {
  key: keyof AdminHomeInboxCounts;
  href: string;
  labelKey: string;
  descKey: string;
}[] = [
  {
    key: "provider",
    href: ADMIN_INBOX_QUEUE_HREFS.provider,
    labelKey: "admin_home_inbox_provider",
    descKey: "admin_home_inbox_provider_desc",
  },
  {
    key: "guide",
    href: ADMIN_INBOX_QUEUE_HREFS.guide,
    labelKey: "admin_home_inbox_guide",
    descKey: "admin_home_inbox_guide_desc",
  },
  {
    key: "steward",
    href: ADMIN_INBOX_QUEUE_HREFS.steward,
    labelKey: "admin_home_inbox_steward",
    descKey: "admin_home_inbox_steward_desc",
  },
  {
    key: "approvals",
    href: ADMIN_INBOX_QUEUE_HREFS.approvals,
    labelKey: "admin_home_inbox_approvals",
    descKey: "admin_home_inbox_approvals_desc",
  },
  {
    key: "reports",
    href: ADMIN_INBOX_QUEUE_HREFS.reports,
    labelKey: "admin_home_inbox_reports_queue",
    descKey: "admin_home_inbox_reports_queue_desc",
  },
];

export function AdminHomeInboxStrip(props: {
  counts: AdminHomeInboxCounts;
  channels: AdminHomeInboxChannels;
  loading: boolean;
  error: boolean;
  onRetry?: () => void;
  hasPermission: (perm: string) => boolean;
  permissionsLoaded: boolean;
  /** 有待办 · 单列聚焦布局（无 WarmL5 满框） */
  focusMode?: boolean;
}) {
  const { t } = useTranslation();
  const {
    counts,
    channels,
    loading,
    error,
    onRetry,
    hasPermission,
    permissionsLoaded,
    focusMode = false,
  } = props;
  const { showInboxFallback } = useAdminApprovePermissionHint();
  /** Batch-10 W12 · HU-203：lg+ 侧栏已有收件箱入口时隐藏工作台重复 CTA */
  const sidebarLayoutActive = useAdminShellSidebarVisible();
  const showUnifiedInboxCta = !sidebarLayoutActive;

  const totalPending = adminHomeInboxPendingTotal(
    counts,
    channels,
    loading,
    error,
    hasPermission,
    permissionsLoaded,
  );

  const workflowTasks = buildAdminUnifiedInboxTasks({ counts, channels });
  const visibleLinks = INBOX_LINKS.filter(({ key }) => !channels[key].permissionDenied);
  const deniedLinks = INBOX_LINKS.filter(({ key }) => channels[key].permissionDenied);
  const approvalsDenied = channels.approvals.permissionDenied;
  const workflowKeys = approvalsDenied
    ? ([
        "admin_home_inbox_workflow_1_ops",
        "admin_home_inbox_workflow_2",
        "admin_home_inbox_workflow_3_ops",
      ] as const)
    : ([
        "admin_home_inbox_workflow_1",
        "admin_home_inbox_workflow_2",
        "admin_home_inbox_workflow_3",
      ] as const);
  const compactAllClear = !loading && !error && totalPending === 0 && visibleLinks.length > 0;

  const queuesWithWork = visibleLinks.filter(({ key }) => {
    const n = counts[key];
    return !loading && n !== null && n > 0;
  });
  const singleQueueFocus = focusMode && queuesWithWork.length === 1;
  const hasFocusWork = focusMode && totalPending !== null && totalPending > 0;
  const focusLayoutDeferred =
    focusMode && loading && permissionsLoaded && totalPending === null;

  const renderQueueGrid = (variant: "default" | "focus") => {
    const gridClass =
      variant === "focus" && singleQueueFocus
        ? "mt-3 max-w-xl grid-cols-1"
        : variant === "focus"
          ? "mt-3 sm:grid-cols-2"
          : `mt-4 ${
              visibleLinks.length === 1
                ? "max-w-xl grid-cols-1"
                : visibleLinks.length <= 2
                  ? "sm:grid-cols-2"
                  : "sm:grid-cols-2 lg:grid-cols-5"
            }`;

    return (
      <ul className={`grid gap-3 ${gridClass}`} data-tt-admin-inbox-grid-count={visibleLinks.length}>
        {INBOX_LINKS.map(({ key, href, labelKey, descKey }) => {
          const ch = channels[key];
          if (ch.permissionDenied) return null;
          const n = counts[key];
          const errKey = adminInboxErrorLabelKey(ch.errorKind);
          const countDisplay = adminHomeKpiMetricDisplay(
            { loading, count: n, permissionDenied: false },
            t,
            "admin_home_inbox_count",
          );
          const hasWork = !loading && n !== null && n > 0;
          if (!loading && !hasWork && !errKey && totalPending !== null && totalPending > 0) {
            return null;
          }

          const cardShellClass =
            variant === "focus"
              ? hasWork
                ? ADMIN_INBOX_TASK_PENDING_CARD_FOCUS_CLASS
                : ADMIN_KPI_CARD_IDLE_CLASS
              : hasWork
                ? ADMIN_KPI_CARD_PENDING_CLASS
                : ADMIN_KPI_CARD_IDLE_CLASS;
          const countClass =
            variant === "focus" && hasWork
              ? ADMIN_INBOX_PENDING_COUNT_DISPLAY_CLASS
              : `text-h2 font-bold tabular-nums ${hasWork ? "text-ink-900" : "text-ink-400"}`;
          const ctaClass =
            variant === "focus" && hasWork
              ? ADMIN_INBOX_TASK_CTA_FOCUS_CLASS
              : hasWork
                ? ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS
                : ADMIN_INBOX_TASK_CTA_IDLE_CLASS;

          return (
            <li key={key} data-tt-admin-inbox-channel={key}>
              <AdminShellPrefetchLink
                href={href}
                className={`flex h-full min-h-[8.5rem] flex-col justify-between border p-4 ${ADMIN_MOTION_CARD_HOVER_CLASS} ${travelFocusRingOffset2Classes} ${cardShellClass}`}
                aria-label={`${t(labelKey)}${hasWork ? `, ${t("admin_home_inbox_cta_process")}` : ""}`}
              >
                <div>
                  <p className="text-small font-medium text-ink-800">{t(labelKey)}</p>
                  <p className={`mt-1 text-meta ${ADMIN_TEXT_SECONDARY_CLASS} leading-snug`}>{t(descKey)}</p>
                  {errKey && !loading ? (
                    <p
                      className={ADMIN_INBOX_CHANNEL_ERROR_CLASS}
                      data-tt-admin-inbox-channel-error={key}
                    >
                      {t(errKey)}
                    </p>
                  ) : null}
                </div>
                <div className="mt-auto flex flex-col gap-2 pt-4">
                  <span className={countClass}>{countDisplay}</span>
                  <span className={`w-full justify-center ${ctaClass}`}>
                    {hasWork ? t("admin_home_inbox_cta_process") : t("admin_home_inbox_cta_view")}
                  </span>
                </div>
              </AdminShellPrefetchLink>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderAllClear = () => (
    <div className={ADMIN_INBOX_ALL_CLEAR_CLASS} data-tt-admin-inbox-all-clear="1">
      <div className={ADMIN_INBOX_ALL_CLEAR_ICON_CLASS} aria-hidden>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="text-body font-semibold text-ink-900">{t("admin_home_inbox_all_clear_title")}</p>
      <p className={`mt-1 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t("admin_home_inbox_all_clear_lead")}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {visibleLinks.map(({ key, href, labelKey }) => (
          <li key={key}>
            <AdminShellPrefetchLink
              href={href}
              className={`${touchTargetLink44Classes} inline-flex rounded-[var(--radius-md)] border border-white/12 bg-bg-console px-3 text-small font-medium text-ink-800 hover:border-ref-sun/35 ${travelFocusRingOffset2Classes}`}
            >
              {t(labelKey)}
            </AdminShellPrefetchLink>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderScopeHonesty = () => (
    <p
      className={`${focusMode ? "mt-2" : "mt-3"} text-meta ${ADMIN_TEXT_META_CLASS}`}
      data-tt-admin-home-inbox-scope-honesty="1"
    >
      {t("admin_home_inbox_scope_honesty")}
    </p>
  );

  const renderApproveFallback = () =>
    showInboxFallback && !loading ? (
      <p
        className={`mt-3 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}
        data-tt-admin-inbox-approve-denied-cta="1"
        role="status"
      >
        {t("admin_home_inbox_approve_fallback")}{" "}
        <AdminShellPrefetchLink
          href="/admin/permissions#admin-shell-preview"
          className={`font-semibold ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
        >
          {t("admin_permissions_link")}
        </AdminShellPrefetchLink>
      </p>
    ) : null;

  const renderDeniedRows = () =>
    deniedLinks.filter(({ key }) => key !== "approvals").length > 0 && !loading ? (
      <ul className="mt-3 space-y-2" data-tt-admin-inbox-permission-denied="1">
        {deniedLinks
          .filter(({ key }) => key !== "approvals")
          .map(({ key, labelKey }) => (
            <li
              key={key}
              className={ADMIN_INBOX_PERM_DENIED_ROW_CLASS}
              data-tt-admin-inbox-channel-denied={key}
            >
              <span>
                {t(labelKey)} — {t("admin_home_inbox_channel_perm_denied")}
              </span>
              <AdminShellPrefetchLink
                href="/admin/permissions"
                className={`${touchTargetLink44Classes} font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
              >
                {t("admin_permissions_link")}
              </AdminShellPrefetchLink>
            </li>
          ))}
      </ul>
    ) : null;

  const renderWorkflowFold = () =>
    !focusMode ? (
      <details className="mt-4 rounded-[var(--radius-md)] border border-white/10 bg-slate-950/35 px-3 py-2">
        <summary className={`cursor-pointer text-meta font-medium ${ADMIN_TEXT_SECONDARY_CLASS} marker:content-none [&::-webkit-details-marker]:hidden`}>
          {t("admin_home_inbox_workflow_fold")}
        </summary>
        <ol
          className={`mt-2 list-decimal space-y-1 pl-5 text-meta ${ADMIN_TEXT_SECONDARY_CLASS}`}
          data-tt-admin-home-inbox-workflow="1"
          data-tt-admin-inbox-workflow-ops={approvalsDenied ? "1" : undefined}
        >
          {workflowKeys.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ol>
      </details>
    ) : null;

  if (focusMode) {
    return (
      <section
        className={ADMIN_INBOX_FOCUS_SECTION_CLASS}
        aria-label={t("admin_home_inbox_aria")}
        data-tt-admin-home-inbox-focus-surface="1"
        data-tt-admin-home-inbox="1"
        data-tt-admin-inbox-focus-banner-secondary="hu438"
      >
        {/* HU-438 · Staging needle (literal survives minify) */}
        <span className="sr-only" data-tt-admin-inbox-focus-banner-mark={TT_ADMIN_INBOX_FOCUS_BANNER_SECONDARY_MARK}>
          {TT_ADMIN_INBOX_FOCUS_BANNER_SECONDARY_MARK}
        </span>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <h2 className="text-body-l font-semibold text-ink-900">{t("admin_home_inbox_title")}</h2>
            {hasFocusWork ? (
              singleQueueFocus ? (
                <p className={`text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t("admin_home_inbox_single_queue_lead")}</p>
              ) : totalPending !== null ? (
                <p
                  role="status"
                  className={ADMIN_INBOX_FOCUS_BANNER_CLASS}
                  data-tt-admin-inbox-focus-banner="hu438"
                  data-tt-admin-inbox-focus-banner-tone="secondary"
                  aria-label={t("admin_home_inbox_focus_banner_aria", { count: totalPending })}
                >
                  {t("admin_home_inbox_focus_banner")}
                </p>
              ) : null
            ) : (
              <p className={`text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t("admin_home_inbox_lead")}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {showUnifiedInboxCta ? (
              <AdminShellPrefetchLink
                href="/admin/inbox"
                className={`${ADMIN_INBOX_OPEN_UNIFIED_SECONDARY_CLASS} ${travelFocusRingOffset2Classes}`}
                data-tt-admin-inbox-focus-unified-link="1"
                data-tt-admin-inbox-open-unified-secondary="hu438"
              >
                {t("admin_home_inbox_open_unified")}
              </AdminShellPrefetchLink>
            ) : (
              <span
                className="sr-only"
                data-tt-admin-inbox-unified-cta-suppressed="1"
                data-tt-admin-inbox-unified-cta-reason="sidebar"
              >
                {t("admin_home_inbox_open_unified")}
              </span>
            )}
            <AdminShellPrefetchLink
              href="/admin/operator-guide"
              className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
              data-tt-admin-home-inbox-operator-guide="1"
            >
              {t("admin_home_guide_full_link")}
            </AdminShellPrefetchLink>
            {error && onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
              >
                {t("admin_home_inbox_retry")}
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <AdminNoticeBanner tone="warning" className="mt-2" message={t("admin_home_inbox_error_partial")} />
        ) : null}

        {focusLayoutDeferred ? (
          <div
            className="mt-3 space-y-3 rounded-[var(--radius-lg)] border border-white/10 bg-slate-950/40 p-4"
            data-tt-admin-home-inbox-focus-defer="1"
            aria-busy="true"
          >
            <div className={`h-4 w-2/5 rounded ${ADMIN_CONSOLE_SKELETON_LINE_CLASS}`} />
            <div className={`h-16 rounded-[var(--radius-md)] ${ADMIN_CONSOLE_SKELETON_BLOCK_CLASS}`} />
          </div>
        ) : compactAllClear ? (
          renderAllClear()
        ) : (
          renderQueueGrid("focus")
        )}

        {hasFocusWork ? (
          <AdminInboxWorkflowQuickNav
            tasks={workflowTasks}
            loading={loading}
            placement="home"
            hideZeroCounts
            compact
          />
        ) : null}

        {renderScopeHonesty()}
        {renderApproveFallback()}
        {renderDeniedRows()}
      </section>
    );
  }

  return (
    <AdminWarmL5Surface
      as="section"
      className={ADMIN_HOME_WIDGET_CARD_CLASS}
      aria-label={t("admin_home_inbox_aria")}
      data-tt-admin-home-inbox="1"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-body-l font-semibold text-ink-900">{t("admin_home_inbox_title")}</h2>
          <p className={`mt-1 text-small ${ADMIN_TEXT_SECONDARY_CLASS}`}>{t("admin_home_inbox_lead")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {showUnifiedInboxCta ? (
            <AdminShellPrefetchLink
              href="/admin/inbox"
              className={`${touchTargetLink44Classes} text-small font-semibold ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
              data-tt-admin-home-inbox-unified-link="1"
            >
              {t("admin_unified_inbox_open")}
            </AdminShellPrefetchLink>
          ) : (
            <span
              className="sr-only"
              data-tt-admin-inbox-unified-cta-suppressed="1"
              data-tt-admin-inbox-unified-cta-reason="sidebar"
            >
              {t("admin_unified_inbox_open")}
            </span>
          )}
          {error && onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className={`${touchTargetLink44Classes} text-small font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_home_inbox_retry")}
            </button>
          ) : null}
        </div>
      </div>
      {error ? (
        <AdminNoticeBanner tone="warning" className="mt-3" message={t("admin_home_inbox_error_partial")} />
      ) : null}

      {compactAllClear ? renderAllClear() : renderQueueGrid("default")}

      {renderApproveFallback()}
      {renderDeniedRows()}
      {renderScopeHonesty()}
      {renderWorkflowFold()}
    </AdminWarmL5Surface>
  );
}
