/**
 * 全页电影动画 L5 token（`TT-CINEMATIC-L5-2026-05` · ①）
 * Hero 地球见 `TT_CINEMATIC_GLOBE_VISUAL` / `TT-GLOBE-L5-2026-05`。
 */

import { smoothstep } from "@/components/traveltrust/cinematic/traveltrustCinematicEasing3d";

export const TRAVELTRUST_CINEMATIC_L5_SPRINT_ID = "TT-CINEMATIC-L5-2026-05" as const;

/**
 * Hero 地球暖色板（L5 P0 · 压冷青）
 * @frozen TT-GLOBE-L5-FROZEN-2026-05 — see `traveltrustHeroGlobeFrozenManifest.ts`
 */
export const TT_HERO_GLOBE_L5_PALETTE = {
  tierGlow: {
    S: "#fca47c",
    A: "#ffc896",
    B: "#f0b878",
  },
  arc: {
    flagship: "#ffb070",
    corridor: "#fca47c",
    glowHalo: "#f0dcc8",
    tierA: "#ffc896",
    /** 流动点缀：暖杏（不用冷青 mint） */
    pulseAccent: "#ffd4a8",
    pulseWhite: "#fff7ed",
    arcCore: "#ffd8b8",
    arcMid: "#ffb878",
  },
} as const;

/** 滚动后「走廊环」— 旅游暖色 + 枢纽标记 */
export const TT_CINEMATIC_PAGE_L5 = {
  heroGlobe: TT_HERO_GLOBE_L5_PALETTE,
  theaterCorridorRing: {
    primary: "#fca47c",
    secondary: "#ffe8d4",
    pulse: "#fff7ed",
    mint: "#6ee7b7",
    lineOpacity: 0.2,
    lineOpacityActive: 0.32,
    pulseScale: 0.048,
    /** 走廊环上示意枢纽（curve 参数 0–1） */
    hubMarkers: [
      { t: 0.16, regionId: "us" },
      { t: 0.38, regionId: "fr" },
      { t: 0.58, regionId: "cn" },
      { t: 0.76, regionId: "jp" },
      { t: 0.9, regionId: "sg" },
    ] as const,
    /** 主示意走廊弦（两点 t） */
    flightChord: { fromT: 0.38, toT: 0.76 },
  },
  environment: {
    fadeHeroStart: 0.28,
    fadeHeroEnd: 0.62,
    fadePageStart: 0.42,
    fadePageEnd: 0.78,
    minOpacity: 0,
    hideBelow: 0.08,
    horizonOpacityPeak: 0.22,
  },
  scrollHandoff: {
    decorFadeHeroStart: 0.2,
    decorFadeHeroEnd: 0.66,
    ringRevealPageStart: 0.36,
    ringRevealPageEnd: 0.64,
    mobileRingMul: 0.55,
  },
  routeArcSvg: {
    stop0: "rgba(252, 164, 124, 0)",
    stop35: "rgba(255, 232, 212, 0.52)",
    stop65: "rgba(252, 164, 124, 0.42)",
    stop100: "rgba(255, 200, 150, 0)",
    labels: [
      { routeIndex: 0, labelKey: "traveltrust_theater_route_label_transatlantic" },
      { routeIndex: 1, labelKey: "traveltrust_theater_route_label_europe_asia" },
      { routeIndex: 2, labelKey: "traveltrust_theater_route_label_pacific" },
    ] as const,
  },
  canvasOverlay: {
    /** Hero 首屏零冷青 scrim（空域仅暖墨 `#0c0a09`） */
    cyanHeroRestMul: 0,
    cyanAttenuateHero: 0.92,
    cyanAttenuatePage: 0.55,
  },
  /** 滚入剧场段时的暖色 scrim（压冷青、强化旅游叙事） */
  scrollHandoffWarm: {
    pageStart: 0.28,
    pagePeak: 0.52,
    pageEnd: 0.72,
    peakOpacity: 0.082,
  },
  letterboxWarm: {
    bottomOverlayOpacity: 0.07,
    topOverlayOpacity: 0.04,
  },
  horizonArc: {
    gradStop0: "rgb(252, 164, 124)",
    gradStop50: "rgb(255, 140, 90)",
    gradStop100: "rgb(255, 200, 150)",
    fillBase: "rgba(20,16,13,0.92)",
    travelerGlow: "rgba(252,164,124,0.75)",
  },
  heroTrustChip: {
    itemClass:
      "inline-flex max-w-[min(100%,14rem)] items-center gap-1.5 truncate rounded-full border border-white/16 bg-ink-900/70 px-2.5 py-1.5 text-meta text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.28)] backdrop-blur-md sm:max-w-none sm:px-3",
    iconWrapClass:
      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ref-sun/12 text-ref-sun ring-1 ring-ref-sun/25",
  },
  bloom: {
    intensity: 0.11,
    luminanceThreshold: 0.96,
    luminanceSmoothing: 0.42,
    brightness: 0.02,
    contrast: 0.08,
    vignetteOffset: 0.14,
    vignetteDarkness: 0.26,
  },
} as const;

