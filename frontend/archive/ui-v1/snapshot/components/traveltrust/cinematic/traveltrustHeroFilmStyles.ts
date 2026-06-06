/** 首屏遮幅 / vignette — 冷暗主色 #030712 系（TT-PH1-150/173 · ①） */
export const TT_HERO_FILM_INK = "#030712";
export const TT_HERO_FILM_DEPTH = "#080e12";

/** Hero 内缘渐变（与 TT_PAGE_CINEMATIC_LETTERBOX_OVERLAY 同源 token） */
export const TT_HERO_LETTERBOX_TOP_CLASS =
  "pointer-events-none absolute inset-x-0 top-0 z-[4] h-[min(5.5vh,52px)] bg-[linear-gradient(to_bottom,rgba(3,7,18,0.88)_0%,rgba(8,14,18,0.42)_48%,transparent_100%)]";

export const TT_HERO_LETTERBOX_BOTTOM_CLASS =
  "pointer-events-none absolute inset-x-0 bottom-0 z-[4] h-[min(5.5vh,52px)] bg-[linear-gradient(to_top,rgba(3,7,18,0.82)_0%,rgba(8,14,18,0.38)_50%,transparent_100%)]";

/** 全页 fixed Canvas 同坐标系上下 vignette（与 hero 内缘视觉连续） */
export const TT_PAGE_CINEMATIC_LETTERBOX_OVERLAY: readonly string[] = [
  "linear-gradient(to bottom, rgba(3,7,18,0.32) 0%, rgba(8,14,18,0.08) min(4vh,40px), transparent min(7vh,64px))",
  "linear-gradient(to top, rgba(3,7,18,0.2) 0%, rgba(8,14,18,0.06) min(5.5vh,52px), transparent min(12vh,96px))",
] as const;
