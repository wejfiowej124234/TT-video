import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TRAVELTRUST_ROLES } from "./traveltrustIdentityModel";

const __dir = dirname(fileURLToPath(import.meta.url));
const cinematicDir = join(__dir, "../../components/traveltrust/cinematic");
const networkPageComposerPath = join(
  __dir,
  "../../modules/traveltrust-home/presentation/TravelTrustNetworkPageComposer.tsx",
);
const composerDynamicsPath = join(
  __dir,
  "../../modules/traveltrust-home/presentation/TravelTrustHomeComposerDynamics.tsx",
);
const composerLandingNavPath = join(
  __dir,
  "../../modules/traveltrust-home/presentation/TravelTrustHomeLandingNavSlot.tsx",
);
const composerPresentationPaths = [
  "../../modules/traveltrust-home/presentation/TravelTrustHomeComposerShell.tsx",
  "../../modules/traveltrust-home/presentation/TravelTrustHomeScrollProviders.tsx",
  "../../modules/traveltrust-home/presentation/TravelTrustHomeMainColumn.tsx",
  "../../modules/traveltrust-home/presentation/TravelTrustHomeUnified3DBackdrop.tsx",
  "../../modules/traveltrust-home/presentation/TravelTrustHomeComposerOverlays.tsx",
  "../../modules/traveltrust-home/hooks/useTraveltrustComposerPage.ts",
  "../../modules/traveltrust-home/sections/TravelTrustHomeBelowFoldSection.tsx",
  "../../lib/traveltrust/home/BelowFoldSectionsShell.tsx",
] as const;

function readNetworkPageComposerSource(): string {
  return [
    readFileSync(networkPageComposerPath, "utf8"),
    readFileSync(composerDynamicsPath, "utf8"),
    readFileSync(composerLandingNavPath, "utf8"),
    ...composerPresentationPaths.map((rel) => readFileSync(join(__dir, rel), "utf8")),
  ].join("\n");
}

function readPageSceneSource(): string {
  return [
    "page-scene/PageTravelCorridorRing.tsx",
    "page-scene/PageHeroGlobeRig.tsx",
    "page-scene/PageCinematicEnvironment.tsx",
    "page-scene/PageCinematicCameraRig.tsx",
  ]
    .map((rel) => readFileSync(join(cinematicDir, rel), "utf8"))
    .join("\n");
}

function readL5ResolversSource(): string {
  return readFileSync(join(__dir, "../../lib/traveltrust/l5/resolvers.ts"), "utf8");
}

