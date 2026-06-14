import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin content ops L5 (① · CMS plane)", () => {
  const root = join(process.cwd());

  function read(rel: string): string {
    return readFileSync(join(root, rel), "utf8");
  }

  it("AdminContentPageShell wires sidebar SSOT + permission banners", () => {
    const shell = read("components/admin/content/AdminContentPageShell.tsx");
    expect(shell).toContain("AdminOpsPlanePermissionBanners");
    expect(shell).toContain("OpsPlanePageShell");
    expect(shell).not.toContain("AdminContentCrossNav");
  });

  it("content hub uses sidebar hint not link grid", () => {
    expect(read("app/admin/content/AdminContentHubMain.tsx")).toContain("AdminOpsPlaneSidebarHint");
  });

  it("content PageMain files use AdminContentPageShell chrome", () => {
    for (const page of [
      "app/admin/content/countries/AdminContentCountriesPageMain.tsx",
      "app/admin/content/catalog-dashboard/AdminContentCatalogDashboardPageMain.tsx",
      "app/admin/content/country-market/AdminCountryMarketPageMain.tsx",
    ]) {
      expect(read(page)).toContain("AdminContentPageShell");
    }
  });

  it("country market uses warm L5 table shell", () => {
    const page = read("app/admin/content/country-market/AdminCountryMarketPageMain.tsx");
    expect(page).toContain("OfficialOpsDataTable");
    expect(page).not.toMatch(/<th\b(?![^>]*\bscope=)/);
  });

  it("page chrome contract recognizes content ops plane", () => {
    const test = read("lib/admin/adminPageChromeL5.contract.test.ts");
    expect(test).toContain("AdminContentPageShell");
  });

  it("content list pages use AdminContentDataTable shell", () => {
    for (const page of [
      "app/admin/content/cities/AdminContentCitiesPageMain.tsx",
      "app/admin/content/pois/AdminContentPoisPageMain.tsx",
      "app/admin/content/publish-queue/AdminContentPublishQueuePageMain.tsx",
    ]) {
      expect(read(page)).toContain("AdminContentDataTable");
    }
  });

  it("catalog dashboard + geo use warm KPI/panel kit", () => {
    expect(read("app/admin/content/catalog-dashboard/AdminContentCatalogDashboardPageMain.tsx")).toContain(
      "AdminContentKpiGrid",
    );
    expect(read("app/admin/content/geo-validation/AdminContentGeoValidationPageMain.tsx")).toContain(
      "AdminContentPanelCard",
    );
  });
});
