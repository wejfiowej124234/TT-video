/** L5 · auto-split from traveltrustCinematicNonGlobeL5 facade */
import {
  TT_MARKETING_BTN_GHOST_WARM_DARK,
  TT_MARKETING_BTN_PRIMARY_WARM_HERO,
} from "@/lib/marketingUi";
import { TT_L5_MOTION_EASE } from "./meta";
import { TT_PAGE_VERTICAL_RHYTHM_L5 } from "./rhythm";
import { TT_SECTION_SURFACE_L5 } from "./sections-layout";

const TT_STABLECOIN_FIELD_SHELL =
  "flex min-h-[3.25rem] w-full items-center gap-2 rounded-xl border bg-[#14100d]/45 px-4 py-3 transition duration-200 motion-sub motion-reduce:transition-none";

/** 经济簇交互动效（解锁表 / 结算 CTA / 报价轨 · 禁止 Infinity 出现在 quality toggle） */
export const TT_ECONOMY_INTERACT_L5 = {
  ctaHover: { y: -1, scale: 1.02 },
  ctaTap: { scale: 0.98 },
  plateHover: { y: -1 },
  rowShift: { x: 3 },
  transition: { duration: 0.22, ease: TT_L5_MOTION_EASE },
  sheenClass:
    "pointer-events-none absolute inset-y-0 left-0 z-[2] w-1/3 bg-gradient-to-r from-transparent via-[#f4d39a]/16 to-transparent",
  sheenEnter: { x: ["-45%", "230%"] as const, opacity: [0, 0.55, 0] as const },
  sheenDuration: 1.12,
} as const;

/** 兑换对字色：全暖金谱（勿 USDC 蓝 · 与 L0/L5 一致） */
export const TT_LIQUIDITY_PAIR_L5 = {
  fromClass: "font-mono text-body font-semibold tracking-tight text-slate-100",
  toClass: "font-mono text-body font-bold tracking-tight text-ref-sun",
  fieldMetaClass: "ml-auto shrink-0 text-[11px] font-medium text-slate-400/90",
  fieldBorderActive: "border-ref-sun/32",
} as const;

