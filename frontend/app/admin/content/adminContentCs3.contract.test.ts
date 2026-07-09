import { readFileSync } from "node:fs";
import { join } from "node:path";
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

  it("media assets page supports CRUD and publish workflow", () => {
    const page = readFileSync(
      join(process.cwd(), "app/admin/content/media-assets/AdminContentMediaAssetsPageMain.tsx"),
      "utf8",
    );
    const hook = readFileSync(
      join(process.cwd(), "app/admin/content/media-assets/useAdminContentMediaAssetsPage.ts"),
      "utf8",
    );
    expect(page).toContain("adminConfirmCatalogPublish");
    expect(page).toContain("data-tt-admin-content-media-assets-list");
    expect(hook).toContain("postAdminContentMediaAsset");
    expect(hook).toContain("patchAdminContentMediaAsset");
    expect(hook).toContain("postAdminContentMediaAssetWorkflow");
  });
});