/** 0–1：星空/尘粒整体透明度（滚离 Hero 后降噪，剧场段可完全隐藏） */
export function resolveCinematicEnvironmentOpacity(heroT: number, pageT: number): number {
  const e = TT_CINEMATIC_PAGE_L5.environment;
  const fromHero = 1 - smoothstep(e.fadeHeroStart, e.fadeHeroEnd, heroT);
  const fromPage = 1 - smoothstep(e.fadePageStart, e.fadePageEnd, pageT) * 0.85;
  return Math.max(e.minOpacity, Math.min(1, fromHero * fromPage));
}

export function resolveCinematicEnvironmentVisible(heroT: number, pageT: number): boolean {
  return resolveCinematicEnvironmentOpacity(heroT, pageT) > TT_CINEMATIC_PAGE_L5.environment.hideBelow;
}

/** 0–1：冷青 Canvas scrim 衰减（P0-4 · 首屏 `cyanHeroRestMul`） */
export function resolveCinematicCanvasCyanMul(heroT: number, pageT: number): number {
  const c = TT_CINEMATIC_PAGE_L5.canvasOverlay;
  const fromHero = c.cyanHeroRestMul * (1 - heroT * c.cyanAttenuateHero);
  return Math.max(0, fromHero - pageT * c.cyanAttenuatePage);
}

/** 0–1：地球 Phase1 弧线/针脚随滚动收束 */
export function resolveCinematicGlobeDecorFade(heroT: number): number {
  const h = TT_CINEMATIC_PAGE_L5.scrollHandoff;
  return 1 - smoothstep(h.decorFadeHeroStart, h.decorFadeHeroEnd, heroT);
}

/** 0–1：剧场走廊环显现（与地球淡出交叉） */
export function resolveCinematicCorridorRingReveal(
  heroT: number,
  pageT: number,
  isMobile = false,
): number {
  const h = TT_CINEMATIC_PAGE_L5.scrollHandoff;
  const fromHero = smoothstep(h.decorFadeHeroStart, h.decorFadeHeroEnd, heroT);
  const fromPage = smoothstep(h.ringRevealPageStart, h.ringRevealPageEnd, pageT);
  const base = Math.max(fromHero * 0.85, fromPage);
  return isMobile ? base * h.mobileRingMul : base;
}

/** 0–1：滚动交接暖色带峰值（供 Canvas overlay） */
export function resolveCinematicScrollWarmBandPeak(heroT: number, pageT: number): number {
  const w = TT_CINEMATIC_PAGE_L5.scrollHandoffWarm;
  const fromPage = smoothstep(w.pageStart, w.pagePeak, pageT) * (1 - smoothstep(w.pagePeak, w.pageEnd, pageT));
  const fromHero = smoothstep(0.32, 0.58, heroT) * 0.22;
  return Math.min(1, fromPage * 0.88 + fromHero);
}
