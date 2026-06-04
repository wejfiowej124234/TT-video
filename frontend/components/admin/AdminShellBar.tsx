"use client";

import type { ReactNode } from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import { useTranslation } from "@/components/LocaleProvider";

import { AdminShellNavGroup, type AdminShellNavLink } from "@/components/admin/AdminShellNavGroup";

import { ADMIN_SHELL_COMMUNITY_EXTRA_LINKS } from "@/lib/admin/adminShellCommunityNav";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { admU01ShellGroupVisible } from "@/lib/admin/admU01ShellGroupVisibility";
import { adminHomeCardRequiredPermission } from "@/lib/admin/adminHomeCardPermission";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import { CONSOLE_ROLE_70_LABEL_KEYS } from "@/lib/admin/adminRole70Matrix";
import { useAdminCapabilities } from "@/lib/admin/useAdminCapabilities";
import { useAdminShellActor } from "@/lib/admin/useAdminShellActor";
import {
  adminDeployEnvBadgeClass,
  adminDeployEnvLabelKey,
  resolveAdminDeployEnv,
} from "@/lib/admin/adminDeployEnvBadge";
import { useAdminEffectiveShellRole } from "@/lib/admin/useAdminEffectiveShellRole";
import { isAdminMaintainerUi } from "@/lib/admin/adminMaintainerUiMode";
import { AdminShellBarRolePerspectiveSwitcher } from "@/components/admin/AdminShellBarRolePerspectiveSwitcher";
import { AdminShellPendingBadge } from "@/components/admin/AdminShellPendingBadge";
import { requestAdminCommandPaletteOpen } from "@/lib/admin/adminCommandPaletteBus";
import { adminShellNavPendingCount } from "@/lib/admin/adminShellInboxNavBadge";
import { useAdminShellSidebarVisible } from "@/lib/admin/useAdminShellSidebarVisible";
import { useAdminHomeInbox } from "@/lib/admin/useAdminHomeInbox";

function shellNav(
  href: string,
  labelKey: string,
  match?: AdminShellNavLink["match"],
): AdminShellNavLink {
  const base = href.split("?")[0] ?? href;
  return {
    href,
    labelKey,
    match,
    permission: base.startsWith("/admin") ? adminHomeCardRequiredPermission(base) : undefined,
  };
}

import { adminShellTopNavLinkClass, ADMIN_MOTION_NAV_CLASS } from "@/lib/adminUi";
import { touchTargetLink44Classes, travelFocusRingOffset2Classes } from "@/lib/travelLinkFocus";

