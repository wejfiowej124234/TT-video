import { describe, expect, it } from "vitest";

import { routes } from "@/lib/api/routes";

describe("G-S5 anti-fraud contract", () => {
  it("routes expose admin anti-fraud and reconcile fix", () => {
    expect(routes.adminGrowthAntiFraudRules).toBe("/api/v1/admin/growth/anti-fraud/rules");
    expect(routes.adminGrowthAntiFraudUsers).toBe("/api/v1/admin/growth/anti-fraud/users");
    expect(routes.adminGrowthAntiFraudScanRuns).toBe(
      "/api/v1/admin/growth/anti-fraud/scan-runs",
    );
    expect(routes.adminGrowthRewardLedgerReconcileFix).toBe(
      "/api/v1/admin/growth/reward-ledger/reconcile/fix",
    );
  });
});
