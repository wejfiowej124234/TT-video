/**
 * 订单产品页 · 精简 L5 页脚（cross-nav + 版权 · 非首页多栏 LandingFooter）
 * 机读：`ordersListL5.contract.test.ts` · `ordersNewL5.contract.test.ts`
 */
import {
  TT_MARKETING_HOME_FOOTER_DIVIDER,
  TT_MARKETING_ORDERS_FOOTER_CROSS_LINK,
  TT_MARKETING_ORDERS_FOOTER_TOP_FADE,
  TT_MARKETING_ORDERS_FOOTER_WRAP,
  TT_MARKETING_ORDERS_PRODUCT_FOOTER_SHELL,
  TT_MARKETING_ORDERS_TEXT_MUTED,
} from "@/lib/marketingUi";

export const ORDERS_PRODUCT_FOOTER_DATA_ATTR = "1" as const;

export const TT_ORDERS_PRODUCT_FOOTER = {
  wrap: TT_MARKETING_ORDERS_FOOTER_WRAP,
  topFade: TT_MARKETING_ORDERS_FOOTER_TOP_FADE,
  shell: TT_MARKETING_ORDERS_PRODUCT_FOOTER_SHELL,
  innerWide: "mx-auto max-w-5xl px-4 sm:px-6",
  innerNarrow: "mx-auto max-w-md px-4 sm:px-6",
  crossNav:
    "flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta text-slate-400",
  crossNavLink: TT_MARKETING_ORDERS_FOOTER_CROSS_LINK,
  crossNavSeparator: TT_MARKETING_ORDERS_TEXT_MUTED,
  metaBlock: `mt-6 pt-5 text-center ${TT_MARKETING_HOME_FOOTER_DIVIDER}`,
  copyright: "text-meta font-medium text-slate-300",
  tagline: `mt-1 text-meta ${TT_MARKETING_ORDERS_TEXT_MUTED}`,
} as const;
