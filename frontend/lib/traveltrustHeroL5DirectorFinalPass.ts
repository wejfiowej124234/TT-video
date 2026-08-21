/**
 * Hero L5 Director Final Pass（① · 镜头语言 · 非冻结）
 *
 * **冻结**（本批次禁止再改）：`traveltrustHeroGlobeBrighten` 全局 filter（brightness/sepia/saturate）
 * 与 `earthDisplayBrightness`、Pass A 材质/贴图色相。
 *
 * 本文件仅调：rig 尺度/位移、文案卡偏移、弱网络弧线、区域贴图 multiply（北非）、太阳向高光开关。
 */
export const TRAVELTRUST_HERO_L5_DIRECTOR_FINAL_PASS_ID =
  "TT-HERO-L5-DIRECTOR-FINAL-PASS-2026-05" as const;

/** 相对收口 scale 0.84 · +6% */
export const TT_HERO_L5_DIRECTOR_GLOBE_SCALE_MUL = 0.8904 as const;

/** split rig X（较 -0.36 再左移约 5% 屏宽量级） */
export const TT_HERO_L5_DIRECTOR_GLOBE_X = -0.41 as const;

/** DOM 光心 fallback（较 28% 左移 4%） */
export const TT_HERO_L5_DIRECTOR_OPTICAL_X_FALLBACK = "24%" as const;

/** 右栏文案卡 lg 右移（px） */
export const TT_HERO_L5_DIRECTOR_COPY_SHIFT_PX = 28 as const;

/** 弱网络走廊：非主走廊 opacity ≈ 0.28–0.35（× travelArcOpacity 0.74） */
export const TT_HERO_L5_DIRECTOR_ARC_WEAK_CORRIDOR_MUL = 0.42 as const;

/** 同屏弧线预算：主走廊 2–3 + 弱网 3–5 */
export const TT_HERO_L5_DIRECTOR_ARC_MAX_COUNT = 8 as const;

export const TT_HERO_L5_DIRECTOR_ARC_MAX_COUNT_LITE = 5 as const;

/**
 * 北非—撒哈拉北缘压暗（multiply · 非全局 brightness/sepia/saturate）
 * ~12.5% 压暗（用户 10–15% 区间中值）
 */
export const TT_HERO_L5_DIRECTOR_NORTH_AFRICA_GRADE = {
  multiplyAlpha: 0.125,
  /** equirect 锚点（约 25°N · 10°E） */
  centerU: 0.53,
  centerV: 0.36,
  radiusUx: 0.14,
  radiusVy: 0.09,
} as const;
