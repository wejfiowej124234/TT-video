/** v6 电影级入场时间轴（与 redesign spec §0「1.2s Hero→剧场」对齐） */
export const TT_CINEMATIC_EASE = [0.22, 1, 0.36, 1] as const;

export const TT_HERO_ENTRANCE = {
  kicker: { delay: 0, duration: 0.5 },
  title: { delay: 0.12, duration: 0.62 },
  tagline: { delay: 0.28, duration: 0.48 },
  chips: { delayChildren: 0.42, stagger: 0.07 },
  cta: { delay: 0.68, duration: 0.38 },
  scrollHint: { delay: 0.92, duration: 0.4 },
} as const;

/** Hero 动画结束后剧场区块入场（秒） */
export const TT_THEATER_ENTRANCE_DELAY_S = 1.2;
