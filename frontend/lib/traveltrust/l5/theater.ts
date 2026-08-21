/** L5 · auto-split from traveltrustCinematicNonGlobeL5 facade */
import { TT_PAGE_VERTICAL_RHYTHM_L5 } from "./rhythm";

export const TT_THEATER_TAB_L5 = {
  staggerBase: 0.06,
  staggerDelay: 0.12,
  tabEntranceDuration: 0.4,
  iconPulseDuration: 0.2,
  tabIconClass: "h-6 w-6 shrink-0 stroke-[1.75]",
  tabButtonBaseClass:
    "relative flex min-h-[3rem] shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 max-lg:min-h-[2.75rem] max-lg:px-3 max-lg:py-2 max-lg:gap-2 sm:max-lg:px-3.5 lg:min-h-[3.25rem] lg:gap-3 lg:px-5 lg:py-3.5 lg:w-full",
  indicatorSpring: { type: "spring" as const, stiffness: 380, damping: 32 },
  titleEntranceDuration: 0.3,
  selectedShadow: "shadow-[0_0_28px_-10px_rgba(252,164,124,0.38)]",
  idleBorderClass: "border-ref-sun/14 bg-ink-900/45",
  idleTextClass: "text-slate-300/90",
  idleHover: "hover:border-ref-sun/22 hover:text-slate-200 hover:shadow-[0_0_16px_-12px_rgba(252,164,124,0.2)]",
} as const;

export const TT_THEATER_SECTION_L5 = {
  introBlockClass: "relative z-[3] mx-auto w-full max-w-3xl px-0.5 pt-1 sm:px-0 sm:pt-2",
  /** 眉题「角色剧场」与主标题之间：显式分线 + 企业级留白（勿贴标题） */
  introKickerClass: "mb-0",
  introHeadlineBlockClass: "mt-5 space-y-4 sm:mt-6 sm:space-y-5",
  introHeadlineClass: "max-w-3xl text-h3 font-bold text-white",
  introSublineClass: "max-w-3xl text-small leading-relaxed text-slate-300",
  theaterPanelFrameClass:
    "relative min-w-0 overflow-hidden rounded-2xl border border-ref-sun/20 bg-gradient-to-b from-[#1c1612]/92 to-ink-950/96 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_40px_-16px_rgba(252,164,124,0.22)]",
  stageShellClass: "relative z-[3] mt-4 overflow-hidden [perspective:1600px] sm:mt-5 lg:mt-6",
  stageGridClass: "relative grid gap-5 lg:grid-cols-[minmax(0,12.5rem)_minmax(0,1fr)] lg:items-start lg:gap-6 xl:gap-7",
  panelStackClass: "relative z-[1] flex min-w-0 flex-col gap-4 lg:gap-5",
  roleMetaStackClass: "flex flex-col gap-3.5",
  roleCtaStackClass: "flex w-full flex-col gap-2.5 pt-0.5 sm:max-w-[22rem]",
  /** 吸附由外层 `TravelTrustSnapChapter` 承担；本节仅保留内容与 Hero 接缝 */
  sectionSurfaceClass: `relative isolate overflow-hidden -mt-[clamp(0.25rem,1vh,0.75rem)] pt-[clamp(1.25rem,3.2vh,2rem)] sm:pt-[clamp(1.5rem,3.6vh,2.25rem)] max-lg:[&_[data-tt-traveltrust-role-video]]:aspect-video ${TT_PAGE_VERTICAL_RHYTHM_L5.sectionBottomTheater}`,
  /** @deprecated 用 introHeadlineBlockClass */
  introBlockGap: "space-y-4 sm:space-y-5",
  videoPlaceholderHintClass: "mt-1 text-meta leading-relaxed text-slate-300/88",
  roleMetaPanelClass: "border-t border-ref-sun/12 bg-ink-950/35 px-5 pb-6 pt-6 sm:px-6 sm:pb-7 sm:pt-7",
  roleMetaTitleClass: "text-h4 font-bold leading-tight text-white sm:text-h3",
  roleMetaTagClass: "mt-1.5 text-small leading-snug text-slate-300/92",
  sectionBackdropClass:
    "pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_120%_85%_at_50%_18%,rgba(12,10,9,0.72)_0%,rgba(12,10,9,0.28)_52%,transparent_100%)]",
  sectionFloorCapClass:
    "pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[min(30vh,300px)] bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/72 to-transparent",
  sectionTopCapClass:
    "pointer-events-none absolute inset-x-0 top-0 z-[1] h-[clamp(2rem,5vh,3.5rem)] bg-gradient-to-b from-[#0c0a09]/88 via-[#0c0a09]/40 to-transparent",
  topHandoffScrimStyle:
    "linear-gradient(to bottom, rgba(12,10,9,0.5) 0%, rgba(12,10,9,0.28) 42%, rgba(12,10,9,0.08) 78%, transparent 100%)",
  topHandoffScrimHeightClass: "h-[clamp(2.25rem,6vh,4rem)] sm:h-[clamp(2.5rem,6.5vh,4.5rem)]",
  theater3dWrapClass:
    "pointer-events-none absolute top-2 right-0 z-0 left-[24%] h-[min(58vh,480px)] motion-reduce:hidden sm:top-3 sm:left-[30%] lg:left-[36%] xl:left-[38%]",
  topHandoffFadeDuration: 0.9,
  entranceDuration: 0.65,
  videoPanelStagger: 0.2,
  routeArcFadeDuration: 0.85,
  routeArcFadeDelay: 0.22,
  mobileTablistClass:
    "max-lg:sticky max-lg:z-[2] max-lg:-mx-1 max-lg:border-b max-lg:border-ref-sun/14 max-lg:bg-[#0c0a09]/94 max-lg:px-1 max-lg:py-2 max-lg:backdrop-blur-md",
  mobileTablistGlow: { duration: 0.65, opacity: [0.5, 0.85, 0.5] as const, repeat: 0 as const },
  panelBorderPulse: { duration: 3.8, opacity: [0.55, 1, 0.55] as const },
  introCopyDuration: 0.5,
  introCopyDelay: 0.08,
  handoffLineDuration: 0.45,
  handoffLineDelay: 0.14,
  stageTiltDuration: 0.7,
  videoPanelEntranceDuration: 0.55,
  tabTap: { scale: 0.98 },
} as const;

