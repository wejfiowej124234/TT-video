import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const fe = join(__dir, "..", "..");
const repoRoot = join(__dir, "..", "..", "..");

/** ① 第五十一批 UX · indexer 对账详情 + 对账列表顶栏瘦身。 */
describe("admin batch51 UX L5 (①)", () => {
  it("run-admin-l5-green includes batch51 contract", () => {
    const green = readFileSync(join(repoRoot, "scripts/dev/run-admin-l5-green.sh"), "utf8");
    expect(green).toContain("lib/admin/adminBatch51UxL5.contract.test.ts");
  });

  it("reconcile report detail slim header + body tools + related fold", () => {
    const main = readFileSync(
      join(fe, "app/admin/indexer/reconcile/[id]/AdminIndexerReconcileReportPageMain.tsx"),
      "utf8",
    );
    const model = readFileSync(join(fe, "lib/admin/adminIndexerReconcileDetailRelatedFoldLinks.ts"), "utf8");
    expect(main).toContain("AdminOpsDetailRelatedFold");
    expect(main).toContain("INDEXER_RECONCILE_DETAIL_RELATED_FOLD_LINKS");
    expect(main).toContain('data-tt-admin-indexer-reconcile-back-list="1"');
    expect(main).toContain('data-tt-admin-indexer-reconcile-refresh="1"');
    const headerMatch = main.match(/headerAside=\{([\s\S]*?)\}\s*\r?\n\s*>/);
    expect(headerMatch?.[1] ?? "").not.toContain("admin_indexer_reconcile_backIndexer");
    expect(headerMatch?.[1] ?? "").not.toContain("ADMIN_FILTER_RESET_BTN_CLASS");
    expect(model).toContain("/admin/cross-check");
  });

  it("reconcile reports list slim header + export toolbar in body", () => {
    const main = readFileSync(join(fe, "app/admin/indexer/reconcile-reports/ReconcileReportsPageMain.tsx"), "utf8");
    expect(main).toContain("AdminFinanceSectionBackLinks");
    expect(main).toContain("ReconcileReportsExportToolbar");
    expect(main).toContain("RECONCILE_REPORTS_LIST_RELATED_FOLD_LINKS");
    expect(main).toContain('data-tt-admin-reconcile-reports-back-indexer="1"');
    const headerMatch = main.match(/headerAside=\{([\s\S]*?)\}\s*\r?\n\s*>/);
    expect(headerMatch?.[1] ?? "").not.toContain("AdminInboxQueueBackLinks");
    expect(headerMatch?.[1] ?? "").not.toContain("export_csv");
  });
});
