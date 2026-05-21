/**
 * v6 电影视觉 token 真源（①）
 * 组件只消费本模块导出；渐变/透明度/阈值在此维护，与 `traveltrustCinematic3dConfig` 分工。
 */

import { resolveCinematicScrollWarmBandPeak, TT_CINEMATIC_PAGE_L5 } from "@/lib/traveltrustCinematicPageL5";
import { resolveNonGlobeDeepScrollCanvasInk } from "@/lib/traveltrustCinematicNonGlobeL5";

/** 冷暗主色（TT-PH1-150/173 · ①） */
export const TT_CINEMATIC_FILM_INK = "#030712";
export const TT_CINEMATIC_FILM_DEPTH = "#080e12";

const FILM_INK_RGB = "3,7,18";
const FILM_DEPTH_RGB = "8,14,18";

/** 宽银幕 letterbox / 全页 vignette（TT-PH1-150～153 · ①） */
export const TT_CINEMATIC_HERO_LETTERBOX = {
  unified: { heightVh: 2.75, maxPx: 32, topPeak: 0.28, bottomPeak: 0.24 },
  legacy: { heightVh: 5, maxPx: 48, topPeak: 0.82, bottomPeak: 0.76 },
  pageOverlay: {
    topPeak: 0.3,
    topMidVh: 3.25,
    topMidPx: 34,
    topFadeVh: 5.5,
    topFadePx: 52,
    bottomPeak: 0.22,
    bottomMidVh: 4,
    bottomMidPx: 40,
    bottomFadeVh: 9.5,
    bottomFadePx: 84,
  },
} as const;

/** Hero 分栏 / 地球占位（TT-PH1-152 · ①） */
export const TT_CINEMATIC_HERO_LAYOUT = {
  globeViewportLgMaxSvH: 32,
  globeViewportLgMaxPx: 380,
  globeDecorMobileMaxSvH: 7.5,
  globeDecorMobileMaxPx: 68,
} as const;

function letterboxHeightToken(box: { heightVh: number; maxPx: number }): string {
  return `min(${box.heightVh}vh,${box.maxPx}px)`;
}

function letterboxGradient(
  direction: "to_bottom" | "to_top",
  peak: number,
  mid: number,
): string {
  const dir = direction === "to_bottom" ? "to bottom" : "to top";
  return `linear-gradient(${dir}, rgba(${FILM_INK_RGB},${peak}) 0%, rgba(${FILM_DEPTH_RGB},${mid}) 55%, transparent 100%)`;
}

export const TT_HERO_LETTERBOX_TOP_UNIFIED_CLASS = `pointer-events-none absolute inset-x-0 top-0 z-[4] h-[${letterboxHeightToken(TT_CINEMATIC_HERO_LETTERBOX.unified)}] bg-[${letterboxGradient("to_bottom", TT_CINEMATIC_HERO_LETTERBOX.unified.topPeak, 0.12)}]`;

export const TT_HERO_LETTERBOX_BOTTOM_UNIFIED_CLASS = `pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[${letterboxHeightToken(TT_CINEMATIC_HERO_LETTERBOX.unified)}] bg-[${letterboxGradient("to_top", TT_CINEMATIC_HERO_LETTERBOX.unified.bottomPeak, 0.1)}]`;

/** L5：unified Hero 底缘暖色衬线（叠于 ink letterbox 之上 · TT-PH1-150） */
export const TT_HERO_LETTERBOX_WARM_BOTTOM_UNIFIED_CLASS = `pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[${letterboxHeightToken(TT_CINEMATIC_HERO_LETTERBOX.unified)}] bg-[linear-gradient(to_top,rgba(252,164,124,0.12)_0%,transparent_100%)]`;

export const TT_HERO_LETTERBOX_WARM_TOP_UNIFIED_CLASS = `pointer-events-none absolute inset-x-0 top-0 z-[5] h-[${letterboxHeightToken(TT_CINEMATIC_HERO_LETTERBOX.unified)}] bg-[linear-gradient(to_bottom,rgba(252,164,124,0.08)_0%,transparent_100%)]`;

export const TT_HERO_LETTERBOX_TOP_CLASS = `pointer-events-none absolute inset-x-0 top-0 z-[4] h-[${letterboxHeightToken(TT_CINEMATIC_HERO_LETTERBOX.legacy)}] bg-[${letterboxGradient("to_bottom", TT_CINEMATIC_HERO_LETTERBOX.legacy.topPeak, 0.4)}]`;

export const TT_HERO_LETTERBOX_BOTTOM_CLASS = `pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[${letterboxHeightToken(TT_CINEMATIC_HERO_LETTERBOX.legacy)}] bg-[${letterboxGradient("to_top", TT_CINEMATIC_HERO_LETTERBOX.legacy.bottomPeak, 0.34)}]`;

