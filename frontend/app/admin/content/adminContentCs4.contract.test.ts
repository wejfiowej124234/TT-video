import { describe, expect, it } from "vitest";
import { routes } from "@/lib/api/routes";

describe("C-S4 catalog revision import operations contract", () => {
  it("routes expose catalog revision/import/observability admin API", () => {
    expect(routes.adminContentRevisionsDetail).toBe("/api/v1/admin/content/revisions/detail");
    expect(routes.adminContentRevisionsCompare).toBe("/api/v1/admin/content/revisions/compare");
    expect(routes.adminContentRevisionsRollbackHistory).toBe(
      "/api/v1/admin/content/revisions/rollback-history",
    );
    expect(routes.adminContentImportHistory).toBe("/api/v1/admin/content/import/history");
    expect(routes.adminContentImportTrigger).toBe("/api/v1/admin/content/import/trigger");
    expect(routes.adminContentCatalogParity).toBe("/api/v1/admin/content/catalog/parity");
    expect(routes.adminContentCatalogObservability).toBe(
      "/api/v1/admin/content/catalog/observability",
    );
  });
});
