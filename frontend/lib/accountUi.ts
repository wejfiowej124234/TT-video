/**
 * 账户子树 UI 单入口（W5）
 *
 * - **Hub（统计 / 社区壳）**：`/community/me`（`marketDark`）
 * - **设置子页（Console 浅底）**：`/me/security`、`/me/password`、`/me/onboarding` 等
 */

import { touchTargetLink44Classes } from "@/lib/travelLinkFocus";
import {
  TT_MARKETING_ACCOUNT_CARD,
  TT_MARKETING_ACCOUNT_ERROR_CARD,
  TT_MARKETING_ACCOUNT_ERROR_MAIN,
  TT_MARKETING_ACCOUNT_IDENTITY_CARD,
  TT_MARKETING_ACCOUNT_INNER_3XL,
  TT_MARKETING_ACCOUNT_INNER_5XL,
  TT_MARKETING_ACCOUNT_PAGE_SHELL,
  TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT,
  TT_MARKETING_BTN_SECONDARY_CONSOLE,
  TT_MARKETING_CONSOLE_INLINE_LINK,
  TT_MARKETING_CONSOLE_LINK_FOCUS,
} from "@/lib/uiSystem";

/** 社区资料 / 多重身份 Hub 相关 UI token（顶栏「社区资料」、社区底栏 `me_title`） */
export const ACCOUNT_HUB_PATH = "/community/me";

export {
  TT_MARKETING_ACCOUNT_CARD,
  TT_MARKETING_ACCOUNT_ERROR_CARD,
  TT_MARKETING_ACCOUNT_ERROR_MAIN,
  TT_MARKETING_ACCOUNT_IDENTITY_CARD,
  TT_MARKETING_ACCOUNT_INNER_3XL,
  TT_MARKETING_ACCOUNT_INNER_5XL,
  TT_MARKETING_ACCOUNT_PAGE_SHELL,
};

/** Onboarding / 资格页卡片（与 `ME_ONBOARDING_CARD_CLASS` 同源） */
export const ACCOUNT_CARD_CLASS = TT_MARKETING_ACCOUNT_CARD;

export const ACCOUNT_BTN_PRIMARY_CLASS = TT_MARKETING_BTN_PRIMARY_WARM_SUBMIT;

export const ACCOUNT_BTN_SECONDARY_CLASS = `${TT_MARKETING_BTN_SECONDARY_CONSOLE} px-4 font-semibold enabled:hover:border-ref-sun/45`;

export function accountFooterLinkClass(): string {
  return `${touchTargetLink44Classes} ${TT_MARKETING_CONSOLE_INLINE_LINK} ${TT_MARKETING_CONSOLE_LINK_FOCUS}`;
}

/** 多重身份 Hub 卡片 CTA 行（L5 暖金） */
export const ACCOUNT_IDENTITY_CARD_CTA_CLASS =
  "relative mt-4 inline-flex text-small font-semibold text-ref-sun/88 group-hover:text-ref-sun";
