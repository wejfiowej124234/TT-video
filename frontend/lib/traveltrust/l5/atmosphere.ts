/** L5 · 区块氛围 / Film 缝 / 经济簇 token */
import { TT_L5_MOTION_EASE } from "./meta";
import { TT_PAGE_VERTICAL_RHYTHM_L5 } from "./rhythm";

export const TT_SECTION_ATMOSPHERE_L5: Record<string, string> = {
  hero: [
    "radial-gradient(ellipse 70% 55% at 78% 42%, rgba(252,164,124,0.09) 0%, transparent 62%)",
    "linear-gradient(to bottom, transparent 0%, rgba(12,10,9,0.12) 100%)",
  ].join(", "),
  roles: [
    "linear-gradient(to bottom, rgba(12,10,9,0.28) 0%, transparent 22%)",
    "radial-gradient(ellipse 65% 50% at 22% 48%, rgba(252,164,124,0.1) 0%, transparent 58%)",
    "radial-gradient(ellipse 55% 45% at 82% 38%, rgba(255,200,150,0.07) 0%, transparent 55%)",
  ].join(", "),
  liquidity: [
    "linear-gradient(to bottom, rgba(12,10,9,0.32) 0%, rgba(12,10,9,0.58) 100%)",
    "radial-gradient(ellipse 60% 48% at 50% 38%, rgba(232,201,106,0.07) 0%, transparent 58%)",
    "radial-gradient(ellipse 50% 40% at 22% 62%, rgba(252,164,124,0.05) 0%, transparent 52%)",
  ].join(", "),
  trust: [
    "radial-gradient(ellipse 70% 55% at 78% 42%, rgba(252,164,124,0.08) 0%, transparent 62%)",
    "radial-gradient(ellipse 55% 40% at 18% 68%, rgba(255,180,120,0.06) 0%, transparent 58%)",
  ].join(", "),
  settlement:
    "radial-gradient(ellipse 70% 48% at 40% 55%, rgba(252,164,124,0.06) 0%, transparent 60%)",
  faq: [
    "linear-gradient(to bottom, rgba(12,10,9,0.38) 0%, rgba(12,10,9,0.62) 100%)",
    "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(252,164,124,0.05) 0%, transparent 62%)",
  ].join(", "),
  start: [
    "linear-gradient(to bottom, rgba(12,10,9,0.3) 0%, rgba(12,10,9,0.55) 100%)",
    "radial-gradient(ellipse 65% 50% at 50% 60%, rgba(255,180,120,0.07) 0%, transparent 58%)",
  ].join(", "),
};

export const TT_SECTION_FILM_DIVIDER_L5 =
  "linear-gradient(90deg, transparent 0%, rgba(252,164,124,0.26) 50%, transparent 100%)";

/** 区块间竖向压暗带（避免固定 Canvas 在缝处露底；与 sectionY 叠成标准节间距） */
export const TT_SECTION_FILM_DIVIDER_HANDOFF_L5 = {
  /** 大转折仅留白，不叠竖向压暗带（避免接缝色带） */
  wrapperClass: "pointer-events-none relative z-[0] my-7 sm:my-8 h-0 w-full",
  lineClass: "absolute inset-x-0 top-1/2 h-px -translate-y-1/2 opacity-0",
} as const;

export const TT_BELOW_FOLD_SCROLL_PLATE_L5 = {
  backdropClass: "pointer-events-none absolute inset-0 z-0 bg-[#0c0a09]/38",
} as const;

export const TT_SECTION_FILM_DIVIDER_MOTION_L5 = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
  shimmerDuration: 1.2,
  shimmerRepeat: 0 as const,
} as const;

