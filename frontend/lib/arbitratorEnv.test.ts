import { afterEach, describe, expect, it } from "vitest";
import { getAddress } from "viem";
import { getArbitratorAddress } from "./arbitratorEnv";

describe("getArbitratorAddress", () => {
  const key = "NEXT_PUBLIC_ARBITRATOR_ADDRESS";
  const orig = process.env[key];

  afterEach(() => {
    if (orig === undefined) delete process.env[key];
    else process.env[key] = orig;
  });

  it("returns null when unset", () => {
    delete process.env[key];
    expect(getArbitratorAddress()).toBeNull();
  });

  it("returns null for invalid address", () => {
    process.env[key] = "not-an-address";
    expect(getArbitratorAddress()).toBeNull();
  });

  it("returns checksummed address when valid", () => {
    const lower = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    process.env[key] = lower;
    expect(getArbitratorAddress()).toBe(getAddress(lower));
  });
});
