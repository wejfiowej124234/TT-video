import { describe, expect, it } from "vitest";
import { getGuideStakingAddress, getProviderStakingAddress } from "./stakingEnv";

describe("stakingEnv", () => {
  const origGuide = process.env.NEXT_PUBLIC_GUIDE_STAKING_ADDRESS;
  const origProvider = process.env.NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS;

  const restore = () => {
    if (origGuide === undefined) delete process.env.NEXT_PUBLIC_GUIDE_STAKING_ADDRESS;
    else process.env.NEXT_PUBLIC_GUIDE_STAKING_ADDRESS = origGuide;
    if (origProvider === undefined) delete process.env.NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS;
    else process.env.NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS = origProvider;
  };

  it("getGuideStakingAddress returns null when unset", () => {
    delete process.env.NEXT_PUBLIC_GUIDE_STAKING_ADDRESS;
    expect(getGuideStakingAddress()).toBeNull();
    restore();
  });

  it("getGuideStakingAddress normalizes a valid address", () => {
    process.env.NEXT_PUBLIC_GUIDE_STAKING_ADDRESS = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    expect(getGuideStakingAddress()).toMatch(/^0x[a-fA-F0-9]{40}$/);
    restore();
  });

  it("getGuideStakingAddress rejects invalid address", () => {
    process.env.NEXT_PUBLIC_GUIDE_STAKING_ADDRESS = "0xbad";
    expect(getGuideStakingAddress()).toBeNull();
    restore();
  });

  it("getProviderStakingAddress returns null when unset", () => {
    delete process.env.NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS;
    expect(getProviderStakingAddress()).toBeNull();
    restore();
  });
});
