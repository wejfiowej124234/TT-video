/**
 * Batch-9 B9-U8 · 侧栏 = 唯一常驻目录；工作台不再铺枢纽卡墙。
 * 命令板 / 搜索从侧栏叶派生（不删能力）。
 */
import { ADMIN_SHELL_SIDEBAR_GROUPS } from "@/lib/admin/adminShellSidebarModel";
import type { AdminPermissionId } from "@/lib/admin/adminPermissionIds";

export type AdminSidebarNavEntry = {
  href: string;
  titleKey: string;
  sectionKey: string;
  permission?: AdminPermissionId;
};

export function adminShellSidebarNavEntries(
  groups: typeof ADMIN_SHELL_SIDEBAR_GROUPS = ADMIN_SHELL_SIDEBAR_GROUPS,
): AdminSidebarNavEntry[] {
  const out: AdminSidebarNavEntry[] = [];
  for (const g of groups) {
    for (const link of g.links) {
      out.push({
        href: link.href,
        titleKey: link.labelKey,
        sectionKey: g.labelKey,
        permission: link.permission,
      });
    }
  }
  return out;
}

export function filterAdminShellSidebarNavEntries(
  entries: readonly AdminSidebarNavEntry[],
  hasPermission: (perm: string) => boolean,
  permissionsLoaded: boolean,
): AdminSidebarNavEntry[] {
  if (!permissionsLoaded) return [...entries];
  return entries.filter((e) => !e.permission || hasPermission(e.permission));
}
