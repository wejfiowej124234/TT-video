/**
 * 旅行预约订单/向导详情抽屉：与商家橱窗、旅行收购详情页同语境的深色玻璃壳（与 `MerchantShowcaseDetailView` 区块对齐）。
 */
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_BTN_MARKET_GHOST_FILL,
  TT_MARKETING_BTN_MARKET_PRIMARY,
  TT_MARKETING_MARKET_DARK_PATH,
} from "@/lib/marketingUi";

const drawerFocus = TT_MARKETING_MARKET_DARK_PATH.drawerControlFocus;

/** 高于全局 `Header`（`z-[300]`）；移动端为 bottom sheet，桌面端为右侧抽屉（29 §2.2） */
export const marketDetailDrawerScrim =
  "fixed inset-0 z-[320] flex justify-end max-md:items-end bg-black/50 backdrop-blur-sm";

export const marketDetailDrawerPanel =
  "w-full max-w-md max-h-[100dvh] overflow-y-auto animate-in slide-in-from-right duration-200 flex flex-col border-l border-ref-sun/18 bg-ink-900/95 backdrop-blur-xl shadow-2xl ring-1 ring-inset ring-ref-sun/12 max-md:max-w-none max-md:max-h-[min(92dvh,720px)] max-md:rounded-t-2xl max-md:border-l-0 max-md:border-t max-md:animate-in max-md:slide-in-from-bottom max-md:duration-200";

/** 订单/向导抽屉：中部滚动 + 底栏 CTA 吸底（面板本身不滚动） */
export const marketDetailDrawerPanelStickyLayout =
  "w-full max-w-md max-h-[100dvh] overflow-hidden animate-in slide-in-from-right duration-200 flex flex-col border-l border-ref-sun/18 bg-ink-900/95 backdrop-blur-xl shadow-2xl ring-1 ring-inset ring-ref-sun/12 max-md:max-w-none max-md:max-h-[min(92dvh,720px)] max-md:rounded-t-2xl max-md:border-l-0 max-md:border-t max-md:animate-in max-md:slide-in-from-bottom max-md:duration-200";

export const marketDetailDrawerScrollRegion = "flex-1 min-h-0 overflow-y-auto overscroll-contain";

export const marketDetailDrawerScrollBody = "p-4 pb-6 space-y-5 text-slate-200";

export const marketDetailDrawerFooterSticky =
  "shrink-0 z-10 border-t border-ref-sun/16 bg-ink-900/95 backdrop-blur-md px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] space-y-2";

export const marketDetailDrawerHeroScrim =
  "pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 via-[#0a0a0a]/15 to-transparent";

/** 抽屉盖在顶栏之上后，顶部仅保留刘海/安全区，不再按顶栏高度整块留白 */
export const marketDetailDrawerInnerCol =
  "flex min-h-0 flex-1 flex-col pt-[max(0.25rem,env(safe-area-inset-top,0px))]";

export const marketDetailDrawerHeaderRow =
  "sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-ref-sun/16 bg-ink-900/90 px-4 py-3 backdrop-blur-md shrink-0";

export const marketDetailDrawerTitle = "min-w-0 flex-1 text-body font-semibold text-white truncate pr-2";

export const marketDetailDrawerHeroMedia =
  `relative -mx-4 aspect-[16/10] w-[calc(100%+2rem)] max-w-none overflow-hidden bg-ink-800/80 ${TT_MARKETING_MARKET_DARK_PATH.drawerHeroRing}`;

export const marketDetailDrawerCloseBtn =
  `${touchTargetLink44Classes} inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-slate-300 hover:bg-ref-sun/10 hover:text-ref-sun focus:outline-none ${TT_MARKETING_MARKET_DARK_PATH.drawerCloseFocus}`;

export const marketDetailDrawerBody = "p-4 pb-8 space-y-5 flex-1 min-h-0 text-slate-200";

export const marketDetailDrawerHeading = "text-h3 font-semibold text-white";

export const marketDetailDrawerSubtle = "text-small text-slate-400";

export const marketDetailDrawerMeta = "text-meta text-slate-400";

export const marketDetailDrawerMetaList = "text-meta text-slate-400 mt-1 space-y-0.5";

export const marketDetailDrawerAmount = "text-body-l font-semibold text-white";

export const marketDetailDrawerChipPill =
  "rounded-full border border-ref-sun/22 bg-ref-sun/8 px-3 py-1 text-meta text-slate-100";

