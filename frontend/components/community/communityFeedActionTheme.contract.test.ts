import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TT_MARKETING_DARK_ROUTE_DESKTOP_HEADER_COMMUNITY_PREMIUM } from "@/lib/marketingUi";

const root = join(import.meta.dirname);

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("community Feed Action SSOT (site theme V1 §1.7 · contract)", () => {
  it("CommunityFeedHeader is mobile-only toolbar; desktop lead lives in FeedMain", () => {
    const header = read("CommunityFeedHeader.tsx");
    expect(header).toContain("TT_COMMUNITY_FEED_ACTION.headerToolbarMobile");
    expect(header).not.toContain("headerLeadDesktop");
    const main = read("CommunityFeedMain.tsx");
    expect(main).toContain("CommunityFeedDesktopLead");
    expect(read("CommunityFeedDiscoveryChrome.tsx")).toContain("discoveryChrome");
    expect(read("CommunityFeedDiscoveryChrome.tsx")).toContain("community-feed-publish-entry");
    expect(read("CommunityFeedComposerBlock.tsx")).toContain("feedComposerShell");
    expect(read("CommunityFeedComposerBlock.tsx")).toContain("feedComposerDividerV");
    expect(read("CommunityFeedComposerBlock.tsx")).not.toContain("composerSearchRow");
    expect(header).not.toMatch(/from-cyan-300 via-cyan-400 to-fuchsia/);
    expect(header).not.toContain("border-cyan-400/40");
  });

  it("CommunityFeedFilterBar uses warm feed tabs and filter chips", () => {
    const src = read("CommunityFeedFilterBar.tsx");
    expect(src).toContain("TT_COMMUNITY_FEED_ACTION.feedTabActive");
    expect(src).toContain("filterChipActive");
    expect(src).not.toContain("feedTabUnderline");
    expect(src).not.toContain("border-cyan-400/60");
    expect(src).not.toContain("border-fuchsia-400/60");
  });

  it("marketingUi feedTabActive uses underline premium (no solid gradient tab)", () => {
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toMatch(/feedTabActive:\s*\n\s*"[^"]*border-b-2 border-ref-sun/);
    expect(ui).not.toMatch(/feedTabActive:\s*\n\s*"[^"]*TT_MARKETING_ACTION_GRADIENT_FILL/);
  });

  it("marketingUi feed sort uses underline; filter chip uses muted outline", () => {
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toContain("TT_COMMUNITY_FEED_CHIP_ACTIVE_MUTED");
    expect(ui).toMatch(/sortChipActive:\s*\n\s*"[^"]*border-b-2 border-ref-sun/);
    expect(ui).toMatch(/filterChipActive:\s*TT_COMMUNITY_FEED_CHIP_ACTIVE_MUTED/);
    const emptyCta = ui.match(/emptyPrimaryCta:\s*\n\s*"([^"]+)"/);
    expect(emptyCta?.[1]).toContain("border-ref-sun/35");
    expect(emptyCta?.[1]).not.toContain("gradient");
  });

  it("CommunityFeedCard uses warm feed card chrome", () => {
    const src = read("CommunityFeedCard.tsx");
    expect(src).toContain("TT_COMMUNITY_FEED_ACTION.feedCard");
    expect(src).not.toContain("border-cyan-500/30");
    expect(src).not.toContain("border-fuchsia-500/20");
  });

  it("marketingUi premium feed tokens use matte borders and #0a0a0a focus offset", () => {
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toContain("TT_COMMUNITY_FOCUS_RING_OFFSET");
    expect(ui).toContain("TT_COMMUNITY_FEED_PANEL_L5");
    expect(ui).toContain("TT_COMMUNITY_FEED_L5");
    expect(ui).toMatch(/feedCard:\s*\n\s*"[^"]*border-ref-sun\/16/);
    expect(ui).not.toMatch(/feedCard:\s*\n\s*"[^"]*shadow-scifi-panel/);
    expect(ui).toContain("TT_COMMUNITY_FEED_LAYOUT");
  });

  it("PublishDrawerFooter submit uses warm publishSubmit token", () => {
    const src = read("PublishDrawer/PublishDrawerFooter.tsx");
    expect(src).toContain("TT_COMMUNITY_FEED_ACTION.publishSubmit");
    expect(src).not.toContain("border-fuchsia-400/70");
  });

  it("CommunityFeedDesktopAside uses warm aside shell tokens", () => {
    const src = read("CommunityFeedDesktopAside.tsx");
    expect(src).toContain("TT_COMMUNITY_FEED_ACTION.asideShell");
    expect(src).toContain("TT_COMMUNITY_FEED_ACTION.asideDestList");
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toContain("asideRail:");
    expect(ui).toMatch(/asideShell:\s*\n\s*"[^"]*bg-transparent/);
    expect(ui).toMatch(/asideDestRowActive:[\s\S]*border-l-ref-sun/);
    expect(src).not.toContain("border-slate-600/50");
  });

  it("CommunityFeedMain hides fixed publish FAB on desktop (aside not blocked)", () => {
    const main = read("CommunityFeedMain.tsx");
    expect(main).toMatch(/fixed right-4 bottom-24[\s\S]*?md:hidden/);
    expect(read("CommunityFeedMainPageChrome.tsx")).toContain("md:hidden");
  });

  it("marketingUi community L1 desktop is static; aside sticky uses L0 only", () => {
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toContain("TT_MARKETING_COMMUNITY_DESKTOP_STICKY_STACK_TOP");
    expect(TT_MARKETING_DARK_ROUTE_DESKTOP_HEADER_COMMUNITY_PREMIUM).toMatch(
      /^hidden md:block relative z-\[240\]/
    );
    expect(ui).toMatch(/lg:top-\[calc\(4\.75rem\+env\(safe-area-inset-top/);
    expect(ui).toMatch(/md:static md:z-auto/);
    expect(read("CommunityFeedMain.tsx")).toContain("CommunityFeedDesktopLead");
  });

  it("Feed desktop uses L5 grid + discovery chrome + static tab bar", () => {
    const main = read("CommunityFeedMain.tsx");
    expect(main).toContain("TT_COMMUNITY_FEED_DESKTOP_GRID");
    expect(main).toContain("TT_COMMUNITY_FEED_ASIDE_GRID_CELL");
    expect(main).toContain("TT_COMMUNITY_FEED_MAIN_GRID_CELL");
    expect(main).toContain("CommunityFeedDiscoveryChrome");
    expect(main).toContain("CommunityFeedList");
    expect(main).not.toContain("CommunityFeedPromoDualRow");
    expect(main).not.toContain("lg:flex-row");
    expect(main).not.toMatch(/fixed bottom-0 left-0 right-0/);
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toContain("discoveryChrome");
    expect(ui).toContain("discoverySearchRow");
    expect(ui).toContain("masonryCardShell");
    expect(ui).toContain("promoMasonrySlot");
    expect(ui).toContain("discoverySearchShell");
    expect(ui).toContain("discoveryQuickDestChip");
    expect(ui).toContain("feedHeroRow");
    expect(ui).toMatch(/lg:row-span-2/);
    expect(ui).toMatch(/md:static md:z-auto/);
    expect(ui).toContain("feedComposerShell: `${TT_COMMUNITY_FEED_PANEL_L5}`");
    expect(read("CommunityFeedComposerBlock.tsx")).toContain("composerFormWrap");
  });

  it("Feed main column and empty state use premium layout SSOT", () => {
    expect(read("CommunityFeedMain.tsx")).toContain("CommunityFeedDesktopLead");
    expect(read("CommunityFeedMain.tsx")).toContain("TT_COMMUNITY_FEED_MAIN_GRID_CELL");
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toContain("TT_COMMUNITY_FEED_MAIN_GRID_CELL");
    expect(ui).toMatch(/max-w-3xl/);
    expect(read("CommunityFeedList.tsx")).toContain("community_empty_hint");
    expect(read("CommunityFeedList.tsx")).toContain("CommunityFeedEmptyFooter");
    expect(read("CommunityFeedFilterBar.tsx")).toContain("filterToggleWrap");
    expect(read("CommunityFeedDiscoveryChrome.tsx")).toContain("discoveryFilterMoreBtn");
  });

  it("Header L0 right cluster on /community matches homepage dark chrome SSOT", () => {
    const header = readFileSync(join(root, "../Header.tsx"), "utf8");
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(header).toContain("variant={headerUtilityVariant}");
    expect(header).toContain("headerUtilityVariantForPathname");
    expect(ui).toContain("TT_MARKETING_HEADER_UTILITY_BTN_COMMUNITY = TT_MARKETING_HEADER_LANG_BTN_DARK");
    expect(ui).toContain("TT_MARKETING_REGISTER_PILL_COMMUNITY = TT_MARKETING_REGISTER_PILL_WARM");
  });

  it("CommunityFeedMain uses D6 mobile-first-post layout tokens (224-D)", () => {
    expect(read("CommunityFeedMain.tsx")).toContain("TT_MARKETING_COMMUNITY_FEED_PAGE");
    expect(read("CommunityFeedListPostsSection.tsx")).toContain("TT_COMMUNITY_FEED_LAYOUT");
    expect(read("CommunityFeedMasonryGrid.tsx")).toContain("community-feed-first-post");
    expect(read("CommunityFeedList.tsx")).toContain("CommunityFeedMasonryGrid");
    expect(read("CommunityFeedMasonryCard.tsx")).toContain("masonryCardShell");
    expect(read("CommunityFeedMasonryCard.tsx")).toContain("masonryCardMediaShimmer");
    expect(read("CommunityFeedDiscoveryChrome.tsx")).toContain("discoveryFilterRow");
    expect(read("CommunityFeedDiscoveryChrome.tsx")).toContain("discoveryTypeSortRow");
    expect(read("CommunityFeedDiscoveryChrome.tsx")).toContain("discoveryQuickFilterRow");
    expect(read("CommunityFeedMasonryCard.tsx")).toContain("CommunityFeedMasonryLocationPill");
    expect(read("CommunityFeedPromoSlots.tsx")).toContain("promoActivityCard");
    expect(read("CommunityFeedPromoSlots.tsx")).toContain("communityFeedPromoRowViewModel");
    expect(read("communityFeedPromoRowViewModel.ts")).toContain("communityFeedPromoStillThumbSrc");
    expect(read("communityFeedPromoRowViewModel.ts")).toContain("communityFeedPromoActivityHref");
    expect(read("useCommunityFeedFilters.ts")).toContain("communityFeedFilterByProximity");
    expect(read("communityFeedProximity.ts")).toContain("communityFeedEnrichPostsForAnchor");
    expect(read("CommunityFeedDesktopAside.tsx")).toContain("communityFeedHotDestinationRows");
    expect(read("CommunityFeedMasonryGrid.tsx")).toContain("communityFeedMasonryPostsExcludingPromoPreview");
    expect(read("communityFeedPromoMedia.ts")).toContain("communityFeedPromoPostHref");
    expect(read("CommunityFeedPromoSlots.tsx")).toContain("CommunityFeedPromoThumb");
    expect(read("CommunityFeedDesktopAside.tsx")).toContain("CommunityFeedPromoThumb");
    expect(read("CommunityFeedMasonryCard.tsx")).toContain("masonryLikeBurst");
    expect(read("CommunityFeedMasonryCard.tsx")).toContain("onDoubleClick");
    expect(read("CommunityFeedDiscoveryChrome.tsx")).toContain("discoveryChipMotion");
    expect(read("CommunityFeedMasonryGrid.tsx")).toContain("CommunityFeedPromoLeadBand");
    expect(read("CommunityFeedMasonryGrid.tsx")).toContain("promoMasonryInflow");
    expect(read("CommunityFeedMasonryCard.tsx")).toContain("communityFeedMasonryCardViewModel");
    expect(read("CommunityFeedMasonryCard.tsx")).toContain("CommunityFeedMasonryAdBadge");
    expect(read("CommunityFeedDiscoveryChrome.tsx")).toContain("community-feed-anchor-poi");
    expect(read("communityFeedPromoRowViewModel.ts")).toContain("communityFeedPromoActivityViewModel");
    expect(read("CommunityFeedMasonryLocationPill.tsx")).toContain("masonryLocationPillSep");
    expect(read("CommunityFeedCardCompact.tsx")).toContain("CommunityFeedMasonryLocationPill");
    expect(read("FeedSkeleton.tsx")).toContain("promoLeadBand");
    expect(read("CommunityFeedList.tsx")).toContain("loadMoreBtn");
    expect(read("CommunityFeedMasonryCard.tsx")).toContain("CommunityFeedMasonryLocationPill");
    expect(read("CommunityFeedDiscoveryChrome.tsx")).toContain("community_discovery_food_chip");
    expect(read("communityFeedPromoRowViewModel.ts")).toContain("community_feed_promo_checkin_badge");
    expect(read("communityFeedDisplayText.ts")).toContain("communityFeedMasonryDisplayTitle");
    expect(read("communityFeedPromoRowViewModel.ts")).toContain("community_feed_promo_hot_badge");
    expect(read("CommunityFeedDiscoveryChrome.tsx")).toContain("CommunityFeedMobileHotStrip");
    expect(read("CommunityFeedMasonryGrid.tsx")).toContain("CommunityFeedMasonryPromoTail");
    expect(read("FeedSkeleton.tsx")).toContain("skeletonPromoActivity");
    expect(read("CommunityFeedList.tsx")).toContain("showPromoSlots");
    expect(read("CommunityFeedHeader.tsx")).toContain("headerExploreRow");
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(read("CommunityFeedMainFeedColumn.tsx")).toContain("TT_COMMUNITY_FEED_LAYOUT.feedColumn");
    expect(read("CommunityFeedMainFeedColumn.tsx")).toContain("CommunityFeedDiscoveryChrome");
    expect(read("useCommunityFeedFilters.ts")).toContain("serverProximityFilterApplied");
    expect(read("useCommunityFeedTabSortAndFeedApi.ts")).toContain("communityFeedGeoQueryFromDiscovery");
    expect(read("useCommunityFeedBootstrapFeedState.ts")).toContain("serverProximityFilterApplied");
    expect(read("../../lib/apiClient/community/feed.ts")).toContain("max_distance_m");
    expect(ui).toContain("columns-2");
    expect(ui).toContain("md:columns-3");
    expect(ui).toContain("grid-cols-2");
    expect(ui).toContain("sm:grid-cols-3");
    expect(ui).not.toContain("2xl:columns-4");
  });

  it("filter summary and mobile toggle use Feed panel SSOT", () => {
    expect(read("CommunityFeedFilterBarSummary.tsx")).toContain("filterSummaryShell");
    expect(read("CommunityFeedFilterBarMobileToggle.tsx")).toContain("filterMobileToggle");
  });

  it("CommunityFeedFilterBar feed error retry uses warm retryPill (225-E)", () => {
    const src = read("CommunityFeedFilterBar.tsx");
    expect(src).toContain("TT_COMMUNITY_FEED_ACTION.retryPill");
    expect(src).not.toContain("bg-cta-gradient");
  });

  it("Feed main-path alert retries use TT_COMMUNITY_FEED_ACTION.retryPill SSOT", () => {
    for (const rel of [
      "CommunityFeedMainPreHeroAlerts.tsx",
      "CommunityFeedMainPostFilterAlerts.tsx",
      "CommunityFeedFilterBarFeedError.tsx",
    ]) {
      const src = read(rel);
      expect(src).toContain("TT_COMMUNITY_FEED_ACTION.retryPill");
      expect(src).not.toMatch(/border-ref-sun\/40 bg-ref-sun\/12 px-4 py-2 text-meta/);
    }
  });

  it("Feed load-more uses TT_COMMUNITY_FEED_L5.loadMoreBtn SSOT", () => {
    for (const rel of ["CommunityFeedListPostsSection.tsx", "CommunityFeedList.tsx"]) {
      expect(read(rel)).toContain("TT_COMMUNITY_FEED_L5.loadMoreBtn");
    }
  });

  it("CommunityLoginModal uses warm login sheet", () => {
    const src = read("CommunityLoginModal.tsx");
    expect(src).toContain("loginModalSheet");
    expect(src).not.toMatch(/bg-slate-900\/95/);
  });

  it("CommunityInteractionSummary uses activityPanelMuted", () => {
    const src = read("CommunityInteractionSummary.tsx");
    expect(src).toContain("activityPanelMuted");
    expect(src).not.toMatch(/border-slate-600\/50/);
  });

  it("CommunityInteractionSummary CTAs use L2/Feed Action SSOT tokens", () => {
    const src = read("CommunityInteractionSummary.tsx");
    expect(src).toContain("TT_COMMUNITY_PAGE_L5.primaryCtaFilled");
    expect(src).toContain("TT_COMMUNITY_FEED_ACTION.retryPill");
    expect(src).toContain("TT_COMMUNITY_PAGE_L5.pill");
    expect(src).not.toMatch(/border-ref-sun\/40 bg-ref-sun\/12 px-4 py-2 text-meta/);
  });

  it("OrderChatContextCard uses warm orderContext shell tokens", () => {
    const src = read("OrderChatContextCard.tsx");
    expect(src).toContain("orderContextShell");
    expect(src).not.toMatch(/border-slate-600/);
    expect(src).not.toMatch(/bg-slate-7/);
  });

  it("orderChatContextCardDerived shell has no cyan border", () => {
    const src = read("orderChatContextCardDerived.ts");
    expect(src).toContain("orderContextShell");
    expect(src).not.toContain("border-cyan-500");
  });

  it("DiscoveryChrome links activity center to /community/activity and uses quick filter helpers", () => {
    const src = read("CommunityFeedDiscoveryChrome.tsx");
    expect(src).toContain('href="/community/activity"');
    expect(src).toContain("community-feed-activity-center");
    expect(src).toContain("/community/explore?scan=1");
    expect(src).toContain("communityFeedDiscoveryQuickFilters");
    expect(src).toContain("applyCommunityDiscoveryProximityFilter");
    expect(src).toContain("applyCommunityDiscoveryStreamTab");
    expect(src).toContain("discoveryTypeSortRow");
    expect(src).toContain("community-feed-destination-mobile");
  });

  it("CommunityFeedMain wires showcase + media capability feed banners", () => {
    const main = read("CommunityFeedMain.tsx");
    expect(main).toContain("CommunityFeedShowcaseNotice");
    expect(main).toContain("CommunityFeedMediaCapabilitiesBanner");
    expect(read("CommunityFeedShowcaseNotice.tsx")).toContain("community_feed_showcase_banner");
    expect(read("CommunityFeedMediaCapabilitiesBanner.tsx")).toContain("community_feed_video_storage_banner");
  });

  it("CommunityFeedCardContent marks showcase posts with muted badges", () => {
    const src = read("CommunityFeedCardContent.tsx");
    expect(src).toContain("postDetailShowcaseBadge");
    expect(src).toContain("isShowcasePostId");
  });

  it("CommunityFeedDiscoveryChrome publish entry shows icon + label on wide screens", () => {
    const src = read("CommunityFeedDiscoveryChrome.tsx");
    expect(src).toContain("discoveryPublishBtnLabel");
    expect(src).toContain("community_publish");
    expect(src).toContain("max-md:hidden");
  });

  it("CommunityFeedDiscoveryChrome collapses dense filter chips on mobile by default", () => {
    const src = read("CommunityFeedDiscoveryChrome.tsx");
    expect(src).toContain("max-md:hidden");
    expect(src).toContain("community_filters_toggle");
  });

  it("CommunityFeedList uses masonry for recommend and following", () => {
    const src = read("CommunityFeedList.tsx");
    expect(src).toContain("CommunityFeedMasonryGrid");
    expect(src).not.toContain("CommunityFeedCardCompact");
  });
});
