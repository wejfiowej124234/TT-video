/**
 * 全页电影动画 L5 · 非地球轨（`TT-CINEMATIC-L5-2026-05` · ①）
 * Hero 地球已锁死 — 本文件为滚动/剧场/#start/Trust 等增量 token 与 resolver。
 */

import type { TravelTrustRoleId } from "@/app/traveltrust/traveltrustIdentityModel";
import { smoothstep } from "@/components/traveltrust/cinematic/traveltrustCinematicEasing3d";
import {
  resolveCinematicCanvasCyanMul,
  resolveCinematicCorridorRingReveal,
  resolveCinematicEnvironmentOpacity,
  resolveCinematicEnvironmentVisible,
  resolveCinematicScrollWarmBandPeak,
} from "@/lib/traveltrustCinematicPageL5";
import {
  buildPageCinematicCanvasOverlayLayers,
  type PageCinematicOverlayParams,
} from "@/lib/traveltrustCinematicVisual";
import { TT_Z, ttZClass } from "@/lib/traveltrustZ";

/** Hero / Canvas / 页面壳：暖墨底（与 layout、`TT_CINEMATIC_3D_BG` 一致） */
export const TT_CINEMATIC_PAGE_INK_HEX = "#0c0a09";
export const TT_CINEMATIC_PAGE_DEPTH_HEX = "#0a0908";

export const TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID = "TT-CINEMATIC-L5-NON-GLOBE-2026-05" as const;

/** ① 代码批次台账（A–W）；不含 §6.2 maintainer 签字 */
export const TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_BATCHES = "A-W" as const;

/** ① 工程锁：可编码清单已收口；后续仅为目视 / ②③ defer / 像素修补 */
export const TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ENGINEERING_LOCK = "2026-05-20" as const;

/** L5 闭卷：非地球模块均已挂此 data 锚点（§L5-4） */
export const TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_MODULES = [
  "scroll-handoff",
  "theater",
  "start",
  "trust",
  "faq",
  "settlement",
  "pulse",
  "scroll-progress",
  "below-fold-atmosphere",
  "horizon-arc",
  "section-divider",
  "cinematic-shell",
  "below-fold-sections",
  "hero-film-chrome",
  "hero-scroll-hint",
  "landing-nav",
  "reduced-motion-notice",
  "webgl-fallback",
  "hero-chain-hud",
  "hero-guidance",
  "page-horizon-fog",
  "legacy-3d-content",
  "corridor-ring-warm",
  "pulse-ticker-motion",
  "landing-chrome-motion",
  "stablecoin-ambient",
  "hero-wallet",
  "cinematic-quality-toggle",
  "brief-badge-live",
  "theater-role-cta",
  "canvas-warm-band-pulse",
  "start-section-cta",
  "stablecoin-cta-motion",
  "illustrative-badge-preview",
  "page-compliance-entrance",
  "scroll-chapter-glow",
  "network-footer",
  "footer-cross-nav",
  "footer-social-traveltrust",
  "dev-chunk-notice",
  "below-fold-atmosphere-pulse",
  "hero-reduce-motion-stars-pulse",
  "hero-chain-hud-actions",
  "hero-guidance-panel-pulse",
  "pulse-ticker-item-hover",
  "hero-cta-motion",
  "hero-scroll-handoff-mobile",
  "theater-tab-tap",
  "start-route-card-shimmer",
  "role-video-play-cta",
  "role-video-frame-pulse",
  "faq-trigger-tap",
  "trust-facts-card-tap",
  "settlement-cta-tap",
  "horizon-ambient-shimmer",
  "illustrative-badge-all-variants",
  "trust-facts-cards",
  "settlement-protocol",
  "theater-tabs",
  "route-arc-motion",
  "canvas-static-fallback",
  "hero-horizon-entrance",
  "scroll-progress-chrome",
  "start-route-preview",
  "role-video-motion",
  "canvas-layer-fade",
  "hero-copy-ui",
  "below-fold-atmosphere-fade",
  "section-motion",
  "landing-nav-link-tap",
  "landing-nav-mobile-toggle",
  "page-compliance-border-pulse",
  "start-ghost-cta-tap",
  "hero-trust-chip-hover",
  "footer-cross-nav-tap",
  "theater-3d-opacity-ramp",
  "scroll-chapter-section-sync",
  "scroll-snap-chapter-y",
  "start-footer-divider-unified",
  "theater-route-labels-edge",
  "role-video-warm-play-halo",
  "start-route-single-step-caption",
  "start-tail-atmosphere",
  "stablecoin-amount-locked-warm",
  "hero-theater-handoff-scrim",
  "theater-top-cap",
  "role-video-poster-warm-grade",
  "start-route-path-glow",
  "below-hero-ink-bridge",
  "below-fold-scroll-plate",
  "section-film-divider-handoff",
  "section-surface-warm-unified",
  "scroll-progress-warm-chrome",
  "trust-faq-liquidity-surface",
  "role-video-warm-idle-frame",
  "theater-tab-warm-idle",
  "start-fee-panel-warm-divider",
  "landing-nav-warm-chrome",
  "footer-cross-nav-warm-divider",
  "reduced-motion-dismiss-warm",
  "network-footer-ambience",
  "route-arc-theater-flow-boost",
  "landing-chrome-border-shimmer",
  "webgl-fallback-warm-recovery",
  "hero-wallet-menu-shimmer",
  "dev-chunk-notice-warm-buttons",
  "brief-badge-demo-pulse",
  "start-cta-stack-entrance",
  "compliance-details-warm-open",
  "scroll-hint-mobile-pulse",
  "horizon-ground-glow",
  "below-fold-placeholder-warm-core",
  "start-cta-primary-pulse",
  "hero-cta-primary-pulse",
  "canvas-hero-bridge-shimmer",
  "hero-stars-twinkle",
  "illustrative-badge-ring-pulse",
  "theater-cta-motion-tokens",
  "settlement-protocol-open-glow",
  "footer-trust-details-warm",
  "interaction-hover-tap-unified",
] as const;

/** 非地球 L5 · 已 token 化动效的组件文件名（契约扫尾） */
export const TRAVELTRUST_CINEMATIC_NON_GLOBE_ANIMATED_FILES = [
  "TravelTrustCinematicHero.tsx",
  "TravelTrustBelowFoldAtmosphere.tsx",
  "TravelTrustRouteArc.tsx",
  "TravelTrustStablecoinGateway.tsx",
] as const;

/** 非地球 L5 工程收口日（① · 代码 complete） */
export const TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_CODE_COMPLETE_AT = "2026-05-20";

/** #start 三步与示意动线卡同步周期（ms） */
export const TT_START_STEP_CYCLE_MS = 2800;

/** 暖色走廊 SVG 渐变（末端无冷青/teal） */
export const TT_WARM_ROUTE_ARC_SVG = {
  stop0: "rgba(252, 164, 124, 0)",
  stop35: "rgba(255, 232, 212, 0.52)",
  stop65: "rgba(252, 164, 124, 0.42)",
  stop100: "rgba(255, 200, 150, 0)",
} as const;

/** 角色剧场 UI 暖色 accent（覆盖 identity 冷青 tab，仅本页剧场） */
export const TT_THEATER_ROLE_WARM_UI: Record<
  TravelTrustRoleId,
  { tabActive: string; ring: string; glow: string; flash: string; gradient: string }
