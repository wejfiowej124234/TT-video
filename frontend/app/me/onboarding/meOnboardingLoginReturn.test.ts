import { describe, expect, it } from "vitest";

import {
  buildMeOnboardingAuthReturnPath,
  meOnboardingHref,
  meOnboardingLoginHref,
  meOnboardingLoginReturnUrl,
  meOnboardingRegisterHref,
} from "@/app/me/onboarding/meOnboardingLoginReturn";

describe("meOnboardingLoginReturn", () => {
  it("builds return path and login href with role + from", () => {
    expect(meOnboardingLoginReturnUrl("region_steward", { from: "steward_pending" })).toBe(
      "/governance?view=region&from=steward_pending#steward-b-track-admission",
    );
    expect(meOnboardingHref("provider", { from: "provider_register" })).toBe(
      "/me/onboarding?role=provider&from=provider_register",
    );
    const returnPath = buildMeOnboardingAuthReturnPath(
      new URLSearchParams("role=region_steward&from=steward_pending"),
      "region_steward",
    );
    expect(returnPath).toBe("/governance?view=region&from=steward_pending#steward-b-track-admission");
    expect(meOnboardingLoginHref("region_steward", returnPath)).toBe(
      "/auth/login?returnUrl=%2Fgovernance%3Fview%3Dregion%26from%3Dsteward_pending%23steward-b-track-admission",
    );
  });

  it("preserves from=settings in auth return path", () => {
    const returnPath = buildMeOnboardingAuthReturnPath(
      new URLSearchParams("from=settings"),
      "provider",
    );
    expect(returnPath).toContain("from=settings");
    expect(returnPath).not.toContain("identities_hub");
  });

  it("builds register href with returnUrl deep link", () => {
    const providerReturn = buildMeOnboardingAuthReturnPath(new URLSearchParams("role=provider"), "provider");
    const stewardReturn = buildMeOnboardingAuthReturnPath(
      new URLSearchParams("role=region_steward&from=steward_register"),
      "region_steward",
    );
    expect(meOnboardingRegisterHref("provider", providerReturn)).toContain("from%3Didentities_hub");
    expect(meOnboardingRegisterHref("region_steward", stewardReturn)).toContain(
      "steward-b-track-admission",
    );
  });
});
