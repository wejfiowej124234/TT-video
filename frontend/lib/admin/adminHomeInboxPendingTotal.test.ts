import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { adminHomeModulesFoldDefaultOpen, adminHomeInboxPendingTotal, resolveAdminHomeInboxPendingTotal } from "./adminHomeInboxPendingTotal";
import {
  readAdminHomeInboxPendingTotalCache,
  writeAdminHomeInboxPendingTotalCache,
} from "./adminHomeInboxPendingTotalCache";

describe("adminHomeInboxPendingTotal", () => {
  const channels = {
    provider: { count: 0, permissionDenied: false, errorKind: null },
    guide: { count: 0, permissionDenied: false, errorKind: null },
    steward: { count: 0, permissionDenied: false, errorKind: null },
    approvals: { count: null, permissionDenied: true, errorKind: null },
    reports: { count: 78, permissionDenied: false, errorKind: null },
  };

  it("sums visible inbox channels including reports", () => {
    const total = adminHomeInboxPendingTotal(
      { provider: 0, guide: 0, steward: 0, approvals: null, reports: 78 },
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
      { provider: 0, guide: 0, steward: 0, approvals: null, reports: 78 },
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
      { provider: null, guide: null, steward: null, approvals: null, reports: null },
      channels,
      true,
      false,
      () => true,
      true,
    );
    expect(total).toBeNull();
  });

  it("excludes channels with errorKind from the sum (never treat failed as 0)", () => {
    const errored = {
      ...channels,
      reports: { count: null, permissionDenied: false, errorKind: "failed" as const },
    };
    const total = adminHomeInboxPendingTotal(
      { provider: 2, guide: 1, steward: 0, approvals: null, reports: null },
      errored,
      false,
      false,
      () => true,
      true,
    );
    expect(total).toBe(3);
  });

  it("resolve uses session cache while inbox counts still loading", () => {
    writeAdminHomeInboxPendingTotalCache(78);
    expect(readAdminHomeInboxPendingTotalCache()).toBe(78);
    const resolved = resolveAdminHomeInboxPendingTotal(null, true, true, false);
    expect(resolved).toBe(78);
  });

  it("Product Baseline · module wall always collapsed default", () => {
    expect(adminHomeModulesFoldDefaultOpen(78)).toBe(false);
    expect(adminHomeModulesFoldDefaultOpen(0)).toBe(false);
    expect(adminHomeModulesFoldDefaultOpen(null)).toBe(false);
  });
});


describe("useAdminHomeInbox countFromItems fail-closed (WP-05)", () => {
  it("source documents fail-closed total policy", () => {
    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "useAdminHomeInbox.ts"),
      "utf8",
    );
    expect(src).toContain("Fail-closed: never treat page-sized");
    expect(src).not.toMatch(/return Array\.isArray\(items\) \? items\.length : 0/);
  });
});
