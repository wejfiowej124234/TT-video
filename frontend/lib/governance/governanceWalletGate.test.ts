import { describe, expect, it } from "vitest";
import {
  governanceExpectedChainId,
  governanceWalletAddressMismatch,
  isGovernanceChainReady,
} from "./governanceWalletGate";

describe("governanceWalletGate", () => {
  it("chain ready only when connected and chain id matches", () => {
    expect(isGovernanceChainReady(true, 31337, 31337)).toBe(true);
    expect(isGovernanceChainReady(true, 137, 31337)).toBe(false);
    expect(isGovernanceChainReady(false, 31337, 31337)).toBe(false);
  });

  it("prefers meta chain id over env default", () => {
    expect(governanceExpectedChainId(11155111)).toBe(11155111);
  });

  it("detects steward wallet mismatch case-insensitively", () => {
    expect(
      governanceWalletAddressMismatch(
        "0xAbCdEf0000000000000000000000000000000001",
        "0xabcdef0000000000000000000000000000000001",
      ),
    ).toBe(false);
    expect(
      governanceWalletAddressMismatch(
        "0x1111111111111111111111111111111111111111",
        "0x2222222222222222222222222222222222222222",
      ),
    ).toBe(true);
  });
});