export const TT_STABLECOIN_GATEWAY_L5 = {
  dividerRevealDuration: 0.9,
  blobPrimary: {
    duration: 1.2,
    opacity: [0.35, 0.55, 0.35] as const,
    scale: [1, 1.04, 1] as const,
    repeat: 0 as const,
  },
  blobSecondary: { duration: 1.4, opacity: [0.22, 0.42, 0.22] as const, repeat: 0 as const },
  shimmer: { duration: 1.1, repeat: 0 as const, repeatDelay: 0 },
  headerEntrance: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  pairFlip: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  flipButtonRotate: 180,
  flipButtonDuration: 0.35,
  ctaHoverLift: { y: -3, scale: 1.01 },
  ctaTapScale: { scale: 0.98 },
  sectionHeaderClass: "mb-4 text-center sm:mb-5 sm:text-left",
  cardWrapClass: `mx-auto w-full ${TT_PAGE_VERTICAL_RHYTHM_L5.liquidityMaxWidth}`,
  titleClass: "mt-0 text-h3 font-bold tracking-tight text-slate-50",
  taglineClass: "mt-3 max-w-2xl text-small leading-relaxed text-slate-300/90 sm:mt-4",
  cardClass:
    "relative overflow-hidden rounded-2xl border border-white/14 bg-[#0a0908]/94 shadow-[0_18px_60px_-26px_rgba(0,0,0,0.88),0_0_40px_-20px_rgba(244,211,154,0.16)] ring-1 ring-inset ring-white/10 backdrop-blur-xl sm:rounded-2xl",
  cardBodyClass: "relative px-1 sm:px-2",
  fieldLabelClass:
    "mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400/90",
  previewBannerClass:
    "flex flex-col gap-2 border-b border-white/10 bg-gradient-to-r from-white/[0.04] via-[#14100d]/80 to-transparent px-5 py-3.5 sm:gap-2.5 sm:px-6 sm:py-4",
  previewBannerLeadClass: "flex w-full flex-wrap items-center gap-2.5 sm:gap-3",
  previewBannerLeadTextClass: "min-w-0 flex-1 text-small font-medium leading-snug text-slate-100/92",
  previewBannerLegalClass: "mt-2 max-w-3xl text-meta leading-relaxed text-slate-400/90",
  previewBannerIconOnly: true,
  previewBannerPulse: { duration: 2.8, opacity: [0.92, 1, 0.92] as const },
  fieldActiveClass: `${TT_STABLECOIN_FIELD_SHELL} border-white/22 shadow-[0_0_24px_-14px_rgba(244,211,154,0.22)] hover:border-[#f4d39a]/40`,
  fieldIdleClass: `${TT_STABLECOIN_FIELD_SHELL} border-white/10 hover:border-white/22 hover:bg-white/[0.03]`,
  pairGridClass: "relative mt-5 grid gap-3 sm:mt-6 sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:gap-4",
  flipButtonClass:
    "mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/18 bg-white/[0.04] text-lg text-slate-100 transition duration-200 hover:scale-105 hover:border-[#f4d39a]/45 hover:bg-[#f4d39a]/10 hover:text-[#f4d39a] hover:shadow-[0_0_20px_-8px_rgba(244,211,154,0.35)] motion-sub motion-reduce:transition-none motion-reduce:hover:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d39a]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]",
  sectionSurfaceClass: TT_SECTION_SURFACE_L5.liquidity,
  /** @deprecated 经济簇顶光见 `TT_PAGE_SECTION_FLOW_L5.economyClusterAtmosphereClass` */
  atmosphereClass: "hidden",
  amountLockedHintClass: "relative mt-2 text-meta leading-relaxed text-slate-400/90",
  amountRateHintClass: "relative mt-2 text-small font-medium leading-relaxed text-slate-200/92",
  cardBodyStackClass: "relative space-y-4 px-4 pb-5 pt-4 sm:space-y-5 sm:px-6 sm:pb-6 sm:pt-5",
  ctaStackShellClass: "relative mt-5 border-t border-white/10 pt-5 sm:mt-6",
  /** HU-022: single primary「兑换」+ secondary text links (no 3-button grid) */
  ctaStackClass: "flex w-full flex-col items-stretch gap-3",
  ctaItemWrapClass: "flex min-w-0 w-full items-stretch",
  ctaPrimaryClass: `${TT_MARKETING_BTN_PRIMARY_WARM_HERO} w-full sm:min-w-[12rem]`,
  ctaSecondaryRowClass:
    "flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-center sm:justify-start",
  ctaSecondaryLinkClass:
    "inline-flex max-w-full items-center whitespace-nowrap text-meta font-medium text-slate-400 underline-offset-2 transition hover:text-ref-sun/90 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]",
  ctaEscrowPrimaryClass: TT_MARKETING_BTN_GHOST_WARM_DARK,
  previewBannerEntranceOnly: true,
  ctaConnectClass: TT_MARKETING_BTN_GHOST_WARM_DARK,
  ctaSwapClass: TT_MARKETING_BTN_GHOST_WARM_DARK,
  ctaEscrowLinkClass: TT_MARKETING_BTN_GHOST_WARM_DARK,
  amountLockedClass:
    "flex min-h-[3.25rem] w-full cursor-not-allowed items-center rounded-xl border border-ref-sun/28 bg-[#14100d]/50 px-4 py-3 font-mono text-body text-slate-200/92 outline-none ring-1 ring-inset ring-white/10 shadow-[0_0_20px_-14px_rgba(244,211,154,0.16)] transition duration-200 focus-visible:border-ref-sun/40 focus-visible:ring-2 focus-visible:ring-ref-sun/30",
  amountFieldWrapClass: "relative mt-4 block w-full sm:mt-5",
  disclaimerClass: "mt-3 max-w-3xl text-meta leading-relaxed text-slate-400/90",
  amountLockedPulse: { duration: 0.75, opacity: [0.85, 1, 0.85] as const, repeat: 0 as const },
} as const;

