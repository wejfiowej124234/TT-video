/**
 * Hero 地球提亮阶梯（① · 可逐步撤回）
 *
 * 每步只动未冻结项；冻结项见 `traveltrustHeroGlobeBrighten.ts` 文件头。
 * 撤回：将 `TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP` 改为上一档数字。
 */
export const TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP = 8 as const;

export type HeroGlobeBrightenLadderStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Step 0 · Pass A 基线（Director 前） */
const STEP_0 = {
  id: "TT-GLOBE-PASS-A-BASELINE-2026-05",
  hemiGround: "#2a221a",
  hemiIntensity: 1.1,
  ambIntensity: 0.44,
  cloudOpacityScale: 0.38,
  landWarmMultiplyAlpha: 0.15,
  oceanSunGlintPeakAlpha: 0.08,
  oceanSunGlintRadiusScale: 0.38,
  sunDaylightRimIntensity: 0.055,
  pinDecorMul: 1,
  northAfricaMultiplyAlpha: 0.125,
  northAfricaRadiusUx: 0.14,
  northAfricaRadiusVy: 0.09,
  nightLightsStrength: 0.17,
  earthMapSaturate: 0.9,
} as const;

/** Step 1 · 方案 A */
const STEP_1 = {
  id: "TT-GLOBE-PASS-A-PLAN-A-BRIGHTEN-2026-05",
  hemiGround: "#2a221a",
  hemiIntensity: 1.18,
  ambIntensity: 0.48,
  cloudOpacityScale: 0.32,
  landWarmMultiplyAlpha: 0.12,
  oceanSunGlintPeakAlpha: 0.095,
  oceanSunGlintRadiusScale: 0.38,
  sunDaylightRimIntensity: 0.065,
  pinDecorMul: 1,
  northAfricaMultiplyAlpha: 0.125,
  northAfricaRadiusUx: 0.14,
  northAfricaRadiusVy: 0.09,
  nightLightsStrength: 0.17,
  earthMapSaturate: 0.9,
} as const;

/** Step 2 · 暗部地形可读 + 针脚略退（→10 分渐进） */
const STEP_2 = {
  id: "TT-GLOBE-PASS-A-PLAN-A-STEP-2-2026-05",
  hemiGround: "#2e261e",
  hemiIntensity: 1.18,
  ambIntensity: 0.5,
  cloudOpacityScale: 0.32,
  landWarmMultiplyAlpha: 0.12,
  oceanSunGlintPeakAlpha: 0.095,
  oceanSunGlintRadiusScale: 0.38,
  sunDaylightRimIntensity: 0.065,
  pinDecorMul: 0.9,
  northAfricaMultiplyAlpha: 0.125,
  northAfricaRadiusUx: 0.14,
  northAfricaRadiusVy: 0.09,
  nightLightsStrength: 0.17,
  earthMapSaturate: 0.9,
} as const;

/** Step 3 · 截图反馈：北非/中东略压、昼侧海光+rim、暗部再抬、夜灯散点略退 */
const STEP_3 = {
  id: "TT-GLOBE-PASS-A-PLAN-A-STEP-3-2026-05",
  hemiGround: "#302820",
  hemiIntensity: 1.2,
  ambIntensity: 0.5,
  cloudOpacityScale: 0.32,
  landWarmMultiplyAlpha: 0.12,
  oceanSunGlintPeakAlpha: 0.1,
  oceanSunGlintRadiusScale: 0.38,
  sunDaylightRimIntensity: 0.07,
  pinDecorMul: 0.9,
  northAfricaMultiplyAlpha: 0.14,
  northAfricaRadiusUx: 0.14,
  northAfricaRadiusVy: 0.09,
  nightLightsStrength: 0.14,
  earthMapSaturate: 0.9,
} as const;

/** Step 4 · 截图：北非仍偏亮、澳新暗部仍闷、散点再退（不动 saturate） */
const STEP_4 = {
  id: "TT-GLOBE-PASS-A-PLAN-A-STEP-4-2026-05",
  hemiGround: "#322a22",
  hemiIntensity: 1.22,
  ambIntensity: 0.52,
  cloudOpacityScale: 0.32,
  landWarmMultiplyAlpha: 0.12,
  oceanSunGlintPeakAlpha: 0.1,
  oceanSunGlintRadiusScale: 0.38,
  sunDaylightRimIntensity: 0.07,
  pinDecorMul: 0.85,
  northAfricaMultiplyAlpha: 0.155,
  northAfricaRadiusUx: 0.16,
  northAfricaRadiusVy: 0.1,
  nightLightsStrength: 0.12,
  earthMapSaturate: 0.9,
} as const;

