/** ① 平台枢纽页顶栏交叉导航 SSOT（配置 / 合规 / 可观测 / 审计 / 收件箱 / 工作台）。 */
export type AdminPlatformHubHeaderLink = {
  href: string;
  labelKey: string;
};

export const ADMIN_PLATFORM_HUB_HEADER_LINKS: readonly AdminPlatformHubHeaderLink[] = [
  { href: "/admin/inbox", labelKey: "admin_unified_inbox_nav_short" },
  { href: "/admin/observability", labelKey: "admin_observability_title" },
  { href: "/admin/audit", labelKey: "admin_audit_list_title" },
  { href: "/admin/config", labelKey: "admin_config_hub_title" },
  { href: "/admin/compliance", labelKey: "admin_shell_nav_compliance" },
  { href: "/admin", labelKey: "admin_shell_nav_workspace" },
] as const;