/** Liquidity 顶栏报价轨（公开释放当前批次售价） */
export const TT_LIQUIDITY_RAIL_L5 = {
  railClass:
    "relative z-[1] overflow-hidden w-full rounded-2xl border border-white/12 bg-[#0a0908]/88 px-5 py-5 shadow-[0_14px_44px_-20px_rgba(0,0,0,0.72)] ring-1 ring-white/8 sm:px-6 sm:py-6",
  metricsClass: "flex flex-wrap items-baseline gap-x-5 gap-y-1.5 font-mono",
  priceClass: "text-h3 font-semibold tracking-tight text-[#f4d39a]",
  pairClass: "text-small font-medium text-slate-200/92",
  minClass: "text-meta text-slate-400/90",
  batchFocusClass:
    "rounded-full border border-[#f4d39a]/35 bg-[#f4d39a]/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-[#f4d39a]",
  batchStripClass: "mt-2.5 flex flex-wrap gap-1.5",
  batchChipClass:
    "rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] tracking-wide text-slate-400",
  batchChipActiveClass:
    "border-[#f4d39a]/45 bg-[#f4d39a]/10 text-[#f4d39a]",
  disclaimerClass: "mt-3 max-w-3xl text-meta leading-relaxed text-slate-400/90",
} as const;

/** 兑换栏左侧 · TTG 三条参与路径（白皮书 45/55 叙事 · 非收益承诺） */
export const TT_LIQUIDITY_TTG_PATHS_L5 = {
  plateClass:
    "relative mt-8 rounded-2xl border border-[#f4d39a]/22 bg-[#0a0908]/72 p-5 shadow-[0_16px_48px_-28px_rgba(0,0,0,0.8),0_0_36px_-18px_rgba(244,211,154,0.14)] ring-1 ring-inset ring-white/8 sm:mt-10 sm:p-6",
  leadClass: "text-small font-medium leading-relaxed text-slate-100/94",
  listClass: "mt-5 flex list-none flex-col gap-5 p-0 sm:mt-6",
  rowClass: "grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-3 gap-y-1",
  indexClass:
    "mt-0.5 font-mono text-[11px] font-semibold tracking-[0.16em] text-[#f4d39a]",
  titleClass: "text-small font-semibold leading-snug tracking-tight text-white",
  bodyClass: "mt-1 text-meta leading-relaxed text-slate-300/90",
  pctClass: "font-mono tabular-nums text-[#f4d39a]",
  noteClass: "mt-5 border-t border-white/10 pt-4 text-meta leading-relaxed text-slate-400/88 sm:mt-6",
} as const;

/** TTG 创世分配五弧仪表盘（50 / 35 / 3 / 5 / 7 · 非募资用途饼图 · 分色金属） */
export const TT_TTG_ALLOCATION_L5 = {
  plateClass:
    "relative grid w-full gap-6 rounded-2xl border border-[#6EC8D9]/28 bg-[#0a0908]/86 p-5 shadow-[0_18px_52px_-24px_rgba(0,0,0,0.78),0_0_40px_-18px_rgba(110,200,217,0.22)] ring-1 ring-inset ring-[#6EC8D9]/16 sm:gap-7 sm:p-6 lg:grid-cols-[minmax(0,21rem)_1fr] lg:items-center lg:gap-8",
  ringWrapClass: "relative mx-auto h-[18.75rem] w-[18.75rem] sm:h-[20.25rem] sm:w-[20.25rem]",
  ringHaloClass:
    "pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(circle,rgba(244,211,154,0.16)_0%,rgba(110,200,217,0.08)_38%,transparent_72%)] blur-[2px]",
  viewBox: 300,
  radius: 92,
  innerRadius: 70,
  strokeWidth: 16,
  innerStrokeWidth: 3,
  gapRatio: 0.012,
  drawDuration: 0.92,
  stagger: 0.09,
  sheenDuration: 14,
  publicStroke: "#F6D7A4",
  daoStroke: "#6EC8D9",
  teamStroke: "#E07A6A",
  marketingStroke: "#C9A0E8",
  treasuryStroke: "#E8A05A",
  trackStroke: "rgba(255,255,255,0.1)",
  innerTrackStroke: "rgba(244,211,154,0.22)",
  dimOpacity: 0.28,
  labelOnArcRadius: 92,
  labelCalloutRadius: 124,
  labelClass: "select-none text-[11px] font-semibold tracking-wide",
  legendPctClass:
    "ml-auto shrink-0 self-center font-mono text-[13px] font-semibold tabular-nums text-[#F4D39A]",
  centerValueClass: "font-serif text-[2.25rem] font-semibold tracking-tight text-[#F4D39A] sm:text-[2.65rem]",
  centerCaptionClass: "mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-400/90",
  legendListClass: "flex flex-col gap-3",
  legendRowClass:
    "group flex items-center gap-3 rounded-xl border border-white/10 bg-ink-950/40 px-4 py-3 transition hover:border-white/22 hover:bg-ink-950/62 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
  legendRowActiveClass: "border-[#F4D39A]/35 bg-ink-950/70 shadow-[0_0_22px_-14px_rgba(244,211,154,0.45)]",
  legendSwatchClass: "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full shadow-[0_0_10px_currentColor]",
  legendTitleClass: "text-small font-semibold leading-snug text-white group-hover:text-[#F4D39A]",
  legendSummaryClass: "mt-0.5 text-meta leading-relaxed text-slate-300/90",
  burnBadgeClass:
    "ml-2 inline-flex align-middle rounded-full border border-[#F4D39A]/35 bg-[#F4D39A]/12 px-1.5 py-px text-[10px] font-semibold tracking-[0.08em] text-[#F4D39A]",
  purposeListClass: "mt-6 grid gap-2.5 border-t border-white/10 pt-5 lg:col-span-2",
  purposeRowClass: "text-meta leading-relaxed text-slate-300/90",
} as const;

