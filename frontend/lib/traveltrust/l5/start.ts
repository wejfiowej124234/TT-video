/** L5 · auto-split from traveltrustCinematicNonGlobeL5 facade */
import { TT_L5_MOTION_EASE } from "./meta";
import { TT_PAGE_VERTICAL_RHYTHM_L5, ttTraveltrustSnapSectionInnerClass } from "./rhythm";

/** #start 走廊 ghost（与 Hero handoff 同族贝塞尔 · 装饰底轨） */
export const TT_START_ROUTE_CORRIDOR_GHOST_L5 =
  "M 14 44 Q 34 24, 50 30 T 86 44" as const;

export const TT_START_ROUTE_PATHS_L5 = [
  "M 14 44 Q 28 40, 38 36",
  "M 14 44 Q 32 32, 50 30 T 72 38",
  "M 14 44 Q 34 24, 50 30 T 86 44",
] as const;

/** 示意目的地锚点（装饰 · 非 geo 真值） */
export const TT_START_ROUTE_DESTINATIONS_L5 = [
  [
    { cx: 22, cy: 42 },
    { cx: 30, cy: 38 },
    { cx: 38, cy: 35 },
  ],
  [
    { cx: 28, cy: 40 },
    { cx: 62, cy: 34 },
  ],
  [
    { cx: 64, cy: 38 },
    { cx: 78, cy: 42 },
  ],
] as const;

export const TT_START_ROUTE_HUBS_L5 = [
  { cx: 14, cy: 44, labelY: 52, labelYActive: 56, stepKey: "plan" as const },
  { cx: 50, cy: 30, labelY: 38, labelYActive: 43, stepKey: "match" as const },
  { cx: 86, cy: 44, labelY: 52, labelYActive: 56, stepKey: "escrow" as const },
] as const;

export const TT_START_ROUTE_PREVIEW_L5 = {
  entranceDuration: 0.58,
  entranceScale: [0.98, 1] as const,
  pathLengthDuration: 1.2,
  pathMorphDuration: 0.55,
  stepCopyFadeDuration: 0.28,
  /** 仅 opacity 交叉淡入，避免 y 位移牵动整页 */
  stepCopyFadeY: 0,
  /** 锁定示意文案区高度（含第 2 步「角色剧场」占位 · 防 1↔2 整页跳动） */
  copyShellMinHeightClass: "relative min-h-[7.25rem] sm:min-h-[7.5rem]",
  corridorCopyClass: "mt-1 min-h-[2.75rem] text-meta leading-[1.55] text-slate-300/88 line-clamp-2",
  rolesSlotClass: "mt-2 min-h-[1.625rem]",
  rolesLinkHiddenClass: "invisible pointer-events-none select-none",
  hubPopDuration: 0.42,
  hubPopDelayBase: 0.35,
  hubEntranceStagger: 0.14,
  hubEntranceDelayAfterPath: 0.45,
  hubFill: "#fca47c",
  hubActiveFill: "#ffd4a8",
  hubRingStroke: "rgba(252,164,124,0.45)",
  destinationDotRadius: 1.35,
  destinationDotOpacity: 0.42,
  destinationDotActiveOpacity: 0.72,
  flowDotDuration: 2.8,
  flowDotRadius: 2.4,
  pathGlowStrokeWidth: 3.2,
  pathGlowOpacity: 0.28,
  pathGlowOpacityFadeDuration: 0.35,
  listItemDuration: 0.28,
  manualHoldAfterSelectMs: 6000,
  reducedMotionInactivePathOpacity: 0.22,
  reducedMotionActivePathOpacity: 0.88,
  hubLabelKeys: [
    "traveltrust_start_hub_short_plan",
    "traveltrust_start_hub_short_match",
    "traveltrust_start_hub_short_escrow",
  ] as const,
  hubRingRadiusActive: 3.8,
  hubDotRadiusActive: 2.4,
  hubDotRadiusInactive: 1.25,
  hubInactiveDotOpacity: 0.52,
  hubLabelFontSize: 3.1,
  hubLabelActiveFontSize: 3.5,
  hubLabelActiveFill: "rgba(255,244,232,0.96)",
  cardClass:
    "relative mt-6 max-w-md overflow-visible rounded-xl border border-ref-sun/26 bg-[linear-gradient(165deg,rgba(252,164,124,0.09)_0%,rgba(12,10,9,0.82)_48%)] p-4 shadow-[0_14px_44px_-14px_rgba(252,164,124,0.38)] ring-1 ring-inset ring-ref-sun/14 backdrop-blur-md sm:p-5 lg:mt-0 lg:max-w-none",
  cardShimmerClipClass: "pointer-events-none absolute inset-0 overflow-hidden rounded-xl",
  kickerClass:
    "relative text-[11px] font-medium uppercase tracking-[0.16em] text-ref-sun/85",
  stepTitleClass:
    "relative mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm font-semibold leading-snug",
  stepTitleIndexClass: "shrink-0 text-ref-sun/92",
  stepTitleSepClass: "shrink-0 text-slate-500/70",
  stepTitleLabelClass: "min-w-0 text-slate-100/95",
  svgClass: "relative mt-3 h-32 w-full sm:h-36",
  captionClass:
    "relative mt-4 border-t border-ref-sun/14 pt-4 text-meta leading-relaxed text-slate-200/90 sm:mt-5 sm:pt-4",
  rolesLinkClass:
    "mt-2 inline-flex text-meta font-medium text-ref-sun/90 underline-offset-2 transition hover:text-ref-sun hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
  cardShimmerDuration: 5,
  cardShimmerRepeat: 0 as const,
  cardBorderPulse: { duration: 3.4, opacity: [0.5, 0.78, 0.5] as const },
  cardBorderPulseRepeat: 0 as const,
  pathOpacityPulseRepeat: 0 as const,
} as const;

