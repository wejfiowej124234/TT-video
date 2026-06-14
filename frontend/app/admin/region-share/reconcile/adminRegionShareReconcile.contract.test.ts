import { describe, expect, it } from "vitest";

import { routes } from "@/lib/api/routes";

describe("BE-RS-01 region-share reconcile contract", () => {
  it("routes expose admin reconcile audit endpoints", () => {
    expect(routes.adminRegionShareReconcileLatest).toBe(
      "/api/v1/admin/region-share/reconcile/latest",
    );
    expect(routes.adminRegionShareReconcileReports).toBe(
      "/api/v1/admin/region-share/reconcile/reports",
    );
  });
});
