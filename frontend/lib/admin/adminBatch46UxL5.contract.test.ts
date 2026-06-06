import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第四十六批 UX · 运维详情页 row-action token + 用户详情顶栏瘦身。 */
describe("admin batch46 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch46 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch46UxL5.contract.test.ts");
  });

  it("order detail panel actions use row action tokens", () => {
    const main = readFileSync(join(fe, "app/admin/orders/[id]/AdminOrderDetailPageMain.tsx"), "utf8");
    expect(main).toContain("adminTableRowPrimaryActionClass");
    expect(main).toContain("adminTableRowSecondaryActionClass");
    expect(main).toContain('data-tt-admin-order-detail-actions="1"');
    expect(main).not.toContain("adminTableInlineLinkClass");
  });

  it("dispute detail panel actions use row action tokens", () => {
    const main = readFileSync(join(fe, "app/admin/disputes/[id]/AdminDisputeDetailPageMain.tsx"), "utf8");
    expect(main).toContain("adminTableRowPrimaryActionClass");
    expect(main).toContain("adminTableRowSecondaryActionClass");
    expect(main).toContain('data-tt-admin-dispute-detail-actions="1"');
    expect(main).not.toContain("adminTableInlineLinkClass");
  });

  it("user detail slim header + related fold (not header link wall)", () => {
    const main = readFileSync(join(fe, "app/admin/users/[id]/AdminUserDetailPageMain.tsx"), "utf8");
    const model = readFileSync(join(fe, "app/admin/users/[id]/adminUserDetailPageModel.ts"), "utf8");
    expect(main).toContain("AdminOpsDetailRelatedFold");
    expect(main).toContain("USER_DETAIL_RELATED_FOLD_LINKS");
    expect(main).not.toContain("data-tt-admin-ops-cross-approvals");
    expect(model).toContain("USER_DETAIL_RELATED_FOLD_LINKS");
    expect(model).toContain("/admin/approvals");
  });

  it("AdminOpsDetailRelatedFold SSOT exposes fold data attr", () => {
    const fold = readFileSync(join(fe, "components/admin/AdminOpsDetailRelatedFold.tsx"), "utf8");
    expect(fold).toContain("data-tt-admin-ops-detail-related-fold");
    expect(fold).toContain("ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS");
  });
});
