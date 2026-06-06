/**

 * /traveltrust Hero 左右分栏 — Canvas 左球、文案卡右栏 共用宽度（①）

 * 改此处须同步：marketingUi 网格列宽、TravelTrustPageCinematicCanvas split 右 inset

 */



import { TT_HERO_SPLIT_ALIGN_CSS_VARS } from "./traveltrustHeroCinematicAlign";
import { TT_HERO_L5_DIRECTOR_COPY_SHIFT_PX } from "./traveltrustHeroL5DirectorFinalPass";



/** 右侧文案卡列宽基准（px）；CSS 用 clamp 适配 1280～1536 */

export const TT_HERO_SPLIT_COPY_COL_PX = 416;



/** 网格列间距（lg:gap-12 = 3rem） */

export const TT_HERO_SPLIT_GRID_GAP_PX = 40;



/** 文案列宽：桌面 clamp，与 7xl 内容框对齐 */

/** 略收窄右卡，100% 缩放下少挡地球（TT-PH1-150 · 截图） */
export const TT_HERO_SPLIT_COPY_COL_WIDTH_CSS = "clamp(19.25rem, 27vw, 25.5rem)";



/** 桌面首屏：Canvas 右侧留白 = 文案列 + 间距（与网格对齐） */

export const TT_HERO_SPLIT_CANVAS_RIGHT_INSET_CSS = `calc(${TT_HERO_SPLIT_COPY_COL_WIDTH_CSS} + ${TT_HERO_SPLIT_GRID_GAP_PX}px)`;



/** Hero section 上注入 --tt-hero-copy-w，供 Tailwind arbitrary 与 Canvas 共用 */

export const TT_HERO_SPLIT_CSS_VARS_STYLE = {

  ...TT_HERO_SPLIT_ALIGN_CSS_VARS,

  ["--tt-hero-copy-w" as string]: TT_HERO_SPLIT_COPY_COL_WIDTH_CSS,

  ["--tt-hero-split-gap" as string]: `${TT_HERO_SPLIT_GRID_GAP_PX}px`,

  ["--tt-hero-copy-shift-x" as string]: `${TT_HERO_L5_DIRECTOR_COPY_SHIFT_PX}px`,

} as const;


