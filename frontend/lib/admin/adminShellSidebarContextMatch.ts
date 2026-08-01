import type { AdminShellContext } from "@/lib/admin/adminShellContextForPath";

/**
 * Batch-11 HU-311 · 侧栏组 id ↔ pathname 域上下文同源。
 * 侧栏「内容与增长」合组承载 content / official / growth；「平台」承载 finance / settings。
 */
export function adminShellSidebarGroupMatchesContext(
  sidebarGroupId: string,
  ctx: AdminShellContext | null | undefined,
): boolean {
  if (!ctx) return false;
  const id = ctx.groupId;
  if (sidebarGroupId === id) return true;
  if (sidebarGroupId === "content") {
    return id === "content" || id === "official_ops" || id === "growth";
  }
  if (sidebarGroupId === "more") {
    return id === "more" || id === "finance" || id === "governance";
  }
  if (sidebarGroupId === "workspace") {
    return id === "workspace";
  }
  if (sidebarGroupId === "onboarding") {
    return id === "onboarding";
  }
  if (sidebarGroupId === "operations") {
    return id === "operations";
  }
  return false;
}