export const TT_FAQ_ACCORDION_L5 = {
  warmPlateClass:
    "relative rounded-2xl bg-[#0c0a09]/72 p-0.5 shadow-[0_16px_48px_-24px_rgba(252,164,124,0.28)] ring-1 ring-ref-sun/14",
  listClass:
    "overflow-hidden rounded-[0.9rem] border border-ref-sun/20 divide-y divide-ref-sun/14 bg-ink-950/58 shadow-[0_12px_40px_-18px_rgba(252,164,124,0.26)] ring-1 ring-inset ring-ref-sun/12 backdrop-blur-md",
  itemShellClass: "overflow-hidden rounded-none border-0 bg-transparent transition-colors",
  triggerClass:
    "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-6 py-4 text-left text-small font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/45 sm:min-h-[4rem] sm:gap-4 sm:px-7 sm:py-5 min-h-[3.75rem]",
  questionTextClass: "min-w-0 text-pretty leading-snug",
  iconSlotClass:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ref-sun/20 bg-ref-sun/8 text-lg font-light leading-none text-ref-sun/85",
  panelBodyClass: "relative px-6 pb-5 pt-4 text-meta leading-relaxed text-slate-200/90 sm:px-7 sm:pb-6 sm:pt-5",
  itemOpen: "border-ref-sun/30 bg-ref-sun/6 shadow-[0_0_24px_-12px_rgba(252,164,124,0.2)]",
  itemIdle: "border-ref-sun/14 bg-ink-900/28 backdrop-blur-sm",
  openPanelShimmerClass:
    "pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_44%,rgba(255,255,255,0.04)_50%,transparent_56%)]",
  openPanelShimmerDuration: 1.1,
  openPanelShimmerRepeat: 0,
  triggerOpen: "text-ref-sun/95",
  triggerIdle: "text-slate-100 hover:bg-ref-sun/5 hover:text-ref-sun/90",
  itemScaleDuration: 0.22,
  panelDuration: 0.28,
  panelEase: [0.22, 1, 0.36, 1] as const,
  listStaggerBase: 0.07,
  iconRotateDuration: 0.22,
  triggerTap: { scale: 0.992 },
  itemHover: { y: -1 },
} as const;

export const TT_SETTLEMENT_L5 = {
  /** @deprecated 经济簇顶光见 `TT_PAGE_SECTION_FLOW_L5.economyClusterAtmosphereClass` */
  atmosphereClass: "hidden",
  protocolShellClass:
    "mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-ref-sun/14 bg-ink-900/28 backdrop-blur-sm transition-colors",
  protocolShellOpenClass: "border-ref-sun/28 bg-ref-sun/6 shadow-[0_0_24px_-12px_rgba(252,164,124,0.18)]",
  protocolPanelClass: "border-t border-ref-sun/12 bg-ref-sun/[0.02] px-6 py-4 text-meta leading-relaxed text-slate-300/92 sm:px-7 sm:py-5",
  protocolPanelMotion: {
    duration: 0.28,
    ease: [0.22, 1, 0.36, 1] as const,
  },
  protocolToggleOpenClass: "text-ref-sun/95",
  protocolToggleIdleClass: "text-slate-100 hover:bg-ref-sun/5 hover:text-ref-sun/90",
  protocolToggleButtonClass:
    "grid min-h-[3.75rem] w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-6 py-4 text-left text-small font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ref-sun/45 sm:min-h-[4rem] sm:gap-4 sm:px-7 sm:py-5",
  protocolIconSlotClass:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ref-sun/20 bg-ref-sun/8 text-lg font-light leading-none text-ref-sun/85",
  protocolToggleTap: { scale: 0.98 },
  protocolOpenRingClass:
    "rounded-lg ring-1 ring-ref-sun/22 shadow-[0_0_20px_-12px_rgba(252,164,124,0.18)]",
  linkHover: { y: -2 },
  linkTap: { scale: 0.98 },
  linkClass:
    "inline-flex min-h-[3rem] min-w-[10.5rem] flex-1 items-center justify-center rounded-lg border border-ref-sun/16 px-6 py-3 text-small font-medium text-slate-200 transition hover:-translate-y-0.5 hover:border-ref-sun/35 hover:bg-ref-sun/6 hover:shadow-[0_0_20px_-8px_rgba(252,164,124,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:flex-none",
  ctaRowClass: TT_PAGE_VERTICAL_RHYTHM_L5.settlementCtaRow,
  ctaStackEntrance: { duration: 0.38, ease: TT_L5_MOTION_EASE },
} as const;

