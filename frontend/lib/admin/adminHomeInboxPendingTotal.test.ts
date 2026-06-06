import { describe, expect, it } from "vitest";

import { adminHomeModulesFoldDefaultOpen, adminHomeInboxPendingTotal, resolveAdminHomeInboxPendingTotal } from "./adminHomeInboxPendingTotal";
import {
  readAdminHomeInboxPendingTotalCache,
  writeAdminHomeInboxPendingTotalCache,
} from "./adminHomeInboxPendingTotalCache";

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

  it("returns partial sum while loading when counts are already resolved", () => {
    const total = adminHomeInboxPendingTotal(
      { provider: 0, steward: 0, approvals: null, reports: 78 },
      channels,
      true,
      false,
      () => true,
      true,
    );
    expect(total).toBe(78);
  });

  it("returns null while loading before any channel count resolves", () => {
    const total = adminHomeInboxPendingTotal(
      { provider: null, steward: null, approvals: null, reports: null },
      channels,
      true,
      false,
      () => true,
      true,
    );
    expect(total).toBeNull();
  });

  it("resolve uses session cache while inbox counts still loading", () => {
    writeAdminHomeInboxPendingTotalCache(78);
    expect(readAdminHomeInboxPendingTotalCache()).toBe(78);
    const resolved = resolveAdminHomeInboxPendingTotal(null, true, true, false);
    expect(resolved).toBe(78);
  });

  it("collapses module wall when pending > 0", () => {
    expect(adminHomeModulesFoldDefaultOpen(78)).toBe(false);
    expect(adminHomeModulesFoldDefaultOpen(0)).toBe(true);
    expect(adminHomeModulesFoldDefaultOpen(null)).toBe(true);
  });
});
