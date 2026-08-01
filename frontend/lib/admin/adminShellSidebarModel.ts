import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import type { AdmU01ShellGroupId } from "@/lib/admin/admU01ShellGroupVisibility";

export type AdminShellSidebarLink = {
  href: string;
  labelKey: string;
  permission?: AdminPermissionId;
  activeExact?: boolean;
};

export type AdminShellSidebarGroup = {
  id: AdmU01ShellGroupId | "workspace";
  labelKey: string;
  links: AdminShellSidebarLink[];
};

/**
 * Inbox Focus Product Baseline · Staging Runtime SSOT (publish IA).
 * 5 groups · ≤12 leaves — not the legacy 10-group deep nav dump.
 */
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
    id: "operations",
    labelKey: "admin_shell_nav_group_operations",
    links: [
      {
        href: "/admin/users",
        labelKey: "admin_shell_nav_users_short",
        permission: ADMIN_PERM.USERS_READ,
      },
      {
        href: "/admin/guides",
        labelKey: "admin_shell_nav_guides_short",
        permission: ADMIN_PERM.USERS_READ,
      },
      {
        href: "/admin/orders",
        labelKey: "admin_shell_nav_orders_short",
        permission: ADMIN_PERM.ORDERS_READ,
      },
      {
        href: "/admin/disputes",
        labelKey: "admin_shell_nav_disputes_short",
        permission: ADMIN_PERM.ORDERS_READ,
      },
    ],
  },
  {
    id: "onboarding",
    labelKey: "admin_shell_nav_group_onboarding",
    links: [
      {
        href: "/admin/onboarding",
        labelKey: "admin_shell_nav_onboarding_short",
        permission: ADMIN_PERM.ONBOARDING_READ,
        activeExact: true,
      },
    ],
  },
  {
    id: "content",
    labelKey: "admin_shell_nav_group_centers",
    links: [
      {
        href: "/admin/content",
        labelKey: "admin_shell_nav_content_short",
        permission: ADMIN_PERM.CONTENT_READ,
        activeExact: true,
      },
      {
        href: "/admin/official",
        labelKey: "admin_shell_nav_official_short",
        permission: ADMIN_PERM.OFFICIAL_READ,
        activeExact: true,
      },
      {
        href: "/admin/growth",
        labelKey: "admin_shell_nav_growth_short",
        permission: ADMIN_PERM.GROWTH_READ,
        activeExact: true,
      },
    ],
  },
  {
    id: "more",
    labelKey: "admin_shell_nav_group_platform",
    links: [
      {
        href: "/admin/finance-suite",
        labelKey: "admin_shell_nav_finance_short",
        permission: ADMIN_PERM.FINANCE_READ,
        activeExact: true,
      },
      {
        href: "/admin/config",
        labelKey: "admin_shell_nav_settings_short",
        permission: ADMIN_PERM.PLATFORM_READ,
        activeExact: true,
      },
    ],
  },
];

/** Publish IA · max leaves in persistent shell sidebar (Batch-12). */
export const ADMIN_SHELL_SIDEBAR_PUBLISH_MAX_LEAVES = 12;

export function adminShellSidebarGroupCount(): number {
  return ADMIN_SHELL_SIDEBAR_GROUPS.length;
}

export function adminShellSidebarLeafCount(): number {
  return ADMIN_SHELL_SIDEBAR_GROUPS.reduce((n, g) => n + g.links.length, 0);
}
