/** ① capabilities 不可用时 · 侧栏/顶栏最小安全链（首页 + 权限中心 + 操作手册）。 */
export const ADMIN_SHELL_CAPABILITIES_FAILURE_HREFS = [
  "/admin",
  "/admin/permissions",
  "/admin/operator-guide",
] as const;

export type AdminShellCapabilitiesFailureHref = (typeof ADMIN_SHELL_CAPABILITIES_FAILURE_HREFS)[number];

/**
 * Top-nav / sidebar inject when capabilities fetch fails.
 * Must stay exported — AdminShellBar/Sidebar call `.map` on this (tip hole if missing).
 */
export const ADMIN_SHELL_CAPABILITIES_FAILURE_EXTRA_LINKS: readonly {
  href: AdminShellCapabilitiesFailureHref;
  labelKey: string;
}[] = [
  { href: "/admin/permissions", labelKey: "admin_shell_nav_permissions" },
  { href: "/admin/operator-guide", labelKey: "admin_operator_guide_title" },
] as const;

export function adminShellLinkAllowedWhenCapabilitiesUnavailable(href: string): boolean {
  const base = href.split("?")[0] ?? href;
  return (ADMIN_SHELL_CAPABILITIES_FAILURE_HREFS as readonly string[]).includes(base);
}

export function filterAdminShellLinksForCapabilitiesFailure<
  T extends { href: string },
>(links: readonly T[]): T[] {
  return links.filter((link) => adminShellLinkAllowedWhenCapabilitiesUnavailable(link.href));
}
