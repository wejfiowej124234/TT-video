import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";

import type { AdmU01ShellGroupId } from "@/lib/admin/admU01ShellGroupVisibility";

import { ADMIN_SHELL_COMMUNITY_NAV_LINKS } from "@/lib/admin/adminShellCommunityNavLinks";
import { ADMIN_SHELL_CONTENT_NAV_LINKS } from "@/lib/admin/adminShellContentNavLinks";
import { ADMIN_SHELL_FINANCE_NAV_LINKS } from "@/lib/admin/adminShellFinanceNavLinks";
import { ADMIN_SHELL_GOVERNANCE_NAV_LINKS } from "@/lib/admin/adminShellGovernanceNavLinks";
import { ADMIN_SHELL_GROWTH_NAV_LINKS } from "@/lib/admin/adminShellGrowthNavLinks";
import { ADMIN_SHELL_MORE_NAV_LINKS } from "@/lib/admin/adminShellMoreNavLinks";
import { ADMIN_SHELL_ONBOARDING_NAV_LINKS } from "@/lib/admin/adminShellOnboardingNavLinks";
import { ADMIN_SHELL_OFFICIAL_OPS_NAV_LINKS } from "@/lib/admin/adminShellOfficialOpsNavLinks";
import { ADMIN_SHELL_OPERATIONS_NAV_LINKS } from "@/lib/admin/adminShellOperationsNavLinks";



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



/** 与顶栏 Shell 同序 · 侧栏持久导航（U2 ① · Batch 25 社区深度对齐）。 */

export const ADMIN_SHELL_SIDEBAR_GROUPS: AdminShellSidebarGroup[] = [

  {

    id: "workspace",

    labelKey: "admin_shell_sidebar_hub_group",

    links: [

      { href: "/admin", labelKey: "admin_shell_nav_workspace" },

      { href: "/admin/inbox", labelKey: "admin_unified_inbox_nav_short" },

      { href: "/admin/operator-guide", labelKey: "admin_operator_guide_title" },

    ],

  },

  {

    id: "onboarding",

    labelKey: "admin_shell_nav_group_onboarding",

    links: ADMIN_SHELL_ONBOARDING_NAV_LINKS.map(({ href, labelKey, permission, activeExact }) => ({
      href,
      labelKey,
      permission,
      activeExact,
    })),

  },

  {

    id: "operations",

    labelKey: "admin_shell_nav_group_operations",

    links: ADMIN_SHELL_OPERATIONS_NAV_LINKS.map(({ href, labelKey, permission, activeExact }) => ({
      href,
      labelKey,
      permission,
      activeExact,
    })),

  },

  {

    id: "content",

    labelKey: "admin_shell_nav_group_content",

    links: ADMIN_SHELL_CONTENT_NAV_LINKS.map(({ href, labelKey, permission, activeExact }) => ({
      href,
      labelKey,
      permission,
      activeExact,
    })),

  },

  {

    id: "official_ops",

    labelKey: "admin_shell_nav_group_official_ops",

    links: ADMIN_SHELL_OFFICIAL_OPS_NAV_LINKS.map(({ href, labelKey, permission, activeExact }) => ({
      href,
      labelKey,
      permission,
      activeExact,
    })),

  },

  {

    id: "growth",

    labelKey: "admin_shell_nav_group_growth",

    links: ADMIN_SHELL_GROWTH_NAV_LINKS.map(({ href, labelKey, permission, activeExact }) => ({
      href,
      labelKey,
      permission,
      activeExact,
    })),

  },

  {

    id: "community",

    labelKey: "admin_shell_nav_group_community",

    links: ADMIN_SHELL_COMMUNITY_NAV_LINKS.map(({ href, labelKey, permission, activeExact }) => ({
      href,
      labelKey,
      permission,
      activeExact,
    })),

  },

  {

    id: "finance",

    labelKey: "admin_shell_nav_group_finance",

    links: ADMIN_SHELL_FINANCE_NAV_LINKS.map(({ href, labelKey, permission, activeExact }) => ({
      href,
      labelKey,
      permission,
      activeExact,
    })),

  },

  {

    id: "governance",

    labelKey: "admin_shell_nav_group_governance",

    links: ADMIN_SHELL_GOVERNANCE_NAV_LINKS.map(({ href, labelKey, permission, activeExact }) => ({
      href,
      labelKey,
      permission,
      activeExact,
    })),

  },

  {

    id: "more",

    labelKey: "admin_shell_nav_group_more",

    links: ADMIN_SHELL_MORE_NAV_LINKS.map(({ href, labelKey, permission, activeExact }) => ({
      href,
      labelKey,
      permission,
      activeExact,
    })),

  },

];

