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
    readFileSync(join(__dir, "AdminMediaAccessLogsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminMediaAccessLogsFiltersCard.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminMediaAccessLogsTableSection.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminMediaAccessLogsPage.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "..", "lib/admin/useAdminStandardListFetch.ts"), "utf8"),
    readFileSync(join(__dir, "adminMediaAccessLogsPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin media access logs page", () => {
  const src = readModuleSources();

  it("keeps media access logs route + admin fetch + list chrome anchor", () => {
    expect(src).toContain("routes.admin.mediaAccessLogs");
    expect(src).toContain("useAdminStandardListFetch");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminMediaAccessLogsPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain('data-tt-admin-list-page="1"');
  });
});
