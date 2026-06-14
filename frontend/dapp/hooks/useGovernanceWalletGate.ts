"use client";

import { useMemo } from "react";
import { useAccount, useBlockNumber, useChainId, useReadContract } from "wagmi";
import { governanceExpectedChainId, isGovernanceChainReady } from "@/lib/governance/governanceWalletGate";
import { governanceVotesTokenAbi } from "@/lib/governance/governanceVotesTokenAbi";

/** 页内治理钱包闸：连接 · 网络 · 链 ID */
export function useGovernanceWalletGate(metaChainId?: number | null) {
  const { address, isConnected } = useAccount();
  const walletChainId = useChainId();
  const expectedChainId = useMemo(() => governanceExpectedChainId(metaChainId), [metaChainId]);
  const chainReady = isGovernanceChainReady(isConnected, walletChainId, expectedChainId);
  const wrongNetwork = isConnected && !chainReady;

  return {
    address,
    isConnected,
    walletChainId,
    expectedChainId,
    chainReady,
    wrongNetwork,
  };
}

/** 链上 proposer 投票权 · `getPastVotes(account, block-1)` 与 Governor 门槛同口径 */
export function useGovernanceProposerPower(
  tokenAddress: `0x${string}` | null | undefined,
  metaChainId?: number | null,
) {
  const { address, isConnected, chainReady } = useGovernanceWalletGate(metaChainId);
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const votesBlock = blockNumber && blockNumber > 0n ? blockNumber - 1n : undefined;

  const votesRead = useReadContract({
    address: tokenAddress ?? undefined,
    abi: governanceVotesTokenAbi,
    functionName: "getPastVotes",
    args: address && votesBlock !== undefined ? [address, votesBlock] : undefined,
    query: { enabled: Boolean(tokenAddress && address && votesBlock !== undefined && chainReady) },
  });

  return {
    proposerVotes: votesRead.data,
    proposerVotesLoading: votesRead.isLoading || votesRead.isFetching,
    proposerVotesError: votesRead.error,
    proposerPowerReady: isConnected && chainReady && votesRead.isSuccess,
  };
}
