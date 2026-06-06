/** L5 · auto-split from traveltrustCinematicNonGlobeL5 facade */
import { TT_L5_MOTION_EASE, TT_CINEMATIC_PAGE_INK_HEX } from "./meta";
import { TT_SCROLL_CHROME_PILL_L5 } from "./sections-layout";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";

export const TT_CANVAS_STATIC_FALLBACK_L5 = {
  fadeInDuration: 1,
  warmPulseDuration: 8,
  warmPulseRepeat: 0 as const,
  warmOpacityRange: [0.06, 0.12] as const,
  layers: [
    "radial-gradient(ellipse 70% 55% at 42% 48%, rgba(252,164,124,0.1), transparent 68%)",
    "radial-gradient(ellipse 90% 80% at 50% 50%, rgba(12,10,9,0.35), rgba(12,10,9,0.88) 100%)",
  ] as const,
} as const;

export const TT_CANVAS_WARM_BAND_L5 = {
  pulseDuration: 10,
  pulseRepeat: 0 as const,
  opacityMulRange: [0.075, 0.1] as const,
} as const;

export const TT_HERO_HORIZON_ENTRANCE_L5 = {
  duration: 0.7,
  delay: 0.5,
} as const;

/** Hero 文案区滚动提示（非地球 UI · L5-3） */
/** Hero 卡内「向下·角色剧场」— 与左下 scroll chrome 同 pill，无嵌套 border-t（H·O3） */
export const TT_SCROLL_HINT_L5_CLASS =
  `relative inline-flex w-full flex-col items-center gap-1.5 ${TT_SCROLL_CHROME_PILL_L5} px-2.5 py-2.5 text-meta font-semibold text-ref-sun/92 transition hover:border-ref-sun/32 hover:text-ref-sun motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 lg:items-start lg:text-left`;

export const TT_SCROLL_HINT_L5 = {
  /** 置于文案卡外，与左下 scroll chrome 同 pill（J·P1-H4） */
  outsideCardClass: "mt-3 mb-1 w-full sm:mt-4 sm:mb-2",
  mobileBorderPulse: { duration: 2.8, opacity: [0.4, 0.95, 0.4] as const },
  mobileBorderPulseRepeat: 0 as const,
  mobileBorderPulseClass: "pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-ref-sun/30",
} as const;

export const TT_SCROLL_HINT_ARROW_L5 = {
  animate: { y: [0, 5, 0] as const, opacity: [0.45, 1, 0.45] as const },
  transition: { duration: 2, repeat: 2, ease: "easeInOut" as const },
} as const;

export const TT_REDUCED_MOTION_NOTICE_L5_CLASS =
  `relative ${ttZClass(TT_Z.NAV)} mx-auto mb-2 flex max-w-5xl flex-wrap items-center justify-between gap-2 rounded-lg border border-ref-sun/28 bg-ink-900/95 px-3 py-2 text-meta text-slate-200 shadow-[0_8px_24px_-8px_rgba(252,164,124,0.18)] backdrop-blur-md`;

export const TT_BRIEF_BADGE_LIVE_L5_CLASS = "border-ref-sun/40 bg-ref-sun/12 text-ref-sun";

export const TT_VIEWPORT_INK_L5 = {
  rootClass: `pointer-events-none fixed inset-0 ${ttZClass(TT_Z.VIEWPORT_INK)} motion-reduce:hidden`,
  wingClass: "pointer-events-none absolute inset-y-0 bg-[#0c0a09]",
  wingLeftClass:
    "pointer-events-none absolute inset-y-0 left-0 w-[max(0px,calc((100vw-min(100vw,80rem))/2))] bg-gradient-to-r from-[#0c0a09] via-[#0c0a09]/96 to-transparent",
  wingRightClass:
    "pointer-events-none absolute inset-y-0 right-0 w-[max(0px,calc((100vw-min(100vw,80rem))/2))] bg-gradient-to-l from-[#0c0a09] from-35% via-[#0c0a09]/88 to-transparent",
  heroSplitFeatherClass:
    "pointer-events-none absolute inset-y-0 z-[1] hidden w-16 bg-gradient-to-r from-transparent via-[#0c0a09]/55 to-[#0c0a09]/88 lg:block lg:left-[calc(100%-var(--tt-hero-split-canvas-right,28rem)-2rem)]",
  wingWidthClass: "w-[max(0px,calc((100vw-min(100vw,80rem))/2))]",
} as const;

