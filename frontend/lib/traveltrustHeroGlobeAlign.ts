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

/** 无 DOM 时的桌面默认（与 split 网格左栏心对齐） */
export const TT_HERO_GLOBE_OPTICAL_FALLBACK = "28%";

/** 与 `traveltrustHeroCinematicAlign` 光心纵轴同源 */
export const TT_HERO_GLOBE_OPTICAL_Y_FALLBACK = "54%";
