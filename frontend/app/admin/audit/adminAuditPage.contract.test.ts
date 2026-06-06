import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminAuditPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminAuditFiltersBlock.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminAuditPage.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "lib/admin/useAdminStandardListFetch.ts"), "utf8"),
    readFileSync(join(__dir, "AdminAuditTableSection.tsx"), "utf8"),
  ].join("\n");
}

describe("admin audit page", () => {
  const src = readModuleSources();

  it("keeps thin shell + audit list fetch + L5 anchors", () => {
    expect(src).toContain("useAdminAuditPage");
    expect(src).toContain("AdminAuditPageMain");
    expect(src).toContain("useAdminStandardListFetch");
    expect(src).toContain("routes.admin.auditLogs");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminAuditQuickFilters");
    expect(src).toContain("ADMIN_PRIMARY_ACTION_BTN_CLASS");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("AdminFinanceModuleDepthWorkspace");
    expect(src).toContain("AdminPermissionDeniedBanner");
  });
});
