/** L5 · auto-split from traveltrustCinematicNonGlobeL5 facade */
import {
  TT_BELOW_FOLD_ATMOSPHERE_L5,
  TT_BELOW_FOLD_ATMOSPHERE_UNIFIED_L5,
  TT_FAQ_ACCORDION_L5,
} from "./atmosphere";
import { TT_L5_MOTION_EASE } from "./meta";
import { TT_PAGE_VERTICAL_RHYTHM_L5 } from "./rhythm";
import { TT_SECTION_CONTENT_L5, TT_SECTION_KICKER_L5 } from "./sections-layout";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";

export const TT_LANDING_NAV_MOBILE_L5 = {
  panelTransition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
} as const;

export const TT_PULSE_TICKER_L5 = {
  entranceDuration: 0.55,
  shimmerDuration: 3.2,
  sweepDuration: 5.5,
  marqueeDuration: 48,
  /** 顶栏 inline：慢速 marquee；`prefers-reduced-motion` 时改静态横滑 */
  inlineUsesStaticScroll: false as const,
  inlineRowMarqueeClass:
    "flex w-full min-w-0 items-center gap-2 overflow-x-hidden overflow-y-visible px-0 py-0 sm:gap-2.5",
  inlineMarqueeDuration: 72,
  inlineMarqueeListClass:
    "flex w-max flex-nowrap shrink-0 items-center gap-10 pr-14 sm:gap-12 sm:pr-16 [isolation:isolate]",
  /** CSS 跑马灯轨道（`globals.css` · `tt-traveltrust-pulse-inline-marquee-track`） */
  inlineMarqueeTrackClass:
    "tt-traveltrust-pulse-inline-marquee-track flex w-max flex-nowrap shrink-0 items-center gap-10 pr-14 sm:gap-12 sm:pr-16",
  inlineMarqueeViewportClass:
    "group/marquee relative min-h-[2.125rem] min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_4%,black_96%,transparent)]",
  contentFadeDelay: 0.15,
  contentFadeDuration: 0.4,
  labelPulseDuration: 2.8,
  labelPulseRepeat: 0 as const,
  labelOpacityRange: [0.75, 1, 0.75] as const,
  itemHover: { y: -2 },
  itemTap: { scale: 0.98 },
  inlineLabelClass:
    "shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[rgba(249,215,121,0.92)]",
  inlineShellClass: "w-full min-w-0 scroll-mt-28 overflow-x-clip overflow-y-visible border-b-0 min-h-[2rem]",
  inlineRowClass:
    "flex w-full min-w-0 items-center gap-2 overflow-x-auto overflow-y-visible px-0 py-0 sm:gap-2.5",
  /** 左簇：标题 + 文字链「全部」，与右侧胶囊跑马灯分隔（勿再用描边小 pill） */
  labelClusterClass:
    "flex shrink-0 items-center gap-2 min-h-[2.125rem] border-r border-ref-sun/12 pr-3 text-[rgba(249,215,121,0.88)] sm:gap-2.5 sm:pr-4",
  labelSeparatorClass: "shrink-0 text-[rgba(249,215,121,0.38)]",
  viewAllLinkClass:
    "inline-flex min-h-[2.125rem] items-center gap-0.5 rounded-sm px-1 text-meta font-medium text-[rgba(249,215,121,0.85)] underline-offset-[3px] transition hover:text-[#f9d779] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0c0a09] motion-sub motion-reduce:transition-none",
  viewAllChevronClass: "text-[rgba(249,215,121,0.62)]",
  inlineStaticListClass:
    "flex min-w-0 flex-1 snap-x snap-mandatory items-stretch gap-3 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3.5 [&::-webkit-scrollbar]:hidden",
  inlineStaticItemClass: "snap-start shrink-0 list-none",
  marqueeViewportClass:
    "relative min-h-[2.125rem] min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_4%,black_96%,transparent)]",
  marqueeListClass:
    "flex w-max flex-nowrap shrink-0 items-center gap-8 pr-12 sm:gap-10 sm:pr-14 [isolation:isolate]",
  marqueeItemClass: "relative z-0 shrink-0 list-none [contain:layout] [isolation:isolate]",
  itemBodyClass: "max-w-[10.5rem] truncate text-white/95 sm:max-w-[12.5rem]",
  itemSeparatorClass: "shrink-0 text-ref-sun/35",
  itemDateClass: "hidden shrink-0 font-mono text-[10px] tabular-nums text-slate-200/88 sm:inline",
  itemClass:
    "inline-flex min-h-[1.875rem] w-max min-w-[10rem] shrink-0 items-center gap-2 whitespace-nowrap rounded-md border border-ref-sun/16 bg-ref-sun/[0.06] px-2.5 py-1 text-meta leading-none text-slate-100 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-ref-sun/32 hover:bg-ref-sun/10 hover:shadow-[0_0_16px_-6px_rgba(252,164,124,0.3)] motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-w-[11.5rem] sm:gap-2.5 sm:px-3 sm:py-1",
} as const;

