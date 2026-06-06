import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { ADMIN_SHELL_SIDEBAR_GROUPS } from "@/lib/admin/adminShellSidebarModel";

function dedupeAdminPrefetchHrefs(hrefs: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const href of hrefs) {
    const key = href.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

/** 侧栏 SSOT 全量 href（顶栏各组同源）。 */
export function collectAdminShellNavPrefetchHrefs(): string[] {
  return dedupeAdminPrefetchHrefs(
    ADMIN_SHELL_SIDEBAR_GROUPS.flatMap((group) => group.links.map((link) => link.href)),
  );
}

/** ① Admin 空闲预取 · 工作台 + 四队列 + 常用枢纽（pathname 含 query 时与侧栏 href 对拍）。 */
export const ADMIN_ROUTE_PREFETCH_PRIMARY: readonly string[] = [
  "/admin",
  "/admin/inbox",
  ADMIN_INBOX_QUEUE_HREFS.provider,
  ADMIN_INBOX_QUEUE_HREFS.steward,
  ADMIN_INBOX_QUEUE_HREFS.approvals,
  ADMIN_INBOX_QUEUE_HREFS.reports,
] as const;

/** 次优先：经营 + 资金枢纽 + 观测（首屏后 idle 第二批）。 */
export const ADMIN_ROUTE_PREFETCH_SECONDARY: readonly string[] = [
  "/admin/onboarding",
  "/admin/orders",
  "/admin/disputes",
  "/admin/users",
  "/admin/guides",
  "/admin/reviews",
  "/admin/finance-suite",
  "/admin/finance",
  "/admin/observability",
  "/admin/config",
  "/admin/compliance",
] as const;

/** 侧栏全量 − 已列入 primary/secondary 的剩余路径（第三批 stagger）。 */
export function adminRoutePrefetchTertiaryHrefs(): string[] {
  const skip = new Set<string>([...ADMIN_ROUTE_PREFETCH_PRIMARY, ...ADMIN_ROUTE_PREFETCH_SECONDARY]);
  return collectAdminShellNavPrefetchHrefs().filter((href) => !skip.has(href));
}

export const ADMIN_ROUTE_PREFETCH_DEV_WARM: readonly string[] = collectAdminShellNavPrefetchHrefs();
