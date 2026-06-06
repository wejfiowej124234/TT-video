/**
 * Hero 左栏几何中心 → `--tt-hero-globe-optical-x`（① · TT-PH1-150/151）
 */

export function formatHeroGlobeOpticalPercent(centerRatio: number): string {
  const clamped = Math.max(0.18, Math.min(0.4, centerRatio));
  return `${(clamped * 100).toFixed(2)}%`;
}

/** 纵轴光心（与左栏 globe viewport 中心对齐，避免顶到次导航） */
export function formatHeroGlobeOpticalYPercent(centerRatio: number): string {
  const clamped = Math.max(0.5, Math.min(0.64, centerRatio));
  return `${(clamped * 100).toFixed(2)}%`;
}

import { TT_HERO_L5_DIRECTOR_OPTICAL_X_FALLBACK } from "@/lib/traveltrustHeroL5DirectorFinalPass";

/** 无 DOM 时的桌面默认（Director Final · 光心左移） */
export const TT_HERO_GLOBE_OPTICAL_FALLBACK = TT_HERO_L5_DIRECTOR_OPTICAL_X_FALLBACK;

/** 与 `traveltrustHeroCinematicAlign` 光心纵轴同源 */
export const TT_HERO_GLOBE_OPTICAL_Y_FALLBACK = "54%";
