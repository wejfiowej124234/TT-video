import { describe, expect, it } from "vitest";

import { routes } from "@/lib/api/routes";

describe("G-S3 early bird contract", () => {
  it("routes expose admin early bird stages and reconcile", () => {
    expect(routes.adminGrowthEarlyBirdStages).toBe("/api/v1/admin/growth/early-bird/stages");
    expect(routes.adminGrowthEarlyBirdReconcile).toBe(
      "/api/v1/admin/growth/early-bird/reconcile",
    );
  });
});
