import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminConfigReleaseDetailPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminConfigReleaseDetailPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminConfigReleaseDetailPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin config release detail page", () => {
  const src = readModuleSources();

  it("keeps config release route + relist nav + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.configRelease");
    expect(src).toContain("releasesListHrefFromRelistParam");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminConfigReleaseDetailPage"');
    expect(src).toContain("AdminListFetchError");
  });
});
