import { describe, expect, it } from "vitest";

import { resolveAdminHomeTreasuryPoolsSnapshot } from "@/lib/admin/adminHomeTreasuryPools";

describe("resolveAdminHomeTreasuryPoolsSnapshot", () => {
  it("stays not_deployed without payload (no fabricated balances)", () => {
    const snap = resolveAdminHomeTreasuryPoolsSnapshot();
    expect(snap.source).toBe("not_deployed");
    expect(snap.facts).toBeNull();
    expect(snap.pools.every((p) => p.slices.every((s) => s.amount == null))).toBe(true);
  });

  it("uses chain/projection facts when /meta addresses exist — event counts may be 0", () => {
    const snap = resolveAdminHomeTreasuryPoolsSnapshot({
      payload: {
        chainId: 1,
        feeRouterAddress: "0x1111111111111111111111111111111111111111",
        treasuryAddress: "0x2222222222222222222222222222222222222222",
        governorAddress: "0x3333333333333333333333333333333333333333",
        governanceTokenAddress: null,
        escrowFactoryAddress: "0x4444444444444444444444444444444444444444",
        timelockAddress: "0x5555555555555555555555555555555555555555",
        feeRouterEventTotal: 0,
        feeRouterLatestAt: null,
        regionVaultEventTotal: 0,
        regionVaultLatestAt: null,
      },
    });
    expect(snap.source).toBe("chain");
    expect(snap.facts?.chainId).toBe(1);
    expect(snap.facts?.feeRouterEventTotal).toBe(0);
    const usdc = snap.pools.find((p) => p.id === "usdc");
    expect(usdc?.slices.find((s) => s.id === "fee_router_events")?.amount).toBe(0);
  });
});
