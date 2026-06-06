import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminAuditLogDetailPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminAuditLogDetailPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminAuditLogDetailPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "../../../../../lib/admin/useAdminStandardDetailFetch.ts"), "utf8"),
  ].join("\n");
}

describe("admin audit log detail page", () => {
  const src = readModuleSources();

  it("keeps audit log by id route + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.auditLogById");
    expect(src).toContain("useAdminStandardDetailFetch");
    expect(src).toContain("audit-log-detail");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminAuditLogDetailPage"');
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("AdminAuditSectionBackLinks");
    expect(src).toContain("AdminOpsDetailRelatedFold");
    expect(src).toContain("AUDIT_LOG_DETAIL_RELATED_FOLD_LINKS");
  });
});
