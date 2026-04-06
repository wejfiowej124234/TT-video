import { describe, it, expect } from "vitest";
import { keccak256, stringToBytes } from "viem";
import { escrowDisputeSummaryToReasonHash } from "./escrowDisputeReason";

describe("escrowDisputeSummaryToReasonHash", () => {
  it("rejects empty and too short", () => {
    expect(escrowDisputeSummaryToReasonHash("")).toEqual({ ok: false, error: "empty" });
    expect(escrowDisputeSummaryToReasonHash("   ")).toEqual({ ok: false, error: "empty" });
    expect(escrowDisputeSummaryToReasonHash("abc")).toEqual({ ok: false, error: "too_short" });
  });

  it("matches viem keccak256(stringToBytes)", () => {
    const s = "service not delivered as agreed";
    const expected = keccak256(stringToBytes(s));
    const got = escrowDisputeSummaryToReasonHash(s);
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.hash).toBe(expected);
  });

  it("trims whitespace", () => {
    const s = "  valid text here  ";
    const got = escrowDisputeSummaryToReasonHash(s);
    expect(got.ok).toBe(true);
    if (got.ok) expect(got.hash).toBe(keccak256(stringToBytes("valid text here")));
  });
});
