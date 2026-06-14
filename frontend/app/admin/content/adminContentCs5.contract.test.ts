import { describe, expect, it } from "vitest";
import { routes } from "@/lib/api/routes";

describe("C-S5 catalog server geo validation operations contract", () => {
  it("routes expose catalog geo validation admin API", () => {
    expect(routes.adminContentCatalogGeoValidation).toBe(
      "/api/v1/admin/content/catalog/geo-validation",
    );
    expect(routes.adminContentCatalogGeoValidationHistory).toBe(
      "/api/v1/admin/content/catalog/geo-validation/history",
    );
    expect(routes.adminContentCatalogGeoMetaParity).toBe(
      "/api/v1/admin/content/catalog/geo-validation/meta-parity",
    );
  });
});
