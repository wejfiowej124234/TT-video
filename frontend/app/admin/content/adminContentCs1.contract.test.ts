import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { routes } from "@/lib/api/routes";
import { adminCatalogPublishQueueAdminPath } from "@/lib/admin/adminCatalogPublishQueueNav";

describe("C-S1 admin content contract", () => {
  it("routes expose admin content CRUD and publish queue", () => {
    expect(routes.adminContentCountries).toBe("/api/v1/admin/content/countries");
    expect(routes.adminContentCities).toBe("/api/v1/admin/content/cities");
    expect(routes.adminContentPois).toBe("/api/v1/admin/content/pois");
    expect(routes.adminContentPricingTemplates).toBe("/api/v1/admin/content/pricing-templates");
    expect(routes.adminContentIntercityRoutes).toBe("/api/v1/admin/content/intercity-routes");
    expect(routes.adminContentPublishQueue).toBe("/api/v1/admin/content/publish-queue");
  });

  it("publish queue page supports module deep links and publish workflow", () => {
    const page = readFileSync(
      join(process.cwd(), "app/admin/content/publish-queue/AdminContentPublishQueuePageMain.tsx"),
      "utf8",
    );
    const hook = readFileSync(
      join(process.cwd(), "app/admin/content/publish-queue/useAdminContentPublishQueuePage.ts"),
      "utf8",
    );
    expect(page).toContain("adminCatalogPublishQueueAdminPath");
    expect(page).toContain("adminConfirmCatalogPublish");
    expect(page).toContain("data-tt-admin-content-publish-queue-publish");
    expect(hook).toContain("postAdminCatalogEntityWorkflow");
    expect(adminCatalogPublishQueueAdminPath("catalog_countries")).toBe("/admin/content/countries");
    expect(adminCatalogPublishQueueAdminPath("catalog_media_assets")).toBe("/admin/content/media-assets");
  });
});
