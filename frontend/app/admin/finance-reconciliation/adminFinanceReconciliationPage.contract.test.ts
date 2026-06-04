import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const __dir = join(__dirname);

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminFinanceReconciliationPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminFinanceReconciliationPageHeader.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminFinanceReconciliationApiSection.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminFinanceReconciliationDriftSection.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminFinanceReconciliationNavSection.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminFinanceReconciliationPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminFinanceReconciliationPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin finance-reconciliation page (contract)", () => {
  it("keeps admin fetch label, finance summary route, and hub surface markers", () => {
    const src = readModuleSources();
    expect(src).toContain('"AdminFinanceReconciliationPage"');
    expect(src).toContain("routes.admin.financeSummary");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("FinanceReconciliationEpicDHint");
    expect(src).toContain("FINANCE_RECONCILIATION_NAV_LINKS");
    expect(src).toContain("AdminListFetchError");
  });
});
