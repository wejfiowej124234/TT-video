/** L5 · auto-split from traveltrustCinematicNonGlobeL5 facade */
import { TT_L5_MOTION_EASE } from "./meta";
import { TT_PAGE_VERTICAL_RHYTHM_L5 } from "./rhythm";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";

export const TT_ILLUSTRATIVE_BADGE_L5 = {
  previewPulse: { duration: 2.4, opacity: [0.88, 1, 0.88] as const },
  illustrativePulse: { duration: 3.6, opacity: [0.92, 1, 0.92] as const },
  footerPulse: { duration: 4.2, opacity: [0.85, 1, 0.85] as const, repeat: 0 as const },
  ringPulse: { duration: 0.85, opacity: [0.35, 0.85, 0.35] as const, repeat: 0 as const },
  illustrativePulseRepeat: 0 as const,
  previewPulseRepeat: 0 as const,
  ringClass: "pointer-events-none absolute -inset-px rounded-[inherit] ring-1 ring-inset ring-ref-sun/35",
} as const;

export const TT_PAGE_COMPLIANCE_L5 = {
  entrance: { duration: 0.4, ease: TT_L5_MOTION_EASE },
  summaryTap: { scale: 0.995 },
  detailsClass:
    "rounded-lg border border-transparent px-1 transition-[border-color,background-color,box-shadow] open:border-ref-sun/22 open:bg-ref-sun/[0.03] open:px-4 open:py-3 open:shadow-[0_0_24px_-14px_rgba(252,164,124,0.22)] open:ring-1 open:ring-ref-sun/12 sm:open:px-5",
  summaryClass:
    "inline-flex min-h-[44px] cursor-pointer list-none items-center gap-2 py-2 text-meta font-medium text-slate-100/95 [&::-webkit-details-marker]:hidden",
  detailsBodyClass: "space-y-3 pb-1 pt-1 text-meta leading-relaxed text-slate-200/92",
  summaryWarmHover: "transition hover:text-ref-sun/90",
  shellClass: TT_PAGE_VERTICAL_RHYTHM_L5.complianceShell,
  contentClass: TT_PAGE_VERTICAL_RHYTHM_L5.complianceContent,
  introClass: "mt-3 text-small leading-relaxed text-slate-100/95",
} as const;

export const TT_NETWORK_FOOTER_L5 = {
  entrance: { duration: 0.45, ease: TT_L5_MOTION_EASE },
  topBorderPulse: { duration: 4.2, opacity: [0.35, 0.65, 0.35] as const, repeat: 0 as const },
  topHandoffClass:
    "pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#0c0a09] via-[#0c0a09]/80 to-transparent sm:h-12",
  ambienceClass:
    "pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_80%_90%_at_50%_0%,rgba(252,164,124,0.08),transparent_72%)]",
  ambiencePulse: { duration: 6.5, opacity: [0.4, 0.75, 0.4] as const, repeat: 0 as const },
  contentGridClass:
    "mx-auto grid w-full max-w-7xl grid-cols-1 items-start gap-8 px-4 pb-2 sm:gap-9 sm:px-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-x-10 lg:gap-y-6 lg:px-8 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] xl:gap-x-10 xl:gap-y-0 xl:px-12",
  socialWrapClass: "min-w-0 lg:col-start-1 lg:row-start-1",
  crossNavWrapClass:
    "min-w-0 lg:col-span-2 lg:col-start-2 lg:row-start-1 xl:col-span-3 xl:col-start-2",
  shellClass:
    `relative ${ttZClass(TT_Z.HERO_SKY)} mt-0 w-full overflow-visible border-t border-ref-sun/18 bg-ink-950/80 px-4 pt-7 pb-[max(2.5rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 sm:pt-8 sm:pb-11`,
  /** grouped 时不叠顶氛围（与合规块无缝衔接） */
  ambienceGroupedClass: "hidden",
  /** 并入「启程+页脚」章：无顶边/顶光、收紧上留白 */
  shellGroupedClass:
    `relative ${ttZClass(TT_Z.HERO_SKY)} mt-0 w-full overflow-visible border-t-0 bg-transparent px-4 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-6 sm:pt-5 sm:pb-8`,
} as const;

/** 页脚栏目标题（关注我们 / 产品与订单 / 信任… 同阶） */
export const TT_FOOTER_NAV_GROUP_TITLE_L5 = {
  titleClass: "text-small font-semibold leading-snug tracking-normal text-slate-200",
  titleSpacingClass: "mb-3.5 sm:mb-4",
  captionClass: "text-[13px] leading-[1.6] text-slate-400/92",
  captionSpacingClass: "mt-5 sm:mt-6",
  captionStackClass: "flex max-w-[17.5rem] flex-col gap-2.5 sm:max-w-[18rem] sm:gap-3",
} as const;

