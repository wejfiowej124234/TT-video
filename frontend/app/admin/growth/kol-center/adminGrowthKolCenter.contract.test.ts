import { describe, expect, it } from "vitest";

import { routes } from "@/lib/api/routes";

describe("G-S7 kol-center contract", () => {
  it("kol-center route is read-only list path", () => {
    expect(routes.adminGrowthKolCenter).toBe("/api/v1/admin/growth/kol-center");
  });
});
