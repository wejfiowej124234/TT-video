import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_QUEUE_HREFS } from "@/lib/admin/adminInboxQueueHrefs";
import { buildAdminUnifiedInboxTasks } from "@/lib/admin/adminUnifiedInboxTasks";

describe("adminUnifiedInboxTasks", () => {
  const channels = {
    provider: { count: 2, errorKind: null, permissionDenied: false },
    guide: { count: 0, errorKind: null, permissionDenied: false },
    steward: { count: 0, errorKind: null, permissionDenied: false },
    approvals: { count: 1, errorKind: null, permissionDenied: false },
    disputes: { count: 0, errorKind: null, permissionDenied: false },
    reports: { count: 4, errorKind: null, permissionDenied: false },
  };

  it("wires all inbox queue hrefs from ADMIN_INBOX_QUEUE_HREFS", () => {
    const tasks = buildAdminUnifiedInboxTasks({
      counts: { provider: 1, guide: 0, steward: 2, approvals: 3, disputes: 5, reports: 4 },
      channels,
    });
    expect(tasks.find((t) => t.id === "provider")?.href).toBe(ADMIN_INBOX_QUEUE_HREFS.provider);
    expect(tasks.find((t) => t.id === "guide")?.href).toBe(ADMIN_INBOX_QUEUE_HREFS.guide);
    expect(tasks.find((t) => t.id === "steward")?.href).toBe(ADMIN_INBOX_QUEUE_HREFS.steward);
    expect(tasks.find((t) => t.id === "approvals")?.href).toBe(ADMIN_INBOX_QUEUE_HREFS.approvals);
    expect(tasks.find((t) => t.id === "disputes")?.href).toBe(ADMIN_INBOX_QUEUE_HREFS.disputes);
    expect(tasks.find((t) => t.id === "reports")?.href).toBe(ADMIN_INBOX_QUEUE_HREFS.reports);
  });

  it("sorts pending channels by onboarding workflow order", () => {
    const tasks = buildAdminUnifiedInboxTasks({
      counts: { provider: 2, guide: 0, steward: 0, approvals: 1, disputes: 0, reports: 3 },
      channels,
    });
    expect(tasks[0]?.id).toBe("provider");
    expect(tasks[1]?.id).toBe("approvals");
    expect(tasks[2]?.id).toBe("reports");
    expect(tasks.find((t) => t.id === "disputes")).toBeTruthy();
    expect(tasks.find((t) => t.id === "steward")).toBeTruthy();
  });

  it("deprioritizes permission-denied channels in sort", () => {
    const tasks = buildAdminUnifiedInboxTasks({
      counts: { provider: 99, guide: 0, steward: 0, approvals: 1, disputes: 0, reports: 2 },
      channels: {
        provider: { count: 99, errorKind: null, permissionDenied: true },
        guide: { count: 0, errorKind: null, permissionDenied: false },
        steward: { count: 0, errorKind: null, permissionDenied: false },
        approvals: { count: 1, errorKind: null, permissionDenied: false },
        disputes: { count: 0, errorKind: null, permissionDenied: false },
        reports: { count: 2, errorKind: null, permissionDenied: false },
      },
    });
    expect(tasks[0]?.id).toBe("approvals");
    expect(tasks[1]?.id).toBe("reports");
    expect(tasks[tasks.length - 1]?.id).toBe("provider");
    expect(tasks.find((t) => t.id === "provider")?.permissionDenied).toBe(true);
  });
});
