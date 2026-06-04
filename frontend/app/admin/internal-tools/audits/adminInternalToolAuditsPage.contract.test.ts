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
    readFileSync(join(__dir, "AdminInternalToolAuditsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminInternalToolAuditsStatusBlock.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminInternalToolAuditsPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminInternalToolAuditsPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin internal tool audits page", () => {
  const src = readModuleSources();

  it("keeps internal tool audits route + admin fetch + list chrome anchor", () => {
    expect(src).toContain("routes.admin.internalToolAudits");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminInternalToolAuditsPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain('data-tt-admin-list-page="1"');
  });
});
