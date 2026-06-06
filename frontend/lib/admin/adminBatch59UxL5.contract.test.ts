import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第五十九批 UX · 页头 slate 字色 · 详情顶栏 dedupe · 社区可观测 subtitle。 */
describe("admin batch59 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch59 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch59UxL5.contract.test.ts");
  });

  it("list/detail page chrome uses slate title + subtitle tokens", () => {
    const adminUi = readFileSync(join(fe, "lib/adminUi.ts"), "utf8");
    expect(adminUi).toContain("ADMIN_PAGE_CHROME_TITLE_CLASS");
    expect(adminUi).toMatch(/ADMIN_PAGE_CHROME_TITLE_CLASS[\s\S]*text-slate-100/);
    expect(adminUi).toMatch(/ADMIN_PAGE_CHROME_SUBTITLE_CLASS[\s\S]*text-slate-300/);
    const listChrome = readFileSync(join(fe, "components/admin/AdminListPageChrome.tsx"), "utf8");
    const detailChrome = readFileSync(join(fe, "components/admin/AdminDetailPageChrome.tsx"), "utf8");
    expect(listChrome).toContain("ADMIN_PAGE_CHROME_TITLE_CLASS");
    expect(detailChrome).toContain("ADMIN_PAGE_CHROME_SUBTITLE_CLASS");
    expect(listChrome).not.toContain("text-ink-900");
    expect(detailChrome).not.toContain("text-ink-600");
  });

  it("ops detail pages move back links + observability into related fold", () => {
    const model = readFileSync(join(fe, "lib/admin/adminOpsListRelatedFoldLinks.ts"), "utf8");
    expect(model).toContain("ADMIN_OPS_OBSERVABILITY_RELATED_LINK");
    for (const rel of [
      "app/admin/orders/[id]/AdminOrderDetailPageMain.tsx",
      "app/admin/users/[id]/AdminUserDetailPageMain.tsx",
      "app/admin/approvals/[id]/AdminApprovalDetailPageMain.tsx",
      "app/admin/reviews/[id]/AdminReviewDetailPageMain.tsx",
      "app/admin/guides/[id]/AdminGuideDetailPageMain.tsx",
    ]) {
      const src = readFileSync(join(fe, rel), "utf8");
      expect(src, rel).not.toContain("AdminOpsQueueBackLinks");
      expect(src, rel).not.toContain("headerAside=");
    }
    const orderModel = readFileSync(join(fe, "app/admin/orders/[id]/adminOrderDetailPageModel.ts"), "utf8");
    expect(orderModel).toMatch(/ORDER_DETAIL_RELATED_FOLD_LINKS[\s\S]*ADMIN_OPS_OBSERVABILITY_RELATED_LINK/);
    expect(orderModel).toContain("admin-order-detail-back-list");
  });

  it("community observability lives in AdminCommunityRelatedLinks not header aside", () => {
    const related = readFileSync(join(fe, "components/admin/AdminCommunityRelatedLinks.tsx"), "utf8");
    expect(related).toContain('href: "/admin/observability"');
    expect(related).toContain("data-tt-admin-back-observability-hub");
    const aside = readFileSync(join(fe, "components/admin/AdminCommunityListHeaderAside.tsx"), "utf8");
    expect(aside).not.toContain("admin_observability_title");
    const reports = readFileSync(
      join(fe, "app/admin/community/reports/AdminCommunityReportsPageInner.tsx"),
      "utf8",
    );
    expect(reports).toContain("AdminCommunityRelatedLinks");
    expect(reports).not.toContain("AdminCommunityListHeaderAside");
    const disputesModel = readFileSync(join(fe, "lib/admin/adminFinanceRelatedFoldLinks.ts"), "utf8");
    expect(disputesModel).toMatch(/DISPUTES_LIST_RELATED_FOLD_LINKS[\s\S]*ADMIN_OPS_OBSERVABILITY_RELATED_LINK/);
  });
});