/** Step 5 · 4b：北非带再压（仅 multiply · 半径不动） */
const STEP_5 = {
  id: "TT-GLOBE-PASS-A-PLAN-A-STEP-5-2026-05",
  hemiGround: "#322a22",
  hemiIntensity: 1.22,
  ambIntensity: 0.52,
  cloudOpacityScale: 0.32,
  landWarmMultiplyAlpha: 0.12,
  oceanSunGlintPeakAlpha: 0.1,
  oceanSunGlintRadiusScale: 0.38,
  sunDaylightRimIntensity: 0.07,
  pinDecorMul: 0.85,
  northAfricaMultiplyAlpha: 0.168,
  northAfricaRadiusUx: 0.16,
  northAfricaRadiusVy: 0.1,
  nightLightsStrength: 0.12,
  earthMapSaturate: 0.9,
} as const;

/** Step 6 · 海蓝半档解冻：`saturate` 0.91（用户确认 · 不动 brightness/sepia） */
const STEP_6 = {
  id: "TT-GLOBE-PASS-A-PLAN-A-STEP-6-2026-05",
  hemiGround: "#322a22",
  hemiIntensity: 1.22,
  ambIntensity: 0.52,
  cloudOpacityScale: 0.32,
  landWarmMultiplyAlpha: 0.12,
  oceanSunGlintPeakAlpha: 0.1,
  oceanSunGlintRadiusScale: 0.38,
  sunDaylightRimIntensity: 0.07,
  pinDecorMul: 0.85,
  northAfricaMultiplyAlpha: 0.168,
  northAfricaRadiusUx: 0.16,
  northAfricaRadiusVy: 0.1,
  nightLightsStrength: 0.12,
  earthMapSaturate: 0.91,
} as const;

/** Step 7 · 旋转视角：缩小太阳向海光半径 + 略降峰值（避免大洋正对时读成球心白斑） */
const STEP_7 = {
  id: "TT-GLOBE-PASS-A-PLAN-A-STEP-7-GLINT-2026-05",
  hemiGround: "#322a22",
  hemiIntensity: 1.22,
  ambIntensity: 0.52,
  cloudOpacityScale: 0.32,
  landWarmMultiplyAlpha: 0.12,
  oceanSunGlintPeakAlpha: 0.085,
  oceanSunGlintRadiusScale: 0.3,
  sunDaylightRimIntensity: 0.07,
  pinDecorMul: 0.85,
  northAfricaMultiplyAlpha: 0.168,
  northAfricaRadiusUx: 0.16,
  northAfricaRadiusVy: 0.1,
  nightLightsStrength: 0.12,
  earthMapSaturate: 0.91,
} as const;

/** Step 8 · 7b：太平洋正对仍像球心白斑 → 海光再收（仅 peak + radius） */
const STEP_8 = {
  id: "TT-GLOBE-PASS-A-PLAN-A-STEP-8-GLINT-7B-2026-05",
  hemiGround: "#322a22",
  hemiIntensity: 1.22,
  ambIntensity: 0.52,
  cloudOpacityScale: 0.32,
  landWarmMultiplyAlpha: 0.12,
  oceanSunGlintPeakAlpha: 0.08,
  oceanSunGlintRadiusScale: 0.28,
  sunDaylightRimIntensity: 0.07,
  pinDecorMul: 0.85,
  northAfricaMultiplyAlpha: 0.168,
  northAfricaRadiusUx: 0.16,
  northAfricaRadiusVy: 0.1,
  nightLightsStrength: 0.12,
  earthMapSaturate: 0.91,
} as const;

export const HERO_GLOBE_BRIGHTEN_LADDER = {
  0: STEP_0,
  1: STEP_1,
  2: STEP_2,
  3: STEP_3,
  4: STEP_4,
  5: STEP_5,
  6: STEP_6,
  7: STEP_7,
  8: STEP_8,
} as const;

export function resolveHeroGlobeBrightenLadderStep(
  step: HeroGlobeBrightenLadderStep = TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP,
) {
  return HERO_GLOBE_BRIGHTEN_LADDER[step];
}
