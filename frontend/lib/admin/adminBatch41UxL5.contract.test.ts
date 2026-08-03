import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第四十一批 UX · P1–P3 收口进绿集 + 财务七件套栅格去孤行。 */
describe("admin batch41 UX L5 (①)", () => {
  it("run-admin-l5-green includes P1–P3 fixes + cross-check page test", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminP1UxFixes.contract.test.ts");
    expect(green).toContain("lib/admin/adminBatch41UxL5.contract.test.ts");
    expect(green).toContain("app/admin/cross-check/page.test.tsx");
  });

  it("finance suite module grid uses 4-column layout to avoid orphan 7th card", () => {
    const pageMain = readFileSync(
      join(fe, "app/admin/finance-suite/AdminFinanceSuitePageMain.tsx"),
      "utf8",
    );
    const model = readFileSync(join(fe, "app/admin/finance-suite/adminFinanceSuitePageModel.ts"), "utf8");
    expect(model.match(/id:/g)?.length).toBeGreaterThanOrEqual(7);
    expect(pageMain).toContain('data-tt-admin-fin-suite-module-grid="1"');
    expect(pageMain).toContain("lg:grid-cols-4");
    expect(pageMain).not.toContain("lg:grid-cols-3");
  });

  it("P1–P3 regression contract file covers batches 1–8 row actions", () => {
    const fixes = readFileSync(join(__dir, "adminP1UxFixes.contract.test.ts"), "utf8");
    expect(fixes).toContain("adminTableRowPrimaryActionClass");
    expect(fixes).toContain("AdminFinanceGovernanceHeaderAside");
    expect(fixes).toContain("reportReasonCodeIsMapped");
    expect(fixes).toContain("P2-4 batch 8");
  });
});
