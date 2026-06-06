import { describe, expect, it } from "vitest";

import {
  isMeOnboardingGuestEntryAllowed,
  isMeOnboardingFromContext,
} from "@/app/me/onboarding/meOnboardingGuestAccess";

describe("meOnboardingGuestAccess", () => {
  it("allows whitelisted from= onboarding chain entry", () => {
    expect(isMeOnboardingFromContext("steward_pending")).toBe(true);
    expect(isMeOnboardingFromContext("identities_hub")).toBe(true);
    expect(isMeOnboardingFromContext("random")).toBe(false);
    expect(
      isMeOnboardingGuestEntryAllowed(new URLSearchParams("role=region_steward&from=steward_pending")),
    ).toBe(true);
    expect(
      isMeOnboardingGuestEntryAllowed(new URLSearchParams("role=provider&from=provider_register")),
    ).toBe(true);
  });

  it("denies bare /me/onboarding without chain context", () => {
    expect(isMeOnboardingGuestEntryAllowed(new URLSearchParams())).toBe(false);
    expect(isMeOnboardingGuestEntryAllowed(new URLSearchParams("role=region_steward"))).toBe(false);
  });

  it("allows Stripe return query for payment sync handoff", () => {
    expect(
      isMeOnboardingGuestEntryAllowed(new URLSearchParams("session_id=cs_test&role=region_steward")),
    ).toBe(true);
  });
});
