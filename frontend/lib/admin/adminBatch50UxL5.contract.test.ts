import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第五十批 UX · 评价列表行操作 + 财务治理顶栏瘦身 + 告警/入驻详情折叠。 */
describe("admin batch50 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch50 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch50UxL5.contract.test.ts");
  });

  it("reviews list row actions use pill tokens not inline link", () => {
    const table = readFileSync(join(fe, "app/admin/reviews/AdminReviewsTableSection.tsx"), "utf8");
    expect(table).toContain("adminTableRowPrimaryActionClass");
    expect(table).toContain("adminTableRowSecondaryActionClass");
    expect(table).not.toContain("adminTableInlineLinkClass");
  });

  it("governance read-only pages slim header + related fold SSOT", () => {
    const model = readFileSync(join(fe, "lib/admin/adminFinanceGovernanceRelatedFoldLinks.ts"), "utf8");
    expect(model).toContain("financeGovernanceRelatedFoldLinks");
    for (const rel of [
      "app/admin/cross-check/AdminCrossCheckPageMain.tsx",
      "app/admin/drift-summary/AdminDriftSummaryPageMain.tsx",
      "app/admin/finance-reconciliation/AdminFinanceReconciliationPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).toContain("AdminFinanceSuiteBackLinks");
      expect(src, rel).toContain("AdminOpsDetailRelatedFold");
      expect(src, rel).toContain("financeGovernanceRelatedFoldLinks");
      expect(src, rel).not.toContain("AdminFinanceGovernanceHeaderAside");
    }
  });

  it("cross-check slot jump nav uses page nav link token", () => {
    const main = readFileSync(join(fe, "app/admin/cross-check/AdminCrossCheckPageMain.tsx"), "utf8");
    expect(main).toContain("adminPageNavLinkClass");
    expect(main).not.toContain("adminTableInlineLinkClass");
  });

  it("alert incident and onboarding entitlement details add related fold", () => {
    const alert = readFileSync(
      join(fe, "app/admin/alerts/incidents/[id]/AdminAlertIncidentDetailPageMain.tsx"),
      "utf8",
    );
    const onboarding = readFileSync(
      join(fe, "app/admin/onboarding/entitlements/[id]/AdminOnboardingEntitlementDetailPageMain.tsx"),
      "utf8",
    );
    expect(alert).toContain("ALERT_INCIDENT_DETAIL_RELATED_FOLD_LINKS");
    expect(onboarding).toContain("ONBOARDING_ENTITLEMENT_DETAIL_RELATED_FOLD_LINKS");
  });
});
