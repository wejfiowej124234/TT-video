"use client";



import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";

import { admU01ShellGroupVisible } from "@/lib/admin/admU01ShellGroupVisibility";
import { filterAdminShellLinksForCapabilitiesFailure } from "@/lib/admin/adminShellCapabilitiesFailureNav";

import { adminHomeCardRequiredPermission } from "@/lib/admin/adminHomeCardPermission";

import { adminHomeCardTierForHref } from "@/lib/admin/adminHomeCardCapability";

import { adminShellContextForPath } from "@/lib/admin/adminShellContextForPath";

import { ADMIN_SHELL_SIDEBAR_GROUPS } from "@/lib/admin/adminShellSidebarModel";

import { adminShellNavPendingCount } from "@/lib/admin/adminShellInboxNavBadge";
import {
  adminShellNavGroupPendingRollup,
  adminShellNavGroupSummaryAttentionDotVisible,
  adminShellNavGroupSummaryBadgeVisible,
} from "@/lib/admin/adminShellPendingBadgePolicy";
import { useAdminHomeInboxFocusMode } from "@/lib/admin/useAdminHomeInboxFocusMode";

import { useAdminShellSidebarVisible } from "@/lib/admin/useAdminShellSidebarVisible";

import { AdminShellPendingBadge } from "@/components/admin/AdminShellPendingBadge";
import { AdminShellNavIcon, adminShellNavIconIdForGroup, adminShellNavIconIdForHref } from "@/components/admin/AdminShellNavIcon";

import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";

import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";

import { useAdminHomeInbox } from "@/lib/admin/useAdminHomeInbox";

import { useAdminHomeKpi } from "@/lib/admin/useAdminHomeKpi";

import { adminHomeTierLabelKey } from "@/lib/admin/adminHomeVisibility";
import {
  ADMIN_SHELL_NAV_GROUPS_COLLAPSED_DEFAULT,
  adminShellLinkTierBadgeVisible,
  adminShellNavGroupDefaultOpen,
} from "@/lib/admin/adminShellUxPolicy";

import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";

import {
  ADMIN_HOME_CARD_TIER_PLACEHOLDER_BADGE_CLASS,
  ADMIN_HOME_CARD_TIER_READ_BADGE_CLASS,
  ADMIN_HOME_CARD_TIER_SUPER_WRITE_BADGE_CLASS,
  ADMIN_HOME_CARD_TIER_WRITE_BADGE_CLASS,
  ADMIN_DOMAIN_HEALTH_ATTENTION_DOT_CLASS,
  ADMIN_PENDING_COUNT_BADGE_CLASS,
  ADMIN_SHELL_NAV_ACTIVE_CLASS,
  ADMIN_SHELL_SIDEBAR_GROUP_SUMMARY_CLASS,
  ADMIN_SHELL_SIDEBAR_HINT_CLASS,
  ADMIN_SHELL_SIDEBAR_LINK_CLASS,
  ADMIN_SHELL_SIDEBAR_SURFACE_CLASS,
} from "@/lib/adminUi";

import { adminShellLinkPrefetchProps } from "@/lib/admin/adminShellPrefetchHref";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";



function linkActive(pathname: string, href: string, activeExact?: boolean): boolean {

  const base = href.split("?")[0] ?? href;

  if (base === "/admin") return pathname === "/admin";

  if (activeExact) return pathname === base || pathname === `${base}/`;

  return pathname === base || pathname.startsWith(`${base}/`);

}



function sidebarTierBadgeClass(tier: ReturnType<typeof adminHomeCardTierForHref>): string {
  if (tier === "super_write") return ADMIN_HOME_CARD_TIER_SUPER_WRITE_BADGE_CLASS;
  if (tier === "write") return ADMIN_HOME_CARD_TIER_WRITE_BADGE_CLASS;
  if (tier === "read") return ADMIN_HOME_CARD_TIER_READ_BADGE_CLASS;
  return ADMIN_HOME_CARD_TIER_PLACEHOLDER_BADGE_CLASS;
}

function sidebarBadgePlacement(href: string): "sidebar_inbox_hub" | "sidebar_queue_leaf" {
  const base = href.split("?")[0] ?? href;
  return base === "/admin/inbox" ? "sidebar_inbox_hub" : "sidebar_queue_leaf";
}



