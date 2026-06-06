/**
 * L5 · Hero Canvas mask / overlay builders
 */
import {
  buildPageCinematicCanvasOverlayLayers,
  type PageCinematicOverlayParams,
} from "@/lib/traveltrustCinematicVisual";
import { TT_CINEMATIC_PAGE_INK_HEX } from "./meta";
import { resolveNonGlobeCanvasCyanMul, remapCinematicFilmInkLayersToWarmPageInk } from "./resolvers";

export const TT_HERO_GLOBE_WARM_LIMB_SHELL_L5 = {
  scaleMul: 1.34,
  color: "#0c0a09",
  opacity: 0.14,
  heroFadeEnd: 0.62,
} as const;

/** Hero 首屏：贴球暖雾（FrontSide · 禁用 · 易成屏幕空间中心白斑） */
export const TT_HERO_GLOBE_WARM_FRONT_VEIL_L5 = {
  scaleMul: 1.045,
  color: "#2a221c",
  opacity: 0,
  heroFadeEnd: 0.62,
} as const;

/** Hero：球体保留区 mask（透明=露出 WebGL；黑=显示本层 CSS 底） */
export function buildHeroGlobeKeepoutMaskImage(globeOpticalX: string): string {
  const y = "var(--tt-hero-globe-optical-y,52%)";
  /** 镂空收紧（原 66% 过大 → 上半屏透出 WebGL 冷蓝） */
  return `radial-gradient(ellipse 72% 68% at ${globeOpticalX} ${y}, transparent 0%, transparent 40%, rgba(0,0,0,0.55) 52%, rgba(0,0,0,0.92) 62%, #000 72%)`;
}

/**
 * 全视口固定暖墨 mask：顶半屏实心 + 球外缘（`mask-composite: add` · 与 keepout 分键）。
 * 解决仅 radial 镂空时 50–70vh 横带仍露 WebGL 青紫天幕。
 */
export function buildHeroFixedInkMaskImage(globeOpticalX: string): string {
  const y = "var(--tt-hero-globe-optical-y,52%)";
  const topBand =
    "linear-gradient(to bottom, #000 0%, #000 min(50vh,540px), transparent min(58vh,620px), transparent 100%)";
  const globeRing = `radial-gradient(ellipse 78% 72% at ${globeOpticalX} ${y}, transparent 0%, transparent 38%, rgba(0,0,0,0.5) 50%, #000 62%)`;
  return `${topBand}, ${globeRing}`;
}

/** @deprecated 别名 · 与 `buildHeroGlobeKeepoutMaskImage` 同义 */
export function buildHeroCanvasOverlayMaskImage(globeOpticalX: string): string {
  return buildHeroGlobeKeepoutMaskImage(globeOpticalX);
}

/** Hero 横条暖墨背板（z 高于固定 Canvas，仅球区镂空；与下方 `#0c0a09` 实底同键） */
export const TT_HERO_WARM_BACKDROP_L5 = {
  rootClass: "pointer-events-none absolute inset-0 z-[1]",
  background: TT_CINEMATIC_PAGE_INK_HEX,
} as const;

/** Hero 首屏勿叠在球心的暖色 radial（否则 DOM 上压在 Canvas 之上） */
const HERO_OVERLAY_GLOBE_CENTER_WARM_RE =
  /radial-gradient\(ellipse 78% 64%[\s\S]*?255,178,108/;

/** Hero 首屏：Canvas overlay 上的全宽「横条/地板」渐变（改由 underlay letterbox 承担） */
function isHeroCanvasFloorOverlayLayer(layer: string): boolean {
  return (
    /linear-gradient\(to top,\s*rgba\(12,10,9/.test(layer) ||
    /linear-gradient\(to bottom,\s*rgba\(12,10,9,\s*0\.3\)/.test(layer) ||
    /linear-gradient\(to bottom, transparent 0%, rgba\(12,10,9/.test(layer) ||
    /linear-gradient\(to bottom, transparent 0%, rgba\(3,7,18/.test(layer) ||
    /linear-gradient\(to bottom, transparent 88%/.test(layer)
  );
}

/** 顶缘冷色天幕：`TT_PAGE_CINEMATIC_LETTERBOX_OVERLAY` 首层 + `heroNavScrim`（约 0–20vh） */
function isHeroCanvasTopInkBandLayer(layer: string): boolean {
  return (
    /linear-gradient\(180deg,\s*rgba\(12,10,9/i.test(layer) ||
    /linear-gradient\(180deg,\s*rgba\(3,7,18/i.test(layer) ||
    (/linear-gradient\(to bottom,\s*rgba\(12,10,9/i.test(layer) &&
      /transparent min\(\d/.test(layer) &&
      !/transparent 0%,\s*rgba\(12,10,9,\s*0\.12\)/.test(layer))
  );
}

/** 全页 Canvas CSS 叠层：暖墨 remap；Hero 不加全屏天幕（避免盖住 WebGL 地球） */
export function buildWarmPageCinematicCanvasOverlayLayers(
  params: PageCinematicOverlayParams,
): string[] {
  const pageT = params.pageT ?? 0;
  const cyanMul =
    params.cyanMul ??
    (params.heroT < 0.72 ? 0 : resolveNonGlobeCanvasCyanMul(params.heroT, pageT));
  let layers = remapCinematicFilmInkLayersToWarmPageInk(
    buildPageCinematicCanvasOverlayLayers({ ...params, cyanMul }),
  ).filter((layer) => !isHeroCanvasTopInkBandLayer(layer) && !isHeroCanvasFloorOverlayLayer(layer));
  /** 首屏：零 CSS overlay，避免暖底 + 冷青/径向叠层再混成「蓝紫天幕」；地球只由 WebGL 绘制 */
  if (params.heroT < 0.72) {
    return [];
  }
  return layers;
}
