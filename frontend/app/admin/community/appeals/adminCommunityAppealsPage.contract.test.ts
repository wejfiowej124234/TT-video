import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminCommunityAppealsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminCommunityAppealsPage.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "..", "lib/admin/useAdminStandardListFetch.ts"), "utf8"),
    readFileSync(join(__dir, "adminCommunityAppealsPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin community appeals page", () => {
  const src = readModuleSources();

  it("keeps community appeals route + admin fetch + UUID report filter + DOM anchor", () => {
    expect(src).toContain("routes.admin.communityAppeals");
    expect(src).toContain("useAdminStandardListFetch");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("isUuidString");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain('"AdminCommunityAppealsPage"');
  });
});
