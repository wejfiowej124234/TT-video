import type { MeTrustSummary } from "@/lib/meTrust";
import type { GuideWorkbenchInboxSnapshot } from "./guideWorkbenchInboxModel";

/** 收件箱空态（① · 质押门闸由顶区单卡承担） */
export type GuideInboxEmptyGuidanceVariant = "ready" | "blocked_staking";

export type GuideInboxEmptyGuidance = {
  variant: GuideInboxEmptyGuidanceVariant;
  bodyKey?: "guide_workbench_inbox_empty_market_body";
};

export type GuideStakingGateMode = "none" | "need_stake" | "below_min" | "satisfied";

export function resolveGuideStakingGateMode(input: {
  showStakingBanner: boolean;
  showStakingBelowMinWarning: boolean;
  showStakingManageLink: boolean;
}): GuideStakingGateMode {
  if (input.showStakingBanner) return "need_stake";
  if (input.showStakingBelowMinWarning) return "below_min";
  if (input.showStakingManageLink) return "satisfied";
  return "none";
}

/** 收件箱空态：订单域短文案；质押/准入 CTA 在顶部门闸卡 */
export function resolveGuideInboxEmptyGuidance(input: {
  orderTakingBlocked: boolean;
}): GuideInboxEmptyGuidance {
  if (input.orderTakingBlocked) {
    return { variant: "blocked_staking" };
  }
  return {
    variant: "ready",
    bodyKey: "guide_workbench_inbox_empty_market_body",
  };
}

export type GuideMarketExposureActionPlan = {
  orderTakingBlocked: boolean;
  showPreview: boolean;
  showAvailability: boolean;
};

export function resolveGuideMarketExposureActionPlan(input: {
  orderTakingBlocked: boolean;
}): GuideMarketExposureActionPlan {
  const blocked = input.orderTakingBlocked;
  return {
    orderTakingBlocked: blocked,
    showPreview: !blocked,
    showAvailability: !blocked,
  };
}

export function resolveGuideMarketExposureSubtitleKey(input: {
  orderTakingBlocked: boolean;
}): "guide_workbench_market_exposure_subtitle_blocked" | "guide_workbench_market_exposure_subtitle" {
  return input.orderTakingBlocked
    ? "guide_workbench_market_exposure_subtitle_blocked"
    : "guide_workbench_market_exposure_subtitle";
}

/** 质押门闸阻塞时整段隐藏市场曝光（占位仅在顶部门闸卡） */
export function shouldShowGuideWorkbenchMarketExposureSection(input: {
  orderTakingBlocked: boolean;
}): boolean {
  return !input.orderTakingBlocked;
}

/** 向导工作台仅展示接单与经营；身份/商家/治理详情去 Hub 或 settings。 */
export const GUIDE_WORKSPACE_OPS_SCOPE_MARKER = "guide-workspace-ops-v1" as const;

function normKyc(kyc: string): string {
  return kyc.trim().toLowerCase();
}

/** 资质横幅：仅 pending / rejected / suspended（已通过不占位）。 */
export function shouldShowGuideRegistrationBanner(trust: MeTrustSummary): boolean {
  const raw = trust.guide_registration_status;
  if (raw == null || raw === "") return false;
  const s = raw.toLowerCase();
  if (s === "active") return false;
  return s === "pending" || s === "pending_review" || s === "rejected" || s === "suspended";
}

/** 身份快照：KYC 未过、风险中/高、或有处置建议时展示。 */
export function shouldShowGuideWorkbenchTrustAnomaly(trust: MeTrustSummary): boolean {
  const kyc = normKyc(trust.kyc_status);
  if (kyc !== "verified" && kyc !== "approved") return true;
  const risk = trust.risk_level?.trim().toLowerCase();
  if (risk === "medium" || risk === "high") return true;
  return (trust.recommended_actions?.length ?? 0) > 0;
}

export function guideHasReceptionHistory(stats: {
  ordersGuided: number;
  completedCount: number;
}): boolean {
  return stats.ordersGuided > 0 || stats.completedCount > 0;
}

/** 收件箱空态：仅新向导且无进行中待办时展示（老向导 0 待办不刷屏）。 */
export function shouldShowGuideInboxEmptyState(
  inbox: GuideWorkbenchInboxSnapshot,
  opts: {
    ordersLoading: boolean;
    ordersError: string | null;
    guideHasReceptionHistory: boolean;
  },
): boolean {
  if (opts.ordersLoading || opts.ordersError) return false;
  if (inbox.nextOrder != null) return false;
  if (inbox.pendingAcceptCount > 0 || inbox.todayPendingCount > 0) return false;
  if (opts.guideHasReceptionHistory) return false;
  return true;
}

/** 新向导无接待史且统计全零时折叠账单/统计大卡（U4 · ①）。 */
export function shouldShowGuideWorkbenchStatsSections(stats: {
  ordersGuided: number;
  completedCount: number;
  periodExpectedEarnings: number;
  periodSettledOrdersCount: number;
  billingPeriodUtc: string | null;
  guideHasReceptionHistory: boolean;
}): boolean {
  if (stats.guideHasReceptionHistory) return true;
  if (stats.ordersGuided > 0 || stats.completedCount > 0) return true;
  if (stats.periodExpectedEarnings > 0 || stats.periodSettledOrdersCount > 0) return true;
  return false;
}

/** 统计折叠时展示「首单后展开」锚点条（① · L5）。 */
export function shouldShowGuideWorkbenchStatsTeaser(opts: {
  showStatsSections: boolean;
  guideHasReceptionHistory: boolean;
}): boolean {
  if (opts.showStatsSections) return false;
  return !opts.guideHasReceptionHistory;
}

/**
 * 新向导统一引导：KYC 未过 + 收件箱空态时合并信任快照与空收件箱文案（① · L5）。
 * 有接单史或仍有待办时不展示。
 */
/** @deprecated 由 `resolveGuideWorkbenchGateProgress` 统一；保留供契约/回归探测 */
export function shouldShowGuideWorkbenchNewGuideOnboarding(opts: {
  trust: MeTrustSummary;
  showInboxEmpty: boolean;
  guideHasReceptionHistory: boolean;
}): boolean {
  if (opts.guideHasReceptionHistory || !opts.showInboxEmpty) return false;
  if (!shouldShowGuideWorkbenchTrustAnomaly(opts.trust)) return false;
  const kyc = normKyc(opts.trust.kyc_status);
  return kyc !== "verified" && kyc !== "approved";
}

/** 底部 PES 转化条：无统计折叠、无接单史时展示（准入已迁至 Trust） */
export function shouldShowGuideWorkbenchPesConversion(opts: {
  showStatsTeaser: boolean;
  showStatsSections: boolean;
  ordersGuided: number;
  completedCount: number;
}): boolean {
  if (opts.showStatsTeaser || opts.showStatsSections) return false;
  return opts.ordersGuided === 0 && opts.completedCount === 0;
}

/** 工作台副标题：待接单优先；质押门闸时提示完成下方步骤 */
export function resolveGuideWorkbenchHeaderSubtitleKey(input: {
  pendingAcceptCount: number;
  orderTakingBlocked?: boolean;
}): string {
  if (input.pendingAcceptCount > 0) return "guide_dashboard_subtitle_pending";
  if (input.orderTakingBlocked) return "guide_dashboard_subtitle_gate";
  return "guide_dashboard_subtitle";
}
