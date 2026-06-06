import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第五十四批 UX · 社区面包屑去重 + 争议列表 related fold + 对拍槽位 Tab 暖 token。 */
describe("admin batch54 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch54 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch54UxL5.contract.test.ts");
  });

  it("community subnav drops duplicate breadcrumb (related fold only)", () => {
    const subnav = readFileSync(join(fe, "components/admin/AdminCommunitySubnav.tsx"), "utf8");
    const shell = readFileSync(join(fe, "components/admin/AdminCommunityPageShell.tsx"), "utf8");
    expect(subnav).toContain("ADMIN_COMMUNITY_SUBNAV_FOLD_CLASS");
    expect(subnav).not.toContain("admin_community_reports_back");
    expect(subnav).not.toContain("ADMIN_BREADCRUMB_SEPARATOR_CLASS");
    expect(shell).not.toContain("currentLabelKey");
    const reports = readFileSync(join(fe, "app/admin/community/reports/AdminCommunityReportsPageInner.tsx"), "utf8");
    expect(reports).toContain("AdminListPageChrome");
  });

  it("disputes list wires related fold SSOT", () => {
    const model = readFileSync(join(fe, "lib/admin/adminFinanceRelatedFoldLinks.ts"), "utf8");
    expect(model).toContain("DISPUTES_LIST_RELATED_FOLD_LINKS");
    const main = readFileSync(join(fe, "app/admin/disputes/AdminDisputesPageMain.tsx"), "utf8");
    expect(main).toContain("AdminOpsDetailRelatedFold");
    expect(main).toContain("DISPUTES_LIST_RELATED_FOLD_LINKS");
    expect(main).toContain('dataTtFold="disputes-list"');
  });

  it("cross-check slot jump nav uses warm L5 token not raw console white strip", () => {
    const adminUi = readFileSync(join(fe, "lib/adminUi.ts"), "utf8");
    expect(adminUi).toContain("ADMIN_CROSS_CHECK_SLOTS_JUMP_NAV_CLASS");
    const main = readFileSync(join(fe, "app/admin/cross-check/AdminCrossCheckPageMain.tsx"), "utf8");
    expect(main).toContain("ADMIN_CROSS_CHECK_SLOTS_JUMP_NAV_CLASS");
    expect(main).not.toMatch(/slots-jump-nav[\s\S]*bg-bg-console/);
  });
});
