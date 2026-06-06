import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第五十三批 UX · 审计清单剩余 ① 项：ops 列表/详情 related fold + 枢纽 + auth-audit 顶栏瘦身。 */
describe("admin batch53 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch53 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch53UxL5.contract.test.ts");
  });

  it("ops list and detail pages wire related fold SSOT", () => {
    for (const [rel, token] of [
      ["app/admin/orders/AdminOrdersPageMain.tsx", "ORDERS_LIST_RELATED_FOLD_LINKS"],
      ["app/admin/guides/AdminGuidesPageMain.tsx", "GUIDES_LIST_RELATED_FOLD_LINKS"],
      ["app/admin/reviews/AdminReviewsPageMain.tsx", "REVIEWS_LIST_RELATED_FOLD_LINKS"],
      ["app/admin/orders/[id]/AdminOrderDetailPageMain.tsx", "ORDER_DETAIL_RELATED_FOLD_LINKS"],
      ["app/admin/disputes/[id]/AdminDisputeDetailPageMain.tsx", "DISPUTE_DETAIL_RELATED_FOLD_LINKS"],
    ] as const) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).toContain("AdminOpsDetailRelatedFold");
      expect(src, rel).toContain(token);
    }
  });

  it("audit, compliance, hub pages wire related fold", () => {
    for (const [rel, token] of [
      ["app/admin/audit/operations/AdminAuditOperationsPageMain.tsx", "auditPeerRelatedFoldLinks"],
      ["app/admin/auth-audit-events/AdminAuthAuditEventsPageMain.tsx", "auditPeerRelatedFoldLinks"],
      ["app/admin/compliance/requests/AdminComplianceRequestsPageMain.tsx", "COMPLIANCE_REQUESTS_LIST_RELATED_FOLD_LINKS"],
      ["app/admin/finance-suite/AdminFinanceSuitePageMain.tsx", "FINANCE_SUITE_HUB_RELATED_FOLD_LINKS"],
      ["app/admin/onboarding/AdminOnboardingHubPageMain.tsx", "ONBOARDING_HUB_RELATED_FOLD_LINKS"],
      ["app/admin/permissions/AdminPermissionsPageMain.tsx", "PERMISSIONS_PAGE_RELATED_FOLD_LINKS"],
      ["app/admin/operator-guide/AdminOperatorGuidePageMain.tsx", "OPERATOR_GUIDE_RELATED_FOLD_LINKS"],
    ] as const) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).toContain(token);
    }
  });

  it("auth audit refresh moves from header to body", () => {
    const main = readFileSync(join(fe, "app/admin/auth-audit-events/AdminAuthAuditEventsPageMain.tsx"), "utf8");
    expect(main).toContain('data-tt-admin-auth-audit-refresh="1"');
    const headerMatch = main.match(/headerAside=\{([\s\S]*?)\}\s*\r?\n\s*>/);
    expect(headerMatch?.[1] ?? "").not.toContain("admin_trust_growth_refresh");
  });

  it("orphaned AdminFinanceGovernanceHeaderAside removed", () => {
    expect(() =>
      readFileSync(join(fe, "components/admin/AdminFinanceGovernanceHeaderAside.tsx"), "utf8"),
    ).toThrow();
  });
});
