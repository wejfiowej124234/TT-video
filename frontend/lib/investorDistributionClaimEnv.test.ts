import { afterEach, describe, expect, it } from "vitest";
import { getInvestorDistributionClaimAddress } from "./investorDistributionClaimEnv";

describe("investorDistributionClaimEnv (P5-4-1)", () => {
  const orig = process.env.NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS;

  afterEach(() => {
    if (orig === undefined) delete process.env.NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS;
    else process.env.NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS = orig;
  });

  it("returns undefined when unset", () => {
    delete process.env.NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS;
    expect(getInvestorDistributionClaimAddress()).toBeUndefined();
  });

  it("returns checksummed address when valid", () => {
    process.env.NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS =
      "0xabcdef0123456789abcdef0123456789abcdef01";
    expect(getInvestorDistributionClaimAddress()).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("returns undefined for invalid address", () => {
    process.env.NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS = "0xbad";
    expect(getInvestorDistributionClaimAddress()).toBeUndefined();
  });
});
