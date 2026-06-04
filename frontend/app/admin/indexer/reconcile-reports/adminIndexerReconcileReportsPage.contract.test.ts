import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir, "../../../../components/admin");

function readReconcileReportsModuleSources(): string {
  return [
    readFileSync(join(componentsAdmin, "AdminListPageChrome.tsx"), "utf8"),
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "ReconcileReportsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "ReconcileReportsTableSection.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminIndexerReconcileReportsPage.ts"), "utf8"),
    readFileSync(join(__dir, "useAdminIndexerReconcileReportsPageListFetch.ts"), "utf8"),
    readFileSync(join(__dir, "reconcileReportsPageExportDownload.ts"), "utf8"),
    readFileSync(join(__dir, "reconcileReportsPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin indexer reconcile-reports page", () => {
  const src = readReconcileReportsModuleSources();

  it("keeps admin list + export route builders wired", () => {
    expect(src).toContain("routes.admin.indexerReconcileReports");
    expect(src).toContain("routes.admin.indexerReconcileReportsExport");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("parseListQuery");
    expect(src).toContain("buildListPath");
  });

  it("keeps search-params suspense shell and list chrome anchor", () => {
    expect(src).toContain("AdminSearchParamsSuspense");
    expect(src).toContain("ReconcileReportsPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain('data-tt-admin-list-page="1"');
    expect(src).toContain('ariaLabelKey="admin_indexer_reconcile_reports_title"');
  });
});
