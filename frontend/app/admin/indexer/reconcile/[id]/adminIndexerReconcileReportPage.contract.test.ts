import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminIndexerReconcileReportPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminIndexerReconcileReportPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminIndexerReconcileReportPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "adminIndexerReconcileReportPageDigests.tsx"), "utf8"),
  ].join("\n");
}

describe("admin indexer reconcile report page", () => {
  const src = readModuleSources();

  it("keeps indexer reconcile report route + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.indexerReconcileReport");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminIndexerReconcileReportPage"');
    expect(src).toContain("AdminListFetchError");
  });
});