export const TT_FOOTER_CROSS_NAV_L5 = {
  shellClass:
    "mb-2 grid w-full min-w-0 grid-cols-1 gap-y-8 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-6 lg:grid-cols-2 lg:gap-x-10 xl:grid-cols-3 xl:gap-x-10",
  groupTitleClass: `${TT_FOOTER_NAV_GROUP_TITLE_L5.titleSpacingClass} ${TT_FOOTER_NAV_GROUP_TITLE_L5.titleClass}`,
  productNavClass: "min-w-0 sm:col-span-2 lg:col-span-1 xl:col-span-1",
  trustNavDesktopClass:
    "hidden min-w-0 border-t border-ref-sun/10 pt-7 sm:col-span-2 md:block md:border-t-0 md:pt-0 lg:col-span-1 xl:col-span-1",
  linkGridClass:
    "grid w-full grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-2 [&_li]:min-w-0 [&_a]:min-h-[36px] sm:[&_a]:min-h-[34px]",
  siteMapDividerClass: "mt-4 w-full border-t border-ref-sun/12 pt-4 sm:mt-5 sm:pt-5",
  crossLinkClass:
    "inline-flex max-w-full items-center justify-start px-0.5 py-1 text-small font-medium text-slate-300 underline-offset-2 transition-colors duration-200 hover:text-ref-sun hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
  siteMapLinkClass:
    "inline-flex min-h-[40px] w-full items-center text-small font-normal text-slate-300/95 underline-offset-2 transition-colors duration-200 hover:text-ref-sun hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
  secondaryLinkClass: "text-slate-400/90",
  siteMapKickerClass: "mb-1 text-meta font-medium text-slate-400",
  linkHoverClass:
    "transition-colors duration-200 hover:text-ref-sun/95 motion-reduce:transition-none",
  linkTap: { scale: 0.99 },
  groupEntrance: { duration: 0.4, ease: TT_L5_MOTION_EASE },
  trustSummaryHover: "transition hover:text-ref-sun/90",
  trustDetailsOpenClass:
    "rounded-lg border border-transparent transition-[border-color,box-shadow] open:border-ref-sun/18 open:shadow-[0_0_20px_-14px_rgba(252,164,124,0.16)]",
  trustDetailsMobileClass: "mt-1 md:mt-0",
} as const;

/** `/traveltrust` 费路由 / 页脚链（暖色 focus · ①） */
export const TT_TRAVELTRUST_MARKETING_WARM_L5 = {
  feeRouterLinkClass:
    "inline-flex min-h-[44px] max-w-xl items-center justify-start gap-2 rounded-md border-0 bg-transparent px-0 py-2 text-left text-small font-medium text-slate-200 underline decoration-white/20 underline-offset-[0.35em] transition hover:text-ref-sun hover:decoration-ref-sun/45 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
  feeRouterTriggerClass:
    "flex min-h-[44px] w-full items-center justify-between gap-3 border-0 bg-transparent px-4 py-3 text-left text-small font-medium text-slate-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 sm:px-5 sm:py-3.5",
  footerNavLinkClass:
    "inline-flex min-h-[44px] max-w-[14rem] items-center truncate text-meta font-medium text-slate-300 underline-offset-2 transition hover:text-ref-sun hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
  complianceSummaryClass:
    "inline-flex min-h-[44px] cursor-pointer list-none items-center gap-2 py-2 font-medium text-slate-300 transition hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 [&::-webkit-details-marker]:hidden",
} as const;

export const TT_FOOTER_SOCIAL_L5 = {
  shellClass: "mb-4 flex min-w-0 flex-col sm:mb-5 lg:mb-0 lg:max-w-none lg:self-start",
  headingClass: `${TT_FOOTER_NAV_GROUP_TITLE_L5.titleSpacingClass} ${TT_FOOTER_NAV_GROUP_TITLE_L5.titleClass}`,
  brandTaglineClass:
    "max-w-[22rem] text-[13px] leading-[1.55] text-slate-400/95",
  rowClass:
    "flex w-full max-w-[22rem] flex-wrap items-center gap-x-2.5 gap-y-2 sm:gap-x-3",
  glyphClass: "h-6 w-6 shrink-0 text-[#f9d779] fill-[#f9d779]",
  notesStackClass: "mt-4 flex max-w-[22rem] flex-col gap-2 sm:mt-5",
  pendingNoteClass: "sr-only",
  disclaimerClass: "text-[12px] leading-[1.55] text-slate-400/92",
  iconLinkClass:
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#f9d779] transition hover:text-[#ffe8b8] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950",
  iconLinkPendingClass:
    "inline-flex h-9 w-9 shrink-0 cursor-default items-center justify-center rounded-full text-[#f9d779]/90 transition hover:text-[#ffe8b8]",
  iconHover: { y: -1, scale: 1.05 },
  iconTap: { scale: 0.96 },
  iconTransition: { duration: 0.2, ease: TT_L5_MOTION_EASE },
  activeGlow: "",
} as const;

export const TT_DEV_CHUNK_NOTICE_L5 = {
  panelClass:
    "relative z-[30] mx-auto mb-2 flex max-w-5xl flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-400/35 bg-amber-950/90 px-3 py-2 text-meta text-amber-100 shadow-[0_8px_28px_rgba(0,0,0,0.45)]",
  entrance: { duration: 0.35, ease: TT_L5_MOTION_EASE },
  dismissTap: { scale: 0.98 },
  primaryButtonClass:
    "rounded-md border border-ref-sun/20 bg-ref-sun/[0.08] px-2.5 py-1 font-medium text-white transition hover:-translate-y-0.5 hover:border-ref-sun/35 hover:bg-ref-sun/14 hover:shadow-[0_0_12px_-6px_rgba(252,164,124,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  dismissButtonClass:
    "rounded-md border border-ref-sun/16 px-2.5 py-1 text-slate-300 transition hover:border-ref-sun/28 hover:bg-ref-sun/8 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
} as const;
