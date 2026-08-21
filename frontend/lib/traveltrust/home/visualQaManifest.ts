import type { TraveltrustHomeVisualQaItemId } from "./visualQaChecklist";

export type TraveltrustHomeVisualQaChannel = "code" | "e2e" | "manual";

export type TraveltrustHomeVisualQaManifestEntry = {
  id: TraveltrustHomeVisualQaItemId;
  channels: readonly TraveltrustHomeVisualQaChannel[];
  /** Playwright 可断言的 DOM 选择器（① 本地 e2e） */
  e2eSelectors?: readonly string[];
  /** 深链验收路径 */
  e2ePath?: string;
};

/** 目视 QA 三通道：code（Vitest 锚点）· e2e（probe）· manual（产品勾选） */
export const TRAVELTRUST_HOME_VISUAL_QA_MANIFEST: readonly TraveltrustHomeVisualQaManifestEntry[] = [
  {
    id: "globe-entrance",
    channels: ["code", "e2e"],
    e2eSelectors: [
      '[data-tt-traveltrust-page-cinematic-3d="1"]',
      '[data-tt-traveltrust-hero-globe-unobstructed="1"]',
    ],
    e2ePath: "/traveltrust",
  },
  {
    id: "hero-split-seam",
    channels: ["code", "e2e"],
    e2eSelectors: ['[data-tt-traveltrust-hero-layout="split-lr"]', '[data-tt-traveltrust-hero-copy-scrim]'],
    e2ePath: "/traveltrust",
  },
  {
    id: "landing-nav-sticky",
    channels: ["code", "e2e"],
    e2eSelectors: [
      '[data-tt-traveltrust-landing-nav-slot="fixed"]',
      '[data-tt-traveltrust-landing-chrome]',
    ],
    e2ePath: "/traveltrust",
  },
  {
    id: "below-fold-film-dividers",
    channels: ["code", "e2e"],
    e2eSelectors: [
      '[data-tt-traveltrust-below-fold-sections-l5="1"]',
      '[data-tt-traveltrust-home-below-fold-orchestrator="1"]',
    ],
    e2ePath: "/traveltrust#roles",
  },
  {
    id: "economy-cluster-atmosphere",
    channels: ["code", "e2e"],
    e2eSelectors: [
      '[data-tt-traveltrust-economy-cluster="1"]',
      '[data-tt-traveltrust-economy-cluster-atmosphere-l5="1"]',
    ],
    e2ePath: "/traveltrust#liquidity",
  },
  {
    id: "theater-viewport-sync",
    channels: ["code", "e2e"],
    e2eSelectors: ['[data-tt-traveltrust-home-section="roles"]', "#roles"],
    e2ePath: "/traveltrust#roles",
  },
  {
    id: "hash-scroll",
    channels: ["code", "e2e"],
    e2eSelectors: ["#faq", "#start", "#roles"],
    e2ePath: "/traveltrust#faq",
  },
  {
    id: "entry-gate",
    channels: ["code", "e2e", "manual"],
    e2eSelectors: ['[data-tt-traveltrust-home-composer="1"]'],
    e2ePath: "/traveltrust?tt_no_gate=1",
  },
  {
    id: "reduced-motion",
    channels: ["code", "manual"],
    e2eSelectors: ['[data-tt-traveltrust-reduced-motion-notice-visible]'],
    e2ePath: "/traveltrust",
  },
  {
    id: "grouped-footer",
    channels: ["code", "e2e"],
    e2eSelectors: ['[data-tt-traveltrust-home-section="start"]', "#start"],
    e2ePath: "/traveltrust#start",
  },
] as const;