export const TT_TRUST_FACTS_L5 = {
  warmPlateClass:
    "relative rounded-2xl bg-[#0c0a09]/68 p-0.5 shadow-[0_12px_40px_-22px_rgba(252,164,124,0.22)] ring-1 ring-ref-sun/12",
  cardHoverClass:
    "group relative flex min-h-[6rem] h-full flex-col justify-start gap-3.5 rounded-xl border border-ref-sun/20 bg-ink-950/48 px-5 py-5 shadow-[0_10px_32px_-16px_rgba(252,164,124,0.18),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-ref-sun/40 hover:bg-ink-950/62 hover:shadow-[0_0_32px_-10px_rgba(252,164,124,0.34)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09] motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-h-[6.75rem] sm:gap-4 sm:px-6 sm:py-6",
  cardSummaryClass: "text-meta leading-relaxed text-slate-200/90 group-hover:text-slate-100",
  cardTitleRowClass: "flex items-start gap-3.5",
  cardIconWrapClass:
    "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ref-sun/14 text-ref-sun ring-1 ring-inset ring-ref-sun/30",
  cardSummaryIndentClass: "pl-12 pb-0.5",
  cardBorderPulse: { duration: 0.75, opacity: [0.55, 1, 0.55] as const, repeat: 0 as const },
  iconPulseRepeat: 0 as const,
  atmosphereEntranceDuration: 0.7,
  childStaggerBase: 0.08,
  cardTap: { scale: 0.99 },
  iconPulseDuration: 2.6,
  iconGlowShadow: [
    "0 0 0 0 rgba(252,164,124,0)",
    "0 0 14px -4px rgba(252,164,124,0.35)",
    "0 0 0 0 rgba(252,164,124,0)",
  ] as const,
  iconHoverTransition: { duration: 0.2, ease: "easeOut" as const },
} as const;

/** 剧场模式：标签贴边，避免压住中央播放钮 */
/** 标签坐标在「播放区」viewBox 内（避开左侧 Tab 列 · ①） */
export const TT_ROUTE_ARC_THEATER_LABELS_L5 = [
  { labelX: 58, labelY: 12, labelW: 112, labelH: 22 },
  { labelX: 62, labelY: 58, labelW: 104, labelH: 22 },
  { labelX: 72, labelY: 24, labelW: 92, labelH: 22 },
] as const;

export const TT_ROUTE_ARC_L5 = {
  containerOpacity: 0.52,
  theaterContainerOpacity: 0.64,
  theaterGlowOpacityPeak: 0.36,
  pathOpacityPeak: 0.82,
  glowOpacityPeak: 0.28,
  entranceDuration: 0.6,
  pathDrawBaseDuration: 2.4,
  pathDrawStagger: 0.4,
  opacityPulseBase: 10,
  labelPulseBase: 8,
  dashOffsetBase: 12,
  travelerDotDuration: 18,
  flowDotDuration: 14,
  theaterFlowDotDuration: 11,
  labelPillClass:
    "inline-block rounded-full border border-ref-sun/25 bg-ink-950/78 px-2.5 py-1 text-[10px] font-medium leading-snug text-ref-sun/90 shadow-[0_4px_16px_-6px_rgba(252,164,124,0.35)] backdrop-blur-sm",
  theaterArcInsetClass:
    "pointer-events-none absolute inset-y-0 right-0 z-0 overflow-hidden left-[8%] sm:left-[10%] lg:left-0",
  /** 剧场示意走廊标签 i18n keys（与 TT_CINEMATIC_PAGE_L5.routeArcSvg.labels 同键 · 非地球直引） */
  labelKeys: [
    "traveltrust_theater_route_label_transatlantic",
    "traveltrust_theater_route_label_europe_asia",
    "traveltrust_theater_route_label_pacific",
  ] as const,
  labelEntranceYDuration: 0.5,
} as const;

