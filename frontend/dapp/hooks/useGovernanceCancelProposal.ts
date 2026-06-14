"use client";

import { useCallback } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { travelTrustGovernorAbi } from "@/lib/governance/travelTrustGovernorAbi";
import { useGovernanceWalletGate } from "@/dapp/hooks/useGovernanceWalletGate";

export function useGovernanceCancelProposal(
  governorAddress: `0x${string}` | null | undefined,
  proposalId: string,
  metaChainId?: number | null,
) {
  const { isConnected, chainReady, wrongNetwork, expectedChainId, address } = useGovernanceWalletGate(metaChainId);
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancel = useCallback(() => {
    if (!governorAddress || !proposalId.trim() || !chainReady) return;
    writeContract({
      address: governorAddress,
      abi: travelTrustGovernorAbi,
      functionName: "cancel",
      args: [BigInt(proposalId.trim())],
    });
  }, [governorAddress, proposalId, chainReady, writeContract]);

  return {
    address,
    isConnected,
    chainReady,
    wrongNetwork,
    expectedChainId,
    cancel,
    hash,
    isPending,
    confirming,
    isSuccess,
    error,
    reset,
    busy: isPending || confirming,
  };
}