export const TT_PULSE_UPDATES_PANEL_L5 = {
  /** 全屏叠层：flex 居中（勿用 left/top + translate，避免与 motion transform 冲突） */
  detailOverlayClass: "fixed inset-0 z-[420] flex items-end justify-center sm:items-center sm:p-5",
  backdropClass:
    "absolute inset-0 bg-[#0a0908]/78 backdrop-blur-md motion-reduce:backdrop-blur-none",
  /** 移动底 sheet · sm+ 居中 modal（max 608px） */
  detailPanelClass:
    "relative z-10 flex max-h-[min(92dvh,44rem)] w-full max-w-[min(100vw,38rem)] flex-col overflow-hidden rounded-t-2xl border border-ref-sun/20 bg-[#0c0a09] text-slate-100 shadow-[0_-20px_64px_rgba(0,0,0,0.65),0_0_48px_-16px_rgba(252,164,124,0.22)] ring-1 ring-inset ring-ref-sun/12 [color-scheme:dark] [background-image:linear-gradient(180deg,rgba(252,164,124,0.08)_0%,transparent_32%)] sm:rounded-2xl sm:shadow-[0_28px_72px_rgba(0,0,0,0.68),0_0_56px_-12px_rgba(252,164,124,0.28)]",
  detailPanelTopGlowClass:
    "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ref-sun/45 to-transparent",
  sheetHandleClass:
    "mx-auto mt-2 mb-0 h-1 w-10 shrink-0 rounded-full bg-ref-sun/25 sm:hidden",
  headerClass: "flex shrink-0 items-start justify-between gap-3 border-b border-ref-sun/10 px-4 py-3 sm:px-5",
  titleClass: "font-mono text-[11px] uppercase tracking-[0.14em] text-ref-sun/90",
  descClass: "mt-1 text-meta text-slate-300/88",
  closeBtnClass:
    "inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-ref-sun/18 bg-white/[0.04] text-lg leading-none text-slate-200 transition hover:border-ref-sun/32 hover:bg-ref-sun/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]",
  detailTitleClass: "mt-1.5 text-[18px] font-semibold leading-snug tracking-tight text-slate-50",
  detailContentClass: "shrink-0 space-y-4 px-4 py-4 sm:px-5",
  listClass: "min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 [scrollbar-gutter:stable]",
  rowClass:
    "rounded-2xl border border-ref-sun/12 bg-gradient-to-b from-ref-sun/[0.06] to-transparent px-4 py-3.5 motion-sub transition duration-300 hover:-translate-y-0.5 hover:border-ref-sun/24 hover:shadow-[0_8px_28px_-12px_rgba(252,164,124,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  rowKindClass: "font-mono text-[10px] font-medium uppercase tracking-[0.14em]",
  rowBodyClass: "mt-2 text-small font-medium leading-relaxed text-slate-100/92",
  rowMetaClass: "mt-2 flex flex-wrap items-center justify-between gap-2",
  rowDateClass: "font-mono text-[10px] tabular-nums text-slate-300/80",
  rowCtaClass:
    "inline-flex min-h-[44px] items-center gap-1 text-meta font-medium text-ref-sun/85 underline-offset-[3px] transition duration-200 hover:text-ref-sun hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] motion-sub",
  rowHighlightClass:
    "border-ref-sun/30 bg-ref-sun/[0.08] shadow-[0_0_0_1px_rgba(252,164,124,0.2)_inset]",
  detailBodyClass: "text-[15px] leading-7 text-slate-200/90",
  detailShimmerClass:
    "pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_44%,rgba(255,255,255,0.05)_50%,transparent_56%)]",
  detailFooterClass:
    "flex shrink-0 items-center justify-end gap-3 border-t border-ref-sun/10 px-4 py-3 sm:px-5",
  detailPrimaryCtaClass:
    "inline-flex min-h-[44px] items-center rounded-full border border-ref-sun/40 bg-ref-sun px-5 text-small font-semibold text-[#0c0a09] shadow-[0_0_24px_-6px_rgba(252,164,124,0.6)] transition duration-200 hover:border-ref-sun hover:bg-[#fcb87a] hover:shadow-[0_0_28px_-4px_rgba(252,164,124,0.7)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] motion-sub motion-reduce:transition-none motion-reduce:active:scale-100",
  detailSecondaryCtaClass:
    "inline-flex min-h-[44px] items-center rounded-full border border-ref-sun/18 bg-white/[0.04] px-4 text-small font-medium text-slate-200 transition hover:border-ref-sun/32 hover:bg-ref-sun/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]",
  detailMetaBlockClass: "space-y-2",
  detailMetaRowClass: "flex flex-col gap-0.5",
  detailMetaLabelClass: "shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-ref-sun/70",
  detailMetaValueClass: "text-meta leading-snug text-slate-200/90",
} as const;

