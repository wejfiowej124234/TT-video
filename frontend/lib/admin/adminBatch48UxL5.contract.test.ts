import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第四十八批 UX · 合规 DSAR 子页 + 审计详情顶栏瘦身。 */
describe("admin batch48 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch48 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch48UxL5.contract.test.ts");
  });

  it("compliance DSAR events page slim header + fold + row action", () => {
    const main = readFileSync(
      join(fe, "app/admin/compliance/requests/[requestId]/events/AdminComplianceRequestEventsPageMain.tsx"),
      "utf8",
    );
    const model = readFileSync(join(fe, "app/admin/compliance/requests/adminComplianceRequestsPageModel.ts"), "utf8");
    expect(main).toContain("AdminOpsDetailRelatedFold");
    expect(main).toContain("complianceDsarEventsRelatedFoldLinks");
    expect(main).toContain("adminTableRowPrimaryActionClass");
    expect(main).toContain('data-tt-admin-compliance-events-back-list="1"');
    expect(main).toContain("ADMIN_FILTER_CARD_CLASS");
    expect(model).toContain("complianceDsarEventsRelatedFoldLinks");
  });

  it("compliance DSAR update page slim header + fold + row action", () => {
    const main = readFileSync(
      join(fe, "app/admin/compliance/requests/[requestId]/update/AdminComplianceRequestUpdatePageMain.tsx"),
      "utf8",
    );
    expect(main).toContain("AdminOpsDetailRelatedFold");
    expect(main).toContain("complianceDsarUpdateRelatedFoldLinks");
    expect(main).toContain("adminTableRowPrimaryActionClass");
    expect(main).toContain('data-tt-admin-compliance-update-back-list="1"');
  });

  it("audit log detail moves ops link to related fold", () => {
    const main = readFileSync(join(fe, "app/admin/audit/logs/[id]/AdminAuditLogDetailPageMain.tsx"), "utf8");
    const model = readFileSync(join(fe, "app/admin/audit/logs/[id]/adminAuditLogDetailPageModel.ts"), "utf8");
    expect(main).toContain("AdminOpsDetailRelatedFold");
    expect(main).toContain("AUDIT_LOG_DETAIL_RELATED_FOLD_LINKS");
    const headerMatch = main.match(/headerAside=\{([\s\S]*?)\}\s*\r?\n\s*>/);
    expect(headerMatch?.[1] ?? "").not.toContain("admin_audit_detail_link_ops");
    expect(model).toContain("/admin/audit/operations");
  });
});
