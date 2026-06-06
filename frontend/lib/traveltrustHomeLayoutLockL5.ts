/**
 * `/traveltrust` 营销首页布局锁定（产品认可基线 · 含无缝背景接缝）
 *
 * 变更本节距 / 分节结构 / 背景接缝前须：
 * 1. 更新本文件与 `traveltrustHomeLayoutLockL5.test.ts`
 * 2. 本地 `npx vitest run lib/traveltrustHomeLayoutLockL5.test.ts`
 * 3. 产品确认（勿静默改 padding / Film 缝 / 吸附 / 氛围叠层）
 */

export const TRAVELTRUST_HOME_LAYOUT_LOCK_L5 = {
    lockId: "TT-TRAVELTRUST-HOME-LAYOUT-LOCK-2026-05-v10-absolute-modular",
    lockedAt: "2026-05-21",
    label: "traveltrust-home-approved-seamless-v10-absolute-modular",
  route: "/traveltrust",
  /** 全页 scroll-snap 与滚轮切章关闭 */
  scrollSnapEnabled: false,
  /** `TravelTrustBelowFoldSections` 内 Film 占位条数（仅 margin，无压暗渐变） */
  filmDividerCount: 2,
  /** 叙事节顺序（与页内 nav 一致） */
  sectionOrder: ["hero", "roles", "liquidity", "trust", "settlement", "faq", "start"] as const,
  belowFold: {
    economyCluster: true,
    economyClusterIds: ["liquidity", "trust", "settlement"] as const,
    snapChapters: ["theater", "faq", "close"] as const,
    faqStartDivider: false,
    footerGrouped: true,
  },
  /** `TT_PAGE_VERTICAL_RHYTHM_L5` 冻结子集 */
  rhythm: {
    sectionClusterFirst: "pt-6 sm:pt-7 pb-4 sm:pb-5",
    sectionClusterMid: "py-4 sm:py-5",
    sectionClusterLast: "pt-4 sm:pt-5 pb-6 sm:pb-8",
    sectionAfterMajorBreak: "pt-6 sm:pt-8 pb-6 sm:pb-8",
    sectionBottomTheater: "pb-6 sm:pb-8",
    sectionTopStart: "pt-6 sm:pt-8",
    complianceShell: "relative mt-8 w-full border-t-0 pt-0 pb-4 sm:mt-10 sm:pb-5",
  },
  /** 背景接缝策略（无缝长页 · 2026-05 认可版） */
  entryGate: {
    enabled: true,
    minVisibleMs: 720,
    maxWaitMs: 8000,
    modulePath: "frontend/modules/traveltrust-home",
  },
  modularity: {
    composerPath: "frontend/modules/traveltrust-home/presentation/TravelTrustNetworkPageComposer.tsx",
    composerDynamicsPath: "frontend/modules/traveltrust-home/presentation/TravelTrustHomeComposerDynamics.tsx",
    composerShellPath: "frontend/modules/traveltrust-home/presentation/TravelTrustHomeComposerShell.tsx",
    composerMainColumnPath: "frontend/modules/traveltrust-home/presentation/TravelTrustHomeMainColumn.tsx",
    composerScrollProvidersPath:
      "frontend/modules/traveltrust-home/presentation/TravelTrustHomeScrollProviders.tsx",
    composerUnified3DBackdropPath:
      "frontend/modules/traveltrust-home/presentation/TravelTrustHomeUnified3DBackdrop.tsx",
    composerLifecycleHookPath: "frontend/modules/traveltrust-home/hooks/useTraveltrustComposerPage.ts",
    cinematicBridgePath: "frontend/lib/traveltrust/home/cinematic-bridge",
    cinematicBridgeImport: "@/lib/traveltrust/home/cinematic-bridge",
    belowFoldShellPath: "frontend/lib/traveltrust/home/BelowFoldSectionsShell.tsx",
    visualQaEvidencePath: "frontend/lib/traveltrust/home/visualQaEvidence.ts",
    sectionMarkersPath: "frontend/lib/traveltrust/home/sectionMarkers.ts",
    belowFoldNarrativeBeatsPath: "frontend/lib/traveltrust/home/belowFoldNarrativeBeats.ts",
    visualQaManifestPath: "frontend/lib/traveltrust/home/visualQaManifest.ts",
    sectionUiSlotPath: "frontend/modules/traveltrust-home/sections/ui/TravelTrustHomeSectionSlot.tsx",
    composerOverlaysPath: "frontend/modules/traveltrust-home/presentation/TravelTrustHomeComposerOverlays.tsx",
    sectionsPath: "frontend/modules/traveltrust-home/sections",
    sectionWrappers: [
      "TravelTrustHomeHeroSection",
      "TravelTrustHomeWebGLLayer",
      "TravelTrustHomeBelowFoldSection",
      "TravelTrustHomeRolesSection",
      "TravelTrustHomeEconomyClusterSection",
      "TravelTrustHomeLiquiditySection",
      "TravelTrustHomeTrustSection",
      "TravelTrustHomeSettlementSection",
      "TravelTrustHomeFaqSection",
      "TravelTrustHomeStartCloseSection",
    ] as const,
    pageScenePath: "frontend/components/traveltrust/cinematic/page-scene",
    l5Domains: [
      "meta",
      "rhythm",
      "sections-layout",
      "atmosphere",
      "hero-ui",
      "theater",
      "landing-chrome",
      "start",
      "economy",
      "footer",
      "shell-legacy",
      "resolvers",
      "hero-canvas",
      "anchors",
    ] as const,
    cinematicMustNotImportHomeModule: true,
    entryBridgePath: "frontend/lib/traveltrust/home",
  },
  seams: {
    belowFoldAtmosphereUnified: true,
    economyClusterSingleAtmosphere: true,
    filmDividerUsesMarginOnly: true,
    groupedFooterAmbience: false,
    complianceTopBorder: false,
    filmDividerWrapper: "pointer-events-none relative z-[0] my-7 sm:my-8 h-0 w-full",
    scrollPlateBackdrop: "pointer-events-none absolute inset-0 z-0 bg-[#0c0a09]/38",
    economyClusterAtmosphere:
      "pointer-events-none absolute inset-x-0 top-0 z-0 h-[min(26rem,52vh)] bg-[radial-gradient(ellipse_72%_58%_at_50%_0%,rgba(252,164,124,0.07),transparent_72%)]",
    belowFoldAtmosphereMarker: "data-tt-traveltrust-below-fold-atmosphere-unified-l5",
    economyClusterAtmosphereMarker: "data-tt-traveltrust-economy-cluster-atmosphere-l5",
    footerGroupedShellPrefix: "border-t-0 bg-transparent px-4 pt-4",
  },
  startCta: {
    stack: "mt-8 flex w-full max-w-xl flex-col gap-4 sm:mt-10 sm:w-auto sm:flex-row sm:flex-nowrap sm:items-center gap-x-8 sm:gap-x-10",
    pairGapPxIdeal: 40,
  },
  liquidityCta: {
    stack: "grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3",
  },
  theaterIntro: {
    headlineBlock: "mt-5 space-y-4 sm:mt-6 sm:space-y-5",
    noKickerRuleLine: true,
  },
  trustGrid: {
    gapY: "gap-5",
    gapYSm: "sm:gap-6",
  },
} as const;

export type TraveltrustHomeLayoutLockL5 = typeof TRAVELTRUST_HOME_LAYOUT_LOCK_L5;
