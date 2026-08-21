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

/** 滚动章节叙事字幕（L5 · ① · 非实时数据） */
export const TT_CINEMATIC_CHAPTER_NARRATIVE_KEYS: Record<
  TravelTrustCinematicChapter,
  | "traveltrust_cinematic_chapter_hero_narrative"
  | "traveltrust_cinematic_chapter_theater_narrative"
  | "traveltrust_cinematic_chapter_liquidity_narrative"
  | "traveltrust_cinematic_chapter_start_narrative"
> = {
  hero: "traveltrust_cinematic_chapter_hero_narrative",
  theater: "traveltrust_cinematic_chapter_theater_narrative",
  liquidity: "traveltrust_cinematic_chapter_liquidity_narrative",
  start: "traveltrust_cinematic_chapter_start_narrative",
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
  if (pageT >= 0.58) {
    if (pageT < 0.72) return "liquidity";
    return "start";
  }
  if (heroT < 0.72) return "hero";
  if (pageT < 0.38) return "theater";
  if (pageT < 0.62) return "liquidity";
  return "start";
}

/** 页内锚点 → 章节（与 ScrollProgress / LandingNav 同源） */
export function resolveTravelTrustCinematicChapterFromSection(
  sectionId: string,
): TravelTrustCinematicChapter | null {
  switch (sectionId) {
    case "pulse":
    case "hero":
      return "hero";
    case "roles":
      return "theater";
    case "liquidity":
    case "unlock":
      return "liquidity";
    case "trust":
    case "settlement":
    case "faq":
    case "start":
      return "start";
    default:
      return null;
  }
}

/**
 * UI 字幕：锚点优先，避免滚到 #start 仍显示 Hero 叙事（L5-3 · P0-2）
 */
export function resolveTravelTrustCinematicChapterForUi(
  heroT: number,
  pageT: number,
  activeSection: string,
): TravelTrustCinematicChapter {
  const fromScroll = resolveTravelTrustCinematicChapter(heroT, pageT);
  const fromSection = resolveTravelTrustCinematicChapterFromSection(activeSection);
  if (!fromSection) return fromScroll;
  if (activeSection === "pulse" || activeSection === "hero") return fromScroll;
  if (fromScroll === "hero" && pageT > 0.42) return fromSection;
  return fromSection;
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
