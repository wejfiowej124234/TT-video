/**
 * Hero 分栏 / 滚动电影镜头对齐（①）
 * 全宽 Canvas + 滚动 blend，避免 heroT≈0.45 时宽度/相机硬切导致「跳动」。
 */

import { lerp, smoothstep } from "@/components/traveltrust/cinematic/traveltrustCinematicEasing3d";
import {
  TRAVELTRUST_HERO_GLOBE_ENTRANCE_DURATION_SEC,
  TRAVELTRUST_HERO_GLOBE_ENTRANCE_DURATION_SEC_MOBILE,
  TRAVELTRUST_HERO_GLOBE_ENTRANCE_SCALE_FROM,
} from "@/lib/traveltrustGlobeHeroTuning";
import { TT_HERO_GLOBE_OPTICAL_FALLBACK } from "@/lib/traveltrustHeroGlobeAlign";
import {
  TT_HERO_L5_DIRECTOR_GLOBE_SCALE_MUL,
  TT_HERO_L5_DIRECTOR_GLOBE_X,
} from "@/lib/traveltrustHeroL5DirectorFinalPass";

/** 全屏坐标系下地球光心（左栏几何中心；ResizeObserver 可覆盖 CSS 变量） */
export const TT_HERO_SPLIT_OPTICAL_CENTER_X = TT_HERO_GLOBE_OPTICAL_FALLBACK;

/** 全宽 Canvas 时：相机 X（split 时 Canvas 已裁左栏，球心近 0） */
export const TT_HERO_SPLIT_CAMERA_X = 0.02;

/** split Canvas 左栏内地球 rig X（Director Final · 左移） */
export const TT_HERO_SPLIT_GLOBE_X = TT_HERO_L5_DIRECTOR_GLOBE_X;

/** 首屏地球 rig Y（压低光心，避免与双顶栏 + LandingChrome 相撞 · ①） */
export const TT_HERO_SPLIT_GLOBE_Y = -0.28;

/** 滚入角色剧场时地球目标 X（靠向 #roles 锚点 · 波次 2.2） */
export const TT_HERO_THEATER_GLOBE_X = -0.1;

/** 滚入剧场时段地球 Y（略下沉，强化「坠入剧场」） */
export const TT_HERO_THEATER_GLOBE_Y = 0.22;

/** 首屏地球缩放（Director Final · +6% vs 收口 0.84） */
export const TT_HERO_SPLIT_GLOBE_SCALE_MUL = TT_HERO_L5_DIRECTOR_GLOBE_SCALE_MUL;

/** 滚动离开 hero：split → theater 的平滑区间（与章节相机 0.52–0.88 重叠） */
export const TT_HERO_SPLIT_BLEND_EDGE_START = 0.38;
export const TT_HERO_SPLIT_BLEND_EDGE_END = 0.96;

/** 地球缩小（先发生，与相机 hero→theater 重叠） */
export const TT_HERO_GLOBE_SCALE_EXIT_START = 0.32;
export const TT_HERO_GLOBE_SCALE_EXIT_END = 0.88;

/** 地球淡出（略晚于缩小，交叉淡入剧场环） */
export const TT_HERO_GLOBE_OPACITY_EXIT_START = 0.56;
export const TT_HERO_GLOBE_OPACITY_EXIT_END = 0.97;

/** @deprecated 用 scale/opacity 分轨；保留给 ring 等轻量消费者 */
export const TT_HERO_GLOBE_FADE_START = TT_HERO_GLOBE_OPACITY_EXIT_START;
export const TT_HERO_GLOBE_FADE_END = TT_HERO_GLOBE_OPACITY_EXIT_END;

/** 0→1：首屏入场（打开/刷新页 · 与滚动退出独立） */
export function resolveHeroGlobeEntranceProgress(
  elapsedSec: number,
  durationSec = TRAVELTRUST_HERO_GLOBE_ENTRANCE_DURATION_SEC,
): number {
  if (durationSec <= 0) return 1;
  const t = Math.min(1, Math.max(0, elapsedSec / durationSec));
  return 1 - (1 - t) ** 3;
}

/** 入场缩放倍率（叠在 split/scroll 目标尺度之上） */
export function resolveHeroGlobeEntranceScaleMul(
  entranceProgress: number,
  scaleFrom = TRAVELTRUST_HERO_GLOBE_ENTRANCE_SCALE_FROM,
): number {
  const p = Math.min(1, Math.max(0, entranceProgress));
  return lerp(scaleFrom, 1, p);
}

/** 0→1：缩小进度 */
export function resolveHeroGlobeScaleExit(heroT: number): number {
  return smoothstep(TT_HERO_GLOBE_SCALE_EXIT_START, TT_HERO_GLOBE_SCALE_EXIT_END, heroT);
}

/** 0→1：淡出进度 */
export function resolveHeroGlobeOpacityExit(heroT: number): number {
  return smoothstep(TT_HERO_GLOBE_OPACITY_EXIT_START, TT_HERO_GLOBE_OPACITY_EXIT_END, heroT);
}

/** 0→1：综合退出（取较晚者，供环/锚线） */
export function resolveHeroGlobeExitProgress(heroT: number): number {
  return Math.max(resolveHeroGlobeScaleExit(heroT), resolveHeroGlobeOpacityExit(heroT));
}

/** 1 = 首屏分栏视觉；0 = 滚出 hero 后的剧场镜头 */
export function resolveHeroSplitLayoutBlend(heroT: number, isMobile: boolean): number {
  if (isMobile) return 0;
  return 1 - smoothstep(TT_HERO_SPLIT_BLEND_EDGE_START, TT_HERO_SPLIT_BLEND_EDGE_END, heroT);
}

/** 全页渐变 / 遮罩用的地球光心纵轴（低于 44% 以免顶到次导航） */
export const TT_HERO_GLOBE_OPTICAL_Y_FALLBACK = "54%";

export const TT_HERO_SPLIT_ALIGN_CSS_VARS = {
  ["--tt-hero-globe-optical-x" as string]: TT_HERO_GLOBE_OPTICAL_FALLBACK,
  ["--tt-hero-globe-optical-y" as string]: TT_HERO_GLOBE_OPTICAL_Y_FALLBACK,
} as const;
