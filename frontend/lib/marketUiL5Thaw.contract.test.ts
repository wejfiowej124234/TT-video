import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = join(__dirname, "../..");

describe("market UI L5 closure (① · 2026-05-30)", () => {
  it("documents thaw closure SSOT and real-data default", () => {
    const closure = join(repoRoot, "frontend/evidence/GO_local_marketing_front_closure/MARKET-L5-CLOSURE.md");
    const thaw = join(repoRoot, "frontend/evidence/GO_local_marketing_front_closure/MARKET-UI-THAW.md");
    const filterFreeze = join(
      repoRoot,
      "frontend/evidence/GO_local_marketing_front_closure/MARKET-FILTER-SORT-UI-FREEZE.md",
    );
    const freeze = join(repoRoot, "frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md");
    expect(existsSync(closure)).toBe(true);
    expect(existsSync(thaw)).toBe(true);
    expect(existsSync(filterFreeze)).toBe(true);
    const closureSrc = readFileSync(closure, "utf8");
    expect(closureSrc).toContain("ACTIVE · FROZEN");
    expect(closureSrc).toContain("MARKET-UI-THAW.md");
    expect(closureSrc).toContain("marketGuideFilterQuery");
    const thawSrc = readFileSync(thaw, "utf8");
    expect(thawSrc).toContain("CLOSED");
    expect(thawSrc).toContain("MARKET-L5-CLOSURE");
    expect(thawSrc).toContain("MARKET-FILTER-SORT-UI-FREEZE");
    expect(thawSrc).toContain("NEXT_PUBLIC_MARKET_DEV_VARIETY=1");
    expect(thawSrc).toContain("data-tt-market-l5");
    expect(thawSrc).toContain('data-tt-market-ui-thaw="closed"');
    const freezeSrc = readFileSync(freeze, "utf8");
    expect(freezeSrc).toContain("MARKET-UI-THAW.md");
    expect(freezeSrc).toContain("冻结（2026-05-30）");
  });

  it("page exposes L5 markers with thaw closed and home ambient layers", () => {
    const page = readFileSync(join(repoRoot, "frontend/app/market/MarketPageClient.tsx"), "utf8");
    expect(page).toContain('data-tt-market-l5="1"');
    expect(page).toContain('data-tt-market-ui-thaw="closed"');
    expect(page).toContain('data-tt-market-filter-sort-frozen="1"');
    expect(page).toContain('data-tt-market-favorites-mode="localstorage-f020-sync-v1"');
    expect(page).toContain("TT_MARKETING_HOME_DOT_GRID");
    expect(page).toContain("TT_MARKETING_MARKET_L5_PAGE_MAX");
    expect(page).toContain("bg-experience-landing-vignette");
    expect(page).toContain("MarketFlowContextBanner");
  });

  it("filter-sort band SSOT wires summary reset and URL query module", () => {
    const page = readFileSync(join(repoRoot, "frontend/app/market/MarketPageClient.tsx"), "utf8");
    const band = readFileSync(join(repoRoot, "frontend/components/market/MarketMainFilterBand.tsx"), "utf8");
    const hook = readFileSync(join(repoRoot, "frontend/components/market/useMarketPage.ts"), "utf8");
    expect(page).toContain("MarketMainFilterBand");
    expect(page).toContain("onResetFilters={data.resetFilters}");
    expect(band).toContain("MarketTravelFilterSummaryStrip");
    expect(band).toContain('data-tt-market-filter-band="frozen"');
    expect(hook).toContain("MARKET_PAGE_SORT_QUERY");
    expect(hook).toContain("MARKET_PAGE_FILTER_EXPANDED_QUERY");
  });

  it("flow context banner uses lighter L5 flow strip with accent count", () => {
    const banner = readFileSync(
      join(repoRoot, "frontend/components/market/MarketFlowContextBanner.tsx"),
      "utf8",
    );
    expect(banner).toContain('data-testid="market-flow-context-banner"');
    expect(banner).toContain("TT_MARKETING_MARKET_L5_FLOW_BANNER_FRAME");
    expect(banner).toContain("TT_MARKETING_MARKET_L5_FLOW_BANNER_TITLE");
    expect(banner).toContain("TT_MARKETING_MARKET_L5_FLOW_BANNER_COUNT");
    expect(banner).toContain("tt-market-l5-banner-count");
    expect(banner).toContain("TT_MARKETING_BTN_SECONDARY_HOME_MARKET");
  });

  it("hero and footer align with home L5", () => {
    const hero = readFileSync(join(repoRoot, "frontend/components/market/MarketPageHero.tsx"), "utf8");
    expect(hero).toContain("TT_MARKETING_HOME_HERO_TITLE");
    expect(hero).toContain("TT_MARKETING_MARKET_L5_HERO_FRAME");
    const footer = readFileSync(join(repoRoot, "frontend/components/market/MarketPageFooter.tsx"), "utf8");
    expect(footer).toContain("LandingFooter");
    expect(footer).toContain("TT_MARKETING_HOME_FOOTER_TOP_FADE");
  });

  it("cards use warm L5 list frame when glass", () => {
    for (const file of ["OrderCard.tsx", "GuideCard.tsx"]) {
      const src = readFileSync(join(repoRoot, "frontend/components/market", file), "utf8");
      expect(src, file).toContain("TT_MARKETING_MARKET_L5_LIST_CARD_FRAME");
      expect(src, file).toContain("TT_MARKETING_MARKET_L5_LIST_CARD_INNER");
    }
  });

  it("empty state uses L5 frame and readable catalog note", () => {
    const empty = readFileSync(join(repoRoot, "frontend/components/market/EmptyState.tsx"), "utf8");
    expect(empty).toContain("TT_MARKETING_MARKET_L5_EMPTY_FRAME");
    expect(empty).toContain('data-testid="market-empty-l5"');
    expect(empty).toContain("market_empty_catalog_note");
    expect(empty).toContain("text-[#c9c2bc]/95");
  });

  it("contrast helpers exist in marketingUi and globals", () => {
    const ui = readFileSync(join(repoRoot, "frontend/lib/marketingUi.ts"), "utf8");
    expect(ui).toContain("tt-market-l5-cta-link");
    expect(ui).toContain("filterHintGlass");
    const css = readFileSync(join(repoRoot, "frontend/app/globals.css"), "utf8");
    expect(css).toContain('[data-tt-market-l5="1"]');
    expect(css).toContain("tt-market-l5-cta-link");
  });

  it("split view guides column scrolls with page (no inner aside scroll)", () => {
    const content = readFileSync(join(repoRoot, "frontend/components/market/MarketContent.tsx"), "utf8");
    expect(content).toContain('id="market-guides-section"');
    expect(content).not.toContain("TT_MARKETING_MARKET_GUIDES_ASIDE_STICKY_CLASS");
    expect(content).not.toMatch(/lg:overflow-y-auto/);
  });

  it("market page wires filteredOrders and view-sort SSOT", () => {
    const page = readFileSync(join(repoRoot, "frontend/app/market/MarketPageClient.tsx"), "utf8");
    const content = readFileSync(join(repoRoot, "frontend/components/market/MarketContent.tsx"), "utf8");
    const sortBar = readFileSync(join(repoRoot, "frontend/components/market/MarketContentViewSortBar.tsx"), "utf8");
    expect(page).toContain("filteredOrders={data.filteredOrders}");
    expect(page).not.toMatch(/filteredOrders=\{data\.sortedOrders\}/);
    expect(content).toContain("MarketContentViewSortBar");
    expect(sortBar).toContain('role="radio"');
  });

  it("StickyFilterBar uses a11y pressed state and country all chip", () => {
    const bar = readFileSync(join(repoRoot, "frontend/components/market/StickyFilterBar.tsx"), "utf8");
    expect(bar).toContain("aria-pressed");
    expect(bar).toContain("filter_country_all");
    expect(bar).toContain("filterExpanded");
  });

  it("useMarketPage guides list uses marketGuideFilterQuery SSOT", () => {
    const hook = readFileSync(join(repoRoot, "frontend/components/market/useMarketPage.ts"), "utf8");
    expect(hook).toContain("buildMarketGuideListApiParams");
    expect(hook).toContain("guideMatchesMarketAdvancedFilters");
    expect(hook).toContain("hasMarketGuideListFilters");
    expect(hook).toContain("loadMoreGuides");
    expect(hook).toContain("GUIDES_PAGE_SIZE");
  });

  it("market mock detail fallback is opt-in only", () => {
    const src = readFileSync(join(repoRoot, "frontend/lib/marketMockDetailFallback.ts"), "utf8");
    expect(src).toContain("NEXT_PUBLIC_MARKET_MOCK_DETAIL");
    const model = readFileSync(join(repoRoot, "frontend/components/market/marketContentModel.ts"), "utf8");
    expect(model).toContain("isMarketMockDetailFallbackEnabled");
  });

  it("dev variety orders are opt-in only", () => {
    const src = readFileSync(join(repoRoot, "frontend/lib/marketDevVarietyOrders.ts"), "utf8");
    expect(src).toContain("isMarketDevVarietyEnabled");
    expect(src).toContain("NEXT_PUBLIC_MARKET_DEV_VARIETY");
  });
});
