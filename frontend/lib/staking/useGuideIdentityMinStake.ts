"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { useChainId, useReadContract } from "wagmi";

import { getExpectedChainId } from "@/lib/chainEnv";
import { erc20DecimalsAbi, identityStakingPoolAbi } from "@/lib/stakingAbi";
import {
  stakingReadsEnabled,
  useStakingContractDeployment,
} from "@/lib/staking/stakingContractDeployment";
import { getGuideStakingAddress } from "@/lib/stakingEnv";

/** ① 链上 `MIN_STAKE()` 只读（工作台/质押页档位对拍；不可读时回退 81 参考锚） */
export function useGuideIdentityMinStake(): {
  minStakeFormatted: string | null;
  loading: boolean;
  chainReady: boolean;
} {
  const chainId = useChainId();
  const expectedChainId = getExpectedChainId();
  const stakingAddress = getGuideStakingAddress();
  const chainOk = chainId === expectedChainId;
  const baseEnabled = Boolean(stakingAddress && chainOk);
  const { status: deploymentStatus } = useStakingContractDeployment(stakingAddress, chainOk);
  const readsEnabled = stakingReadsEnabled(baseEnabled, deploymentStatus);

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

  const minStakeRead = useReadContract({
    address: stakingAddress ?? undefined,
    abi: identityStakingPoolAbi,
    functionName: "MIN_STAKE",
    query: { enabled: readsEnabled },
  });

  const decimals = decimalsRead.data !== undefined ? Number(decimalsRead.data) : undefined;

  const minStakeFormatted = useMemo(() => {
    if (minStakeRead.data === undefined || decimals === undefined) return null;
    try {
      return formatUnits(minStakeRead.data, decimals);
    } catch {
      return null;
    }
  }, [minStakeRead.data, decimals]);

  const loading =
    deploymentStatus === "loading" ||
    (readsEnabled && (tokenRead.isLoading || decimalsRead.isLoading || minStakeRead.isLoading));

  return {
    minStakeFormatted,
    loading,
    chainReady: readsEnabled && minStakeFormatted != null,
  };
}
