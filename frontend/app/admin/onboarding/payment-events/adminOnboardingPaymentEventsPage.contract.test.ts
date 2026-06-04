import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir, "..", "..", "..", "..", "components", "admin");

describe("admin onboarding payment events list L5 (①)", () => {
  it("keeps stripe echo column anchors", () => {
    const src = [
      readFileSync(join(__dir, "page.tsx"), "utf8"),
      readFileSync(join(componentsAdmin, "AdminOnboardingListPage.tsx"), "utf8"),
    ].join("\n");
    expect(src).toContain("stripeEchoColumn");
    expect(src).toContain("admin_onb_payment_events_title");
    expect(src).toContain("extractWebhookStripeEcho");
    expect(src).toContain("data-tt-admin-onboarding-payment-stripe-echo");
    expect(src).toContain("AdminOnboardingPaymentEventsStripeEchoStrip");
  });
});
