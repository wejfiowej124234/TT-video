"use client";

import type { ReactNode } from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";

import { AdminShellNavGroup, type AdminShellNavLink } from "@/components/admin/AdminShellNavGroup";

import { ADMIN_SHELL_SIDEBAR_GROUPS } from "@/lib/admin/adminShellSidebarModel";
import { adminShellNavLinkMatch } from "@/lib/admin/adminShellNavLinkTypes";
import { admU01ShellGroupVisible } from "@/lib/admin/admU01ShellGroupVisibility";
import { adminHomeCardRequiredPermission } from "@/lib/admin/adminHomeCardPermission";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { CONSOLE_ROLE_70_LABEL_KEYS } from "@/lib/admin/adminRole70Matrix";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { useAdminShellActor } from "@/lib/admin/useAdminShellActor";
import {
  adminDeployEnvBadgeClass,
  adminDeployEnvDisplayLabel,
  adminDeployEnvBadgeVisible,
  resolveAdminDeployEnv,
} from "@/lib/admin/adminDeployEnvBadge";
import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";
import { isAdminMaintainerUi } from "@/lib/admin/adminMaintainerUiMode";
import { AdminShellBarRolePerspectiveSwitcher } from "@/components/admin/AdminShellBarRolePerspectiveSwitcher";
import { AdminShellPendingBadge } from "@/components/admin/AdminShellPendingBadge";
import { requestAdminCommandPaletteOpen } from "@/lib/admin/adminCommandPaletteBus";
import { adminShellNavPendingCount } from "@/lib/admin/adminShellInboxNavBadge";
import { useAdminShellSidebarVisible } from "@/lib/admin/useAdminShellSidebarVisible";
import { adminHomeInboxPendingTotal } from "@/lib/admin/adminHomeInboxPendingTotal";
import {
  ADMIN_SHELL_BRAND_HREF,
  ADMIN_SHELL_BRAND_WORDMARK_KEY,
  TT_ADMIN_SHELL_BRAND_WORDMARK_MARK,
} from "@/lib/admin/adminShellBrandWordmark";
import {
  adminShellCommandPaletteTriggerVisible,
  adminShellDbRoleBadgeVisible,
  adminShellDeployEnvBadgeQuiet,
  adminShellPreviewBadgeVisible,
  adminShellRolePerspectiveSwitcherVisible,
  adminShellWorkspaceOpsChromeDemoted,
  TT_ADMIN_SHELL_WORKSPACE_OPS_DEMOTED_MARK,
} from "@/lib/admin/adminShellUxPolicy";
import { useAdminHomeInbox } from "@/lib/admin/useAdminHomeInbox";
import { adminShellTopNavGroupNeedsWholeFinanceGate } from "@/lib/admin/adminShellTopNavFinanceGate";
import { ADMIN_SHELL_CAPABILITIES_FAILURE_EXTRA_LINKS } from "@/lib/admin/adminShellCapabilitiesFailureNav";

function shellNav(
  href: string,
  labelKey: string,
  match?: AdminShellNavLink["match"],
  permission?: AdminShellNavLink["permission"],
): AdminShellNavLink {
  const base = href.split("?")[0] ?? href;
  return {
    href,
    labelKey,
    match,
    permission:
      permission ?? (base.startsWith("/admin") ? adminHomeCardRequiredPermission(base) : undefined),
  };
}

function adminShellTopNavLinksFromSidebarGroup(
  group: (typeof ADMIN_SHELL_SIDEBAR_GROUPS)[number],
): AdminShellNavLink[] {
  return group.links.map((link) =>
    shellNav(
      link.href,
      link.labelKey,
      adminShellNavLinkMatch({
        href: link.href,
        labelKey: link.labelKey,
        permission: link.permission,
        activeExact: link.activeExact,
      }),
      link.permission,
    ),
  );
}

