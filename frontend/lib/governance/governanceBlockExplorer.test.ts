import { describe, expect, it } from "vitest";
import {
  getGovernanceExplorerAddressUrl,
  getGovernanceExplorerTxUrl,
} from "@/lib/governance/governanceBlockExplorer";

describe("governanceBlockExplorer", () => {
  it("builds tx url for known chain", () => {
    expect(getGovernanceExplorerTxUrl(11155111, "0xabc")).toBe(
      "https://sepolia.etherscan.io/tx/0xabc",
    );
  });

  it("builds address url for known chain", () => {
    expect(getGovernanceExplorerAddressUrl(1, "0xdead")).toBe(
      "https://etherscan.io/address/0xdead",
    );
  });

  it("returns undefined for unknown chain", () => {
    expect(getGovernanceExplorerTxUrl(99999, "0xabc")).toBeUndefined();
  });
});
