/**
 * Hero tourism globe earth JPEG (A closure · ①).
 * @frozen TT-GLOBE-A-2026-05 — tier / texture path.
 * @frozen TT-GLOBE-L5-FROZEN-2026-05 — **maintainer locked**; see `traveltrustHeroGlobeFrozenManifest.ts`.
 */

export const TRAVELTRUST_GLOBE_A_CLOSURE_ID = "TT-GLOBE-A-2026-05" as const;

/** L5 sprint marker (Phase B interactive · ①). */
export const TRAVELTRUST_GLOBE_L5_SPRINT_ID = "TT-GLOBE-L5-2026-05" as const;

/** Public URL (Next static `public/`). */
export const TRAVELTRUST_GLOBE_EARTH_TEXTURE_PATH = "/media/traveltrust/globe-earth-equirect-2k.jpg";

/** Equirect cloud layer (three.js examples · MIT). */
export const TRAVELTRUST_GLOBE_CLOUD_TEXTURE_PATH = "/media/traveltrust/globe-clouds-equirect-1k.png";

export const TRAVELTRUST_GLOBE_EARTH_LICENSE_DOC = "GLOBE_EARTH_TEXTURE_LICENSE.md";

export type TraveltrustGlobeRenderTier = "desktop" | "mobile" | "low";

export const TT_CINEMATIC_GLOBE_RENDER_TIER = {
  desktop: {
    earthSegments: 80,
    travelArcLite: false,
    texturedEarth: true,
    litEarth: true,
    cloudLayer: true,
    nightLights: true,
    glassShell: false,
    /** L5：以暖雾代替强 Fresnel 玻璃缘 */
    fresnelRim: false,
    holoGrid: false,
    ambientParticles: false,
  },
  mobile: {
    earthSegments: 56,
    travelArcLite: true,
    texturedEarth: true,
    litEarth: true,
    cloudLayer: true,
    nightLights: false,
    glassShell: false,
    fresnelRim: false,
    holoGrid: false,
    ambientParticles: false,
  },
  low: {
    earthSegments: 44,
    travelArcLite: true,
    texturedEarth: true,
    litEarth: true,
    cloudLayer: false,
    nightLights: false,
    glassShell: false,
    fresnelRim: false,
    holoGrid: false,
    ambientParticles: false,
  },
} as const;

export type GlobeRenderTierConfig = (typeof TT_CINEMATIC_GLOBE_RENDER_TIER)[TraveltrustGlobeRenderTier];

export const TT_CINEMATIC_GLOBE_RENDER_TIER_DEFAULT: GlobeRenderTierConfig =
  TT_CINEMATIC_GLOBE_RENDER_TIER.desktop;

export function resolveTraveltrustGlobeRenderTier(opts: {
  isMobile: boolean;
  lowQuality: boolean;
}): (typeof TT_CINEMATIC_GLOBE_RENDER_TIER)[TraveltrustGlobeRenderTier] {
  if (opts.lowQuality) return TT_CINEMATIC_GLOBE_RENDER_TIER.low;
  if (opts.isMobile) return TT_CINEMATIC_GLOBE_RENDER_TIER.mobile;
  return TT_CINEMATIC_GLOBE_RENDER_TIER.desktop;
}

/**
 * Hero 首屏 · 暖墨空域与球面分离（排查结论：NASA JPEG 蓝海 ≠ `#0c0a09` 空域）
 * - procedural 褐绿海洋（非 `globe-earth-equirect-2k.jpg`）
 * - Basic 材质、无夜灯、薄云
 */
export function resolveHeroWarmInkGlobeTier(
  base: GlobeRenderTierConfig,
): GlobeRenderTierConfig {
  /** 保留 JPEG + `enhanceTraveltrustGlobeEarthMap`；Basic 材质减蓝海反光（`TT-GLOBE-L5-UNLOCK-WARM-INK`） */
  return {
    ...base,
    litEarth: false,
    nightLights: false,
    texturedEarth: true,
    cloudLayer: true,
  };
}
