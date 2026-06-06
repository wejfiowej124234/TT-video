import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminPoliciesPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminPoliciesListSection.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminPoliciesPage.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "lib/admin/useAdminStandardListFetch.ts"), "utf8"),
    readFileSync(join(__dir, "adminPoliciesPageQuery.ts"), "utf8"),
  ].join("\n");
}

describe("admin policies page", () => {
  const src = readModuleSources();

  it("keeps thin shell + policies list routes", () => {
    expect(src).toContain("routes.admin.policies");
    expect(src).toContain("useAdminStandardListFetch");
    expect(src).toContain("AdminPoliciesPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain('ariaLabelKey="admin_policies_title"');
  });
});
