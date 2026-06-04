import { adminShellNavPendingCount } from "@/lib/admin/adminShellInboxNavBadge";
import type { AdminHomeInboxChannels, AdminHomeInboxCounts } from "@/lib/admin/useAdminHomeInbox";

/** 顶栏 hub / 顶栏下拉 / 侧栏 hub / 侧栏队列叶 — 徽标降噪 SSOT。 */
export type AdminShellPendingBadgePlacement =
  | "top_inbox_hub"
  | "top_nav_dropdown"
  | "sidebar_inbox_hub"
  | "sidebar_queue_leaf";

/**
 * ① L5 · 同一待办数字不在顶栏 hub + 侧栏叶 + 下拉同时堆叠。
 * - 顶栏「收件箱」：始终显示四通道合计。
 * - lg+ 侧栏可见：叶节点显示分队列；侧栏 inbox 不重复合计；顶栏下拉不显示数字。
 * - 窄屏无侧栏：顶栏下拉叶节点显示分队列；分组 summary 显示 rollup。
 */
export function adminShellPendingBadgeVisible(input: {
  placement: AdminShellPendingBadgePlacement;
  sidebarLayoutActive: boolean;
  count: number | null;
}): boolean {
  const { placement, sidebarLayoutActive, count } = input;
  if (count === null || count <= 0) return false;
  switch (placement) {
    case "top_inbox_hub":
      return true;
    case "top_nav_dropdown":
      return !sidebarLayoutActive;
    case "sidebar_inbox_hub":
      return false;
    case "sidebar_queue_leaf":
      return sidebarLayoutActive;
    default:
      return false;
  }
}

export function adminShellNavGroupPendingRollup(
  links: readonly { href: string }[],
  counts: AdminHomeInboxCounts,
  channels: AdminHomeInboxChannels,
  loading: boolean,
  error: boolean,
  hasPermission: (perm: string) => boolean,
  permissionsLoaded: boolean,
): number {
  let sum = 0;
  for (const link of links) {
    const { count, inboxKey } = adminShellNavPendingCount(
      link.href,
      counts,
      channels,
      loading,
      error,
      hasPermission,
      permissionsLoaded,
    );
    if (inboxKey && inboxKey !== "hub" && count !== null && count > 0) {
      sum += count;
    }
  }
  return sum;
}

export function adminShellNavGroupSummaryBadgeVisible(input: {
  sidebarLayoutActive: boolean;
  rollup: number;
}): boolean {
  return !input.sidebarLayoutActive && input.rollup > 0;
}
