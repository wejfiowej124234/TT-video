/** ① capabilities 不可用时 · 侧栏/顶栏最小安全链（首页 + 权限中心 + 操作手册）。 */
export const ADMIN_SHELL_CAPABILITIES_FAILURE_HREFS = [
  "/admin",
  "/admin/permissions",
  "/admin/operator-guide",
] as const;

export type AdminShellCapabilitiesFailureHref = (typeof ADMIN_SHELL_CAPABILITIES_FAILURE_HREFS)[number];

export function adminShellLinkAllowedWhenCapabilitiesUnavailable(href: string): boolean {
  const base = href.split("?")[0] ?? href;
  return (ADMIN_SHELL_CAPABILITIES_FAILURE_HREFS as readonly string[]).includes(base);
}

export function filterAdminShellLinksForCapabilitiesFailure<
  T extends { href: string },
>(links: readonly T[]): T[] {
  return links.filter((link) => adminShellLinkAllowedWhenCapabilitiesUnavailable(link.href));
}
