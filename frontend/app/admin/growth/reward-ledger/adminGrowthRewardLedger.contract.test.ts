import { describe, expect, it } from "vitest";

import { routes } from "@/lib/api/routes";

describe("G-S2 growth ledger contract", () => {
  it("routes expose admin reward ledger and reconcile", () => {
    expect(routes.adminGrowthRewardLedger).toBe("/api/v1/admin/growth/reward-ledger");
    expect(routes.adminGrowthRewardLedgerReconcile).toBe(
      "/api/v1/admin/growth/reward-ledger/reconcile",
    );
    expect(routes.adminGrowthRewardLedgerReconcileFix).toBe(
      "/api/v1/admin/growth/reward-ledger/reconcile/fix",
    );
  });
});
