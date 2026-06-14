import { describe, expect, it } from "vitest";
import type { MeTrustSummary } from "@/lib/meTrust";
import {
  guidePublicDetailHref,
  guidePublicMarketBrowseHref,
} from "./guideWorkbenchProfileSummaryModel";
import {
  guideHasReceptionHistory,
  shouldShowGuideInboxEmptyState,
  shouldShowGuideRegistrationBanner,
  resolveGuideInboxEmptyGuidance,
  resolveGuideMarketExposureActionPlan,
  resolveGuideStakingGateMode,
  resolveGuideWorkbenchHeaderSubtitleKey,
  shouldShowGuideWorkbenchNewGuideOnboarding,
  shouldShowGuideWorkbenchMarketExposureSection,
  shouldShowGuideWorkbenchPesConversion,
  shouldShowGuideWorkbenchStatsSections,
  shouldShowGuideWorkbenchStatsTeaser,
  shouldShowGuideWorkbenchTrustAnomaly,
} from "./guideWorkbenchWorkspaceL5";

const baseTrust: MeTrustSummary = {
  kyc_status: "verified",
  wallet_linked: true,
  guide_registration_status: "active",
  risk_level: "low",
};

describe("guideWorkbenchWorkspaceL5", () => {
  it("hides registration banner when guide is active", () => {
    expect(shouldShowGuideRegistrationBanner(baseTrust)).toBe(false);
    expect(
      shouldShowGuideRegistrationBanner({ ...baseTrust, guide_registration_status: "pending_review" }),
    ).toBe(true);
  });

  it("shows trust anomaly for kyc and elevated risk", () => {
    expect(shouldShowGuideWorkbenchTrustAnomaly(baseTrust)).toBe(false);
    expect(shouldShowGuideWorkbenchTrustAnomaly({ ...baseTrust, kyc_status: "none" })).toBe(true);
    expect(shouldShowGuideWorkbenchTrustAnomaly({ ...baseTrust, risk_level: "high" })).toBe(true);
    expect(
      shouldShowGuideWorkbenchTrustAnomaly({
        ...baseTrust,
        recommended_actions: ["limit_trading"],
      }),
    ).toBe(true);
  });

  it("hides inbox empty when guide has reception history", () => {
    const inbox = { pendingAcceptCount: 0, todayPendingCount: 0, nextOrder: null };
    expect(
      shouldShowGuideInboxEmptyState(inbox, {
        ordersLoading: false,
        ordersError: null,
        guideHasReceptionHistory: true,
      }),
    ).toBe(false);
    expect(
      shouldShowGuideInboxEmptyState(inbox, {
        ordersLoading: false,
        ordersError: null,
        guideHasReceptionHistory: false,
      }),
    ).toBe(true);
  });

  it("guideHasReceptionHistory from stats", () => {
    expect(guideHasReceptionHistory({ ordersGuided: 0, completedCount: 0 })).toBe(false);
    expect(guideHasReceptionHistory({ ordersGuided: 3, completedCount: 0 })).toBe(true);
  });

  it("shouldShowGuideWorkbenchNewGuideOnboarding for kyc-none + empty inbox", () => {
    const inbox = { pendingAcceptCount: 0, todayPendingCount: 0, nextOrder: null };
    expect(
      shouldShowGuideWorkbenchNewGuideOnboarding({
        trust: { ...baseTrust, kyc_status: "none" },
        showInboxEmpty: true,
        guideHasReceptionHistory: false,
      }),
    ).toBe(true);
    expect(
      shouldShowGuideWorkbenchNewGuideOnboarding({
        trust: baseTrust,
        showInboxEmpty: true,
        guideHasReceptionHistory: false,
      }),
    ).toBe(false);
    expect(
      shouldShowGuideWorkbenchNewGuideOnboarding({
        trust: { ...baseTrust, kyc_status: "none" },
        showInboxEmpty: false,
        guideHasReceptionHistory: false,
      }),
    ).toBe(false);
    expect(
      shouldShowGuideWorkbenchNewGuideOnboarding({
        trust: { ...baseTrust, kyc_status: "none" },
        showInboxEmpty: true,
        guideHasReceptionHistory: true,
      }),
    ).toBe(false);
    void inbox;
  });

  it("resolveGuideInboxEmptyGuidance is minimal (gate CTAs live in staking card)", () => {
    const blocked = resolveGuideInboxEmptyGuidance({ orderTakingBlocked: true });
    expect(blocked.variant).toBe("blocked_staking");
    expect(blocked.bodyKey).toBeUndefined();
    const ready = resolveGuideInboxEmptyGuidance({ orderTakingBlocked: false });
    expect(ready.variant).toBe("ready");
    expect(ready.bodyKey).toBe("guide_workbench_inbox_empty_market_body");
  });

  it("resolveGuideStakingGateMode prioritizes need_stake then below_min", () => {
    expect(
      resolveGuideStakingGateMode({
        showStakingBanner: true,
        showStakingBelowMinWarning: true,
        showStakingManageLink: false,
      }),
    ).toBe("need_stake");
    expect(
      resolveGuideStakingGateMode({
        showStakingBanner: false,
        showStakingBelowMinWarning: true,
        showStakingManageLink: false,
      }),
    ).toBe("below_min");
    expect(
      resolveGuideStakingGateMode({
        showStakingBanner: false,
        showStakingBelowMinWarning: false,
        showStakingManageLink: true,
      }),
    ).toBe("satisfied");
  });

  it("shouldShowGuideWorkbenchMarketExposureSection hides section when blocked", () => {
    expect(shouldShowGuideWorkbenchMarketExposureSection({ orderTakingBlocked: true })).toBe(false);
    expect(shouldShowGuideWorkbenchMarketExposureSection({ orderTakingBlocked: false })).toBe(true);
  });

  it("resolveGuideMarketExposureActionPlan collapses when order taking blocked", () => {
    const blocked = resolveGuideMarketExposureActionPlan({ orderTakingBlocked: true });
    expect(blocked.showPreview).toBe(false);
    expect(blocked.showAvailability).toBe(false);
    const ready = resolveGuideMarketExposureActionPlan({ orderTakingBlocked: false });
    expect(ready.showPreview).toBe(true);
    expect(ready.showAvailability).toBe(true);
  });

  it("resolveGuideWorkbenchHeaderSubtitleKey prioritizes pending accepts then gate", () => {
    expect(resolveGuideWorkbenchHeaderSubtitleKey({ pendingAcceptCount: 2 })).toBe(
      "guide_dashboard_subtitle_pending",
    );
    expect(
      resolveGuideWorkbenchHeaderSubtitleKey({ pendingAcceptCount: 0, orderTakingBlocked: true }),
    ).toBe("guide_dashboard_subtitle_gate");
    expect(resolveGuideWorkbenchHeaderSubtitleKey({ pendingAcceptCount: 0 })).toBe("guide_dashboard_subtitle");
  });

  it("shouldShowGuideWorkbenchPesConversion only when no teaser/stats and zero orders", () => {
    expect(
      shouldShowGuideWorkbenchPesConversion({
        showStatsTeaser: false,
        showStatsSections: false,
        ordersGuided: 0,
        completedCount: 0,
      }),
    ).toBe(true);
    expect(
      shouldShowGuideWorkbenchPesConversion({
        showStatsTeaser: true,
        showStatsSections: false,
        ordersGuided: 0,
        completedCount: 0,
      }),
    ).toBe(false);
  });

  it("shouldShowGuideWorkbenchStatsTeaser when stats collapsed for new guide", () => {
    expect(
      shouldShowGuideWorkbenchStatsTeaser({
        showStatsSections: false,
        guideHasReceptionHistory: false,
      }),
    ).toBe(true);
    expect(
      shouldShowGuideWorkbenchStatsTeaser({
        showStatsSections: true,
        guideHasReceptionHistory: false,
      }),
    ).toBe(false);
  });

  it("shouldShowGuideWorkbenchStatsSections hides empty stats for new guides", () => {
    expect(
      shouldShowGuideWorkbenchStatsSections({
        ordersGuided: 0,
        completedCount: 0,
        periodExpectedEarnings: 0,
        periodSettledOrdersCount: 0,
        billingPeriodUtc: null,
        guideHasReceptionHistory: false,
      }),
    ).toBe(false);
    expect(
      shouldShowGuideWorkbenchStatsSections({
        ordersGuided: 1,
        completedCount: 0,
        periodExpectedEarnings: 0,
        periodSettledOrdersCount: 0,
        billingPeriodUtc: null,
        guideHasReceptionHistory: false,
      }),
    ).toBe(true);
    expect(
      shouldShowGuideWorkbenchStatsSections({
        ordersGuided: 0,
        completedCount: 0,
        periodExpectedEarnings: 0,
        periodSettledOrdersCount: 0,
        billingPeriodUtc: "2026-06",
        guideHasReceptionHistory: false,
      }),
    ).toBe(false);
  });

  it("guidePublicDetailHref respects public_detail_available", () => {
    expect(
      guidePublicDetailHref({ guide_id: "abc", public_detail_available: true }),
    ).toBe("/guides/abc");
    expect(
      guidePublicDetailHref({ guide_id: "abc", public_detail_available: false }),
    ).toBeNull();
    expect(guidePublicMarketBrowseHref({ city: "杭州" })).toBe("/market?city=%E6%9D%AD%E5%B7%9E");
  });
});
