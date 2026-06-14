import { describe, expect, it } from "vitest";

import { routes } from "@/lib/api/routes";

describe("Sprint 168-B country-market contract", () => {
  it("routes expose country-market launches API", () => {
    expect(routes.adminCountryMarketLaunches).toBe("/api/v1/admin/country-market/launches");
    expect(routes.adminCountryMarketLaunch("abc")).toBe(
      "/api/v1/admin/country-market/launches/abc",
    );
    expect(routes.adminCountryMarketLaunchAdvance("abc")).toBe(
      "/api/v1/admin/country-market/launches/abc/advance",
    );
  });

  it("page main exposes data-tt launch table", async () => {
    const fs = await import("node:fs/promises");
    const src = await fs.readFile(
      "app/admin/content/country-market/AdminCountryMarketPageMain.tsx",
      "utf8",
    );
    expect(src).toContain("data-tt-admin-country-market-launches");
  });
});