/** 资金域整组须 `admin.finance.read`（避免仅 `admin.read` 的 indexer 链误显 CS/Risk 资金组）。 */
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
  const showRolePerspectiveSwitcher =
    caps.permissionsLoaded &&
    !caps.capabilitiesUnavailable &&
    caps.hasPermission(ADMIN_PERM.READ);

  const onWorkspace = pathname === "/admin";
  const onInbox = pathname === "/admin/inbox";
  const deployEnv = resolveAdminDeployEnv();

  const onFinanceReconciliation =

    pathname === "/admin/finance-reconciliation" ||

    pathname.startsWith("/admin/finance-reconciliation/");

  const onFinance = pathname === "/admin/finance" || pathname.startsWith("/admin/finance/");

  const onObservability = pathname === "/admin/observability";

  const onCrossCheck = pathname === "/admin/cross-check";

  const onDriftSummary = pathname === "/admin/drift-summary";

  const onUsers = pathname === "/admin/users" || pathname.startsWith("/admin/users/");

  const onOrders = pathname === "/admin/orders" || pathname.startsWith("/admin/orders/");

  const onDisputes = pathname === "/admin/disputes" || pathname.startsWith("/admin/disputes/");

  const onGuides = pathname === "/admin/guides" || pathname.startsWith("/admin/guides/");

  const onReviews = pathname === "/admin/reviews" || pathname.startsWith("/admin/reviews/");

  const onAudit = pathname === "/admin/audit" || pathname.startsWith("/admin/audit/");

  const onIndexer = pathname === "/admin/indexer" || pathname.startsWith("/admin/indexer/");

  const onConfig = pathname === "/admin/config" || pathname.startsWith("/admin/config/");

  const onOnboardingHub = pathname === "/admin/onboarding" || pathname.startsWith("/admin/onboarding/");

  const onCommunityReports =
    pathname === "/admin/community/reports" || pathname.startsWith("/admin/community/");

  const onPermissions = pathname === "/admin/permissions";

  const onFinanceSuite =
    pathname === "/admin/finance-suite" || pathname.startsWith("/admin/finance-suite/");

  const onCompliance =
    pathname === "/admin/compliance" || pathname.startsWith("/admin/compliance/");

  const onRegionVault = pathname === "/admin/region-vault";

  const inbox = useAdminHomeInbox();
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

  return (

    <header

      className="sticky top-0 z-50 border-b border-ink-200 bg-bg-console/95 backdrop-blur-sm supports-[backdrop-filter]:bg-bg-console/80"

      data-tt-admin-shell-bar="1"

    >

      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">

        <nav

          className="relative -mx-4 flex max-w-full items-center gap-x-3 gap-y-2 overflow-x-auto px-4 pb-1 text-small scroll-smooth sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible"

          aria-label={t("admin_shell_bar_aria")}

          data-tt-admin-shell-nav-scroll="1"

        >

          <Link

            href="/admin"

            className={`${touchTargetLink44Classes} font-medium ${ADMIN_MOTION_NAV_CLASS} ${adminShellTopNavLinkClass(onWorkspace)} ${travelFocusRingOffset2Classes}`}

            aria-current={onWorkspace ? "page" : undefined}

          >

            {t("admin_shell_nav_workspace")}

          </Link>

          <Link
            href="/admin/inbox"
            className={`${touchTargetLink44Classes} inline-flex items-center gap-2 font-medium ${ADMIN_MOTION_NAV_CLASS} ${adminShellTopNavLinkClass(onInbox)} ${travelFocusRingOffset2Classes}`}
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
              />
            ) : null}
          </Link>

          <div
            className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${sidebarLayoutActive ? "lg:hidden" : ""}`}
            data-tt-admin-shell-top-nav-groups={sidebarLayoutActive ? "compact-lg" : "full"}
          >
          <AdminShellNavGroup

            groupId="onboarding"

            summaryKey="admin_shell_nav_group_onboarding"

            pathname={pathname}

            links={[
              shellNav(ADMIN_INBOX_QUEUE_HREFS.provider, "admin_shell_nav_provider_queue"),
              shellNav(ADMIN_INBOX_QUEUE_HREFS.steward, "admin_shell_nav_steward_queue"),
              shellNav(ADMIN_INBOX_QUEUE_HREFS.approvals, "admin_shell_nav_approvals_queue"),
              shellNav("/admin/onboarding", "admin_onboarding_hub_title", () => onOnboardingHub),
            ]}

          />



          <AdminShellNavGroup

            groupId="operations"

            summaryKey="admin_shell_nav_group_operations"

            pathname={pathname}

            links={[
              shellNav("/admin/users", "admin_users_title", () => onUsers),
              shellNav("/admin/orders", "admin_orders_title", () => onOrders),
              shellNav("/admin/disputes", "admin_disputes_title", () => onDisputes),
              shellNav("/admin/guides", "admin_guides_title", () => onGuides),
              shellNav("/admin/reviews", "admin_reviews_title", () => onReviews),
            ]}

          />



          <AdminShellNavGroup

            groupId="community"

            summaryKey="admin_shell_nav_group_community"

            pathname={pathname}

            links={[
              shellNav(
                ADMIN_INBOX_QUEUE_HREFS.reports,
                "admin_community_reports_title",
                () => onCommunityReports,
              ),
              shellNav("/admin/community/appeals", "admin_appeals_title"),
              shellNav("/admin/community/penalties", "admin_penalties_title"),
              shellNav(
                "/admin/community/moderation/cases",
                "admin_shell_nav_mod_cases",
                (p) => p.startsWith("/admin/community/moderation"),
              ),
              shellNav(
                "/admin/community/risk-signals",
                "admin_shell_nav_risk_signals",
                (p) => p.startsWith("/admin/community/risk-signals"),
              ),
              ...ADMIN_SHELL_COMMUNITY_EXTRA_LINKS.map(({ href, labelKey, matchPrefix }) =>
                shellNav(href, labelKey, (p) => p.startsWith(matchPrefix)),
              ),
            ]}

          />



          <AdminFinanceShellNavGroupGate>
            <AdminShellNavGroup
              groupId="finance"
              summaryKey="admin_shell_nav_group_finance"
              pathname={pathname}
              links={[
                shellNav(
                  "/admin/finance-reconciliation",
                  "admin_shell_nav_finance_reconciliation",
                  () => onFinanceReconciliation,
                ),
                shellNav("/admin/finance", "admin_finance_title", () => onFinance),
                shellNav("/admin/fee-router", "admin_fee_router_title"),
                shellNav("/admin/indexer", "admin_indexer_title", () => onIndexer),
                shellNav("/admin/finance-suite", "admin_shell_nav_finance_suite", () => onFinanceSuite),
                shellNav("/admin/region-vault", "admin_region_vault_title", () => onRegionVault),
              ]}
            />
          </AdminFinanceShellNavGroupGate>



          <AdminShellNavGroup

            groupId="governance"

            summaryKey="admin_shell_nav_group_governance"

            pathname={pathname}

            links={[
              shellNav("/admin/cross-check", "admin_shell_nav_cross_check", () => onCrossCheck),
              shellNav("/admin/drift-summary", "admin_shell_nav_drift_summary", () => onDriftSummary),
              shellNav(
                "/admin/trust-growth",
                "admin_shell_nav_trust_growth",
                (p) => p === "/admin/trust-growth" || p.startsWith("/admin/trust-growth/"),
              ),
            ]}

          />



          <AdminShellNavGroup

            groupId="more"

            summaryKey="admin_shell_nav_group_more"

            pathname={pathname}

            links={[
              shellNav("/admin/observability", "admin_observability_title", () => onObservability),
              shellNav("/admin/audit", "admin_audit_list_title", () => onAudit),
              shellNav("/admin/auth-audit-events", "admin_auth_audit_events_title"),
              shellNav("/admin/config", "admin_config_hub_title", () => onConfig),
              shellNav("/admin/compliance", "admin_shell_nav_compliance", () => onCompliance),
              shellNav("/", "admin_shell_nav_site"),
            ]}

          />

          </div>

        </nav>

        <div className="flex flex-wrap items-center gap-2 text-meta" data-tt-admin-shell-actor="1">

          {caps.permissionsLoaded && !caps.capabilitiesUnavailable ? (
            <button
              type="button"
              onClick={() => requestAdminCommandPaletteOpen()}
              className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] border border-ink-200 bg-white px-2.5 py-0.5 text-meta font-medium text-ink-700 hover:border-ink-300 ${travelFocusRingOffset2Classes}`}
              data-tt-admin-command-palette-trigger="1"
              title={t("admin_command_palette_trigger_title")}
            >
              {t("admin_command_palette_trigger_label")}
            </button>
          ) : null}

          {deployEnv && (maintainerUi || deployEnv !== "local") ? (
            <span
              className={`rounded-full border px-2 py-0.5 font-medium ${adminDeployEnvBadgeClass(deployEnv)}`}
              title={t(adminDeployEnvLabelKey(deployEnv))}
              data-tt-admin-shell-phase-badge="1"
              data-tt-admin-deploy-env={deployEnv}
            >
              {t(adminDeployEnvLabelKey(deployEnv))}
            </span>
          ) : null}

          {!previewRole && dbRole && mode === "db" ? (
            <span
              className="rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 font-medium text-ink-800"
              title={t("admin_shell_product_role_badge_title")}
              data-tt-admin-shell-db-role-active="1"
              data-tt-admin-console-role-source={consoleRoleSource ?? undefined}
            >
              {t("admin_shell_product_role_badge", {
                role: t(CONSOLE_ROLE_70_LABEL_KEYS[dbRole]),
              })}
            </span>
          ) : shellFilterRole ? (
            <span
              className="rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 font-medium text-ink-800"
              data-tt-admin-shell-mapped-role="1"
            >
              {t("admin_shell_product_role_badge", {
                role: t(CONSOLE_ROLE_70_LABEL_KEYS[shellFilterRole]),
              })}
            </span>
          ) : !actor.loading && actor.roleLabelKey ? (
            <span className="rounded-full border border-ink-200 bg-ink-50 px-2 py-0.5 font-medium text-ink-800">
              {t(actor.roleLabelKey)}
            </span>
          ) : null}

          {showRolePerspectiveSwitcher && !onPermissions ? (
            <div
              className="flex items-center gap-1"
              data-tt-admin-shell-role-perspective-operator={maintainerUi ? undefined : "1"}
            >
              <AdminShellBarRolePerspectiveSwitcher />
              <Link
                href="/admin/permissions#admin-console-role-effective"
                className={`${touchTargetLink44Classes} rounded-[var(--radius-md)] border border-ink-200 bg-white px-2 py-0.5 text-meta font-medium text-ink-700 hover:border-ink-300 ${travelFocusRingOffset2Classes}`}
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