export const TT_FOOTER_L5_SEQUENTIAL = {
  slotStagger: 0.085,
  slotDelayChildren: 0.14,
  linkStagger: 0.055,
  linkDelayChildren: 0.1,
  groupStagger: 0.12,
  childEntranceDuration: 0.38,
  childEntranceY: 12,
  linkHoverSpring: { type: "spring" as const, stiffness: 420, damping: 28 },
} as const;

export const TT_START_STEP_L5 = {
  activePulseDuration: 2.6,
  activePulseRepeat: Infinity,
  activeGlow: [
    "0 0 0 0 rgba(252,164,124,0)",
    "0 0 22px -8px rgba(252,164,124,0.32)",
    "0 0 0 0 rgba(252,164,124,0)",
  ] as const,
  surfaceSpring: { type: "spring" as const, stiffness: 400, damping: 32 },
  listClass:
    "mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 xl:items-stretch",
  itemClass:
    "flex h-full min-h-[3.75rem] min-w-0 items-stretch rounded-xl border px-4 py-3.5 text-meta backdrop-blur-sm transition-[background-color,border-color,box-shadow,color] duration-300 sm:min-h-[4rem] sm:px-5 sm:py-4",
  stepButtonInnerClass:
    "grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-0.5 text-left sm:gap-x-[1.125rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 rounded-lg",
  textClass: "min-w-0 leading-snug tracking-normal",
  activeClass:
    "border-ref-sun/65 bg-gradient-to-br from-ref-sun/[0.32] via-ref-sun/[0.2] to-ref-sun/[0.1] text-ref-sun shadow-[inset_0_1px_0_rgba(255,220,180,0.18),0_0_24px_-12px_rgba(252,164,124,0.35)] ring-1 ring-ref-sun/30",
  doneClass: "border-ref-sun/30 bg-ink-950/62 text-slate-100",
  idleClass: "border-ref-sun/22 bg-ink-950/54 text-slate-200 hover:border-ref-sun/32 hover:bg-ink-950/62",
  upcomingClass: "border-ref-sun/18 bg-ink-950/48 text-slate-200/90",
  stepBadgeActiveClass: "bg-ref-sun/22 text-ref-sun ring-1 ring-ref-sun/35",
  stepBadgeIdleClass: "bg-white/12 text-slate-200",
  stepBadgeClass:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold tabular-nums",
  contentWaveBase: 0.08,
  contentWaveStep: 0.07,
} as const;


