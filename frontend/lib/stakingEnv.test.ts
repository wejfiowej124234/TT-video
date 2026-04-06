import { afterEach, describe, expect, it } from "vitest";
import { getStakingAddress } from "./stakingEnv";

describe("getStakingAddress", () => {
  const orig = process.env.NEXT_PUBLIC_STAKING_ADDRESS;

  afterEach(() => {
    if (orig === undefined) delete process.env.NEXT_PUBLIC_STAKING_ADDRESS;
    else process.env.NEXT_PUBLIC_STAKING_ADDRESS = orig;
  });

  it("returns null when unset", () => {
    delete process.env.NEXT_PUBLIC_STAKING_ADDRESS;
    expect(getStakingAddress()).toBeNull();
  });

  it("returns checksummed address when valid", () => {
    process.env.NEXT_PUBLIC_STAKING_ADDRESS = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    expect(getStakingAddress()).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("returns null for invalid", () => {
    process.env.NEXT_PUBLIC_STAKING_ADDRESS = "0xbad";
    expect(getStakingAddress()).toBeNull();
  });
});
