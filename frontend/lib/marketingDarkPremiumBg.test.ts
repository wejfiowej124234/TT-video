import { describe, expect, it, afterEach } from "vitest";
import {
  isMarketDarkPremiumBgPreviewEnabled,
  resolveCommunityBackdropSurface,
  resolveCommunityDarkRouteSceneTier,
  resolveDidRankBackdropSurface,
  resolveDidRankDarkRouteSceneTier,
  resolveMarketBackdropSurface,
  resolveMarketDarkRouteSceneTier,
} from "./marketingDarkPremiumBg";

describe("marketingDarkPremiumBg", () => {
  const prev = process.env.NEXT_PUBLIC_TRAVELTRUST_MARKET_DARK_PREMIUM_BG;

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.NEXT_PUBLIC_TRAVELTRUST_MARKET_DARK_PREMIUM_BG;
    } else {
      process.env.NEXT_PUBLIC_TRAVELTRUST_MARKET_DARK_PREMIUM_BG = prev;
    }
  });

  it("defaults to premium surface (V2 · aligned with TT community)", () => {
    delete process.env.NEXT_PUBLIC_TRAVELTRUST_MARKET_DARK_PREMIUM_BG;
    expect(resolveMarketBackdropSurface()).toBe("premium");
    expect(resolveDidRankBackdropSurface()).toBe("premium");
    expect(resolveMarketDarkRouteSceneTier("premium")).toBe("marketPremium");
    expect(resolveDidRankDarkRouteSceneTier("premium")).toBe("marketPremium");
  });

  it("allows warm rollback via env=0", () => {
    process.env.NEXT_PUBLIC_TRAVELTRUST_MARKET_DARK_PREMIUM_BG = "0";
    expect(isMarketDarkPremiumBgPreviewEnabled()).toBe(false);
    expect(resolveMarketBackdropSurface()).toBe("warm");
    expect(resolveMarketDarkRouteSceneTier("warm")).toBe("market");
    expect(resolveDidRankDarkRouteSceneTier("warm")).toBe("didRank");
  });

  it("uses premium surface for TT community preview", () => {
    expect(resolveCommunityBackdropSurface()).toBe("premium");
    expect(resolveCommunityDarkRouteSceneTier("premium")).toBe("communityPremium");
  });
});
