import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminAlertIncidentDetailPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminAlertIncidentDetailPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminAlertIncidentDetailPageModel.ts"), "utf8"),
    readFileSync(join(__dir, "../../../../../lib/admin/useAdminStandardDetailFetch.ts"), "utf8"),
  ].join("\n");
}

describe("admin alert incident detail page", () => {
  const src = readModuleSources();

  it("keeps alert incident route + admin fetch + DOM anchor", () => {
    expect(src).toContain("routes.admin.alertIncident");
    expect(src).toContain("useAdminStandardDetailFetch");
    expect(src).toContain("alert-incident-detail");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminDetailPageChrome");
    expect(src).toContain('"AdminAlertIncidentDetailPage"');
    expect(src).toContain("AdminListFetchError");
  });
});
