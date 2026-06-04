"use client";

import Link from "next/link";
import { useTranslation } from "@/components/LocaleProvider";
import {
  admU01ShellGroupVisible,
  type AdmU01ShellGroupId,
} from "@/lib/admin/admU01ShellGroupVisibility";
import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";
import { useAdminHomeInbox } from "@/lib/admin/useAdminHomeInbox";
import { adminShellNavPendingCount } from "@/lib/admin/adminShellInboxNavBadge";
import {
  adminShellNavGroupPendingRollup,
  adminShellNavGroupSummaryBadgeVisible,
} from "@/lib/admin/adminShellPendingBadgePolicy";
import { useAdminShellSidebarVisible } from "@/lib/admin/useAdminShellSidebarVisible";
import { AdminShellPendingBadge } from "@/components/admin/AdminShellPendingBadge";
import { adminShellTopNavLinkClass, ADMIN_MOTION_NAV_CLASS, ADMIN_PENDING_COUNT_BADGE_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

export type AdminShellNavLink = {
  href: string;
  labelKey: string;
  match?: (pathname: string) => boolean;
  /** ①：capabilities 已加载时无此权限则隐藏链（外链如 `/` 不设）。 */
  permission?: AdminPermissionId;
};

function defaultMatch(href: string) {
  const path = href.split("?")[0] ?? href;
  return (pathname: string) => pathname === path || pathname.startsWith(`${path}/`);
}

export function AdminShellNavGroup(props: {
  groupId: string;
  summaryKey: string;
  links: AdminShellNavLink[];
  pathname: string;
}) {
  const { t } = useTranslation();
  const caps = useAdminCapabilities();
  const { shellFilterRole, previewRole } = useAdminEffectiveShellRole();
  const inbox = useAdminHomeInbox();
  const sidebarLayoutActive = useAdminShellSidebarVisible();
  const { groupId, summaryKey, links, pathname } = props;

  if (
    shellFilterRole &&
    !admU01ShellGroupVisible(groupId as AdmU01ShellGroupId, shellFilterRole)
  ) {
    return null;
  }

  if (!caps.permissionsLoaded && !caps.capabilitiesUnavailable) {
    return null;
  }

  const visibleLinks =
    caps.permissionsLoaded && !caps.capabilitiesUnavailable
      ? links.filter((l) => !l.permission || caps.hasPermission(l.permission))
      : caps.capabilitiesUnavailable
        ? links
        : [];
  const groupActive = visibleLinks.some((l) => (l.match ?? defaultMatch(l.href))(pathname));

  if (visibleLinks.length === 0) return null;

  const groupRollup = adminShellNavGroupPendingRollup(
    visibleLinks,
    inbox.counts,
    inbox.channels,
    inbox.loading,
    inbox.error,
    caps.hasPermission,
    caps.permissionsLoaded,
  );
  const showGroupSummaryBadge = adminShellNavGroupSummaryBadgeVisible({
    sidebarLayoutActive,
    rollup: groupRollup,
  });

  return (
    <details
      className="inline-block"
      data-tt-admin-shell-nav-group={groupId}
      data-tt-admin-shell-nav-filter-role={shellFilterRole ?? undefined}
      data-tt-admin-shell-nav-preview={previewRole ? "1" : "0"}
      open={groupActive || undefined}
    >
      <summary
        className={`${touchTargetLink44Classes} inline-flex cursor-pointer list-none items-center gap-2 font-medium ${ADMIN_MOTION_NAV_CLASS} [&::-webkit-details-marker]:hidden ${adminShellTopNavLinkClass(groupActive)} ${travelFocusRingOffset2Classes}`}
      >
        <span>{t(summaryKey)}</span>
        {showGroupSummaryBadge ? (
          <span
            className={ADMIN_PENDING_COUNT_BADGE_CLASS}
            data-tt-admin-shell-nav-group-pending={groupId}
            aria-label={t("admin_shell_nav_group_pending_aria", {
              group: t(summaryKey),
              count: groupRollup,
            })}
          >
            {groupRollup > 99 ? "99+" : groupRollup}
          </span>
        ) : null}
      </summary>
      <ul className="mt-1 flex flex-col gap-0.5 border-l border-ink-200 pl-3 sm:absolute sm:z-10 sm:mt-2 sm:min-w-[11rem] sm:rounded-[var(--radius-md)] sm:border sm:border-ink-200 sm:bg-bg-console sm:p-2 sm:shadow-soft">
        {visibleLinks.map((link) => {
          const active = (link.match ?? defaultMatch(link.href))(pathname);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`${touchTargetLink44Classes} flex items-center justify-between gap-2 text-small font-medium ${ADMIN_MOTION_NAV_CLASS} ${adminShellTopNavLinkClass(active)} ${travelFocusRingOffset2Classes}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="min-w-0 truncate">{t(link.labelKey)}</span>
                {(() => {
                  const { count: pending, inboxKey } = adminShellNavPendingCount(
                    link.href,
                    inbox.counts,
                    inbox.channels,
                    inbox.loading,
                    inbox.error,
                    caps.hasPermission,
                    caps.permissionsLoaded,
                  );
                  if (pending === null || pending <= 0 || !inboxKey || inboxKey === "hub") return null;
                  return (
                    <AdminShellPendingBadge
                      count={pending}
                      label={t(link.labelKey)}
                      placement="top_nav_dropdown"
                      sidebarLayoutActive={sidebarLayoutActive}
                      inboxKey={inboxKey}
                      legacyMarker="nav"
                    />
                  );
                })()}
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
