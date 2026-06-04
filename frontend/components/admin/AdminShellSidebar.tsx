"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/components/LocaleProvider";
import { admU01ShellGroupVisible } from "@/lib/admin/admU01ShellGroupVisibility";
import { adminHomeCardRequiredPermission } from "@/lib/admin/adminHomeCardPermission";
import { adminHomeCardTierForHref } from "@/lib/admin/adminHomeCardCapability";
import { adminShellContextForPath } from "@/lib/admin/adminShellContextForPath";
import { ADMIN_SHELL_SIDEBAR_GROUPS } from "@/lib/admin/adminShellSidebarModel";
import { adminShellNavPendingCount } from "@/lib/admin/adminShellInboxNavBadge";
import { useAdminShellSidebarVisible } from "@/lib/admin/useAdminShellSidebarVisible";
import { AdminShellPendingBadge } from "@/components/admin/AdminShellPendingBadge";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";
import { useAdminHomeInbox } from "@/lib/admin/useAdminHomeInbox";
import { useAdminHomeKpi } from "@/lib/admin/useAdminHomeKpi";
import { adminHomeTierLabelKey } from "@/lib/admin/adminHomeVisibility";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { ADMIN_HOME_CARD_TIER_READ_BADGE_CLASS, ADMIN_PENDING_COUNT_BADGE_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

function linkActive(pathname: string, href: string): boolean {
  const base = href.split("?")[0] ?? href;
  if (base === "/admin") return pathname === "/admin";
  return pathname === base || pathname.startsWith(`${base}/`);
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
  const caps = useAdminCapabilities();
  const { shellFilterRole } = useAdminEffectiveShellRole();
  const inbox = useAdminHomeInbox();
  const kpi = useAdminHomeKpi();
  const sidebarLayoutActive = useAdminShellSidebarVisible();
  const shellContext = adminShellContextForPath(pathname);

  return (
    <aside
      className="hidden w-56 shrink-0 border-r border-ink-200 bg-bg-console lg:block"
      aria-label={t("admin_shell_sidebar_aria")}
      data-tt-admin-shell-sidebar="1"
    >
      <nav className="sticky top-[3.25rem] max-h-[calc(100vh-3.25rem)] overflow-y-auto px-3 py-4 text-small">
        {shellContext && pathname !== "/admin" ? (
          <p
            className="mb-3 rounded-[var(--radius-md)] border border-ink-100 bg-ink-50/80 px-2 py-1.5 text-meta text-ink-600"
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
            if (caps.capabilitiesUnavailable) return true;
            return !perm || caps.hasPermission(perm);
          });

          if (visibleLinks.length === 0) return null;

          return (
            <div key={group.id} className="mb-4" data-tt-admin-shell-sidebar-group={group.id}>
              <p className="px-2 text-meta font-semibold uppercase tracking-wide text-ink-500">
                {t(group.labelKey)}
              </p>
              <ul className="mt-1 space-y-0.5">
                {visibleLinks.map((link) => {
                  const active = linkActive(pathname, link.href);
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
                        className={`${touchTargetLink44Classes} flex items-center justify-between gap-2 rounded-[var(--radius-md)] px-2 py-2 font-medium ${travelFocusRingOffset2Classes} ${
                          active
                            ? "bg-ink-100 text-ink-900"
                            : "text-ink-700 hover:bg-ink-50 hover:text-ink-900"
                        }`}
                        aria-current={active ? "page" : undefined}
                      >
                        <span className="flex min-w-0 items-center gap-1.5 truncate">
                          <span className="truncate">{label}</span>
                          {tier === "read" ? (
                            <span
                              className={`shrink-0 rounded-full border px-1.5 py-0 text-meta font-medium ${ADMIN_HOME_CARD_TIER_READ_BADGE_CLASS}`}
                              title={t("admin_home_card_tier_hint")}
                            >
                              {t(adminHomeTierLabelKey("read"))}
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
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
