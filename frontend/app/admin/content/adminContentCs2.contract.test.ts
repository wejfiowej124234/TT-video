import { describe, expect, it } from "vitest";
import { routes } from "@/lib/api/routes";

describe("C-S2 admin POI media review contract", () => {
  it("routes expose poi-image-batches admin API", () => {
    expect(routes.adminContentPoiImageBatches).toBe("/api/v1/admin/content/poi-image-batches");
    expect(routes.adminContentPoiImageBatch("b1")).toBe("/api/v1/admin/content/poi-image-batches/b1");
    expect(routes.adminContentPoiImageCandidates("b1")).toBe(
      "/api/v1/admin/content/poi-image-batches/b1/candidates",
    );
  });
});
