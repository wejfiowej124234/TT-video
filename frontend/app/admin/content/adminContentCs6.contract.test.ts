import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("C-S6 catalog consumer opt-in cutover contract", () => {
  it("consumer resolve + hooks SSOT present", () => {
    expect(() => import("@/lib/catalogApi/resolve.ts")).not.toThrow();
    expect(() => import("@/lib/catalogApi/useCatalogGeo.ts")).not.toThrow();
    expect(() => import("@/lib/catalogApi/useCatalogPoi.ts")).not.toThrow();
    expect(() => import("@/lib/catalogApi/useLandingAmbientUrl.ts")).not.toThrow();
  });

  it("isCatalogApiEnabled defaults false unless env=1", async () => {
    const prev = process.env.NEXT_PUBLIC_CATALOG_API_ENABLED;
    delete process.env.NEXT_PUBLIC_CATALOG_API_ENABLED;
    const mod = await import("@/lib/catalogApi/client.ts");
    expect(mod.isCatalogApiEnabled()).toBe(false);
    process.env.NEXT_PUBLIC_CATALOG_API_ENABLED = "1";
    expect(mod.isCatalogApiEnabled()).toBe(true);
    if (prev === undefined) delete process.env.NEXT_PUBLIC_CATALOG_API_ENABLED;
    else process.env.NEXT_PUBLIC_CATALOG_API_ENABLED = prev;
  });

  it("frontend .env.example does not commit ENABLED=1 default", () => {
    const envExample = readFileSync(
      resolve(process.cwd(), ".env.example"),
      "utf8",
    );
    expect(envExample).toMatch(/NEXT_PUBLIC_CATALOG_API_ENABLED=0/);
    expect(envExample).not.toMatch(/^NEXT_PUBLIC_CATALOG_API_ENABLED=1/m);
  });

  it("staging opt-in env example documents break-glass rollback", () => {
    const staging = readFileSync(
      resolve(process.cwd(), ".env.staging.catalog-opt-in.example"),
      "utf8",
    );
    expect(staging).toContain("NEXT_PUBLIC_CATALOG_API_ENABLED=1");
    expect(staging).toMatch(/Break-Glass|回滚/i);
  });

  it("quote chain remains TS (useQuoteCalculation)", () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        "components/market/CustomItineraryModal/useQuoteCalculation.ts",
      ),
      "utf8",
    );
    expect(src).toContain("getPricingForCountry");
    expect(src).not.toContain("resolveCatalogPricing");
  });

  it("catalog dashboard includes consumer opt-in observability marker", () => {
    const src = readFileSync(
      resolve(
        process.cwd(),
        "app/admin/content/catalog-dashboard/AdminContentCatalogDashboardPageMain.tsx",
      ),
      "utf8",
    );
    expect(src).toContain("data-tt-admin-content-catalog-consumer-summary");
    expect(src).toContain("next_public_catalog_api_enabled_env");
  });
});
