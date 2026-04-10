/**
 * P5-4-1：Claim / withdrawDividend 写路径单测（mock wagmi）；**不**覆盖 registerAccrual。
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useInvestorDistributionClaimWrite } from "./useInvestorDistributionClaimWrite";

const writeContractMock = vi.fn();
vi.mock("wagmi", () => ({
  useWriteContract: () => ({
    writeContract: writeContractMock,
    data: undefined,
    isPending: false,
    error: null,
    reset: vi.fn(),
  }),
  useWaitForTransactionReceipt: () => ({
    isLoading: false,
    isSuccess: false,
  }),
}));

describe("useInvestorDistributionClaimWrite (P5-4-1)", () => {
  const claimer = "0x1234567890123456789012345678901234567890" as `0x${string}`;
  const dist =
    "0x00000000000000000000000000000000000000000000000000000000000000ab" as `0x${string}`;
  const amt = 5n;

  beforeEach(() => {
    writeContractMock.mockClear();
  });

  it("claim calls writeContract with claim and args", () => {
    const { result } = renderHook(() => useInvestorDistributionClaimWrite(claimer, dist, amt));
    act(() => {
      result.current.claim();
    });
    expect(writeContractMock).toHaveBeenCalledWith(
      expect.objectContaining({
        address: claimer,
        functionName: "claim",
        args: [dist, amt],
      })
    );
  });

  it("withdrawDividend calls writeContract with withdrawDividend", () => {
    const { result } = renderHook(() => useInvestorDistributionClaimWrite(claimer, dist, amt));
    act(() => {
      result.current.withdrawDividend();
    });
    expect(writeContractMock).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "withdrawDividend",
        args: [dist, amt],
      })
    );
  });

  it("no-op when maxAmount is zero", () => {
    const { result } = renderHook(() => useInvestorDistributionClaimWrite(claimer, dist, 0n));
    act(() => {
      result.current.claim();
    });
    expect(writeContractMock).not.toHaveBeenCalled();
  });

  it("write abi fragment does not include registerAccrual", async () => {
    const mod = await import("./useInvestorDistributionClaimWrite");
    const json = JSON.stringify(mod.investorDistributionClaimWriteAbi);
    expect(json).not.toContain("registerAccrual");
  });
});