export const marketDetailDrawerPricePill =
  "rounded-[var(--radius-md)] border border-ref-sun/30 bg-ink-900/70 px-2.5 py-0.5 text-meta font-semibold tabular-nums text-ref-sun shadow-[inset_0_0_0_1px_rgba(249,215,121,0.12)]";

export const marketDetailDrawerSheetSection =
  "rounded-[var(--radius-lg)] border border-ref-sun/20 bg-ink-900/50 p-5 backdrop-blur-md";

export const marketDetailDrawerSectionHeadingAccent = TT_MARKETING_MARKET_DARK_PATH.drawerSectionAccent;

export const marketDetailDrawerSectionHeadingMain = "text-h3 font-semibold text-white";

export const marketDetailDrawerCard =
  "rounded-[var(--radius-sm)] border border-ref-sun/18 bg-ink-900/45 p-3 backdrop-blur-md";

export const marketDetailDrawerCardHeading = "text-small font-semibold text-slate-100 mb-2";

export const marketDetailDrawerSkeletonLine =
  "rounded-[var(--radius-sm)] bg-ink-700/45 animate-pulse motion-reduce:animate-none";

export const marketDetailDrawerSkeletonBlock =
  "rounded-[var(--radius-md)] bg-ink-700/45 animate-pulse motion-reduce:animate-none";

export const marketDetailDrawerSecondaryBtn =
  `${touchTargetLink44Classes} rounded-[var(--radius-sm)] border border-ref-sun/24 bg-ink-900/50 px-3 py-2 text-small font-medium text-slate-100 hover:bg-ref-sun/10 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none ${drawerFocus}`;

export const marketDetailDrawerBlockLink =
  `${touchTargetLink44Classes} block w-full rounded-[var(--radius-sm)] border border-ref-sun/22 bg-ink-900/50 px-4 py-2 text-center text-small font-medium text-slate-100 hover:bg-ref-sun/10 focus:outline-none ${drawerFocus}`;

export const marketDetailDrawerAccentBlockLink =
  `${touchTargetLink44Classes} block w-full rounded-[var(--radius-sm)] px-4 py-2 text-center text-small font-medium ${TT_MARKETING_MARKET_DARK_PATH.drawerAccentLink} ${drawerFocus}`;

/** @deprecated 手风琴行请用 `marketDetailDrawerAccordionToggle` */
export const marketDetailDrawerAgreementToggle =
  `${touchTargetLink44Classes} ${TT_MARKETING_MARKET_DARK_PATH.drawerAccordionToggle}`;

export const marketDetailDrawerAccordionToggle =
  `${touchTargetLink44Classes} ${TT_MARKETING_MARKET_DARK_PATH.drawerAccordionToggle}`;

export const marketDetailDrawerSummaryStrip = TT_MARKETING_MARKET_DARK_PATH.drawerSummaryStrip;

export const marketDetailDrawerHintText = TT_MARKETING_MARKET_DARK_PATH.drawerHintText;

export const marketDetailDrawerAgreementBody =
  "mt-2 rounded-[var(--radius-sm)] border border-ref-sun/20 bg-ink-900/55 px-3 py-2.5 text-meta text-slate-300/95 space-y-1.5 [&_p:first-child]:text-ref-sun/85";

export const marketDetailDrawerPrimaryCta =
  `${touchTargetLink44Classes} ${TT_MARKETING_BTN_MARKET_PRIMARY} w-full disabled:opacity-60 disabled:cursor-not-allowed`;

/** 抽屉底栏主操作：哑光暖金（弱于列表渐变 CTA） */
export const marketDetailDrawerPrimaryCtaMatte =
  `${touchTargetLink44Classes} w-full inline-flex items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/42 bg-ref-sun/22 px-4 py-2 text-small font-semibold text-white hover:bg-ref-sun/30 motion-sub motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/55 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 disabled:cursor-not-allowed disabled:opacity-60`;

export const marketDetailDrawerAvatarFallback =
  `w-14 h-14 rounded-full bg-ref-sun/12 flex items-center justify-center text-h4 font-semibold ${TT_MARKETING_MARKET_DARK_PATH.drawerAvatarFallback} shrink-0`;

export const marketDetailDrawerTagPill =
  "tt-market-guide-tag rounded-[var(--radius-sm)] border border-ref-sun/28 bg-ink-900/55 text-ref-sun px-2 py-0.5 text-small font-medium [color:var(--ref-sun)]";

/** @deprecated 仅 re-export 兼容；新代码请用 `TT_MARKETING_BTN_MARKET_GHOST_FILL` */
export const marketDetailDrawerGhostFill = TT_MARKETING_BTN_MARKET_GHOST_FILL;