> = {
  traveler: {
    tabActive: "border-ref-sun/45 bg-ref-sun/10 text-ref-sun",
    ring: "ring-ref-sun/40",
    glow: "shadow-[0_0_48px_-8px_rgba(252,164,124,0.38)]",
    flash: "bg-ref-sun/12",
    gradient: "from-ref-sun/85 to-ref-coral/75",
  },
  guide: {
    tabActive: "border-ref-coral/50 bg-ref-coral/10 text-ref-coral",
    ring: "ring-ref-coral/45",
    glow: "shadow-[0_0_48px_-8px_rgba(255,140,90,0.35)]",
    flash: "bg-ref-coral/12",
    gradient: "from-ref-coral/80 to-ref-sun/70",
  },
  merchant: {
    tabActive: "border-amber-300/45 bg-amber-300/10 text-amber-200",
    ring: "ring-amber-300/40",
    glow: "shadow-[0_0_48px_-8px_rgba(251,191,36,0.32)]",
    flash: "bg-amber-300/10",
    gradient: "from-amber-200/80 to-ref-sun/70",
  },
  acquisition: {
    tabActive: "border-violet-400/45 bg-violet-400/10 text-violet-200",
    ring: "ring-violet-400/38",
    glow: "shadow-[0_0_48px_-8px_rgba(167,139,250,0.28)]",
    flash: "bg-violet-400/10",
    gradient: "from-violet-300/75 to-fuchsia-400/50",
  },
  region_steward: {
    tabActive: "border-ref-teal/50 bg-ref-teal/12 text-teal-200",
    ring: "ring-ref-teal/42",
    glow: "shadow-[0_0_48px_-8px_rgba(45,212,191,0.28)]",
    flash: "bg-ref-teal/12",
    gradient: "from-ref-teal/80 to-emerald-400/60",
  },
};

export const TT_L5_MOTION_EASE = [0.22, 1, 0.36, 1] as const;

export const TT_ROLE_VIDEO_L5 = {
  crossfadeDuration: 0.38,
  flashPeakOpacity: 0.14,
  flashClass: "bg-ref-sun/10",
  flashDuration: 0.1,
  posterWarmGradeClass:
    "pointer-events-none absolute inset-0 z-[2] bg-[linear-gradient(165deg,rgba(252,164,124,0.38)_0%,rgba(40,28,22,0.32)_48%,rgba(12,10,9,0.48)_100%)] mix-blend-soft-light",
  posterWarmVignetteClass:
    "pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_85%_70%_at_50%_42%,transparent_48%,rgba(12,10,9,0.22)_100%)]",
  placeholderShellClass:
    "absolute inset-0 z-[1] overflow-hidden bg-gradient-to-br from-[#2e2218] via-[#1c1510] to-[#100c0a]",
  videoWarmGradeClass:
    "pointer-events-none absolute inset-0 z-[3] bg-[linear-gradient(165deg,rgba(252,164,124,0.18)_0%,rgba(28,20,16,0.22)_45%,rgba(12,10,9,0.35)_100%)] mix-blend-soft-light",
  placeholderGradientOverlayClass: "absolute inset-0 bg-gradient-to-br opacity-[0.32]",
  placeholderCopyClass:
    "absolute inset-0 z-[2] flex flex-col items-center justify-center gap-2.5 px-5 text-center sm:gap-3 sm:px-6",
  placeholderRoleTitleClass: "text-small font-semibold text-ref-sun/95 sm:text-base",
  placeholderHintClass: "max-w-[16rem] text-meta leading-relaxed text-slate-300/92",
  placeholderTourismBadgeClass:
    "rounded-full border border-ref-sun/28 bg-ref-sun/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ref-sun/90",
  placeholderTourismHintClass: "max-w-[20rem] text-meta leading-relaxed text-slate-200/92 sm:max-w-[22rem]",
  placeholderGridClass:
    "pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(252,164,124,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(252,164,124,0.06)_1px,transparent_1px)] [background-size:24px_24px]",
  panelRotateDuration: 0.45,
  panelShellClass: "overflow-hidden rounded-2xl isolate [transform-origin:center_center]",
  /** 16:9 画框；禁止 sm+ aspect-auto + 50–58vh min-h（会变成竖长「手机屏」） */
  frameClass:
    "relative aspect-video w-full max-h-[min(56vh,480px)] overflow-hidden rounded-2xl border bg-ink-950/80 max-lg:max-h-[min(52vw,280px)]",
  mediaCoverClass: "h-full w-full object-cover",
  panelScrimClass:
    "pointer-events-none absolute inset-0 z-[5] bg-[linear-gradient(to_bottom,rgba(12,10,9,0.42)_0%,transparent_22%,transparent_78%,rgba(12,10,9,0.52)_100%)]",
  panelWarmLiftClass:
    "pointer-events-none absolute inset-0 z-[4] bg-[radial-gradient(ellipse_88%_72%_at_50%_38%,rgba(252,164,124,0.14)_0%,transparent_62%)] mix-blend-soft-light",
  panelHoverLift: { y: -3 },
  posterFadeDuration: 0.32,
  posterKenBurnsDuration: 20,
  posterShimmerDuration: 5.2,
  posterShimmerRepeat: 0 as const,
  posterShimmerRepeatDelay: 4.8,
  playCtaPulseDuration: 0.85,
  playCtaPulseRepeat: 0 as const,
  playHaloDuration: 1.1,
  playHaloOpacity: [0.38, 0.72, 0.38] as const,
  playHaloRepeat: 0 as const,
  playHaloClass:
    "pointer-events-none absolute h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(252,164,124,0.42)_0%,rgba(255,140,90,0.12)_42%,transparent_72%)] blur-md",
  frameBorderPulse: { duration: 3.2, opacity: [0.45, 0.95, 0.45] as const },
  idleFrameBorderClass: "border-ref-sun/16",
  playCtaClass:
    "relative flex h-16 w-16 items-center justify-center rounded-full border border-ref-sun/35 bg-ink-900/72 text-ref-sun/95 shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-ref-sun/40 backdrop-blur-md transition hover:scale-105 hover:border-ref-sun/55 hover:bg-ref-sun/10 hover:shadow-[0_0_28px_-8px_rgba(252,164,124,0.45)] motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55",
  posterKenBurnsRepeat: 0 as const,
  placeholderPulseDuration: 4.8,
  placeholderRouteOpacity: 0.14,
  placeholderFrameClass:
    "pointer-events-none absolute inset-[12%] rounded-xl border border-ref-sun/16 bg-[linear-gradient(145deg,rgba(252,164,124,0.09)_0%,rgba(28,20,16,0.48)_48%,rgba(12,10,9,0.68)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
  placeholderPinClass:
    "pointer-events-none absolute left-[18%] top-[22%] h-3 w-3 rounded-full border-2 border-ref-sun/70 bg-ref-sun/35 shadow-[0_0_12px_rgba(252,164,124,0.45)]",
  placeholderPhotoClass:
    "pointer-events-none absolute right-[14%] bottom-[20%] h-[38%] w-[32%] max-w-[9rem] rounded-lg border border-ref-sun/18 bg-[#1a1410]/80 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.55)]",
  placeholderPathRepeat: 0 as const,
  placeholderPathDrawDuration: 2.2,
  placeholderDashOffsetDuration: 8,
  placeholderSecondaryPathDuration: 2.8,
} as const;

