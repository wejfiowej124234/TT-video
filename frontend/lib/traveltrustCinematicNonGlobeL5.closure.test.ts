import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_CINEMATIC_NON_GLOBE_ANIMATED_FILES,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_BATCHES,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_CODE_COMPLETE_AT,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ENGINEERING_LOCK,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_MODULES,
} from "@/lib/traveltrust/l5";

const REPO = join(__dirname, "..", "..");
const CINEMATIC = join(REPO, "frontend/components/traveltrust/cinematic");
const L5_DIR = join(REPO, "frontend/lib/traveltrust/l5");

function readL5SourceBundle(): string {
  return [
    "frontend/lib/traveltrustCinematicNonGlobeL5.ts",
    "frontend/lib/traveltrust/l5/meta.ts",
    "frontend/lib/traveltrust/l5/rhythm.ts",
    "frontend/lib/traveltrust/l5/sections-layout.ts",
    "frontend/lib/traveltrust/l5/atmosphere.ts",
    "frontend/lib/traveltrust/l5/hero-ui.ts",
    "frontend/lib/traveltrust/l5/theater.ts",
    "frontend/lib/traveltrust/l5/landing-chrome.ts",
    "frontend/lib/traveltrust/l5/start.ts",
    "frontend/lib/traveltrust/l5/economy.ts",
    "frontend/lib/traveltrust/l5/footer.ts",
    "frontend/lib/traveltrust/l5/shell-legacy.ts",
    "frontend/lib/traveltrust/l5/resolvers.ts",
    "frontend/lib/traveltrust/l5/hero-canvas.ts",
    "frontend/lib/traveltrust/l5/anchors.ts",
  ]
    .map((rel) => readFileSync(join(REPO, rel), "utf8"))
    .join("\n");
}

const PAGE_SCENE_L5_ANCHOR_FILES = [
  "page-scene/PageTravelCorridorRing.tsx",
  "page-scene/PageCinematicEnvironment.tsx",
] as const;

const PAGE_SCENE_FILES = [
  ...PAGE_SCENE_L5_ANCHOR_FILES,
  "page-scene/PageHeroGlobeRig.tsx",
  "page-scene/PageCinematicCameraRig.tsx",
  "page-scene/PageHeroGlobeWarmShell.tsx",
] as const;

function readPageSceneBundle(): string {
  return PAGE_SCENE_FILES.map((rel) => readFileSync(join(CINEMATIC, rel), "utf8")).join("\n");
}

const L5_COMPONENT_FILES = [
  "TravelTrustPageCinematicCanvas.tsx",
  ...PAGE_SCENE_L5_ANCHOR_FILES,
  "TravelTrustIdentityTheater.tsx",
  "TravelTrustRoleVideoPlayer.tsx",
  "TravelTrustRouteArc.tsx",
  "TravelTrustStartSection.tsx",
  "TravelTrustStartRoutePreview.tsx",
  "TravelTrustTrustFactsStrip.tsx",
  "TravelTrustFaqStrip.tsx",
  "TravelTrustSettlementStrip.tsx",
  "TravelTrustScrollProgress.tsx",
  "TravelTrustPulseTicker.tsx",
  "TravelTrustBelowFoldAtmosphere.tsx",
  "TravelTrustHorizonArc.tsx",
  "TravelTrustSectionFilmDivider.tsx",
  "TravelTrustLandingChrome.tsx",
  "TravelTrustCinematicFallbackNotice.tsx",
  "TravelTrustReducedMotionNotice.tsx",
  "TravelTrustCinematicHero.tsx",
  "TravelTrustBelowFoldAtmosphere.tsx",
  "TravelTrustRouteArc.tsx",
  "TravelTrustLandingNav.tsx",
  "TravelTrustHeroReduceMotionStars.tsx",
  "TravelTrustCinematicLowQualityToggle.tsx",
  "TravelTrustCinematicShell.tsx",
  "TravelTrustBelowFoldSections.tsx",
  "TravelTrustCinematicViewportInk.tsx",
  "TravelTrustHeroFilmChrome.tsx",
  "TravelTrustCinematicScene3D.tsx",
  "TravelTrustTheaterScene3D.tsx",
  "TravelTrustHeroChainHud.tsx",
  "TravelTrustHeroGuidance.tsx",
  "TravelTrustStablecoinGateway.tsx",
  "TravelTrustHeroWalletConnect.tsx",
  "TravelTrustNetworkFooter.tsx",
  "TravelTrustFooterCrossNav.tsx",
  "TravelTrustDevChunkRecoveryNotice.tsx",
  "TravelTrustPageComplianceBlock.tsx",
  "TravelTrustPageBriefModeBadge.tsx",
  "TravelTrustIllustrativeBadge.tsx",
] as const;

