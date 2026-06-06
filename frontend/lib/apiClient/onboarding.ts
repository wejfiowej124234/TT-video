/**
 * 96-18 准入费 API barrel  shim（`onboarding.ts` 优先于 `onboarding/` 目录解析；全量再导出子目录实现）。
 */
export type { OnboardingQuoteRole, OnboardingPaymentIntentBody } from "./onboarding/types";
export {
  getOnboardingQuote,
  getOnboardingEntitlementsMe,
  postOnboardingPaymentIntent,
  postOnboardingRoleConfirm,
} from "./onboarding/http";
export { postOnboardingLocalDevMarkPaid } from "./onboarding/localDevMarkPaid";
