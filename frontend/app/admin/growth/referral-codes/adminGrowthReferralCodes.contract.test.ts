import { describe, expect, it } from "vitest";

import { REGISTER_ERROR_KEYS } from "@/app/auth/register/registerPageModel";
import { routes } from "@/lib/api/routes";

describe("G-S1 referral contract", () => {
  it("routes expose growth validate and admin referral CRUD", () => {
    expect(routes.growthReferralsValidate).toBe("/api/v1/growth/referrals/validate");
    expect(routes.adminGrowthReferralCodes).toBe("/api/v1/admin/growth/referral-codes");
  });

  it("register model maps referral API error keys", () => {
    expect(REGISTER_ERROR_KEYS.referral_code_invalid).toBe("auth_register_error_referralCodeInvalid");
    expect(REGISTER_ERROR_KEYS.referral_rate_limited).toBe("auth_register_error_referralRateLimited");
  });
});
