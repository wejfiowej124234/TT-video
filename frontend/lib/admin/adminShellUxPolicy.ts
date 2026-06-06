import type { ConsoleRole70 } from "@/lib/admin/adminRole70Matrix";
import { resolveAdminHomeInboxPendingTotal } from "@/lib/admin/adminHomeInboxPendingTotal";

/**
 * ① Admin Shell / 工作台 UX 降噪（与 `adminShellPendingBadgePolicy` 互补）。
 * 侧栏 tier 与待办角标不同时展示；有待办时首页次要 widget 默认收起。
 */

/** 侧栏 / 顶栏下拉：不展示只读·可写·高权限 tier 徽章（`data-tt-admin-card-tier` 仍保留在 DOM 供审计）。 */
export function adminShellLinkTierBadgeVisible(): boolean {
  return false;
}

/** 首页模块卡：不展示 tier pill（待办角标与标题保留）。 */
export function adminHomeModuleCardTierBadgeVisible(): boolean {
  return false;
}

/** 四通道待办合计 > 0 时，收件箱单列聚焦，KPI/域健康/最近访问默认折叠。 */
export function adminHomeSecondaryWidgetsCollapsed(pendingTotal: number | null): boolean {
  return pendingTotal !== null && pendingTotal > 0;
}

/** 工作台是否使用聚焦布局（含加载中 defer · 与 session 缓存同源）。 */
export function adminHomeInboxFocusLayoutActive(input: {
  pendingTotal: number | null;
  inboxLoading: boolean;
  permissionsLoaded: boolean;
  inboxError: boolean;
}): boolean {
  const resolved = resolveAdminHomeInboxPendingTotal(
    input.pendingTotal,
    input.inboxLoading,
    input.permissionsLoaded,
    input.inboxError,
  );
  if (resolved !== null) return resolved > 0;
  if (!input.permissionsLoaded || input.inboxError) return false;
  return input.inboxLoading;
}

/** 侧栏 / 顶栏：默认收起的 Shell 分组（降噪 · 非禁用）。 */
export const ADMIN_SHELL_NAV_GROUPS_COLLAPSED_DEFAULT: ReadonlySet<string> = new Set([
  "finance",
  "governance",
  "more",
]);

export function adminShellNavGroupDefaultOpen(
  groupId: string,
  input: {
    groupActive: boolean;
    pendingRollup: number;
    /** ADM-U01 · Finance 角色默认展开资金组。 */
    shellFilterRole?: ConsoleRole70 | null;
  },
): boolean {
  if (input.groupActive) return true;
  if (input.pendingRollup > 0) return true;
  if (groupId === "finance" && input.shellFilterRole === "Finance") return true;
  if (ADMIN_SHELL_NAV_GROUPS_COLLAPSED_DEFAULT.has(groupId)) return false;
  return true;
}

/**
 * 有待办且若订单/争议 KPI 需关注则展开；聚焦待办时 **仅争议>0** 才默认展开（避免 162 订单抢视线）。
 */
export function adminHomeKpiFoldDefaultOpen(input: {
  pendingTotal: number | null;
  disputesKpi: number | null;
  ordersKpi: number | null;
}): boolean {
  if (input.pendingTotal === null) return false;
  if (input.pendingTotal === 0) return true;
  return (input.disputesKpi ?? 0) > 0;
}

/** 有待办且在工作台时，顶栏「控制台视角」预览控件降噪（维护者仍可见）。 */
export function adminShellRolePerspectiveSwitcherVisible(input: {
  maintainerUi: boolean;
  onWorkspace: boolean;
  pendingTotal: number | null;
}): boolean {
  if (input.maintainerUi) return true;
  if (
    input.onWorkspace &&
    input.pendingTotal !== null &&
    input.pendingTotal > 0
  ) {
    return false;
  }
  return true;
}

/** 聚焦待办时非维护者隐藏「维护者与手册」长文块。 */
export function adminHomeMaintainerFoldVisible(input: {
  maintainerUi: boolean;
  focusInbox: boolean;
}): boolean {
  if (!input.focusInbox) return true;
  return input.maintainerUi;
}

/** 非聚焦布局：无待办默认展开「系统概况」；有待办默认收起。聚焦待办时区块固定展示于收件箱下方（见 `AdminHomeSystemOverviewSection`）。 */
export function adminHomeSystemOverviewDefaultOpen(pendingTotal: number | null): boolean {
  return pendingTotal === 0;
}

/** 有待办且在工作台时，顶栏 Shell 预览/账号角色徽章降噪（维护者仍可见）。 */
export function adminShellPreviewBadgeVisible(input: {
  maintainerUi: boolean;
  onWorkspace: boolean;
  pendingTotal: number | null;
  /** batch56 · 子页 Shell 预览由能力条 SSOT，顶栏 badge 降噪 */
  shellPreviewActive?: boolean;
}): boolean {
  if (input.shellPreviewActive && !input.onWorkspace) {
    return false;
  }
  if (input.maintainerUi) return true;
  if (
    input.onWorkspace &&
    input.pendingTotal !== null &&
    input.pendingTotal > 0
  ) {
    return false;
  }
  return true;
}

/** 有待办且在工作台时，顶栏「搜索模块」降噪（维护者仍可见）。 */
export function adminShellCommandPaletteTriggerVisible(input: {
  maintainerUi: boolean;
  onWorkspace: boolean;
  pendingTotal: number | null;
}): boolean {
  if (input.maintainerUi) return true;
  if (
    input.onWorkspace &&
    input.pendingTotal !== null &&
    input.pendingTotal > 0
  ) {
    return false;
  }
  return true;
}

/** 工作台硬刷新：capabilities 未就绪时不渲染占位「…/未解析」假数据壳。 */
export function adminWorkspaceBootActive(input: {
  loading: boolean;
  permissionsLoaded: boolean;
  capabilitiesUnavailable: boolean;
}): boolean {
  if (input.capabilitiesUnavailable) return false;
  return input.loading || !input.permissionsLoaded;
}
