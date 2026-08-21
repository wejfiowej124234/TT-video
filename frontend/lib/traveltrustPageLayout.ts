/**
 * `/traveltrust` 页面级排版真源（①）
 * Hero / 顶栏 / 折叠区 / 页脚共用同一 max-width 与 gutter。
 */

/** 内容最大宽度 1280px — 与 lg 双栏 Hero 对齐 */
export const TT_TRAVELTRUST_PAGE_MAX_W_CLASS = "max-w-7xl";

/** 水平安全边距（与 marketing Header 内边距递进一致） */
export const TT_TRAVELTRUST_PAGE_GUTTER_CLASS = "px-4 sm:px-6 lg:px-8 xl:px-12";

/** 标准内容框：居中 + 最大宽 + gutter */
export const TT_TRAVELTRUST_PAGE_FRAME_CLASS = `relative mx-auto w-full ${TT_TRAVELTRUST_PAGE_MAX_W_CLASS} ${TT_TRAVELTRUST_PAGE_GUTTER_CLASS}`;

/** 长页叙事主栏（trust/faq/start 等 · 较原 max-w-2xl 略宽、仍居中） */
export const TT_TRAVELTRUST_SECTION_PROSE_CLASS = "mx-auto w-full max-w-3xl";

/** 全宽色带（内层仍用 PAGE_FRAME；勿用 w-screen+translate，与 layout overflow-x-clip 冲突） */
export const TT_TRAVELTRUST_PAGE_BLEED_BAND_CLASS = "relative w-full";

/** Hero 内容区顶部留白：站点 Header(3.5rem) + LandingChrome(单行~3rem / 折行~4rem) */
export const TT_TRAVELTRUST_HERO_CONTENT_OFFSET_CLASS =
  "pt-[calc(8rem+env(safe-area-inset-top,0px))] sm:pt-[calc(8.75rem+env(safe-area-inset-top,0px))] lg:pt-[calc(9.25rem+env(safe-area-inset-top,0px))]";