export const TT_BELOW_FOLD_PLACEHOLDER_L5 = {
  pulseClass:
    "relative overflow-hidden border-t border-ref-sun/14 bg-gradient-to-b from-ref-sun/[0.06] via-ref-sun/[0.02] to-transparent",
  pulseDuration: 2.2,
  pulseRepeat: 0 as const,
  shimmerDuration: 3.4,
  shimmerRepeat: 0 as const,
  warmCoreClass:
    "pointer-events-none absolute left-1/2 top-1/2 h-32 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(252,164,124,0.12),transparent_70%)]",
  warmCorePulse: { duration: 3.6, opacity: [0.25, 0.55, 0.25] as const },
  warmCorePulseRepeat: 0 as const,
} as const;

export const TT_BELOW_HERO_FADE_L5 = {
  wrapperClass:
    "relative pointer-events-none -mt-[clamp(0.5rem,1.25vh,1rem)] mb-[clamp(0.5rem,1.25vh,1rem)] w-full",
  heightClass: "h-[clamp(3rem,7vh,4.25rem)] sm:h-[clamp(3.5rem,8vh,4.75rem)]",
  /** 与 `TT_THEATER_SECTION_L5.topHandoffScrimStyle` 同族 · 消除 Hero/剧场接缝 */
  gradient: TT_THEATER_SECTION_L5.topHandoffScrimStyle,
  inkBridgeClass: "hidden",
  fadeDuration: 0.8,
  shimmerDuration: 4.5,
  shimmerRepeat: 0 as const,
} as const;

export const TT_THEATER_ROLE_CTA_L5 = {
  primaryGlowClass: "shadow-[0_0_32px_-8px_rgba(252,164,124,0.55)]",
  primaryHover: { y: -2 },
  primaryTap: { scale: 0.98 },
  secondaryHover: { y: -1 },
  secondaryTap: { scale: 0.98 },
  secondaryLinkClass:
    "inline-flex min-h-[40px] w-full items-center justify-center rounded-xl border border-ref-sun/16 bg-transparent px-4 py-2 text-meta font-medium text-slate-300 transition hover:-translate-y-0.5 hover:border-ref-sun/32 hover:bg-ref-sun/6 hover:text-white hover:shadow-[0_0_16px_-8px_rgba(252,164,124,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  ctaStackStagger: 0.1,
} as const;
