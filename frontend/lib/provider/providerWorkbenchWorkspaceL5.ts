import type { MeTrustSummary } from "@/lib/meTrust";
import type { ProviderWorkbenchInboxSnapshot } from "./providerWorkbenchInboxModel";

export type MerchantInboxEmptyGuidanceVariant = "publish_blocked" | "ready";

export type MerchantInboxEmptyGuidance = {
  variant: MerchantInboxEmptyGuidanceVariant;
  /** blocked 时仅展示订单空态；门闸文案在市场曝光顶区 */
  bodyKey?: "provider_workbench_inbox_empty_ready_body";
};

/** 收件箱空态：订单域短文案；门闸与橱窗 CTA 在市场曝光区 */
export function resolveMerchantInboxEmptyGuidance(input: {
  publishEligibilityOk: boolean;
}): MerchantInboxEmptyGuidance {
  if (!input.publishEligibilityOk) {
    return { variant: "publish_blocked" };
  }
  return {
    variant: "ready",
    bodyKey: "provider_workbench_inbox_empty_ready_body",
  };
}

export function resolveMerchantMarketExposureSubtitleKey(input: {
  publishEligibilityOk: boolean;
}): "provider_workbench_market_exposure_subtitle_blocked" | "provider_workbench_market_exposure_subtitle" {
  return input.publishEligibilityOk
    ? "provider_workbench_market_exposure_subtitle"
    : "provider_workbench_market_exposure_subtitle_blocked";
}

export type MerchantMarketExposureActionPlan = {
  publishBlocked: boolean;
  showStudio: boolean;
  showPreview: boolean;
  showListingCounts: boolean;
};

export function resolveMerchantMarketExposureActionPlan(input: {
  publishEligibilityOk: boolean;
}): MerchantMarketExposureActionPlan {
  const publishBlocked = !input.publishEligibilityOk;
  return {
    publishBlocked,
    showStudio: input.publishEligibilityOk,
    showPreview: input.publishEligibilityOk,
    showListingCounts: input.publishEligibilityOk,
  };
}

export type MerchantMarketExposureReadyActionOrder = {
  primary: "settings" | "studio";
  secondary: "settings" | "studio";
};

/** 已解锁：无 listing 时优先「管理橱窗商品」 */
export function resolveMerchantMarketExposureReadyActions(input: {
  publishedCount: number;
  draftCount: number;
}): MerchantMarketExposureReadyActionOrder {
  const showcaseEmpty = input.publishedCount === 0 && input.draftCount === 0;
  return showcaseEmpty
    ? { primary: "studio", secondary: "settings" }
    : { primary: "settings", secondary: "studio" };
}

/** 商家工作台仅展示经营；准入 SSOT 在 `/me/settings/trust` */
export const MERCHANT_WORKSPACE_OPS_SCOPE_MARKER = "merchant-workspace-ops-v1" as const;

function normKyc(kyc: string): string {
  return kyc.trim().toLowerCase();
}

export function merchantHasServiceHistory(stats: {
  ordersMerchantTotal: number;
  merchantInProgressCount: number;
}): boolean {
  return stats.ordersMerchantTotal > 0 || stats.merchantInProgressCount > 0;
}

/** 收件箱空态：仅新商家且无进行中待办时展示 */
export function shouldShowMerchantInboxEmptyState(
  inbox: ProviderWorkbenchInboxSnapshot,
  opts: {
    ordersLoading: boolean;
    ordersError: string | null;
    merchantHasServiceHistory: boolean;
  },
): boolean {
  if (opts.ordersLoading || opts.ordersError) return false;
  if (inbox.nextOrder != null) return false;
  if (inbox.pendingFulfillmentCount > 0 || inbox.inProgressCount > 0) return false;
  if (opts.merchantHasServiceHistory) return false;
  return true;
}

/** 新商家无服务史且统计全零时折叠账单/统计大卡 */
export function shouldShowMerchantWorkbenchStatsSections(stats: {
  ordersMerchantTotal: number;
  merchantInProgressCount: number;
  periodExpectedEarnings: number;
  periodSettledOrdersCount: number;
  merchantHasServiceHistory: boolean;
}): boolean {
  if (stats.merchantHasServiceHistory) return true;
  if (stats.ordersMerchantTotal > 0 || stats.merchantInProgressCount > 0) return true;
  if (stats.periodExpectedEarnings > 0 || stats.periodSettledOrdersCount > 0) return true;
  return false;
}

export function shouldShowMerchantWorkbenchStatsTeaser(opts: {
  showStatsSections: boolean;
  merchantHasServiceHistory: boolean;
}): boolean {
  if (opts.showStatsSections) return false;
  return !opts.merchantHasServiceHistory;
}

export function shouldShowMerchantWorkbenchTrustAnomaly(trust: MeTrustSummary): boolean {
  const kyc = normKyc(trust.kyc_status);
  if (kyc !== "verified" && kyc !== "approved") return true;
  const provider = trust.provider_registration_status?.trim().toLowerCase();
  if (provider === "rejected" || provider === "suspended") return true;
  const risk = trust.risk_level?.trim().toLowerCase();
  if (risk === "medium" || risk === "high") return true;
  return (trust.recommended_actions?.length ?? 0) > 0;
}

export function resolveMerchantWorkbenchHeaderSubtitleKey(input: {
  pendingFulfillmentCount: number;
}): string {
  if (input.pendingFulfillmentCount > 0) return "provider_workbench_subtitle_pending";
  return "provider_workbench_subtitle";
}
