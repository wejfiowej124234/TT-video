/** L5 · auto-split from traveltrustCinematicNonGlobeL5 facade */
import { TT_L5_MOTION_EASE } from "./meta";
import { TT_CINEMATIC_PAGE_INK_HEX } from "./meta";

export const TT_CINEMATIC_SHELL_L5_VIGNETTE =
  "radial-gradient(ellipse 92% 82% at var(--tt-hero-globe-optical-x, 24%) var(--tt-hero-globe-optical-y, 52%), transparent 58%, rgba(12,10,9,0.14) 100%), linear-gradient(90deg, transparent 0%, transparent 52%, rgba(12,10,9,0.08) 78%, rgba(12,10,9,0.22) 100%), linear-gradient(to bottom, transparent 0%, transparent 76%, rgba(252,164,124,0.04) 92%, rgba(252,164,124,0.07) 100%)";

export const TT_CINEMATIC_SHELL_L5 = {
  grainOpacityRange: [0.01, 0.018] as const,
  grainPulseDuration: 11,
  grainPulseRepeat: 0 as const,
  vignetteOpacityRange: [0.22, 0.28] as const,
  vignettePulseDuration: 14,
  vignettePulseRepeat: 0 as const,
} as const;

/** Legacy Hero 3D fallback（`UNIFIED_PAGE_3D=false`）· 暖色 scrim，无冷青 */
export const TT_LEGACY_HERO_3D_SCRIM_L5 =
  "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(252,164,124,0.14), transparent 68%)";

export const TT_LEGACY_THEATER_3D_L5 = {
  node: "#fca47c",
  line: "#ffd4a8",
  light: "#fca47c",
  rim: "#ffb86b",
  wrapperOpacityMin: 0.35,
  wrapperOpacityRange: 0.35,
  wrapperFadeDuration: 0.45,
  activeScalePulse: { duration: 4.5, scale: [1, 1.02, 1] as const },
} as const;

/** Legacy Hero 3D 内容（`UNIFIED_PAGE_3D=false` · 非旅游地球 mesh） */
export const TT_LEGACY_3D_CONTENT_L5 = {
  arcPrimary: "#fca47c",
  arcSecondary: "#ffd4a8",
  pulseSecondary: "#ffb86b",
  keyLight: "#fca47c",
  fillLight: "#fca47c",
  rimLight: "#ffd4a8",
} as const;

export const TT_PAGE_HORIZON_FOG_L5 = {
  color: "#ffe8d4",
  /** 平面雾易读成灰地板；handoff 改由 DOM 渐变承担（L5 · ①） */
  opacityPeakMul: 0,
} as const;
