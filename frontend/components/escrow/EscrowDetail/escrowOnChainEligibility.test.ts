import { describe, expect, it } from "vitest";
import {
  canDepositToEscrow,
  canOpenDisputeOnChain,
  canRefundEscrow,
  canReleaseAfterRating,
  escrowDisputeOnChainUnavailableReasonKey,
  orderLikeMayOnchainDeposit,
} from "./escrowOnChainEligibility";
import type { OrderRow } from "./types";

const addr = "0x0000000000000000000000000000000000000001";

describe("orderLikeMayOnchainDeposit", () => {
  it("is false for null/undefined", () => {
    expect(orderLikeMayOnchainDeposit(null)).toBe(false);
    expect(orderLikeMayOnchainDeposit(undefined)).toBe(false);
  });

  it("requires escrow_address and parsable amount", () => {
    expect(orderLikeMayOnchainDeposit({ state: "accepted", amount: "10" })).toBe(false);
    expect(orderLikeMayOnchainDeposit({ state: "accepted", escrow_address: addr, amount: "" })).toBe(false);
    expect(orderLikeMayOnchainDeposit({ state: "accepted", escrow_address: addr, amount: "10" })).toBe(true);
  });

  it("is false for draft/completed/cancelled etc.", () => {
    expect(
      orderLikeMayOnchainDeposit({ state: "draft", escrow_address: addr, amount: "10" } as OrderRow)
    ).toBe(false);
    expect(
      orderLikeMayOnchainDeposit({ state: "completed", escrow_address: addr, amount: "10" } as OrderRow)
    ).toBe(false);
  });

  it("uses status when state absent", () => {
    expect(
      orderLikeMayOnchainDeposit({ status: "accepted", escrow_address: addr, amount: "1" } as OrderRow)
    ).toBe(true);
  });
});

describe("canDepositToEscrow", () => {
  const o = (s: string) => ({ state: s } as OrderRow);

  it("gates on escrow + amount", () => {
    expect(canDepositToEscrow(o("accepted"), false, BigInt(1))).toBe(false);
    expect(canDepositToEscrow(o("accepted"), true, undefined)).toBe(false);
  });

  it("allows accepted / escrowed / funded / confirmed", () => {
    const one = BigInt(1);
    expect(canDepositToEscrow(o("accepted"), true, one)).toBe(true);
    expect(canDepositToEscrow(o("escrowed"), true, one)).toBe(true);
    expect(canDepositToEscrow(o("funded"), true, one)).toBe(true);
    expect(canDepositToEscrow(o("confirmed"), true, one)).toBe(true);
  });
});

describe("canReleaseAfterRating", () => {
  it("requires completed + both rating confirmations (or sub_status)", () => {
    expect(
      canReleaseAfterRating(
        { state: "completed", rating_tourist_confirmed: true, rating_guide_confirmed: true } as OrderRow,
        true
      )
    ).toBe(true);
    expect(
      canReleaseAfterRating({ state: "completed", sub_status: "rating_confirmed" } as OrderRow, true)
    ).toBe(true);
    expect(canReleaseAfterRating({ state: "completed" } as OrderRow, true)).toBe(false);
    expect(canReleaseAfterRating({ state: "escrowed" } as OrderRow, true)).toBe(false);
  });
});

describe("canRefundEscrow", () => {
  it("allows escrowed/funded/completed when rating not both confirmed", () => {
    expect(canRefundEscrow({ state: "escrowed" } as OrderRow, true)).toBe(true);
    expect(canRefundEscrow({ state: "funded" } as OrderRow, true)).toBe(true);
    expect(canRefundEscrow({ state: "completed" } as OrderRow, true)).toBe(true);
  });

  it("blocks when both sides confirmed rating (release path)", () => {
    expect(
      canRefundEscrow(
        {
          state: "completed",
          rating_tourist_confirmed: true,
          rating_guide_confirmed: true,
        } as OrderRow,
        true
      )
    ).toBe(false);
  });
});

describe("canOpenDisputeOnChain (B-037)", () => {
  const o = (s: string) => ({ state: s } as OrderRow);

  it("requires hasEscrow", () => {
    expect(canOpenDisputeOnChain(o("funded"), false)).toBe(false);
  });

  it("allows accepted / escrowed / funded only", () => {
    expect(canOpenDisputeOnChain(o("accepted"), true)).toBe(true);
    expect(canOpenDisputeOnChain(o("escrowed"), true)).toBe(true);
    expect(canOpenDisputeOnChain(o("funded"), true)).toBe(true);
    expect(canOpenDisputeOnChain(o("disputed"), true)).toBe(false);
    expect(canOpenDisputeOnChain(o("completed"), true)).toBe(false);
    expect(canOpenDisputeOnChain(o("created"), true)).toBe(false);
  });
});

describe("escrowDisputeOnChainUnavailableReasonKey", () => {
  const o = (s: string) => ({ state: s } as OrderRow);

  it("returns null for disputable states", () => {
    expect(escrowDisputeOnChainUnavailableReasonKey(o("funded"))).toBeNull();
  });

  it("maps disputed and early states", () => {
    expect(escrowDisputeOnChainUnavailableReasonKey(o("disputed"))).toBe("escrow_disputeBlocked_alreadyOpen");
    expect(escrowDisputeOnChainUnavailableReasonKey(o("created"))).toBe("escrow_disputeBlocked_tooEarly");
    expect(escrowDisputeOnChainUnavailableReasonKey(o("completed"))).toBe("escrow_disputeBlocked_orderCompleted");
  });
});
