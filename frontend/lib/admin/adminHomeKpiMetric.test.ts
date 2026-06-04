import { describe, expect, it } from "vitest";

import { adminHomeKpiMetricDisplay, adminHomeKpiTileLinkAllowed } from "./adminHomeKpiMetric";

const t = (key: string, vars?: Record<string, string | number>) =>
  vars?.count !== undefined ? `${key}:${vars.count}` : key;

describe("adminHomeKpiMetric", () => {
  it("shows perm denied before loading ellipsis", () => {
    expect(
      adminHomeKpiMetricDisplay(
        { loading: true, count: null, permissionDenied: true },
        t,
        "admin_home_kpi_approvals",
      ),
    ).toBe("admin_home_kpi_perm_denied");
  });

  it("shows loading only when permitted and still fetching", () => {
    expect(
      adminHomeKpiMetricDisplay(
        { loading: true, count: null, permissionDenied: false },
        t,
        "admin_home_kpi_approvals",
      ),
    ).toBe("admin_home_kpi_loading");
  });

  it("formats count when loaded", () => {
    expect(
      adminHomeKpiMetricDisplay(
        { loading: false, count: 78, permissionDenied: false },
        t,
        "admin_home_kpi_reports",
      ),
    ).toBe("admin_home_kpi_reports:78");
  });

  it("blocks link when permission denied", () => {
    expect(adminHomeKpiTileLinkAllowed(true)).toBe(false);
    expect(adminHomeKpiTileLinkAllowed(false)).toBe(true);
  });
});
