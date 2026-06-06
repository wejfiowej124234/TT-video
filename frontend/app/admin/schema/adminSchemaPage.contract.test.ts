import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminSchemaPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminSchemaPage.ts"), "utf8"),
    readFileSync(join(__dir, "..", "..", "..", "lib/admin/useAdminStandardListFetch.ts"), "utf8"),
    readFileSync(join(__dir, "adminSchemaPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin schema page", () => {
  const src = readModuleSources();

  it("keeps schema migrations route + DOM anchor", () => {
    expect(src).toContain("routes.admin.schemaMigrations");
    expect(src).toContain("useAdminStandardListFetch");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain('"AdminSchemaPage"');
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain("AdminListPageEmptyState");
    expect(src).toContain("AdminObservabilitySectionBackLinks");
  });
});