function readTravelTrustNetworkPageModuleSources(): string {
  const cinematicFiles = [
    "TravelTrustCinematicShell.tsx",
    "TravelTrustCinematicHero.tsx",
    "TravelTrustHorizonArc.tsx",
    "TravelTrustHeroReduceMotionStars.tsx",
    "TravelTrustCinematicA11y.tsx",
    "TravelTrustHeroFilmChrome.tsx",
    "TravelTrustHeroGuidance.tsx",
    "TravelTrustIllustrativeBadge.tsx",
    "TravelTrustIdentityTheater.tsx",
    "TravelTrustLandingNav.tsx",
    "TravelTrustLandingChrome.tsx",
    "TravelTrustBelowFoldSections.tsx",
    "TravelTrustPulseTicker.tsx",
    "traveltrustHeroFilmStyles.ts",
    "TravelTrustStartSection.tsx",
    "TravelTrustStartRoutePreview.tsx",
    "TravelTrustPulseTicker.tsx",
    "TravelTrustStablecoinGateway.tsx",
    "TravelTrustScrollProgress.tsx",
    "TravelTrustRoleVideoPlayer.tsx",
    "TravelTrustRouteArc.tsx",
    "TravelTrustCinematicScene3D.tsx",
    "TravelTrustCinematicScene3DContent.tsx",
    "traveltrustCinematic3dConfig.ts",
    "TravelTrustHeroScrollContext.tsx",
    "TravelTrustTheaterScene3D.tsx",
    "TravelTrustPageCinematicCanvas.tsx",
    "TravelTrustPageCinematicScene.tsx",
    "TravelTrustPageScrollContext.tsx",
    "traveltrustPageCinematicConfig.ts",
    "traveltrustCinematicEasing3d.ts",
    "TravelTrustTheaterRoleContext.tsx",
    "TravelTrustTheaterViewportContext.tsx",
    "TravelTrustWeb3CinematicElements.tsx",
    "traveltrustCinematicCanvasPassive.ts",
    "traveltrustCinematicChapters.ts",
    "TravelTrustCinematicBloom.tsx",
    "TravelTrustGlobeInteractionContext.tsx",
    "TravelTrustPhase1GlobeHighlights.tsx",
    "TravelTrustPhase1TravelArcs.tsx",
    "TravelTrustPhase1RegionRoster.tsx",
    "TravelTrustTourismGlobe.tsx",
    "TravelTrustTrustFactsStrip.tsx",
    "TravelTrustHeroChainHud.tsx",
    "TravelTrustFaqStrip.tsx",
    "TravelTrustSettlementStrip.tsx",
    "TravelTrustCinematicFallbackNotice.tsx",
    "TravelTrustDevChunkRecoveryNotice.tsx",
    "TravelTrustReducedMotionNotice.tsx",
    "TravelTrustNetworkFooter.tsx",
    "TravelTrustFooterCrossNav.tsx",
    "TravelTrustFooterSocial.tsx",
    "TravelTrustHeroWalletConnect.tsx",
    "useTraveltrustSectionNav.ts",
    "traveltrustHeroUi.ts",
  ];
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readNetworkPageComposerSource(),
    readFileSync(join(__dir, "TravelTrustNetworkPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "../../lib/traveltrustSectionHash.ts"), "utf8"),
    readFileSync(join(__dir, "../../hooks/useTraveltrustHashScroll.ts"), "utf8"),
    readFileSync(join(__dir, "../../lib/traveltrustLandingNavStyles.ts"), "utf8"),
    readFileSync(join(__dir, "../../lib/traveltrustCinematicA11yChapters.ts"), "utf8"),
    readFileSync(join(__dir, "../../lib/traveltrustPhase1RegionKeys.ts"), "utf8"),
    readFileSync(join(__dir, "useTravelTrustPageBrief.ts"), "utf8"),
    readFileSync(join(__dir, "TravelTrustPageBriefContext.tsx"), "utf8"),
    readFileSync(join(__dir, "../../components/traveltrust/TravelTrustPageBriefStatus.tsx"), "utf8"),
    readFileSync(join(__dir, "traveltrustIdentityModel.ts"), "utf8"),
    readFileSync(join(__dir, "../../lib/traveltrustPageBrief.ts"), "utf8"),
    readFileSync(join(__dir, "../../lib/traveltrustHeroTrustChips.ts"), "utf8"),
    readFileSync(join(__dir, "../../lib/traveltrustHeroLayout.ts"), "utf8"),
    readFileSync(join(__dir, "../../lib/marketingUi.ts"), "utf8"),
    readFileSync(join(__dir, "../../lib/traveltrustLocaleLayout.ts"), "utf8"),
    readFileSync(join(__dir, "../../lib/traveltrustV6AnalyticsEvents.ts"), "utf8"),
    ...cinematicFiles.map((f) => readFileSync(join(cinematicDir, f), "utf8")),
    readFileSync(join(cinematicDir, "page-scene/PageTravelCorridorRing.tsx"), "utf8"),
    readFileSync(join(cinematicDir, "page-scene/PageHeroGlobeRig.tsx"), "utf8"),
    readFileSync(join(cinematicDir, "page-scene/PageCinematicEnvironment.tsx"), "utf8"),
    readFileSync(join(cinematicDir, "page-scene/PageCinematicCameraRig.tsx"), "utf8"),
  ].join("\n");
}

describe("traveltrust network page (contract)", () => {
  const src = readTravelTrustNetworkPageModuleSources();

  it("does not reference internal API paths", () => {
    expect(src).not.toMatch(/\/api\/v1\/internal\//);
  });

  it("keeps v6 cinematic shell markers", () => {
    expect(src).toContain('data-tt-traveltrust-network-page="1"');
    expect(src).toContain("TravelTrustCinematicShell");
    expect(src).toContain("TravelTrustIdentityTheater");
    expect(src).toContain("TravelTrustRoleVideoPlayer");
    expect(src).toContain("FeeRouterWiringNotice");
    expect(src).toContain('variant="did"');
    expect(src).toContain("useTravelTrustPageBrief");
    expect(src).toContain("traveltrustCinematicMotion");
    expect(src).toContain("TravelTrustCinematicScene3D");
    expect(src).toContain("data-tt-traveltrust-cinematic-3d");
    expect(src).toContain("TravelTrustHeroScrollContext");
    expect(src).toContain("data-tt-traveltrust-theater-3d");
    expect(src).toMatch(/TravelTrustPageCinematicCanvas|dynamic\(/);
    expect(src).toContain("data-tt-traveltrust-page-cinematic-3d");
    expect(src).toContain("TravelTrustPageScrollContext");
    expect(src).toContain("UNIFIED_PAGE_3D");
    expect(src).toContain("TravelTrustTheaterRoleProvider");
    expect(readPageSceneSource()).toContain(
      "resolveTheaterRoleWarm3dHex",
    );
    expect(src).toContain("TravelTrustWeb3CinematicElements");
    expect(src).toContain("TT_BRAND_3D");
    expect(src).toContain("TT_CINEMATIC_FILM");
    expect(src).toContain("TrustEscrowFilaments");
    expect(src).toContain("CinematicHorizonBand");
    expect(src).toContain("EscrowAnchorNodes");
    expect(src).toContain("TravelTrustTheaterViewportContext");
    expect(src).toContain("heroRef");
    expect(src).toContain("ttZClass(TT_Z.VIEWPORT_INK)");
    expect(src).toContain("min-h-screen");
    expect(src).toContain("TT_MARKETING_TRAVELTRUST_HERO_SECTION_UNIFIED_3D_CLASS");
    expect(src).toContain("pointerEvents");
    expect(src).toContain("applyTravelTrustPageCinematicGl");
    expect(readFileSync(join(cinematicDir, "TravelTrustPageCinematicCanvas.tsx"), "utf8")).toContain("alpha: false");
    expect(src).toContain("TRAVELTRUST_CINEMATIC_CANVAS_STYLE");
    expect(src).toContain("traveltrust_fee_router_summary");
    expect(src).toContain("fetchTravelTrustPageBrief");
    expect(src).toContain("data-tt-traveltrust-ia-version");
    expect(src).toContain("trackTravelTrustEvent");
    expect(src).toContain("TRAVELTRUST_V6_ANALYTICS_EVENTS");
    expect(src).toContain("traveltrust_secondary_cta_click");
    expect(src).toMatch(/TRAVELTRUST_ANALYTICS_BEACON|trackTravelTrustEvent/);
    expect(src).toContain("TravelTrustHeroWalletConnect");
    expect(src).toContain('data-tt-traveltrust-hero-wallet-menu="1"');
    expect(src).toContain("traveltrust-landing-nav-mobile");
    expect(src).toContain("TravelTrustRouteArc");
  });

  it("keeps v6 content supplements (trust, roles video, 3d chapters)", () => {
    expect(src).toContain("TravelTrustTrustFactsStrip");
    expect(src).not.toContain("TravelTrustQuickExplain");
    expect(src).not.toContain("TravelTrustIllustrativeStats");
    expect(src).toContain('id="trust"');
    expect(src).toContain("traveltrust_illustrative_badge");
    expect(src).toContain("TravelTrustHeroChainHud");
    expect(src).toContain("TravelTrustHeroFilmChrome");
    expect(src).toContain("resolveTraveltrustPlanTripHref");
    expect(src).toContain("TravelTrustTourismGlobe");
    expect(src).toContain("TravelTrustPhase1TravelArcs");
    expect(src).toContain("TT-GLOBE-A-2026-05");
    expect(src).toContain("TRAVELTRUST_GLOBE_L5_SPRINT_ID");
    expect(readFileSync(join(__dirname, "../../lib/traveltrustGlobeEarthAsset.ts"), "utf8")).toContain(
      "TT-GLOBE-L5-2026-05",
    );
    expect(src).toContain("TravelTrustGlobeInteractionProvider");
    expect(src).toContain("data-tt-traveltrust-globe-interactive");
    expect(src).toContain("traveltrust_globe_pin_click");
    expect(readFileSync(join(__dirname, "../../lib/traveltrustCinematicPageL5.ts"), "utf8")).toContain(
      "TT-CINEMATIC-L5-2026-05",
    );
    expect(readFileSync(join(__dirname, "../../lib/traveltrustHeroTypography.ts"), "utf8")).toContain(
      "from-ref-sun",
    );
    expect(readFileSync(join(__dirname, "../../lib/traveltrustPhase1GlobeRegions.ts"), "utf8")).toContain(
      "TT_HERO_GLOBE_L5_PALETTE",
    );
    expect(src).toContain("PageTravelCorridorRing");
    expect(src).toContain("data-tt-traveltrust-start-steps-l5");
    expect(src).toContain("data-tt-traveltrust-start-route-preview-l5");
    expect(src).toContain("ttTraveltrustCorridorRingL5");
    expect(src).toContain("data-tt-traveltrust-theater-handoff-l5");
    expect(src).toContain("traveltrust_theater_handoff_line");
    expect(src).toContain("traveltrust_faq_eyebrow");
    expect(src).toContain("data-tt-traveltrust-scroll-chapter-narrative");
    expect(src).toContain("TT_CINEMATIC_CHAPTER_NARRATIVE_KEYS");
    expect(src).toContain("data-tt-traveltrust-hero-trust-chip-l5");
    expect(src).toContain("heroTrustChip");
    expect(src).toContain("data-tt-traveltrust-hero-globe-unobstructed");
    expect(src).toContain('data-tt-traveltrust-hero-dom-video="0"');
    expect(readFileSync(join(__dirname, "../../lib/traveltrustHeroGlobeP1Link.ts"), "utf8")).toContain(
      "TRAVELTRUST_HERO_GLOBE_P1_LINK_ID",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustCinematicHero.tsx"), "utf8")).toContain(
      'data-tt-traveltrust-hero-narrative-l5="web3-network"',
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustCinematicHero.tsx"), "utf8")).toContain(
      "traveltrustHeroGlobeP1Link",
    );
    expect(src).toContain("useTraveltrustStartStepController");
    expect(src).toContain("data-tt-traveltrust-liquidity-l5-defer");
    expect(src).toContain("TT_STABLECOIN_GATEWAY_L5.amountLockedHintClass");
    expect(src).not.toContain("traveltrust_liquidity_l5_scope_note");
    expect(src).toContain("data-tt-traveltrust-horizon-arc-l5");
    expect(readFileSync(join(__dirname, "../../lib/traveltrustCinematicPageL5.ts"), "utf8")).toContain(
      "horizonArc",
    );
    expect(readL5ResolversSource()).toContain(
      "resolveNonGlobeCanvasCyanMul",
    );
    expect(src).toContain("@/lib/traveltrust/l5");
    expect(readFileSync(join(cinematicDir, "TravelTrustFaqStrip.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-faq-strip-l5",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustTrustFactsStrip.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-trust-facts-l5",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustBelowFoldAtmosphere.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-below-fold-atmosphere-unified-l5",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustScrollProgress.tsx"), "utf8")).not.toContain(
      "to-ref-teal",
    );
    expect(src).toContain("resolveTraveltrustGlobeRenderTier");
    expect(readFileSync(join(__dirname, "../../lib/traveltrustGlobeEarthAsset.ts"), "utf8")).toContain(
      "globe-earth-equirect-2k",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustCinematicHero.tsx"), "utf8")).toContain(
      'data-tt-traveltrust-hero-dom-video="0"',
    );
    expect(src).toContain("TravelTrustCinematicLowQualityToggle");
    expect(src).toContain("scheduleTraveltrustWebGLMount");
    expect(src).toContain("TravelTrustHeroGuidance");
    expect(src).toContain("TravelTrustIllustrativeBadge");
    expect(src).toContain("data-tt-traveltrust-hero-guidance");
    expect(src).toContain("traveltrust_hero_trust_chips_disclaimer");
    expect(src).toContain("TRAVELTRUST_HERO_TRUST_CHIPS");
    expect(src).toContain("data-tt-traveltrust-hero-trust-chip");
    expect(src).toContain("TRAVELTRUST_HEADER_WALLET_ID");
    expect(src).toContain("data-tt-traveltrust-hero-wallet-connected");
    expect(src).toContain("traveltrust_hero_guidance_brief_loading");
    expect(src).toContain("traveltrust_hero_guidance_chain_wrong");
    expect(src).toContain("TT_HERO_CONTENT_SHELL_CLASS");
    expect(src).toContain("TT_LANDING_CHROME_CLASS");
    expect(src).toContain("data-tt-traveltrust-hero-content-shell");
    expect(src).toContain("data-tt-traveltrust-hero-copy-card");
    expect(src).toContain("data-tt-traveltrust-text-direction");
    expect(src).toContain("truncateTraveltrustNavLabel");
    expect(src).toContain("data-tt-traveltrust-faq-trigger");
    expect(src).toContain("data-tt-traveltrust-hero-chain-id");
    expect(src).toContain("data-tt-traveltrust-hero-chain-next-step");
    expect(src).toContain("traveltrust_hero_wallet_next_step");
    expect(src).toContain("traveltrust_chain_id_label");
    expect(src).toContain("TT_HERO_KICKER_CLASS");
    expect(src).toContain("data-tt-traveltrust-cinematic-shell");
    expect(src).toContain("data-tt-traveltrust-chrome-placeholder");
    expect(src).toContain("traveltrust_cinematic_sr_chapter_hero");
    expect(src).toContain("data-tt-traveltrust-plan-href");
    expect(src).toContain("data-tt-traveltrust-webgl-fallback-banner");
    expect(src).toContain("data-tt-traveltrust-settlement-disclaimer");
    expect(readFileSync(join(__dir, "../../lib/traveltrustPlanTripHref.ts"), "utf8")).toContain(
      "isTraveltrustInPagePlanHref",
    );
    expect(readFileSync(join(__dir, "../../lib/traveltrustPlanTripHref.ts"), "utf8")).toContain(
      "resolveTraveltrustRoleEnterHref",
    );
    expect(
      readFileSync(join(cinematicDir, "TravelTrustRoleVideoPlayer.tsx"), "utf8"),
    ).toContain('data-tt-traveltrust-role-video="1"');
    expect(
      readFileSync(join(cinematicDir, "TravelTrustRoleVideoPlayer.tsx"), "utf8"),
    ).toContain("traveltrust_role_video_play");
    expect(src).toContain("buildTraveltrustTheaterRoleEnterHref");
    expect(src).toContain("data-tt-traveltrust-role-enter-href");
    expect(src).toContain("useTraveltrustHashScroll");
    expect(src).toContain("scrollTraveltrustHashIntoView");
    expect(src).toContain("TT_LANDING_NAV_SHELL_CLASS");
    expect(src).toContain("data-tt-traveltrust-landing-nav-contrast");
    expect(src).toContain("data-tt-traveltrust-scroll-progress-visible");
    expect(src).toContain("traveltrust_start_disclaimer");
    expect(src).toContain("data-tt-traveltrust-fee-router-panel");
    expect(src).toContain("traveltrust_fee_router_disclaimer");
    expect(src).toContain("TRAVELTRUST_CINEMATIC_A11Y_CHAPTERS");
    expect(src).not.toContain("traveltrust_cinematic_sr_chapter_stats");
    expect(src).not.toContain("traveltrust_cinematic_sr_chapter_explain");
    expect(src).toContain("data-tt-traveltrust-reduced-motion-notice-visible");
    expect(src).not.toContain('id="explain"');
    expect(src).toContain("traveltrust_trust_facts_disclaimer");
    expect(src).toContain("TravelTrustPhase1RegionRoster");
    expect(src).toContain("data-tt-traveltrust-phase1-region-roster");
    expect(src).toContain("data-tt-traveltrust-landing-chrome-pulse-expanded");
    expect(readFileSync(join(__dir, "../../lib/marketingUi.ts"), "utf8")).toContain("max-[390px]");
    expect(readFileSync(join(__dir, "../../lib/marketingUi.ts"), "utf8")).toContain("TT_MARKETING_BTN_PRIMARY_WARM");
    expect(readNetworkPageComposerSource()).toContain('data-tt-ui-generation="v2"');
    expect(readFileSync(join(__dir, "../../lib/marketingUi.ts"), "utf8")).toContain(
      "TT_MARKETING_TRAVELTRUST_HERO_SECTION_CLASS",
    );
    expect(src).toContain("data-tt-traveltrust-hero-cta-plan-warm");
    expect(src).toContain("TT_MARKETING_BTN_PRIMARY_WARM_HERO");
    expect(readFileSync(join(cinematicDir, "TravelTrustStartSection.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-start-cta-plan-warm",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustNetworkFooter.tsx"), "utf8")).toContain(
      "TravelTrustFooterCrossNav",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-footer-cross-nav-grouped",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).toContain(
      "traveltrust_footer_cross_nav_group_product",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustPageComplianceBlock.tsx"), "utf8")).not.toMatch(
      /traveltrust_footer_t2[\s\S]*traveltrust_footer_t2/,
    );
    expect(readFileSync(join(__dir, "../../lib/traveltrustSectionNavItems.ts"), "utf8")).toContain(
      "TRAVELTRUST_HERO_COMPACT_SECTIONS",
    );
    expect(readFileSync(join(__dir, "../../lib/traveltrustSectionNavItems.ts"), "utf8")).toContain(
      '"liquidity"',
    );
    const scrollProgressSrc = readFileSync(join(cinematicDir, "TravelTrustScrollProgress.tsx"), "utf8");
    expect(scrollProgressSrc).toContain("data-tt-traveltrust-scroll-chapter");
    expect(scrollProgressSrc).toContain("data-tt-traveltrust-webgl-idle-hint");
    expect(readFileSync(join(cinematicDir, "TravelTrustLandingNav.tsx"), "utf8")).toContain(
      "TT_LANDING_NAV_MORE_MENU_ABOVE_CLASS",
    );
    expect(readFileSync(join(__dir, "../../lib/marketingUi.ts"), "utf8")).toContain(
      "overflow-visible",
    );
    expect(src).toContain("TravelTrustBelowFoldAtmosphere");
    expect(src).toContain("TravelTrustSectionFilmDivider");
    expect(readFileSync(join(__dir, "../../lib/marketingSiteFooter.ts"), "utf8")).toContain(
      "MARKETING_SITE_FOOTER_ID",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).toContain(
      "traveltrust_footer_plan",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).toContain(
      "/traveltrust#start",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).not.toContain(
      "traveltrust_footer_network",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).toContain(
      "traveltrust_footer_merchant",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).toContain(
      "footer_link_privacy",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustStartSection.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-fee-router-collapsed",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustStartSection.tsx"), "utf8")).toContain(
      "TT_MARKETING_TRAVELTRUST_FEE_ROUTER_LINK",
    );
    const marketingUiSrc = readFileSync(join(__dir, "../../lib/marketingUi.ts"), "utf8");
    const feeRouterLinkClasses =
      marketingUiSrc.match(/export const TT_MARKETING_TRAVELTRUST_FEE_ROUTER_LINK =\s*\n?\s*"([^"]+)"/)?.[1] ??
      "";
    expect(feeRouterLinkClasses).toContain("justify-start");
    expect(feeRouterLinkClasses).not.toContain("justify-between");
    expect(feeRouterLinkClasses).not.toContain("w-full");
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).toContain(
      "TT_FOOTER_CROSS_NAV_L5.groupTitleClass",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).toContain(
      "traveltrust_footer_web3_home",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).not.toContain(
      "data-tt-traveltrust-footer-site-map-panel-l5",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustStartSection.tsx"), "utf8")).toContain(
      "traveltrust_start_governance_cta",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustFaqStrip.tsx"), "utf8")).toContain(
      "traveltrust_faq_q6",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustNetworkFooter.tsx"), "utf8")).toContain(
      "col-span-full",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustStartSection.tsx"), "utf8")).not.toContain(
      "help_title",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustStartSection.tsx"), "utf8")).toContain(
      "traveltrust_start_eyebrow",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustStartSection.tsx"), "utf8")).toContain(
      "useTraveltrustStartStepController",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustStartSection.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-start-step-select-l5",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustStartSection.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-start-p2-corridor-binding",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustStartSection.tsx"), "utf8")).toContain(
      "writeTraveltrustStartHash",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustStartRoutePreview.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-start-corridor",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustIdentityTheater.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-theater-p2-narrative",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustIdentityTheater.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-theater-corridor",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustIdentityTheater.tsx"), "utf8")).toContain(
      "buildTraveltrustTheaterRoleEnterHref",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustCinematicHero.tsx"), "utf8")).toContain(
      "TravelTrustHeroGlobeNetworkDecor",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustHeroGlobeNetworkDecor.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-hero-p3-layer",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustHeroNetworkNarrative.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-hero-p3-lead",
    );
    expect(readFileSync(join(__dir, "../../lib/traveltrustHeroP3DecorNodes.ts"), "utf8")).toContain(
      "TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS",
    );
    expect(readFileSync(join(__dir, "../../lib/traveltrustHeroP3DecorNodes.ts"), "utf8")).toContain(
      "TRAVELTRUST_HERO_P3_DECOR_NODE_COUNT",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustStartSection.tsx"), "utf8")).toContain(
      "TravelTrustPageComplianceBlock",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustNetworkFooter.tsx"), "utf8")).not.toContain(
      "traveltrust_footer_nav_quick",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustPageComplianceBlock.tsx"), "utf8")).toMatch(
      /<details|motion\.details/,
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustNetworkFooter.tsx"), "utf8")).not.toContain(
      "<details",
    );
    const marketingSocialSrc = readFileSync(
      join(__dir, "../../components/marketing/MarketingFooterSocial.tsx"),
      "utf8",
    );
    expect(marketingSocialSrc).toContain('"data-tt-traveltrust-footer-social": "1"');
    expect(marketingSocialSrc).toContain('"data-tt-traveltrust-footer-social-slots": "1"');
    expect(marketingSocialSrc).toContain("traveltrust_footer_brand_tagline");
    expect(marketingSocialSrc).toContain('"data-tt-traveltrust-footer-social-pending": "1"');
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterSocial.tsx"), "utf8")).toContain(
      "MarketingFooterSocial",
    );
    expect(readFileSync(join(__dir, "../../lib/traveltrustOfficialSocialLinks.ts"), "utf8")).toContain(
      'platform: "github"',
    );
    expect(readFileSync(join(__dir, "../../lib/traveltrustOfficialSocialLinks.ts"), "utf8")).toContain(
      'platform: "telegram"',
    );
    expect(marketingSocialSrc).toContain('href="/community"');
    expect(readFileSync(join(__dir, "../../lib/traveltrustOfficialSocialLinks.ts"), "utf8")).toContain(
      "TRAVELTRUST_OFFICIAL_SOCIAL_PLATFORMS",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).not.toContain(
      "/traveltrust#fee-router",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustIllustrativeBadge.tsx"), "utf8")).toContain(
      "TT_MARKETING_ILLUSTRATIVE_BADGE_FOOTER",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustNetworkFooter.tsx"), "utf8")).not.toContain(
      "data-tt-traveltrust-footer-motion-hint",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).toContain(
      "help_title",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-footer-cross-nav-trust-collapsible",
    );
    expect(
      readFileSync(join(__dir, "../../components/marketing/MarketingFooterSocial.tsx"), "utf8"),
    ).toContain("traveltrust_footer_social_pending_line");
    expect(marketingUiSrc).toContain("sm:grid-cols-2");
    expect(readFileSync(join(cinematicDir, "TravelTrustFooterCrossNav.tsx"), "utf8")).toContain(
      "footer_cross_nav",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustIdentityTheater.tsx"), "utf8")).toContain(
      "TT_HERO_PRIMARY_CTA_L5",
    );
    expect(
      readFileSync(join(cinematicDir, "TravelTrustCinematicScene3DContent.tsx"), "utf8"),
    ).toContain("TT_CINEMATIC_GLOBE_VISUAL");
    expect(readNetworkPageComposerSource()).toContain(
      "initTraveltrustCinematicQualityPrefs",
    );
    expect(readFileSync(join(__dir, "../../lib/traveltrustCinematicPerf.ts"), "utf8")).toContain(
      "initTraveltrustCinematicQualityPrefs",
    );
    expect(readFileSync(join(__dir, "../../lib/traveltrustCinematicPower.ts"), "utf8")).toContain(
      "resolveTraveltrustCanvasPower",
    );
    expect(src).toContain("data-tt-traveltrust-page-cinematic-roles-inview");
    expect(src).toContain("data-tt-traveltrust-page-cinematic-power-reason");
    expect(src).toContain("data-tt-traveltrust-faq-accordion");
    expect(
      readFileSync(join(cinematicDir, "TravelTrustCinematicLowQualityToggle.tsx"), "utf8"),
    ).toContain("data-tt-traveltrust-cinematic-quality-pref");
    expect(readNetworkPageComposerSource()).toMatch(
      /dynamic\([\s\S]*TravelTrustLandingChrome/,
    );
    expect(src).toContain("TravelTrustHomeBelowFoldSection");
    expect(src).toContain("data-tt-traveltrust-roles-order");
    expect(src).toContain("traveltrust_hero_globe_decorative");
    expect(src).toContain("traveltrust_cinematic_sr_desc_long");
    expect(readFileSync(join(cinematicDir, "TravelTrustPageComplianceBlock.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-footer-compliance",
    );
    expect(readFileSync(join(__dir, "opengraph-image.tsx"), "utf8")).toContain("TRAVELTRUST_OG_COPY");
    expect(readFileSync(join(__dir, "../../components/trust/WalletStatusMini.tsx"), "utf8")).toContain(
      't("wallet_connect")',
    );
    expect(src).toContain("TravelTrustCinematicA11y");
    expect(src).toContain('data-tt-traveltrust-hero-layout="split-lr"');
    expect(src).toContain("data-tt-traveltrust-hero-copy-col");
    expect(readFileSync(join(__dirname, "../../lib/marketingUi.ts"), "utf8")).toContain("grid-area:globe");
    expect(readFileSync(join(__dirname, "../../lib/marketingUi.ts"), "utf8")).toContain("grid-area:copy");
    expect(src).toContain("data-tt-traveltrust-hero-copy-scrim");
    expect(src).toContain("TT_HERO_COPY_PANEL_SCRIM_CLASS");
    expect(src).toContain("compactOnLg");
    expect(src).toContain("data-tt-traveltrust-page-cinematic-inview");
    expect(src).toContain("data-tt-traveltrust-page-cinematic-power");
    expect(src).toContain("data-tt-traveltrust-hero-globe-viewport");
    expect(src).toContain("data-tt-traveltrust-hero-cta-dock");
    expect(src).toContain("traveltrustCinematicChapters");
    expect(src).toContain("resolveTravelTrustBlendedChapterPreset");
    expect(src).toContain("useTraveltrustHeroGlobeOpticalAlign");
    expect(readFileSync(join(cinematicDir, "TravelTrustCinematicHero.tsx"), "utf8")).toContain(
      "TravelTrustHeroWalletConnect",
    );
    expect(src).toContain("TravelTrustHeroReduceMotionStars");
    expect(src).toContain("data-tt-traveltrust-hero-reduce-motion-stars");
    expect(src).toContain("data-tt-traveltrust-liquidity-preview-banner");
    expect(src).toContain("TravelTrustPageBriefModeBadge");
    expect(src).toContain("traveltrustSectionMotion");
    expect(src).toContain("data-tt-traveltrust-trust-fact-card");
    expect(src).toContain("data-tt-traveltrust-hero-cta-skip-start");
    expect(src).toContain("data-tt-traveltrust-roles-tablist-mobile");
    expect(src).toContain("data-tt-traveltrust-cinematic-grain");
    expect(src).toContain("data-tt-traveltrust-below-hero-fade");
    expect(src).toContain("data-tt-traveltrust-pulse-anchor");
    expect(src).toContain('data-tt-traveltrust-hero-scroll-hint="outside-card"');
    expect(src).toContain("data-tt-traveltrust-liquidity-section-header-l5");
    expect(src).not.toContain('data-tt-traveltrust-hero-scroll-hint="copy-card"');
    expect(src).not.toContain('data-tt-traveltrust-hero-scroll-hint="globe"');
    expect(src).toContain("heroT < 0.88");
    expect(src).toContain("data-tt-traveltrust-dev-chunk-notice");
    expect(src).toContain("TravelTrustCinematicBloom");
    expect(src).toContain("TravelTrustPhase1GlobeHighlights");
    expect(src).toContain("traveltrustPhase1GlobeRegions");
    expect(src).toContain("traveltrustPhase1TravelRoutes");
    expect(src).toContain("TravelTrustLandingNav");
    expect(src).toContain("TravelTrustLandingChrome");
    expect(src).toContain("data-tt-traveltrust-landing-chrome");
    expect(readFileSync(join(cinematicDir, "TravelTrustPageCinematicCanvas.tsx"), "utf8")).toContain(
      "heroGlobeUnobstructed",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustPageCinematicCanvas.tsx"), "utf8")).toContain(
      "buildWarmPageCinematicCanvasOverlayLayers",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustPageCinematicCanvas.tsx"), "utf8")).toContain(
      "buildHeroWarmSkyBaseBackground",
    );
    expect(readFileSync(join(cinematicDir, "page-scene/PageCinematicEnvironment.tsx"), "utf8")).toContain(
      "PageCinematicWarmSkyShell",
    );
    expect(readL5ResolversSource()).toContain(
      "buildHeroWarmCanvasOverlayLayers",
    );
    expect(readFileSync(join(__dirname, "../../lib/traveltrustCinematicVisual.ts"), "utf8")).toContain(
      "TT_CINEMATIC_HERO_LETTERBOX",
    );
    expect(readFileSync(join(__dirname, "../../lib/traveltrustGlobeEarthAsset.ts"), "utf8")).toContain(
      "TRAVELTRUST_GLOBE_A_CLOSURE_ID",
    );
    expect(readFileSync(join(__dir, "layout.tsx"), "utf8")).toContain("getTraveltrustLayoutPreloadSync");
    expect(readFileSync(join(cinematicDir, "TravelTrustCinematicHero.tsx"), "utf8")).toContain(
      "useHeroMediaUrlsHydrated",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustHeroGlobeUnderlayDecor.tsx"), "utf8")).toContain(
      "P0",
    );
    expect(readNetworkPageComposerSource()).not.toContain(
      "TravelTrustHeroGlobeUnderlayDecor",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustCinematicHero.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-hero-dom-video",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustRoleVideoPlayer.tsx"), "utf8")).toContain(
      "useRoleMediaUrlsHydrated",
    );
    expect(readFileSync(join(__dir, "layout.tsx"), "utf8")).toContain("TravelTrustLayoutDeferredPreload");
    expect(
      readFileSync(join(__dirname, "../../lib/traveltrustPageBrief.server.ts"), "utf8"),
    ).toContain("resolveAllRoleMediaUrls");
    expect(
      readFileSync(join(__dirname, "../../lib/traveltrustComplianceDisclosure.ts"), "utf8"),
    ).toContain("TRAVELTRUST_V6_COMPLIANCE_DISCLOSURE_KEYS");
    expect(src).toContain("TravelTrustFaqStrip");
    expect(src).toContain("TravelTrustSettlementStrip");
    expect(src).toContain('id="faq"');
    expect(src).toContain('id="settlement"');
    expect(src).not.toContain('id="stats"');
    expect(src).toContain("traveltrust_hero_title_brand");
    expect(src).toContain("traveltrust_hero_title_suffix");
    expect(src).toContain("traveltrust_page_brief_dismiss");
  });

  it("keeps pulse ticker and stablecoin gateway on network page", () => {
    expect(src).toContain("TravelTrustPulseTicker");
    expect(src).toContain("TravelTrustStablecoinGateway");
    expect(src).toContain('id="pulse"');
    expect(src).toContain('id="liquidity"');
    expect(src).toContain('data-tt-traveltrust-pulse-ticker="1"');
    expect(readFileSync(join(cinematicDir, "TravelTrustPulseTicker.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-pulse-view-all",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustPulseTicker.tsx"), "utf8")).toContain(
      "traveltrustAnnouncementPageHref",
    );
    expect(existsSync(join(__dir, "announcements/page.tsx"))).toBe(true);
    expect(readFileSync(join(cinematicDir, "TravelTrustAnnouncementDetailDialog.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-announcement-detail-panel",
    );
    expect(src).toContain('data-tt-traveltrust-stable-gateway="1"');
    expect(src).toContain('data-tt-traveltrust-ttg-gateway-preview="1"');
    expect(src).toContain("traveltrustLiquidityGatewayModel");
  });

  it("keeps v6 section anchors (hero, roles, start)", () => {
    expect(src).toContain('id="hero"');
    expect(src).toContain('id="roles"');
    expect(src).toContain('id="start"');
    expect(src).toContain('href="#roles"');
    expect(src).toContain('id="fee-router"');
    expect(readFileSync(join(cinematicDir, "TravelTrustPageComplianceBlock.tsx"), "utf8")).toContain(
      "traveltrust_footer_t2",
    );
    const belowFold = readFileSync(join(cinematicDir, "TravelTrustBelowFoldSections.tsx"), "utf8");
    expect(belowFold).toContain("TravelTrustNetworkFooter");
    expect(belowFold).toContain("TravelTrustSnapChapter");
    expect(belowFold).toContain("data-tt-traveltrust-economy-cluster");
    expect(belowFold).toContain("TravelTrustTrustFactsStrip");
    expect(belowFold).toContain('chapterId="close"');
    expect(belowFold).toContain("grouped");
    expect(readNetworkPageComposerSource()).not.toContain(
      "<TravelTrustNetworkFooter",
    );
    expect(src).toContain("useTraveltrustSectionNav");
    expect(src).toContain("traveltrustHeroUi");
    expect(src).toContain('data-tt-traveltrust-landing-nav-slot="fixed"');
    expect(src).toMatch(/TravelTrustLandingNav/);
    expect(src).toContain("data-tt-traveltrust-theater-entered");
    expect(src).toContain("data-tt-traveltrust-page-brief-ready");
    const briefStatus = readFileSync(
      join(__dirname, "../../components/traveltrust/TravelTrustPageBriefStatus.tsx"),
      "utf8",
    );
    expect(briefStatus).toContain("data-tt-traveltrust-page-brief-banner-l5");
    expect(src).toContain("TravelTrustPageBriefProvider");
    expect(src).toContain("TRAVELTRUST_HERO_DEFAULT_LOOP");
    expect(src).toContain("/media/traveltrust/hero-loop.mp4");
    expect(src).toContain("/media/traveltrust/roles/traveler.mp4");
  });

  it("ships tier-1 hero/role placeholder media (TT-PH1-030b partial ①)", () => {
    const publicMedia = join(__dir, "../../public/media/traveltrust");
    expect(existsSync(join(publicMedia, "hero-loop.mp4"))).toBe(true);
    expect(existsSync(join(publicMedia, "roles", "traveler.mp4"))).toBe(true);
    for (const role of TRAVELTRUST_ROLES) {
      if (role.id === "traveler") continue;
      const file = role.defaultMp4.split("/").pop();
      expect(file).toBeTruthy();
      expect(existsSync(join(publicMedia, "roles", file!))).toBe(true);
    }
  });

  it("does not ship legacy fold / sticky / particle hero", () => {
    expect(src).not.toContain("TravelTrustStickyCta");
    expect(src).not.toContain("TravelTrustSectionNav");
    expect(src).not.toContain("TravelTrustNetworkParticles");
    expect(src).not.toContain("TravelTrustLiveStats");
    expect(src).not.toContain("TravelTrustDemoPreview");
  });

  it("keeps L0 site nav on /traveltrust (LandingChrome L1 below four links)", () => {
    const ui = readFileSync(join(__dir, "../../lib/uiSystem.ts"), "utf8");
    const header = readFileSync(join(__dir, "../../components/Header.tsx"), "utf8");
    expect(ui).toContain("isAdminHeaderPath");
    expect(ui).toMatch(/shouldSuppressGlobalSiteNav[\s\S]*isAdminHeaderPath/);
    expect(header).toContain('data-tt-marketing-header-site-nav={showSiteNav ? "1" : "0"}');
    expect(header).toContain("data-tt-traveltrust-header-merged-chrome-l5");
    expect(readFileSync(join(cinematicDir, "TravelTrustFaqStrip.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-faq-warm-plate-l5",
    );
    expect(readFileSync(join(cinematicDir, "TravelTrustCinematicHero.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-hero-cta-primary-pulse-l5",
    );
  });
});
