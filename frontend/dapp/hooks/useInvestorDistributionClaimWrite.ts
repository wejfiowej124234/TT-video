"use client";

/**
 * P5-4-1：仅 `claim` / `withdrawDividend` 写路径（**不**暴露 `registerAccrual` ABI 写封装）。
 */
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";

/** 最小写 ABI 片段 — 避免 `writeContract` 误用 owner 登记入口 */
export const investorDistributionClaimWriteAbi = [
  {
    type: "function",
    name: "claim",
    inputs: [
      { name: "distributionId", type: "bytes32" },
      { name: "maxAmount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawDividend",
    inputs: [
      { name: "distributionId", type: "bytes32" },
      { name: "maxAmount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const;

export function useInvestorDistributionClaimWrite(
  claimAddress: `0x${string}` | undefined,
  distributionId: `0x${string}` | undefined,
  maxAmount: bigint | undefined
) {
  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claim = () => {
    if (!claimAddress || !distributionId || maxAmount === undefined || maxAmount <= 0n) return;
    writeContract({
      address: claimAddress,
      abi: investorDistributionClaimWriteAbi,
      functionName: "claim",
      args: [distributionId, maxAmount],
    });
  };

  const withdrawDividend = () => {
    if (!claimAddress || !distributionId || maxAmount === undefined || maxAmount <= 0n) return;
    writeContract({
      address: claimAddress,
      abi: investorDistributionClaimWriteAbi,
      functionName: "withdrawDividend",
      args: [distributionId, maxAmount],
    });
  };

  return {
    claim,
    withdrawDividend,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
    reset,
  };
}
