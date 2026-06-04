import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import { ADMIN_SHELL_INBOX_HUB_HREF, adminShellNavPendingCount } from "./adminShellInboxNavBadge";

describe("adminShellNavPendingCount", () => {
  const counts = { provider: 2, steward: 1, approvals: 0, reports: 3 };
  const channels = {
    provider: { permissionDenied: false },
    steward: { permissionDenied: false },
    approvals: { permissionDenied: false },
    reports: { permissionDenied: false },
  } as const;

  it("sums all queues for /admin/inbox hub", () => {
    const r = adminShellNavPendingCount(
      ADMIN_SHELL_INBOX_HUB_HREF,
      counts,
      channels,
      false,
      false,
      () => true,
      true,
    );
    expect(r.inboxKey).toBe("hub");
    expect(r.count).toBe(6);
  });

  it("returns single queue count for provider href", () => {
    const r = adminShellNavPendingCount(
      ADMIN_INBOX_QUEUE_HREFS.provider,
      counts,
      channels,
      false,
      false,
      () => true,
      true,
    );
    expect(r.inboxKey).toBe("provider");
    expect(r.count).toBe(2);
  });
});
