/**
 * Hero L5 Final Polish（① · 非冻结）
 * 不改动坐标 / Pass A·B / P0–P2；仅体验层：目的地标签、脉冲、粒子、海洋云层叠光。
 */
export const TRAVELTRUST_HERO_L5_FINAL_POLISH_ID = "TT-HERO-L5-FINAL-POLISH-2026-05" as const;

/** Hero L5 视觉收口（标签上限 + 弧线降权 · 不抬地球亮度） */
export const TRAVELTRUST_HERO_L5_VISUAL_CLOSURE_ID = "TT-HERO-L5-VISUAL-CLOSURE-2026-05" as const;

/** 首屏同时显示的核心目的地文字标签上限（3–4） */
export const TRAVELTRUST_HERO_L5_MAX_VISIBLE_LABELS = 4 as const;

/** focus 时非高亮标签保留可读（L5 收口 0.5 → 回退约 40% 降权） */
export const TRAVELTRUST_HERO_L5_LABEL_DIM_ON_FOCUS_MUL = 0.72 as const;

/** 关闭 DOM 方向粒子（易与走廊 pulse 叠成「满屏小光球」） */
export const TRAVELTRUST_HERO_L5_DIRECTION_PARTICLES_ENABLED = false as const;

export const TRAVELTRUST_HERO_L5_DESTINATION_LABEL_KEYS = {
  cn: "traveltrust_hero_l5_dest_cn",
  us: "traveltrust_hero_l5_dest_us",
  fr: "traveltrust_hero_l5_dest_fr",
  es: "traveltrust_hero_l5_dest_es",
  jp: "traveltrust_hero_l5_dest_jp",
  th: "traveltrust_hero_l5_dest_th",
  sg: "traveltrust_hero_l5_dest_sg",
  kr: "traveltrust_hero_l5_dest_kr",
  au: "traveltrust_hero_l5_dest_au",
  ae: "traveltrust_hero_l5_dest_ae",
} as const;

export type TraveltrustHeroL5DestinationHubId = keyof typeof TRAVELTRUST_HERO_L5_DESTINATION_LABEL_KEYS;

export function isTraveltrustHeroL5DestinationHubId(id: string): id is TraveltrustHeroL5DestinationHubId {
  return id in TRAVELTRUST_HERO_L5_DESTINATION_LABEL_KEYS;
}

export function resolveHeroL5DestinationLabelKey(
  nodeId: string,
  phase1RegionId: string | undefined,
  fallbackLabelKey: string,
): string {
  const hubId = phase1RegionId ?? nodeId;
  if (isTraveltrustHeroL5DestinationHubId(hubId)) {
    return TRAVELTRUST_HERO_L5_DESTINATION_LABEL_KEYS[hubId];
  }
  return fallbackLabelKey;
}
