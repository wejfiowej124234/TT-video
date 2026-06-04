import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dir = dirname(fileURLToPath(import.meta.url));

function readModuleSources(): string {
  return [
    readFileSync(join(__dir, "page.tsx"), "utf8"),
    readFileSync(join(__dir, "AdminRegionVaultPageMain.tsx"), "utf8"),
    readFileSync(join(__dir, "useAdminRegionVaultPage.ts"), "utf8"),
    readFileSync(join(__dir, "adminRegionVaultPageModel.ts"), "utf8"),
  ].join("\n");
}

describe("admin region vault page", () => {
  const src = readModuleSources();

  it("keeps region vault forwarded-events route + DOM anchor", () => {
    expect(src).toContain("routes.admin.regionVaultForwardedEvents");
    expect(src).toContain("adminFetchJson");
    expect(src).toContain("AdminListPageChrome");
    expect(src).toContain('"AdminRegionVaultPage"');
    expect(src).toContain("AdminFinanceModuleDepthWorkspace");
    expect(src).toContain("AdminSearchParamsSuspense");
  });
});
