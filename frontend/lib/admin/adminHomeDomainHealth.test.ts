import { describe, expect, it } from "vitest";

import { buildAdminHomeDomainHealth } from "@/lib/admin/adminHomeDomainHealth";
import { adminHomeKpiFoldDefaultOpen } from "@/lib/admin/adminShellUxPolicy";

describe("adminHomeDomainHealth", () => {
  const t = (k: string, vars?: Record<string, string | number>) =>
    vars ? `${k}:${JSON.stringify(vars)}` : k;

  const channels = {
    provider: { count: null, permissionDenied: false, errorKind: null },
    guide: { count: null, permissionDenied: false, errorKind: null },
    steward: { count: null, permissionDenied: false, errorKind: null },
    approvals: { count: null, permissionDenied: false, errorKind: null },
    reports: { count: null, permissionDenied: false, errorKind: null },
  };

  it("marks onboarding attention when inbox pending > 0", () => {
    const items = buildAdminHomeDomainHealth({
      counts: { provider: 2, guide: 0, steward: 0, approvals: 0, reports: 0 },
      channels,
      kpi: { orders: 0, disputes: 0, guides: null },
      inboxLoading: false,
      kpiLoading: false,
      hasPermission: () => true,
      permissionsLoaded: true,
      t,
    });
    const onboarding = items.find((i) => i.id === "onboarding");
    expect(onboarding?.tone).toBe("attention");
  });

  it("exposes W9 domains incl. community + governance with design-empty neutral for content/official/growth", () => {
    const items = buildAdminHomeDomainHealth({
      counts: { provider: 0, guide: 0, steward: 0, approvals: 0, reports: 2 },
      channels,
      kpi: { orders: 100, disputes: 1, guides: null },
      inboxLoading: false,
      kpiLoading: false,
      hasPermission: () => true,
      permissionsLoaded: true,
      t,
    });
    expect(items.map((i) => i.id)).toEqual([
      "onboarding",
      "operations",
      "community",
      "content",
      "official",
      "growth",
      "finance",
      "governance",
    ]);
    expect(items.find((i) => i.id === "operations")?.tone).toBe("attention");
    expect(items.find((i) => i.id === "operations")?.sourceBadgeKey).toBe(
      "admin_home_domain_health_ops_source_unknown",
    );
    expect(items.find((i) => i.id === "operations")?.countLabel).toContain(
      "admin_home_domain_health_ops_snapshot",
    );
    expect(items.find((i) => i.id === "community")?.tone).toBe("attention");
    expect(items.find((i) => i.id === "community")?.href).toBe("/admin/community/reports");
    expect(items.find((i) => i.id === "content")?.tone).toBe("neutral");
    expect(items.find((i) => i.id === "content")?.countLabel).toBe(
      "admin_home_domain_health_cta_content",
    );
    expect(items.find((i) => i.id === "official")?.href).toBe("/admin/official");
    expect(items.find((i) => i.id === "official")?.countLabel).toBe(
      "admin_home_domain_health_cta_official",
    );
    expect(items.find((i) => i.id === "growth")?.countLabel).toBe(
      "admin_home_domain_health_cta_growth",
    );
    expect(items.find((i) => i.id === "finance")?.countLabel).toBe(
      "admin_home_domain_health_finance_pool",
    );
    expect(items.find((i) => i.id === "governance")?.countLabel).toBe(
      "admin_home_domain_health_governance",
    );
    expect(items.find((i) => i.id === "governance")?.href).toBe("/admin/cross-check");
  });

  it("uses honest dash for community when reports unknown", () => {
    const items = buildAdminHomeDomainHealth({
      counts: { provider: 0, guide: 0, steward: 0, approvals: 0, reports: null },
      channels: {
        ...channels,
        reports: { count: null, permissionDenied: true, errorKind: null },
      },
      kpi: { orders: 162, disputes: 0, guides: null },
      inboxLoading: false,
      kpiLoading: false,
      hasPermission: () => true,
      permissionsLoaded: true,
      t,
    });
    expect(items.find((i) => i.id === "community")?.countLabel).toBe(
      "admin_home_domain_health_community_empty",
    );
    expect(items.find((i) => i.id === "operations")?.countLabel).toContain("162");
  });
});

describe("adminHomeKpiFoldDefaultOpen HU-441", () => {
  it("defaults collapsed; opens only when disputesKpi > 0", () => {
    expect(
      adminHomeKpiFoldDefaultOpen({
        pendingTotal: 13,
        disputesKpi: 0,
        ordersKpi: 100,
      }),
    ).toBe(false);
    expect(
      adminHomeKpiFoldDefaultOpen({
        pendingTotal: 13,
        disputesKpi: 1,
        ordersKpi: 100,
      }),
    ).toBe(true);
  });
});
