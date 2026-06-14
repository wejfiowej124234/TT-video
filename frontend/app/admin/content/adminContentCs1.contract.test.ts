import { describe, expect, it } from "vitest";
import { routes } from "@/lib/api/routes";

describe("C-S1 admin content contract", () => {
  it("routes expose admin content CRUD and publish queue", () => {
    expect(routes.adminContentCountries).toBe("/api/v1/admin/content/countries");
    expect(routes.adminContentCities).toBe("/api/v1/admin/content/cities");
    expect(routes.adminContentPois).toBe("/api/v1/admin/content/pois");
    expect(routes.adminContentPricingTemplates).toBe("/api/v1/admin/content/pricing-templates");
    expect(routes.adminContentIntercityRoutes).toBe("/api/v1/admin/content/intercity-routes");
    expect(routes.adminContentPublishQueue).toBe("/api/v1/admin/content/publish-queue");
  });
});
