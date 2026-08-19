import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TT_Z, ttZClass } from "./traveltrustZ";

/** CSS z-index 仅接受整数；小数 arbitrary 会被浏览器当作 `auto` */
const DECIMAL_Z_INDEX_CLASS = /z-\[\d+\.\d+\]/g;
import { buildPageCinematicCanvasOverlayLayers } from "@/lib/traveltrustCinematicVisual";
import {
  buildHeroWarmCanvasOverlayLayers,
  buildHeroCanvasOverlayMaskImage,
  buildHeroGlobeKeepoutMaskImage,
  buildHeroFixedInkMaskImage,
  buildHeroOuterSkyWarmRingLayer,
  buildPageWarmInkFlatBackground,
  buildHeroWarmSkyBaseBackground,
  buildWarmPageCinematicCanvasOverlayLayers,
  buildHeroOuterSkyCanvasOverlayLayers,
  TT_CANVAS_HERO_SKY_CAP_L5,
  TT_HERO_SKY_VEIL_UNIFIED_L5,
  TT_HERO_FIXED_INK_MASK_L5,
  TT_HERO_SKY_WASH_L5,
  TT_HERO_DOM_SKY_VEIL_UNIFIED_L5,
  TT_HERO_EQUATOR_INK_STRIP_L5,
  remapCinematicFilmInkToWarmPageInk,
  resolveNonGlobeCanvasCyanMul,
  resolveNonGlobeCanvasScrollOpacity,
  resolveNonGlobeCorridorRingReveal,
  resolveNonGlobeDeepScrollCanvasInk,
  resolveNonGlobeHorizonFogOpacity,
  resolveNonGlobeEnvironmentOpacity,
  resolveNonGlobeEnvironmentVisible,
  resolveNonGlobeScrollWarmBandPeak,
  resolveNonGlobeSectionAtmosphere,
  resolveNonGlobeMobileBloomEnabled,
  resolveNonGlobeStarsSpeed,
  TT_HERO_REDUCE_MOTION_STARS_L5_BG,
  prefersTheaterWarmPlaceholder,
  resolveTheaterRoleWarmUi,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_BATCHES,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_CODE_COMPLETE_AT,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ENGINEERING_LOCK,
  TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_MODULES,
  TT_FAQ_ACCORDION_L5,
  TT_HERO_CHAIN_HUD_L5,
  TT_HERO_COPY_UI_L5,
  TT_HERO_CTA_L5,
  TT_SECTION_MOTION_L5,
  TT_HERO_GUIDANCE_L5,
  TT_LEGACY_3D_CONTENT_L5,
  TT_LEGACY_HERO_3D_SCRIM_L5,
  TT_PAGE_HORIZON_FOG_L5,
  TT_PAGE_LAYOUT_L5,
  TT_START_STEP_CYCLE_MS,
  TT_BELOW_FOLD_ATMOSPHERE_UNIFIED_L5,
  TT_CANVAS_STATIC_FALLBACK_L5,
  TT_HORIZON_ARC_L5,
  TT_PULSE_TICKER_L5,
  TT_ROLE_VIDEO_L5,
  TT_CORRIDOR_RING_L5,
  TT_ENVIRONMENT_L5_EXTRA,
  TT_ROUTE_ARC_L5,
  TT_ROUTE_ARC_THEATER_LABELS_L5,
  TT_STABLECOIN_GATEWAY_L5,
  TT_START_ROUTE_PATHS_L5,
  TT_START_ROUTE_HUBS_L5,
  TT_START_ROUTE_DESTINATIONS_L5,
  TT_START_ROUTE_CORRIDOR_GHOST_L5,
  TT_SCROLL_PROGRESS_L5,
  TT_START_ROUTE_PREVIEW_L5,
  TT_SETTLEMENT_L5,
  TT_START_STEP_L5,
  TT_THEATER_TAB_L5,
  TT_TRUST_FACTS_L5,
  TT_THEATER_ROLE_WARM_3D_HEX,
  TT_PAGE_CHAPTER_VIEWPORT_L5,
  TT_PAGE_SCROLL_SNAP_L5,
  TT_SECTION_SURFACE_L5,
  TT_THEATER_SECTION_L5,
  TT_WARM_ROUTE_ARC_SVG,
  TT_LANDING_NAV_L5,
  TT_PAGE_COMPLIANCE_L5,
  TT_START_SECTION_L5,
  TT_NETWORK_FOOTER_L5,
  TT_LEGACY_THEATER_3D_L5,
  resolveTheaterRoleWarm3dHex,
} from "@/lib/traveltrust/l5";
import {
  resolveCinematicCanvasCyanMul,
  resolveCinematicCorridorRingReveal,
  resolveCinematicEnvironmentOpacity,
} from "./traveltrustCinematicPageL5";