export const TT_PAGE_CINEMATIC_LETTERBOX_OVERLAY: readonly string[] = (() => {
  const p = TT_CINEMATIC_HERO_LETTERBOX.pageOverlay;
  return [
    `linear-gradient(to bottom, rgba(${FILM_INK_RGB},${p.topPeak}) 0%, rgba(${FILM_DEPTH_RGB},0.1) min(${p.topMidVh}vh,${p.topMidPx}px), transparent min(${p.topFadeVh}vh,${p.topFadePx}px))`,
    `linear-gradient(to top, rgba(${FILM_INK_RGB},${p.bottomPeak}) 0%, rgba(${FILM_DEPTH_RGB},0.07) min(${p.bottomMidVh}vh,${p.bottomMidPx}px), transparent min(${p.bottomFadeVh}vh,${p.bottomFadePx}px))`,
  ] as const;
})();

/**
 * 旅游向地球视觉 token（@frozen `TT-GLOBE-A-2026-05`）
 * @frozen TT-GLOBE-L5-FROZEN-2026-05 — **maintainer locked**; see `traveltrustHeroGlobeFrozenManifest.ts`.
 * A 收口后仅随 `frontend/evidence/GO_local_hero_globe_a_closure/` 证据同批调整。
 */
export const TT_CINEMATIC_GLOBE_VISUAL = {
  /** 初始 Y 旋转（弧度）— 昼侧朝向镜头（欧亚非 daylight 面） */
  /** 默认昼侧偏欧亚（定制游叙事 · L5） */
  heroYawOffset: 0.52,
  earthDisplayBrightness: 1.22,
  earthArcticSuppress: 0.72,
  earthRoughness: 0.58,
  earthMetalness: 0.04,
  earthTintOpacity: 0,
  atmosphereRimOpacity: 0,
  atmosphereOuterOpacity: 0,
  terminatorRimOpacity: 0.05,
  fresnelColor: "#ffe8d4",
  /** L5 P0：压低「水晶球」外缘（人眼复验 · 2026-05） */
  fresnelIntensity: 0.038,
  fresnelPower: 4.8,
  atmosphereHazeColor: "#e8c4a8",
  /** L5 复验：极薄 forward 暖雾（禁厚玻璃球外壳） */
  atmosphereHazeOpacity: 0,
  atmosphereWarmRimOpacity: 0,
  /** 昼侧极薄暖边（与 haze 同温；勿用 #8ecae8 否则空域发青紫） */
  atmosphereDaylightRimColor: "#e8c4a8",
  /** 0 = 关闭昼侧大气边（避免空域发青；针脚/弧线批次曾开 #8ecae8） */
  atmosphereDaylightRimIntensity: 0,
  atmosphereDaylightRimPower: 5.8,
  cloudDriftSpeed: 0.014,
  /** 云层透明度（缺省曾为 undefined≈全不透明 · L5 真实感） */
  cloudOpacity: 0.32,
  cloudRoughness: 0.92,
  nightLightsStrength: 0.22,
  /** Hero 暖墨首屏夜灯（`TT-GLOBE-L5-UNLOCK-EARTH-REALISM-2026-05` · 0.12–0.18） */
  heroWarmInkNightLightsStrength: 0.15,
  /** Hero 暖墨首屏云层（相对 `cloudOpacity` · 0.28–0.35） */
  heroWarmInkCloudOpacityScale: 0.32,
  glassShellOpacity: 0,
  glassTransmission: 0,
  holoGridOpacity: 0,
  ambientParticleCount: 18,
  subtleWireOpacity: 0,
  travelArcAltitude: 1.064,
  travelArcFacingMinDot: 0.1,
  /** 至少一端枢纽朝向镜头（跨大西洋走廊仅一端朝镜头时仍显示） */
  travelArcEndpointMinDot: 0.05,
  travelArcRequireBothEndpoints: true,
  /** 流动光点：两端都朝镜头才显示 */
  travelArcPulseEndpointMinDot: 0.14,
  /** 仅显示朝向镜头的枢纽 pin（避免亚太点在太平洋悬空） */
  phase1PinFacingMinDot: 0.1,
  phase1PinFacingMinDotTierB: 0.2,
  travelArcMaxCount: 8,
  travelArcMaxCountLite: 5,
  travelArcTubeRadiusMul: 0.003,
  travelArcOpacity: 0.74,
  travelArcGlowOpacity: 0.08,
  travelArcTierAGlowOpacity: 0.1,
  travelArcWhiteCoreOpacity: 0,
  /** L5：悬停枢纽时相关走廊提亮、其余略压暗 */
  travelArcHoverBoostMul: 1.22,
  travelArcDimMul: 0.42,
  /** 低画质档弧线/pin 仍渲染，略降对比避免糊成一片 */
  phase1DecorLowQualityMul: 0.88,
  /** Phase1 目的地标记（TravelTrustPhase1GlobeHighlights） */
  phase1MarkerOpacity: 0.92,
  phase1CoreWhiteOpacity: 0.62,
  phase1TierScale: { S: 1.36, A: 1.02, B: 0.86 } as const,
  phase1HaloOpacity: 0.11,
  phase1HaloHoverOpacity: 0.18,
  /** 法/西 pin 光晕叠在一起时降压（L5 · 欧陆簇） */
  phase1EuClusterHaloMul: 0.5,
  phase1StemOpacity: 0.72,
  phase1FlagDiscScale: 1.48,
  l5ColorGradeBrightness: 0.03,
  l5ColorGradeContrast: 0.1,
  /** 遗留线框网络（TravelGlobeNetwork · 仅旧 Hero 切片） */
  coreFillOpacity: 0.11,
  wireframeInnerOpacity: 0.16,
  wireframeOuterOpacity: 0.07,
  nodeOpacity: 0.12,
  segmentOpacity: 0.11,
  nodePulseAmplitude: 0.06,
} as const;

