import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

/** ONB-04 · ① Stripe 诚实边界通知。 */
describe("admin onboarding hub L5 (①)", () => {
  const hub = readFileSync(join(__dir, "AdminOnboardingHubPageMain.tsx"), "utf8");
  const hook = readFileSync(
    join(__dir, "..", "..", "..", "lib", "admin", "useAdminOnboardingWebhookJobsCount.ts"),
    "utf8",
  );
  const notice = readFileSync(
    join(__dir, "..", "..", "..", "components", "admin", "AdminOnboardingStripePhase2Notice.tsx"),
    "utf8",
  );

  it("mounts Stripe phase2 honesty notice with webhook jobs link", () => {
    expect(hub).toContain("AdminOnboardingStripePhase2Notice");
    expect(hub).toContain("useAdminOnboardingWebhookJobsCount");
    expect(notice).toContain("admin-onboarding-stripe-phase2-notice");
    expect(notice).toContain("/admin/onboarding/webhook-jobs");
    expect(notice).toContain("admin-onboarding-hub-ledger");
    expect(notice).toContain("onWebhookReload");
    expect(notice).toContain("admin_onboarding_stripe_phase2_notice");
    expect(notice).toContain("admin_onboarding_webhook_ledger_count");
    expect(notice).toContain("data-tt-admin-onboarding-webhook-ledger");
    expect(hook).toContain("fetchAdminQueueList");
    expect(notice).toContain("data-tt-admin-onboarding-webhook-latest");
    expect(notice).toContain("admin_onboarding_webhook_ledger_latest");
    expect(notice).toContain("admin_onboarding_webhook_stripe_echo");
    expect(hook).toContain("extractWebhookStripeEcho");
    expect(hub).toContain("useAdminOnboardingPaymentEventsStripeEcho");
    expect(notice).toContain("data-tt-admin-onboarding-hub-payment-ledger");
  });
});
