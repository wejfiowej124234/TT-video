/** L5 · auto-split from traveltrustCinematicNonGlobeL5 facade */
import { TT_MARKETING_BTN_GHOST_WARM_DARK } from "@/lib/marketingUi";
import { TT_PAGE_VERTICAL_RHYTHM_L5 } from "./rhythm";
import { TT_SECTION_SURFACE_L5 } from "./sections-layout";

const TT_STABLECOIN_FIELD_SHELL =
  "flex min-h-[3.25rem] w-full items-center gap-2 rounded-xl border bg-[#14100d]/45 px-4 py-3 transition duration-200 motion-sub motion-reduce:transition-none";

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
  sectionHeaderClass: "mb-5 text-center sm:mb-6 sm:text-left",
  cardWrapClass: `mx-auto w-full ${TT_PAGE_VERTICAL_RHYTHM_L5.liquidityMaxWidth}`,
  titleClass: "mt-0 text-h4 font-bold tracking-tight text-slate-50 sm:text-h3",
  taglineClass: "mt-2.5 max-w-2xl text-small leading-relaxed text-slate-300/90 sm:mt-3",
  cardClass:
    "relative overflow-hidden rounded-2xl border border-ref-sun/20 bg-[#0c0a09]/82 shadow-[0_16px_56px_-28px_rgba(0,0,0,0.75),0_0_40px_-20px_rgba(252,164,124,0.2)] ring-1 ring-inset ring-ref-sun/8 backdrop-blur-md sm:rounded-2xl",
  cardBodyClass: "relative px-1 sm:px-2",
  fieldLabelClass:
    "mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ref-sun/55",
  previewBannerClass:
    "flex flex-col gap-2 border-b border-ref-sun/16 bg-gradient-to-r from-ref-sun/10 via-[#14100d]/80 to-transparent px-5 py-3.5 sm:gap-2.5 sm:px-6 sm:py-4",
  previewBannerLeadClass: "flex w-full flex-wrap items-center gap-2.5 sm:gap-3",
  previewBannerLeadTextClass: "min-w-0 flex-1 text-small font-medium leading-snug text-ref-sun/92",
  previewBannerLegalClass: "w-full text-meta leading-relaxed text-slate-400/92",
  previewBannerIconOnly: true,
  previewBannerPulse: { duration: 2.8, opacity: [0.92, 1, 0.92] as const },
  fieldActiveClass: `${TT_STABLECOIN_FIELD_SHELL} border-ref-sun/30 shadow-[0_0_24px_-14px_rgba(252,164,124,0.28)] hover:border-ref-sun/38`,
  fieldIdleClass: `${TT_STABLECOIN_FIELD_SHELL} border-ref-sun/14 hover:border-ref-sun/28 hover:bg-ref-sun/[0.06]`,
  pairGridClass: "relative mt-5 grid gap-3 sm:mt-6 sm:grid-cols-[1fr_auto_1fr] sm:items-end sm:gap-4",
  flipButtonClass:
    "mx-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ref-sun/30 bg-ref-sun/10 text-lg text-ref-sun transition duration-200 hover:scale-105 hover:border-ref-sun/45 hover:bg-ref-sun/18 hover:shadow-[0_0_20px_-8px_rgba(252,164,124,0.35)] motion-sub motion-reduce:transition-none motion-reduce:hover:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]",
  sectionSurfaceClass: TT_SECTION_SURFACE_L5.liquidity,
  /** @deprecated 经济簇顶光见 `TT_PAGE_SECTION_FLOW_L5.economyClusterAtmosphereClass` */
  atmosphereClass: "hidden",
  amountLockedHintClass: "relative mt-2 text-meta leading-relaxed text-slate-400/90",
  cardBodyStackClass: "relative space-y-4 px-4 pb-5 pt-4 sm:space-y-5 sm:px-6 sm:pb-6 sm:pt-5",
  ctaStackShellClass: "relative mt-5 border-t border-ref-sun/14 pt-5 sm:mt-6",
  ctaStackClass: "grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3",
  ctaItemWrapClass: "flex min-w-0 items-stretch",
  ctaEscrowPrimaryClass: TT_MARKETING_BTN_GHOST_WARM_DARK,
  previewBannerEntranceOnly: true,
  ctaConnectClass: TT_MARKETING_BTN_GHOST_WARM_DARK,
  ctaSwapClass: TT_MARKETING_BTN_GHOST_WARM_DARK,
  ctaEscrowLinkClass: TT_MARKETING_BTN_GHOST_WARM_DARK,
  amountLockedClass:
    "flex min-h-[3.25rem] w-full cursor-not-allowed items-center rounded-xl border border-ref-sun/22 bg-[#14100d]/50 px-4 py-3 font-mono text-body text-slate-300/90 outline-none ring-1 ring-inset ring-ref-sun/15 shadow-[0_0_20px_-14px_rgba(252,164,124,0.18)] transition duration-200 focus-visible:border-ref-sun/40 focus-visible:ring-2 focus-visible:ring-ref-sun/30",
  amountFieldWrapClass: "relative mt-4 block w-full sm:mt-5",
  disclaimerClass: "sr-only",
  amountLockedPulse: { duration: 0.75, opacity: [0.85, 1, 0.85] as const, repeat: 0 as const },
} as const;