/** 3D 走廊环：压低冷色角色色混入（保持旅游暖主色） */
export const TT_CORRIDOR_RING_L5 = {
  roleColorBlend: 0.16,
  roleColorBlendLerp: 0.05,
  primaryLineWidth: 1.35,
  glowLineWidth: 2.8,
  glowOpacityMul: 0.22,
  primaryOpacityMul: 0.78,
  chordLineWidth: 1.45,
  chordOpacityMul: 1.22,
} as const;

/** 星空/尘粒：滚入剧场额外衰减 */
export const TT_ENVIRONMENT_L5_EXTRA = {
  rolesPageFadeStart: 0.16,
  rolesPageFadeEnd: 0.52,
  rolesPageFadeMul: 0.98,
  heroMidFadeStart: 0.32,
  heroMidFadeEnd: 0.68,
  heroMidFadeMul: 0.78,
  rolesHideStarsPageT: 0.52,
  minStarSpeed: 0.04,
  maxStarSpeed: 0.28,
} as const;

/** Hero 底缘地平线（与冻结 token 同值 · 非地球组件直引） */
export const TT_HORIZON_ARC_L5 = {
  gradStop0: "rgb(252, 164, 124)",
  gradStop50: "rgb(255, 140, 90)",
  gradStop100: "rgb(255, 200, 150)",
  fillBase: "rgba(20,16,13,0.58)",
  fillTopOpacity: 0,
  fillMidOpacity: 0.72,
  fillBottomOpacity: 0.88,
  travelerGlow: "rgba(252,164,124,0.75)",
  entranceDuration: 0.8,
  entranceEase: TT_L5_MOTION_EASE,
  strokePulseDuration: 8,
  strokeOpacityRange: [0.72, 0.98] as const,
  glowStrokeWidth: 4,
  ambientShimmerDuration: 5.6,
  ambientShimmerOpacity: [0.2, 0.42, 0.2] as const,
  ambientShimmerRepeat: 0 as const,
  strokePulseRepeat: 0 as const,
  groundGlowPulse: { duration: 5.2, opacity: [0.35, 0.75, 0.35] as const },
  groundGlowRepeat: 0 as const,
  travelers: [
    { left: "15%", bottom: "1.5rem", duration: 14, delay: 0 },
    { left: "48%", bottom: "2rem", duration: 18, delay: 2.5 },
    { left: "72%", bottom: "1.25rem", duration: 16, delay: 5 },
  ] as const,
  groundGlowClass:
    "pointer-events-none absolute inset-x-[10%] bottom-0 h-8 bg-[radial-gradient(ellipse_80%_100%_at_50%_100%,rgba(252,164,124,0.22),transparent_70%)]",
} as const;

/**
 * 长页垂直节奏 SSOT（企业叙事流 · 8px 网格）
 * 同主题簇（兑换·信任·结算）用 cluster*；大转折仅用 padding（全页 ≤2 处 Film 软过渡 · 见 `TT_PAGE_SPACING_AUDIT_L5`）。
 * **首页布局已锁定** · 变更须同步 `TRAVELTRUST_HOME_LAYOUT_LOCK_L5` + `traveltrustHomeLayoutLockL5.test.ts`。
 */
export const TT_PAGE_VERTICAL_RHYTHM_L5 = {
  /** 标准独立大节：FAQ / 启程 */
  sectionY: "py-8 sm:py-9",
  /** 紧凑节（单节默认） */
  sectionYCompact: "py-6 sm:py-8",
  /** 经济簇首段：兑换网关（与剧场底 + Film 缝叠层，勿再大 pt） */
  sectionClusterFirst: "pt-6 sm:pt-7 pb-4 sm:pb-5",
  /** 经济簇中段：可核对的事实 */
  sectionClusterMid: "py-4 sm:py-5",
  /** 经济簇末段：结算 */
  sectionClusterLast: "pt-4 sm:pt-5 pb-6 sm:pb-8",
  /** 大转折后首段（FAQ） */
  sectionAfterMajorBreak: "pt-6 sm:pt-8 pb-6 sm:pb-8",
  /** 剧场节底：与兑换簇衔接 */
  sectionBottomTheater: "pb-6 sm:pb-8",
  /** @deprecated 用 sectionCluster* */
  sectionBottomLiquidity: "pb-5 sm:pb-6",
  sectionTopTrust: "py-5 sm:py-6",
  sectionBottomSettlement: "pb-8 sm:pb-9",
  sectionTopFaq: "pt-7 sm:pt-8",
  sectionBottomFaq: "pb-7 sm:pb-8",
  sectionTopStart: "pt-6 sm:pt-8",
  sectionYStart: "scroll-mt-28 pb-6 sm:pb-8",
  headerStackGap: "mt-4 sm:mt-5",
  headingToIntro: "mt-3 max-w-3xl",
  contentStackGap: "mt-5 sm:mt-6",
  contentStackGapTight: "mt-4 sm:mt-5",
  faqListGap: "space-y-3.5 sm:space-y-4",
  settlementCtaRow:
    "mt-5 flex w-full flex-wrap items-stretch justify-center gap-4 sm:mt-6 sm:gap-5 lg:max-w-3xl lg:justify-center lg:mx-auto [&_a]:flex-1 [&_a]:sm:flex-none [&_a]:sm:min-w-[11rem]",
  heroChromeMinH: "min-h-[2.5rem] sm:min-h-[2.625rem]",
  liquidityMaxWidth: "max-w-3xl",
  disclaimerAfterGrid: "mt-6 sm:mt-7",
  startStepsToPreview: "mt-7 sm:mt-8",
  complianceShell: "relative mt-8 w-full border-t-0 pt-0 pb-4 sm:mt-10 sm:pb-5",
  complianceContent: "relative mx-auto w-full max-w-3xl px-0.5 sm:px-0 xl:max-w-5xl",
} as const;

/**
 * `/traveltrust` 叙事节距吸附（CSS scroll-snap · ①）
 * CSS / 滚轮步进默认**关闭**（`TravelTrustPageScrollSnap` 未挂载）。
 * 开发调试可临时挂载该组件；`?tt_snap=proximity` / `?tt_snap=0` 仍作用于 globals。
 */
export const TT_PAGE_SCROLL_SNAP_L5 = {
  htmlRootClass: "tt-traveltrust-scroll-snap-y",
  /** @deprecated 用 chapterBeatSnapClass；保留给旧引用 */
  sectionAlignClass: "scroll-snap-start snap-always",
  /** 叙事大节：顶对齐 + 滚轮优先停在该节（配合 `TT_PAGE_CHAPTER_VIEWPORT_L5.minHeightClass`） */
  chapterBeatSnapClass: "scroll-snap-start snap-always",
  /** 与 `TT_LANDING_CHROME_L5.shellClass` sticky top + 下行高度近似 */
  scrollPaddingTop: "calc(5.5rem + env(safe-area-inset-top, 0px))",
  chapterBeatDataAttr: "data-tt-traveltrust-scroll-chapter-beat",
  chapterBeatHero: "hero",
  chapterBeatTheater: "theater",
  chapterBeatLiquidity: "liquidity",
  chapterBeatTrust: "trust",
  chapterBeatSettlement: "settlement",
  /** @deprecated 已拆为 liquidity / trust / settlement；勿新引用 */
  chapterBeatEconomy: "economy",
  chapterBeatFaq: "faq",
  chapterBeatClose: "close",
} as const;