function sidebarKpiDisputeCount(

  href: string,

  disputes: number | null,

  loading: boolean,

): number | null {

  const base = href.split("?")[0] ?? href;

  if (base !== "/admin/disputes") return null;

  if (loading || disputes === null) return null;

  return disputes > 0 ? disputes : null;

}



/** U2 · ① 持久侧栏（lg+）；与顶栏分组同序 · capabilities 过滤 · 待办/KPI 徽标。 */

export function AdminShellSidebar() {

  const { t } = useTranslation();

  const pathname = usePathname() ?? "";
  const router = useRouter();

  const caps = useAdminCapabilities();

  const { shellFilterRole } = useAdminEffectiveShellRole();

  const inbox = useAdminHomeInbox();

  const kpi = useAdminHomeKpi();

  const sidebarLayoutActive = useAdminShellSidebarVisible();
  const workspaceInboxFocus = useAdminHomeInboxFocusMode();

  const shellContext = adminShellContextForPath(pathname);



  return (

    <aside

      className={ADMIN_SHELL_SIDEBAR_SURFACE_CLASS}

      aria-label={t("admin_shell_sidebar_aria")}

      data-tt-admin-shell-sidebar="1"
      data-tt-admin-shell-sidebar-capabilities-failure={caps.capabilitiesUnavailable ? "1" : undefined}

    >

      <nav className="sticky top-[3.25rem] max-h-[calc(100vh-3.25rem)] overflow-y-auto px-3 py-5">

        {shellContext && pathname !== "/admin" ? (

          <p

            className={`mb-3 ${ADMIN_SHELL_SIDEBAR_HINT_CLASS}`}

            data-tt-admin-shell-sidebar-domain-hint="1"

          >

            {t("admin_shell_sidebar_current_domain", { domain: t(shellContext.groupLabelKey) })}

          </p>

        ) : null}

        {ADMIN_SHELL_SIDEBAR_GROUPS.map((group) => {

          if (

            group.id !== "workspace" &&

            shellFilterRole &&

            !admU01ShellGroupVisible(group.id, shellFilterRole)

          ) {

            return null;

          }

          if (group.id === "finance" && caps.permissionsLoaded && !caps.hasPermission(ADMIN_PERM.FINANCE_READ)) {

            return null;

          }



          const visibleLinks = group.links.filter((link) => {

            const base = link.href.split("?")[0] ?? link.href;

            const perm =

              link.permission ??

              (base.startsWith("/admin") ? adminHomeCardRequiredPermission(base) : undefined);

            if (!caps.permissionsLoaded) return false;

            if (caps.capabilitiesUnavailable) {

              return filterAdminShellLinksForCapabilitiesFailure([link]).length > 0;

            }

            return !perm || caps.hasPermission(perm);

          });



          if (visibleLinks.length === 0) return null;

          const groupActive = visibleLinks.some((link) =>
            linkActive(pathname, link.href, link.activeExact),
          );
          const groupRollup = adminShellNavGroupPendingRollup(
            visibleLinks,
            inbox.counts,
            inbox.channels,
            inbox.loading,
            inbox.error,
            caps.hasPermission,
            caps.permissionsLoaded,
          );
          const defaultOpen = adminShellNavGroupDefaultOpen(group.id, {
            groupActive,
            pendingRollup: groupRollup,
            shellFilterRole: shellFilterRole ?? undefined,
          });
          const collapsedByDefault = ADMIN_SHELL_NAV_GROUPS_COLLAPSED_DEFAULT.has(group.id);

          return (

            <details
              key={group.id}
              className="mb-3 group/sidebar-fold"
              open={defaultOpen || undefined}
              data-tt-admin-shell-sidebar-group={group.id}
              data-tt-admin-shell-sidebar-fold={
                collapsedByDefault ? "collapsed_default" : "open_default"
              }
              data-tt-admin-shell-sidebar-group-open={defaultOpen ? "1" : "0"}
            >
              <summary
                className={`${touchTargetLink44Classes} ${ADMIN_SHELL_SIDEBAR_GROUP_SUMMARY_CLASS} items-center ${travelFocusRingOffset2Classes}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <AdminShellNavIcon id={adminShellNavIconIdForGroup(group.id)} className="text-slate-400" />
                  {t(group.labelKey)}
                </span>
                {adminShellNavGroupSummaryAttentionDotVisible({
                  sidebarLayoutActive,
                  rollup: groupRollup,
                  workspaceInboxFocus,
                }) ? (
                  <span
                    className={`${ADMIN_DOMAIN_HEALTH_ATTENTION_DOT_CLASS} shrink-0 self-center`}
                    data-tt-admin-shell-sidebar-group-attention={group.id}
                    aria-label={t("admin_shell_nav_group_pending_aria", {
                      group: t(group.labelKey),
                      count: groupRollup,
                    })}
                  />
                ) : adminShellNavGroupSummaryBadgeVisible({
                    sidebarLayoutActive,
                    rollup: groupRollup,
                    workspaceInboxFocus,
                  }) ? (
                  <span
                    className={ADMIN_PENDING_COUNT_BADGE_CLASS}
                    data-tt-admin-shell-sidebar-group-pending={group.id}
                    aria-label={t("admin_shell_nav_group_pending_aria", {
                      group: t(group.labelKey),
                      count: groupRollup,
                    })}
                  >
                    {groupRollup > 99 ? "99+" : groupRollup}
                  </span>
                ) : null}
              </summary>

              <ul className="mt-0.5 space-y-1 pb-1">

                {visibleLinks.map((link) => {

                  const active = linkActive(pathname, link.href, link.activeExact);

                  const { count: pending, inboxKey } = adminShellNavPendingCount(

                    link.href,

                    inbox.counts,

                    inbox.channels,

                    inbox.loading,

                    inbox.error,

                    caps.hasPermission,

                    caps.permissionsLoaded,

                  );

                  const disputeKpi = sidebarKpiDisputeCount(

                    link.href,

                    kpi.counts.disputes,

                    kpi.loading,

                  );

                  const tier = adminHomeCardTierForHref(link.href);

                  const label = t(link.labelKey);

                  return (

                    <li key={link.href}>

                      <Link

                        href={link.href}
                        {...adminShellLinkPrefetchProps(router, link.href)}

                        className={`${touchTargetLink44Classes} flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-2 py-2.5 ${travelFocusRingOffset2Classes} ${
                          active
                            ? `bg-ref-sun/10 ${ADMIN_SHELL_NAV_ACTIVE_CLASS}`
                            : ADMIN_SHELL_SIDEBAR_LINK_CLASS
                        }`}

                        aria-current={active ? "page" : undefined}

                      >

                        <span className="flex min-w-0 items-center gap-2 truncate">
                          <AdminShellNavIcon
                            id={adminShellNavIconIdForHref(link.href)}
                            className={active ? "text-[#ffe8d4]" : "text-slate-500"}
                          />
                          <span className="truncate">{label}</span>

                          {adminShellLinkTierBadgeVisible() && tier !== "placeholder" ? (
                            <span
                              className={`shrink-0 rounded-full border px-1.5 py-0 text-meta font-medium ${sidebarTierBadgeClass(tier)}`}
                              title={t("admin_home_card_tier_hint")}
                            >
                              {t(adminHomeTierLabelKey(tier))}
                            </span>
                          ) : null}

                        </span>

                        <span className="flex shrink-0 items-center gap-1">

                          {pending !== null && pending > 0 && inboxKey ? (

                            <AdminShellPendingBadge

                              count={pending}

                              label={label}

                              placement={sidebarBadgePlacement(link.href)}

                              sidebarLayoutActive={sidebarLayoutActive}

                              inboxKey={inboxKey}

                              legacyMarker="sidebar"

                              suppressSidebarLeafOnWorkspaceInboxFocus={workspaceInboxFocus}

                            />

                          ) : disputeKpi !== null ? (

                            <span

                              className={ADMIN_PENDING_COUNT_BADGE_CLASS}

                              data-tt-admin-shell-kpi-badge="disputes"

                              title={t("admin_home_kpi_disputes_label")}

                            >

                              {disputeKpi}

                            </span>

                          ) : null}

                        </span>

                      </Link>

                    </li>

                  );

                })}

              </ul>

            </details>

          );

        })}

      </nav>

    </aside>

  );

}

