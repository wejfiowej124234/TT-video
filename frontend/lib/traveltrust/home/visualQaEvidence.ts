import type { TraveltrustHomeVisualQaItemId } from "./visualQaChecklist";

/**
 * 目视 QA 每项在代码库中必须存在的锚点（静态契约 · 不替代浏览器目视）。
 * 扫描范围：traveltrust-home module · lib/traveltrust/home · cinematic · app/traveltrust。
 */
export const TRAVELTRUST_HOME_VISUAL_QA_CODE_EVIDENCE: Record<
  TraveltrustHomeVisualQaItemId,
  readonly string[]
> = {
  "globe-entrance": [
    "resolveHeroGlobeEntranceScaleMul",
    "TRAVELTRUST_HERO_GLOBE_ENTRANCE_DURATION_SEC",
    "mountAtMs",
  ],
  "hero-split-seam": [
    'data-tt-traveltrust-hero-layout="split-lr"',
    "TT_HERO_SPLIT_CSS_VARS_STYLE",
    "data-tt-traveltrust-hero-copy-scrim",
  ],
  "landing-nav-sticky": [
    'data-tt-traveltrust-landing-nav-slot="fixed"',
    "TravelTrustLandingChrome",
    "data-tt-traveltrust-scroll-progress-visible",
  ],
  "below-fold-film-dividers": [
    "TravelTrustSectionFilmDivider",
    "data-tt-traveltrust-below-fold-sections-l5",
    "TravelTrustHomeBelowFoldShell",
  ],
  "economy-cluster-atmosphere": [
    'data-tt-traveltrust-economy-cluster="1"',
    "data-tt-traveltrust-economy-cluster-atmosphere-l5",
    "TravelTrustHomeEconomyClusterSection",
  ],
  "theater-viewport-sync": [
    "TravelTrustTheaterViewportContext",
    "onTheaterViewportChange",
    "data-tt-traveltrust-theater-entered",
  ],
  "hash-scroll": ["useTraveltrustHashScroll", "scrollTraveltrustHashIntoView", 'href="#liquidity"', 'href="#roles"'],
  "entry-gate": [
    "HomeEntryGateProvider",
    "TRAVELTRUST_HOME_ENTRY_GATE_L5",
    "runTraveltrustHomeCriticalPrefetch",
  ],
  "reduced-motion": [
    "TravelTrustReducedMotionNotice",
    "data-tt-traveltrust-reduced-motion-notice-visible",
    "useReducedMotion",
  ],
  "grouped-footer": [
    'chapterId="close"',
    "<TravelTrustNetworkFooter grouped",
    "TT_SNAP_CHAPTER_GROUP_L5",
  ],
};
