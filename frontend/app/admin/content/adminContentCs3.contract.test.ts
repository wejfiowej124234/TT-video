import { describe, expect, it } from "vitest";
import { routes } from "@/lib/api/routes";

describe("C-S3 catalog operations admin contract", () => {
  it("routes expose catalog operations admin API", () => {
    expect(routes.adminContentHotelTiers).toBe("/api/v1/admin/content/hotel-tiers");
    expect(routes.adminContentTransportRegionRules).toBe(
      "/api/v1/admin/content/transport-region-rules",
    );
    expect(routes.adminContentMediaAssets).toBe("/api/v1/admin/content/media-assets");
    expect(routes.adminContentLandingAmbient("cn-id")).toBe(
      "/api/v1/admin/content/countries/cn-id/landing-ambient",
    );
  });
});
