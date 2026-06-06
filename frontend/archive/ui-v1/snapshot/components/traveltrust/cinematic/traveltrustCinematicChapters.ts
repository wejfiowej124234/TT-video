/** Scroll-driven camera chapters for full-page WebGL (TT-PH1-131 · ①). */
import { smoothstep } from "./traveltrustCinematicEasing3d";

export type TravelTrustCinematicChapter = "hero" | "theater" | "liquidity" | "start";

export type TravelTrustCinematicChapterPreset = {
  z: number;
  y: number;
  fov: number;
  roll: number;
  x: number;
};

export const TT_CINEMATIC_CHAPTER_PRESETS: Record<TravelTrustCinematicChapter, TravelTrustCinematicChapterPreset> = {
  hero: { z: 7.18, y: 0.18, fov: 47, roll: 0, x: -0.08 },
  theater: { z: 8.05, y: 0.08, fov: 44, roll: -0.014, x: 0.06 },
  liquidity: { z: 8.38, y: 0.04, fov: 42, roll: -0.019, x: 0.09 },
  start: { z: 8.65, y: 0.06, fov: 41, roll: -0.022, x: 0.12 },
};

/** Map hero + page scroll (0–1) to narrative chapter (离散标签 / a11y). */
export function resolveTravelTrustCinematicChapter(
  heroT: number,
  pageT: number,
): TravelTrustCinematicChapter {
  if (heroT < 0.72) return "hero";
  if (pageT < 0.38) return "theater";
  if (pageT < 0.62) return "liquidity";
  return "start";
}

export function blendChapterPresets(
  a: TravelTrustCinematicChapterPreset,
  b: TravelTrustCinematicChapterPreset,
  t: number,
): TravelTrustCinematicChapterPreset {
  const u = Math.max(0, Math.min(1, t));
  return {
    z: a.z + (b.z - a.z) * u,
    y: a.y + (b.y - a.y) * u,
    fov: a.fov + (b.fov - a.fov) * u,
    roll: a.roll + (b.roll - a.roll) * u,
    x: a.x + (b.x - a.x) * u,
  };
}

/**
 * 章节间相机连续插值（与 split blend 0.38–0.92 重叠，避免 preset 突变 · TT-PH1-5/16）
 */
export function resolveTravelTrustBlendedChapterPreset(
  heroT: number,
  pageT: number,
): TravelTrustCinematicChapterPreset {
  const { hero, theater, liquidity, start } = TT_CINEMATIC_CHAPTER_PRESETS;

  if (heroT < 0.52) return hero;
  if (heroT < 0.88) {
    return blendChapterPresets(hero, theater, smoothstep(0.52, 0.88, heroT));
  }
  if (pageT < 0.28) return theater;
  if (pageT < 0.42) {
    return blendChapterPresets(theater, liquidity, smoothstep(0.28, 0.42, pageT));
  }
  if (pageT < 0.55) return liquidity;
  if (pageT < 0.68) {
    return blendChapterPresets(liquidity, start, smoothstep(0.55, 0.68, pageT));
  }
  return start;
}
