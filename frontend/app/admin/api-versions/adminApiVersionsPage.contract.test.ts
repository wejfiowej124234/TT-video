import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir, "../../../components/admin");

function readModuleSources(): string {
  return [
    readFileSync(join(componentsAdmin, "AdminListPageChrome.tsx"), "utf8"),
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApiVersionsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApiVersionsFiltersCard.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApiVersionsFiltersTail.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApiVersionsMetaNote.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminApiVersionsTableSection.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminApiVersionsPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminApiVersionsPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin api-versions page", () => {
  const src = readModuleSources();

  it("keeps admin api versions list route and query helpers", () => {
    expect(src).toContain("routes.admin.apiVersions");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("parseAdminApiVersionsListQuery");
    expect(src).toContain("buildAdminApiVersionsListPath");
  });

  it("keeps search-params suspense shell and list chrome anchor", () => {
    expect(src).toContain("AdminSearchParamsSuspense");
    expect(src).toContain("AdminApiVersionsPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain('data-tt-admin-list-page="1"');
    expect(src).toContain("admin-api-versions-filter-form");
  });
});