/** 品牌大气层 / 光晕（TravelTrustPageCinematicScene） */
export const TT_CINEMATIC_ATMOSPHERE = {
  brandShellOpacity: 0.34,
  brandShellHaloOpacity: 0.06,
  glowHaloIntensity: 0.05,
  /** Hero 旅游球模式下托管线/锚点衰减（避免与 Phase1 pin 抢戏） */
  heroEscrowFilamentMul: 0.35,
  /** Hero 首屏：页面级冷品牌点光强度（防青+珊瑚混成紫） */
  /** Hero 首屏：页面级冷/侧向品牌点光（0=仅地球 FillLight） */
  heroCoolBrandLightMul: 0,
  equatorRingOpacity: 0,
} as const;

/** Hero 视频呈现（tier-1 占位 vs page-brief/env 生产片源） */
export const TT_CINEMATIC_HERO_MEDIA = {
  tier1AccentVideoOpacity: 0.16,
  tier1AccentSaturate: 1.05,
  fullHeroVideoOpacity: 0.28,
  staticPosterOpacity: 0.38,
} as const;

/** 全页 Canvas 遮罩阈值（与 scroll / split 插值联动） */
export const TT_CINEMATIC_CANVAS_OVERLAY = {
  heroNavScrimHeroTMax: 0.48,
  heroNavScrimTopStrong: 0.62,
  heroNavScrimTopMid: 0.18,
  heroNavScrimTopEndVh: "20vh",
  heroSplitScrimBlendMin: 0.08,
  heroSplitScrimLeftStrong: 0.26,
  heroSplitScrimLeftMid: 0.08,
  heroSplitScrimLeftEndPct: "48%",
  splitCopyMaskStartPct: 62,
  splitCopyMaskEndPct: 76,
  splitCopyMaskOpacityBase: 0.08,
  splitCopyMaskOpacitySpan: 0.07,
  splitCopyMaskSolidBase: 0.26,
  splitCopyMaskSolidSpan: 0.14,
  trustBandCyanPeak: 0.028,
  /** Hero 球区暖光（与 ref-sun 品牌 CTA 同温，压冷青 scrim） */
  heroGlobeWarmPeak: 0.048,
  heroGlobeWarmMidPeak: 0.024,
} as const;

export type PageCinematicOverlayParams = {
  heroT: number;
  pageT?: number;
  heroSplitBlend: number;
  heroBridgeEase: number;
  trustBand: number;
  globeOpticalX: string;
  /** L5：滚离 Hero 后压冷青 scrim（默认 1） */
  cyanMul?: number;
};

function rgbaInk(a: number): string {
  return `rgba(10,15,13,${a})`;
}

function rgbaFilm(a: number): string {
  return `rgba(12,10,9,${a})`;
}