export const TT_HERO_REDUCE_MOTION_STARS_L5 = {
  warmPulseDuration: 7,
  warmPulseRepeat: 0 as const,
  warmOpacityRange: [0.88, 1, 0.88] as const,
  twinkleRepeat: 0 as const,
  twinkles: [
    { left: "22%", top: "18%", duration: 2.4, delay: 0 },
    { left: "61%", top: "26%", duration: 3.1, delay: 0.8 },
    { left: "78%", top: "52%", duration: 2.8, delay: 1.4 },
  ] as const,
} as const;

/**
 * 与 `TT_MARKETING_TRAVELTRUST_HERO_SECTION_LAYOUT`（marketingUi）`min-h-[min(100svh,900px)]` 同源。
 * sky-cap / DOM veil / sky-wash 止点须 ≥ 此高度，否则 WebGL 冷色天幕从透明 `#hero` 底部渗出（长条蓝带）。
 */
export const TT_HERO_VIEWPORT_INK_HEIGHT_CLASS =
  "h-[min(100svh,900px)] max-[390px]:h-[min(94svh,800px)]";

/** 盖住固定 Canvas 上方 WebGL 青蓝天幕（非地球 mesh · 与 `#0c0a09` 同键） */
export const TT_CANVAS_HERO_SKY_CAP_L5 = {
  heightClass: TT_HERO_VIEWPORT_INK_HEIGHT_CLASS,
  background: TT_CINEMATIC_PAGE_INK_HEX,
  heroFadeEnd: 0.72,
  stackClass: "pointer-events-none absolute inset-x-0 top-0 z-[6]",
} as const;

/**
 * Hero 区块顶暖墨幕（TT_Z.HERO_SKY 子层 · **高于** 固定 Canvas TT_Z.CANVAS）。
 * 压住 WebGL 上半屏冷色/青紫空域；下缘渐变露出地球。
 */
/** Hero 首屏：整块暖墨顶域（**纯色** · 避免 52vh 渐透缝露 WebGL 青紫） */
export const TT_HERO_SKY_VEIL_UNIFIED_L5 = {
  rootClass: "pointer-events-none absolute inset-x-0 top-0 z-[1]",
  heightClass: TT_HERO_VIEWPORT_INK_HEIGHT_CLASS,
  background: TT_CINEMATIC_PAGE_INK_HEX,
} as const;

/** @deprecated 合并为 `TT_HERO_SKY_VEIL_UNIFIED_L5` */
export const TT_HERO_TOP_INK_VEIL_L5 = TT_HERO_SKY_VEIL_UNIFIED_L5;

/** @deprecated 合并为 `TT_HERO_SKY_VEIL_UNIFIED_L5` + `TT_HERO_EQUATOR_INK_STRIP_L5` */
export const TT_HERO_MID_INK_VEIL_L5 = {
  rootClass: "pointer-events-none absolute inset-x-0 z-[2]",
  topClass: "top-[32vh]",
  heightClass: "h-[min(30vh,320px)]",
  background: `linear-gradient(to bottom, transparent 0%, rgba(12,10,9,0.58) 28%, rgba(12,10,9,0.92) 50%, rgba(12,10,9,0.58) 72%, transparent 100%)`,
} as const;

/** 固定赤道条（TT_Z.HERO_SKY · 全宽压中间横带；deprecated · 与 sky-wash 同层） */
export const TT_HERO_EQUATOR_INK_STRIP_L5 = {
  rootClass: `pointer-events-none fixed inset-x-0 ${ttZClass(TT_Z.HERO_SKY)} motion-reduce:hidden`,
  topClass: "top-[36vh]",
  heightClass: "h-[min(30vh,340px)]",
  background: TT_CINEMATIC_PAGE_INK_HEX,
  bleedShadow: "0 -6px 0 0 #0c0a09, 0 6px 0 0 #0c0a09",
} as const;

/**
 * 固定天幕：纯遮罩 — 0–32vh 实心暖墨，36vh 起全透明（无长 alpha 混合）。
 */