/** 公告详情弹层 · 少量专用 class（其余复用 Pulse / Roadmap / FAQ token） */
export const TT_ANNOUNCEMENT_DETAIL_V2_L5 = {
  highlightInnerClass:
    "whitespace-pre-line rounded-[0.9rem] border border-ref-sun/14 bg-ink-950/55 px-3.5 py-2.5 text-small font-medium leading-snug text-slate-100/95",
  benefitListClass: "space-y-1.5",
  benefitItemClass: "flex gap-2 text-meta leading-snug text-slate-300/95",
  benefitMarkClass: "shrink-0 font-medium text-ref-sun/85",
  sectionLabelClass: "font-mono text-[10px] uppercase tracking-[0.14em] text-ref-sun/60",
  stepsDesktopClass: "hidden sm:grid sm:grid-cols-3 sm:gap-3",
  stepsMobileClass: "space-y-2.5 sm:hidden",
  stepTimelineRowClass: "flex gap-2.5",
  stepIndexClass:
    "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ref-sun/15 font-mono text-kicker font-semibold tabular-nums text-ref-sun/90",
  stepTitleClass: "text-meta font-semibold text-slate-50",
  stepBodyClass: "whitespace-pre-line text-meta leading-snug text-slate-400/95",
  stepColClass: "min-w-0",
  relatedListClass: "mt-2 flex flex-wrap gap-2",
  relatedLinkClass: TT_PULSE_UPDATES_PANEL_L5.detailSecondaryCtaClass,
  techDetailsClass:
    "group rounded-xl border border-ref-sun/12 bg-ink-950/40 px-3 py-2 open:border-ref-sun/22",
  techSummaryClass:
    "flex cursor-pointer list-none items-center justify-between gap-2 text-meta font-medium text-ref-sun/85 marker:content-none [&::-webkit-details-marker]:hidden",
  techChevronClass:
    "shrink-0 text-ref-sun/50 transition-transform duration-200 group-open:rotate-90 motion-reduce:transition-none",
  metaRowClass: "flex flex-col gap-0.5",
  statusBadgeClass:
    "inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]",
  statusBadgePreviewClass: "border-amber-400/35 bg-amber-500/10 text-amber-200/95",
  statusBadgeLiveClass: "border-emerald-400/35 bg-emerald-500/10 text-emerald-200/95",
} as const;