/** 由 scroll/split 参数生成 Canvas 多层 background（TT-PH1-150/151 · ①） */
export function buildPageCinematicCanvasOverlayLayers(params: PageCinematicOverlayParams): string[] {
  const { heroT, heroSplitBlend, heroBridgeEase, trustBand, globeOpticalX } = params;
  const pageT = params.pageT ?? 0;
  const heroAtTop = 1 - heroT;
  const cyanMul = params.cyanMul ?? Math.max(0, 1 - heroT * 0.92 - pageT * 0.55);
  const filmMul = heroBridgeEase * (1 - heroAtTop * 0.85);
  const o = TT_CINEMATIC_CANVAS_OVERLAY;
  const layers: string[] = [...TT_PAGE_CINEMATIC_LETTERBOX_OVERLAY];

  if (heroT < o.heroNavScrimHeroTMax) {
    layers.push(
      `linear-gradient(180deg, ${rgbaInk(o.heroNavScrimTopStrong)} 0%, ${rgbaInk(o.heroNavScrimTopMid)} 11vh, transparent ${o.heroNavScrimTopEndVh})`,
    );
  }

  if (heroSplitBlend > o.heroSplitScrimBlendMin) {
    layers.push(
      `linear-gradient(90deg, ${rgbaInk(o.heroSplitScrimLeftStrong)} 0%, ${rgbaInk(o.heroSplitScrimLeftMid)} 28%, transparent ${o.heroSplitScrimLeftEndPct})`,
    );
  }

  const heroCornerWarm = Math.max(0, (1 - heroT) * (1 - pageT * 0.35));
  if (heroCornerWarm > 0.08) {
    layers.push(
      `radial-gradient(ellipse 58% 44% at 86% 40%, rgba(255,178,108,${(o.heroGlobeWarmPeak * 0.55 * heroCornerWarm).toFixed(3)}) 0%, rgba(255,140,90,${(o.heroGlobeWarmMidPeak * 0.4 * heroCornerWarm).toFixed(3)}) 42%, transparent 70%)`,
    );
  }

  layers.push(
    `radial-gradient(ellipse 88% 72% at ${globeOpticalX} var(--tt-hero-globe-optical-y,52%), transparent 74%, ${rgbaInk(0.03)} 100%)`,
    `linear-gradient(90deg, transparent 0%, transparent ${(o.splitCopyMaskStartPct + (1 - heroSplitBlend) * 8).toFixed(0)}%, ${rgbaInk(o.splitCopyMaskOpacityBase + heroSplitBlend * o.splitCopyMaskOpacitySpan)} ${(o.splitCopyMaskEndPct + (1 - heroSplitBlend) * 10).toFixed(0)}%, ${rgbaInk(o.splitCopyMaskSolidBase + heroSplitBlend * o.splitCopyMaskSolidSpan)} 100%)`,
    `linear-gradient(to bottom, transparent 0%, ${rgbaFilm(filmMul * 0.12)} ${(48 - heroBridgeEase * 10).toFixed(0)}%, ${rgbaFilm(filmMul * 0.34)} ${(82 - heroBridgeEase * 6).toFixed(0)}%, ${rgbaInk(0.12 + filmMul * 0.18)} 100%)`,
    `linear-gradient(to bottom, transparent 88%, ${rgbaInk(0.06)} 100%)`,
    ...(cyanMul > 0.08 && pageT < 0.4
      ? [
          `radial-gradient(ellipse 62% 48% at 82% 46%, rgba(35,206,217,${(0.03 * cyanMul).toFixed(3)}) 0%, transparent 62%)`,
          `linear-gradient(135deg, rgba(35,206,217,${(0.02 * cyanMul).toFixed(3)}) 0%, transparent 48%, rgba(110,231,183,${(0.012 * cyanMul).toFixed(3)}) 100%)`,
          `radial-gradient(ellipse 58% 42% at 72% 38%, rgba(35,206,217,${(o.trustBandCyanPeak * trustBand * cyanMul).toFixed(3)}) 0%, transparent 68%)`,
        ]
      : []),
    `radial-gradient(ellipse 78% 64% at ${globeOpticalX} var(--tt-hero-globe-optical-y,52%), rgba(255,178,108,${(o.heroGlobeWarmPeak * (0.35 + heroSplitBlend * 0.65)).toFixed(3)}) 0%, rgba(255,140,90,${(o.heroGlobeWarmMidPeak * heroSplitBlend).toFixed(3)}) 38%, transparent 72%)`,
  );

  const warmBand = resolveCinematicScrollWarmBandPeak(heroT, pageT);
  if (warmBand > 0.02) {
    const peak = TT_CINEMATIC_PAGE_L5.scrollHandoffWarm.peakOpacity * warmBand;
    layers.push(
      `radial-gradient(ellipse 72% 52% at 50% 38%, rgba(255,178,108,${peak.toFixed(3)}) 0%, rgba(255,140,90,${(peak * 0.55).toFixed(3)}) 42%, transparent 70%)`,
    );
  }

  const deepInk = resolveNonGlobeDeepScrollCanvasInk(pageT);
  if (deepInk > 0.02) {
    layers.push(
      `linear-gradient(to bottom, transparent 0%, ${rgbaFilm(0.28 * deepInk)} 48%, ${rgbaInk(0.55 + 0.28 * deepInk)} 100%)`,
    );
  }

  return layers;
}

/** 供静态 WebGL 降级与 shell vignette 复用 */
export const TT_CINEMATIC_FILM_RGB = {
  ink: TT_CINEMATIC_FILM_INK,
  depth: TT_CINEMATIC_FILM_DEPTH,
} as const;
