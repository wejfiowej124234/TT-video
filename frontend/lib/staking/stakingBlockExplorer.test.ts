import { describe, expect, it } from "vitest";

import { getExplorerAddressUrl } from "./stakingBlockExplorer";

describe("stakingBlockExplorer", () => {
  it("returns explorer URLs for known chains", () => {
    const addr = "0x9A9f2CCfdB556A7E9Ff0848998Aa4a0CFD8863AE";
    expect(getExplorerAddressUrl(11155111, addr)).toContain("sepolia.etherscan.io/address/");
    expect(getExplorerAddressUrl(137, addr)).toContain("polygonscan.com/address/");
    expect(getExplorerAddressUrl(31337, addr)).toBeUndefined();
  });
});
