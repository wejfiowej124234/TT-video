import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

describe("AdminOnboardingListPage (①)", () => {
  const src = readFileSync(join(__dir, "AdminOnboardingListPage.tsx"), "utf8");

  it("keeps fetch error kind + empty state + onboarding list anchor", () => {
    expect(src).toContain("TT_ADMIN_PAGE_INNER_DETAIL");
    expect(src).not.toContain("TT_MARKETING_ADMIN_INNER_4XL");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("AdminListPageEmptyState");
    expect(src).toContain('data-tt-admin-onboarding-list="1"');
    expect(src).toContain("data-tt-admin-onboarding-list-body-canvas");
    expect(src).toContain("AdminWarmL5Surface");
    expect(src).toContain("AdminOnboardingHubBackLinks");
    expect(src).toContain("ADMIN_TABLE_SECTION_CLASS");
    expect(src).toContain("ADMIN_EMPTY_NEXT_ONBOARDING_LIST_EMPTY");
    expect(src).toContain("setError(errorKind)");
    expect(src).not.toContain("setError(adminErrorUserText");
  });

  it("keeps stripe echo column for payment-events and webhook jobs", () => {
    expect(src).toContain("stripeEchoColumn");
    expect(src).toContain("showStripeEchoColumn");
    expect(src).toContain("data-tt-admin-onboarding-payment-stripe-echo");
    expect(src).toContain("data-tt-admin-onboarding-webhook-row-stripe-echo");
    expect(src).toContain("extractWebhookStripeEcho");
    expect(src).toContain("AdminOnboardingPaymentEventsStripeEchoStrip");
  });
});
