import type { ConsoleRole70 } from "@/lib/admin/adminRole70Matrix";

/**
 * ① Admin Shell / 工作台 UX 降噪（与 `adminShellPendingBadgePolicy` 互补）。
 * 侧栏 tier 与待办角标不同时展示；Product Baseline 下首页次要 widget 默认收起。
 */

/** 侧栏 / 顶栏下拉：不展示只读·可写·高权限 tier 徽章（`data-tt-admin-card-tier` 仍保留在 DOM 供审计）。 */
export function adminShellLinkTierBadgeVisible(): boolean {
  return false;
}

/** 首页模块卡：不展示 tier pill（待办角标与标题保留）。 */
export function adminHomeModuleCardTierBadgeVisible(): boolean {
  return false;
}

/**
 * Product Baseline：Inbox Focus 默认开启 → KPI / 域健康 / 最近访问恒为辅助折叠。
 * `pendingTotal` 保留签名（调用方兼容）；不再驱动折叠。
 */
export function adminHomeSecondaryWidgetsCollapsed(pendingTotal: number | null): boolean {
  void pendingTotal;
  return true;
}

/**
 * 工作台是否使用 Inbox Focus 布局。
 *
 * **Product / Release Baseline (UI/UX SSOT · 2026-07-30 → inbox-focus default):**
 * Staging 已验的「待办优先 · 收件箱优先 · 运营动作优先」提升为 **三环境默认**。
 * 概况 / 域健康 / 运营指标为辅助模块（折叠 / 后置），不随 pending 在 warm↔focus 间切壳。
 *
 * Signature 保留（调用方 / 机读兼容）；inputs 不再驱动布局（消除 WP-01 闪烁根因）。
 * **Forbidden:** `NEXT_PUBLIC_*` / deploy-env forks；API / RBAC / 数据模型 / FE tip 变更。
 * See `adminDesignSystemBaseline.ts`.
 */
export function adminHomeInboxFocusLayoutActive(input: {
  pendingTotal: number | null;
  inboxLoading: boolean;
  permissionsLoaded: boolean;
  inboxError: boolean;
}): boolean {
  void input.pendingTotal;
  void input.inboxLoading;
  void input.permissionsLoaded;
  void input.inboxError;
  return true;
}

/** 侧栏 / 顶栏：默认收起的 Shell 分组（降噪 · 非禁用）。
 * Batch-12 HU-474：仅保留现行发布组 id · 移除已删 `finance`/`governance` 死项。
 * Batch-10 HU-224：`more`/平台默认展开，避免财务/设置不可见。
 */
export const ADMIN_SHELL_NAV_GROUPS_COLLAPSED_DEFAULT: ReadonlySet<string> = new Set([]);

export function adminShellNavGroupDefaultOpen(
  groupId: string,
  input: {
    groupActive: boolean;
    pendingRollup: number;
    /** ADM-U01 · Finance 角色默认展开资金相关组（现行 id=`more`）。 */
    shellFilterRole?: ConsoleRole70 | null;
  },
): boolean {
  if (input.groupActive) return true;
  if (input.pendingRollup > 0) return true;
  if (groupId === "more" && input.shellFilterRole === "Finance") return true;
  if (ADMIN_SHELL_NAV_GROUPS_COLLAPSED_DEFAULT.has(groupId)) return false;
  return true;
}

/**
 * Batch-12 HU-432 + HU-441：概况为唯一经营大数；明细折叠默认收起（避免与概况职责重叠）。
 * 争议>0 仍强制展开，便于从待办态直达争议深链。
 */
export function adminHomeKpiFoldDefaultOpen(input: {
  pendingTotal: number | null;
  disputesKpi: number | null;
  ordersKpi: number | null;
}): boolean {
  void input.pendingTotal;
  void input.ordersKpi;
  return (input.disputesKpi ?? 0) > 0;
}