/** 2026 路线图时间轴 */
export const TT_ROADMAP_L5 = {
  sectionClass: "mt-10 sm:mt-12 scroll-mt-28",
  headerClass: "mb-5 sm:mb-6",
  titleClass: "text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl",
  subtitleClass: "mt-2 text-small leading-relaxed text-slate-300/88",
  disclaimerClass: "mt-2 text-meta text-slate-400/90",
  plateClass: `${TT_FAQ_ACCORDION_L5.warmPlateClass} p-0.5`,
  listClass: "divide-y divide-ref-sun/10",
  itemClass: "relative px-5 py-4 sm:px-6 sm:py-5",
  itemUpcomingClass: "bg-transparent",
  itemLiveClass: "bg-ref-sun/[0.06]",
  itemCompleteClass: "opacity-80",
  rowClass: "flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5",
  dateClass:
    "shrink-0 font-mono text-[11px] tabular-nums uppercase tracking-wide text-ref-sun/85 sm:w-28 sm:pt-0.5",
  bodyClass: "min-w-0 flex-1",
  kindClass: "font-mono text-[10px] font-medium uppercase tracking-[0.14em]",
  headlineClass: "mt-1.5 text-small font-semibold leading-snug text-slate-50 sm:text-[15px]",
  benefitClass: "mt-2 text-meta leading-relaxed text-slate-300/88",
  statusBadgeClass:
    "mt-2 inline-flex w-fit rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide",
  statusUpcomingClass: "border-ref-sun/25 text-ref-sun/80",
  statusLiveClass: "border-emerald-400/35 bg-emerald-400/10 text-emerald-200",
  statusCompleteClass: "border-slate-500/30 text-slate-400",
  statusInProgressClass: "border-sky-400/35 bg-sky-400/10 text-sky-200",
  tierLiveClass: "border-emerald-400/30 bg-emerald-400/8 text-emerald-200/95",
  tierUpcomingClass: "border-ref-sun/28 bg-ref-sun/8 text-ref-sun/90",
  tierRoadmapClass: "border-slate-400/28 bg-slate-400/8 text-slate-300",
  ctaClass:
    "mt-3 inline-flex min-h-[40px] items-center text-meta font-semibold text-ref-sun/90 underline-offset-[3px] transition hover:text-ref-sun hover:underline",
} as const;

export const TT_ANNOUNCEMENTS_MOTION_L5 = {
  backdrop: { duration: 0.26, ease: TT_L5_MOTION_EASE },
  panel: { duration: 0.36, ease: TT_L5_MOTION_EASE },
  panelSheetOffsetY: 48,
  panelScale: 0.96,
  detailShimmerDuration: 1.1,
  pageHeader: { duration: 0.42, ease: TT_L5_MOTION_EASE },
  listStagger: 0.07,
  listItem: { duration: 0.34, ease: TT_L5_MOTION_EASE },
} as const;

/** 公告列表 — 与 FAQ accordion 同轨（divide 列表 + hover lift） */
export const TT_ANNOUNCEMENTS_LIST_L5 = {
  warmPlateClass: `${TT_FAQ_ACCORDION_L5.warmPlateClass} p-0.5`,
  innerListClass: TT_FAQ_ACCORDION_L5.listClass,
  itemShellClass: TT_FAQ_ACCORDION_L5.itemShellClass,
  rowInnerClass:
    "px-5 py-4 transition-colors sm:px-6 sm:py-5",
  rowIdleClass: TT_FAQ_ACCORDION_L5.itemIdle,
  rowHighlightClass: TT_FAQ_ACCORDION_L5.itemOpen,
  rowHover: TT_FAQ_ACCORDION_L5.itemHover,
  rowTap: TT_FAQ_ACCORDION_L5.triggerTap,
  tagRowClass: "flex flex-wrap items-center gap-2",
  phaseChipClass:
    "inline-flex shrink-0 min-h-[1.375rem] items-center justify-center rounded-md border border-ref-sun/20 bg-ref-sun/8 px-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-ref-sun/90",
  rowTitleClass: "mt-2 text-small font-semibold leading-snug text-slate-50",
  dateChipClass:
    "inline-flex items-center rounded-full border border-ref-sun/14 bg-ink-950/55 px-2.5 py-0.5 font-mono text-[10px] tabular-nums text-slate-300/88",
} as const;

