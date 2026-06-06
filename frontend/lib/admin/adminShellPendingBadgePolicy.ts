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
  /** P3：工作台有待办聚焦时，顶栏收件箱 hub 不重复角标 */
  suppressTopInboxHubOnWorkspace?: boolean;
  /** 工作台收件箱聚焦：首页 hero 已展示数字，侧栏叶节点不再重复 */
  suppressSidebarLeafOnWorkspaceInboxFocus?: boolean;
}): boolean {
  const {
    placement,
    sidebarLayoutActive,
    count,
    suppressTopInboxHubOnWorkspace,
    suppressSidebarLeafOnWorkspaceInboxFocus,
  } = input;
  if (count === null || count <= 0) return false;
  switch (placement) {
    case "top_inbox_hub":
      if (suppressTopInboxHubOnWorkspace) return false;
      return true;
    case "top_nav_dropdown":
      return !sidebarLayoutActive;
    case "sidebar_inbox_hub":
      return false;
    case "sidebar_queue_leaf":
      if (suppressSidebarLeafOnWorkspaceInboxFocus) return false;
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
  /** 工作台收件箱聚焦：组级仅 attention dot，不重复数字 */
  workspaceInboxFocus?: boolean;
}): boolean {
  if (input.rollup <= 0) return false;
  if (input.workspaceInboxFocus && input.sidebarLayoutActive) return false;
  return !input.sidebarLayoutActive;
}

/** 侧栏分组 summary · 工作台 focus 时橙点（数字已在首页 hero） */
export function adminShellNavGroupSummaryAttentionDotVisible(input: {
  sidebarLayoutActive: boolean;
  rollup: number;
  workspaceInboxFocus: boolean;
}): boolean {
  return input.workspaceInboxFocus && input.sidebarLayoutActive && input.rollup > 0;
}
