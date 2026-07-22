/** L5 · 元数据 / 角色剧场 / 走廊 / 地平线（非地球轨） */
import type { TravelTrustRoleId } from "@/app/traveltrust/traveltrustIdentityModel";

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
  "role-video-cinema",
  "role-video-cinema-chrome",
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
  /** 用户点播：站内 cinematic 剧场（非浏览器原生 Fullscreen）· RC 视觉收尾 */
  cinemaPortalClass: "fixed inset-0 z-[280] flex items-center justify-center p-4 sm:p-6",
  cinemaScrimClass:
    "absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_42%,rgba(28,20,16,0.72)_0%,rgba(12,10,9,0.92)_55%,rgba(8,6,5,0.97)_100%)] backdrop-blur-md",
  cinemaStageClass:
    "relative z-[1] w-full max-w-5xl overflow-hidden rounded-2xl border-2 border-ref-sun/45 bg-ink-950 shadow-[0_28px_90px_-20px_rgba(0,0,0,0.82),0_0_56px_-12px_rgba(252,164,124,0.42),inset_0_1px_0_rgba(255,212,168,0.18)] ring-1 ring-ref-sun/25",
  cinemaFrameClass: "relative aspect-video w-full overflow-hidden bg-ink-950",
  cinemaVideoClass: "absolute inset-0 h-full w-full object-cover",
  cinemaTopBarClass:
    "pointer-events-none absolute inset-x-0 top-0 z-[2] flex items-start justify-between gap-3 bg-gradient-to-b from-ink-950/95 via-ink-950/70 to-transparent px-3 pb-12 pt-2.5 sm:px-4 sm:pt-3",
  cinemaTopMetaClass:
    "pointer-events-none min-w-0 max-w-[min(100%,22rem)] flex-1 rounded-xl border border-ref-sun/25 bg-ink-950/72 px-3 py-2 shadow-[0_8px_24px_-10px_rgba(0,0,0,0.65)] backdrop-blur-md",
  cinemaTitleClass:
    "truncate text-meta font-semibold tracking-wide text-[#ffe0c2] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] sm:text-small",
  cinemaHintClass:
    "mt-0.5 text-[11px] font-medium leading-snug text-[#f3e6d8]/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-meta",
  cinemaCloseClass:
    "pointer-events-auto inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-full border-2 border-ref-sun/55 bg-ink-950/90 text-[#ffe0c2] shadow-[0_8px_24px_-6px_rgba(0,0,0,0.7)] backdrop-blur-md transition hover:border-ref-sun/75 hover:bg-ref-sun/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/60",
  cinemaCloseGlyphClass: "text-base font-semibold leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]",
  cinemaChromeClass:
    "absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-ink-950 via-ink-950/88 to-transparent px-3 pb-3 pt-12 sm:px-4 sm:pb-3.5",
  cinemaChromeRowClass: "flex items-center gap-2.5 sm:gap-3",
  cinemaChromeBtnClass:
    "inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-full border border-ref-sun/40 bg-ink-950/80 text-[#ffe0c2] shadow-sm backdrop-blur-sm transition hover:border-ref-sun/60 hover:bg-ref-sun/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/50",
  cinemaProgressClass:
    "h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ref-sun/25 accent-[#fca47c] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#fca47c] [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(12,10,9,0.55)] [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#fca47c]",
  cinemaTimeClass:
    "shrink-0 tabular-nums text-[11px] font-medium text-[#f3e6d8]/95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)] sm:text-meta",
  cinemaEnterDuration: 0.48,
  cinemaExitDuration: 0.34,
  cinemaScrimEnterDuration: 0.4,
  cinemaStageInitial: { opacity: 0, scale: 0.9, y: 28 },
  cinemaStageAnimate: { opacity: 1, scale: 1, y: 0 },
  cinemaStageExit: { opacity: 0, scale: 0.94, y: 12 },
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