export const TT_HERO_SKY_WASH_L5 = {
  rootClass: `pointer-events-none fixed inset-0 ${ttZClass(TT_Z.HERO_SKY_WASH)} motion-reduce:hidden`,
  background: TT_CINEMATIC_PAGE_INK_HEX,
  gradient:
    "linear-gradient(to bottom, #0c0a09 0%, #0c0a09 min(32vh, 360px), transparent min(36vh, 400px))",
} as const;

/** @deprecated 合并为 `TT_HERO_SKY_WASH_L5` */
export const TT_HERO_FIXED_INK_MASK_L5 = {
  rootClass: TT_HERO_SKY_WASH_L5.rootClass,
  topPlateClass: TT_HERO_SKY_WASH_L5.rootClass,
  background: TT_HERO_SKY_WASH_L5.background,
} as const;

/**
 * Hero 上沿全宽暖墨板（DOM · z 在 #hero 内）。
 * 止点在地球光学顶缘附近（≈56vh），避免左栏整屏实心盖住球体，也避免透明 hero 露出根壳 #0b1220。
 */
export const TT_HERO_DOM_SKY_VEIL_UNIFIED_L5 = {
  rootClass:
    "pointer-events-none absolute inset-x-0 top-0 z-[0] h-[min(56vh,620px)] max-[390px]:h-[min(52vh,540px)] bg-[#0c0a09] motion-reduce:hidden",
} as const;

export const TT_CANVAS_LAYER_L5 = {
  heroBridgeShimmerDuration: 5.5,
  heroBridgeShimmerRepeat: 0 as const,
  warmBandOpacityFadeDuration: 0.35,
  heroBridgeShimmerClass:
    "pointer-events-none absolute inset-x-0 top-[28%] h-24 bg-[linear-gradient(90deg,transparent,rgba(252,164,124,0.1),transparent)]",
  scrollOpacityEnter: 1.2,
  scrollOpacitySettled: 0.35,
  overlayFadeDuration: 1.4,
  warmBandFadeDuration: 0.35,
  warmBandEase: TT_L5_MOTION_EASE,
} as const;

export const TT_HERO_CHAIN_HUD_L5 = {
  connectedDotClass: "bg-ref-sun",
  connectedChipClass: "border-ref-sun/22 bg-ref-sun/8 text-slate-100",
  connectedChipGlow: "shadow-[0_0_18px_-6px_rgba(252,164,124,0.45)]",
  dotPulseDuration: 2.2,
  dotPulseRepeat: 0 as const,
  entrance: { duration: 0.32, delay: 0.12 },
  switchButtonClass:
    "inline-flex min-h-[40px] items-center rounded-lg border border-ref-sun/38 bg-ref-sun/12 px-3 py-1.5 text-meta font-semibold text-ref-sun transition hover:bg-ref-sun/20 hover:shadow-[0_0_16px_-6px_rgba(252,164,124,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 disabled:opacity-60",
  wrongChipPulse: { duration: 1.8, opacity: [0.85, 1, 0.85] as const },
  wrongChipPulseRepeat: 0 as const,
  metaMutedClass: "text-slate-300/88",
  trustLinkClass:
    "text-meta font-medium text-slate-300 underline-offset-2 transition hover:-translate-y-0.5 hover:text-ref-sun hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  startLinkClass: "font-semibold text-ref-sun underline-offset-2 transition hover:text-ref-coral hover:underline",
  linkHover: { y: -1 },
  switchTap: { scale: 0.98 },
} as const;

export const TT_HERO_GUIDANCE_L5 = {
  panelClass:
    "mt-4 w-full rounded-xl border border-ref-sun/28 bg-ink-950/55 px-4 py-3 text-left shadow-[0_8px_24px_-10px_rgba(252,164,124,0.15)] backdrop-blur-sm",
  entrance: { duration: 0.35, delay: 0.05 },
  itemStagger: 0.08,
  itemEntrance: { duration: 0.28, ease: TT_L5_MOTION_EASE },
  linkClass:
    "shrink-0 text-meta font-semibold text-ref-sun underline-offset-2 transition hover:-translate-y-0.5 hover:text-ref-coral hover:underline hover:shadow-[0_0_12px_-8px_rgba(252,164,124,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0",
  panelBorderPulse: { duration: 0.85, opacity: [0.7, 1, 0.7] as const, repeat: 0 as const },
} as const;

