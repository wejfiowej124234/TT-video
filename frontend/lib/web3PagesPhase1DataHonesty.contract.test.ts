import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

/** ① `/` + `/market` Web3/市场数据诚实机读（2026-06-03 · F-020 等） */
describe("web3 + market phase 1 data honesty anchors (contract)", () => {
  it("F-020 bookmarks sync wired on landing and market", () => {
    expect(read("components/landing/useLandingPage.ts")).toContain("pullMarketTravelBookmarksIntoLocal");
    expect(read("components/market/useMarketPageFavorites.ts")).toContain("pushMarketOrderBookmarkToggle");
    expect(read("components/market/useMarketPageFavorites.ts")).toContain("pushMarketGuideBookmarkToggle");
    expect(read("lib/marketTravelBookmarksSync.ts")).toContain("getMarketTravelBookmarks");
  });

  it("page shells expose favorites mode data-tt", () => {
    expect(read("app/plan/page.tsx")).toContain('data-tt-home-favorites-mode="localstorage-f020-sync-v1"');
    expect(read("app/market/MarketPageClient.tsx")).toContain(
      'data-tt-market-favorites-mode="localstorage-f020-sync-v1"',
    );
  });

  it("market bookmarks sync failure surfaces retry UI", () => {
    expect(read("components/market/MarketTravelFilterPanel.tsx")).toContain("market-bookmarks-sync-alert");
    expect(read("components/market/useMarketPageFavorites.ts")).toContain("bookmarkSyncAlert");
  });

  it("L-001/L-002/L-004 phase-1 honest mock anchors (not ② USDC/AI/on-chain)", () => {
    expect(read("components/landing/UnlockModal.tsx")).toContain(
      'data-tt-landing-unlock-honesty="phase1-preview-no-usdc"',
    );
    expect(read("components/landing/ItineraryResultsSection.tsx")).toContain(
      'data-tt-home-itinerary-honesty="phase1-mock-ai-not-production"',
    );
    expect(read("components/landing/LandingHeroForm.tsx")).toContain(
      'data-tt-home-itinerary-generate-honesty="phase1-mock-ai-not-production"',
    );
    expect(read("lib/acquisition/acquisitionL5.ts")).toContain("data-tt-acquisition-bond-honesty");
    expect(read("lib/acquisition/acquisitionL5.ts")).toContain("phase1-mock-pg-not-mainnet");
    expect(read("locales/zh.ts")).toContain("landing_hero_itinerary_disclaimer");
    expect(read("locales/en.ts")).toContain("landing_hero_itinerary_disclaimer");
  });

  it("market subsite catalog cap uses {{count}} interpolation", () => {
    expect(read("locales/zh.ts")).toContain("market_subsite_filter_summary_line_catalog_cap");
    expect(read("locales/zh.ts")).toMatch(/market_subsite_filter_summary_line_catalog_cap:[\s\S]*\{\{count\}\}/);
    expect(read("locales/en.ts")).toMatch(/market_subsite_filter_summary_line_catalog_cap:[\s\S]*\{\{count\}\}/);
  });
});
