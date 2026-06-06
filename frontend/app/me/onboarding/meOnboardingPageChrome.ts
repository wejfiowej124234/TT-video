import { TT_ME_ONBOARDING_L5 } from "@/lib/me/meOnboardingL5";

/** @deprecated 请从 `@/lib/accountUi` 引用；本文件保留 onboarding 段别名。 */
export {
  ACCOUNT_BTN_PRIMARY_CLASS as ME_ONBOARDING_BTN_PRIMARY_CLASS,
  ACCOUNT_BTN_SECONDARY_CLASS as ME_ONBOARDING_BTN_SECONDARY_CLASS,
  ACCOUNT_CARD_CLASS as ME_ONBOARDING_CARD_CLASS,
  accountFooterLinkClass as meOnboardingFooterLinkClass,
} from "@/lib/accountUi";

/** Console L5 暖壳卡片（onboarding 段专用） */
export const ME_ONBOARDING_SECTION_CARD_CLASS = TT_ME_ONBOARDING_L5.sectionCard;
