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
    readFileSync(join(__dir, "AdminAlertIncidentsHubPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminAlertIncidentsHubPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminAlertIncidentsHubPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin alert incidents hub page", () => {
  const src = readModuleSources();

  it("keeps incident_id query + meta build + list chrome anchor", () => {
    expect(src).toContain("incident_id");
    expect(src).toContain("AdminAlertIncidentsHubMetaBuild");
    expect(src).toContain("/admin/alerts/incidents");
    expect(src).toContain("AdminAlertIncidentsHubPageMain");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain('data-tt-admin-list-page="1"');
  });
});
