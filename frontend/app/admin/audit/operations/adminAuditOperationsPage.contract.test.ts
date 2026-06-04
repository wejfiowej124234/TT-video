import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir, "../../../../components/admin");

function readModuleSources(): string {
  return [
    readFileSync(join(componentsAdmin, "AdminListPageChrome.tsx"), "utf8"),
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminAuditOperationsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminAuditOperationsPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminAuditOperationsPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin audit operations page", () => {
  const src = readModuleSources();

  it("keeps audit operations route + admin fetch + list chrome anchor", () => {
    expect(src).toContain("routes.admin.auditOperations");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminAuditOperationsPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain('data-tt-admin-list-page="1"');
  });
});