export const TT_WEBGL_FALLBACK_L5 = {
  panelClass:
    "pointer-events-auto fixed inset-x-0 top-[calc(5.75rem+env(safe-area-inset-top,0px))] z-[31] mx-auto flex max-w-md flex-col items-center gap-2 px-4 text-center",
  bodyClass: "relative text-meta leading-relaxed text-slate-100/95",
  cardClass:
    "relative overflow-hidden rounded-xl border border-ref-sun/22 bg-ink-950/88 px-4 py-3 shadow-[0_12px_40px_-12px_rgba(252,164,124,0.35)] backdrop-blur-md",
  cardBorderPulse: { duration: 4.2, opacity: [0.55, 1, 0.55] as const },
  cardBreathDuration: 4,
  cardBreathRepeat: 0 as const,
  cardBorderPulseRepeat: 0 as const,
  buttonHover: { y: -1 },
  buttonTap: { scale: 0.98 },
  entrance: { duration: 0.4, ease: TT_L5_MOTION_EASE },
  recoveryMotion: { delay: 0.15, duration: 0.32, ease: TT_L5_MOTION_EASE },
  primaryButtonClass:
    "rounded-md border border-ref-sun/18 bg-ref-sun/[0.06] px-3 py-1.5 text-meta font-medium text-slate-100 transition hover:border-ref-sun/35 hover:bg-ref-sun/12 hover:text-ref-sun hover:shadow-[0_0_14px_-6px_rgba(252,164,124,0.28)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
  retryButtonClass:
    "rounded-md border border-ref-sun/32 bg-ref-sun/10 px-3 py-1.5 text-meta font-medium text-ref-sun transition hover:bg-ref-sun/18 hover:shadow-[0_0_14px_-6px_rgba(252,164,124,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
} as const;

export const TT_HERO_WALLET_L5 = {
  anchor: "hero-wallet-connect",
  menuPanelClass:
    "absolute left-1/2 top-full z-50 mt-2 min-w-[min(100%,14rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-ref-sun/20 bg-ink-900/98 py-2 shadow-[0_12px_40px_-12px_rgba(252,164,124,0.35)] backdrop-blur-xl sm:left-0 sm:translate-x-0",
  menuShimmerClass:
    "pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_42%,rgba(255,255,255,0.05)_50%,transparent_58%)]",
  menuShimmerDuration: 1.1,
  menuShimmerRepeat: 0 as const,
  menuItemClass:
    "w-full px-3 py-2.5 text-left text-small text-slate-100 transition hover:bg-ref-sun/10 hover:text-white focus:outline-none focus-visible:bg-ref-sun/12",
  menuEntrance: { duration: 0.22, ease: TT_L5_MOTION_EASE },
  connectButtonPulse: { duration: 0.9, repeat: 0 as const },
  connectedCardClass:
    "flex w-full flex-col items-stretch gap-2 rounded-xl border border-ref-sun/18 bg-ref-sun/[0.04] p-1 shadow-[0_0_20px_-10px_rgba(252,164,124,0.3)]",
  connectedCardPulse: { duration: 0.85, opacity: [0.85, 1, 0.85] as const, repeat: 0 as const },
} as const;

/** 减动效 Hero 静态星野（替代 WebGL · 非地球 3D） */
export const TT_HERO_REDUCE_MOTION_STARS_L5_BG = [
  "radial-gradient(ellipse 62% 52% at var(--tt-hero-globe-optical-x,34%) 40%, rgba(252,164,124,0.12) 0%, transparent 68%)",
  "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.07) 0%, transparent 42%)",
  "radial-gradient(circle at 72% 28%, rgba(255,200,150,0.06) 0%, transparent 38%)",
  "radial-gradient(circle at 48% 78%, rgba(12,10,9,0.55) 0%, transparent 55%)",
  "radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.35), transparent)",
  "radial-gradient(1px 1px at 28% 62%, rgba(255,255,255,0.22), transparent)",
  "radial-gradient(1px 1px at 44% 34%, rgba(255,255,255,0.28), transparent)",
  "radial-gradient(1px 1px at 58% 72%, rgba(255,255,255,0.18), transparent)",
  "radial-gradient(1px 1px at 76% 44%, rgba(255,255,255,0.24), transparent)",
  "radial-gradient(1px 1px at 88% 22%, rgba(255,255,255,0.2), transparent)",
  "linear-gradient(180deg, #0c0a09 0%, #0a0908 48%, #0c0a09 100%)",
].join(", ");
