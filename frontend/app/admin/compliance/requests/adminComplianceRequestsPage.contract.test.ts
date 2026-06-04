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
    readFileSync(join(__dir, "AdminComplianceRequestsPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminComplianceRequestsStatusBlock.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminComplianceRequestsPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminComplianceRequestsPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin compliance requests page", () => {
  const src = readModuleSources();

  it("keeps compliance DSAR list route + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.complianceDataRequests");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminComplianceRequestsPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain("AdminListFetchError");
    expect(src).toContain('data-tt-admin-list-page="1"');
  });
});
