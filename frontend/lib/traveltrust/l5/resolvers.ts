/**
 * L5 · 非地球 resolver / 章节 data-attrs（纯函数）
 */
import type { TravelTrustRoleId } from "@/app/traveltrust/traveltrustIdentityModel";
import { smoothstep } from "@/components/traveltrust/cinematic/traveltrustCinematicEasing3d";
import {
  resolveCinematicCanvasCyanMul,
  resolveCinematicCorridorRingReveal,
  resolveCinematicEnvironmentOpacity,
  resolveCinematicEnvironmentVisible,
  resolveCinematicScrollWarmBandPeak,
} from "@/lib/traveltrustCinematicPageL5";
import {
  buildPageCinematicCanvasOverlayLayers,
  type PageCinematicOverlayParams,
} from "@/lib/traveltrustCinematicVisual";
import {
  TT_CINEMATIC_PAGE_INK_HEX,
  TT_ENVIRONMENT_L5_EXTRA,
  TT_THEATER_ROLE_WARM_UI,
  TT_THEATER_ROLE_WARM_3D_HEX,
} from "./meta";
import { TT_PAGE_SCROLL_SNAP_L5, type TraveltrustScrollChapterBeatId } from "./rhythm";
import { TT_SECTION_ATMOSPHERE_L5 } from "./atmosphere";

export function traveltrustChapterBeatDataAttrs(beat: TraveltrustScrollChapterBeatId): Record<string, string> {
  return { [TT_PAGE_SCROLL_SNAP_L5.chapterBeatDataAttr]: beat };
}

export function traveltrustSnapChapterBeatDataAttrs(
  chapterId: Exclude<TraveltrustScrollChapterBeatId, typeof TT_PAGE_SCROLL_SNAP_L5.chapterBeatHero>,
): Record<string, string> {
  return traveltrustChapterBeatDataAttrs(chapterId);
}

export function resolveTheaterRoleWarmUi(roleId: TravelTrustRoleId) {
  return TT_THEATER_ROLE_WARM_UI[roleId];
}

/** 滚动走廊环 · 角色 accent 暖色（非地球 · 不读冷青 3D 角色表） */
export function resolveTheaterRoleWarm3dHex(roleId: TravelTrustRoleId) {
  return TT_THEATER_ROLE_WARM_3D_HEX[roleId];
}

/** ① tier-1 角色媒体：强制暖色旅游占位，不播冷青 demo poster/mp4 */
export function prefersTheaterWarmPlaceholder(tier: "production" | "tier1-placeholder"): boolean {
  return tier === "tier1-placeholder";
}

/** 在冻结 resolver 之上叠加剧场段降噪 */
export function resolveNonGlobeEnvironmentOpacity(heroT: number, pageT: number): number {
  const base = resolveCinematicEnvironmentOpacity(heroT, pageT);
  const e = TT_ENVIRONMENT_L5_EXTRA;
  const rolesMul = 1 - smoothstep(e.rolesPageFadeStart, e.rolesPageFadeEnd, pageT) * e.rolesPageFadeMul;
  const heroMul = 1 - smoothstep(e.heroMidFadeStart, e.heroMidFadeEnd, heroT) * e.heroMidFadeMul;
  return base * rolesMul * heroMul;
}

export function resolveNonGlobeCorridorRingReveal(
  heroT: number,
  pageT: number,
  isMobile = false,
): number {
  const base = resolveCinematicCorridorRingReveal(heroT, pageT, false);
  const rolesBoost = smoothstep(0.22, 0.48, pageT) * 0.18;
  const deepFade = 1 - smoothstep(0.58, 0.86, pageT);
  const blended = Math.min(1, base + rolesBoost) * deepFade;
  if (isMobile) return Math.min(1, blended * 0.72);
  return blended;
}

/** 深滚（托管/FAQ/起步）时压暗固定 Canvas，避免 3D「舞台环」穿透正文 */
export function resolveNonGlobeDeepScrollCanvasInk(pageT: number): number {
  return smoothstep(0.68, 0.92, pageT);
}

/** 禁用 3D 地平线平面雾（灰地板穿帮 · 由 DOM/剧场背板接替） */
export function resolveNonGlobeHorizonFogOpacity(_heroT: number, _pageT: number): number {
  return 0;
}

/** 固定 Canvas 层整体透明度下限（与 scrollOpacity 联动） */
export function resolveNonGlobeCanvasScrollOpacity(pageT: number): number {
  return Math.max(0.08, 1 - smoothstep(0.72, 0.94, pageT));
}

/** 滚离 Hero 后进一步压冷青 Canvas scrim（FAQ/信任段归零 · P1-6） */
export function resolveNonGlobeCanvasCyanMul(heroT: number, pageT: number): number {
  if (pageT > 0.36) return 0;
  /** Hero 空域：关闭冷青电影 scrim，与 `#0c0a09` 同色 */
  if (heroT < 0.72) return 0;
  const base = resolveCinematicCanvasCyanMul(heroT, pageT);
  const extra = pageT * 0.38 + smoothstep(0.35, 0.7, heroT) * 0.14;
  return Math.min(0.1, Math.max(0, base - extra));
}

/** 暖色交接带：略抬剧场段峰值 */
export function resolveNonGlobeScrollWarmBandPeak(heroT: number, pageT: number): number {
  const base = resolveCinematicScrollWarmBandPeak(heroT, pageT);
  const rolesBoost = smoothstep(0.28, 0.52, pageT) * 0.16;
  return Math.min(1, base + rolesBoost);
}