describe("traveltrustCinematicNonGlobeL5", () => {
  it("uses warm route arc stops without teal tail", () => {
    expect(TT_WARM_ROUTE_ARC_SVG.stop100).not.toContain("110, 105");
    expect(TT_START_STEP_CYCLE_MS).toBe(2800);
  });

  it("hides stars entirely deep in page scroll", () => {
    expect(resolveNonGlobeEnvironmentVisible(0.2, 0.75)).toBe(false);
    expect(resolveNonGlobeEnvironmentVisible(0.45, 0.25)).toBe(true);
  });

  it("fades environment harder in roles band", () => {
    const frozen = resolveCinematicEnvironmentOpacity(0.5, 0.5);
    const enhanced = resolveNonGlobeEnvironmentOpacity(0.5, 0.5);
    expect(enhanced).toBeLessThan(frozen);
    expect(resolveNonGlobeEnvironmentOpacity(0, 0)).toBe(1);
  });

  it("buildHeroWarmSkyBaseBackground is flat ink (no radial wash)", () => {
    expect(buildHeroWarmSkyBaseBackground("28%")).toBe("#0c0a09");
    expect(buildHeroWarmSkyBaseBackground("28%")).not.toMatch(/radial-gradient/i);
  });

  it("buildHeroCanvasOverlayMaskImage punches hole for globe under overlay", () => {
    const mask = buildHeroCanvasOverlayMaskImage("28%");
    expect(mask).toMatch(/transparent 0%, transparent 40%/);
    expect(mask).toMatch(/ellipse 72% 68%/);
    expect(mask).toContain("#000 72%");
  });

  it("buildHeroOuterSkyWarmRingLayer uses warm ink in the halo band", () => {
    const layer = buildHeroOuterSkyWarmRingLayer("28%");
    expect(layer).toContain("#0c0a09");
    expect(layer).toMatch(/rgba\(12,10,9/);
    expect(layer).not.toMatch(/35,206,217|8ecae8|030712/i);
  });

  it("uses flat page ink under canvas at hero top (same as theater)", () => {
    expect(buildHeroWarmSkyBaseBackground("28%")).toBe("#0c0a09");
    expect(buildPageWarmInkFlatBackground()).toBe("#0c0a09");
  });

  it("TT_CANVAS_HERO_SKY_CAP_L5 blocks WebGL upper sky with page ink", () => {
    expect(TT_CANVAS_HERO_SKY_CAP_L5.background).toBe("#0c0a09");
    expect(TT_CANVAS_HERO_SKY_CAP_L5.heroFadeEnd).toBeGreaterThan(0.5);
    expect(TT_HERO_DOM_SKY_VEIL_UNIFIED_L5.rootClass).toContain("bg-[#0c0a09]");
    expect(TT_HERO_FIXED_INK_MASK_L5.background).toBe("#0c0a09");
    expect(TT_HERO_SKY_WASH_L5.rootClass).toContain(ttZClass(TT_Z.HERO_SKY_WASH));
    expect(TT_HERO_SKY_WASH_L5.rootClass).not.toContain(ttZClass(TT_Z.HERO_SKY));
    expect(TT_HERO_EQUATOR_INK_STRIP_L5.rootClass).toContain(ttZClass(TT_Z.HERO_SKY));
    expect(TT_HERO_SKY_WASH_L5.rootClass).not.toMatch(DECIMAL_Z_INDEX_CLASS);
    expect(TT_HERO_SKY_WASH_L5.gradient).toContain("#0c0a09");
    expect(TT_HERO_DOM_SKY_VEIL_UNIFIED_L5.rootClass).toContain("inset-x-0");
  });

  it("hero sky-wash fades out above globe rim (not full-viewport solid block)", () => {
    expect(TT_CANVAS_HERO_SKY_CAP_L5.heightClass).toContain("100svh");
    expect(TT_HERO_DOM_SKY_VEIL_UNIFIED_L5.rootClass).toContain("56vh");
    expect(TT_HERO_DOM_SKY_VEIL_UNIFIED_L5.rootClass).not.toContain("100svh");
    expect(TT_HERO_SKY_WASH_L5.gradient).toContain("min(32vh");
    expect(TT_HERO_SKY_WASH_L5.gradient).toContain("transparent min(36vh");
    expect(TT_HERO_SKY_WASH_L5.gradient).not.toMatch(/rgba\(12,\s*10,\s*9,\s*0\./);
    expect(TT_HERO_SKY_WASH_L5.gradient).not.toContain("min(56vh");
    expect(TT_HERO_SKY_WASH_L5.gradient).not.toMatch(/min\(9[26]svh/);
  });

  it("uses zero canvas CSS overlay at hero top (globe + flat ink only)", () => {
    const layers = buildWarmPageCinematicCanvasOverlayLayers({
      heroT: 0,
      pageT: 0,
      heroSplitBlend: 0.6,
      heroBridgeEase: 0.1,
      trustBand: 0,
      globeOpticalX: "28%",
      cyanMul: 0,
    });
    expect(layers).toHaveLength(0);
  });

  it("buildHeroOuterSkyCanvasOverlayLayers warms halo outside globe only", () => {
    const layers = buildHeroOuterSkyCanvasOverlayLayers("28%");
    expect(layers).toContain("#0c0a09");
    expect(layers).not.toMatch(/35,206,217|3,\s*7,\s*18/i);
    expect(buildHeroGlobeKeepoutMaskImage("28%")).toMatch(/transparent 40%/);
    expect(buildHeroFixedInkMaskImage("28%")).toMatch(
      /linear-gradient\(to bottom,\s*#000 0%/,
    );
  });


  it("remaps frozen canvas overlays for warm-page tool path", () => {
    const layers = buildWarmPageCinematicCanvasOverlayLayers({
      heroT: 0.75,
      pageT: 0,
      heroSplitBlend: 0.6,
      heroBridgeEase: 0.1,
      trustBand: 0,
      globeOpticalX: "28%",
      cyanMul: 0.09,
    });
    const joined = layers.join(" ");
    expect(joined).not.toMatch(/rgba\(\s*3\s*,\s*7\s*,\s*18/);
    expect(joined).not.toMatch(/35,206,217/);
    expect(joined).toMatch(/rgba\(12,10,9/);
    expect(joined).not.toMatch(/ellipse 58% 52%/);
    expect(remapCinematicFilmInkToWarmPageInk("rgba(35,206,217,0.03)")).toContain("252,164,124");
  });

  it("buildHeroWarmCanvasOverlayLayers matches frozen page builder (archive canvas SSOT)", () => {
    const params = {
      heroT: 0,
      pageT: 0,
      heroSplitBlend: 0.6,
      heroBridgeEase: 0,
      trustBand: 0,
      globeOpticalX: "28%",
      cyanMul: 0,
    };
    expect(buildHeroWarmCanvasOverlayLayers(params).join(" ")).toBe(
      buildPageCinematicCanvasOverlayLayers(params).join(" "),
    );
  });

  it("falls back to remapped frozen overlays after hero scroll band", () => {
    const layers = buildWarmPageCinematicCanvasOverlayLayers({
      heroT: 0.75,
      pageT: 0.2,
      heroSplitBlend: 0.5,
      heroBridgeEase: 0.15,
      trustBand: 0,
      globeOpticalX: "28%",
    });
    expect(layers.join(" ")).not.toMatch(/35,206,217/);
  });

  it("attenuates cyan scrim more on page scroll", () => {
    const frozen = resolveCinematicCanvasCyanMul(0.3, 0.5);
    const enhanced = resolveNonGlobeCanvasCyanMul(0.3, 0.5);
    expect(enhanced).toBeLessThanOrEqual(frozen);
    expect(enhanced).toBe(0);
  });

  it("hides starfield on hero top (avoid purple sky mix)", () => {
    expect(resolveNonGlobeEnvironmentVisible(0, 0)).toBe(false);
    expect(resolveNonGlobeEnvironmentVisible(0.2, 0.1)).toBe(false);
  });

  it("zeros cyan scrim deep in page (FAQ/trust band)", () => {
    expect(resolveNonGlobeCanvasCyanMul(0.2, 0.55)).toBe(0);
    expect(resolveNonGlobeCanvasCyanMul(0.3, 0.55)).toBe(0);
    const heroBand = resolveNonGlobeCanvasCyanMul(0.25, 0.12);
    expect(heroBand).toBe(0);
  });

  it("keeps mobile corridor reveal readable vs frozen crush", () => {
    const frozenMobile = resolveCinematicCorridorRingReveal(0.5, 0.55, true);
    const enhancedMobile = resolveNonGlobeCorridorRingReveal(0.5, 0.55, true);
    expect(enhancedMobile).toBeGreaterThan(frozenMobile);
  });

  it("fades corridor ring and canvas ink deep in page scroll", () => {
    expect(resolveNonGlobeCorridorRingReveal(0.55, 0.48)).toBeGreaterThan(0.15);
    expect(resolveNonGlobeCorridorRingReveal(0.55, 0.92)).toBeLessThan(0.1);
    expect(resolveNonGlobeDeepScrollCanvasInk(0.5)).toBeLessThan(0.15);
    expect(resolveNonGlobeDeepScrollCanvasInk(0.92)).toBeGreaterThan(0.55);
    expect(resolveNonGlobeCanvasScrollOpacity(0.7)).toBe(1);
    expect(resolveNonGlobeCanvasScrollOpacity(0.95)).toBeLessThanOrEqual(0.12);
  });

  it("exposes warm theater accents without cold cyan flash", () => {
    for (const id of ["traveler", "guide", "merchant", "acquisition", "region_steward"] as const) {
      const ui = resolveTheaterRoleWarmUi(id);
      expect(ui.flash).not.toContain("ref-cyan");
      expect(ui.tabActive).not.toContain("ref-cyan");
    }
  });

  it("peaks warm band in theater scroll", () => {
    expect(resolveNonGlobeScrollWarmBandPeak(0.4, 0.5)).toBeGreaterThan(0.3);
  });

  it("slows stars when environment fades", () => {
    expect(resolveNonGlobeStarsSpeed(0)).toBeCloseTo(0.04, 2);
    expect(resolveNonGlobeStarsSpeed(1)).toBeCloseTo(0.28, 2);
  });

  it("uses warm section atmosphere without cyan", () => {
    const roles = resolveNonGlobeSectionAtmosphere("roles");
    expect(roles).not.toContain("35,206,217");
    expect(roles).toContain("252,164,124");
  });

  it("prefers warm placeholder for tier1 role media", () => {
    expect(prefersTheaterWarmPlaceholder("tier1-placeholder")).toBe(true);
    expect(prefersTheaterWarmPlaceholder("production")).toBe(false);
  });

  it("gates mobile bloom on scroll handoff", () => {
    expect(resolveNonGlobeMobileBloomEnabled(true, 0.5, 0.5, true)).toBe(false);
    expect(resolveNonGlobeMobileBloomEnabled(false, 0.5, 0.5, true)).toBe(true);
  });

  it("hero reduce-motion stars use warm glow", () => {
    expect(TT_HERO_REDUCE_MOTION_STARS_L5_BG).toContain("252,164,124");
    expect(TT_HERO_REDUCE_MOTION_STARS_L5_BG).not.toContain("35,206,217");
  });

  it("lists L5 module anchors", () => {
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_MODULES).toContain("faq");
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_MODULES).toContain("cinematic-shell");
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_MODULES.length).toBeGreaterThanOrEqual(14);
  });

  it("marks non-globe code complete and warm legacy fallbacks", () => {
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_CODE_COMPLETE_AT).toBe("2026-05-20");
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ENGINEERING_LOCK).toBe("2026-05-20");
    expect(TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_BATCHES).toBe("A-W");
    expect(TT_LEGACY_HERO_3D_SCRIM_L5).not.toContain("35,206,217");
    expect(TT_LEGACY_3D_CONTENT_L5.keyLight).toBe("#fca47c");
    expect(TT_PAGE_HORIZON_FOG_L5.color).toBe("#ffe8d4");
    expect(TT_PAGE_HORIZON_FOG_L5.opacityPeakMul).toBe(0);
    expect(resolveNonGlobeHorizonFogOpacity(0.5, 0.4)).toBe(0);
    expect(TT_PAGE_SCROLL_SNAP_L5.chapterBeatSnapClass).toContain("snap-always");
    expect(TT_PAGE_CHAPTER_VIEWPORT_L5.minHeightClass).toContain("100svh");
    expect(TT_THEATER_SECTION_L5.sectionSurfaceClass).not.toContain("snap-always");
    expect(TT_THEATER_SECTION_L5.sectionSurfaceClass).not.toContain("min-h-[100svh]");
    expect(TT_SECTION_SURFACE_L5.faq).not.toContain("min-h-[100svh]");
    expect(TT_START_SECTION_L5.sectionClass).not.toContain("min-h-[100svh]");
    expect(TT_NETWORK_FOOTER_L5.shellGroupedClass).toContain("border-t-0");
    const globals = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");
    expect(globals).toContain("html.tt-traveltrust-scroll-snap-y");
    expect(globals).toContain("scroll-snap-type: y mandatory");
    expect(globals).toContain('data-tt-scroll-snap-strength="proximity"');
    expect(globals).toContain('data-tt-traveltrust-scroll-chapter-viewport="1"');
    expect(TT_PAGE_SCROLL_SNAP_L5.chapterBeatHero).toBe("hero");
    expect(TT_THEATER_SECTION_L5.mobileTablistClass).toContain("ref-sun");
    expect(TT_HERO_CHAIN_HUD_L5.connectedDotClass).toBe("bg-ref-sun");
    expect(TT_FAQ_ACCORDION_L5.panelDuration).toBe(0.28);
    expect(TT_START_STEP_L5.activePulseDuration).toBe(2.6);
    expect(TT_START_STEP_L5.activePulseRepeat).toBe(Infinity);
    expect(TT_START_ROUTE_PREVIEW_L5.stepCopyFadeY).toBe(0);
    expect(TT_START_ROUTE_PREVIEW_L5.copyShellMinHeightClass).toContain("min-h-");
    expect(TT_START_STEP_L5.activeClass).toContain("bg-gradient");
    expect(TT_START_ROUTE_PREVIEW_L5.cardBorderPulseRepeat).toBe(0);
    expect(TT_PULSE_TICKER_L5.marqueeDuration).toBe(48);
    expect(TT_PULSE_TICKER_L5.inlineUsesStaticScroll).toBe(false);
    expect(TT_PULSE_TICKER_L5.inlineMarqueeTrackClass).toContain("tt-traveltrust-pulse-inline-marquee-track");
    expect(TT_PULSE_TICKER_L5.inlineMarqueeDuration).toBe(72);
    expect(TT_PULSE_TICKER_L5.itemClass).toContain("min-h-[1.875rem]");
    expect(TT_PAGE_LAYOUT_L5.heroContentOffsetClass).toContain("5.5rem");
    expect(TT_HERO_CTA_L5.primaryPulse.repeat).toBe(0);
    expect(TT_START_STEP_L5.upcomingClass).toContain("text-slate-200");
    expect(resolveTheaterRoleWarm3dHex("traveler").primary).toBe("#fca47c");
    expect(TT_THEATER_ROLE_WARM_3D_HEX.guide.primary).not.toContain("23ced9");
    expect(TT_SETTLEMENT_L5.protocolPanelMotion.duration).toBe(0.28);
    expect(TT_TRUST_FACTS_L5.childStaggerBase).toBe(0.08);
    expect(TT_THEATER_TAB_L5.indicatorSpring.stiffness).toBe(380);
    expect(TT_CANVAS_STATIC_FALLBACK_L5.layers[0]).toContain("252,164,124");
    expect(TT_SCROLL_PROGRESS_L5.barFadeDuration).toBe(0.28);
    expect(TT_SCROLL_PROGRESS_L5.chromeDockClass).toContain("left-4");
    expect(TT_PULSE_TICKER_L5.itemBodyClass).toContain("text-white/95");
    expect(TT_START_ROUTE_PREVIEW_L5.hubFill).toBe("#fca47c");
    expect(TT_HORIZON_ARC_L5.travelers.length).toBe(3);
    expect(TT_ROLE_VIDEO_L5.playCtaPulseDuration).toBe(0.85);
    expect(TT_ROLE_VIDEO_L5.playCtaPulseRepeat).toBe(0);
    expect(TT_ROLE_VIDEO_L5.flashPeakOpacity).toBe(0.14);
    expect(TT_SCROLL_PROGRESS_L5.handoffAnchorSection).toBe("liquidity");
    expect(TT_PULSE_TICKER_L5.inlineMarqueeDuration).toBe(72);
    expect(TT_ROLE_VIDEO_L5.frameBorderPulse.duration).toBe(3.2);
    expect(TT_HORIZON_ARC_L5.ambientShimmerDuration).toBe(5.6);
    expect(TT_FAQ_ACCORDION_L5.triggerTap.scale).toBe(0.992);
    expect(TT_HERO_COPY_UI_L5.copyShimmerDuration).toBe(1.4);
    expect(TT_HERO_COPY_UI_L5.copyShimmerRepeat).toBe(0);
    expect(TT_SECTION_MOTION_L5.start.duration).toBe(0.62);
    expect(TT_ROUTE_ARC_L5.labelKeys).toHaveLength(3);
    expect(TT_START_ROUTE_PATHS_L5).toHaveLength(3);
    expect(TT_START_ROUTE_HUBS_L5).toHaveLength(3);
    expect(TT_START_ROUTE_DESTINATIONS_L5).toHaveLength(3);
    expect(TT_START_ROUTE_CORRIDOR_GHOST_L5).toContain("M 14 44");
    expect(TT_LANDING_NAV_L5.linkTap.scale).toBe(0.98);
    expect(TT_BELOW_FOLD_ATMOSPHERE_UNIFIED_L5.background).toContain("radial-gradient");
    expect(TT_START_SECTION_L5.ghostCtaTap.scale).toBe(0.98);
    expect(TT_START_STEP_L5.itemClass).toContain("py-3");
    expect(TT_START_ROUTE_PREVIEW_L5.cardClass).toContain("p-4");
    expect(TT_HERO_COPY_UI_L5.trustChipHover.y).toBe(-2);
    expect(TT_LEGACY_THEATER_3D_L5.wrapperOpacityMin).toBe(0.35);
    expect(TT_ROUTE_ARC_THEATER_LABELS_L5[0].labelY).toBe(12);
    expect(TT_ROUTE_ARC_THEATER_LABELS_L5[0].labelX).toBe(58);
    expect(TT_ROLE_VIDEO_L5.playHaloDuration).toBe(1.1);
    expect(TT_ROLE_VIDEO_L5.frameClass).toContain("aspect-video");
    expect(TT_ROLE_VIDEO_L5.frameClass).not.toContain("aspect-auto");
    expect(TT_ROLE_VIDEO_L5.frameClass).not.toContain("58vh");
    expect(TT_STABLECOIN_GATEWAY_L5.amountLockedClass).toContain("border-ref-sun");
    expect(TT_CORRIDOR_RING_L5.primaryLineWidth).toBeGreaterThan(1);
    expect(TT_ENVIRONMENT_L5_EXTRA.rolesHideStarsPageT).toBeLessThan(0.68);
  });
});

describe("Hero airspace 3D tokens", () => {
  it("uses warm ink sky and no cold sky-blue in node palette", async () => {
    const { TT_BRAND_3D, TT_CINEMATIC_3D_BG, TT_CINEMATIC_NODE_COLORS } = await import(
      "@/components/traveltrust/cinematic/traveltrustCinematic3dConfig"
    );
    expect(TT_BRAND_3D.sky).toBe(TT_CINEMATIC_3D_BG);
    expect(TT_CINEMATIC_NODE_COLORS.join(",")).not.toMatch(/7dd3fc|08074d/i);
  });
});

describe("traveltrustCinematicNonGlobeL5 · no decimal z-index", () => {
  it("L5 domain sources must not use decimal z-[n.m]", () => {
    const domains = [
      "meta.ts",
      "rhythm.ts",
      "sections-layout.ts",
      "atmosphere.ts",
      "hero-ui.ts",
      "theater.ts",
      "landing-chrome.ts",
      "start.ts",
      "economy.ts",
      "footer.ts",
      "shell-legacy.ts",
      "resolvers.ts",
      "hero-canvas.ts",
    ];
    for (const file of domains) {
      const src = readFileSync(join(__dirname, "traveltrust/l5", file), "utf8");
      expect(src.match(DECIMAL_Z_INDEX_CLASS), file).toBeNull();
    }
  });

  it("facade re-exports L5 domains", () => {
    const facade = readFileSync(join(__dirname, "traveltrustCinematicNonGlobeL5.ts"), "utf8");
    expect(facade).toContain('export * from "./traveltrust/l5/hero-ui"');
    expect(facade).toContain('export * from "./traveltrust/l5/anchors"');
  });
});
