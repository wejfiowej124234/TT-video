/** L5 · 区块排版 / 滚动 chrome / 表面 class */
import { TT_PAGE_VERTICAL_RHYTHM_L5 } from "./rhythm";

export const TT_SECTION_CONTENT_L5 = {
  bodyClass: "relative z-[1] mx-auto w-full max-w-3xl px-0.5 sm:px-0",
  kickerToHeadingClass: TT_PAGE_VERTICAL_RHYTHM_L5.headerStackGap,
  headingClass: "max-w-3xl text-h4 font-bold text-white sm:text-h3",
  headingCompactClass: "text-h4 font-bold text-white",
  introClass: `${TT_PAGE_VERTICAL_RHYTHM_L5.headingToIntro} text-meta leading-relaxed text-slate-300/92`,
  stackAfterHeadingClass: TT_PAGE_VERTICAL_RHYTHM_L5.contentStackGap,
  disclaimerClass: `${TT_PAGE_VERTICAL_RHYTHM_L5.disclaimerAfterGrid} max-w-3xl text-meta leading-relaxed text-slate-300/90`,
  cardGridClass: `${TT_PAGE_VERTICAL_RHYTHM_L5.contentStackGap} mx-auto grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:max-w-5xl`,
} as const;

/** 长页区块表面（无冷 border-t；区块间由 film-divider 衔接） */
/** 长页次要/meta 字色（对比度 · P2） */
export const TT_SECTION_META_L5 = {
  bodyClass: "text-meta leading-relaxed text-slate-300/92",
  subtleClass: "text-meta text-slate-400/90",
  labelClass: "text-meta text-slate-400/95",
  copyrightClass: "text-meta text-slate-300/90",
} as const;

/** 区块眉题 kicker（信任/结算/FAQ/启程/兑换 共用 · L5-2） */
export const TT_SECTION_KICKER_L5 =
  "text-kicker font-semibold uppercase tracking-[0.2em] text-ref-sun/96";

const _flowSectionBase = "relative isolate overflow-hidden flex flex-col";
export const TT_SECTION_SURFACE_L5 = {
  liquidity: `${_flowSectionBase} justify-center opacity-[0.97] ${TT_PAGE_VERTICAL_RHYTHM_L5.sectionClusterFirst}`,
  trust: `${_flowSectionBase} justify-center ${TT_PAGE_VERTICAL_RHYTHM_L5.sectionClusterMid}`,
  settlement: `${_flowSectionBase} justify-center ${TT_PAGE_VERTICAL_RHYTHM_L5.sectionClusterLast}`,
  faq: `${_flowSectionBase} justify-start overflow-visible ${TT_PAGE_VERTICAL_RHYTHM_L5.sectionAfterMajorBreak}`,
  /** @deprecated 经济簇顶光见 `TT_PAGE_SECTION_FLOW_L5.economyClusterAtmosphereClass` */
  trustAtmosphere: "hidden",
  faqAtmosphere:
    "pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_78%_75%_at_50%_0%,rgba(252,164,124,0.06),transparent_74%)]",
  faqWarmScrimClass:
    "pointer-events-none absolute inset-x-4 top-24 bottom-8 rounded-3xl bg-[radial-gradient(ellipse_90%_70%_at_50%_40%,rgba(252,164,124,0.03),transparent_72%)] sm:inset-x-8",
} as const;

/** 左下章节 chrome / Hero「向下」提示共用 pill（L5-3 · G5） */
export const TT_SCROLL_CHROME_PILL_L5 =
  "rounded-lg border border-ref-sun/18 bg-[#0a0908]/90 shadow-[0_8px_28px_-12px_rgba(252,164,124,0.22)] backdrop-blur-md";

export const TT_SCROLL_PROGRESS_L5 = {
  barClass: "bg-gradient-to-r from-ref-sun via-ref-coral/85 to-amber-200/65",
  chapterBorderClass: "border-ref-sun/22",
  /** 左下锚点（含窄屏）；与右下角间距调试钮（dev / ?tt_spacing=1）分离 */
  chromeDockClass:
    "pointer-events-none fixed bottom-4 left-4 z-[28] flex max-w-[min(14rem,calc(100vw-2rem))] flex-col items-start gap-1.5 pb-[env(safe-area-inset-bottom,0px)] motion-reduce:hidden",
  chromeBaseClass: `${TT_SCROLL_CHROME_PILL_L5} px-2.5 py-1.5`,
  webglIdleHintClass:
    "max-w-[14rem] truncate rounded-lg border border-ref-sun/22 bg-[#0a0908]/92 px-2.5 py-1 text-[10px] font-medium text-slate-100/95 shadow-[0_6px_20px_-10px_rgba(252,164,124,0.22)] backdrop-blur-md",
  barFadeDuration: 0.28,
  chromeFadeDuration: 0.28,
  chapterFadeDuration: 0.22,
  narrativeFadeDuration: 0.32,
  narrativeSlideY: 6,
  chapterTitleClass: "truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-ref-sun/90",
  narrativeClass:
    "mt-0.5 line-clamp-2 text-[10px] font-medium leading-snug tracking-wide text-ref-sun/80",
  /** 与 Hero「向下 · 角色剧场」锚点同键（L5-3 · B4） */
  handoffAnchorSection: "roles" as const,
  handoffPillClass: TT_SCROLL_CHROME_PILL_L5,
  chapterGlowDuration: 0.85,
  chapterGlowRepeat: 0,
  chapterGlowShadow: [
    "0 0 0 0 rgba(252,164,124,0)",
    "0 0 18px -8px rgba(252,164,124,0.28)",
    "0 0 0 0 rgba(252,164,124,0)",
  ] as const,
} as const;

/** 3D 走廊枢纽 Html 标签（非地球 · L5-2） */
export const TT_CORRIDOR_HUB_LABEL_L5 = {
  pillClass:
    "whitespace-nowrap rounded-full border border-ref-sun/32 bg-ink-950/92 px-3 py-1 text-[10px] font-semibold leading-snug tracking-wide text-ref-sun/95 shadow-[0_6px_22px_-4px_rgba(252,164,124,0.5)] backdrop-blur-md",
  minReveal: 0.08,
} as const;

/** Hero 宽银幕遮幅（非地球 mesh · L5-2） */
export const TT_HERO_FILM_CHROME_L5 = {
  warmPulseDuration: 9,
  warmPulseRepeat: 0 as const,
  warmOpacityRange: [0.62, 0.96] as const,
  bottomBridgeClass:
    "pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-24 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/88 to-transparent sm:h-28",
  bottomBridgePulse: { duration: 8, opacity: [0.72, 1, 0.72] as const },
  bottomBridgePulseRepeat: 0 as const,
} as const;

/** Pulse 公告 kind 色（governance 改暖珊瑚） */
export const TT_PULSE_KIND_L5: Record<"release" | "governance" | "campaign" | "ops", string> = {
  release: "text-ref-sun",
  governance: "text-ref-coral",
  campaign: "text-ref-coral",
  ops: "text-slate-300",
};

export const TT_PULSE_GRADIENT_L5 =
  "linear-gradient(90deg,rgba(252,164,124,0.06),transparent_55%,rgba(255,200,150,0.04))";

