import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname);

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

describe("market theme V1 (contract)", () => {
  it("MarketPageHero uses warm market primary pill", () => {
    const src = read("MarketPageHero.tsx");
    expect(src).toContain("TT_MARKETING_BTN_MARKET_PRIMARY_PILL");
    expect(src).toContain("TT_MARKETING_HOME_HERO_TITLE");
    expect(src).not.toMatch(/from-ref-teal\s+via-ref-cyan/);
  });

  it("MarketPageHero escrow pill uses warm ref-sun not cyan accent", () => {
    const src = read("MarketPageHero.tsx");
    expect(src).toContain("border-ref-sun/");
    expect(src).not.toContain("border-ref-cyan/30");
  });

  it("MarketHubSubNav uses TT_MARKETING_MARKET_HUB_NAV_* tokens", () => {
    const src = read("MarketHubSubNav.tsx");
    expect(src).toContain("TT_MARKETING_MARKET_HUB_NAV_SHELL");
    expect(src).toContain("TT_MARKETING_MARKET_HUB_NAV_LINK_ACTIVE");
    expect(src).not.toMatch(/from-ref-teal\/85\s+to-ref-cyan/);
  });

  it("ViewSwitcher glass mode uses hub nav tokens", () => {
    const src = read("ViewSwitcher.tsx");
    expect(src).toContain("TT_MARKETING_MARKET_HUB_NAV_LINK_ACTIVE");
  });

  it("MarketAmbientBackdrop supports premium dark preview flag", () => {
    const src = read("MarketAmbientBackdrop.tsx");
    expect(src).toContain("resolveMarketBackdropSurface");
    expect(src).toContain("WarmRouteFieldBackdrop");
    expect(src).toContain("data-tt-market-dark-surface");
  });

  it("marketingUi market hub L1 uses transparent shell (V2 premium chrome)", () => {
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toContain("TT_MARKETING_MARKET_HUB_NAV_SHELL");
    expect(ui).toMatch(/MARKET_HUB_NAV_SHELL =\s*\n\s*"[^"]*bg-transparent/);
    expect(ui).toContain("TT_MARKETING_HEADER_BAR_MARKET_DARK_PREMIUM");
    expect(ui).toContain("TT_MARKETING_DARK_ROUTE_PAGE_SHELL = TT_MARKETING_DARK_ROUTE_SURFACE.premium.pageShell");
  });

  it("MarketAmbientBackdrop delegates scene tiers to shell decor", () => {
    const src = read("MarketAmbientBackdrop.tsx");
    expect(src).toContain("MarketDarkRouteSceneDecor");
    expect(src).toContain("tier={sceneTier}");
    expect(src).not.toMatch(/via-ref-cyan/);
  });

  it("BookGuideModal primary CTA uses warm market primary token", () => {
    const src = read("BookGuideModal.tsx");
    expect(src).toContain("TT_MARKETING_BTN_MARKET_PRIMARY");
    expect(src).not.toContain("bg-travel-500");
  });

  it("OrderCard glass grab uses warm market primary token", () => {
    const src = read("OrderCard.tsx");
    expect(src).toContain("btnGrabClass = glass");
    expect(src).toMatch(/btnGrabClass = glass[\s\S]*TT_MARKETING_BTN_MARKET_PRIMARY/);
    expect(src).toContain("TT_MARKETING_MARKET_L5_LIST_CARD_FRAME");
  });

  it("GlassSelect uses warm market dark path tokens", () => {
    const src = read("GlassSelect.tsx");
    expect(src).toContain("glassSelectTrigger");
    expect(src).not.toContain("focus-visible:ring-travel-400");
  });

  it("GuideCard glass uses warm market L5 frame without cyan shadow", () => {
    const src = read("GuideCard.tsx");
    expect(src).toContain("TT_MARKETING_MARKET_L5_LIST_CARD_FRAME");
    expect(src).toContain("MarketGuideCover");
    expect(src).toContain("cardInteractive");
    expect(src).not.toMatch(/rgba\(35,\s*206,\s*217/);
    expect(src).not.toContain("ring-ref-cyan");
  });

  it("OrderCard glass uses L5 list card frame", () => {
    const src = read("OrderCard.tsx");
    expect(src).toContain("TT_MARKETING_MARKET_L5_LIST_CARD_FRAME");
    expect(src).toContain("TT_MARKETING_MARKET_L5_LIST_CARD_INNER");
    expect(src).not.toMatch(/rgba\(35,\s*206,\s*217/);
    expect(src).not.toContain("ring-ref-cyan");
  });

  it("EmptyState darkBg uses L5 empty thaw frame", () => {
    const src = read("EmptyState.tsx");
    expect(src).toContain("TT_MARKETING_MARKET_L5_EMPTY_FRAME");
    expect(src).toContain("market-empty-l5");
    expect(src).not.toMatch(/border-white\/25/);
  });

  it("StickyFilterBar glass uses warm filter chips not ref-cyan", () => {
    const src = read("StickyFilterBar.tsx");
    expect(src).toContain("filterChipActiveGlass");
    expect(src).not.toContain("ref-cyan");
  });

  it("BookGuideModal uses glassModalPanel", () => {
    const src = read("BookGuideModal.tsx");
    expect(src).toContain("glassModalPanel");
    expect(src).not.toMatch(/border-white\/25/);
  });

  it("InviteGuideModal uses MarketGlassModalFrame warm shell (D7 · 225-F)", () => {
    const src = read("InviteGuideModal.tsx");
    expect(src).toContain("MarketGlassModalFrame");
    expect(src).toContain("emptyCrossNavLink");
    expect(src).not.toContain("travelFocusRingOffset2Classes");
    expect(src).not.toContain("text-travel-600");
  });

  it("EmptyState light branch uses emptyStateLightCrossNavLink (225-E)", () => {
    const src = read("EmptyState.tsx");
    expect(src).toContain("emptyStateLightCrossNavLink");
    expect(src).not.toContain("text-travel-600");
    expect(src).not.toContain("bg-cta-gradient");
  });

  it("GuideDetailDrawer avatar/price avoid travel-500 cold accent (225-F)", () => {
    const src = read("GuideDetailDrawer.tsx");
    expect(src).toContain("marketDetailDrawerAvatarFallback");
    expect(src).not.toContain("text-travel-500");
  });

  it("MarketHeroFrame default wash has no cyan gradient", () => {
    const src = read("MarketHeroFrame.tsx");
    expect(src).toContain("heroFrameDefault");
    expect(src).not.toMatch(/35,\s*206,\s*217/);
  });

  it("AcquisitionCarryStudioModal uses warm studio tokens not white glass", () => {
    const src = read("AcquisitionCarryStudioModal.tsx");
    expect(src).toContain("studioModalPanelLg");
    expect(src).toContain("studioInput");
    expect(src).not.toMatch(/border-white\/25/);
    expect(src).not.toContain("ref-cyan");
  });

  it("MerchantShowcaseStudioModal uses warm studio tokens not ref-cyan chips", () => {
    const src = read("MerchantShowcaseStudioModal.tsx");
    expect(src).toContain("studioSectionHeading");
    expect(src).toContain("studioChipActive");
    expect(src).not.toContain("text-ref-cyan/90");
    expect(src).not.toContain("border-ref-cyan");
    expect(src).not.toMatch(/border-white\/25/);
  });

  it("CustomItineraryModal uses warm glass modal shell and day pills", () => {
    const src = read("CustomItineraryModal/index.tsx");
    expect(src).toContain("MarketGlassModalFrame");
    expect(src).toContain("customItineraryPillSelected");
    expect(src).toContain("studioModalHeader");
    expect(src).not.toMatch(/border-white\/25/);
    expect(src).not.toContain("ring-travel-400");
  });

  it("MarketSubsiteMasonry card uses warm masonryCard token", () => {
    const src = read("MarketSubsiteMasonry.tsx");
    expect(src).toContain("masonryCard");
    expect(src).not.toContain("ref-cyan");
    expect(src).not.toContain("ring-travel-500");
  });

  it("AcquisitionListingDetailBody escrow CTA uses MarketSubsiteListingOrderCta", () => {
    const src = read("AcquisitionListingDetailBody.tsx");
    expect(src).toContain("MarketSubsiteListingOrderCta");
    expect(src).not.toContain("border-warning");
    expect(src).not.toContain("border-ref-cyan");
  });

  it("MerchantShowcaseDetailBody uses trustTokenPill and L5 escrow panel tokens", () => {
    const src = read("MerchantShowcaseDetailBody.tsx");
    expect(src).toContain("trustTokenPill");
    expect(src).toContain("subsiteEscrowPanel");
    expect(src).toContain("MarketSubsiteListingOrderCta");
    expect(src).not.toContain("border-warning");
  });

  it("MarketSubsiteMasonry meta uses trustTokenPill not warning", () => {
    const src = read("MarketSubsiteMasonry.tsx");
    expect(src).toContain("trustTokenPill");
    expect(src).not.toMatch(/border-warning/);
  });

  it("MarketStandaloneBusinessPage list hero uses subsite frame and trust pills", () => {
    const src = read("MarketStandaloneBusinessPage.tsx");
    expect(src).toContain('MarketHeroFrame variant="subsite"');
    expect(src).toContain("MarketHeroTrustPills");
    expect(src).toContain("MarketSubsiteListFooterStrip");
    expect(src).toMatch(/masonryItems\.length > 0 \? <MarketSubsiteListFooterStrip/);
  });

  it("marketDetailDrawerClasses mobile bottom sheet per 29 §2.2", () => {
    const src = readFileSync(join(root, "marketDetailDrawerClasses.ts"), "utf8");
    expect(src).toContain("max-md:items-end");
    expect(src).toContain("max-md:slide-in-from-bottom");
  });

  it("MarketContent uses warm inset panel tokens and delegates sort bar SSOT", () => {
    const src = read("MarketContent.tsx");
    expect(src).toContain("MarketContentViewSortBar");
    expect(src).toContain("marketGlassInsetPanel");
    expect(src).not.toContain("ref-cyan");
    expect(src).not.toMatch(/border-white\/15/);
    expect(src).toContain("TT_MARKETING_BTN_MARKET_PRIMARY_PILL");
    expect(src).not.toMatch(/apiError[\s\S]{0,900}btn-console/);
  });

  it("BookGuideModal secondary CTAs use market glass not btn-console", () => {
    const src = read("BookGuideModal.tsx");
    expect(src).toContain("TT_MARKETING_BTN_MARKET_GLASS");
    expect(src).not.toMatch(/btn-console/);
  });

  it("MarketContentGuidesSection uses warm market tokens not ref-cyan", () => {
    const src = read("MarketContentGuidesSection.tsx");
    expect(src).toContain("marketGlassInsetPanel");
    expect(src).not.toContain("ref-cyan");
  });

  it("StickyFilterBar glass dividers use filterBarGlassDivider", () => {
    const src = read("StickyFilterBar.tsx");
    expect(src).toContain("filterBarGlassDivider");
    expect(src).not.toMatch(/border-white\/15/);
  });

  it("MarketPageHero uses warm marketHeroShell without cyan wash", () => {
    const src = read("MarketPageHero.tsx");
    expect(src).toContain("marketHeroShell");
    expect(src).not.toMatch(/35,\s*206,\s*217/);
    expect(src).not.toMatch(/border-white\/18/);
  });

  it("MarketPageFooter uses LandingFooter and home footer fade (MARKET-UI-THAW)", () => {
    const src = read("MarketPageFooter.tsx");
    expect(src).toContain("LandingFooter");
    expect(src).toContain("TT_MARKETING_HOME_FOOTER_TOP_FADE");
    expect(src).not.toContain("ProductCrossNav");
  });

  it("MarketContentViewSortBar uses warm sort pills not ref-cyan (TT-PH1-230)", () => {
    const src = read("MarketContentViewSortBar.tsx");
    expect(src).toContain("marketSortPillActive");
    expect(src).toContain("marketSortPillIdle");
    expect(src).not.toContain("ref-cyan");
  });

  it("MarketContentOrdersSection uses warm inset panels and actions (TT-PH1-230)", () => {
    const src = read("MarketContentOrdersSection.tsx");
    expect(src).toContain("marketGlassInsetPanel");
    expect(src).toContain("marketRetryBtn");
    expect(src).toContain("marketLoadMorePill");
    expect(src).not.toContain("ref-cyan");
    expect(src).not.toMatch(/border-white\/15/);
  });

  it("MerchantShowcaseFormCopyPriceEscrow uses warm studio tokens (222-B)", () => {
    const src = read("MerchantShowcaseFormCopyPriceEscrow.tsx");
    expect(src).toContain("studioSectionHeading");
    expect(src).toContain("text-ref-sun");
    expect(src).not.toContain("ref-cyan");
  });

  it("MarketHubSubNav uses warm hub nav tokens (G3)", () => {
    const src = read("MarketHubSubNav.tsx");
    expect(src).toContain("TT_MARKETING_MARKET_HUB_NAV_LINK_ACTIVE");
    expect(src).not.toMatch(/from-ref-teal/);
    expect(src).not.toContain("ref-cyan");
  });

  it("MarketContentViewSortBar wires ViewSwitcher glass hub tokens (G3)", () => {
    const sortBar = read("MarketContentViewSortBar.tsx");
    expect(sortBar).toContain("ViewSwitcher");
    const switcher = read("ViewSwitcher.tsx");
    expect(switcher).toContain("TT_MARKETING_MARKET_HUB_NAV_LINK_ACTIVE");
    expect(switcher).not.toContain("ref-cyan");
  });

  it("MarketPageHero h1 uses home L5 hero title token (MARKET-UI-THAW)", () => {
    const src = read("MarketPageHero.tsx");
    expect(src).toContain("TT_MARKETING_HOME_HERO_TITLE");
    expect(src).toContain("TT_MARKETING_MARKET_L5_HERO_FRAME");
    expect(src).toContain("TT_MARKETING_MARKET_L5_HERO_SUBTITLE");
    expect(src).toContain("TT_MARKETING_ORDERS_PAGE_HERO_INNER_GLOW");
  });

  it("StickyFilterBar glass uses warm filter chips not ref-cyan (G3)", () => {
    const src = read("StickyFilterBar.tsx");
    expect(src).toContain("filterChipActiveGlass");
    expect(src).toContain("filterBarGlass");
    expect(src).not.toContain("ref-cyan");
  });

  it("market page uses 224-D first-screen rhythm tokens", () => {
    const page = readFileSync(join(root, "../../app/market/MarketPageClient.tsx"), "utf8");
    expect(page).toContain("TT_MARKETING_MARKET_HUB_GAP");
    expect(page).toContain("TT_MARKETING_MARKET_FILTER_GAP");
    expect(page).toContain("TT_MARKETING_MARKET_CONTENT_GAP");
    expect(read("MarketPageHero.tsx")).toContain("TT_MARKETING_MARKET_HERO_ZONE");
  });

  it("bindGuide banner uses dark-route readable tokens not ink-900 on market dark surface", () => {
    const page = readFileSync(join(root, "../../app/market/MarketPageClient.tsx"), "utf8");
    expect(page).toContain("bindGuideToOrderId");
    expect(page).toContain("bindGuideBanner");
    expect(page).toContain("bindGuideBannerTitle");
    expect(page).not.toMatch(/bindGuideToOrderId[\s\S]{0,400}text-ink-900/);
  });

  it("marketingUi market PR-D uses frameless hero, light filter rail, matte cards (V2 premium)", () => {
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toContain("TT_MARKETING_DARK_ROUTE_CARD_SURFACE");
    expect(ui).toMatch(/marketHeroShell:\s*\n\s*"mx-auto max-w-5xl[^"]*border-b border-ref-sun\/12/);
    expect(ui).toMatch(/marketFilterBarShell:[\s\S]*?max-w-5xl/);
    expect(ui).toMatch(/marketFilterBarShell:[\s\S]*?mx-auto/);
    expect(ui).toMatch(/guideCardDark: TT_MARKETING_DARK_ROUTE_CARD_SURFACE/);
    expect(ui).toMatch(/cardPayHubBtn:[\s\S]*?underline-offset-2/);
    expect(ui).toMatch(/marketSortPillActive:[\s\S]*?ring-0 shadow-none/);
    expect(ui).toMatch(/filterBarGlass: "sticky top-0 z-10 border-0 bg-transparent py-2/);
  });

  it("MarketPageHero uses frameless hero shell without L5 panel box", () => {
    const src = read("MarketPageHero.tsx");
    expect(src).toMatch(/className=\{`\$\{TT_MARKETING_MARKET_HERO_ZONE\} \$\{D\.marketHeroShell\}`\}/);
    expect(src).not.toContain("DARK_ROUTE_PANEL_L5");
    expect(src).not.toMatch(/<div className=\{D\.marketHeroShell\}/);
  });

  it("OrderCard glass uses L5 body tokens and action row", () => {
    const src = read("OrderCard.tsx");
    expect(src).toContain("MarketOrderCover");
    expect(src).toContain("EscrowEnabledBadge");
    expect(src).not.toContain("market_card_trustLine");
    expect(src).toContain("cardActionRow");
    expect(src).toContain("cardInteractive");
    expect(src).toContain("cardViewItineraryLink");
  });

  it("marketingUi market PR-E uses borderless cards and softer filter chips", () => {
    const ui = readFileSync(join(root, "../../lib/marketingUi.ts"), "utf8");
    expect(ui).toMatch(/DARK_ROUTE_CARD_SURFACE[\s\S]*?border-0/);
    expect(ui).toContain("TT_MARKETING_DARK_ROUTE_CARD_MEDIA_DIVIDER");
    expect(ui).toMatch(/filterChipIdleGlass:[\s\S]*?border-ref-sun\/14/);
    expect(ui).toMatch(/cardViewItineraryLink:[\s\S]*?text-ref-sun/);
    expect(ui).toMatch(/cardSecondaryBtn:[\s\S]*?\[color:var\(--ref-sun\)\]/);
  });

  it("StickyFilterBar collapses city and guide filters behind expand (PR-E)", () => {
    const src = read("StickyFilterBar.tsx");
    expect(src).toContain("filterExpanded");
    expect(src).toMatch(/\{filterExpanded \?/);
    expect(src).toContain("filter_expand");
    expect(src).toContain("advancedSelectionCount");
    expect(src).toContain("marketFilterMoreToggle");
    expect(src).toContain("aria-pressed");
  });

  it("OrderDetailDrawer uses MarketDetailDrawerFrame dark shell (P0)", () => {
    const src = read("OrderDetailDrawer.tsx");
    expect(src).toContain("MarketDetailDrawerFrame");
    expect(src).toContain("panelVariant=\"stickyFooter\"");
    expect(src).toContain("marketDetailDrawerScrollRegion");
    expect(src).toContain("marketDetailDrawerFooterSticky");
    expect(src).toContain("marketDetailDrawerPricePill");
    expect(src).toContain("marketDetailDrawerSummaryStrip");
    expect(src).toContain('SupportedTokensPill tone="dark"');
    expect(src).toContain("marketDetailDrawerPrimaryCtaMatte");
    expect(src).toContain("DrawerAccordionChevron");
    expect(readFileSync(join(root, "marketDetailDrawerClasses.ts"), "utf8")).toMatch(
      /marketDetailDrawerPrimaryCtaMatte[\s\S]*text-white/,
    );
    expect(src).toContain("itineraryDetailOpen");
    expect(src).not.toContain("marketDetailDrawerAmount");
    expect(src).not.toContain("market_card_trustLine");
    expect(src).not.toContain("bg-bg-console");
    expect(src).toContain('variant="marketDark"');
    expect(readFileSync(join(root, "../../components/itinerary/UnifiedItineraryList.tsx"), "utf8")).toContain(
      "marketDark",
    );
    expect(src).toContain("formatMarketOrderDestination");
  });

  it("GuideDetailDrawer uses MarketDetailDrawerFrame dark shell (P0)", () => {
    const src = read("GuideDetailDrawer.tsx");
    expect(src).toContain("MarketDetailDrawerFrame");
    expect(src).not.toContain("bg-bg-console");
    expect(src).toContain("resolveGuideAvatarUrl");
  });

  it("OrderCard L5 cover fallback and card opens detail drawer", () => {
    const src = read("OrderCard.tsx");
    expect(src).toContain("MarketOrderCover");
    expect(src).toContain("MarketOrderCover");
    expect(src).toContain("resolveMarketOrderCardTeaser");
    expect(src).toContain("market_order_draft_teaser");
    expect(src).not.toContain("market_card_trustLine");
    expect(src).toMatch(/amountLabel=""/);
    expect(src).toContain('role={openDetail ? "button" : undefined}');
    const badge = readFileSync(join(root, "../trust/EscrowEnabledBadge.tsx"), "utf8");
    expect(badge).toContain("trust_escrow_badge_short");
    expect(badge).toContain("trustEscrowBadge");
    expect(badge).not.toContain("bg-success");
    expect(read("GuideCard.tsx")).toContain("trustDidVerified");
    expect(readFileSync(join(root, "../trust/SupportedTokensPill.tsx"), "utf8")).toContain("trustTokenPill");
    expect(read("MarketOrderCover.tsx")).toContain("cardCoverScrim");
    expect(read("GuideCard.tsx")).toContain("MarketGuideCover");
    expect(read("GuideCard.tsx")).toContain("compact={glass}");
    expect(read("GuideCard.tsx")).toContain("market_guide_hourly_on_request");
    expect(read("GuideCard.tsx")).toContain("previewOnly");
    expect(read("GuideCard.tsx")).toContain("data-tt-guide-card-preview");
    expect(read("MarketGuideCover.tsx")).toContain("object-[center_28%]");
    expect(readFileSync(join(root, "../../lib/marketMediaFallback.ts"), "utf8")).toContain(
      "resolveMarketOrderCoverUrl",
    );
  });

  it("MarketPageFooter uses LandingFooter (home L5)", () => {
    const src = read("MarketPageFooter.tsx");
    expect(src).toContain("LandingFooter");
    expect(src).toContain("TT_MARKETING_HOME_FOOTER_TOP_FADE");
  });

  it("MarketStandaloneBusinessPage wires masonry filter drawer and studio", () => {
    const src = read("MarketStandaloneBusinessPage.tsx");
    expect(src).toContain("MarketSubsiteMasonry");
    expect(src).toContain("MarketSubsiteFilterBar");
    expect(src).toContain("MarketSubsiteListingDetailDrawer");
    expect(src).toContain("MerchantShowcaseStudioModal");
    expect(src).toContain("AcquisitionCarryStudioModal");
    expect(src).toContain("data-tt-market-subsite-studio-gated");
    expect(src).not.toMatch(/border-amber-400/);
    expect(src).not.toMatch(/bg-amber-500/);
  });

  it("EscrowEnabledBadge supports cover variant for readable chips", () => {
    const src = readFileSync(join(root, "../../components/trust/EscrowEnabledBadge.tsx"), "utf8");
    expect(src).toContain('variant === "cover"');
    expect(src).toContain("cardCoverChip");
  });
});