import {
  adminShellTopNavLinkClass,
  ADMIN_MOTION_NAV_CLASS,
  ADMIN_SHELL_ACCOUNT_ROLE_BADGE_CLASS,
  ADMIN_SHELL_BRAND_ACCENT_CLASS,
  ADMIN_TEXT_BODY_CLASS,
  ADMIN_SHELL_DB_ROLE_BADGE_CLASS,
  ADMIN_SHELL_META_CHIP_CLASS,
  ADMIN_SHELL_PREVIEW_BADGE_CLASS,
  TT_MARKETING_ADMIN_SHELL_BAR,
} from "@/lib/adminUi";
import { useAdminShellLinkPrefetch } from "@/lib/admin/useAdminShellLinkPrefetch";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/**
 * Batch-12 HU-465 · 仅对「纯资金」整组套闸（legacy `finance`）。
 * `more` 不再整组隐藏 — 财务/设置按叶 permission（AdminShellNavGroup）。
 */
function AdminFinanceShellNavGroupGate({ children }: { children: ReactNode }) {
  const caps = useAdminCapabilities();
  const { shellFilterRole } = useAdminEffectiveShellRole();
  if (shellFilterRole && !admU01ShellGroupVisible("finance", shellFilterRole)) {
    return null;
  }
  if (caps.permissionsLoaded && !caps.hasPermission(ADMIN_PERM.FINANCE_READ)) {
    return null;
  }
  return <>{children}</>;
}

/** 70 / 07 §5.6C：全 `/admin` 域粘性顶栏（分组导航 · ① 本地），与子页「返回工作台」并存 */

