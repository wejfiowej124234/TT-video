"use client";

import { useCallback, useMemo } from "react";
import type { Hex } from "viem";
import { isAddress } from "viem";
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import type { GovernanceProposalCreateDraft } from "@/lib/governance/governanceProposalCreateModel";
import { governanceProposeArgsFromDraft } from "@/lib/governance/governanceProposalCreateModel";
import { travelTrustGovernorAbi } from "@/lib/governance/travelTrustGovernorAbi";
import { useGovernanceWalletGate } from "@/dapp/hooks/useGovernanceWalletGate";

export function useGovernancePropose(
  governorAddress: `0x${string}` | null | undefined,
  metaChainId?: number | null,
  simulateEnabled = false,
) {
  const { address, isConnected, chainReady, wrongNetwork, expectedChainId } =
    useGovernanceWalletGate(metaChainId);

  const thresholdRead = useReadContract({
    address: governorAddress ?? undefined,
    abi: travelTrustGovernorAbi,
    functionName: "proposalThresholdVotes",
    query: { enabled: Boolean(governorAddress && chainReady) },
  });

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const propose = useCallback(
    (draft: GovernanceProposalCreateDraft) => {
      if (!governorAddress || !chainReady) return;
      const args = governanceProposeArgsFromDraft(draft);
      if (!args) return;
      writeContract({
        address: governorAddress,
        abi: travelTrustGovernorAbi,
        functionName: "propose",
        args: [args.targets, args.values, args.calldatas, args.description],
      });
    },
    [governorAddress, chainReady, writeContract],
  );

  const governorReady = Boolean(governorAddress && isAddress(governorAddress));

  return {
    address,
    isConnected,
    chainReady,
    wrongNetwork,
    expectedChainId,
    governorReady,
    proposalThresholdVotes: thresholdRead.data,
    thresholdLoading: thresholdRead.isLoading,
    thresholdError: thresholdRead.error,
    propose,
    hash,
    isPending,
    confirming,
    isSuccess,
    error,
    reset,
    busy: isPending || confirming,
    simulateEnabled,
  };
}

/** 创建页 submit 步 · gas 预检（simulateContract · 行业 dApp 标准） */
export function useGovernanceProposeSimulate(
  governorAddress: `0x${string}` | null | undefined,
  draft: GovernanceProposalCreateDraft | null,
  metaChainId?: number | null,
  enabled = false,
) {
  const { chainReady } = useGovernanceWalletGate(metaChainId);
  const args = useMemo(
    () => (draft ? governanceProposeArgsFromDraft(draft) : null),
    [draft],
  );

  const sim = useSimulateContract({
    address: governorAddress ?? undefined,
    abi: travelTrustGovernorAbi,
    functionName: "propose",
    args: args ? [args.targets, args.values, args.calldatas, args.description] : undefined,
    query: { enabled: Boolean(enabled && governorAddress && chainReady && args) },
  });

  const estimatedGas = sim.data?.request?.gas ?? null;

  return {
    simulateReady: sim.isSuccess,
    simulateError: sim.error,
    estimatedGas,
    simulateLoading: sim.isLoading || sim.isFetching,
  };
}

export function buildGovernanceProposeCalldataPreview(draft: GovernanceProposalCreateDraft): {
  targets: string[];
  values: string[];
  calldatas: Hex[];
} | null {
  const args = governanceProposeArgsFromDraft(draft);
  if (!args) return null;
  return {
    targets: args.targets,
    values: args.values.map((v) => v.toString()),
    calldatas: args.calldatas,
  };
}
