import { describe, expect, it } from "vitest";

import {
  canPerformGuideIdentityStaking,
  GUIDE_IDENTITY_MIN_STAKE_REFERENCE,
  GUIDE_IDENTITY_STAKING_HREF,
  guideIdentityStakingHasAnyAmount,
  guideIdentityStakingSatisfied,
  isGuideOnlyStakingScope,
  parseGuideStakeAmountFromMe,
  resolveGuideIdentityStakingTier,
  shouldShowGuideIdentityStakingBanner,
  shouldShowGuideIdentityStakingBelowMinWarning,
  shouldShowGuideWorkbenchStakingManageLink,
} from "./guideIdentityStakingNav";

describe("guideIdentityStakingNav", () => {
  it("exposes stable staking deep link", () => {
    expect(GUIDE_IDENTITY_STAKING_HREF).toBe("/staking?scope=guide#guide-identity-stake");
    expect(isGuideOnlyStakingScope("guide")).toBe(true);
    expect(isGuideOnlyStakingScope("provider")).toBe(false);
  });

  it("parses guide stake from GET /me payload", () => {
    expect(parseGuideStakeAmountFromMe({ guide: { stake_amount: "100" } })).toBe("100");
    expect(parseGuideStakeAmountFromMe({ guide: { stake_amount: "0" } })).toBe("0");
    expect(parseGuideStakeAmountFromMe({})).toBeNull();
  });

  it("resolves staking tiers against MIN_STAKE reference", () => {
    expect(resolveGuideIdentityStakingTier(null)).toBe("none");
    expect(resolveGuideIdentityStakingTier("0")).toBe("none");
    expect(resolveGuideIdentityStakingTier("100")).toBe("below_min");
    expect(resolveGuideIdentityStakingTier("100", "1000")).toBe("below_min");
    expect(resolveGuideIdentityStakingTier("1000")).toBe("satisfied");
    expect(resolveGuideIdentityStakingTier("1500", "1000")).toBe("satisfied");
    expect(GUIDE_IDENTITY_MIN_STAKE_REFERENCE).toBe("1000");
  });

  it("detects satisfied stake only when meeting minimum", () => {
    expect(guideIdentityStakingHasAnyAmount("100")).toBe(true);
    expect(guideIdentityStakingSatisfied("100")).toBe(false);
    expect(guideIdentityStakingSatisfied("1000")).toBe(true);
    expect(guideIdentityStakingSatisfied("0")).toBe(false);
    expect(guideIdentityStakingSatisfied(null)).toBe(false);
  });

  it("gates staking ops on admin approval only", () => {
    expect(canPerformGuideIdentityStaking("active")).toBe(true);
    expect(canPerformGuideIdentityStaking("approved")).toBe(true);
    expect(canPerformGuideIdentityStaking("pending")).toBe(false);
    expect(canPerformGuideIdentityStaking("pending_review")).toBe(false);
    expect(canPerformGuideIdentityStaking("exiting")).toBe(false);
    expect(canPerformGuideIdentityStaking("exited")).toBe(false);
    expect(canPerformGuideIdentityStaking(null)).toBe(false);
  });

  it("shows manage link only when minimum stake is met", () => {
    expect(
      shouldShowGuideWorkbenchStakingManageLink({
        guideWorkspaceUnlocked: true,
        guideRegistrationStatus: "active",
        stakeAmount: "1000",
      }),
    ).toBe(true);
    expect(
      shouldShowGuideWorkbenchStakingManageLink({
        guideWorkspaceUnlocked: true,
        guideRegistrationStatus: "active",
        stakeAmount: "100",
      }),
    ).toBe(false);
    expect(
      shouldShowGuideWorkbenchStakingManageLink({
        guideWorkspaceUnlocked: true,
        guideRegistrationStatus: "active",
        stakeAmount: "0",
      }),
    ).toBe(false);
  });

  it("shows below-min warning when staked but under MIN_STAKE", () => {
    expect(
      shouldShowGuideIdentityStakingBelowMinWarning({
        guideWorkspaceUnlocked: true,
        guideRegistrationStatus: "active",
        stakeAmount: "100",
      }),
    ).toBe(true);
    expect(
      shouldShowGuideIdentityStakingBelowMinWarning({
        guideWorkspaceUnlocked: true,
        guideRegistrationStatus: "active",
        stakeAmount: "1000",
      }),
    ).toBe(false);
  });

  it("shows banner when workbench unlocked, approved, and unstaked", () => {
    expect(
      shouldShowGuideIdentityStakingBanner({
        guideWorkspaceUnlocked: true,
        guideRegistrationStatus: "active",
        stakeAmount: "0",
      }),
    ).toBe(true);
    expect(
      shouldShowGuideIdentityStakingBanner({
        guideWorkspaceUnlocked: true,
        guideRegistrationStatus: "pending",
        stakeAmount: "0",
      }),
    ).toBe(false);
    expect(
      shouldShowGuideIdentityStakingBanner({
        guideWorkspaceUnlocked: true,
        guideRegistrationStatus: "active",
        stakeAmount: "500",
      }),
    ).toBe(false);
    expect(
      shouldShowGuideIdentityStakingBanner({
        guideWorkspaceUnlocked: false,
        guideRegistrationStatus: "active",
        stakeAmount: "0",
      }),
    ).toBe(false);
    expect(
      shouldShowGuideIdentityStakingBanner({
        guideWorkspaceUnlocked: true,
        guideRegistrationStatus: null,
        stakeAmount: "0",
      }),
    ).toBe(false);
  });
});
