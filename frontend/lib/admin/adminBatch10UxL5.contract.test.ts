import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");
const appAdmin = join(fe, "app", "admin");

/** ① 第十批 UX · 举报向导 focus trap / 首页 Phase② 快捷复制 / ONB Stripe 重试。 */
describe("admin batch10 UX L5 (①)", () => {
  it("reports moderation wizard focus trap + scrim dismiss", () => {
    const wizard = readFileSync(
      join(appAdmin, "community", "reports", "AdminCommunityReportsModerationWizard.tsx"),
      "utf8",
    );
    expect(wizard).toContain("AdminDialogFocusPanel");
    expect(wizard).toContain('trapId="reports-wizard"');
  });

  it("home phase2 prep with L5 green copy in maintainer fold", () => {
    const maintainer = readFileSync(join(componentsAdmin, "AdminHomeMaintainerFold.tsx"), "utf8");
    const notice = readFileSync(join(componentsAdmin, "AdminHomePhase2PrepNotice.tsx"), "utf8");
    expect(maintainer).toContain("AdminHomePhase2PrepNotice");
    expect(notice).toContain("data-tt-admin-home-phase2-quick-prep");
    expect(notice).toContain("ADMIN_PHASE2_RUNBOOK_QUICK_COMMANDS");
  });

  it("onboarding payment stripe echo retry", () => {
    const strip = readFileSync(
      join(componentsAdmin, "AdminOnboardingPaymentEventsStripeEchoStrip.tsx"),
      "utf8",
    );
    expect(strip).toContain("data-tt-admin-onboarding-payment-stripe-echo-retry");
    expect(strip).toContain("ledger.reload");
  });

  it("phase2 runbook includes closure skeleton generator", () => {
    const ssot = readFileSync(join(__dir, "adminPhase2LocalPrepCommands.ts"), "utf8");
    expect(ssot).toContain("closure-skeleton");
    expect(ssot).toContain("generate-phase2-admin-closure-skeleton.sh");
  });
});
