import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminGuidesPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminGuidesPage.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "lib/admin/useAdminStandardListFetch.ts"), "utf8"),
    readFileSync(join(__dir, "adminGuidesPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin guides page", () => {
  const src = readModuleSources();

  it("keeps admin guides route builder and query helpers", () => {
    expect(src).toContain("routes.admin.guides");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("parseGuidesListQuery");
    expect(src).toContain("buildGuidesListPath");
    expect(src).toContain("useAdminStandardListFetch");
  });

  it("keeps search-params suspense shell and admin DOM anchor", () => {
    expect(src).toContain("AdminSearchParamsSuspense");
    expect(src).toContain("AdminGuidesPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain('ariaLabelKey="admin_guides_title"');
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("ADMIN_PRIMARY_ACTION_BTN_CLASS");
    expect(src).toContain("GUIDES_LIST_RELATED_FOLD_LINKS");
    expect(src).not.toContain("headerAside={<AdminOpsQueueBackLinks />}");
  });
});
