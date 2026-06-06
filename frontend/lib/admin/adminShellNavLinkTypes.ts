import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";

/** 侧栏 / 顶栏分组导航 SSOT 链定义。 */
export type AdminShellNavLinkDef = {
  href: string;
  labelKey: string;
  permission?: AdminPermissionId;
  /** 枢纽根路径不与子路径前缀共激活 */
  activeExact?: boolean;
  /** 顶栏 active 匹配前缀（默认 pathname 前缀） */
  matchPrefix?: string;
};

export function adminShellNavLinkMatch(link: AdminShellNavLinkDef): (pathname: string) => boolean {
  const base = link.href.split("?")[0] ?? link.href;
  if (link.matchPrefix) {
    const prefix = link.matchPrefix;
    return (pathname) => pathname === prefix || pathname.startsWith(`${prefix}/`);
  }
  if (link.activeExact) {
    return (pathname) => pathname === base || pathname === `${base}/`;
  }
  return (pathname) => pathname === base || pathname.startsWith(`${base}/`);
}

export function dedupeAdminShellNavLinks(links: readonly AdminShellNavLinkDef[]): AdminShellNavLinkDef[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = link.href.split("?")[0] ?? link.href;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