/** 星空转速随环境透明度降低（剧场段降噪） */
export function resolveNonGlobeStarsSpeed(envOpacity: number): number {
  const e = TT_ENVIRONMENT_L5_EXTRA;
  return e.minStarSpeed + envOpacity * (e.maxStarSpeed - e.minStarSpeed);
}

export function resolveNonGlobeSectionAtmosphere(sectionId: string): string {
  return TT_SECTION_ATMOSPHERE_L5[sectionId] ?? TT_SECTION_ATMOSPHERE_L5.trust;
}

/** 剧场段完全隐藏星空（L5-2 压冷色环境） */
export function resolveNonGlobeEnvironmentVisible(heroT: number, pageT: number): boolean {
  if (pageT > TT_ENVIRONMENT_L5_EXTRA.rolesHideStarsPageT) return false;
  /** 首屏 Hero：星空 + 白点易与蓝海混成紫调天幕 */
  if (heroT < 0.58 && pageT < 0.2) return false;
  return resolveCinematicEnvironmentVisible(heroT, pageT);
}

/**
 * 将冻结 film token（`#030712` / 冷青 scrim）映射为页面暖墨，避免暖底 + 冷叠层混色偏紫蓝。
 * 不改动 `traveltrustCinematicVisual.ts`（地球锁定清单仍含该文件）。
 */
export function remapCinematicFilmInkToWarmPageInk(value: string): string {
  return value
    .replace(/rgba\(\s*3\s*,\s*7\s*,\s*18\s*,/g, "rgba(12,10,9,")
    .replace(/rgba\(\s*8\s*,\s*14\s*,\s*18\s*,/g, "rgba(10,9,8,")
    .replace(/rgba\(\s*10\s*,\s*15\s*,\s*13\s*,/g, "rgba(12,10,9,")
    .replace(/rgba\(\s*35\s*,\s*206\s*,\s*217\s*,/g, "rgba(252,164,124,")
    .replace(/rgba\(\s*110\s*,\s*231\s*,\s*183\s*,/g, "rgba(255,140,90,");
}

export function remapCinematicFilmInkLayersToWarmPageInk(layers: readonly string[]): string[] {
  return layers.map(remapCinematicFilmInkToWarmPageInk);
}

/**
 * Hero 首屏叠层（契约/工具 · 与 `buildPageCinematicCanvasOverlayLayers` 同构）。
 * 页面真值已退回 `archive/ui-v1/snapshot` · `TravelTrustPageCinematicCanvas` 内联叠层。
 */
export function buildHeroWarmCanvasOverlayLayers(params: PageCinematicOverlayParams): string[] {
  const pageT = params.pageT ?? 0;
  const cyanMul = params.cyanMul ?? resolveCinematicCanvasCyanMul(params.heroT, pageT);
  return buildPageCinematicCanvasOverlayLayers({ ...params, cyanMul });
}

/**
 * Hero 首屏：仅用于 Canvas **底下** 垫板（`canvas-warm-base-l5`）。
 * 中心透明 → WebGL 地球在上层绘制；外圈暖墨 → 空域与 layout 一致。
 * **禁止**放进 overlay `background` 顶层（会压在地球上，见 `HERO_SKY_COLOR_LAYER_AUDIT.md`）。
 */
/** 与 `#roles` 剧场顶盖、main `bg-[#0c0a09]` 同键 · 禁止 Hero 独做径向天幕 */
export function buildPageWarmInkFlatBackground(): string {
  return TT_CINEMATIC_PAGE_INK_HEX;
}

export function buildHeroWarmSkyBaseBackground(_globeOpticalX: string): string {
  return buildPageWarmInkFlatBackground();
}

/**
 * Hero 首屏：Canvas overlay 外圈暖墨环（mask 镂空球心后仅作用于「蓝紫光圈」带 · 与 `#0c0a09` 统一）
 * 叠在 overlay 栈顶，压 WebGL 空域冷青/紫靛光晕。
 */
export function buildHeroOuterSkyWarmRingLayer(globeOpticalX: string): string {
  const y = "var(--tt-hero-globe-optical-y,52%)";
  return `radial-gradient(ellipse 100% 90% at ${globeOpticalX} ${y}, rgba(12,10,9,0) 0%, rgba(12,10,9,0) 36%, #0c0a09 50%, #0c0a09 100%)`;
}

/** @deprecated Hero 外圈已仅用 `#0c0a09` 环；保留 API 供旧引用 */
export function buildHeroOuterSkyWarmAccentLayer(globeOpticalX: string): string {
  return buildHeroOuterSkyWarmRingLayer(globeOpticalX);
}

/** Hero 首屏：Canvas overlay 仅外圈暖墨（mask 镂空球心 · 无冷青/杏光衬底） */
export function buildHeroOuterSkyCanvasOverlayLayers(globeOpticalX: string): string {
  return buildHeroOuterSkyWarmRingLayer(globeOpticalX);
}

/** Hero 首屏 WebGL 暖墨缘壳（压住海洋贴图外侧青蓝光晕 · 非地球 mesh） */

export const TT_CANVAS_MOBILE_L5 = {
  bloomMaxHeroT: 0.78,
  bloomMaxPageT: 0.42,
} as const;

export function resolveNonGlobeMobileBloomEnabled(
  isMobile: boolean,
  heroT: number,
  pageT: number,
  baseEnabled: boolean,
): boolean {
  if (!baseEnabled) return false;
  if (!isMobile) return true;
  return heroT < TT_CANVAS_MOBILE_L5.bloomMaxHeroT && pageT < TT_CANVAS_MOBILE_L5.bloomMaxPageT;
}
