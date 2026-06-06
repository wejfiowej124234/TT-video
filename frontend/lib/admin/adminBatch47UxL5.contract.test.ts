import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第四十七批 UX · 评价/向导详情 row-action + 审批详情顶栏瘦身。 */
describe("admin batch47 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch47 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch47UxL5.contract.test.ts");
  });

  it("review detail panel actions use row action tokens", () => {
    const main = readFileSync(join(fe, "app/admin/reviews/[id]/AdminReviewDetailPageMain.tsx"), "utf8");
    expect(main).toContain("adminTableRowPrimaryActionClass");
    expect(main).toContain("adminTableRowSecondaryActionClass");
    expect(main).toContain('data-tt-admin-review-detail-actions="1"');
    expect(main).not.toContain("adminTableInlineLinkClass");
  });

  it("guide detail moves public link to panel primary action", () => {
    const main = readFileSync(join(fe, "app/admin/guides/[id]/AdminGuideDetailPageMain.tsx"), "utf8");
    expect(main).toContain("adminTableRowPrimaryActionClass");
    expect(main).toContain('data-tt-admin-guide-detail-actions="1"');
    expect(main).toContain('data-tt-admin-guide-detail-action-primary="public"');
    const headerMatch = main.match(/headerAside=\{([\s\S]*?)\}\s*\r?\n\s*>/);
    expect(headerMatch?.[1] ?? "").not.toContain("admin_guides_linkPublic");
  });

  it("approval detail slim header + related fold (not header users link)", () => {
    const main = readFileSync(join(fe, "app/admin/approvals/[id]/AdminApprovalDetailPageMain.tsx"), "utf8");
    const model = readFileSync(join(fe, "app/admin/approvals/[id]/adminApprovalDetailPageModel.ts"), "utf8");
    expect(main).toContain("AdminOpsDetailRelatedFold");
    expect(main).toContain("APPROVAL_DETAIL_RELATED_FOLD_LINKS");
    expect(main).not.toContain("data-tt-admin-ops-cross-users");
    expect(model).toContain("/admin/users");
  });

  it("i18n keys exist for approval detail related fold", () => {
    const zh = readFileSync(join(fe, "locales/zh.ts"), "utf8");
    const en = readFileSync(join(fe, "locales/en.ts"), "utf8");
    for (const key of ["admin_approval_detail_related_aria", "admin_approval_detail_related_fold"]) {
      expect(zh).toContain(key);
      expect(en).toContain(key);
    }
  });
});
