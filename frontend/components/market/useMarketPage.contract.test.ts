import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const __repo = join(__dir, "../..");

function readUseMarketPageModuleSources(): string {
  return [
    readFileSync(join(__dir, "useMarketPage.ts"), "utf8"),
    readFileSync(join(__repo, "lib/marketDiscoverOrdersMerge.ts"), "utf8"),
    readFileSync(join(__repo, "lib/marketGuideFilterQuery.ts"), "utf8"),
    readFileSync(join(__dir, "useMarketPageFavorites.ts"), "utf8"),
    readFileSync(join(__dir, "useMarketPageCommunityUserDeepLink.ts"), "utf8"),
    readFileSync(join(__dir, "useMarketPageAcceptAndItineraryDeepLinks.ts"), "utf8"),
    readFileSync(join(__dir, "useMarketPageRouterSync.ts"), "utf8"),
    readFileSync(join(__dir, "useMarketPageOrderGuideDeepLinks.ts"), "utf8"),
  ].join("\n");
}

describe("useMarketPage cluster (contract)", () => {
  const src = readUseMarketPageModuleSources();

  it("does not reference internal API paths", () => {
    expect(src).not.toMatch(/\/api\/v1\/internal\//);
  });

  it("keeps public market client entrypoints and community deep-link key", () => {
    expect(src).toContain("orderAccept");
    expect(src).toContain("getDiscoverOrders");
    expect(src).toContain("getGuides");
    expect(src).toContain("COMMUNITY_USER_MARKET_QUERY");
    expect(src).toContain("MARKET_BIND_GUIDE_ORDER_QUERY");
    expect(src).toContain("bindGuideToOrderId");
    expect(src).toContain("filterDiscoverOrdersForViewer");
    expect(src).toContain("buildMarketDiscoverOrderList");
    expect(src).toContain("ownPublishedOpenListingIds");
    expect(src).toMatch(/bindGuideToOrderId[\s\S]{0,200}setView(?:Sync)?\("guides"\)/);
    expect(src).toContain("orderGetResponseToMarketCard");
    expect(src).toMatch(/bindGuideToOrderId[\s\S]{0,400}appendMarketDevVarietyOrders/);
    expect(src).toContain("bindOrderBackfillError");
    expect(src).toContain("mapApiReadError");
    expect(src).toContain("applyDiscoverGeoFiltersKeepingPin");
    expect(src).toContain("buildMarketGuideListApiParams");
    expect(src).toContain("guideMatchesMarketAdvancedFilters");
    expect(src).toContain("bindDeepLinkPrimedRef");
    expect(src).toContain("MARKET_LIST_REFETCH_DEBOUNCE_MS");
    expect(src).toContain("pullMarketTravelBookmarksIntoLocal");
    expect(src).toContain("pushMarketOrderBookmarkToggle");
    expect(src).toContain("refreshFavoritesSyncHint");
    expect(src).toContain('useState(() => t("market_favorites_sync_note_local"))');
    expect(src).toContain("filterGuidesAvailableForTrip");
    expect(src).toContain("useBindOrderTripDates");
    expect(src).toContain("bindOrderTripDates");
  });
});
