/**
 * Hero 地球 · 非冻结调参（① · 与 `TT_CINEMATIC_GLOBE_VISUAL` 分工）
 * Phase1 十国扩列后提高弧线预算；标签防重叠与档位可读性。
 */

import type { HeroGlobeRouteBias } from "@/lib/traveltrustGlobeArcCull";
import {
  filterHeroTravelRoutes,
  HERO_GLOBE_ATLANTIC_ROUTE_IDS,
} from "@/lib/traveltrustGlobeArcCull";
import {
  TT_HERO_L5_DIRECTOR_ARC_MAX_COUNT,
  TT_HERO_L5_DIRECTOR_ARC_MAX_COUNT_LITE,
  TT_HERO_L5_DIRECTOR_ARC_WEAK_CORRIDOR_MUL,
} from "@/lib/traveltrustHeroL5DirectorFinalPass";

export const TRAVELTRUST_HERO_GLOBE_TUNING_ID = "TT-HERO-GLOBE-TUNING-2026-05" as const;

/** 每次进入/刷新首屏：地球从小到大的入场比例起点（1 = 目标尺度） */
export const TRAVELTRUST_HERO_GLOBE_ENTRANCE_SCALE_FROM = 0.36 as const;

/** 入场缩放时长（秒） */
export const TRAVELTRUST_HERO_GLOBE_ENTRANCE_DURATION_SEC = 1.15 as const;

export const TRAVELTRUST_HERO_GLOBE_ENTRANCE_DURATION_SEC_MOBILE = 0.95 as const;

/** 桌面 Hero：主走廊亮显 + 3–5 条弱网络弧线（Director Final） */
export const TRAVELTRUST_HERO_GLOBE_ARC_MAX_COUNT = TT_HERO_L5_DIRECTOR_ARC_MAX_COUNT;

export const TRAVELTRUST_HERO_GLOBE_ARC_MAX_COUNT_LITE = TT_HERO_L5_DIRECTOR_ARC_MAX_COUNT_LITE;

/** 亚太 Hero 主走廊（叙事链：华北—东京—曼谷—新加坡） */
export const TRAVELTRUST_HERO_GLOBE_ASIA_PRIMARY_ROUTE_IDS = ["cn-jp", "cn-th", "jp-sg"] as const;

/** 非主走廊示意航线不透明度倍率（≈0.28–0.35 · × travelArcOpacity 0.74） */
export const TRAVELTRUST_HERO_GLOBE_ARC_NON_PRIMARY_OPACITY_MUL =
  TT_HERO_L5_DIRECTOR_ARC_WEAK_CORRIDOR_MUL;

/** 首屏国名标签最小间距（viewport %） */
export const TRAVELTRUST_HERO_GLOBE_LABEL_MIN_SEPARATION_PCT = 4.2 as const;

/** 无焦点时按 tier 的基础不透明度（L5 收口回退约 40% · 再乘 limbFade） */
export const TRAVELTRUST_HERO_GLOBE_LABEL_TIER_OPACITY = {
  S: 0.96,
  A: 0.82,
  B: 0.68,
} as const;

/** P1 · 悬停枢纽时相关走廊对比度 */
export const TRAVELTRUST_HERO_GLOBE_ARC_HOVER_BOOST_MUL = 1.38 as const;

export const TRAVELTRUST_HERO_GLOBE_ARC_DIM_MUL = 0.42 as const;

/** 弧线全局倍率（收口 0.88 已回退 · 不额外压地球） */
export const TRAVELTRUST_HERO_GLOBE_ARC_OPACITY_MUL = 1 as const;

export const TRAVELTRUST_HERO_GLOBE_ARC_RADIUS_MUL = 1 as const;

/**
 * Hero 首屏 WebGL 弧线「流光球」— 沿航线移动的示意点（非陨石）。
 * 易与满屏动效叠成干扰，首屏默认关；静态弧光仍保留。
 */
export const TRAVELTRUST_HERO_GLOBE_ARC_FLOW_PULSE_ENABLED = false as const;

/** WebGL 针脚/core 脉冲（易读成「闪小球」） */
export const TRAVELTRUST_HERO_GLOBE_MARKER_PULSE_ENABLED = false as const;

/** Hero DOM 十国核心枢纽光点（B 级装饰点仍隐藏） */
export const TRAVELTRUST_HERO_GLOBE_DOM_CORE_HUBS_ONLY = true as const;

/** Hero DOM 枢纽光点静态（不做 scale 呼吸） */
export const TRAVELTRUST_HERO_GLOBE_DOM_HUB_STATIC = true as const;

/**
 * Hero DOM 示意走廊 SVG（viewBox 曲线 ≠ WebGL 大圆弧线 · 易呈悬空闪烁光点）
 */
export const TRAVELTRUST_HERO_GLOBE_DOM_CORRIDOR_SVG_ENABLED = false as const;

/** Hero DOM 走廊 path 上的流光小球（`animateMotion` · 与 WebGL 航线不对齐） */
export const TRAVELTRUST_HERO_GLOBE_DOM_CORRIDOR_PULSE_ENABLED = false as const;

/** Hero DOM 叠加光点（与 WebGL 针脚重复 · 易读成「不在弧线上的闪球」） */
export const TRAVELTRUST_HERO_GLOBE_DOM_HUB_DOTS_ENABLED = false as const;

/** Hero WebGL 环境微粒（`TourismGlobeAmbientParticles` · 枢纽旁漂浮闪点） */
export const TRAVELTRUST_HERO_GLOBE_AMBIENT_PARTICLES_ENABLED = false as const;

const ASIA_PRIMARY_SET = new Set<string>(TRAVELTRUST_HERO_GLOBE_ASIA_PRIMARY_ROUTE_IDS);
const ATLANTIC_PRIMARY_SET = new Set<string>(HERO_GLOBE_ATLANTIC_ROUTE_IDS);

/** Hero 弧线池：bias 过滤 + 面向镜头 cull（主走廊全亮 · 余 3–5 条弱显） */
export function filterHeroTravelRoutesForL5Hero<T extends { id: string }>(
  routes: readonly T[],
  bias: HeroGlobeRouteBias,
): T[] {
  return filterHeroTravelRoutes(routes, bias);
}

export function heroGlobeArcCorridorOpacityMul(routeId: string, bias: HeroGlobeRouteBias): number {
  if (bias === "asia" && !ASIA_PRIMARY_SET.has(routeId)) {
    return TRAVELTRUST_HERO_GLOBE_ARC_NON_PRIMARY_OPACITY_MUL;
  }
  if (bias === "atlantic" && !ATLANTIC_PRIMARY_SET.has(routeId)) {
    return TRAVELTRUST_HERO_GLOBE_ARC_NON_PRIMARY_OPACITY_MUL;
  }
  return 1;
}
