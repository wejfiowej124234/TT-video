import { describe, expect, it } from "vitest";

import {
  GUIDE_IDENTITY_STAKE_TIER_USDC,
  computeGuideStakeDeltaToTierUsdc,
  resolveGuideIdentityStakeTierFromAmount,
  shouldShowGuideIdentityStakeTrust,
} from "./guideIdentityStakeTiers";

describe("guideIdentityStakeTiers", () => {
  it("defines platform tiers 1000/5000/10000", () => {
    expect(GUIDE_IDENTITY_STAKE_TIER_USDC).toEqual([1000, 5000, 10000]);
  });

  it("resolves tier from locked amount", () => {
    expect(resolveGuideIdentityStakeTierFromAmount("500")).toBe(null);
    expect(resolveGuideIdentityStakeTierFromAmount("1000")).toBe("tier_basic");
    expect(resolveGuideIdentityStakeTierFromAmount("4999")).toBe("tier_basic");
    expect(resolveGuideIdentityStakeTierFromAmount("5000")).toBe("tier_standard");
    expect(resolveGuideIdentityStakeTierFromAmount("10000")).toBe("tier_premium");
  });

  it("computes delta to target tier", () => {
    expect(computeGuideStakeDeltaToTierUsdc("0", 1000)).toBe(1000);
    expect(computeGuideStakeDeltaToTierUsdc("1000", 5000)).toBe(4000);
    expect(computeGuideStakeDeltaToTierUsdc("5000", 5000)).toBe(0);
  });

  it("shouldShowGuideIdentityStakeTrust at min tier", () => {
    expect(shouldShowGuideIdentityStakeTrust("999")).toBe(false);
    expect(shouldShowGuideIdentityStakeTrust("1000")).toBe(true);
  });
});
