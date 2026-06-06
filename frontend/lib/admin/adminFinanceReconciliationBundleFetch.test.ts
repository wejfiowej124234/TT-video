import { afterEach, describe, expect, it } from "vitest";

import {
  adminFinanceReconciliationCacheKeys,
  readAdminFinanceReconciliationBundleWarm,
} from "./adminFinanceReconciliationBundleFetch";
import { resetAdminListFetchCacheForTests } from "./adminListFetchCache";

describe("adminFinanceReconciliationBundleFetch", () => {
  afterEach(() => {
    resetAdminListFetchCacheForTests();
  });

  it("returns null when bundle cache incomplete", () => {
    expect(readAdminFinanceReconciliationBundleWarm()).toBeNull();
  });

  it("uses parallel cache keys", () => {
    const keys = adminFinanceReconciliationCacheKeys();
    expect(keys.summary).toContain("finance-reconciliation-summary");
    expect(keys.bundle).toContain("finance-reconciliation-bundle");
  });
});
