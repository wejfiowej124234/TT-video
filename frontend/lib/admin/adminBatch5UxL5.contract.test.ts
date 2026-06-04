import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const componentsAdmin = join(fe, "components", "admin");

/** ① 第五批 UX · FIN-02 七面板齐套 / ONB 枢纽双台账卡。 */
describe("admin batch5 UX L5 (①)", () => {
  it("shared AdminFinanceDepthActionLinks wires footer + actions", () => {
    const links = readFileSync(join(componentsAdmin, "AdminFinanceDepthActionLinks.tsx"), "utf8");
    expect(links).toContain("AdminFinanceDepthHonestyFooter");
    expect(links).toContain("data-tt-admin-fin-depth-actions");
  });

  it("onboarding hub ledger cards layout", () => {
    const notice = readFileSync(join(componentsAdmin, "AdminOnboardingStripePhase2Notice.tsx"), "utf8");
    const hub = readFileSync(
      join(fe, "app", "admin", "onboarding", "AdminOnboardingHubPageMain.tsx"),
      "utf8",
    );
    expect(notice).toContain("data-tt-admin-onboarding-hub-ledger-cards");
    expect(notice).toContain("data-tt-admin-onboarding-hub-webhook-ledger");
    expect(notice).toContain("data-tt-admin-onboarding-hub-payment-ledger");
    expect(notice).toContain("data-tt-admin-onboarding-webhook-stripe-echo");
    expect(hub).toContain("AdminOnboardingStripePhase2Notice");
  });

  it("depth panels contract file scans all AdminFinance*DepthPanel", () => {
    const contract = readFileSync(join(__dir, "adminFinanceDepthPanelsL5.contract.test.ts"), "utf8");
    expect(contract).toContain("AdminFinance*DepthPanel");
    expect(contract).toContain("AdminFinanceDepthActionLinks");
  });

  it("e2e prep asserts operator perspective switcher", () => {
    const e2e = readFileSync(
      join(fe, "e2e", "admin-adm-u01-shell-local-prep.spec.ts"),
      "utf8",
    );
    expect(e2e).toContain("data-tt-admin-shell-role-perspective-switcher");
    expect(e2e).toContain("shell bar perspective select");
  });
});
