import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminComplianceRequestUpdatePageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminComplianceRequestUpdatePage.ts"), "utf8"),
    readFileSync(join(__dir, "adminComplianceRequestUpdatePageModel.ts"), "utf8"),
    readFileSync(join(__dir, "../../adminComplianceRequestsPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin compliance request update page", () => {
  const src = readModuleSources();

  it("keeps DSAR update route + POST + meta build + DOM anchor", () => {
    expect(src).toContain("routes.admin.complianceDataRequestUpdate");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminComplianceRequestUpdatePage"');
    expect(src).toContain("useAdminMetaBuildFromPublicMeta");
    expect(src).toContain('"AdminComplianceUpdateMetaBuild"');
    expect(src).toMatch(/data-tt-admin-compliance-update-readonly/);
    expect(src).toContain("AdminOpsDetailRelatedFold");
    expect(src).toContain("complianceDsarUpdateRelatedFoldLinks");
  });
});