/** `/traveltrust/announcements` 页内氛围（layout 为 unified 纯色时补长页底光 + 点阵） */
export const TT_ANNOUNCEMENTS_PAGE_ATMOSPHERE_L5 = {
  rootClass: `pointer-events-none fixed inset-0 ${ttZClass(TT_Z.HERO_SKY)} motion-reduce:hidden`,
  dotGridClass: "pointer-events-none fixed inset-0 z-[1] bg-traveltrust-dot-grid opacity-[0.14] motion-reduce:hidden",
  topScrimClass:
    "pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(ellipse_78%_75%_at_50%_0%,rgba(252,164,124,0.08),transparent_74%)]",
  warmScrimClass:
    "pointer-events-none absolute inset-x-4 top-20 bottom-10 rounded-3xl bg-[radial-gradient(ellipse_90%_70%_at_50%_38%,rgba(252,164,124,0.04),transparent_72%)] sm:inset-x-10",
  fadeDuration: TT_BELOW_FOLD_ATMOSPHERE_L5.fadeDuration,
  ease: TT_BELOW_FOLD_ATMOSPHERE_L5.ease,
  warmPulseDuration: TT_BELOW_FOLD_ATMOSPHERE_L5.warmPulseDuration,
  warmPulseOpacity: TT_BELOW_FOLD_ATMOSPHERE_L5.warmPulseOpacity,
  unifiedBackground: TT_BELOW_FOLD_ATMOSPHERE_UNIFIED_L5.background,
  warmPulseBackground: TT_BELOW_FOLD_ATMOSPHERE_UNIFIED_L5.warmPulseBackground,
} as const;

export const TT_ANNOUNCEMENTS_PAGE_L5 = {
  rootClass: "relative isolate min-h-[100dvh] w-full overflow-x-clip",
  sectionClass: `${TT_PAGE_VERTICAL_RHYTHM_L5.sectionAfterMajorBreak} scroll-mt-28`,
  contentBodyClass: `${TT_SECTION_CONTENT_L5.bodyClass} max-w-3xl px-4 sm:px-6`,
  backRowClass: "mb-5 sm:mb-6",
  pageHeaderClass: "relative mb-6 sm:mb-7",
  pageKickerClass: TT_SECTION_KICKER_L5,
  pageTitleClass: `${TT_SECTION_CONTENT_L5.kickerToHeadingClass} ${TT_SECTION_CONTENT_L5.headingClass}`,
  pageSubtitleClass: TT_SECTION_CONTENT_L5.introClass,
  listPlateClass: TT_ANNOUNCEMENTS_LIST_L5.warmPlateClass,
  backLinkClass:
    "inline-flex min-h-[44px] items-center rounded-lg border border-ref-sun/16 bg-[#0a0908]/88 px-3 py-1.5 text-meta font-semibold text-ref-sun/90 shadow-[0_4px_18px_-12px_rgba(252,164,124,0.22)] ring-1 ring-inset ring-ref-sun/12 backdrop-blur-md transition duration-200 hover:-translate-x-0.5 hover:border-ref-sun/32 hover:text-ref-sun focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] motion-sub motion-reduce:transition-none motion-reduce:hover:translate-x-0",
} as const;

export const TT_LANDING_NAV_EMBEDDED_L5 = {
  linkBaseClass:
    "inline-flex max-w-[8.5rem] min-h-[30px] items-center truncate rounded-lg px-2 py-0.5 text-meta font-semibold text-slate-50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 sm:max-w-[9.5rem] sm:min-h-[32px] sm:px-2.5 sm:text-slate-100",
  embeddedNavScrimClass:
    "rounded-lg bg-[#0a0908]/88 ring-1 ring-inset ring-ref-sun/14 backdrop-blur-md shadow-[0_4px_18px_-12px_rgba(0,0,0,0.55)]",
} as const;

/** Hero「连接钱包」次按钮：暖描边（替代 marketing 冷青 ghost · L5-3） */
export const TT_HERO_WALLET_GHOST_BTN_L5 =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-ref-sun/32 bg-ink-950/55 px-6 py-3 text-small font-semibold text-slate-100 ring-1 ring-inset ring-ref-sun/14 shadow-[0_6px_24px_-10px_rgba(0,0,0,0.45)] transition hover:border-ref-sun/48 hover:bg-ref-sun/12 hover:shadow-[0_0_28px_-8px_rgba(252,164,124,0.36)] motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]";

