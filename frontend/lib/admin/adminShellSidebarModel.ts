import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";
import type { AdmU01ShellGroupId } from "@/lib/admin/admU01ShellGroupVisibility";
import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { ADMIN_SHELL_COMMUNITY_EXTRA_LINKS } from "@/lib/admin/adminShellCommunityNav";

export type AdminShellSidebarLink = {
  href: string;
  labelKey: string;
  permission?: AdminPermissionId;
};

export type AdminShellSidebarGroup = {
  id: AdmU01ShellGroupId | "workspace";
  labelKey: string;
  links: AdminShellSidebarLink[];
};

/** 与顶栏 Shell 同序 · 侧栏持久导航（U2 ① · Batch 25 社区深度对齐）。 */
export const ADMIN_SHELL_SIDEBAR_GROUPS: AdminShellSidebarGroup[] = [
  {
    id: "workspace",
    labelKey: "admin_shell_sidebar_hub_group",
    links: [
      { href: "/admin", labelKey: "admin_shell_nav_workspace" },
      { href: "/admin/inbox", labelKey: "admin_unified_inbox_nav_short" },
    ],
  },
  {
    id: "onboarding",
    labelKey: "admin_shell_nav_group_onboarding",
    links: [
      { href: ADMIN_INBOX_QUEUE_HREFS.provider, labelKey: "admin_shell_nav_provider_queue" },
      { href: ADMIN_INBOX_QUEUE_HREFS.steward, labelKey: "admin_shell_nav_steward_queue" },
      { href: ADMIN_INBOX_QUEUE_HREFS.approvals, labelKey: "admin_shell_nav_approvals_queue" },
      { href: "/admin/onboarding", labelKey: "admin_onboarding_hub_title" },
    ],
  },
  {
    id: "operations",
    labelKey: "admin_shell_nav_group_operations",
    links: [
      { href: "/admin/users", labelKey: "admin_users_title" },
      { href: "/admin/orders", labelKey: "admin_orders_title" },
      { href: "/admin/disputes", labelKey: "admin_disputes_title" },
      { href: "/admin/guides", labelKey: "admin_guides_title" },
      { href: "/admin/reviews", labelKey: "admin_reviews_title" },
    ],
  },
  {
    id: "community",
    labelKey: "admin_shell_nav_group_community",
    links: [
      { href: ADMIN_INBOX_QUEUE_HREFS.reports, labelKey: "admin_shell_nav_community_hub" },
      { href: "/admin/community/penalties", labelKey: "admin_penalties_title" },
      { href: "/admin/community/appeals", labelKey: "admin_appeals_title" },
      { href: "/admin/community/moderation/cases", labelKey: "admin_shell_nav_mod_cases" },
      { href: "/admin/community/risk-signals", labelKey: "admin_shell_nav_risk_signals" },
      ...ADMIN_SHELL_COMMUNITY_EXTRA_LINKS.map(({ href, labelKey }) => ({ href, labelKey })),
    ],
  },
  {
    id: "finance",
    labelKey: "admin_shell_nav_group_finance",
    links: [
      { href: "/admin/finance-suite", labelKey: "admin_shell_nav_finance_suite" },
      { href: "/admin/finance-reconciliation", labelKey: "admin_shell_nav_finance_reconciliation" },
    ],
  },
  {
    id: "governance",
    labelKey: "admin_shell_nav_group_governance",
    links: [
      { href: "/admin/cross-check", labelKey: "admin_shell_nav_cross_check" },
      { href: "/admin/drift-summary", labelKey: "admin_shell_nav_drift_summary" },
    ],
  },
  {
    id: "more",
    labelKey: "admin_shell_nav_group_more",
    links: [
      { href: "/admin/audit", labelKey: "admin_audit_list_title" },
      { href: "/admin/permissions", labelKey: "admin_permissions_title" },
    ],
  },
];
