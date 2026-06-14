import { describe, expect, it } from "vitest";

import { routes } from "@/lib/api/routes";

describe("G-S7 growth analytics contract", () => {
  it("routes expose read-only analytics and kol-center endpoints", () => {
    expect(routes.adminGrowthAnalyticsOverview).toBe("/api/v1/admin/growth/analytics/overview");
    expect(routes.adminGrowthAnalyticsFunnel).toBe("/api/v1/admin/growth/analytics/funnel");
    expect(routes.adminGrowthAnalyticsTopReferrers).toBe(
      "/api/v1/admin/growth/analytics/top-referrers",
    );
    expect(routes.adminGrowthKolCenter).toBe("/api/v1/admin/growth/kol-center");
  });
});
