/** L5 · 长页垂直节奏 / scroll-snap / 叙事章壳 */

/**
 * 长页垂直节奏 SSOT（企业叙事流 · 8px 网格）
 * 同主题簇用 cluster*；大转折仅用 padding（全页 ≤2 处 Film 软过渡 · 见 `TT_PAGE_SPACING_AUDIT_L5`）。
 * 比例阶：copy 16/20 · stack 24/32 · 经济簇节间 64–80 · 释放→兑换 80–96 · 大转折 56–72。
 * 经济簇（分配→核对→释放→兑换）必须有可感知负空间；勿再收到 py-5。
 * **首页布局已锁定** · 变更须同步 `TRAVELTRUST_HOME_LAYOUT_LOCK_L5` + `traveltrustHomeLayoutLockL5.test.ts`。
 */
export const TT_PAGE_VERTICAL_RHYTHM_L5 = {
  /** 标准独立大节：FAQ / 启程 */
  sectionY: "py-8 sm:py-9",
  /** 紧凑节（单节默认） */
  sectionYCompact: "py-6 sm:py-8",
  /** 经济簇首段：创世分配 */
  sectionClusterFirst: "pt-8 sm:pt-10 pb-8 sm:pb-10",
  /** 经济簇中段：合约核对 */
  sectionClusterMid: "py-8 sm:py-10",
  /** 经济簇释放档：底距加大，避免贴上兑换轨 */
  sectionClusterUnlock: "pt-8 sm:pt-10 pb-12 sm:pb-14",
  /** 经济簇末段：兑换网关（顶距加大，与释放列表分开） */
  sectionClusterLast: "pt-10 sm:pt-12 pb-8 sm:pb-10",
  /** 大转折后首段（FAQ） */
  sectionAfterMajorBreak: "pt-5 sm:pt-6 pb-5 sm:pb-6",
  /** 剧场节底 */
  sectionBottomTheater: "pb-5 sm:pb-6",
  /** @deprecated 用 sectionCluster* */
  sectionBottomLiquidity: "pb-5 sm:pb-6",
  sectionTopTrust: "py-5 sm:py-6",
  sectionBottomSettlement: "pb-6 sm:pb-8",
  sectionTopFaq: "pt-6 sm:pt-8",
  sectionBottomFaq: "pb-6 sm:pb-8",
  sectionTopStart: "pt-6 sm:pt-8",
  sectionYStart: "scroll-mt-28 pb-6 sm:pb-8",
  headerStackGap: "mt-5",
  headingToIntro: "mt-4 max-w-3xl sm:mt-5",
  contentStackGap: "mt-6 sm:mt-8",
  contentStackGapTight: "mt-5 sm:mt-6",
  faqListGap: "space-y-3.5 sm:space-y-4",
  settlementCtaRow:
    "mt-5 flex w-full flex-wrap items-stretch justify-start gap-4 sm:mt-6 sm:gap-5 lg:max-w-3xl lg:mx-0 [&_a]:flex-1 [&_a]:sm:flex-none [&_a]:sm:min-w-[11rem]",
  heroChromeMinH: "min-h-[2.5rem] sm:min-h-[2.625rem]",
  liquidityMaxWidth: "max-w-3xl",
  disclaimerAfterGrid: "mt-6 sm:mt-8",
  startStepsToPreview: "mt-6 sm:mt-7",
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
