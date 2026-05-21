/**
 * Hero tourism globe earth JPEG (A closure · ①).
 * @frozen TT-GLOBE-A-2026-05 — tier / texture path.
 * @frozen TT-GLOBE-L5-FROZEN-2026-05 — **maintainer locked**; see `traveltrustHeroGlobeFrozenManifest.ts`.
 */

export const TRAVELTRUST_GLOBE_A_CLOSURE_ID = "TT-GLOBE-A-2026-05" as const;

/** L5 sprint marker (Phase B interactive · ①). */
export const TRAVELTRUST_GLOBE_L5_SPRINT_ID = "TT-GLOBE-L5-2026-05" as const;

/**
 * 地球贴图 mesh / Phase1 针脚 / Hero 投影共用表面半径（相对 `globeRadius`）。
 * Pass A `TT-GLOBE-L5-UNLOCK-EARTH-REALISM-2026-05`：与 `TravelTrustTourismGlobe` earthR 对齐。
 */
export const TT_GLOBE_EARTH_SURFACE_RADIUS_MUL = 0.998 as const;

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
 * Hero 首屏 · 暖墨空域 + 写实球面（`TT-GLOBE-L5-UNLOCK-EARTH-REALISM-2026-05`）
 * - 保留 JPEG + 轻暖化 `enhanceTraveltrustGlobeEarthMap`
 * - 弱 PBR（`meshStandard`）+ 低强度夜灯 + 减薄云
 */
export function resolveHeroWarmInkGlobeTier(
  base: GlobeRenderTierConfig,
): GlobeRenderTierConfig {
  return {
    ...base,
    litEarth: true,
    nightLights: true,
    texturedEarth: true,
    cloudLayer: true,
  };
}
