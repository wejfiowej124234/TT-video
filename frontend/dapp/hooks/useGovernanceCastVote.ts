"use client";

import { useCallback } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import {
  governanceCastVoteSupportFromChoice,
  travelTrustGovernorAbi,
} from "@/lib/governance/travelTrustGovernorAbi";
import { useGovernanceWalletGate } from "@/dapp/hooks/useGovernanceWalletGate";

export function useGovernanceCastVote(
  governorAddress: `0x${string}` | null | undefined,
  proposalId: string,
  metaChainId?: number | null,
) {
  const { address, isConnected, chainReady, wrongNetwork, expectedChainId } =
    useGovernanceWalletGate(metaChainId);
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const castVote = useCallback(
    (choice: "yes" | "no" | "abstain") => {
      if (!governorAddress || !proposalId.trim() || !chainReady) return;
      writeContract({
        address: governorAddress,
        abi: travelTrustGovernorAbi,
        functionName: "castVote",
        args: [BigInt(proposalId.trim()), governanceCastVoteSupportFromChoice(choice)],
      });
    },
    [governorAddress, proposalId, chainReady, writeContract],
  );

  return {
    address,
    isConnected,
    chainReady,
    wrongNetwork,
    expectedChainId,
    castVote,
    hash,
    isPending,
    confirming,
    isSuccess,
    error,
    reset,
    busy: isPending || confirming,
  };
}
