import { describe, expect, it } from "vitest";

import { adminHomeModulesFoldDefaultOpen, adminHomeInboxPendingTotal } from "./adminHomeInboxPendingTotal";

describe("adminHomeInboxPendingTotal", () => {
  const channels = {
    provider: { count: 0, permissionDenied: false, errorKind: null },
    steward: { count: 0, permissionDenied: false, errorKind: null },
    approvals: { count: null, permissionDenied: true, errorKind: null },
    reports: { count: 78, permissionDenied: false, errorKind: null },
  };

  it("sums visible inbox channels including reports", () => {
    const total = adminHomeInboxPendingTotal(
      { provider: 0, steward: 0, approvals: null, reports: 78 },
      channels,
      false,
      false,
      () => true,
      true,
    );
    expect(total).toBe(78);
  });

  it("collapses module wall when pending > 0", () => {
    expect(adminHomeModulesFoldDefaultOpen(78)).toBe(false);
    expect(adminHomeModulesFoldDefaultOpen(0)).toBe(true);
    expect(adminHomeModulesFoldDefaultOpen(null)).toBe(true);
  });
});