export type TraveltrustScrollChapterBeatId =
  | typeof TT_PAGE_SCROLL_SNAP_L5.chapterBeatHero
  | typeof TT_PAGE_SCROLL_SNAP_L5.chapterBeatTheater
  | typeof TT_PAGE_SCROLL_SNAP_L5.chapterBeatLiquidity
  | typeof TT_PAGE_SCROLL_SNAP_L5.chapterBeatTrust
  | typeof TT_PAGE_SCROLL_SNAP_L5.chapterBeatSettlement
  | typeof TT_PAGE_SCROLL_SNAP_L5.chapterBeatFaq
  | typeof TT_PAGE_SCROLL_SNAP_L5.chapterBeatClose;

/** 吸附章外壳（snap 关闭时仅用 flowShellClass） */
export const TT_PAGE_CHAPTER_VIEWPORT_L5 = {
  minHeightClass: "min-h-[100svh] min-h-[100dvh]",
  scrollMarginClass: "scroll-mt-28",
  gapAfterClass: "mb-[clamp(1.5rem,4vh,2.75rem)]",
  paddingYClass: "py-[clamp(2.5rem,6vh,4rem)] sm:py-[clamp(3rem,7vh,4.75rem)]",
  /** 普通滚动：无 100svh、无额外壳 padding */
  flowShellClass: "relative isolate mb-0 min-h-0 py-0",
  layoutCenterClass: "box-border flex flex-col justify-center",
  layoutStartClass: "box-border flex flex-col justify-start",
} as const;

/** 叙事流布局（无 snap · 与 `TT_PAGE_VERTICAL_RHYTHM_L5` 配套） */
export const TT_PAGE_SECTION_FLOW_L5 = {
  economyClusterClass: "relative flex flex-col gap-0",
  /** 经济簇唯一顶光（兑换/信任/结算不再各叠一层） */
  economyClusterAtmosphereClass:
    "pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(26rem,52vh)] bg-[radial-gradient(ellipse_72%_58%_at_50%_0%,rgba(252,164,124,0.07),transparent_72%)]",
} as const;

/** 合并章内子节间距（兑换→信任→结算；启程→页脚） */
export const TT_SNAP_CHAPTER_GROUP_L5 = {
  innerStackClass: "flex flex-col gap-0",
  innerSectionFirstClass: "pt-0",
  innerSectionClass: "py-8 sm:py-9",
  innerSectionTightClass: "py-6 sm:py-8",
  innerDividerClass:
    "pointer-events-none relative z-[0] my-6 h-px w-full bg-gradient-to-r from-transparent via-ref-sun/18 to-transparent sm:my-7",
} as const;

