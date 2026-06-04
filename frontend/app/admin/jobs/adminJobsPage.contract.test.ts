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
    readFileSync(join(__dir, "AdminJobsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminJobsPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminJobsPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin jobs page", () => {
  const src = readModuleSources();

  it("keeps admin jobs route + admin fetch + list chrome anchor", () => {
    expect(src).toContain("routes.admin.jobs");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminJobsPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain('data-tt-admin-list-page="1"');
  });
});
