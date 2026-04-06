import { describe, expect, it } from "vitest";
import { orderListItemWatchesForBackendEscrowSync } from "./ordersEscrowAutoSyncPoll";

describe("orderListItemWatchesForBackendEscrowSync", () => {
  it("returns true for accepted", () => {
    expect(orderListItemWatchesForBackendEscrowSync({ id: "1", state: "accepted" })).toBe(true);
  });

  it("returns false for completed without deposit path", () => {
    expect(
      orderListItemWatchesForBackendEscrowSync({
        id: "1",
        state: "completed",
        amount: "10",
        escrow_address: "0x1234567890123456789012345678901234567890",
      }),
    ).toBe(false);
  });

  it("returns true for escrowed with escrow and amount (may still deposit)", () => {
    expect(
      orderListItemWatchesForBackendEscrowSync({
        id: "1",
        state: "escrowed",
        amount: "10",
        escrow_address: "0x1234567890123456789012345678901234567890",
      }),
    ).toBe(true);
  });
});
