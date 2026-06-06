import { isOnboardingStripeReturnQuery } from "./meOnboardingPageHelpers";

/** 入驻链路合法来源（未登录仅允许只读报价；直链须登录） */
export const ME_ONBOARDING_GUEST_FROM_VALUES = [
  "steward_pending",
  "steward_register",
  "provider_register",
  "provider_pending",
  "identities_hub",
] as const;

export type MeOnboardingFromContext = (typeof ME_ONBOARDING_GUEST_FROM_VALUES)[number];

export function isMeOnboardingFromContext(raw: string | null): raw is MeOnboardingFromContext {
  return (
    raw != null &&
    (ME_ONBOARDING_GUEST_FROM_VALUES as readonly string[]).includes(raw)
  );
}

type SearchLike = Pick<URLSearchParams, "get" | "has">;

/** 未登录是否允许进入本页（只读报价）；否则应 redirect 登录 */
export function isMeOnboardingGuestEntryAllowed(params: SearchLike): boolean {
  const from = params.get("from");
  if (isMeOnboardingFromContext(from)) return true;
  if (isOnboardingStripeReturnQuery(params)) return true;
  return false;
}