export const TT_START_SECTION_L5 = {
  sectionClass: `${ttTraveltrustSnapSectionInnerClass({ align: "start", padding: "none" })} ${TT_PAGE_VERTICAL_RHYTHM_L5.sectionTopStart}`,
  bodyClass: "relative z-[2] mx-auto w-full max-w-3xl px-0.5 sm:px-0 xl:max-w-5xl",
  mainGridClass:
    "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,17.5rem)] lg:items-start lg:gap-x-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] xl:gap-x-12",
  kickerSpanClass: "lg:col-span-2",
  mainColClass: "min-w-0 lg:col-start-1 lg:row-start-2",
  previewColClass: "min-w-0 lg:col-start-2 lg:row-start-2 lg:self-start",
  routePreviewWrapClass: `${TT_PAGE_VERTICAL_RHYTHM_L5.startStepsToPreview} lg:mt-0`,
  ctaPrimaryGlow: "shadow-[0_0_32px_-10px_rgba(252,164,124,0.45)]",
  ctaPrimaryClass: "px-8 py-3 not-prose",
  ghostCtaTap: { scale: 0.98 },
  stepTap: { scale: 0.99 },
  tailAtmosphere:
    "radial-gradient(ellipse 70% 55% at 72% 48%, rgba(252,164,124,0.1) 0%, transparent 62%), radial-gradient(ellipse 50% 40% at 88% 72%, rgba(255,200,150,0.06) 0%, transparent 58%)",
  tailAtmospherePulse: { duration: 1.2, opacity: [0.35, 0.55, 0.35] as const, repeat: 0 as const },
  activeStepCaptionClass: "relative mt-3 text-small font-medium leading-snug text-ref-sun/92",
  ctaGhostClass:
    "inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] border border-ref-sun/32 bg-ref-sun/10 px-6 py-3 text-small font-semibold text-slate-100 shadow-[0_0_18px_-10px_rgba(252,164,124,0.32)] transition hover:-translate-y-0.5 hover:border-ref-sun/45 hover:bg-ref-sun/16 hover:text-white motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
  ctaStackClass:
    "mt-8 flex w-full max-w-xl flex-col gap-4 sm:mt-10 sm:w-auto sm:flex-row sm:flex-nowrap sm:items-center gap-x-8 sm:gap-x-10",
  ctaPrimaryWrapClass: "relative isolate shrink-0",
  ctaSecondaryWrapClass: "shrink-0 sm:ml-0",
  ctaLinkMinWidthClass: "min-w-[10.5rem] sm:min-w-[11rem]",
  feePanelWrapClass: "scroll-mt-28 mt-8 max-w-xl sm:mt-10",
  feePanelEnter: { duration: 0.32, ease: TT_L5_MOTION_EASE },
  feePanelExit: { duration: 0.22, ease: TT_L5_MOTION_EASE },
  feePanelDividerClass: "border-t border-ref-sun/12 px-5 pb-5 pt-4",
  ctaStackEntrance: { duration: 0.4, ease: TT_L5_MOTION_EASE },
  ctaPrimaryTap: { scale: 0.98 },
  ctaPrimaryPulse: { duration: 2.8, opacity: [0.38, 0.72, 0.38] as const, repeat: Infinity },
  previewColEntrance: { delay: 0.28, duration: 0.55 },
  stepSurfaceSpring: { type: "spring" as const, stiffness: 400, damping: 32 },
  ctaPrimaryPulseClass:
    "pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] shadow-[0_0_28px_-6px_rgba(252,164,124,0.45)]",
} as const;