/** Hero 主 CTA（纯暖色描边/阴影 · 替代 marketing 冷青 hero 变体） */
export const TT_HERO_PRIMARY_CTA_L5 =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-ref-sun/38 bg-gradient-to-r from-[#e8c96a] via-[#f0a878] to-[#e8c96a] px-6 py-3 text-small font-bold text-[#0a1018] shadow-[0_8px_28px_rgba(252,164,124,0.32)] transition hover:brightness-105 hover:border-ref-sun/50 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] disabled:cursor-not-allowed disabled:opacity-55";

export const TT_HERO_WALLET_HINT_L5 =
  "mt-3 px-0.5 text-center text-meta leading-relaxed text-slate-100/90 sm:text-left";

/** Hero 左下走廊胶囊（非地球浮层 · L5-2） */
export const TT_CORRIDOR_ROSTER_L5 = {
  compactLinkClass:
    "inline-flex min-h-[40px] max-w-full items-center gap-2 rounded-lg border border-ref-sun/38 bg-[#0c0a09]/92 px-3.5 py-2 text-small leading-snug text-slate-50 shadow-[0_4px_24px_rgba(252,164,124,0.18)] ring-1 ring-inset ring-ref-sun/16 backdrop-blur-md transition hover:border-ref-sun/52 hover:text-white hover:shadow-[0_6px_28px_rgba(252,164,124,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55",
  chipLinkClass:
    "inline-flex max-w-[10.5rem] items-center gap-1.5 truncate rounded-full border border-ref-sun/20 bg-ink-950/78 px-2.5 py-1.5 text-small font-medium text-slate-100 backdrop-blur-sm transition hover:border-ref-sun/38 hover:bg-ref-sun/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 sm:max-w-[11rem] sm:px-3",
} as const;

export const TT_HERO_COPY_DISCLAIMER_L5 = {
  trustLinkClass:
    "font-medium text-ref-sun underline-offset-2 transition hover:-translate-y-0.5 hover:text-ref-coral hover:underline motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0",
} as const;

export const TT_LANDING_NAV_L5 = {
  mobileToggleClass:
    "inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-ref-sun/18 bg-ink-900/55 px-3 py-1.5 text-meta font-medium text-slate-100 shadow-[0_4px_18px_-10px_rgba(252,164,124,0.2)] backdrop-blur-sm md:hidden",
  menuTransition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const },
  heroShadowMul: 0.14,
  activeLinkClass: "relative text-ref-sun/95",
  activeUnderlineClass: "absolute -bottom-0.5 left-1 right-1 h-0.5 rounded-full bg-gradient-to-r from-ref-sun/80 to-ref-coral/70",
  linkHover: { y: -1 },
  linkTap: { scale: 0.98 },
  mobileToggleTap: { scale: 0.98 },
  mobilePanelGlow: { duration: 3.4, opacity: [0.4, 0.75, 0.4] as const },
  mobilePanelGlowRepeat: 0 as const,
} as const;

export const TT_CINEMATIC_QUALITY_L5 = {
  toggleClass:
    "inline-flex min-h-[32px] max-w-[10rem] items-center truncate rounded-lg border border-ref-sun/22 bg-ink-900/60 px-2.5 py-1 text-meta font-medium text-slate-100 transition hover:-translate-y-0.5 hover:border-ref-sun/38 hover:bg-ref-sun/8 hover:text-white hover:shadow-[0_0_14px_-8px_rgba(252,164,124,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  toggleCompactClass:
    "inline-flex min-h-[30px] max-w-[8.25rem] items-center truncate rounded-lg border border-ref-sun/22 bg-ink-900/60 px-2 py-0.5 text-[11px] font-semibold text-slate-100 transition hover:border-ref-sun/38 hover:bg-ref-sun/8 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
  activePulseClass: "ring-1 ring-ref-sun/35",
  hover: { y: -1 },
  tap: { scale: 0.98 },
  activePulseDuration: 0.85,
  activePulseRepeat: 0 as const,
  activeBoxShadow: [
    "0 0 0 0 rgba(252,164,124,0.2)",
    "0 0 12px -4px rgba(252,164,124,0.45)",
    "0 0 0 0 rgba(252,164,124,0.2)",
  ] as const,
} as const;

export const TT_REDUCED_MOTION_NOTICE_L5 = {
  entrance: { duration: 0.35, ease: TT_L5_MOTION_EASE },
  dismissButtonClass:
    "shrink-0 rounded-md border border-ref-sun/18 px-2.5 py-1 text-meta font-medium text-slate-300 transition hover:border-ref-sun/32 hover:bg-ref-sun/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
} as const;

