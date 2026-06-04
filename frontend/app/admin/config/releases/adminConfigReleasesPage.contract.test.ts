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
    readFileSync(join(__dir, "AdminConfigReleasesPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminConfigReleasesFiltersCard.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminConfigReleasesTableSection.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminConfigReleasesPage.ts"), "utf8"),
    readFileSync(join(__dir, "configReleasesPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin config releases page", () => {
  const src = readModuleSources();

  it("keeps admin config releases list route and query helpers", () => {
    expect(src).toContain("routes.admin.configReleases");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("parseConfigReleasesListQuery");
    expect(src).toContain("buildConfigReleasesListPath");
  });

  it("keeps search-params suspense shell and list chrome anchor", () => {
    expect(src).toContain("AdminSearchParamsSuspense");
    expect(src).toContain("AdminConfigReleasesPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain('data-tt-admin-list-page="1"');
    expect(src).toContain("admin-config-releases-filter-form");
  });
});