const COLD_COLOR_PATTERN = /ref-teal|ref-cyan|#23ced9|rgba\(35,\s*206,\s*217\)/;
const HOME_BELOW_FOLD_SHELL = join(REPO, "frontend/lib/traveltrust/home/BelowFoldSectionsShell.tsx");

/** Below-fold 外壳迁至 home lib；closure 扫描 cinematic 文件时并入 shell 源 */
function readCinematicComponentSource(file: string): string {
  const src = readFileSync(join(CINEMATIC, file), "utf8");
  if (file === "TravelTrustBelowFoldSections.tsx" && existsSync(HOME_BELOW_FOLD_SHELL)) {
    return `${src}\n${readFileSync(HOME_BELOW_FOLD_SHELL, "utf8")}`;
  }
  return src;
}

describe("traveltrustCinematicNonGlobeL5 closure", () => {
  it("exports sprint id and module list", () => {
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID).toBe("TT-CINEMATIC-L5-NON-GLOBE-2026-05");
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_MODULES.length).toBeGreaterThanOrEqual(10);
  });

  it("L5 cinematic components carry non-globe anchor", () => {
    for (const file of L5_COMPONENT_FILES) {
      const abs = join(CINEMATIC, file);
      expect(existsSync(abs), `missing ${file}`).toBe(true);
      const src = readCinematicComponentSource(file);
      const anchored =
        src.includes("data-tt-traveltrust-cinematic-non-globe-l5") ||
        src.includes("traveltrustSectionL5DataAttrs") ||
        src.includes("ttTraveltrustCinematicNonGlobeL5");
      expect(anchored, file).toBe(true);
    }
  });

  it("scroll progress bar avoids cold teal tail", () => {
    const src = readFileSync(join(CINEMATIC, "TravelTrustScrollProgress.tsx"), "utf8");
    expect(src).not.toContain("to-ref-teal");
    expect(src).toContain("TT_SCROLL_PROGRESS_L5");
    expect(src).toContain("chromeDockClass");
    expect(src).not.toMatch(/chromeDockClass[\s\S]*hidden\s+sm:flex/);
  });

  it("start section uses lg two-column grid for route preview", () => {
    const src = readFileSync(join(CINEMATIC, "TravelTrustStartSection.tsx"), "utf8");
    expect(src).toContain("TT_START_SECTION_L5.mainGridClass");
    expect(src).toContain("data-tt-traveltrust-start-preview-col-l5");
    expect(src).toContain("data-tt-traveltrust-start-preview-col-entrance-l5");
  });

  it("hero scroll hint sits outside copy card", () => {
    const hero = readFileSync(join(CINEMATIC, "TravelTrustCinematicHero.tsx"), "utf8");
    expect(hero).toContain("data-tt-traveltrust-hero-scroll-hint=\"outside-card\"");
    expect(hero).toContain("TT_SCROLL_HINT_L5.outsideCardClass");
    expect(hero).toContain("data-tt-traveltrust-hero-cta-primary-pulse-l5");
    expect(hero).toContain("TT_HERO_CTA_L5.primaryPulseClass");
  });

  it("faq warm plate and traveltrust header keeps L0 site nav visible", () => {
    const faq = readFileSync(join(CINEMATIC, "TravelTrustFaqStrip.tsx"), "utf8");
    const header = readFileSync(join(REPO, "frontend/components/Header.tsx"), "utf8");
    const ui = readFileSync(join(REPO, "frontend/lib/uiSystem.ts"), "utf8");
    expect(faq).toContain("data-tt-traveltrust-faq-warm-plate-l5");
    const trust = readFileSync(join(CINEMATIC, "TravelTrustTrustFactsStrip.tsx"), "utf8");
    expect(trust).toContain("data-tt-traveltrust-trust-warm-plate-l5");
    expect(faq).toContain("TT_FAQ_ACCORDION_L5.warmPlateClass");
    expect(header).toContain("data-tt-traveltrust-header-merged-chrome-l5");
    expect(ui).toContain("isAdminHeaderPath");
    expect(ui).toMatch(/shouldSuppressGlobalSiteNav[\s\S]*isAdminHeaderPath/);
    const stable = readFileSync(join(CINEMATIC, "TravelTrustStablecoinGateway.tsx"), "utf8");
    expect(readFileSync(join(CINEMATIC, "TravelTrustBelowFoldSections.tsx"), "utf8")).toContain(
      "data-tt-traveltrust-economy-cluster-atmosphere-l5",
    );
    expect(stable).toContain("traveltrustLiquidityGatewayModel");
    expect(stable).toContain("data-tt-traveltrust-ttg-gateway-preview");
    expect(stable).not.toContain('to: "USDC"');
    expect(stable).not.toContain('from: "USDT", to: "USDC"');
    const settlement = readFileSync(join(CINEMATIC, "TravelTrustSettlementStrip.tsx"), "utf8");
    expect(settlement).not.toContain("data-tt-traveltrust-settlement-atmosphere-l5");
    const lib = readL5SourceBundle();
    const navSlot = readFileSync(
      join(REPO, "frontend/modules/traveltrust-home/presentation/TravelTrustHomeLandingNavSlot.tsx"),
      "utf8",
    );
    expect(lib).toContain("export const TT_LANDING_CHROME_L5");
    expect(navSlot).toContain("TT_MARKETING_SITE_HEADER_STICKY_OFFSET_TRAVELTRUST_L1_CLASS");
  });

  it("scroll chrome pill is shared with hero scroll hint", () => {
    const lib = readL5SourceBundle();
    expect(lib).toContain("TT_SCROLL_CHROME_PILL_L5");
    expect(lib).toMatch(/TT_SCROLL_HINT_L5_CLASS[\s\S]*TT_SCROLL_CHROME_PILL_L5/);
    const hero = readFileSync(join(CINEMATIC, "TravelTrustCinematicHero.tsx"), "utf8");
    expect(hero).toContain("TT_SCROLL_HINT_L5_CLASS");
  });

  it("hero-theater handoff uses ink bridge and theater top scrim (no cold border-t)", () => {
    const below = readCinematicComponentSource("TravelTrustBelowFoldSections.tsx");
    const theater = readFileSync(join(CINEMATIC, "TravelTrustIdentityTheater.tsx"), "utf8");
    const divider = readFileSync(join(CINEMATIC, "TravelTrustSectionFilmDivider.tsx"), "utf8");
    expect(below).toContain("data-tt-traveltrust-below-hero-ink-bridge-l5");
    expect(below).toContain("data-tt-traveltrust-below-fold-scroll-plate-l5");
    expect(divider).toContain("data-tt-traveltrust-section-film-divider-handoff-l5");
    expect(theater).toContain("data-tt-traveltrust-theater-top-handoff-l5");
    expect(theater).toContain("data-tt-traveltrust-theater-top-cap-l5");
    expect(theater).toMatch(/animate=\{showTheater \? \{ y: 0 \}/);
    expect(theater).toContain("TT_THEATER_SECTION_L5.sectionSurfaceClass");
    expect(theater).toContain("TT_THEATER_SECTION_L5.roleMetaPanelClass");
    expect(theater).not.toMatch(/border-t\s+border-white\/10/);
  });

  it("page vertical rhythm token is wired in section surfaces", () => {
    const lib = readL5SourceBundle();
    const rhythm = readFileSync(join(L5_DIR, "rhythm.ts"), "utf8");
    expect(lib).toContain("TT_PAGE_VERTICAL_RHYTHM_L5");
    expect(rhythm).toContain('sectionY: "py-8 sm:py-9"');
    expect(lib).toContain("flex-nowrap");
    const pulse = readFileSync(join(CINEMATIC, "TravelTrustPulseTicker.tsx"), "utf8");
    expect(pulse).toContain("marqueeListClass");
    expect(pulse).toContain("inlineStaticListClass");
    expect(pulse).toContain("data-tt-traveltrust-pulse-inline-static-l5");
    expect(pulse).toContain("data-tt-traveltrust-pulse-inline-marquee-l5");
    expect(pulse).toContain("inlineMarqueeTrackClass");
    const roleVideo = readFileSync(join(CINEMATIC, "TravelTrustRoleVideoPlayer.tsx"), "utf8");
    expect(roleVideo).toContain("placeholderCopyClass");
    const theater = readFileSync(join(CINEMATIC, "TravelTrustIdentityTheater.tsx"), "utf8");
    expect(theater).toContain("theaterPanelFrameClass");
    expect(theater).toContain("data-tt-traveltrust-theater-panel-frame-l5");
    const landingNav = readFileSync(join(CINEMATIC, "TravelTrustLandingNav.tsx"), "utf8");
    expect(landingNav).toContain("data-tt-traveltrust-landing-nav-no-more");
    expect(landingNav).toContain("showOverflowMenu = !embedded");
    expect(lib).toContain("heroSplitFeatherClass");
    expect(lib).toContain("ambientShimmerRepeat: 0");
    expect(lib).toContain("posterShimmerRepeat: 0");
  });

  it("role video poster carries warm grade overlay", () => {
    const src = readFileSync(join(CINEMATIC, "TravelTrustRoleVideoPlayer.tsx"), "utf8");
    expect(src).toContain("data-tt-traveltrust-role-video-poster-warm-l5");
    expect(src).toContain("TT_ROLE_VIDEO_L5.posterWarmGradeClass");
    expect(src).toContain("TT_ROLE_VIDEO_L5.placeholderFrameClass");
    const roleVideoSrc = readFileSync(join(CINEMATIC, "TravelTrustRoleVideoPlayer.tsx"), "utf8");
    expect(roleVideoSrc).toContain("warmUi.flash");
    expect(roleVideoSrc).toContain("preferWarmPlaceholder");
    expect(roleVideoSrc).toContain("data-tt-traveltrust-role-video-warm-placeholder-l5");
  });

  it("trust faq settlement liquidity sections use warm surface not cold border-t", () => {
    for (const file of [
      "TravelTrustTrustFactsStrip.tsx",
      "TravelTrustFaqStrip.tsx",
      "TravelTrustSettlementStrip.tsx",
    ] as const) {
      const src = readFileSync(join(CINEMATIC, file), "utf8");
      expect(src).toContain("TT_SECTION_SURFACE_L5");
      expect(src).not.toMatch(/border-t\s+border-white\/10/);
    }
    const stable = readFileSync(join(CINEMATIC, "TravelTrustStablecoinGateway.tsx"), "utf8");
    expect(stable).toContain("TT_STABLECOIN_GATEWAY_L5.sectionSurfaceClass");
    expect(stable).toContain("data-tt-traveltrust-liquidity-disclaimer-single-l5");
    expect(stable).toContain("data-tt-traveltrust-liquidity-section-header-l5");
    expect(stable).toContain("TT_STABLECOIN_GATEWAY_L5.sectionHeaderClass");
    const libSettlement = readL5SourceBundle();
    expect(libSettlement).toMatch(/TT_SETTLEMENT_L5[\s\S]*protocolShellClass[\s\S]*max-w-3xl/);
    expect(stable).not.toMatch(/border-t\s+border-white\/10/);
  });

  it("landing chrome and nav use warm L5 chrome tokens", () => {
    const nav = readFileSync(join(CINEMATIC, "TravelTrustLandingNav.tsx"), "utf8");
    const chrome = readFileSync(join(CINEMATIC, "TravelTrustLandingChrome.tsx"), "utf8");
    const libChrome = readL5SourceBundle();
    expect(nav).toContain("TT_LANDING_NAV_L5.mobileToggleClass");
    expect(chrome).toContain('data-tt-traveltrust-landing-chrome-layout="stacked-dual-row-l5"');
    expect(chrome).toContain("TT_LANDING_CHROME_L5.shellClass");
    expect(chrome).toContain("TT_LANDING_CHROME_L5.liveSlotClass");
    expect(chrome).toContain("data-tt-traveltrust-landing-chrome-slim-l5");
    expect(chrome).toContain('data-tt-traveltrust-landing-chrome-layout="stacked-dual-row-l5"');
    expect(chrome).toContain("data-tt-traveltrust-landing-chrome-live-slot-l5");
    expect(chrome).toContain("data-tt-traveltrust-landing-chrome-pulse-row-l5");
    expect(libChrome).toContain("liveSlotClass");
    expect(libChrome).not.toContain("xl:grid-cols-[minmax(0,1fr)_minmax(12rem,42%)]");
    const styles = readFileSync(join(REPO, "frontend/lib/traveltrustLandingNavStyles.ts"), "utf8");
    expect(styles).toContain("border-ref-sun/20");
    expect(styles).not.toContain("border-white/20");
  });

  it("footer and reduced-motion use warm divider/dismiss tokens", () => {
    const footer = readFileSync(join(CINEMATIC, "TravelTrustFooterCrossNav.tsx"), "utf8");
    const network = readFileSync(join(CINEMATIC, "TravelTrustNetworkFooter.tsx"), "utf8");
    const notice = readFileSync(join(CINEMATIC, "TravelTrustReducedMotionNotice.tsx"), "utf8");
    expect(footer).toContain("traveltrust_footer_plan");
    expect(footer).toContain("/traveltrust#start");
    expect(footer).not.toContain("data-tt-traveltrust-footer-site-map-panel-l5");
    expect(footer).not.toContain("traveltrust_footer_network");
    expect(footer).not.toContain("MARKETING_SITE_FOOTER_ID");
    expect(footer).toContain("traveltrust_footer_governance_hub");
    expect(network).toContain("data-tt-traveltrust-network-footer-ambience-l5");
    expect(notice).toContain("TT_REDUCED_MOTION_NOTICE_L5.dismissButtonClass");
  });

  it("theater route arc has flow boost anchor", () => {
    const src = readFileSync(join(CINEMATIC, "TravelTrustRouteArc.tsx"), "utf8");
    expect(src).toContain("data-tt-traveltrust-route-arc-theater-flow-l5");
    expect(src).toContain("theaterContainerOpacity");
  });

  it("interaction and CTA motion use L5 hover/tap tokens not ad-hoc values", () => {
    const theater = readFileSync(join(CINEMATIC, "TravelTrustIdentityTheater.tsx"), "utf8");
    const settlement = readFileSync(join(CINEMATIC, "TravelTrustSettlementStrip.tsx"), "utf8");
    const footer = readFileSync(join(CINEMATIC, "TravelTrustFooterCrossNav.tsx"), "utf8");
    expect(theater).toContain("TT_THEATER_ROLE_CTA_L5.primaryHover");
    expect(settlement).toContain("data-tt-traveltrust-settlement-protocol-open-glow-l5");
    expect(footer).toContain("data-tt-traveltrust-footer-trust-details-warm-l5");
    const theaterRole = readFileSync(join(CINEMATIC, "TravelTrustIdentityTheater.tsx"), "utf8");
    expect(theaterRole).not.toMatch(/border-white\/15/);
  });

  it("ambient polish anchors for horizon placeholder scroll hint and canvas bridge", () => {
    const horizon = readFileSync(join(CINEMATIC, "TravelTrustHorizonArc.tsx"), "utf8");
    const placeholder = readFileSync(join(CINEMATIC, "TravelTrustBelowFoldSections.tsx"), "utf8");
    const hero = readFileSync(join(CINEMATIC, "TravelTrustCinematicHero.tsx"), "utf8");
    const canvas = readFileSync(join(CINEMATIC, "TravelTrustPageCinematicCanvas.tsx"), "utf8");
    expect(horizon).toContain("data-tt-traveltrust-horizon-ground-glow-l5");
    expect(placeholder).toContain("data-tt-traveltrust-below-fold-placeholder-warm-core-l5");
    expect(hero).toContain("data-tt-traveltrust-scroll-hint-mobile-pulse-l5");
    expect(canvas).toContain("data-tt-traveltrust-canvas-hero-bridge-shimmer-l5");
  });

  it("hero chrome utilities use warm L5 recovery and wallet tokens", () => {
    const fallback = readFileSync(join(CINEMATIC, "TravelTrustCinematicFallbackNotice.tsx"), "utf8");
    const wallet = readFileSync(join(CINEMATIC, "TravelTrustHeroWalletConnect.tsx"), "utf8");
    const badge = readFileSync(join(CINEMATIC, "TravelTrustPageBriefModeBadge.tsx"), "utf8");
    const chunk = readFileSync(join(CINEMATIC, "TravelTrustDevChunkRecoveryNotice.tsx"), "utf8");
    expect(fallback).toContain("data-tt-traveltrust-webgl-fallback-recovery-l5");
    const lib = readL5SourceBundle();
    expect(lib).toMatch(/TT_WEBGL_FALLBACK_L5[\s\S]*pointer-events-auto/);
    const roleVideo = readFileSync(join(CINEMATIC, "TravelTrustRoleVideoPlayer.tsx"), "utf8");
    expect(roleVideo).toContain("data-tt-traveltrust-role-video-tourism-hint-l5");
    expect(roleVideo).toContain("traveltrust_role_video_placeholder_tourism");
    expect(fallback).not.toContain("border-white/20");
    expect(wallet).toContain("data-tt-traveltrust-hero-wallet-menu-shimmer-l5");
    const quality = readFileSync(join(CINEMATIC, "TravelTrustCinematicLowQualityToggle.tsx"), "utf8");
    expect(quality).toContain("TT_CINEMATIC_QUALITY_L5.activePulseRepeat");
    expect(quality).not.toContain("Infinity");
    const compliance = readFileSync(join(CINEMATIC, "TravelTrustPageComplianceBlock.tsx"), "utf8");
    expect(compliance).toContain("data-tt-traveltrust-page-compliance-readable-l5");
    const pulse = readFileSync(join(CINEMATIC, "TravelTrustPulseTicker.tsx"), "utf8");
    expect(pulse).toContain("TT_PULSE_TICKER_L5.itemSeparatorClass");
    expect(pulse).toContain("TT_PULSE_TICKER_L5.labelSeparatorClass");
    expect(pulse).toContain("TT_PULSE_TICKER_L5.viewAllChevronClass");
    const zh = readFileSync(join(REPO, "frontend/locales/zh.ts"), "utf8");
    const en = readFileSync(join(REPO, "frontend/locales/en.ts"), "utf8");
    expect(zh).toContain("traveltrust_role_video_placeholder_tourism");
    expect(en).toContain("traveltrust_role_video_placeholder_tourism");
    const briefBanner = readFileSync(
      join(REPO, "frontend/components/traveltrust/TravelTrustPageBriefStatus.tsx"),
      "utf8",
    );
    expect(briefBanner).toContain("data-tt-traveltrust-page-brief-banner-l5");
    expect(briefBanner).toContain("focus-visible:ring-ref-sun/45");
    expect(briefBanner).not.toContain("ring-ref-cyan");
    const maybeRun = readFileSync(join(REPO, "scripts/gates/maybe-run-cinematic-l5-verify-on-diff.sh"), "utf8");
    expect(maybeRun).toContain("verify-cinematic-l5-local.sh");
    expect(maybeRun).toContain("frontend/components/traveltrust/cinematic");
    expect(badge).toContain("data-tt-traveltrust-page-brief-badge-demo-pulse-l5");
    expect(chunk).toContain("TT_DEV_CHUNK_NOTICE_L5.primaryButtonClass");
    expect(chunk).not.toMatch(/border-white\/20/);
  });

  it("scroll progress chrome uses warm token classes", () => {
    const src = readFileSync(join(CINEMATIC, "TravelTrustScrollProgress.tsx"), "utf8");
    expect(src).toContain("TT_SCROLL_PROGRESS_L5.chromeDockClass");
    expect(src).toContain("TT_SCROLL_PROGRESS_L5.chromeBaseClass");
    expect(src).toContain("TT_SCROLL_PROGRESS_L5.webglIdleHintClass");
    expect(src).not.toMatch(/bottom-4 right-4 z-\[28\]/);
    expect(src).not.toMatch(/border\s+border-white\/10\s+bg-\[#0a0908\]/);
  });

  it("start route preview has path glow layer", () => {
    const src = readFileSync(join(CINEMATIC, "TravelTrustStartRoutePreview.tsx"), "utf8");
    expect(src).toContain("data-tt-traveltrust-start-route-glow-l5");
    expect(src).toContain("pathGlowStrokeWidth");
    expect(src).toContain("animateMotion");
    expect(src).toContain("data-tt-traveltrust-start-route-hub-l5");
    expect(src).toContain("data-tt-traveltrust-start-route-hub-label-l5");
    expect(src).toContain("data-tt-traveltrust-start-route-hub-dot-inactive-l5");
    expect(src).toContain("data-tt-traveltrust-start-route-step-title-l5");
    expect(src).toContain("data-tt-traveltrust-start-route-copy-crossfade-l5");
    expect(src).toContain("AnimatePresence");
    expect(src).toContain('data-tt-traveltrust-start-route-hub-state={selected ? "active" : "inactive"}');
    expect(src).not.toContain("foreignObject");
    expect(src).toContain("data-tt-traveltrust-start-route-corridor-ghost-l5");
  });

  it("RouteArc does not reference frozen page L5 object at runtime", () => {
    const src = readFileSync(join(CINEMATIC, "TravelTrustRouteArc.tsx"), "utf8");
    expect(src).not.toContain("TT_CINEMATIC_PAGE_L5");
    expect(src).toContain("TT_ROUTE_ARC_L5.labelKeys");
    expect(src).toContain("TT_ROUTE_ARC_THEATER_LABELS_L5");
    expect(src).toContain("!isTheater");
    const theaterSrc = readFileSync(join(CINEMATIC, "TravelTrustIdentityTheater.tsx"), "utf8");
    expect(theaterSrc).toContain('variant="theater"');
  });

  it("PageCinematicScene uses warm corridor role colors not cold 3D table", () => {
    const src = readPageSceneBundle();
    expect(src).not.toContain("ROLE_CINEMATIC_3D_COLORS");
    expect(src).toContain("resolveTheaterRoleWarm3dHex");
  });

  it("PageCinematicScene anchors L5 on userData not data-* (R3F cannot set DOM attrs)", () => {
    const src = readPageSceneBundle();
    expect(src).not.toMatch(/<group[\s\S]*?data-tt-traveltrust/);
    expect(src).not.toMatch(/<mesh[\s\S]*?data-tt-traveltrust/);
    expect(src).toContain("ttTraveltrustCinematicNonGlobeL5");
  });

  it("tokenized animated tail components reference non-globe L5", () => {
    for (const file of TRAVELTRUST_CINEMATIC_NON_GLOBE_ANIMATED_FILES) {
      const src = readFileSync(join(CINEMATIC, file), "utf8");
      expect(src.includes("TT_HERO_COPY_UI_L5") || src.includes("TT_BELOW_FOLD_ATMOSPHERE_L5") || src.includes("TT_ROUTE_ARC_L5") || src.includes("TT_STABLECOIN_GATEWAY_L5"), file).toBe(true);
    }
  });

  it("L5 cinematic components avoid cold teal/cyan in markup", () => {
    for (const file of L5_COMPONENT_FILES) {
      const src = readFileSync(join(CINEMATIC, file), "utf8");
      expect(COLD_COLOR_PATTERN.test(src), `${file} cold color`).toBe(false);
    }
  });

  it("module ledger has no duplicate slugs", () => {
    const seen = new Set<string>();
    for (const slug of TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_MODULES) {
      expect(seen.has(slug), `duplicate module slug: ${slug}`).toBe(false);
      seen.add(slug);
    }
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_MODULES.length).toBeGreaterThanOrEqual(80);
  });

  it("landing nav uses high contrast scrim (TT-PH1-151 partial ①)", () => {
    const nav = readFileSync(join(CINEMATIC, "TravelTrustLandingNav.tsx"), "utf8");
    expect(nav).toContain('data-tt-traveltrust-landing-nav-contrast="high"');
    expect(nav).toContain("TT_LANDING_NAV_L5");
  });

  it("L1 pulse label cluster uses explicit warm contrast tokens (2026-06-03 freeze)", () => {
    const libChrome = readL5SourceBundle();
    expect(libChrome).toContain("labelSeparatorClass");
    expect(libChrome).toContain("viewAllChevronClass");
    expect(libChrome).toContain("rgba(249,215,121");
    const globals = readFileSync(join(REPO, "frontend/app/globals.css"), "utf8");
    expect(globals).toContain('[data-tt-traveltrust-pulse-label-cluster-l5="1"]');
    expect(globals).toContain('[data-tt-traveltrust-pulse-view-all="1"]');
    const freezeDoc = readFileSync(
      join(REPO, "frontend/evidence/GO_local_cinematic_l5_closure/L1-PULSE-LABEL-CONTRAST-FREEZE.md"),
      "utf8",
    );
    expect(freezeDoc).toContain("closed ①");
    expect(freezeDoc).toContain("TT_PULSE_TICKER_L5");
  });

  it("exposes engineering lock and batch ledger (W)", () => {
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_BATCHES).toBe("A-W");
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ENGINEERING_LOCK).toBe("2026-05-20");
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_CODE_COMPLETE_AT).toBe(
      TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ENGINEERING_LOCK,
    );
  });
});