export const TT_BRIEF_BADGE_L5 = {
  chromeCompactClass:
    "inline-flex shrink-0 items-center rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide sm:px-2 sm:py-0.5 sm:text-[10px]",
  livePulseDuration: 3.2,
  livePulseRepeat: 0 as const,
  liveOpacityRange: [0.85, 1] as const,
  demoClass: "border-amber-400/45 bg-amber-950/55 text-amber-100/95",
  demoPulseDuration: 3.8,
  demoPulseRepeat: 0 as const,
  demoOpacityRange: [0.88, 1, 0.88] as const,
} as const;

export const TT_LANDING_CHROME_L5 = {
  pulseLayoutDuration: 0.35,
  /** L1 固定条占位（双行：toolbar + 公告 · 与 slot min-h 同高） */
  fixedSlotSpacerClass: "pointer-events-none h-[5rem] shrink-0 sm:h-[5.25rem]",
  /** L1 固定贴 Header 下（viewport · 高于入口闸/Canvas） */
  fixedSlotShellClass:
    `pointer-events-auto fixed inset-x-0 border-b border-ref-sun/10 bg-[#0c0a09] shadow-[0_8px_24px_-16px_rgba(0,0,0,0.65)]`,
  pulseLayoutSpring: { type: "spring" as const, stiffness: 380, damping: 32 },
  /** 薄 HUD：贴在 L0 Header 下（含四链；小屏含 mobile nav rail） */
  shellClass:
    `relative ${ttZClass(TT_Z.CONTENT)} mb-0 w-full overflow-x-clip overflow-y-visible border-t border-ref-sun/10 border-b-0 bg-[#0c0a09] shadow-none`,
  /** 始终双行：上行 LIVE + 章节 nav · 下行「项目动态」跑马灯（勿 xl 并排，防 LIVE/动态错位） */
  chromeRowClass:
    "relative isolate grid w-full min-h-0 grid-cols-1 grid-rows-[auto_auto] items-stretch gap-y-0 px-2 py-0 sm:px-3 sm:py-0.5",
  liveSlotClass: "flex shrink-0 items-center border-r border-ref-sun/18 pr-2 sm:pr-2.5",
  navSlotClass: "flex min-w-0 flex-1 items-center justify-end",
  toolbarToggleSlotClass: "flex shrink-0 items-center",
  pulseSlotClass:
    "flex min-h-[2rem] min-w-0 w-full items-center overflow-x-clip overflow-y-visible border-t border-ref-sun/10 pt-0.5 pb-0.5 sm:min-h-[2.125rem] sm:pt-1",
  controlsToolbarClass:
    "relative z-[1] flex w-full min-w-0 flex-nowrap items-center gap-x-2 gap-y-0 rounded-lg bg-[#0c0a09] px-1 py-0.5 sm:gap-x-2.5 sm:px-1.5",
  pulseRowDividerClass: "border-t border-ref-sun/14 bg-[#0c0a09]",
  /** @deprecated 使用 controlsToolbarClass（无框体） */
  controlsClusterClass:
    "relative z-[1] flex min-h-0 w-full min-w-0 max-w-full shrink-0 flex-wrap items-center justify-end gap-1 overflow-visible",
  controlsSurfaceClass: "",
  navScrimMul: 0.2,
  heroTBackgroundPeak: 0.06,
  bottomBorderPeak: 0.28,
  bottomShimmerDuration: 1.1,
  bottomShimmerRepeat: 0 as const,
  heroTTransition: { duration: 0.35, ease: TT_L5_MOTION_EASE },
  panelToggleGroupClass: "flex shrink-0 items-center gap-0.5 border-r border-ref-sun/12 pr-2 sm:pr-2.5",
  panelToggleBtnClass:
    "inline-flex min-h-[28px] items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] motion-sub transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0c0a09]",
  panelToggleActiveClass: "text-ref-sun/95",
  panelToggleIdleClass: "text-[#e8e4e0] hover:text-ref-sun/85",
  pulseCollapsedRowClass:
    "flex min-h-[1.75rem] w-full items-center border-t border-ref-sun/10 px-2 py-0.5 sm:px-3",
} as const;
