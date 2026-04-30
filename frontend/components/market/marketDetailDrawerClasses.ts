/**
 * 旅行预约订单/向导详情抽屉：与商家橱窗、旅行收购详情页同语境的深色玻璃壳（与 `MerchantShowcaseDetailView` 区块对齐）。
 */
import { touchTargetLink44Classes, travelFocusRingCoreOffset2Classes } from "@/lib/travelLinkFocus";

/** 高于全局 `Header`（`z-[300]`），避免右侧抽屉标题/关闭钮被顶栏盖住 */
export const marketDetailDrawerScrim =
  "fixed inset-0 z-[320] flex justify-end bg-black/50 backdrop-blur-sm";

export const marketDetailDrawerPanel =
  "w-full max-w-md max-h-[100dvh] overflow-y-auto animate-in slide-in-from-right duration-200 flex flex-col border-l border-white/15 bg-ink-900/95 backdrop-blur-xl shadow-2xl ring-1 ring-inset ring-white/10";

/** 抽屉盖在顶栏之上后，顶部仅保留刘海/安全区，不再按顶栏高度整块留白 */
export const marketDetailDrawerInnerCol =
  "flex min-h-0 flex-1 flex-col pt-[max(0.25rem,env(safe-area-inset-top,0px))]";

export const marketDetailDrawerHeaderRow =
  "sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-white/10 bg-ink-900/90 px-4 py-3 backdrop-blur-md shrink-0";

export const marketDetailDrawerTitle = "min-w-0 flex-1 text-body font-semibold text-white truncate pr-2";

/** 与商家详情页主图区一致：16:10 + 青描边 */
export const marketDetailDrawerHeroMedia =
  "relative -mx-4 aspect-[16/10] w-[calc(100%+2rem)] max-w-none overflow-hidden bg-ink-800/80 ring-1 ring-ref-cyan/15 border-y border-white/10 border-x-0";

export const marketDetailDrawerCloseBtn =
  `${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-slate-300 hover:bg-white/10 hover:text-white focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900`;

export const marketDetailDrawerBody = "p-4 pb-8 space-y-5 flex-1 min-h-0 text-slate-200";

export const marketDetailDrawerHeading = "text-h3 font-semibold text-white";

export const marketDetailDrawerSubtle = "text-small text-slate-400";

export const marketDetailDrawerMeta = "text-meta text-slate-400";

export const marketDetailDrawerMetaList = "text-meta text-slate-400 mt-1 space-y-0.5";

export const marketDetailDrawerAmount = "text-body-l font-semibold text-white";

/** 商家详情页 chips：`MerchantShowcaseDetailView` header pills */
export const marketDetailDrawerChipPill =
  "rounded-full border border-white/20 bg-white/10 px-3 py-1 text-meta text-white/90";

/** 商家卡片价签：琥珀胶囊 */
export const marketDetailDrawerPricePill =
  "rounded-[var(--radius-md)] border border-warning/35 bg-warning/15 px-2 py-0.5 text-meta font-semibold tabular-nums text-white/95 ring-1 ring-warning/25";

/** 商家详情「亮点 / 说明」玻璃区块 */
export const marketDetailDrawerSheetSection =
  "rounded-[var(--radius-lg)] border border-white/15 bg-ink-900/50 p-5 backdrop-blur-md";

export const marketDetailDrawerSectionHeadingAccent =
  "text-small font-semibold uppercase tracking-wide text-ref-cyan/90";

export const marketDetailDrawerSectionHeadingMain = "text-h3 font-semibold text-white";

export const marketDetailDrawerCard =
  "rounded-[var(--radius-sm)] border border-white/12 bg-white/[0.06] p-3 backdrop-blur-md";

export const marketDetailDrawerCardHeading = "text-small font-semibold text-slate-100 mb-2";

export const marketDetailDrawerSkeletonLine = "rounded-[var(--radius-sm)] bg-white/10 animate-pulse motion-reduce:animate-none";

export const marketDetailDrawerSkeletonBlock = "rounded-[var(--radius-md)] bg-white/10 animate-pulse motion-reduce:animate-none";

export const marketDetailDrawerSecondaryBtn =
  `${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} rounded-[var(--radius-sm)] border border-white/25 bg-white/[0.06] px-3 py-2 text-small font-medium text-slate-100 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900`;

export const marketDetailDrawerBlockLink =
  `${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} block w-full rounded-[var(--radius-sm)] border border-white/20 bg-white/[0.06] px-4 py-2 text-center text-small font-medium text-slate-100 hover:bg-white/10 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900`;

export const marketDetailDrawerAccentBlockLink =
  `${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} block w-full rounded-[var(--radius-sm)] border border-travel-400/35 bg-travel-500/15 px-4 py-2 text-center text-small font-medium text-cyan-100 hover:bg-travel-500/25 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900`;

export const marketDetailDrawerAgreementToggle =
  `${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} w-full flex items-center justify-between rounded-[var(--radius-sm)] border border-white/12 bg-white/[0.05] px-3 py-2 text-left text-small font-medium text-slate-100 hover:bg-white/10`;

export const marketDetailDrawerAgreementBody =
  "mt-2 rounded-[var(--radius-sm)] border border-white/10 bg-ink-800/50 px-3 py-2 text-meta text-slate-400 space-y-1";

export const marketDetailDrawerPrimaryCta =
  `${touchTargetLink44Classes} ${travelFocusRingCoreOffset2Classes} w-full rounded-[var(--radius-sm)] bg-travel-500 px-4 py-2 text-white text-small font-medium disabled:opacity-60 disabled:cursor-not-allowed focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900`;

export const marketDetailDrawerAvatarFallback =
  "w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-h4 font-semibold text-cyan-300 shrink-0";

export const marketDetailDrawerTagPill =
  "rounded-[var(--radius-sm)] border border-white/15 bg-white/10 text-slate-100 px-2 py-0.5 text-small";
