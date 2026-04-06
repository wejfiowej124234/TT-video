import { afterEach, describe, expect, it } from "vitest";
import { getAddress } from "viem";
import { getSettlementTokenAddress } from "./settlementTokenEnv";

describe("getSettlementTokenAddress", () => {
  const key = "NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS";
  const orig = process.env[key];

  afterEach(() => {
    if (orig === undefined) delete process.env[key];
    else process.env[key] = orig;
  });

  it("returns null when unset", () => {
    delete process.env[key];
    expect(getSettlementTokenAddress()).toBeNull();
  });

  it("returns null for invalid address", () => {
    process.env[key] = "0x123";
    expect(getSettlementTokenAddress()).toBeNull();
  });

  it("returns checksummed address when valid", () => {
    const lower = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    process.env[key] = lower;
    expect(getSettlementTokenAddress()).toBe(getAddress(lower));
  });
});
