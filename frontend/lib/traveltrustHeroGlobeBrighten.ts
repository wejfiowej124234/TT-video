/**

 * Hero 地球 Pass A 提亮（① · 贴图/材质真源 · 不用 DOM/CSS 叠光）

 *

 * **Director Final Pass 冻结**：`brightness` / `sepia` / `contrast` / `hue` 与 `earthDisplayBrightness`；
 * `saturate` 仅允许阶梯 **Step 6** 半档（0.9→0.91，见 ladder `earthMapSaturate`）。

 * `earthDisplayBrightness`。区域压暗见 `traveltrustHeroL5DirectorFinalPass.ts`。

 *

 * **阶梯提亮**：改 `TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP`（见 `traveltrustHeroGlobeBrightenLadder.ts`）。

 */

import {

  HERO_GLOBE_BRIGHTEN_LADDER,

  TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP,

} from "@/lib/traveltrustHeroGlobeBrightenLadder";



const _ladder = HERO_GLOBE_BRIGHTEN_LADDER[TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP];



export const TRAVELTRUST_HERO_GLOBE_PASS_A_BRIGHTEN_ID =

  "TT-GLOBE-PASS-A-BRIGHTEN-2026-05" as const;



/** 材质微调批次（暗部可读 · 半档 · 不整体加白） */

export const TRAVELTRUST_HERO_GLOBE_PASS_A_MATERIAL_TUNE_ID =

  "TT-GLOBE-PASS-A-MATERIAL-TUNE-2026-05" as const;



/** 当前阶梯批次 ID（撤回：改 `TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP`） */

export const TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_ID = _ladder.id;



/** @deprecated 用 `TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_ID` */

export const TRAVELTRUST_HERO_GLOBE_PASS_A_PLAN_A_BRIGHTEN_ID =

  "TT-GLOBE-PASS-A-PLAN-A-BRIGHTEN-2026-05" as const;



export { TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP };



/** `TT_CINEMATIC_GLOBE_VISUAL.earthDisplayBrightness` */

export const TRAVELTRUST_HERO_GLOBE_EARTH_DISPLAY_BRIGHTNESS = 1.3 as const;



/** `enhanceTraveltrustGlobeEarthMap` ctx.filter */

export const TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER = {

  brightness: 1.02,

  contrast: 1.06,

  saturate: _ladder.earthMapSaturate,

  sepia: 0.04,

  hueRotateDeg: 8,

} as const;



/** 贴图后处理（暖褐陆地 · 昼侧海光锚定太阳 · 南半球略压） */

export const TRAVELTRUST_HERO_GLOBE_EARTH_MAP_GRADE = {

  landWarmMultiplyAlpha: _ladder.landWarmMultiplyAlpha,

  equatorCoolMultiplyAlpha: 0.08,

  /** 0 = 禁用 equirect 垂直中线 soft-light（易读成球心/赤道 hotspot） */

  oceanHighlightPeakAlpha: 0,

  /** 昼侧海光 · 径向锚定 `TRAVELTRUST_GLOBE_SUN_DIR`（非屏幕中心） */

  oceanSunGlintPeakAlpha: _ladder.oceanSunGlintPeakAlpha,

  /** equirect 海光径向半径 = `max(w,h) * scale`（过大时旋转到大洋正中像球心 hotspot） */

  oceanSunGlintRadiusScale: _ladder.oceanSunGlintRadiusScale,

  /** 南纬带 multiply 压暗（约 15–18% · 避免澳洲抢亚太主视觉） */

  southernHemisphereMultiplyAlpha: 0.17,

} as const;



/** Hero 昼侧大气暖边（太阳向 · 非 view Fresnel 中心光斑） */

export const TRAVELTRUST_HERO_GLOBE_SUN_DAYLIGHT_RIM = {

  intensity: _ladder.sunDaylightRimIntensity,

  power: 4.2,

} as const;



/**

 * Hero 首屏辅光（`PageCinematicHeroWarmFill` · 非冻结）

 * 天空色略暖暗、地面色抬暗部 — 避免 #0c0a09 纯黑半球。

 */

export const TRAVELTRUST_HERO_GLOBE_SHADOW_FILL = {

  hemiSky: "#161310",

  hemiGround: _ladder.hemiGround,

  hemiIntensity: _ladder.hemiIntensity,

  ambColor: "#1e1a16",

  ambIntensity: _ladder.ambIntensity,

} as const;



/** `TT_CINEMATIC_GLOBE_VISUAL` hero 首屏云层/夜灯 */

export const TRAVELTRUST_HERO_GLOBE_HERO_WARM_INK = {

  cloudOpacityScale: _ladder.cloudOpacityScale,

  nightLightsStrength: _ladder.nightLightsStrength,

} as const;

/** 阶梯覆盖 Director 北非压暗（仅 multiply · 非全局 filter） */

export const TRAVELTRUST_HERO_GLOBE_NORTH_AFRICA_MULTIPLY_ALPHA = _ladder.northAfricaMultiplyAlpha;

export const TRAVELTRUST_HERO_GLOBE_NORTH_AFRICA_RADIUS_UX = _ladder.northAfricaRadiusUx;

export const TRAVELTRUST_HERO_GLOBE_NORTH_AFRICA_RADIUS_VY = _ladder.northAfricaRadiusVy;



/** Hero Phase1 针脚/光晕（非冻结 · 阶梯 `pinDecorMul`） */

export const TRAVELTRUST_HERO_GLOBE_PIN_DECOR_MUL = _ladder.pinDecorMul;



export function buildTraveltrustGlobeEarthMapEnhanceFilter(): string {

  const f = TRAVELTRUST_HERO_GLOBE_EARTH_MAP_FILTER;

  return `brightness(${f.brightness}) contrast(${f.contrast}) saturate(${f.saturate}) sepia(${f.sepia}) hue-rotate(${f.hueRotateDeg}deg)`;

}


