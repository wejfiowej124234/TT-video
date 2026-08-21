/**
 * `/traveltrust` Hero 文案排版 token（①）
 */

/** 品牌 + 后缀分 span，避免「TravelTrust」与「网络」拆成两行 */
export const TT_HERO_TITLE_CLASS =
  "flex w-full max-w-full flex-wrap items-baseline justify-center gap-x-[0.38em] gap-y-1 text-[clamp(1.4rem,4.2vw,1.95rem)] font-bold leading-[1.14] tracking-tight sm:text-[clamp(1.55rem,2.8vw,2.1rem)] lg:justify-start lg:gap-x-[0.4em] lg:text-[clamp(1.65rem,1.6vw+0.75rem,2.15rem)] [&_span]:max-w-full lg:[&_span]:whitespace-nowrap";

export const TT_HERO_TITLE_BRAND_CLASS =
  "bg-gradient-to-r from-ref-sun via-[#f0c27a] to-[#e8b86a] bg-clip-text text-transparent";

export const TT_HERO_TITLE_SUFFIX_CLASS = "text-white";

export const TT_HERO_TAGLINE_CLASS =
  "mt-0.5 text-pretty text-body leading-relaxed text-slate-200/95 lg:mt-1 lg:max-w-[22rem]";

export const TT_HERO_TRUST_CHIPS_ROW_CLASS =
  "mt-5 flex flex-wrap justify-center gap-2.5 sm:gap-3 lg:justify-start";

export const TT_HERO_SCROLL_HINT_CLASS =
  "inline-flex flex-col items-center gap-1.5 rounded-lg px-3 pb-1 pt-2 text-meta text-slate-400 transition hover:text-ref-sun/90 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 lg:items-start lg:pb-2";

export const TT_HERO_CTA_ROW_CLASS = "flex w-full flex-col gap-3";