export default function AdminShellBar() {

  const { t } = useTranslation();

  const pathname = usePathname() ?? "";

  const actor = useAdminShellActor();
  const caps = useAdminCapabilities();
  const { previewRole, dbRole, shellFilterRole, consoleRoleSource, mode } =
    useAdminEffectiveShellRole();
  const maintainerUi = isAdminMaintainerUi(actor.role);

  const onWorkspace = pathname === "/admin";
  const onInbox = pathname === "/admin/inbox";
  const deployEnv = resolveAdminDeployEnv();

  const onPermissions = pathname === "/admin/permissions";

  const inbox = useAdminHomeInbox();
  const workspacePrefetch = useAdminShellLinkPrefetch("/admin");
  const inboxPrefetch = useAdminShellLinkPrefetch("/admin/inbox");
  const permissionsPrefetch = useAdminShellLinkPrefetch("/admin/permissions#admin-console-role-effective");
  const sidebarLayoutActive = useAdminShellSidebarVisible();
  const inboxHubPending = adminShellNavPendingCount(
    "/admin/inbox",
    inbox.counts,
    inbox.channels,
    inbox.loading,
    inbox.error,
    caps.hasPermission,
    caps.permissionsLoaded,
  );
  const inboxPendingTotal = adminHomeInboxPendingTotal(
    inbox.counts,
    inbox.channels,
    inbox.loading,
    inbox.error,
    caps.hasPermission,
    caps.permissionsLoaded,
  );
  const suppressTopInboxHubOnWorkspace =
    onWorkspace && inboxPendingTotal !== null && inboxPendingTotal > 0;
  const showRolePerspectiveSwitcher =
    caps.permissionsLoaded &&
    !caps.capabilitiesUnavailable &&
    caps.hasPermission(ADMIN_PERM.READ) &&
    adminShellRolePerspectiveSwitcherVisible({
      maintainerUi,
      onWorkspace,
      pendingTotal: inboxPendingTotal,
    });
  const showCommandPaletteTrigger =
    caps.permissionsLoaded &&
    !caps.capabilitiesUnavailable &&
    adminShellCommandPaletteTriggerVisible({
      maintainerUi,
      onWorkspace,
      pendingTotal: inboxPendingTotal,
    });
  const showDbRoleBadges = adminShellDbRoleBadgeVisible({
    showRolePerspectiveSwitcher,
  });
  const showPreviewBadges =
    caps.permissionsLoaded &&
    adminShellPreviewBadgeVisible({
      maintainerUi,
      onWorkspace,
      pendingTotal: inboxPendingTotal,
      shellPreviewActive: Boolean(previewRole),
    });
  /** HU-437 · 工作台运维条降噪（搜索芯片隐藏 · Staging 徽次强 · 禁初始化同层） */
  const workspaceOpsDemoted = adminShellWorkspaceOpsChromeDemoted(onWorkspace);
  const deployEnvQuiet = adminShellDeployEnvBadgeQuiet({ onWorkspace });

  return (

    <header

      className={`${TT_MARKETING_ADMIN_SHELL_BAR} ${ADMIN_SHELL_BRAND_ACCENT_CLASS}`}

      data-tt-admin-shell-bar="1"
      data-tt-admin-shell-workspace-ops-demoted={workspaceOpsDemoted ? "hu437" : undefined}
      data-tt-admin-shell-workspace-ops-mark={
        workspaceOpsDemoted ? TT_ADMIN_SHELL_WORKSPACE_OPS_DEMOTED_MARK : undefined
      }

    >

      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">

        <nav

          className="relative -mx-4 flex max-w-full items-center gap-x-3 gap-y-2 overflow-x-auto px-4 pb-1 text-small scroll-smooth sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible"

          aria-label={t("admin_shell_bar_aria")}

          data-tt-admin-shell-nav-scroll="1"

        >

          {/* HU-443 · TravelTrust 词标（Brand · 首屏可辨） */}
          <Link
            href={ADMIN_SHELL_BRAND_HREF}
            {...workspacePrefetch}
            className={`${touchTargetLink44Classes} shrink-0 font-semibold tracking-tight ${ADMIN_TEXT_BODY_CLASS} ${ADMIN_MOTION_NAV_CLASS} ${travelFocusRingOffset2Classes}`}
            data-tt-admin-shell-brand="hu443"
            data-tt-admin-shell-brand-mark={TT_ADMIN_SHELL_BRAND_WORDMARK_MARK}
            aria-label={t(ADMIN_SHELL_BRAND_WORDMARK_KEY)}
          >
            {t(ADMIN_SHELL_BRAND_WORDMARK_KEY)}
          </Link>

          <Link

            href="/admin"
            {...workspacePrefetch}

            className={`${touchTargetLink44Classes} font-medium ${ADMIN_MOTION_NAV_CLASS} ${adminShellTopNavLinkClass(onWorkspace)} ${travelFocusRingOffset2Classes} ${
              sidebarLayoutActive ? "lg:hidden" : ""
            }`}
            data-tt-admin-shell-top-nav-workspace="1"
            data-tt-admin-shell-top-nav-duplicate={sidebarLayoutActive ? "hidden-lg" : "show"}

            aria-current={onWorkspace ? "page" : undefined}

          >

            {t("admin_shell_nav_workspace")}

          </Link>

          <Link
            href="/admin/inbox"
            {...inboxPrefetch}
            className={`${touchTargetLink44Classes} inline-flex items-center gap-2 font-medium ${ADMIN_MOTION_NAV_CLASS} ${adminShellTopNavLinkClass(onInbox)} ${travelFocusRingOffset2Classes} ${
              sidebarLayoutActive ? "lg:hidden" : ""
            }`}
            data-tt-admin-shell-top-nav-inbox="1"
            data-tt-admin-shell-top-nav-duplicate={sidebarLayoutActive ? "hidden-lg" : "show"}
            aria-current={onInbox ? "page" : undefined}
          >
            <span>{t("admin_unified_inbox_nav_short")}</span>
            {inboxHubPending.count !== null &&
            inboxHubPending.count > 0 &&
            inboxHubPending.inboxKey ? (
              <AdminShellPendingBadge
                count={inboxHubPending.count}
                label={t("admin_unified_inbox_nav_short")}
                placement="top_inbox_hub"
                sidebarLayoutActive={sidebarLayoutActive}
                inboxKey={inboxHubPending.inboxKey}
                legacyMarker="hub"
                suppressTopInboxHubOnWorkspace={suppressTopInboxHubOnWorkspace}
              />
            ) : null}
          </Link>

          {/* HU-235 · lg+ 侧栏布局时顶栏保留枢纽可达（≠ 工作台/收件箱重复） */}
          {sidebarLayoutActive ? (
            <div
              className="hidden items-center gap-x-3 lg:flex"
              data-tt-admin-shell-top-hubs="1"
              aria-label={t("admin_shell_top_hubs_aria")}
            >
              {(
                [
                  {
                    href: "/admin/users",
                    labelKey: "admin_shell_nav_group_operations",
                    perm: ADMIN_PERM.USERS_READ,
                    hub: "operations",
                  },
                  {
                    href: "/admin/content",
                    labelKey: "admin_shell_nav_group_centers",
                    perm: ADMIN_PERM.CONTENT_READ,
                    hub: "content",
                  },
                  {
                    href: "/admin/finance-suite",
                    labelKey: "admin_shell_nav_finance_short",
                    perm: ADMIN_PERM.FINANCE_READ,
                    hub: "finance",
                  },
                ] as const
              )
                .filter(
                  (h) =>
                    !caps.permissionsLoaded ||
                    caps.capabilitiesUnavailable ||
                    caps.hasPermission(h.perm),
                )
                .map((h) => {
                  const onHub =
                    pathname === h.href || pathname.startsWith(`${h.href}/`);
                  return (
                    <Link
                      key={h.hub}
                      href={h.href}
                      className={`${touchTargetLink44Classes} font-medium ${ADMIN_MOTION_NAV_CLASS} ${adminShellTopNavLinkClass(onHub)} ${travelFocusRingOffset2Classes}`}
                      data-tt-admin-shell-top-hub={h.hub}
                      aria-current={onHub ? "page" : undefined}
                    >
                      {t(h.labelKey)}
                    </Link>
                  );
                })}
            </div>
          ) : null}

          <div
            className={`flex w-full flex-col gap-y-2 ${sidebarLayoutActive ? "lg:hidden" : ""}`}
            data-tt-admin-shell-top-nav-groups={sidebarLayoutActive ? "compact-lg" : "full"}
          >
          <p
            className="w-full text-meta text-ink-500 lg:hidden"
            data-tt-admin-shell-mobile-nav-hint="1"
          >
            {t("admin_shell_mobile_nav_hint")}
          </p>
          <details className="lg:contents" data-tt-admin-shell-mobile-nav-fold="1" open>
            <summary
              className={`${touchTargetLink44Classes} cursor-pointer list-none ${ADMIN_SHELL_META_CHIP_CLASS} marker:content-none lg:hidden ${travelFocusRingOffset2Classes}`}
            >
              {t("admin_shell_mobile_nav_summary")}
            </summary>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1 lg:contents">
          {ADMIN_SHELL_SIDEBAR_GROUPS.filter((group) => group.id !== "workspace").map((group) => {
            const navGroup = (
              <AdminShellNavGroup
                key={group.id}
                groupId={group.id}
                summaryKey={group.labelKey}
                pathname={pathname}
                links={adminShellTopNavLinksFromSidebarGroup(group)}
              />
            );
            if (
              adminShellTopNavGroupNeedsWholeFinanceGate({
                groupId: group.id,
                links: group.links,
              })
            ) {
              return (
                <AdminFinanceShellNavGroupGate key={group.id}>{navGroup}</AdminFinanceShellNavGroupGate>
              );
            }
            return navGroup;
          })}
          {caps.capabilitiesUnavailable
            ? ADMIN_SHELL_CAPABILITIES_FAILURE_EXTRA_LINKS.map((link) => {
                const base = link.href.split("?")[0] ?? link.href;
                const active = pathname === base || pathname.startsWith(`${base}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${touchTargetLink44Classes} font-medium ${ADMIN_MOTION_NAV_CLASS} ${adminShellTopNavLinkClass(active)} ${travelFocusRingOffset2Classes}`}
                    data-tt-admin-shell-top-failure-leaf={link.href}
                    aria-current={active ? "page" : undefined}
                  >
                    {t(link.labelKey)}
                  </Link>
                );
              })
            : null}
          </div>
          </details>

          </div>

        </nav>

        <div
          className="flex flex-wrap items-center gap-2 text-meta"
          data-tt-admin-shell-actor="1"
          data-tt-admin-shell-ops-chrome={workspaceOpsDemoted ? "quiet" : "default"}
        >

          {showCommandPaletteTrigger ? (
            <button
              type="button"
              onClick={() => requestAdminCommandPaletteOpen()}
              className={`${touchTargetLink44Classes} ${ADMIN_SHELL_META_CHIP_CLASS} ${travelFocusRingOffset2Classes}`}
              data-tt-admin-command-palette-trigger="1"
              title={t("admin_command_palette_trigger_title")}
            >
              {t("admin_command_palette_trigger_label")}
            </button>
          ) : null}

          {adminDeployEnvBadgeVisible(deployEnv, maintainerUi) && deployEnv ? (
            <span
              className={
                deployEnvQuiet
                  ? `rounded-full border border-white/12 bg-white/5 px-2 py-0.5 text-meta font-medium text-ink-500`
                  : `rounded-full border px-2 py-0.5 font-medium ${adminDeployEnvBadgeClass(deployEnv)}`
              }
              title={adminDeployEnvDisplayLabel(deployEnv, t)}
              data-tt-admin-shell-phase-badge="1"
              data-tt-admin-deploy-env={deployEnv}
              data-tt-admin-deploy-env-quiet={deployEnvQuiet ? "1" : undefined}
              data-tt-admin-deploy-env-chain={
                deployEnv === "staging" && process.env.NEXT_PUBLIC_CHAIN_ID === "11155111"
                  ? "sepolia"
                  : undefined
              }
            >
              {adminDeployEnvDisplayLabel(deployEnv, t)}
            </span>
          ) : null}

          {previewRole && showPreviewBadges ? (
            <>
              <span
                className={ADMIN_SHELL_PREVIEW_BADGE_CLASS}
                title={t("admin_shell_role_perspective_switcher_title")}
                data-tt-admin-shell-preview-active="1"
                data-tt-admin-shell-preview-role={previewRole}
              >
                {t("admin_shell_preview_role_badge", {
                  role: t(CONSOLE_ROLE_70_LABEL_KEYS[previewRole]),
                })}
              </span>
              {!actor.loading && actor.roleLabelKey ? (
                <span
                  className={ADMIN_SHELL_ACCOUNT_ROLE_BADGE_CLASS}
                  title={t("admin_shell_product_role_badge_title")}
                  data-tt-admin-shell-account-role="1"
                >
                  {t("admin_shell_account_role_badge", { role: t(actor.roleLabelKey) })}
                </span>
              ) : null}
            </>
          ) : previewRole ? (
            <span
              className="sr-only"
              data-tt-admin-shell-preview-deferred="1"
              data-tt-admin-shell-preview-role={previewRole}
            >
              {t("admin_shell_preview_role_badge", {
                role: t(CONSOLE_ROLE_70_LABEL_KEYS[previewRole]),
              })}
            </span>
          ) : !previewRole &&
            dbRole &&
            mode === "db" &&
            showPreviewBadges &&
            showDbRoleBadges ? (
            <span
              className={ADMIN_SHELL_DB_ROLE_BADGE_CLASS}
              title={t("admin_shell_product_role_badge_title")}
              data-tt-admin-shell-db-role-active="1"
              data-tt-admin-console-role-source={consoleRoleSource ?? undefined}
            >
              {t("admin_shell_product_role_badge", {
                role: t(CONSOLE_ROLE_70_LABEL_KEYS[dbRole]),
              })}
            </span>
          ) : showPreviewBadges && shellFilterRole && showDbRoleBadges ? (
            <span
              className={ADMIN_SHELL_DB_ROLE_BADGE_CLASS}
              data-tt-admin-shell-mapped-role="1"
            >
              {t("admin_shell_product_role_badge", {
                role: t(CONSOLE_ROLE_70_LABEL_KEYS[shellFilterRole]),
              })}
            </span>
          ) : showPreviewBadges &&
            !actor.loading &&
            actor.roleLabelKey &&
            showDbRoleBadges ? (
            <span className={ADMIN_SHELL_ACCOUNT_ROLE_BADGE_CLASS}>
              {t(actor.roleLabelKey)}
            </span>
          ) : null}

          {showRolePerspectiveSwitcher && !onPermissions ? (
            <div
              className="flex items-center gap-1"
              data-tt-admin-shell-role-perspective-operator={maintainerUi ? undefined : "1"}
              data-tt-admin-shell-db-role-suppressed="1"
            >
              <AdminShellBarRolePerspectiveSwitcher />
              <Link
                href="/admin/permissions#admin-console-role-effective"
                {...permissionsPrefetch}
                className={`${touchTargetLink44Classes} ${ADMIN_SHELL_META_CHIP_CLASS} ${travelFocusRingOffset2Classes}`}
                data-tt-admin-shell-role-perspective-link="1"
              >
                {t("admin_shell_role_perspective_link")}
              </Link>
            </div>
          ) : null}

        </div>

      </div>

    </header>

  );

}

