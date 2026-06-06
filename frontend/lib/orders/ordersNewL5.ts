/**
 * `/orders/new` 创建订单 · L5 深色暖金（① · 与列表 `ordersListL5` / 首页 Action 同源）。
 * 机读：`ordersNewL5.contract.test.ts`
 */
import {
  TT_MARKETING_ACTION_TITLE_GRADIENT,
  TT_MARKETING_BTN_WARM_OUTLINE_COMPACT,
  TT_MARKETING_FOCUS_RING_CONSOLE,
  TT_MARKETING_ORDERS_DOT_GRID,
  TT_MARKETING_ORDERS_FORM_SUBMIT_BTN,
  TT_MARKETING_ORDERS_FOOTER_CROSS_LINK,
  TT_MARKETING_ORDERS_FOOTER_TOP_FADE,
  TT_MARKETING_ORDERS_FOOTER_WRAP,
  TT_MARKETING_ORDERS_FORM_FIELD,
  TT_MARKETING_ORDERS_FORM_SELECT,
  TT_MARKETING_ORDERS_LOAD_MORE_BTN,
  TT_MARKETING_ORDERS_NEW_FORM_FRAME,
  TT_MARKETING_ORDERS_NEW_FORM_INNER,
  TT_MARKETING_ORDERS_NEW_FORM_INNER_GLOW,
  TT_MARKETING_ORDERS_NEW_GUIDE_BANNER,
  TT_MARKETING_ORDERS_NEW_INLINE_LINK,
  TT_MARKETING_ORDERS_NEW_PAGE_INNER,
  TT_MARKETING_ORDERS_NEW_SUCCESS_PANEL,
  TT_MARKETING_ORDERS_PAGE_AMBIENT,
  TT_MARKETING_ORDERS_PAGE_SHELL,
  TT_MARKETING_ORDERS_PAGE_TITLE,
  TT_MARKETING_ORDERS_PAGE_VIGNETTE,
  TT_MARKETING_ORDERS_SKELETON_SHIMMER,
  TT_MARKETING_ORDERS_TEXT_BODY,
  TT_MARKETING_ORDERS_TEXT_META,
  TT_MARKETING_ORDERS_TEXT_MUTED,
} from "@/lib/marketingUi";
import { traveltrustProductL5ShellDataAttrs } from "@/lib/traveltrustHomepageFunnelL5";
import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";

export const ORDERS_NEW_L5_VISUAL_DATA_ATTR = "l5" as const;

export const ORDERS_NEW_L5_SSOT_ID = "TT-ORDERS-NEW-L5-2026-05" as const;

export const TT_ORDERS_NEW_L5 = {
  pageShell: `${TT_MARKETING_ORDERS_PAGE_SHELL} relative isolate overflow-x-clip`,
  pageVignette: TT_MARKETING_ORDERS_PAGE_VIGNETTE,
  pageInner: TT_MARKETING_ORDERS_NEW_PAGE_INNER,
  ambient: TT_MARKETING_ORDERS_PAGE_AMBIENT,
  dotGrid: TT_MARKETING_ORDERS_DOT_GRID,
  formFrame: TT_MARKETING_ORDERS_NEW_FORM_FRAME,
  formInner: TT_MARKETING_ORDERS_NEW_FORM_INNER,
  formInnerGlow: TT_MARKETING_ORDERS_NEW_FORM_INNER_GLOW,
  title: `text-h4 font-semibold tracking-tight drop-shadow-landing-hero mb-4 mt-4 ${TT_MARKETING_ACTION_TITLE_GRADIENT}`,
  bodyText: `text-body ${TT_MARKETING_ORDERS_TEXT_BODY}`,
  metaText: `text-meta ${TT_MARKETING_ORDERS_TEXT_META}`,
  mutedText: `text-meta ${TT_MARKETING_ORDERS_TEXT_MUTED}`,
  labelText: `block text-meta ${TT_MARKETING_ORDERS_TEXT_META} mb-0.5`,
  guideBanner: TT_MARKETING_ORDERS_NEW_GUIDE_BANNER,
  guideBannerTitle: `text-small font-medium ${TT_MARKETING_ORDERS_TEXT_BODY} break-all`,
  guidePickerDivider: "space-y-2 border-t border-white/12 pt-3 mt-1",
  formField: TT_MARKETING_ORDERS_FORM_FIELD,
  formSelect: TT_MARKETING_ORDERS_FORM_SELECT,
  inlineLink: `${touchTargetLink44Classes} ${TT_MARKETING_ORDERS_NEW_INLINE_LINK}`,
  keepLinkGuideBtn: `${touchTargetLink44Classes} text-meta ${TT_MARKETING_ORDERS_TEXT_META} hover:text-slate-100 hover:underline ${TT_MARKETING_FOCUS_RING_CONSOLE} focus-visible:ring-offset-[#0c0a09]`,
  submitBtn: TT_MARKETING_ORDERS_FORM_SUBMIT_BTN,
  retryBtn: `${touchTargetLink44Classes} ${TT_MARKETING_BTN_WARM_OUTLINE_COMPACT} text-meta focus-visible:ring-offset-[#0c0a09]`,
  successPanel: TT_MARKETING_ORDERS_NEW_SUCCESS_PANEL,
  successTitle: "text-success font-medium text-slate-50",
  successPrimaryBtn: `${touchTargetLink44Classes} inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-sm)] border border-ref-sun/40 bg-gradient-to-r from-ref-sun/95 via-ref-coral/90 to-ref-sun/95 px-4 py-2 text-small font-semibold text-[#0c0a09] shadow-warm-up transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]`,
  successSecondaryLink: `${touchTargetLink44Classes} text-small ${TT_MARKETING_ORDERS_NEW_INLINE_LINK}`,
  crossNav: `mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-meta ${TT_MARKETING_ORDERS_TEXT_MUTED}`,
  crossNavLink: `${touchTargetLink44Classes} ${TT_MARKETING_ORDERS_FOOTER_CROSS_LINK}`,
  crossNavSeparator: TT_MARKETING_ORDERS_TEXT_MUTED,
  footerWrap: TT_MARKETING_ORDERS_FOOTER_WRAP,
  footerTopFade: TT_MARKETING_ORDERS_FOOTER_TOP_FADE,
  skeletonShimmer: TT_MARKETING_ORDERS_SKELETON_SHIMMER,
  loadMoreBtnStyle: TT_MARKETING_ORDERS_LOAD_MORE_BTN,
  createdShell: `${TT_MARKETING_ORDERS_PAGE_SHELL} relative isolate flex min-h-screen items-center justify-center overflow-x-clip p-6`,
  pageTitleGradient: TT_MARKETING_ORDERS_PAGE_TITLE,
} as const;

export function ordersNewL5MainDataAttrs(): Record<string, string> {
  return {
    ...traveltrustProductL5ShellDataAttrs("orders-new"),
    "data-tt-orders-new-page": "1",
    "data-tt-orders-new-l5": ORDERS_NEW_L5_VISUAL_DATA_ATTR,
    "data-tt-orders-new-l5-ssot": ORDERS_NEW_L5_SSOT_ID,
  };
}