/** 本地公开释放档期（NEFE 列表 IA · TravelTrust 深色 L5） */
export const TT_TTG_UNLOCK_L5 = {
  sectionSurfaceClass: TT_SECTION_SURFACE_L5.unlock,
  bodyClass: "relative z-[1] mx-auto w-full max-w-5xl px-0.5 sm:px-0",
  unitPriceMetaClass: "mt-3 font-mono text-meta text-slate-400/95",
  listClass: "mt-8 flex flex-col gap-5 sm:mt-10 sm:gap-6",
  rowClass:
    "group relative flex min-h-[4.5rem] w-full flex-col items-start justify-between gap-3 overflow-hidden bg-[#16110d] px-4 py-4 text-slate-100 shadow-[0_10px_28px_-18px_rgba(0,0,0,0.88)] transition-[box-shadow] duration-300 motion-sub motion-reduce:transition-none sm:min-h-[4.75rem] sm:flex-row sm:items-center sm:gap-4 sm:px-5",
  rowClip:
    "polygon(0 0, calc(100% - 1.15rem) 0, 100% 1.15rem, 100% 100%, 0 100%)",
  rowFeaturedClass: "ring-1 ring-[#7dcea0]/55 shadow-[0_0_24px_-10px_rgba(125,206,160,0.45)]",
  rowHover: { y: -2 },
  rowTap: { scale: 0.995 },
  rowHoverTransition: { duration: 0.28, ease: TT_L5_MOTION_EASE },
  sheenHoverClass:
    "pointer-events-none absolute inset-y-0 z-[3] w-1/4 -translate-x-[160%] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent opacity-0 transition-transform duration-700 ease-out group-hover:translate-x-[420%] group-hover:opacity-100 motion-reduce:translate-x-0 motion-reduce:opacity-0 motion-reduce:transition-none",
  featuredGlowClass:
    "pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_right,rgba(125,206,160,0.16)_0%,transparent_64%)]",
  featuredGlow: {
    duration: 3.6,
    opacity: [0.32, 0.7, 0.32] as const,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
  clockTick: {
    duration: 2.8,
    rotate: [0, 8, 0] as const,
    repeat: Infinity,
    repeatDelay: 1.8,
    ease: TT_L5_MOTION_EASE,
  },
  statusPulse: {
    duration: 2.4,
    opacity: [0.72, 1, 0.72] as const,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
  leftClass: "relative z-[1] flex min-w-0 items-center gap-3",
  clockWrapClass:
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/12 text-[#f4d39a]",
  titleClass: "truncate text-small font-semibold tracking-wide text-white sm:text-body",
  dateClass: "mt-0.5 font-mono text-meta text-slate-400/95",
  rightClass: "relative z-[1] flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3",
  statusUpcomingClass:
    "rounded-full bg-[#7dcea0]/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7dcea0]",
  statusPlannedClass:
    "rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300",
  statusFeaturedClass:
    "rounded-full bg-[#7dcea0]/16 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9ae6b8]",
  featuredTagClass:
    "rounded-full bg-[#7eb8c9]/16 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-[#7eb8c9]",
  priceClass: "font-mono text-meta text-[#f4d39a]/90",
  amountClass: "font-mono text-body font-semibold tracking-tight text-white sm:text-h4",
  pctClass: "text-meta text-[#f4d39a]",
  disclaimerClass: "mt-5 max-w-3xl text-meta leading-relaxed text-slate-400/90",
} as const;
