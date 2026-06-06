import { describe, expect, it } from "vitest";

import {
  onboardingEntitlementStatusVariant,
  onboardingRoleConfirmViewFromMe,
  onboardingRoleConfirmedForQuote,
  deriveOnboardingFlowPhase,
  deriveOnboardingConsoleProgressAllComplete,
  deriveOnboardingConsoleProgressStep,
  deriveOnboardingGuestPreviewProgressStep,
  formatOnboardingAmountMinor,
  onboardingProgressStepCount,
  onboardingProgressStepKey,
  parseOnboardingEntitlementsView,
  parseOnboardingPaymentIntentView,
  parseOnboardingQuoteView,
  parseOnboardingRoleConfirmView,
} from "./meOnboardingViewModel";

describe("meOnboardingViewModel", () => {
  it("formats USD minor units", () => {
    expect(formatOnboardingAmountMinor(9900, "USD")).toBe("$99.00");
    expect(formatOnboardingAmountMinor(0, "USD")).toBe("$0.00");
  });

  it("parses quote view", () => {
    const view = parseOnboardingQuoteView(
      {
        status: "ok",
        role: "region_steward",
        sku: "steward-onboarding",
        currency: "USD",
        amount_minor: 0,
        fee_schedule_version: "v1",
        expires_at: "2030-01-01T00:00:00Z",
        meta: { implementation_status: "stub_local" },
      },
      "provider",
    );
    expect(view?.role).toBe("region_steward");
    expect(view?.isStub).toBe(true);
    expect(view?.sku).toBe("steward-onboarding");
  });

  it("parses entitlements view", () => {
    const view = parseOnboardingEntitlementsView({
      status: "ok",
      entitlements: [
        {
          id: "ent-abc-123",
          role_target: "provider",
          sku: "provider-onboarding",
          status: "paid",
        },
      ],
      meta: { implementation_status: "ok" },
    });
    expect(view?.items).toHaveLength(1);
    expect(view?.hasActivePaid).toBe(true);
  });

  it("parses payment intent view", () => {
    const view = parseOnboardingPaymentIntentView({
      status: "ok",
      entitlement_id: "ent-1",
      idempotency_key: "idem-1",
      psp: { checkout_url: "https://checkout.stripe.test" },
      meta: { implementation_status: "stub" },
    });
    expect(view?.hasCheckout).toBe(true);
    expect(view?.entitlementId).toBe("ent-1");
  });

  it("parses role confirm view", () => {
    const view = parseOnboardingRoleConfirmView({
      status: "ok",
      role: "provider",
      user_role: "provider",
      meta: { implementation_status: "ok" },
    });
    expect(view?.role).toBe("provider");
    expect(view?.userRole).toBe("provider");
  });

  it("derives onboarding flow phase", () => {
    expect(
      deriveOnboardingFlowPhase({
        loggedIn: false,
        quoteReady: true,
        hasActivePaid: false,
        hasPaymentDraft: false,
        roleConfirmed: false,
      }),
    ).toBe("login");
    expect(
      deriveOnboardingFlowPhase({
        loggedIn: true,
        quoteReady: true,
        hasActivePaid: true,
        hasPaymentDraft: true,
        roleConfirmed: false,
      }),
    ).toBe("confirm");
    expect(
      deriveOnboardingFlowPhase({
        loggedIn: true,
        quoteReady: true,
        hasActivePaid: false,
        hasPaymentDraft: true,
        roleConfirmed: false,
      }),
    ).toBe("pay_pending");
  });

  it("guest preview highlights fee step on console progress", () => {
    expect(deriveOnboardingGuestPreviewProgressStep("region_steward")).toBe(3);
    expect(deriveOnboardingGuestPreviewProgressStep("provider")).toBe(3);
  });

  it("derives console progress step from flow phase", () => {
    expect(deriveOnboardingConsoleProgressStep("login", "region_steward")).toBe(1);
    expect(deriveOnboardingConsoleProgressStep("quote", "region_steward")).toBe(2);
    expect(deriveOnboardingConsoleProgressStep("pay", "region_steward")).toBe(3);
    expect(deriveOnboardingConsoleProgressStep("confirm", "provider")).toBe(3);
    expect(deriveOnboardingConsoleProgressAllComplete("done")).toBe(true);
    expect(deriveOnboardingConsoleProgressAllComplete("pay")).toBe(false);
  });

  it("progress helpers follow role", () => {
    expect(onboardingProgressStepCount("provider")).toBe(5);
    expect(onboardingProgressStepCount("region_steward")).toBe(3);
    expect(onboardingProgressStepKey("provider", 3)).toBe("providerProgress_step3");
    expect(onboardingProgressStepKey("region_steward", 2)).toBe("stewardProgress_step2");
  });

  it("maps entitlement status variant for pills", () => {
    expect(onboardingEntitlementStatusVariant("paid")).toBe("paid");
    expect(onboardingEntitlementStatusVariant("active")).toBe("paid");
    expect(onboardingEntitlementStatusVariant("pending")).toBe("pending");
    expect(onboardingEntitlementStatusVariant("unknown")).toBe("neutral");
  });

  it("restores role confirm from GET /me after refresh", () => {
    expect(
      onboardingRoleConfirmedForQuote({ user: { id: "u1", role: "provider" } }, "provider"),
    ).toBe(true);
    expect(
      onboardingRoleConfirmedForQuote({ user: { id: "u1", role: "provider" } }, "region_steward"),
    ).toBe(false);
    const view = onboardingRoleConfirmViewFromMe({ user: { id: "u1", role: "region_steward" } }, "region_steward");
    expect(view?.userRole).toBe("region_steward");
  });
});
