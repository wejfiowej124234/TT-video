"use client";



import Link from "next/link";

import { useRouter } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";

import {
  admU01ShellGroupVisible,
  type AdmU01ShellGroupId,
} from "@/lib/admin/admU01ShellGroupVisibility";
import { filterAdminShellLinksForCapabilitiesFailure } from "@/lib/admin/adminShellCapabilitiesFailureNav";

import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";

import { adminShellLinkPrefetchProps } from "@/lib/admin/adminShellPrefetchHref";
import { prefetchAdminRoutesBatched } from "@/lib/admin/adminNavPrefetchBatch";

import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";

import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";

import { useAdminHomeInbox } from "@/lib/admin/useAdminHomeInbox";

import { adminShellNavPendingCount } from "@/lib/admin/adminShellInboxNavBadge";

import {

  adminShellNavGroupPendingRollup,

  adminShellNavGroupSummaryBadgeVisible,

} from "@/lib/admin/adminShellPendingBadgePolicy";

import { adminShellNavGroupDefaultOpen } from "@/lib/admin/adminShellUxPolicy";

import { useAdminShellSidebarVisible } from "@/lib/admin/useAdminShellSidebarVisible";

import { AdminShellPendingBadge } from "@/components/admin/AdminShellPendingBadge";

import { adminShellTopNavLinkClass, ADMIN_MOTION_NAV_CLASS, ADMIN_PENDING_COUNT_BADGE_CLASS, ADMIN_SHELL_NAV_DROPDOWN_CLASS } from "@/lib/adminUi";

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

  const router = useRouter();

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



  const visibleLinks = caps.capabilitiesUnavailable
    ? filterAdminShellLinksForCapabilitiesFailure(links)
    : caps.permissionsLoaded
      ? links.filter((l) => !l.permission || caps.hasPermission(l.permission))
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

  const defaultOpen = adminShellNavGroupDefaultOpen(groupId, {

    groupActive,

    pendingRollup: groupRollup,

    shellFilterRole: shellFilterRole ?? undefined,

  });



  const prefetchGroupLinks = () => {

    prefetchAdminRoutesBatched(

      router,

      visibleLinks.map((l) => l.href),

      { batchSize: 4, gapMs: 40 },

    );

  };



  return (

    <details

      className="inline-block"

      data-tt-admin-shell-nav-group={groupId}

      data-tt-admin-shell-nav-filter-role={shellFilterRole ?? undefined}

      data-tt-admin-shell-nav-preview={previewRole ? "1" : "0"}

      data-tt-admin-shell-nav-group-default-open={defaultOpen ? "1" : "0"}

      open={defaultOpen || undefined}

    >

      <summary

        className={`${touchTargetLink44Classes} inline-flex cursor-pointer list-none items-center gap-2 font-medium ${ADMIN_MOTION_NAV_CLASS} [&::-webkit-details-marker]:hidden ${adminShellTopNavLinkClass(groupActive)} ${travelFocusRingOffset2Classes}`}

        onPointerEnter={prefetchGroupLinks}
        onPointerDown={prefetchGroupLinks}
        onFocus={prefetchGroupLinks}

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

      <ul className={ADMIN_SHELL_NAV_DROPDOWN_CLASS}>

        {visibleLinks.map((link) => {

          const active = (link.match ?? defaultMatch(link.href))(pathname);

          return (

            <li key={link.href}>

              <Link

                href={link.href}

                {...adminShellLinkPrefetchProps(router, link.href)}

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

