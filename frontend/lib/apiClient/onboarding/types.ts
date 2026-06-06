export type OnboardingQuoteRole = "provider" | "region_steward";

/** Optional query params for **`GET /api/v1/onboarding/quote`** (`fee_schedule_v1`). */
export type OnboardingQuoteQuery = {
  /** Comma-separated ISO2 list; required for **`region_steward`**. */
  jurisdictions?: string;
  fee_schedule_version?: string;
  sku?: string;
};

export type OnboardingPaymentIntentBody = {
  role: OnboardingQuoteRole;
  sku?: string;
  return_url?: string;
  /** Comma-separated ISO2; **region_steward** may omit when steward application exists. */
  jurisdictions?: string;
};
