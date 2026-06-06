import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");

describe("admin finance suite back links L5 (①)", () => {
  it("partial-depth finance pages mount suite back-link SSOT", () => {
    const back = readFileSync(join(fe, "components", "admin", "AdminFinanceSuiteBackLinks.tsx"), "utf8");
    expect(back).toContain("data-tt-admin-fin-back-suite");
    expect(back).not.toContain("AdminInboxQueueBackLinks");
    for (const rel of [
      "app/admin/finance-reconciliation/AdminFinanceReconciliationPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).toContain("AdminFinanceSuiteBackLinks");
      expect(src, rel).not.toContain("AdminFinanceSectionBackLinks");
    }
    for (const rel of [
      "app/admin/cross-check/AdminCrossCheckPageMain.tsx",
      "app/admin/drift-summary/AdminDriftSummaryPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).toContain("AdminFinanceSuiteBackLinks");
      expect(src, rel).toContain("AdminOpsDetailRelatedFold");
      expect(src, rel).not.toContain("AdminFinanceGovernanceHeaderAside");
    }
    for (const rel of [
      "app/admin/finance/AdminFinancePageMain.tsx",
      "app/admin/disputes/AdminDisputesPageMain.tsx",
      "app/admin/audit/AdminAuditPageMain.tsx",
      "app/admin/fee-router/AdminFeeRouterPageMain.tsx",
      "app/admin/region-vault/AdminRegionVaultPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).toContain("AdminFinanceSectionBackLinks");
    }
    expect(
      readFileSync(join(fe, "components", "admin", "AdminFinanceSectionBackLinks.tsx"), "utf8"),
    ).toContain("data-tt-admin-back-observability-hub");
  });
});
