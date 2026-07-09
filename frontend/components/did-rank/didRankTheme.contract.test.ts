import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TT_MARKETING_DID_RANK_TAB_ACTIVE } from "@/lib/marketingUi";

const root = join(import.meta.dirname);

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("did-rank theme V1 (contract)", () => {
  it("DidRankRouteAmbientDecor uses premium backdrop resolver (V2)", () => {
    const src = read("DidRankRouteAmbientDecor.tsx");
    expect(src).toContain("resolveDidRankBackdropSurface");
    expect(src).toContain("data-tt-did-rank-dark-surface");
  });

  it("DidRankHeader period tabs use matte DID_RANK_PERIOD_TAB_* (PR-F)", () => {
    const src = read("DidRankHeader.tsx");
    expect(src).toContain("TT_MARKETING_DID_RANK_PERIOD_TAB_ACTIVE");
    expect(src).not.toContain("TT_MARKETING_ACTION_PERIOD_TAB_ACTIVE");
    expect(src).not.toContain("bg-cta-gradient");
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toMatch(/DID_RANK_PERIOD_TAB_ACTIVE[\s\S]*?bg-ref-sun\/10/);
  });

  it("DidRankBoardShell uses TT_MARKETING_DID_RANK_TAB_*", () => {
    const src = read("DidRankBoardShell.tsx");
    expect(src).toContain("TT_MARKETING_DID_RANK_TAB_ACTIVE");
    expect(src).toContain("TT_MARKETING_DID_RANK_TAB_IDLE");
  });

  it("DidRankBoardShell exposes five spine tabs including itinerary (P1-DR-02)", () => {
    const src = read("DidRankBoardShell.tsx");
    expect(src).toContain('"itinerary"');
    expect(src).toContain("did-rank-board-panel-");
    expect(src).toContain("didRank_itineraryRankShort");
  });

  it("DidRankHeader page title uses TT_MARKETING_DID_RANK_PAGE_H1 SSOT", () => {
    const src = read("DidRankHeader.tsx");
    expect(src).toContain("TT_MARKETING_DID_RANK_PAGE_H1");
    expect(src).not.toMatch(/via-ref-coral to-ref-sun/);
  });

  it("rank section headings use TT_MARKETING_DID_RANK_SECTION_TITLE", () => {
    expect(read("ItineraryRankBlock.tsx")).toContain("TT_MARKETING_DID_RANK_SECTION_TITLE");
    expect(read("DidRankPrizePoolSection.tsx")).toContain("TT_MARKETING_DID_RANK_SECTION_TITLE");
  });

  it("marketingUi DID_RANK_TAB_ACTIVE uses matte hub-style fill (PR-C)", () => {
    expect(TT_MARKETING_DID_RANK_TAB_ACTIVE).toContain("bg-ref-sun/12");
    expect(TT_MARKETING_DID_RANK_TAB_ACTIVE).not.toContain("TT_MARKETING_ACTION_GRADIENT_FILL");
  });

  it("DidRankFetchErrorBanner retry uses market primary CTA", () => {
    const src = read("DidRankFetchErrorBanner.tsx");
    expect(src).toContain("TT_MARKETING_BTN_MARKET_PRIMARY");
  });

  it("Top3 styles rank 1 uses ref-sun not ref-cyan", () => {
    const src = read("itineraryRankBlockTop3Styles.ts");
    expect(src).toContain("border-ref-sun");
    expect(src).not.toContain("border-ref-cyan/58");
  });

  it("ItineraryRankBlock imports shared Top3 styles", () => {
    const src = read("ItineraryRankBlock.tsx");
    expect(src).toContain("itineraryRankBlockTop3Styles");
    expect(src).not.toMatch(/const ITIN_TOP3_STYLE/);
  });

  it("TravelerRankBlock pagination uses TT_MARKETING_DID_RANK_PAGINATION_BTN", () => {
    const src = read("TravelerRankBlock.tsx");
    expect(src).toContain("TT_MARKETING_DID_RANK_PAGINATION_BTN");
    expect(src).not.toContain("border-cyan-500/30");
  });

  it("rank blocks use DidRankTop10Grid podium layout and compact 11-100 empty", () => {
    expect(read("TravelerRankBlock.tsx")).toContain("DidRankTop10Grid");
    expect(read("GuideRankBlock.tsx")).toContain("DidRankTop10Grid");
    expect(read("DidRankFullListFold.tsx")).toContain("emptyPanelCompact");
    expect(read("DidRankTop10Grid.tsx")).toContain("framer-motion");
    expect(read("DidRankTop10Grid.tsx")).toContain("didRankPodiumColumnClass");
    expect(read("DidRankTop10Grid.tsx")).toContain("LayoutGroup");
    expect(read("DidRankTop10Grid.tsx")).toContain("top10StageShell");
    expect(read("TravelerRankBlock.tsx")).toContain("DidRankRankDeltaBadge");
    expect(read("TravelerRankBlock.tsx")).toContain("refTopTenCardTier");
    expect(read("TravelerRankBlock.tsx")).toContain("didRank_podiumBandLabel");
    expect(read("DidRankFullListFold.tsx")).toContain("fullListFoldDisclosure");
    expect(read("TravelerRankBlock.tsx")).not.toContain("🏆");
  });

  it("traveler and guide blocks fade on period change", () => {
    expect(read("TravelerRankBlock.tsx")).toContain("DidRankPeriodFade");
    expect(read("GuideRankBlock.tsx")).toContain("DidRankPeriodFade");
    expect(read("TravelerRankBlock.tsx")).toContain("DidRankFullListFold");
    expect(read("GuideRankBlock.tsx")).toContain("DidRankFullListFold");
  });

  it("rank list rows use zebra surface helper", () => {
    expect(read("TravelerRankBlockRow.tsx")).toContain("didRankRankRowSurfaceClass");
    expect(read("GuideRankBlockRow.tsx")).toContain("didRankRankRowSurfaceClass");
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toContain("rankListStickyHeader");
    expect(ui).toContain("rankRowZebraEven");
  });

  it("DidRankGuideModal uses warm shell tokens", () => {
    const src = read("DidRankGuideModal.tsx");
    expect(src).toContain("TT_MARKETING_DID_RANK_PATH.modalShell");
    expect(src).not.toContain("border-fuchsia-500/40");
  });

  it("DidRankRecordModal uses warm shell and market primary CTA", () => {
    const src = read("DidRankRecordModal.tsx");
    expect(src).toContain("recordModalShell");
    expect(src).toContain("TT_MARKETING_BTN_MARKET_PRIMARY");
    expect(src).not.toContain("border-cyan-500/40");
    expect(src).not.toMatch(/bg-slate-900\/95/);
  });

  it("app did-rank page delegates to DidRankPageClient + DidRankPageInner", () => {
    const src = readFileSync(join(root, "../../app/did-rank/page.tsx"), "utf8");
    const client = readFileSync(join(root, "../../app/did-rank/DidRankPageClient.tsx"), "utf8");
    expect(src).toContain("DidRankPageClient");
    expect(client).toContain("DidRankPageInner");
    expect(src).not.toMatch(/border-cyan-400\/55/);
  });

  it("DidRankPrizePoolSection uses warm surface tokens", () => {
    const src = read("DidRankPrizePoolSection.tsx");
    expect(src).toContain("TT_MARKETING_DID_RANK_SURFACE");
    expect(src).toContain("prizePoolShell");
    expect(src).toContain("prizePoolMetric");
    expect(src).not.toMatch(/rgba\(217,\s*70,\s*239/);
  });

  it("DidRankBoardShell inner panel uses warm boardInner token", () => {
    const src = read("DidRankBoardShell.tsx");
    expect(src).toContain("boardInner");
    expect(src).not.toMatch(/border-white\/10/);
    expect(src).not.toMatch(/overflow-y-auto/);
    expect(src).not.toMatch(/absolute inset-0/);
  });

  it("full rank list expands with page scroll (no inner max-height scroll)", () => {
    const src = read("DidRankFullRankList.tsx");
    expect(src).not.toMatch(/max-h-\[/);
    expect(src).not.toMatch(/overflow-y-auto/);
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toMatch(/boardInner:[\s\S]*?bg-ink-900\/25/);
    expect(ui).not.toMatch(/min-h-\[min\(520px,72vh\)\]/);
  });

  it("full rank list uses warm listPanel via DidRankFullRankList", () => {
    const list = read("DidRankFullRankList.tsx");
    expect(list).toContain("listPanel");
    expect(read("DidRankFullListFold.tsx")).toContain("DidRankFullRankList");
    expect(read("TravelerRankBlock.tsx")).toContain("listNavFooter");
    expect(list).not.toMatch(/bg-slate-900\/30/);
    expect(list).not.toMatch(/ring-white\/5/);
  });

  it("rank rows use rankRow surface via didRankRankRowSurfaceClass", () => {
    const src = read("TravelerRankBlockRow.tsx");
    expect(src).toContain("didRankRankRowSurfaceClass");
    expect(src).not.toMatch(/hover:bg-white\/\[0\.04\]/);
  });

  it("ItineraryRankSkeleton uses ink skeleton pulse", () => {
    const src = read("ItineraryRankSkeleton.tsx");
    expect(src).toContain("skeletonPulse");
    expect(src).not.toMatch(/bg-slate-600/);
  });

  it("DidRankPageInner uses 224-D compact page stack (D5)", () => {
    const src = readFileSync(join(root, "../../app/did-rank/DidRankPageInner.tsx"), "utf8");
    expect(src).toContain("TT_MARKETING_DID_RANK_PAGE_INNER");
    expect(src).toContain("TT_MARKETING_DID_RANK_PREBOARD_STACK");
  });

  it("marketingUi did-rank uses combined preboard shell and matte board tabs (PR-C)", () => {
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toContain("TT_MARKETING_DID_RANK_PREBOARD_SHELL");
    expect(ui).toMatch(/TT_MARKETING_DID_RANK_BOARD_SHELL =\s*\n\s*`[^`]*TT_MARKETING_DARK_ROUTE_PANEL_L5/);
    expect(ui).toMatch(/prizePoolShell:[\s\S]*?border-ref-sun\/12/);
    expect(ui).toContain("prizePoolMetric");
    expect(ui).toMatch(/listPanel:[\s\S]*?border-ref-sun\/14/);
  });

  it("DidRankPageInner wraps prize and header in preboard shell", () => {
    const src = readFileSync(join(root, "../../app/did-rank/DidRankPageInner.tsx"), "utf8");
    expect(src).toContain("TT_MARKETING_DID_RANK_PREBOARD_SHELL");
    expect(src).toContain("DidRankPrizePoolSection");
    expect(src).toContain("DidRankHeader");
  });

  it("marketingUi did-rank PR-F removes nested main panel box", () => {
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toMatch(/DID_RANK_MAIN_PANEL = "overflow-hidden motion-sub min-h-0"/);
    expect(ui).toMatch(/rankCard:[\s\S]*?border-0/);
    expect(ui).toContain("prizePoolMetric");
    expect(ui).toContain("emptyPanelL5");
    expect(ui).toContain("skeletonBoardInner");
  });

  it("DidRankSkeleton uses podium-isomorphic DidRankTop10Skeleton", () => {
    expect(read("DidRankSkeleton.tsx")).toContain("DidRankTop10Skeleton");
    expect(read("DidRankTop10Skeleton.tsx")).toContain("PODIUM_RANKS");
    expect(read("DidRankTop10Skeleton.tsx")).toContain("top10StageShell");
    expect(read("DidRankSkeleton.tsx")).toContain("skeletonBoardInner");
  });

  it("deep link ?me= auto-scroll and secondary deep link wired", () => {
    expect(readFileSync(join(root, "../../app/did-rank/useDidRankPage.ts"), "utf8")).toContain(
      "useDidRankDeepLinkAutoScroll",
    );
    expect(readFileSync(join(root, "../../app/did-rank/useDidRankPage.ts"), "utf8")).toContain(
      "parseDidRankMeHighlight",
    );
    expect(read("ProviderRankBlock.tsx")).toContain("useDidRankSecondaryDeepLink");
    expect(read("ProviderRankBlock.tsx")).toContain("DidRankSecondaryRankListBody");
    expect(read("AcquisitionRankBlock.tsx")).toContain("DidRankSecondaryRankListBody");
    expect(read("DidRankSecondaryRankBlockRow.tsx")).toContain("${board}-row-");
    expect(read("TravelerRankBlock.tsx")).toContain("traveler-top10-");
    expect(read("GuideRankBlock.tsx")).toContain("guide-top10-");
    expect(read("TravelerRankBlock.tsx")).toContain("DidRankPodiumCrown");
    expect(read("TravelerRankBlock.tsx")).toContain("DID_RANK_AVATAR_PODIUM_BOX");
    expect(read("GuideRankBlock.tsx")).toContain("DID_RANK_AVATAR_PODIUM_BOX");
  });

  it("L5 share link copy and podium record CTA tokens", () => {
    expect(read("TravelerRankBlock.tsx")).toContain("DidRankCopyRankLink");
    expect(read("TravelerRankBlock.tsx")).toContain("rankPodiumRecordBtn");
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toContain("shareRankLinkBtn");
    expect(readFileSync(join(root, "../../lib/didRankPodiumStage.ts"), "utf8")).toContain(
      "animate-did-rank-champion-glow",
    );
    const css = readFileSync(join(root, "../../app/globals.css"), "utf8");
    expect(css).toContain("did-rank-champion-glow");
    expect(read("DidRankPrizePoolSection.tsx")).not.toMatch(/🏆/);
  });

  it("L5 motion pack: top3 glow, prize shimmer, modals, preboard stagger", () => {
    expect(read("DidRankTop10Grid.tsx")).toContain("didRankTop3GlowLayerClass");
    expect(read("DidRankTop10Grid.tsx")).toContain("rankCardTextCrisp");
    expect(read("DidRankTop10Grid.tsx")).toContain("refreshFlashKey");
    expect(read("TravelerRankBlock.tsx")).toContain("DidRankFullListRowEnter");
    expect(read("TravelerRankBlock.tsx")).toContain("useDidRankRefreshFlash");
    expect(read("DidRankPrizePoolSection.tsx")).toContain("prizePoolMetricBorderGlow");
    expect(read("DidRankPrizePoolSection.tsx")).toContain("prizePoolMetricShimmer");
    expect(read("DidRankPrizePoolAmount.tsx")).toContain("replayKey");
    expect(read("DidRankRecordModal.tsx")).toContain("DidRankModalMotion");
    expect(read("DidRankGuideModal.tsx")).toContain("DidRankModalMotion");
    expect(readFileSync(join(root, "../../app/did-rank/DidRankPageInner.tsx"), "utf8")).toContain(
      "DidRankPreboardEnter",
    );
    const css = readFileSync(join(root, "../../app/globals.css"), "utf8");
    expect(css).toContain("animate-did-glow-sun");
    expect(css).toContain("did-rank-prize-shimmer");
    expect(css).toContain("did-rank-highlight-pulse");
    expect(css).toContain("did-rank-row-enter");
    expect(css).toContain("did-rank-prize-border-glow");
    expect(css).toContain("did-rank-top10-refresh-flash");
  });

  it("provider and acquisition use L5 placeholder empty", () => {
    expect(read("ProviderRankBlock.tsx")).toContain("DidRankBoardPlaceholderEmpty");
    expect(read("AcquisitionRankBlock.tsx")).toContain("DidRankBoardPlaceholderEmpty");
    expect(read("AcquisitionRankBlock.tsx")).not.toContain("border-amber-500/25");
  });

  it("secondary boards wire provider/acquisition APIs and my-rank badge", () => {
    expect(read("ProviderRankBlock.tsx")).toContain("useDidRankSecondaryBoard");
    expect(read("ProviderRankBlock.tsx")).toContain("livePollActive");
    expect(read("AcquisitionRankBlock.tsx")).toContain("useDidRankSecondaryBoard");
    expect(read("AcquisitionRankBlock.tsx")).toContain("livePollActive");
    expect(read("DidRankSecondaryBoardList.tsx")).toContain("DidRankSecondaryBoardList");
    expect(read("DidRankSecondaryBoardList.tsx")).toContain("is_me");
    expect(read("DidRankSecondaryBoardList.tsx")).toContain("myRankLabel");
    const api = readFileSync(join(root, "../../lib/api.ts"), "utf8");
    expect(api).toContain("didRankPrizePool:");
    expect(api).toContain("didRankProviders:");
    expect(api).toContain("didRankAcquisitions:");
    expect(readFileSync(join(root, "../../app/did-rank/useDidRankPage.ts"), "utf8")).toContain("useDidRankPrizePool");
    expect(readFileSync(join(root, "../../app/did-rank/useDidRankPage.ts"), "utf8")).toContain("prizePool,");
  });

  it("did-rank route OG image and layout metadataBase", () => {
    expect(readFileSync(join(root, "../../app/did-rank/opengraph-image.tsx"), "utf8")).toContain(
      "DID_RANK_OG_COPY",
    );
    expect(readFileSync(join(root, "../../app/did-rank/layout.tsx"), "utf8")).toContain("getSiteMetadataBase");
  });

  it("prize pool uses count-up amount component", () => {
    expect(read("DidRankPrizePoolSection.tsx")).toContain("DidRankPrizePoolAmount");
    expect(read("DidRankPrizePoolSection.tsx")).toContain("data-tt-did-rank-prize-pool-illustrative");
    expect(read("DidRankPrizePoolAmount.tsx")).toContain("useDidRankCountUp");
  });

  it("board shell shows refresh indeterminate bar", () => {
    expect(read("DidRankBoardShell.tsx")).toContain("DidRankBoardRefreshBar");
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toContain("boardRefreshTrack");
    const css = readFileSync(join(root, "../../app/globals.css"), "utf8");
    expect(css).toContain("animate-did-rank-refresh-bar");
  });

  it("refTopThreeStyles rank 1 uses warm ref-sun not ref-cyan (PR-F)", () => {
    const src = readFileSync(join(root, "../../lib/refTopThreeStyles.ts"), "utf8");
    expect(src).toContain("text-ref-sun");
    expect(src).not.toContain("ref-cyan");
  });

  it("DidRankRouteSuspense and error boundary use premium dark page shell", () => {
    const suspense = read("DidRankRouteSuspense.tsx");
    expect(suspense).toContain("resolveDidRankBackdropSurface");
    expect(suspense).toContain("darkRoutePageShellClass");
    expect(suspense).not.toContain("bg-[#14100d]");

    const err = readFileSync(join(root, "../../app/did-rank/error.tsx"), "utf8");
    expect(err).toContain("TT_MARKETING_DARK_ROUTE_PANEL_L5");
    expect(err).toContain("DidRankRouteAmbientDecor");
    expect(err).not.toContain("bg-slate-950");
  });

  it("Phase ① freeze marker and P1-DR data-chain closure (2026-06-03)", () => {
    const inner = readFileSync(join(root, "../../app/did-rank/DidRankPageInner.tsx"), "utf8");
    expect(inner).toContain('data-tt-did-rank-phase1-frozen="1"');

    const guideModal = read("DidRankGuideModal.tsx");
    expect(guideModal).not.toMatch(/href=\{`\/guides\//);
    expect(guideModal).toContain("isDidRankCommunityProfileId");

    const utils = readFileSync(join(root, "../../lib/didRankUtils.ts"), "utf8");
    expect(utils).toContain("isDidRankDevPreviewId");
    expect(utils).toContain("buildDidRankItineraryHighlightSearch");

    expect(read("TravelerRankBlock.tsx")).toContain("didRank_fullList11_100");
    expect(read("GuideRankBlock.tsx")).toContain("didRank_fullList11_100");
    expect(read("GuideRankBlock.tsx")).toContain("DidRankGuideSortControls");
    expect(inner).toContain("DidRankItineraryRankBlock");
    expect(read("DidRankItineraryRankBlock.tsx")).toContain("DidRankFetchErrorBanner");
    expect(read("ItineraryRankBlock.tsx")).toContain("DidRankRankDeltaBadge");
    expect(read("ItineraryRankBlock.tsx")).toContain("data-did-rank-itinerary-id");
    expect(read("useDidRankDeepLinkAutoScroll.ts")).toContain("scrollToItineraryRank");
    expect(read("DidRankTop10JsonLd.tsx")).toContain("DID_RANK_MAIN_BOARD_API_MAX");

    expect(read("ProviderRankBlock.tsx")).toContain("DidRankFetchErrorBanner");
    expect(read("ProviderRankBlock.tsx")).toContain("fetchError");
    expect(read("AcquisitionRankBlock.tsx")).toContain("DidRankFetchErrorBanner");

    expect(read("DidRankSecondaryRankListBody.tsx")).toMatch(/useEffect\([\s\S]*setPage\(1\)/);
    expect(read("DidRankPrizePoolSection.tsx")).toContain("data-tt-did-rank-prize-pool-illustrative");
    expect(read("DidRankPrizePoolSection.tsx")).toContain("data-tt-did-rank-prize-pool-api-connected");
  });
});
