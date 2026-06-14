"use client";

import { useCallback } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { travelTrustGovernorAbi } from "@/lib/governance/travelTrustGovernorAbi";
import { useGovernanceWalletGate } from "@/dapp/hooks/useGovernanceWalletGate";

export function useGovernanceTimelockActions(
  governorAddress: `0x${string}` | null | undefined,
  proposalId: string,
  metaChainId?: number | null,
) {
  const { isConnected, chainReady, wrongNetwork, expectedChainId } = useGovernanceWalletGate(metaChainId);
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const queue = useCallback(() => {
    if (!governorAddress || !proposalId.trim() || !chainReady) return;
    writeContract({
      address: governorAddress,
      abi: travelTrustGovernorAbi,
      functionName: "queue",
      args: [BigInt(proposalId.trim())],
    });
  }, [governorAddress, proposalId, chainReady, writeContract]);

  const execute = useCallback(() => {
    if (!governorAddress || !proposalId.trim() || !chainReady) return;
    writeContract({
      address: governorAddress,
      abi: travelTrustGovernorAbi,
      functionName: "execute",
      args: [BigInt(proposalId.trim())],
    });
  }, [governorAddress, proposalId, chainReady, writeContract]);

  return {
    isConnected,
    chainReady,
    wrongNetwork,
    expectedChainId,
    queue,
    execute,
    hash,
    isPending,
    confirming,
    isSuccess,
    error,
    reset,
    busy: isPending || confirming,
  };
}