/** Hero 文案区 UI 动效（非地球 mesh · L5-3） */
/** Hero 顶距：站点 Header + 扁平静态 chrome（非大框双行） */
export const TT_PAGE_LAYOUT_L5 = {
  heroContentOffsetClass:
    "pt-[calc(5.5rem+env(safe-area-inset-top,0px))] sm:pt-[calc(5.875rem+env(safe-area-inset-top,0px))] lg:pt-[calc(6.375rem+env(safe-area-inset-top,0px))] xl:pt-[calc(6rem+env(safe-area-inset-top,0px))]",
} as const;

export const TT_HERO_COPY_UI_L5 = {
  chipItemDuration: 0.32,
  trustChipHover: { y: -2, scale: 1.02 },
  trustChipTap: { scale: 0.98 },
  copyShimmerDuration: 1.4,
  copyShimmerRepeat: 0 as const,
  copyShimmerRepeatDelay: 0,
  topVignetteFadeDuration: 1.2,
  tier1VideoOpacityDuration: 1.1,
  tier1VideoScaleDuration: 22,
  tier1VideoScaleRepeat: 0 as const,
  legacyPosterOpacityDuration: 0.9,
  legacyPosterScaleDuration: 18,
  legacyPosterScaleRepeat: 0 as const,
  cardL5EnhanceClass:
    "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-[linear-gradient(135deg,rgba(252,164,124,0.12)_0%,transparent_48%)] after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:shadow-[inset_0_0_0_1px_rgba(252,164,124,0.22)]",
  disclaimerClass: "mt-4 mb-6 max-w-xl text-slate-100/90 text-meta sm:mb-7",
  chipsRowClass: "mt-2 sm:mt-2.5",
  cardBreathingClass: "!gap-4 sm:!gap-4 lg:!gap-5",
  ctaDockClass: "mt-5 flex w-full flex-col gap-4 sm:gap-5",
  ctaGlowClass:
    "shadow-[0_0_32px_-6px_rgba(252,164,124,0.55)] transition-shadow hover:shadow-[0_0_40px_-4px_rgba(252,164,124,0.65)]",
} as const;

export const TT_HERO_CTA_L5 = {
  primaryPulse: { duration: 0.9, opacity: [0.5, 1, 0.5] as const, repeat: 0 as const },
  primaryPulseClass: "pointer-events-none absolute inset-0 rounded-full ring-2 ring-ref-sun/22",
  primaryHover: { y: -2, scale: 1.01 },
  primaryTap: { scale: 0.98 },
  scrollHintHover: { y: -1, borderColor: "rgba(252,164,124,0.45)" },
  mobileScrollHintY: [0, 2, 5] as const,
  desktopScrollHintY: [0, 4, 10] as const,
  mobileScrollHintOpacity: [1, 0.92, 0.52] as const,
  desktopScrollHintOpacity: [1, 0.9, 0.38] as const,
} as const;

export const TT_BELOW_FOLD_ATMOSPHERE_L5 = {
  fadeDuration: 0.65,
  ease: TT_L5_MOTION_EASE,
  warmPulseDuration: 6.5,
  warmPulseRepeat: 0 as const,
  warmPulseOpacity: [0.35, 0.55, 0.35] as const,
} as const;

/** 首屏以下长页统一底光（不按 liquidity/trust/settlement 跳色） */
export const TT_BELOW_FOLD_ATMOSPHERE_UNIFIED_L5 = {
  background: [
    "radial-gradient(ellipse 82% 58% at 50% 18%, rgba(252,164,124,0.055) 0%, transparent 68%)",
    "linear-gradient(to bottom, rgba(12,10,9,0.06) 0%, transparent 28%, transparent 100%)",
  ].join(", "),
  warmPulseBackground:
    "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(252,164,124,0.08), transparent 72%)",
} as const;

/** 章节入场（非地球区块 · 与 traveltrustSectionMotion 同值） */
export const TT_SECTION_MOTION_L5 = {
  theater: { duration: 0.72 },
  liquidity: { duration: 0.58 },
  trust: { duration: 0.55 },
  settlement: { duration: 0.42 },
  faq: { duration: 0.4 },
  start: { duration: 0.62 },
  childStaggerDuration: 0.38,
  childStaggerBase: 0.06,
} as const;
