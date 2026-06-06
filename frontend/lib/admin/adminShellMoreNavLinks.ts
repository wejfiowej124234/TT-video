import {
  CONFIG_HUB_LINKS,
  CONFIG_PLATFORM_SUBNAV_LINKS,
} from "@/app/admin/config/adminConfigHubPageModel";
import { ADMIN_PERM } from "@/lib/admin/adminPermissionIds";
import {
  dedupeAdminShellNavLinks,
  type AdminShellNavLinkDef,
} from "@/lib/admin/adminShellNavLinkTypes";

/** ① SSOT：顶栏「更多」与侧栏 `more` 组（平台/审计/合规枢纽 + 配置子页并集）。 */
export type AdminShellMoreNavLink = AdminShellNavLinkDef;

const MORE_CORE: AdminShellNavLinkDef[] = [
  {
    href: "/admin/observability",
    labelKey: "admin_observability_title",
    permission: ADMIN_PERM.READ,
    matchPrefix: "/admin/observability",
  },
  {
    href: "/admin/audit",
    labelKey: "admin_audit_list_title",
    permission: ADMIN_PERM.READ,
    matchPrefix: "/admin/audit",
  },
  {
    href: "/admin/auth-audit-events",
    labelKey: "admin_auth_audit_events_title",
    permission: ADMIN_PERM.READ,
    matchPrefix: "/admin/auth-audit-events",
  },
  {
    href: "/admin/config",
    labelKey: "admin_config_hub_title",
    permission: ADMIN_PERM.PLATFORM_READ,
    activeExact: true,
    matchPrefix: "/admin/config",
  },
  ...CONFIG_HUB_LINKS.map(({ href, titleKey }) => ({
    href,
    labelKey: titleKey,
    matchPrefix: href,
  })),
  ...CONFIG_PLATFORM_SUBNAV_LINKS.map(({ href, labelKey }) => ({
    href,
    labelKey,
    matchPrefix: href,
  })),
  {
    href: "/admin/compliance",
    labelKey: "admin_shell_nav_compliance",
    permission: ADMIN_PERM.READ,
    activeExact: true,
    matchPrefix: "/admin/compliance",
  },
  {
    href: "/admin/compliance/requests",
    labelKey: "admin_compliance_hub_dsar_list",
    permission: ADMIN_PERM.READ,
    matchPrefix: "/admin/compliance/requests",
  },
  {
    href: "/admin/permissions",
    labelKey: "admin_permissions_title",
    permission: ADMIN_PERM.READ,
    matchPrefix: "/admin/permissions",
  },
];

export const ADMIN_SHELL_MORE_NAV_LINKS: readonly AdminShellMoreNavLink[] = dedupeAdminShellNavLinks(
  MORE_CORE,
);
