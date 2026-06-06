import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));
const componentsAdmin = join(__dir, "../../../components/admin");

function readFlagsModuleSources(): string {
  return [
    readFileSync(join(componentsAdmin, "AdminListPageChrome.tsx"), "utf8"),
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminFlagsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminFlagsListSection.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminFlagsPage.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "lib/admin/useAdminStandardListFetch.ts"), "utf8"),
    readFileSync(join(__dir, "adminFlagsPageQuery.ts"), "utf8"),
  ].join("\n");
}

describe("admin flags page", () => {
  const src = readFlagsModuleSources();

  it("keeps admin flags list + publish route builders wired", () => {
    expect(src).toContain("routes.admin.flags");
    expect(src).toContain("routes.admin.flagPublish");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("parseAdminFlagsListQuery");
    expect(src).toContain("buildAdminFlagsListPath");
    expect(src).toContain("useAdminStandardListFetch");
  });

  it("keeps search-params suspense shell and admin DOM anchor", () => {
    expect(src).toContain("AdminSearchParamsSuspense");
    expect(src).toContain("AdminFlagsPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain('data-tt-admin-list-page="1"');
  });
});
