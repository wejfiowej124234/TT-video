"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { useAccount, useChainId, useReadContract } from "wagmi";

import { getExpectedChainId } from "@/lib/chainEnv";
import { erc20DecimalsAbi, identityStakingPoolAbi } from "@/lib/stakingAbi";
import {
  stakingReadsEnabled,
  useStakingContractDeployment,
} from "@/lib/staking/stakingContractDeployment";
import { getGuideStakingAddress } from "@/lib/stakingEnv";

/** ① 链上 `stakeOf(wallet)` 只读（须已连接钱包；非 API 真值） */
export function useGuideOnChainStakeAmount(): {
  amount: string | null;
  loading: boolean;
  chainReady: boolean;
} {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const expectedChainId = getExpectedChainId();
  const stakingAddress = getGuideStakingAddress();
  const chainOk = chainId === expectedChainId;
  const baseEnabled = Boolean(stakingAddress && chainOk);
  const { status: deploymentStatus } = useStakingContractDeployment(stakingAddress, chainOk);
  const readsEnabled = stakingReadsEnabled(baseEnabled, deploymentStatus);
  const userEnabled = Boolean(readsEnabled && address && isConnected);

  const tokenRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "token",
    query: { enabled: readsEnabled },
  });

  const decimalsRead = useReadContract({
    address: tokenRead.data,
    abi: erc20DecimalsAbi,
    functionName: "decimals",
    query: { enabled: Boolean(readsEnabled && tokenRead.data) },
  });

  const stakeOfRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "stakeOf",
    args: address ? [address] : undefined,
    query: { enabled: userEnabled },
  });

  const decimals = decimalsRead.data !== undefined ? Number(decimalsRead.data) : undefined;

  const amount = useMemo(() => {
    if (stakeOfRead.data === undefined || decimals === undefined) return null;
    try {
      return formatUnits(stakeOfRead.data, decimals);
    } catch {
      return null;
    }
  }, [stakeOfRead.data, decimals]);

  const loading = userEnabled && (tokenRead.isLoading || decimalsRead.isLoading || stakeOfRead.isLoading);

  return {
    amount,
    loading,
    chainReady: userEnabled && amount != null,
  };
}