/** W9 HU-293 · 超管指挥布局标记（域健康+KPI 上 · 待办中 · 入驻模块下）。 */
export function adminHomeCommandLayoutActive(): boolean {
  return true;
}

/** HU-050 · 控制台视角预览：仅维护者 UI；日常运营不展示角色透视切换。 */
export function adminShellRolePerspectiveSwitcherVisible(input: {
  maintainerUi: boolean;
  onWorkspace: boolean;
  pendingTotal: number | null;
}): boolean {
  return input.maintainerUi;
}

/** Batch-8 WP-03 / HU-083：维护者手册仅 `maintainerUi`（两布局皆然）。 */
export function adminHomeMaintainerFoldVisible(input: {
  maintainerUi: boolean;
  focusInbox: boolean;
}): boolean {
  void input.focusInbox;
  return input.maintainerUi;
}

/**
 * HU-455 · Product Baseline · Inbox Focus 默认：系统概况恒为辅助 → 默认收起。
 * `pendingTotal` 保留签名；不再驱动展开。
 */
export function adminHomeSystemOverviewDefaultOpen(pendingTotal: number | null): boolean {
  void pendingTotal;
  return false;
}

/**
 * Product Baseline · 工作台 Inbox Focus：非维护者顶栏预览/账号角色徽章降噪；
 * 维护者仍可见。子页 shell preview 仍由能力条 SSOT 降噪。
 */
export function adminShellPreviewBadgeVisible(input: {
  maintainerUi: boolean;
  onWorkspace: boolean;
  pendingTotal: number | null;
  /** batch56 · 子页 Shell 预览由能力条 SSOT，顶栏 badge 降噪 */
  shellPreviewActive?: boolean;
}): boolean {
  void input.pendingTotal;
  if (input.shellPreviewActive && !input.onWorkspace) {
    return false;
  }
  if (input.maintainerUi) return true;
  if (input.onWorkspace) return false;
  return true;
}

/**
 * Batch-10 W12 · HU-202：视角切换器已表达身份时，隐藏顶栏金标/账号角色徽，
 * 避免「超级管理员×3」（条 + 金标 + 下拉）。
 */
export function adminShellDbRoleBadgeVisible(input: {
  showRolePerspectiveSwitcher: boolean;
}): boolean {
  return !input.showRolePerspectiveSwitcher;
}

/**
 * Batch-12 HU-437 · 工作台页始终隐藏「搜索模块」芯片（⌘K 键盘仍可用），
 * 避免搜索/Staging/运维与指挥台抢注意力；子页仍显示芯片。
 */
export function adminShellCommandPaletteTriggerVisible(input: {
  maintainerUi: boolean;
  onWorkspace: boolean;
  pendingTotal: number | null;
}): boolean {
  void input.maintainerUi;
  void input.pendingTotal;
  if (input.onWorkspace) return false;
  return true;
}

/** Batch-12 HU-437 · 工作台页环境徽改次强（只读诚实保留，视觉不抢戏）。 */
export function adminShellDeployEnvBadgeQuiet(input: { onWorkspace: boolean }): boolean {
  return input.onWorkspace;
}

/** Batch-12 HU-437 · 工作台顶栏运维条降噪（机读针）。 */
export function adminShellWorkspaceOpsChromeDemoted(onWorkspace: boolean): boolean {
  return onWorkspace;
}

/** Staging / contract needle · keep literal (names minify). */
export const TT_ADMIN_SHELL_WORKSPACE_OPS_DEMOTED_MARK = "tt_admin_shell_workspace_ops_demoted_hu437";

/** 工作台硬刷新：capabilities 未就绪时不渲染占位「…/未解析」假数据壳。 */
export function adminWorkspaceBootActive(input: {
  loading: boolean;
  permissionsLoaded: boolean;
  capabilitiesUnavailable: boolean;
}): boolean {
  if (input.capabilitiesUnavailable) return false;
  return input.loading || !input.permissionsLoaded;
}
