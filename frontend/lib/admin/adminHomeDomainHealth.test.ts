import { describe, expect, it } from "vitest";



import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";

import { buildAdminHomeDomainHealth } from "@/lib/admin/adminHomeDomainHealth";



describe("adminHomeDomainHealth", () => {

  const t = (k: string, vars?: Record<string, string | number>) =>

    vars ? `${k}:${JSON.stringify(vars)}` : k;



  const channels = {

    provider: { count: null, permissionDenied: false, errorKind: null },

    steward: { count: null, permissionDenied: false, errorKind: null },

    approvals: { count: null, permissionDenied: false, errorKind: null },

    reports: { count: null, permissionDenied: false, errorKind: null },

  };



  it("marks onboarding attention when inbox pending > 0", () => {

    const items = buildAdminHomeDomainHealth({

      counts: { provider: 2, steward: 0, approvals: 0, reports: 0 },

      channels,

      kpi: { orders: 0, disputes: 0 },

      inboxLoading: false,

      kpiLoading: false,

      hasPermission: () => true,

      permissionsLoaded: true,

      t,

    });

    const onboarding = items.find((i) => i.id === "onboarding");

    expect(onboarding?.tone).toBe("attention");

  });



  it("community health tile links to reports inbox queue SSOT", () => {

    const items = buildAdminHomeDomainHealth({

      counts: { provider: 0, steward: 0, approvals: 0, reports: 2 },

      channels,

      kpi: { orders: 0, disputes: 0 },

      inboxLoading: false,

      kpiLoading: false,

      hasPermission: () => true,

      permissionsLoaded: true,

      t,

    });

    expect(items.find((i) => i.id === "community")?.href).toBe(ADMIN_INBOX_QUEUE_HREFS.reports);

    expect(items.find((i) => i.id === "community")?.tone).toBe("attention");
    expect(items.find((i) => i.id === "community")?.countLabel).toBe(
      "admin_home_domain_health_status_attention",
    );
  });

  it("uses status labels without repeating inbox numeric counts", () => {
    const items = buildAdminHomeDomainHealth({
      counts: { provider: 0, steward: 0, approvals: 0, reports: 78 },
      channels,
      kpi: { orders: 162, disputes: 0 },
      inboxLoading: false,
      kpiLoading: false,
      hasPermission: () => true,
      permissionsLoaded: true,
      t,
    });
    expect(items.find((i) => i.id === "community")?.countLabel).toBe(
      "admin_home_domain_health_status_attention",
    );
    expect(items.find((i) => i.id === "operations")?.countLabel).toBe(
      "admin_home_domain_health_status_ok",
    );
  });
});


