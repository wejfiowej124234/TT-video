"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import { adminInboxErrorLabelKey } from "@/lib/admin/adminInboxErrorLabel";
import { adminHomeInboxPendingTotal } from "@/lib/admin/adminHomeInboxPendingTotal";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";
import { AdminNoticeBanner } from "@/components/admin/AdminNoticeBanner";
import { useAdminApprovePermissionHint } from "@/lib/admin/adminApprovePermissionHint";
import {
  ADMIN_HOME_WIDGET_CARD_CLASS,
  ADMIN_INLINE_LINK_CLASS,
  ADMIN_INBOX_PERM_DENIED_ROW_CLASS,
  ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS,
  ADMIN_INBOX_CHANNEL_ERROR_CLASS,
  ADMIN_INBOX_TASK_CTA_IDLE_CLASS,
  ADMIN_KPI_CARD_IDLE_CLASS,
  ADMIN_KPI_CARD_PENDING_CLASS,
  ADMIN_MOTION_CARD_HOVER_CLASS,
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
}) {
  const { t } = useTranslation();
  const { counts, channels, loading, error, onRetry, hasPermission, permissionsLoaded } = props;
  const { showInboxFallback } = useAdminApprovePermissionHint();

  const totalPending = adminHomeInboxPendingTotal(
    counts,
    channels,
    loading,
    error,
    hasPermission,
    permissionsLoaded,
  );

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
  const compactAllClear =
    !loading && !error && totalPending === 0 && visibleLinks.length > 0;

  return (
    <section
      className={ADMIN_HOME_WIDGET_CARD_CLASS}
      aria-label={t("admin_home_inbox_aria")}
      data-tt-admin-home-inbox="1"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-body-l font-semibold text-ink-900">{t("admin_home_inbox_title")}</h2>
          <p className="mt-1 text-small text-ink-600">{t("admin_home_inbox_lead")}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/admin/inbox"
            className={`${touchTargetLink44Classes} text-small font-semibold ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
            data-tt-admin-home-inbox-unified-link="1"
          >
            {t("admin_unified_inbox_open")}
          </Link>
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

      {compactAllClear ? (
        <div
          className="mt-4 rounded-[var(--radius-lg)] border border-emerald-200/80 bg-emerald-50/50 px-4 py-4 text-center sm:text-left"
          data-tt-admin-inbox-all-clear="1"
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 sm:mx-0"
            aria-hidden
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-body font-semibold text-ink-900">{t("admin_home_inbox_all_clear_title")}</p>
          <p className="mt-1 text-small text-ink-600">{t("admin_home_inbox_all_clear_lead")}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {visibleLinks.map(({ key, href, labelKey }) => (
              <li key={key}>
                <Link
                  href={href}
                  className={`${touchTargetLink44Classes} inline-flex rounded-[var(--radius-md)] border border-ink-200 bg-white px-3 text-small font-medium text-ink-800 hover:border-ink-400 ${travelFocusRingOffset2Classes}`}
                >
                  {t(labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul
          className={`mt-4 grid gap-3 ${
            visibleLinks.length === 1 ? "max-w-xl grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-4"
          }`}
          data-tt-admin-inbox-grid-count={visibleLinks.length}
        >
          {INBOX_LINKS.map(({ key, href, labelKey, descKey }) => {
            const ch = channels[key];
            if (ch.permissionDenied) return null;
            const n = counts[key];
            const errKey = adminInboxErrorLabelKey(ch.errorKind);
            const countDisplay = loading
              ? "…"
              : errKey || n === null
                ? "—"
                : String(n);
            const hasWork = !loading && n !== null && n > 0;
            if (!loading && !hasWork && !errKey && totalPending !== null && totalPending > 0) {
              return null;
            }

            return (
              <li key={key} data-tt-admin-inbox-channel={key}>
                <Link
                  href={href}
                  className={`flex h-full min-h-[8.5rem] flex-col justify-between rounded-[var(--radius-lg)] border p-4 ${ADMIN_MOTION_CARD_HOVER_CLASS} ${travelFocusRingOffset2Classes} ${
                    hasWork ? ADMIN_KPI_CARD_PENDING_CLASS : ADMIN_KPI_CARD_IDLE_CLASS
                  }`}
                  aria-label={`${t(labelKey)}${hasWork ? `, ${t("admin_home_inbox_cta_process")}` : ""}`}
                >
                  <div>
                    <p className="text-small font-medium text-ink-800">{t(labelKey)}</p>
                    <p className="mt-1 text-meta text-ink-600 leading-snug">{t(descKey)}</p>
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
                    <span
                      className={`text-h2 font-bold tabular-nums ${
                        hasWork ? "text-ink-900" : "text-ink-400"
                      }`}
                    >
                      {countDisplay}
                    </span>
                    <span
                      className={`w-full justify-center ${
                        hasWork ? ADMIN_INBOX_TASK_CTA_ACTIVE_CLASS : ADMIN_INBOX_TASK_CTA_IDLE_CLASS
                      }`}
                    >
                      {hasWork ? t("admin_home_inbox_cta_process") : t("admin_home_inbox_cta_view")}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {showInboxFallback && !loading ? (
        <p
          className="mt-3 text-small text-ink-600"
          data-tt-admin-inbox-approve-denied-cta="1"
          role="status"
        >
          {t("admin_home_inbox_approve_fallback")}{" "}
          <Link
            href="/admin/permissions#admin-shell-preview"
            className={`font-semibold ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
          >
            {t("admin_permissions_link")}
          </Link>
        </p>
      ) : null}

      {deniedLinks.filter(({ key }) => key !== "approvals").length > 0 && !loading ? (
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
              <Link
                href="/admin/permissions"
                className={`${touchTargetLink44Classes} font-medium ${ADMIN_INLINE_LINK_CLASS} ${travelFocusRingOffset2Classes}`}
              >
                {t("admin_permissions_link")}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <details className="mt-4 rounded-[var(--radius-md)] border border-ink-100 bg-ink-50/50 px-3 py-2">
        <summary className="cursor-pointer text-meta font-medium text-ink-600 marker:content-none [&::-webkit-details-marker]:hidden">
          {t("admin_home_inbox_workflow_fold")}
        </summary>
        <ol
          className="mt-2 list-decimal space-y-1 pl-5 text-meta text-ink-600"
          data-tt-admin-home-inbox-workflow="1"
          data-tt-admin-inbox-workflow-ops={approvalsDenied ? "1" : undefined}
        >
          {workflowKeys.map((key) => (
            <li key={key}>{t(key)}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}
