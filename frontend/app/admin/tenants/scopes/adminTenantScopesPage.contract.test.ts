import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir, "../../../../components/admin");

function readTenantScopesModuleSources(): string {
  return [
    readFileSync(join(componentsAdmin, "AdminListPageChrome.tsx"), "utf8"),
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminTenantScopesPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminTenantScopesListSection.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminTenantScopesPage.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "..", "lib/admin/useAdminStandardListFetch.ts"), "utf8"),
    readFileSync(join(__dir, "adminTenantScopesPageQuery.ts"), "utf8"),
  ].join("\n");
}

describe("admin tenant scopes page", () => {
  const src = readTenantScopesModuleSources();

  it("keeps admin tenant scopes list + publish route builders wired", () => {
    expect(src).toContain("routes.admin.tenantScopes");
    expect(src).toContain("routes.admin.tenantScopePublish");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("parseTenantScopesListQuery");
    expect(src).toContain("buildTenantScopesListPath");
    expect(src).toContain("useAdminStandardListFetch");
  });

  it("keeps search-params suspense shell and list chrome anchor", () => {
    expect(src).toContain("AdminSearchParamsSuspense");
    expect(src).toContain("AdminTenantScopesPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("ADMIN_PERM.PLATFORM_PUBLISH");
    expect(src).toContain('data-tt-admin-list-page="1"');
  });
});