/** 叙事章外壳（默认 flow；fillViewport 仅调试 snap） */
export function ttTraveltrustSnapChapterShellClass(opts?: {
  align?: "center" | "start";
  /** 默认 false；true 时 100svh + snap 对齐 */
  fillViewport?: boolean;
  extra?: string;
}): string {
  const fillViewport = opts?.fillViewport ?? false;
  const v = TT_PAGE_CHAPTER_VIEWPORT_L5;
  if (!fillViewport) {
    return [v.flowShellClass, opts?.extra?.trim() ?? ""].filter(Boolean).join(" ");
  }
  const align = opts?.align ?? "center";
  const layout = align === "start" ? v.layoutStartClass : v.layoutCenterClass;
  const snapAlignClass =
    align === "start" ? "scroll-snap-start" : "scroll-snap-center";
  return [
    "relative isolate overflow-hidden",
    snapAlignClass,
    v.minHeightClass,
    v.gapAfterClass,
    v.paddingYClass,
    layout,
    opts?.extra?.trim() ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * 章内 `<section>` 或独立叙事节（剧场/FAQ 单节）
 * @param snap  true = 本节单独作为吸附停点（Hero/剧场）；合并章内置 false
 */
export function ttTraveltrustSnapSectionInnerClass(opts?: {
  snap?: boolean;
  align?: "center" | "start";
  padding?: "default" | "tight" | "none";
  extra?: string;
}): string {
  const snap = opts?.snap ?? false;
  const align = opts?.align ?? "start";
  const pad =
    opts?.padding === "none"
      ? ""
      : opts?.padding === "tight"
        ? TT_SNAP_CHAPTER_GROUP_L5.innerSectionTightClass
        : TT_SNAP_CHAPTER_GROUP_L5.innerSectionClass;
  const layout =
    align === "center"
      ? "flex flex-col justify-center"
      : "flex flex-col justify-start";
  return [
    "relative isolate overflow-hidden",
    snap ? TT_PAGE_SCROLL_SNAP_L5.chapterBeatSnapClass : "",
    snap ? TT_PAGE_CHAPTER_VIEWPORT_L5.scrollMarginClass : "",
    pad,
    layout,
    opts?.extra?.trim() ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** @deprecated 用 snapChapterShell / snapSectionInner */
export function ttTraveltrustChapterSectionClass(opts?: {
  align?: "center" | "start";
  extra?: string;
}): string {
  return ttTraveltrustSnapChapterShellClass(opts);
}

export function traveltrustChapterViewportDataAttrs(): Record<string, string> {
  return { "data-tt-traveltrust-scroll-chapter-viewport": "1" };
}

/** 顶栏滚动条 · 全暖色（无 teal 尾） */
/** 长页区块正文排版（与 PAGE_FRAME 对齐 · trust/faq/liquidity/settlement 共用） */
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

/** 长页平面环境光 · 旅游暖色（替代冷青/teal） */
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

export const TT_LANDING_NAV_MOBILE_L5 = {
  panelTransition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
} as const;

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

export const TT_LIQUIDITY_PAIR_L5 = {
  fromClass: "text-[#2775CA]",
  /** 收到侧为 TTG（治理代币），非第二枚稳定币 */
  toClass: "text-ref-sun",
  fieldBorderActive: "border-ref-sun/28",
} as const;

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

export const TT_THEATER_SECTION_L5 = {
  introBlockClass: "relative z-[3] mx-auto w-full max-w-3xl px-0.5 pt-1 sm:px-0 sm:pt-2",
  /** 眉题「角色剧场」与主标题之间：显式分线 + 企业级留白（勿贴标题） */
  introKickerClass: "mb-0",
  introHeadlineBlockClass: "mt-5 space-y-4 sm:mt-6 sm:space-y-5",
  introHeadlineClass: "max-w-3xl text-h3 font-bold text-white sm:text-h2",
  introSublineClass: "max-w-3xl text-small leading-relaxed text-slate-300",
  theaterPanelFrameClass:
    "relative min-w-0 overflow-hidden rounded-2xl border border-ref-sun/20 bg-gradient-to-b from-[#1c1612]/92 to-ink-950/96 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_40px_-16px_rgba(252,164,124,0.22)]",
  stageShellClass: "relative z-[3] mt-5 overflow-hidden [perspective:1600px] sm:mt-6 lg:mt-7",
  stageGridClass: "relative grid gap-5 lg:grid-cols-[minmax(0,12.5rem)_minmax(0,1fr)] lg:items-start lg:gap-6 xl:gap-7",
  panelStackClass: "relative z-[1] flex min-w-0 flex-col gap-4 lg:gap-5",
  roleMetaStackClass: "flex flex-col gap-3.5",
  roleCtaStackClass: "flex w-full flex-col gap-2.5 pt-0.5 sm:max-w-[22rem]",
  /** 吸附由外层 `TravelTrustSnapChapter` 承担；本节仅保留内容与 Hero 接缝 */
  sectionSurfaceClass: `relative isolate overflow-hidden -mt-[clamp(0.5rem,1.5vh,1.25rem)] pt-[clamp(1.75rem,4.5vh,2.75rem)] sm:pt-[clamp(2rem,5vh,3.25rem)] max-lg:[&_[data-tt-traveltrust-role-video]]:aspect-video ${TT_PAGE_VERTICAL_RHYTHM_L5.sectionBottomTheater}`,
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

/** Hero 首屏：Canvas overlay 仅外圈暖墨（mask 镂空球心 · 无冷青/杏光衬底） */
export function buildHeroOuterSkyCanvasOverlayLayers(globeOpticalX: string): string {
  return buildHeroOuterSkyWarmRingLayer(globeOpticalX);
}

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

export const TT_CINEMATIC_SHELL_L5_VIGNETTE =
  "radial-gradient(ellipse 92% 82% at var(--tt-hero-globe-optical-x, 24%) var(--tt-hero-globe-optical-y, 52%), transparent 58%, rgba(12,10,9,0.14) 100%), linear-gradient(90deg, transparent 0%, transparent 52%, rgba(12,10,9,0.08) 78%, rgba(12,10,9,0.22) 100%), linear-gradient(to bottom, transparent 0%, transparent 76%, rgba(252,164,124,0.04) 92%, rgba(252,164,124,0.07) 100%)";

export const TT_CINEMATIC_SHELL_L5 = {
  grainOpacityRange: [0.01, 0.018] as const,
  grainPulseDuration: 11,
  grainPulseRepeat: 0 as const,
  vignetteOpacityRange: [0.22, 0.28] as const,
  vignettePulseDuration: 14,
  vignettePulseRepeat: 0 as const,
} as const;

/** Legacy Hero 3D fallback（`UNIFIED_PAGE_3D=false`）· 暖色 scrim，无冷青 */
export const TT_LEGACY_HERO_3D_SCRIM_L5 =
  "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(252,164,124,0.14), transparent 68%)";

export const TT_LEGACY_THEATER_3D_L5 = {
  node: "#fca47c",
  line: "#ffd4a8",
  light: "#fca47c",
  rim: "#ffb86b",
  wrapperOpacityMin: 0.35,
  wrapperOpacityRange: 0.35,
  wrapperFadeDuration: 0.45,
  activeScalePulse: { duration: 4.5, scale: [1, 1.02, 1] as const },
} as const;

/** Legacy Hero 3D 内容（`UNIFIED_PAGE_3D=false` · 非旅游地球 mesh） */
export const TT_LEGACY_3D_CONTENT_L5 = {
  arcPrimary: "#fca47c",
  arcSecondary: "#ffd4a8",
  pulseSecondary: "#ffb86b",
  keyLight: "#fca47c",
  fillLight: "#fca47c",
  rimLight: "#ffd4a8",
} as const;

export const TT_PAGE_HORIZON_FOG_L5 = {
  color: "#ffe8d4",
  /** 平面雾易读成灰地板；handoff 改由 DOM 渐变承担（L5 · ①） */
  opacityPeakMul: 0,
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

/** 页脚 / 启程区块 · 子项逐一入场（第二张截图 · 逐列排序） */
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
  activePulseRepeat: Infinity as const,
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

/** 剧场走廊环角色色混入（暖色 hex · 替代冷青 ROLE_CINEMATIC_3D_COLORS） */
export const TT_THEATER_ROLE_WARM_3D_HEX: Record<
  TravelTrustRoleId,
  { primary: string; secondary: string; pulse: string }
> = {
  traveler: { primary: "#fca47c", secondary: "#ffd4a8", pulse: "#fff7ed" },
  guide: { primary: "#ff8c5a", secondary: "#ffb86b", pulse: "#fff5eb" },
  merchant: { primary: "#fbbf24", secondary: "#fcd34d", pulse: "#fffbeb" },
  acquisition: { primary: "#f0a878", secondary: "#ffd4a8", pulse: "#fff7ed" },
  region_steward: { primary: "#e8c96a", secondary: "#fbbf24", pulse: "#fffbeb" },
};

export const TT_PULSE_TICKER_L5 = {
  entranceDuration: 0.55,
  shimmerDuration: 3.2,
  sweepDuration: 5.5,
  marqueeDuration: 48,
  /** 顶栏 inline：慢速 marquee（大间距防叠字）；`prefers-reduced-motion` 时改静态横滑 */
  inlineUsesStaticScroll: false as const,
  inlineMarqueeDuration: 72,
  inlineMarqueeListClass:
    "flex w-max flex-nowrap shrink-0 items-center gap-10 pr-14 sm:gap-12 sm:pr-16 [isolation:isolate]",
  contentFadeDelay: 0.15,
  contentFadeDuration: 0.4,
  labelPulseDuration: 2.8,
  labelPulseRepeat: 0 as const,
  labelOpacityRange: [0.75, 1, 0.75] as const,
  itemHover: { y: -2 },
  itemTap: { scale: 0.98 },
  inlineLabelClass:
    "shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ref-sun/85",
  inlineShellClass: "w-full min-w-0 scroll-mt-28 overflow-hidden border-b-0 min-h-[2rem]",
  inlineRowClass: "flex w-full min-w-0 items-center gap-2 overflow-hidden px-0 py-0 sm:gap-2.5",
  inlineStaticListClass:
    "flex w-full min-w-0 snap-x snap-mandatory items-stretch gap-3 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3.5 [&::-webkit-scrollbar]:hidden",
  inlineStaticItemClass: "snap-start shrink-0 list-none",
  marqueeViewportClass:
    "relative min-h-[2.125rem] min-w-[8rem] flex-1 basis-0 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]",
  marqueeListClass:
    "flex w-max flex-nowrap shrink-0 items-center gap-8 pr-12 sm:gap-10 sm:pr-14 [isolation:isolate]",
  marqueeItemClass: "relative z-0 shrink-0 list-none [contain:layout] [isolation:isolate]",
  itemBodyClass: "max-w-[10.5rem] truncate text-white/95 sm:max-w-[12.5rem]",
  itemSeparatorClass: "shrink-0 text-ref-sun/35",
  itemDateClass: "hidden shrink-0 font-mono text-[10px] tabular-nums text-slate-200/88 sm:inline",
  itemClass:
    "inline-flex min-h-[1.875rem] w-max min-w-[10rem] shrink-0 items-center gap-2 whitespace-nowrap rounded-md border border-ref-sun/16 bg-ref-sun/[0.06] px-2.5 py-1 text-meta leading-none backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-ref-sun/32 hover:bg-ref-sun/10 hover:shadow-[0_0_16px_-6px_rgba(252,164,124,0.3)] motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-w-[11.5rem] sm:gap-2.5 sm:px-3 sm:py-1",
} as const;

/** 嵌入 landing chrome 的章节链接（更矮，与顶栏框同高） */
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
  pulseLayoutSpring: { type: "spring" as const, stiffness: 380, damping: 32 },
  /** 薄 HUD：贴在 L0 Header 下（含四链；小屏含 mobile nav rail） */
  shellClass:
    `sticky top-[calc(5.5rem+env(safe-area-inset-top,0px))] ${ttZClass(TT_Z.CONTENT)} mb-0 overflow-x-clip overflow-y-visible border-t border-ref-sun/10 border-b-0 bg-[#0c0a09] shadow-none sm:top-[calc(3rem+env(safe-area-inset-top,0px))]`,
  /** 始终双行：上行 LIVE + 章节 nav · 下行「项目动态」跑马灯（勿 xl 并排，防 LIVE/动态错位） */
  chromeRowClass:
    "relative isolate grid w-full min-h-0 grid-cols-1 grid-rows-[auto_auto] items-stretch gap-y-0 px-2 py-0 sm:px-3 sm:py-0.5",
  liveSlotClass: "flex shrink-0 items-center border-r border-ref-sun/18 pr-2 sm:pr-2.5",
  navSlotClass: "flex min-w-0 flex-1 items-center justify-end",
  toolbarToggleSlotClass: "flex shrink-0 items-center",
  pulseSlotClass:
    "flex min-h-[1.625rem] min-w-0 w-full items-center overflow-hidden border-t border-ref-sun/10 pt-0.5 pb-0.5 sm:min-h-[1.75rem] sm:pt-1",
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
  sectionHeaderClass: "mb-5 sm:mb-6",
  cardWrapClass: `mx-auto w-full ${TT_PAGE_VERTICAL_RHYTHM_L5.liquidityMaxWidth}`,
  titleClass: "mt-0 text-h4 font-bold text-slate-100 sm:text-h3",
  taglineClass: "mt-3 max-w-xl text-meta leading-relaxed text-slate-300/92",
  cardClass:
    "relative overflow-hidden rounded-xl border border-ref-sun/14 bg-ink-950/72 p-5 shadow-[0_0_40px_-18px_rgba(252,164,124,0.22)] backdrop-blur-md sm:p-6",
  cardBodyClass: "relative px-1 sm:px-2",
  fieldLabelClass: "mb-1.5 block text-meta text-slate-400/95",
  previewBannerClass:
    "flex flex-col gap-2 border-b border-amber-400/28 bg-gradient-to-r from-amber-950/50 via-amber-950/35 to-transparent px-5 py-4 sm:gap-2.5 sm:px-6 sm:py-4",
  previewBannerLeadClass: "flex w-full flex-wrap items-center gap-2.5 sm:gap-3",
  previewBannerLegalClass: "w-full text-meta leading-relaxed text-amber-100/90",
  previewBannerIconOnly: true,
  previewBannerPulse: { duration: 2.8, opacity: [0.92, 1, 0.92] as const },
  fieldActiveClass:
    "flex min-h-[3.25rem] w-full items-center gap-2 rounded-xl border border-ref-sun/28 bg-black/35 px-4 py-3 shadow-[0_0_20px_-12px_rgba(252,164,124,0.25)]",
  fieldIdleClass:
    "flex min-h-[3.25rem] w-full items-center gap-2 rounded-xl border border-ref-sun/14 bg-black/35 px-4 py-3",
  sectionSurfaceClass: TT_SECTION_SURFACE_L5.liquidity,
  /** @deprecated 经济簇顶光见 `TT_PAGE_SECTION_FLOW_L5.economyClusterAtmosphereClass` */
  atmosphereClass: "hidden",
  amountLockedHintClass: "relative mt-2 text-meta leading-relaxed text-slate-400/95",
  cardBodyStackClass: "relative space-y-5 px-1 pt-6 sm:space-y-6 sm:px-2 sm:pt-7",
  ctaStackClass:
    "relative mt-6 flex flex-col gap-4 sm:mt-7 sm:flex-row sm:flex-nowrap sm:items-center gap-x-8 sm:gap-x-10",
  ctaEscrowPrimaryClass:
    "inline-flex min-h-[48px] w-full items-center justify-center rounded-[var(--radius-lg)] border border-ref-sun/38 bg-gradient-to-r from-ref-sun/22 via-ref-sun/16 to-ref-sun/22 px-8 py-3 text-small font-bold text-white shadow-[0_8px_28px_-10px_rgba(252,164,124,0.38)] transition hover:-translate-y-0.5 hover:border-ref-sun/50 motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 sm:w-auto",
  previewBannerEntranceOnly: true,
  ctaConnectClass:
    "inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] border border-ref-sun/38 bg-ref-sun/14 px-6 py-3 text-small font-semibold text-ref-sun transition hover:-translate-y-0.5 hover:bg-ref-sun/24 hover:shadow-[0_0_20px_-8px_rgba(252,164,124,0.35)] motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50 disabled:opacity-60",
  ctaSwapClass:
    "inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] border border-amber-400/35 bg-amber-950/50 px-8 py-3 text-small font-semibold text-amber-50 transition hover:-translate-y-0.5 hover:border-amber-300/50 hover:bg-amber-900/55 hover:shadow-[0_0_18px_-8px_rgba(251,191,36,0.25)] motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
  ctaEscrowLinkClass:
    "inline-flex min-h-[48px] items-center justify-center rounded-[var(--radius-lg)] border border-ref-sun/16 bg-ref-sun/[0.04] px-6 py-3 text-small font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:border-ref-sun/32 hover:bg-ref-sun/8 hover:text-white hover:shadow-[0_0_14px_-8px_rgba(252,164,124,0.22)] motion-sub motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45",
  amountLockedClass:
    "flex min-h-[3.25rem] w-full cursor-not-allowed items-center rounded-xl border border-ref-sun/24 bg-black/35 px-4 py-3 font-mono text-small text-slate-200 outline-none ring-1 ring-inset ring-ref-sun/20 shadow-[0_0_20px_-14px_rgba(252,164,124,0.22)] transition focus-visible:border-ref-sun/45 focus-visible:ring-2 focus-visible:ring-ref-sun/35",
  amountFieldWrapClass: "relative mt-5 block w-full",
  disclaimerClass: "sr-only",
  amountLockedPulse: { duration: 0.75, opacity: [0.85, 1, 0.85] as const, repeat: 0 as const },
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
  ctaPrimaryPulse: { duration: 2.8, opacity: [0.38, 0.72, 0.38] as const, repeat: Infinity as const },
  previewColEntrance: { delay: 0.28, duration: 0.55 },
  stepSurfaceSpring: { type: "spring" as const, stiffness: 400, damping: 32 },
  ctaPrimaryPulseClass:
    "pointer-events-none absolute inset-0 rounded-[var(--radius-lg)] shadow-[0_0_28px_-6px_rgba(252,164,124,0.45)]",
} as const;

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

export const TT_CANVAS_MOBILE_L5 = {
  bloomMaxHeroT: 0.78,
  bloomMaxPageT: 0.42,
} as const;

export function resolveNonGlobeMobileBloomEnabled(
  isMobile: boolean,
  heroT: number,
  pageT: number,
  baseEnabled: boolean,
): boolean {
  if (!baseEnabled) return false;
  if (!isMobile) return true;
  return heroT < TT_CANVAS_MOBILE_L5.bloomMaxHeroT && pageT < TT_CANVAS_MOBILE_L5.bloomMaxPageT;
}

export function traveltrustSectionL5DataAttrs(sectionId: string): Record<string, string> {
  return {
    "data-tt-traveltrust-section-motion-l5": sectionId,
    "data-tt-traveltrust-spacing-section": sectionId,
    "data-tt-traveltrust-cinematic-non-globe-l5": TRAVELTRUST_CINEMATIC_NON_GLOBE_L5_ID,
  };
}

export function traveltrustChapterBeatDataAttrs(beat: TraveltrustScrollChapterBeatId): Record<string, string> {
  return { [TT_PAGE_SCROLL_SNAP_L5.chapterBeatDataAttr]: beat };
}

export function traveltrustSnapChapterBeatDataAttrs(
  chapterId: Exclude<TraveltrustScrollChapterBeatId, typeof TT_PAGE_SCROLL_SNAP_L5.chapterBeatHero>,
): Record<string, string> {
  return traveltrustChapterBeatDataAttrs(chapterId);
}

export function resolveTheaterRoleWarmUi(roleId: TravelTrustRoleId) {
  return TT_THEATER_ROLE_WARM_UI[roleId];
}

/** 滚动走廊环 · 角色 accent 暖色（非地球 · 不读冷青 3D 角色表） */
export function resolveTheaterRoleWarm3dHex(roleId: TravelTrustRoleId) {
  return TT_THEATER_ROLE_WARM_3D_HEX[roleId];
}

/** ① tier-1 角色媒体：强制暖色旅游占位，不播冷青 demo poster/mp4 */
export function prefersTheaterWarmPlaceholder(tier: "production" | "tier1-placeholder"): boolean {
  return tier === "tier1-placeholder";
}

/** 在冻结 resolver 之上叠加剧场段降噪 */
export function resolveNonGlobeEnvironmentOpacity(heroT: number, pageT: number): number {
  const base = resolveCinematicEnvironmentOpacity(heroT, pageT);
  const e = TT_ENVIRONMENT_L5_EXTRA;
  const rolesMul = 1 - smoothstep(e.rolesPageFadeStart, e.rolesPageFadeEnd, pageT) * e.rolesPageFadeMul;
  const heroMul = 1 - smoothstep(e.heroMidFadeStart, e.heroMidFadeEnd, heroT) * e.heroMidFadeMul;
  return base * rolesMul * heroMul;
}

export function resolveNonGlobeCorridorRingReveal(
  heroT: number,
  pageT: number,
  isMobile = false,
): number {
  const base = resolveCinematicCorridorRingReveal(heroT, pageT, false);
  const rolesBoost = smoothstep(0.22, 0.48, pageT) * 0.18;
  const deepFade = 1 - smoothstep(0.58, 0.86, pageT);
  const blended = Math.min(1, base + rolesBoost) * deepFade;
  if (isMobile) return Math.min(1, blended * 0.72);
  return blended;
}

/** 深滚（托管/FAQ/起步）时压暗固定 Canvas，避免 3D「舞台环」穿透正文 */
export function resolveNonGlobeDeepScrollCanvasInk(pageT: number): number {
  return smoothstep(0.68, 0.92, pageT);
}

/** 禁用 3D 地平线平面雾（灰地板穿帮 · 由 DOM/剧场背板接替） */
export function resolveNonGlobeHorizonFogOpacity(_heroT: number, _pageT: number): number {
  return 0;
}

/** 固定 Canvas 层整体透明度下限（与 scrollOpacity 联动） */
export function resolveNonGlobeCanvasScrollOpacity(pageT: number): number {
  return Math.max(0.08, 1 - smoothstep(0.72, 0.94, pageT));
}

/** 滚离 Hero 后进一步压冷青 Canvas scrim（FAQ/信任段归零 · P1-6） */
export function resolveNonGlobeCanvasCyanMul(heroT: number, pageT: number): number {
  if (pageT > 0.36) return 0;
  /** Hero 空域：关闭冷青电影 scrim，与 `#0c0a09` 同色 */
  if (heroT < 0.72) return 0;
  const base = resolveCinematicCanvasCyanMul(heroT, pageT);
  const extra = pageT * 0.38 + smoothstep(0.35, 0.7, heroT) * 0.14;
  return Math.min(0.1, Math.max(0, base - extra));
}

/** 暖色交接带：略抬剧场段峰值 */
export function resolveNonGlobeScrollWarmBandPeak(heroT: number, pageT: number): number {
  const base = resolveCinematicScrollWarmBandPeak(heroT, pageT);
  const rolesBoost = smoothstep(0.28, 0.52, pageT) * 0.16;
  return Math.min(1, base + rolesBoost);
}

/** 星空转速随环境透明度降低（剧场段降噪） */
export function resolveNonGlobeStarsSpeed(envOpacity: number): number {
  const e = TT_ENVIRONMENT_L5_EXTRA;
  return e.minStarSpeed + envOpacity * (e.maxStarSpeed - e.minStarSpeed);
}

export function resolveNonGlobeSectionAtmosphere(sectionId: string): string {
  return TT_SECTION_ATMOSPHERE_L5[sectionId] ?? TT_SECTION_ATMOSPHERE_L5.trust;
}

/** 剧场段完全隐藏星空（L5-2 压冷色环境） */
export function resolveNonGlobeEnvironmentVisible(heroT: number, pageT: number): boolean {
  if (pageT > TT_ENVIRONMENT_L5_EXTRA.rolesHideStarsPageT) return false;
  /** 首屏 Hero：星空 + 白点易与蓝海混成紫调天幕 */
  if (heroT < 0.58 && pageT < 0.2) return false;
  return resolveCinematicEnvironmentVisible(heroT, pageT);
}

/**
 * 将冻结 film token（`#030712` / 冷青 scrim）映射为页面暖墨，避免暖底 + 冷叠层混色偏紫蓝。
 * 不改动 `traveltrustCinematicVisual.ts`（地球锁定清单仍含该文件）。
 */
export function remapCinematicFilmInkToWarmPageInk(value: string): string {
  return value
    .replace(/rgba\(\s*3\s*,\s*7\s*,\s*18\s*,/g, "rgba(12,10,9,")
    .replace(/rgba\(\s*8\s*,\s*14\s*,\s*18\s*,/g, "rgba(10,9,8,")
    .replace(/rgba\(\s*10\s*,\s*15\s*,\s*13\s*,/g, "rgba(12,10,9,")
    .replace(/rgba\(\s*35\s*,\s*206\s*,\s*217\s*,/g, "rgba(252,164,124,")
    .replace(/rgba\(\s*110\s*,\s*231\s*,\s*183\s*,/g, "rgba(255,140,90,");
}

export function remapCinematicFilmInkLayersToWarmPageInk(layers: readonly string[]): string[] {
  return layers.map(remapCinematicFilmInkToWarmPageInk);
}

/**
 * Hero 首屏叠层（契约/工具 · 与 `buildPageCinematicCanvasOverlayLayers` 同构）。
 * 页面真值已退回 `archive/ui-v1/snapshot` · `TravelTrustPageCinematicCanvas` 内联叠层。
 */
export function buildHeroWarmCanvasOverlayLayers(params: PageCinematicOverlayParams): string[] {
  const pageT = params.pageT ?? 0;
  const cyanMul = params.cyanMul ?? resolveCinematicCanvasCyanMul(params.heroT, pageT);
  return buildPageCinematicCanvasOverlayLayers({ ...params, cyanMul });
}

/**
 * Hero 首屏：仅用于 Canvas **底下** 垫板（`canvas-warm-base-l5`）。
 * 中心透明 → WebGL 地球在上层绘制；外圈暖墨 → 空域与 layout 一致。
 * **禁止**放进 overlay `background` 顶层（会压在地球上，见 `HERO_SKY_COLOR_LAYER_AUDIT.md`）。
 */
/** 与 `#roles` 剧场顶盖、main `bg-[#0c0a09]` 同键 · 禁止 Hero 独做径向天幕 */
export function buildPageWarmInkFlatBackground(): string {
  return TT_CINEMATIC_PAGE_INK_HEX;
}

export function buildHeroWarmSkyBaseBackground(_globeOpticalX: string): string {
  return buildPageWarmInkFlatBackground();
}

/**
 * Hero 首屏：Canvas overlay 外圈暖墨环（mask 镂空球心后仅作用于「蓝紫光圈」带 · 与 `#0c0a09` 统一）
 * 叠在 overlay 栈顶，压 WebGL 空域冷青/紫靛光晕。
 */
export function buildHeroOuterSkyWarmRingLayer(globeOpticalX: string): string {
  const y = "var(--tt-hero-globe-optical-y,52%)";
  return `radial-gradient(ellipse 100% 90% at ${globeOpticalX} ${y}, rgba(12,10,9,0) 0%, rgba(12,10,9,0) 36%, #0c0a09 50%, #0c0a09 100%)`;
}

/** @deprecated Hero 外圈已仅用 `#0c0a09` 环；保留 API 供旧引用 */
export function buildHeroOuterSkyWarmAccentLayer(globeOpticalX: string): string {
  return buildHeroOuterSkyWarmRingLayer(globeOpticalX);
}

/** Hero 首屏 WebGL 暖墨缘壳（压住海洋贴图外侧青蓝光晕 · 非地球 mesh） */
export const TT_HERO_GLOBE_WARM_LIMB_SHELL_L5 = {
  scaleMul: 1.34,
  color: "#0c0a09",
  opacity: 0.14,
  heroFadeEnd: 0.62,
} as const;

/** Hero 首屏：贴球暖雾（FrontSide · 禁用 · 易成屏幕空间中心白斑） */
export const TT_HERO_GLOBE_WARM_FRONT_VEIL_L5 = {
  scaleMul: 1.045,
  color: "#2a221c",
  opacity: 0,
  heroFadeEnd: 0.62,
} as const;

/** Hero：球体保留区 mask（透明=露出 WebGL；黑=显示本层 CSS 底） */
export function buildHeroGlobeKeepoutMaskImage(globeOpticalX: string): string {
  const y = "var(--tt-hero-globe-optical-y,52%)";
  /** 镂空收紧（原 66% 过大 → 上半屏透出 WebGL 冷蓝） */
  return `radial-gradient(ellipse 72% 68% at ${globeOpticalX} ${y}, transparent 0%, transparent 40%, rgba(0,0,0,0.55) 52%, rgba(0,0,0,0.92) 62%, #000 72%)`;
}

/**
 * 全视口固定暖墨 mask：顶半屏实心 + 球外缘（`mask-composite: add` · 与 keepout 分键）。
 * 解决仅 radial 镂空时 50–70vh 横带仍露 WebGL 青紫天幕。
 */
export function buildHeroFixedInkMaskImage(globeOpticalX: string): string {
  const y = "var(--tt-hero-globe-optical-y,52%)";
  const topBand =
    "linear-gradient(to bottom, #000 0%, #000 min(50vh,540px), transparent min(58vh,620px), transparent 100%)";
  const globeRing = `radial-gradient(ellipse 78% 72% at ${globeOpticalX} ${y}, transparent 0%, transparent 38%, rgba(0,0,0,0.5) 50%, #000 62%)`;
  return `${topBand}, ${globeRing}`;
}

/** @deprecated 别名 · 与 `buildHeroGlobeKeepoutMaskImage` 同义 */
export function buildHeroCanvasOverlayMaskImage(globeOpticalX: string): string {
  return buildHeroGlobeKeepoutMaskImage(globeOpticalX);
}

/** Hero 横条暖墨背板（z 高于固定 Canvas，仅球区镂空；与下方 `#0c0a09` 实底同键） */
export const TT_HERO_WARM_BACKDROP_L5 = {
  rootClass: "pointer-events-none absolute inset-0 z-[1]",
  background: TT_CINEMATIC_PAGE_INK_HEX,
} as const;

/** Hero 首屏勿叠在球心的暖色 radial（否则 DOM 上压在 Canvas 之上） */
const HERO_OVERLAY_GLOBE_CENTER_WARM_RE =
  /radial-gradient\(ellipse 78% 64%[\s\S]*?255,178,108/;

/** Hero 首屏：Canvas overlay 上的全宽「横条/地板」渐变（改由 underlay letterbox 承担） */
function isHeroCanvasFloorOverlayLayer(layer: string): boolean {
  return (
    /linear-gradient\(to top,\s*rgba\(12,10,9/.test(layer) ||
    /linear-gradient\(to bottom,\s*rgba\(12,10,9,\s*0\.3\)/.test(layer) ||
    /linear-gradient\(to bottom, transparent 0%, rgba\(12,10,9/.test(layer) ||
    /linear-gradient\(to bottom, transparent 0%, rgba\(3,7,18/.test(layer) ||
    /linear-gradient\(to bottom, transparent 88%/.test(layer)
  );
}

/** 顶缘冷色天幕：`TT_PAGE_CINEMATIC_LETTERBOX_OVERLAY` 首层 + `heroNavScrim`（约 0–20vh） */
function isHeroCanvasTopInkBandLayer(layer: string): boolean {
  return (
    /linear-gradient\(180deg,\s*rgba\(12,10,9/i.test(layer) ||
    /linear-gradient\(180deg,\s*rgba\(3,7,18/i.test(layer) ||
    (/linear-gradient\(to bottom,\s*rgba\(12,10,9/i.test(layer) &&
      /transparent min\(\d/.test(layer) &&
      !/transparent 0%,\s*rgba\(12,10,9,\s*0\.12\)/.test(layer))
  );
}

/** 全页 Canvas CSS 叠层：暖墨 remap；Hero 不加全屏天幕（避免盖住 WebGL 地球） */
export function buildWarmPageCinematicCanvasOverlayLayers(
  params: PageCinematicOverlayParams,
): string[] {
  const pageT = params.pageT ?? 0;
  const cyanMul =
    params.cyanMul ??
    (params.heroT < 0.72 ? 0 : resolveNonGlobeCanvasCyanMul(params.heroT, pageT));
  let layers = remapCinematicFilmInkLayersToWarmPageInk(
    buildPageCinematicCanvasOverlayLayers({ ...params, cyanMul }),
  ).filter((layer) => !isHeroCanvasTopInkBandLayer(layer) && !isHeroCanvasFloorOverlayLayer(layer));
  /** 首屏：零 CSS overlay，避免暖底 + 冷青/径向叠层再混成「蓝紫天幕」；地球只由 WebGL 绘制 */
  if (params.heroT < 0.72) {
    return [];
  }
  return layers;
}
